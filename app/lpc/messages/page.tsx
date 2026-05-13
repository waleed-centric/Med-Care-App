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
	Camera,
	Mic,
	Plus,
	X,
	ArrowLeft,
	SquarePen,
	Trash,
	ChevronDown,
	Grid,
	Calendar,
	MessageSquare,
    Image as ImageIcon,
    FileText,
    Play,
    LogOut,
    User,
} from "lucide-react";
import Image from "next/image";
import ContactModal from "@/components/ContactModal";
import Cookies from "js-cookie";
import { format } from "date-fns";
import Link from "next/link";
import { socket } from "@/lib/socket";
import { usePeerContext } from "@/context/CallProvider";
import { enqueueSnackbar } from "notistack";
import PresenceToggle from "@/components/PresenceToggle";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import LPCSidebar from "@/components/LPCSidebar";
import { updateOnlineStatus } from "@/hooks/auth";

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

const resolveAvatarSrc = (input?: string | null) => {
    const base = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "");
    const u = String(input ?? "").trim();
    if (!u) return "/images/avatar.PNG";
    if (/^https?:\/\//i.test(u)) return u;
    if (u.startsWith("/uploads")) return base ? `${base}${u}` : u;
    const cleaned = u.replace(/^\/?uploads\/?/, "");
    return base ? `${base}/uploads/${cleaned}` : `/uploads/${cleaned}`;
};

const emojis = [
	"😀", "😃", "😄", "😁", "😆", "😅", "😂", "🤣", "😊", "😇", "🙂", "🙃", "😉", "😌", "😍", "🥰", "😘", "😗", "😙", "😚", "😋", "😛", "😝", "😜", "😜", "🤪", "🤨", "🧐", "🤓", "😎", "🤩", "🥳", "😏", "😒", "😞", "😔", "😟", "😕", "🙁", "☹️", "😣", "😖", "😫", "😩", "🥺", "😢", "😭", "😤", "😠", "😡", "🤬", "🤯", "😳", "🥵", "🥶", "😱", "😨", "😰", "😥", "😓", "🤗", "🤔", "🤭", "🤫", "🤥", "😶", "😐", "😑", "😬", "🙄", "😯", "😦", "😧", "😮", "😲", "🥱", "😴", "🤤", "😪", "😵", "🤐", "🥴", "🤢", "🤮", "🤧", "😷", "🤒", "🤕", "🤑", "🤠",
];

