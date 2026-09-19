import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { getStorageService } from "@/lib/storage";

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth();

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Limit size to 100MB
    if (file.size > 100 * 1024 * 1024) {
      return NextResponse.json({ error: "File size exceeds 100MB limit" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const storage = getStorageService();
    const fileUrl = await storage.uploadFile(buffer, file.name, file.type);

    return NextResponse.json({
      success: true,
      fileUrl,
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type,
      uploadedBy: session.name,
    });
  } catch (error: any) {
    console.error("POST /api/upload error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to upload file" },
      { status: error.statusCode || 500 }
    );
  }
}
