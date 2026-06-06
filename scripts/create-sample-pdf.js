/**
 * Run with: node scripts/create-sample-pdf.js
 * Generates public/sample-resume.pdf – a realistic text-based resume
 * for testing the HireTrack PDF Analyser.
 */

const fs = require("fs");
const path = require("path");

// ── Minimal raw PDF builder ────────────────────────────────────────────────
function createPDF(pages) {
  const objs = [];
  let offset = 0;
  const offsets = [];

  const push = (obj) => {
    offsets.push(offset);
    const s = obj + "\n";
    offset += Buffer.byteLength(s, "latin1");
    objs.push(s);
  };

  const header = "%PDF-1.4\n";
  offset += Buffer.byteLength(header, "latin1");

  // Object 1 – Catalog
  push("1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj");
  // Object 2 – Pages (placeholder, fixed below)
  push(`2 0 obj\n<< /Type /Pages /Kids [${pages.map((_, i) => `${3 + i * 2} 0 R`).join(" ")}] /Count ${pages.length} >>\nendobj`);

  const contentObjectNums = [];
  pages.forEach((lines, pi) => {
    const pageObjNum  = 3 + pi * 2;
    const contentNum  = 4 + pi * 2;
    contentObjectNums.push(contentNum);

    // Build stream
    const streamLines = [
      "BT",
      "/F1 10 Tf",
      "1 0 0 1 50 780 Tm",
      "12 TL",
    ];
    const safe = (t) => t.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
    let y = 780;
    lines.forEach((line) => {
      if (line === "---") {
        // divider – just extra space
        streamLines.push("T*");
        y -= 12;
      } else {
        streamLines.push(`(${safe(line)}) Tj T*`);
        y -= 12;
      }
    });
    streamLines.push("ET");
    const stream = streamLines.join("\n");
    const streamBytes = Buffer.byteLength(stream, "latin1");

    // Content stream object
    push(`${contentNum} 0 obj\n<< /Length ${streamBytes} >>\nstream\n${stream}\nendstream\nendobj`);
    // Page object
    push(`${pageObjNum} 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents ${contentNum} 0 R /Resources << /Font << /F1 << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> >> >> >>\nendobj`);
  });

  // Cross-reference table
  const xrefOffset = offset + Buffer.byteLength(header, "latin1");
  const totalObjs  = 1 + objs.length;

  let xref = `xref\n0 ${totalObjs}\n0000000000 65535 f \n`;
  let running = Buffer.byteLength(header, "latin1");
  objs.forEach((_, i) => {
    xref += String(offsets[i] + Buffer.byteLength(header, "latin1")).padStart(10, "0") + " 00000 n \n";
    running += Buffer.byteLength(objs[i], "latin1");
  });

  const trailer = `trailer\n<< /Size ${totalObjs} /Root 1 0 R >>\nstartxref\n${running + Buffer.byteLength(xref, "latin1") + Buffer.byteLength(header, "latin1")}\n%%EOF`;

  // Recalculate startxref properly
  let pos = Buffer.byteLength(header, "latin1");
  objs.forEach((o) => { pos += Buffer.byteLength(o, "latin1"); });
  const xrefBuf = Buffer.from(xref, "latin1");
  const correct = `xref\n0 ${totalObjs}\n0000000000 65535 f \n`;

  const finalXrefOffset = pos;
  const body = objs.join("");
  const xrefSection = buildXref(totalObjs, header, body);
  const finalTrailer = `trailer\n<< /Size ${totalObjs} /Root 1 0 R >>\nstartxref\n${finalXrefOffset}\n%%EOF\n`;

  return Buffer.from(header + body + xrefSection + finalTrailer, "latin1");
}

function buildXref(totalObjs, header, body) {
  // simple sequential xref
  const headerLen = Buffer.byteLength(header, "latin1");
  // we only need it structurally correct enough to be readable
  let s = `xref\n0 1\n0000000000 65535 f \n`;
  return s;
}

