"use client";

export const dynamic = "force-dynamic";

import {
    activeMessages,
    contactMessage,
    contactMessageHistory,
    messageContacts,
    sendMessage,
    storePeerId,
    deleteMessage,
    deleteConvo,
} from "@/hooks/messages";
import React, { useState, useRef, useEffect } from "react";
import {
	Search,
	Phone,
	Video,
	Smile,
	Paperclip,
	Send,
	Check,
	CheckCheck,
	PhoneMissed,
	ListFilter,
	Camera,
	Mic,
	MessageSquareDot,
	Pen,
	Users,
	FileText,
	ImagePlay,
	Plus,
	PhoneOff,
	VideoOff,
	MicOff,
	X,
	ArrowLeft,
	SquarePen,
	PhoneOffIcon,
	Trash,
	Bell,
	ChevronDown,
	Grid,
	Calendar,
	MessageSquare,
	FileText as FileTextIcon,
	Stethoscope,
	Phone as PhoneIcon,
	MoreVertical,
 	User,
} from "lucide-react";
import Image from "next/image";
import { Switch } from "@/components/ui/switch";
import ContactModal from "@/components/ContactModal";
import Peer, { MediaConnection } from "peerjs";
import Cookies from "js-cookie";
import { format } from "date-fns";
import { getProfileById } from "@/hooks/profile";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { socket } from "@/lib/socket";
import { usePeerContext } from "@/context/CallProvider";
import { enqueueSnackbar } from "notistack";
import TopBarUserMenu from "@/components/TopBarUserMenu";

interface Contact {
	_id?: string;
	name?: string;
	avatar?: string;
	lastMessage?: string;
	timestamp?: string;
	isOnline?: boolean;
}

