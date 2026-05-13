"use client";

import { useEffect, useState } from "react";
import { useRouter } from "nextjs-toploader/app";
import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { login, loginFormSchema, logout } from "@/hooks/auth";
import Footer from "@/components/Footer";
import Image from "next/image";

import { Button } from "@/components/ui/button";

import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Lock, User, Eye, EyeOff, Loader, ArrowRight } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";

const formSchema = loginFormSchema;

type FormValues = z.infer<typeof formSchema>;

export default function DoctorLogin() {
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [phase, setPhase] = useState<"splash" | "transition" | "ready">("splash");
  const [role, setRole] = useState<"doctor" | "patient" | "lpc">("doctor");
  const router = useRouter();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false,
    },
  });

  const onSubmit = async (data: FormValues) => {
    setError("");

    try {
      const { user } = await login(data);

      if (role === "doctor") {
        if (user.role === "doctor" && user?.status != "approved") {
          router.push("/pending-approval");
        } else if (user.role === "doctor" && user?.status === "approved") {
          router.push("/doctor/messages");
        } else {
          setError("Unauthorized access. Please log in as a doctor.");
          logout(false);
        }
      } else if (role === "lpc") {
        if (user.role === "lpc") {
          router.push("/lpc/dashboard");
        } else {
          setError("Unauthorized access. Please log in as an LPC.");
          logout(false);
        }
      } else {
        if (user.role === "patient") {
          router.push("/");
        } else {
          setError("Unauthorized access. Please log in as a patient.");
          logout(false);
        }
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      console.log(err);
      const status = err?.response?.status;
      const apiMessage = err?.response?.data?.error || err?.response?.data?.message;
      
      if (status === 401 || status === 400) {
        // Agar backend se specific message aya hai to wo dikhao, warna generic
        setError(apiMessage || "Invalid credentials");
      } else if (typeof apiMessage === "string" && apiMessage.toLowerCase().includes("invalid")) {
        setError(apiMessage || "Invalid credentials");
      } else {
        setError(apiMessage || "Failed to login. Please try again.");
      }
    }
  };

  useEffect(() => {
    setError("");
  }, [role]);

  useEffect(() => {
    const t1 = setTimeout(() => setPhase("transition"), 1500);
    const t2 = setTimeout(() => setPhase("ready"), 2400);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  return (
    <div className={`min-h-screen flex flex-col ${phase === "ready" ? "content-ready" : "opacity-0"}`}>
      {phase !== "ready" && (
        <div className={`splash-overlay ${phase === "splash" ? "splash-enter" : "splash-exit"}`}>
          <div className="relative w-full h-full flex items-center justify-center">
            <Image src="/images/logo.svg" alt="Excel Connect" width={220} height={120} priority />
            <div className="absolute left-0 top-0 h-full w-28 sm:w-36 md:w-40 opacity-90 pointer-events-none">
              <Image src="/images/Group 2.png" alt="" fill className="object-contain" sizes="(max-width: 768px) 8rem, 10rem" />
            </div>
            <div className="absolute right-0 top-0 h-full w-28 sm:w-36 md:w-40 opacity-90 pointer-events-none rotate-180">
              <Image src="/images/Group 2.png" alt="" fill className="object-contain" sizes="(max-width: 768px) 8rem, 10rem" />
            </div>
          </div>
        </div>
      )}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 bg-gray-50">
        <div className="flex items-center justify-center py-10 md:py-14">
          <Card className="w-[360px] sm:w-[420px] shadow-xl rounded-2xl border border-gray-200">
            <CardHeader className="pb-2">
              <Tabs 
                defaultValue="doctor" 
                onValueChange={(v) => {
                  setRole(v as "doctor" | "patient" | "lpc");
                  setError("");
                }}
              >
                <TabsList className="w-full h-10 bg-gray-100 rounded-lg">
                  <TabsTrigger
                    value="patient"
                    className="w-1/3 text-gray-500 relative data-[state=active]:text-gray-900 data-[state=active]:font-extrabold data-[state=active]:after:content-[''] data-[state=active]:after:absolute data-[state=active]:after:left-1/2 data-[state=active]:after:-translate-x-1/2 data-[state=active]:after:bottom-0 data-[state=active]:after:h-1 data-[state=active]:after:w-8 data-[state=active]:after:bg-secondary data-[state=active]:after:rounded-full"
                  >
                    Client
                  </TabsTrigger>
                  <TabsTrigger
                    value="doctor"
                    className="w-1/3 relative data-[state=active]:text-gray-900 data-[state=active]:font-extrabold data-[state=active]:after:content-[''] data-[state=active]:after:absolute data-[state=active]:after:left-1/2 data-[state=active]:after:-translate-x-1/2 data-[state=active]:after:bottom-0 data-[state=active]:after:h-1 data-[state=active]:after:w-8 data-[state=active]:after:bg-secondary data-[state=active]:after:rounded-full"
                  >
                    Doctor
                  </TabsTrigger>
                  <TabsTrigger
                    value="lpc"
                    className="w-1/3 relative data-[state=active]:text-gray-900 data-[state=active]:font-extrabold data-[state=active]:after:content-[''] data-[state=active]:after:absolute data-[state=active]:after:left-1/2 data-[state=active]:after:-translate-x-1/2 data-[state=active]:after:bottom-0 data-[state=active]:after:h-1 data-[state=active]:after:w-8 data-[state=active]:after:bg-secondary data-[state=active]:after:rounded-full"
                  >
                    LPC
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="doctor" />
                <TabsContent value="lpc" />
              </Tabs>
            </CardHeader>
            <CardContent>
              {error && (
                <Alert variant="destructive" className="mb-6">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <p className="font-bold text-2xl mb-4">Sign in</p>
              <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-800 font-semibold">Email</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <User className="h-4 w-4 absolute left-3 top-2.5 text-gray-500" />
                          <Input className="mt-0 pl-10" placeholder="abc@mail.com" {...field} />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-800 flex justify-between">
                        <span className="font-semibold">Password</span>
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Lock className="h-4 w-4 absolute left-3 top-2.5 text-gray-500" />
                          <Input placeholder="************" type={showPassword ? "text" : "password"} className="pl-10 pr-10" {...field} />
                          <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-2.5 text-gray-500 hover:text-gray-700">
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex items-center justify-between">
                  <FormField
                    control={form.control}
                    name="rememberMe"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel className="text-sm text-gray-700 font-normal">
                            Keep me signed in
                          </FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />
                  <Link href="/forgot-password" className="text-sm text-orange-500">Forgot Password?</Link>
                </div>

                <Button variant="secondary" type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting ? (
                    <div className="flex items-center justify-center font-bold">
                      <Loader className="spinner-border animate-spin" />
                      <span className="ml-2">Signing in...</span>
                    </div>
                  ) : (
                    <span className="font-bold cursor-pointer">
                      Sign In <ArrowRight className="inline-block ml-1" />
                    </span>
                  )}
                </Button>
                <div className="rounded-xl bg-[#F4F4F5] px-4 py-4 text-center text-sm text-[#6B7280]">
                  Don’t have an account?{" "}
                  <Link
                    href={role === "patient" ? "/register" : role === "lpc" ? "/lpc/register" : "/doctor/register"}
                    className="font-semibold text-[#F97316] hover:text-[#ef6b0e]"
                  >
                    {role === "patient" ? "Register as a Patient" : role === "lpc" ? "Register as a LPC" : "Register as a Doctor"}
                  </Link>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
        <div className="relative bg-white rounded-l-4xl px-8 md:px-14 py-10 md:py-16 shadow-sm flex flex-col justify-center h-full">
          <div className="flex items-start gap-4 mb-8">
            <Image src="/images/logo.svg" alt="Excel Connect" width={220} height={80} className="object-contain" />
          </div>
          <div className="space-y-4 relative z-10">
            <p className="text-3xl md:text-4xl font-extrabold text-gray-900 leading-tight">
              Welcome Back
            </p>
            <p className="text-gray-600 text-lg max-w-md leading-relaxed">
              You can connect and assess patients through a convenient, safe and secure environment
            </p>
          </div>
          <div className="relative mt-12 flex-1 min-h-[300px]">
            <Image src="/images/image 99.png" alt="Stethoscope" fill className="object-contain" priority />
          </div>
          <Image src="/images/Group 2.png" alt="" width={160} height={160} className="absolute right-0 bottom-0 opacity-20 pointer-events-none" />
          <Image src="/images/Group 2.png" alt="" width={120} height={120} className="absolute right-10 top-10 opacity-20 rotate-180 pointer-events-none" />
        </div>
      </div>
      <Footer />
    </div>
  );
}
