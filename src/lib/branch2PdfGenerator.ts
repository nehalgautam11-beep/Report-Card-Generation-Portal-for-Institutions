export type {
  StudentData,
  SubjectEntry,
  SubjectMarks,
} from "./branch2PrimaryPdf";

export type ReportLevel = "pre-primary" | "primary" | "middle";

import {
  generateBranch2ReportCardPDF as generatePrimaryReportCardPDF,
  type StudentData,
} from "./branch2PrimaryPdf";
import { generateBranch2MiddleReportCardPDF as generateMiddleReportCardPDF } from "./branch2MiddlePdf";

const inferReportLevelFromClassName = (className: string): ReportLevel => {
  const normalized = (className || "").toLowerCase().trim();
  const middleClasses = ["6th", "7th", "8th", "9th", "10th", "6", "7", "8", "9", "10"];

  return middleClasses.some((value) => normalized.includes(value)) ? "middle" : "primary";
};

export const generateBranch2ReportCardPDF = (
  data: StudentData,
  logoBuffer?: Buffer,
  reportLevel?: ReportLevel
): Promise<Buffer> => {
  const resolvedLevel = reportLevel ?? inferReportLevelFromClassName(data.className);

  return resolvedLevel === "middle"
    ? generateMiddleReportCardPDF(data, logoBuffer, "middle")
    : generatePrimaryReportCardPDF(data, logoBuffer);
};
