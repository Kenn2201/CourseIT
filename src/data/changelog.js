export const CHANGELOG_DATA = [
  {
    version: 'v1.11.1 LIVE',
    date: 'September 17, 2026',
    title: 'Serverless Production Hotfix & Connected Documentation',
    badge: 'Latest Release',
    highlights: [
      {
        title: 'Netlify 502 Bad Gateway Serverless Fix',
        desc: 'Resolved read-only filesystem crash (EROFS) on AWS Lambda by directing runtime fallback files to os.tmpdir(), and aligned netlify/functions/api.js parameter signatures with server/handler.js.'
      },
      {
        title: 'Appwrite Auth Decoupling & Sydney Cloud Parity',
        desc: 'Decoupled pure authentication from database collection dependencies, defaulted to Sydney syd1 cloud region, and added build-time define fallbacks in vite.config.js for VITE_ and standard env variables.'
      },
      {
        title: 'Netlify Functions Bundler & Timeout Configuration',
        desc: 'Cleaned netlify.toml syntax with valid esbuild configuration and external jsdom bundling to ensure reliable serverless execution.'
      },
      {
        title: 'Connected Documentation & Semantic Versioning Policy',
        desc: 'Synchronized version identifiers, release checklists, and git commit references across README.md, VERSIONING.md, and CHANGELOG.md.'
      }
    ],
    notes: [
      'Added ensureAccount() lazy initialization in auth.js with actionable setup diagnostics',
      'Mapped both /api/summarize and /api/summarize-text routes in universal Netlify function',
      'Ensured all documentation cross-links resolve directly to master branch'
    ]
  },
  {
    version: 'v1.11.0 LIVE',
    date: 'September 17, 2026',
    title: 'Production Live Release, Netlify Serverless Routing & Security Hardening',
    highlights: [
      {
        title: 'Complete Security Audit & Credential Scrubbing',
        desc: 'Scrubbed all hardcoded project, database, and collection IDs from tracked configuration and source files (appwrite.json, appwrite.js, server/handler.js, functions/summarize), migrating entirely to strict environment variables for public repo readiness.'
      },
      {
        title: 'Universal Netlify Serverless API Routing',
        desc: 'Deployed netlify/functions/api.js with serverless wildcard redirects, handling all 11 backend endpoints with Appwrite session JWT cryptographic verification.'
      },
      {
        title: 'Platform Maintenance Mode with Admin Bypass',
        desc: 'Added animated Maintenance.jsx screen with live status pills, Admin Bypass modal, and dynamic administrative toggle in the Admin panel.'
      },
      {
        title: 'Profile Overhaul & Custom Avatar Photo Upload',
        desc: 'Enabled client-side custom profile picture upload with 256x256 cover crop compression and instant cross-component synchronization, while preserving curated preset icons.'
      },
      {
        title: 'Account Summary & Workspace Metrics',
        desc: 'Replaced redundant course list in Profile with live telemetry cards (custom syntheses count isolated from starter templates, reasoning credits, tokens consumed, cloud node) and direct link to Studio Dashboard.'
      },
      {
        title: 'Global Rebranding to CourseIT Ai & Tech Badges',
        desc: 'Standardized brand identity to CourseIT Ai across all page titles, metadata, Navbar, and Footer; added "Powered by Netlify • Appwrite • Google Gemini • Resend" badge strip.'
      }
    ],
    notes: [
      'Protected AdminModal from unhandled exceptions in onAuthChange with try/catch/finally to prevent freezing',
      'Added autoComplete attributes and overflow scroll locks to authentication modal',
      'Pre-emptively cleared stale Appwrite sessions on login to avoid active session conflicts',
      'Isolated starter templates from custom user queries with includeCurated=false parameter in listCourses()'
    ]
  },
  {
    version: 'v1.10.0 BETA',
    date: 'September 17, 2026',
    title: 'Guest Flow Restoration, Anti-Fluff Enforcement & Platform Polish',
    highlights: [
      {
        title: 'Guest Flow Regression Fix',
        desc: 'Prevented unauthenticated guest requests from triggering Appwrite JWT session errors, fixed 404s on locally-stored guest courses, and eliminated the Private Course authentication block for guest visitors.'
      },
      {
        title: 'Zero-Fluff System Instruction & Imperative Steps',
        desc: 'Hardened LLM system prompt with strict negative constraints (banning conversational padding like "In this section") and mandating imperative verbs and runnable code snippets.'
      },
      {
        title: 'Modern IDE Code Block UI & Dynamic Language Detection',
        desc: 'Upgraded code snippet blocks with macOS-style window controls, dynamic language syntax badges (Bash, Dockerfile, GDScript, Rust, TypeScript, Python), and one-click copy functionality.'
      },
      {
        title: 'Rich Starter Course Snippets & Live Scripted Companion',
        desc: 'Completely populated runnable code snippets and implementation guides for Docker, React 19, Rust, and Godot starter courses; updated CourseTutor "Show Code" to display real verified syntax.'
      },
      {
        title: 'Structured Catalog & Attribution Consistency',
        desc: 'Separated the dashboard into Curated Starters and Community & Custom Courses with clear, consistent author attribution across all catalog views, admin tables, and user profiles.'
      },
      {
        title: 'Actionable Generation Error Pipeline',
        desc: 'Replaced hanging states and silent failures with helpful diagnostic messages and a one-click [Try Again] button.'
      }
    ],
    notes: [
      'Fixed Navbar.jsx ReferenceError on login by calling refreshAuth()',
      'Portaled AdminModal.jsx to document.body, centered input icons, and added password visibility toggle',
      'Hid Dashboard sidebar for unauthenticated guest visitors',
      'Repositioned floating Beta Feedback button to prevent overlap with docked CourseTutor',
      'Moved ADMIN_EMAIL to environment variables (.env, .env.example, README.md, Footer.jsx, server/handler.js)',
      'Allowed guest course deletion directly from localStorage without throwing 401 API errors'
    ]
  },
  {
    version: 'v1.9.0 BETA',
    date: 'September 17, 2026',
    title: 'Security Audit & Auth Hardening: Live Session Source of Truth, Backend JWT Verification, ACL Route Guards & Settings Engine',
    highlights: [
      {
        title: 'Unified Live AuthContext & Purged Fallbacks',
        desc: 'Eliminated stale localStorage desync by establishing AuthContext as the single live source of truth; unauthenticated API calls immediately purge cached sessions instead of leaking admin identity.'
      },
      {
        title: 'Backend Appwrite JWT Verification Across Admin APIs',
        desc: 'Hardened all 8 backend admin endpoints (/api/admin/*) and course deletion to cryptographically verify Appwrite session JWTs; strictly forbids unauthenticated or non-admin requests.'
      },
      {
        title: 'Strict Course ACL & Starter Catalog Prefixing',
        desc: 'Private custom courses now require authenticated author or administrator ownership. Public template courses are securely namespaced with "starter-" prefix and godot-nodes-and-scenes was removed from public catalog.'
      },
      {
        title: 'Appwrite Document Migration',
        desc: 'Successfully backfilled legacy Appwrite course documents with explicit creator_id and creator_email attributes, ensuring strict listCourses() filtering never drops owner access.'
      },
      {
        title: 'Interactive Settings Page Controls',
        desc: 'Wired functional Color Theme switcher, ADHD Anti-Fluff Level selector (Concise, Balanced, Exhaustive), and Default Model Preference synced seamlessly with the course generator.'
      },
      {
        title: 'Expanded Help Documentation & Snappy Micro-Interactions',
        desc: 'Comprehensive step-by-step documentation on documentation synthesis, OCR upload limits, credit costs, and smooth micro-animations across dashboard cards.'
      }
    ],
    notes: [
      'Created src/context/AuthContext.jsx and connected across App.jsx, Navbar.jsx, Dashboard.jsx, Profile.jsx, and CourseDetail.jsx',
      'Purged cached localStorage fallback on 401 unauthenticated session in src/lib/auth.js',
      'Removed hardcoded admin email and credit balances from Profile.jsx and Admin.jsx',
      'Enforced Appwrite JWT authentication and admin verification on /api/admin/users, /api/admin/approve, /api/admin/topup, /api/admin/feedbacks/status, /api/admin/test-all-emails, /api/admin/send-custom-email, /api/admin/token-metrics, and GET /api/feedback in vite.config.js',
      'Migrated legacy Appwrite database courses to set creator_id and creator_email metadata',
      'Prefixed all public starter courses with "starter-" and isolated private courses to verified authors',
      'Added dedicated 401/403 ACL access error screens with navigation back to safety'
    ]
  },
  {
    version: 'v1.8.0 BETA',
    date: 'September 17, 2026',
    title: 'Consistency & Polish: Single Source of Truth for Version & Credits, Portalized Modals & Header Redesign',
    badge: 'Previous',
    highlights: [
      {
        title: 'Single Source of Truth for Versioning',
        desc: 'Eliminated all version drift across UI surfaces, modals, badges, and documentation by routing through a centralized constants authority and VERSIONING.md guide.'
      },
      {
        title: 'Single Source of Truth for Credit Balance',
        desc: 'Created centralized CreditContext (useUserCredits) with live Appwrite sync; eliminated backend Math.floor precision loss and arbitrary / 250 display ceilings.'
      },
      {
        title: 'Viewport-Centered Portals for All Modals',
        desc: 'Mounted Changelog, Legal Consent, and Beta Feedback modals directly to document.body via React Portals, fixing scroll-position bugs on long pages.'
      },
      {
        title: 'Mandatory First-Login Legal Consent Flow & Audit Trail',
        desc: 'Added account-level Terms & Privacy consent verification stored in Appwrite user records for a persistent legal audit trail across devices, immediately followed by release notes onboarding.'
      },
      {
        title: 'Sidebar & Footer Layout Separation',
        desc: 'Embedded the footer inside the main content workspace column on dashboard routes, eliminating overlap and layout clipping with the sidebar.'
      },
      {
        title: 'Softened Light Mode & Relocated Controls',
        desc: 'Toned down glare with soft #f1f5f9 slate backgrounds, audited WCAG AAA/AA text contrast tokens, and added clearly labeled theme switches in the sidebar and landing page.'
      },
      {
        title: 'Formatted Chatbot Typography Engine',
        desc: 'Integrated FormattedChatText parser to render bold, italic, code tags, and bulleted lists cleanly without raw markdown asterisks.'
      },
      {
        title: 'Consolidated Header & Internal Details Removal',
        desc: 'Replaced separate credits pill and logout button with an elegant user menu dropdown, added prominent Dashboard link on landing page, and removed internal infrastructure labels ("Sydney").'
      }
    ],
    notes: [
      'Created src/constants/version.js and root maintenance documentation VERSIONING.md',
      'Created src/context/CreditContext.jsx with dynamic formatting and live quota event synchronization',
      'Replaced Math.floor with exact decimal precision in server/handler.js for accurate credit accounting',
      'Stored consent timestamp and terms version directly on Appwrite account preferences for audit trail persistence',
      'Engineered FormattedChatText.jsx for zero-dependency safe Markdown rendering in CourseTutor',
      'Wrapped ChangelogModal, LegalConsentModal, TermsPrivacyModal, and FeedbackModal in createPortal',
      'Moved Footer inside main container in Dashboard.jsx so it never wraps underneath DashboardSidebar'
    ]
  },
  {
    version: 'v1.7.0 BETA',
    date: 'September 17, 2026',
    title: 'Dashboard Application Shell, Appwrite Serverless History, Light Mode Theming & Auth Hardening',
    badge: 'Previous',
    highlights: [
      {
        title: 'Dashboard Application Shell & Sidebar',
        desc: 'Transformed dashboard into a responsive application shell featuring dedicated Studio, Generation History, Profile, Preferences, and Help sections.'
      },
      {
        title: 'Appwrite Serverless History & OCR Audit',
        desc: 'Generation prompts and OCR uploads are stored and audited in Appwrite collections with individual deletion and full user/admin ACLs, ensuring persistence on Netlify Functions.'
      },
      {
        title: 'Universal Server-Side Auth Re-verification',
        desc: 'All protected endpoints re-verify identity via Appwrite session JWT (x-appwrite-jwt), ignoring or rejecting forged user IDs in request bodies.'
      },
      {
        title: 'Root-Cause Light Mode Fix',
        desc: 'Eliminated unclickable wrappers, added universal light theme styling across routes, cards, and inputs with instantaneous PixelSwap transitions.'
      },
      {
        title: 'Unclickable Model Picker & Tab Fix',
        desc: 'Removed container overflow-hidden restrictions and elevated dropdown hitboxes for smooth model selection and tab switching.'
      },
      {
        title: 'Course Attribution & 24h Guest Purging',
        desc: 'Added author attribution badges to course cards and detail pages, with automatic 24-hour auto-purging of unauthenticated guest courses.'
      },
      {
        title: 'Scripted Chatbot Scope Separation',
        desc: 'Separated public landing demo guide (anti-fluff FAQ chips) from authenticated technical companion (step-specific code and quiz support).'
      },
      {
        title: 'Header Navigation Auth Controls',
        desc: 'Relocated sign-in and sign-out controls to persistent header with smooth session checking skeleton loader and animated exit transitions.'
      }
    ],
    notes: [
      'Built responsive DashboardSidebar and GenerationHistory components with real-time search and filter controls',
      'Stored history in Appwrite collections rather than ephemeral local flat files for serverless Netlify compatibility',
      'Implemented getAuthJwt() and authenticatedFetch() client utilities alongside server-side verifyAppwriteSession()',
      'Resolved Bug 1: fixed model dropdown clipping and tab switcher hitboxes',
      'Resolved Bug 2: semantic theme toggle button and comprehensive light mode CSS rules',
      'Resolved Bug 3: repositioned Beta Feedback button to prevent overlap with docked CourseTutor bot',
      'Added Created by [User] attribution and automatic 24-hour expiry calculation for guest courses in appwrite.js',
      'Soften landing page copy to clarify 250 credits unlock upon admin approval'
    ]
  },
  {
    version: 'v1.6.0 BETA',
    date: 'September 17, 2026',
    title: 'Course Deletion Security ACL, Google OAuth Persistence & Visible Model Fallbacks',
    highlights: [
      {
        title: 'Critical Security: Course Deletion ACL',
        desc: 'Enforced author and admin verification on server and client. Starter templates and other users\' courses cannot be deleted by unauthorized visitors.'
      },
      {
        title: 'Google OAuth 401 Session Persistence',
        desc: 'Removed destructive session teardown on pending accounts. Google OAuth signups remain signed in with active Appwrite sessions.'
      },
      {
        title: 'Google OAuth Pending Queue Integration',
        desc: 'New Google users land in the same pending approval queue as email signups, receiving acknowledgement emails and waiting for admin approval.'
      },
      {
        title: 'User-Visible Model Resilience Notices',
        desc: 'When a model hits temporary provider load and falls back to Flash Lite, users see a clear notification and are only charged for the actual model used.'
      },
      {
        title: 'Changelog Mobile Responsive Layout',
        desc: 'Fixed date badge wrapping and card layout so version dates never overflow or clip on mobile viewports.'
      }
    ],
    notes: [
      'Enforced ownership & admin check for course deletion in /api/courses/delete (403 Forbidden)',
      'Protected starter catalog templates from unauthorized client and server deletion',
      'Fixed Google OAuth session 401 bug by removing deleteSession on pending status',
      'Unified pending-approval flow for Google OAuth and email signups with auto-acknowledgement emails',
      'Added user-visible model fallback notifications in Dashboard and Success modal',
      'Optimized ChangelogModal date text wrapping for all mobile and desktop screen sizes',
      'Synchronized CHANGELOG.md and in-app changelog.js as single source of truth'
    ]
  },
  {
    version: 'v1.5.0 BETA',
    date: 'September 17, 2026',
    title: 'ADHD Anti-Fluff Engine, Public Companion, Shared Trials & Token Monitor',
    highlights: [
      {
        title: 'Google OAuth Double-Invocation Fix',
        desc: 'Implemented execution guard preventing React StrictMode from consuming one-time OAuth secrets twice.'
      },
      {
        title: 'Real-Time Appwrite Credit Writeback',
        desc: 'Credits decrement accurately on generation and sync to the Appwrite users_quota collection.'
      },
      {
        title: 'Animated Pop Feedback & Spinners',
        desc: 'Added celebratory signup popups, authentication spinners, and animated toast notifications for all CRUD actions.'
      },
      {
        title: 'Shared 3/3 Public Guest Trial',
        desc: 'URL generation and Document OCR share a single pool of 3 free runs with crossed-out higher tiers.'
      },
      {
        title: 'Public Landing Page Companion Bot',
        desc: 'CourseTutor interactive technical companion is now embedded on the public landing page.'
      },
      {
        title: 'Course Content Export (PDF & DOCX)',
        desc: 'Export structured courses to high-fidelity PDF print sheets, DOCX word documents, or Markdown.'
      },
      {
        title: 'Token & API Usage Monitor',
        desc: 'Real-time Gemini token metrics tracking prompt, candidate, and total tokens per user.'
      }
    ],
    notes: [
      'Fixed Google OAuth double invocation token error in AuthCallback.jsx',
      'Fixed credit deduction writeback to Appwrite users_quota collection',
      'Added celebratory signup popup and loading states across auth and admin',
      'Added public Landing page CourseTutor companion demo',
      'Shared 3/3 guest trial across URL and OCR with locked tier indicators',
      'Added PDF, DOCX, and Markdown course export in CourseDetail',
      'Added Markdown feedback export and direct tester emailer in Admin panel',
      'Added Gemini token & API consumption monitor with rate limit margins'
    ]
  },
  {
    version: 'v1.4.1 BETA',
    date: 'September 17, 2026',
    title: 'ADHD Anti-Fluff Slogan, User Beta Feedback & PixelSwap Light Mode',
    notes: [
      'Added official ADHD and low attention span anti-fluff positioning',
      'Introduced AntiFluffDiff interactive before/after widget with word count metrics',
      'Created logged-in Beta Feedback system with 1-5 star ratings and admin review tab',
      'Ported PixelSwap animated Sun/Moon toggle from reactbits.txt',
      'Integrated Kenn Nacario portfolio, GitHub, and LinkedIn developer footer',
      'Added UserDetailsModal and Archived Accounts tab in Admin panel',
      'Delivered verified Resend test suite to kenn.nacario12@gmail.com'
    ]
  },
  {
    version: 'v1.4.0 BETA',
    date: 'September 16, 2026',
    title: 'Landing Page Separation, Step Readability & Scripted Companion',
    notes: [
      'Added dedicated public Landing Page with ReactBits ShapeGrid background',
      'Revamped step instruction rendering into vertical numbered cards with GDScript chips',
      'Introduced dockable CourseTutor Companion bot with scripted actions and quizzes',
      'Added Account Archiving workflow with Resend notification dispatch',
      'Added DeleteConfirmModal to CourseCard, Profile, and Dashboard'
    ]
  },
  {
    version: 'v1.3.0',
    date: 'September 16, 2026',
    title: '250 Credits, Document OCR & Model Tiers',
    notes: [
      'Expanded credit quota from 50 to 250 free credits upon admin approval',
      'Added local document/diagram upload with client-side Tesseract.js OCR',
      'Introduced model pricing tiers: Flash Lite (0.5), 3.5 (1.0), 3.6 (2.0), 3.7 (5.0)',
      'Integrated Resend email approvals and password reset flow'
    ]
  },
  {
    version: 'v1.2.0',
    date: 'September 16, 2026',
    title: 'Appwrite Sydney Cloud Integration',
    notes: [
      'Migrated database and auth sessions to Appwrite Sydney instance',
      'Configured users_quota collection with status approval lifecycle',
      'Added OAuth2 Google and GitHub token handlers'
    ]
  }
];
