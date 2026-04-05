import { NextRequest, NextResponse } from "next/server";
import { generateRemarks } from "@/lib/remarks";
import { generateReportCardPDF, StudentData } from "@/lib/pdfGenerator";
import { generateFeedbackFormPDF } from "@/lib/feedbackPdf";
import AdmZip from "adm-zip";

export async function POST(req: NextRequest) {
  try {
    const { students } = await req.json() as { students: StudentData[] };

    if (!students || students.length === 0) {
      return NextResponse.json({ error: "No student data provided" }, { status: 400 });
    }

    const zip = new AdmZip();

    // Process each student
    const processingPromises = students.map(async (student) => {
      // 1. Generate Remark
      let remark = student.remarks;
      if (!remark && student.qualities) {
        // Remarks Engine
        remark = await generateRemarks(student.qualities, student.name);
      }
      student.remarks = remark || "Excellent performance and behavior. Keep up the good work!";

      // 2. Generate PDF
      const pdfBuffer = await generateReportCardPDF(student);

      // 3. Add to ZIP directly
      const filename = `${student.name.replace(/\s+/g, '_')}_ReportCard.pdf`;
      zip.addFile(filename, pdfBuffer);
    });

    await Promise.all(processingPromises);

    // 4. Generate the collective Feedback Form PDF
    const feedbackPdfBuffer = await generateFeedbackFormPDF(students);
    zip.addFile("Class_Feedback_Form.pdf", feedbackPdfBuffer);

    // 5. Generate local zip buffer
    const zipBuffer = zip.toBuffer();

    return new NextResponse(zipBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="report_cards_${Date.now()}.zip"`,
      },
    });

  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json({ error: "Failed to generate report cards" }, { status: 500 });
  }
}
