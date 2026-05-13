"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Upload, FileText, CreditCard, Shield } from "lucide-react";
import countries from "world-countries";
import { Eye, EyeOff } from "lucide-react";
import { registerDoctor } from "@/hooks/registration";
import { login } from "@/hooks/auth";

const phoneSchema = z
  .string()
  .trim()
  .min(1, "Phone number is required")
  .refine((val) => /^(\+234|0)\d{10}$/.test(val.replace(/\s+/g, "")) || /^(\+?\d{6,14})$/.test(val.replace(/\s+/g, "")), "Invalid phone number format");

const countryOptions = countries
  .map((country) => ({
    label: country.name.common,
    value: country.cca2, // ISO 2-letter code
  }))
  .sort((a, b) => a.label.localeCompare(b.label));

const registerFormSchema = z
  .object({
    firstname: z.string().min(1, "First name is required"),
    lastname: z.string().min(1, "Last name is required"),
    middlename: z.string().optional(),
    dateOfBirth: z.string().min(1, "Date of birth is required"),
    phone: phoneSchema,
    email: z.string().email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string().min(6, "Confirm password is required"),
    certificate: z.any().optional(),
    driversLicense: z.any().optional(),
    ssn: z.any().optional(),
    resume: z.any().optional(),
    address: z.object({
      street: z.string().min(1, "Street is required"),
      streetLine2: z.string().optional(),
      city: z.string().min(1, "City is required"),
      region: z.string().min(1, "State is required"),
      postalCode: z.string().min(1, "Postal code is required"),
      country: z.string().min(1, "Country is required"),
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"], // error will show under confirmPassword
    message: "Passwords do not match",
  });

type FormValues = z.infer<typeof registerFormSchema>;

export default function RegisterADoctor() {
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const form = useForm<FormValues>({
    resolver: zodResolver(registerFormSchema),
    defaultValues: {
      firstname: "",
      lastname: "",
      middlename: "",
      dateOfBirth: "",
      phone: "",
      email: "",
      password: "",
      confirmPassword: "",
      address: {
        street: "",
        streetLine2: "",
        city: "",
        region: "",
        postalCode: "",
        country: "",
      },
    },
  });

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    try {
      const payload = { ...data, role: "doctor" };
      const response = await registerDoctor(payload);
      const loginData = { email: data.email, password: data.password };
      await login(loginData);
      router.push("/pending-approval");
    } catch (error: any) {
      console.log("Registration error:", error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-1 bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Register As A Doctor</h1>
          </div>

          {/* Registration Form */}
          <Card className="shadow-xl border-none">
            <CardHeader>
              <h2 className="text-xl font-semibold text-gray-900">Doctor Registration</h2>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                {/* {JSON.stringify(form.formState.errors)} */}
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  {/* Personal Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="firstname"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-700 font-medium">First name</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input placeholder="Enter first name" type="text" autoComplete="off" {...field} />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="middlename"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-700 font-medium">Middle name (optional)</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input placeholder="Enter middle name" type="text" autoComplete="off" {...field} />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="lastname"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-700 font-medium">Last name</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input placeholder="Enter last name" type="text" autoComplete="off" {...field} />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="dateOfBirth"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-700 font-medium">Date of Birth</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input placeholder="dd/mm/yyyy" type="date" autoComplete="off" {...field} />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-700 font-medium">Phone Number</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input placeholder="Enter Phone number" type="tel" autoComplete="off" {...field} />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-700 font-medium">Email</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input placeholder="Enter email" type="email" autoComplete="off" {...field} />
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
                          <FormLabel className="text-gray-700">
                            <span className="font-medium">Password</span>
                          </FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input
                                placeholder="Enter your password"
                                type={showPassword ? "text" : "password"}
                                autoComplete="current-password" // ✅ Better UX
                                {...field}
                              />
                              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-2.5 text-gray-500 hover:text-gray-700">
                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                              </button>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-700">
                            <span className="font-medium">Confirm Password</span>
                          </FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input placeholder="Confirm your password" type={showPassword ? "text" : "password"} autoComplete="current-password" {...field} />
                              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-2.5 text-gray-500 hover:text-gray-700">
                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                              </button>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Address - Full Width */}
                  <FormField
                    control={form.control}
                    name="address.street"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-700 font-medium">Street Address</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input placeholder="Street Address" {...field} />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="address.streetLine2"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <div className="relative">
                            <Input placeholder="Street Address Line 2" {...field} />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="address.city"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input placeholder="City" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="address.region"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input placeholder="State" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="address.postalCode"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input placeholder="Postal / Zip Code" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="address.country"
                      render={({ field }) => (
                        <FormItem className="w-full">
                          {/* <FormLabel>Country</FormLabel> */}
                          <FormControl>
                            <select {...field} className="w-full rounded-md border px-3 py-2">
                              <option value="">Select Country</option>
                              {countryOptions.map((c) => (
                                <option key={c.value} value={c.value}>
                                  {c.label}
                                </option>
                              ))}
                            </select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Document Upload Sections */}
                  {/* <h3 className="text-lg font-medium text-gray-900">Document Upload</h3> */}

                  {/* Drivers License */}
                  {/* <div className="grid gap-6 ">
                    {renderFileSection("certificate", <FileText className="h-6 w-6 text-gray-400" />, "Certificate")}
                    {renderFileSection("driversLicense", <CreditCard className="h-6 w-6 text-gray-400" />, "Driver's License")}
                    {renderFileSection("ssn", <Shield className="h-6 w-6 text-gray-400" />, "SSN")}
                    {renderFileSection("resume", <FileText className="h-6 w-6 text-gray-400" />, "Resume")}
                  </div> */}

                  {/* Submit Button */}
                  <div className="pt-6">
                    <Button type="submit" variant="secondary" className="w-full py-3 text-lg font-semibold cursor-pointer" disabled={isSubmitting}>
                      {isSubmitting ? "Submitting..." : "Submit"}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
