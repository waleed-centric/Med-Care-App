"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import {
    Bell,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    Users,
    Grid,
    Calendar,
    MessageSquare,
    FileText,
    Stethoscope,
    Phone,
    LogOut,
    Eye,
    ArrowLeft,
    Trash2,
    MessageCircle,
    Video,
    Star,
    Download,
    File,
    Plus,
    X,
    User,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Switch } from "@/components/ui/switch";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import SignatureCanvas from "react-signature-canvas";
import { newForm } from "@/hooks/form";
import {
	marketerClientAppointments,
	createMarketerAppointment,
	editClientAppointment,
	deleteClientAppointment,
} from "@/hooks/appointments";
import { contactMessage, activeMessages } from "@/hooks/messages";
import Cookies from "js-cookie";
import { usePeerContext } from "@/context/CallProvider";

type ClientStatus = "submitted" | "pending" | "review";

interface Diagnosis {
	id: string;
	date: string;
	name: string;
	status: ClientStatus;
	sex?: "male" | "female";
	time?: string;
	address?: string;
	signature?: string;
	assessment?: string;
}

export default function MarketerClientsList() {
	const [searchTerm, setSearchTerm] = useState("");
	const [isSearching, setIsSearching] = useState(false);
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const [startDate, setStartDate] = useState("");
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const [diagnoses, setDiagnoses] = useState<any[]>([]);
	const [totalItems, setTotalItems] = useState(0);
	const [totalPages, setTotalPages] = useState(1);
	const [endDate, setEndDate] = useState("");
	const [open, setOpen] = useState(false);
	const [formMode, setFormMode] = useState<"view" | "edit" | "create">("view");
	const [loggedInUser, setLoggedInUser] = useState<any>(null);
	const [isDeleting, setIsDeleting] = useState(false);
	const [confirmDelete, setConfirmDelete] = useState<{
		open: boolean;
		id: string | null;
	}>({
		open: false,
		id: null,
	});
	const [activeNow, setActiveNow] = useState(true);
	const [currentPage, setCurrentPage] = useState(1);
	const [pageSize, setPageSize] = useState(10);
	const [serverPageSize, setServerPageSize] = useState<number | null>(null);
	const pathname = usePathname();
	const router = useRouter();
    const { myPeerId } = usePeerContext();

    useEffect(() => {
        if (myPeerId) {
            console.log("✅ My Peer ID available in Client List:", myPeerId);
        }
    }, [myPeerId]);

	const resolveImageSrc = (url?: string) => {
		const base = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "");
		const u = String(url ?? "").trim().replace(/\)$/g, "");
		if (!u) return "/images/avatar.PNG";
		if (/^https?:\/\//i.test(u)) return u;
		if (u.startsWith("/uploads")) return base ? `${base}${u}` : u;
		const cleaned = u.replace(/^\/?uploads\/?/, "");
		return base ? `${base}/uploads/${cleaned}` : `/uploads/${cleaned}`;
	};

	const navLinkClasses = (href: string) =>
		`flex w-full items-center gap-3 px-0 py-3 rounded-xl ${pathname === href
			? "bg-[#9AC63F] text-white cursor-default"
			: "text-[#6B7280] hover:bg-[#F9FAFB] transition-colors"
		}`;
	const [form, setForm] = useState<any>({
		clientName: "",
		sex: "",
		age: "",
		date: "",
		time: "",
		description: "",
		address: "",
		signature: "",
	});

	useEffect(() => {
		let isMounted = true;
		const getClientAppointments = async () => {
			if (isMounted) setIsSearching(true);
			try {
				const response: any = await marketerClientAppointments(currentPage, pageSize, searchTerm);
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
				setDiagnoses(normalized);
				const ti = Number(
					response?.pagination?.totalItems ??
					response?.totalItems ??
					response?.count ??
					normalized.length
				);
				const tp = Number(
					response?.pagination?.totalPages ??
					response?.totalPages ??
					Math.ceil(ti / Math.max(1, pageSize))
				);
				setTotalItems(ti);
				setTotalPages(tp);
				const sp = Number(
					response?.pagination?.itemsPerPage ??
					response?.limit ??
					pageSize
				);
				if (!Number.isNaN(sp) && sp > 0) setServerPageSize(sp);
				const cp = Number(
					response?.pagination?.currentPage ??
					response?.page ??
					currentPage
				);
				if (!Number.isNaN(cp) && cp > 0 && cp !== currentPage) setCurrentPage(cp);
			} catch (error) {
				console.log("error getting users", error);
				if (isMounted) {
					setDiagnoses([]);
					setTotalItems(0);
					setTotalPages(1);
				}
			} finally {
				if (isMounted) setIsSearching(false);
			}
		};

		// Add a small debounce to prevent too many API calls while typing
		const debounceTimer = setTimeout(() => {
			getClientAppointments();
		}, 500);

		return () => {
			clearTimeout(debounceTimer);
			isMounted = false;
		};
	}, [currentPage, pageSize, searchTerm]);

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

	// Use the diagnoses directly from the API since we're doing server-side filtering
	const validDiagnoses = useMemo(() => {
		return Array.isArray(diagnoses) ? diagnoses : [];
	}, [diagnoses]);

	// Reset to first page when search term changes
	useEffect(() => {
		setCurrentPage(1);
	}, [searchTerm]);

	// Reset to first page when page size changes
	useEffect(() => {
		setCurrentPage(1);
	}, [pageSize]);

	// Determine the items to display on the current page
	const currentItems = useMemo(() => {
		return validDiagnoses;
	}, [validDiagnoses]);

	const [selected, setSelected] = useState<any>(null);
	const [viewMode, setViewMode] = useState<"table" | "profile">("table");
	const [conversationId, setConversationId] = useState<string | null>(null);
	const patientAvatarSrc = useMemo(() => {
		const p: any = selected || {};
		return (
			p?.patientId?.avatarUrl ||
			p?.patientId?.avatar ||
			p?.patient?.avatarUrl ||
			p?.patient?.avatar ||
			p?.client?.avatarUrl ||
			p?.patientDocuments?.[0]?.clientImage?.fileUrl ||
			"/images/avatar.PNG"
		);
	}, [selected]);
	console.log(patientAvatarSrc)
	const computeAgeFromDOB = (dob?: string): number | undefined => {
		if (!dob) return undefined;
		const d = new Date(dob);
		if (isNaN(d.getTime())) return undefined;
		const diff = Date.now() - d.getTime();
		const ageDate = new Date(diff);
		return Math.abs(ageDate.getUTCFullYear() - 1970);
	};
	const patientName = useMemo(() => {
		const c: any = selected?.client || {};
		const pId: any = selected?.patientId || {};
		const p: any = selected?.patient || {};
		const nameFromClient =
			c?.name ||
			c?.displayName ||
			c?.fullName ||
			(c?.firstname && c?.lastname ? `${c.firstname} ${c.lastname}` : c?.firstname || c?.lastname) ||
			selected?.clientName;
		const nameFromPatientObj =
			p?.name ||
			(p?.firstname && p?.lastname ? `${p.firstname} ${p.lastname}` : p?.firstname || p?.lastname);
		const nameFromPatientId =
			pId?.name ||
			pId?.displayName ||
			pId?.fullName ||
			(pId?.firstname && pId?.lastname ? `${pId.firstname} ${pId.lastname}` : pId?.firstname || pId?.lastname);
		const fallback = selected?.name || c?.username || pId?.username || p?.username;
		return nameFromClient || nameFromPatientObj || nameFromPatientId || fallback || "Unknown";
	}, [selected]);
	const patientEmail = useMemo(() => {
		return selected?.client?.email || selected?.patient?.email || selected?.patientId?.email || "Unknown";
	}, [selected]);
	const patientPhone = useMemo(() => {
		return selected?.client?.phone || selected?.patient?.phone || selected?.patientId?.phone || selected?.client?.mobile || "Unknown";
	}, [selected]);
	const patientAddress = useMemo(() => {
		return selected?.address || selected?.client?.address || selected?.patient?.address || selected?.patientId?.address || "Unknown";
	}, [selected]);
	const patientAge = useMemo(() => {
		return (
			selected?.client?.age ||
			selected?.patient?.age ||
			selected?.patientMedicalInfo?.age ||
			selected?.patientId?.age ||
			selected?.age ||
			computeAgeFromDOB(selected?.client?.dateOfBirth) ||
			computeAgeFromDOB(selected?.patient?.dateOfBirth) ||
			computeAgeFromDOB(selected?.patientId?.dateOfBirth) ||
			undefined
		);
	}, [selected]);
	const patientWeight = useMemo(() => {
		return selected?.client?.weight || selected?.patient?.weight || selected?.patientMedicalInfo?.weight || selected?.patientId?.weight || selected?.weight || undefined;
	}, [selected]);
	const patientHeight = useMemo(() => {
		return (
			selected?.client?.height ||
			selected?.patient?.height ||
			selected?.patientMedicalInfo?.height ||
			selected?.patientId?.height ||
			selected?.height ||
			undefined
		);
	}, [selected]);
	const patientSex = useMemo(() => {
		return selected?.client?.sex || selected?.patient?.sex || selected?.patientMedicalInfo?.sex || selected?.patientId?.sex || selected?.sex || "Unknown";
	}, [selected]);
	const doctorObj = useMemo(() => {
		const s: any = selected || {};
		return s?.assignDoctor || s?.doctor || s?.doctorId || s?.therapist || s?.doctorInfo || null;
	}, [selected]);
	const doctorAvatarSrc = useMemo(() => {
		const d: any = doctorObj || {};
		return (
			d?.avatarUrl ||
			d?.avatar ||
			d?.photoUrl ||
			d?.profilePic ||
			d?.image ||
			d?.picture ||
			"/images/avatar.PNG"
		);
	}, [doctorObj]);
	const doctorName = useMemo(() => {
		const d: any = doctorObj || {};
		const composite = d?.displayName || d?.name || d?.fullName;
		const parts = d?.firstname && d?.lastname
			? `${d.firstname} ${d.lastname}`
			: d?.firstName && d?.lastName
				? `${d.firstName} ${d.lastName}`
				: d?.firstname || d?.lastname || d?.firstName || d?.lastName;
		return composite || parts || "Unknown";
	}, [doctorObj]);
	const doctorSpecialization = useMemo(() => {
		const d: any = doctorObj || {};
		return (
			d?.specialization ||
			d?.title ||
			d?.profession ||
			d?.role ||
			d?.expertise ||
			"Marriage and Family Therapist (MFT)"
		);
	}, [doctorObj]);
	const doctorExperienceText = useMemo(() => {
		const d: any = doctorObj || {};
		const years = Number(
			d?.workExperience ?? d?.yearsExperience ?? d?.years ?? d?.experienceYears ?? 0
		);
		return years > 0 ? `${years} Years` : "—";
	}, [doctorObj]);
	const doctorRating = useMemo(() => {
		const d: any = doctorObj || {};
		const r = Number(d?.rating ?? d?.score ?? d?.stars ?? NaN);
		return Number.isFinite(r) && r > 0 ? r : null;
	}, [doctorObj]);
	const doctorReviewsCount = useMemo(() => {
		const d: any = doctorObj || {};
		const c = Number(d?.reviewsCount ?? d?.reviews ?? NaN);
		return Number.isFinite(c) && c > 0 ? c : null;
	}, [doctorObj]);
	const formatHeight = (raw: any) => {
		if (raw === null || raw === undefined) return "";
		const cleaned = String(raw).replace(/[^\d]/g, "");
		if (!cleaned) return "";
		const n = Number(cleaned);
		if (!isFinite(n) || n <= 0) return "";
		if (cleaned.length >= 3 || n > 300) {
			const feetStr = cleaned.slice(0, cleaned.length - 2);
			const inchesStr = cleaned.slice(-2);
			const feet = Number(feetStr);
			const inches = Number(inchesStr);
			if (!isFinite(feet) || !isFinite(inches)) return "";
			return `${feet}\`${inches}`;
		}
		const totalInches = n / 2.54;
		const feet = Math.floor(totalInches / 12);
		const inches = Math.round(totalInches % 12);
		return `${feet}\`${inches}`;
	};

	const [isMedicalModalOpen, setIsMedicalModalOpen] = useState(false);
	const [formData, setFormData] = useState({ history: "", primaryConcerns: [] as string[], medications: [] as string[] });
	const [newConcern, setNewConcern] = useState("");
	const [newMedication, setNewMedication] = useState("");
	const [assessment, setAssessment] = useState("");
	const [statusSel, setStatusSel] = useState("pending");
	const [error, setError] = useState("");
	const sigRef = useRef<SignatureCanvas | null>(null);

	useEffect(() => {
		const findConversation = async () => {
			try {
				if (!selected) return;
				const rid =
					selected?.recipientId ||
					selected?.clientId ||
					selected?.client?._id ||
					selected?.client?.id ||
					selected?.patientId?._id ||
					selected?.id;
				if (!rid) return;
				const list = await activeMessages();
				const match = Array.isArray(list)
					? list.find((conv: any) =>
						Array.isArray(conv?.participants) &&
						conv.participants.some(
							(p: any) => String(p?._id) === String(rid)
						)
					)
					: null;
				setConversationId(match?._id ?? null);
			} catch { }
		};
		findConversation();
	}, [selected]);

	const handleRowClick = (d: any) => {
		setFormMode("view");
		setSelected(d);
		setAssessment("");
		setStatusSel(d.status);
		setOpen(true);
		setTimeout(() => sigRef.current?.clear(), 0);
	};

	const handleView = (d: any) => {
		setSelected(d);
		setFormMode("view");
		setViewMode("profile");
		setOpen(false);
	};

	const handleBack = () => {
		setViewMode("table");
		setSelected(null);
	};

	const handleConfirm = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!selected) return;

		const doctorSignature =
			sigRef.current && !sigRef.current.isEmpty()
				? sigRef.current.getCanvas().toDataURL("image/png")
				: null;

		const signatureUrl = await handleSignatureSave();

		if (!signatureUrl) {
			console.error("Signature upload failed");
			return;
		}

		const payload = {
			// keep appointment id so backend knows which to update
			id: selected?._id,

			// doctor-related data
			// assessment,
			status: statusSel,
			signature: signatureUrl,

			// include all form fields from patient appointment
			clientName: selected?.clientName,
			sex: selected?.sex,
			age: selected?.age,
			date: selected?.date,
			time: selected?.time,
			description: selected?.description,
			address: selected?.address,
		};

		try {
			console.log("Confirming appointment with full payload:", payload);
			const response = await editClientAppointment(payload, selected?._id);
			const data = response.appointment;

			setDiagnoses((prev) => prev.map((d) => (d._id === data?._id ? data : d)));
			setOpen(false);
		} catch (error) {
			console.error("Error updating appointment:", error);
		}
	};

	const canEdit = true;

	function handleAddAppointment() {
		setFormMode("create");
		setOpen(true);
		setTimeout(() => sigRef.current?.clear(), 0);
	}

	const handleSignatureSave = async () => {
		setError("");
		if (!sigRef.current || sigRef.current.isEmpty()) {
			setError("Signature is required before submission.");
			return;
		}

		// Convert base64 signature to blob
		const dataUrl = sigRef.current.toDataURL("image/png");
		const res = await fetch(dataUrl);
		const blob = await res.blob();
		const file = new (globalThis as any).File([blob], "signature.png", { type: "image/png" });

		try {
			const formData = new FormData();
			formData.append("file", file);
			formData.append("userId", loggedInUser.id); // pass user ID

			const response = await fetch("/api/upload/signature", {
				method: "POST",
				body: formData,
			});

			const data = await response.json();

			if (data.success && data.fileUrl) {
				console.log("✅ Signature uploaded:", data.fileUrl);
				return data.fileUrl;
			} else {
				console.error("Upload failed:", data.error);
				return null;
			}
		} catch (err) {
			console.error("Upload error:", err);
			return null;
		}
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		try {
			// Save signature first
			const signatureUrl = await handleSignatureSave();

			if (!signatureUrl) {
				console.error("Signature upload failed");
				return;
			}

			// Payload should contain the S3 URL, not base64
			const payload = {
				signature: signatureUrl,
				clientName: form?.clientName,
				sex: form?.sex,
				age: form?.age,
				date: form?.date,
				time: form?.time,
				address: form?.address,
			};

			const response = await createMarketerAppointment(payload);

			const clientDiagnoses = response?.appointment;
			setOpen(false);
			setDiagnoses((prev) => [...prev, clientDiagnoses]);

			// reset form
			setForm({
				id: "",
				clientName: "",
				sex: "",
				age: "",
				date: "",
				time: "",
				address: "",
				signature: "",
			});
		} catch (error) {
			console.log("Error submitting form:", error);
		}
	};

	const deleteClient = async (id: string) => {
		setIsDeleting(true);
		try {
			await deleteClientAppointment(id);

			// simulate API success
			setDiagnoses((prev: any) =>
				prev.filter((client: any) => client._id !== id)
			);
		} catch (error) {
			console.log(error);
		} finally {
			setIsDeleting(false);
		}
	};

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

			<div className="flex-1 flex flex-col overflow-y-auto">
				<div className=" w-full sm:p-4 md:p-6 space-y-4 sm:space-y-6">
                    <header className="bg-white border-b border-[#E5E7EB] px-6 py-4">
                        <TopBarUserMenu user={loggedInUser} />
                    </header>
					{viewMode === "table" && (
						<Card>
							<CardContent>
								<div className="flex flex-col lg:flex-row my-5 justify-between gap-3 sm:gap-4 mb-4">
									<div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
										<div className="relative">
											<Search className={`absolute left-2 top-2.5 h-4 w-4 text-muted-foreground ${isSearching ? 'opacity-0' : 'opacity-100'}`} />
											{isSearching && (
												<div className="absolute left-2 top-2.5 h-4 w-4 animate-spin">
													<svg className="h-4 w-4 text-muted-foreground" viewBox="0 0 24 24">
														<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
														<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
													</svg>
												</div>
											)}
											<Input
												placeholder="Search clients..."
												className={`pl-8 w-full sm:w-[300px] text-sm sm:text-base ${isSearching ? 'pr-8' : ''}`}
												value={searchTerm}
												onChange={(e) => setSearchTerm(e.target.value)}
												disabled={isSearching}
											/>
										</div>
									</div>
									<div className="flex items-center gap-2">
										<span className="text-xs sm:text-sm text-muted-foreground">
											Showing {currentItems?.length} of {totalItems} patients
											{searchTerm && (
												<span className="ml-2">
													for "{searchTerm}"
												</span>
											)}
										</span>
									</div>
								</div>

								<div className="rounded-md border overflow-x-auto">
									<Table>
										<TableHeader className="bg-gray-100">
											<TableRow>
												<TableHead className="text-xs sm:text-sm">Date</TableHead>
												<TableHead className="text-xs sm:text-sm">
													Client Name
												</TableHead>
												<TableHead className="text-xs sm:text-sm">
													Status
												</TableHead>
												<TableHead className="text-xs sm:text-sm">
													Action
												</TableHead>
											</TableRow>
										</TableHeader>
										<TableBody>
											{validDiagnoses.length === 0 ? (
												<TableRow>
													<TableCell
														colSpan={5}
														className="text-center py-6 text-sm sm:text-base"
													>
														No Client found
													</TableCell>
												</TableRow>
											) : (
												currentItems?.map((diagnosis: any, index: any) => (
													<TableRow
														onClick={() => console.log(diagnosis)}
														key={index}
														className="hover:bg-accent"
													>
														<TableCell className="text-xs sm:text-sm">
															{diagnosis?.date ?? ""}
														</TableCell>
														<TableCell className="text-xs sm:text-sm">
															{diagnosis?.client?.name ??
																(diagnosis?.client?.firstname && diagnosis?.client?.lastname
																	? `${diagnosis?.client?.firstname} ${diagnosis?.client?.lastname}`
																	: diagnosis?.client?.firstname ?? diagnosis?.client?.lastname) ??
																diagnosis?.clientName ??
																diagnosis?.name ??
																(diagnosis?.patient?.firstname && diagnosis?.patient?.lastname
																	? `${diagnosis?.patient?.firstname} ${diagnosis?.patient?.lastname}`
																	: diagnosis?.patient?.name ?? diagnosis?.patient?.firstname ?? diagnosis?.patient?.lastname) ??
																(diagnosis?.patientId?.firstname && diagnosis?.patientId?.lastname
																	? `${diagnosis?.patientId?.firstname} ${diagnosis?.patientId?.lastname}`
																	: diagnosis?.patientId?.name ?? diagnosis?.patientId?.firstname ?? diagnosis?.patientId?.lastname) ??
																"Unknown"}
														</TableCell>
														<TableCell>
															<span
																className={`px-2 py-1 rounded-full text-xs font-semibold ${(diagnosis?.status ?? "").toLowerCase() === "review"
																	? "bg-green-100 text-green-800"
																	: (diagnosis?.status ?? "").toLowerCase() === "pending"
																		? "bg-yellow-100 text-yellow-800"
																		: "bg-blue-100 text-blue-800"
																	}`}
															>
																{diagnosis?.status ?? ""}
															</span>
														</TableCell>
														<TableCell>
															<div className="flex items-center gap-2">
																<button
																	onClick={(e) => {
																		e.stopPropagation();
																		handleView(diagnosis);
																	}}
																	className="p-2 hover:bg-[#F9FAFB] rounded-full transition-colors"
																	title="View"
																>
																	<Eye className="h-4 w-4 text-[#6B7280]" />
																</button>
																<Button
																	onClick={(e) => {
																		e.stopPropagation();
																		setConfirmDelete({
																			open: true,
																			id: diagnosis?._id,
																		});
																	}}
																	disabled={isDeleting}
																	className="rounded-lg bg-red-600 hover:bg-red-200 text-white hover:text-red-600 cursor-pointer text-sm py-1 h-auto"
																>
																	<Trash2 className="h-4 w-4" />
																</Button>
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
										<span className="text-sm text-[#6B7280]">Rows per page</span>
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
											{Math.min((currentPage - 1) * Number(serverPageSize ?? pageSize) + 1, totalItems)}-
											{Math.min(currentPage * Number(serverPageSize ?? pageSize), totalItems)} of {totalItems}
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
											onClick={() =>
												setCurrentPage((p) => Math.min(totalPages, p + 1))
											}
										>
											<ChevronRight className="h-4 w-4 text-[#6B7280]" />
										</button>
									</div>
								</div>
							</CardContent>
						</Card>
					)}

					{viewMode === "profile" && selected && (
						<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
							<div className="lg:col-span-2 space-y-6">
								<button
									onClick={handleBack}
									className="flex items-center gap-2 text-sm font-medium text-[#6B7280] hover:text-[#111827] transition-colors"
								>
									<ArrowLeft className="h-4 w-4" />
									Back to patients
								</button>
								<div className="bg-white rounded-2xl p-6 shadow-sm border border-[#E5E7EB]">
									<div className="flex items-start gap-6">
                                        <div className="relative h-24 w-24 rounded-full overflow-hidden shrink-0 border-2 border-[#E5E7EB]">
											<img
												src={resolveImageSrc(patientAvatarSrc)}
												alt={selected?.client?.name || "Client"}
												className="w-full h-full object-cover"
												onError={(e) => {
													(e.currentTarget as HTMLImageElement).src = "/images/avatar.PNG";
												}}
											/>
										</div>
										<div className="flex-1 min-w-0">
											<h2 className="text-2xl font-bold text-[#111827] mb-3">{patientName}</h2>
											<div className="space-y-1.5 mb-4">
												<p className="text-sm text-[#6B7280]">{patientEmail}</p>
												<p className="text-sm text-[#6B7280]">{patientPhone}</p>
												<p className="text-sm text-[#6B7280]">{patientAddress}</p>
											</div>
											<div className="mt-3 pt-4 border-t border-[#E5E7EB]">
												<div className="grid grid-cols-2 sm:grid-cols-4 gap-x-8 gap-y-4">
													<div>
														<p className="text-base sm:text-lg font-semibold text-[#111827]">{patientAge ?? "Unknown"} years</p>
														<p className="text-xs text-[#6B7280]">Age</p>
													</div>
													<div>
														<p className="text-base sm:text-lg font-semibold text-[#111827]">{patientWeight ?? "Unknown"}</p>
														<p className="text-xs text-[#6B7280]">Weight</p>
													</div>
													<div>
														<p className="text-base sm:text-lg font-semibold text-[#111827]">
															{formatHeight(patientHeight) || "Unknown"}
														</p>
														<p className="text-xs text-[#6B7280]">Height</p>
													</div>
													<div>
														<p className="text-base sm:text-lg font-semibold text-[#111827]">{patientSex}</p>
														<p className="text-xs text-[#6B7280]">Gender</p>
													</div>
												</div>
											</div>
										</div>
									</div>
								</div>
								<div className="bg-white rounded-2xl p-6 shadow-sm border border-[#E5E7EB]">
									<div className="flex items-center justify-between mb-4">
										<h3 className="text-xl font-bold text-[#111827]">Client History</h3>
										{/* <button className="p-2 hover:bg-[#F9FAFB] rounded-lg transition-colors" onClick={() => setIsMedicalModalOpen(true)}>
											<Plus className="h-5 w-8 text-[#6B7280]" />
										</button> */}
									</div>
									<p className="text-sm text-[#6B7280] leading-relaxed mb-6">
										{selected?.patientMedicalInfo?.history || selected?.description || formData.history}
									</p>
									<div className="space-y-4">
										<div>
											<p className="text-sm font-semibold text-[#111827] mb-2">Primary Concern</p>
											<div className="flex flex-wrap gap-2">
												{(selected?.patientMedicalInfo?.primaryConcerns || formData.primaryConcerns).map((tag: string, idx: number) => (
													<span key={idx} className="px-3 py-1.5 bg-[#F3F4F6] text-[#6B7280] rounded-full text-sm font-medium">{tag}</span>
												))}
											</div>
										</div>
										<div>
											<p className="text-sm font-semibold text-[#111827] mb-2">Medication</p>
											<div className="flex flex-wrap gap-2">
												{(selected?.patientMedicalInfo?.medications || formData.medications).map((tag: string, idx: number) => (
													<span key={idx} className="px-3 py-1.5 bg-[#F3F4F6] text-[#6B7280] rounded-full text-sm font-medium">{tag}</span>
												))}
											</div>
										</div>
									</div>
								</div>
							</div>
							<div className="lg:col-span-1 space-y-6">
								<div className="bg-white rounded-2xl p-4 shadow-sm border border-[#E5E7EB]">
									<div className="flex items-center gap-3 sm:gap-4">
										<button
											aria-label="Message"
											onClick={async () => {
												try {
													console.log(selected, "selected")
													const rid =
														selected?.recipientId ||
														selected?.clientId ||
														selected?.client?._id ||
														selected?.client?.id ||
														selected?.patientId?._id ||
														selected?.patient?._id ||
														selected?.id;
													const existing = conversationId;
													if (existing) {
														router.push(
															`/marketer/messages?conversationId=${existing}`
														);
														return;
													}
													const conversation = rid
														? await contactMessage(rid)
														: null;
													const cid =
														(conversation as any)?.id ||
														(conversation as any)?._id ||
														(conversation as any)?.conversationId;
													if (cid) {
														setConversationId(String(cid));
														router.push(
															`/marketer/messages?conversationId=${cid}`
														);
														return;
													}
												} catch { }

											}}
											className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] hover:bg-white transition-colors"
										>
											<MessageCircle className="h-5 w-8 text-[#6B7280]" />
										</button>

										{/* <button className="ml-auto flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-medium bg-[#FFF4E6] text-[#F97316] border border-[#F97316]/20 hover:bg-[#FFEAD6] transition-colors">
                                            Pending
                                            <ChevronDown className="h-4 w-4 text-[#F97316]" />
                                        </button> */}
									</div>
								</div>
								<div className="bg-white rounded-2xl p-6 shadow-sm border border-[#E5E7EB]">
									<h3 className="text-lg font-bold text-[#111827] mb-4">Doctor / Therapist Assigned</h3>
									<div className="flex items-start gap-4">
                                        <div className="relative h-16 w-16 rounded-full overflow-hidden shrink-0">
											<img
												onClick={() => console.log(`${process.env.NEXT_PUBLIC_API_URL}/uploads/${doctorAvatarSrc}`)}
												src={`${process.env.NEXT_PUBLIC_API_URL}/uploads/${doctorAvatarSrc}`}
												alt={doctorName}
												className="w-full h-full object-cover"
												onError={(e) => {
													(e.currentTarget as HTMLImageElement).src = "/images/avatar.PNG";
												}}
											/>
										</div>
										<div className="flex-1">
											<p className="text-base sm:text-lg font-semibold text-[#111827] mb-0.5">{doctorName}</p>
											<p className="text-sm text-[#6B7280]">{doctorSpecialization}</p>
											<div className="pt-4 mt-3 border-t border-[#E5E7EB]">
												<div className="flex items-center">
													<div className="min-w-[140px]">
														<p className="text-sm font-semibold text-[#111827]">{doctorExperienceText}</p>
														<p className="text-xs text-[#6B7280]">Experience</p>
													</div>
												</div>
											</div>
										</div>
									</div>
								</div>
								<div className="bg-white rounded-2xl p-6 shadow-sm border border-[#E5E7EB]">
									<div className="flex items-center justify-between mb-4">
										<h3 className="text-lg font-bold text-[#111827]">Documents</h3>
										{/* <button className="p-2 hover:bg-[#F9FAFB] rounded-lg transition-colors">
											<Plus className="h-5 w-8 text-[#6B7280]" />
										</button> */}
									</div>
									<div className="space-y-3">
										{(Array.isArray(selected?.patientDocuments) && selected?.patientDocuments?.length > 0
											? selected.patientDocuments
												.map((group: any) => group?.documentFile)
												.filter(Boolean)
											: []
										).map((doc: any, idx: number) => (
											<div key={idx} className="flex items-center justify-between p-3 border border-[#E5E7EB] rounded-lg hover:bg-[#F9FAFB] transition-colors">
												<div className="flex items-center gap-3">
													<File className="h-5 w-8 text-red-500" />
													<span className="text-sm font-medium text-[#111827]">{doc?.documentType || "Document"}</span>
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

					<Dialog open={isMedicalModalOpen} onOpenChange={setIsMedicalModalOpen}>
						<DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
							<DialogHeader>
								<DialogTitle className="text-2xl font-bold text-[#111827]">Medical Information</DialogTitle>
							</DialogHeader>
							<div className="space-y-6 mt-4">
								<div className="space-y-3">
									<label className="block text-sm font-semibold text-[#6B7280]">History</label>
									<textarea value={formData.history} onChange={(e) => setFormData({ ...formData, history: e.target.value })} rows={6} placeholder="Enter patient history..." className="w-full px-4 py-3 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9AC63F]/20 resize-none" />
								</div>
								<div className="space-y-3">
									<label className="block text-sm font-semibold text-[#6B7280]">Primary Concern</label>
									<div className="flex flex-wrap gap-2 mb-3">
										{formData.primaryConcerns.map((concern, index) => (
											<span key={index} className="inline-flex items-center gap-2 px-4 py-2 bg-[#F3F4F6] text-[#6B7280] rounded-full text-sm font-medium">
												{concern}
												<button onClick={() => setFormData({ ...formData, primaryConcerns: formData.primaryConcerns.filter((_, i) => i !== index) })} className="hover:text-red-500 transition-colors">
													<X className="h-3 w-3" />
												</button>
											</span>
										))}
									</div>
									<div className="flex gap-2">
										<input type="text" value={newConcern} onChange={(e) => setNewConcern(e.target.value)} onKeyPress={(e) => { if (e.key === "Enter") { e.preventDefault(); if (newConcern.trim() && !formData.primaryConcerns.includes(newConcern.trim())) { setFormData({ ...formData, primaryConcerns: [...formData.primaryConcerns, newConcern.trim()] }); setNewConcern(""); } } }} placeholder="Add primary concern..." className="flex-1 px-4 py-2 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9AC63F]/20" />
										<button onClick={() => { if (newConcern.trim() && !formData.primaryConcerns.includes(newConcern.trim())) { setFormData({ ...formData, primaryConcerns: [...formData.primaryConcerns, newConcern.trim()] }); setNewConcern(""); } }} className="px-4 py-2 bg-[#9AC63F] text-white rounded-lg hover:bg-[#85af34] transition-colors">
											<Plus className="h-4 w-4" />
										</button>
									</div>
								</div>
								<div className="space-y-3">
									<label className="block text-sm font-semibold text-[#6B7280]">Any Medication</label>
									<div className="flex flex-wrap gap-2 mb-3">
										{formData.medications.map((medication, index) => (
											<span key={index} className="inline-flex items-center gap-2 px-4 py-2 bg-[#F3F4F6] text-[#6B7280] rounded-full text-sm font-medium">
												{medication}
												<button onClick={() => setFormData({ ...formData, medications: formData.medications.filter((_, i) => i !== index) })} className="hover:text-red-500 transition-colors">
													<X className="h-3 w-3" />
												</button>
											</span>
										))}
									</div>
									<div className="flex gap-2">
										<input type="text" value={newMedication} onChange={(e) => setNewMedication(e.target.value)} onKeyPress={(e) => { if (e.key === "Enter") { e.preventDefault(); if (newMedication.trim() && !formData.medications.includes(newMedication.trim())) { setFormData({ ...formData, medications: [...formData.medications, newMedication.trim()] }); setNewMedication(""); } } }} placeholder="Add medication..." className="flex-1 px-4 py-2 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9AC63F]/20" />
										<button onClick={() => { if (newMedication.trim() && !formData.medications.includes(newMedication.trim())) { setFormData({ ...formData, medications: [...formData.medications, newMedication.trim()] }); setNewMedication(""); } }} className="px-4 py-2 bg-[#9AC63F] text-white rounded-lg hover:bg-[#85af34] transition-colors">
											<Plus className="h-4 w-4" />
										</button>
									</div>
								</div>
								<div className="flex justify-end gap-3 pt-4 border-t border-[#E5E7EB]">
									<button onClick={() => setIsMedicalModalOpen(false)} className="px-6 py-2 border border-[#E5E7EB] rounded-lg text-[#6B7280] hover:bg-[#F9FAFB] transition-colors">Cancel</button>
									<button onClick={() => setIsMedicalModalOpen(false)} className="px-6 py-2 bg-[#9AC63F] text-white rounded-lg hover:bg-[#85af34] transition-colors">Save</button>
								</div>
							</div>
						</DialogContent>
					</Dialog>

					<Dialog open={open} onOpenChange={setOpen}>
						<DialogContent className="w-[90vw] max-w-2xl max-h-[90vh] overflow-y-auto">
							{/* VIEW MODE */}
							{selected && formMode === "view" && (
								<>
									<DialogHeader>
										<DialogTitle className="text-base sm:text-lg">
											Client Details
										</DialogTitle>
									</DialogHeader>

									<div className="space-y-3">
										<p className="text-sm sm:text-base">
											<b>Client:</b> {selected?.client?.name}
										</p>
										<p className="text-sm sm:text-base">
											<b>Sex:</b> {selected?.client?.sex ?? "—"}
										</p>
										<p className="text-sm sm:text-base">
											<b>Date:</b> {selected?.date}
										</p>
										<p className="text-sm sm:text-base">
											<b>Time:</b> {selected?.time ?? "—"}
										</p>
										<p className="text-sm sm:text-base">
											<b>Address:</b> {selected?.address ?? "—"}
										</p>
										{(selected?.status === "submitted" || selected?.status === "pending") && (
											<>
												<p className="text-sm sm:text-base">
													<b>Assessment Summary:</b>{" "}
													{selected?.assessment ?? "—"}
												</p>
												<p className="text-sm sm:text-base">
													<b>Status:</b> {selected?.status}
												</p>
											</>
										)}
									</div>
								</>
							)}

							{/* CREATE MODE */}
							{formMode === "create" && (
								<>
									<DialogHeader>
										<DialogTitle className="text-base sm:text-lg">
											New Client
										</DialogTitle>
									</DialogHeader>

									<form onSubmit={handleSubmit} className="space-y-3">
										<div>
											<Label className="text-xs sm:text-sm">Client</Label>
											<Input
												value={form.client?.name}
												onChange={(e) =>
													setForm({ ...form, clientName: e.target.value })
												}
												required
											/>
										</div>

										<div>
											<Label className="text-xs sm:text-sm">Sex</Label>
											<Select
												value={form.sex}
												onValueChange={(v) => setForm({ ...form, sex: v })}
											>
												<SelectTrigger>
													<SelectValue placeholder="Select sex" />
												</SelectTrigger>
												<SelectContent className="bg-white">
													<SelectItem value="Male">Male</SelectItem>
													<SelectItem value="Female">Female</SelectItem>
												</SelectContent>
											</Select>
										</div>

										<div>
											<Label className="text-xs sm:text-sm">Date</Label>
											<Input
												type="date"
												value={form.date}
												onChange={(e) =>
													setForm({ ...form, date: e.target.value })
												}
												required
											/>
										</div>

										<div>
											<Label className="text-xs sm:text-sm">Time</Label>
											<Input
												type="time"
												value={form.time}
												onChange={(e) =>
													setForm({ ...form, time: e.target.value })
												}
												required
											/>
										</div>

										<div>
											<Label className="text-xs sm:text-sm">Address</Label>
											<Input
												value={form.address}
												onChange={(e) =>
													setForm({ ...form, address: e.target.value })
												}
											/>
										</div>

										<div>
											<Label className="text-xs sm:text-sm">
												Marketer Signature
											</Label>
											<div className="border rounded-md p-2 bg-white">
												<SignatureCanvas
													ref={sigRef}
													penColor="black"
													canvasProps={{
														width: 500,
														height: 160,
														className: "border w-full h-[120px] sm:h-[160px]",
													}}
													backgroundColor="white"
													onEnd={() =>
														setForm({
															...form,
															signature: sigRef.current?.toDataURL(),
														})
													}
												/>
												{error && (
													<span className="text-red-500 text-xs">{error}</span>
												)}
											</div>
											<div className="flex justify-between mt-2">
												<Button
													type="button"
													variant="outline"
													size="sm"
													onClick={() => {
														sigRef.current?.clear();
														setForm({ ...form, signature: "" });
													}}
													className="text-xs sm:text-sm"
												>
													Clear
												</Button>
											</div>
										</div>

										<div className="pt-2">
											<Button
												type="submit"
												className="w-full text-sm sm:text-base bg-secondary cursor-pointer"
											>
												Submit
											</Button>
										</div>
									</form>
								</>
							)}
						</DialogContent>
					</Dialog>

					<Dialog
						open={confirmDelete.open}
						onOpenChange={(o) =>
							setConfirmDelete({ open: o, id: o ? confirmDelete.id : null })
						}
					>
						<DialogContent className="w-[90vw] max-w-sm">
							<DialogHeader>
								<DialogTitle className="text-base sm:text-lg">
									Delete Client?
								</DialogTitle>
							</DialogHeader>
							<p className="text-sm sm:text-base">
								This action cannot be undone.
							</p>
							<div className="flex justify-end gap-3 mt-4">
								<Button
									variant="outline"
									onClick={() => setConfirmDelete({ open: false, id: null })}
								>
									Cancel
								</Button>
								<Button
									className="bg-red-600 text-white hover:bg-red-700"
									disabled={isDeleting}
									onClick={() => {
										if (confirmDelete.id) deleteClient(confirmDelete.id);
										setConfirmDelete({ open: false, id: null });
									}}
								>
									Delete
								</Button>
							</div>
						</DialogContent>
					</Dialog>
				</div>
			</div>
		</div>
	);
}
