"use client";

import { SnackbarProvider } from "notistack";
import React from "react";

export default function RegisterLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<SnackbarProvider
			maxSnack={3}
			anchorOrigin={{ vertical: "top", horizontal: "right" }}
			autoHideDuration={4000}
		>
			{children}
		</SnackbarProvider>
	);
}
