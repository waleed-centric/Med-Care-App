"use client";

import { useEffect, useRef, useState } from "react";
import Cookies from "js-cookie";
import { usePeerContext } from "@/context/CallProvider";
import { Button } from "@/components/ui/button";

function PeerChatInner() {
  const {
    myPeerId,
    dataConnRef,
    isDataConnected,
    openChatConnection,
    sendChatMessage,
    onChatMessage,
    startAudioCall,
    startVideoCall,
    localVideoRef,
    remoteVideoRef,
  } = usePeerContext();

  const [remoteId, setRemoteId] = useState("");
  
  const [chatInput, setChatInput] = useState("");
  const [chat, setChat] = useState<{ from: "me" | "remote"; text: string; t: number }[]>([]);

  const connectDataChannel = () => {
    if (!remoteId.trim()) return;
    openChatConnection(remoteId);
  };

  const sendChat = () => {
    const text = chatInput.trim();
    if (!text) return;
    if (dataConnRef.current?.open) {
      sendChatMessage(text);
      setChat((prev) => [...prev, { from: "me", text, t: Date.now() }]);
      setChatInput("");
    }
  };

  useEffect(() => {
    const unsub = onChatMessage((msg: any) => {
      const text = typeof msg === "string" ? msg : msg?.text ?? "";
      if (!text) return;
      setChat((prev) => [...prev, { from: "remote", text, t: Date.now() }]);
    });
    return () => {
      if (typeof unsub === "function") unsub();
    };
  }, [onChatMessage]);

  return (
    <div className="p-6 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="space-y-3">
          <div className="p-4 bg-white rounded-xl border">
            <p className="text-sm">My Peer ID</p>
            <p className="text-base font-semibold">{myPeerId || "—"}</p>
          </div>
          <div className="p-4 bg-white rounded-xl border space-y-3">
            <input
              value={remoteId}
              onChange={(e) => setRemoteId(e.target.value)}
              placeholder="Remote Peer ID"
              className="w-full px-3 py-2 border rounded"
            />
            <Button onClick={connectDataChannel} disabled={!remoteId.trim()}>
              {isDataConnected ? "Connected" : "Connect"}
            </Button>
            <div className="flex gap-2">
              <Button onClick={() => remoteId && startAudioCall(remoteId)} disabled={!remoteId.trim()}>
                Start Audio
              </Button>
              <Button onClick={() => remoteId && startVideoCall(remoteId)} disabled={!remoteId.trim()}>
                Start Video
              </Button>
            </div>
          </div>
        </div>

        <div className="md:col-span-2 p-4 bg-white rounded-xl border">
          <div className="h-64 overflow-y-auto space-y-2 mb-3">
            {chat.map((m, i) => (
              <div key={i} className={`flex ${m.from === "me" ? "justify-end" : "justify-start"}`}>
                <div className="px-3 py-2 rounded-lg bg-[#F3F4F6]">
                  <span className="text-sm">{m.text}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Type message"
              className="flex-1 px-3 py-2 border rounded"
            />
            <Button onClick={sendChat} disabled={!isDataConnected || !chatInput.trim()}>Send</Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-4 bg-black rounded-xl h-64">
          <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-contain" />
        </div>
        <div className="p-4 bg-black rounded-xl h-64">
          <video ref={localVideoRef} autoPlay muted playsInline className="w-full h-full object-contain" />
        </div>
      </div>
    </div>
  );
}

export default function PeerChatPage() {
  return (
    <PeerChatInner />
  );
}