"use client";
import React from "react";

export interface RD {
  name: string; title: string; phone: string; email: string;
  linkedin: string; location: string; summary: string;
  achievements: string; languages: string; certifications: string;
  education: string; projects: string; skills: string;
  photo?: string;
}

export const EMPTY: RD = {
  name:"",title:"",phone:"",email:"",linkedin:"",location:"",
  summary:"",achievements:"",languages:"",certifications:"",
  education:"",projects:"",skills:"",photo:"",
};

const L = (s:string) => s.split("\n").filter(Boolean);
const C = (s:string) => s.split(",").map(v=>v.trim()).filter(Boolean);

/* Shared photo/avatar helper */
function Avatar({ photo, initial, size, bg, border, color }: { photo?:string; initial:string; size:number; bg:string; border:string; color:string }) {
  return photo
    ? <img src={photo} alt="profile" style={{ width:size, height:size, borderRadius:"50%", objectFit:"cover", border, flexShrink:0 }}/>
    : <div style={{ width:size, height:size, borderRadius:"50%", background:bg, border, display:"flex", alignItems:"center", justifyContent:"center", fontSize:size*0.37, fontWeight:700, color, flexShrink:0 }}>{initial}</div>;
}

/* Sidebar section heading */
function LS({ title, c="#a7f3d0", bc="#19a093", children }: { title:string; c?:string; bc?:string; children:React.ReactNode }) {
  return <div style={{ overflow:"hidden" }}><div style={{ fontSize:8, fontWeight:700, letterSpacing:"1.5px", textTransform:"uppercase", borderBottom:`1px solid ${bc}`, paddingBottom:3, marginBottom:6, color:c }}>{title}</div>{children}</div>;
}
/* Main section heading */
function RS({ title, c="#888", bc="#e5e7eb", children }: { title:string; c?:string; bc?:string; children:React.ReactNode }) {
  return <div style={{ overflow:"hidden" }}><div style={{ fontSize:8, fontWeight:700, letterSpacing:"1.5px", textTransform:"uppercase", color:c, borderBottom:`1px solid ${bc}`, paddingBottom:2, marginBottom:6 }}>{title}</div>{children}</div>;
}

