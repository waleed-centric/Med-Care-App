import Cookies from "js-cookie";
import axiosInstance from "../lib/axios";
import axios from "axios";

export const newAppointment = async (formId: any, date: any) => {
	const token = Cookies.get("token");
	if (!token) {
		throw new Error("Token is required");
	}
	const response = await axiosInstance.post("/api/appointments", {
		formId,
		date,
	});
	return response.data;
};

export const deleteClientAppointment = async (id: any) => {
	const response = await axiosInstance.delete(`/api/appointments/${id}`);
	return response.data;
};

export const editClientAppointment = async (form: any, id: any) => {
	const token = Cookies.get("token");
	if (!token) {
		throw new Error("Token is required");
	}
	const response = await axiosInstance.put(`/api/appointments/${id}`, form);
	return response.data;
};

export const seeAllAppointments = async (
	doctor: boolean,
	marketer: boolean,
	patient: boolean,
	search: string = ''
) => {
	const token = Cookies.get("token");
	if (!token) {
		throw new Error("Token is required");
	}

	let response;
	const params: any = {};

	if (search) {
		params.search = search;
	}

	if (doctor) {
		response = await axiosInstance.get("/api/appointments/doctor", {
			headers: {
				Authorization: `Bearer ${token}`,
			},
			params
		});
	} else if (marketer) {
		response = await axiosInstance.get("/api/appointments/marketer", {
			headers: {
				Authorization: `Bearer ${token}`,
			},
			params
		});

	} else if (patient) {
		response = await axiosInstance.get("/api/appointments/patient", {
			headers: {
				Authorization: `Bearer ${token}`,
			},
			params
		});
	}
	return response?.data;
};

export const confirmAppointment = async (formId: string) => {
	const token = Cookies.get("token");
	if (!token) {
		throw new Error("Token is required");
	}

	let response;
	response = await axiosInstance.post(`/api/forms/${formId}/accept`, {
		headers: {
			Authorization: `Bearer ${token}`,
		},
	});

	
	return response?.data;
};

export const createDoctorAppointment = async (form: any) => {
	const token = Cookies.get("token");
	if (!token) {
		throw new Error("Token is required");
	}

	let response;
	response = await axiosInstance.post(`/api/appointments/doctor`, form);
	return response?.data;
};

export const respondToAppointment = async (id: string, action: "accept" | "decline") => {
	const token = Cookies.get("token");
	if (!token) {
		throw new Error("Token is required");
	}
	const response = await axiosInstance.put(`/api/appointments/${id}/respond`, { action });
	return response.data;
};

export const bookAppointment = async (form: any) => {
	const token = Cookies.get("token");
	if (!token) {
		throw new Error("Token is required");
	}

	const response = await axiosInstance.post(`/api/appointments/book`, form);

	
	return response?.data;
};

export const createMarketerAppointment = async (form: any) => {
	const token = Cookies.get("token");
	if (!token) {
		throw new Error("Token is required");
	}

	let response;
	response = await axiosInstance.post(`/api/appointments/marketer`, form);

	
	return response?.data;
};

export const clientAppointments = async (page: number = 1, limit: number = 10, search: string = '') => {
	const token = Cookies.get("token");
	if (!token) {
		throw new Error("Token is required");
	}

	let response;
	const params: any = { page, limit };

	if (search) {
		params.search = search;
	}

	response = await axiosInstance.get("/api/appointments/doctor", {
		params,
		headers: {
			Authorization: `Bearer ${token}`,
		},
	});

	return response?.data;
};

export const getAllPatients = async () => {
	const token = Cookies.get("token");
	if (!token) {
		throw new Error("Token is required");
	}

	const response = await axiosInstance.get("/api/appointments/all-patients", {
		headers: {
			Authorization: `Bearer ${token}`,
		},
	});

	return response?.data;
};

export const marketerClientAppointments = async (page: number = 1, limit: number = 10, search: string = '') => {
	const token = Cookies.get("token");
	if (!token) {
		throw new Error("Token is required");
	}

	let response;
	const params: any = { page, limit };

	if (search) {
		params.search = search;
	}

	// Prefer marketer endpoint; fallback to doctor if needed
	try {
		response = await axiosInstance.get("/api/appointments/marketer", {
			params,
			headers: {
				Authorization: `Bearer ${token}`,
			},
		});
	} catch (_) {
		response = await axiosInstance.get("/api/appointments/doctor", {
			params,
			headers: {
				Authorization: `Bearer ${token}`,
			},
		});
	}

	return response?.data;
};

