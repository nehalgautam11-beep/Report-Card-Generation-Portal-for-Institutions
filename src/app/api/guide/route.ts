import { NextRequest, NextResponse } from "next/server";
import { generateUserGuidePDF } from "@/lib/guidePdf";

export async function GET(req: NextRequest) {
  try {
    const pdfBuffer = await generateUserGuidePDF();

    return new Response(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="GIS_Portal_User_Guide.pdf"',
      },
    });
  } catch (error) {
    console.error("Guide API Error:", error);
    return NextResponse.json({ error: "Failed to generate user guide" }, { status: 500 });
  }
}
