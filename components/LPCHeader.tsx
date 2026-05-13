"use client";

import React, { useEffect } from "react";
import { useState } from "react";
import Image from "next/image";
import { Button } from "./ui/button";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, Bell, User } from "lucide-react";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Cookies from "js-cookie";
import { seeAllPendingForms, seeFormDetails } from "@/hooks/form";
import { seeAllNotifications } from "@/hooks/notifications";
import DoctorCalendarView from "./DoctorCalendarView";
import DoctorCalendarViewModal from "./DoctorCalendarViewModal";
import { useRouter } from "next/navigation";
import { logout } from "@/lib/utils";
import { socket } from "@/lib/socket";
import { useResponsiveMenu, useResponsiveLayout } from "@/hooks/responsive";

const LPCHeader = () => {
	// const pathname = usePathname()
	const router = useRouter();
	const { isMobile, isMenuOpen, setIsMenuOpen } = useResponsiveMenu();
	const layout = useResponsiveLayout();
	const [notifications, setNotifications] = useState<any>(null);
	const [selectedEvent, setSelectedEvent] = useState(null);
	const [selectedNotification, setSelectedNotification] = useState(null);
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [loggedInUser, setLoggedInUser] = useState<any>(null);

	const handleItemClick = async (notification: any) => {
		if (notification.link) {
			try {
				const response = await seeFormDetails(notification.link);
				setSelectedEvent(response);
				setIsModalOpen(true);
			} catch (error) {
				console.log(error);
			}
		}
		setSelectedNotification(notification);
	};

	const isActive = (path: string) => {
		return typeof window !== "undefined" && window.location.pathname === path;
	};

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
        await logout();
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
		<header className="bg-white border-b sticky top-0 z-50">
			<div className="mx-auto max-w-[1350px]">
				<div className="flex items-center justify-between h-20 px-4 md:px-6 py-3">
					{/* Logo */}
					<div className="flex items-center space-x-4">
						<Image
							src="/images/logo.svg"
							alt="Excel connect logo"
							className={layout === 'mobile' ? 'w-[125px]' : 'w-[250px]'}
							width={layout === 'mobile' ? 125 : 250}
							height={layout === 'mobile' ? 16 : 32}
							priority
						/>
					</div>

					{/* Desktop Nav */}
					<nav className="hidden lg:flex items-center space-x-9">
						<Link
							className={`hover:text-brand-primary transition-colors ${
								isActive("/lpc/messages") ? "text-brand-primary font-semibold" : ""
							}`}
							href="/lpc/messages"
						>
							Messaging
						</Link>
						<Link
							className={`hover:text-brand-primary transition-colors ${
								isActive("/lpc/client") ? "text-brand-primary font-semibold" : ""
							}`}
							href="/lpc/client"
						>
							Client
						</Link>
					</nav>

					{/* Right Side - Profile & Mobile Menu */}
					<div className="flex items-center space-x-2">
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button
									variant="ghost"
									className="relative h-10 w-10 rounded-full bg-transparent border border-gray-300 cursor-pointer overflow-hidden hover:border-brand-primary transition-colors min-h-11 min-w-11"
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
								<Link href="/my-profile">
									<DropdownMenuItem className="cursor-pointer hover:bg-gray-50">
										Profile
									</DropdownMenuItem>
								</Link>
								<DropdownMenuSeparator />
                                <DropdownMenuItem className="cursor-pointer hover:bg-gray-50" onClick={handleLogout}>
                                    Log out
                                </DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
						
						{/* Mobile Menu Toggle */}
						{isMobile && (
							<button
								className="lg:hidden p-2 rounded-md hover:bg-gray-100 transition-colors min-h-11 min-w-11"
								onClick={() => setIsMenuOpen(!isMenuOpen)}
								aria-label="Toggle menu"
							>
								{isMenuOpen ? <X size={24} /> : <Menu size={24} />}
							</button>
						)}
					</div>
				</div>

				{/* Mobile Nav */}
				{isMenuOpen && isMobile && (
					<nav className="lg:hidden bg-white border-t flex flex-col space-y-1 px-4 py-4 animate-slide-in">
						<Link
							onClick={() => setIsMenuOpen(false)}
							href="/lpc/messages"
							className={`px-4 py-3 rounded-md hover:bg-gray-50 transition-colors ${
								isActive("/lpc/messages") ? "bg-brand-primary text-white" : ""
							}`}
						>
							Messaging
						</Link>
						<Link
							onClick={() => setIsMenuOpen(false)}
							href="/lpc/client"
							className={`px-4 py-3 rounded-md hover:bg-gray-50 transition-colors ${
								isActive("/lpc/client") ? "bg-brand-primary text-white" : ""
							}`}
						>
							Client
						</Link>
					</nav>
				)}

				{selectedEvent && (
					<>
						<DoctorCalendarViewModal
							selectedEvent={selectedEvent}
							setSelectedEvent={setSelectedEvent}
						/>
					</>
				)}
			</div>
		</header>
	);
};

export default LPCHeader;
