<div align="center">

<br/>

```
██╗  ██╗██╗██████╗ ███████╗████████╗██████╗  █████╗  ██████╗██╗  ██╗
██║  ██║██║██╔══██╗██╔════╝╚══██╔══╝██╔══██╗██╔══██╗██╔════╝██║ ██╔╝
███████║██║██████╔╝█████╗     ██║   ██████╔╝███████║██║     █████╔╝
██╔══██║██║██╔══██╗██╔══╝     ██║   ██╔══██╗██╔══██║██║     ██╔═██╗
██║  ██║██║██║  ██║███████╗   ██║   ██║  ██║██║  ██║╚██████╗██║  ██╗
╚═╝  ╚═╝╚═╝╚═╝  ╚═╝╚══════╝   ╚═╝   ╚═╝  ╚═╝╚═╝  ╚═╝ ╚═════╝╚═╝  ╚═╝
```

### 🤖 AI-Powered Mock Interview Platform for the Next Generation of Developers

[![Next.js](https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?style=for-the-badge&logo=prisma)](https://prisma.io)
[![Google Gemini](https://img.shields.io/badge/Gemini-AI-4285F4?style=for-the-badge&logo=google&logoColor=white)](https://ai.google.dev)

<br/>

> *"Practice like you've never won. Perform like you've never lost."*

</div>

---

## 🎯 What is HireTrack?

**HireTrack** is a full-stack, production-ready SaaS platform that simulates real-world technical interviews using **Google Gemini AI**. Whether you're grinding DSA, prepping for system design rounds, or polishing your HR answers — HireTrack is your 24/7 AI interviewer that never gets tired, never judges, and always gives you honest feedback.

Stop doing mock interviews with friends who don't know what they're talking about. **Interview with AI. Get hired for real.**

---

## ✨ Features at a Glance

| Feature | Description |
|--------|-------------|
| 🤖 **AI Interviewer** | Powered by Google Gemini — asks dynamic, adaptive questions |
| 💻 **Monaco Code Editor** | VS Code-like environment with Java, Python & C++ support |
| 📊 **Instant AI Feedback** | Score, strengths, weaknesses & improvement roadmap per answer |
| 📄 **Resume Parsing** | Upload your PDF resume; AI generates personalized questions |
| 🎭 **Multi-Domain Support** | DSA · Web Dev · ML · System Design · HR |
| 📈 **Performance Dashboard** | Track progress over time with detailed analytics |
| 🔐 **Auth System** | Google OAuth + Email/Password via NextAuth.js |
| 🌙 **Dark / Light Mode** | Eye-friendly UI with smooth Framer Motion animations |
| 📱 **Fully Responsive** | Seamless experience on desktop, tablet & mobile |

---

## 🧠 Interview Domains

```
┌──────────────────────────────────────────────────────────┐
│                                                          │
│   🧩 DSA          →  Arrays, Trees, DP, Graphs...        │
│   🌐 Web Dev       →  React, APIs, CSS, Optimization...  │
│   🤖 ML / AI       →  Models, Math, PyTorch, CNNs...     │
│   🏗️  System Design →  HLD, LLD, Scalability, DBs...      │
│   🤝 HR            →  Behavioural, Culture Fit...         │
│                                                          │
│   Difficulty:  🟢 Easy   🟡 Medium   🔴 Hard             │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

---

## 🛠️ Tech Stack

### Frontend
- **[Next.js 14](https://nextjs.org)** — App Router, Server Components
- **[TypeScript](https://www.typescriptlang.org)** — End-to-end type safety
- **[Tailwind CSS](https://tailwindcss.com)** + **[ShadCN UI](https://ui.shadcn.com)** — Beautiful, accessible components
- **[Framer Motion](https://www.framer.com/motion)** — Silky smooth animations
- **[Zustand](https://zustand-demo.pmnd.rs)** — Lightweight state management
- **[React Hook Form](https://react-hook-form.com)** + **[Zod](https://zod.dev)** — Form handling & validation
- **[Monaco Editor](https://microsoft.github.io/monaco-editor)** — Embedded code editor

### Backend & Database
- **[Next.js API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)** — Serverless API endpoints
- **[Prisma ORM](https://prisma.io)** — Type-safe database access
- **[SQLite](https://www.sqlite.org)** (dev) / **PostgreSQL** (prod) — Flexible database layer
- **[NextAuth.js](https://next-auth.js.org)** — Authentication & sessions

### AI & Integrations
- **[Google Generative AI (Gemini)](https://ai.google.dev)** — Interview engine & feedback
- **[pdf-parse](https://www.npmjs.com/package/pdf-parse)** — Resume PDF extraction
- **[face-api.js](https://github.com/vladmandic/face-api)** — Facial proctoring support
- **[jsPDF](https://github.com/parallax/jsPDF)** + **[html2canvas](https://html2canvas.hertzen.com)** — Report export

---



### 3. Configure Environment Variables

```bash
cp .env.example .env
```

Open `.env` and fill in your values:

```env
# Database
DATABASE_URL="file:./dev.db"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-here"

# Google OAuth
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# Google Gemini AI
GEMINI_API_KEY="your-gemini-api-key"
```

### 4. Set Up the Database

```bash
npx prisma migrate dev --name init
npx prisma generate
```

### 5. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser. 🎉

---

## 📁 Project Structure

```
HireTrack/
├── 📂 prisma/
│   └── schema.prisma          # Database schema
├── 📂 public/                 # Static assets
├── 📂 src/
│   ├── 📂 app/
│   │   ├── 📂 (auth)/         # Login & Register pages
│   │   ├── 📂 (dashboard)/    # User dashboard & analytics
│   │   ├── 📂 (interview)/    # Interview engine & results
│   │   └── 📂 api/            # API route handlers
│   ├── 📂 components/
│   │   ├── 📂 dashboard/      # Dashboard widgets
│   │   ├── 📂 interview/      # Interview UI (editor, chat)
│   │   ├── 📂 providers/      # Context providers
│   │   └── 📂 ui/             # Shared ShadCN components
│   ├── 📂 hooks/              # Custom React hooks
│   ├── 📂 lib/                # Utilities, Prisma client, auth
│   └── 📂 types/              # Global TypeScript types
├── .env.example               # Environment template
├── package.json
└── README.md
```

---

## 🗺️ Roadmap

- [x] 🔐 Authentication (Google + Email/Password)
- [x] 🤖 AI Interview Engine (Gemini)
- [x] 💻 Coding Interview Mode (Monaco Editor)
- [x] 📊 AI Feedback System (per-question scoring)
- [x] 📈 Performance Dashboard
- [x] 📄 Resume Upload & Parsing
- [ ] 🎤 Voice Interview Mode (Whisper API)
- [ ] 📹 Video Recording & Proctoring
- [ ] 💳 Stripe Subscription & Billing
- [ ] 🏆 Leaderboard & Gamification
- [ ] 🔁 Interview Replay System
- [ ] 🌐 PostgreSQL Production Migration

---

## 🤝 Contributing

Contributions are welcome! Here's how to get started:

1. **Fork** this repository
2. **Create** a feature branch: `git checkout -b feature/amazing-feature`
3. **Commit** your changes: `git commit -m 'feat: add amazing feature'`
4. **Push** to the branch: `git push origin feature/amazing-feature`
5. **Open** a Pull Request

Please follow the [Conventional Commits](https://www.conventionalcommits.org) specification.

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgements

- [Google DeepMind](https://deepmind.google) for Gemini AI
- [Vercel](https://vercel.com) for the amazing Next.js framework
- [ShadCN](https://ui.shadcn.com) for the beautiful component library
- [Prisma](https://prisma.io) for making database work actually enjoyable

---

<div align="center">

**Built with ❤️ by [cse-afsal](https://github.com/cse-afsal)**

⭐ If HireTrack helped you land your dream job, give it a star!

</div>
