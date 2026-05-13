"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
	Search,
	Bell,
	ChevronDown,
	Grid,
	Users,
	Calendar,
	MessageSquare,
	FileText,
	Stethoscope,
	Phone,
	Star,
	Eye,
	ChevronRight,
	User,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import Cookies from "js-cookie";
import TopBarUserMenu from "@/components/TopBarUserMenu";

export default function SeeTherapist() {
	const pathname = usePathname();
	const navLinkClasses = (href: string) =>
		`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${pathname === href
			? "bg-[#9AC63F] text-white cursor-default"
			: "text-[#6B7280] hover:bg-[#F9FAFB]"
		}`;
	const [loggedInUser, setLoggedInUser] = useState<any>(null);
	const [activeNow, setActiveNow] = useState(true);
	const [viewMode, setViewMode] = useState<"list" | "profile">("list");
	const [selectedDoctor, setSelectedDoctor] = useState<any | null>(null);
	const [selectedFilter, setSelectedFilter] = useState<string>("All");

	useEffect(() => {
		const user = Cookies.get("user");
		if (user) {
			try {
				const parsedUser = JSON.parse(user);
				setLoggedInUser(parsedUser);
			} catch (_) { }
		}
	}, []);

	const filters = [
		"All",
		"Psychotherapist",
		"Counseling Psychologist",
		"Clinical Psychologist",
		"Psychiatrist",
		"Marriage and Family Therapist (MFT)",
		"Child or Adolescent Therapist",
	];

	const doctors = [
		{
			name: "Dr. Jonathan Turner",
			title: "Marriage and Family Therapist (MFT)",
			avatar: "/images/avatar.PNG",
			years: 22,
			rating: 4.7,
			reviews: 483,
			tag: "Marriage and Family Therapist (MFT)",
		},
		{
			name: "Ms. Emily Rogers",
			title: "Clinical Psychologist",
			avatar: "/images/avatar.PNG",
			years: 15,
			rating: 4.9,
			reviews: 312,
			tag: "Clinical Psychologist",
		},
		{
			name: "Mr. David Kim",
			title: "Trauma Therapist",
			avatar: "/images/avatar.PNG",
			years: 10,
			rating: 4.8,
			reviews: 256,
			tag: "Psychotherapist",
		},
		{
			name: "Dr. Samuel Hayes",
			title: "Psychiatrist",
			avatar: "/images/avatar.PNG",
			years: 8,
			rating: 3.8,
			reviews: 483,
			tag: "Psychiatrist",
		},
		{
			name: "Dr. Clara Bennett",
			title: "Behavioral Therapist",
			avatar: "/images/avatar.PNG",
			years: 17,
			rating: 4.0,
			reviews: 312,
			tag: "Psychotherapist",
		},
		{
			name: "Dr. Alex Park",
			title: "Occupational Therapist (Mental Health)",
			avatar: "/images/avatar.PNG",
			years: 20,
			rating: 4.6,
			reviews: 256,
			tag: "Counseling Psychologist",
		},
	];

	const filteredDoctors = doctors.filter(
		(d) => selectedFilter === "All" || d.tag === selectedFilter
	);

	const appointments = [
		{
			name: "Alexander Smith",
			time: "Today, 10 AM - 11 AM",
			avatar: "/images/avatar.PNG",
		},
		{
			name: "Jenny Wilson",
			time: "Tomorrow, 3 AM - 4 AM",
			avatar: "/images/avatar.PNG",
		},
	];

	return (
		<div className="flex h-screen bg-[#F5F5F5] overflow-hidden">
			<aside className="w-64 bg-white border-r border-[#E5E7EB] flex flex-col">
				<div className="p-6 border-b border-[#E5E7EB]">
					<div className="flex items-center gap-3 mb-2">
						<Image
							src="/images/logo.svg"
							alt="Excel Connect logo"
							width={80}
							height={80}
							priority
							className="w-auto h-auto"
						/>
					</div>
				</div>
				<nav className="flex-1 p-4 space-y-2">
					<Link
						href="/my-profile"
						onClick={(e) => { e.preventDefault(); if (pathname !== "/my-profile") window.location.href = "/my-profile"; }}
						className={navLinkClasses("/my-profile")}
					>
						<User className="h-5 w-8" />
						<span className="font-medium">My Profile</span>
					</Link>
					<Link
						href="/doctor/dashboard"
						onClick={(e) => { e.preventDefault(); if (pathname !== "/doctor/dashboard") window.location.href = "/doctor/dashboard"; }}
						className={navLinkClasses("/doctor/dashboard")}
					>
						<Grid className="h-5 w-8" />
						<span className="font-medium">Overview</span>
					</Link>
					<Link
						href="/doctor/patients"
						onClick={(e) => { e.preventDefault(); if (pathname !== "/doctor/patients") window.location.href = "/doctor/patients"; }}
						className={navLinkClasses("/doctor/patients")}
					>
						<Users className="h-5 w-8" />
						<span className="font-medium">Clients</span>
					</Link>
					<Link
						href="/doctor/schedule"
						onClick={(e) => { e.preventDefault(); if (pathname !== "/doctor/schedule") window.location.href = "/doctor/schedule"; }}
						className={navLinkClasses("/doctor/schedule")}
					>
						<Calendar className="h-5 w-8" />
						<span className="font-medium">Schedule</span>
					</Link>
					<Link
						href="/doctor/messages"
						onClick={(e) => { e.preventDefault(); if (pathname !== "/doctor/messages") window.location.href = "/doctor/messages"; }}
						className={navLinkClasses("/doctor/messages")}
					>
						<MessageSquare className="h-5 w-8" />
						<span className="font-medium">Chats</span>
					</Link>
					<Link
						href="/doctor/get-assessment"
						onClick={(e) => { e.preventDefault(); if (pathname !== "/doctor/get-assessment") window.location.href = "/doctor/get-assessment"; }}
						className={navLinkClasses("/doctor/get-assessment")}
					>
						<FileText className="h-5 w-8" />
						<span className="font-medium">Get an Assessment</span>
					</Link>
				</nav>
			</aside>

			<div className="flex-1 flex flex-col overflow-hidden">
				<header className="bg-white border-b border-[#E5E7EB] px-6 py-4">
					<div className="flex items-center justify-end w-full">
						<TopBarUserMenu user={loggedInUser} />
					</div>
				</header>

				<main className="flex-1 overflow-y-auto p-6">
					{viewMode === "list" ? (
						<div className="mx-auto">
							<div className="flex items-center justify-between mb-6">
								<div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
									{filters.map((f) => (
										<button
											key={f}
											onClick={() => setSelectedFilter(f)}
											className={`px-3 py-1.5 rounded-lg text-sm font-medium border ${selectedFilter === f
													? "bg-[#111827] text-white border-transparent"
													: "bg-[#F9FAFB] text-[#111827] border-[#E5E7EB] hover:bg-white"
												}`}
										>
											{f}
										</button>
									))}
								</div>
								<button className="p-2 hover:bg-[#F9FAFB] rounded-full transition-colors">
									<ChevronRight className="h-5 w-8 text-[#6B7280]" />
								</button>
							</div>

							<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
								{filteredDoctors.map((doc, idx) => (
									<div
										key={idx}
										className="bg-white rounded-2xl p-6 shadow-sm border border-[#E5E7EB]"
									>
										<div className="flex flex-col items-center text-center">
											<div className="relative h-20 w-20 rounded-2xl overflow-hidden mb-4">
												<Image
													src={doc.avatar}
													alt={doc.name}
													fill
													className="object-cover"
												/>
											</div>
											<p className="text-lg font-bold text-[#111827]">
												{doc.name}
											</p>
											<p className="text-sm text-[#6B7280]">{doc.title}</p>
										</div>
										<div className="pt-4 mt-4 border-t border-[#E5E7EB]">
											<div className="flex items-center justify-center">
												<div className="min-w-[140px] text-center">
													<p className="text-sm font-semibold text-[#111827]">
														{String(doc.years).padStart(2, "0")} Years
													</p>
													<p className="text-xs text-[#6B7280]">Experience</p>
												</div>

											</div>
										</div>
										<button
											onClick={() => {
												setSelectedDoctor(doc);
												setViewMode("profile");
											}}
											className="mt-6 w-full px-4 py-2 bg-[#9AC63F] text-white rounded-lg text-sm font-medium hover:bg-[#85af34] transition-colors"
										>
											Book Appointment
										</button>
									</div>
								))}
							</div>
						</div>
					) : (
						selectedDoctor && (
							<div className="mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
								<div className="lg:col-span-2">
									<div className="bg-white rounded-2xl p-6 shadow-sm border border-[#E5E7EB]">
										<div className="flex items-start gap-4">
											<div className="relative h-16 w-16 rounded-xl overflow-hidden shrink-0">
												<Image
													src={selectedDoctor.avatar}
													alt={selectedDoctor.name}
													fill
													className="object-cover"
												/>
											</div>
											<div className="flex-1">
												<p className="text-base sm:text-lg font-semibold text-[#111827] mb-0.5">
													{selectedDoctor.name}
												</p>
												<p className="text-sm text-[#6B7280]">
													{selectedDoctor.title}
												</p>
												<div className="pt-4 mt-3 border-t border-[#E5E7EB]">
													<div className="flex items-center">
														<div className="min-w-[140px]">
															<p className="text-sm font-semibold text-[#111827]">
																{String(selectedDoctor.years).padStart(2, "0")}{" "}
																Years
															</p>
															<p className="text-xs text-[#6B7280]">
																Experience
															</p>
														</div>

													</div>
												</div>
											</div>
										</div>
									</div>
								</div>
								<div className="lg:col-span-1">
									<div className="bg-white rounded-2xl p-6 shadow-sm border border-[#E5E7EB]">
										<h3 className="text-lg font-bold text-[#111827] mb-4">
											Appointment List
										</h3>
										<div className="flex items-center gap-2 mb-4">
											<button className="px-4 py-2 rounded-full text-sm font-medium bg-[#F97316] text-white">
												Upcoming
											</button>
											<button className="px-4 py-2 rounded-full text-sm font-medium bg-[#F9FAFB] text-[#6B7280] border border-[#E5E7EB]">
												Completed
											</button>
											<span className="h-6 w-px bg-[#E5E7EB]" />
											<button className="px-4 py-2 rounded-full text-sm font-medium bg-[#F9FAFB] text-[#6B7280] border border-[#E5E7EB]">
												Canceled
											</button>
										</div>
										<div className="space-y-3">
											{appointments.map((a, i) => (
												<div
													key={i}
													className="flex items-center gap-3 p-3 rounded-xl hover:bg-[#F9FAFB] transition-colors"
												>
													<div className="relative h-10 w-10 rounded-full overflow-hidden shrink-0">
														<Image
															src={a.avatar}
															alt={a.name}
															fill
															className="object-cover"
														/>
													</div>
													<div className="flex-1 min-w-0">
														<p className="text-sm font-semibold text-[#111827]">
															{a.name}
														</p>
														<p className="text-xs text-[#6B7280]">{a.time}</p>
													</div>
													<button className="p-2 rounded-lg bg-[#F9FAFB] border border-[#E5E7EB] hover:bg-white">
														<Eye className="h-4 w-4 text-[#9CA3AF]" />
													</button>
												</div>
											))}
										</div>
									</div>
								</div>
							</div>
						)
					)}
				</main>
			</div>
		</div>
	);
}
