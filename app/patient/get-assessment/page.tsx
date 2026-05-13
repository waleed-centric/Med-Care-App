"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
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
	Upload,
	X,
	Star,
	Check,
	ChevronLeft,
	ChevronRight,
	LogOut,
    User,
}
	from "lucide-react";
import { Switch } from "@/components/ui/switch";
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
import Cookies from "js-cookie";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	submitAssessment,
	doctorAvailableTimes,
	AllAvailableDR,
	runExternalAppointment,
} from "@/hooks/appointments";
import { enqueueSnackbar } from "notistack";
import { usePathname, useRouter } from "next/navigation";

type DoctorItem = {
	id: string | number;
	name: string;
	title: string;
	avatar: string;
	years: number;
	rating: number;
	reviews: number;
};

export default function GetAssessment() {
	const [loggedInUser, setLoggedInUser] = useState<any>(null);
	const [activeNow, setActiveNow] = useState(true);
	const [currentStep, setCurrentStep] = useState(1);
	const [submitting, setSubmitting] = useState(false);
	const [clientImage, setClientImage] = useState<File | null>(null);
	const [clientImagePreview, setClientImagePreview] = useState<string | null>(
		null
	);
	const [documentFile, setDocumentFile] = useState<File | null>(null);
	const [documentPreview, setDocumentPreview] = useState<string | null>(null);
	const [selectedDoctorId, setSelectedDoctorId] = useState<string | null>(null);
	const [isNotepadOpen, setIsNotepadOpen] = useState(false);
	const [notepadText, setNotepadText] = useState("");
	const [newConcern, setNewConcern] = useState("");
	const [newMedication, setNewMedication] = useState("");
	const [activeDateIndex, setActiveDateIndex] = useState(0);
	const [dateStartOffset, setDateStartOffset] = useState(0);
	const [hasPickedDate, setHasPickedDate] = useState(false);
	const [selectedSlot, setSelectedSlot] = useState<
		"Morning" | "Afternoon" | "Evening"
	>("Morning");
	const [selectedTime, setSelectedTime] = useState<string | null>(null);
	const [availableTimes, setAvailableTimes] = useState<string[]>([]);
	const [isTimesLoading, setIsTimesLoading] = useState(false);
	const [slotsError, setSlotsError] = useState<string | null>(null);
	const [doctors, setDoctors] = useState<any>({ count: 0, doctors: [] });
	const [docCurrentPage, setDocCurrentPage] = useState(1);
	const [docPageSize, setDocPageSize] = useState(9);
	const [docTotalItems, setDocTotalItems] = useState(0);
	const [docTotalPages, setDocTotalPages] = useState(1);
	const [isDoctorsLoading, setIsDoctorsLoading] = useState(false);
	const [docSearchTerm, setDocSearchTerm] = useState("");
	const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

	const formatHeight = (raw: string) => {
		const digits = String(raw || "").replace(/\D/g, "");
		if (!digits) return "";
		const feet = digits.charAt(0);
		let inches = digits.slice(1, 3);
		if (!inches) return `${feet}'`;
		const n = parseInt(inches, 10);
		if (!isNaN(n) && n > 11) {
			inches = "11";
		}
		return `${feet}'${inches}`;
	};
	const pathname = usePathname();

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

	const formatWeight = (raw: string) => {
		const digits = String(raw || "").replace(/\D/g, "");
		return digits;
	};

	const isValidPhone = (val: string) => /^\d{10,15}$/.test(String(val || ""));

	const getDoctorAvatar = (d: any) =>
		resolveImageSrc(d?.avatarUrl ?? d?.avatar ?? "");

	const formatSlotTime = (
		input: string,
		slot: "Morning" | "Afternoon" | "Evening"
	): string | null => {
		const s = String(input).trim();
		let h: number | null = null;
		let m: number | null = null;
		let suffix: "AM" | "PM" | null = null;
		const withSuffix = s.match(/^(\d{1,2}):(\d{2})\s*(am|pm)$/i);
		const noSuffix = s.match(/^(\d{1,2}):(\d{2})$/);
		const hourOnlyWithSuffix = s.match(/^(\d{1,2})\s*(am|pm)$/i);
		const hourOnly = s.match(/^(\d{1,2})$/);
		if (withSuffix) {
			h = parseInt(withSuffix[1], 10);
			m = parseInt(withSuffix[2], 10);
			suffix = withSuffix[3].toUpperCase() as "AM" | "PM";
		} else if (noSuffix) {
			h = parseInt(noSuffix[1], 10);
			m = parseInt(noSuffix[2], 10);
		} else if (hourOnlyWithSuffix) {
			h = parseInt(hourOnlyWithSuffix[1], 10);
			m = 0;
			suffix = hourOnlyWithSuffix[2].toUpperCase() as "AM" | "PM";
		} else if (hourOnly) {
			h = parseInt(hourOnly[1], 10);
			m = 0;
		}
		if (h == null || m == null) return null;
		if (!withSuffix && !hourOnlyWithSuffix) {
			if (h === 0) {
				h = 12;
				suffix = "AM";
			} else if (h < 12) {
				suffix = "AM";
			} else if (h === 12) {
				suffix = "PM";
			} else {
				suffix = "PM";
				h = h - 12;
			}
		}
		suffix = slot === "Morning" ? "AM" : "PM";
		const hh = String(h).padStart(2, "0");
		const mm = String(m).padStart(2, "0");
		return `${hh}:${mm} ${suffix}`;
	};
    const router = useRouter();
    const [formData, setFormData] = useState({
		name: "",
		email: "",
		phone: "",
		age: "",
		gender: "Other",
		height: "",
		weight: "",
		streetAddress: "",
		city: "",
		state: "",
		zipCode: "",
        history: "",
        primaryConcerns: [] as string[],
        medications: [] as string[],
        pastDiagnosis: "No",
        diagnosisDetail: "",
        medicationPrescribed: "No",
        medicationKind: "",
        enrolledInOtherAgency: "No",
        otherAgencyName: "",
        referralSource: "",
        assessmentDate: "",
        assessmentTime: "",
        parentGuardianName: "",
        childName: "",
        grade: "",
        teacherNames: "",
        recipientName: "",
        healthInfoAuth: false,
        schoolInfoExchange: false,
        schoolNamePrint: "",
        expirationDate: "",
        printName: "",
        relationship: "",
        doctorNameClinic: "",
        doctorPhone: "",
        emergencyContactName: "",
        emergencyContactPhone: "",
        evacuationPlace: "No",
        planToEvacuate: "No",
        whenEvacuate: "",
        bestContactMethod: "Phone",
        sectionB_allHealthInfo: false,
        sectionB_excludeHealthInfo: false,
        sectionB_excludeText: "",
        parentAddress: "",
        parentHomePhone: "",
        parentAltPhone: "",
        pcpAddress: "",
        pcpFax: "",
        purposeOfRelease: "",
        emergencyContactRelationship: "",
        authorizingAgency: "",
        planToReturn: "No",
        whoWillEvacuateWithYou: "",
        haveNecessitiesToEvacuate: "No",
        ownCellPhone: "No",
        alternativeContactName: "",
        additionalComments: "",
        grievanceParentInitial: "",
        grievanceClientName: "",
        orientationInitial: "",
        orientationRecipientName: "",
        emergencyContactAddress: "",
        emergencyContactPhoneAlt: "",
        // Authorization for Outpatient Treatment
        authTreatment_clientName: "",
        authTreatment_date: "",
        authTreatment_services_assessment: false,
        authTreatment_services_group: false,
        authTreatment_services_education: false,
        authTreatment_services_family: false,
        authTreatment_services_psych: false,
        authTreatment_services_other: false,
        authTreatment_services_otherText: "",
        // Notice of Right to Appeal
        appealRights_clientInitial: "",
        // Second Party Involvement
        secondParty_clientName: "",
        secondParty_initial: "",
        secondParty_date: "",
        // Client Abuse and/or Neglect
        abuseNeglect_clientName: "",
        abuseNeglect_date: "",
        // Crisis Response Plan Acknowledgement
        crisisPlan_guardianName: "",
        crisisPlan_date: "",
        // 24-Hour Crisis Response Hospitalization Plan
        hospitalizationPlan_initial: "",
        hospitalizationPlan_date: "",
        // 24 Hours On Call Policy
        onCallPolicy_initial: "",
        onCallPolicy_printName: "",
        onCallPolicy_date: "",
        // Healthy Louisiana Member Choice
        choiceForm_providerName: "",
        choiceForm_providerPhone: "",
        choiceForm_contactName: "",
        choiceForm_npi: "",
        choiceForm_signature: "",
        choiceForm_date: "",
        choiceForm_guardianInitial: "",
        // After Hours & Weekend Policy
        weekendPolicy_initial: "",
        weekendPolicy_date: "",
        weekendPolicy_signature: "",
        weekendPolicy_signatureDate: "",
        weekendPolicy_printName: "",
    });

	const navLinkClasses = (href: string) => {
		const isActive =
			pathname === href ||
			pathname.endsWith(href) ||
			pathname.startsWith(`${href}/`);
		return `flex w-full items-center gap-3 px-0 py-3 rounded-xl ${isActive
			? "bg-[#9AC63F] text-white cursor-default"
			: "text-[#6B7280] hover:bg-[#F9FAFB] transition-colors"
			}`;
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

	const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (file) {
			setClientImage(file);
			const reader = new FileReader();
			reader.onloadend = () => {
				setClientImagePreview(reader.result as string);
			};
			reader.readAsDataURL(file);
		}
	};

	const handleDocumentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (file) {
			setDocumentFile(file);
			const reader = new FileReader();
			reader.onloadend = () => {
				setDocumentPreview(reader.result as string);
			};
			reader.readAsDataURL(file);
		}
	};

	const handleDragOver = (e: React.DragEvent) => {
		e.preventDefault();
		e.stopPropagation();
	};

	const handleDrop = (e: React.DragEvent) => {
		e.preventDefault();
		e.stopPropagation();
		const file = e.dataTransfer.files[0];
		if (file) {
			setDocumentFile(file);
			const reader = new FileReader();
			reader.onloadend = () => {
				setDocumentPreview(reader.result as string);
			};
			reader.readAsDataURL(file);
		}
	};

	const openNotepad = () => {
		setNotepadText(formData.history);
		setIsNotepadOpen(true);
	};

	const saveNotepad = () => {
		setFormData({ ...formData, history: notepadText });
		setIsNotepadOpen(false);
	};

	const addConcern = () => {
		const v = newConcern.trim();
		if (!v) return;
		setFormData({
			...formData,
			primaryConcerns: [...formData.primaryConcerns, v],
		});
		setNewConcern("");
	};

	const removeConcern = (idx: number) => {
		setFormData({
			...formData,
			primaryConcerns: formData.primaryConcerns.filter((_, i) => i !== idx),
		});
	};

	const addMedication = () => {
		const v = newMedication.trim();
		if (!v) return;
		setFormData({ ...formData, medications: [...formData.medications, v] });
		setNewMedication("");
	};

	const removeMedication = (idx: number) => {
		setFormData({
			...formData,
			medications: formData.medications.filter((_, i) => i !== idx),
		});
	};

	const steps = [
		{ number: 1, label: "Basic information" },
		{ number: 2, label: "Medical Information" },
        { number: 3, label: "Emergency & Consent" },
		{ number: 4, label: "Upload Document" },
		{ number: 5, label: "Assign a Doctor" },
	];

	const extractMarketerIdFromToken = () => {
		try {
			const token =
				typeof window !== "undefined"
					? localStorage.getItem("token") || Cookies.get("token") || ""
					: "";
			const parts = token.split(".");
			if (parts.length > 1) {
				const payload = parts[1].replace(/-/g, "+").replace(/_/g, "/");
				const padded = payload.padEnd(Math.ceil(payload.length / 4) * 4, "=");
				const decoded: any = padded ? JSON.parse(atob(padded)) : null;
				return (
					decoded?.id || decoded?.userId || decoded?._id || decoded?.sub || null
				);
			}
		} catch { }
		try {
			const userStr = Cookies.get("user");
			if (userStr) {
				const u = JSON.parse(userStr);
				return u?.id ?? null;
			}
		} catch { }
		return null;
	};

	useEffect(() => {
		const run = async () => {
			setIsDoctorsLoading(true);
			try {
				const data: any = await AllAvailableDR(docPageSize, "approved", docCurrentPage, docSearchTerm);
				setDoctors(data);
				const total = Number(
					(data as any)?.totalItems ?? (data as any)?.count ?? (((data as any)?.doctors ?? []) as any[]).length
				);
				const pages = Number(
					(data as any)?.totalPages ?? Math.max(1, Math.ceil(total / Math.max(1, docPageSize)))
				);
				setDocTotalItems(total);
				setDocTotalPages(pages);
				if (!selectedDoctorId) {
					const first = (data as any)?.doctors?.[0]?._id;
					if (first) setSelectedDoctorId(String(first));
				}
			} catch (e: any) { }
			setIsDoctorsLoading(false);
		};
		run();
	}, [docCurrentPage, docPageSize, docSearchTerm]);

	// Reset to first page when searching
	useEffect(() => {
		setDocCurrentPage(1);
	}, [docSearchTerm]);

	useEffect(() => {
		const run = async () => {
			if (currentStep !== 5) return;
			if (!selectedDoctorId) return;
			setIsTimesLoading(true);
			setSlotsError(null);
			const baseDate = new Date();
			const d = new Date(baseDate);
			d.setDate(baseDate.getDate() + dateStartOffset + activeDateIndex);
			const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
				2,
				"0"
			)}-${String(d.getDate()).padStart(2, "0")}`;
			try {
				const slotKey = selectedSlot.toLowerCase();
				const resp = await doctorAvailableTimes(
					selectedDoctorId,
					dateStr,
					slotKey
				);
				let list: any = [];
				if (resp?.slots) {
					list =
						resp.slots[slotKey] ??
						resp.slots[selectedSlot] ??
						resp.slots[slotKey.toUpperCase()] ??
						[];
				} else if (Array.isArray(resp)) {
					list = resp;
				} else if ((resp as any)?.times) {
					list = (resp as any).times;
				} else {
					list = [];
				}
				const rawList: string[] = (Array.isArray(list) ? list : []).map(
					(v: any) => String(v)
				);
				const formatted = rawList
					.map((t) => formatSlotTime(t, selectedSlot))
					.filter((t): t is string => Boolean(t));
				const grid =
					selectedSlot === "Morning"
						? [
							"06:00 AM",
							"06:30 AM",
							"07:00 AM",
							"07:30 AM",
							"08:00 AM",
							"08:30 AM",
							"09:00 AM",
							"09:30 AM",
							"10:00 AM",
							"10:30 AM",
							"11:00 AM",
							"11:30 AM",
						]
						: selectedSlot === "Afternoon"
							? [
								"12:00 PM",
								"12:30 PM",
								"01:00 PM",
								"01:30 PM",
								"02:00 PM",
								"02:30 PM",
								"03:00 PM",
								"03:30 PM",
								"04:00 PM",
								"04:30 PM",
							]
							: [
								"05:00 PM",
								"05:30 PM",
								"06:00 PM",
								"06:30 PM",
								"07:00 PM",
								"07:30 PM",
								"08:00 PM",
								"08:30 PM",
								"09:00 PM",
								"09:30 PM",
							];
				const normalized = formatted.filter((t) => grid.includes(t));
				setAvailableTimes(normalized);
			} catch (e: any) {
				setAvailableTimes([]);
				setSlotsError(e?.message || "Failed to load times");
			} finally {
				setIsTimesLoading(false);
			}
		};
		run();
	}, [
		currentStep,
		selectedDoctorId,
		dateStartOffset,
		activeDateIndex,
		selectedSlot,
	]);

	const validateBasics = () => {
		const errs: Record<string, string> = {};
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		const phoneDigits = String(formData.phone || '').replace(/\D/g, '');
		const ageDigits = String(formData.age || '').match(/\d+/)?.[0];
		const weightDigits = String(formData.weight || '').match(/\d+/)?.[0];
		const heightStr = String(formData.height || '').trim();
		const heightRegex = /^([1-9])'([0-9]|1[0-1])$/;
		if (!String(formData.name || '').trim()) errs.name = 'Name is required';
		if (!emailRegex.test(String(formData.email || ''))) errs.email = 'Enter a valid email';
		if (!isValidPhone(phoneDigits)) errs.phone = 'Phone must be 10-15 digits';
		if (!String(formData.gender || '').trim()) errs.gender = 'Select gender';
		if (!ageDigits) errs.age = 'Enter a valid age';
		if (!heightRegex.test(heightStr)) errs.height = "Height must be like 5'4";
		if (!weightDigits) errs.weight = 'Enter a valid weight';
		if (!String(formData.streetAddress || '').trim()) errs.streetAddress = 'Street address is required';
		if (!String(formData.city || '').trim()) errs.city = 'Select city';
		if (!String(formData.state || '').trim()) errs.state = 'State is required';
		if (!/^\d{5}$/.test(String(formData.zipCode || ''))) errs.zipCode = 'ZIP must be 5 digits';
		setFieldErrors(errs);
		if (Object.keys(errs).length) {
			enqueueSnackbar('Please fix the highlighted fields', { variant: 'error' });
			return false;
		}
		return true;
	};

    const handleNext = () => {
        if (currentStep === 1) {
            if (!validateBasics()) return;
        }
        if (currentStep === 2) {
            const count = (formData.primaryConcerns || []).filter((c) => String(c).trim()).length;
            if (count < 1) {
                enqueueSnackbar('Please add at least 1 Primary Concern', { variant: 'error' });
                return;
            }
            if (formData.pastDiagnosis === "Yes" && !formData.diagnosisDetail.trim()) {
                enqueueSnackbar('Please specify the past diagnosis', { variant: 'error' });
                return;
            }
            if (formData.medicationPrescribed === "Yes" && !formData.medicationKind.trim()) {
                enqueueSnackbar('Please specify the medication kind', { variant: 'error' });
                return;
            }
        }
        if (currentStep < 5) {
            setCurrentStep(currentStep + 1);
        }
    };

	const handlePrevious = () => {
		if (currentStep > 1) {
			setCurrentStep(currentStep - 1);
		}
	};

	const buildAssessmentPayload = () => {
		const formDataPayload = new FormData();

		const docList: any[] = (doctors as any)?.doctors || [];
		const selectedDoc: any =
			docList.find((d: any) => String(d?._id) === String(selectedDoctorId)) ||
			undefined;
		const baseDate = new Date();
		const chosenDate = new Date(baseDate);
		chosenDate.setDate(baseDate.getDate() + dateStartOffset + activeDateIndex);
		const dateStr = `${chosenDate.getFullYear()}-${String(
			chosenDate.getMonth() + 1
		).padStart(2, "0")}-${String(chosenDate.getDate()).padStart(2, "0")}`;

		const basicInformation = {
			name: formData.name,
			email: formData.email,
			phone: formData.phone,
			age: formData.age,
			gender: formData.gender,
			height: formData.height,
			weight: formData.weight,
			streetAddress: formData.streetAddress,
			city: formData.city,
			state: formData.state,
			zipCode: formData.zipCode,
		};


		const medicalInformation = {
			history: formData.history,
			primaryConcerns: formData.primaryConcerns,
			pastDiagnosis: formData.pastDiagnosis,
			diagnosisDetail: formData.diagnosisDetail,
			medications: formData.medications,
			medicationPrescribed: formData.medicationPrescribed,
			medicationKind: formData.medicationKind,
            enrolledInOtherAgency: formData.enrolledInOtherAgency,
            otherAgencyName: formData.otherAgencyName,
            referralSource: formData.referralSource,
            assessmentDate: formData.assessmentDate,
            assessmentTime: formData.assessmentTime,
		};

        const consentAndEmergency = {
            parentGuardianName: formData.parentGuardianName,
            childName: formData.childName,
            grade: formData.grade,
            teacherNames: formData.teacherNames,
            recipientName: formData.recipientName,
            healthInfoAuth: formData.healthInfoAuth,
            schoolInfoExchange: formData.schoolInfoExchange,
            schoolNamePrint: formData.schoolNamePrint,
            expirationDate: formData.expirationDate,
            printName: formData.printName,
            relationship: formData.relationship,
            doctorNameClinic: formData.doctorNameClinic,
            doctorPhone: formData.doctorPhone,
            emergencyContactName: formData.emergencyContactName,
            emergencyContactPhone: formData.emergencyContactPhone,
            evacuationPlace: formData.evacuationPlace,
            planToEvacuate: formData.planToEvacuate,
            whenEvacuate: formData.whenEvacuate,
            bestContactMethod: formData.bestContactMethod,
            sectionB_allHealthInfo: formData.sectionB_allHealthInfo,
            sectionB_excludeHealthInfo: formData.sectionB_excludeHealthInfo,
            sectionB_excludeText: formData.sectionB_excludeText,
            parentAddress: formData.parentAddress,
            parentHomePhone: formData.parentHomePhone,
            parentAltPhone: formData.parentAltPhone,
            pcpAddress: formData.pcpAddress,
            pcpFax: formData.pcpFax,
            purposeOfRelease: formData.purposeOfRelease,
            emergencyContactRelationship: formData.emergencyContactRelationship,
            authorizingAgency: formData.authorizingAgency,
            planToReturn: formData.planToReturn,
            whoWillEvacuateWithYou: formData.whoWillEvacuateWithYou,
            haveNecessitiesToEvacuate: formData.haveNecessitiesToEvacuate,
            ownCellPhone: formData.ownCellPhone,
            alternativeContactName: formData.alternativeContactName,
            additionalComments: formData.additionalComments,
            grievanceParentInitial: formData.grievanceParentInitial,
            grievanceClientName: formData.grievanceClientName,
            orientationInitial: formData.orientationInitial,
            orientationRecipientName: formData.orientationRecipientName,
            emergencyContactAddress: formData.emergencyContactAddress,
            emergencyContactPhoneAlt: formData.emergencyContactPhoneAlt,
            // Authorization for Outpatient Treatment
            authTreatment_clientName: formData.authTreatment_clientName,
            authTreatment_date: formData.authTreatment_date,
            authTreatment_services_assessment: formData.authTreatment_services_assessment,
            authTreatment_services_group: formData.authTreatment_services_group,
            authTreatment_services_education: formData.authTreatment_services_education,
            authTreatment_services_family: formData.authTreatment_services_family,
            authTreatment_services_psych: formData.authTreatment_services_psych,
            authTreatment_services_other: formData.authTreatment_services_other,
            authTreatment_services_otherText: formData.authTreatment_services_otherText,
            // Notice of Right to Appeal
            appealRights_clientInitial: formData.appealRights_clientInitial,
            // Second Party Involvement
            secondParty_clientName: formData.secondParty_clientName,
            secondParty_initial: formData.secondParty_initial,
            secondParty_date: formData.secondParty_date,
            // Client Abuse and/or Neglect
            abuseNeglect_clientName: formData.abuseNeglect_clientName,
            abuseNeglect_date: formData.abuseNeglect_date,
            // Crisis Response Plan Acknowledgement
            crisisPlan_guardianName: formData.crisisPlan_guardianName,
            crisisPlan_date: formData.crisisPlan_date,
            // 24-Hour Crisis Response Hospitalization Plan
            hospitalizationPlan_initial: formData.hospitalizationPlan_initial,
            hospitalizationPlan_date: formData.hospitalizationPlan_date,
            // 24 Hours On Call Policy
            onCallPolicy_initial: formData.onCallPolicy_initial,
            onCallPolicy_printName: formData.onCallPolicy_printName,
            onCallPolicy_date: formData.onCallPolicy_date,
            // Healthy Louisiana Member Choice
            choiceForm_providerName: formData.choiceForm_providerName,
            choiceForm_providerPhone: formData.choiceForm_providerPhone,
            choiceForm_contactName: formData.choiceForm_contactName,
            choiceForm_npi: formData.choiceForm_npi,
            choiceForm_signature: formData.choiceForm_signature,
            choiceForm_date: formData.choiceForm_date,
            choiceForm_guardianInitial: formData.choiceForm_guardianInitial,
            // After Hours & Weekend Policy
            weekendPolicy_initial: formData.weekendPolicy_initial,
            weekendPolicy_date: formData.weekendPolicy_date,
            weekendPolicy_signature: formData.weekendPolicy_signature,
            weekendPolicy_signatureDate: formData.weekendPolicy_signatureDate,
            weekendPolicy_printName: formData.weekendPolicy_printName,
        };

		const appointment = {
			date: dateStr,
			slot: selectedSlot,
			time: selectedTime,
		};

		const assignDoctor = selectedDoc
			? {
				id: selectedDoc._id,
				name: selectedDoc.displayName || selectedDoc.name,
				title: selectedDoc.specialization || selectedDoc.title,
				years: Number(selectedDoc.yearsExperience ?? selectedDoc.years ?? 0),
				rating: Number(selectedDoc.rating ?? 0),
				reviews: Number(selectedDoc.reviewsCount ?? selectedDoc.reviews ?? 0),
				avatarUrl: selectedDoc.avatarUrl,
			}
			: null;

		const meta = { activeNow, userId: loggedInUser?.id ?? null };
		const marketerId = extractMarketerIdFromToken();

		formDataPayload.append(
			"basicInformation",
			JSON.stringify(basicInformation)
		);
		formDataPayload.append(
			"medicalInformation",
			JSON.stringify(medicalInformation)
		);
        formDataPayload.append(
            "consentAndEmergency",
            JSON.stringify(consentAndEmergency)
        );
		formDataPayload.append("appointment", JSON.stringify(appointment));
		formDataPayload.append("assignDoctorId", selectedDoctorId || "");
		if (marketerId) {
			formDataPayload.append("marketerId", String(marketerId));
		}
		if (assignDoctor) {
			formDataPayload.append("assignDoctor", JSON.stringify(assignDoctor));
		}
		formDataPayload.append("meta", JSON.stringify(meta));

		if (clientImage) {
			formDataPayload.append("clientImage", clientImage);
		}
		if (documentFile) {
			formDataPayload.append("documentFile", documentFile);
		}

		return formDataPayload;
	};

	const filteredDoctors = (doctors as any)?.doctors ?? [];

    const handleSubmit = async () => {
        setSubmitting(true);
        const payload = buildAssessmentPayload();
        try {
            const response = await runExternalAppointment(payload);
            const statusCode = Number(response?.status);
            const isOk = statusCode >= 200 && statusCode < 300;
            const msg = response?.message;
            if (
                isOk &&
                typeof msg === "string" &&
                msg.toLowerCase().includes("assessment submitted successfully")
            ) {
                enqueueSnackbar(msg, { variant: "success" });
                router.push("/patient/client");
            } else {
                enqueueSnackbar(msg || "Assessment submission failed", {
                    variant: "error",
                });
            }
        } catch (error) {
            enqueueSnackbar("Assessment submission failed", { variant: "error" });
        } finally {
            setSubmitting(false);
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
							width={100}
							height={100}
							priority
							unoptimized
							className="w-auto h-auto"
						/>
					</div>
				</div>

				{/* Navigation */}
				<nav className="flex-1 p-6 space-y-2">
					<Link
							href="/my-profile"
							onClick={(e) => { e.preventDefault(); if (pathname !== "/my-profile") window.location.href = "/my-profile"; }}
							className={navLinkClasses("/my-profile")}
						>
							<User className="h-5 w-8" />
							<span className="font-medium">My Profile</span>
						</Link>
					{/* <Link
						href="/patient/client"
						className={navLinkClasses("/patient/client")}
					>
						<Users className="h-5 w-8" />
						<span className="font-medium">Clients</span>
					</Link> */}

					<Link
						href="/patient/schedule"
						onClick={(e) => { e.preventDefault(); if (pathname !== "/patient/schedule") window.location.href = "/patient/schedule"; }}
						className={navLinkClasses("/patient/schedule")}
					>
						<Calendar className="h-5 w-8" />
						<span className="font-medium">Schedule</span>
					</Link>

					<Link
						href="/patient/messages"
						onClick={(e) => { e.preventDefault(); if (pathname !== "/patient/messages") window.location.href = "/patient/messages"; }}
						className={navLinkClasses("/patient/messages")}
					>
						<MessageSquare className="h-5 w-8" />
						<span className="font-medium">Chats</span>
					</Link>
					<Link
						href="/patient/see-therapist"
						onClick={(e) => { e.preventDefault(); if (pathname !== "/patient/see-therapist") window.location.href = "/patient/see-therapist"; }}
						className={navLinkClasses("/patient/see-therapist")}
					>
						<Stethoscope className="h-5 w-8" />
						<span className="font-medium">Connect client to a therapist</span>
					</Link>
				</nav>
			</aside>

			{/* Main Content Area */}
			<div className="flex-1 flex flex-col overflow-hidden">
				{/* Global Header Bar */}
                <header className="bg-white border-b border-[#E5E7EB] px-6 py-4">
                    <TopBarUserMenu user={loggedInUser} />
                </header>

				{/* Main Content */}
				<main className="flex-1 overflow-y-auto bg-[#F5F5F5] p-6">
					<div className="max-w-4xl mx-auto">
						{/* Progress Steps */}
						<div className="flex items-center gap-4 mb-8">
							{steps.map((step, index) => (
								<div
									key={step.number}
									className="flex items-center gap-4 flex-1"
								>
									<div className="flex items-center gap-3">
										<div
											className={`px-3 py-1.5 rounded-lg flex items-center justify-center text-sm font-semibold ${currentStep >= step.number
												? "bg-[#9AC63F] text-white"
												: "bg-[#F3F4F6] text-[#9CA3AF]"
												}`}
										>
											{step.number}
										</div>
										<span
											className={`text-sm ${currentStep >= step.number
												? "text-[#111827] font-medium"
												: "text-[#9CA3AF]"
												}`}
										>
											{step.label}
										</span>
									</div>
								</div>
							))}
						</div>

						{/* Form Content */}
						<div className="bg-white rounded-2xl p-6 shadow-sm border border-[#E5E7EB]">
							{/* Step 1: Basic Information */}
							{currentStep === 1 && (
								<div className="space-y-6">
									<h2 className="text-2xl font-bold text-[#111827] mb-6">
										Basic Information
									</h2>

									{/* Client Image Section */}
									<div
										className="space-y-4 cursor-pointer"
										onClick={() => document.getElementById('patientAssessmentImageInput')?.click()}
										role="button"
										tabIndex={0}
									>
										<h3 className="text-lg font-semibold text-[#111827]">
											Client Image
										</h3>
										<div className="border-2 border-dashed border-[#E5E7EB] rounded-xl p-8 text-center bg-[#F9FAFB]">
											{clientImagePreview ? (
												<div className="relative inline-block">
													<Image
														src={clientImagePreview}
														alt=""
														width={200}
														height={200}
														unoptimized
														className="rounded-lg object-cover"
													/>
													<button
														onClick={() => {
															setClientImage(null);
															setClientImagePreview(null);
														}}
														className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
													>
														<X className="h-4 w-4" />
													</button>
												</div>
											) : (
												<div
													className="space-y-4 cursor-pointer"
													role="button"
													tabIndex={0}
												>
													<div className="flex justify-center">
														<div className="w-32 h-32 bg-[#E5E7EB] rounded-lg flex items-center justify-center">
															<Upload className="h-12 w-12 text-[#9CA3AF]" />
														</div>
													</div>
													<p className="text-sm text-[#6B7280]">
														Please upload or take a image, size less than 100KB
													</p>
													<label className="inline-block" onClick={(e) => e.stopPropagation()}>
														<span className="px-6 py-2 bg-[#9AC63F] text-white rounded-lg cursor-pointer hover:bg-[#85af34] transition-colors">
															Choose File
														</span>
														<input
															id="patientAssessmentImageInput"
															type="file"
															accept="image/*"
															onChange={handleImageChange}
															className="hidden"
														/>
													</label>
													<p className="text-xs text-[#6B7280]">
														No File Chosen
													</p>
												</div>
											)}
										</div>
									</div>

									{/* Basic Information Form */}
									<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
										<div>
											<label className="block text-sm font-medium text-[#111827] mb-2">
												Name
											</label>
											<input
												type="text"
												value={formData.name}
												onChange={(e) =>
													setFormData({ ...formData, name: e.target.value })
												}
												className="w-full px-4 py-2 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9AC63F]/20"
											/>
											{fieldErrors.name && (
												<p className="text-red-600 text-xs mt-1">{fieldErrors.name}</p>
											)}
										</div>
										<div>
											<label className="block text-sm font-medium text-[#111827] mb-2">
												Email
											</label>
											<input
												type="email"
												value={formData.email}
												onChange={(e) =>
													setFormData({ ...formData, email: e.target.value })
												}
												className="w-full px-4 py-2 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9AC63F]/20"
											/>
											{fieldErrors.email && (
												<p className="text-red-600 text-xs mt-1">{fieldErrors.email}</p>
											)}
										</div>
										<div>
											<label className="block text-sm font-medium text-[#111827] mb-2">
												Phone No.
											</label>
											<input
												type="tel"
												value={formData.phone}
												onChange={(e) => {
													const digits = e.target.value.replace(/\D/g, '').slice(0, 15);
													setFormData({ ...formData, phone: digits });
													setFieldErrors((prev) => {
														const next = { ...prev };
														if (!isValidPhone(digits)) next.phone = 'Phone must be 10-15 digits';
														else delete next.phone;
														return next;
													});
												}}
												placeholder="1234567890"
												inputMode="tel"
												pattern="\d{10,15}"
												title="Enter a valid phone number: 10-15 digits"
												maxLength={15}
												onBlur={(e) => {
													const digits = e.target.value.replace(/\D/g, '');
													setFieldErrors((prev) => {
														const next = { ...prev };
														if (!isValidPhone(digits)) next.phone = 'Phone must be 10-15 digits';
														else delete next.phone;
														return next;
													});
												}}
												className="w-full px-4 py-2 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9AC63F]/20"
											/>
											{fieldErrors.phone && (
												<p className="text-red-600 text-xs mt-1">{fieldErrors.phone}</p>
											)}
										</div>
										<div>
											<label className="block text-sm font-medium text-[#111827] mb-2">
												Gender
											</label>
											<select
												value={formData.gender}
												onChange={(e) =>
													setFormData({ ...formData, gender: e.target.value })
												}
												className="w-full px-4 py-2 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9AC63F]/20"
											>
												<option value="Female">Female</option>
												<option value="Male">Male</option>
												<option value="Other">Other</option>
											</select>
											{fieldErrors.gender && (
												<p className="text-red-600 text-xs mt-1">{fieldErrors.gender}</p>
											)}
										</div>
										<div>
											<label className="block text-sm font-medium text-[#111827] mb-2">
												Age
											</label>
											<input
												type="text"
												value={formData.age}
												onChange={(e) =>
													setFormData({ ...formData, age: e.target.value })
												}
												className="w-full px-4 py-2 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9AC63F]/20"
											/>
											{fieldErrors.age && (
												<p className="text-red-600 text-xs mt-1">{fieldErrors.age}</p>
											)}
										</div>
										<div>
											<label className="block text-sm font-medium text-[#111827] mb-2">
												Height
											</label>
											<input
												type="text"
												value={formData.height}
												onChange={(e) =>
													setFormData({ ...formData, height: formatHeight(e.target.value) })
												}
												className="w-full px-4 py-2 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9AC63F]/20"
											/>
											{fieldErrors.height && (
												<p className="text-red-600 text-xs mt-1">{fieldErrors.height}</p>
											)}
										</div>
										<div>
											<label className="block text-sm font-medium text-[#111827] mb-2">
												Weight
											</label>
											<div className="relative">
												<input
													type="text"
													value={formData.weight}
													onChange={(e) =>
														setFormData({ ...formData, weight: formatWeight(e.target.value) })
													}
													className="w-full pl-4 pr-12 py-2 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9AC63F]/20"
												/>
												<span className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B7280] text-sm">lb</span>
											</div>
											{fieldErrors.weight && (
												<p className="text-red-600 text-xs mt-1">{fieldErrors.weight}</p>
											)}
										</div>
										<div>
											<label className="block text-sm font-medium text-[#111827] mb-2">
												Street Address
											</label>
											<input
												type="text"
												value={formData.streetAddress}
												onChange={(e) =>
													setFormData({
														...formData,
														streetAddress: e.target.value,
													})
												}
												className="w-full px-4 py-2 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9AC63F]/20"
											/>
											{fieldErrors.streetAddress && (
												<p className="text-red-600 text-xs mt-1">{fieldErrors.streetAddress}</p>
											)}
										</div>
										<div>
											<label className="block text-sm font-medium text-[#111827] mb-2">
												City
											</label>
											{/* <select
												value={formData.city}
												onChange={(e) =>
													setFormData({ ...formData, city: e.target.value })
												}
												className="w-full px-4 py-2 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9AC63F]/20"
											>
												<option value="Fort Lauderdale">Fort Lauderdale</option>
												<option value="Miami">Miami</option>
												<option value="Orlando">Orlando</option>
											</select> */}
											<input
												type="text"
												value={formData.city}
												onChange={(e) =>
													setFormData({ ...formData, city: e.target.value })
												}
												className="w-full px-4 py-2 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9AC63F]/20"
											/>
											{fieldErrors.city && (
												<p className="text-red-600 text-xs mt-1">{fieldErrors.city}</p>
											)}
										</div>
										<div>
											<label className="block text-sm font-medium text-[#111827] mb-2">
												State
											</label>
											<input
												type="text"
												value={formData.state}
												onChange={(e) =>
													setFormData({ ...formData, state: e.target.value })
												}
												className="w-full px-4 py-2 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9AC63F]/20"
											/>
											{fieldErrors.state && (
												<p className="text-red-600 text-xs mt-1">{fieldErrors.state}</p>
											)}
										</div>
										<div>
											<label className="block text-sm font-medium text-[#111827] mb-2">
												Zip Code
											</label>
											<input
												type="text"
												value={formData.zipCode}
												onChange={(e) =>
													setFormData({ ...formData, zipCode: e.target.value })
												}
												className="w-full px-4 py-2 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9AC63F]/20"
											/>
											{fieldErrors.zipCode && (
												<p className="text-red-600 text-xs mt-1">{fieldErrors.zipCode}</p>
											)}
										</div>
									</div>
								</div>
							)}

							{/* Step 2: Medical Information */}
							{currentStep === 2 && (
								<div className="space-y-6">
									{/* History */}
									<div className="space-y-3">
										<h3 className="text-lg font-semibold text-[#111827]">
											History
										</h3>
										<textarea
											value={formData.history}
											onChange={(e) =>
												setFormData({ ...formData, history: e.target.value })
											}
											rows={6}
											className="w-full px-4 py-3 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9AC63F]/20 resize-none"
										/>
									</div>

									{/* Presenting Problems */}
									<div className="space-y-4">
										<h3 className="text-lg font-semibold text-[#111827]">
											PRESENTING PROBLEM (S) (Check all that apply)
										</h3>
										<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
											{[
												"Anxiety",
												"Criminal behavior(stealing, breaking into houses and vandalism)",
												"Constant restlessness",
												"Cutting Self",
												"Defiance (not wanting to do what they are told)",
												"Depression",
												"Destructiveness (e.g., destroying property)",
												"Difficulty concentrating",
												"Fidgety",
												"Fighting",
												"Fire-setting",
												"Forgetting Instructions",
												"Hitting or biting themselves",
												"Hurting pets or other animals",
												"Low self-esteem",
												"Lying",
												"Phobias",
												"Running away",
												"Suicidal",
												"Talking back or arguing with parents/teachers"
											].map((problem) => (
												<div key={problem} className="flex items-start gap-2">
													<input
														type="checkbox"
														id={`problem-${problem}`}
														checked={formData.primaryConcerns.includes(problem)}
														onChange={(e) => {
															const checked = e.target.checked;
															setFormData(prev => ({
																...prev,
																primaryConcerns: checked
																	? [...prev.primaryConcerns, problem]
																	: prev.primaryConcerns.filter(p => p !== problem)
															}));
														}}
														className="mt-1 h-4 w-4 text-[#9AC63F] border-gray-300 rounded focus:ring-[#9AC63F]"
													/>
													<label htmlFor={`problem-${problem}`} className="text-sm text-[#374151]">
														{problem}
													</label>
												</div>
											))}
										</div>
									</div>

									{/* Past Treatment */}
									<div className="space-y-6 pt-6 border-t border-[#E5E7EB]">
										<h3 className="text-lg font-semibold text-[#111827] uppercase">
											PAST TREATMENT:
										</h3>

										<div>
											<label className="block text-sm font-medium text-[#111827] mb-2">
												Has the client been diagnosed with a behavioral or mental disorder in the past?
											</label>
											<div className="flex gap-4">
												<label className="flex items-center gap-2">
													<input
														type="radio"
														name="pastDiagnosis"
														value="Yes"
														checked={formData.pastDiagnosis === "Yes"}
														onChange={(e) => setFormData({ ...formData, pastDiagnosis: e.target.value })}
														className="text-[#9AC63F] focus:ring-[#9AC63F]"
													/>
													<span className="text-sm text-[#374151]">Yes</span>
												</label>
												<label className="flex items-center gap-2">
													<input
														type="radio"
														name="pastDiagnosis"
														value="No"
														checked={formData.pastDiagnosis === "No"}
														onChange={(e) => setFormData({ ...formData, pastDiagnosis: e.target.value })}
														className="text-[#9AC63F] focus:ring-[#9AC63F]"
													/>
													<span className="text-sm text-[#374151]">No</span>
												</label>
											</div>
										</div>

										{formData.pastDiagnosis === "Yes" && (
											<div className="space-y-4 pl-4 border-l-2 border-[#E5E7EB]">
												<div>
													<label className="block text-sm font-medium text-[#111827] mb-2">
														If "Yes", what was it?
													</label>
													<input
														type="text"
														value={formData.diagnosisDetail}
														onChange={(e) => setFormData({ ...formData, diagnosisDetail: e.target.value })}
														className="w-full px-4 py-2 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9AC63F]/20"
													/>
												</div>

												<div>
													<label className="block text-sm font-medium text-[#111827] mb-2">
														Was the client prescribed any medication for this diagnosis?
													</label>
													<div className="flex gap-4">
														<label className="flex items-center gap-2">
															<input
																type="radio"
																name="medicationPrescribed"
																value="Yes"
																checked={formData.medicationPrescribed === "Yes"}
																onChange={(e) => setFormData({ ...formData, medicationPrescribed: e.target.value })}
																className="text-[#9AC63F] focus:ring-[#9AC63F]"
															/>
															<span className="text-sm text-[#374151]">Yes</span>
														</label>
														<label className="flex items-center gap-2">
															<input
																type="radio"
																name="medicationPrescribed"
																value="No"
																checked={formData.medicationPrescribed === "No"}
																onChange={(e) => setFormData({ ...formData, medicationPrescribed: e.target.value })}
																className="text-[#9AC63F] focus:ring-[#9AC63F]"
															/>
															<span className="text-sm text-[#374151]">No</span>
														</label>
													</div>
												</div>

												{formData.medicationPrescribed === "Yes" && (
													<div>
														<label className="block text-sm font-medium text-[#111827] mb-2">
															If "yes" what kind?
														</label>
														<input
															type="text"
															value={formData.medicationKind}
															onChange={(e) => setFormData({ ...formData, medicationKind: e.target.value })}
															className="w-full px-4 py-2 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9AC63F]/20"
														/>
													</div>
												)}
											</div>
										)}

										{/* Enrolled in other agency */}
										<div className="pt-4 border-t border-[#E5E7EB] mt-4">
											<label className="block text-sm font-medium text-[#111827] mb-2">
												Has the client ever been enrolled in another agency/program?
											</label>
											<div className="flex gap-4">
												<label className="flex items-center gap-2">
													<input
														type="radio"
														name="enrolledInOtherAgency"
														value="Yes"
														checked={formData.enrolledInOtherAgency === "Yes"}
														onChange={(e) => setFormData({ ...formData, enrolledInOtherAgency: e.target.value })}
														className="text-[#9AC63F] focus:ring-[#9AC63F]"
													/>
													<span className="text-sm text-[#374151]">Yes</span>
												</label>
												<label className="flex items-center gap-2">
													<input
														type="radio"
														name="enrolledInOtherAgency"
														value="No"
														checked={formData.enrolledInOtherAgency === "No"}
														onChange={(e) => setFormData({ ...formData, enrolledInOtherAgency: e.target.value })}
														className="text-[#9AC63F] focus:ring-[#9AC63F]"
													/>
													<span className="text-sm text-[#374151]">No</span>
												</label>
											</div>
										</div>

										{formData.enrolledInOtherAgency === "Yes" && (
											<div className="mt-4">
												<label className="block text-sm font-medium text-[#111827] mb-2">
													If "yes" where?
												</label>
												<input
													type="text"
													value={formData.otherAgencyName}
													onChange={(e) => setFormData({ ...formData, otherAgencyName: e.target.value })}
													className="w-full px-4 py-2 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9AC63F]/20"
												/>
											</div>
										)}

										{/* Referral Source */}
										<div className="mt-4">
											<label className="block text-sm font-medium text-[#111827] mb-2">
												Referral Source
											</label>
											<input
												type="text"
												value={formData.referralSource}
												onChange={(e) => setFormData({ ...formData, referralSource: e.target.value })}
												className="w-full px-4 py-2 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9AC63F]/20"
											/>
										</div>

										{/* Assessment Appointment */}
										<div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
											<div>
												<label className="block text-sm font-medium text-[#111827] mb-2">
													Assessment Appointment Date:
												</label>
												<input
													type="date"
													value={formData.assessmentDate}
													onChange={(e) => setFormData({ ...formData, assessmentDate: e.target.value })}
													className="w-full px-4 py-2 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9AC63F]/20"
												/>
											</div>
											<div>
												<label className="block text-sm font-medium text-[#111827] mb-2">
													Assessment Appointment Time:
												</label>
												<input
													type="time"
													value={formData.assessmentTime}
													onChange={(e) => setFormData({ ...formData, assessmentTime: e.target.value })}
													className="w-full px-4 py-2 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9AC63F]/20"
												/>
											</div>
										</div>
									</div>
								</div>
							)}

							{/* Step 3: Emergency & Consent */}
							{currentStep === 3 && (
								<div className="space-y-8">
									{/* Rights & Consent */}
									<div className="space-y-6">
										<h2 className="text-xl font-bold text-[#111827] border-b pb-2">
											Authorization for Release of Information
										</h2>
                                        
                                        {/* Section A: Patient Information */}
                                        <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                                            <h3 className="text-sm font-semibold text-gray-900 mb-3 uppercase">Section A: Patient Information</h3>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-[#111827] mb-1">
                                                        Child Name
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={formData.childName}
                                                        onChange={(e) =>
                                                            setFormData({ ...formData, childName: e.target.value })
                                                        }
                                                        className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9AC63F]/20"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-[#111827] mb-1">
                                                        Date of Birth (Age)
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={formData.age} 
                                                        readOnly
                                                        className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg bg-gray-100"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Section B: Information to be Released */}
                                        <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                                            <h3 className="text-sm font-semibold text-gray-900 mb-3 uppercase">Section B: Information to be Released</h3>
                                            <div className="space-y-3">
                                                <label className="flex items-center gap-2">
                                                    <input
                                                        type="checkbox"
                                                        checked={formData.sectionB_allHealthInfo}
                                                        onChange={(e) =>
                                                            setFormData({ ...formData, sectionB_allHealthInfo: e.target.checked })
                                                        }
                                                        className="h-4 w-4 text-[#9AC63F] border-gray-300 rounded focus:ring-[#9AC63F]"
                                                    />
                                                    <span className="text-sm text-[#374151]">
                                                        All health information
                                                    </span>
                                                </label>
                                                <label className="flex items-center gap-2">
                                                    <input
                                                        type="checkbox"
                                                        checked={formData.sectionB_excludeHealthInfo}
                                                        onChange={(e) =>
                                                            setFormData({ ...formData, sectionB_excludeHealthInfo: e.target.checked })
                                                        }
                                                        className="h-4 w-4 text-[#9AC63F] border-gray-300 rounded focus:ring-[#9AC63F]"
                                                    />
                                                    <span className="text-sm text-[#374151]">
                                                        Exclude the following information:
                                                    </span>
                                                </label>
                                                {formData.sectionB_excludeHealthInfo && (
                                                    <textarea
                                                        value={formData.sectionB_excludeText}
                                                        onChange={(e) => setFormData({ ...formData, sectionB_excludeText: e.target.value })}
                                                        className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9AC63F]/20"
                                                        rows={3}
                                                        placeholder="Enter excluded information..."
                                                    />
                                                )}
                                            </div>
                                        </div>

                                        {/* Section C: Purpose of Request */}
                                        <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                                            <h3 className="text-sm font-semibold text-gray-900 mb-3 uppercase">Section C: Purpose of Request</h3>
                                            <div>
                                                <label className="block text-sm font-medium text-[#111827] mb-1">
                                                    Purpose
                                                </label>
                                                <input
                                                    type="text"
                                                    value={formData.purposeOfRelease}
                                                    onChange={(e) =>
                                                        setFormData({ ...formData, purposeOfRelease: e.target.value })
                                                    }
                                                    placeholder="e.g. Assessment, Treatment Planning, etc."
                                                    className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9AC63F]/20"
                                                />
                                            </div>
                                        </div>
                                        
                                        {/* Section D: Expiration */}
                                        <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                                            <h3 className="text-sm font-semibold text-gray-900 mb-3 uppercase">Section D: Expiration</h3>
                                            <div>
                                                <label className="block text-sm font-medium text-[#111827] mb-1">
                                                    Expiration Date
                                                </label>
                                                <input
                                                    type="date"
                                                    value={formData.expirationDate}
                                                    onChange={(e) =>
                                                        setFormData({ ...formData, expirationDate: e.target.value })
                                                    }
                                                    className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9AC63F]/20"
                                                />
                                            </div>
                                        </div>

                                        {/* Authorization Details */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-[#111827] mb-1">
                                                    I authorize (Agency Name)
                                                </label>
                                                <input
                                                    type="text"
                                                    value={formData.authorizingAgency}
                                                    onChange={(e) =>
                                                        setFormData({ ...formData, authorizingAgency: e.target.value })
                                                    }
                                                    placeholder="Name of Agency releasing info"
                                                    className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9AC63F]/20"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-[#111827] mb-1">
                                                    To release information to (Recipient)
                                                </label>
                                                <input
                                                    type="text"
                                                    value={formData.recipientName}
                                                    onChange={(e) =>
                                                        setFormData({ ...formData, recipientName: e.target.value })
                                                    }
                                                    placeholder="Name of person/agency receiving info"
                                                    className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9AC63F]/20"
                                                />
                                            </div>
                                        </div>
									</div>

									{/* Primary Care Physician */}
									<div className="space-y-4">
										<h2 className="text-xl font-bold text-[#111827] border-b pb-2">
											Primary Care Physician (PCP) Information
										</h2>
										<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
											<div>
												<label className="block text-sm font-medium text-[#111827] mb-1">
													Doctor Name/Clinic
												</label>
												<input
													type="text"
													value={formData.doctorNameClinic}
													onChange={(e) =>
														setFormData({ ...formData, doctorNameClinic: e.target.value })
													}
													className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9AC63F]/20"
												/>
											</div>
											<div>
												<label className="block text-sm font-medium text-[#111827] mb-1">
													Phone
												</label>
												<input
													type="tel"
													value={formData.doctorPhone}
													onChange={(e) =>
														setFormData({ ...formData, doctorPhone: e.target.value })
													}
													className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9AC63F]/20"
												/>
											</div>
                                            <div>
												<label className="block text-sm font-medium text-[#111827] mb-1">
													Address
												</label>
												<input
													type="text"
													value={formData.pcpAddress}
													onChange={(e) =>
														setFormData({ ...formData, pcpAddress: e.target.value })
													}
													className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9AC63F]/20"
												/>
											</div>
                                            <div>
												<label className="block text-sm font-medium text-[#111827] mb-1">
													Fax
												</label>
												<input
													type="text"
													value={formData.pcpFax}
													onChange={(e) =>
														setFormData({ ...formData, pcpFax: e.target.value })
													}
													className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9AC63F]/20"
												/>
											</div>
										</div>
									</div>
                                    
                                    {/* Emergency Contact */}
                                    <div className="space-y-4">
                                        <h2 className="text-xl font-bold text-[#111827] border-b pb-2">
                                            Emergency Contact
                                        </h2>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-[#111827] mb-1">
                                                    Name
                                                </label>
                                                <input
                                                    type="text"
                                                    value={formData.emergencyContactName}
                                                    onChange={(e) =>
                                                        setFormData({ ...formData, emergencyContactName: e.target.value })
                                                    }
                                                    className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9AC63F]/20"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-[#111827] mb-1">
                                                    Relationship
                                                </label>
                                                <input
                                                    type="text"
                                                    value={formData.emergencyContactRelationship}
                                                    onChange={(e) =>
                                                        setFormData({ ...formData, emergencyContactRelationship: e.target.value })
                                                    }
                                                    className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9AC63F]/20"
                                                />
                                            </div>
                                            <div className="md:col-span-2">
                                                <label className="block text-sm font-medium text-[#111827] mb-1">
                                                    Address
                                                </label>
                                                <input
                                                    type="text"
                                                    value={formData.emergencyContactAddress}
                                                    onChange={(e) =>
                                                        setFormData({ ...formData, emergencyContactAddress: e.target.value })
                                                    }
                                                    className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9AC63F]/20"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-[#111827] mb-1">
                                                    Phone
                                                </label>
                                                <input
                                                    type="tel"
                                                    value={formData.emergencyContactPhone}
                                                    onChange={(e) =>
                                                        setFormData({ ...formData, emergencyContactPhone: e.target.value })
                                                    }
                                                    className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9AC63F]/20"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-[#111827] mb-1">
                                                    Phone (Alt)
                                                </label>
                                                <input
                                                    type="tel"
                                                    value={formData.emergencyContactPhoneAlt}
                                                    onChange={(e) =>
                                                        setFormData({ ...formData, emergencyContactPhoneAlt: e.target.value })
                                                    }
                                                    className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9AC63F]/20"
                                                />
                                            </div>
                                        </div>
                                    </div>

									{/* Emergency Preparedness Questionnaire */}
									<div className="space-y-4">
										<h2 className="text-xl font-bold text-[#111827] border-b pb-2">
											Emergency Preparedness Questionnaire
										</h2>
                                        <p className="text-sm text-gray-600">
                                            Please provide us with your updated emergency contact information and contact information of your evacuation destination.
                                        </p>
										<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
											<div className="md:col-span-2">
												<label className="block text-sm font-medium text-[#111827] mb-1">
													Do you have somewhere to evacuate?
												</label>
                                                <select
                                                    value={formData.evacuationPlace}
                                                    onChange={(e) =>
                                                        setFormData({ ...formData, evacuationPlace: e.target.value })
                                                    }
                                                    className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9AC63F]/20"
                                                >
                                                    <option value="No">No</option>
                                                    <option value="Yes">Yes</option>
                                                </select>
											</div>
											<div className="md:col-span-2">
												<label className="block text-sm font-medium text-[#111827] mb-1">
													Do you plan to evacuate?
												</label>
                                                <select
                                                    value={formData.planToEvacuate}
                                                    onChange={(e) =>
                                                        setFormData({ ...formData, planToEvacuate: e.target.value })
                                                    }
                                                    className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9AC63F]/20"
                                                >
                                                    <option value="No">No</option>
                                                    <option value="Yes">Yes</option>
                                                </select>
											</div>
                                            {formData.planToEvacuate === "Yes" && (
                                                <div className="md:col-span-2">
                                                    <label className="block text-sm font-medium text-[#111827] mb-1">
                                                        If so, when?
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={formData.whenEvacuate}
                                                        onChange={(e) =>
                                                            setFormData({ ...formData, whenEvacuate: e.target.value })
                                                        }
                                                        className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9AC63F]/20"
                                                    />
                                                </div>
                                            )}
                                            <div className="md:col-span-2">
                                                <label className="block text-sm font-medium text-[#111827] mb-1">
                                                    Do you plan to return?
                                                </label>
                                                <select
                                                    value={formData.planToReturn}
                                                    onChange={(e) =>
                                                        setFormData({ ...formData, planToReturn: e.target.value })
                                                    }
                                                    className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9AC63F]/20"
                                                >
                                                    <option value="No">No</option>
                                                    <option value="Yes">Yes</option>
                                                </select>
                                            </div>
                                            <div className="md:col-span-2">
                                                <label className="block text-sm font-medium text-[#111827] mb-1">
                                                    Who will evacuate with you?
                                                </label>
                                                <input
                                                    type="text"
                                                    value={formData.whoWillEvacuateWithYou}
                                                    onChange={(e) =>
                                                        setFormData({ ...formData, whoWillEvacuateWithYou: e.target.value })
                                                    }
                                                    className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9AC63F]/20"
                                                />
                                            </div>
                                            <div className="md:col-span-2">
                                                <label className="block text-sm font-medium text-[#111827] mb-1">
                                                    Do you have the necessities to evacuate?
                                                </label>
                                                <select
                                                    value={formData.haveNecessitiesToEvacuate}
                                                    onChange={(e) =>
                                                        setFormData({ ...formData, haveNecessitiesToEvacuate: e.target.value })
                                                    }
                                                    className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9AC63F]/20"
                                                >
                                                    <option value="No">No</option>
                                                    <option value="Yes">Yes</option>
                                                </select>
                                            </div>
                                            <div className="md:col-span-2">
                                                <label className="block text-sm font-medium text-[#111827] mb-1">
                                                    Do you currently own a cell phone?
                                                </label>
                                                <select
                                                    value={formData.ownCellPhone}
                                                    onChange={(e) =>
                                                        setFormData({ ...formData, ownCellPhone: e.target.value })
                                                    }
                                                    className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9AC63F]/20"
                                                >
                                                    <option value="No">No</option>
                                                    <option value="Yes">Yes</option>
                                                </select>
                                            </div>
                                            {formData.ownCellPhone === "No" && (
                                                <div className="md:col-span-2">
                                                    <label className="block text-sm font-medium text-[#111827] mb-1">
                                                        If not, whom can we contact to immediately reach you?
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={formData.alternativeContactName}
                                                        onChange={(e) =>
                                                            setFormData({ ...formData, alternativeContactName: e.target.value })
                                                        }
                                                        className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9AC63F]/20"
                                                    />
                                                </div>
                                            )}
											<div className="md:col-span-2">
												<label className="block text-sm font-medium text-[#111827] mb-1">
													What is the best way to contact you? Phone, Text, Email, All Three
												</label>
                                                <input
                                                    type="text"
                                                    value={formData.bestContactMethod}
                                                    onChange={(e) =>
                                                        setFormData({ ...formData, bestContactMethod: e.target.value })
                                                    }
                                                    className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9AC63F]/20"
                                                />
											</div>
                                            <div className="md:col-span-2">
                                                <label className="block text-sm font-medium text-[#111827] mb-1">
                                                    Any additional comments/information:
                                                </label>
                                                <input
                                                    type="text"
                                                    value={formData.additionalComments}
                                                    onChange={(e) =>
                                                        setFormData({ ...formData, additionalComments: e.target.value })
                                                    }
                                                    className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9AC63F]/20"
                                                />
                                            </div>
										</div>
									</div>

                                    {/* Grievance Acknowledgement */}
                                    <div className="space-y-4">
                                        <h2 className="text-xl font-bold text-[#111827] border-b pb-2 uppercase">
                                            GRIEVANCE ACKNOWLEDGEMENT
                                        </h2>
                                        <p className="text-sm text-gray-700">
                                            When clients of Louisiana Excel Care have a grievance concerning the rehabilitation services that they are receiving, they may request in writing a meeting with the Clinical Manager.
                                        </p>
                                        <p className="text-sm text-gray-700 font-medium">
                                            By signing below, I acknowledge I am aware and understand Louisiana Excel Care Grievance Policy
                                        </p>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-[#111827] mb-1">
                                                    Parent/Guardian (Initial) <span className="text-red-500">*</span>
                                                </label>
                                                <input
                                                    type="text"
                                                    value={formData.grievanceParentInitial}
                                                    onChange={(e) =>
                                                        setFormData({ ...formData, grievanceParentInitial: e.target.value })
                                                    }
                                                    className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9AC63F]/20"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-[#111827] mb-1">
                                                    Client Name <span className="text-red-500">*</span>
                                                </label>
                                                <input
                                                    type="text"
                                                    value={formData.grievanceClientName}
                                                    onChange={(e) =>
                                                        setFormData({ ...formData, grievanceClientName: e.target.value })
                                                    }
                                                    className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9AC63F]/20"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Authorization for Outpatient Treatment */}
                                    <div className="space-y-4 pt-8 border-t border-[#E5E7EB]">
                                        <h2 className="text-xl font-bold text-[#111827] border-b pb-2">
                                            Authorization for Outpatient Treatment
                                        </h2>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-[#111827] mb-1">
                                                    Client Name
                                                </label>
                                                <input
                                                    type="text"
                                                    value={formData.authTreatment_clientName}
                                                    onChange={(e) =>
                                                        setFormData({ ...formData, authTreatment_clientName: e.target.value })
                                                    }
                                                    className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9AC63F]/20"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-[#111827] mb-1">
                                                    Date
                                                </label>
                                                <input
                                                    type="date"
                                                    value={formData.authTreatment_date}
                                                    onChange={(e) =>
                                                        setFormData({ ...formData, authTreatment_date: e.target.value })
                                                    }
                                                    className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9AC63F]/20"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-[#111827] mb-2">
                                                The services provided are as follows:
                                            </label>
                                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                                {['Assessment', 'Group', 'Education', 'Family', 'Psychiatric', 'Other'].map((service) => (
                                                    <label key={service} className="flex items-center gap-2">
                                                        <input
                                                            type="checkbox"
                                                            checked={formData[`authTreatment_services_${service.toLowerCase()}` as keyof typeof formData] as boolean}
                                                            onChange={(e) => setFormData({...formData, [`authTreatment_services_${service.toLowerCase()}`]: e.target.checked})}
                                                            className="w-4 h-4 text-[#9AC63F] border-[#E5E7EB] rounded focus:ring-[#9AC63F]/20"
                                                        />
                                                        <span className="text-sm text-[#4B5563]">
                                                            {service === 'Group' ? 'Group Counseling' : 
                                                             service === 'Family' ? 'Family Counseling' : 
                                                             service === 'Psychiatric' ? 'Psychiatric Evaluation' : service}
                                                        </span>
                                                    </label>
                                                ))}
                                            </div>
                                            {formData.authTreatment_services_other && (
                                                <div className="mt-2">
                                                    <input
                                                        type="text"
                                                        placeholder="Please specify"
                                                        value={formData.authTreatment_services_otherText}
                                                        onChange={(e) => setFormData({...formData, authTreatment_services_otherText: e.target.value})}
                                                        className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9AC63F]/20"
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Acknowledgement Receipt */}
                                    <div className="space-y-4 pt-8 border-t border-[#E5E7EB]">
                                        <h2 className="text-xl font-bold text-[#111827] border-b pb-2">
                                            Acknowledgement Receipt
                                        </h2>
                                        
                                        <div className="space-y-4">
                                            <h3 className="text-lg font-semibold text-[#111827]">Notice of Right to Appeal Determinations</h3>
                                            <div>
                                                <label className="block text-sm font-medium text-[#111827] mb-1">
                                                    Client's Initial
                                                </label>
                                                <input
                                                    type="text"
                                                    maxLength={4}
                                                    value={formData.appealRights_clientInitial}
                                                    onChange={(e) =>
                                                        setFormData({ ...formData, appealRights_clientInitial: e.target.value })
                                                    }
                                                    className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9AC63F]/20"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <h3 className="text-lg font-semibold text-[#111827]">Second Party Involvement Authorization</h3>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-[#111827] mb-1">
                                                        Client Name
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={formData.secondParty_clientName}
                                                        onChange={(e) =>
                                                            setFormData({ ...formData, secondParty_clientName: e.target.value })
                                                        }
                                                        className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9AC63F]/20"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-[#111827] mb-1">
                                                        Initial of recipient or Legal Guardian
                                                    </label>
                                                    <input
                                                        type="text"
                                                        maxLength={4}
                                                        value={formData.secondParty_initial}
                                                        onChange={(e) =>
                                                            setFormData({ ...formData, secondParty_initial: e.target.value })
                                                        }
                                                        className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9AC63F]/20"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-[#111827] mb-1">
                                                        Date
                                                    </label>
                                                    <input
                                                        type="date"
                                                        value={formData.secondParty_date}
                                                        onChange={(e) =>
                                                            setFormData({ ...formData, secondParty_date: e.target.value })
                                                        }
                                                        className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9AC63F]/20"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Client Abuse and/or Neglect */}
                                    <div className="space-y-4 pt-8 border-t border-[#E5E7EB]">
                                        <h2 className="text-xl font-bold text-[#111827] border-b pb-2">
                                            Client Abuse and/or Neglect
                                        </h2>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-[#111827] mb-1">
                                                    Client Name
                                                </label>
                                                <input
                                                    type="text"
                                                    value={formData.abuseNeglect_clientName}
                                                    onChange={(e) =>
                                                        setFormData({ ...formData, abuseNeglect_clientName: e.target.value })
                                                    }
                                                    className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9AC63F]/20"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-[#111827] mb-1">
                                                    Date
                                                </label>
                                                <input
                                                    type="date"
                                                    value={formData.abuseNeglect_date}
                                                    onChange={(e) =>
                                                        setFormData({ ...formData, abuseNeglect_date: e.target.value })
                                                    }
                                                    className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9AC63F]/20"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Crisis Response Plan Acknowledgement */}
                                    <div className="space-y-4 pt-8 border-t border-[#E5E7EB]">
                                        <h2 className="text-xl font-bold text-[#111827] border-b pb-2 uppercase">
                                            Crisis Response Plan Acknowledgement
                                        </h2>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-[#111827] mb-1">
                                                    Parent/Legal Guardian Name
                                                </label>
                                                <input
                                                    type="text"
                                                    value={formData.crisisPlan_guardianName}
                                                    onChange={(e) =>
                                                        setFormData({ ...formData, crisisPlan_guardianName: e.target.value })
                                                    }
                                                    className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9AC63F]/20"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-[#111827] mb-1">
                                                    Date
                                                </label>
                                                <input
                                                    type="date"
                                                    value={formData.crisisPlan_date}
                                                    onChange={(e) =>
                                                        setFormData({ ...formData, crisisPlan_date: e.target.value })
                                                    }
                                                    className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9AC63F]/20"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* 24-Hour Crisis Response Hospitalization Plan */}
                                    <div className="space-y-4 pt-8 border-t border-[#E5E7EB]">
                                        <h2 className="text-xl font-bold text-[#111827] border-b pb-2 uppercase">
                                            24-Hour Crisis Response Hospitalization Plan
                                        </h2>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-[#111827] mb-1">
                                                    Recipient Initial
                                                </label>
                                                <input
                                                    type="text"
                                                    maxLength={4}
                                                    value={formData.hospitalizationPlan_initial}
                                                    onChange={(e) =>
                                                        setFormData({ ...formData, hospitalizationPlan_initial: e.target.value })
                                                    }
                                                    className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9AC63F]/20"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-[#111827] mb-1">
                                                    Date
                                                </label>
                                                <input
                                                    type="date"
                                                    value={formData.hospitalizationPlan_date}
                                                    onChange={(e) =>
                                                        setFormData({ ...formData, hospitalizationPlan_date: e.target.value })
                                                    }
                                                    className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9AC63F]/20"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* 24 Hours On Call Policy */}
                                    <div className="space-y-4 pt-8 border-t border-[#E5E7EB]">
                                        <h2 className="text-xl font-bold text-[#111827] border-b pb-2">
                                            24 Hours On Call Policy
                                        </h2>
                                        <p className="text-sm text-gray-700">
                                            Phone (225) 301-0219 - I acknowledge that I have read and received a copy of LA Excel Care's 24 hours On Call Policy.
                                        </p>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-[#111827] mb-1">
                                                    Initial of Recipient or Legal Guardian
                                                </label>
                                                <input
                                                    type="text"
                                                    maxLength={4}
                                                    value={formData.onCallPolicy_initial}
                                                    onChange={(e) =>
                                                        setFormData({ ...formData, onCallPolicy_initial: e.target.value })
                                                    }
                                                    className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9AC63F]/20"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-[#111827] mb-1">
                                                    Print Name
                                                </label>
                                                <input
                                                    type="text"
                                                    value={formData.onCallPolicy_printName}
                                                    onChange={(e) =>
                                                        setFormData({ ...formData, onCallPolicy_printName: e.target.value })
                                                    }
                                                    className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9AC63F]/20"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-[#111827] mb-1">
                                                    Date
                                                </label>
                                                <input
                                                    type="date"
                                                    value={formData.onCallPolicy_date}
                                                    onChange={(e) =>
                                                        setFormData({ ...formData, onCallPolicy_date: e.target.value })
                                                    }
                                                    className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9AC63F]/20"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Healthy Louisiana Member Choice */}
                                    <div className="space-y-4 pt-8 border-t border-[#E5E7EB]">
                                        <h2 className="text-xl font-bold text-[#111827] border-b pb-2">
                                            Healthy Louisiana Mental Health Rehabilitation Member Choice Form
                                        </h2>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-[#111827] mb-1">
                                                    Provider Name
                                                </label>
                                                <input
                                                    type="text"
                                                    value={formData.choiceForm_providerName}
                                                    onChange={(e) =>
                                                        setFormData({ ...formData, choiceForm_providerName: e.target.value })
                                                    }
                                                    className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9AC63F]/20"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-[#111827] mb-1">
                                                    Provider Phone Number
                                                </label>
                                                <input
                                                    type="text"
                                                    value={formData.choiceForm_providerPhone}
                                                    onChange={(e) =>
                                                        setFormData({ ...formData, choiceForm_providerPhone: e.target.value })
                                                    }
                                                    className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9AC63F]/20"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-[#111827] mb-1">
                                                    Provider Contact Name
                                                </label>
                                                <input
                                                    type="text"
                                                    value={formData.choiceForm_contactName}
                                                    onChange={(e) =>
                                                        setFormData({ ...formData, choiceForm_contactName: e.target.value })
                                                    }
                                                    className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9AC63F]/20"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-[#111827] mb-1">
                                                    Provider NPI/TIN
                                                </label>
                                                <input
                                                    type="text"
                                                    value={formData.choiceForm_npi}
                                                    onChange={(e) =>
                                                        setFormData({ ...formData, choiceForm_npi: e.target.value })
                                                    }
                                                    className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9AC63F]/20"
                                                />
                                            </div>
                                            <div className="md:col-span-2">
                                                <label className="block text-sm font-medium text-[#111827] mb-1">
                                                    Member/Legal Guardian Signature (type name)
                                                </label>
                                                <input
                                                    type="text"
                                                    value={formData.choiceForm_signature}
                                                    onChange={(e) =>
                                                        setFormData({ ...formData, choiceForm_signature: e.target.value })
                                                    }
                                                    className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9AC63F]/20"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-[#111827] mb-1">
                                                    Date
                                                </label>
                                                <input
                                                    type="date"
                                                    value={formData.choiceForm_date}
                                                    onChange={(e) =>
                                                        setFormData({ ...formData, choiceForm_date: e.target.value })
                                                    }
                                                    className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9AC63F]/20"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-[#111827] mb-1">
                                                    Initial of Legal Guardian (if applicable)
                                                </label>
                                                <input
                                                    type="text"
                                                    maxLength={4}
                                                    value={formData.choiceForm_guardianInitial}
                                                    onChange={(e) =>
                                                        setFormData({ ...formData, choiceForm_guardianInitial: e.target.value })
                                                    }
                                                    className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9AC63F]/20"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Orientation Acknowledgement */}
                                    <div className="space-y-4 pt-8 border-t border-[#E5E7EB]">
                                        <h2 className="text-xl font-bold text-[#111827] border-b pb-2 uppercase">
                                            Orientation Acknowledgement
                                        </h2>
                                        <p className="text-sm text-gray-700 font-medium">
                                            I certify that I have explained all Louisiana Excel Care Policies and Procedures, Rights and Responsibilities to the client
                                        </p>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-[#111827] mb-1">
                                                    Initial <span className="text-red-500">*</span>
                                                </label>
                                                <input
                                                    type="text"
                                                    value={formData.orientationInitial}
                                                    onChange={(e) =>
                                                        setFormData({ ...formData, orientationInitial: e.target.value })
                                                    }
                                                    className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9AC63F]/20"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-[#111827] mb-1">
                                                    Recipient's Name <span className="text-red-500">*</span>
                                                </label>
                                                <input
                                                    type="text"
                                                    value={formData.orientationRecipientName}
                                                    onChange={(e) =>
                                                        setFormData({ ...formData, orientationRecipientName: e.target.value })
                                                    }
                                                    className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9AC63F]/20"
                                                />
                                            </div>
                                        </div>
                                        <div className="mt-4 pt-4 border-t border-gray-200">
                                            <div className="flex flex-col md:flex-row gap-4 items-end">
                                                 <div className="flex-1 border-b border-gray-400 pb-1">
                                                    <span className="text-sm text-gray-600 block mb-2">Staff Signature</span>
                                                </div>
                                                <div className="w-48 border-b border-gray-400 pb-1">
                                                    <span className="text-sm text-gray-600 block mb-2">Date: ________________</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* After Hours & Weekend Policy */}
                                    <div className="space-y-4 pt-8 border-t border-[#E5E7EB]">
                                        <h2 className="text-xl font-bold text-[#111827] border-b pb-2 uppercase">
                                            AFTER HOURS & WEEKEND ON-CALL COVERAGE POLICY
                                        </h2>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-[#111827] mb-1">
                                                    Initial Below
                                                </label>
                                                <input
                                                    type="text"
                                                    maxLength={4}
                                                    value={formData.weekendPolicy_initial}
                                                    onChange={(e) =>
                                                        setFormData({ ...formData, weekendPolicy_initial: e.target.value })
                                                    }
                                                    className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9AC63F]/20"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-[#111827] mb-1">
                                                    Date
                                                </label>
                                                <input
                                                    type="date"
                                                    value={formData.weekendPolicy_date}
                                                    onChange={(e) =>
                                                        setFormData({ ...formData, weekendPolicy_date: e.target.value })
                                                    }
                                                    className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9AC63F]/20"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-[#111827] mb-1">
                                                    Signature (Legal Guardian - type name)
                                                </label>
                                                <input
                                                    type="text"
                                                    value={formData.weekendPolicy_signature}
                                                    onChange={(e) =>
                                                        setFormData({ ...formData, weekendPolicy_signature: e.target.value })
                                                    }
                                                    className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9AC63F]/20"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-[#111827] mb-1">
                                                    Date
                                                </label>
                                                <input
                                                    type="date"
                                                    value={formData.weekendPolicy_signatureDate}
                                                    onChange={(e) =>
                                                        setFormData({ ...formData, weekendPolicy_signatureDate: e.target.value })
                                                    }
                                                    className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9AC63F]/20"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-[#111827] mb-1">
                                                    Print Name
                                                </label>
                                                <input
                                                    type="text"
                                                    value={formData.weekendPolicy_printName}
                                                    onChange={(e) =>
                                                        setFormData({ ...formData, weekendPolicy_printName: e.target.value })
                                                    }
                                                    className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9AC63F]/20"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    
                                    {/* Signatures */}
                                    <div className="space-y-4">
                                        <h2 className="text-xl font-bold text-[#111827] border-b pb-2">
                                            Signatures
                                        </h2>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-[#111827] mb-1">
                                                    Parent/Guardian Name
                                                </label>
                                                <input
                                                    type="text"
                                                    value={formData.parentGuardianName}
                                                    onChange={(e) =>
                                                        setFormData({ ...formData, parentGuardianName: e.target.value })
                                                    }
                                                    className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9AC63F]/20"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-[#111827] mb-1">
                                                    Relationship to Patient
                                                </label>
                                                <input
                                                    type="text"
                                                    value={formData.relationship}
                                                    onChange={(e) =>
                                                        setFormData({ ...formData, relationship: e.target.value })
                                                    }
                                                    className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9AC63F]/20"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-[#111827] mb-1">
                                                    Address
                                                </label>
                                                <input
                                                    type="text"
                                                    value={formData.parentAddress}
                                                    onChange={(e) =>
                                                        setFormData({ ...formData, parentAddress: e.target.value })
                                                    }
                                                    className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9AC63F]/20"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-[#111827] mb-1">
                                                    Date
                                                </label>
                                                <input
                                                    type="date"
                                                    value={formData.assessmentDate}
                                                    onChange={(e) =>
                                                        setFormData({ ...formData, assessmentDate: e.target.value })
                                                    }
                                                    className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9AC63F]/20"
                                                />
                                            </div>
                                             <div>
                                                <label className="block text-sm font-medium text-[#111827] mb-1">
                                                    Home Phone
                                                </label>
                                                <input
                                                    type="tel"
                                                    value={formData.parentHomePhone}
                                                    onChange={(e) =>
                                                        setFormData({ ...formData, parentHomePhone: e.target.value })
                                                    }
                                                    className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9AC63F]/20"
                                                />
                                            </div>
                                             <div>
                                                <label className="block text-sm font-medium text-[#111827] mb-1">
                                                    Alternate Phone
                                                </label>
                                                <input
                                                    type="tel"
                                                    value={formData.parentAltPhone}
                                                    onChange={(e) =>
                                                        setFormData({ ...formData, parentAltPhone: e.target.value })
                                                    }
                                                    className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9AC63F]/20"
                                                />
                                            </div>
                                        </div>
                                    </div>
								</div>
							)}

							{/* Step 4: Upload Document */}
							{currentStep === 4 && (
								<div className="space-y-6">
									<h2 className="text-2xl font-bold text-[#111827] mb-6">
										Upload Your Document
									</h2>

									<div
										onDragOver={handleDragOver}
										onDrop={handleDrop}
										onClick={() => document.getElementById('patientAssessmentDocInput')?.click()}
										className="border-2 border-dashed border-[#E5E7EB] rounded-xl p-12 text-center bg-[#F9FAFB] cursor-pointer hover:border-[#9AC63F] transition-colors"
									>
										{documentPreview ? (
											<div className="space-y-4">
												<div className="flex justify-center">
													<Image
														src={documentPreview}
														alt=""
														width={100}
														height={100}
														unoptimized
														className="rounded-lg object-cover"
													/>
												</div>
												<p className="text-sm text-[#6B7280]">
													{documentFile?.name}
												</p>
												<button
													onClick={(e) => {
														e.stopPropagation();
														setDocumentFile(null);
														setDocumentPreview(null);
													}}
													className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
												>
													Remove
												</button>
											</div>
										) : (
											<div className="space-y-4">
												<div className="flex justify-center">
													<div className="w-24 h-24 bg-[#E5E7EB] rounded-lg flex items-center justify-center">
														<Upload className="h-12 w-12 text-[#9CA3AF]" />
													</div>
												</div>
												<p className="text-sm font-medium text-[#111827]">
													Drag and drop your document here
												</p>
												<p className="text-sm text-[#6B7280]">
													or click to browse from your device
												</p>
												<label className="inline-block" onClick={(e) => e.stopPropagation()}>
													<span className="px-6 py-2 bg-[#9AC63F] text-white rounded-lg cursor-pointer hover:bg-[#85af34] transition-colors">
														Choose File
													</span>
													<input
														id="patientAssessmentDocInput"
														type="file"
														accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
														onChange={handleDocumentChange}
														className="hidden"
													/>
												</label>
												<p className="text-xs text-[#6B7280]">
													Supported file types: PDF, DOC, JPG, PNG
												</p>
											</div>
										)}
									</div>
								</div>
							)}

							{/* Step 5: Assign a Doctor */}
							{currentStep === 5 && (
								<div className="space-y-6">
									<div className="flex items-center justify-end">
										<div className="relative w-full max-w-md">
											<Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-8 text-[#9CA3AF]" />
											<input
												type="text"
												placeholder="Search doctors"
												className="w-full pl-12 pr-4 py-2.5 rounded-xl bg-[#F9FAFB] border border-[#E5E7EB] text-sm focus:outline-none focus:ring-2 focus:ring-[#9AC63F]/20"
												value={docSearchTerm}
												onChange={(e) => setDocSearchTerm(e.target.value)}
											/>
										</div>
									</div>
									<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
										{filteredDoctors.map((doc: any) => (
											<button
												key={doc._id}
												onClick={() => setSelectedDoctorId(doc._id)}
												className={`relative bg-[#FFFFFF] rounded-2xl p-6 shadow-sm border transition-colors ${selectedDoctorId === doc._id
													? "border-[#9AC63F]"
													: "border-[#E5E7EB] hover:border-[#9AC63F]"
													}`}
											>
												<div className="flex flex-col items-center text-center">
													<div className="relative h-20 w-20 rounded-2xl overflow-hidden mb-4">
														<img
															src={getDoctorAvatar(doc) || "/images/avatar.PNG"}
															alt={doc.displayName}
															className="w-full h-full object-cover"
															onError={(e) => {
																(e.currentTarget as HTMLImageElement).src = "/images/avatar.PNG";
															}}
														/>
													</div>
													<p className="text-lg font-bold text-[#111827]">
														{doc.displayName}
													</p>
													<p className="text-sm text-[#6B7280]">
														{doc?.specialization}
													</p>
													<div className="absolute top-4 right-4">
														<span
															className={`flex h-6 w-6 items-center justify-center rounded-lg border ${selectedDoctorId === doc._id
																? "bg-[#F97316] border-[#F97316]"
																: "bg-[#F3F4F6] border-[#E5E7EB]"
																}`}
														>
															{selectedDoctorId === doc._id && (
																<Check className="h-4 w-4 text-white" />
															)}
														</span>
													</div>
												</div>
												<div className="pt-4 mt-4 border-t border-[#E5E7EB]">
													<div className="flex items-center justify-center">
														<div className="min-w-[140px] text-center">
															<p className="text-sm font-semibold text-[#111827]">
																{String(doc.yearsExperience).padStart(2, "0")}{" "}
																Years
															</p>
															<p className="text-xs text-[#6B7280]">
																Experience
															</p>
														</div>
														<div className="mx-6 h-6 w-px bg-[#E5E7EB]" />
													</div>
												</div>
											</button>
										))}
									</div>
									<div className="flex items-center justify-between mt-4">
										<span className="text-sm text-[#6B7280]">
											{Math.min((docCurrentPage - 1) * docPageSize + 1, docTotalItems)}-
											{Math.min(docCurrentPage * docPageSize, docTotalItems)} of {docTotalItems}
										</span>
										<div className="flex items-center gap-3">
											<button
												className="p-2 rounded-lg border border-[#E5E7EB] hover:bg-[#F9FAFB] disabled:opacity-50"
												disabled={docCurrentPage === 1}
												onClick={() => setDocCurrentPage((p) => Math.max(1, p - 1))}
											>
												<ChevronLeft className="h-4 w-4 text-[#6B7280]" />
											</button>
											<button
												className="p-2 rounded-lg border border-[#E5E7EB] hover:bg-[#F9FAFB] disabled:opacity-50"
												disabled={docCurrentPage >= docTotalPages}
												onClick={() => setDocCurrentPage((p) => Math.min(docTotalPages, p + 1))}
											>
												<ChevronRight className="h-4 w-4 text-[#6B7280]" />
											</button>
										</div>
									</div>
								</div>
							)}

							{/* Step 5: Schedule Tentative Appointment */}
							{currentStep === 5 && (
								<div className="space-y-6">
									{/* Selected Doctor Header */}
									{(() => {
										const doc: any = (doctors as any)?.doctors?.find(
											(d: any) => String(d?._id) === String(selectedDoctorId)
										);
										if (!doc) return null;
										return (
											<div className="flex items-center justify-between bg-white border border-[#E5E7EB] rounded-2xl p-6 shadow-sm">
												<div className="flex items-center gap-5">
													<div className="relative h-14 w-14 rounded-xl overflow-hidden">
														<img
															src={getDoctorAvatar(doc) || "/images/avatar.PNG"}
															alt={doc.displayName || doc.name}
															className="w-full h-full object-cover"
															onError={(e) => {
																(e.currentTarget as HTMLImageElement).src = "/images/avatar.PNG";
															}}
														/>
													</div>
													<div>
														<p className="text-lg font-bold text-[#111827]">
															{doc.displayName || doc.name}
														</p>
														<p className="text-sm text-[#6B7280]">
															{doc.specialization || doc.title}
														</p>
													</div>
												</div>
												<div className="flex items-center gap-6">
													<div className="text-right">
														<p className="text-sm font-semibold text-[#111827]">
															{String(
																doc.yearsExperience ?? doc.years ?? 0
															).padStart(2, "0")}{" "}
															Years
														</p>
														<p className="text-xs text-[#6B7280]">Experience</p>
													</div>
												</div>
											</div>
										);
									})()}

									{/* Scheduler */}
									<div className="bg-white rounded-3xl p-6 shadow-sm border border-[#E5E7EB]">
										<h3 className="text-xl font-bold text-[#111827] mb-4">
											Schedule A Tentative Appointment
										</h3>

										{/* Date rail */}
										<div className="flex items-center justify-between mb-6">
											<button
												onClick={() => {
													if (activeDateIndex > 0) {
														setActiveDateIndex(activeDateIndex - 1);
													} else {
														setDateStartOffset(
															Math.max(0, dateStartOffset - 1)
														);
													}
													setSelectedTime(null);
													setHasPickedDate(true);
												}}
												className="h-9 w-9 bg-[#F3F4F6] rounded-full flex items-center justify-center hover:bg-[#E5E7EB]"
											>
												<ChevronLeft className="h-5 w-8 text-[#6B7280]" />
											</button>
											<div className="flex items-center gap-8">
												{Array.from({ length: 5 }).map((_, i) => {
													const base = new Date();
													const d = new Date(base);
													d.setDate(base.getDate() + dateStartOffset + i);
													const isToday = dateStartOffset + i === 0;
													const label = isToday
														? `Today, ${String(d.getDate()).padStart(2, "0")}`
														: d.toLocaleDateString(undefined, {
															month: "short",
															day: "numeric",
														});
													const active = i === activeDateIndex;
													return (
														<div
															key={i}
															className="flex flex-col items-center gap-1"
														>
															<button
																onClick={() => { setActiveDateIndex(i); setSelectedTime(null); setHasPickedDate(true); }}
																className={`px-4 py-2 rounded-xl text-sm ${active
																	? "text-[#111827] font-semibold"
																	: "text-[#6B7280]"
																	}`}
															>
																{label}
															</button>
															{active && (
																<div className="h-0.5 w-14 bg-[#F97316] rounded-full" />
															)}
														</div>
													);
												})}
											</div>
											<button
												onClick={() => {
													if (activeDateIndex < 4) {
														setActiveDateIndex(activeDateIndex + 1);
													} else {
														setDateStartOffset(dateStartOffset + 1);
													}
													setSelectedTime(null);
													setHasPickedDate(true);
												}}
												className="h-9 w-9 bg-[#F3F4F6] rounded-full flex items-center justify-center hover:bg-[#E5E7EB]"
											>
												<ChevronRight className="h-5 w-8 text-[#6B7280]" />
											</button>
										</div>

										{/* Slot tabs */}
										<div className="mb-2 text-sm font-medium text-[#111827]">
											Slot
										</div>
										<div className="inline-flex items-center gap-2 bg-white border border-[#E5E7EB] rounded-xl p-2 mb-6">
											{(["Morning", "Afternoon", "Evening"] as const).map(
												(slot) => (
													<button
														key={slot}
														onClick={() => setSelectedSlot(slot)}
														className={`px-4 py-2 rounded-xl text-sm font-medium ${selectedSlot === slot
															? "bg-[#9AC63F] text-white"
															: "bg-[#F9FAFB] text-[#6B7280]"
															}`}
													>
														{slot}
													</button>
												)
											)}
										</div>

										<div className="mb-2 text-sm font-medium text-[#111827]">
											Time
										</div>
										{isTimesLoading && (
											<div className="text-xs text-[#6B7280] mb-2">
												Loading available times…
											</div>
										)}
										{slotsError && (
											<div className="text-xs text-red-600 mb-2">
												{slotsError}
											</div>
										)}
										<div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
											{(selectedSlot === "Morning"
												? [
													"06:00 AM",
													"06:30 AM",
													"07:00 AM",
													"07:30 AM",
													"08:00 AM",
													"08:30 AM",
													"09:00 AM",
													"09:30 AM",
													"10:00 AM",
													"10:30 AM",
													"11:00 AM",
													"11:30 AM",
												]
												: selectedSlot === "Afternoon"
													? [
														"12:00 PM",
														"12:30 PM",
														"01:00 PM",
														"01:30 PM",
														"02:00 PM",
														"02:30 PM",
														"03:00 PM",
														"03:30 PM",
														"04:00 PM",
														"04:30 PM",
													]
													: [
														"05:00 PM",
														"05:30 PM",
														"06:00 PM",
														"06:30 PM",
														"07:00 PM",
														"07:30 PM",
														"08:00 PM",
														"08:30 PM",
														"09:00 PM",
														"09:30 PM",
													]
											).map((t) => (
												<button
													key={t}
													onClick={() =>
														availableTimes.includes(t) && setSelectedTime(t)
													}
													disabled={!availableTimes.includes(t)}
													className={`px-4 py-2 rounded-xl border text-sm min-w-[120px] text-center ${selectedTime === t
														? "bg-[#FFF7ED] border-[#F97316] text-[#F97316]"
														: "bg-white border-[#E5E7EB] text-[#111827] hover:bg-[#F9FAFB]"
														} ${!availableTimes.includes(t)
															? "opacity-50 cursor-not-allowed"
															: ""
														}`}
												>
													{t}
												</button>
											))}
										</div>
									</div>
								</div>
							)}

							{/* Navigation Buttons */}
							<div className="flex items-center justify-between mt-8 pt-6 border-t border-[#E5E7EB]">
								<button
									onClick={handlePrevious}
									disabled={currentStep === 1}
									className="px-6 py-2 border border-[#E5E7EB] rounded-lg text-[#6B7280] hover:bg-[#F9FAFB] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
								>
									Previous
								</button>
								<button
									onClick={() => {
										if (submitting) return;
										if (currentStep === 4) setCurrentStep(5);
										else if (currentStep === 5) handleSubmit();
										else handleNext();
									}}
                                    disabled={(currentStep === 5 && submitting) || (currentStep === 5 && (!selectedTime || !hasPickedDate)) || (currentStep === 2 && !((formData.primaryConcerns || []).some((c) => String(c).trim())))}
									className={`px-6 py-2 rounded-lg transition-colors ${currentStep === 5
										? "bg-[#F97316] text-white hover:bg-[#ef6b0e]"
										: "bg-[#9AC63F] text-white hover:bg-[#85af34]"
										} disabled:opacity-50 disabled:cursor-not-allowed`}
								>
									{currentStep === 4
										? "Schedule"
										: currentStep === 5
											? "Submit"
											: "Next"}
								</button>
							</div>
						</div>
					</div>
				</main>
			</div>
			<Dialog open={isNotepadOpen} onOpenChange={setIsNotepadOpen}>
				<DialogContent className="sm:max-w-lg">
					<DialogHeader>
						<DialogTitle>Notepad</DialogTitle>
					</DialogHeader>
					<div className="space-y-4">
						<textarea
							value={notepadText}
							onChange={(e) => setNotepadText(e.target.value)}
							rows={8}
							className="w-full px-4 py-3 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9AC63F]/20 resize-none"
						/>
						<div className="flex items-center justify-end gap-3">
							<button
								onClick={() => setIsNotepadOpen(false)}
								className="px-4 py-2 border border-[#E5E7EB] rounded-lg text-[#111827] hover:bg-[#F9FAFB] transition-colors"
							>
								Cancel
							</button>
							<button
								onClick={saveNotepad}
								className="px-4 py-2 bg-[#9AC63F] text-white rounded-lg hover:bg-[#85af34] transition-colors"
							>
								Save
							</button>
						</div>
					</div>
				</DialogContent>
			</Dialog>
		</div>
	);
}
