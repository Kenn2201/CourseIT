# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.12.0] - 2026-09-18 — Persistent Global Maintenance Mode, UI Restoration & Admin Stability (LIVE Beta)

### Added
- **Appwrite-Backed Global Maintenance Mode**:
  - Maintenance mode flag is now stored as a system document in Appwrite Cloud (`system_maintenance_flag`) instead of browser-local `localStorage`.
  - Every browser polls Appwrite every 30 seconds — toggling maintenance from Admin Panel locks **all users globally** within ~30 seconds.
  - Same-browser toggle remains instant via local `CustomEvent` dispatch.
  - Offline / Appwrite-unavailable fallback gracefully reads from `localStorage` (stays in sync with last known Appwrite state).
  - `setMaintenanceMode()` creates the system document automatically on first use if it does not exist in the collection.

### Fixed & Hardened
- **Admin Panel Infinite Re-fetch Loop**:
  - Resolved root-cause of the Admin dashboard infinitely refreshing by replacing the `user` object (new reference every render) in `useEffect` dependencies with stable primitives `user?.id` and `user?.email`.
- **UI Restoration — Chatbot, Theme Toggle & Partner Badges**:
  - Restored `CourseTutor` chatbot launcher to the lower-left corner (`fixed bottom-6 left-6`) across all application routes.
  - Relocated the Light/Dark theme toggle into the Navbar header — always accessible regardless of scroll position.
  - Restored `Powered By` partner badges to the landing page footer via correct `showPoweredBy` prop.
- **Security Sanitization**:
  - Audited and scrubbed public-facing changelog, server handler, and documentation of internal API route paths, collection IDs, and personal emails.
  - Established `.agents/rules/versioning.md` as mandatory AI versioning protocol for all future commits.
- **Auth Diagnostics**:
  - Added `formatAuthError` diagnostic helper surfacing actionable Appwrite Web Platform CORS setup instructions when hostname is unregistered.

## [1.11.2] - 2026-09-17 — Serverless Evaluation Hotfix & Quota Engine Stabilization (LIVE Beta)

### Fixed & Hardened
- **Serverless Module Evaluation & Packaging Resilience**:
  - Eliminated serverless startup crash caused by bundler-injected module wrappers evaluating in AWS Lambda CommonJS execution environment.
  - Replaced environment-sensitive module path resolution with universal directory discovery, restoring 100% gateway uptime across all backend serverless endpoints.
  - Resolved 502 Bad Gateway failures on user quota retrieval and AI course generation in production.
- **Defensive Timeout Wrappers for Cloud Database Services**:
  - Protected backend session verification and user quota database queries with non-blocking race timeouts.
  - Guaranteed that slow external responses or cold network handshakes gracefully fall back without causing serverless function timeouts.
- **Administrator Role Verification & Storage Resiliency**:
  - Hardened administrator privilege verification and fallback directory initialization across serverless container recycling cycles.
  - Wrapped serverless quota session authentication in defensive exception handling to guarantee reliable guest and user fallbacks.

## [1.11.1] - 2026-09-17 — Serverless Production Hotfix & Connected Documentation (LIVE Beta)

### Fixed & Hardened
- **Serverless Worker Runtime & Fallback Protection**:
  - Resolved read-only filesystem crash on cloud serverless workers by directing runtime fallback data files to system temporary storage.
  - Wrapped all local file and directory access in safe exception handling blocks to guarantee serverless cold-start reliability.
  - Aligned serverless request handler parameters and function signatures with core processing pipelines.
  - Unified document extraction and OCR text synthesis within the universal serverless function router.
- **Authentication Decoupling & Cloud Parity**:
  - Decoupled pure user authentication from database collection dependencies, ensuring login and signup function smoothly even during schema migrations.
  - Configured default endpoint to the active regional cloud node.
  - Injected build-time environment mappings to automatically resolve prefixed and standard configuration variables.
  - Implemented resilient client authentication initialization with actionable setup diagnostics.
- **Serverless Build Configuration Syntax**:
  - Cleaned serverless bundler configuration syntax to guarantee reliable automated builds.
  - Enforced high-performance bundling with external module isolation.

### Documentation & Version Synchronization
- **Connected Documentation**:
  - Synchronized SemVer across version constants (`v1.11.1 LIVE Beta`), package metadata, in-app changelog, release documentation, and repository guides.
  - Linked commit references and established single source of truth guidelines.

