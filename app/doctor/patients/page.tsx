"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { contactMessage, activeMessages } from "@/hooks/messages";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import {
	Search,
	Bell,
	ChevronDown,
	ChevronLeft,
	ChevronRight,
	Grid,
	Users,
	Calendar,
	MessageSquare,
	FileText,
	Stethoscope,
	Phone,
	Plus,
	Trash2,
	Eye,
	ArrowLeft,
	MessageCircle,
	Video,
	Star,
	Download,
	File,
	X,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { logout } from "@/lib/utils";
import TopBarUserMenu from "@/components/TopBarUserMenu";
import Cookies from "js-cookie";
import {
	clientAppointments,
	deleteClientAppointment,
	updateDoctorNotes,
	markAppointmentAsCompleted,
} from "@/hooks/appointments";
import { MoreVertical, User, Settings, LogOut } from "lucide-react";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	Select,
	SelectTrigger,
	SelectContent,
	SelectItem,
	SelectValue,
} from "@/components/ui/select";
import { enqueueSnackbar } from "notistack";

export default function DoctorPatients() {
	const pathname = usePathname();
    const navLinkClasses = (href: string) =>
        `flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${pathname === href
            ? "bg-[#9AC63F] text-white cursor-default"
            : "text-[#6B7280] hover:bg-[#F9FAFB]"
        }`;
	const router = useRouter();
	const [loggedInUser, setLoggedInUser] = useState<any>(null);
	const [searchTerm, setSearchTerm] = useState("");
	const [patients, setPatients] = useState<any[]>([]);
	const [isDeleting, setIsDeleting] = useState(false);
	const [confirmDelete, setConfirmDelete] = useState<{
		open: boolean;
		id: string | null;
	}>({
		open: false,
		id: null,
	});
	const [selectedPatient, setSelectedPatient] = useState<any>(null);
	const [isCompleting, setIsCompleting] = useState(false);
	const [viewMode, setViewMode] = useState<"table" | "profile">("table");
	const [isMedicalModalOpen, setIsMedicalModalOpen] = useState(false);
	const [isNotepadOpen, setIsNotepadOpen] = useState(false);
	const [notepadText, setNotepadText] = useState("");
	const [isSavingNotes, setIsSavingNotes] = useState(false);
	const [newConcern, setNewConcern] = useState("");
	const [newMedication, setNewMedication] = useState("");
	const [currentPage, setCurrentPage] = useState(1);
	const [pageSize, setPageSize] = useState(10);
	const [serverPageSize, setServerPageSize] = useState<number | null>(null);
	const [serverTotalPages, setServerTotalPages] = useState<number | null>(null);
	const [totalItems, setTotalItems] = useState(0);
	const [refreshKey, setRefreshKey] = useState(0);
	const [formData, setFormData] = useState({
		history:
			"I've been feeling more anxious lately & struggling to manage stress. I'm finding it hard to stay motivated & focus on daily tasks. It's becoming difficult to enjoy things I used to find fulfilling, and I sometimes feel stuck in a cycle of worry and fatigue.",
		primaryConcerns: [""],
		medications: [""],
	});

	const [conversationId, setConversationId] = useState<string | null>(null);
	const searchParams = useSearchParams();

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
	}, []);

	const resolveUserImageSrc = (url?: string) => {
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

	useEffect(() => {
		const getPatients = async () => {
			try {
				const response: any = await clientAppointments(currentPage, pageSize, searchTerm);
				const normalized = Array.isArray(response?.schedules)
					? response.schedules
					: Array.isArray(response?.appointments)
						? response.appointments
						: Array.isArray(response?.items)
							? response.items
							: Array.isArray(response?.data)
								? response.data
								: Array.isArray(response?.results)
									? response.results
									: Array.isArray(response?.records)
										? response.records
										: Array.isArray(response)
											? response
											: [];
				setPatients(normalized);
				const ti = Number(
					response?.pagination?.totalItems ??
					response?.totalItems ??
					response?.count ??
					normalized.length
				);
				setTotalItems(ti);
				const sp = Number(
					response?.pagination?.itemsPerPage ??
					response?.limit ??
					pageSize
				);
				if (!Number.isNaN(sp) && sp > 0) setServerPageSize(sp);
				const tp = Number(
					response?.pagination?.totalPages ??
					response?.totalPages ??
					Math.ceil(ti / Math.max(1, pageSize))
				);
				if (!Number.isNaN(tp) && tp > 0) setServerTotalPages(tp);
			} catch (error) {
				console.log("error getting patients", error);
				setPatients([]);
				setTotalItems(0);
				setServerTotalPages(1);
			}
		};

		// Add debounce to prevent too many API calls while typing
		const debounceTimer = setTimeout(() => {
			getPatients();
		}, 500);

		return () => clearTimeout(debounceTimer);
	}, [currentPage, pageSize, searchTerm, refreshKey]);

	// Reset to first page when search term changes
	useEffect(() => {
		setCurrentPage(1);
	}, [searchTerm]);

	// Reset to first page when page size changes
	useEffect(() => {
		setCurrentPage(1);
	}, [pageSize]);

	// Auto-open profile if patientId is in the URL
	useEffect(() => {
		const pid = searchParams.get("patientId");
		if (!pid) return;
		if (!Array.isArray(patients) || patients.length === 0) return;
		const match = patients.find((p: any) => {
			const ids = [
				String(p?._id || ""),
				String(p?.patientId?._id || p?.patientId || ""),
				String(p?.client?._id || ""),
				String(p?.patient?._id || ""),
				String(p?.formId || ""),
			].filter(Boolean);
			return ids.includes(pid);
		});
		if (match) {
			setSelectedPatient(match);
			setViewMode("profile");
		}
	}, [searchParams, patients]);

	useEffect(() => {
		const findConversation = async () => {
			try {
				if (!selectedPatient) return;
				const rid =
					selectedPatient?.client?._id ||
					selectedPatient?.client?.id ||
					selectedPatient?.patientId?._id ||
					selectedPatient?.id;
				if (!rid) return;
				const list = await activeMessages();
				const match = Array.isArray(list)
					? list.find((conv: any) =>
						Array.isArray(conv?.participants) &&
						conv.participants.some((p: any) => String(p?._id) === String(rid))
					)
					: null;
				setConversationId(match?._id ?? null);
			} catch { }
		};
		findConversation();
	}, [selectedPatient]);

	useEffect(() => {
		if (!patients || patients.length === 0) return;
		if (typeof window === "undefined") return;
		const params = new URLSearchParams(window.location.search || "");
		const id = params.get("patientId");
		const nameParam = params.get("patientName");
		const match = id
			? patients.find(
				(p: any) =>
					String(p?._id) === String(id) ||
					String(p?.patientId?._id) === String(id) ||
					String(p?.client?._id || p?.client?.id) === String(id)
			)
			: nameParam
				? patients.find(
					(p: any) =>
						String(p?.client?.name || "").toLowerCase() ===
						String(nameParam).toLowerCase()
				)
				: null;
		if (match) {
			handleView(match);
		}
	}, [patients]);

	useEffect(() => {
		let cancelled = false;
		const run = async () => {
			try {
				const fn =
					typeof window !== "undefined" ? (window as any).untitledApi : undefined;
				if (typeof fn === "function") {
					const res = await fn();
					if (!cancelled) {
						console.log(res);
					}
				} else {
					console.log("untitledApi not available");
				}
			} catch (error) {
				console.error(error);
			}
		};
		run();
		return () => {
			cancelled = true;
		};
	}, []);

	const handleMarkCompleted = async () => {
		// Verify we have the appointment ID from the selected patient object
		// The object structure is saved in state when "View" button is clicked
		if (!selectedPatient?._id) {
			console.error("No appointment ID found in selectedPatient", selectedPatient);
			return;
		}
		
		try {
			setIsCompleting(true);
			await markAppointmentAsCompleted(selectedPatient._id);
			
			// Show success toast
			enqueueSnackbar("Appointment marked as completed successfully", { variant: "success" });
			
			// Refresh list and redirect to table view
			setViewMode("table");
			setSelectedPatient(null);
			setRefreshKey(prev => prev + 1);
		} catch (error) {
			console.error("Error marking appointment as completed:", error);
			enqueueSnackbar("Failed to mark appointment as completed", { variant: "error" });
		} finally {
			setIsCompleting(false);
		}
	};

	const filteredPatients = useMemo(() => {
		const q = searchTerm.trim().toLowerCase();
		if (!q) return patients;
		return patients.filter((patient: any) => {
			const dateStr = typeof patient?.date === "string" ? patient?.date : "";
			const clientName = patient?.client?.name || "";
			const email = patient?.client?.email || "";
			const phone = patient?.client?.phone || "";
			const address = patient?.client?.address || "";
			const status = patient?.status || "";
			const doctorFirst = patient?.doctor?.firstname || "";
			const doctorLast = patient?.doctor?.lastname || "";
			const concerns = Array.isArray(
				patient?.patientMedicalInfo?.primaryConcerns
			)
				? patient.patientMedicalInfo.primaryConcerns.join(" ")
				: "";
			const meds = Array.isArray(patient?.patientMedicalInfo?.medications)
				? patient.patientMedicalInfo.medications.join(" ")
				: "";
			const haystack = [
				clientName,
				email,
				phone,
				address,
				status,
				dateStr,
				doctorFirst,
				doctorLast,
				`${doctorFirst} ${doctorLast}`,
				concerns,
				meds,
			]
				.join(" ")
				.toLowerCase();
			return haystack.includes(q);
		});
	}, [patients, searchTerm]);

	const validPatients = useMemo(() => filteredPatients ?? [], [filteredPatients]);

	const totalPages = useMemo(
		() => serverTotalPages ?? Math.max(1, Math.ceil(validPatients.length / pageSize)),
		[serverTotalPages, validPatients.length, pageSize]
	);

	useEffect(() => {
		setCurrentPage(1);
	}, [searchTerm]);

	useEffect(() => {
		setCurrentPage(1);
	}, [pageSize]);

	const currentItems = useMemo(() => {
		const serverPaginated = totalItems > validPatients.length;
		if (serverPaginated) return validPatients;
		const start = (currentPage - 1) * pageSize;
		return validPatients.slice(start, start + pageSize);
	}, [validPatients, currentPage, pageSize, totalItems]);

	const formatDate = (dateString: string) => {
		if (!dateString) return "";
		const date = new Date(dateString);
		const day = String(date.getDate()).padStart(2, "0");
		const month = String(date.getMonth() + 1).padStart(2, "0");
		const year = date.getFullYear();
		return `${day} / ${month} / ${year}`;
	};

	const handleView = (patient: any) => {
		setSelectedPatient(patient);
		setViewMode("profile");
		setNotepadText(
			patient?.patientMedicalInfo?.doctorNotes ||
			patient?.patientMedicalInfo?.history ||
			patient?.description ||
			formData.history
		);
		setFormData({
			history:
				patient?.patientMedicalInfo?.doctorNotes ||
				patient?.patientMedicalInfo?.history ||
				patient?.description ||
				formData.history,
			primaryConcerns:
				patient?.patientMedicalInfo?.primaryConcerns ||
				formData.primaryConcerns,
			medications:
				patient?.patientMedicalInfo?.medications || formData.medications,
		});
	};

	const handleBack = () => {
		setViewMode("table");
		setSelectedPatient(null);
		window.location.href = "/doctor/patients";
	};

	const handleDelete = async (id: string) => {
		setIsDeleting(true);
		try {
			await deleteClientAppointment(id);
			setPatients((prev: any) => prev.filter((p: any) => p._id !== id));
		} catch (error) {
			console.log(error);
		} finally {
			setIsDeleting(false);
		}
	};

	const getStatusColor = (status: string) => {
		switch (status?.toLowerCase()) {
			case "submitted":
				return "text-[#9AC63F]";
			case "pending":
				return "text-[#F97316]";
			default:
				return "text-[#6B7280]";
		}
	};

	const resolveImageSrc = (input?: string | null) => {
		const src = String(input || "").trim();
		if (!src) return null;
		if (src.startsWith("data:")) return src;
		if (/^https?:\/\//i.test(src)) return src;
		if (src.startsWith("/")) return src;
		if (/^[a-zA-Z]:\\/.test(src)) return null;
		if (src.includes("\\")) return null;
		return null;
	};

	const patientAvatarSrc = useMemo(() => {
		return process.env.NEXT_PUBLIC_API_URL + "/uploads/" + selectedPatient?.patient?.avatarUrl || "/images/avatar.PNG";
	}, [selectedPatient]);

	return (
		<>
			<div className="flex h-screen bg-[#F5F5F5] overflow-hidden">
				{/* Left Sidebar */}
				<aside className="w-64 bg-white border-r border-[#E5E7EB] flex flex-col">
					{/* Logo Section */}
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

                    {/* Navigation */}
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
                </nav>
				</aside>

				{/* Main Content Area */}
				<div className="flex-1 flex flex-col overflow-hidden">
					{/* Top Bar */}
					<header className="bg-white border-b border-[#E5E7EB] px-6 py-4">
						<div className="flex items-center justify-between">


                            <TopBarUserMenu user={loggedInUser} />
						</div>
					</header>

					{/* Main Content */}
					<main className="flex-1 overflow-y-auto p-6">
						<div className="max-w-[2400px] mx-auto">
							{viewMode === "table" ? (
								<>
									{/* Header Section */}
									<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
										{/* Search Bar */}
										<div className="relative w-full sm:w-auto sm:flex-1 max-w-md">
											<Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-8 text-[#9CA3AF]" />
											<input
												type="text"
												placeholder="Search"
												value={searchTerm}
												onChange={(e) => setSearchTerm(e.target.value)}
												className="w-full pl-12 pr-4 py-2.5 rounded-xl bg-white border border-[#E5E7EB] text-sm focus:outline-none focus:ring-2 focus:ring-[#9AC63F]/20"
											/>
										</div>

										{/* Add New Button and Count */}
										<div className="flex flex-col sm:flex-row items-end sm:items-center gap-3">
											{/* <button className="flex items-center gap-2 px-4 py-2 bg-[#9AC63F] text-white rounded-xl text-sm font-medium hover:bg-[#85af34] transition-colors whitespace-nowrap">
												<Plus className="h-4 w-4" />
												Add New
											</button> */}
											{/* <span className="text-sm text-[#6B7280]">
												Showing {filteredPatients?.length} of {patients?.length}{" "}
												Clients
											</span> */}
										</div>
									</div>

									{/* Clients Table */}
									<div className="bg-white rounded-2xl shadow-sm border border-[#E5E7EB] overflow-hidden">
										<div className="overflow-x-auto">
											<Table>
												<TableHeader className="bg-white">
													<TableRow className="border-b border-[#E5E7EB]">
														<TableHead className="text-sm font-semibold text-[#111827] py-4">
															Date
														</TableHead>
														<TableHead className="text-sm font-semibold text-[#111827] py-4">
															Client Name
														</TableHead>
														<TableHead className="text-sm font-semibold text-[#111827] py-4">
															Status
														</TableHead>
														<TableHead className="text-sm font-semibold text-[#111827] py-4">
															Actions
														</TableHead>
													</TableRow>
												</TableHeader>
												<TableBody>
													{validPatients?.length === 0 ? (
														<TableRow>
															<TableCell
																colSpan={4}
																className="text-center py-8 text-sm text-[#6B7280]"
															>
																No patients found
															</TableCell>
														</TableRow>
													) : (
														currentItems?.map((patient: any, index: number) => (
															<TableRow
																key={index}
																className="border-b border-[#E5E7EB] hover:bg-[#F9FAFB] transition-colors"
															>
																<TableCell className="text-sm text-[#111827] py-4">
																	{patient?.date}
																</TableCell>
																<TableCell className="text-sm font-medium text-[#111827] py-4">
																	{patient?.client?.name ??
																		(patient?.client?.firstname && patient?.client?.lastname
																			? `${patient?.client?.firstname} ${patient?.client?.lastname}`
																			: patient?.client?.firstname ?? patient?.client?.lastname) ??
																		patient?.clientName ??
																		patient?.name ??
																		(patient?.patient?.firstname && patient?.patient?.lastname
																			? `${patient?.patient?.firstname} ${patient?.patient?.lastname}`
																			: patient?.patient?.name ?? patient?.patient?.firstname ?? patient?.patient?.lastname) ??
																		((patient?.patientId?.firstname && patient?.patientId?.lastname)
																			? `${patient?.patientId?.firstname} ${patient?.patientId?.lastname}`
																			: patient?.patientId?.name) ??
																		"Unknown"}
																</TableCell>
																<TableCell className="py-4">
																	<span
																		className={`text-sm font-medium ${getStatusColor(
																			patient?.status
																		)}`}
																	>
																		{patient?.status?.charAt(0).toUpperCase() +
																			patient?.status?.slice(1)}
																	</span>
																</TableCell>
																<TableCell className="py-4">
																	<div className="flex items-center gap-2">
																		<button
																			onClick={() => handleView(patient)}
																			className="p-2 hover:bg-[#F9FAFB] rounded-full transition-colors"
																			title="View"
																		>
																			<Eye className="h-4 w-4 text-[#6B7280]" />
																		</button>
																		<button
																			onClick={(e) => {
																				e.stopPropagation();
																				setConfirmDelete({
																					open: true,
																					id: patient?._id,
																				});
																			}}
																			disabled={isDeleting}
																			className="p-2 hover:bg-[#F9FAFB] rounded-full transition-colors"
																			title="Delete"
																		>
																			<Trash2 className="h-4 w-4 text-[#6B7280]" />
																		</button>
																	</div>
																</TableCell>
															</TableRow>
														))
													)}
												</TableBody>
											</Table>
										</div>
										<div className="flex items-center justify-between p-4 border-t border-[#E5E7EB] bg-white">
											<div className="flex items-center gap-3">
												<span className="text-sm text-[#6B7280]">
													Rows per page
												</span>
												<Select
													value={String(pageSize)}
													onValueChange={(v) => setPageSize(Number(v))}
												>
													<SelectTrigger className="w-[84px] bg-white border border-[#E5E7EB] rounded-md h-9">
														<SelectValue placeholder={String(pageSize)} />
													</SelectTrigger>
													<SelectContent className="bg-white">
														<SelectItem value="5">5</SelectItem>
														<SelectItem value="10">10</SelectItem>
														<SelectItem value="20">20</SelectItem>
														<SelectItem value="50">50</SelectItem>
													</SelectContent>
												</Select>
											</div>
											<div className="flex items-center gap-3">
												<span className="text-sm text-[#6B7280]">
													{Math.min(
														(currentPage - 1) * Number(serverPageSize ?? pageSize) + 1,
														totalItems || validPatients.length
													)}
													-
													{Math.min(
														currentPage * Number(serverPageSize ?? pageSize),
														totalItems || validPatients.length
													)}{" "}
													of {totalItems || validPatients.length}
												</span>
												<button
													className="p-2 rounded-lg border border-[#E5E7EB] hover:bg-[#F9FAFB] disabled:opacity-50"
													disabled={currentPage === 1}
													onClick={() =>
														setCurrentPage((p) => Math.max(1, p - 1))
													}
												>
													<ChevronLeft className="h-4 w-4 text-[#6B7280]" />
												</button>
												<button
													className="p-2 rounded-lg border border-[#E5E7EB] hover:bg-[#F9FAFB] disabled:opacity-50"
													disabled={currentPage >= totalPages}
													onClick={() =>
														setCurrentPage((p) => Math.min(totalPages, p + 1))
													}
												>
													<ChevronRight className="h-4 w-4 text-[#6B7280]" />
												</button>
											</div>
										</div>
									</div>
								</>
							) : (
								/* Client Profile View */
								selectedPatient && (
									<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
										{/* Left Side - Main Content */}
										<div className="lg:col-span-2 space-y-6">
											{/* Back Button */}
											<button
												onClick={handleBack}
												className="flex items-center gap-2 text-sm font-medium text-[#6B7280] hover:text-[#111827] transition-colors"
											>
												<ArrowLeft className="h-4 w-4" />
												Back to Clients
											</button>

											{/* Client Information Card */}
											<div className="bg-white rounded-2xl p-6 shadow-sm border border-[#E5E7EB]">
												<div className="flex items-start gap-6" onClick={() => console.log(selectedPatient?.patient?.firstname)}>
                                                    <div className="relative h-24 w-24 rounded-full overflow-hidden shrink-0 border-2 border-[#E5E7EB]">
														<Image
															onClick={() => console.log(patientAvatarSrc)}
															src={patientAvatarSrc}
															alt={selectedPatient?.client?.name || selectedPatient?.patient?.firstname || "Client"}
															fill
															unoptimized
															className="object-cover"
														/>
													</div>
													<div className="flex-1 min-w-0">
														<h2 className="text-2xl font-bold text-[#111827] mb-3">
															{selectedPatient?.client?.name ??
																(selectedPatient?.client?.firstname && selectedPatient?.client?.lastname
																	? `${selectedPatient?.client?.firstname} ${selectedPatient?.client?.lastname}`
																	: selectedPatient?.client?.firstname ?? selectedPatient?.client?.lastname) ??
																selectedPatient?.clientName ??
																selectedPatient?.name ??
																(selectedPatient?.patient?.firstname && selectedPatient?.patient?.lastname
																	? `${selectedPatient?.patient?.firstname} ${selectedPatient?.patient?.lastname}`
																	: selectedPatient?.patient?.name ?? selectedPatient?.patient?.firstname ?? selectedPatient?.patient?.lastname) ??
																((selectedPatient?.patientId?.firstname && selectedPatient?.patientId?.lastname)
																	? `${selectedPatient?.patientId?.firstname} ${selectedPatient?.patientId?.lastname}`
																	: selectedPatient?.patientId?.name) ??
																"Unknown"}
														</h2>
														<div className="space-y-1.5 mb-4">
															<p className="text-sm text-[#6B7280]">
																{selectedPatient?.client?.email ?? selectedPatient?.patient?.email ?? selectedPatient?.patientId?.email ?? selectedPatient?.email ?? "Unknown"}
															</p>
															<p className="text-sm text-[#6B7280]">
																{selectedPatient?.client?.phone ?? selectedPatient?.patient?.phone ?? selectedPatient?.patientId?.phone ?? selectedPatient?.phone ?? selectedPatient?.client?.mobile ?? "Unknown"}
															</p>
															<p className="text-sm text-[#6B7280]">
																{selectedPatient?.address ?? selectedPatient?.client?.address ?? selectedPatient?.patient?.address ?? selectedPatient?.patientId?.address ?? "Unknown"}
															</p>
														</div>
														<div className="mt-3 pt-4 border-t border-[#E5E7EB]">
															<div className="grid grid-cols-2 sm:grid-cols-4 gap-x-8 gap-y-4">
																<div>
																	<p className="text-base sm:text-lg font-semibold text-[#111827]">
																		{selectedPatient?.patientMedicalInfo?.age || "Unknown"} years
																	</p>
																	<p className="text-xs text-[#6B7280]">Age</p>
																</div>
																<div>
																	<p className="text-base sm:text-lg font-semibold text-[#111827]">
																		{selectedPatient?.patientMedicalInfo?.weight
																			? `${selectedPatient.patientMedicalInfo.weight} lb`
																			: "Unknown"}
																	</p>
																	<p className="text-xs text-[#6B7280]">
																		Weight
																	</p>
																</div>
																<div>
																	<p className="text-base sm:text-lg font-semibold text-[#111827]">
																		{selectedPatient?.patientMedicalInfo?.height
																			? String(
																					selectedPatient.patientMedicalInfo.height
																			  )
																					.replace(".", "'")
																					.replace(/^(\d)(\d{2})$/, "$1'$2")
																			: "Unknown"}
																	</p>
																	<p className="text-xs text-[#6B7280]">
																		Height
																	</p>
																</div>
																<div>
																	<p className="text-base sm:text-lg font-semibold text-[#111827]">
																		{selectedPatient?.patient?.sex || "Unknown"}
																	</p>
																	<p className="text-xs text-[#6B7280]">
																		Gender
																	</p>
																</div>
															</div>
														</div>
													</div>
												</div>
											</div>

											{/* Client History Section */}
											<div className="bg-white rounded-2xl p-6 shadow-sm border border-[#E5E7EB]">
												<div className="flex items-center justify-between mb-4">
													<h3 className="text-xl font-bold text-[#111827]">
														Client History
													</h3>
													{/* <button
														className="p-2 hover:bg-[#F9FAFB] rounded-lg transition-colors"
														onClick={() => setIsMedicalModalOpen(true)}
													>
														<Plus className="h-5 w-8 text-[#6B7280]" />
													</button> */}
												</div>
												<p className="text-sm text-[#6B7280] leading-relaxed mb-6">
													{selectedPatient?.patientMedicalInfo?.history ||
														selectedPatient?.description ||
														formData.history}
												</p>
												<div className="space-y-4">
													<div>
														<p className="text-sm font-semibold text-[#111827] mb-2">
															Primary Concern
														</p>
														<div className="flex flex-wrap gap-2">
															{(
																selectedPatient?.patientMedicalInfo
																	?.primaryConcerns || formData.primaryConcerns
															).map((tag: string, idx: number) => (
																<span
																	key={idx}
																	className="px-3 py-1.5 bg-[#F3F4F6] text-[#6B7280] rounded-full text-sm font-medium"
																>
																	{tag}
																</span>
															))}
														</div>
													</div>
													<div>
														<p className="text-sm font-semibold text-[#111827] mb-2">
															Medication
														</p>
														<div className="flex flex-wrap gap-2">
															{(
																selectedPatient?.patientMedicalInfo
																	?.medications || formData.medications
															).map((tag: string, idx: number) => (
																<span
																	key={idx}
																	className="px-3 py-1.5 bg-[#F3F4F6] text-[#6B7280] rounded-full text-sm font-medium"
																>
																	{tag}
																</span>
															))}
														</div>
													</div>
												</div>
											</div>

											{/* Notes Section */}
											<div className="bg-white rounded-2xl p-6 shadow-sm border border-[#E5E7EB]">
												<div className="flex items-center justify-between mb-4">
													<h3 className="text-xl font-bold text-[#111827]">
														Notes
													</h3>
													<button
														className="p-2 hover:bg-[#F9FAFB] rounded-lg transition-colors"
														onClick={() => setIsNotepadOpen(true)}
													>
														<Plus className="h-5 w-8 text-[#6B7280]" />
													</button>
												</div>
												<p className="text-sm text-[#6B7280] leading-relaxed">
													{selectedPatient?.patientMedicalInfo?.doctorNotes ?? ""}
												</p>
											</div>
										</div>

										{/* Right Sidebar */}
										<div className="lg:col-span-1 space-y-6">
											{/* Communication Bar - Above Doctor Card */}
											<div className="bg-white rounded-2xl p-4 shadow-sm border border-[#E5E7EB] flex flex-col gap-4">
												<div className="flex items-center gap-3 sm:gap-4">
													<button
														aria-label="Message"
														onClick={async () => {
															try {
																const rid =
																	selectedPatient?.client?._id ||
																	selectedPatient?.client?.id ||
																	selectedPatient?.patient?._id ||
																	selectedPatient?.patientId?._id ||
																	selectedPatient?.id;
																const existing = conversationId;
																if (existing) {
																	router.push(`/doctor/messages?conversationId=${existing}`);
																	return;
																}
																const conversation = rid ? await contactMessage(rid) : null;
																const cid = conversation?.id || conversation?._id || conversation?.conversationId;
																if (cid) {
																	setConversationId(String(cid));
																	router.push(`/doctor/messages?conversationId=${cid}`);
																	return;
																}
															} catch { }
															try {
																const fn = typeof window !== 'undefined' ? (window as any).untitledApi : undefined;
																if (typeof fn === 'function') {
																	const res = await fn(selectedPatient?.id);
																	const cid = res?.id || res?._id || res?.conversationId;
																	if (cid) {
																		setConversationId(String(cid));
																		router.push(`/doctor/messages?conversationId=${cid}`);
																		return;
																	}
																}
															} catch (error) {
																console.error('Error starting conversation:', error);
															}
														}}
														className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] hover:bg-white transition-colors"
													>
														<MessageCircle className="h-5 w-8 text-[#6B7280]" />
													</button>

											</div>
										</div>
											
											{/* Status Action Card */}
											<div className="bg-[#F9FAFB] rounded-xl p-4 border border-[#E5E7EB]">
												<h4 className="text-sm font-semibold text-[#111827] mb-2">Appointment Status</h4>
												<p className="text-xs text-[#6B7280] mb-3">
													Mark this appointment as completed once the session is finished.
												</p>
												<button
													onClick={handleMarkCompleted}
													disabled={isCompleting || selectedPatient?.status?.toLowerCase() !== 'pending'}
													className={`w-full group relative flex items-center justify-center gap-2 py-2.5 rounded-xl font-medium shadow-md transition-all duration-200 ${isCompleting || selectedPatient?.status?.toLowerCase() !== 'pending' ? 'bg-[#E5E7EB] text-[#9CA3AF] cursor-not-allowed shadow-none' : 'bg-linear-to-r from-[#9AC63F] to-[#85af34] text-white hover:shadow-lg hover:-translate-y-px'}`}
												>
													{isCompleting ? (
														<>
															<svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
																<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
																<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
															</svg>
															<span>Completing...</span>
														</>
													) : (
														<>
															<div className="p-1 bg-white/20 rounded-full">
																<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-check">
																	<polyline points="20 6 9 17 4 12"></polyline>
																</svg>
															</div>
															<span>Mark Completed</span>
														</>
													)}
												</button>
											</div>

											{/* Doctor / Therapist Assigned */}
											<div className="bg-white rounded-2xl p-6 shadow-sm border border-[#E5E7EB]">
												<h3 className="text-lg font-bold text-[#111827] mb-4">
													Doctor / Therapist Assigned
												</h3>
												<div className="flex items-start gap-4">
													<Link
														href={conversationId ? `/doctor/messages?conversationId=${conversationId}` : "/doctor/messages"}
                                                        className="relative h-16 w-16 rounded-full overflow-hidden shrink-0"
													>
														<Image
															src={
																resolveUserImageSrc(
																	selectedPatient?.doctor?.avatar ||
																	selectedPatient?.doctor?.avatarUrl ||
																	loggedInUser?.avatarUrl ||
																	loggedInUser?.avatar ||
																	""
																)
																|| "/images/avatar.PNG"
															}
															alt={`${selectedPatient?.doctor?.firstname ?? "Dr."} ${selectedPatient?.doctor?.lastname ?? "Turner"}`}
															fill
															unoptimized
															className="object-cover"
														/>
													</Link>
													<div className="flex-1">
														<p className="text-base sm:text-lg font-semibold text-[#111827] mb-0.5">
															{`${selectedPatient?.doctor?.firstname ?? "Dr."
																} ${selectedPatient?.doctor?.lastname ?? "Turner"
																}`}
														</p>
														<p className="text-sm text-[#6B7280]">
															{selectedPatient?.doctor?.specialization || 'Specialization not specified'}
															{selectedPatient?.doctor?.education ? `, ${selectedPatient.doctor.education.toUpperCase()}` : ''}
														</p>
														{selectedPatient?.doctor?.about && (
															<p className="text-sm text-[#6B7280] mt-1">
																{selectedPatient.doctor.about}
															</p>
														)}
														<div className="pt-4 mt-3 border-t border-[#E5E7EB]">
															<div className="flex items-center">
																{selectedPatient?.doctor?.workExperience && (
																	<div className="min-w-[140px]">
																		<p className="text-sm font-semibold text-[#111827]">
																			{selectedPatient.doctor.workExperience} {selectedPatient.doctor.workExperience === 1 ? 'Year' : 'Years'}
																		</p>
																		<p className="text-xs text-[#6B7280]">
																			Experience
																		</p>
																	</div>
																)}
																{selectedPatient?.doctor?.services?.length > 0 && (
																	<div className="ml-8">
																		<p className="text-sm font-semibold text-[#111827]">
																			Services
																		</p>
																		<p className="text-xs text-[#6B7280]">
																			{selectedPatient.doctor.services.join(', ')}
																		</p>
																	</div>
																)}
															</div>
														</div>
													</div>
												</div>
											</div>

											{/* Documents Section */}
											<div className="bg-white rounded-2xl p-6 shadow-sm border border-[#E5E7EB]">
												<div className="flex items-center justify-between mb-4">
													<h3 className="text-lg font-bold text-[#111827]">
														Documents
													</h3>
												</div>
												<div className="space-y-3">
													{(Array.isArray(selectedPatient?.patientDocuments) &&
														selectedPatient?.patientDocuments?.length > 0
														? selectedPatient.patientDocuments.flatMap(
															(group: any) =>
																[
																	group?.documentFile
																].filter(Boolean)
														)
														: []
													).map((doc: any, idx: number) => (
														<div
															key={idx}
															className="flex items-center justify-between p-3 border border-[#E5E7EB] rounded-lg hover:bg-[#F9FAFB] transition-colors"
														>
															<div className="flex items-center gap-3">
																<File className="h-5 w-8 text-red-500" />
																<span className="text-sm font-medium text-[#111827]">
																	{doc?.documentType || "Document"}
																</span>
															</div>
															<a href={`${process.env.NEXT_PUBLIC_API_URL}/uploads/${doc?.fileUrl}`} target="_blank" rel="noopener noreferrer" className="p-2 hover:bg-[#E5E7EB] rounded-lg transition-colors">
																<Download className="h-4 w-4 text-[#6B7280]" />
															</a>
														</div>
													))}
												</div>
											</div>
										</div>
									</div>
								)
							)}
						</div>
					</main>
				</div>
			</div>

			<Dialog open={isMedicalModalOpen} onOpenChange={setIsMedicalModalOpen}>
				<DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
					<DialogHeader>
						<DialogTitle className="text-2xl font-bold text-[#111827]">
							Medical Information
						</DialogTitle>
					</DialogHeader>
					<div className="space-y-6 mt-4">
						<div className="space-y-3">
							<label className="block text-sm font-semibold text-[#6B7280]">
								History
							</label>
							<textarea
								value={formData.history}
								onChange={(e) =>
									setFormData({ ...formData, history: e.target.value })
								}
								rows={6}
								placeholder="Enter patient history..."
								className="w-full px-4 py-3 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9AC63F]/20 resize-none"
							/>
						</div>
						<div className="space-y-3">
							<label className="block text-sm font-semibold text-[#6B7280]">
								Primary Concern
							</label>
							<div className="flex flex-wrap gap-2 mb-3">
								{formData.primaryConcerns.map((concern, index) => (
									<span
										key={index}
										className="inline-flex items-center gap-2 px-4 py-2 bg-[#F3F4F6] text-[#6B7280] rounded-full text-sm font-medium"
									>
										{concern}
										<button
											onClick={() =>
												setFormData({
													...formData,
													primaryConcerns: formData.primaryConcerns.filter(
														(_, i) => i !== index
													),
												})
											}
											className="hover:text-red-500 transition-colors"
										>
											<X className="h-3 w-3" />
										</button>
									</span>
								))}
							</div>
							<div className="flex gap-2">
								<input
									type="text"
									value={newConcern}
									onChange={(e) => setNewConcern(e.target.value)}
									onKeyPress={(e) => {
										if (e.key === "Enter") {
											e.preventDefault();
											if (
												newConcern.trim() &&
												!formData.primaryConcerns.includes(newConcern.trim())
											) {
												setFormData({
													...formData,
													primaryConcerns: [
														...formData.primaryConcerns,
														newConcern.trim(),
													],
												});
												setNewConcern("");
											}
										}
									}}
									placeholder="Add primary concern..."
									className="flex-1 px-4 py-2 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9AC63F]/20"
								/>
								<button
									onClick={() => {
										if (
											newConcern.trim() &&
											!formData.primaryConcerns.includes(newConcern.trim())
										) {
											setFormData({
												...formData,
												primaryConcerns: [
													...formData.primaryConcerns,
													newConcern.trim(),
												],
											});
											setNewConcern("");
										}
									}}
									className="px-4 py-2 bg-[#9AC63F] text-white rounded-lg hover:bg-[#85af34] transition-colors"
								>
									<Plus className="h-4 w-4" />
								</button>
							</div>
						</div>
						<div className="space-y-3">
							<label className="block text-sm font-semibold text-[#6B7280]">
								Any Medication
							</label>
							<div className="flex flex-wrap gap-2 mb-3">
								{formData.medications.map((medication, index) => (
									<span
										key={index}
										className="inline-flex items-center gap-2 px-4 py-2 bg-[#F3F4F6] text-[#6B7280] rounded-full text-sm font-medium"
									>
										{medication}
										<button
											onClick={() =>
												setFormData({
													...formData,
													medications: formData.medications.filter(
														(_, i) => i !== index
													),
												})
											}
											className="hover:text-red-500 transition-colors"
										>
											<X className="h-3 w-3" />
										</button>
									</span>
								))}
							</div>
							<div className="flex gap-2">
								<input
									type="text"
									value={newMedication}
									onChange={(e) => setNewMedication(e.target.value)}
									onKeyPress={(e) => {
										if (e.key === "Enter") {
											e.preventDefault();
											if (
												newMedication.trim() &&
												!formData.medications.includes(newMedication.trim())
											) {
												setFormData({
													...formData,
													medications: [
														...formData.medications,
														newMedication.trim(),
													],
												});
												setNewMedication("");
											}
										}
									}}
									placeholder="Add medication..."
									className="flex-1 px-4 py-2 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9AC63F]/20"
								/>
								<button
									onClick={() => {
										if (
											newMedication.trim() &&
											!formData.medications.includes(newMedication.trim())
										) {
											setFormData({
												...formData,
												medications: [
													...formData.medications,
													newMedication.trim(),
												],
											});
											setNewMedication("");
										}
									}}
									className="px-4 py-2 bg-[#9AC63F] text-white rounded-lg hover:bg-[#85af34] transition-colors"
								>
									<Plus className="h-4 w-4" />
								</button>
							</div>
						</div>
						<div className="flex justify-end gap-3 pt-4 border-t border-[#E5E7EB]">
							<button
								onClick={() => setIsMedicalModalOpen(false)}
								className="px-6 py-2 border border-[#E5E7EB] rounded-lg text-[#6B7280] hover:bg-[#F9FAFB] transition-colors"
							>
								Cancel
							</button>
							<button
								onClick={() => setIsMedicalModalOpen(false)}
								className="px-6 py-2 bg-[#9AC63F] text-white rounded-lg hover:bg-[#85af34] transition-colors"
							>
								Save
							</button>
						</div>
					</div>
				</DialogContent>
			</Dialog>

			<Dialog
				open={confirmDelete.open}
				onOpenChange={(o) =>
					setConfirmDelete({ open: o, id: o ? confirmDelete.id : null })
				}
			>
				<DialogContent className="max-w-sm w-full rounded-2xl">
					<DialogHeader>
						<DialogTitle className="text-lg font-semibold">
							Delete Client?
						</DialogTitle>
					</DialogHeader>
					<p className="text-sm text-[#6B7280]">
						This action cannot be undone.
					</p>
					<div className="flex justify-end gap-3 mt-4">
						<button
							onClick={() => setConfirmDelete({ open: false, id: null })}
							className="px-6 py-2 border border-[#E5E7EB] rounded-lg text-[#6B7280] hover:bg-[#F9FAFB] transition-colors"
						>
							Cancel
						</button>
						<button
							disabled={isDeleting}
							onClick={() => {
								if (confirmDelete.id) handleDelete(confirmDelete.id);
								setConfirmDelete({ open: false, id: null });
							}}
							className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
						>
							Delete
						</button>
					</div>
				</DialogContent>
			</Dialog>

			<Dialog open={isNotepadOpen} onOpenChange={setIsNotepadOpen}>
				<DialogContent className="max-w-lg w-full rounded-2xl">
					<DialogHeader>
						<DialogTitle className="text-lg font-semibold">Notepad</DialogTitle>
					</DialogHeader>
					<div className="space-y-4">
						<textarea
							value={notepadText}
							onChange={(e) => setNotepadText(e.target.value)}
							rows={8}
							className="w-full px-4 py-3 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9AC63F]/20"
						/>
						<div className="flex justify-end gap-3">
							<button
								onClick={() => setIsNotepadOpen(false)}
								className="px-6 py-2 border border-[#E5E7EB] rounded-lg text-[#6B7280] hover:bg-[#F9FAFB] transition-colors"
							>
								Cancel
							</button>
							<button
								disabled={isSavingNotes}
								onClick={async () => {
									if (!selectedPatient?._id) {
										setIsNotepadOpen(false);
										return;
									}
									try {
										setIsSavingNotes(true);
										const res = await updateDoctorNotes(
											String(selectedPatient._id),
											notepadText.trim()
										);
										setSelectedPatient((prev: any) => ({
											...prev,
											patientMedicalInfo: {
												...(prev?.patientMedicalInfo || {}),
												doctorNotes: res?.doctorNotes || notepadText.trim(),
											},
										}));
										setIsNotepadOpen(false);
									} catch (_) {
										setIsNotepadOpen(false);
									} finally {
										setIsSavingNotes(false);
									}
								}}
								className="px-6 py-2 bg-[#9AC63F] text-white rounded-lg hover:bg-[#85af34] transition-colors"
							>
								{isSavingNotes ? "Saving..." : "Save"}
							</button>
						</div>
					</div>
				</DialogContent>
			</Dialog>
		</>
	);
}
