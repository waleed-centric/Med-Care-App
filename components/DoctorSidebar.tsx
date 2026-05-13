"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    Grid,
    Users,
    Calendar,
    MessageSquare,
    Menu,
    X,
    User,
} from "lucide-react";
import { useResponsiveMenu, useResponsiveLayout } from "@/hooks/responsive";

interface DoctorSidebarProps {
    className?: string;
}

export default function DoctorSidebar({ className = "" }: DoctorSidebarProps) {
    const pathname = usePathname();
    const { isMenuOpen, setIsMenuOpen } = useResponsiveMenu();
    const layout = useResponsiveLayout();
    const [isMobile, setIsMobile] = useState(false);

    // Check if mobile/tablet
    useEffect(() => {
        const checkMobile = () => {
            const mobile = window.innerWidth < 1024;
            setIsMobile(mobile);
            if (!mobile) {
                setIsMenuOpen(false);
            }
        };

        checkMobile();
        window.addEventListener("resize", checkMobile);
        return () => window.removeEventListener("resize", checkMobile);
    }, []);

    // Close sidebar on navigation (mobile only)
    useEffect(() => {
        if (isMobile) {
            setIsMenuOpen(false);
        }
    }, [pathname, isMobile, setIsMenuOpen]);

    // Prevent body scroll when sidebar is open on mobile
    useEffect(() => {
        if (isMobile && isMenuOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "";
        }
        return () => {
            document.body.style.overflow = "";
        };
    }, [isMobile, isMenuOpen]);

    const navItems = [
        {
            href: "/my-profile",
            icon: User,
            label: "My Profile",
            active: pathname === "/my-profile",
        },
        {
            href: "/doctor/dashboard",
            icon: Grid,
            label: "Overview",
            active: pathname === "/doctor/dashboard",
        },
        {
            href: "/doctor/patients",
            icon: Users,
            label: "Clients",
            active: pathname === "/doctor/patients",
        },
        {
            href: "/doctor/schedule",
            icon: Calendar,
            label: "Schedule",
            active: pathname === "/doctor/schedule",
        },
        {
            href: "/doctor/messages",
            icon: MessageSquare,
            label: "Chats",
            active: pathname === "/doctor/messages",
        },
    ];

    return (
        <>
            {/* Hamburger Menu Button - Only visible on mobile/tablet */}
            {isMobile && (
                <button
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    className="fixed top-4 left-4 z-50 p-3 bg-white rounded-lg shadow-md lg:hidden hover:bg-gray-50 transition-colors min-h-11"
                    aria-label="Toggle menu"
                >
                    {isMenuOpen ? (
                        <X className="h-6 w-6 text-brand-dark" />
                    ) : (
                        <Menu className="h-6 w-6 text-brand-dark" />
                    )}
                </button>
            )}

            {/* Backdrop overlay - Only on mobile when open */}
            {isMobile && isMenuOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm"
                    onClick={() => setIsMenuOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`
					${isMobile ? "fixed" : "relative"}
					${isMobile && isMenuOpen ? "translate-x-0" : ""}
					${isMobile && !isMenuOpen ? "-translate-x-full" : ""}
					w-64 bg-white border-r border-brand-light flex flex-col
					transition-transform duration-300 ease-in-out
					${isMobile ? "z-40 h-screen" : "h-full"}
					${className}
				`}
            >
                {/* Logo Section */}
                <div className="p-6 border-b border-brand-light">
                    <div className="flex items-center gap-3 mb-2">
                        <Image
                            src="/images/logo.svg"
                            alt="Excel Connect logo"
                            width={40}
                            height={40}
                            priority
                            className="h-auto w-auto"
                        />
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 p-4 space-y-2">
                    {navItems.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            onClick={(e) => {
                                e.preventDefault();
                                if (!item.active) {
                                    window.location.href = item.href;
                                }
                            }}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${item.active
                                    ? "bg-[#9ac63f] text-white cursor-default"
                                    : "text-brand-medium hover:bg-brand-light"
                                } min-h-11 hover:scale-105 transform transition-transform`}
                        >
                            <item.icon className="h-5 w-5" />
                            <span className="font-medium">{item.label}</span>
                        </Link>
                    ))}
                </nav>
            </aside>
        </>
    );
}