## [1.11.0] - 2026-09-17 — Production Live Release, Netlify Serverless Routing & Security Hardening

### Security & Credential Scrubbing
- **Complete Public Repository Audit**:
  - Completely scrubbed all hardcoded project credentials, database identifiers, and collection references across configuration and source files.
  - Migrated entire platform configuration to strict environment variables with safe fallbacks ensuring no build-time crashes when credentials are absent.
  - Verified with repository-wide automated regex scanning — zero hardcoded credentials remain in tracked files.

### Backend & Deployment
- **Universal Serverless API Routing**:
  - Deployed universal serverless API router handling all backend endpoints under serverless execution with cryptographic session verification.
  - Configured wildcard path redirects routing application API requests to serverless workers.
  - Cryptographically verifies user session JWTs across all protected endpoints, preserving full parity with local development.

### Platform Features & UX
- **Platform Maintenance Mode**:
  - Implemented maintenance screen with real-time operational status indicators, countdown timers, and administrator bypass authentication.
  - Wired global maintenance route guards checking active operational environment variables and local administrative states.
  - Added interactive platform access toggle allowing authorized administrators to control public access on demand.
- **Profile Overhaul & Custom Avatar Photo Upload**:
  - Built client-side custom profile photo uploader with automatic cover cropping and compression.
  - Stored optimized image locally with instantaneous cross-component synchronization across navigation bars and profile views.
  - Preserved curated preset avatars with seamless switching.
  - Replaced redundant course lists in Profile with a comprehensive **Account Summary & Workspace Metrics** dashboard (custom syntheses count, reasoning credits, processed tokens) and direct studio access.
- **Authentication Modal Polish & Stability**:
  - Protected authentication state changes with exception handling to prevent dialog freezing on login completion.
  - Added browser autocomplete attributes (`email`, `current-password`, `new-password`, `name`) resolving DOM warnings.
  - Enforced body scroll locks and responsive centering preventing modal clipping on mobile and compact viewports.
  - Added pre-emptive session clearance during sign-in to prevent active session collision errors.
- **Global Rebranding & Tech Badges**:
  - Rebranded platform identity to **CourseIT Ai** across document titles, page headers, navigation, and footers.
  - Added tech stack partner badge strip celebrating ecosystem tools.

## [1.10.0-beta] - 2026-09-17 — Guest Flow Restoration, Anti-Fluff Enforcement & Platform Polish

### Fixed & Restored
- **Guest Flow Regression**:
  - Fixed client authentication requests to skip JWT token creation for unauthenticated guest sessions, preventing session verification scope failures.
  - Resolved guest courses directly from local storage, preventing 404 database queries and eliminating private access barrier blocks for guest visitors.
  - Allowed guest users to delete temporary guest courses locally without hitting backend authentication barriers.
  - Resolved navigation bar session refresh state synchronization on sign-in.
  - Cleaned dashboard navigation layout for unauthenticated guest visitors.

### Added & Improved
- **Anti-Fluff System Instruction**:
  - Hardened LLM system prompt with strict negative constraints (banning conversational padding like "In this section") and mandating imperative verbs and runnable code snippets.
  - Enforced single-concept step modularity with concrete execution time estimates.
- **Modern IDE Code Block UI**:
  - Designed macOS-style window controls (colored dot indicators), syntax badges, and one-click copy buttons.
  - Added dynamic language syntax detection (Dockerfile, Terminal / Bash, GDScript, Rust, TypeScript / React, JSON, Python).
- **Rich Starter Course Code Snippets & Live Scripted Companion**:
  - Added runnable code snippets, concrete implementation steps, and verified pro-tips for all curated starter courses (Docker Multi-Stage, React 19, Rust Ownership, Godot Signals).
  - Upgraded technical companion actions to present verified code snippets instead of generic placeholder text.
- **Catalog Structural Separation & Attribution Consistency**:
  - Split dashboard catalog into two distinct visual sections: "Curated Starters" and "Community & Custom Generated Courses".
  - Standardized author attribution across Course Cards, Generation History, Admin Management, and Profile with "Created by [user]" and temporary guest badges.
- **Actionable Generation Pipeline Error Handling**:
  - Replaced hanging or silent errors with actionable diagnostic messages (scraping, synthesis, or network issues) and a one-click [Try Again] button.
- **Login/Signup Modal Polish**:
  - Portaled authentication dialog directly to document body, centered input adornments, and added password visibility toggles.
