import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const conversationId = formData.get("conversationId") as string;
    const type = formData.get("type") as string; // "image" or "document"

    if (!file || !conversationId || !type) {
      return NextResponse.json({ error: "Missing file, type, or conversationId" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    // Create directory structure: public/uploads/conversations/{conversationId}
    const uploadDir = path.join(process.cwd(), "public", "uploads", "conversations", conversationId);
    
    // Ensure directory exists
    await mkdir(uploadDir, { recursive: true });

    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    // Sanitize filename to remove special chars but keep extension
    const sanitizedFilename = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const filename = `${uniqueSuffix}-${sanitizedFilename}`;
    const filePath = path.join(uploadDir, filename);

    // Write file to disk
    await writeFile(filePath, buffer);

    // Return public URL
    const fileUrl = `/uploads/conversations/${conversationId}/${filename}`;

    return NextResponse.json({
      success: true,
      fileUrl: fileUrl,
    });
  } catch (err) {
    console.error("Upload error:", err);
    return NextResponse.json({ error: "File upload failed" }, { status: 500 });
  }
}
