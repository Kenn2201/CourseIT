# 🎓 CourseIT Ai

> **Action-First Documentation Summarizer for Developers with Finite Attention Spans.**  
> Turn dense documentation, manuals, and scanned tutorial images into structured, bite-sized learning courses with zero AI fluff.

[![CourseIT Ai Banner](https://raw.githubusercontent.com/kennnacario/portfolio-kenn/master/project-3-CourseIT/public/favicon.ico)](https://courseitai.kenncode.me)
![Version](https://img.shields.io/badge/version-v1.11.1--LIVE--Beta-indigo.svg)
[![Last Commit](https://img.shields.io/badge/last%20commit-20e56c6-purple.svg)](https://github.com/Kenn2201/CourseIT/commits/master)
[![Versioning Policy](https://img.shields.io/badge/policy-VERSIONING.md-blue.svg)](VERSIONING.md)
[![Changelog](https://img.shields.io/badge/changelog-CHANGELOG.md-emerald.svg)](CHANGELOG.md)
![React](https://img.shields.io/badge/React-19-61dafb.svg?logo=react)
![Vite](https://img.shields.io/badge/Vite-6.4.3-646CFF.svg?logo=vite)
![Netlify](https://img.shields.io/badge/Netlify-Serverless-00C7B7.svg?logo=netlify)
![Tailwind](https://img.shields.io/badge/TailwindCSS-v4-38b2ac.svg?logo=tailwind-css)
![Appwrite](https://img.shields.io/badge/Appwrite-Cloud%20Sydney-FD366E.svg?logo=appwrite)
![Gemini](https://img.shields.io/badge/Google%20Gemini-Flash%20Lite%20%7C%203.5%20%7C%203.6%20%7C%203.7-4285F4.svg?logo=google)
![Resend](https://img.shields.io/badge/Resend-Verified%20Domain-black.svg?logo=resend)

---

## 📜 Versioning, Changelog & Audit Trail

CourseIT Ai maintains a strict single source of truth for all releases:
* **Current Production Version**: `v1.11.1 LIVE Beta` ([`src/constants/version.js`](src/constants/version.js))
* **Release Checklist & Policy**: [**VERSIONING.md**](VERSIONING.md)
* **Comprehensive Historical Changelog**: [**CHANGELOG.md**](CHANGELOG.md)
* **Latest Production Commit**: [`20e56c6`](https://github.com/Kenn2201/CourseIT/commits/master)

### Recent Release Notes

* **v1.11.1 LIVE Beta (September 17, 2026)** — *Serverless Production Hotfix & Connected Documentation*:
  * **Netlify 502 Bad Gateway Serverless Fix**: Resolved AWS Lambda read-only filesystem crash (`EROFS`) by directing runtime fallback files to `os.tmpdir()` (`/tmp/courseit_data`), wrapped file system access in `try / catch`, and aligned parameter signatures in `netlify/functions/api.js`.
  * **Appwrite Auth Decoupling & Sydney Cloud Parity**: Decoupled pure authentication from database collection dependencies, defaulted to Sydney (`syd1`) cloud region, and injected build-time `define` fallbacks in `vite.config.js` for both `VITE_` and standard environment variables.
  * **Netlify Build Syntax Hardening**: Removed invalid `timeout = 30` scalar syntax from `netlify.toml` and verified `node_bundler = "esbuild"` with `external_node_modules = ["jsdom"]`.
  * **Semantic Versioning Synchronization**: Synchronized version identifiers, release checklists, and git commit references across `src/constants/version.js`, `package.json`, `src/data/changelog.js`, `CHANGELOG.md`, `VERSIONING.md`, and `README.md`.

* **v1.11.0 LIVE (September 17, 2026)** — *Production Live Release & Security Hardening*:
  * **Universal Netlify Serverless API**: Created `netlify/functions/api.js` and configured `netlify.toml` wildcard routing to serve all 11 backend REST endpoints in serverless execution with Appwrite session JWT verification.
  * **Public Repo Credential Scrubbing**: Removed all raw project, database, and collection IDs from tracked configuration and source files, migrating strictly to environment variables with zero hardcoded fallbacks.
  * **Platform Maintenance Mode & Admin Bypass**: Implemented `src/pages/Maintenance.jsx` with animated status pills, countdown, Admin Bypass modal, and dynamic administrative toggle in `Admin.jsx`.
  * **Profile Overhaul & Custom Avatar Photo Upload**: Built client-side custom profile picture uploader with 256x256 cover cropping and JPEG compression, instant cross-component synchronization, and preserved preset icons.
  * **Account Summary & Workspace Metrics**: Replaced redundant course list with live telemetry cards (custom syntheses count isolated from starters, reasoning credits, tokens processed) and direct callout to Studio Dashboard.
  * **Login Modal & Autocomplete Polish**: Protected `AdminModal.jsx` from unhandled exceptions on session refresh with `try / catch / finally`, added explicit `autoComplete` attributes, and enforced viewport scroll locks.
  * **Global Rebranding & Tech Badges**: Standardized identity to **CourseIT Ai** across document titles, page headers, Navbar, and added "Powered by Netlify • Appwrite • Google Gemini • Resend" badge strip in `Footer.jsx`.

* **v1.10.0-beta (September 17, 2026)** — *Guest Flow Restoration & Platform Polish*:
  * **Guest Flow Regression Fix**: Prevented unauthenticated guest requests from triggering Appwrite JWT session errors, fixed 404s on locally-stored guest courses, and eliminated the Private Course authentication block for guest visitors.
  * **Zero-Fluff System Instruction & Imperative Steps**: Hardened LLM system prompt with strict negative constraints (banning conversational padding like "In this section") and mandating imperative verbs and runnable code snippets.
  * **Modern IDE Code Block UI**: Upgraded code snippet blocks with macOS-style window controls, dynamic language syntax badges (Bash, Dockerfile, GDScript, Rust, TypeScript, Python), and one-click copy functionality.
  * **Rich Starter Course Snippets & Live Scripted Companion**: Completely populated runnable code snippets and implementation guides for Docker, React 19, Rust, and Godot starter courses; updated CourseTutor "Show Code" to display real verified syntax.
  * **Structured Catalog & Attribution Consistency**: Separated the dashboard into Curated Starters and Community & Custom Courses with clear author attribution across all views.

* **v1.9.0-beta (September 17, 2026)** — *Security Audit & Auth Hardening*:
  * **Unified AuthContext**: Eliminated stale `localStorage` desyncs and hardcoded admin fallbacks; established live Appwrite session as single source of truth across the entire app.
  * **Backend Appwrite JWT Verification**: Enforced cryptographic JWT session authentication across all 8 `/api/admin/*` endpoints and course deletions in `vite.config.js`.
  * **Strict Course ACL & Starter Isolation**: Namespaced public starter catalog with `starter-` prefix and strictly restricted custom courses to verified authors and administrators.
  * **Interactive Settings Engine**: Live controls for Color Theme, ADHD Anti-Fluff Level, and Default Model Preference synced with course generation.

---

## ⚡ What is CourseIT Ai?

Standard technical documentation is often filled with introductory scene-setting, marketing fluff, and wall-of-text explanations that trigger cognitive fatigue. 

**CourseIT Ai solves developer ADHD and information overload** by transforming any documentation URL or scanned image into an **action-first, numbered curriculum**:

* **One Concept per Step**: Never bundles multiple concepts together.
* **No Scene-Setting**: Immediately starts with the action or CLI command.
* **Concrete Time Estimates**: Each step includes an actionable estimate (e.g. `~5 min`).
* **Verified Code Snippets**: Runnable syntax with zero placeholders.
* **Pro Tips & Gotchas**: Callouts of common pitfalls and edge cases.
* **Client-Side OCR (Tesseract.js)**: Drag & drop scanned textbook pages, notes, or screenshots for instant local text extraction.
* **Multi-Format Export**: Export your course into clean **Markdown (.md)**, **Word Document (.doc)**, or formatted **PDF** textbook.
* **Scripted Technical Companion Tutor**: Embedded interactive assistant with 4 instant scripted action chips ("Explain simply", "Show code", "Common gotchas", "Quick quiz").

---

## 🛠️ Technology Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend** | React 19 + Vite 6 | Reactive interface with StrictMode resilience and lazy initialization |
| **Styling** | Tailwind CSS v4 + Vanilla CSS | Curated dark & light modes with custom glassmorphism and print rules |
| **Serverless Backend** | Netlify Functions (Node 22) | Universal serverless API router with JWT session verification |
| **Extraction** | Mozilla Readability + JSDOM | High-speed server-side HTML scraping and article isolation |
| **OCR** | Tesseract.js | In-browser client-side optical character recognition |
| **AI Models** | Google Gemini SDK (`@google/generative-ai`) | Multi-tier reasoning: Flash Lite, Gemini 3.5, 3.6, and 3.7 Flash |
| **Auth & Database** | Appwrite Cloud (Sydney `syd1`) | OAuth2 (Google & GitHub), email auth, quotas, document storage |
| **Email Delivery** | Resend API | Transactional emails dispatched from `CourseIT <hello@courseit.kenncode.me>` |
| **Hosting & CI/CD** | Netlify | Automated continuous deployment directly connected to GitHub |

---

## 🚀 Getting Started

### 1. Prerequisites

Ensure you have the following installed on your machine:
* [Node.js](https://nodejs.org/) `>= 18.0.0` (Recommended: `v22.x`)
* [npm](https://www.npmjs.com/) `>= 9.x`
* [Git](https://git-scm.com/)

---

### 2. Clone the Repository

```bash
git clone https://github.com/Kenn2201/CourseIT.git
cd CourseIT
```

---

### 3. Install Dependencies

```bash
npm install
```

---

### 4. Configure Environment Variables

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Open `.env` and fill in your credentials:

```env
# LLM Configuration (Google Gemini)
LLM_PROVIDER=gemini
LLM_API_KEY=your_gemini_api_key_here

# Appwrite Cloud (Sydney syd1)
VITE_APPWRITE_ENDPOINT=https://syd.cloud.appwrite.io/v1
VITE_APPWRITE_PROJECT_ID=your_project_id
VITE_APPWRITE_DATABASE_ID=your_database_id
VITE_APPWRITE_COLLECTION_ID=your_collection_id

# Appwrite Server API Key (for server handlers)
APPWRITE_ENDPOINT=https://syd.cloud.appwrite.io/v1
APPWRITE_PROJECT_ID=your_project_id
APPWRITE_DATABASE_ID=your_database_id
APPWRITE_COLLECTION_ID=your_collection_id
APPWRITE_API_KEY=your_appwrite_server_key

# Resend Transactional Emailer
RESEND_API_KEY=re_your_resend_api_key
RESEND_FROM_EMAIL=CourseIT <hello@courseit.kenncode.me>

# Platform Administrator Email
ADMIN_EMAIL=your_admin_email@example.com
VITE_ADMIN_EMAIL=your_admin_email@example.com
```

---

### 5. Run the Local Development Server

```bash
npm run dev
```

Visit [`http://localhost:5173`](http://localhost:5173) in your browser.

---

## 🌐 Netlify Production Deployment

To connect and deploy the repository to Netlify:

1. **Import Project**: Log in to Netlify, click **Add new site > Import an existing project**, and select your GitHub repository (`Kenn2201/CourseIT`).
2. **Build Settings**:
   * **Build command**: `npm run build`
   * **Publish directory**: `dist`
   * **Functions directory**: `netlify/functions` (auto-detected via `netlify.toml`)
3. **Environment Variables**: Under **Site configuration > Environment variables**, add all environment variables listed above.
4. **Trigger Clean Deploy**: If environment variables are added or changed, click **Deploys > Trigger deploy > Clear cache and deploy site** to ensure Vite compiles the frontend bundle with the latest values.

---

## 🌲 Git Branching Strategy

The repository follows a clean branch workflow:

| Branch | Purpose |
| :--- | :--- |
| `master` | Stable, production-ready releases deployed to Netlify. |
| `kenn/develop` | Active development, feature iterations, and beta testing. |

---

## 🧩 Key Architecture Highlights

```
project-3-CourseIT/
├── netlify/
│   └── functions/
│       └── api.js        # Universal serverless REST API function for Netlify deployment
├── server/
│   ├── handler.js        # Core business logic: Appwrite sync, quotas, emailer, safe fallback
│   ├── llm.js            # Google Gemini SDK integration with AST structural zero-fluff prompts
│   ├── extract.js        # Web scraper with Readability content purification
│   └── data/             # Local fallback JSON stores (users_quota, token_usage, feedback)
├── src/
│   ├── components/       # Reusable UI components
│   │   ├── CourseTutor.jsx      # Scripted technical companion tutor
│   │   ├── UrlInputForm.jsx     # URL & OCR input with locked tier cross-out & modal
│   │   ├── StepItem.jsx         # Numbered step card with code blocks & checklists
│   │   ├── AdminModal.jsx       # Auth modal with OAuth, email login, and freeze protection
│   │   └── Navbar.jsx           # Global header with dynamic avatar sync & credit badge
│   ├── pages/
│   │   ├── Landing.jsx          # Public showcase page with embedded tutor & anti-fluff comparison
│   │   ├── Dashboard.jsx        # Course catalog, live quota counter, generation pipeline
│   │   ├── CourseDetail.jsx     # Full learning path with Export (PDF / DOCX / MD)
│   │   ├── Profile.jsx          # Custom PFP photo upload & workspace telemetry metrics
│   │   ├── Admin.jsx            # Admin operations & Maintenance mode toggle
│   │   └── Maintenance.jsx      # Animated maintenance status screen with Admin Bypass
│   ├── constants/
│   │   ├── version.js           # Single source of truth for versioning (v1.11.0 LIVE)
│   │   └── presets.js           # Curated avatar presets
│   ├── lib/
│   │   ├── appwrite.js          # Appwrite client SDK initialization with resilient fallbacks
│   │   ├── auth.js              # Auth & session guards with ensureAccount lazy init
│   │   └── ocr.js               # Client-side Tesseract.js image/PDF worker
│   └── data/
│       ├── changelog.js         # Interactive version history source of truth
│       └── starterCourses.js    # Built-in public cross-ecosystem templates
├── netlify.toml          # Netlify build, redirects, and function bundler config
├── vite.config.js        # Vite build config + local dev API middleware + env define
└── package.json
```

---

## 🛡️ License

Built with ❤️ by [Kenn Nacario](https://kenncode.me) for developers who value their time.  
Licensed under the [MIT License](LICENSE).
