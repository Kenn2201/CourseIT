# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.4.1-beta] - 2026-09-17 — ADHD Anti-Fluff Engine, User Feedback, ThemeToggle & Security Hardening

### Added
- **ADHD & Low Attention Span Anti-Fluff Positioning**:
  - Official positioning: *"Built for developers with ADHD, documentation fatigue, or low attention spans. Zero AI fluff."*
  - Interactive **AntiFluffDiff** component comparing wordy chatty LLM responses against CourseIT's direct numbered action steps (`npm install jsonwebtoken@latest`, edit `src/auth.ts:42`, etc.) with word count comparison and 1-click copy.
  - Multi-ecosystem expansion beyond Godot: curated starter documentation for React 19 / Next.js, Rust Lang, Docker Multi-Stage, and Godot 4.
- **User Beta Feedback System**:
  - Floating action button on all pages and Navbar header button for authenticated users.
  - Interactive `FeedbackModal` capturing 1–5 star ratings, feedback category (Bug, Feature Request, Documentation Quality, General UX), and feedback notes.
  - Dedicated **Beta Feedback** review tab in Admin panel with live status badges (New, In Review, Resolved, Archived).
- **PixelSwap Animated Light Mode**:
  - Ported `PixelSwap` component from `reactbits.txt` for pixelated transition between Sun ☀️ and Moon 🌙.
  - Created `ThemeToggle` with View Transitions API and localStorage persistence.
  - Comprehensive light mode theme tokens and styling in `index.css`.
- **Developer Portfolio Integration**:
  - Footer component featuring Kenn Vincent Nacario's portfolio (`https://kenncode.me`), GitHub (`@Kenn2201`), LinkedIn profile, and direct inquiry email.
  - Version info, changelog link, and terms & privacy notes.
- **Sandbox Security & Anti-Bypass Hardening**:
  - Unauthenticated guest users are strictly locked out from selecting or submitting higher-tier models (`gemini-3.5-flash-lite`, `gemini-3.6-flash`, `gemini-3.7-flash`).
  - Strict 3 URL runs and 1 OCR doc per 24 hours enforced on server.
  - Guest courses are no longer persisted into the permanent Appwrite database, protecting against public spam flooding.
  - Accurate public quota display: `Public Guest Trial: 3/3 Free Tests (Flash Lite) • 1/1 OCR (24h Window)`.
- **Verified Resend Delivery & Email Suite**:
  - Verified sender: `CourseIT <hello@courseit.kenncode.me>`.
  - Admin 1-click button to dispatch all 5 templates (Approval, Password Reset, Quota Top-Up, Welcome, Account Archived) directly to `kenn.nacario12@gmail.com` for testing.
- **Admin Details & Archive Modals**:
  - `UserDetailsModal` for inspecting users, adjusting credits (+50, +250), and approving accounts.
  - `Archived Accounts` tab in Admin panel with 1-click account reactivation.
- **Pre-Seeded Test Account**:
  - `courseit.kenn.test@yopmail.com` / `CourseIT2026!Demo` pre-seeded with 250 approved credits for end-to-end testing.

## [1.4.0-beta] - 2026-09-17 — Landing Page Separation, Step Readability & Scripted Companion

### Added
- **Dedicated Public Landing Page**:
  - Clear value proposition explaining the philosophy of "Action-First Learning Engine for Developers".
  - Dynamic interactive background using ReactBits `ShapeGrid` canvas.
  - "How It Works" 3-step workflow pipeline with `SpotlightCard` component.
  - Interactive Curated Godot 4 Starter Showcase allowing immediate exploration of demo courses.
  - Transparent Model Pricing & Credit Economy breakdown.
- **Clean Public & Authenticated State Separation**:
  - Complete logout state that thoroughly deletes Appwrite sessions and purges all localStorage session keys.
  - Logged-out visitors are cleanly routed to the rich Landing Page with zero quota leakage (`50.0/250`).
  - Authenticated users access the full generator Dashboard with their approved 250 credits.
- **Step Text Readability Revamp**:
  - Parsed messy multi-sentence implementation text into sequential vertical cards with badges (`01`, `02`, `03`).
  - Syntax highlight chips for Godot node types (`Node2D`, `Sprite2D`, `Button`, `CharacterBody2D`, etc.).
  - High-contrast typography and styled terminal GDScript blocks with 1-click copy.
  - Prominent amber Pro-Tip / Gotcha callouts.
- **Scripted Technical Companion Bot (`CourseTutor.jsx`)**:
  - Dockable course tutor focused on the active course and step.
  - 4 scripted technical action chips:
    - 💡 *Explain this step in simple terms*
    - 💻 *Show runnable GDScript code example*
    - ⚠️ *Common bugs & gotchas to avoid*
    - 🎯 *Test my knowledge / Quick quiz*
  - Eliminates generic AI fluff and provides concrete, copyable code assistance.
- **1-Click Course Deletion Modal (`DeleteConfirmModal.jsx`)**:
  - Modern confirmation modal integrated into CourseCard, Dashboard, and Profile for safe course removal.
- **Account Archiving Workflow**:
  - Dedicated "Archive Account" option in `/profile` with reason selection and feedback notes.
  - Automated confirmation email dispatched via Resend (`CourseIT <hello@courseit.kenncode.me>`) with reactivation instructions.
- **Changelog Modal Tabs**:
  - Added "What's New in v1.4.0" and "Version History" tabs in `ChangelogModal.jsx`.

