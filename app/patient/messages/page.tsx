"use client";

import {
	activeMessages,
	contactMessage,
	contactMessageHistory,
	messageContacts,
	sendMessage,
	storePeerId,
	deleteMessage,
	deleteConvo,
	fetchPeerId,
} from "@/hooks/messages";
import { updateOnlineStatus } from "@/hooks/auth";
import React, { useState, useRef, useEffect } from "react";
import { logout } from "@/lib/utils";
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
	Stethoscope,
} from "lucide-react";
import Image from "next/image";
import { Switch } from "@/components/ui/switch";
import ContactModal from "@/components/ContactModal";
import Peer, { MediaConnection } from "peerjs";
import Cookies from "js-cookie";
import { format } from "date-fns";
import { getProfileById } from "@/hooks/profile";
import Link from "next/link";
import { socket } from "@/lib/socket";
import { usePeerContext } from "@/context/CallProvider";
import { enqueueSnackbar } from "notistack";
import PresenceToggle from "@/components/PresenceToggle";
import { MoreVertical, User, Settings, LogOut } from "lucide-react";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { usePathname } from "next/navigation";
interface Contact {
	email: string;
	firstname: string;
	lastname: string;
	id?: number;
	name?: string;
	role?: string;
	_id?: string;
	lastMessage?: string;
	timestamp?: string;
	unread?: number;
	avatar?: string;
	isOnline?: boolean;
	isGroup?: boolean;
	status: string;
}

type CallState =
	| "idle"
	| "audio-calling" // caller dialing
	| "video-calling" // caller dialing
	| "ringing" // recipient sees incoming call
	| "audio-connected" // call established
	| "video-connected" // call established
	| "ended" // after hangup
	| "unavailable" // peer not reachable
	| "disconnected" // timed out after 2min
	| "no-answer"
	| "connecting"; // timed out after 2min

const resolveAvatarSrc = (input?: string | null) => {
	const base = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "");
	const u = String(input ?? "").trim();
	if (!u) return "/images/avatar.PNG";
	if (/^https?:\/\//i.test(u)) return u;
	if (u.startsWith("/uploads")) return base ? `${base}${u}` : u;
	const cleaned = u.replace(/^\/?uploads\/?/, "");
	return base ? `${base}/uploads/${cleaned}` : `/uploads/${cleaned}`;
};

// Simple emoji data
const emojis = [
	"😀",
	"😃",
	"😄",
	"😁",
	"😆",
	"😅",
	"😂",
	"🤣",
	"😊",
	"😇",
	"🙂",
	"🙃",
	"😉",
	"😌",
	"😍",
	"🥰",
	"😘",
	"😗",
	"😙",
	"😚",
	"😋",
	"😛",
	"😝",
	"😜",
	"🤪",
	"🤨",
	"🧐",
	"🤓",
	"😎",
	"🤩",
	"🥳",
	"😏",
	"😒",
	"😞",
	"😔",
	"😟",
	"😕",
	"🙁",
	"☹️",
	"😣",
	"😖",
	"😫",
	"😩",
	"🥺",
	"😢",
	"😭",
	"😤",
	"😠",
	"😡",
	"🤬",
	"🤯",
	"😳",
	"🥵",
	"🥶",
	"😱",
	"😨",
	"😰",
	"😥",
	"😓",
	"🤗",
	"🤔",
	"🤭",
	"🤫",
	"🤥",
	"😶",
	"😐",
	"😑",
	"😬",
	"🙄",
	"😯",
	"😦",
	"😧",
	"😮",
	"😲",
	"🥱",
	"😴",
	"🤤",
	"😪",
	"😵",
	"🤐",
	"🥴",
	"🤢",
	"🤮",
	"🤧",
	"😷",
	"🤒",
	"🤕",
	"🤑",
	"🤠",
];

