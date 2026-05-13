"use client";

import {
	activeMessages,
	contactMessage,
	contactMessageHistory,
	fetchPeerId,
	messageContacts,
	sendMessage,
	storePeerId,
} from "@/hooks/messages";
import React, {
	createContext,
	useContext,
	useEffect,
	useRef,
	useState,
} from "react";
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
} from "lucide-react";
import ContactModal from "@/components/ContactModal";
import Peer, { MediaConnection } from "peerjs";
import Cookies from "js-cookie";
import { format } from "date-fns";
import { getProfileById } from "@/hooks/profile";
import Link from "next/link";
import { socket } from "@/lib/socket";
import { usePeerContext } from "@/context/CallProvider";

export default function CallOverlay() {
	const {
		// 📌 State + setters
		selectedContact,
		loggedInUser,
		setMessages,
		conversationId,
		isCaller,
		caller,
		setCaller,
		callState,
		setCallState,
		callDuration,
		isMuted,
		isVideoOff,
		setPeer,
		setRecipientPeerId,
		setMyPeerId,
		callerId,
		setCallerId,

		// 📌 Refs
		localVideoRef,
		remoteVideoRef,
		remoteAudioRef,
		callTimerRef,
		localStreamRef,
		incomingCallRef,
		dialToneRef,
		ringToneRef,

		// 📌 Functions
		formatCallDuration,
		stopCallTimer,
		acceptCall,
		declineCall,
		endCall,
		toggleMute,
		toggleVideo,
		sendMissedCall,
	} = usePeerContext();



	// Initialize ringtone once
	useEffect(() => {
		dialToneRef.current = new Audio("/sounds/dialtone.wav");
		dialToneRef.current.loop = true;

		ringToneRef.current = new Audio("/sounds/ringtone.wav");
		ringToneRef.current.loop = true;
	}, []);

		const audioUnlockedRef = useRef(false);

useEffect(() => {
    const tryUnlock = async () => {
        if (audioUnlockedRef.current) return;

        const audios: HTMLAudioElement[] = [dialToneRef.current, ringToneRef.current].filter(Boolean) as HTMLAudioElement[];
        for (const a of audios) {
            try {
                a.muted = true;
                await a.play();
                a.pause();
                a.currentTime = 0;
            } catch (e) {
                // ignore – we'll try other gestures
            } finally {
                a.muted = false;
            }
        }
        audioUnlockedRef.current = true;
    };

    // Use once listeners for common gestures
    document.addEventListener("click", tryUnlock, { once: true });
    document.addEventListener("touchstart", tryUnlock, { once: true });
    document.addEventListener("keydown", tryUnlock, { once: true });

    return () => {
        document.removeEventListener("click", tryUnlock as EventListener);
        document.removeEventListener("touchstart", tryUnlock as EventListener);
        document.removeEventListener("keydown", tryUnlock as EventListener);
    };
}, []);

	// connection check
	useEffect(() => {
		if (callState !== "audio-connected" && callState !== "video-connected")
			return;

		const timeout = setTimeout(() => {
			// Local tracks
			const localTracks = localStreamRef.current?.getTracks() || [];
			const localHasMedia = localTracks.some(
				(t: any) =>
					t.readyState === "live" && (t.kind === "audio" || t.kind === "video")
			);

			let remoteHasMedia = false;
			const vStream = (remoteVideoRef.current?.srcObject ?? null) as any;
			const aStream = (remoteAudioRef.current?.srcObject ?? null) as any;
			const s = vStream instanceof MediaStream ? vStream : (aStream instanceof MediaStream ? aStream : null);
			if (s) {
				const remoteTracks = s.getTracks();
				remoteHasMedia = remoteTracks.some(
					(t) => t.readyState === "live" && (t.kind === "audio" || t.kind === "video")
				);
			}

			if (!localHasMedia || !remoteHasMedia) {
				console.warn("⚠️ Media missing, but keeping call alive (auto-disconnect disabled)...");
				// setCallState("connecting");

				// End call after another 10s if media still missing
				setTimeout(() => {
					const stillNoLocal = !(
						localStreamRef.current?.getTracks() || []
					).some((t: any) => t.readyState === "live");
					const stillNoRemote = !(
						remoteVideoRef.current?.srcObject instanceof MediaStream &&
						(remoteVideoRef.current?.srcObject as MediaStream)
							.getTracks()
							.some((t) => t.readyState === "live")
					);

					if (stillNoLocal || stillNoRemote) {
						console.warn(
							"❌ Media still missing after grace period, but not ending call automatically."
						);
						// setCallState("ended");
						// endCall(true);
					}
				}, 10000);
			} else {
				console.log("✅ Both peers have active media tracks.");
			}
		}, 10000);

		return () => clearTimeout(timeout);
	}, [callState]);



	useEffect(() => {
		let timeout: NodeJS.Timeout;

		if (callState === "ended") {
			timeout = setTimeout(() => {
				setCallState("idle");
			}, 3000); // 3 seconds
		}

		return () => clearTimeout(timeout);
	}, [callState]);

	// useEffect(() => {
	// 	if (!callerId) return;
	// 	console.log(callerId);
	// 	const getCallerInfo = async () => {
	// 		try {
	// 			const response = await getProfileById(callerId);
	// 			setCaller(response);
	// 		} catch (error) {
	// 			console.log(error);
	// 			endCall(true);
	// 		}
	// 	};

	// 	getCallerInfo();
	// }, [callerId]);

	useEffect(() => {
		const playIfUnlocked = async (audio?: HTMLAudioElement | null) => {
			if (!audio) return;
			if (audioUnlockedRef.current) {
				try {
					await audio.play();
				} catch (e) {
					// swallow – user gesture may still be required
				}
			} else {
				// Not unlocked yet; do nothing. The global unlock handler will
				// allow future plays once the user interacts with the page.
				console.warn("Audio locked: will play after user interaction");
			}
		};

		if (
			(callState === "audio-calling" || callState === "video-calling") &&
			callerId === loggedInUser?.id
		) {
			// Caller hears dial tone
			playIfUnlocked(dialToneRef.current);
		} else {
			dialToneRef.current?.pause();
			dialToneRef.current!.currentTime = 0;
		}

		if (callState === "ringing" && callerId !== loggedInUser?.id) {
			// Callee hears ringtone
			playIfUnlocked(ringToneRef.current);
		} else {
			ringToneRef.current?.pause();
			ringToneRef.current!.currentTime = 0;
		}

		if (
			callState === "ended" ||
			callState === "idle" ||
			callState === "no-answer"
		) {
			dialToneRef.current?.pause();
			ringToneRef.current?.pause();
			if (dialToneRef.current) dialToneRef.current.currentTime = 0;
			if (ringToneRef.current) ringToneRef.current.currentTime = 0;
		}
	}, [callState, callerId, loggedInUser]);

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
		const interval = setInterval(fetchUpdatedConversation, 5000);
		return () => clearInterval(interval);
	}, [conversationId]);



	// Cleanup on unmount
	useEffect(() => {
		return () => {
			if (callTimerRef.current) {
				clearInterval(callTimerRef.current);
			}
			if (localStreamRef.current) {
				localStreamRef.current
					.getTracks()
					.forEach((track: any) => track.stop());
			}
		};
	}, []);


	// Show local video preview as soon as video call starts (calling or connected)
	useEffect(() => {
		if (
			(callState === "video-calling" || callState === "video-connected") &&
			localVideoRef.current &&
			localStreamRef.current
		) {
			if (localVideoRef.current.srcObject !== localStreamRef.current) {
				localVideoRef.current.srcObject = localStreamRef.current;
			}
		} else if (localVideoRef.current) {
			localVideoRef.current.srcObject = null;
		}
	}, [callState, localStreamRef]);

	// Render call overlay
	if (callState === "idle") return null;
	if (
		(callState === "unavailable" && !isCaller) ||
		(callState === "disconnected" && !isCaller)
	)
		return null;

	return (
		<div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex flex-col items-center justify-center text-white">
			<div className="text-center mb-8 relative z-10">
				<img
					src={
						isCaller
							? selectedContact?.avatar || "/images/avatar.PNG"
							: caller?.avatar || "/images/avatar.PNG"
					}
					alt={isCaller ? selectedContact?.firstname : caller?.firstname}
					className="w-32 h-32 rounded-full mx-auto mb-4"
				/>
				{/* <h2 className="text-2xl font-semibold mb-2">
            {selectedContact?.firstname} {selectedContact?.lastname}
        </h2> */}
				<h3>
					{isCaller ? selectedContact?.firstname : caller?.firstname}{" "}
					{isCaller ? selectedContact?.lastname : caller?.lastname}
				</h3>
				{callState === "audio-calling" ||
					(callState === "video-calling" && <h3>Calling</h3>)}
				{callState === "audio-connected" ||
					(callState === "video-connected" && <h3>In call</h3>)}
				{callState === "connecting" && <h3>Connecting</h3>}
				{callState === "ended" && <h3>Call disconnected</h3>}
				<p className="text-lg text-white">
					{callState === "ringing" && "Incoming call…"}
					{callState === "audio-connected" &&
						`Audio call • ${formatCallDuration(callDuration)}`}
					{callState === "video-connected" && formatCallDuration(callDuration)}
					{callState === "no-answer" && "Recipient did not pick up"}
					{callState === "unavailable" && "Recipient unavailable"}
					{callState === "disconnected" && "Reconnecting..."}
				</p>
			</div>

			{(callState === "video-calling" || callState === "video-connected") && (
				<div className="absolute inset-0 w-full h-full">
					<video
						ref={remoteVideoRef}
						autoPlay
						playsInline
						className="w-full h-full object-cover bg-black"
					/>
					<video
						ref={localVideoRef}
						autoPlay
						muted
						playsInline
						className="absolute top-4 right-4 w-48 h-36 object-cover rounded-xl border-4 border-white shadow-2xl bg-black"
					/>
				</div>
			)}
			<audio ref={remoteAudioRef} autoPlay className="hidden" />
			{callState !== "ringing" && (
				<div className="flex items-center gap-6 relative z-10">
					<button
						onClick={toggleMute}
						className={`p-4 rounded-full ${isMuted ? "bg-red-500" : "bg-gray-600"
							} hover:bg-opacity-80 transition-colors`}
					>
						{isMuted ? (
							<MicOff className="w-6 h-6" />
						) : (
							<Mic className="w-6 h-6" />
						)}
					</button>

					{(callState === "video-calling" ||
						callState === "video-connected") && (
							<button
								onClick={toggleVideo}
								className={`p-4 rounded-full ${isVideoOff ? "bg-red-500" : "bg-gray-600"
									} hover:bg-opacity-80 transition-colors`}
							>
								{isVideoOff ? (
									<VideoOff className="w-6 h-6" />
								) : (
									<Video className="w-6 h-6" />
								)}
							</button>
						)}

					<button
						onClick={() => endCall()}
						className="p-4 rounded-full bg-red-500 hover:bg-red-600 transition-colors"
					>
						<PhoneOff className="w-6 h-6" />
					</button>
				</div>
			)}

			{callState === "ringing" && (
				<div className="flex items-center gap-6 relative z-10">
					<button
						onClick={acceptCall}
						className="p-4 rounded-full bg-green-500 hover:bg-green-600 transition-colors"
					>
						<Phone className="w-6 h-6" />
					</button>
					<button
						onClick={declineCall}
						className="p-4 rounded-full bg-red-500 hover:bg-red-600 transition-colors"
					>
						<PhoneOff className="w-6 h-6" />
					</button>
				</div>
			)}
		</div>
	);
}
