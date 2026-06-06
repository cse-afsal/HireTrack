"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Save, Download, Loader2, CheckCircle, AlertCircle, Camera } from "lucide-react";
import {
  RD, EMPTY,
  ClassicTemplate, ModernTemplate, ExecutiveTemplate,
  MinimalTemplate, CreativeTemplate, TechTemplate,
} from "@/components/dashboard/resume-templates";
import { CropModal } from "@/components/dashboard/crop-modal";

const INP = "w-full bg-neutral-950 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:ring-1 focus:ring-indigo-500";
const TA  = INP + " resize-none";

type TId = "classic"|"modern"|"executive"|"minimal"|"creative"|"tech";
const TEMPLATES: { id: TId; label: string; color: string }[] = [
  { id:"classic",   label:"Classic Teal",   color:"#0b5f54" },
  { id:"modern",    label:"Modern Navy",    color:"#1e3a5f" },
  { id:"executive", label:"Executive Dark", color:"#1a1a2e" },
  { id:"minimal",   label:"Minimal Clean",  color:"#e5e7eb" },
  { id:"creative",  label:"Creative Purple",color:"#6d28d9" },
  { id:"tech",      label:"Tech Dark",      color:"#00ff88" },
];

export default function ResumeBuilderPage() {
  const [d, setD]           = useState<RD>(EMPTY);
  const [tmpl, setTmpl]     = useState<TId>("classic");
  const [saving, setSaving] = useState(false);
  const [exporting, setExp] = useState(false);
  const [status, setStatus] = useState<"idle"|"ok"|"err">("idle");
  const [errMsg, setErrMsg] = useState("");
  const [cropSrc, setCropSrc] = useState<string|null>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  const set = (k: keyof RD) => (e: React.ChangeEvent<HTMLInputElement|HTMLTextAreaElement>) =>
    setD(p => ({ ...p, [k]: e.target.value }));

  /* photo upload → open crop modal */
  const handlePhotoFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => setCropSrc(ev.target?.result as string);
    reader.readAsDataURL(file);
    e.target.value = ""; // reset so same file can be re-selected
  };

  /* save to DB */
  const save = async () => {
    if (!d.name.trim()) { setErrMsg("Full name is required."); setStatus("err"); return; }
    setSaving(true); setStatus("idle"); setErrMsg("");
    try {
      const r = await fetch("/api/resumes/builder", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(d) });
      if (!r.ok) {
        const txt = await r.text();
        throw new Error(`Server error (${r.status}): ${txt.substring(0, 40)}...`);
      }
      const j = await r.json();
      if (j.error) throw new Error(j.error);
      setStatus("ok"); setTimeout(() => setStatus("idle"), 3000);
    } catch (e: any) { setErrMsg(e.message); setStatus("err"); }
    finally { setSaving(false); }
  };

  /* single-page A4 PDF download */
  const download = async () => {
    if (!previewRef.current) return;
    if (!d.name.trim()) { setErrMsg("Please enter your name first."); setStatus("err"); return; }
    setExp(true); setErrMsg(""); setStatus("idle");
    try {
      const html2canvas = (await import("html2canvas")).default;
      const jsPDFMod    = await import("jspdf");
      const JsPDF: any  = (jsPDFMod as any).jsPDF ?? (jsPDFMod as any).default;

      const el = previewRef.current;

      /* Capture exactly 794×1123 px — one A4 page, no splitting */
      const canvas = await html2canvas(el, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#ffffff",
        logging: false,
        width: 794,
        height: 1123,
        windowWidth: 794,
        windowHeight: 1123,
        onclone: (_: Document, cloned: HTMLElement) => {
          const doc = cloned.ownerDocument;
          /* Remove all Tailwind/global CSS — templates are 100% inline-styled */
          doc.querySelectorAll('link[rel="stylesheet"], style').forEach(n => n.remove());
          doc.body.style.cssText = "margin:0;padding:0;background:#fff;";
        },
      } as any);

      /* canvas is exactly 1588×2246 (794×1123 @ 2×) → maps to perfect A4 */
      const doc = new JsPDF({ orientation:"portrait", unit:"mm", format:[210, 297] });
      doc.addImage(canvas.toDataURL("image/jpeg", 1.0), "JPEG", 0, 0, 210, 297);

      const safeName = d.name.replace(/[^a-z0-9]/gi, "_");
      const fileName = `${safeName}_Resume.pdf`;

      if (typeof window !== "undefined" && "showSaveFilePicker" in window) {
        try {
          const fh = await (window as any).showSaveFilePicker({
            suggestedName: fileName,
            types: [{ description:"PDF Document", accept:{"application/pdf":[".pdf"]} }],
          });
          const w = await fh.createWritable();
          await w.write(doc.output("blob"));
          await w.close();
          setStatus("ok"); setTimeout(() => setStatus("idle"), 3000);
          return;
        } catch (_) { /* cancelled / not supported → fall through */ }
      }
      doc.save(fileName);
      setStatus("ok"); setTimeout(() => setStatus("idle"), 3000);
    } catch (e: any) {
      console.error("PDF error:", e);
      setErrMsg("PDF export failed: " + e.message);
      setStatus("err");
    } finally { setExp(false); }
  };

  const TemplateComp = { classic:ClassicTemplate, modern:ModernTemplate, executive:ExecutiveTemplate, minimal:MinimalTemplate, creative:CreativeTemplate, tech:TechTemplate }[tmpl];

  return (
    <>
      {/* Crop Modal */}
      {cropSrc && (
        <CropModal
          src={cropSrc}
          onConfirm={url => { setD(p => ({ ...p, photo: url })); setCropSrc(null); }}
          onCancel={() => setCropSrc(null)}
        />
      )}

      <div style={{ display:"flex", gap:16, minHeight:"calc(100vh - 8rem)" }}>

        {/* ─ FORM ─ */}
        <div style={{ width:320, flexShrink:0 }} className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-y-auto">
          {/* sticky header */}
          <div className="sticky top-0 z-10 bg-neutral-900/95 backdrop-blur border-b border-neutral-800 px-5 py-3 flex justify-between items-center">
            <span className="text-sm font-bold text-white">Resume Builder</span>
            <div className="flex gap-2">
              <Button onClick={download} disabled={exporting} size="sm" variant="outline"
                className="h-8 border-neutral-700 text-neutral-300 hover:text-white hover:bg-neutral-800 gap-1.5">
                {exporting ? <Loader2 className="w-3 h-3 animate-spin"/> : <Download className="w-3 h-3"/>}
                <span className="text-xs">PDF</span>
              </Button>
              <Button onClick={save} disabled={saving} size="sm"
                className={`h-8 text-white gap-1.5 ${status==="ok"?"bg-emerald-600":status==="err"?"bg-red-600":"bg-teal-600"}`}>
                {saving ? <Loader2 className="w-3 h-3 animate-spin"/> : status==="ok" ? <CheckCircle className="w-3 h-3"/> : status==="err" ? <AlertCircle className="w-3 h-3"/> : <Save className="w-3 h-3"/>}
                <span className="text-xs">{status==="ok"?"Saved!":status==="err"?"Error":"Save"}</span>
              </Button>
            </div>
          </div>

          <div className="p-5 space-y-5">
            {status==="err" && errMsg && (
              <div className="flex gap-2 text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2 items-start">
                <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5"/>{errMsg}
              </div>
            )}
            {status==="ok" && (
              <div className="flex gap-2 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-3 py-2 items-start">
                <CheckCircle className="w-3.5 h-3.5 shrink-0 mt-0.5"/>Downloaded successfully!
              </div>
            )}

            {/* Template picker */}
            <Sec title="Choose Template">
              <div className="grid grid-cols-3 gap-2">
                {TEMPLATES.map(t => (
                  <button key={t.id} onClick={() => setTmpl(t.id)}
                    className={`rounded-lg p-2 text-[9px] font-semibold transition border-2 ${tmpl===t.id?"border-indigo-500 text-white bg-indigo-500/10":"border-neutral-700 text-neutral-400 hover:border-neutral-600"}`}>
                    <div className="w-full h-4 rounded mb-1.5" style={{ background: t.color }}/>
                    {t.label}
                  </button>
                ))}
              </div>
            </Sec>

            {/* Profile photo */}
            <Sec title="Profile Photo (Optional)">
              <div className="flex items-center gap-3">
                {d.photo
                  ? <img src={d.photo} alt="profile" className="w-12 h-12 rounded-full object-cover border-2 border-indigo-500"/>
                  : <div className="w-12 h-12 rounded-full bg-neutral-800 border-2 border-neutral-700 flex items-center justify-center"><Camera className="w-5 h-5 text-neutral-500"/></div>
                }
                <div className="flex flex-col gap-1">
                  <label className="cursor-pointer text-xs bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg transition text-center">
                    {d.photo ? "Change Photo" : "Upload Photo"}
                    <input type="file" accept="image/*" className="hidden" onChange={handlePhotoFile}/>
                  </label>
                  {d.photo && (
                    <div className="flex gap-2">
                      <button onClick={() => d.photo && setCropSrc(d.photo)} className="text-[10px] text-indigo-400 hover:text-indigo-300 transition">Re-crop</button>
                      <button onClick={() => setD(p => ({...p, photo:""}))} className="text-[10px] text-neutral-500 hover:text-red-400 transition">Remove</button>
                    </div>
                  )}
                </div>
              </div>
            </Sec>

            {/* Personal info */}
            <Sec title="Personal Info">
              <Lbl t="Full Name *"><input className={INP} value={d.name}     onChange={set("name")}     placeholder="Jane Smith"/></Lbl>
              <Lbl t="Professional Title"><input className={INP} value={d.title}    onChange={set("title")}    placeholder="Frontend Developer"/></Lbl>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
                <Lbl t="Phone"><input className={INP} value={d.phone}    onChange={set("phone")}    placeholder="+91 …"/></Lbl>
                <Lbl t="Location"><input className={INP} value={d.location} onChange={set("location")} placeholder="City"/></Lbl>
              </div>
              <Lbl t="Email"><input className={INP} value={d.email}    onChange={set("email")}    placeholder="you@email.com"/></Lbl>
              <Lbl t="LinkedIn"><input className={INP} value={d.linkedin} onChange={set("linkedin")} placeholder="linkedin.com/in/…"/></Lbl>
            </Sec>

            <Sec title="Professional Summary">
              <textarea className={TA} rows={4} value={d.summary} onChange={set("summary")} placeholder="2–3 sentence summary…"/>
            </Sec>
            <Sec title="Skills (comma-separated)">
              <textarea className={TA} rows={3} value={d.skills} onChange={set("skills")} placeholder="React, Node.js, Python, SQL…"/>
            </Sec>
            <Sec title="Education">
              <textarea className={TA} rows={4} value={d.education} onChange={set("education")} placeholder={"B.Tech Computer Science\nCollege Name\n2021 – 2025"}/>
            </Sec>
            <Sec title="Projects">
              <textarea className={TA} rows={5} value={d.projects} onChange={set("projects")} placeholder={"Project Name | github.com/…\nBrief description and impact."}/>
            </Sec>
            <Sec title="Achievements (one per line)">
              <textarea className={TA} rows={3} value={d.achievements} onChange={set("achievements")} placeholder={"HackerRank Gold Badge\n30-day LeetCode streak"}/>
            </Sec>
            <Sec title="Certifications (one per line)">
              <textarea className={TA} rows={3} value={d.certifications} onChange={set("certifications")} placeholder={"AWS Cloud Practitioner\nGoogle Data Analytics"}/>
            </Sec>
            <Sec title="Languages (comma-separated)">
              <input className={INP} value={d.languages} onChange={set("languages")} placeholder="English, Hindi, Malayalam"/>
            </Sec>
          </div>
        </div>

        {/* ─ PREVIEW (shows exactly A4 size at 85% scale) ─ */}
        <div style={{ flex:1, background:"#262626", borderRadius:12, overflow:"auto", display:"flex", alignItems:"flex-start", justifyContent:"center", padding:24 }}>
          <div>
            <div className="text-xs text-neutral-500 text-center mb-3">
              Preview — exactly one A4 page · What you see = what downloads
            </div>
            <div style={{ transform:"scale(0.82)", transformOrigin:"top center", boxShadow:"0 8px 40px rgba(0,0,0,0.5)" }}>
              <div ref={previewRef}>
                <TemplateComp d={d}/>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function Sec({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
      <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">{title}</p>
      {children}
    </div>
  );
}
function Lbl({ t, children }: { t: string; children: React.ReactNode }) {
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
      <label className="text-[11px] text-neutral-400">{t}</label>
      {children}
    </div>
  );
}