export default function ChatDashboard() {
	// State management
	const [showMenu, setShowMenu] = useState(false);
	const [showEmojiPicker, setShowEmojiPicker] = useState(false);
	const [showAttachmentOptions, setShowAttachmentOptions] = useState(false);
	const [isRecording, setIsRecording] = useState(false);
	const [conversations, setConversations] = useState<any>(null);
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
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [activeNow, setActiveNow] = useState(true);
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

	const [initialCid, setInitialCid] = useState<string | null>(null);
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

	useEffect(() => {
		const run = async () => {
			try {
				const rid = selectedContact?._id as any;
				if (rid) {
					const res = await fetchPeerId(rid);
					if (res?.peerId) setRecipientPeerId(res.peerId);
				}
			} catch { }
		};
		run();
	}, [selectedContact?._id]);

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

	useEffect(() => {
		try {
			if (typeof window === "undefined") return;
			const params = new URLSearchParams(window.location.search || "");
			const cid = params.get("conversationId");
			if (cid && (!conversationId || String(conversationId) !== String(cid))) {
				setConversationId(cid);
				setInitialCid(cid);
			}
		} catch { }
	}, []);

	// fetch contacts
	useEffect(() => {
		const fetchConversations = async () => {
			try {
				const response = await activeMessages();
				setConversations(response);
			} catch (error: any) {
				console.error(error);
			}
		};

		let interval: any = null;
		const start = () => {
			if (interval) { clearInterval(interval); interval = null; }
			fetchConversations();
			interval = setInterval(fetchConversations, 30000);
		};
		const stop = () => { if (interval) { clearInterval(interval); interval = null; } };
		const onVis = () => {
			if (typeof document !== "undefined") {
				document.visibilityState === "visible" ? start() : stop();
			}
		};
		onVis();
		if (typeof document !== "undefined") {
			document.addEventListener("visibilitychange", onVis);
		}
		return () => {
			stop();
			if (typeof document !== "undefined") {
				document.removeEventListener("visibilitychange", onVis);
			}
		};
	}, []);

	useEffect(() => {
		const linkToConversation = async () => {
			if (!initialCid) return;
			if (!Array.isArray(conversations)) return;
			const conv = conversations.find((c: any) => String(c?._id) === String(initialCid));
			if (!conv) return;
			const other = Array.isArray(conv?.participants)
				? conv.participants.find((p: any) => String(p?._id) !== String(loggedInUser?.id))
				: null;
			const contact = {
				conversationId: conv?._id,
				lastMessage: conv?.lastMessage,
				timestamp: conv?.updatedAt,
				unread: conv?.unread || 0,
				...(other || {}),
			};
			setSelectedContact(contact);
			try {
				const messageHistory = await contactMessageHistory(String(conv?._id));
				setMessages(messageHistory);
			} catch { }
		};
		linkToConversation();
	}, [initialCid]);

	useEffect(() => {
		if (!conversationId) return;
		const fetchUpdatedConversation = async () => {
			try {
				const messageHistory = await contactMessageHistory(conversationId);
				setMessages(messageHistory);
				let rid = selectedContact?._id as any;
				if (!rid && Array.isArray(conversations)) {
					const conv = conversations.find(
						(c: any) => String(c?._id) === String(conversationId)
					);
					const other = Array.isArray(conv?.participants)
						? conv.participants.find(
							(p: any) => String(p?._id) !== String(loggedInUser?.id)
						)
						: null;
					rid = other?._id;
					if (other && !selectedContact) {
						setSelectedContact({
							conversationId: conv?._id,
							...other,
						});
					}
				}
			} catch (error: any) {
				console.error(error);
			}
		};

		fetchUpdatedConversation();
		return () => { };
	}, [conversationId]);

	const handleSelectContact = async (contact: Contact) => {
		// Set the active/open chat
		setSelectedContact(contact);

		// Add to contacts if it doesn’t exist already
		setConversations((prev: any) => {
			const exists = prev.some(
				(c: any) =>
					(c?.id && c?.id === contact.id) || (c?._id && c?._id === contact._id)
			);

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

	// Auto-scroll to bottom when messages change or conversation switches
	useEffect(() => {
		try {
			messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
		} catch { }
	}, [messages?.length, conversationId, selectedContact]);

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
		if (!file || sending) return;

		setSending(true);
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
		} finally {
			setSending(false);
		}

		setShowAttachmentOptions(false);
	};

	const handleCameraCapture = async (
		event: React.ChangeEvent<HTMLInputElement>
	) => {
		const file = event.target.files?.[0];
		if (!file || sending) return;

		setSending(true);
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
		} finally {
			setSending(false);
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
	const pathname = usePathname();
	const navLinkClasses = (href: string) =>
		`flex w-full items-center gap-3 px-4 py-3 rounded-xl ${pathname === href
			? "bg-[#9AC63F] text-white cursor-default"
			: "text-[#6B7280] hover:bg-[#F9FAFB] transition-colors"
		}`;
	return (
		<div className="flex h-screen bg-[#F5F5F5] overflow-hidden">
			<aside className="w-64 bg-white border-r border-[#E5E7EB] flex flex-col">
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

				<nav className="flex-1 p-6 space-y-2">
					<Link
						href="/my-profile"
						onClick={(e) => { e.preventDefault(); if (pathname !== "/my-profile") window.location.href = "/my-profile"; }}
						className={navLinkClasses("/my-profile")}
					>
						<User className="h-5 w-8" />
						<span className="font-medium">My Profile</span>
					</Link>
					<Link
						href="/patient/schedule"
						onClick={(e) => { e.preventDefault(); if (pathname !== "/patient/schedule") window.location.href = "/patient/schedule"; }}
						className={navLinkClasses("/patient/schedule")}
					>
						<Calendar className="h-5 w-8" />
						<span className="font-medium">Schedule</span>
					</Link>

					<Link
						href="/patient/messages"
						onClick={(e) => { e.preventDefault(); if (pathname !== "/patient/messages") window.location.href = "/patient/messages"; }}
						className={navLinkClasses("/patient/messages")}
					>
						<MessageSquare className="h-5 w-8" />
						<span className="font-medium">Chats</span>
					</Link>
					<Link
						href="/patient/see-therapist"
						onClick={(e) => { e.preventDefault(); if (pathname !== "/patient/see-therapist") window.location.href = "/patient/see-therapist"; }}
						className={navLinkClasses("/patient/see-therapist")}
					>
						<Stethoscope className="h-5 w-8" />
						<span className="font-medium">Connect client to a therapist</span>
					</Link>
				</nav>
			</aside>
			<div className="flex-1 flex flex-col overflow-hidden p-6 gap-6">
				<header className="bg-white border-b border-[#E5E7EB] px-6 py-4">
					<div className="flex items-center justify-between">

						{/* Right Side */}
						<div className="flex items-center gap-6">
                            <PresenceToggle />

							{/* User Profile */}
							<DropdownMenu>
								<DropdownMenuTrigger asChild>
									<button className="flex items-center gap-3 px-4 py-2 bg-[#111827] rounded-xl cursor-pointer hover:bg-[#1F2937] transition-colors">
										<div className="relative h-8 w-8 rounded-full overflow-hidden">
											<img
												src={(function () {
													const base = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "");
													const baseUploads = `${base}/uploads`;
													const u = String((loggedInUser?.avatarUrl || loggedInUser?.avatar) ?? "").trim();
													if (!u) return "/images/avatar.PNG";
													if (u.startsWith("data:")) return u;
													if (/^https?:\/\//i.test(u)) return u;
													if (u.startsWith("/uploads")) return base ? `${base}${u}` : `${baseUploads}${u.replace(/^\/uploads/, "")}`;
													if (u.startsWith("/images/")) return u;
													const cleaned = u.replace(/^\/?uploads\/?/, "");
													return `${baseUploads}/${cleaned}`;
												})()}
												alt="Profile"
												className="w-full h-full object-cover"
												onError={(e) => {
													(e.currentTarget as HTMLImageElement).src = "/images/avatar.PNG";
												}}
											/>
										</div>
										<span className="text-sm font-medium text-white">
											{loggedInUser?.email}
										</span>
										<ChevronDown className="h-4 w-4 text-white" />
									</button>
								</DropdownMenuTrigger>
								<DropdownMenuContent className="w-56 bg-white">
									<DropdownMenuSeparator />

									<DropdownMenuSeparator />
									<DropdownMenuItem onClick={logout}>
										<LogOut className="mr-2 h-4 w-4" />
										<span>Log out</span>
									</DropdownMenuItem>
								</DropdownMenuContent>
							</DropdownMenu>
						</div>
					</div>
				</header>
				<div className="flex-1 flex overflow-hidden gap-6">
					{/* Middle Panel - Conversation List */}
					<div
						className={`${isMobile
							? showSidebar
								? "w-full"
								: "w-0 overflow-hidden"
							: "w-[360px]"
							} bg-white rounded-2xl border border-[#E5E7EB] p-6 shadow-sm flex flex-col transition-all duration-300`}
					>
						{/* Profile Section */}
						<div className="p-4 bg-gray-100 border-b border-gray-200">
							<div className="flex items-center justify-between">
								<h2 className="text-lg font-semibold text-gray-900">
									Conversations
								</h2>
								<button
									onClick={() => setIsModalOpen(true)}
									className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded-full transition"
								>
									<Plus className="w-5 h-5" />
								</button>
							</div>
							<ContactModal
								open={isModalOpen}
								onClose={() => setIsModalOpen(false)}
								contacts={allContacts}
								onSelectContact={(contact: Contact) => {
									handleSelectContact(contact); // ✅ single object, not array
									if (isMobile) setShowSidebar(false);
									setIsModalOpen(false);
								}}
							/>
						</div>

						{/* Search */}
						<div className="flex mt-5 items-center justify-between w-full space-x-3 mb-4">
							<div className="relative w-full">
								<Search className="absolute  left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] w-4 h-4" />
								<input
									type="text"
									placeholder="Search"
									value={searchQuery}
									onChange={(e) => setSearchQuery(e.target.value)}
									className="w-full pl-10 pr-4 py-3 rounded-2xl bg-[#F3F4F6] text-sm text-[#111827] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#9AC63F]/20"
								/>
							</div>
							<div className="relative">
								<button
									aria-label="New chat"
									className="p-2 cursor-pointer rounded-xl bg-[#F9FAFB] hover:bg-[#E5E7EB]"
									onClick={() => setIsModalOpen(!isModalOpen)}
								>
									<SquarePen className="w-4 h-4 text-[#6B7280]" />
								</button>
							</div>
						</div>

						{/* Contacts List */}
						<div className="flex-1 overflow-y-auto">
							{filteredContacts?.map((contact: any) => (
								<div
									key={contact?._id}
									onClick={() => {
										handleSelectContact(contact);
										if (isMobile) setShowSidebar(false);
									}}
									className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${selectedContact?._id === contact?._id ? "bg-gray-100" : ""
										}`}
								>
									<div className="flex items-center space-x-3 relative">
										{/* Avatar */}
										<div className="relative">
											<img
												src={resolveAvatarSrc(contact?.avatarUrl)}
												alt={contact?.firstname}
												className="w-12 h-12 rounded-full object-cover bg-gray-200"
											/>
											<div
												className={`absolute bottom-0 right-0 w-5 h-5 rounded-full border-2 border-white ${contact?.isOnline ? "bg-green-500" : "bg-red-500"
													}`}
											></div>
										</div>

										{/* Contact Info */}
										<div className="flex-1 min-w-0">
											<div className="flex justify-between items-start">
												<h3 className="text-sm font-medium text-gray-900 truncate">
													{contact?.firstname} {contact?.lastname}
												</h3>
												<span className="text-xs text-gray-500 ml-2 whitespace-nowrap">
													{format(new Date(contact?.timestamp), "eee p")}
												</span>
											</div>

											<div className="flex justify-between items-center mt-1">
												<p className="text-sm text-gray-500 truncate">
													{contact?.lastMessage}
												</p>
												{contact?.unread > 0 && (
													<span className="ml-2 bg-secondary text-white text-xs rounded-full px-2 py-1 min-w-5 text-center whitespace-nowrap">
														{contact?.unread > 99 ? "99+" : contact?.unread}
													</span>
												)}
											</div>

											<div className="flex justify-between items-center mt-1">
												<p
													className={`text-xs text-black truncate capitalize ${contact?.role === "doctor"
														? "bg-blue-300"
														: contact?.role === "marketer"
															? "bg-green-300"
															: ""
														} rounded p-1`}
												>
													{contact?.role}
												</p>
											</div>
										</div>

										{/* Ellipsis Button */}
										<div className="ml-2 relative">
											<button
												onClick={(e) => {
													e.stopPropagation();
													setShowConvoMenu(
														showConvoMenu === contact._id ? null : contact._id
													);
												}}
												className="text-gray-500 hover:text-black px-2"
											>
												&#x22EE;
											</button>

											{showConvoMenu === contact._id && (
												<div className="absolute right-0 mt-1 bg-white border rounded shadow-md z-50">
													<button
														onClick={(e) => {
															e.stopPropagation();
															setShowConvoMenu(null);
															setConfirmDeleteConvo({
																open: true,
																conversationId: contact.conversationId,
															});
														}}
														className="w-full text-left text-sm text-red-600 hover:bg-gray-100 px-3 py-2 flex items-center gap-2 cursor-pointer"
													>
														<Trash size={20} />
														Delete
													</button>
												</div>
											)}
										</div>
									</div>
								</div>
							))}
						</div>
					</div>

					{/* Right Main Chat Window */}
					{selectedContact && (
						<div
							className={`${isMobile
								? showSidebar
									? "w-0 overflow-hidden"
									: "w-full"
								: "flex-1"
								} flex flex-col bg-white rounded-2xl border border-[#E5E7EB] p-6 shadow-sm transition-all duration-300`}
						>
							{/* Chat Header */}
							<div className="bg-gray-100 border-b border-gray-200 p-4">
								<div className="flex items-center justify-between">
									<div className="flex items-center space-x-3">
										{isMobile && (
											<button
												onClick={() => setShowSidebar(true)}
												className="p-2 text-gray-600 hover:text-gray-800 rounded-full md:hidden"
											>
												<ArrowLeft className="w-5 h-5" />
											</button>
										)}
										<img
											src={resolveAvatarSrc(selectedContact?.avatarUrl)}
											alt={selectedContact?.firstname}
											className="w-10 h-10 rounded-full object-cover bg-gray-200"
										/>
										<div >
											<h3 className="text-lg font-medium text-gray-900">
												{selectedContact?.firstname} {selectedContact?.lastname}
											</h3>
											<p className="text-sm text-gray-500">
												{selectedContact?.isOnline
													? "Online"
													: "Last seen recently"}
											</p>
										</div>
									</div>
									{/* <div className="flex items-center space-x-2">
										<button
											onClick={() => {
												startAudioCall(recipientPeerId || "");
											}}
											className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded-full transition-colors cursor-pointer"
										>
											<Phone className="w-5 h-5" />
										</button>
										<button
											onClick={() => {
												startVideoCall(recipientPeerId || "");
											}}
											className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded-full transition-colors cursor-pointer"
										>
											<Video className="w-5 h-5" />
										</button>
										<button
											onClick={() => setShowChatSearch(!showChatSearch)}
											className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded-full transition-colors cursor-pointer"
										>
											<Search className="w-5 h-5" />
										</button>
									</div> */}
								</div>

								{/* Chat Search */}
								{showChatSearch && (
									<div className="mt-3 relative">
										<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
										<input
											type="text"
											placeholder="Search messages..."
											value={chatSearchQuery}
											onChange={(e) => setChatSearchQuery(e.target.value)}
											className="w-full pl-10 pr-10 py-2 bg-white rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[hsl(var(--secondary))]"
										/>
										<button
											onClick={() => {
												setShowChatSearch(false);
												setChatSearchQuery("");
											}}
											className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
										>
											<X className="w-4 h-4" />
										</button>
									</div>
								)}
							</div>

							{/* Messages */}
							<div className="flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-4">
								{filteredMessages?.map((message: any, index: number) => (
									<div
										key={`${message?._id ||
											message?.id ||
											`${message?.sender?._id || "unknown"}-${message?.timestamp || "t"
											}`
											}-${index}`}
										className={`relative flex ${message?.sent || message?.sender?._id === loggedInUser?.id
											? "justify-end"
											: "justify-start"
											}`}
									>
										{message?.type === "missedCall" ? (
											<div className="flex items-center justify-center w-full">
												<div className="bg-white text-red-500 shadow-sm p-3 rounded-xl flex items-center space-x-3 mx-auto cursor-default pointer-events-none">
													<PhoneMissed className="w-4 h-4" />
													<p className="text-sm">
														{message?.text} at{" "}
														<span className="text-xs">
															{message?.timestamp}
														</span>
													</p>
												</div>
											</div>
										) : (
											<div
												className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${message?.sent ||
													message?.sender?._id === loggedInUser?.id
													? "bg-secondary text-white"
													: "bg-white text-gray-900 shadow-sm"
													} grid`}
											>
												<div className="flex">
													{message?.sender?._id === loggedInUser?.id && (
														<div className="ms-auto">
															<button
																onClick={() =>
																	setShowMenu((prev) =>
																		prev === message._id ? null : message._id
																	)
																}
																className="text-white/80 hover:text-white cursor-pointer"
															>
																&#x22EE;
															</button>

															{showMenu === message._id && (
																<div className="absolute right-0 mt-1 w-auto bg-white border rounded shadow-md z-50">
																	<button
																		onClick={() => openDeleteModal(message._id)}
																		className="w-full text-left text-sm text-red-600 hover:bg-gray-100 px-3 py-2 flex items-center gap-2 cursor-pointer"
																	>
																		<Trash size={20} />
																		Delete
																	</button>
																</div>
															)}
														</div>
													)}
												</div>
												{message?.type === "image" && message?.url && (
													<Link
														href={message?.url || "/messages"}
														target="_blank"
														className="flex items-center space-x-2"
													>
														<img
															src={message?.url}
															alt="Shared image"
															className="w-full h-48 object-cover rounded mb-2"
														/>
													</Link>
												)}
												{message?.type === "voice" && message?.url && (
													<div className="flex items-center space-x-2">
														<audio
															controls
															src={message?.url}
															className="w-[100] h-10"
														/>
													</div>
												)}
												{message?.type === "image" && message?.url && (
													<Link
														href={message?.url || "/messages"}
														target="_blank"
														className="flex items-center space-x-2"
													>
														<img
															src={message?.url}
															alt="Shared image"
															className="w-full h-48 object-cover rounded mb-2"
														/>
													</Link>
												)}
												{message?.type === "file" && (
													<Link
														href={message?.url || "/messages"}
														target="_blank"
														className="flex items-center space-x-2"
													>
														<FileText className="w-5 h-5" />
														<span className="text-sm text-wrap">
															{message?.text || "File"}
														</span>
													</Link>
												)}
												{message?.type === "video" && message?.url && (
													<Link
														href={message?.url || "/messages"}
														target="_blank"
														className="relative block w-full h-48"
													>
														{/* Thumbnail preview (poster frame or placeholder) */}
														<video
															src={message?.url}
															className="w-full h-48 object-cover rounded mb-2"
															muted
															playsInline
															preload="metadata"
															onLoadedMetadata={(e) => {
																// Hack: only load metadata, avoid autoplay
																(e.target as HTMLVideoElement).currentTime = 1;
															}}
														/>

														{/* Play icon overlay */}
														<div className="absolute inset-0 flex items-center justify-center">
															<div className="bg-black bg-opacity-50 rounded-full p-3">
																<svg
																	xmlns="http://www.w3.org/2000/svg"
																	className="h-8 w-8 text-white"
																	fill="currentColor"
																	viewBox="0 0 16 16"
																>
																	<path d="M6.79 5.093A.5.5 0 0 0 6 5.5v5a.5.5 0 0 0 .79.407l3.5-2.5a.5.5 0 0 0 0-.814l-3.5-2.5z" />
																</svg>
															</div>
														</div>
													</Link>
												)}
												{/* Audio call message */}
												{message?.type === "audioCall" && (
													<div
														className="flex items-center space-x-2 p-2 rounded cursor-default pointer-events-none"
													>
														<Phone className="w-5 h-5 text-green-500" />
														<span className="text-sm">{message?.text}</span>
													</div>
												)}
												{/* Video call message */}
												{message?.type === "videoCall" && (
													<div
														className="flex items-center space-x-2 p-2 rounded cursor-default pointer-events-none"
													>
														<Video className="w-5 h-5 text-blue-500" />
														<span className="text-sm">{message?.text}</span>
													</div>
												)}
												{message.type === "text" && (
													<p className="text-sm text-wrap wrap-anywhere">
														{message?.text}
													</p>
												)}
												<div
													className={`flex items-center justify-end mt-1 space-x-1 ${message?.sent ||
														message?.sender?._id === loggedInUser?.id
														? "text-blue-100"
														: "text-gray-500"
														}`}
												>
													<span className="text-xs">{message?.timestamp}</span>
													{message?.sent ||
														(message?.sender?._id === loggedInUser?.id && (
															<div className="flex">
																{message?.read ? (
																	<CheckCheck className="w-3 h-3 text-blue-300" />
																) : message?.delivered ? (
																	<CheckCheck className="w-3 h-3" />
																) : (
																	<Check className="w-3 h-3" />
																)}
															</div>
														))}
												</div>
											</div>
										)}
									</div>
								))}
								<div ref={messagesEndRef} />
							</div>

							{/* Message Input */}
							<div className="bg-gray-100 border-t border-gray-200 p-4">
								<div className="flex items-center space-x-3">
									{/* Paperclip icon */}
									{/* Emoji Picker */}
									<div className="relative">
										<button
											className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded-full transition-colors"
											onClick={() => setShowEmojiPicker(!showEmojiPicker)}
										>
											<Smile className="w-5 h-5" />
										</button>
										{showEmojiPicker && (
											<div className="absolute bottom-12 left-0 bg-white border rounded-lg shadow-lg p-3 z-20 w-64 h-48 overflow-y-auto">
												<div className="grid grid-cols-8 gap-1">
													{emojis.map((emoji, index) => (
														<button
															key={index}
															onClick={() => {
																setMessageInput((prev) => prev + emoji);
																setShowEmojiPicker(false);
															}}
															className="text-lg hover:bg-gray-100 p-1 rounded"
														>
															{emoji}
														</button>
													))}
												</div>
											</div>
										)}
									</div>

									{/* Attachment Options */}
									<div className="relative">
										<button
											className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded-full transition-colors"
											onClick={() =>
												setShowAttachmentOptions(!showAttachmentOptions)
											}
										>
											<Paperclip className="w-5 h-5" />
										</button>
										{showAttachmentOptions && (
											<div className="absolute bottom-12 left-0 w-48 bg-white rounded-lg shadow-lg border z-20">
												<button
													onClick={() => fileInputRef.current?.click()}
													className="flex items-center gap-2 w-full px-4 py-2 text-left hover:bg-gray-100 rounded-t-lg"
												>
													<ImagePlay className="w-5 h-5" />
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

									{/* Message Input Field */}
									<div className="flex-1 relative">
										{!isRecording && !recordedAudioURL && (
											<>
												<button
													onClick={() => cameraInputRef.current?.click()}
													className="absolute left-3 top-1/2 transform -translate-y-1/2 p-1 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-full transition-colors"
												>
													<Camera className="w-5 h-5" />
												</button>

												<input
													type="text"
													placeholder="Type a message"
													value={messageInput}
													onChange={(e) => setMessageInput(e.target.value)}
													className="w-full pl-12 pr-12 py-2 bg-white rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[hsl(var(--secondary))]"
													onKeyDown={(e) => {
														if (
															e.key === "Enter" &&
															messageInput.trim() &&
															!sending
														) {
															e.preventDefault();
															handleSend();
														}
													}}
												/>

												<button
													onClick={handleSend}
													disabled={!messageInput.trim() || sending}
													className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 bg-secondary text-white rounded-full hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
												>
													<Send className="w-5 h-5" />
												</button>
											</>
										)}

										{isRecording && (
											<div className="flex items-center justify-center w-full bg-white py-3 rounded-lg border border-dashed border-red-500">
												<div className="flex items-center gap-2">
													<div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
													<p className="text-red-600 text-sm font-medium">
														Recording... Tap to stop
													</p>
												</div>
											</div>
										)}

										{recordedAudioURL && !isRecording && (
											<div className="flex items-center gap-2 bg-white p-2 rounded-lg border border-gray-300">
												<audio
													controls
													src={recordedAudioURL}
													className="flex-1 h-8"
												/>
												<button
													onClick={sendVoiceNote}
													className="px-3 py-1 bg-green-500 text-white text-sm rounded hover:bg-green-600 transition-colors"
												>
													Send
												</button>
												<button
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
									</div>

									{/* Voice Record Button */}
									<button
										onClick={handleVoiceRecord}
										className={`p-2 rounded-full transition-colors ${isRecording
											? "bg-red-100 text-red-500 animate-pulse"
											: "text-gray-600 hover:text-gray-800 hover:bg-gray-200"
											}`}
									>
										<Mic className="w-5 h-5" />
									</button>
								</div>
							</div>
						</div>
					)}
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

				{showDeleteModal && (
					<div className="fixed inset-0 z-1000 bg-black/50 flex items-center justify-center">
						<div className="bg-white p-6 rounded-lg shadow-md max-w-sm w-full">
							<h2 className="text-lg font-semibold text-gray-800 mb-2">
								Delete Message
							</h2>
							<p className="text-sm text-gray-600 mb-4">
								This message will be permanently deleted. Do you want to
								continue?
							</p>
							<div className="flex justify-end space-x-3">
								<button
									onClick={() => setShowDeleteModal(false)}
									className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 text-gray-800 text-sm"
								>
									Cancel
								</button>
								<button
									onClick={confirmDelete}
									className="px-4 py-2 rounded bg-red-600 hover:bg-red-700 text-white text-sm"
								>
									Delete
								</button>
							</div>
						</div>
					</div>
				)}

				{confirmDeleteConvo.open && (
					<div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
						<div className="bg-white rounded-lg shadow-lg p-6 w-80">
							<h2 className="text-lg font-semibold text-gray-800 mb-3">
								Delete Contact?
							</h2>
							<p className="text-sm text-gray-600 mb-5">
								This contact and chat history will be permanently deleted.
							</p>
							<div className="flex justify-end space-x-3">
								<button
									onClick={() =>
										setConfirmDeleteConvo({ open: false, conversationId: null })
									}
									className="px-4 py-2 text-sm rounded bg-gray-200 hover:bg-gray-300"
								>
									Cancel
								</button>
								<button
									onClick={confirmDeleteConversation}
									className="px-4 py-2 text-sm rounded bg-red-600 text-white hover:bg-red-700"
								>
									Delete
								</button>
							</div>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
