# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.8.0-beta] - 2026-09-17 — Consistency & Polish: Single Source of Truth for Version & Credits, Portalized Modals & Header Redesign

### Added
- **Single Source of Truth for Versioning**:
  - Created centralized constants authority (`src/constants/version.js`) exporting `CURRENT_VERSION`, `CURRENT_VERSION_LABEL`, and `RELEASE_DATE`.
  - Added repository-level `VERSIONING.md` maintenance guide for consistent release tagging.
  - Eliminated hardcoded version drift across logo pills, hero banners, footers, and modal headers.
- **Single Source of Truth for Credit Balance (`CreditContext`)**:
  - Implemented `CreditProvider` and `useUserCredits()` hook subscribed to live Appwrite quota updates and `courseit_quota_updated` events.
  - Formatted credits dynamically without artificial `/ 250` display caps.
  - Fixed backend `Math.floor` rounding bug in `server/handler.js`, preserving exact decimal deductions for Gemini Flash Lite (0.5 credits) and aligning database values with memory state.
- **Mandatory First-Login Legal Consent Flow & Audit Trail**:
  - Introduced non-dismissible `LegalConsentModal` requiring explicit agreement to Terms of Service, Privacy Policy, and Cookies.
  - Stored consent timestamp (`terms_consented_at`, `terms_version`) directly on Appwrite account preferences (`account.updatePrefs`), establishing a durable, cross-device legal audit trail.
  - Automatically launches the Changelog "What's New" modal immediately upon consent acceptance for seamless onboarding.
- **Formatted Chatbot Typography Engine (`FormattedChatText`)**:
  - Engineered zero-dependency Markdown parser in `src/components/FormattedChatText.jsx`.
  - Renders `**bold**`, `*italic*`, `` `inline code` ``, and bullet points into styled typography, replacing raw markdown syntax.

### Fixed & Hardened
- **Viewport-Centered Modal Portals**:
  - Wrapped `ChangelogModal`, `LegalConsentModal`, `TermsPrivacyModal`, and `FeedbackModal` in React `createPortal(..., document.body)`.
  - Resolved deep-scroll offset bug on long landing pages and prevented CSS transform ancestor clipping (`animate-page-load`).
- **Sidebar & Footer Layout Separation**:
  - Relocated `<Footer />` inside the main workspace column in `Dashboard.jsx`, preventing it from overlapping or spanning underneath `DashboardSidebar`.
- **Softened Light Mode & Relocated Controls**:
  - Replaced glaring white tones with soft `#f1f5f9` slate backgrounds and `#ffffff` card surfaces.
  - Audited and updated WCAG AAA/AA text contrast tokens for secondary (`.text-slate-400` -> `#475569`, `.text-slate-500` -> `#64748b`) and colored accent elements (`.text-indigo-400`, `.text-emerald-400`, `.text-amber-400`).
  - Relocated theme toggles out of the header into `DashboardSidebar` and an accessible floating widget on the landing page with clear text labels.
- **Header Redesign & Infrastructure De-identification**:
  - Consolidated separate credits badge and sign-out button into a unified user profile dropdown menu (avatar, name, live balance, studio/profile/admin links, sign out).
  - Added prominent "Dashboard →" navigation button on the public landing page when authenticated.
  - Completely removed internal infrastructure labels ("Sydney") from user-facing views.

## [1.7.0-beta] - 2026-09-17 — Dashboard Application Shell, Appwrite Serverless History, Light Mode Theming & Auth Hardening

### Fixed & Hardened
- **Bug 1: Model Picker & Tab Clickability Fix**:
  - Removed container `overflow-hidden` from `.glass-panel` in `UrlInputForm.jsx` that was clipping absolute dropdown elements.
  - Elevated z-index and isolated hitboxes so `isPending`, `isOutOfQuota`, and `isLoading` only disable generation submission, never the tab switchers or model dropdowns.
- **Bug 2: Universal Light Mode Theming**:
  - Root-caused the light mode failure: replaced non-interactive wrappers in `ThemeToggle.jsx` with a semantic, fully clickable `<button type="button">`.
  - Added comprehensive universal `html.light` CSS utility rules in `src/index.css` covering `body`, cards, panels, inputs, borders, and text across all pages (`/`, `/app`, `/course/:id`, `/admin`, `/profile`).
  - Injected an inline theme initialization script in `index.html` to eliminate theme flash on page reload.
- **Bug 3: Feedback & Chatbot Collision Avoidance**:
  - Relocated the floating Beta Feedback button to `bottom-6 right-24`, preventing visual overlap with the CourseTutor bot docked at `bottom-6 right-6`.
- **Universal Server-Side Auth Re-verification**:
  - Implemented `getAuthJwt()` in `src/lib/auth.js` leveraging Appwrite's `account.createJWT()`.
  - Added `authenticatedFetch()` that automatically injects `x-appwrite-jwt`.
  - Server endpoints (`/api/courses/delete`, `/api/user/archive`, `/api/summarize`, `/api/summarize-text`) independently verify the JWT via `verifyAppwriteSession()`.
  - Request body `userId` and `isAdmin` flags are ignored and overridden with verified session identity, preventing spoofed requests.

### Added
- **Dashboard Application Shell with Sidebar**:
  - Restructured `/dashboard` into an application shell featuring a responsive sidebar with five distinct workspaces:
    1. **Studio & Courses**: URL and Document OCR generator, prompt presets, and interactive course catalog.
    2. **Generation History & Uploads**: Searchable, filterable audit log of past prompts and uploaded OCR documents backed by Appwrite collections.
    3. **My Account & Quota**: Live balance, approval status, and link to profile manager.
    4. **Preferences**: Anti-fluff strictness level, color theme switcher, and model defaults.
    5. **Help & Docs**: ADHD anti-fluff principles and supported input formats.
