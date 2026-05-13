"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import {
	Search,
	Star,
	Eye,
	ChevronRight,
} from "lucide-react";
import Cookies from "js-cookie";
import TopBarUserMenu from "@/components/TopBarUserMenu";
import LPCSidebar from "@/components/LPCSidebar";

export default function LPCSeeTherapist() {
	const [loggedInUser, setLoggedInUser] = useState<any>(null);
	const [viewMode, setViewMode] = useState<"list" | "profile">("list");
	const [selectedDoctor, setSelectedDoctor] = useState<any | null>(null);
	const [selectedFilter, setSelectedFilter] = useState<string>("All");

	useEffect(() => {
		const user = Cookies.get("user");
		if (user) {
			try {
				const parsedUser = JSON.parse(user);
				setLoggedInUser(parsedUser);
			} catch (_) {}
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
			<LPCSidebar className="hidden lg:flex" />

			<div className="flex-1 flex flex-col overflow-hidden">
				<header className="bg-white border-b border-[#E5E7EB] px-6 py-4">
					<div className="flex items-center justify-between gap-4">
						{/* <div className="relative flex-1 max-w-md hidden sm:block">
							<Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#9CA3AF]" />
							<input
								type="text"
								placeholder="Search"
								className="w-full pl-12 pr-4 py-2.5 rounded-xl bg-[#F9FAFB] border border-[#E5E7EB] text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
							/>
						</div> */}
						<TopBarUserMenu user={loggedInUser} />
					</div>
				</header>

				<main className="flex-1 overflow-y-auto p-6">
					{viewMode === "list" ? (
						<div className="mx-auto">
							<div className="flex items-center justify-between mb-6">
								<div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2">
									{filters.map((f) => (
										<button
											key={f}
											onClick={() => setSelectedFilter(f)}
											className={`px-3 py-1.5 rounded-lg text-sm font-medium border whitespace-nowrap ${
												selectedFilter === f
													? "bg-[#111827] text-white border-transparent"
													: "bg-white text-[#111827] border-[#E5E7EB] hover:bg-[#F9FAFB]"
											}`}
										>
											{f}
										</button>
									))}
								</div>
							</div>

							<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
								{filteredDoctors.map((doc, idx) => (
									<div
										key={idx}
										className="bg-white rounded-2xl p-6 shadow-sm border border-[#E5E7EB] hover:shadow-md transition-shadow"
									>
										<div className="flex flex-col items-center text-center">
											<div className="relative h-24 w-24 rounded-2xl overflow-hidden mb-4 bg-emerald-100">
												<Image
													src={doc.avatar}
													alt={doc.name}
													fill
													className="object-cover"
												/>
											</div>
											<h3 className="text-lg font-bold text-[#111827]">
												{doc.name}
											</h3>
											<p className="text-sm text-[#6B7280]">{doc.title}</p>
										</div>
										<div className="pt-4 mt-4 border-t border-[#E5E7EB]">
											<div className="flex items-center justify-between">
												<div className="text-center flex-1">
													<p className="text-sm font-semibold text-[#111827]">
														{doc.years} Years
													</p>
													<p className="text-xs text-[#6B7280]">Experience</p>
												</div>
												<div className="flex items-center gap-1.5 flex-1 justify-center border-l">
													<Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
													<p className="text-sm font-semibold text-[#111827]">
														{doc.rating}
													</p>
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
											View Profile
										</button>
									</div>
								))}
							</div>
						</div>
					) : (
						selectedDoctor && (
							<div className="max-w-5xl mx-auto space-y-6">
								<button 
									onClick={() => setViewMode("list")}
									className="text-sm font-medium text-[#6B7280] hover:text-[#111827] flex items-center gap-1"
								>
									<ChevronRight className="h-4 w-4 rotate-180" /> Back to list
								</button>
								
								<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
									<div className="lg:col-span-2 space-y-6">
										<div className="bg-white rounded-2xl p-6 shadow-sm border border-[#E5E7EB]">
											<div className="flex items-start gap-6">
												<div className="relative h-32 w-32 rounded-2xl overflow-hidden bg-emerald-100 shrink-0">
													<Image
														src={selectedDoctor.avatar}
														alt={selectedDoctor.name}
														fill
														className="object-cover"
													/>
												</div>
												<div className="flex-1">
													<h2 className="text-2xl font-bold text-[#111827] mb-1">
														{selectedDoctor.name}
													</h2>
													<p className="text-[#6B7280] mb-4">
														{selectedDoctor.title}
													</p>
													<div className="flex items-center gap-6">
														<div>
															<p className="text-sm font-bold text-[#111827]">{selectedDoctor.years} Years</p>
															<p className="text-xs text-[#6B7280]">Experience</p>
														</div>
														<div className="flex items-center gap-1.5 border-l pl-6">
															<Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
															<p className="text-sm font-bold text-[#111827]">{selectedDoctor.rating}</p>
															<p className="text-xs text-[#6B7280]">({selectedDoctor.reviews} reviews)</p>
														</div>
													</div>
												</div>
											</div>
										</div>

										<div className="bg-white rounded-2xl p-6 shadow-sm border border-[#E5E7EB]">
											<h3 className="text-lg font-bold text-[#111827] mb-4">About</h3>
											<p className="text-[#6B7280] text-sm leading-relaxed">
												Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
											</p>
										</div>
									</div>

									<div className="space-y-6">
										<div className="bg-white rounded-2xl p-6 shadow-sm border border-[#E5E7EB]">
											<h3 className="text-lg font-bold text-[#111827] mb-4">Upcoming Slots</h3>
											<div className="space-y-3">
												{appointments.map((a, i) => (
													<div key={i} className="p-3 rounded-xl bg-[#F9FAFB] border border-[#E5E7EB]">
														<p className="text-sm font-semibold text-[#111827] mb-1">{a.time}</p>
														<button className="text-xs font-medium text-[#9AC63F] hover:underline">Book this slot</button>
													</div>
												))}
											</div>
											<button className="w-full mt-4 px-4 py-2 bg-[#111827] text-white rounded-lg text-sm font-medium">
												See all slots
											</button>
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
