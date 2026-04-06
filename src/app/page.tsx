"use client";

import { useState, useEffect } from "react";
import Papa from "papaparse";

type ReportLevel = "pre-primary" | "primary" | "middle";

const LEVEL_CONFIG = {
  "pre-primary": ["English", "Hindi", "Maths", "E.V.S."],
  "primary": ["English", "Hindi", "Maths", "E.V.S.", "Computer + G.K."],
  "middle": ["English", "Hindi", "Maths", "E.V.S.", "Computer + G.K.", "Social Science", "Sanskrit"],
};

// --- Professional Icons (SVG) ---
const PrePrimaryIcon = () => (
  <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 10h16M4 14h16M4 18h16M4 6h16" opacity="0.2"/>
    <rect x="3" y="3" width="18" height="18" rx="2"/>
    <path d="M9 9l3 3-3 3M15 9l-3 3 3 3"/>
  </svg>
);

const PrimaryIcon = () => (
  <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 20V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
    <rect x="2" y="20" width="20" height="2" rx="1"/>
    <circle cx="12" cy="9" r="2"/>
    <path d="M12 11v4"/>
  </svg>
);

const MiddleIcon = () => (
  <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
    <path d="M6 12v5c3 3 9 3 12 0v-5"/>
  </svg>
);

const DashboardIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7"/>
    <rect x="14" y="3" width="7" height="7"/>
    <rect x="14" y="14" width="7" height="7"/>
    <rect x="3" y="14" width="7" height="7"/>
  </svg>
);

const GuideIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 3h6a4 4 0 0 1 4 4v14a4 4 0 0 0-4-4H2z"/>
    <path d="M22 3h-6a4 4 0 0 0-4 4v14a4 4 0 0 1 4-4h6z"/>
  </svg>
);

const RefreshIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 2v6h-6M3 12a9 9 0 0 1 15-6.7L21 8M3 22v-6h6M21 12a9 9 0 0 1-15 6.7L3 16"/>
  </svg>
);

const FileIcon = () => (
  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
    <polyline points="14 2 14 8 20 8"/>
    <line x1="16" y1="13" x2="8" y2="13"/>
    <line x1="16" y1="17" x2="8" y2="17"/>
    <line x1="10" y1="9" x2="8" y2="9"/>
  </svg>
);