- **Environment & Layout Polish**:
  - Repositioned floating feedback controls to eliminate overlap with docked technical companion.
  - Moved administrator contact configuration entirely to environment variables across frontend and server.

## [1.9.0-beta] - 2026-09-17 — Security Audit & Auth Hardening: Live Session Source of Truth, Backend JWT Verification, ACL Route Guards & Settings Engine

### Added
- **Unified Live AuthContext**:
  - Implemented centralized authentication context providing verified user identity, administrator role, authentication status, and credit balance across the component tree.
  - Linked credit accounting directly with authentication lifecycle to ensure synchronous updates.
- **Strict Course ACL & Starter Isolation**:
  - Namespaced public starter courses and isolated custom user courses: unauthenticated guests only view public starter templates.
  - Custom courses require verified author ownership or administrator privileges to view or delete; added dedicated 401/403 access error screens with return-to-safety navigation.
- **Interactive Dashboard Settings Page Controls**:
  - Implemented real-time functional controls for **Color Theme** (Dark / Soft Light), **ADHD Anti-Fluff Level** (Concise, Balanced, Exhaustive), and **Default Model Preference** (Gemini Flash Lite, Flash, Pro).
  - Synced default model selection directly to the generation input form.
- **Expanded Help & Architecture Documentation**:
  - Expanded Help workspace into an interactive knowledge base detailing documentation synthesis, client-side OCR upload limits, credit costs, and export workflows.

### Fixed & Hardened
- **Root-Cause Auth Session State Desync**:
  - Resolved session desync where unauthenticated visitors saw cached administrator states upon opening profile settings.
  - Removed outdated local storage caching fallbacks that preserved expired sessions on 401 response; now strictly purges session tokens and resets to guest state.
  - Stripped hardcoded administrator email fallbacks from user profile views and enforced an authentication required lock guard.
- **Server-Side Cryptographic JWT Verification Across Administrative Endpoints**:
  - Enforced cryptographically verified session JWT tokens across all administrative control and management endpoints.
  - Prevented identity spoofing and blocked unauthorized access to user emails, feedback, and admin actions.
- **Document Ownership Migration**:
  - Backfilled legacy course records with explicit creator ownership attributes, ensuring query filtering strictly retains rightful owner access.
- **Release Notes Scroll Fix**:
  - Updated all "Release Notes" links and hero badges to directly open the announcement modal without triggering unwanted page jumps.

## [1.8.0-beta] - 2026-09-17 — Consistency & Polish: Single Source of Truth for Version & Credits, Portalized Modals & Header Redesign

### Added
- **Single Source of Truth for Versioning**:
  - Created centralized constants authority exporting version metadata and release labels.
  - Added repository-level versioning maintenance guide for consistent release tagging.
  - Eliminated hardcoded version drift across logo pills, hero banners, footers, and modal headers.
- **Single Source of Truth for Credit Balance**:
  - Implemented centralized credit provider subscribed to live quota updates and balance refresh events.
  - Formatted credits dynamically without artificial display caps.
  - Refined quota accounting with exact decimal precision for accurate reasoning credit tracking.
- **Mandatory First-Login Legal Consent Flow & Audit Trail**:
  - Introduced non-dismissible consent dialog requiring explicit agreement to Terms of Service, Privacy Policy, and Cookies.
  - Stored consent timestamp and terms version directly on account preferences, establishing a durable, cross-device legal audit trail.
  - Automatically launches the Changelog "What's New" modal immediately upon consent acceptance for seamless onboarding.
- **Formatted Chatbot Typography Engine**:
  - Engineered zero-dependency typography parser for the companion bot.
  - Renders bold, italic, inline code tags, and bullet points into styled typography, replacing raw markdown syntax.

### Fixed & Hardened
- **Viewport-Centered Modal Portals**:
  - Mounted all interactive dialogs directly to the document body via React Portals.
  - Resolved deep-scroll offset bug on long landing pages and prevented CSS transform ancestor clipping.
- **Sidebar & Footer Layout Separation**:
  - Relocated footer inside the main workspace column in dashboard routes, preventing it from overlapping or spanning underneath the sidebar.
- **Softened Light Mode & Relocated Controls**:
  - Replaced glaring white tones with soft slate backgrounds and clean card surfaces.
  - Audited and updated WCAG text contrast tokens for secondary and colored accent elements.
  - Relocated theme toggles into the dashboard sidebar and an accessible toggle in the landing lower section.
