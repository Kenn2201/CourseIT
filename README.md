# 🎓 CourseIT

> **Action-First Documentation Summarizer for Developers with Finite Attention Spans.**  
> Turn dense documentation, manuals, and scanned tutorial images into structured, bite-sized learning courses with zero AI fluff.

[![CourseIT Banner](https://raw.githubusercontent.com/kennnacario/portfolio-kenn/master/project-3-CourseIT/public/favicon.ico)](https://courseit.kenncode.me)
![Version](https://img.shields.io/badge/version-v1.8.0--beta-indigo.svg)
![React](https://img.shields.io/badge/React-19-61dafb.svg?logo=react)
![Vite](https://img.shields.io/badge/Vite-6.4.3-646CFF.svg?logo=vite)
![Tailwind](https://img.shields.io/badge/TailwindCSS-v4-38b2ac.svg?logo=tailwind-css)
![Appwrite](https://img.shields.io/badge/Appwrite-Cloud-FD366E.svg?logo=appwrite)
![Gemini](https://img.shields.io/badge/Google%20Gemini-Flash%20Lite%20%7C%203.5%20%7C%203.6%20%7C%203.7-4285F4.svg?logo=google)
![Resend](https://img.shields.io/badge/Resend-Verified%20Domain-black.svg?logo=resend)

---

## 📜 Recent Changelog & Release Notes

All notable changes are tracked in detail in [**CHANGELOG.md**](file:///g:/files%20for%20transfers%20iidkkk/project%20web%20app/portfolio-kenn/project-3-CourseIT/CHANGELOG.md).

* **v1.8.0-beta (September 17, 2026)**:
  * **Single Source of Truth**: Unified versioning via `src/constants/version.js` and credits via `CreditContext`; eliminated backend `Math.floor` rounding bug.
  * **Mandatory First-Login Legal Consent**: Added durable Terms/Privacy consent stored on Appwrite user records for a persistent audit trail, with automatic onboarding notes.
  * **Portalized Viewport Modals**: Mounted all modals via React Portals to guarantee center alignment on deep scroll.
  * **Sidebar & Footer Separation**: Embedded footer inside workspace column, eliminating sidebar overlap.
  * **Softened Light Mode**: Soft `#f1f5f9` slate background with WCAG AAA/AA text contrast and relocated toggles.
  * **Consolidated Header & Anti-Fluff Chatbot**: User menu dropdown, prominent landing "Dashboard →" link, and Markdown typography parsing.
* **v1.7.0-beta (September 17, 2026)**:
  * Dashboard application shell with responsive sidebar, Appwrite serverless history collections, universal JWT re-verification, root-cause light mode fix, and author attributions.
  * **OAuth 401 Fix**: Removed destructive session teardown on pending status; Google OAuth users stay signed in.
  * **OAuth Pending Queue**: Google OAuth signups land in the same pending approval queue as email signups with auto-acknowledgement emails via Resend.
  * **Model Resilience Notice**: Informs users when Gemini 3.7 hits high upstream demand and seamlessly falls back to Flash Lite, charging only for the lighter tier.
  * **Mobile Changelog Fix**: Responsive date wrapping preventing text overflow at narrow viewport widths.
* **v1.5.0-beta (September 17, 2026)**:
  * StrictMode execution guard for OAuth token exchange, real-time Appwrite credit sync, shared 3/3 guest sandbox with struck-through locked tiers, embedded technical companion, PDF/DOCX/MD exports, profile customizer, and Gemini token monitor.

---

## ⚡ What is CourseIT?

Standard technical documentation is often filled with introductory scene-setting, marketing fluff, and wall-of-text explanations that trigger cognitive fatigue. 

**CourseIT solves developer ADHD and information overload** by transforming any documentation URL or scanned image into an **action-first, numbered curriculum**:

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
| **Frontend** | React 19 + Vite 6 | Lightning-fast reactive interface with StrictMode resilience |
| **Styling** | Tailwind CSS v4 + Vanilla CSS | Curated dark & light modes with custom glassmorphism and print rules |
| **Extraction** | Cheerio + Mozilla Readability | High-speed server-side HTML scraping and article isolation |
| **OCR** | Tesseract.js | In-browser client-side optical character recognition |
| **AI Models** | Google Gemini SDK (`@google/generative-ai`) | Multi-tier reasoning: Flash Lite, Gemini 3.5, 3.6, and 3.7 Flash |
| **Auth & Database** | Appwrite Cloud (Sydney `syd1`) | OAuth2 (Google & GitHub), email auth, quotas, document storage |
| **Email Delivery** | Resend API | Transactional emails dispatched from `CourseIT <hello@courseit.kenncode.me>` |
| **Secrets** | Doppler CLI / dotenv | Centralized cloud environment management |

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
git clone https://github.com/kennnacario/portfolio-kenn.git
cd portfolio-kenn/project-3-CourseIT
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
VITE_APPWRITE_COLLECTION_ID=courses

# Appwrite Server API Key (for server handlers)
APPWRITE_ENDPOINT=https://syd.cloud.appwrite.io/v1
APPWRITE_PROJECT_ID=your_project_id
APPWRITE_DATABASE_ID=your_database_id
APPWRITE_COLLECTION_ID=courses
APPWRITE_API_KEY=your_appwrite_server_key

# Resend Transactional Emailer
RESEND_API_KEY=re_your_resend_api_key
RESEND_FROM_EMAIL=CourseIT <hello@courseit.kenncode.me>
```

> **💡 Doppler Users**: If you use [Doppler](https://www.doppler.com/) for secret management, you can run `doppler setup` and launch via `doppler run -- npm run dev`.

---

### 5. Run the Local Development Server

```bash
npm run dev
```

Visit [`http://localhost:5173`](http://localhost:5173) in your browser.

---

## 🗄️ Appwrite Cloud Setup

To use persistent courses, quota tracking, and authentication, set up an Appwrite project:

1. **Create Project**: Go to [Appwrite Cloud Console](https://cloud.appwrite.io/) and create a project in the **Sydney (`syd1`)** region.
2. **Database & Collections**:
   * **Database**: Create a database (e.g. `courseit_db`).
   * **Collection 1: `courses`**:
     * `title` (string, required)
     * `source_url` (string, required)
     * `steps` (string, large, holds serialized JSON)
     * Permissions: `Any` can read; `Users` can create/update.
   * **Collection 2: `users_quota`**:
     * `user_id` (string, required)
     * `name` (string)
     * `email` (string)
     * `quota_remaining` (float or integer, default `250`)
     * `status` (string: `pending` | `approved` | `archived`)
3. **Storage Bucket**:
   * Bucket ID: `course_docs` (used to store uploaded scanned tutorial images/PDFs).
4. **OAuth 2 Providers (Optional)**:
   * Under **Auth > Settings > Social Providers**, enable **Google** and **GitHub**.
   * Add the Appwrite OAuth redirect URI to your Google Cloud Console / GitHub Developer settings.

---

## 🌲 Git Branching Strategy

The repository follows a clean branch workflow:

| Branch | Purpose |
| :--- | :--- |
| `master` | Stable, production-ready releases. |
| `kenn/develop` | Active development, feature iterations, and beta testing. |

To switch to the active development branch:

```bash
git checkout -b kenn/develop
```

---

## 🧩 Key Architecture Highlights

```
project-3-CourseIT/
├── server/
│   ├── handler.js        # Server middleware: OCR processing, Appwrite sync, quotas, emailer
│   ├── llm.js            # Google Gemini & OpenAI SDK integration with usageMetadata tracking
│   ├── extract.js        # Web scraper with Readability content purification
│   └── data/             # Local fallback JSON stores (users_quota, token_usage, feedback)
├── src/
│   ├── components/       # Reusable UI components
│   │   ├── CourseTutor.jsx      # Scripted technical companion tutor
│   │   ├── UrlInputForm.jsx     # URL & OCR input with locked tier cross-out & modal
│   │   ├── StepItem.jsx         # Numbered step card with code blocks & checklists
│   │   ├── AdminModal.jsx       # Auth modal with OAuth and email signup
│   │   └── ...
│   ├── pages/
│   │   ├── Landing.jsx          # Public showcase page with embedded tutor & anti-fluff comparison
│   │   ├── Dashboard.jsx        # Course catalog, live quota counter, generation pipeline
│   │   ├── CourseDetail.jsx     # Full learning path with Export (PDF / DOCX / MD)
│   │   ├── Profile.jsx          # Profile with avatar selector, tokens processed, active session
│   │   └── Admin.jsx            # Admin operations: Approvals, Feedback export, Emailer, Token monitor
│   ├── lib/
│   │   ├── appwrite.js          # Appwrite client SDK initialization
│   │   ├── auth.js              # Auth & session guards with OAuth StrictMode deduplication
│   │   └── ocr.js               # Client-side Tesseract.js image/PDF worker
│   └── data/
│       ├── changelog.js         # Version history source of truth
│       └── starterCourses.js    # Built-in public cross-ecosystem templates
├── vite.config.js        # Vite build config + integrated development API middleware
└── package.json
```

---

## 🛡️ License

Built with ❤️ by [Kenn Nacario](https://kenncode.me) for developers who value their time.  
Licensed under the [MIT License](LICENSE).
