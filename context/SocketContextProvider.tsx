import { getStoredUser, updateOnlineStatus } from "@/hooks/auth";
import Cookies from "js-cookie";
import React, { createContext, useContext, useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";

/**
 * Create the context
 * use the context -> useContext(socketCxt)
 */
type SocketContextType = Socket | null;
const SocketContext = createContext<SocketContextType>(null);
export const useSocketContext = () => useContext(SocketContext);
export default function SocketContextProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [socket, setSocket] = useState<SocketContextType>(null);
  const user = getStoredUser();
  useEffect(() => {
    const url =
      process.env.NEXT_PUBLIC_API_URL ||
      (typeof window !== "undefined" ? window.location.origin : "http://localhost:3000");
    const socketInstance = io(url, {
      transports: ["websocket"],
      withCredentials: true,
      path: "/socket.io",
    });
    setSocket(socketInstance);
    return () => {
      socketInstance.disconnect();
    };
  }, []);
  useEffect(() => {
    if (!user?.id || !socket) return;
    socket.emit("register_user", {
      userId: user?.id,
    });

    socket?.on("connect_error", (error: Error) => {
      return error;
    });
    socket?.on("user_joined", (data) => {
      console.log("user_joined:", data);
    });

    return () => {
      socket.off("connect_error");
      socket.off("user_joined");
    };
  }, [user?.id, socket]);

  useEffect(() => {
    if (!socket || !user?.id) return;
    const getOverride = () => {
      try {
        return typeof window !== "undefined" ? window.localStorage.getItem("presence_override") : null;
      } catch { return null; }
    };
    const setTrue = () => {
      const ov = getOverride();
      const val = ov === "true" ? true : ov === "false" ? false : true;
      updateOnlineStatus(val).catch(() => {});
    };
    const setFalse = () => {
      const ov = getOverride();
      const val = ov === "true" ? true : ov === "false" ? false : false;
      updateOnlineStatus(val).catch(() => {});
    };
    const onVis = () => {
      if (typeof document === "undefined") return;
      const ov = getOverride();
      if (ov === "true" || ov === "false") {
        updateOnlineStatus(ov === "true").catch(() => {});
        return;
      }
      if (document.visibilityState === "visible") setTrue();
      else setFalse();
    };
    const sendOffline = () => {
      try {
        const token = Cookies.get("token") || (typeof window !== "undefined" ? localStorage.getItem("token") : "");
        const base = process.env.NEXT_PUBLIC_API_URL || "";
        const url = `${base.replace(/\/$/, "")}/api/auth/online`;
        const body = JSON.stringify({ online: false });
        fetch(url, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body,
          keepalive: true,
        }).catch(() => {});
      } catch {}
    };
    setTrue();
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("beforeunload", sendOffline);
    window.addEventListener("pagehide", sendOffline);
    socket.on("connect", setTrue);
    socket.on("disconnect", setFalse);
    return () => {
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("beforeunload", sendOffline);
      window.removeEventListener("pagehide", sendOffline);
      socket.off("connect", setTrue);
      socket.off("disconnect", setFalse);
    };
  }, [socket, user?.id]);
  return (
    <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>
  );
}