export default function Home() {
  const [reportLevel, setReportLevel] = useState<ReportLevel | null>(null);
  const [mode, setMode] = useState<"upload" | "manual">("upload");
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);

  // Manual Form State - Dynamic based on subjects
  const [manualData, setManualData] = useState<any>({
    name: "", fatherName: "", motherName: "", className: "", dob: "", qualities: "", workingDays: 200, attendedDays: 0,
  });

  // Initialize/Reset manual data when level changes
  useEffect(() => {
    if (reportLevel) {
      const initialMarks: any = {
        name: "", fatherName: "", motherName: "", className: "", dob: "", qualities: "", workingDays: 200, attendedDays: 0,
      };
      LEVEL_CONFIG[reportLevel].forEach(sub => {
        initialMarks[`${sub}_P`] = 0;
        initialMarks[`${sub}_E`] = 0;
        initialMarks[`${sub}_T`] = 0;
      });
      setManualData(initialMarks);
      setStudents([]); // Clear queue when level changes to avoid mismatch
      setResultUrl(null);
    }
  }, [reportLevel]);

  // Warn before reloading if data exists
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (students.length > 0) {
        e.preventDefault();
        e.returnValue = "You have unsaved students in the queue. Are you sure you want to leave?";
        return e.returnValue;
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [students]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !reportLevel) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        try {
          const subjects = LEVEL_CONFIG[reportLevel];
          const parsedStudents = results.data.map((row: any) => {
            const studentSubjects = subjects.map(sub => ({
              name: sub,
              marks: {
                periodicRaw: parseInt(row[`${sub} Periodic`] || "0", 10),
                enrichment: parseInt(row[`${sub} Enrichment`] || "0", 10),
                term2: parseInt(row[`${sub} Term2`] || "0", 10)
              }
            }));

            return {
              name: row.Name || "",
              fatherName: row["Father's Name"] || "",
              motherName: row["Mother's Name"] || "",
              className: row.Class || "",
              dob: row.DOB || "",
              qualities: row["Remarks Qualities"] || "",
              workingDays: parseInt(row["Working Days"] || "0", 10),
              attendedDays: parseInt(row["Attended Days"] || "0", 10),
              subjects: studentSubjects
            };
          });
          setStudents(parsedStudents);
          setError(null);
        } catch (err) {
          setError("Error parsing CSV format. Please ensure it matches the template for the selected level.");
        }
      }
    });
  };

  const addManualStudent = () => {
    if (!reportLevel) return;
    
    // Validate DOB format exactly
    const dobRegex = /^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[012])\/\d{4}$/;
    if (!dobRegex.test(manualData.dob)) {
      return setError("Invalid Date of Birth format. Please use DD/MM/YYYY exactly.");
    }

    // Validate Marks
    const subjects = LEVEL_CONFIG[reportLevel];
    for (const sub of subjects) {
      const p = manualData[`${sub}_P`];
      const e = manualData[`${sub}_E`];
      const t = manualData[`${sub}_T`];
      if (isNaN(p) || p < 0 || p > 20) return setError(`${sub.toUpperCase()} Periodic Test must be between 0 and 20.`);
      if (isNaN(e) || e < 0 || e > 10) return setError(`${sub.toUpperCase()} Enrichment must be between 0 and 10.`);
      if (isNaN(t) || t < 0 || t > 80) return setError(`${sub.toUpperCase()} Term 2 must be between 0 and 80.`);
    }

    // Validate Attendance
    if (isNaN(manualData.workingDays) || isNaN(manualData.attendedDays) || manualData.attendedDays < 0 || manualData.workingDays < 0) {
      return setError("Attendance days cannot be negative or invalid.");
    }
    if (manualData.attendedDays > manualData.workingDays) {
      return setError("Attended days cannot exceed Total Working days.");
    }

    setError(null);

    const s = {
      name: manualData.name, fatherName: manualData.fatherName, motherName: manualData.motherName, className: manualData.className,
      dob: manualData.dob, qualities: manualData.qualities, workingDays: manualData.workingDays, attendedDays: manualData.attendedDays,
      subjects: subjects.map(sub => ({
        name: sub,
        marks: {
          periodicRaw: manualData[`${sub}_P`],
          enrichment: manualData[`${sub}_E`],
          term2: manualData[`${sub}_T`]
        }
      }))
    };
    setStudents([...students, s]);
    
    // Reset form but keep class name for convenience
    const resetData = { ...manualData, name: "", dob: "", qualities: "" };
    setManualData(resetData);
  };

  const handleEditStudent = (index: number) => {
    if (!reportLevel) return;
    const st = students[index];
    const editData: any = {
      name: st.name, fatherName: st.fatherName, motherName: st.motherName, className: st.className,
      dob: st.dob, qualities: st.qualities, workingDays: st.workingDays, attendedDays: st.attendedDays,
    };
    st.subjects.forEach((sub: any) => {
      editData[`${sub.name}_P`] = sub.marks.periodicRaw;
      editData[`${sub.name}_E`] = sub.marks.enrichment;
      editData[`${sub.name}_T`] = sub.marks.term2;
    });
    setManualData(editData);
    setStudents(students.filter((_, idx) => idx !== index));
    window.scrollTo({ top: 300, behavior: "smooth" });
  };

  const handleGenerate = async () => {
    if (students.length === 0) return setError("No students to process.");
    if (!showConfirm) {
      setShowConfirm(true);
      return;
    }
    
    setLoading(true);
    setError(null);
    setResultUrl(null);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ students }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Generation failed on the server.");
      }
      
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      setResultUrl(url);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const downloadTemplate = () => {
    if (!reportLevel) return;
    const subjects = LEVEL_CONFIG[reportLevel];
    const headers = [
      "Class", "Name", "Father's Name", "Mother's Name", "DOB", "Working Days", "Attended Days", "Remarks Qualities",
    ];
    subjects.forEach(sub => {
      headers.push(`${sub} Periodic`, `${sub} Enrichment`, `${sub} Term2`);
    });

    const sample = [
      "Junior KG", "Child Name", "Father Name", "Mother Name", "01/01/2019", "200", "190", "Curious, helpful, disciplined",
    ];
    subjects.forEach(() => sample.push("18", "9", "75"));

    const csvContent = headers.join(",") + "\n" + sample.join(",");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `gis_${reportLevel}_template.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!reportLevel) {
    return (
      <div className="layout-wrapper" style={{display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh'}}>
        <div style={{maxWidth: '800px', width: '100%', padding: '40px', textAlign: 'center'}}>
           <img src="/gis_logo.png" alt="GIS Logo" style={{maxWidth: '180px', marginBottom: '30px', borderRadius: '50%'}} />
           <h1 style={{color: 'var(--primary)', marginBottom: '10px'}}>Welcome to GIS Portal</h1>
           <p style={{color: 'var(--text-muted)', marginBottom: '40px'}}>Please select the academic level to begin generating report cards.</p>
           
           <div className="grid-3" style={{gap: '20px'}}>
              <div card-level="pre-primary" className="level-card" onClick={() => setReportLevel('pre-primary')}>
                <div className="icon-container" style={{color: '#f59e0b'}}><PrePrimaryIcon/></div>
                <h3>Pre-Primary</h3>
                <p>4 Subjects Grid (Out of 400)</p>
              </div>
              <div card-level="primary" className="level-card" onClick={() => setReportLevel('primary')}>
                <div className="icon-container" style={{color: '#10b981'}}><PrimaryIcon/></div>
                <h3>Primary</h3>
                <p>5 Subjects Grid (Out of 500)</p>
              </div>
              <div card-level="middle" className="level-card" onClick={() => setReportLevel('middle')}>
                <div className="icon-container" style={{color: '#3b82f6'}}><MiddleIcon/></div>
                <h3>Middle</h3>
                <p>7 Subjects Grid (Out of 700)</p>
              </div>
           </div>
        </div>
      </div>
    );
  }

  return (
    <div className="layout-wrapper">
      <div className="sidebar" style={{textAlign: 'center'}}>
        <div style={{marginBottom: '20px', display: 'flex', justifyContent: 'center', zIndex: 1, position: 'relative'}}>
          <img src="/gis_logo.png" alt="GIS Logo" style={{maxWidth: '100px', borderRadius: '50%'}} />
        </div>
        <div className="school-brand">Global<br/>Innovative<br/>School</div>
        <div className="school-subtitle">{reportLevel.toUpperCase()} Portal</div>
        
        <div className="sidebar-nav">
          <div className="sidebar-nav-item clickable" onClick={() => { if(confirm("Change level? Current queue will be cleared.")) setReportLevel(null); }}>
            <RefreshIcon/> Change Level
          </div>
          <div className="sidebar-nav-item active">
            <DashboardIcon/> Dashboard
          </div>
          <a href="/api/guide" download="GIS_Portal_User_Guide.pdf" className="sidebar-nav-item" style={{textDecoration: 'none', color: 'inherit'}}>
            <GuideIcon/> User Guide
          </a>
        </div>
      </div>

      <div className="main-content">
        <h2>{reportLevel.charAt(0).toUpperCase() + reportLevel.slice(1)} Orchestrator</h2>
        <div style={{textAlign: 'center', marginBottom: '30px'}}>
          <div className="toggle-group">
            <button className={mode === "upload" ? "active" : ""} onClick={() => setMode("upload")}>Bulk CSV Upload</button>
            <button className={mode === "manual" ? "active" : ""} onClick={() => setMode("manual")}>Single Manual Entry</button>
          </div>
        </div>

        {mode === "upload" ? (
          <div>
            <div className="file-drop-area" onClick={() => document.getElementById('csv-upload')?.click()}>
              <div style={{color: 'var(--primary)', marginBottom: '15px'}}><FileIcon/></div>
              <input type="file" accept=".csv, text/csv, application/vnd.ms-excel, application/csv" onChange={handleFileUpload} style={{display: 'none'}} id="csv-upload" />
              <div className="button-secondary" style={{marginBottom: '15px'}}>Tap to Browse {reportLevel} CSV</div>
              <p style={{color: 'var(--text-muted)'}}>
                {students.length > 0 
                  ? <span style={{color: 'var(--accent-color)', fontWeight: 600}}>✅ {students.length} Student(s) loaded.</span> 
                  : `Select or drop your ${reportLevel} CSV to begin batch process.`}
              </p>
            </div>
            <div style={{textAlign: 'center'}}>
              <button className="button-secondary" onClick={downloadTemplate}>
                Download {reportLevel.toUpperCase()} Template
              </button>
            </div>
          </div>
        ) : (
          <div style={{animation: 'fadeIn 0.5s ease'}}>
            <h3 className="section-title">Student Profile</h3>
            <div className="grid-2">
              <div className="form-group"><label>Full Name</label><input type="text" className="form-control" placeholder="e.g. John Doe" value={manualData.name} onChange={e => setManualData({...manualData, name: e.target.value})} /></div>
              <div className="form-group"><label>Class / Grade</label><input type="text" className="form-control" placeholder="e.g. 5th A" value={manualData.className} onChange={e => setManualData({...manualData, className: e.target.value})} /></div>
              <div className="form-group"><label>Father's Name</label><input type="text" className="form-control" value={manualData.fatherName} onChange={e => setManualData({...manualData, fatherName: e.target.value})} /></div>
              <div className="form-group"><label>Mother's Name</label><input type="text" className="form-control" value={manualData.motherName} onChange={e => setManualData({...manualData, motherName: e.target.value})} /></div>
              <div className="form-group"><label>Date of Birth</label><input type="text" className="form-control" placeholder="DD/MM/YYYY" value={manualData.dob} onChange={e => setManualData({...manualData, dob: e.target.value})} /></div>
              <div className="form-group"><label>Remark Qualities</label><input type="text" className="form-control" placeholder="e.g. hard working, creative" value={manualData.qualities} onChange={e => setManualData({...manualData, qualities: e.target.value})} /></div>
              <div className="form-group"><label>Working Days</label><input type="number" className="form-control" value={manualData.workingDays} onChange={e => setManualData({...manualData, workingDays: parseInt(e.target.value)})} /></div>
              <div className="form-group"><label>Attended Days</label><input type="number" className="form-control" value={manualData.attendedDays} onChange={e => setManualData({...manualData, attendedDays: parseInt(e.target.value)})} /></div>
            </div>

            <h3 className="section-title">Academic Metrics ({LEVEL_CONFIG[reportLevel].length} Subjects)</h3>
            {LEVEL_CONFIG[reportLevel].map((sub) => (
              <div className="subject-row" style={{display: 'flex', flexWrap: 'wrap', gap: '15px', alignItems: 'center'}} key={sub}>
                <div className="subject-name" style={{flex: '1.5', minWidth: '100px'}}>{sub}</div>
                <div style={{flex: '1', minWidth: '80px'}}><label style={{fontSize: '0.8rem', color: 'var(--text-muted)'}}>Periodic (20)</label><input type="number" min="0" max="20" className="form-control" value={manualData[`${sub}_P`] || 0} onChange={e => setManualData({...manualData, [`${sub}_P`]: parseInt(e.target.value)})} /></div>
                <div style={{flex: '1', minWidth: '80px'}}><label style={{fontSize: '0.8rem', color: 'var(--text-muted)'}}>Enrich (10)</label><input type="number" min="0" max="10" className="form-control" value={manualData[`${sub}_E`] || 0} onChange={e => setManualData({...manualData, [`${sub}_E`]: parseInt(e.target.value)})} /></div>
                <div style={{flex: '1', minWidth: '80px'}}><label style={{fontSize: '0.8rem', color: 'var(--text-muted)'}}>Term 2 (80)</label><input type="number" min="0" max="80" className="form-control" value={manualData[`${sub}_T`] || 0} onChange={e => setManualData({...manualData, [`${sub}_T`]: parseInt(e.target.value)})} /></div>
              </div>
            ))}
            {error && <div className="alert error" style={{marginTop: '20px'}}>Error: {error}</div>}
            <div style={{textAlign: 'right', marginTop: '20px'}}>
              <button className="button-secondary" onClick={addManualStudent}>+ Add to Queue</button>
            </div>
          </div>
        )}

        {students.length > 0 && (
          <div style={{marginTop: '40px', borderTop: '2px solid var(--border)', paddingTop: '30px'}}>
            <h2 style={{textAlign: 'center', marginBottom: '20px'}}>Queue: {students.length} Profiles</h2>
            <div className="table-responsive" style={{marginBottom: '25px', maxHeight: '400px'}}>
              <table style={{width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem', minWidth: '600px'}}>
                <thead>
                  <tr style={{borderBottom: '2px solid #e2e8f0', textAlign: 'left', background: '#f1f5f9'}}>
                    <th style={{padding: '12px'}}>Student Profile</th>
                    <th style={{padding: '12px'}}>Guardian Name</th>
                    <th style={{padding: '12px', textAlign: 'right'}}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((st, i) => (
                    <tr key={i} style={{borderBottom: '1px solid #e2e8f0'}}>
                      <td style={{padding: '12px'}}>
                        <strong>{st.name}</strong><br/>
                        <span style={{fontSize: '0.8rem', color: 'var(--text-muted)'}}>{st.className} | {st.dob}</span>
                      </td>
                      <td style={{padding: '12px'}}>{st.fatherName}</td>
                      <td style={{padding: '12px', textAlign: 'right'}}>
                        <button className="text-secondary" style={{color: 'var(--secondary)', border: 'none', background: 'none', cursor: 'pointer', fontWeight: 600, padding: '5px'}} onClick={() => handleEditStudent(i)}>Edit</button>
                        <span style={{margin: '0 5px', color: '#cbd5e1'}}>|</span>
                        <button className="text-danger" style={{color: 'red', border: 'none', background: 'none', cursor: 'pointer', fontWeight: 600, padding: '5px'}} onClick={() => setStudents(students.filter((_, idx) => idx !== i))}>Remove</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {showConfirm && (
              <div className="alert" style={{background: '#fff7ed', border: '2px solid #fdba74', color: '#c2410c', marginBottom: '15px'}}>
                <strong>Verification Required:</strong> Generating {students.length} report cards for {reportLevel.toUpperCase()}?
                <button className="button-secondary" style={{marginLeft: '15px'}} onClick={() => setShowConfirm(false)}>Cancel</button>
              </div>
            )}
            <button className="button-primary" onClick={handleGenerate} disabled={loading} style={{width: '100%', padding: '18px', fontSize: '18px'}}>
              {loading ? "Processing..." : (showConfirm ? "Finalize Batch Process" : `Generate ${students.length} Reports`)}
            </button>
            {resultUrl && (
              <div style={{marginTop: '20px', textAlign: 'center'}}>
                <a href={resultUrl} download="report_cards.zip" className="button-primary" style={{background: '#10b981'}}>Download .ZIP Archive</a>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
