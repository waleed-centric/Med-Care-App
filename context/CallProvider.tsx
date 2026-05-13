"use client";

import { activeMessages, contactMessage, contactMessageHistory, fetchPeerId, messageContacts, sendMessage, storePeerId } from "@/hooks/messages";
import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { Search, Phone, Video, Smile, Paperclip, Send, Check, CheckCheck, PhoneMissed, ListFilter, Camera, Mic, MessageSquareDot, Pen, Users, FileText, ImagePlay, Plus, PhoneOff, VideoOff, MicOff, X, ArrowLeft, SquarePen, PhoneOffIcon } from "lucide-react";
import ContactModal from "@/components/ContactModal";
import Peer, { MediaConnection } from "peerjs";
import Cookies from "js-cookie";
import { format } from "date-fns";
import { getProfileById } from "@/hooks/profile";
import Link from "next/link";
import { socket } from "@/lib/socket";
import CallOverlay from "@/components/CallOverlay";
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

const PeerContext = createContext<any | undefined>(undefined);

export const PeerProvider = ({ children, loggedInUser }: { children: React.ReactNode; loggedInUser: any }) => {
  const pathname = usePathname();
  // State management
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [sending, setSending] = useState(false);
  const [messages, setMessages] = useState<any>(null);
  const [conversationId, setConversationId] = useState("");
  const [isCaller, setIsCaller] = useState(false);
  const [caller, setCaller] = useState<any>(null);

  // Call states
  const [callState, setCallState] = useState<CallState>("idle"); // idle, audio-calling, audio-connected, video-calling, video-connected
  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [peer, setPeer] = useState<Peer | null>(null);
  const [recipientPeerId, setRecipientPeerId] = useState<string | null>(null);
  const [myPeerId, setMyPeerId] = useState<string | null>(null);
  const [callerId, setCallerId] = useState<string | null>(null);
  const connRef = useRef<MediaConnection | null>(null);
  // Refs
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const remoteAudioRef = useRef<HTMLAudioElement>(null);
  const callTimerRef = useRef<number | null>(null);
  const callStartRef = useRef<number | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);
  const incomingCallRef = useRef<any>(null);
  const unansweredTimeoutRef = useRef<any>(null);
  const callStateRef = useRef<CallState>("idle");
  const dialToneRef = useRef<HTMLAudioElement | null>(null);
  const ringToneRef = useRef<HTMLAudioElement | null>(null);
  const dataConnRef = useRef<any>(null);
  const [isDataConnected, setIsDataConnected] = useState(false);
  const postedPeerIdRef = useRef<string | null>(null);
  const postedAtRef = useRef<number | null>(null);
  const chatSubscribersRef = useRef<Array<(msg: any) => void>>([]);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimerRef = useRef<any>(null);

  const onChatMessage = (handler: (msg: any) => void) => {
    chatSubscribersRef.current.push(handler);
    return () => {
      chatSubscribersRef.current = chatSubscribersRef.current.filter((h) => h !== handler);
    };
  };

  const emitChat = (msg: any) => {
    for (const h of chatSubscribersRef.current) {
      try {
        h(msg);
      } catch { }
    }
  };

  const openChatConnection = (remoteId: string) => {
    if (!peer || !remoteId) return;
    const conn = peer.connect(remoteId);
    dataConnRef.current = conn;
    conn.on("open", () => {
      setIsDataConnected(true);
    });
    conn.on("data", (msg: any) => {
      emitChat(msg);
    });
    conn.on("close", () => {
      setIsDataConnected(false);
    });
    conn.on("error", () => {
      setIsDataConnected(false);
    });
  };

  const sendChatMessage = (text: string) => {
    const conn = dataConnRef.current;
    if (conn?.open && text) {
      conn.send({ type: "text", text });
    }
  };

  // PeerJs Initialization
  useEffect(() => {
    if (!loggedInUser) return;

    let peerInstance: Peer;

    const initPeer = async () => {
      const Peer = (await import("peerjs")).default;
      const host = process.env.NEXT_PUBLIC_PEER_HOST || "";
      const portRaw = process.env.NEXT_PUBLIC_PEER_PORT || "";
      const path = process.env.NEXT_PUBLIC_PEER_PATH || "/peerjs";
      const secure = (process.env.NEXT_PUBLIC_PEER_SECURE || "true").toLowerCase() === "true";
      const port = portRaw ? Number(portRaw) : undefined;
      const opts = host
        ? { host, port, path, secure, debug: 0 }
        : undefined as any;
      peerInstance = new Peer(opts);

      peerInstance.on("open", async (id) => {
        setMyPeerId(id);
        reconnectAttemptsRef.current = 0;
        if (reconnectTimerRef.current) {
          clearTimeout(reconnectTimerRef.current);
          reconnectTimerRef.current = null;
        }
        if (postedPeerIdRef.current !== id) {
          await storePeerId(id);
          postedPeerIdRef.current = id;
          postedAtRef.current = Date.now();
        }
      });
      peerInstance.on("connection", (conn) => {
        dataConnRef.current = conn;
        conn.on("open", () => {
          setIsDataConnected(true);
        });
        conn.on("data", (msg: any) => {
          emitChat(msg);
          handleSignal(msg);
        });
        conn.on("close", () => {
          setIsDataConnected(false);
        });
        conn.on("error", () => {
          setIsDataConnected(false);
        });
      });

      peerInstance.on("call", (call) => {
        const { type, callerId: metadataCallerId } = call.metadata || {};

        incomingCallRef.current = call;
        setCallerId(metadataCallerId || call.peer.split("-")[0]);
        setCallState("ringing");

        call.on("close", () => {
          setCallState("ended");
          stopCallTimer();
          endCall(true);
        });

        call.on("error", (err) => {
          console.error("Call error (callee side):", err);
          setCallState("unavailable");
          stopCallTimer();
          endCall(true);
        });

        // Do not auto-play ringtone here; CallOverlay manages audio playback
        // after a user gesture to satisfy browser autoplay policies.
      });

      peerInstance.on("disconnected", () => {
        console.warn("⚠️ Disconnected from PeerJS server, attempting reconnect...");
        setCallState("disconnected");
        if (reconnectTimerRef.current) {
          clearTimeout(reconnectTimerRef.current);
          reconnectTimerRef.current = null;
        }
        const attempt = ++reconnectAttemptsRef.current;
        if (document && document.visibilityState === "hidden") {
          return; // tab hidden: skip reconnect until visible
        }
        if (attempt > 5) {
          setCallState("unavailable");
          try { peerInstance.destroy(); } catch {}
          return;
        }
        const delay = Math.min(30000, 1000 * Math.pow(2, attempt));
        reconnectTimerRef.current = setTimeout(() => {
          try {
            peerInstance.reconnect();
          } catch {}
        }, delay);
      });

      peerInstance.on("error", (err) => {
        console.warn("Peer error:", err);
        if ((err as any)?.type === 'peer-unavailable' || (err as any)?.type === 'network' || (err as any)?.type === 'server-error') {
          setCallState("unavailable");
        }
      });

      setPeer(peerInstance);
    };

    const onVisChange = () => {
      if (typeof document !== "undefined" && document.visibilityState === "visible" && !peerInstance) {
        initPeer();
      }
      if (typeof document !== "undefined" && document.visibilityState === "visible" && peerInstance && reconnectAttemptsRef.current > 0 && reconnectAttemptsRef.current <= 5) {
        try { peerInstance.reconnect(); } catch {}
      }
    };
    if (typeof document !== "undefined") {
      if (document.visibilityState === "visible") initPeer();
      document.addEventListener("visibilitychange", onVisChange);
    } else {
      initPeer();
    }

    return () => {
      if (typeof document !== "undefined") {
        document.removeEventListener("visibilitychange", onVisChange);
      }
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
      if (peerInstance) {
        try { peerInstance.destroy(); } catch {}
      }
    };
  }, [loggedInUser]);

  // Re-register peer ID on route change to ensure reachability
  useEffect(() => {
    if (myPeerId) {
      storePeerId(myPeerId).catch(err => console.error("Failed to re-register peer ID on route change:", err));
    }
  }, [pathname, myPeerId]);

  useEffect(() => {
    callStateRef.current = callState;

    // Sync remote stream to video/audio elements when state changes (and elements become available)
    if (remoteStreamRef.current) {
      if ((callState === "video-connected" || callState === "video-calling") && remoteVideoRef.current) {
        if (remoteVideoRef.current.srcObject !== remoteStreamRef.current) {
          remoteVideoRef.current.srcObject = remoteStreamRef.current;
        }
      }
      // Also ensure audio is connected for audio calls
      if ((callState === "audio-connected" || callState === "audio-calling") && remoteAudioRef.current) {
         if (remoteAudioRef.current.srcObject !== remoteStreamRef.current) {
          remoteAudioRef.current.srcObject = remoteStreamRef.current;
        }
      }
    }
  }, [callState]);

  // Call functions
  const formatCallDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const startCallTimer = () => {
    // prevent double intervals
    if (callTimerRef.current !== null) return;

    // Establish start time so elapsed = now - startTime
    // If callDuration > 0, that means we are resuming: set start = now - elapsed
    callStartRef.current = Date.now() - callDuration * 1000;

    // update frequently enough for UI but not too frequently (250ms is fine)
    callTimerRef.current = window.setInterval(() => {
      if (!callStartRef.current) return;
      const elapsedSeconds = Math.floor((Date.now() - callStartRef.current) / 1000);
      setCallDuration(elapsedSeconds);
    }, 250);
  };

  const stopCallTimer = (reset = true) => {
    if (callTimerRef.current !== null) {
      clearInterval(callTimerRef.current);
      callTimerRef.current = null;
    }

    // If we are pausing (reset === false), keep callStartRef so resume works:
    if (reset) {
      callStartRef.current = null;
      setCallDuration(0);
    } else {
      // pause: keep callDuration, clear start timestamp
      callStartRef.current = null;
    }
  };

  const handleSignal = (msg: any) => {
    console.log("📩 Received signal:", msg);

    if (msg.type === "end-call") {
      console.log("🔴 Remote ended the call");
      endCall(true);
    }

    if (msg.type === "decline-call") {
      console.log("❌ Remote declined the call");
      endCall(true);
    }
  };

  const startAudioCall = async (remoteId: string) => {
    let targetPeerId = remoteId;

    // 🔄 Always fetch fresh Peer ID to ensure we call the current active session
    if (selectedContact?._id) {
      try {
        const response = await fetchPeerId(selectedContact._id, true);
        if (response?.peerId) {
          targetPeerId = response.peerId;
          setRecipientPeerId(response.peerId);
        }
      } catch (err) {
        console.error("Failed to fetch fresh peer ID:", err);
      }
    }

    // Check if peer is ready and not destroyed
    if (!peer || !peer.id || peer.destroyed) {
      setCallState("unavailable");
      return;
    }

    setIsCaller(true);
    // 🔊 Play dial tone immediately on button click
    if (dialToneRef.current) {
      dialToneRef.current.currentTime = 0;
      await dialToneRef.current.play().catch((err) => {
        console.warn("Dial tone blocked:", err);
      });
    }

    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const hasAudio = devices.some((d) => d.kind === "audioinput");
      if (!hasAudio) {
        setCallState("unavailable");
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      localStreamRef.current = stream;

      if (!peer) throw new Error("Peer not initialized");

      if (!targetPeerId) {
        setCallState("unavailable");
        return;
      }
      const call = peer.call(targetPeerId, stream, { metadata: { type: "audio", callerId: myPeerId } });

      // Remote stream
      call.on("stream", (remoteStream) => {
        if (remoteAudioRef.current) remoteAudioRef.current.srcObject = remoteStream;
        setCallState("audio-connected");
        startCallTimer();
        if (unansweredTimeoutRef.current) {
          clearTimeout(unansweredTimeoutRef.current);
          unansweredTimeoutRef.current = null;
        }
      });

      // Handle close
      call.on("close", () => {
        setCallState("ended");
        endCall();
      });

      // Handle error
      call.on("error", () => {
        setCallState("unavailable");
        endCall();
      });

      connRef.current = call;
      setCallState("audio-calling");

      // Save call message after successful call setup
      sendCall("audio");

      // Timeout if unanswered (1 min) - use ref to avoid stale closure
      unansweredTimeoutRef.current = setTimeout(() => {
        if (callStateRef.current === "audio-calling") {
          setCallState("no-answer");
          endCall(true);
        }
      }, 60000);

      dataConnRef.current = peer.connect(targetPeerId);
      dataConnRef.current.on("open", () => {
        console.log("📡 Data channel open with", targetPeerId);
      });

      dataConnRef.current.on("data", (msg: any) => handleSignal(msg));
    } catch (err) {
      console.error("Audio call error:", err);
      setCallState("idle");
    }
  };

  const startVideoCall = async (remoteId: string) => {
    let targetPeerId = remoteId;

    // 🔄 Always fetch fresh Peer ID to ensure we call the current active session
    if (selectedContact?._id) {
      try {
        const response = await fetchPeerId(selectedContact._id, true);
        if (response?.peerId) {
          console.log("Fetched fresh Peer ID:", response.peerId);
          targetPeerId = response.peerId;
          setRecipientPeerId(response.peerId);
        }
      } catch (err) {
        console.error("Failed to fetch fresh peer ID:", err);
      }
    }

    // Check if peer is ready and not destroyed
    if (!peer || !peer.id || peer.destroyed) {
      setCallState("unavailable");
      return;
    }

    setIsCaller(true);
    // 🔊 Play dial tone immediately on button click
    if (dialToneRef.current) {
      dialToneRef.current.currentTime = 0;
      await dialToneRef.current.play().catch((err) => {
        console.warn("Dial tone blocked:", err);
      });
    }
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const hasAudio = devices.some((d) => d.kind === "audioinput");
      const hasVideo = devices.some((d) => d.kind === "videoinput");
      if (!hasAudio && !hasVideo) {
        setCallState("unavailable");
        return;
      }
      let stream: MediaStream;
      let type: "video" | "audio" = "video";
      if (hasAudio && hasVideo) {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
        type = "video";
      } else if (hasAudio && !hasVideo) {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        type = "audio";
      } else {
        stream = await navigator.mediaDevices.getUserMedia({ audio: false, video: true });
        type = "video";
      }
      localStreamRef.current = stream;

      // Local preview
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
        localVideoRef.current.play().catch((err) => console.warn("Local video play blocked:", err));
      }

      if (!peer) throw new Error("Peer not initialized");

      if (!targetPeerId) {
        setCallState("unavailable");
        return;
      }
      const call = peer.call(targetPeerId, stream, { metadata: { type, callerId: myPeerId } });

      // Remote stream
      call.on("stream", (remoteStream) => {
        remoteStreamRef.current = remoteStream;
        if (type === "video") {
          if (remoteVideoRef.current) remoteVideoRef.current.srcObject = remoteStream;
        } else {
          if (remoteAudioRef.current) remoteAudioRef.current.srcObject = remoteStream;
        }
        setCallState(type === "video" ? "video-connected" : "audio-connected");
        startCallTimer();
        if (unansweredTimeoutRef.current) {
          clearTimeout(unansweredTimeoutRef.current);
          unansweredTimeoutRef.current = null;
        }
      });

      // Handle close
      call.on("close", () => {
        setCallState("ended");
        endCall(true);
      });

      // Handle error
      call.on("error", () => {
        setCallState("unavailable");
        endCall(true);
      });

      connRef.current = call;
      setCallState(type === "video" ? "video-calling" : "audio-calling");

      // Save call message after successful call setup
      sendCall("video");

      // Timeout if unanswered (1 min) - use ref to avoid stale closure
      unansweredTimeoutRef.current = setTimeout(() => {
        if (callStateRef.current === "video-calling") {
          setCallState("no-answer");
          endCall(true);
        }
      }, 60000);

      dataConnRef.current = peer.connect(targetPeerId);
      dataConnRef.current.on("open", () => {
        console.log("📡 Data channel open with", targetPeerId);
      });

      dataConnRef.current.on("data", (msg: any) => handleSignal(msg));
    } catch (err) {
      console.error("Video call error:", err);
      setCallState("idle");
    }
  };

  const playRingtone = () => {
    if (ringToneRef.current) {
      ringToneRef.current.currentTime = 0;
      ringToneRef.current.play().catch(() => { });
    }
  };

  const stopDialtone = () => {
    if (dialToneRef.current) {
      dialToneRef.current.pause();
      dialToneRef.current.currentTime = 0;
    }
  };

  const stopRingtone = () => {
    if (ringToneRef.current) {
      ringToneRef.current.pause();
      ringToneRef.current.currentTime = 0;
    }
  };

  const acceptCall = async () => {
    if (!incomingCallRef.current) return;

    const call = incomingCallRef.current;
    const { type } = call.metadata || {};
    const devices = await navigator.mediaDevices.enumerateDevices();
    const hasAudio = devices.some((d) => d.kind === "audioinput");
    const hasVideo = devices.some((d) => d.kind === "videoinput");
    let finalType: "video" | "audio" = type === "video" ? "video" : "audio";
    let constraints: MediaStreamConstraints = { audio: true, video: false };
    if (finalType === "video") {
      if (hasAudio && hasVideo) {
        constraints = { audio: true, video: true };
      } else if (hasAudio && !hasVideo) {
        constraints = { audio: true, video: false };
        finalType = "audio";
      } else if (!hasAudio && hasVideo) {
        constraints = { audio: false, video: true };
        finalType = "video";
      } else {
        setCallState("unavailable");
        return;
      }
    } else {
      if (!hasAudio) {
        setCallState("unavailable");
        return;
      }
      constraints = { audio: true, video: false };
    }

    stopRingtone();

    try {
      const stream = await navigator.mediaDevices.getUserMedia(constraints);

      // Save + show my local video/audio
      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
        localVideoRef.current.play().catch((err) => console.warn("Local play blocked:", err));
      }

      // Accept the call
      call.answer(stream);

      // Handle remote stream
      call.on("stream", (remoteStream: MediaStream) => {
        remoteStreamRef.current = remoteStream;
        if (finalType === "video") {
          if (remoteVideoRef.current) remoteVideoRef.current.srcObject = remoteStream;
        } else {
          if (remoteAudioRef.current) remoteAudioRef.current.srcObject = remoteStream;
        }
      });

      connRef.current = call;
      setCallState(finalType === "video" ? "video-connected" : "audio-connected");
      startCallTimer();
    } catch (err) {
      console.error("Error accepting call:", err);
      setCallState("idle");
    }
  };

  const declineCall = () => {
    if (dataConnRef.current?.open) {
      dataConnRef.current.send({ type: "decline-call" });
    }

    if (incomingCallRef.current) {
      incomingCallRef.current.close();
      incomingCallRef.current = null;
    }

    stopDialtone();
    if (isCaller) {
      sendMissedCall();
    }
    endCall(true);
  };

  const endCall = (forceEnded = false) => {
    if (dataConnRef.current?.open) {
      dataConnRef.current.send({ type: "end-call" });
    }

    setCallState(forceEnded ? "ended" : "idle");
    stopCallTimer();
    setIsMuted(false);
    setIsVideoOff(false);
    setIsCaller(false);

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
    }
    remoteStreamRef.current = null;

    if (localVideoRef.current) localVideoRef.current.srcObject = null;
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
    if (remoteAudioRef.current) remoteAudioRef.current.srcObject = null;

    if (connRef.current) {
      connRef.current.close();
      connRef.current = null;
    }

    if (incomingCallRef.current) {
      incomingCallRef.current.close();
      incomingCallRef.current = null;
    }

    if (dataConnRef.current) {
      dataConnRef.current.close();
      dataConnRef.current = null;
    }

    stopRingtone();
    stopDialtone();
  };

  const toggleMute = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  };

  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoOff(!videoTrack.enabled);
      }
    }
  };

  const sendMissedCall = async () => {
    if (!selectedContact) return;

    const newMessage = {
      id: Array.isArray(messages) ? messages.length + 1 : 1,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      text: `Missed call`,
      type: "missedCall",
    };

    try {
      setMessages((prev: any) => Array.isArray(prev) ? [...prev, newMessage] : [newMessage]);
      const response = await sendMessage(conversationId, newMessage?.text, newMessage?.type, "");
    } catch (error: any) {
      console.log(error);
    }
    setSending(false);
  };

  const sendCall = async (type: string) => {
    if (!selectedContact) return;

    const newMessage = {
      id: Array.isArray(messages) ? messages.length + 1 : 1,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      text: `${type} call`,
      type: `${type}Call`,
    };

    try {
      setMessages((prev: any) => Array.isArray(prev) ? [...prev, newMessage] : [newMessage]);
      const response = await sendMessage(conversationId, newMessage?.text, newMessage?.type, "");
    } catch (error: any) {
      console.log(error);
    }
    setSending(false);
  };

  // Render call overlay
  return (
    <PeerContext.Provider
      value={{
        // 📌 State + setters
        selectedContact,
        setSelectedContact,
        sending,
        setSending,
        loggedInUser,
        messages,
        setMessages,
        conversationId,
        setConversationId,
        isCaller,
        setIsCaller,
        caller,
        setCaller,
        callState,
        setCallState,
        callDuration,
        setCallDuration,
        isMuted,
        setIsMuted,
        isVideoOff,
        setIsVideoOff,
        peer,
        setPeer,
        recipientPeerId,
        setRecipientPeerId,
        myPeerId,
        setMyPeerId,
        callerId,
        setCallerId,

        // 📌 Refs
        connRef,
        localVideoRef,
        remoteVideoRef,
        remoteAudioRef,
        callTimerRef,
        callStartRef,
        localStreamRef,
        incomingCallRef,
        unansweredTimeoutRef,
        dialToneRef,
        ringToneRef,
        dataConnRef,
        isDataConnected,

        // 📌 Functions
        formatCallDuration,
        startCallTimer,
        stopCallTimer,
        handleSignal,
        startAudioCall,
        startVideoCall,
        playRingtone,
        stopDialtone,
        stopRingtone,
        acceptCall,
        declineCall,
        endCall,
        toggleMute,
        toggleVideo,
        sendMissedCall,
        sendCall,
        openChatConnection,
        sendChatMessage,
        onChatMessage,
      }}>
      {children}
      <CallOverlay />
    </PeerContext.Provider>
  );
};

export const usePeerContext = () => {
  const ctx = useContext(PeerContext);
  if (!ctx) throw new Error("usePeerContext must be used within PeerProvider");
  return ctx;
};
