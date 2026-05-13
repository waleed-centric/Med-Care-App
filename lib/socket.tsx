// socket.ts
import { io } from "socket.io-client";

// derive socket url: prefer explicit env, else current origin, else localhost:3000
const SOCKET_URL =
  process.env.NEXT_PUBLIC_SOCKET_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  (typeof window !== "undefined" ? window.location.origin : "http://localhost:3000");

export const socket = io(SOCKET_URL, {
  withCredentials: true,
  autoConnect: true,
  transports: ["websocket"],
  path: "/socket.io",
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
});
