import axiosInstance from "../lib/axios";
import { User } from "./auth";
import Cookies from "js-cookie";

export type SignupResponse = {
  message: string;
  user?: User;
  token?: string;
};

export type DoctorRegistrationData = {
  firstname: string;
  lastname: string;
  email: string;
  phone: string;
  password: string;
  role: string;
  sex?: string;
  dateOfBirth?: string;
  streetAddress?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  workExperience?: number;
  specialization?: string;
  availabilityDays?: string[];
  availabilityFrom?: string;
  availabilityTo?: string;
  services?: string[];
  education?: string;
  about?: string;
  avatar?: File;
  certificates?: File[];
};

export const registerDoctor = async (data: DoctorRegistrationData): Promise<SignupResponse> => {
  console.log("registration data", data);
  try {
    // Create FormData for multipart/form-data request
    const formData = new FormData();

    // Add required fields
    formData.append("firstname", data.firstname);
    formData.append("lastname", data.lastname);
    formData.append("email", data.email);
    formData.append("phone", data.phone);
    formData.append("password", data.password);
    formData.append("role", data.role || "doctor");

    // Add optional fields if they exist
    if (data.sex) formData.append("sex", data.sex);
    if (data.dateOfBirth) formData.append("dateOfBirth", data.dateOfBirth);
    if (data.streetAddress) formData.append("streetAddress", data.streetAddress);
    if (data.city) formData.append("city", data.city);
    if (data.state) formData.append("state", data.state);
    if (data.zipCode) formData.append("zipCode", data.zipCode);
    if (data.workExperience) formData.append("workExperience", data.workExperience.toString());
    if (data.specialization) formData.append("specialization", data.specialization);
    if (data.education) formData.append("education", data.education);
    if (data.about) formData.append("about", data.about);

    // Add Availability
    if (data.availabilityDays && data.availabilityDays.length > 0) {
      formData.append("availabilityDays", JSON.stringify(data.availabilityDays));
    }
    if (data.availabilityFrom) formData.append("availabilityFrom", data.availabilityFrom);
    if (data.availabilityTo) formData.append("availabilityTo", data.availabilityTo);

    // Add services array as comma-separated string
    if (data.services && data.services.length > 0) {
      formData.append("services", data.services.join(","));
    }

    // Add avatar file if exists
    if (data.avatar) {
      formData.append("avatar", data.avatar);
    }

    // Add certificate files if exist
    if (data.certificates && data.certificates.length > 0) {
      data.certificates.forEach((cert) => {
        formData.append("certificates", cert);
      });
    }

    const response = await axiosInstance.post("/api/auth/signup", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    // Store token in cookies
    if (response.data.token) {
      Cookies.set("token", response.data.token, {
        secure: true,
        sameSite: "strict",
        expires: 7,
      });

      // Store user data in cookies
      const user = response.data.user;
      Cookies.set("user", JSON.stringify({
        id: user._id,
        email: user.email,
        role: user.role,
        status: user.status,
      }), {
        secure: true,
        sameSite: "strict",
        expires: 7,
      });
    }

    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || error.response?.data?.error || "Registration failed");
  }
};
