import { Button } from "@/components/ui/button";
import { PenSquare } from "lucide-react";

export default function AdminStaffProfile() {
	return (
		<div className="border rounded-md p-4 bg-white flex flex-col md:flex-row gap-4 items-start md:items-center">
			<div className="shrink-0">
				<div className="w-20 h-20 rounded-full bg-red-600 flex items-center justify-center overflow-hidden">
					{/* eslint-disable-next-line @next/next/no-img-element */}
					<img
						src="/images/avatar.PNG?height=80&width=80"
						alt="Profile"
						className="w-full h-full object-cover"
					/>
				</div>
			</div>

			<div className="grow">
				<h1 className="text-xl font-bold">Auspicious Community Service, LLC</h1>
				<div className="space-y-1 text-sm text-gray-600">
					<p>305 FM 517 Road E.</p>
					<p>Dickinson, TX 77539</p>
					<p>(832) 774-7144</p>
					<p>Veidusuyi@AuspiciousCS.com</p>
				</div>
			</div>

			<div className="shrink-0 ml-auto">
				<Button
					variant="outline"
					className="flex items-center gap-2 bg-blue-900 text-white hover:bg-blue-800"
				>
					<PenSquare className="h-4 w-4" />
					Edit Profile
				</Button>
			</div>
		</div>
	);
}