- **Header Redesign & Infrastructure De-identification**:
  - Consolidated separate credits badge and sign-out button into a unified user profile dropdown menu.
  - Added prominent Dashboard navigation button on the public landing page when authenticated.
  - Completely removed internal cloud infrastructure labels from user-facing views.

## [1.7.0-beta] - 2026-09-17 — Dashboard Application Shell, Appwrite Serverless History, Light Mode Theming & Auth Hardening

### Fixed & Hardened
- **Model Picker & Tab Hitbox Optimization**:
  - Elevated z-index and isolated hitboxes so disabled generation states never impede tab switchers or model dropdowns.
- **Universal Light Mode Theming**:
  - Replaced non-interactive wrappers with semantic, fully clickable theme toggle buttons.
  - Added comprehensive universal light mode styling rules covering body, cards, panels, inputs, and borders across all pages.
  - Injected an inline theme initialization script to eliminate theme flashes on page reload.
- **Feedback & Chatbot Layout Polish**:
  - Adjusted button docking to prevent visual overlap between feedback controls and the technical companion.
- **Universal Server-Side Auth Re-verification**:
  - Implemented secure authentication client utilities alongside server-side session token verification.
  - Server endpoints independently verify session tokens, rejecting spoofed user IDs in request bodies.

### Added
- **Dashboard Application Shell with Sidebar**:
  - Restructured dashboard into an application shell featuring five distinct workspaces (Studio & Courses, Generation History, My Account, Preferences, Help & Docs).
- **Serverless Cloud Storage Architecture**:
  - Stored generation history and uploaded OCR documents in cloud database collections and storage buckets, ensuring persistence across serverless executions.
  - Enforced strict ACLs: users can read and delete their own history entries; administrators can audit and delete across all users.
- **Course Author Attribution & 24h Guest Purging**:
  - Added "Created by [User]" badges to course cards and detail page headers.
  - Guest generations automatically expire and self-delete after 24 hours.
- **Distinct Chatbot Scopes**:
  - Public Landing Mode: "CourseIT Guide" offering interactive product FAQ chips (Anti-Fluff Engine, Supported Inputs, Model Credits, Guest Trial).
  - Course Detail Mode: "Technical Companion" providing step-focused code explanations, runnable snippets, common bugs, and concept quizzes.

## [1.6.0-beta] - 2026-09-17 — Course Deletion Security ACL, Google OAuth Persistence & Visible Model Fallbacks

### Fixed & Secured
- **Critical Security: Course Deletion Access Control**:
  - Course deletion is strictly restricted to verified course authors or platform administrators.
  - Unauthorized visitors cannot access or trigger delete actions in the interface or API.
  - Starter catalog templates are permanently protected from deletion by non-admin visitors.
- **Google OAuth Session Persistence**:
  - Resolved session persistence for pending accounts, ensuring Google OAuth users remain signed in with active sessions.
- **Changelog Date Text Layout & Overflow Fix**:
  - Redesigned changelog cards to use responsive wrapping so dates never overflow or clip across any mobile viewport width.

### Added
- **Unified Pending-Approval Flow for Google OAuth**:
  - Google OAuth signups land in the identical pending approval queue as email signups, receiving acknowledgement emails and awaiting admin approval.
- **User-Visible Model Resilience Notices**:
  - When a higher-tier model encounters temporary upstream load and falls back to Flash Lite, users see an informative notification and are only charged for the actual model used.

## [1.5.0-beta] - 2026-09-17 — OAuth Token Resilience, Shared Guest Trials, Course Exports & Token Monitor

### Added
- **OAuth Execution Guard**:
  - Implemented execution locks preventing framework StrictMode from consuming one-time OAuth secrets twice.
- **Real-Time Database Credit Writeback**:
  - Quota deduction is strictly enforced per model and synchronized to the database quota collection.
- **Shared 3/3 Public Guest Trial Sandbox**:
  - URL generation and OCR document extraction share a single pool of 3 free runs per 24 hours with locked higher tiers.
- **Scripted Technical Companion**:
  - Embedded interactive companion on the public landing page and course detail views.
- **Course Content Export (PDF, DOCX, Markdown)**:
  - 1-click export to high-contrast PDF, formatted Word documents, and clean Markdown.
- **Admin Tester Emailer & Feedback Export**:
  - Direct email composer with dark-mode HTML templates and feedback export capabilities.
