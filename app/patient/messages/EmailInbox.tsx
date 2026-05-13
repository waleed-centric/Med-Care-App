"use client";
import moment from "moment";
import Link from "next/link";
import { Search, Trash2 } from "lucide-react";

interface Participant {
	id: string;
	firstName: string;
	lastName: string;
	email: string;
	phone: string;
	avatar: string;
	role: boolean;
}
interface Email {
	id: string;
	useId: string;
	participants: { user: Participant }[];
	lastMessage: string;
	category?: string;
	updatedAt: string;
	isChecked: boolean;
	isStarred: boolean;
}

export default function EmailInbox({
	emails,
	loading,
	error,
}: {
	emails: Email[];
	loading: boolean;
	error: string | null;
}) {
	const toggleCheck = (id: string) => {
		console.log("toggleCheck", id);
	};

	const toggleStar = (id: string) => {
		console.log("toggleStar", id);
	};

	const getCategoryColor = (category: string) => {
		switch (category) {
			case "Primary":
				return "bg-emerald-100 text-emerald-600";
			case "Client":
				return "bg-orange-100 text-orange-600";
			case "Staff":
				return "bg-purple-100 text-purple-600";
			case "Social":
				return "bg-blue-100 text-blue-600";
			default:
				return "";
		}
	};

	return (
		<div className="bg-white rounded-lg shadow">
			<div className="flex items-center justify-between p-4 border-b">
				<div className="relative w-full max-w-md">
					<div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
						<Search className="h-5 w-8 text-gray-400" />
					</div>
					<input
						type="text"
						className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg block w-full pl-10 p-2.5 focus:outline-none"
						placeholder="Search mail..."
					/>
				</div>
				<button className="p-2.5 ml-2 text-gray-700 rounded-lg">
					<Trash2 className="h-5 w-8" />
				</button>
			</div>
			{loading ? (
				<div className="flex items-center justify-center h-64">
					<span className="h-8 w-8 animate-spin border-x-2 rounded-full" />
				</div>
			) : error ? (
				<div className="flex items-center justify-center h-64 text-red-500">
					{error}
				</div>
			) : emails.length === 0 ? (
				<div className="flex items-center justify-center gap-2 h-64 text-gray-500">
					<svg
						className="h-8 w-8 text-gray-400"
						xmlns="http://www.w3.org/2000/svg"
						viewBox="0 0 24 24"
					>
						<path
							fill="currentColor"
							d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm1.5 15h-3v-3h3v3zm0-4.5h-3V7h3v5.5z"
						/>
					</svg>
					<p>No emails found</p>
				</div>
			) : (
				emails.length > 0 && (
					<div className="divide-y">
						{emails.map((email) => (
							<Link
								href={`/admin/messages/${email.id}`}
								key={email.id}
								className={`flex items-center px-4 py-3 hover:bg-gray-50 ${
									email.isChecked ? "bg-blue-50" : ""
								}`}
							>
								<div className="flex items-center mr-4">
									<input
										type="checkbox"
										checked={email.isChecked}
										onChange={() => toggleCheck(email.id)}
										className="w-4 h-4 border-gray-300 rounded"
									/>
								</div>
								<button onClick={() => toggleStar(email.id)} className="mr-4">
									{email.isStarred ? (
										<svg
											className="w-5 h-5 text-yellow-400 fill-current"
											viewBox="0 0 24 24"
										>
											<path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
										</svg>
									) : (
										<svg
											className="w-5 h-5 text-gray-300 fill-current"
											viewBox="0 0 24 24"
										>
											<path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
										</svg>
									)}
								</button>
								<div className="flex-1 min-w-0">
									<div className="flex items-center">
										<p className="text-sm font-medium text-gray-900 truncate w-40">
											{email.participants[0].user.firstName}{" "}
											{email.participants[0].user.firstName}
										</p>
										{email.category && (
											<span
												className={`ml-2 px-2.5 py-0.5 text-xs rounded-full ${getCategoryColor(
													email.category
												)}`}
											>
												{email.category}
											</span>
										)}
										<p className="ml-4 text-sm text-gray-700 truncate flex-1">
											{email.lastMessage}
										</p>
										<p className="text-sm text-gray-500 whitespace-nowrap ml-4">
											{moment(email.updatedAt)?.format("HH:MM, DD-MM-YYYY")}
										</p>
									</div>
								</div>
							</Link>
						))}
					</div>
				)
			)}
		</div>
	);
}
