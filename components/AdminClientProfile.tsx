export default function AdminClientProfile() {
	const clientData = {
		name: "Jaleigh Bolton",
		dob: "6/27/2018 (6 years)",
		email: "j.caraway520@gmail.com",
		phone: "(936) 201-2168",
		insurance: "68519 - SUPERIOR HEALTHPLAN (727333176)",
		recordNumber: "",
	};

	return (
		<div className="border-b p-4 bg-white flex flex-col md:flex-row gap-4 items-start md:items-center">
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
				<h1 className="text-xl font-bold">{clientData.name}</h1>
				<div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-1 text-sm text-gray-600">
					<div>
						<p>
							<span className="font-medium">DOB:</span> {clientData.dob}
						</p>
						<p>
							<span className="font-medium">Email:</span> {clientData.email}
						</p>
						<p>
							<span className="font-medium">Record #:</span>{" "}
							{clientData.recordNumber}
						</p>
					</div>
					<div>
						<p>
							<span className="font-medium">Phone:</span> {clientData.phone}
						</p>
						<p>
							<span className="font-medium">Insurance:</span>{" "}
							{clientData.insurance}
						</p>
					</div>
				</div>
			</div>
		</div>
	);
}
