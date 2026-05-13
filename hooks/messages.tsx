import Cookies from "js-cookie";
import axiosInstance from "../lib/axios";
const peerIdCache = new Map<string, { value: any; expiresAt: number }>();
const peerIdPending = new Map<string, Promise<any>>();

export const messageContacts = async () => {
  const token = Cookies.get("token");
  if (!token) {
    throw new Error("Token is required");
  }
  const response = await axiosInstance.get("/api/auth/messaging", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

export const activeMessages = async () => {
  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("token") || Cookies.get("token")
      : Cookies.get("token");
  const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
  const response = await axiosInstance.get("/api/conversations", { headers });
  return response.data;
};

export const contactMessage = async (recipientId: any) => {
  if (!recipientId) {
    throw new Error("Conversation ID is required");
  }
  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("token") || Cookies.get("token")
      : Cookies.get("token");
  const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
  const response = await axiosInstance.post(`/api/conversations`, { recipientId }, { headers });
  return response.data;
};

export const storePeerId = async (peerId: any) => {
  const token = Cookies.get("token");
  if (!token) {
    throw new Error("Token is required");
  }
  const response = await axiosInstance.post(
    `/api/call/peer`,
    { peerId },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  return response.data;
};

export const fetchPeerId = async (recipientId: any, bypassCache = false) => {
  const token = Cookies.get("token");
  if (!token) {
    throw new Error("Token is required");
  }
  const key = String(recipientId || "");
  const now = Date.now();
  const ttlMs = 120000;
  const cached = peerIdCache.get(key);
  if (!bypassCache && cached && cached.expiresAt > now && cached.value?.peerId) {
    return cached.value;
  }
  const inFlight = peerIdPending.get(key);
  if (inFlight) {
    return inFlight;
  }
  const req = axiosInstance.get(`/api/call/peer/${recipientId}`).then((response) => {
    const data = response.data;
    peerIdCache.set(key, { value: data, expiresAt: now + ttlMs });
    peerIdPending.delete(key);
    return data;
  }).catch((err) => {
    peerIdPending.delete(key);
    throw err;
  });
  peerIdPending.set(key, req);
  return req;
};

export const contactMessageHistory = async (conversationId: any) => {
  if (!conversationId) {
    throw new Error("Conversation ID is required");
  }
  
  const token = typeof window !== "undefined"
    ? localStorage.getItem("token") || Cookies.get("token")
    : Cookies.get("token");
    
  if (!token) {
    throw new Error("Token is required");
  }

  const response = await axiosInstance.get(`/api/messages/${conversationId}`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  
  return response.data;
};

export const usersList = async () => {
  const token = Cookies.get("token");
  if (!token) {
    throw new Error("Token is required");
  }
  const response = await axiosInstance.get("/api/users", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

export const sendMessage = async (conversationId: string, text: string, type: string, url: string) => {
  const token = Cookies.get("token");
  if (!token) {
    throw new Error("Token is required");
  }

  const response = await axiosInstance.post(
    "/api/messages",
    {
      conversationId,
      text,
      type,
      url,
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data;
};

export const deleteMessage = async (id: any) => {
  const token = Cookies.get("token");
  if (!token) {
    throw new Error("Token is required");
  }

  const response = await axiosInstance.delete(`/api/messages/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.data;
};

export const deleteConvo = async (id: any) => {
  const token = Cookies.get("token");
  if (!token) {
    throw new Error("Token is required");
  }

  const response = await axiosInstance.delete(`/api/conversations/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.data;
};