export const submitAssessment = async (payload: any) => {
	const token = Cookies.get("token");
	if (!token) {
		throw new Error("Token is required");
	}
	const response = await axiosInstance.post(
		"/api/appointments/assessment",
		payload
	);
	return response.data;
};

export const doctorAvailableTimes = async (
	doctorId: any,
	date: string,
	slot: string
) => {
	const token = Cookies.get("token");
	if (!token) {
		throw new Error("Token is required");
	}
	const response = await axiosInstance.get(`/api/appointments/availability`, {
		params: { doctorId, date, slot },
		headers: {
			Authorization: `Bearer ${token}`,
		},
	});
	return response.data;
};

export const AllAvailableDR = async (
	limit: number = 100,
	status: string = "approved",
	page: number = 1,
	search?: string
) => {
	const token = Cookies.get("token");
	const headers: Record<string, string> = {};
	if (token) headers["Authorization"] = `Bearer ${token}`;

	const base = process.env.NEXT_PUBLIC_API_URL;
	let path = `/api/appointments/doctors?available=true&status=${status}&limit=${limit}&page=${page}`;
	if (search && search.trim()) {
		path += `&search=${encodeURIComponent(search.trim())}`;
	}

	if (base && String(base).startsWith("http")) {
		const response = await axios.get(`${base}${path}`, { headers });
		const data = response.data || {};
		console.log(data,"data")
		const list = Array.isArray(data?.doctors) ? data.doctors : [];
		const normalized = list.map((d: any) => ({
			...d,
			displayName: String(d?.displayName ?? d?.name ?? ""),
			specialization: String(d?.specialization ?? d?.title ?? ""),
			avatar: String(d?.avatarUrl ?? d?.avatar ?? "/images/avatar.PNG"),
			workExperience: Number(d?.workExperience ?? d?.years ?? 0),
			yearsExperience: Number(d?.workExperience ?? d?.years ?? 0),
			education: d?.education ?? [],
			rating: Number(d?.rating ?? 0),
			reviewsCount: Number(d?.reviewsCount ?? d?.reviews ?? 0),
		}));
		const totalItems = Number(data?.totalItems ?? data?.count ?? normalized.length);
		const totalPages = Number(data?.totalPages ?? Math.ceil(totalItems / Math.max(1, limit)));
		return {
			totalItems,
			totalPages,
			doctors: normalized,
		};
	}

	const response = await axiosInstance.get(path, { headers });
	const data = response.data || {};
	const list = Array.isArray(data?.doctors) ? data.doctors : [];
	const normalized = list.map((d: any) => ({
		...d,
		displayName: String(d?.displayName ?? d?.name ?? ""),
		specialization: String(d?.specialization ?? d?.title ?? ""),
		avatar: String(d?.avatarUrl ?? d?.avatar ?? "/images/avatar.PNG"),
		workExperience: Number(d?.workExperience ?? d?.years ?? 0),
		yearsExperience: Number(d?.workExperience ?? d?.years ?? 0),
		education: d?.education ?? [],
		rating: Number(d?.rating ?? 0),
		reviewsCount: Number(d?.reviewsCount ?? d?.reviews ?? 0),
	}));
	const totalItems2 = Number(data?.totalItems ?? data?.count ?? normalized.length);
	const totalPages2 = Number(data?.totalPages ?? Math.ceil(totalItems2 / Math.max(1, limit)));
	return {
		totalItems: totalItems2,
		totalPages: totalPages2,
		doctors: normalized,
	};
};

export const runExternalAppointment = async (payload: any) => {
	const token = Cookies.get("token");
	const headers: Record<string, string> = {};
	if (token) headers["Authorization"] = `Bearer ${token}`;
	headers["Content-Type"] = "multipart/form-data";
	const endpoint =
		process.env.NEXT_PUBLIC_API_URL + `/api/appointments/assessment`;
	const client = String(endpoint).startsWith("http") ? axios : axiosInstance;
	const response = await client.post(endpoint, payload, { headers });
	return { status: response.status, ...response.data };
};

export const updateDoctorNotes = async (
	appointmentId: string,
	doctorNotes: string
) => {
	const token = Cookies.get("token");
	if (!token) {
		throw new Error("Token is required");
	}
	const response = await axiosInstance.post(
		`/api/appointments/${appointmentId}/doctor-notes`,
		{ doctorNotes }
	);
	return response.data;
};

export const markAppointmentAsCompleted = async (appointmentId: string) => {
	const token = Cookies.get("token");
	if (!token) {
		throw new Error("Token is required");
	}
	const response = await axiosInstance.put(
		`/api/appointments/${appointmentId}`,
		{ status: "completed" }
	);
	return response.data;
};
