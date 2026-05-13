"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import {
	Search,
	ChevronDown,
	ChevronRight,
	MoreVertical,
} from "lucide-react";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Cookies from "js-cookie";
import axiosInstance from "@/lib/axios";
import LPCSidebar from "@/components/LPCSidebar";
import { useResponsiveLayout } from "@/hooks/responsive";
import TopBarUserMenu from "@/components/TopBarUserMenu";

export default function LPCDashboard() {
	const [loggedInUser, setLoggedInUser] = useState<any>(null);
	const [selectedDate, setSelectedDate] = useState(new Date(2024, 10, 20)); // November 20, 2024
	const [viewMode, setViewMode] = useState<"Day" | "Week" | "Month">("Day");
	const [statsRange, setStatsRange] = useState<"day" | "week" | "month">("month");
	const layout = useResponsiveLayout();

	const resolveImageSrc = (url?: string) => {
		const base = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "");
		const baseUploads = `${base}/uploads`;
		const u = String(url ?? "").trim();
		if (!u) return "/images/avatar.PNG";
		if (u.startsWith("data:")) return u;
		if (/^https?:\/\//i.test(u)) return u;
		if (u.startsWith("/uploads")) return base ? `${base}${u}` : `${baseUploads}${u.replace(/^\/uploads/, "")}`;
		if (u.startsWith("/images/")) return u;
		const cleaned = u.replace(/^\/?uploads\/?/, "");
		return `${baseUploads}/${cleaned}`;
	};
	const [summary, setSummary] = useState({
		todayConsultations: 0,
		patientsThisMonth: 0,
		prescriptionsThisMonth: 0,
	});
	const [newPatients, setNewPatients] = useState<any[]>([]);
	const [tentativeAppointments, setTentativeAppointments] = useState<any[]>([]);
	const [patientStats, setPatientStats] = useState<Record<string, number>>({
		Su: 0,
		Mo: 0,
		Tu: 0,
		We: 0,
		Th: 0,
		Fr: 0,
		Sa: 0,
	});

	useEffect(() => {
		const user = Cookies.get("user");
		if (user) {
			try {
				const parsedUser = JSON.parse(user);
				setLoggedInUser(parsedUser);
			} catch (err) {
				console.error("Failed to parse user cookie", err);
			}
		}

		const fetchSummary = async () => {
			try {
				const token =
					(typeof window !== "undefined" && localStorage.getItem("token")) ||
					Cookies.get("token") ||
					"";
				const res = await axiosInstance.get("/api/dashboard/summary", {
					headers: token ? { Authorization: `Bearer ${token}` } : undefined,
				});
				const data = res?.data?.data;
				if (data && typeof data === "object") {
					setSummary({
						todayConsultations: Number(data.todayConsultations) || 0,
						patientsThisMonth: Number(data.patientsThisMonth) || 0,
						prescriptionsThisMonth: Number(data.prescriptionsThisMonth) || 0,
					});
				}
			} catch (error) {
				console.error("Failed to fetch dashboard summary", error);
			}
		};

		const fetchNewPatients = async () => {
			try {
				const token =
					(typeof window !== "undefined" && localStorage.getItem("token")) ||
					Cookies.get("token") ||
					"";
				const res = await axiosInstance.get("/api/dashboard/new-patients", {
					params: { limit: 2 },
					headers: token ? { Authorization: `Bearer ${token}` } : undefined,
				});
				const list = res?.data?.patients;
				if (Array.isArray(list)) {
					setNewPatients(list);
				}
			} catch (error) {
				console.error("Failed to fetch new patients", error);
			}
		};
		fetchSummary();
		fetchNewPatients();
		fetchTentativeAppointments("month");
	}, []);

	useEffect(() => {
		const fetchPatientStats = async () => {
			try {
				const token =
					(typeof window !== "undefined" && localStorage.getItem("token")) ||
					Cookies.get("token") ||
					"";
				const res = await axiosInstance.get("/api/dashboard/patient-stats", {
					params: { range: statsRange },
					headers: token ? { Authorization: `Bearer ${token}` } : undefined,
				});
				const stats = res?.data?.stats;
				if (stats && typeof stats === "object") {
					setPatientStats(stats);
				}
			} catch (error) {
				console.error("Failed to fetch patient stats", error);
			}
		};
		fetchPatientStats();
	}, [statsRange]);

	useEffect(() => {
		const mapRange = (
			mode: "Day" | "Week" | "Month"
		): "day" | "week" | "month" => {
			if (mode === "Day") return "day";
			if (mode === "Week") return "week";
			return "month";
		};
		fetchTentativeAppointments(mapRange(viewMode));
	}, [viewMode]);

	const formatNewPatientLabel = (dateStr?: string, timeStr?: string) => {
		if (!dateStr) return "";
		const parts = String(dateStr).split("/");
		const d = parseInt(parts[0], 10);
		const m = parseInt(parts[1], 10);
		const monthsShort = [
			"Jan",
			"Feb",
			"Mar",
			"Apr",
			"May",
			"Jun",
			"Jul",
			"Aug",
			"Sep",
			"Oct",
			"Nov",
			"Dec",
		];
		const formatTime = (t?: string) => {
			if (!t) return "";
			const [hh, mm] = String(t).split(":");
			let h = parseInt(hh, 10);
			const suffix = h >= 12 ? "PM" : "AM";
			if (h === 0) h = 12;
			else if (h > 12) h = h - 12;
			return `${h}:${mm} ${suffix}`;
		};
		const datePart = `${isNaN(d) ? dateStr : d} ${monthsShort[m - 1] || ""}`;
		const timePart = formatTime(timeStr);
		return timePart ? `${datePart} ${timePart}` : datePart;
	};

	const formatHM = (t?: string) => {
		if (!t) return "";
		const [hh, mm] = String(t).split(":");
		let h = parseInt(hh, 10);
		const suffix = h >= 12 ? "PM" : "AM";
		if (h === 0) h = 12;
		else if (h > 12) h = h - 12;
		return `${h}:${mm} ${suffix}`;
	};

	const fetchTentativeAppointments = async (
		range: "day" | "week" | "month"
	) => {
		try {
			const token =
				(typeof window !== "undefined" && localStorage.getItem("token")) ||
				Cookies.get("token") ||
				"";
			const res = await axiosInstance.get(
				"/api/dashboard/appointments/tentative",
				{
					params: { range },
					headers: token ? { Authorization: `Bearer ${token}` } : undefined,
				}
			);
			const list = res?.data?.appointments;
			if (Array.isArray(list)) {
				setTentativeAppointments(list);
			}
		} catch (error) {
			console.error("Failed to fetch tentative appointments", error);
		}
	};

	const weekDays = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"] as const;
	const todayIndex = new Date().getDay();
	const valuesByDay: Record<
		"Su" | "Mo" | "Tu" | "We" | "Th" | "Fr" | "Sa",
		number
	> = {
		Su: patientStats?.Su || 0,
		Mo: patientStats?.Mo || 0,
		Tu: patientStats?.Tu || 0,
		We: patientStats?.We || 0,
		Th: patientStats?.Th || 0,
		Fr: patientStats?.Fr || 0,
		Sa: patientStats?.Sa || 0,
	};

	const displayWeekDays =
		statsRange === "day"
			? [weekDays[todayIndex]]
			: weekDays.slice(0, todayIndex + 1);

	const barPatientCounts = displayWeekDays.map((d) => valuesByDay[d] || 0);
	const maxCount = Math.max(...barPatientCounts, 1);
	const barHeights = barPatientCounts.map((v) => Math.round((v / maxCount) * 100));
	const activeBars = barPatientCounts
		.map((v, i) => (v > 0 ? i : -1))
		.filter((i) => i !== -1);

	return (
		<div className="flex h-screen bg-[#F5F5F5] overflow-hidden">
			{/* Sidebar Component */}
			<LPCSidebar className="hidden lg:flex" />

			{/* Main Content Area */}
			<div className="flex-1 flex flex-col overflow-hidden">
				{/* Top Bar */}
				<header className="bg-white border-b border-[#E5E7EB] px-4 sm:px-6 py-4">
					<div className="flex items-center justify-between gap-4">
						{/* Search Bar - Hidden on small screens */}
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

				{/* Main Content */}
				<main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:ml-0 mt-0 lg:mt-0">
					<div className="max-w-[2400px] mx-auto space-y-6">
						{/* Summary Cards */}
						<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
							<div className="bg-white rounded-2xl p-6 shadow-sm border border-brand-light hover:shadow-md transition-shadow">
								<div className="text-4xl font-bold text-brand-dark mb-2">
									{summary.todayConsultations}
								</div>
								<div className="text-sm font-medium text-brand-medium">
									Today's consultations
								</div>
							</div>
							<div className="bg-white rounded-2xl p-6 shadow-sm border border-brand-light hover:shadow-md transition-shadow">
								<div className="text-4xl font-bold text-brand-dark mb-2">
									{summary.patientsThisMonth}
								</div>
								<div className="text-sm font-medium text-brand-medium">
									Clients this month
								</div>
							</div>

						</div>

						{/* Main Content Grid - Responsive Layout */}
						<div className={`grid gap-6 ${
							layout === 'mobile' ? 'grid-cols-1' : 
							layout === 'tablet' ? 'grid-cols-1 lg:grid-cols-3' : 
							'grid-cols-1 lg:grid-cols-3'
						}`}>
							{/* Left Side - New Clients and Statistics */}
							<div className={`${
								layout === 'mobile' ? 'col-span-1' : 'lg:col-span-2'
							} space-y-6`}>
								{/* New Clients Section */}
								<div className="bg-white rounded-2xl p-6 shadow-sm border border-brand-light hover:shadow-md transition-shadow">
										<div className="flex items-center justify-between mb-6">
											<h2 className="text-xl font-bold text-brand-dark">
												New Clients
											</h2>
										</div>

										<div className={`grid gap-4 mb-4 ${
											layout === 'mobile' ? 'grid-cols-1' : 
											layout === 'tablet' ? 'grid-cols-1 md:grid-cols-2' : 
											'md:grid-cols-2'
										}`}>
											{newPatients.map((p) => (
												<div
													key={p?._id || p?.name}
													className="border border-brand-light rounded-xl p-4 hover:shadow-sm transition-shadow"
												>
													<div className="flex items-center gap-4 mb-4">
														<div className="relative h-12 w-12 rounded-full overflow-hidden">
										<img
											src={resolveImageSrc(p?.avatarUrl)}
											alt={p?.name || "Client"}
											className="w-full h-full object-cover"
											onError={(e) => {
												(e.currentTarget as HTMLImageElement).src = "/images/avatar.PNG";
											}}
										/>
														</div>
														<div>
															<div className="font-bold text-brand-dark">
																{p?.name}
															</div>
															<div className="text-sm text-brand-medium">
																{p?.nextAppointment?.date
																	? formatNewPatientLabel(
																		p?.nextAppointment?.date,
																		p?.nextAppointment?.time
																	)
																	: p?.createdAt}
															</div>
														</div>
													</div>
													<Link
														href={`/lpc/patients${p?._id
															? `?patientId=${encodeURIComponent(
																String(p._id)
															)}`
															: ""
															}`}
														className="w-full py-2 px-10 bg-brand-primary text-white rounded-lg text-sm font-medium bg-[#85af34] transition-colors text-center min-h-11"
													>
														View Detail
													</Link>
												</div>
											))}
										</div>

									<div className="flex justify-end">
										<Link
											href="/lpc/patients"
											className="flex items-center gap-2 text-sm font-medium text-brand-medium hover:text-brand-dark transition-colors"
										>
											View all
											<ChevronRight className="h-4 w-4" />
										</Link>
									</div>
								</div>

								{/* Clients Statistics */}
								<div className="bg-white rounded-2xl p-6 shadow-sm border border-brand-light hover:shadow-md transition-shadow">
									<div className="flex items-center justify-between mb-6">
										<h2 className="text-xl font-bold text-brand-dark">
											Clients Statistics
										</h2>
										<DropdownMenu>
											<DropdownMenuTrigger asChild>
												<button className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium text-brand-dark bg-brand-light border border-brand-light hover:bg-white transition-colors outline-none">
													{statsRange === "week" ? "This Week" : "This Month"}
													<ChevronDown className="h-4 w-4 text-brand-medium" />
												</button>
											</DropdownMenuTrigger>
											<DropdownMenuContent align="end" className="w-32">
												<DropdownMenuItem onClick={() => setStatsRange("week")}>
													This Week
												</DropdownMenuItem>
												<DropdownMenuItem onClick={() => setStatsRange("month")}>
													This Month
												</DropdownMenuItem>
											</DropdownMenuContent>
										</DropdownMenu>
									</div>

									{/* Bar Chart */}
									<div className="w-full">
										<div className="flex items-end justify-between h-56 gap-4 px-3">
											{displayWeekDays.map((day, index) => (
												<div
													key={index}
													className="flex-1 h-full self-stretch flex flex-col items-center group relative"
												>
													<div className="relative w-full h-full flex flex-col justify-end">
														<div
															className={`mx-auto w-10 md:w-12 rounded-t-2xl transition-all cursor-pointer min-h-5 ${activeBars.includes(index)
																? "bg-[#9AC63F]"
																: "bg-[#F3F4F6]"
																}`}
															style={{ height: `${barHeights[index]}%` }}
														/>
													</div>
													<span className="mt-3 text-xs font-medium text-brand-medium">
														{day}
													</span>
													{/* Tooltip on hover */}
													{activeBars.includes(index) && (
														<div className="absolute -top-20 left-1/2 -translate-x-1/2 bg-white text-brand-dark text-xs px-3 py-2 rounded-lg border border-brand-light opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 shadow-[0_8px_24px_rgba(17,24,39,0.15)] whitespace-nowrap">
															<div className="text-center">
																<div className="text-sm font-semibold">
																	{barPatientCounts[index]} patients
																</div>
															</div>
															<div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-full w-0 h-0 border-l-6 border-r-6 border-t-6 border-transparent border-t-white"></div>
                                                            <div className="absolute -bottom-px left-1/2 -translate-x-1/2 translate-y-full w-0 h-0 border-l-6 border-r-6 border-t-6 border-transparent border-t-brand-light"></div>
														</div>
													)}
												</div>
											))}
										</div>
									</div>
								</div>
							</div>

							{/* Right Side - Tentative Appointments */}
								<div className={`${
									layout === 'mobile' ? 'col-span-1' : 'lg:col-span-1'
								}`}>
								<div className="bg-white rounded-2xl p-6 shadow-sm border border-brand-light hover:shadow-md transition-shadow sticky top-6">
									{/* Top Navigation Tabs */}
										<div className={`flex items-center gap-2 mb-4 ${
											layout === 'mobile' ? 'flex-col' : 'flex-row'
										}`}>
											<button
												onClick={() => setViewMode("Day")}
												className={`flex-1 px-4 py-2 rounded-full text-sm font-medium transition-colors ${viewMode === "Day"
													? "bg-[#9AC63F] text-white"
													: "bg-[#E5E7EB] text-brand-medium hover:bg-[#D1D5DB]"
													}`}
											>
												Day
											</button>
											<button
												onClick={() => setViewMode("Week")}
												className={`flex-1 px-4 py-2 rounded-full text-sm font-medium transition-colors ${viewMode === "Week"
													? "bg-[#9AC63F] text-white"
													: "bg-[#E5E7EB] text-brand-medium hover:bg-[#D1D5DB]"
													}`}
											>
												Week
											</button>
											<button
												onClick={() => setViewMode("Month")}
												className={`flex-1 px-4 py-2 rounded-full text-sm font-medium transition-colors ${viewMode === "Month"
													? "bg-[#9AC63F] text-white"
													: "bg-[#E5E7EB] text-brand-medium hover:bg-[#D1D5DB]"
													}`}
											>
												Month
											</button>
										</div>
                                    {/* Section Title */}
                                        <h2 className="text-xl font-bold text-brand-dark mb-4">
                                            Tentative Appointments
                                        </h2>

									{/* Appointments List */}
										<div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
											{tentativeAppointments.map((appointment: any) => (
												<div
													key={appointment?._id || appointment?.patient?.name}
													className="flex items-center gap-4 p-3 rounded-xl hover:bg-brand-light transition-colors"
												>
                                                    <div className="relative h-12 w-12 rounded-full overflow-hidden shrink-0">
														<img
															src={resolveImageSrc(appointment?.patient?.avatarUrl)}
															alt={appointment?.patient?.name || "Client"}
															className="w-full h-full object-cover"
															onError={(e) => {
																(e.currentTarget as HTMLImageElement).src = "/images/avatar.PNG";
															}}
														/>
													</div>
													<div className="flex-1 min-w-0">
														<div className="font-semibold text-brand-dark mb-1">
															{appointment?.patient?.name || "Client"}
														</div>
														<div className="text-sm text-brand-medium">
															{formatHM(appointment?.time)}
														</div>
													</div>
                                                    <button className="p-2 hover:bg-[#E5E7EB] rounded-lg transition-colors shrink-0 min-h-11 min-w-11">
														<MoreVertical className="h-5 w-8 text-[#9CA3AF]" />
													</button>
												</div>
											))}
										</div>
								</div>
							</div>
						</div>
					</div>
				</main>
			</div>
		</div>
	);
}
