"use client";
import { useEffect, useRef, useState } from "react";
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
	ChevronLeft,
	ChevronRight,
	LogOut,
	User,
} from "lucide-react";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { logout } from "@/lib/utils";
import TopBarUserMenu from "@/components/TopBarUserMenu";
import Image from "next/image";
import { addDays, format, isSameDay } from "date-fns";
import { Switch } from "@/components/ui/switch";
import { AllAvailableDR, doctorAvailableTimes } from "@/hooks/appointments";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";

import { usePathname } from "next/navigation";
import Link from "next/link";
import Cookies from "js-cookie";

export default function SeeTherapist() {
	const [loggedInUser, setLoggedInUser] = useState<any>(null);
	const [searchTerm, setSearchTerm] = useState("");
	const [activeNow, setActiveNow] = useState(true);
	const [viewMode, setViewMode] = useState<"list" | "profile" | "appointment">(
		"list"
	);
	const [selectedDoctor, setSelectedDoctor] = useState<any | null>(null);
	const [selectedFilter, setSelectedFilter] = useState<string>("All");
	const pathname = usePathname();
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
		"Psychatrist",
		"Marriage and Family Therapist (MFT)",
		"Child or Adolescent Therapist",
	];

	const [doctors, setDoctors] = useState<any[]>([]);
	const [currentPage, setCurrentPage] = useState(1);
	const [pageSize, setPageSize] = useState(9);
	const [totalItems, setTotalItems] = useState(0);
	const [totalPages, setTotalPages] = useState(1);

	const resolveImageSrc = (url?: string) => {
		const uRaw = String(url ?? "").trim();
		if (!uRaw) return "/images/Blank_Profile.jpg";
		const uClean = uRaw.replace(/^url\((.*)\)$/i, "$1").replace(/^['"]|['"]$/g, "");
		if (!uClean) return "/images/Blank_Profile.jpg";
		if (/^data:image\//i.test(uClean)) return uClean;
		if (/^https?:\/\//i.test(uClean)) return uClean;
		if (/^\/\//.test(uClean)) return `https:${uClean}`;
		if (uClean.startsWith("/images/") || uClean.startsWith("images/")) {
			return uClean.startsWith("/") ? uClean : `/${uClean}`;
		}
		const base = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "");
		const cleaned = uClean.replace(/^\/?uploads\/?/, "");
		if (!base) {
			return `/uploads/${cleaned}`;
		}
		return `${base}/uploads/${cleaned}`;
	};

	useEffect(() => {
		const run = async () => {
			try {
				const data: any = await AllAvailableDR(pageSize, "approved", currentPage, searchTerm);
				const list =
					(data as any)?.doctors ?? (Array.isArray(data) ? data : []);
				const mapped = list.map((d: any) => ({
					id: String(d?._id ?? d?.id ?? ""),
					name: String(d?.displayName ?? d?.name ?? ""),
					title: String(d?.specialization ?? d?.title ?? ""),
					avatar: resolveImageSrc(d?.avatarUrl ?? d?.avatar ?? ""),
					years: Number(d?.workExperience ?? d?.years ?? 0),
					rating: Number(d?.rating ?? 0),
					reviews: Number(d?.reviewsCount ?? d?.reviews ?? 0),
					tag: String(d?.specialization ?? d?.tag ?? ""),
					specialization: String(d?.specialization ?? d?.title ?? ""),
					about: d?.about ?? "",
					services: Array.isArray(d?.services) ? d.services : [],
					education: Array.isArray(d?.education) ? d.education : [],
					satisfactionRate: Number(d?.satisfactionRate ?? 0),
				}));
				setDoctors(mapped);
				const ti = Number((data as any)?.totalItems ?? (data as any)?.count ?? mapped.length);
				const tp = Number((data as any)?.totalPages ?? Math.ceil(ti / Math.max(1, pageSize)));
				setTotalItems(ti);
				setTotalPages(tp);
				console.log("Mapped", mapped);
			} catch (_) { }
		};
		run();
	}, [currentPage, pageSize, searchTerm]);

	const filteredDoctors = doctors.filter((d) => {
		const byFilter = selectedFilter === "All" || d.tag === selectedFilter;
		return byFilter;
	});


	const generateDemoData = () => {
		const today = new Date();
		const dates = [];

		for (let i = 0; i < 7; i++) {
			const date = new Date(today);
			date.setDate(today.getDate() + i);
			dates.push({
				id: i,
				day: date.toLocaleDateString("en-US", { weekday: "short" }),
				date: date.getDate(),
				month: date.toLocaleDateString("en-US", { month: "short" }),
				fullDate: date.toISOString().split("T")[0],
				isToday: i === 0,
			});
		}

		return dates;
	};

	type TimeSlots = {
		morning: string[];
		afternoon: string[];
		evening: string[];
	};

	const formatSlotTime = (
		s: string,
		slot: "morning" | "afternoon" | "evening"
	): string => {
		const parts = String(s).trim().split(":");
		const hRaw = parseInt(parts[0] || "0", 10);
		const mRaw = parseInt(parts[1] || "0", 10);
		let h = isNaN(hRaw) ? 0 : hRaw;
		const mm = String(isNaN(mRaw) ? 0 : mRaw).padStart(2, "0");
		let suffix: "AM" | "PM" = slot === "morning" ? "AM" : "PM";
		if (h === 0) {
			h = 12;
			suffix = "AM";
		} else if (h === 12) {
			suffix = slot === "morning" ? "AM" : "PM";
		} else if (h > 12) {
			h = h - 12;
			suffix = "PM";
		}
		const hh = String(h).padStart(2, "0");
		return `${hh}:${mm} ${suffix}`;
	};

	const TentativeAppointment = () => {
		const [dates] = useState(generateDemoData());
		const toDateInfo = (d: Date) => ({
			id: d.getTime(),
			day: format(d, "EEE"),
			date: d.getDate(),
			month: format(d, "LLL"),
			fullDate: format(d, "yyyy-MM-dd"),
			isToday: isSameDay(d, new Date()),
		});
		const [selectedDate, setSelectedDate] = useState(toDateInfo(new Date()));
		const [selectedSlot, setSelectedSlot] = useState<
			"morning" | "afternoon" | "evening"
		>("morning");
		const [selectedTime, setSelectedTime] = useState<string>("");
		const [cursorDate, setCursorDate] = useState<Date>(new Date());
		const [availableTimes, setAvailableTimes] = useState<string[]>([]);
		const [isTimesLoading, setIsTimesLoading] = useState(false);
		const [slotsError, setSlotsError] = useState<string | null>(null);

		useEffect(() => {
			const run = async () => {
				if (!selectedDoctor?.id) return;
				setIsTimesLoading(true);
				setSlotsError(null);
				try {
					const slotKey = selectedSlot.toLowerCase();
					const resp = await doctorAvailableTimes(
						selectedDoctor.id,
						selectedDate.fullDate,
						slotKey
					);
					let list: any = [];
					if (resp?.slots) {
						list = resp.slots[slotKey] ?? [];
					} else if (Array.isArray(resp)) {
						list = resp;
					} else if ((resp as any)?.times) {
						list = (resp as any).times;
					}
					const formatted = (Array.isArray(list) ? list : [])
						.map((t: any) => formatSlotTime(String(t), selectedSlot))
						.filter((t: string) => Boolean(t));
					setAvailableTimes(formatted);
				} catch (e: any) {
					setSlotsError("Failed to load availability");
					setAvailableTimes([]);
				} finally {
					setIsTimesLoading(false);
				}
			};
			run();
		}, [selectedDoctor?.id, selectedDate.fullDate, selectedSlot]);

		const handlePrevDates = () => {
			const today = new Date();
			if (!isSameDay(cursorDate, today) && cursorDate > today) {
				setCursorDate(addDays(cursorDate, -1));
			}
		};

		const handleNextDates = () => {
			setCursorDate(addDays(cursorDate, 1));
		};

		const visibleDates = Array.from({ length: 5 }, (_, i) =>
			toDateInfo(addDays(cursorDate, i))
		);

		// Handle appointment submission
		const handleSubmit = async () => {
			if (!selectedTime) {
				alert("Please select a time slot");
				return;
			}

			const appointmentData = {
				date: selectedDate.fullDate,
				time: selectedTime,
				slot: selectedSlot,
				timestamp: new Date().toISOString(),
			};

			console.log("Appointment Data:", appointmentData);

			// TODO: Replace with actual API call
			// Example:
			// try {
			//   const response = await fetch('/api/appointments', {
			//     method: 'POST',
			//     headers: { 'Content-Type': 'application/json' },
			//     body: JSON.stringify(appointmentData)
			//   });
			//   const result = await response.json();
			//   // Handle success
			// } catch (error) {
			//   // Handle error
			// }

			alert(
				`Appointment scheduled for ${selectedDate.day}, ${selectedDate.month} ${selectedDate.date} at ${selectedTime}`
			);
		};

		return (
			<div className="bg-white rounded-2xl p-6 shadow-sm border border-[#E5E7EB] max-w-10xl mx-auto mt-6">
				<div className="flex items-center justify-between mb-6">
					<button
						onClick={() => setViewMode("profile")}
						className="flex items-center gap-2 text-sm font-medium text-[#111827] hover:text-[#6B7280]"
					>
						<ChevronLeft className="h-5 w-8" />
						Back
					</button>
					<h2 className="text-xl mx-auto font-bold text-[#111827]">
						Schedule A Tentative Appointment
					</h2>
				</div>

				{/* Date Selection */}
				<div className="mb-6">
					<div className="flex items-center justify-between mb-4">
						<button
							onClick={handlePrevDates}
							disabled={
								isSameDay(cursorDate, new Date()) || cursorDate < new Date()
							}
							className="p-2 hover:bg-[#F9FAFB] rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
						>
							<ChevronLeft className="h-5 w-8 text-[#6B7280]" />
						</button>

						<div className="flex gap-3 mt-10 flex-1 justify-center">
							{visibleDates.map((date) => (
								<button
									key={date.id}
									onClick={() => setSelectedDate(date)}
									className={`flex flex-col items-center px-6 py-3 rounded-xl border-2 transition-all ${selectedDate.id === date.id
											? "border-[#FF9F43] bg-[#FFF4E6]"
											: "border-[#E5E7EB] hover:border-[#FFD4A3]"
										}`}
								>
									<span
										className={`text-xs font-medium mb-1 ${selectedDate.id === date.id
												? "text-[#FF9F43]"
												: "text-[#6B7280]"
											}`}
									>
										{date.isToday ? "Today" : date.day}
									</span>
									<span
										className={`text-lg font-bold ${selectedDate.id === date.id
												? "text-[#FF9F43]"
												: "text-[#111827]"
											}`}
									>
										{date.date}
									</span>
									<span className="text-xs text-[#6B7280]">{date.month}</span>
								</button>
							))}
						</div>

						<button
							onClick={handleNextDates}
							className="p-2 hover:bg-[#F9FAFB] rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
						>
							<ChevronRight className="h-5 w-8 text-[#6B7280]" />
						</button>
					</div>
				</div>

				{/* Slot Selection */}
				<div className="mb-6">
					<label className="block text-sm font-semibold text-[#111827] mb-3">
						Slot
					</label>
					<div className="flex gap-3">
						{(["morning", "afternoon", "evening"] as const).map((slot) => (
							<button
								key={slot}
								onClick={() => {
									setSelectedSlot(slot);
									setSelectedTime("");
								}}
								className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-all ${selectedSlot === slot
										? "bg-[#9AC63F] text-white"
										: "bg-[#F9FAFB] text-[#6B7280] hover:bg-[#E5E7EB]"
									}`}
							>
								{slot.charAt(0).toUpperCase() + slot.slice(1)}
							</button>
						))}
					</div>
				</div>

				{/* Time Selection */}
				<div className="mb-6">
					<label className="block text-sm font-semibold text-[#111827] mb-3">
						Time
					</label>
					<div className="grid grid-cols-5 gap-3">
						{isTimesLoading ? (
							<span className="text-sm text-[#6B7280]">Loading…</span>
						) : availableTimes.length === 0 ? (
							<span className="text-sm text-[#6B7280]">No available times</span>
						) : (
							availableTimes.map((time) => (
								<button
									key={time}
									onClick={() => setSelectedTime(time)}
									className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${selectedTime === time
											? "bg-[#FF9F43] text-white"
											: "bg-[#F9FAFB] text-[#111827] hover:bg-[#FFE5CC] border border-[#E5E7EB]"
										}`}
								>
									{time}
								</button>
							))
						)}
					</div>
				</div>

				{/* Submit Button */}
				{/* <div className="flex justify-end">
					<button
						onClick={handleSubmit}
						className="px-8 py-3 bg-[#FF9F43] text-white rounded-xl text-sm font-semibold hover:bg-[#FF8C1A] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
						disabled={!selectedTime}
					>
						Submit
					</button>
				</div> */}
			</div>
		);
	};

	const navLinkClasses = (href: string) =>
		`flex w-full items-center gap-3 px-0 py-3 rounded-xl ${pathname === href
			? "bg-[#9AC63F] text-white cursor-default"
			: "text-[#6B7280] hover:bg-[#F9FAFB] transition-colors"
		}`;

	return (
		<div className="flex h-screen bg-[#F5F5F5] overflow-hidden">
			<aside className="w-64 bg-white border-r border-[#E5E7EB] flex flex-col">
				<div className="p-6 border-b border-[#E5E7EB]">
					<div className="flex items-center gap-3 mb-2">
						<Image
							src="/images/logo.svg"
							alt="Excel Connect logo"
							width={100}
							height={100}
							priority
							className="w-auto h-auto"
						/>
					</div>
				</div>

				<nav className="flex-1 p-6 space-y-2">
					<Link
						href="/my-profile"
						onClick={(e) => { e.preventDefault(); if (pathname !== "/my-profile") window.location.href = "/my-profile"; }}
						className={navLinkClasses("/my-profile")}
					>
						<User className="h-5 w-8" />
						<span className="font-medium">My Profile</span>
					</Link>
					<Link
						href="/marketer/client"
						onClick={(e) => { e.preventDefault(); if (pathname !== "/marketer/client") window.location.href = "/marketer/client"; }}
						className={navLinkClasses("/marketer/client")}
					>
						<Users className="h-5 w-8" />
						<span className="font-medium">Client List</span>
					</Link>
					<Link
						href="/marketer/messages"
						onClick={(e) => { e.preventDefault(); if (pathname !== "/marketer/messages") window.location.href = "/marketer/messages"; }}
						className={navLinkClasses("/marketer/messages")}
					>
						<MessageSquare className="h-5 w-8" />
						<span className="font-medium">Chats</span>
					</Link>
					<Link
						href="/marketer/get-assessment"
						onClick={(e) => { e.preventDefault(); if (pathname !== "/marketer/get-assessment") window.location.href = "/marketer/get-assessment"; }}
						className={navLinkClasses("/marketer/get-assessment")}
					>
						<FileText className="h-5 w-8" />
						<span className="font-medium">Assign a Doctor</span>
					</Link>
					<Link
						href="/marketer/see-therapist"
						onClick={(e) => { e.preventDefault(); if (pathname !== "/marketer/see-therapist") window.location.href = "/marketer/see-therapist"; }}
						className={navLinkClasses("/marketer/see-therapist")}
					>
						<Stethoscope className="h-5 w-8" />
						<span className="font-medium">Connect client to a therapist</span>
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
					{viewMode === "list" && (
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
								<div className="relative w-full max-w-xs sm:max-w-sm md:max-w-md">
									<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[#9CA3AF]" />
									<input
										type="text"
										value={searchTerm}
										onChange={(e) => {
											setSearchTerm(e.target.value);
											setCurrentPage(1);
										}}
										placeholder="Search doctors"
										className="w-full bg-white border border-[#E5E7EB] rounded-xl h-10 pl-10 pr-3 text-sm focus:outline-none focus:ring-1 focus:ring-[#9AC63F]"
									/>
								</div>
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
													src={resolveImageSrc(doc.avatar)}
													alt={doc.name}
													fill
													sizes="80px"
													unoptimized
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
											View Details
										</button>
									</div>
								))}
							</div>
							<div className="flex items-center justify-between p-4 border-t border-[#E5E7EB] bg-white mt-6 rounded-xl">
								<div className="flex items-center gap-3">
									<span className="text-sm text-[#6B7280]">Rows per page</span>
									<Select
										value={String(pageSize)}
										onValueChange={(v) => {
											setPageSize(Number(v));
											setCurrentPage(1);
										}}
									>
										<SelectTrigger className="w-[84px] bg-white border border-[#E5E7EB] rounded-md h-9">
											<SelectValue placeholder={String(pageSize)} />
										</SelectTrigger>
										<SelectContent className="bg-white">
											<SelectItem value="6">6</SelectItem>
											<SelectItem value="9">9</SelectItem>
											<SelectItem value="12">12</SelectItem>
											<SelectItem value="24">24</SelectItem>
										</SelectContent>
									</Select>
								</div>
								<div className="flex items-center gap-3">
									<span className="text-sm text-[#6B7280]">
										{Math.min((currentPage - 1) * pageSize + 1, totalItems)}-{Math.min(currentPage * pageSize, totalItems)} of {totalItems}
									</span>
									<button
										className="p-2 rounded-lg border border-[#E5E7EB] hover:bg-[#F9FAFB] disabled:opacity-50"
										disabled={currentPage === 1}
										onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
									>
										<ChevronLeft className="h-4 w-4 text-[#6B7280]" />
									</button>
									<button
										className="p-2 rounded-lg border border-[#E5E7EB] hover:bg-[#F9FAFB] disabled:opacity-50"
										disabled={currentPage >= totalPages}
										onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
									>
										<ChevronRight className="h-4 w-4 text-[#6B7280]" />
									</button>
								</div>
							</div>
						</div>
					)}
					{viewMode === "profile" && selectedDoctor && (
						<div className="mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
							<div className="lg:col-span-6">
								<div className="flex items-center justify-between mb-4">
									<button
										onClick={() => setViewMode("list")}
										className="flex items-center gap-2 text-sm font-medium text-[#111827] hover:text-[#6B7280]"
									>
										<ChevronLeft className="h-5 w-5" />
										Back
									</button>
								</div>
								<div className="bg-white rounded-2xl p-6 shadow-sm border border-[#E5E7EB]">
									<div className="flex items-start gap-4">
										<div className="relative h-16 w-16 rounded-xl overflow-hidden shrink-0">
											<Image
												src={resolveImageSrc(selectedDoctor.avatar)}
												alt={selectedDoctor.name}
												fill
												sizes="64px"
												unoptimized
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
														<p className="text-xs text-[#6B7280]">Experience</p>
													</div>
													<div className="mx-4 h-6 w-px bg-[#E5E7EB]" />

												</div>
											</div>
										</div>
										<div className="book">
											<button
												onClick={() => setViewMode("appointment")}
												className="bg-[#F59421] py-2 px-8 rounded-4xl text-white font-bold"
											>
												View Availibility
											</button>
										</div>
									</div>
								</div>
								<div className="max-w-12xl mt-5 mx-auto rounded-2xl p-6 bg-white">
									{/* About Section */}
									<div className="mb-8">
										<h2 className="text-lg font-semibold text-gray-900 mb-3 pb-2 border-b-2 border-dotted border-gray-300">
											About
										</h2>
										<p className="text-sm text-gray-600 leading-relaxed">
											{selectedDoctor?.about || "Not available"}
										</p>
									</div>

									<div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
										{/* Services Section */}
										<div>
											<h2 className="text-lg font-semibold text-gray-900 mb-3">
												Services
											</h2>
											{Array.isArray(selectedDoctor?.services) &&
												selectedDoctor.services.length > 0 ? (
												<ul className="space-y-2">
													{selectedDoctor.services.map(
														(service: string, index: number) => (
															<li key={index} className="text-sm text-gray-700">
																{service}
															</li>
														)
													)}
												</ul>
											) : (
												<p className="text-sm text-gray-500">Not available</p>
											)}
										</div>

										{/* Education & Specialization Section */}
										<div>
											<h2 className="text-lg font-semibold text-gray-900 mb-3">
												Education
											</h2>
											{Array.isArray(selectedDoctor?.education) &&
												selectedDoctor.education.length > 0 ? (
												<ul className="space-y-2 mb-6">
													{selectedDoctor.education.map(
														(edu: { degree: string }, index: number) => (
															<li key={index} className="text-sm text-gray-700">
																{edu.degree}
															</li>
														)
													)}
												</ul>
											) : (
												<p className="text-sm text-gray-500 mb-6">
													Not available
												</p>
											)}

											<h2 className="text-lg font-semibold text-gray-900 mb-3">
												Specialization
											</h2>
											<p className="text-sm text-gray-700">
												{selectedDoctor?.specialization || "Not available"}
											</p>
										</div>
									</div>
								</div>
							</div>
						</div>
					)}
					{viewMode === "appointment" && selectedDoctor && (
						<TentativeAppointment />
					)}
				</main>
			</div>
		</div>
	);
}
