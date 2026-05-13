"use client";

import React, { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Eye, EyeOff, ArrowLeft, AlertCircle } from "lucide-react";
import { sendResetPassword } from "@/hooks/auth";
export default function CreatePasswordPage() {
    return (
        <Suspense
            fallback={
                <div className="min-h-screen bg-[#F5F5F5] flex items-center justify-center" />
            }
        >
            <CreatePasswordInner />
        </Suspense>
    );
}

function CreatePasswordInner() {
    const router = useRouter();
    const search = useSearchParams();
    const token = search.get("resetToken") || search.get("token") || "";
    const [newPassword, setPassword] = useState("");
    const [confirm, setConfirm] = useState("");
    const [show, setShow] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const submit = async () => {
        if (!newPassword) {
            setError("Password is required");
            return;
        }
        if (newPassword.length < 6) {
            setError("Password must be at least 6 characters");
            return;
        }
        if (newPassword !== confirm) {
            setError("Passwords do not match");
            return;
        }
        setError("");
        setLoading(true);
        try {
            await sendResetPassword({ newPassword, resetToken: token });
            router.push("/login");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#F5F5F5] grid grid-cols-1 lg:grid-cols-2">
            <div className="flex items-center justify-center p-6 lg:p-10">
                <div className="w-full max-w-lg">
                    <div className="bg-white rounded-3xl border border-[#E5E7EB] shadow-[0_24px_60px_rgba(198,205,221,0.25)] overflow-hidden">
                        <div className="px-8 pt-8">
                            <div className="text-center">
                                <div className="text-3xl font-extrabold text-[#111827]">Create Your Password</div>
                                <p className="mt-2 text-sm text-[#6B7280]">Set a new password to secure your account.</p>
                            </div>
                            <div className="mt-6 space-y-6">
                                <div>
                                    <label className="text-sm font-semibold text-[#4B5563]">New Password</label>
                                    <div className="relative mt-2">
                                        <Input
                                            autoComplete="new-password"
                                            type={show ? "text" : "password"}
                                            placeholder="••••••••"
                                            value={newPassword}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="h-11 rounded-xl border border-[#E5E7EB] bg-white text-sm font-medium text-[#111827] placeholder:text-[#9CA3AF] focus-visible:ring-2 focus-visible:ring-[#9AC63F]/30 pr-10"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShow(!show)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#6B7280]"
                                        >
                                            {show ? (
                                                <EyeOff className="h-4 w-4" />
                                            ) : (
                                                <Eye className="h-4 w-4" />
                                            )}
                                        </button>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-sm font-semibold text-[#4B5563]">Confirm Password</label>
                                    <div className="relative mt-2">
                                        <Input
                                            autoComplete="new-password"
                                            type={show ? "text" : "password"}
                                            placeholder="••••••••"
                                            value={confirm}
                                            onChange={(e) => setConfirm(e.target.value)}
                                            onKeyDown={(e) => { if (e.key === "Enter") submit(); }}
                                            className="h-11 rounded-xl border border-[#E5E7EB] bg-white text-sm font-medium text-[#111827] placeholder:text-[#9CA3AF] focus-visible:ring-2 focus-visible:ring-[#9AC63F]/30 pr-10"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShow(!show)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#6B7280]"
                                        >
                                            {show ? (
                                                <EyeOff className="h-4 w-4" />
                                            ) : (
                                                <Eye className="h-4 w-4" />
                                            )}
                                        </button>
                                    </div>
                                </div>
                                {error && (
                                    <div className="flex items-center gap-2 text-red-600 text-sm">
                                        <AlertCircle className="h-4 w-4" />
                                        <span>{error}</span>
                                    </div>
                                )}
                                <Button
                                    onClick={submit}
                                    className="h-11 w-full rounded-xl bg-[#9AC63F] text-white font-semibold hover:bg-[#86b132]"
                                    disabled={loading || newPassword.length < 6 || newPassword !== confirm}
                                >
                                    {loading ? "Updating..." : "Send"}
                                </Button>
                                {/* <Button
                                    variant="outline"
                                    onClick={() => router.push("/login")}
                                    className="h-11 w-full rounded-xl border-[#E5E7EB] text-[#111827] hover:bg-[#F9FAFB]"
                                >
                                    <ArrowLeft className="mr-2 h-4 w-4" /> Back to Login
                                </Button> */}
                            </div>
                        </div>
                        <div className="mt-8 px-8 pb-8">
                            {/* <div className="flex items-center justify-center gap-2 text-xs text-[#9CA3AF]">
                                <span>Use a strong password</span>
                                <span>•</span>
                                <span>Keep it private</span>
                            </div> */}
                        </div>
                    </div>
                </div>
            </div>
            <div className="relative hidden lg:flex items-center justify-center p-0">
                <div className="relative flex h-full w-full flex-col items-center justify-center overflow-hidden rounded-l-[40px] bg-white/50 backdrop-blur-sm">
                    {/* Logo Section */}
                    <div className="absolute left-10 top-12 flex flex-col z-20">
                        <Image
                            src="/images/logo.svg"
                            alt="Excel Connect logo"
                            width={240}
                            height={48}
                            priority
                            className="h-auto w-auto"
                        />
                        <div className="mt-2 text-sm font-medium text-[#6B7280]">
                            therapy brought to you...
                        </div>
                    </div>

                    {/* Main Image */}
                    <div className="relative z-10 mt-16 transform transition-transform hover:scale-105 duration-500">
                        <Image
                            src="/images/image 99.png"
                            alt="Stethoscope"
                            width={420}
                            height={520}
                            className="w-[380px] drop-shadow-2xl"
                            priority
                        />
                    </div>

                    {/* Decorative Background */}
                    <div className="absolute left-0 -rotate-90 top-0 h-full w-full pointer-events-none overflow-hidden rounded-l-[40px]">
                        <Image src="/images/Group 2.png" alt="" fill className="object-cover object-left" />
                    </div>
                </div>
            </div>
        </div>
    );
}
