export type {
  StudentData,
  SubjectEntry,
  SubjectMarks,
} from "./primaryPdf";

export type ReportLevel = "pre-primary" | "primary" | "middle";

import {
  generateReportCardPDF as generatePrimaryReportCardPDF,
  type StudentData,
} from "./primaryPdf";
import { generateReportCardPDF as generateMiddleReportCardPDF } from "./middlePdf";

const inferReportLevelFromClassName = (className: string): ReportLevel => {
  const normalized = (className || "").toLowerCase().trim();
  const middleClasses = ["6th", "7th", "8th", "9th", "10th", "6", "7", "8", "9", "10"];

  return middleClasses.some((value) => normalized.includes(value)) ? "middle" : "primary";
};

export const generateReportCardPDF = (
  data: StudentData,
  logoBuffer?: Buffer,
  reportLevel?: ReportLevel
): Promise<Buffer> => {
  const resolvedLevel = reportLevel ?? inferReportLevelFromClassName(data.className);

  return resolvedLevel === "middle"
    ? generateMiddleReportCardPDF(data, logoBuffer, "middle")
    : generatePrimaryReportCardPDF(data, logoBuffer);
};
