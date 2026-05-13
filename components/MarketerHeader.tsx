"use client";

import React, { useEffect } from "react";
import { useState } from "react";
import Image from "next/image";
import { Button } from "./ui/button";
import Link from "next/link";
// import { usePathname } from 'next/navigation'
import { Menu, X } from "lucide-react";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import AvatarUpload from "./AvatarUpload";
import { useRouter } from "next/navigation";
import { logout } from "@/lib/utils";
import { socket } from "@/lib/socket";
import Cookies from "js-cookie";

const MarketerHeader = () => {
	// const pathname = usePathname()
	const router = useRouter();
	const [mobileOpen, setMobileOpen] = useState(false);
	const [loggedInUser, setLoggedInUser] = useState<any>(null);

	const isActive = (path: string) => {
		return typeof window !== "undefined" && window.location.pathname === path;
	};

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

	useEffect(() => {
		if (!socket) return;

		// 🔗 Handle connection
		socket.on("connect", () => {
			if (loggedInUser?.id) {
				socket.emit("join", loggedInUser?.id);
			}
		});

		socket.on("disconnect", () => {
			console.log("❌ Socket disconnected");
		});

		// 🧹 Cleanup
		return () => {
			socket.off("connect");
			socket.off("disconnect");
		};
	}, [loggedInUser, socket]);

    const handleLogout = async () => {
        try {
            await logout();
        } catch (error) {
            console.error("Logout failed", error);
        }
    };

	const resolveUserAvatar = (user?: any) => {
		const base = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "");
		const u = String((user?.avatarUrl || user?.avatar) ?? "").trim();
		if (!u) return "/images/avatar.PNG";
		if (u.startsWith("data:")) return u;
		if (/^https?:\/\//i.test(u)) return u;
		if (u.startsWith("/uploads")) return base ? `${base}${u}` : u;
		const cleaned = u.replace(/^\/?uploads\/?/, "");
		return base ? `${base}/uploads/${cleaned}` : `/uploads/${cleaned}`;
	};

	// const isActive = (path: string) => pathname === path

	return (
		<header className="bg-white border-b">
			<div className="mx-auto max-w-[1350px]">
				<div className="flex items-center justify-between h-20 px-6 py-3">
					{/* Logo */}
					<div className="flex items-center space-x-4">
						<Image
							src="/images/logo.svg"
							alt="Excel connect logo"
							className="md:w-[250px] w-[125px]"
							width={250}
							height={32}
							priority
						/>
					</div>

					{/* Desktop Nav */}
					<nav className="hidden md:flex items-center space-x-9">
						{/* <Link
							className={`hover:text-primary ${
								isActive("/marketer/client") ? "text-primary" : ""
							}`}
							href="/marketer/client"
						>
							patients
						</Link> */}
						<Link
							className={`hover:text-primary ${
								isActive("/marketer/messaging") ? "text-primary" : ""
							}`}
							href="/marketer/messages"
						>
							Messaging
						</Link>
						{/* <Link className={`hover:text-primary ${isActive("/marketer/register-a-doc") ? "text-primary" : ""}`} href="/marketer/register-a-doc">
              Register a Doctor
            </Link> */}
					</nav>

					{/* Right Side - Profile */}
					<div className="flex items-center space-x-4">
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button
									variant="ghost"
									className="relative h-8 w-8 rounded-full bg-transparent border border-black/70 cursor-pointer overflow-hidden"
								>
						<Image
							src={resolveUserAvatar(loggedInUser)}
							alt="Profile"
							fill
							className="object-cover rounded-full"
							priority
						/>
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent
								className="w-56 bg-white"
								align="end"
								forceMount
							>
								<DropdownMenuSeparator />
								<Link href="/marketer/profile">
									<DropdownMenuItem className="cursor-pointer">
										Profile
									</DropdownMenuItem>
								</Link>
								<DropdownMenuSeparator />
								<DropdownMenuItem
									className="cursor-pointer"
									onClick={handleLogout}
								>
									Log out
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>

						{/* Mobile Menu Toggle */}
						<button
							className="md:hidden p-2"
							onClick={() => setMobileOpen(!mobileOpen)}
						>
							{mobileOpen ? <X size={24} /> : <Menu size={24} />}
						</button>
					</div>
				</div>

				{/* Mobile Nav */}
				{mobileOpen && (
					<nav className="md:hidden bg-white border-t flex flex-col space-y-2 px-6 py-4">
						{/* <Link onClick={() => setMobileOpen(false)} href="/marketer/appointments" className={`hover:text-primary ${isActive("/marketer/appointments") ? "text-primary" : ""}`}>
              Appointments
            </Link> */}
						{/* <Link
							onClick={() => setMobileOpen(false)}
							className={`hover:text-primary ${
								isActive("/marketer/client") ? "text-primary" : ""
							}`}
							href="/marketer/client"
						>
							patients
						</Link> */}
						<Link
							onClick={() => setMobileOpen(false)}
							href="/marketer/messages"
							className={`hover:text-primary ${
								isActive("/marketer/messages") ? "text-primary" : ""
							}`}
						>
							Messaging
						</Link>
						{/* <Link onClick={() => setMobileOpen(false)} href="/marketer/register-a-doc" className={`hover:text-primary ${isActive("/marketer/register-a-doc") ? "text-primary" : ""}`}>
              Register a Doctor
            </Link> */}
					</nav>
				)}
			</div>
		</header>
	);
};

export default MarketerHeader;