- **Serverless Appwrite Collection History Architecture**:
  - Replaced ephemeral local flat files with Appwrite collection storage (`courses` collection and `course_docs` bucket), ensuring zero data loss across Netlify Functions serverless cold starts.
  - Enforced strict ACLs: users can read and delete their own history entries; administrators can audit and delete across all users.
- **Course Author Attribution & 24h Guest Purging**:
  - Added "Created by [User]" badges to course cards and detail page headers.
  - Guest/public generations automatically expire and self-delete after 24 hours via timestamp pruning in `appwrite.js`.
- **Distinct Chatbot Scopes**:
  - **Public Landing Mode (`mode="landing"`)**: "CourseIT Guide" offering interactive product FAQ chips (Anti-Fluff Engine, Supported Inputs, Model Credits, Guest 3/3 Trial).
  - **Course Detail Mode (`mode="course"`)**: "Technical Companion" providing step-focused code explanations, runnable snippets, common bugs, and concept quizzes.
- **Header Auth Controls & Session Loader**:
  - Relocated sign-in and direct sign-out controls into the persistent `Navbar.jsx` with an animated session-checking skeleton loader.
- **Landing Page Copy Clarity**:
  - Softened credit messaging from "250 Free Credits on Sign-up" to "250 Free Credits on Admin Approval".
  - Reconciled model pricing tiers to explicitly indicate Flash Lite is included in the guest trial while higher tiers require an approved beta account.

## [1.6.0-beta] - 2026-09-17 — Course Deletion Security ACL, Google OAuth Persistence & Visible Model Fallbacks

### Fixed & Secured
- **Critical Security: Public Course Deletion ACL**:
  - The delete action is strictly restricted to the course author or the admin (`kenn.nacario12@gmail.com`).
  - Public visitors and non-author users will not see the delete button in the UI (`CourseCard.jsx`, `Profile.jsx`).
  - Server-side route `/api/courses/delete` independently validates credentials against document ownership and returns `403 Forbidden` on unauthorized requests.
  - Starter catalog templates (`starter-godot-signals`, `starter-react19-rsc`, `starter-rust-ownership`, `starter-docker-prod`) are permanently protected from deletion by non-admin visitors.
- **Google OAuth 401 Session Teardown Fix**:
  - Identified and removed the destructive `account.deleteSession('current')` call inside `checkAppwriteSession()` in `src/lib/auth.js`.
  - Pending accounts remain fully authenticated (`account.get()` returns 200 OK) without having their active session terminated.
- **Changelog Date Text Layout & Overflow Fix**:
  - Redesigned `ChangelogModal.jsx` header and entry rows to use responsive wrapping (`flex-wrap`, `break-words`, `shrink-0`) so dates like "September 17, 2026" never overflow or clip across any mobile viewport width.

### Added
- **Unified Pending-Approval Flow for Google OAuth**:
  - Google OAuth signups land in the identical `pending` approval status (with 0 credits) as email signups.
  - Newly registered Google OAuth users automatically receive a Beta Access Request acknowledgement email via Resend.
  - Users in pending status see a helpful amber notice on `/dashboard`, while generation is disabled until admin approval grants 250 free credits.
- **User-Visible Model Resilience Notices**:
  - When a higher-tier model (e.g. Gemini 3.7 Flash) encounters temporary upstream 503 load and falls back to Flash Lite, the response includes `fallbackNotice`.
  - Displayed via an amber alert card in the generation success modal and on the dashboard, informing users why a lighter model was used.
  - Charges only the credit cost of the actual model used.
- **Single Source of Truth Synchronization**:
  - Both `CHANGELOG.md` and in-app `src/data/changelog.js` now contain identical, synchronized release entries.

## [1.5.0-beta] - 2026-09-17 — OAuth Token Resilience, Shared Guest Trials, Course Exports & Token Monitor

### Added
- **Google OAuth Double-Invocation Fix**:
  - Implemented `useRef(false)` execution lock in `AuthCallback.jsx` to prevent React 19 `StrictMode` from burning one-time OAuth secrets twice.
- **Real-Time Appwrite Credit Writeback**:
  - Quota deduction is strictly enforced per model and synced to the Appwrite `users_quota` collection.
- **Shared 3/3 Public Guest Trial Sandbox**:
  - URL generation and OCR document extraction share a single pool of 3 free runs per 24 hours.
  - Locked tiers (`gemini-3.5-flash-lite`, `gemini-3.6-flash`, `gemini-3.7-flash`) display struck-through text and `🔒 Beta` badges.
  - Informative trial exhaustion modal with 24-hour notice and beta access request trigger.
- **Scripted Technical Companion (`CourseTutor.jsx`)**:
  - Embedded CourseTutor on the public landing page and inside CourseDetail with zero conversational AI fluff.
- **Course Content Export (PDF, DOCX, Markdown)**:
  - 1-click export to `@media print` high-contrast PDF, formatted Word `.doc`, and clean Markdown `.md`.
- **Profile Customizer & Active Session Status**:
  - Gradient avatar selector, Appwrite Cloud Sydney active session indicator, and processed tokens metrics.
- **Admin Tester Emailer & Feedback Export**:
  - Direct email composer with dark-mode HTML templates dispatched from `hello@courseit.kenncode.me`.
  - Bulk and single-card Markdown feedback export.
- **Gemini Token & Cost Monitor**:
  - Real-time token usage and blended USD cost tracking in the Admin dashboard.

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