export default function LPCMessages() {
	const [showMenu, setShowMenu] = useState<string | null>(null);
	const [showEmojiPicker, setShowEmojiPicker] = useState(false);
	const [showAttachmentOptions, setShowAttachmentOptions] = useState(false);
	const [isRecording, setIsRecording] = useState(false);
	const [conversations, setConversations] = useState<any>(null);
	const [allContacts, setAllContacts] = useState<Contact[]>([]);
	const [messageInput, setMessageInput] = useState("");
	const [searchQuery, setSearchQuery] = useState("");
	const [chatSearchQuery, setChatSearchQuery] = useState("");
	const [showChatSearch, setShowChatSearch] = useState(false);
	const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
	const [recordedAudioURL, setRecordedAudioURL] = useState<string | null>(null);
	const [isMobile, setIsMobile] = useState(false);
	const [showSidebar, setShowSidebar] = useState(true);
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
		myPeerId,
	} = usePeerContext();

	// Ensure online status and peer ID are active when entering this page
	useEffect(() => {
		updateOnlineStatus(true).catch((err: any) =>
			console.error("Failed to update online status:", err)
		);
		if (myPeerId) {
			storePeerId(myPeerId).catch((err: any) =>
				console.error("Failed to store peer ID:", err)
			);
		}
	}, [myPeerId]);

	const [initialCid, setInitialCid] = useState<string | null>(null);
	const [messageToDelete, setMessageToDelete] = useState<string | null>(null);
	const [showDeleteModal, setShowDeleteModal] = useState(false);
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
            } catch {}
        };
        run();
    }, [selectedContact?._id]);

	const confirmDeleteConversation = async () => {
		try {
			if (confirmDeleteConvo.conversationId) {
				await deleteConvo(confirmDeleteConvo.conversationId);
				setConfirmDeleteConvo({ open: false, conversationId: null });
                setConversations((prev: any) => 
                    Array.isArray(prev) ? prev.filter((c: any) => c._id !== confirmDeleteConvo.conversationId) : prev
                );
                if (selectedContact?.conversationId === confirmDeleteConvo.conversationId) {
                    setSelectedContact(null);
                    setConversationId("");
                    setMessages([]);
                }
			}
		} catch (error) {
			console.log(error);
		}
	};

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
		} catch {}
	}, []);

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
            } catch {}
        };
        linkToConversation();
    }, [initialCid, conversations]);

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
        fetchUpdatedConversation();
    }, [conversationId]);

	const handleSelectContact = async (contact: Contact) => {
		setSelectedContact(contact);
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
        try {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        } catch {}
    }, [messages?.length, conversationId, selectedContact]);

	useEffect(() => {
		if (!socket) return;
		socket.on("connect", () => {
			if (loggedInUser?.id) {
				socket.emit("join", loggedInUser?.id);
			}
		});

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

		return () => {
			socket.off("connect");
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

	const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0];
		if (!file || sending) return;
		setSending(true);
		try {
			const formData = new FormData();
			const fileType = getFileType(file);
			formData.append("file", file);
			formData.append("conversationId", conversationId);
			formData.append("type", fileType);
			const res = await fetch("/api/upload/conversations", {
				method: "POST",
				body: formData,
			});
			const data = await res.json();
			if (data.success) {
				const fileMessage = {
					id: Array.isArray(messages) ? messages.length + 1 : 1,
					text: fileType === "image" ? "📷 Photo" : fileType === "video" ? "🎥 Video" : `📎 ${file.name}`,
					timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
					sent: true,
					delivered: true,
					read: false,
					type: fileType,
					fileUrl: data.fileUrl,
					fileName: file.name,
					fileSize: file.size,
				};
				setMessages((prev: any) => Array.isArray(prev) ? [...prev, fileMessage] : [fileMessage]);
				await sendMessage(conversationId, file.name, fileMessage?.type, data.fileUrl);
			}
		} catch (error) {
			console.error("Upload failed:", error);
		} finally {
			setSending(false);
		}
		setShowAttachmentOptions(false);
	};

	const handleCameraCapture = async (event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0];
		if (!file || sending) return;
		setSending(true);
		try {
			const formData = new FormData();
			const fileType = getFileType(file);
			formData.append("file", file);
			formData.append("conversationId", conversationId);
			formData.append("type", fileType);
			const res = await fetch("/api/upload/conversations", { method: "POST", body: formData });
			const data = await res.json();
			if (data.success) {
				const imageMessage = {
					id: Array.isArray(messages) ? messages.length + 1 : 1,
					text: fileType === "image" ? "📷 Photo" : fileType === "video" ? "🎥 Video" : `📎 ${file.name}`,
					timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
					sent: true,
					delivered: true,
					read: false,
					type: fileType,
					imageUrl: data.fileUrl,
				};
				setMessages((prev: any) => Array.isArray(prev) ? [...prev, imageMessage] : [imageMessage]);
				await sendMessage(conversationId, imageMessage?.text, imageMessage?.type, data.fileUrl);
			}
		} catch (err) {
			console.error("Upload failed:", err);
		} finally {
			setSending(false);
		}
	};

	const handleVoiceRecord = async () => {
		if (!isRecording) {
			try {
				const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
				const recorder = new MediaRecorder(stream);
				const chunks: Blob[] = [];
				recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };
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
			}
		};
		getUsersList();
	}, [isModalOpen]);

	const sendVoiceNote = async () => {
		if (!recordedAudioURL) return;
		try {
			const response = await fetch(recordedAudioURL);
			const blob = await response.blob();
			const file = new File([blob], `voice-${Date.now()}.webm`, { type: "audio/webm" });
			const formData = new FormData();
			formData.append("file", file);
			formData.append("conversationId", conversationId);
			formData.append("type", "voice");
			const res = await fetch("/api/upload/conversations", { method: "POST", body: formData });
			const data = await res.json();
			if (data.success) {
				const voiceMessage = {
					id: Array.isArray(messages) ? messages.length + 1 : 1,
					text: "🎤 Voice message",
					timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
					sent: true,
					delivered: true,
					read: false,
					type: "voice",
					audioUrl: data.fileUrl,
					fileName: file.name,
					fileSize: file.size,
				};
				setMessages((prev: any) => Array.isArray(prev) ? [...prev, voiceMessage] : [voiceMessage]);
				await sendMessage(conversationId, voiceMessage.text, voiceMessage.type, data.fileUrl);
			}
		} catch (err) {
			console.error("Voice note upload failed:", err);
		}
		setRecordedAudioURL(null);
	};

	const handleDeleteMessage = async (id: string) => {
		try {
			await deleteMessage(id);
			setMessages((prev: any) => Array.isArray(prev) ? prev.filter((m: any) => m._id !== id) : prev);
		} catch (error) {
			console.error("Error deleting message:", error);
		}
	};

	const openDeleteModal = (id: string) => {
		setMessageToDelete(id);
		setShowDeleteModal(true);
		setShowMenu(null);
	};

	const confirmDelete = () => {
		if (messageToDelete) handleDeleteMessage(messageToDelete);
		setShowDeleteModal(false);
	};

	return (
		<div className="flex h-screen bg-[#F5F5F5] overflow-hidden">
            <LPCSidebar />
			<div className="flex-1 flex flex-col overflow-hidden p-6 gap-6">
                <header className="bg-white border-b border-[#E5E7EB] px-6 py-4 rounded-xl shadow-sm">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <h1 className="text-xl font-semibold text-gray-900 hidden md:block">Messages</h1>
                        </div>
                        <div className="flex items-center gap-6">
                            <PresenceToggle />
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <button className="flex items-center gap-3 px-4 py-2 bg-[#111827] rounded-xl cursor-pointer hover:bg-[#1F2937] transition-colors">
                                        <div className="relative h-8 w-8 rounded-full overflow-hidden">
                                            <img
                                                src={resolveAvatarSrc(loggedInUser?.avatarUrl || loggedInUser?.avatar)}
                                                alt="Profile"
                                                className="w-full h-full object-cover"
                                                onError={(e) => { (e.currentTarget as HTMLImageElement).src = "/images/avatar.PNG"; }}
                                            />
                                        </div>
                                        <span className="text-sm font-medium text-white max-w-[150px] truncate">
                                            {loggedInUser?.email}
                                        </span>
                                        <ChevronDown className="h-4 w-4 text-white" />
                                    </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="w-56 bg-white" align="end">
                                    <DropdownMenuItem onClick={logout} className="text-red-600 focus:text-red-600">
                                        <LogOut className="mr-2 h-4 w-4" />
                                        <span>Log out</span>
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>
                </header>

				<div className="flex-1 flex overflow-hidden gap-6">
					<div className={`${isMobile ? (showSidebar ? "w-full" : "w-0 overflow-hidden") : "w-[360px]"} bg-white rounded-2xl border border-[#E5E7EB] p-6 shadow-sm flex flex-col transition-all duration-300`}>
						<div className="p-4 bg-gray-50 rounded-xl border border-gray-100 mb-4">
							<div className="flex items-center justify-between">
								<h2 className="text-lg font-semibold text-gray-900">Conversations</h2>
								<button onClick={() => setIsModalOpen(true)} className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded-full transition">
									<Plus className="w-5 h-5" />
								</button>
							</div>
							<ContactModal open={isModalOpen} onClose={() => setIsModalOpen(false)} contacts={allContacts} onSelectContact={(contact: Contact) => { handleSelectContact(contact); if (isMobile) setShowSidebar(false); setIsModalOpen(false); }} />
						</div>

						<div className="flex items-center justify-between w-full space-x-3 mb-4">
							<div className="relative w-full">
								<Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] w-4 h-4" />
								<input type="text" placeholder="Search" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-3 rounded-2xl bg-[#F3F4F6] text-sm text-[#111827] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#9AC63F]/20" />
							</div>
							<button aria-label="New chat" className="p-2 cursor-pointer rounded-xl bg-[#F9FAFB] hover:bg-[#E5E7EB]" onClick={() => setIsModalOpen(true)}>
								<SquarePen className="w-4 h-4 text-[#6B7280]" />
							</button>
						</div>

						<div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
							{filteredContacts?.map((contact: any) => (
								<div key={contact?._id} onClick={() => { handleSelectContact(contact); if (isMobile) setShowSidebar(false); }} className={`p-4 rounded-xl cursor-pointer hover:bg-gray-50 transition-all border border-transparent ${selectedContact?._id === contact?._id ? "bg-gray-100 border-gray-200 shadow-sm" : ""}`}>
									<div className="flex items-center space-x-3 relative">
										<div className="relative shrink-0">
                                            <img src={resolveAvatarSrc(contact?.avatarUrl)} alt={contact?.firstname} className="w-12 h-12 rounded-full object-cover bg-gray-200" />
                                            <div className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-white ${contact?.isOnline ? "bg-green-500" : "bg-gray-400"}`}></div>
                                        </div>
										<div className="flex-1 min-w-0">
											<div className="flex justify-between items-start">
												<h3 className="text-sm font-semibold text-gray-900 truncate">{contact?.firstname} {contact?.lastname}</h3>
												<span className="text-[10px] text-gray-500 ml-2 whitespace-nowrap">{contact?.timestamp ? format(new Date(contact?.timestamp), "p") : ""}</span>
											</div>
											<div className="flex justify-between items-center mt-1">
												<p className="text-xs text-gray-500 truncate">{contact?.lastMessage}</p>
												{contact?.unread > 0 && <span className="ml-2 bg-[#9AC63F] text-white text-[10px] rounded-full px-1.5 py-0.5 min-w-[18px] text-center">{contact?.unread > 99 ? "99+" : contact?.unread}</span>}
											</div>
										</div>
										<div className="relative">
											<button onClick={(e) => { e.stopPropagation(); setShowConvoMenu(showConvoMenu === contact._id ? null : contact._id); }} className="text-gray-400 hover:text-gray-600 p-1">⋮</button>
											{showConvoMenu === contact._id && (
												<div className="absolute right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-xl z-50 min-w-[120px]">
													<button onClick={(e) => { e.stopPropagation(); setShowConvoMenu(null); setConfirmDeleteConvo({ open: true, conversationId: contact.conversationId }); }} className="w-full text-left text-xs text-red-600 hover:bg-red-50 px-4 py-2 flex items-center gap-2">
														<Trash size={14} /> Delete
													</button>
												</div>
											)}
										</div>
									</div>
								</div>
							))}
						</div>
					</div>

					{selectedContact ? (
						<div className={`${isMobile ? (showSidebar ? "w-0 overflow-hidden" : "w-full") : "flex-1"} flex flex-col bg-white rounded-2xl border border-[#E5E7EB] shadow-sm transition-all duration-300 overflow-hidden`}>
							<div className="bg-white border-b border-gray-100 p-4">
								<div className="flex items-center justify-between">
									<div className="flex items-center space-x-3">
										{isMobile && <button onClick={() => setShowSidebar(true)} className="p-2 text-gray-600 hover:text-gray-800 rounded-full"><ArrowLeft className="w-5 h-5" /></button>}
                                        <img src={resolveAvatarSrc(selectedContact?.avatarUrl)} alt={selectedContact?.firstname} className="w-10 h-10 rounded-full object-cover bg-gray-200" />
										<div>
											<h3 className="text-base font-semibold text-gray-900">{selectedContact?.firstname} {selectedContact?.lastname}</h3>
											<p className="text-xs text-gray-500">{selectedContact?.isOnline ? "Online" : "Offline"}</p>
										</div>
									</div>
									<div className="flex items-center space-x-1">
                                        <button onClick={() => startAudioCall(recipientPeerId || "")} className="p-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors"><Phone className="w-5 h-5" /></button>
                                        <button onClick={() => startVideoCall(recipientPeerId || "")} className="p-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors"><Video className="w-5 h-5" /></button>
										<button onClick={() => setShowChatSearch(!showChatSearch)} className="p-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors"><Search className="w-5 h-5" /></button>
									</div>
								</div>
								{showChatSearch && (
									<div className="mt-3 relative">
										<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
										<input type="text" placeholder="Search messages..." value={chatSearchQuery} onChange={(e) => setChatSearchQuery(e.target.value)} className="w-full pl-10 pr-10 py-2 bg-gray-50 rounded-lg border border-gray-200 focus:outline-none focus:ring-1 focus:ring-[#9AC63F]" />
										<button onClick={() => { setShowChatSearch(false); setChatSearchQuery(""); }} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"><X className="w-4 h-4" /></button>
									</div>
								)}
							</div>

							<div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#F8F9FA] custom-scrollbar">
								{filteredMessages?.map((message: any, index: number) => (
									<div key={message?._id || index} className={`flex ${message?.sender?._id === loggedInUser?.id ? "justify-end" : "justify-start"}`}>
										<div className={`max-w-[75%] lg:max-w-[60%] p-3 rounded-2xl shadow-sm relative group ${message?.sender?._id === loggedInUser?.id ? "bg-[#9AC63F] text-white rounded-tr-none" : "bg-white text-gray-900 rounded-tl-none border border-gray-100"}`}>
											<div className="flex flex-col gap-1">
												{message?.type === "image" && message?.url && (
													<Link href={message?.url} target="_blank" className="rounded-lg overflow-hidden mb-1 border border-black/5">
														<img src={message?.url} alt="Shared" className="max-w-full max-h-[300px] object-contain" />
													</Link>
												)}
												{message?.type === "video" && message?.url && (
													<Link href={message?.url} target="_blank" className="rounded-lg overflow-hidden mb-1 border border-black/5 relative group/video">
														<video src={message?.url} className="max-w-full max-h-[300px]" muted playsInline preload="metadata" onLoadedMetadata={(e) => { (e.target as HTMLVideoElement).currentTime = 1; }} />
														<div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover/video:bg-black/30 transition-colors">
                                                            <div className="bg-white/90 rounded-full p-2 text-gray-900"><Play className="w-6 h-6 fill-current" /></div>
                                                        </div>
													</Link>
												)}
                                                {message?.type === "voice" && message?.url && (
                                                    <div className="mb-1 py-1"><audio controls src={message?.url} className="max-w-full h-8" /></div>
                                                )}
                                                {message?.type === "file" && (
                                                    <Link href={message?.url || "#"} target="_blank" className={`flex items-center gap-3 p-2 rounded-lg border mb-1 ${message?.sender?._id === loggedInUser?.id ? "bg-white/10 border-white/20" : "bg-gray-50 border-gray-200"}`}>
                                                        <FileText className="w-6 h-6 shrink-0" />
                                                        <span className="text-xs truncate font-medium">{message?.text || "Document"}</span>
                                                    </Link>
                                                )}
												{message.type === "text" && <p className="text-sm whitespace-pre-wrap wrap-break-word">{message?.text}</p>}
                                                {message?.type === "missedCall" && (
                                                    <div className="flex items-center gap-2 py-1 text-red-500 font-medium">
                                                        <PhoneMissed className="w-4 h-4" /> <span className="text-xs">{message?.text}</span>
                                                    </div>
                                                )}
												<div className={`flex items-center justify-end gap-1 mt-1 ${message?.sender?._id === loggedInUser?.id ? "text-white/70" : "text-gray-400"}`}>
													<span className="text-[10px]">{message?.timestamp}</span>
													{message?.sender?._id === loggedInUser?.id && (
														<div className="flex">
															{message?.read ? <CheckCheck className="w-3 h-3 text-blue-200" /> : <Check className="w-3 h-3" />}
														</div>
													)}
												</div>
											</div>
                                            {message?.sender?._id === loggedInUser?.id && (
                                                <button onClick={() => openDeleteModal(message._id)} className="absolute -left-8 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Trash size={14} />
                                                </button>
                                            )}
										</div>
									</div>
								))}
								<div ref={messagesEndRef} />
							</div>

							<div className="bg-white border-t border-gray-100 p-4">
								<div className="flex items-center gap-2">
									<div className="relative">
										<button className="p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors" onClick={() => setShowEmojiPicker(!showEmojiPicker)}><Smile className="w-5 h-5" /></button>
										{showEmojiPicker && (
											<div className="absolute bottom-full left-0 mb-2 bg-white border border-gray-200 rounded-xl shadow-2xl p-3 z-50 w-64 h-56 overflow-y-auto grid grid-cols-7 gap-1">
												{emojis.map((emoji, i) => (
													<button key={i} onClick={() => { setMessageInput(prev => prev + emoji); setShowEmojiPicker(false); }} className="text-xl hover:bg-gray-50 p-1 rounded transition-colors">{emoji}</button>
												))}
											</div>
										)}
									</div>

									<div className="relative">
										<button className="p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors" onClick={() => setShowAttachmentOptions(!showAttachmentOptions)}><Paperclip className="w-5 h-5" /></button>
										{showAttachmentOptions && (
											<div className="absolute bottom-full left-0 mb-2 w-48 bg-white border border-gray-200 rounded-xl shadow-2xl z-50 overflow-hidden">
												<button onClick={() => { fileInputRef.current?.click(); setShowAttachmentOptions(false); }} className="flex items-center gap-3 w-full px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"><ImageIcon className="w-4 h-4" /> Photo and Video</button>
												<button onClick={() => { fileInputRef.current?.click(); setShowAttachmentOptions(false); }} className="flex items-center gap-3 w-full px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"><FileText className="w-4 h-4" /> Documents</button>
											</div>
										)}
									</div>

									<div className="flex-1 relative flex items-center gap-2">
										{!isRecording && !recordedAudioURL ? (
											<>
												<button onClick={() => cameraInputRef.current?.click()} className="p-2 text-gray-400 hover:text-gray-600 transition-colors shrink-0"><Camera className="w-5 h-5" /></button>
												<input type="text" placeholder="Type a message" value={messageInput} onChange={(e) => setMessageInput(e.target.value)} className="flex-1 px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#9AC63F] text-sm" onKeyDown={(e) => { if (e.key === "Enter" && messageInput.trim() && !sending) { e.preventDefault(); handleSend(); } }} />
												<button onClick={handleSend} disabled={!messageInput.trim() || sending} className="p-2 bg-[#9AC63F] text-white rounded-xl hover:bg-[#8bb435] transition-colors disabled:opacity-50 shrink-0"><Send className="w-5 h-5" /></button>
											</>
										) : isRecording ? (
											<div className="flex-1 flex items-center justify-between bg-red-50 px-4 py-2 rounded-xl border border-red-100">
												<div className="flex items-center gap-3">
													<div className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse"></div>
													<span className="text-xs font-medium text-red-600">Recording voice...</span>
												</div>
												<button onClick={handleVoiceRecord} className="text-xs font-bold text-red-600 hover:underline">Stop</button>
											</div>
										) : (
											<div className="flex-1 flex items-center gap-2 bg-gray-50 p-2 rounded-xl border border-gray-200">
												<audio controls src={recordedAudioURL!} className="flex-1 h-8" />
												<button onClick={sendVoiceNote} className="px-3 py-1 bg-[#9AC63F] text-white text-xs font-semibold rounded-lg hover:bg-[#8bb435]">Send</button>
												<button onClick={() => setRecordedAudioURL(null)} className="px-3 py-1 bg-red-500 text-white text-xs font-semibold rounded-lg hover:bg-red-600">Cancel</button>
											</div>
										)}
									</div>

									<button onClick={handleVoiceRecord} className={`p-2 rounded-full transition-all ${isRecording ? "bg-red-500 text-white shadow-lg" : "text-gray-500 hover:bg-gray-100"}`}><Mic className="w-5 h-5" /></button>
								</div>
							</div>
						</div>
					) : (
						<div className="flex-1 bg-white rounded-2xl border border-[#E5E7EB] shadow-sm flex flex-col items-center justify-center text-center p-12">
							<div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-6">
								<MessageSquare className="w-12 h-12 text-gray-300" />
							</div>
							<h3 className="text-xl font-bold text-gray-900 mb-2">Your Messages</h3>
							<p className="text-gray-500 max-w-xs mx-auto">Select a conversation from the list or start a new one to connect with your contacts.</p>
							<button onClick={() => setIsModalOpen(true)} className="mt-8 px-8 py-3 bg-[#9AC63F] text-white font-semibold rounded-xl hover:bg-[#8bb435] transition-all shadow-md">New Conversation</button>
						</div>
					)}
				</div>
			</div>

			<input ref={fileInputRef} type="file" accept="*/*" multiple onChange={handleFileSelect} className="hidden" />
			<input ref={cameraInputRef} type="file" accept="image/*,video/*" capture="environment" onChange={handleCameraCapture} className="hidden" />

            {showDeleteModal && (
                <div className="fixed inset-0 z-100 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 animate-in fade-in zoom-in duration-200">
                        <h2 className="text-lg font-bold text-gray-900 mb-2">Delete Message</h2>
                        <p className="text-sm text-gray-500 mb-6">Are you sure you want to delete this message? This action cannot be undone.</p>
                        <div className="flex justify-end gap-3">
                            <button onClick={() => setShowDeleteModal(false)} className="px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50 rounded-xl transition-colors">Cancel</button>
                            <button onClick={confirmDelete} className="px-4 py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors">Delete Message</button>
                        </div>
                    </div>
                </div>
            )}

            {confirmDeleteConvo.open && (
                <div className="fixed inset-0 z-100 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 animate-in fade-in zoom-in duration-200">
                        <h2 className="text-lg font-bold text-gray-900 mb-2">Delete Conversation</h2>
                        <p className="text-sm text-gray-500 mb-6">This will permanently delete your chat history with this contact. Are you sure?</p>
                        <div className="flex justify-end gap-3">
                            <button onClick={() => setConfirmDeleteConvo({ open: false, conversationId: null })} className="px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50 rounded-xl transition-colors">Cancel</button>
                            <button onClick={confirmDeleteConversation} className="px-4 py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors">Delete Everything</button>
                        </div>
                    </div>
                </div>
            )}
		</div>
	);
}
