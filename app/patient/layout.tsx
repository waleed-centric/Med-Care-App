"use client";

import React, { useEffect, useRef, useState } from "react";
import MarketerHeader from "@/components/MarketerHeader";
import Footer from "@/components/Footer";
import Cookies from "js-cookie";

const MarketerLayout = ({ children }: { children: React.ReactNode }) => {
	const [loggedInUser, setLoggedInUser] = useState<any>(null);
	// const router = useRouter();

	// useEffect(() => {
	//   if (!isAuthenticated()) {
	//     router.push("/auth/client/login");
	//   }
	// }, [router]);

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

	return (
		<>
			<div className="min-h-screen bg-gray-50">
				{/* <MarketerHeader /> */}
				<main className=" w-full  space-y-6">{children}</main>
			</div>
			{/* <Footer /> */}
		</>
	);
};

export default MarketerLayout;
