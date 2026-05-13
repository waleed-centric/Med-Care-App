// app/api/upload/signature/route.ts
import { NextResponse } from "next/server";
export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const userId = formData.get("userId") as string;

    if (!file || !userId) {
      return NextResponse.json({ error: "Missing file or userId" }, { status: 400 });
    }

    // Unique path: signatures/{userId}/{timestamp}.png
    const now = new Date().toISOString().replace(/[:.]/g, "-");
    const filePath = `${userId}/${now}.png`;




    return NextResponse.json({
      success: true,
      fileUrl: "",
    });
  } catch (err) {
    console.error("Upload error:", err);
    return NextResponse.json({ error: "File upload failed" }, { status: 500 });
  }
}
