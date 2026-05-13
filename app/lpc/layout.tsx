"use client";
 
import React, { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Footer from "@/components/Footer";
import Cookies from "js-cookie";

const LPCLayout = ({ children }: { children: React.ReactNode }) => {
  const [loggedInUser, setLoggedInUser] = useState<any>(null);
  const pathname = usePathname();
  const isDashboard = pathname === "/lpc/dashboard";
  const isPatients = pathname === "/lpc/patients";
  const isSchedule = pathname === "/lpc/schedule";
  const isChats = pathname === "/lpc/messages";
  const isGetAssessment = pathname === "/lpc/get-assessment";
  const isSeeTherapist = pathname === "/lpc/see-therapist";
  const isProfile = pathname === "/lpc/profile";

  // get user from cookies
  useEffect(() => {
    if (!loggedInUser) {
      const user = Cookies.get("user");
      if (user) {
        try {
          const parsedUser = JSON.parse(user);
          setLoggedInUser(parsedUser);
        } catch (err) {
          console.error("Failed to parse user cookie", err);
        }
      }
    }
  }, [loggedInUser]);

  // Dashboard, Clients, Schedule, Chats, Get Assessment, See Therapist, and Profile have their own layouts
  if (isDashboard || isPatients || isSchedule || isChats || isGetAssessment || isSeeTherapist || isProfile) {
    return (
      <>{children}</>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gray-50">
        <main className="w-full">{children}</main>
      </div>
      <Footer />
    </>
  );
};

export default LPCLayout;
