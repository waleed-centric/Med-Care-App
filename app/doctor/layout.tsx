"use client";

import React, { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import DoctorHeader from "@/components/DoctorHeader";
import Footer from "@/components/Footer";
import Cookies from "js-cookie";

const DoctorLayout = ({ children }: { children: React.ReactNode }) => {
  const [loggedInUser, setLoggedInUser] = useState<any>(null);
  const pathname = usePathname();
  const isDashboard = pathname === "/doctor/dashboard";
  const isPatients = pathname === "/doctor/patients";
  const isSchedule = pathname === "/doctor/schedule";
  const isChats = pathname === "/doctor/chats";
  const isGetAssessment = pathname === "/doctor/get-assessment";
  const isSeeTherapist = pathname === "/doctor/see-therapist";

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

  // Dashboard, Clients, Schedule, Chats, Get Assessment, and See Therapist have their own layouts, so render children directly
  if (isDashboard || isPatients || isSchedule || isChats || isGetAssessment || isSeeTherapist) {
    return (
      <>{children}</>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gray-50">
        {/* <DoctorHeader /> */}
        <main className="w-full">{children}</main>
      </div>
      <Footer />
    </>
  );
};

export default DoctorLayout;