// ── Because implementing a full PDF from scratch is complex,
//    we write a well-known minimal hardcoded valid PDF binary:
function buildResumePDF() {
  const lines = [
    "AFSAL S",
    "Aspiring Software Engineer | First-Year CSE Student",
    "Phone: +91 7907785467  |  Email: s.afsal68@gmail.com",
    "LinkedIn: linkedin.com/in/afsal-s  |  Location: Trivandrum, Kerala",
    "---",
    "PROFESSIONAL SUMMARY",
    "Aspiring Software Engineer and first-year B.Tech Computer Science student at",
    "the College of Engineering Chengannur (2025-2029). Passionate about building",
    "scalable web applications and solving algorithmic challenges. Quick learner",
    "with hands-on experience in Python, JavaScript, and React.",
    "---",
    "TECHNICAL SKILLS",
    "Languages    : Python, JavaScript, TypeScript, C, SQL",
    "Frameworks   : React.js, Next.js, Node.js, Express.js",
    "Databases    : PostgreSQL, MySQL, SQLite",
    "Tools        : Git, GitHub, Docker, VS Code, Postman",
    "Cloud        : AWS (beginner), Vercel, Netlify",
    "---",
    "EDUCATION",
    "Bachelor of Technology - Computer Science and Engineering",
    "College of Engineering Chengannur, Kerala",
    "Expected Graduation: 2029  |  Current CGPA: 8.4 / 10",
    "---",
    "PROJECTS",
    "1. HireTrack – AI Mock Interview Platform (Personal Project)",
    "   Tech: Next.js, TypeScript, Prisma, SQLite, Google Gemini API",
    "   - Built a full-stack SaaS platform for AI-driven technical interview practice",
    "   - Integrated Gemini AI for dynamic question generation and answer evaluation",
    "   - Implemented speech-to-text, TTS, and face expression analysis features",
    "   - Achieved sub-2s response time via optimised API routes",
    "",
    "2. E-Commerce Price Tracker (College Project)",
    "   Tech: Python, BeautifulSoup, PostgreSQL, Telegram Bot API",
    "   - Scraped 500+ product pages daily from Amazon and Flipkart",
    "   - Sent automated price-drop alerts via Telegram to 120 beta users",
    "   - Reduced manual tracking effort by 90% for users",
    "---",
    "ACHIEVEMENTS & CERTIFICATIONS",
    "- HackerRank: Gold Badge in Python, Silver Badge in Problem Solving",
    "- Completed 45 LeetCode problems (Easy: 20, Medium: 25)",
    "- Certificate: Data Structures and Algorithms – Simplilearn (2024)",
    "- Certificate: Python Programming – HackerRank (2024)",
    "- Contributed to 5 open-source projects on GitHub",
    "- Organised college coding bootcamp with 80+ participants",
    "---",
    "LANGUAGES",
    "English (Advanced) | Malayalam (Native) | Hindi (Intermediate)",
    "---",
    "INTERESTS",
    "Competitive Programming | Open Source Development | Machine Learning | Chess",
  ];

  // Use a known-good PDF template with embedded text
  // This is a valid minimal PDF that pdf-parse can read
  const streamContent = [
    "BT",
    "/F1 13 Tf",
    "50 760 Td",
    "(AFSAL S) Tj",
    "/F1 9 Tf",
    "0 -18 Td",
    "(Aspiring Software Engineer | First-Year CSE Student | B.Tech CSE 2025-2029) Tj",
    "0 -14 Td",
    "(Phone: +91-7907785467  |  Email: s.afsal68@gmail.com  |  Location: Trivandrum) Tj",
    "0 -14 Td",
    "(LinkedIn: linkedin.com/in/afsal-s  |  GitHub: github.com/afsal-s) Tj",
    "0 -20 Td",
    "/F1 11 Tf",
    "(PROFESSIONAL SUMMARY) Tj",
    "/F1 9 Tf",
    "0 -14 Td",
    "(Passionate first-year B.Tech CSE student with strong fundamentals in Python,) Tj",
    "0 -13 Td",
    "(JavaScript and React. Built HireTrack - a full-stack AI mock interview SaaS.) Tj",
    "0 -13 Td",
    "(Quick learner with hands-on project experience and competitive programming skills.) Tj",
    "0 -20 Td",
    "/F1 11 Tf",
    "(TECHNICAL SKILLS) Tj",
    "/F1 9 Tf",
    "0 -14 Td",
    "(Languages: Python, JavaScript, TypeScript, C, SQL) Tj",
    "0 -13 Td",
    "(Frameworks: React.js, Next.js, Node.js, Express.js, Prisma ORM) Tj",
    "0 -13 Td",
    "(Databases: PostgreSQL, MySQL, SQLite) Tj",
    "0 -13 Td",
    "(Tools: Git, Docker, VS Code, Postman, GitHub Actions) Tj",
    "0 -13 Td",
    "(Cloud: AWS \\(beginner\\), Vercel, Netlify) Tj",
    "0 -20 Td",
    "/F1 11 Tf",
    "(EDUCATION) Tj",
    "/F1 9 Tf",
    "0 -14 Td",
    "(B.Tech Computer Science and Engineering) Tj",
    "0 -13 Td",
    "(College of Engineering Chengannur, Kerala | 2025 - 2029 | CGPA: 8.4/10) Tj",
    "0 -20 Td",
    "/F1 11 Tf",
    "(PROJECTS) Tj",
    "/F1 9 Tf",
    "0 -14 Td",
    "(1. HireTrack - AI Mock Interview Platform \\(Next.js, Prisma, Gemini AI\\)) Tj",
    "0 -13 Td",
    "(   Built a full-stack SaaS for AI-driven technical interview simulation.) Tj",
    "0 -13 Td",
    "(   Integrated speech recognition, TTS, face expression analysis.) Tj",
    "0 -13 Td",
    "(   Achieved sub-2s API response time with optimised Next.js routes.) Tj",
    "0 -14 Td",
    "(2. E-Commerce Price Tracker \\(Python, BeautifulSoup, Telegram Bot API\\)) Tj",
    "0 -13 Td",
    "(   Scraped 500+ product pages daily, sent alerts to 120 beta users.) Tj",
    "0 -13 Td",
    "(   Reduced manual price tracking effort by 90% for regular shoppers.) Tj",
    "0 -20 Td",
    "/F1 11 Tf",
    "(ACHIEVEMENTS & CERTIFICATIONS) Tj",
    "/F1 9 Tf",
    "0 -14 Td",
    "(HackerRank Gold Badge in Python | Silver Badge in Problem Solving) Tj",
    "0 -13 Td",
    "(Completed 45 LeetCode problems \\(Easy: 20, Medium: 25\\)) Tj",
    "0 -13 Td",
    "(Certificate: Data Structures and Algorithms - Simplilearn \\(2024\\)) Tj",
    "0 -13 Td",
    "(Certificate: Python Programming - HackerRank \\(2024\\)) Tj",
    "0 -13 Td",
    "(Contributed to 5 open-source GitHub projects) Tj",
    "0 -20 Td",
    "/F1 11 Tf",
    "(LANGUAGES) Tj",
    "/F1 9 Tf",
    "0 -14 Td",
    "(English \\(Advanced\\) | Malayalam \\(Native\\) | Hindi \\(Intermediate\\)) Tj",
    "ET",
  ].join("\n");

  const streamLen = Buffer.byteLength(streamContent, "utf8");

  const pdf = [
    "%PDF-1.4",
    "1 0 obj",
    "<< /Type /Catalog /Pages 2 0 R >>",
    "endobj",
    "2 0 obj",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "endobj",
    "3 0 obj",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792]",
    "   /Contents 4 0 R",
    "   /Resources << /Font << /F1 << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> >> >> >>",
    "endobj",
    "4 0 obj",
    `<< /Length ${streamLen} >>`,
    "stream",
    streamContent,
    "endstream",
    "endobj",
  ];

  const body = pdf.join("\n") + "\n";

  // Build accurate xref
  const offsets = [];
  let pos = 0;
  const lineOffsets = [];
  const rawLines = body.split("\n");

  // We just need the byte offsets of each "N 0 obj" declaration
  let bytePos = 0;
  for (const line of rawLines) {
    if (/^\d+ 0 obj/.test(line)) {
      lineOffsets.push(bytePos);
    }
    bytePos += Buffer.byteLength(line + "\n", "latin1");
  }

  const xref = [
    "xref",
    `0 5`,
    "0000000000 65535 f ",
    ...lineOffsets.map((o) => String(o).padStart(10, "0") + " 00000 n "),
  ].join("\n") + "\n";

  const startxref = Buffer.byteLength(body, "latin1");
  const trailer = `trailer\n<< /Size 5 /Root 1 0 R >>\nstartxref\n${startxref}\n%%EOF\n`;

  return body + xref + trailer;
}

// ── Write to public/ ───────────────────────────────────────────────────────
const outDir  = path.join(__dirname, "..", "public");
const outFile = path.join(outDir, "sample-resume.pdf");

if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

const pdfContent = buildResumePDF();
fs.writeFileSync(outFile, pdfContent, "latin1");

console.log(`✅ Sample resume PDF written to: ${outFile}`);
console.log(`   Size: ${(fs.statSync(outFile).size / 1024).toFixed(1)} KB`);
