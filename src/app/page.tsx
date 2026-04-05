"use client";

import { useState, useEffect } from "react";
import Papa from "papaparse";

export default function Home() {
  const [mode, setMode] = useState<"upload" | "manual">("upload");
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);

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

  // Manual Form State
  const [manualData, setManualData] = useState({
    name: "", fatherName: "", motherName: "", className: "", dob: "", qualities: "", workingDays: 200, attendedDays: 0,
    english_P: 0, english_E: 0, english_T: 0,
    hindi_P: 0, hindi_E: 0, hindi_T: 0,
    maths_P: 0, maths_E: 0, maths_T: 0,
    evs_P: 0, evs_E: 0, evs_T: 0,
    computer_P: 0, computer_E: 0, computer_T: 0,
  });

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        try {
          const parsedStudents = results.data.map((row: any) => ({
            name: row.Name || "",
            fatherName: row["Father's Name"] || "",
            motherName: row["Mother's Name"] || "",
            className: row.Class || "",
            dob: row.DOB || "",
            qualities: row["Remarks Qualities"] || "",
            workingDays: parseInt(row["Working Days"] || "0", 10),
            attendedDays: parseInt(row["Attended Days"] || "0", 10),
            subjects: {
              english: { periodicRaw: parseInt(row["English Periodic"]||"0",10), enrichment: parseInt(row["English Enrichment"]||"0",10), term2: parseInt(row["English Term2"]||"0",10) },
              hindi: { periodicRaw: parseInt(row["Hindi Periodic"]||"0",10), enrichment: parseInt(row["Hindi Enrichment"]||"0",10), term2: parseInt(row["Hindi Term2"]||"0",10) },
              maths: { periodicRaw: parseInt(row["Maths Periodic"]||"0",10), enrichment: parseInt(row["Maths Enrichment"]||"0",10), term2: parseInt(row["Maths Term2"]||"0",10) },
              evs: { periodicRaw: parseInt(row["EVS Periodic"]||"0",10), enrichment: parseInt(row["EVS Enrichment"]||"0",10), term2: parseInt(row["EVS Term2"]||"0",10) },
              computerGk: { periodicRaw: parseInt(row["Computer Periodic"]||"0",10), enrichment: parseInt(row["Computer Enrichment"]||"0",10), term2: parseInt(row["Computer Term2"]||"0",10) },
            }
          }));
          setStudents(parsedStudents);
          setError(null);
        } catch (err) {
          setError("Error parsing CSV format. Please ensure it matches the template.");
        }
      }
    });
  };

  const addManualStudent = () => {
    // Validate DOB format exactly
    const dobRegex = /^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[012])\/\d{4}$/;
    if (!dobRegex.test(manualData.dob)) {
      return setError("Invalid Date of Birth format. Please use DD/MM/YYYY exactly.");
    }

    // Validate Marks Arrays
    const checkLimits = (name: string, p: number, e: number, t: number) => {
      if (isNaN(p) || p < 0 || p > 20) return `${name.toUpperCase()} Periodic Test must be between 0 and 20.`;
      if (isNaN(e) || e < 0 || e > 10) return `${name.toUpperCase()} Enrichment must be between 0 and 10.`;
      if (isNaN(t) || t < 0 || t > 80) return `${name.toUpperCase()} Term 2 must be between 0 and 80.`;
      return null;
    };

    const errE = checkLimits("English", manualData.english_P, manualData.english_E, manualData.english_T);
    const errH = checkLimits("Hindi", manualData.hindi_P, manualData.hindi_E, manualData.hindi_T);
    const errM = checkLimits("Maths", manualData.maths_P, manualData.maths_E, manualData.maths_T);
    const errV = checkLimits("EVS", manualData.evs_P, manualData.evs_E, manualData.evs_T);
    const errC = checkLimits("Computer", manualData.computer_P, manualData.computer_E, manualData.computer_T);

    const markError = errE || errH || errM || errV || errC;
    if (markError) return setError(markError);

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
      subjects: {
        english: { periodicRaw: manualData.english_P, enrichment: manualData.english_E, term2: manualData.english_T },
        hindi: { periodicRaw: manualData.hindi_P, enrichment: manualData.hindi_E, term2: manualData.hindi_T },
        maths: { periodicRaw: manualData.maths_P, enrichment: manualData.maths_E, term2: manualData.maths_T },
        evs: { periodicRaw: manualData.evs_P, enrichment: manualData.evs_E, term2: manualData.evs_T },
        computerGk: { periodicRaw: manualData.computer_P, enrichment: manualData.computer_E, term2: manualData.computer_T },
      }
    };
    setStudents([...students, s]);
  };

  const handleEditStudent = (index: number) => {
    const st = students[index];
    setManualData({
      name: st.name, fatherName: st.fatherName, motherName: st.motherName, className: st.className,
      dob: st.dob, qualities: st.qualities, workingDays: st.workingDays, attendedDays: st.attendedDays,
      english_P: st.subjects.english.periodicRaw, english_E: st.subjects.english.enrichment, english_T: st.subjects.english.term2,
      hindi_P: st.subjects.hindi.periodicRaw, hindi_E: st.subjects.hindi.enrichment, hindi_T: st.subjects.hindi.term2,
      maths_P: st.subjects.maths.periodicRaw, maths_E: st.subjects.maths.enrichment, maths_T: st.subjects.maths.term2,
      evs_P: st.subjects.evs.periodicRaw, evs_E: st.subjects.evs.enrichment, evs_T: st.subjects.evs.term2,
      computer_P: st.subjects.computerGk.periodicRaw, computer_E: st.subjects.computerGk.enrichment, computer_T: st.subjects.computerGk.term2,
    });
    setStudents(students.filter((_, idx) => idx !== index));
    window.scrollTo({ top: 300, behavior: "smooth" }); // Scroll to form area smoothly
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
      setResultUrl(url); // We still set ResultUrl so the user sees the success block and can click download
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const downloadTemplate = () => {
    const headers = [
      "Class", "Name", "Father's Name", "Mother's Name", "DOB", "Working Days", "Attended Days", "Remarks Qualities",
      "English Periodic", "English Enrichment", "English Term2",
      "Hindi Periodic", "Hindi Enrichment", "Hindi Term2",
      "Maths Periodic", "Maths Enrichment", "Maths Term2",
      "EVS Periodic", "EVS Enrichment", "EVS Term2",
      "Computer Periodic", "Computer Enrichment", "Computer Term2"
    ];
    const sample = [
      "10th", "John Doe", "Richard Doe", "Jane Doe", "01/01/2010", "200", "195", "Highly energetic, great at math",
      "18", "9", "75",
      "16", "8", "70",
      "20", "10", "80",
      "15", "8", "65",
      "19", "9", "78"
    ];
    const csvContent = headers.join(",") + "\n" + sample.join(",");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "report_card_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="layout-wrapper">
      <div className="sidebar" style={{textAlign: 'center'}}>
        <div style={{marginBottom: '20px', display: 'flex', justifyContent: 'center', zIndex: 1, position: 'relative'}}>
          <img src="/gis_logo.png" alt="GIS Logo" style={{maxWidth: '120px', borderRadius: '50%'}} />
        </div>
        <div className="school-brand">Global<br/>Innovative<br/>School</div>
        <div className="school-subtitle">Report Card Portal</div>
        
        <div className="sidebar-nav">
          <div className="sidebar-nav-item">📚 Dashboard</div>
          <div className="sidebar-nav-item" style={{opacity: 0.7}}>🎓 Batch Archive</div>
          <div className="sidebar-nav-item" style={{opacity: 0.7}}>⚙️ Settings</div>
        </div>
      </div>

      <div className="main-content">
        <h2>Report Card Orchestrator</h2>
        <div style={{textAlign: 'center'}}>
          <div className="toggle-group">
            <button className={mode === "upload" ? "active" : ""} onClick={() => setMode("upload")}>Bulk CSV Upload</button>
            <button className={mode === "manual" ? "active" : ""} onClick={() => setMode("manual")}>Single Manual Entry</button>
          </div>
        </div>

        {mode === "upload" ? (
          <div>
            <div className="file-drop-area" onClick={() => document.getElementById('csv-upload')?.click()}>
              <span className="icon">📄</span>
              <input type="file" accept=".csv" onChange={handleFileUpload} style={{display: 'none'}} id="csv-upload" />
              <div className="button-secondary" style={{marginBottom: '15px'}}>Browse for CSV File</div>
              <p style={{color: 'var(--text-muted)'}}>
                {students.length > 0 
                  ? <span style={{color: 'var(--accent-color)', fontWeight: 600}}>✅ {students.length} Student(s) successfully loaded & ready.</span> 
                  : "Upload your filled standard template to generate batch PDFs."}
              </p>
            </div>
            <div style={{textAlign: 'center'}}>
              <button className="button-secondary" onClick={downloadTemplate}>
                ⬇️ Download Architecture Template
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
              <div className="form-group"><label>Remark Qualities (AI Generation)</label><input type="text" className="form-control" placeholder="e.g. hard working, struggles in math" value={manualData.qualities} onChange={e => setManualData({...manualData, qualities: e.target.value})} /></div>
              <div className="form-group"><label>Working Days</label><input type="number" className="form-control" value={manualData.workingDays} onChange={e => setManualData({...manualData, workingDays: parseInt(e.target.value)})} /></div>
              <div className="form-group"><label>Attended Days</label><input type="number" className="form-control" value={manualData.attendedDays} onChange={e => setManualData({...manualData, attendedDays: parseInt(e.target.value)})} /></div>
            </div>

            <h3 className="section-title">Academic Metrics</h3>
            {['english', 'hindi', 'maths', 'evs', 'computer'].map((sub) => (
              <div className="subject-row" style={{display: 'flex', flexWrap: 'wrap', gap: '15px', alignItems: 'center'}} key={sub}>
                <div className="subject-name" style={{flex: '1.5', minWidth: '100px'}}>{sub}</div>
                <div style={{flex: '1', minWidth: '80px'}}><label style={{fontSize: '0.8rem', color: 'var(--text-muted)'}}>Periodic (20)</label><input type="number" min="0" max="20" className="form-control" value={(manualData as any)[`${sub}_P`]} onChange={e => setManualData({...manualData, [`${sub}_P`]: parseInt(e.target.value)})} /></div>
                <div style={{flex: '1', minWidth: '80px'}}><label style={{fontSize: '0.8rem', color: 'var(--text-muted)'}}>Enrich (10)</label><input type="number" min="0" max="10" className="form-control" value={(manualData as any)[`${sub}_E`]} onChange={e => setManualData({...manualData, [`${sub}_E`]: parseInt(e.target.value)})} /></div>
                <div style={{flex: '1', minWidth: '80px'}}><label style={{fontSize: '0.8rem', color: 'var(--text-muted)'}}>Term 2 (80)</label><input type="number" min="0" max="80" className="form-control" value={(manualData as any)[`${sub}_T`]} onChange={e => setManualData({...manualData, [`${sub}_T`]: parseInt(e.target.value)})} /></div>
              </div>
            ))}
            {error && <div className="alert error" style={{marginTop: '20px'}}>⚠️ {error}</div>}
            <div style={{textAlign: 'right', marginTop: '20px'}}>
              <button className="button-secondary" onClick={addManualStudent}>+ Add Student</button>
            </div>
          </div>
        )}

        {students.length > 0 && (
          <div style={{marginTop: '40px', borderTop: '2px solid var(--border)', paddingTop: '30px'}}>
            <h2 style={{textAlign: 'center', marginBottom: '20px', fontSize: '1.4rem'}}>
              Queue Status: <strong style={{color: 'var(--primary)'}}>{students.length}</strong> Profiles Loaded.
            </h2>
            
            <div style={{background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '15px', marginBottom: '25px', maxHeight: '300px', overflowY: 'auto'}}>
              <table style={{width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem', textAlign: 'left'}}>
                <thead>
                  <tr style={{borderBottom: '2px solid #e2e8f0', color: 'var(--text-muted)'}}>
                    <th style={{padding: '10px'}}>Student Name</th>
                    <th style={{padding: '10px'}}>Class</th>
                    <th style={{padding: '10px'}}>Father's Name</th>
                    <th style={{padding: '10px', textAlign: 'right'}}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((st, i) => (
                    <tr key={i} style={{borderBottom: '1px solid #e2e8f0'}}>
                      <td style={{padding: '10px', fontWeight: 600}}>{st.name}</td>
                      <td style={{padding: '10px'}}>{st.className}</td>
                      <td style={{padding: '10px'}}>{st.fatherName}</td>
                      <td style={{padding: '10px', textAlign: 'right', display: 'flex', gap: '10px', justifyContent: 'flex-end'}}>
                        <button style={{color: '#2563eb', background: 'transparent', border: 'none', cursor: 'pointer', fontWeight: 'bold'}} onClick={() => handleEditStudent(i)}>Edit</button>
                        <button style={{color: '#dc2626', background: 'transparent', border: 'none', cursor: 'pointer', fontWeight: 'bold'}} onClick={() => setStudents(students.filter((_, idx) => idx !== i))}>Remove</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {error && <div className="alert error">⚠️ {error}</div>}
            
            {showConfirm && (
              <div className="alert" style={{background: '#fff7ed', border: '2px solid #fdba74', color: '#c2410c'}}>
                <strong>⚠️ Confirmation Required:</strong> Are you completely sure you want to generate the ZIP archive for these {students.length} students? 
                <button className="button-secondary" style={{marginLeft: '15px'}} onClick={() => setShowConfirm(false)}>Cancel</button>
              </div>
            )}
            
            <button className="button-primary" onClick={handleGenerate} disabled={loading} style={{width: '100%', padding: '18px', fontSize: '18px', letterSpacing: '1px'}}>
              {loading ? "⚙️ GROK AI & RENDER ENGINE ACTIVE..." : (showConfirm ? "✅ YES, FINALIZE GENERATION" : "🚀 INITIATE GENERATION SEQUENCE")}
            </button>

            {resultUrl && (
              <div className="alert success" style={{marginTop: '30px', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '30px'}}>
                <span style={{fontSize: '40px', marginBottom: '10px'}}>🎉</span>
                <strong style={{fontSize: '1.2rem', marginBottom: '20px'}}>Operation Complete!</strong> 
                <span style={{textAlign: 'center', color: 'var(--text-muted)', marginBottom: '25px'}}>
                  All requested Report Cards and Feedback Form have been generated, marked by AI, compiled logically, and are ready for direct local download.
                </span>
                <a href={resultUrl} download="report_cards_batch.zip" className="button-primary" style={{background: 'linear-gradient(135deg, #10b981, #059669)'}}>
                  📥 Download Archive (.ZIP)
                </a>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
