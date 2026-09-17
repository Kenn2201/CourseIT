export const CHANGELOG_DATA = [
  {
    version: 'v1.8.0 BETA',
    date: 'September 17, 2026',
    title: 'Consistency & Polish: Single Source of Truth for Version & Credits, Portalized Modals & Header Redesign',
    badge: 'Latest Release',
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