## [1.3.0] - 2026-09-16 — 250 Credits, OAuth2 Token Flow, Profile & Model Cost Tiers

### Added
- **250 Course Credits Trial**: Accounts upgraded from 50 to **250 credits**, with live meter tracking in the Navbar and Profile page.
- **Appwrite OAuth2 Token Flow**: Direct integration with Appwrite's recommended `account.createOAuth2Token` and `/auth/success` callback for Google and GitHub.
- **Model Credit Pricing Tiers**:
  - `Flash Lite`: 0.5 credits (Free for public sandbox: 3 courses & 1 doc per 24 hours)
  - `Gemini 3.5 Lite`: 1.0 credit
  - `Gemini 3.6 Flash`: 2.0 credits
  - `Gemini 3.7 Flash`: 5.0 credits
- **User Profile Page (`/profile`)**: Manage account avatar, email, password reset via Resend, credit meter, and stored course prompt management.
- **Server Storage & Prompt Management**: Cap stored prompts at 100 with 1-click prompt deletion in Profile and Admin dashboard to prevent database and storage overload.
- **Guaranteed Resend Dispatching**: Configured `CourseIT <onboarding@resend.dev>` to permanently resolve 403 unverified domain issues with auto-switch to `notifications@kenncode.me`.
- **First-Time 24-Hour Changelog Modal**: Automatically displays release announcements on first visit, remembering dismissal for 24 hours.
- **Celebratory Course Completion Pop-Up (`CourseSuccessModal`)**: Dynamic metrics dialog displaying steps count, duration, and credit cost upon generation.

## [1.2.0] - 2026-09-16 — SaaS Architecture & Local Document OCR Release

### Added
- **Local Document Upload & OCR (Tesseract.js)**: Drag and drop scanned tutorial screenshots, diagrams, and text/markdown files. Extracted client-side via `tesseract.js` to preserve tokens and bypass vision model costs before generating courses.
- **Appwrite Storage Bucket (`course_docs`)**: Secure storage bucket for user-uploaded documents and image assets.
- **Account-Based Quotas (50 Credits Trial)**: Default credits increased to 50/50 for all approved users with real-time sync across Navbar and input panels.
- **Admin Approval Workflow via Resend**:
  - Protected admin dashboard (`/admin`) exclusively for `kenn.nacario12@gmail.com`.
  - Queues all user signups as `pending`.
  - One-click "Approve & Grant 50 Credits" button updates status and quota.
  - Automated approval email dispatch via Resend from `CourseIT <notifications@kenncode.me>` with fallback to `onboarding@resend.dev`.
- **Appwrite Email/Password & Social OAuth**:
  - Streamlined Email/Password signup with required confirmation message: *"Done sign up! Requested code, wait for email!"*.
  - Configured OAuth callback support for Google and GitHub.
- **Doppler Secrets Integration**: All runtime and serverless secrets (`RESEND_API_KEY`, `RESEND_FROM_EMAIL`, Appwrite credentials) synced directly to Doppler.

## [1.1.0] - 2026-09-16 — Public Release Announcement

### Added
- **Actionable Implementation Instructions & Code Snippets**: Each step now provides step-by-step editor/setup navigation (`implementation`), runnable code snippets or CLI syntax with a dedicated "Copy Code" button (`code_snippet`), and practical gotchas/tips (`pro_tip`).
- **"Recommended Next Step" Guidance**: Courses now suggest concrete follow-up projects, tutorials, or topics to tackle next, ensuring broad docs (like `index.html`) provide clear forward direction.
- **Instant URL Deduplication Cache**: Pasting previously analyzed documentation links checks the Appwrite database first, returning existing courses in <50ms with 0 tokens consumed.
- **Public Rate Limiting (20 Free Uses)**: Added fair-usage public generation credits to safeguard the Gemini Free Tier while allowing friends to test the app.
- **Admin Portal**: Integrated Appwrite Authentication (Google OAuth and Email/Password) to unlock unlimited course generation and admin controls.
- **Interactive Model Selector**: Live dropdown on the dashboard to choose between `Flash Lite (~800ms)`, `Gemini 3.5 Lite`, `Gemini 3.6 Flash`, and `Gemini 3.7 Flash`.
- **In-App "What's New" Announcement Modal**: Users and visitors can click "What's New" or the version tag in the Navbar to view release announcements.

### Changed
- Enhanced `SYSTEM_INSTRUCTION` in `server/llm.js` to demand concrete implementation details, syntax examples, and next-step recommendations.
- Upgraded `StepItem` component with collapsible rich implementation blocks, styled code terminals, and pro-tip callouts.
- Upgraded `CourseDetail` to display course overviews and recommended next step cards.

## [0.1.0] - 2026-09-16

### Added
- Initial project scaffolding with Vite, React 19, and Tailwind CSS.
- Mozilla Readability + JSDOM HTML text extraction pipeline (`server/extract.js`).
- Google Gemini API integration enforcing action-first, 5-rule prompt (`server/llm.js`).
- Appwrite Database client and server-side write integration for `courses` collection.
- Local storage fallback layer for offline/demo reliability.
- Interactive Dashboard list page with Godot 4 quick-load chips and search filter.
- Multi-phase animated extraction & summarization progress visualizer.
- Course detail page (`/course/:id`) with action-first numbered steps and interactive completion checklist.