/* ── Template 1: Classic Teal ── */
export function ClassicTemplate({ d }: { d: RD }) {
  const init = d.name ? d.name.trim()[0].toUpperCase() : "?";
  return (
    <div style={{ width:794, height:1123, overflow:"hidden", background:"#fff", display:"flex", fontFamily:"Arial,sans-serif", fontSize:"10.5px", lineHeight:1.45, color:"#1a1a1a" }}>
      <div style={{ width:220, background:"#0b5f54", color:"#fff", padding:"24px 16px", display:"flex", flexDirection:"column", gap:14, flexShrink:0, overflow:"hidden", height:"100%" }}>
        <div style={{ display:"flex", justifyContent:"center" }}>
          <Avatar photo={d.photo} initial={init} size={80} bg="#0d7065" border="3px solid #19a093" color="#a7f3d0"/>
        </div>
        {C(d.skills).length>0 && <LS title="Skills"><div style={{ display:"flex", flexWrap:"wrap", gap:3 }}>{C(d.skills).map((s,i)=><span key={i} style={{ background:"rgba(255,255,255,0.12)", borderRadius:999, padding:"1px 7px", fontSize:8.5, color:"#d1fae5" }}>{s}</span>)}</div></LS>}
        {L(d.achievements).length>0 && <LS title="Achievements">{L(d.achievements).map((a,i)=><div key={i} style={{ fontSize:9, color:"#d1fae5", marginBottom:4, paddingLeft:10, position:"relative", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}><span style={{ position:"absolute", left:1 }}>▸</span>{a}</div>)}</LS>}
        {C(d.languages).length>0 && <LS title="Languages">{C(d.languages).map((l,i)=><div key={i} style={{ fontSize:9, color:"#d1fae5", marginBottom:3 }}>{l}</div>)}</LS>}
        {L(d.certifications).length>0 && <LS title="Certifications">{L(d.certifications).map((c,i)=><div key={i} style={{ fontSize:9, color:"#d1fae5", marginBottom:4 }}>{c}</div>)}</LS>}
      </div>
      <div style={{ flex:1, padding:"24px 22px", display:"flex", flexDirection:"column", gap:14, overflow:"hidden", height:"100%" }}>
        <div style={{ borderBottom:"2px solid #0b5f54", paddingBottom:12, flexShrink:0 }}>
          <div style={{ fontSize:24, fontWeight:800, color:"#1a1a1a", lineHeight:1.2 }}>{d.name||<span style={{ color:"#ccc" }}>Your Name</span>}</div>
          <div style={{ fontSize:12, fontWeight:600, color:"#0b7a6e", marginTop:2 }}>{d.title||<span style={{ color:"#ccc" }}>Professional Title</span>}</div>
          <div style={{ display:"flex", flexWrap:"wrap", gap:12, marginTop:7, fontSize:9.5, color:"#666" }}>
            {d.phone&&<span>📞 {d.phone}</span>}{d.email&&<span>✉ {d.email}</span>}
            {d.linkedin&&<span>🔗 {d.linkedin}</span>}{d.location&&<span>📍 {d.location}</span>}
          </div>
        </div>
        {d.summary&&<RS title="Professional Summary"><p style={{ color:"#444", lineHeight:1.65, margin:0, textAlign:"justify" }}>{d.summary}</p></RS>}
        {d.education&&<RS title="Education"><div style={{ color:"#444", whiteSpace:"pre-line", lineHeight:1.55 }}>{d.education}</div></RS>}
        {d.projects&&<RS title="Projects"><div style={{ color:"#444", whiteSpace:"pre-line", lineHeight:1.55 }}>{d.projects}</div></RS>}
        {!d.name&&!d.summary&&<div style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", color:"#ccc", fontSize:13 }}>Fill in the form to preview.</div>}
      </div>
    </div>
  );
}

/* ── Template 2: Modern Navy ── */
export function ModernTemplate({ d }: { d: RD }) {
  const init = d.name ? d.name.trim()[0].toUpperCase() : "?";
  return (
    <div style={{ width:794, height:1123, overflow:"hidden", background:"#fff", fontFamily:"Georgia,serif", fontSize:"10.5px", lineHeight:1.45, color:"#1a1a1a" }}>
      <div style={{ background:"#1e3a5f", padding:"26px 32px", display:"flex", alignItems:"center", gap:20, flexShrink:0 }}>
        <Avatar photo={d.photo} initial={init} size={90} bg="#2d527a" border="3px solid #4a90d9" color="#90c4f9"/>
        <div style={{ overflow:"hidden" }}>
          <div style={{ fontSize:27, fontWeight:700, color:"#fff", lineHeight:1.15 }}>{d.name||"Your Name"}</div>
          <div style={{ fontSize:12, color:"#90c4f9", marginTop:3 }}>{d.title||"Professional Title"}</div>
          <div style={{ display:"flex", flexWrap:"wrap", gap:14, marginTop:8, fontSize:9.5, color:"#b0cce8" }}>
            {d.phone&&<span>📞 {d.phone}</span>}{d.email&&<span>✉ {d.email}</span>}
            {d.linkedin&&<span>🔗 {d.linkedin}</span>}{d.location&&<span>📍 {d.location}</span>}
          </div>
        </div>
      </div>
      <div style={{ display:"flex", height:"calc(100% - 130px)", overflow:"hidden" }}>
        <div style={{ width:200, background:"#f0f4f8", padding:"18px 15px", display:"flex", flexDirection:"column", gap:14, flexShrink:0, overflow:"hidden" }}>
          {C(d.skills).length>0&&<LS title="Skills" c="#1e3a5f" bc="#1e3a5f">{C(d.skills).map((s,i)=><div key={i} style={{ padding:"2px 0", borderBottom:"1px solid #dde3eb", fontSize:9.5, color:"#333" }}>{s}</div>)}</LS>}
          {C(d.languages).length>0&&<LS title="Languages" c="#1e3a5f" bc="#1e3a5f">{C(d.languages).map((l,i)=><div key={i} style={{ fontSize:9.5, color:"#333", marginBottom:2 }}>{l}</div>)}</LS>}
          {L(d.certifications).length>0&&<LS title="Certifications" c="#1e3a5f" bc="#1e3a5f">{L(d.certifications).map((c,i)=><div key={i} style={{ fontSize:9.5, color:"#333", marginBottom:3 }}>• {c}</div>)}</LS>}
        </div>
        <div style={{ flex:1, padding:"18px 20px", display:"flex", flexDirection:"column", gap:13, overflow:"hidden" }}>
          {d.summary&&<RS title="Summary" c="#1e3a5f" bc="#1e3a5f"><p style={{ color:"#444", lineHeight:1.65, margin:0 }}>{d.summary}</p></RS>}
          {d.education&&<RS title="Education" c="#1e3a5f" bc="#1e3a5f"><div style={{ whiteSpace:"pre-line", color:"#444", lineHeight:1.55 }}>{d.education}</div></RS>}
          {d.projects&&<RS title="Projects" c="#1e3a5f" bc="#1e3a5f"><div style={{ whiteSpace:"pre-line", color:"#444", lineHeight:1.55 }}>{d.projects}</div></RS>}
          {L(d.achievements).length>0&&<RS title="Achievements" c="#1e3a5f" bc="#1e3a5f">{L(d.achievements).map((a,i)=><div key={i} style={{ fontSize:9.5, color:"#444", marginBottom:4 }}>✦ {a}</div>)}</RS>}
        </div>
      </div>
    </div>
  );
}

/* ── Template 3: Executive Dark ── */
export function ExecutiveTemplate({ d }: { d: RD }) {
  const init = d.name ? d.name.trim()[0].toUpperCase() : "?";
  return (
    <div style={{ width:794, height:1123, overflow:"hidden", background:"#fff", fontFamily:"'Trebuchet MS',sans-serif", fontSize:"10.5px", lineHeight:1.45, color:"#222" }}>
      <div style={{ background:"#1a1a2e", padding:"28px 32px", display:"flex", justifyContent:"space-between", alignItems:"center", flexShrink:0 }}>
        <div style={{ overflow:"hidden" }}>
          <div style={{ fontSize:28, fontWeight:800, color:"#fff", letterSpacing:1 }}>{d.name||"Your Name"}</div>
          <div style={{ fontSize:12, color:"#c9a84c", marginTop:3, letterSpacing:2, textTransform:"uppercase" }}>{d.title||"Professional Title"}</div>
          <div style={{ display:"flex", flexWrap:"wrap", gap:16, marginTop:10, fontSize:9.5, color:"#aaa" }}>
            {d.phone&&<span>📞 {d.phone}</span>}{d.email&&<span>✉ {d.email}</span>}
            {d.linkedin&&<span>🔗 {d.linkedin}</span>}{d.location&&<span>📍 {d.location}</span>}
          </div>
        </div>
        <Avatar photo={d.photo} initial={init} size={82} bg="#2d2d4e" border="3px solid #c9a84c" color="#c9a84c"/>
      </div>
      <div style={{ display:"flex", borderTop:"4px solid #c9a84c", height:"calc(100% - 118px)", overflow:"hidden" }}>
        <div style={{ flex:1, padding:"22px 20px", display:"flex", flexDirection:"column", gap:15, overflow:"hidden" }}>
          {d.summary&&<RS title="Executive Summary" c="#c9a84c" bc="#c9a84c"><p style={{ color:"#444", lineHeight:1.7, margin:0, fontStyle:"italic" }}>{d.summary}</p></RS>}
          {d.education&&<RS title="Education" c="#c9a84c" bc="#c9a84c"><div style={{ whiteSpace:"pre-line", color:"#444", lineHeight:1.55 }}>{d.education}</div></RS>}
          {d.projects&&<RS title="Key Projects" c="#c9a84c" bc="#c9a84c"><div style={{ whiteSpace:"pre-line", color:"#444", lineHeight:1.55 }}>{d.projects}</div></RS>}
        </div>
        <div style={{ width:210, background:"#f9f6ef", padding:"22px 16px", borderLeft:"2px solid #e8dfc5", display:"flex", flexDirection:"column", gap:13, flexShrink:0, overflow:"hidden" }}>
          {C(d.skills).length>0&&<LS title="Core Skills" c="#8b6914" bc="#c9a84c">{C(d.skills).map((s,i)=><div key={i} style={{ padding:"2px 0", fontSize:9.5, color:"#333", borderBottom:"1px dotted #ccc" }}>◆ {s}</div>)}</LS>}
          {L(d.achievements).length>0&&<LS title="Achievements" c="#8b6914" bc="#c9a84c">{L(d.achievements).map((a,i)=><div key={i} style={{ fontSize:9.5, color:"#333", marginBottom:4 }}>• {a}</div>)}</LS>}
          {C(d.languages).length>0&&<LS title="Languages" c="#8b6914" bc="#c9a84c">{C(d.languages).map((l,i)=><div key={i} style={{ fontSize:9.5, color:"#333", marginBottom:2 }}>{l}</div>)}</LS>}
          {L(d.certifications).length>0&&<LS title="Certifications" c="#8b6914" bc="#c9a84c">{L(d.certifications).map((c,i)=><div key={i} style={{ fontSize:9.5, color:"#333", marginBottom:3 }}>{c}</div>)}</LS>}
        </div>
      </div>
    </div>
  );
}

/* ── Template 4: Minimal Clean ── */
export function MinimalTemplate({ d }: { d: RD }) {
  return (
    <div style={{ width:794, height:1123, overflow:"hidden", background:"#fff", fontFamily:"'Helvetica Neue',Arial,sans-serif", fontSize:"10.5px", lineHeight:1.55, color:"#222", padding:"40px 48px" }}>
      <div style={{ borderBottom:"3px solid #111", paddingBottom:18, marginBottom:22, display:"flex", justifyContent:"space-between", alignItems:"flex-end", flexShrink:0 }}>
        <div>
          <div style={{ fontSize:30, fontWeight:900, letterSpacing:-1, color:"#111" }}>{d.name||"Your Name"}</div>
          <div style={{ fontSize:12, color:"#555", marginTop:3 }}>{d.title||"Professional Title"}</div>
          <div style={{ display:"flex", flexWrap:"wrap", gap:16, marginTop:8, fontSize:9.5, color:"#777" }}>
            {d.phone&&<span>{d.phone}</span>}{d.email&&<span>{d.email}</span>}
            {d.linkedin&&<span>{d.linkedin}</span>}{d.location&&<span>{d.location}</span>}
          </div>
        </div>
        {d.photo&&<img src={d.photo} alt="profile" style={{ width:72, height:72, borderRadius:"50%", objectFit:"cover", border:"2px solid #ddd" }}/>}
      </div>
      <div style={{ display:"flex", flexDirection:"column", gap:18, overflow:"hidden" }}>
        {d.summary&&<div><div style={{ fontSize:8, fontWeight:900, letterSpacing:3, textTransform:"uppercase", color:"#111", borderBottom:"1px solid #111", paddingBottom:3, marginBottom:7 }}>Profile</div><p style={{ color:"#444", lineHeight:1.75, margin:0 }}>{d.summary}</p></div>}
        {C(d.skills).length>0&&<div><div style={{ fontSize:8, fontWeight:900, letterSpacing:3, textTransform:"uppercase", color:"#111", borderBottom:"1px solid #111", paddingBottom:3, marginBottom:7 }}>Skills</div><div style={{ display:"flex", flexWrap:"wrap", gap:5 }}>{C(d.skills).map((s,i)=><span key={i} style={{ background:"#f1f1f1", padding:"2px 9px", borderRadius:4, fontSize:9.5, color:"#333" }}>{s}</span>)}</div></div>}
        {d.education&&<div><div style={{ fontSize:8, fontWeight:900, letterSpacing:3, textTransform:"uppercase", color:"#111", borderBottom:"1px solid #111", paddingBottom:3, marginBottom:7 }}>Education</div><div style={{ whiteSpace:"pre-line", color:"#444", lineHeight:1.6 }}>{d.education}</div></div>}
        {d.projects&&<div><div style={{ fontSize:8, fontWeight:900, letterSpacing:3, textTransform:"uppercase", color:"#111", borderBottom:"1px solid #111", paddingBottom:3, marginBottom:7 }}>Projects</div><div style={{ whiteSpace:"pre-line", color:"#444", lineHeight:1.6 }}>{d.projects}</div></div>}
        {L(d.achievements).length>0&&<div><div style={{ fontSize:8, fontWeight:900, letterSpacing:3, textTransform:"uppercase", color:"#111", borderBottom:"1px solid #111", paddingBottom:3, marginBottom:7 }}>Achievements</div>{L(d.achievements).map((a,i)=><div key={i} style={{ color:"#444", marginBottom:3 }}>— {a}</div>)}</div>}
        {L(d.certifications).length>0&&<div><div style={{ fontSize:8, fontWeight:900, letterSpacing:3, textTransform:"uppercase", color:"#111", borderBottom:"1px solid #111", paddingBottom:3, marginBottom:7 }}>Certifications</div>{L(d.certifications).map((c,i)=><div key={i} style={{ color:"#444", marginBottom:2 }}>• {c}</div>)}</div>}
        {C(d.languages).length>0&&<div><div style={{ fontSize:8, fontWeight:900, letterSpacing:3, textTransform:"uppercase", color:"#111", borderBottom:"1px solid #111", paddingBottom:3, marginBottom:7 }}>Languages</div><div style={{ color:"#444" }}>{C(d.languages).join(" · ")}</div></div>}
      </div>
    </div>
  );
}

/* ── Template 5: Creative Purple ── */
export function CreativeTemplate({ d }: { d: RD }) {
  const init = d.name ? d.name.trim()[0].toUpperCase() : "?";
  return (
    <div style={{ width:794, height:1123, overflow:"hidden", background:"#fff", display:"flex", fontFamily:"Verdana,sans-serif", fontSize:"10px", lineHeight:1.45, color:"#1a1a1a" }}>
      <div style={{ width:230, background:"linear-gradient(160deg,#6d28d9,#be185d)", color:"#fff", padding:"28px 16px", display:"flex", flexDirection:"column", gap:16, flexShrink:0, overflow:"hidden", height:"100%" }}>
        <div style={{ textAlign:"center" }}>
          <div style={{ display:"flex", justifyContent:"center" }}>
            <Avatar photo={d.photo} initial={init} size={88} bg="rgba(255,255,255,0.15)" border="4px solid rgba(255,255,255,0.5)" color="#fff"/>
          </div>
          <div style={{ marginTop:12, fontSize:16, fontWeight:800, lineHeight:1.2 }}>{d.name||"Your Name"}</div>
          <div style={{ fontSize:10, color:"rgba(255,255,255,0.8)", marginTop:3 }}>{d.title||"Professional Title"}</div>
        </div>
        <div style={{ borderTop:"1px solid rgba(255,255,255,0.3)", paddingTop:12, fontSize:9.5, display:"flex", flexDirection:"column", gap:5 }}>
          {d.phone&&<div style={{ color:"rgba(255,255,255,0.9)" }}>📞 {d.phone}</div>}
          {d.email&&<div style={{ color:"rgba(255,255,255,0.9)" }}>✉ {d.email}</div>}
          {d.location&&<div style={{ color:"rgba(255,255,255,0.9)" }}>📍 {d.location}</div>}
          {d.linkedin&&<div style={{ color:"rgba(255,255,255,0.9)" }}>🔗 {d.linkedin}</div>}
        </div>
        {C(d.skills).length>0&&<LS title="Skills" c="rgba(255,255,255,0.7)" bc="rgba(255,255,255,0.3)">{C(d.skills).map((s,i)=><div key={i} style={{ background:"rgba(255,255,255,0.15)", borderRadius:4, padding:"2px 7px", fontSize:8.5, marginBottom:3 }}>{s}</div>)}</LS>}
        {C(d.languages).length>0&&<LS title="Languages" c="rgba(255,255,255,0.7)" bc="rgba(255,255,255,0.3)">{C(d.languages).map((l,i)=><span key={i} style={{ fontSize:9.5, marginRight:5, color:"rgba(255,255,255,0.9)" }}>{l}</span>)}</LS>}
        {L(d.certifications).length>0&&<LS title="Certifications" c="rgba(255,255,255,0.7)" bc="rgba(255,255,255,0.3)">{L(d.certifications).map((c,i)=><div key={i} style={{ fontSize:9, marginBottom:3, color:"rgba(255,255,255,0.85)" }}>✓ {c}</div>)}</LS>}
      </div>
      <div style={{ flex:1, padding:"28px 20px", display:"flex", flexDirection:"column", gap:15, overflow:"hidden", height:"100%" }}>
        {d.summary&&<RS title="About Me" c="#6d28d9" bc="#6d28d9"><p style={{ color:"#444", lineHeight:1.7, margin:0 }}>{d.summary}</p></RS>}
        {d.education&&<RS title="Education" c="#6d28d9" bc="#6d28d9"><div style={{ whiteSpace:"pre-line", color:"#444", lineHeight:1.55 }}>{d.education}</div></RS>}
        {d.projects&&<RS title="Projects" c="#6d28d9" bc="#6d28d9"><div style={{ whiteSpace:"pre-line", color:"#444", lineHeight:1.55 }}>{d.projects}</div></RS>}
        {L(d.achievements).length>0&&<RS title="Achievements" c="#6d28d9" bc="#6d28d9">{L(d.achievements).map((a,i)=><div key={i} style={{ color:"#444", marginBottom:4 }}>⭐ {a}</div>)}</RS>}
        {!d.name&&!d.summary&&<div style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", color:"#ccc", fontSize:13 }}>Fill in the form to preview.</div>}
      </div>
    </div>
  );
}

/* ── Template 6: Tech Dark ── */
export function TechTemplate({ d }: { d: RD }) {
  const init = d.name ? d.name.trim()[0].toUpperCase() : "?";
  return (
    <div style={{ width:794, height:1123, overflow:"hidden", background:"#0d1117", display:"flex", fontFamily:"'Courier New',monospace", fontSize:"10px", lineHeight:1.55, color:"#c9d1d9" }}>
      <div style={{ width:210, background:"#161b22", borderRight:"1px solid #30363d", padding:"24px 14px", display:"flex", flexDirection:"column", gap:16, flexShrink:0, overflow:"hidden", height:"100%" }}>
        <div style={{ display:"flex", justifyContent:"center" }}>
          <Avatar photo={d.photo} initial={init} size={80} bg="#21262d" border="2px solid #00ff88" color="#00ff88"/>
        </div>
        {C(d.skills).length>0&&<LS title="// skills" c="#6e7681" bc="#21262d">{C(d.skills).map((s,i)=><div key={i} style={{ fontSize:9, color:"#00ff88", marginBottom:2 }}>→ {s}</div>)}</LS>}
        {C(d.languages).length>0&&<LS title="// languages" c="#6e7681" bc="#21262d">{C(d.languages).map((l,i)=><div key={i} style={{ fontSize:9, color:"#79c0ff", marginBottom:2 }}>{l}</div>)}</LS>}
        {L(d.certifications).length>0&&<LS title="// certs" c="#6e7681" bc="#21262d">{L(d.certifications).map((c,i)=><div key={i} style={{ fontSize:8.5, color:"#ffa657", marginBottom:3 }}>{c}</div>)}</LS>}
        {L(d.achievements).length>0&&<LS title="// wins" c="#6e7681" bc="#21262d">{L(d.achievements).map((a,i)=><div key={i} style={{ fontSize:8.5, color:"#c9d1d9", marginBottom:3 }}>★ {a}</div>)}</LS>}
      </div>
      <div style={{ flex:1, padding:"24px 20px", display:"flex", flexDirection:"column", gap:14, overflow:"hidden", height:"100%" }}>
        <div style={{ borderBottom:"1px solid #30363d", paddingBottom:14, flexShrink:0 }}>
          <div style={{ fontSize:24, fontWeight:700, color:"#00ff88" }}>{d.name||"Your Name"}</div>
          <div style={{ fontSize:12, color:"#79c0ff", marginTop:3 }}>{d.title||"Professional Title"}</div>
          <div style={{ display:"flex", flexWrap:"wrap", gap:14, marginTop:8, fontSize:9, color:"#8b949e" }}>
            {d.phone&&<span>{d.phone}</span>}{d.email&&<span>{d.email}</span>}
            {d.linkedin&&<span>{d.linkedin}</span>}{d.location&&<span>{d.location}</span>}
          </div>
        </div>
        {d.summary&&<div><div style={{ fontSize:9, color:"#58a6ff", fontFamily:"monospace", marginBottom:5 }}>{"/* about */"}</div><p style={{ whiteSpace:"pre-line", color:"#c9d1d9", lineHeight:1.65, margin:0, paddingLeft:10, borderLeft:"2px solid #21262d" }}>{d.summary}</p></div>}
        {d.education&&<div><div style={{ fontSize:9, color:"#58a6ff", fontFamily:"monospace", marginBottom:5 }}>{"/* education */"}</div><div style={{ whiteSpace:"pre-line", color:"#c9d1d9", lineHeight:1.6, paddingLeft:10, borderLeft:"2px solid #21262d" }}>{d.education}</div></div>}
        {d.projects&&<div><div style={{ fontSize:9, color:"#58a6ff", fontFamily:"monospace", marginBottom:5 }}>{"/* projects */"}</div><div style={{ whiteSpace:"pre-line", color:"#c9d1d9", lineHeight:1.6, paddingLeft:10, borderLeft:"2px solid #21262d" }}>{d.projects}</div></div>}
        {!d.name&&!d.summary&&<div style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", color:"#30363d", fontSize:13 }}>{"// fill in the form to preview"}</div>}
      </div>
    </div>
  );
}
