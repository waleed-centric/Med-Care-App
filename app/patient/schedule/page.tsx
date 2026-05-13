"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";

// Debounce function
// Update the debounce function to include the cancel method in its return type
const debounce = <F extends (...args: any[]) => any>(func: F, wait: number) => {
    let timeout: NodeJS.Timeout;

    const debounced = (...args: Parameters<F>) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };

    debounced.cancel = () => clearTimeout(timeout);

    return debounced as ((...args: Parameters<F>) => void) & { cancel: () => void };
};
import { useRouter, usePathname } from "next/navigation";

import {
    Search,
    Bell,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    Users,
    Calendar,
    MessageSquare,
    FileText,
    Stethoscope,
    Phone,
    Trash2,
    User,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import Cookies from "js-cookie";
import { seeAllAppointments, deleteClientAppointment } from "@/hooks/appointments";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut } from "lucide-react";
import { logout } from "@/lib/utils";
import TopBarUserMenu from "@/components/TopBarUserMenu";
import {
    Select,
    SelectTrigger,
    SelectContent,
    SelectItem,
    SelectValue,
} from "@/components/ui/select";

export default function PatientSchedule() {
    const pathname = usePathname();
    const navLinkClasses = (href: string) =>
        `flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${pathname === href
            ? "bg-[#9AC63F] text-white cursor-default"
            : "text-[#6B7280] hover:bg-[#F9FAFB]"
        }`;
    const [loggedInUser, setLoggedInUser] = useState<any>(null);
    const [activeNow, setActiveNow] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [appointments, setAppointments] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSearching, setIsSearching] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [appointmentToDelete, setAppointmentToDelete] = useState<string | null>(null);

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

    const getAppointments = useCallback(async (search: string = '') => {
        const isInitialLoad = !search;
        try {
            if (isInitialLoad) {
                setIsLoading(true);
            } else {
                setIsSearching(true);
            }

            const response = await seeAllAppointments(false, false, true, search);
            const list = Array.isArray((response as any)?.schedules)
                ? (response as any).schedules
                : Array.isArray(response as any)
                    ? (response as any)
                    : [];
            setAppointments(list);
        } catch (error) {
            console.log("error getting appointments", error);
            setAppointments([]);
        } finally {
            if (isInitialLoad) {
                setIsLoading(false);
            } else {
                setIsSearching(false);
            }
        }
    }, []);

    // Debounced version of getAppointments
    const debouncedSearch = useMemo(
        () => debounce((search: string) => {
            getAppointments(search);
        }, 500),
        [getAppointments]
    );

    // Initial load
    useEffect(() => {
        getAppointments();
    }, [getAppointments]);

    // Handle search term changes
    useEffect(() => {
        debouncedSearch(searchTerm);
        // Cleanup debounce on unmount
        return () => {
            debouncedSearch.cancel?.();
        };
    }, [searchTerm, debouncedSearch]);

    const filteredAppointments = useMemo(() => {
        const q = searchTerm.trim().toLowerCase();
        if (!q) return appointments;
        return appointments.filter((appointment: any) => {
            const dateStr = typeof appointment?.date === "string" ? appointment?.date : "";
            const timeStr = typeof appointment?.time === "string" ? appointment?.time : "";
            const doctorName = `${appointment?.doctor?.firstname || ""} ${appointment?.doctor?.lastname || ""}`.trim();
            const status = appointment?.status || "";
            const haystack = [dateStr, timeStr, doctorName, status].join(" ").toLowerCase();
            return haystack.includes(q);
        });
    }, [appointments, searchTerm]);

    const validAppointments = useMemo(
        () => filteredAppointments.filter((a: any) => a?.date && a?.status),
        [filteredAppointments]
    );

    const totalPages = useMemo(
        () => Math.max(1, Math.ceil(validAppointments.length / pageSize)),
        [validAppointments.length, pageSize]
    );

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm]);

    useEffect(() => {
        setCurrentPage(1);
    }, [pageSize]);

    const currentItems = useMemo(() => {
        const start = (currentPage - 1) * pageSize;
        return validAppointments.slice(start, start + pageSize);
    }, [validAppointments, currentPage, pageSize]);

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
        switch (String(type || "").toLowerCase()) {
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
     const resolveImageSrc = (url?: string): string => {
        const base = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "");
        return url ? `${base}/uploads/${url}` : "/images/avatar.PNG";
    };
    return (
        <div className="flex h-screen bg-[#F5F5F5] overflow-hidden">
            <aside className="w-64 bg-white border-r border-[#E5E7EB] flex flex-col">
                <div className="p-6 border-b border-[#E5E7EB]">
                    <div className="flex items-center gap-3 mb-2">
                        <Image src="/images/logo.svg" alt="Excel Connect logo" width={100} height={100} priority className="w-auto h-auto" />
                    </div>
                </div>

                <nav className="flex-1 p-4 space-y-2">
                    <Link href="/my-profile" onClick={(e) => { e.preventDefault(); if (pathname !== "/my-profile") window.location.href = "/my-profile"; }} className={navLinkClasses("/my-profile")}>
                        <User className="h-5 w-8" />
                        <span className="font-medium">My Profile</span>
                    </Link>
                    {/* <Link href="/patient/client" className="flex items-center gap-3 px-4 py-3 rounded-xl text-[#6B7280] hover:bg-[#F9FAFB] transition-colors">
                        <Users className="h-5 w-8" />
                        <span className="font-medium">Clients</span>
                    </Link> */}
                    <Link href="/patient/schedule" onClick={(e) => { e.preventDefault(); if (pathname !== "/patient/schedule") window.location.href = "/patient/schedule"; }} className={navLinkClasses("/patient/schedule")}>
                        <Calendar className="h-5 w-8" />
                        <span className="font-medium">Schedule</span>
                    </Link>
                    <Link href="/patient/messages" onClick={(e) => { e.preventDefault(); if (pathname !== "/patient/messages") window.location.href = "/patient/messages"; }} className={navLinkClasses("/patient/messages")}>
                        <MessageSquare className="h-5 w-8" />
                        <span className="font-medium">Chats</span>
                    </Link>
                    <Link href="/patient/see-therapist" onClick={(e) => { e.preventDefault(); if (pathname !== "/patient/see-therapist") window.location.href = "/patient/see-therapist"; }} className={navLinkClasses("/patient/see-therapist")}>
                        <Stethoscope className="h-5 w-8" />
                        <span className="font-medium">Connect client to a therapist</span>
                    </Link>
                </nav>
            </aside>

            <div className="flex-1 flex flex-col overflow-hidden">
                <header className="bg-white border-b border-[#E5E7EB] px-6 py-4">
                    <TopBarUserMenu user={loggedInUser} />
                </header>

                <main className="flex-1 overflow-y-auto p-6">
                    <div className="max-w-[2400px] mx-auto">
                        <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#E5E7EB] mb-6">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
                                <span className="text-sm flex justify-content-end text-[#6B7280]">
                                    Showing {validAppointments?.length ?? 0} of {appointments?.length ?? 0} Appointments
                                </span>
                            </div>
                            <div className="relative w-full max-w-md">
                                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search appointments..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-10 py-2.5 rounded-lg border border-gray-200 bg-white text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#9AC63F] focus:border-transparent"
                                    disabled={isSearching}
                                />
                                {isSearching && (
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#9AC63F] border-t-transparent"></div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl shadow-sm border border-[#E5E7EB] overflow-hidden">
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader className="bg-white">
                                        <TableRow className="border-b border-[#E5E7EB]">
                                            <TableHead className="text-sm font-semibold text-[#111827] py-4">Date</TableHead>
                                            <TableHead className="text-sm font-semibold text-[#111827] py-4">Doctor Name</TableHead>
                                            <TableHead className="text-sm font-semibold text-[#111827] py-4">Specialization</TableHead>
                                            <TableHead className="text-sm font-semibold text-[#111827] py-4">Time</TableHead>
                                            <TableHead className="text-sm font-semibold text-[#111827] py-4">Status</TableHead>
                                            <TableHead className="text-sm font-semibold text-[#111827] py-4">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {isLoading ? (
                                            <TableRow>
                                                <TableCell colSpan={6} className="text-center py-8">
                                                    <div className="flex justify-center">
                                                        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#9AC63F] border-t-transparent"></div>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ) : (validAppointments?.length ?? 0) === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={6} className="text-center py-8 text-sm text-[#6B7280]">No appointments found</TableCell>
                                            </TableRow>
                                        ) : (
                                            (currentItems || []).map((appointment: any, index) => (
                                                <TableRow key={appointment?._id || index} className="border-b border-[#E5E7EB] hover:bg-[#F9FAFB] transition-colors">
                                                    <TableCell className="text-sm text-[#111827] py-4">{appointment?.date}</TableCell>
                                                    <TableCell className="text-sm font-medium text-[#111827] py-4">
                                                        {`${appointment?.doctor?.firstname ?? ""} ${appointment?.doctor?.lastname ?? ""}`.trim() || appointment?.client?.name || "-"}
                                                    </TableCell>
                                                    <TableCell className="text-sm text-[#6B7280] py-4">
                                                        {String(appointment?.doctor?.specialization ?? appointment?.doctor?.title ?? "-")}
                                                    </TableCell>
                                                    <TableCell className="text-sm text-[#111827] py-4">{appointment?.time}</TableCell>
                                                    <TableCell className="py-4">
                                                        <span className={`text-sm font-medium ${getTypeColor(appointment?.status)}`}>{appointment?.status}</span>
                                                    </TableCell>
                                                    <TableCell className="py-4">
                                                        <div className="flex items-center gap-2">
                                                            <button onClick={(e) => { e.stopPropagation(); openDeleteModal(String(appointment?._id)); }} disabled={isDeleting} className="p-2 hover:bg-[#F9FAFB] rounded-full transition-colors" title="Delete">
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
                                    <Select value={String(pageSize)} onValueChange={(v) => setPageSize(Number(v))}>
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
                                        {Math.min((currentPage - 1) * pageSize + 1, validAppointments.length)}-
                                        {Math.min(currentPage * pageSize, validAppointments.length)} of {validAppointments.length}
                                    </span>
                                    <button className="p-2 rounded-lg border border-[#E5E7EB] hover:bg-[#F9FAFB] disabled:opacity-50" disabled={currentPage === 1} onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}>
                                        <ChevronLeft className="h-4 w-4 text-[#6B7280]" />
                                    </button>
                                    <button className="p-2 rounded-lg border border-[#E5E7EB] hover:bg-[#F9FAFB] disabled:opacity-50" disabled={currentPage >= totalPages} onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}>
                                        <ChevronRight className="h-4 w-4 text-[#6B7280]" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
            {showDeleteModal && (
                <div className="fixed inset-0 z-1000 bg-black/50 flex items-center justify-center">
                    <div className="bg-white p-6 rounded-lg shadow-md max-w-sm w-full">
                        <h2 className="text-lg font-semibold text-gray-800 mb-2">Delete Appointment</h2>
                        <p className="text-sm text-gray-600 mb-4">This appointment will be permanently deleted. Do you want to continue?</p>
                        <div className="flex justify-end space-x-3">
                            <button onClick={() => setShowDeleteModal(false)} className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 text-gray-800 text-sm">Cancel</button>
                            <button onClick={confirmDelete} disabled={isDeleting} className="px-4 py-2 rounded bg-red-600 hover:bg-red-700 text-white text-sm disabled:opacity-50 disabled:cursor-not-allowed">Delete</button>
                        </div>
                    </div>
                </div>
            )}
            {isDeleting && (
                <div className="fixed inset-0 z-2000 bg-white/90 backdrop-blur-sm flex items-center justify-center">
                    <div className="flex flex-col items-center gap-6">
                        <Image src="/images/logo.svg" alt="Excel Connect" width={120} height={120} priority />
                        <span className="h-8 w-8 animate-spin border-x-2 rounded-full" />
                    </div>
                </div>
            )}
        </div>
    );
}

