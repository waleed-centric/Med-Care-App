"use client";

import React, { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Cookies from "js-cookie";
import { Button } from "@/components/ui/button";
import { verifyOtp, sendOtp } from "@/hooks/auth";
export default function VerifyOtpPage() {
	return (
		<Suspense fallback={<div className="min-h-screen bg-[#F5F5F5]" />}>
			<VerifyOtpInner />
		</Suspense>
	);
}

function VerifyOtpInner() {
	const router = useRouter();
	const search = useSearchParams();
	const email = search.get("email") || "";
	const tokenFromUrl = search.get("token") || "";
	const [digits, setDigits] = useState<string[]>(["", "", "", ""]);
	const [loading, setLoading] = useState(false);

	const inputs = [
		useRef<HTMLInputElement>(null),
		useRef<HTMLInputElement>(null),
		useRef<HTMLInputElement>(null),
		useRef<HTMLInputElement>(null),
	];

	useEffect(() => {
		inputs[0].current?.focus();
	}, []);

	const handleChange = (index: number, value: string) => {
		const v = value.replace(/\D/g, "");
        if (v.length > 1) {
             // Handle case where multiple digits are entered at once (though onPaste handles most pastes)
             const chars = v.split("").slice(0, 4);
             const next = [...digits];
             chars.forEach((c, i) => {
                 if (index + i < 4) {
                     next[index + i] = c;
                 }
             });
             setDigits(next);
             const nextIndex = Math.min(index + chars.length, 3);
             inputs[nextIndex].current?.focus();
             return;
        }

		const next = [...digits];
		next[index] = v.slice(0, 1);
		setDigits(next);
		if (v && index < inputs.length - 1) inputs[index + 1].current?.focus();
	};

    const handlePaste = (e: React.ClipboardEvent) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 4);
        
        if (pastedData) {
            const next = [...digits];
            for (let i = 0; i < pastedData.length; i++) {
                next[i] = pastedData[i];
            }
            setDigits(next);
            
            // Focus logic
            const nextIndex = Math.min(pastedData.length, 3);
            inputs[nextIndex].current?.focus();
        }
    };

	const handleKeyDown = (
		index: number,
		e: React.KeyboardEvent<HTMLInputElement>
	) => {
		if (e.key === "Backspace" && !digits[index] && index > 0)
			inputs[index - 1].current?.focus();
	};

	const verify = async () => {
		const code = digits.join("");
		if (code.length !== 4) return;
		setLoading(true);
		try {
			const res: any = await verifyOtp({ email, code });
			console.log(res)
			if (res?.success) {
                Cookies.remove("token");
                Cookies.remove("user");
                if (typeof window !== "undefined") {
                    localStorage.clear();
                    window.location.href = "/";
                }
			}
		} finally {
			setLoading(false);
		}
	};

	const resend = async () => {
		if (!email) return;
		await sendOtp({ email });
	};

	return (
		<div className="min-h-screen bg-[#F5F5F5] flex">
			<div className="flex-1 flex items-center justify-center p-6">
				<div className="w-full max-w-sm bg-white rounded-2xl border border-[#E5E7EB] p-6 shadow-sm">
					<div className="flex items-center justify-center h-10 w-10 rounded-lg bg-[#9AC63F] text-white mx-auto mb-4">
						<span>⎈</span>
					</div>
					<div className="text-center mb-6">
						<div className="text-2xl font-bold text-[#111827]">
							Verify Your Code
						</div>
						<div className="text-sm text-[#6B7280]">
							Enter the code we sent to your email.
						</div>
					</div>
					<div className="grid grid-cols-4 gap-3 mb-4">
						{digits.map((d, i) => (
							<input
								autoComplete="off"
								key={i}
								ref={inputs[i]}
								value={d}
								onChange={(e) => handleChange(i, e.target.value)}
                                onPaste={handlePaste}
								onKeyDown={(e) => handleKeyDown(i, e)}
								className="h-14 rounded-xl border border-[#E5E7EB] text-center text-xl"
								inputMode="numeric"
							/>
						))}
					</div>
					<div className="flex items-center justify-between text-sm mb-4">
						<button onClick={() => router.back()} className="text-[#6B7280]">
							Back
						</button>
						<button onClick={resend} className="text-[#f97316]">
							Don’t receive your code
						</button>
					</div>
					<Button
						onClick={verify}
						className="w-full bg-[#9AC63F] hover:bg-[#86b132]"
						disabled={loading}
					>
						{loading ? "Verifying..." : "Verify"}
					</Button>
				</div>
			</div>
			<div className="hidden lg:flex lg:w-1/2 items-center justify-center p-10">
				<div className="w-full max-w-lg">
					<div className="flex items-center gap-3 mb-6">
						<Image
							src="/images/logo.svg"
							alt="Excel Connect"
							width={40}
							height={40}
						/>
						<div className="text-2xl font-bold">
							<span className="text-[#9AC63F]">EXCEL</span>
							<span className="text-[#111827]">CONNECT</span>
						</div>
					</div>
					<Image
						src="/images/image 99.png"
						alt="brand"
						width={800}
						height={600}
						className="w-full h-auto"
					/>
				</div>
			</div>
		</div>
	);
}
