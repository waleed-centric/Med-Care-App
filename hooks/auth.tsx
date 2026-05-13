import { z } from "zod";
import Cookies from "js-cookie";
import axiosInstance from "../lib/axios";

export const loginFormSchema = z.object({
	email: z.string().min(1, "Email is required").email("Enter a valid email"),
	password: z.string().min(6, "Password must be at least 6 characters"),
	rememberMe: z.boolean().optional(),
});

export type LoginFormValues = z.infer<typeof loginFormSchema>;

export type User = {
	id: string;
	status: string;
	email: string;
	firstName: string;
	lastName: string;
	username: string;
	role: string;
	createdAt: string;
	updatedAt: string;
};

export type LoginResponse = {
	user: User;
	token: string;
};

export const login = async (data: LoginFormValues): Promise<LoginResponse> => {
	const response = await axiosInstance.post("/api/auth/login", {
		email: data.email.trim(),
		password: data.password,
		rememberMe: data.rememberMe ?? false,
	});
	const { token } = response.data;

	Cookies.set("token", token, {
		secure: true,
		sameSite: "strict",
		expires: 7,
	});

	const userResponse = await axiosInstance.get("/api/auth/me", {
		headers: {
			Authorization: `Bearer ${token}`,
		},
	});

	const user = userResponse.data;

	Cookies.set(
		"user",
		JSON.stringify({
			id: user._id,
			email: user.email,
			role: user.role,
			status: user.status,
			avatarUrl: user.avatarUrl,
		}),
		{
			secure: true,
			sameSite: "strict",
			expires: 7,
		}
	);

	return { user, token };
};

export const logout = async (redirect: boolean = true) => {
    try { await updateOnlineStatus(false); } catch {}
    Cookies.remove("token");
    Cookies.remove("user");
    if (typeof window !== "undefined") {
        localStorage.clear(); // Clear all local storage
        if (redirect) {
            window.location.href = "/";
        }
    }
};

export const getStoredUser = (): User | null => {
	const userStr = Cookies.get("user");
	return userStr ? JSON.parse(userStr) : null;
};

export const isAuthenticated = (): boolean => {
	return !!Cookies.get("token");
};

export const isAdmin = (): boolean => {
	const user = getStoredUser();
	return user?.role === "ADMIN";
};

export const sendForgotPassword = async (data: {
	email: string;
}): Promise<{ message: string; resetToken?: string }> => {
	const response = await axiosInstance.post("/api/auth/request-reset", {
		email: data.email,
	});
	return response.data;
};

export const sendResetPassword = async (data: {
    newPassword: string;
    resetToken: string;
  }): Promise<{ message: string }> => {
  const response = await axiosInstance.post("/api/auth/reset-password", {
    newPassword: data.newPassword,
    resetToken: data.resetToken,
  });
  return response.data;
};

export const marketerSignUp = async (data: any) => {
	const response = await axiosInstance.post("/api/auth/signup", data);
	return response.data;
};

export const registerPatient = async (formData: FormData) => {
	const response = await axiosInstance.post("/api/auth/register-patient", formData, {
		headers: {
			"Content-Type": "multipart/form-data",
		},
	});
	return response.data;
};

export const sendOtp = async (data: {
	email: string;
}): Promise<{ message: string }> => {
	const response = await axiosInstance.post("/api/auth/send-otp", {
		email: data.email,
	});
	return response.data;
};

export const verifyOtp = async (data: {
    email: string;
    code: string;
}): Promise<{ token?: string; message: string }> => {
    const payload: any = {
        email: data.email,
        code: data.code,
    };
    const response = await axiosInstance.post("/api/auth/verify-signup", payload);
    return response.data;
};

export const updateOnlineStatus = async (online: boolean): Promise<{ online: boolean }> => {
    const response = await axiosInstance.patch("/api/auth/online", { online });
    return response.data;
};

export const updateAvailability = async (available: boolean): Promise<{ available: boolean }> => {
    const response = await axiosInstance.patch("/api/auth/availability", { available });
    return response.data;
};

export const getAvailability = async (): Promise<{ available: boolean }> => {
    const response = await axiosInstance.get("/api/auth/availability");
    return response.data;
};
