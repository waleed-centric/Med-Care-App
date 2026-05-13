"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { contactMessage, activeMessages } from "@/hooks/messages";
import { useRouter, useSearchParams } from "next/navigation";
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
import LPCSidebar from "@/components/LPCSidebar";
import { enqueueSnackbar } from "notistack";

const getPatientName = (patient: any) => {
	const clientName = patient?.client?.name;
	const clientFirstName = patient?.client?.firstname || patient?.client?.firstName;
	const clientLastName = patient?.client?.lastname || patient?.client?.lastName;
	
	if (clientFirstName || clientLastName) {
		return `${clientFirstName || ""} ${clientLastName || ""}`.trim();
	}
	
	if (clientName) return clientName;
	
	// Check nested patient object if client is not populated or different structure
	const p = patient?.patient || patient?.patientId;
	const pName = p?.name;
	const pFirst = p?.firstname || p?.firstName;
	const pLast = p?.lastname || p?.lastName;
	
	if (pFirst || pLast) {
			return `${pFirst || ""} ${pLast || ""}`.trim();
	}
	
	if (pName) return pName;

	return patient?.clientName || "Unknown";
};

export default function LPCPatients() {
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

		const debounceTimer = setTimeout(() => {
			getPatients();
		}, 500);

		return () => clearTimeout(debounceTimer);
	}, [currentPage, pageSize, searchTerm, refreshKey]);

	useEffect(() => {
		setCurrentPage(1);
	}, [searchTerm]);

	useEffect(() => {
		setCurrentPage(1);
	}, [pageSize]);

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

	const handleMarkCompleted = async () => {
		if (!selectedPatient?._id) {
			console.error("No appointment ID found in selectedPatient", selectedPatient);
			return;
		}
		
		try {
			setIsCompleting(true);
			await markAppointmentAsCompleted(selectedPatient._id);
			
			enqueueSnackbar("Appointment marked as completed successfully", { variant: "success" });
			
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
			const clientName = getPatientName(patient);
			const email = patient?.client?.email || "";
			const haystack = [clientName, email].join(" ").toLowerCase();
			return haystack.includes(q);
		});
	}, [patients, searchTerm]);

	const validPatients = useMemo(() => filteredPatients ?? [], [filteredPatients]);

	const totalPages = useMemo(
		() => serverTotalPages ?? Math.max(1, Math.ceil(validPatients.length / pageSize)),
		[serverTotalPages, validPatients.length, pageSize]
	);

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
		window.location.href = "/lpc/patients";
	};

	const handleDelete = async (id: string) => {
		setIsDeleting(true);
		try {
			await deleteClientAppointment(id);
			setPatients((prev: any) => prev.filter((p: any) => p._id !== id));
			setRefreshKey(prev => prev + 1);
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

	const patientAvatarSrc = useMemo(() => {
		return process.env.NEXT_PUBLIC_API_URL + "/uploads/" + selectedPatient?.patient?.avatarUrl || "/images/avatar.PNG";
	}, [selectedPatient]);

	return (
		<div className="flex h-screen bg-[#F5F5F5] overflow-hidden">
			<LPCSidebar />

			<div className="flex-1 flex flex-col overflow-hidden">
				<header className="bg-white border-b border-[#E5E7EB] px-6 py-4">
					<div className="flex items-center justify-between">
						<TopBarUserMenu user={loggedInUser} />
					</div>
				</header>

				<main className="flex-1 overflow-y-auto p-6">
					<div className="max-w-[2400px] mx-auto">
						{viewMode === "table" ? (
							<>
								<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
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
								</div>

								<div className="bg-white rounded-2xl shadow-sm border border-[#E5E7EB] overflow-hidden">
									<div className="overflow-x-auto">
										<Table>
											<TableHeader className="bg-white">
												<TableRow className="border-b border-[#E5E7EB]">
													<TableHead className="text-sm font-semibold text-[#111827] py-4">Date</TableHead>
													<TableHead className="text-sm font-semibold text-[#111827] py-4">Client Name</TableHead>
													<TableHead className="text-sm font-semibold text-[#111827] py-4">Status</TableHead>
													<TableHead className="text-sm font-semibold text-[#111827] py-4">Actions</TableHead>
												</TableRow>
											</TableHeader>
											<TableBody>
												{validPatients?.length === 0 ? (
													<TableRow>
														<TableCell colSpan={4} className="text-center py-8 text-sm text-[#6B7280]">No patients found</TableCell>
													</TableRow>
												) : (
													validPatients.slice((currentPage - 1) * pageSize, currentPage * pageSize).map((patient: any, index: number) => (
														<TableRow key={index} className="border-b border-[#E5E7EB] hover:bg-[#F9FAFB] transition-colors">
															<TableCell className="text-sm text-[#111827] py-4">{patient?.date}</TableCell>
															<TableCell className="text-sm font-medium text-[#111827] py-4">
																{getPatientName(patient)}
															</TableCell>
															<TableCell className="py-4">
																<span className={`text-sm font-medium ${getStatusColor(patient?.status)}`}>
																	{patient?.status?.charAt(0).toUpperCase() + patient?.status?.slice(1)}
																</span>
															</TableCell>
															<TableCell className="py-4">
																<div className="flex items-center gap-2">
																	<button onClick={() => handleView(patient)} className="p-2 hover:bg-[#F9FAFB] rounded-full transition-colors"><Eye className="h-4 w-4 text-[#6B7280]" /></button>
																	<button onClick={(e) => { e.stopPropagation(); setConfirmDelete({ open: true, id: patient?._id }) }} className="p-2 hover:bg-[#F9FAFB] rounded-full transition-colors"><Trash2 className="h-4 w-4 text-[#6B7280]" /></button>
																</div>
															</TableCell>
														</TableRow>
													))
												)}
											</TableBody>
										</Table>
									</div>
									{/* Pagination */}
									<div className="px-6 py-4 border-t border-[#E5E7EB] flex items-center justify-between">
										<div className="flex items-center gap-2">
											<button onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} disabled={currentPage === 1} className="p-2 border border-[#E5E7EB] rounded-lg disabled:opacity-50"><ChevronLeft className="h-4 w-4" /></button>
											<span className="text-sm text-[#111827]">Page {currentPage} of {totalPages}</span>
											<button onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))} disabled={currentPage === totalPages} className="p-2 border border-[#E5E7EB] rounded-lg disabled:opacity-50"><ChevronRight className="h-4 w-4" /></button>
										</div>
									</div>
								</div>
							</>
						) : (
							<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
								{/* Left Column */}
								<div className="lg:col-span-2 space-y-6">
									{/* Back Button */}
									<button onClick={handleBack} className="flex items-center gap-2 text-sm text-[#6B7280] hover:text-[#111827] mb-2">
										<ArrowLeft className="h-4 w-4" /> Back to Clients
									</button>

									{/* Patient Header Card */}
									<div className="bg-white rounded-2xl p-6 shadow-sm border border-[#E5E7EB]">
										<div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
											<div className="relative h-24 w-24 rounded-2xl overflow-hidden bg-[#F3F4F6] shrink-0">
												<Image
													src={patientAvatarSrc}
													alt="Patient"
													fill
													className="object-cover"
												/>
											</div>
											<div className="flex-1">
												<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
													<div>
														<h2 className="text-2xl font-bold text-[#111827]">
															{getPatientName(selectedPatient)}
														</h2>
														<p className="text-[#6B7280]">
															{selectedPatient?.client?.email}
														</p>
													</div>
													<div className={`px-4 py-1.5 rounded-full text-sm font-medium w-fit ${
														selectedPatient?.status === 'submitted' ? 'bg-[#9AC63F]/10 text-[#9AC63F]' : 
														selectedPatient?.status === 'pending' ? 'bg-orange-100 text-orange-600' : 
														'bg-gray-100 text-gray-600'
													}`}>
														{selectedPatient?.status?.charAt(0).toUpperCase() + selectedPatient?.status?.slice(1)}
													</div>
												</div>
												<div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4 pt-4 border-t border-[#E5E7EB]">
													<div>
														<p className="text-base sm:text-lg font-semibold text-[#111827]">
															{selectedPatient?.patient?.dob ? 
																Math.floor((new Date().getTime() - new Date(selectedPatient.patient.dob).getTime()) / 31557600000) 
																: "N/A"}
														</p>
														<p className="text-xs text-[#6B7280]">Age</p>
													</div>
													<div>
														<p className="text-base sm:text-lg font-semibold text-[#111827]">
															{selectedPatient?.patient?.weight || "N/A"}
														</p>
														<p className="text-xs text-[#6B7280]">Weight</p>
													</div>
													<div>
														<p className="text-base sm:text-lg font-semibold text-[#111827]">
															{selectedPatient?.patient?.height || "N/A"}
														</p>
														<p className="text-xs text-[#6B7280]">Height</p>
													</div>
													<div>
														<p className="text-base sm:text-lg font-semibold text-[#111827]">
															{selectedPatient?.patient?.sex || "Unknown"}
														</p>
														<p className="text-xs text-[#6B7280]">Gender</p>
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
									{/* Communication Bar */}
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
															router.push(`/lpc/messages?conversationId=${existing}`);
															return;
														}
														const conversation = rid ? await contactMessage(rid) : null;
														const cid = conversation?.id || conversation?._id || conversation?.conversationId;
														if (cid) {
															setConversationId(String(cid));
															router.push(`/lpc/messages?conversationId=${cid}`);
															return;
														}
													} catch { }
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
												href={conversationId ? `/lpc/messages?conversationId=${conversationId}` : "/lpc/messages"}
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
											<button className="p-2 hover:bg-[#F9FAFB] rounded-lg transition-colors">
												<Plus className="h-5 w-8 text-[#6B7280]" />
											</button>
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
						)}
					</div>
				</main>
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
							rows={10}
							className="w-full px-4 py-3 border border-[#E5E7EB] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#9AC63F]/20 resize-none"
							placeholder="Write your notes here..."
						/>
						<div className="flex justify-end gap-3">
							<button
								onClick={() => setIsNotepadOpen(false)}
								className="px-4 py-2 text-sm font-medium text-[#6B7280] hover:bg-[#F9FAFB] rounded-xl transition-colors"
							>
								Close
							</button>
							<button
								disabled={isSavingNotes}
								onClick={async () => {
									if (!selectedPatient?._id) return;
									setIsSavingNotes(true);
									try {
										await updateDoctorNotes(selectedPatient._id, notepadText);
										// Update local state
										setSelectedPatient((prev: any) => ({
											...prev,
											patientMedicalInfo: {
												...prev?.patientMedicalInfo,
												doctorNotes: notepadText
											}
										}));
										// Update in list
										setPatients(prev => prev.map(p => 
											p._id === selectedPatient._id 
												? { ...p, patientMedicalInfo: { ...p.patientMedicalInfo, doctorNotes: notepadText } }
												: p
										));
										setIsNotepadOpen(false);
									} catch (error) {
										console.error(error);
									} finally {
										setIsSavingNotes(false);
									}
								}}
								className="px-4 py-2 text-sm font-medium text-white bg-[#9AC63F] hover:bg-[#85af34] rounded-xl transition-colors"
							>
								{isSavingNotes ? "Saving..." : "Save Notes"}
							</button>
						</div>
					</div>
				</DialogContent>
			</Dialog>
		</div>
	);
}
