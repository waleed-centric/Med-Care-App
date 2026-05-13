import Cookies from "js-cookie";
import axiosInstance from "../lib/axios";

export const seeAllNotifications = async () => {
  const token = Cookies.get("token");
  if (!token) {
    throw new Error("Token is required");
  }

  let response;

  response = await axiosInstance.get("api/notifications", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response?.data;
};
