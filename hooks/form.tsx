import Cookies from "js-cookie";
import axiosInstance from "../lib/axios";

export const newForm = async (form: any) => {
  const token = Cookies.get("token");
  if (!token) {
    throw new Error("Token is required");
  }
  const response = await axiosInstance.post("/api/forms", {
    form,
  });
  return response.data;
}; 

export const seeAllPendingForms = async () => {
  const token = Cookies.get("token");
  if (!token) {
    throw new Error("Token is required");
  }

  let response;

  response = await axiosInstance.get("/api/forms/open/all", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response?.data;
};

export const seeFormDetails = async (link: string) => {
  const token = Cookies.get("token");
  if (!token) {
    throw new Error("Token is required");
  }

  let response;
  const formId = link.split("/").pop();
  console.log(formId);

  response = await axiosInstance.get(`/api/forms/${formId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response?.data;
};
