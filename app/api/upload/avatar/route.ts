import { NextResponse } from "next/server";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const userIdRaw = formData.get("userId");
    const userId = typeof userIdRaw === "string" && userIdRaw.trim() ? userIdRaw.trim() : "temp";

    if (!file) {
      return NextResponse.json(
        { error: "Missing file" },
        { status: 400 }
      );
    }

    if (!file.type || !file.type.startsWith("image/")) {
      return NextResponse.json({ error: "Invalid file type" }, { status: 400 });
    }

    const maxBytes = 5 * 1024 * 1024;
    if (file.size > maxBytes) {
      return NextResponse.json({ error: "File too large" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const uploadDir = path.join(process.cwd(), "public", "uploads", "avatars", userId);
    await mkdir(uploadDir, { recursive: true });

    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const sanitizedFilename = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const filename = `${uniqueSuffix}-${sanitizedFilename}`;
    const filePath = path.join(uploadDir, filename);
    await writeFile(filePath, buffer);

    const fileUrl = `/uploads/avatars/${userId}/${filename}`;

    return NextResponse.json({
      success: true,
      fileUrl,
    });
  } catch (err) {
    console.error("Avatar upload error:", err);
    return NextResponse.json({ error: "File upload failed" }, { status: 500 });
  }
}
