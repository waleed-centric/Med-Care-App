"use client";

import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
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
    ArrowLeft,
    File,
    Download,
    Edit,
    X,
    Eye,
    User,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import Cookies from "js-cookie";
import {
    clientAppointments,
    deleteClientAppointment,
} from "@/hooks/appointments";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreVertical, Settings, LogOut } from "lucide-react";
import { logout } from "@/lib/utils";
import {
    Select,
    SelectTrigger,
    SelectContent,
    SelectItem,
    SelectValue,
} from "@/components/ui/select";
import TopBarUserMenu from "@/components/TopBarUserMenu";

const ensureArray = (data: any) => {
    if (Array.isArray(data)) return data;
    if (typeof data === "string") return data.split(",").map((s) => s.trim()).filter(Boolean);
    return [];
};

export default function DoctorSchedule() {
    const [loggedInUser, setLoggedInUser] = useState<any>(null);
    const [activeNow, setActiveNow] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const pathname = usePathname();
    const navLinkClasses = (href: string) =>
        `flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${pathname === href
            ? "bg-[#9AC63F] text-white cursor-default"
            : "text-[#6B7280] hover:bg-[#F9FAFB]"
        }`;
    const [appointments, setAppointments] = useState<any[]>([]);
    const [totalItems, setTotalItems] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [isDeleting, setIsDeleting] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [appointmentToDelete, setAppointmentToDelete] = useState<string | null>(
        null
    );
    const [viewMode, setViewMode] = useState("list");
    const [selectedPatient, setSelectedPatient] = useState<any>(null);
    const [isNotepadOpen, setIsNotepadOpen] = useState(false);
    const [isMedicalModalOpen, setIsMedicalModalOpen] = useState(false);
    const [notepadText, setNotepadText] = useState("");
    const [formData, setFormData] = useState({
        history: "",
        primaryConcerns: [] as string[],
        medications: [] as string[],
    });

    const handleView = (appointment: any) => {
        // Robust extraction of medical info
        const medicalInfo =
            appointment.patient?.patientMedicalInfo ||
            appointment.patientMedicalInfo ||
            appointment.medicalInfo ||
            appointment.patient ||
            {};

        const patientData = {
            ...appointment,
            patientMedicalInfo: medicalInfo,
            client: appointment.client || appointment.userId || {},
        };

        setSelectedPatient(patientData);
        setViewMode("profile");

        const historyContent =
            patientData?.patientMedicalInfo?.doctorNotes ||
            patientData?.patientMedicalInfo?.history ||
            patientData?.description ||
            "";

        setNotepadText(historyContent);
        setFormData({
            history: historyContent,
            primaryConcerns:
                ensureArray(patientData?.patientMedicalInfo?.primaryConcerns),
            medications:
                ensureArray(patientData?.patientMedicalInfo?.medications),
        });
    };

    const handleBack = () => {
        setSelectedPatient(null);
        setViewMode("list");
    };

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

    useEffect(() => {
        const getAppointments = async () => {
            try {
                const response: any = await clientAppointments(currentPage, pageSize, searchTerm);
                const list = Array.isArray(response?.schedules) ? response.schedules : [];
                setAppointments(list);

                // Get pagination data from the response
                const paginationData = response?.pagination || response;
                const totalItemsCount = Number(paginationData?.totalItems || paginationData?.total || 0);
                const totalPagesCount = Number(paginationData?.totalPages || 1);
                const itemsPerPage = Number(paginationData?.itemsPerPage || pageSize);

                // Update states
                setTotalItems(totalItemsCount);
                setTotalPages(totalPagesCount);
                setPageSize(itemsPerPage);

            } catch (error) {
                console.error("Error getting appointments:", error);
                setAppointments([]);
                setTotalItems(0);
                setTotalPages(1);
            }
        };

        // Add debounce to prevent too many API calls while typing
        const debounceTimer = setTimeout(() => {
            getAppointments();
        }, 500);

        return () => clearTimeout(debounceTimer);
    }, [currentPage, pageSize, searchTerm]);

    const formatPatientName = (appointment: any) => {
        const clientName = appointment?.client?.name;
        const directName = appointment?.clientName || appointment?.name;
        const p = appointment?.patient || appointment?.patientId || {};
        const pf = p?.firstname || p?.firstName;
        const pl = p?.lastname || p?.lastName;
        const pn = p?.name;
        return (
            clientName || directName || [pf, pl].filter(Boolean).join(" ") || pn || "-"
        );
    };

    const validAppointments = useMemo(
        () => appointments.filter((a: any) => a?.date && a?.status),
        [appointments]
    );

    // Server-provided totalPages used

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm]);

    useEffect(() => {
        setCurrentPage(1);
    }, [pageSize]);

    const currentItems = useMemo(() => {
        return validAppointments;
    }, [validAppointments, currentPage, pageSize]);

    const formatDate = (dateString: string) => {
        if (!dateString) return "";
        const date = new Date(dateString);
        const day = String(date.getDate()).padStart(2, "0");
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    };

    const formatTime = (timeString: string) => {
        if (!timeString) return "";
        // Convert time to 12-hour format if needed
        return timeString;
    };


    const handleDelete = async (id: string) => {
        setIsDeleting(true);
        try {
            await deleteClientAppointment(id);
            setAppointments((prev: any) => prev.filter((a: any) => a._id !== id));
        } catch (error) {
            console.log(error);
        } finally {
            setIsDeleting(false);
        }
    };

    const openDeleteModal = (id: string) => {
        setAppointmentToDelete(id);
        setShowDeleteModal(true);
    };

    const confirmDelete = async () => {
        if (appointmentToDelete) {
            await handleDelete(appointmentToDelete);
        }
        setShowDeleteModal(false);
        setAppointmentToDelete(null);
    };

    const getTypeColor = (type: string) => {
        switch (type?.toLowerCase()) {
            case "check-up":
            case "checkup":
                return "text-[#9AC63F]";
            case "follow-up":
            case "followup":
                return "text-[#F97316]";
            default:
                return "text-[#6B7280]";
        }
    };

    return (
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
                    <TopBarUserMenu user={loggedInUser} />
                </header>

                {/* Main Content */}
                <main className="flex-1 overflow-y-auto p-6">
                    <div className="max-w-[2400px] mx-auto">
                        {viewMode === "list" ? (
                            <>
                                {/* Header Section */}
                                <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#E5E7EB] mb-6">
                                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
                                        {/* Add New Button */}

                                        {/* Client Count */}
                                        <span className="text-sm flex justify-content-end text-[#6B7280]">
                                            Showing {validAppointments?.length ?? 0} of{" "}
                                            {appointments?.length ?? 0} Clients
                                        </span>
                                    </div>

                                    {/* Search Bar */}
                                    <div className="relative">
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

                                {/* Schedule Table */}
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
                                                        Time
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
                                                {(validAppointments?.length ?? 0) === 0 ? (
                                                    <TableRow>
                                                        <TableCell
                                                            colSpan={5}
                                                            className="text-center py-8 text-sm text-[#6B7280]"
                                                        >
                                                            No appointments found
                                                        </TableCell>
                                                    </TableRow>
                                                ) : (
                                                    currentItems?.map((appointment: any, index) => (
                                                        <TableRow
                                                            key={appointment?._id || index}
                                                            className="border-b border-[#E5E7EB] hover:bg-[#F9FAFB] transition-colors"
                                                        >
                                                            <TableCell className="text-sm text-[#111827] py-4">
                                                                {appointment?.date}
                                                            </TableCell>
                                                            <TableCell className="text-sm font-medium text-[#111827] py-4">
                                                                {formatPatientName(appointment)}
                                                            </TableCell>
                                                            <TableCell className="text-sm text-[#111827] py-4">
                                                                {appointment?.time}
                                                            </TableCell>
                                                            <TableCell className="py-4">
                                                                <span
                                                                    className={`text-sm font-medium ${getTypeColor(
                                                                        appointment?.status
                                                                    )}`}
                                                                >
                                                                    {appointment?.status}
                                                                </span>
                                                            </TableCell>
                                                            <TableCell className="py-4">
                                                                <div className="flex items-center gap-2">
                                                                    <button
                                                                        onClick={() => handleView(appointment)}
                                                                        className="p-2 hover:bg-[#F9FAFB] rounded-full transition-colors"
                                                                        title="View"
                                                                    >
                                                                        <Eye className="h-4 w-4 text-[#6B7280]" />
                                                                    </button>
                                                                    <button
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            openDeleteModal(String(appointment?._id));
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
                                            <span className="text-sm text-[#6B7280]">Rows per page</span>
                                            <Select
                                                value={String(pageSize)}
                                                onValueChange={(v: string) => setPageSize(Number(v))}
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
                                            <span className="text-sm text-[#6B7280] whitespace-nowrap">
                                                {totalItems === 0 ? '0-0 of 0' :
                                                    `${Math.min((currentPage - 1) * pageSize + 1, totalItems)}-${Math.min(currentPage * pageSize, totalItems)} of ${totalItems}`}
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
                                            Back to Schedule
                                        </button>

                                        {/* Client Information Card */}
                                        <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#E5E7EB]">
                                            <div className="flex items-start gap-6">
                                                <div className="relative h-24 w-24 rounded-full overflow-hidden shrink-0 border-2 border-[#E5E7EB]">
                                                    <Image
                                                        src={resolveImageSrc(selectedPatient?.client?.profilePicture || selectedPatient?.client?.avatar)}
                                                        alt={selectedPatient?.client?.name || "Client"}
                                                        fill
                                                        unoptimized
                                                        className="object-cover"
                                                    />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h2 className="text-2xl font-bold text-[#111827] mb-3">
                                                        {formatPatientName(selectedPatient)}
                                                    </h2>
                                                    <div className="space-y-1.5 mb-4">
                                                        <p className="text-sm text-[#6B7280]">
                                                            {selectedPatient?.patient?.email ?? selectedPatient?.originalPatient?.email ?? selectedPatient?.email ?? "No email"}
                                                        </p>
                                                        <p className="text-sm text-[#6B7280]">
                                                            {selectedPatient?.patient?.phone ?? selectedPatient?.originalPatient?.phone ?? selectedPatient?.phone ?? selectedPatient?.client?.mobile ?? "No phone"}
                                                        </p>
                                                        <p className="text-sm text-[#6B7280]">
                                                            {selectedPatient?.address ?? selectedPatient?.client?.address ?? selectedPatient?.originalPatient?.address ?? "No address"}
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
                                                                <p className="text-xs text-[#6B7280]">Weight</p>
                                                            </div>
                                                            <div>
                                                                <p className="text-base sm:text-lg font-semibold text-[#111827]">
                                                                    {selectedPatient?.patientMedicalInfo?.height
                                                                        ? String(selectedPatient.patientMedicalInfo.height)
                                                                            .replace(".", "'")
                                                                            .replace(/^(\d)(\d{2})$/, "$1'$2")
                                                                        : "Unknown"}
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
                                        </div>

                                        {/* Client History Section */}
                                        <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#E5E7EB]">
                                            <div className="flex items-center justify-between mb-4">
                                                <h3 className="text-xl font-bold text-[#111827]">
                                                    Client History
                                                </h3>
                                            </div>
                                            <p onClick={() => console.log("Debug selectedPatient:", selectedPatient)} className="text-sm text-[#6B7280] leading-relaxed mb-6 cursor-pointer">
                                                {selectedPatient?.patientMedicalInfo?.history ||
                                                    selectedPatient?.history ||
                                                    selectedPatient?.description ||
                                                    "No history recorded"}
                                            </p>
                                            <div className="space-y-4">
                                                <div>
                                                    <p className="text-sm font-semibold text-[#111827] mb-2">
                                                        Primary Concern
                                                    </p>
                                                    <div className="flex flex-wrap gap-2">
                                                        {ensureArray(
                                                            selectedPatient?.patientMedicalInfo
                                                                ?.primaryConcerns ||
                                                            formData.primaryConcerns
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
                                                        {ensureArray(
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

                                    </div>

                                    {/* Right Sidebar */}
                                    <div className="lg:col-span-1 space-y-6">
                                        {/* Doctor / Therapist Assigned */}
                                        <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#E5E7EB]">
                                            <h3 className="text-lg font-bold text-[#111827] mb-4">
                                                Doctor / Therapist Assigned
                                            </h3>
                                            <div className="flex items-start gap-4">
                                                <div className="relative h-16 w-16 rounded-full overflow-hidden shrink-0">
                                                    <Image
                                                        src={resolveImageSrc(
                                                            selectedPatient?.doctor?.avatar ||
                                                            selectedPatient?.doctor?.avatarUrl ||
                                                            loggedInUser?.avatarUrl ||
                                                            loggedInUser?.avatar ||
                                                            ""
                                                        )}
                                                        alt={`${selectedPatient?.doctor?.firstname ?? "Dr."} ${selectedPatient?.doctor?.lastname ?? "Turner"}`}
                                                        fill
                                                        unoptimized
                                                        className="object-cover"
                                                    />
                                                </div>
                                                <div className="flex-1">
                                                    <p className="text-base sm:text-lg font-semibold text-[#111827] mb-0.5">
                                                        {`${selectedPatient?.doctor?.firstname ?? "Dr."} ${selectedPatient?.doctor?.lastname ?? "Turner"}`}
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
            {/* Medical Info Modal */}
            <Dialog open={isMedicalModalOpen} onOpenChange={setIsMedicalModalOpen}>
                <DialogContent className="max-w-2xl bg-white max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Edit Medical Information</DialogTitle>
                        <DialogDescription>
                            Update patient's medical history and concerns.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <Label>History & Description</Label>
                            <Textarea
                                placeholder="Enter patient history..."
                                value={formData.history}
                                onChange={(e) =>
                                    setFormData({ ...formData, history: e.target.value })
                                }
                                className="h-32"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Primary Concerns (comma separated)</Label>
                            <Input
                                placeholder="e.g., Fever, Headache"
                                value={formData.primaryConcerns.join(", ")}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        primaryConcerns: e.target.value.split(",").map((s) => s.trim()),
                                    })
                                }
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Medications (comma separated)</Label>
                            <Input
                                placeholder="e.g., Paracetamol, Ibuprofen"
                                value={formData.medications.join(", ")}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        medications: e.target.value.split(",").map((s) => s.trim()),
                                    })
                                }
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setIsMedicalModalOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button onClick={() => setIsMedicalModalOpen(false)}>Save Changes</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Notepad Modal */}
            <Dialog open={isNotepadOpen} onOpenChange={setIsNotepadOpen}>
                <DialogContent className="max-w-2xl bg-white">
                    <DialogHeader>
                        <DialogTitle>Doctor's Notes</DialogTitle>
                        <DialogDescription>
                            Add or update private notes for this patient.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <Textarea
                            placeholder="Type your notes here..."
                            value={notepadText}
                            onChange={(e) => setNotepadText(e.target.value)}
                            className="h-64"
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsNotepadOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={() => setIsNotepadOpen(false)}>Save Notes</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {showDeleteModal && (
                <div className="fixed inset-0 z-1000 bg-black/50 flex items-center justify-center">
                    <div className="bg-white p-6 rounded-lg shadow-md max-w-sm w-full">
                        <h2 className="text-lg font-semibold text-gray-800 mb-2">
                            Delete Appointment
                        </h2>
                        <p className="text-sm text-gray-600 mb-4">
                            This appointment will be permanently deleted. Do you want to
                            continue?
                        </p>
                        <div className="flex justify-end space-x-3">
                            <button
                                onClick={() => setShowDeleteModal(false)}
                                className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 text-gray-800 text-sm"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmDelete}
                                disabled={isDeleting}
                                className="px-4 py-2 rounded bg-red-600 hover:bg-red-700 text-white text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