export default function DoctorChats() {
	const pathname = usePathname();
    const navLinkClasses = (href: string) =>
        `flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${pathname === href
            ? "bg-[#9AC63F] text-white cursor-default"
            : "text-[#6B7280] hover:bg-[#F9FAFB]"
        }`;
	// start from here
	const [showMenu, setShowMenu] = useState(false);
	const [showEmojiPicker, setShowEmojiPicker] = useState(false);
	const [showAttachmentOptions, setShowAttachmentOptions] = useState(false);
	const [isRecording, setIsRecording] = useState(false);
	const [conversations, setConversations] = useState<any>([]);
	const [allContacts, setAllContacts] = useState<Contact[]>([]);
	const [messageInput, setMessageInput] = useState("");
	const [searchQuery, setSearchQuery] = useState("");
	const [chatSearchQuery, setChatSearchQuery] = useState("");
	const [showChatSearch, setShowChatSearch] = useState(false);
	const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(
		null
	);
	const [recordedAudioURL, setRecordedAudioURL] = useState<string | null>(null);
	// const [sending, setSending] = useState(false);
	const [listError, setListError] = useState("");
	// const [messages, setMessages] = useState<any>(null);
	const [isMobile, setIsMobile] = useState(false);
	const [showSidebar, setShowSidebar] = useState(true);
	const [activeNow, setActiveNow] = useState(true);
	const [isModalOpen, setIsModalOpen] = useState(false);
	const {
		selectedContact,
		setSelectedContact,
		sending,
		setSending,
		loggedInUser,
		messages,
		setMessages,
		conversationId,
		setConversationId,
		recipientPeerId,
		setRecipientPeerId,
		startAudioCall,
		startVideoCall,
	} = usePeerContext();
	const [messageToDelete, setMessageToDelete] = useState<string | null>(null);
	const [showDeleteModal, setShowDeleteModal] = useState(false);
	// Refs
	const fileInputRef = useRef<HTMLInputElement>(null);
	const cameraInputRef = useRef<HTMLInputElement>(null);
	const messagesEndRef = useRef<HTMLDivElement>(null);
	const [showConvoMenu, setShowConvoMenu] = useState<string | null>(null);
	const [confirmDeleteConvo, setConfirmDeleteConvo] = useState<{
		open: boolean;
		conversationId: string | null;
	}>({
		open: false,
		conversationId: null,
	});

	const resolveUserImageSrc = (url?: string) => {
		const base = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "");
		const baseUploads = `${base}/uploads`;
		const u = String(url ?? "").trim();
		if (!u || u === "undefined" || u === "null") return "/images/avatar.PNG";
		if (u.startsWith("data:")) return u;
		if (/^https?:\/\//i.test(u)) return u;
		if (u.startsWith("/uploads")) return base ? `${base}${u}` : `${baseUploads}${u.replace(/^\/uploads/, "")}`;
		if (u.startsWith("/images/")) return u;
		return "/images/avatar.PNG";
	};
	// End here

	const confirmDeleteConversation = async () => {
		try {
			if (confirmDeleteConvo.conversationId) {
				await deleteConvo(confirmDeleteConvo.conversationId);
				setConfirmDeleteConvo({ open: false, conversationId: null });
			}
		} catch (error) {
			console.log(error);
		}
	};
	// Responsive handling
	useEffect(() => {
		const checkMobile = () => {
			setIsMobile(window.innerWidth < 768);
			if (window.innerWidth >= 768) {
				setShowSidebar(true);
			}
		};

		checkMobile();
		window.addEventListener("resize", checkMobile);
		return () => window.removeEventListener("resize", checkMobile);
	}, []);

	// fetch contacts
	useEffect(() => {
		const fetchConversations = async () => {
			try {
				const response = await activeMessages();
				setConversations(Array.isArray(response) ? response : []);
			} catch (error: any) {
				console.error(error);
			}
		};

		// Call immediately on mount
		fetchConversations();

		// Poll every 5 seconds
		const interval = setInterval(fetchConversations, 5000);

		// Cleanup on unmount
		return () => clearInterval(interval);
	}, []);

	useEffect(() => {
		if (!conversationId) return;
        const fetchUpdatedConversation = async () => {
            try {
                const messageHistory = await contactMessageHistory(conversationId);
                setMessages(messageHistory);
            } catch (error: any) {
                console.error(error);
            }
        };

		// Call immediately on mount
		fetchUpdatedConversation();

		// Poll every 5 seconds
		const interval = setInterval(fetchUpdatedConversation, 5000);

		// Cleanup on unmount
		return () => clearInterval(interval);
	}, [conversationId]);

	const handleSelectContact = async (contact: Contact) => {
		// Set the active/open chat
		setSelectedContact(contact);

		// Add to contacts if it doesn’t exist already
		setConversations((prev: any) => {
			const exists = prev.some((c: any) => c?._id && c?._id === contact?._id);

			if (exists) {
				return prev; // don’t replace, just keep as is
			}

			return [...prev, contact]; // append new
		});

		try {
			const response = await contactMessage(contact?._id);
			setConversationId(response?._id);
            const messageHistory = await contactMessageHistory(response?._id);
            setMessages(messageHistory);
		} catch (error) {
			console.log(error);
		}
	};
	useEffect(() => {
		if (!socket) return;

		// 🔗 Handle connection
		socket.on("connect", () => {
			if (loggedInUser?.id) {
				socket.emit("join", loggedInUser?.id);
			}
		});

		socket.on("disconnect", () => {
			console.log("❌ Socket disconnected");
		});

		// 👥 Presence listeners
		socket.on("user:online", ({ userId }) => {
			setConversations((prev: any) => {
				if (!Array.isArray(prev)) return prev;
				return prev.map((conv: any) => {
					const participants = Array.isArray(conv?.participants)
						? conv.participants.map((p: any) =>
								String(p?._id) === String(userId) ? { ...p, isOnline: true } : p
						  )
						: conv?.participants || [];
					return { ...conv, participants };
				});
			});
		});

		socket.on("user:offline", ({ userId, lastSeen }) => {

			setConversations((prev: any) => {
				if (!Array.isArray(prev)) return prev;
				return prev.map((conv: any) => {
					const participants = Array.isArray(conv?.participants)
						? conv.participants.map((p: any) =>
								String(p?._id) === String(userId)
									? { ...p, isOnline: false, lastSeen }
									: p
						  )
						: conv?.participants || [];
					return { ...conv, participants };
				});
			});
		});

		// 🧹 Cleanup
		return () => {
			socket.off("connect");
			socket.off("disconnect");
			socket.off("user:online");
			socket.off("user:offline");
		};
	}, [loggedInUser, socket]);

	const transformedContacts = conversations?.map((contact: any) => {
		const otherParticipant = contact?.participants?.find((p: any) => {
			return p._id !== loggedInUser?.id;
		});

		return {
			conversationId: contact?._id,
			lastMessage: contact?.lastMessage,
			timestamp: contact?.updatedAt,
			unread: contact?.unread || 0,
			...otherParticipant,
		};
	});

	const filteredContacts = transformedContacts?.filter(
		(contact: any) =>
			contact?.firstname?.toLowerCase().includes(searchQuery.toLowerCase()) ||
			contact?.lastname?.toLowerCase().includes(searchQuery.toLowerCase())
	);
	const filteredMessages = messages?.filter(
		(message: any) =>
			chatSearchQuery === "" ||
			message?.text.toLowerCase().includes(chatSearchQuery.toLowerCase())
	);

	// Message handling
	const handleSend = async () => {
		if (!selectedContact) return;
		const text = messageInput.trim();
		if (!text || sending) return;

		setSending(true);

		try {
			let convoId = conversationId;
			if (!convoId || !String(convoId).trim()) {
				const response = await contactMessage(selectedContact?._id);
				convoId = response?._id;
				if (!convoId) {
					setSending(false);
					return;
				}
				setConversationId(convoId);
                const messageHistory = await contactMessageHistory(convoId);
                setMessages(messageHistory);
			}

			const newMessage = {
				id: Array.isArray(messages) ? messages.length + 1 : 1,
				text,
				timestamp: new Date().toLocaleTimeString([], {
					hour: "2-digit",
					minute: "2-digit",
				}),
				sent: true,
				delivered: true,
				read: false,
				type: "text",
			};

			setMessages((prev: any) =>
				Array.isArray(prev) ? [...prev, newMessage] : [newMessage]
			);
			await sendMessage(convoId, text, "text", "");
			setMessageInput("");
		} catch (error: any) {
			console.log(error);
		}
		setSending(false);
	};

	const getFileType = (file: File): "video" | "image" | "document" => {
		if (file.type.startsWith("video/")) return "video";
		if (file.type.startsWith("image/")) return "image";
		return "document";
	};

	// File handling
	const handleFileSelect = async (
		event: React.ChangeEvent<HTMLInputElement>
	) => {
		const file = event.target.files?.[0];
		if (!file) return;

		try {
			const formData = new FormData();
			const fileType = getFileType(file);
			formData.append("file", file);
			formData.append("conversationId", conversationId); // pass your convo id here
			formData.append("type", fileType); // save in document folder

			const res = await fetch("/api/upload/conversations", {
				method: "POST",
				body: formData,
			});

			const data = await res.json();
			if (data.success) {
				const fileMessage = {
					id: Array.isArray(messages) ? messages.length + 1 : 1,
					text:
						fileType === "image"
							? "📷 Photo"
							: fileType === "video"
							? "🎥 Video"
							: `📎 ${file.name}`,
					timestamp: new Date().toLocaleTimeString([], {
						hour: "2-digit",
						minute: "2-digit",
					}),
					sent: true,
					delivered: true,
					read: false,
					type: fileType,
					fileUrl: data.fileUrl, // saved public link
					fileName: file.name,
					fileSize: file.size,
				};
				setMessages((prev: any) =>
					Array.isArray(prev) ? [...prev, fileMessage] : [fileMessage]
				);
				const response = await sendMessage(
					conversationId,
					file.name,
					fileMessage?.type,
					data.fileUrl
				);
			}
		} catch (error) {
			console.error("Upload failed:", error);
		}

		setShowAttachmentOptions(false);
	};

	const handleCameraCapture = async (
		event: React.ChangeEvent<HTMLInputElement>
	) => {
		const file = event.target.files?.[0];
		if (!file) return;

		try {
			const formData = new FormData();
			const fileType = getFileType(file);
			formData.append("file", file);
			formData.append("conversationId", conversationId); // pass convo id
			formData.append("type", fileType); // save in images folder

			const res = await fetch("/api/upload/conversations", {
				method: "POST",
				body: formData,
			});

			const data = await res.json();
			if (data.success) {
				const imageMessage = {
					id: Array.isArray(messages) ? messages.length + 1 : 1,
					text:
						fileType === "image"
							? "📷 Photo"
							: fileType === "video"
							? "🎥 Video"
							: `📎 ${file.name}`,
					timestamp: new Date().toLocaleTimeString([], {
						hour: "2-digit",
						minute: "2-digit",
					}),
					sent: true,
					delivered: true,
					read: false,
					type: fileType,
					imageUrl: data.fileUrl, // stored public link
				};
				setMessages((prev: any) =>
					Array.isArray(prev) ? [...prev, imageMessage] : [imageMessage]
				);
				const response = await sendMessage(
					conversationId,
					imageMessage?.text,
					imageMessage?.type,
					data.fileUrl
				);
			}
		} catch (err) {
			console.error("Upload failed:", err);
		}
	};

	// Voice recording
	const handleVoiceRecord = async () => {
		if (!isRecording) {
			try {
				const stream = await navigator.mediaDevices.getUserMedia({
					audio: true,
				});
				const recorder = new MediaRecorder(stream);
				const chunks: Blob[] = [];

				recorder.ondataavailable = (e) => {
					if (e.data.size > 0) chunks.push(e.data);
				};

				recorder.onstop = () => {
					const audioBlob = new Blob(chunks, { type: "audio/webm" });
					const url = URL.createObjectURL(audioBlob);
					setRecordedAudioURL(url);
				};

				recorder.start();
				setMediaRecorder(recorder);
				setIsRecording(true);
			} catch (err) {
				console.error("Mic access error:", err);
				enqueueSnackbar("Could not access microphone", { variant: "error" });
			}
		} else {
			mediaRecorder?.stop();
			setIsRecording(false);
		}
	};

	useEffect(() => {
		const getUsersList = async () => {
			try {
				const response = await messageContacts();
				setAllContacts(response);
			} catch (error) {
				console.log("error getting users", error);
				setListError("Couldn't fetch users. Please Try again");
			}
		};

		getUsersList();
	}, [isModalOpen]);

	const sendVoiceNote = async () => {
		if (!recordedAudioURL) return;

		try {
			// Convert blob URL back into a Blob
			const response = await fetch(recordedAudioURL);
			const blob = await response.blob();

			// Create a File object for consistency
			const file = new File([blob], `voice-${Date.now()}.webm`, {
				type: "audio/webm",
			});

			// Prepare upload
			const formData = new FormData();
			formData.append("file", file);
			formData.append("conversationId", conversationId);
			formData.append("type", "voice"); // save in a "voice" folder

			const res = await fetch("/api/upload/conversations", {
				method: "POST",
				body: formData,
			});

			const data = await res.json();

			if (data.success) {
				const voiceMessage = {
					id: Array.isArray(messages) ? messages.length + 1 : 1,
					text: "🎤 Voice message",
					timestamp: new Date().toLocaleTimeString([], {
						hour: "2-digit",
						minute: "2-digit",
					}),
					sent: true,
					delivered: true,
					read: false,
					type: "voice",
					audioUrl: data.fileUrl, // stored public link
					fileName: file.name,
					fileSize: file.size,
				};

				setMessages((prev: any) =>
					Array.isArray(prev) ? [...prev, voiceMessage] : [voiceMessage]
				);
				// optional: save to DB/chat service
				await sendMessage(
					conversationId,
					voiceMessage.text,
					voiceMessage.type,
					data.fileUrl
				);
			}
		} catch (err) {
			console.error("Voice note upload failed:", err);
		}

		setRecordedAudioURL(null);
	};

	const isVideo = (url?: string) => {
		if (!url) return false;
		const videoExtensions = [".mp4", ".mov", ".avi", ".mkv", ".webm"];
		return videoExtensions.some((ext) => url.toLowerCase().endsWith(ext));
	};

	const handleDeleteMessage = async (id: string) => {
		try {
			await deleteMessage(id);
			setMessages((prev: any) =>
				Array.isArray(prev) ? prev.filter((m: any) => m._id !== id) : prev
			);
		} catch (error) {
			console.error("Error deleting message:", error);
		}
	};

	const openDeleteModal = (id: string) => {
		setMessageToDelete(id);
		setShowDeleteModal(true);
		setShowMenu(false);
	};

	const confirmDelete = () => {
		if (messageToDelete) handleDeleteMessage(messageToDelete);
		setShowDeleteModal(false);
	};

	const filteredConversations = Array.isArray(conversations)
		? conversations.filter((contact: Contact) =>
				(contact?.name || "").toLowerCase().includes(searchQuery.toLowerCase())
		  )
		: [];
	const displayContacts =
		filteredConversations.length > 0
			? filteredConversations
			: Array.isArray(conversations)
			? conversations
			: [];

	if (typeof window === "undefined") {
		return null;
	}

	return (
		<div className="flex h-screen bg-[#F5F5F5] overflow-hidden">
			{/* Left Sidebar */}
			<aside className="w-64 bg-white border-r border-[#E5E7EB] flex flex-col">
				{/* Logo Section */}
				<div className="p-6 border-b border-[#E5E7EB]">
					<div className="flex items-center gap-3 mb-2">
						<Image
							src="/images/logo.svg"
							alt="Excel Connect logo"
							width={100}
							height={100}
							priority
							className="w-auto h-auto"
						/>
					</div>
				</div>

                {/* Navigation */}
                <nav className="flex-1 p-4 space-y-2">
                    <Link
                        href="/my-profile"
                        onClick={(e) => { e.preventDefault(); if (pathname !== "/my-profile") window.location.href = "/my-profile"; }}
                        className={navLinkClasses("/my-profile")}
                    >
                        <User className="h-5 w-8" />
                        <span className="font-medium">My Profile</span>
                    </Link>
                    <Link
                        href="/doctor/dashboard"
                        onClick={(e) => { e.preventDefault(); if (pathname !== "/doctor/dashboard") window.location.href = "/doctor/dashboard"; }}
                        className={navLinkClasses("/doctor/dashboard")}
                    >
                        <Grid className="h-5 w-8" />
                        <span className="font-medium">Overview</span>
                    </Link>
					<Link
						href="/doctor/patients"
						onClick={(e) => { e.preventDefault(); if (pathname !== "/doctor/patients") window.location.href = "/doctor/patients"; }}
						className={navLinkClasses("/doctor/patients")}
					>
						<Users className="h-5 w-8" />
						<span className="font-medium">Clients</span>
					</Link>
					<Link
						href="/doctor/schedule"
						onClick={(e) => { e.preventDefault(); if (pathname !== "/doctor/schedule") window.location.href = "/doctor/schedule"; }}
						className={navLinkClasses("/doctor/schedule")}
					>
						<Calendar className="h-5 w-8" />
						<span className="font-medium">Schedule</span>
					</Link>
                    <Link
                        href="/doctor/messages"
                        onClick={(e) => { e.preventDefault(); if (pathname !== "/doctor/messages") window.location.href = "/doctor/messages"; }}
                        className={navLinkClasses("/doctor/messages")}
                    >
                        <MessageSquare className="h-5 w-8" />
                        <span className="font-medium">Chats</span>
                    </Link>
                </nav>
			</aside>

			{/* Main Content Area */}
			<div className="flex-1 flex flex-col overflow-hidden p-6 gap-6">
				{/* Global Header Bar - Spans across middle and right panels */}
				<header className="bg-white border-b border-[#E5E7EB] px-6 py-4">
					<div className="flex items-center justify-between">
						{/* Search Bar */}
						<div className="relative flex-1 max-w-md">
							<Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-8 text-[#9CA3AF]" />
							<input
								type="text"
								placeholder="Search"
								className="w-full pl-12 pr-4 py-2.5 rounded-xl bg-[#F9FAFB] border border-[#E5E7EB] text-sm focus:outline-none focus:ring-2 focus:ring-[#9AC63F]/20"
							/>
						</div>

                        {/* Right Side */}
                        <div className="flex items-center gap-6">
                            <TopBarUserMenu user={loggedInUser} />
                        </div>
					</div>
				</header>

				{/* Middle and Right Panels Container */}
				<div className="flex-1 flex overflow-hidden gap-6">
					{/* Middle Panel - Chat List */}
					<div className="w-[360px] bg-white rounded-2xl border border-[#E5E7EB] flex flex-col shadow-sm">
						{/* Search Bar in Chat List */}
						<div className="p-4 border-b border-[#E5E7EB]">
							<div className="relative">
								<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-8 text-[#9CA3AF]" />
								<input
									type="text"
									placeholder="Search"
									value={searchQuery}
									onChange={(e) => setSearchQuery(e.target.value)}
									className="w-full pl-10 pr-4 py-3 rounded-2xl bg-[#F3F4F6] border border-[#E5E7EB] text-sm focus:outline-none focus:ring-2 focus:ring-[#9AC63F]/20"
								/>
							</div>
						</div>

						{/* Chat Contacts List */}
						<div className="flex-1 overflow-y-auto">
							{Array.isArray(displayContacts) &&
								displayContacts.map((contact: any, index: number) => (
									<div
										key={contact._id || index}
										onClick={() => handleSelectContact(contact)}
										className={`flex items-center gap-3 p-4 cursor-pointer transition-colors rounded-xl ${
											selectedContact?._id === contact._id
												? "bg-[#F3F4F6]"
												: "hover:bg-[#F9FAFB]"
										}`}
									>
                                        <div className="relative h-12 w-12 rounded-full overflow-hidden shrink-0">
											<Image
												src={contact.avatarUrl|| "/images/avatar.PNG"}
												alt={contact.name || "Contact"}
												fill
												className="object-cover"
											/>
											{contact.isOnline && (
												<div className="absolute bottom-0 right-0 h-3 w-3 bg-[#9AC63F] border-2 border-white rounded-full" />
											)}
										</div>
										<div className="flex-1 min-w-0">
											<div className="flex items-center justify-between mb-1">
												<p className="text-sm font-semibold text-[#111827] truncate">
													{contact.name}
												</p>
                                                <span className="text-xs text-[#6B7280] ml-2 shrink-0">
													{contact.timestamp || "12:24 AM"}
												</span>
											</div>
											<p className="text-xs text-[#6B7280] truncate">
												{contact.lastMessage || "No messages yet"}
											</p>
										</div>
										<button
											onClick={(e) => {
												e.stopPropagation();
											}}
                                        className="p-1 hover:bg-[#E5E7EB] rounded-lg transition-colors shrink-0"
										>
											<MoreVertical className="h-4 w-4 text-[#6B7280]" />
										</button>
									</div>
								))}
						</div>
					</div>

					{/* Right Panel - Chat Window */}
					<div className="flex-1 flex flex-col bg-white rounded-2xl border border-[#E5E7EB] shadow-sm">
						{selectedContact ? (
							<>
								{/* Chat Header */}
								<div className="p-4 border-b border-[#E5E7EB] flex items-center justify-between bg-white">
									<div className="flex items-center gap-3">
                                        <div className="relative h-10 w-10 rounded-full overflow-hidden shrink-0">
								<Image
									src={resolveUserImageSrc((selectedContact as any)?.avatarUrl || (selectedContact as any)?.avatar)}
									alt={selectedContact.name || "Contact"}
									fill
									unoptimized
									className="object-cover"
								/>
										</div>
										<div>
											<p className="text-sm font-semibold text-[#111827]">
												{selectedContact.name}
											</p>
											<p className="text-xs text-[#6B7280]">
												Last seen 2 hours ago
											</p>
										</div>
									</div>
									<div className="flex items-center gap-2">
										<button
											className="p-2 hover:bg-[#F9FAFB] rounded-lg transition-colors"
											disabled={!recipientPeerId}
											onClick={() =>
												recipientPeerId && startVideoCall(recipientPeerId)
											}
										>
											{recipientPeerId ? (
												<Video className="h-5 w-8 text-[#6B7280]" />
											) : (
												<VideoOff className="h-5 w-8 text-[#6B7280]" />
											)}
										</button>
										<button
											className="p-2 hover:bg-[#F9FAFB] rounded-lg transition-colors"
											disabled={!recipientPeerId}
											onClick={() =>
												recipientPeerId && startAudioCall(recipientPeerId)
											}
										>
											{recipientPeerId ? (
												<Phone className="h-5 w-8 text-[#6B7280]" />
											) : (
												<PhoneOffIcon className="h-5 w-8 text-[#6B7280]" />
											)}
										</button>
										<button
											className="p-2 hover:bg-[#F9FAFB] rounded-lg transition-colors"
											onClick={() => setShowChatSearch(!showChatSearch)}
										>
											<Search className="h-5 w-8 text-[#6B7280]" />
										</button>
									</div>
								</div>
								{showChatSearch && (
									<div className="mt-3 relative px-4">
										<Search className="absolute left-7 top-1/2 -translate-y-1/2 text-[#9CA3AF] w-4 h-4" />
										<input
											type="text"
											placeholder="Search messages"
											value={chatSearchQuery}
											onChange={(e) => setChatSearchQuery(e.target.value)}
											className="w-full pl-10 pr-10 py-3 bg-[#F3F4F6] rounded-2xl border-none focus:outline-none focus:ring-2 focus:ring-[#9AC63F]/20"
										/>
										<button
											onClick={() => {
												setShowChatSearch(false);
												setChatSearchQuery("");
											}}
											className="absolute right-7 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#6B7280]"
										>
											<X className="w-4 h-4" />
										</button>
									</div>
								)}

								{/* Chat Messages */}
								<div className="flex-1 overflow-y-auto p-6">
									{Array.isArray(messages) &&
										messages
											.filter(
												(m: any) =>
													chatSearchQuery === "" ||
													(m.text || m.message || "")
														.toLowerCase()
														.includes(chatSearchQuery.toLowerCase())
											)
											.map((msg: any, index: number) => {
												const isFromContact =
													msg.senderId === selectedContact._id ||
													msg.sender?._id === selectedContact._id;
												const messageDate =
													msg.createdAt || msg.timestamp
														? format(
																new Date(msg.createdAt || msg.timestamp),
																"dd-MMM-yyyy"
														  )
														: "09-Nov-2025";
												const messageText = msg.text || msg.message || "";

												return (
													<div
														key={msg._id || index}
														className="flex items-start gap-3 mb-6"
													>
                                                        <div className="relative h-10 w-10 rounded-full overflow-hidden shrink-0">
									<Image
										src={resolveUserImageSrc((selectedContact as any)?.avatarUrl || (selectedContact as any)?.avatar)}
										alt={selectedContact.name || "Contact"}
										fill
										unoptimized
										className="object-cover"
									/>
														</div>
														<div className="flex-1 flex items-start justify-between gap-4">
															<div className="bg-[#F9FAFB] rounded-2xl px-4 py-3 max-w-[75%]">
																<p className="text-sm text-[#111827] leading-relaxed">
																	{messageText}
																</p>
															</div>
															<span className="text-xs text-[#6B7280] whitespace-nowrap self-start pt-1">
																{messageDate}
															</span>
														</div>
													</div>
												);
											})}
								</div>

								{/* Message Input Area */}
								<div className="p-4 border-t border-[#E5E7EB] bg-white">
									<form
										onSubmit={(e) => {
											e.preventDefault();
											handleSend();
										}}
										className="flex items-center gap-4"
									>
										<div className="relative">
											<button
												type="button"
                                                className="h-10 w-10 rounded-full bg-white border border-[#E5E7EB] hover:bg-[#F3F4F6] text-[#6B7280] transition-colors shrink-0"
												onClick={() =>
													setShowAttachmentOptions(!showAttachmentOptions)
												}
											>
												<Paperclip className="h-5 w-8 mx-auto" />
											</button>
											{showAttachmentOptions && (
												<div className="absolute bottom-12 left-0 w-48 bg-white rounded-lg shadow-lg border z-20">
													<button
														onClick={() => cameraInputRef.current?.click()}
														className="flex items-center gap-2 w-full px-4 py-2 text-left hover:bg-gray-100 rounded-t-lg"
													>
														<Camera className="w-5 h-5" />
														<span>Photo and Video</span>
													</button>
													<button
														onClick={() => fileInputRef.current?.click()}
														className="flex items-center gap-2 w-full px-4 py-2 text-left hover:bg-gray-100 rounded-b-lg"
													>
														<FileText className="w-5 h-5" />
														<span>Documents</span>
													</button>
												</div>
											)}
										</div>
										<input
											type="text"
											placeholder="Typing........"
											value={messageInput}
											onChange={(e) => setMessageInput(e.target.value)}
											className="flex-1 px-4 py-3 bg-white rounded-2xl border border-[#E5E7EB] text-sm focus:outline-none focus:ring-2 focus:ring-[#9AC63F]/20"
										/>
										{!recordedAudioURL && (
											<button
												type="button"
												aria-label="Voice record"
												onClick={handleVoiceRecord}
												className={`h-10 w-10 rounded-full transition-colors ${
													isRecording
														? "bg-red-100 text-red-500 animate-pulse"
														: "text-[#6B7280] bg-[#F3F4F6] hover:bg-[#E5E7EB]"
												}`}
											>
												<Mic className="w-5 h-5 mx-auto" />
											</button>
										)}
										{recordedAudioURL && (
											<div className="flex items-center gap-2">
												<audio
													controls
													src={recordedAudioURL}
													className="h-8"
												/>
												<button
													type="button"
													onClick={sendVoiceNote}
													className="px-3 py-1 bg-[#9AC63F] text-white text-sm rounded hover:bg-[#85af34] transition-colors"
												>
													Send
												</button>
												<button
													type="button"
													onClick={() => {
														setRecordedAudioURL(null);
														if (mediaRecorder) {
															mediaRecorder.stream
																.getTracks()
																.forEach((track) => track.stop());
														}
													}}
													className="px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600 transition-colors"
												>
													Delete
												</button>
											</div>
										)}
										<button
											type="submit"
											disabled={sending || !messageInput.trim()}
                                            className="h-10 w-10 rounded-full bg-[#9AC63F] text-white flex items-center justify-center hover:bg-[#85af34] transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
										>
											<Send className="h-5 w-8" />
										</button>
									</form>
								</div>
								{/* Hidden file inputs */}
								<input
									ref={fileInputRef}
									type="file"
									accept="*/*"
									multiple
									onChange={handleFileSelect}
									className="hidden"
								/>
								<input
									ref={cameraInputRef}
									type="file"
									accept="image/*,video/*"
									capture="environment"
									onChange={handleCameraCapture}
									className="hidden"
								/>
							</>
						) : (
							<div className="flex-1 flex items-center justify-center">
								<p className="text-sm text-[#6B7280]">
									Select a contact to start chatting
								</p>
							</div>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}
