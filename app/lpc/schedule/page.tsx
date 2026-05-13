"use client";

import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
    Search,
    ChevronLeft,
    ChevronRight,
    Trash2,
} from "lucide-react";
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
    Select,
    SelectTrigger,
    SelectContent,
    SelectItem,
    SelectValue,
} from "@/components/ui/select";
import TopBarUserMenu from "@/components/TopBarUserMenu";
import LPCSidebar from "@/components/LPCSidebar";

export default function LPCSchedule() {
	const [loggedInUser, setLoggedInUser] = useState<any>(null);
	const [activeNow, setActiveNow] = useState(true);
	const [searchTerm, setSearchTerm] = useState("");
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
                
                // Debug log to check the API response
                console.log('API Response:', response);
                
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
			<LPCSidebar />

			{/* Main Content Area */}
			<div className="flex-1 flex flex-col overflow-hidden">
				{/* Top Bar */}
                <header className="bg-white border-b border-[#E5E7EB] px-6 py-4">
                    <TopBarUserMenu user={loggedInUser} />
                </header>

				{/* Main Content */}
				<main className="flex-1 overflow-y-auto p-6">
					<div className="max-w-[2400px] mx-auto">
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
															{/* <button
																	className="p-2 hover:bg-[#F9FAFB] rounded-full transition-colors"
																	title="View"
																>
																	<Eye className="h-4 w-4 text-[#6B7280]" />
																</button> */}
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
					</div>
				</main>
			</div>
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
