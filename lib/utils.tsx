import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import Cookies from "js-cookie";
import { updateOnlineStatus } from "@/hooks/auth";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
} 
 
export const logout = async () => {
    try {
        const res = await updateOnlineStatus(false);
        if (res?.online === false) {
            Cookies.remove("token");
            Cookies.remove("user");
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            window.location.href = "/";
            return;
        }
    } catch {}
    // Fallback: still clear local auth and redirect
    Cookies.remove("token");
    Cookies.remove("user");
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/";
};
