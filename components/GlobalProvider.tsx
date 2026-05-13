"use client";

import React, { useEffect, useState } from "react";
import Cookies from "js-cookie";
import { PeerProvider } from "@/context/CallProvider";
import SocketContextProvider from "@/context/SocketContextProvider";
import { SnackbarProvider } from "notistack";

export default function GlobalProvider({ children, initialUser }: { children: React.ReactNode; initialUser?: any }) {
  const [loggedInUser, setLoggedInUser] = useState<any>(initialUser || null);

  // Get user from cookies
  useEffect(() => {
    // Only check if we didn't get initialUser (or to double check / handle updates)
    if (!loggedInUser) {
      const checkUser = () => {
        const user = Cookies.get("user");
        if (user) {
          try {
            const parsedUser = JSON.parse(user);
            setLoggedInUser(parsedUser);
          } catch (err) {
            console.error("Failed to parse user cookie", err);
          }
        }
      };
      checkUser();
    }
  }, [loggedInUser]);

  return (
    <SocketContextProvider>
      <SnackbarProvider
        maxSnack={3}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
        autoHideDuration={4000}
      >
        <PeerProvider loggedInUser={loggedInUser}>
          {children}
        </PeerProvider>
      </SnackbarProvider>
    </SocketContextProvider>
  );
}