- **AI Token & Cost Monitor**:
  - Real-time token usage and cost tracking in the Admin dashboard.

## [1.4.1-beta] - 2026-09-17 — ADHD Anti-Fluff Engine, User Feedback, ThemeToggle & Security Hardening

### Added
- **ADHD & Low Attention Span Anti-Fluff Positioning**:
  - Official positioning: *"Built for developers with ADHD, documentation fatigue, or low attention spans. Zero AI fluff."*
  - Interactive **AntiFluffDiff** component comparing wordy LLM responses against CourseIT's direct numbered action steps.
  - Multi-ecosystem expansion: curated starter documentation for React 19, Rust, Docker, and Godot 4.
- **User Beta Feedback System**:
  - Interactive feedback dialog capturing star ratings, category selection, and notes, with an administrative review tab.
- **PixelSwap Animated Light Mode**:
  - Smooth animated transitions between Sun and Moon theme states with persistent storage.
- **Developer Portfolio Integration**:
  - Footer component featuring developer portfolio, GitHub, LinkedIn profile, and contact links.
- **Verified Transactional Email Suite**:
  - Verified sender configuration for user approval, password reset, quota adjustments, and welcome notifications.
- **Admin Details & Archive Modals**:
  - Management modal for inspecting users, adjusting credits, approving accounts, and reactivating archived accounts.

## [1.4.0-beta] - 2026-09-17 — Landing Page Separation, Step Readability & Scripted Companion

### Added
- **Dedicated Public Landing Page**:
  - Clear value proposition explaining the philosophy of "Action-First Learning Engine for Developers".
  - Dynamic interactive background using animated canvas grids.
  - "How It Works" 3-step workflow pipeline with spotlight presentation cards.
- **Clean Public & Authenticated State Separation**:
  - Complete logout state that thoroughly clears cloud sessions and local credentials.
  - Logged-out visitors access the rich Landing Page, while authenticated users access the full generator Dashboard.
- **Step Text Readability Revamp**:
  - Parsed multi-sentence implementation text into sequential vertical cards with badges.
  - High-contrast typography and styled terminal code blocks with one-click copy and actionable pro-tip callouts.
- **Scripted Technical Companion Bot**:
  - Dockable companion focused on the active course with 4 instant scripted action chips (explanation, code, gotchas, quiz).

## [1.3.0] - 2026-09-16 — 250 Credits, OAuth2 Token Flow, Profile & Model Cost Tiers

### Added
- **250 Course Credits Trial**: Accounts upgraded to 250 credits with live meter tracking in navigation and profile views.
- **OAuth2 Token Flow**: Direct integration with social OAuth handlers and secure callback verification.
- **Model Credit Pricing Tiers**: Flash Lite (0.5), 3.5 Lite (1.0), 3.6 Flash (2.0), 3.7 Flash (5.0).
- **User Profile Page**: Account management, password reset via email, credit meters, and stored course management.
- **Transactional Email Dispatching**: Verified transactional email delivery for user verification and password resets.

## [1.2.0] - 2026-09-16 — SaaS Architecture & Local Document OCR Release

### Added
- **Local Document Upload & OCR (Tesseract.js)**: Drag and drop scanned tutorial screenshots, diagrams, and text files with client-side OCR extraction.
- **Secure Cloud Storage**: Dedicated cloud storage bucket for user-uploaded documents and image assets.
- **Account-Based Quotas**: Default credit allocation with real-time sync across navigation bars and input panels.
- **Admin Approval Workflow**: Approval queue for beta tester registrations with automated approval email dispatch.

## [1.1.0] - 2026-09-16 — Public Release Announcement

### Added
- **Actionable Implementation Instructions & Code Snippets**: Each step provides setup navigation, runnable code snippets or CLI syntax, and practical pro-tips.
- **Recommended Next Step Guidance**: Courses suggest concrete follow-up topics and projects to tackle next.
- **URL Deduplication Cache**: Instant cached retrieval for previously synthesized documentation links.
- **Model Selector**: Live dropdown on the dashboard to select reasoning tiers.
- **In-App Announcement Modal**: Release notes and changelog dialog accessible across views.

## [0.1.0] - 2026-09-16

### Added
- Initial project scaffolding with Vite, React 19, and Tailwind CSS.
- Readability text extraction and content purification pipeline.
- AI model integration enforcing action-first prompt rules.
- Cloud database and local fallback storage layer.
- Interactive Dashboard with course catalog and completion checklists.
