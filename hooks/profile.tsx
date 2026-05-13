import Cookies from "js-cookie";
import axiosInstance from "../lib/axios";

export const getProfile = async () => {
  const token = Cookies.get("token");
  if (!token) {
    throw new Error("Token is required");
  }
  const response = await axiosInstance.get("/api/auth/me", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

export async function updateProfile(data: any) {
  const token = Cookies.get("token");
  if (!token) {
    throw new Error("Token is required");
  }

  const isFormData = typeof FormData !== "undefined" && data instanceof FormData;
  const hasFile = !isFormData && Object.values(data || {}).some((v) => {
    if (typeof File !== "undefined" && v instanceof File) return true;
    if (typeof Blob !== "undefined" && v instanceof Blob) return true;
    if (Array.isArray(v)) {
      return v.some(item => (typeof File !== "undefined" && item instanceof File) || (typeof Blob !== "undefined" && item instanceof Blob));
    }
    return false;
  });

  let body: any = data;
  let headers: Record<string, string> = { Authorization: `Bearer ${token}` } as any;

  if (isFormData || hasFile) {
    const fd = isFormData ? (data as FormData) : new FormData();
    if (!isFormData) {
      Object.keys(data || {}).forEach((key) => {
        const value: any = data[key];
        if (typeof File !== "undefined" && value instanceof File) {
          fd.append(key, value);
        } else if (typeof Blob !== "undefined" && value instanceof Blob) {
          fd.append(key, value);
        } else if (Array.isArray(value)) {
          value.forEach((item) => {
            if (typeof File !== "undefined" && item instanceof File) {
              fd.append(key, item);
            } else if (typeof Blob !== "undefined" && item instanceof Blob) {
              fd.append(key, item);
            } else if (typeof item === 'object' && item !== null) {
               fd.append(key, JSON.stringify(item));
            } else {
              fd.append(key, String(item));
            }
          });
        } else if (typeof value === 'object' && value !== null) {
            fd.append(key, JSON.stringify(value));
        } else if (value !== undefined && value !== null) {
          fd.append(key, String(value));
        }
      });
    }
    body = fd;
    headers = { ...headers, "Content-Type": "multipart/form-data" } as any;
  }

  const res = await axiosInstance.put("/api/auth/profile", body, { headers });

  return res.data;
}

export async function updatePassword(data: any) {
  const res = await axiosInstance.post("/api/auth/changePassword", data);
  return res.data;
}

export const getProfileById = async (id: any) => {
  const token = Cookies.get("token");
  if (!token) {
    throw new Error("Token is required");
  }
  const response = await axiosInstance.get(`/api/auth/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};
