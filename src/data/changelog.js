export const CHANGELOG_DATA = [
  {
    version: 'v1.11.1 LIVE Beta',
    date: 'September 17, 2026',
    title: 'Serverless Production Hotfix & Connected Documentation',
    badge: 'Latest Release',
    highlights: [
      {
        title: 'Serverless Runtime Stability & Fallback Protection',
        desc: 'Hardened cloud runtime workers with read-only filesystem resilience and temporary storage routing, ensuring uninterrupted cold-start reliability.'
      },
      {
        title: 'Authentication Decoupling & Cloud Parity',
        desc: 'Decoupled core user authentication from collection dependencies to guarantee login and signup accessibility, and added build-time environment variable fallbacks.'
      },
      {
        title: 'Serverless Functions Bundler Optimization',
        desc: 'Refined serverless configuration with high-performance bundling and external module isolation for fast execution.'
      },
      {
        title: 'Connected Documentation & Semantic Versioning Policy',
        desc: 'Synchronized version identifiers, release checklists, and git commit references across project documentation and application metadata.'
      }
    ],
    notes: [
      'Added resilient client authentication initialization with actionable diagnostics',
      'Unified document extraction and OCR synthesis pipelines within the universal serverless API router',
      'Ensured all documentation cross-links resolve directly to the stable production branch'
    ]
  },
  {
    version: 'v1.11.0 LIVE',
    date: 'September 17, 2026',
    title: 'Production Live Release, Netlify Serverless Routing & Security Hardening',
    highlights: [
      {
        title: 'Complete Security Audit & Credential Scrubbing',
        desc: 'Scrubbed all hardcoded project credentials and database identifiers across tracked files, migrating completely to strict environment variables for public repository readiness.'
      },
      {
        title: 'Universal Serverless API Routing',
        desc: 'Deployed high-speed serverless wildcard routing handling all backend services with cryptographic JWT session verification.'
      },
      {
        title: 'Platform Maintenance Mode with Admin Bypass',
        desc: 'Added animated Maintenance screen with live status pills, administrator bypass authentication, and dynamic operational toggles in the Admin panel.'
      },
      {
        title: 'Profile Overhaul & Custom Avatar Photo Upload',
        desc: 'Enabled client-side custom profile picture upload with cover crop compression and instant cross-component synchronization, while preserving curated preset icons.'
      },
      {
        title: 'Account Summary & Workspace Metrics',
        desc: 'Replaced redundant course lists in Profile with live telemetry cards (custom syntheses count isolated from starter templates, reasoning credits, tokens consumed) and direct access to Studio Dashboard.'
      },
      {
        title: 'Global Rebranding to CourseIT Ai & Tech Badges',
        desc: 'Standardized brand identity to CourseIT Ai across all page titles, metadata, Navbar, and Footer; added tech stack partner badges.'
      }
    ],
    notes: [
      'Protected authentication dialog from unhandled state exceptions to prevent UI freezing during login',
      'Added browser autocomplete attributes and overflow scroll locks to authentication modal',
      'Pre-emptively cleared stale sessions on login to avoid active session conflicts',
      'Isolated curated starter templates from custom user courses in the dashboard catalog'
    ]
  },
  {
    version: 'v1.10.0 BETA',
    date: 'September 17, 2026',
    title: 'Guest Flow Restoration, Anti-Fluff Enforcement & Platform Polish',
    highlights: [
      {
        title: 'Guest Flow Regression Fix',
        desc: 'Prevented unauthenticated guest requests from triggering session verification errors, resolved temporary course loading, and eliminated private access barriers for guest visitors.'
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
      'Resolved navigation bar session refresh state synchronization on sign-in',
      'Portaled authentication modal directly to document body, centered input adornments, and added password visibility toggles',
      'Cleaned dashboard navigation layout for unauthenticated guest visitors',
      'Repositioned floating feedback controls to prevent layout collision with technical companion',
      'Migrated administrator contact configuration entirely to environment variables',
      'Allowed guest users to delete temporary guest courses locally without hitting backend authentication barriers'
    ]
  },
  {
    version: 'v1.9.0 BETA',
    date: 'September 17, 2026',
    title: 'Security Audit & Auth Hardening: Live Session Source of Truth, Backend JWT Verification, ACL Route Guards & Settings Engine',
    highlights: [
      {
        title: 'Unified Live Auth Context & Purged Fallbacks',
        desc: 'Eliminated stale client-side session desync by establishing authentication state as the single live source of truth; unauthenticated API calls immediately purge cached sessions.'
      },
      {
        title: 'Cryptographic JWT Verification Across Administrative APIs',
        desc: 'Hardened all backend administrative endpoints and sensitive actions to cryptographically verify user session JWTs, strictly rejecting unauthorized requests.'
      },
      {
        title: 'Strict Course ACL & Starter Catalog Namespacing',
        desc: 'Private custom courses now require verified author or administrator ownership. Public template courses are securely namespaced and isolated from community courses.'
      },
      {
        title: 'Document Ownership Migration',
        desc: 'Backfilled legacy course records with explicit creator ownership attributes, ensuring query filtering strictly preserves rightful author access.'
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
      'Engineered unified authentication context across all application views and components',
      'Purged stale client session caches on unauthenticated responses to prevent identity desynchronization',
      'Removed hardcoded administrator credentials and balances in favor of live account metadata',
      'Enforced cryptographic JWT session authentication and role verification across all administrative management endpoints',
      'Backfilled legacy courses with verified creator ownership attributes',
      'Namespaced curated starter catalog to prevent collisions with user-generated custom courses',
      'Added dedicated 401/403 access error screens with navigation back to safety'
    ]
  },
  {
    version: 'v1.8.0 BETA',
    date: 'September 17, 2026',
    title: 'Consistency & Polish: Single Source of Truth for Version & Credits, Portalized Modals & Header Redesign',
    highlights: [
      {
        title: 'Single Source of Truth for Versioning',
        desc: 'Eliminated all version drift across UI surfaces, modals, badges, and documentation by routing through a centralized constants authority and versioning guide.'
      },
      {
        title: 'Single Source of Truth for Credit Balance',
        desc: 'Created centralized credit provider with live database synchronization, eliminating rounding loss and artificial display ceilings.'
      },
      {
        title: 'Viewport-Centered Portals for All Modals',
        desc: 'Mounted Changelog, Legal Consent, and Beta Feedback modals directly to document body via React Portals, fixing scroll-position bugs on long pages.'
      },
      {
        title: 'Mandatory First-Login Legal Consent Flow & Audit Trail',
        desc: 'Added account-level Terms & Privacy consent verification stored in user records for a persistent legal audit trail across devices, followed by release notes onboarding.'
      },
      {
        title: 'Sidebar & Footer Layout Separation',
        desc: 'Embedded the footer inside the main content workspace column on dashboard routes, eliminating overlap and layout clipping with the sidebar.'
      },
      {
        title: 'Softened Light Mode & Relocated Controls',
        desc: 'Toned down glare with soft slate backgrounds, audited WCAG text contrast tokens, and added clearly labeled theme switches in the sidebar and landing page.'
      },
      {
        title: 'Formatted Chatbot Typography Engine',
        desc: 'Integrated typography parser to render bold, italic, code tags, and bulleted lists cleanly without raw markdown syntax.'
      },
      {
        title: 'Consolidated Header & Internal Details Removal',
        desc: 'Replaced separate credits pill and logout button with an elegant user menu dropdown, added prominent Dashboard link on landing page, and removed internal infrastructure labels.'
      }
    ],
    notes: [
      'Established single source of truth versioning constant and release checklist',
      'Engineered centralized credit context with dynamic formatting and live quota event synchronization',
      'Refined quota accounting with exact decimal precision for accurate reasoning credit tracking',
      'Stored consent timestamp and terms version directly on account preferences for audit trail persistence',
      'Integrated typography parser for zero-dependency safe Markdown rendering in technical companion',
      'Wrapped interactive modals in React Portals to guarantee viewport centering',
      'Isolated footer inside main container in dashboard layout to prevent sidebar clipping'
    ]
  },
  {
    version: 'v1.7.0 BETA',
    date: 'September 17, 2026',
    title: 'Dashboard Application Shell, Appwrite Serverless History, Light Mode Theming & Auth Hardening',
    highlights: [
      {
        title: 'Dashboard Application Shell & Sidebar',
        desc: 'Transformed dashboard into a responsive application shell featuring dedicated Studio, Generation History, Profile, Preferences, and Help sections.'
      },
      {
        title: 'Serverless History & OCR Audit Storage',
        desc: 'Generation prompts and OCR uploads are stored and audited in cloud database collections with individual deletion and full user/admin access controls.'
      },
      {
        title: 'Universal Server-Side Auth Re-verification',
        desc: 'All protected endpoints re-verify identity via cryptographic session tokens, rejecting spoofed user IDs in request bodies.'
      },
      {
        title: 'Universal Light Mode Theming',
        desc: 'Added universal light theme styling across routes, cards, and inputs with smooth transitions.'
      },
      {
        title: 'Model Picker & Tab Hitbox Optimization',
        desc: 'Elevated dropdown hitboxes for smooth model selection and tab switching across viewports.'
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
      'Built responsive dashboard sidebar and generation history components with real-time search and filter controls',
      'Stored history in database collections rather than ephemeral local files for cloud serverless compatibility',
      'Implemented secure authentication client utilities alongside server-side session token verification',
      'Resolved model dropdown clipping and tab switcher hitboxes',
      'Introduced semantic theme toggle button and comprehensive light mode styles',
      'Repositioned feedback controls to eliminate overlap with technical companion',
      'Added author attribution and automatic 24-hour expiry calculation for guest courses',
      'Clarified landing page messaging regarding trial access and credit approval'
    ]
  },
  {
    version: 'v1.6.0 BETA',
    date: 'September 17, 2026',
    title: 'Course Deletion Security ACL, Google OAuth Persistence & Visible Model Fallbacks',
    highlights: [
      {
        title: 'Course Deletion Security Access Control',
        desc: 'Enforced author and admin verification on server and client. Starter templates and other users\' courses cannot be deleted by unauthorized visitors.'
      },
      {
        title: 'Google OAuth Session Persistence',
        desc: 'Prevented destructive session teardown on pending accounts, ensuring Google OAuth signups remain signed in with active sessions.'
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
      'Enforced strict author ownership and administrative authorization guards for course deletions',
      'Protected starter catalog templates from unauthorized client and server deletion',
      'Resolved social authentication session persistence for newly registered accounts',
      'Unified pending-approval flow for OAuth and email signups with auto-acknowledgement emails',
      'Added user-visible model fallback notifications in dashboard and success dialogs',
      'Optimized changelog modal date text wrapping for all mobile and desktop screen sizes',
      'Synchronized changelog data across repository documentation and client application'
    ]
  },
  {
    version: 'v1.5.0 BETA',
    date: 'September 17, 2026',
    title: 'ADHD Anti-Fluff Engine, Public Companion, Shared Trials & Token Monitor',
    highlights: [
      {
        title: 'OAuth Execution Guard',
        desc: 'Implemented execution guard preventing framework StrictMode from consuming one-time authentication tokens twice.'
      },
      {
        title: 'Real-Time Database Credit Writeback',
        desc: 'Credits decrement accurately on generation and sync to the cloud database quota store.'
      },
      {
        title: 'Animated Feedback & Action Notifications',
        desc: 'Added celebratory signup popups, authentication spinners, and animated toast notifications for all platform actions.'
      },
      {
        title: 'Shared 3/3 Public Guest Trial',
        desc: 'URL generation and Document OCR share a single pool of 3 free runs with locked higher tiers.'
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
        desc: 'Real-time AI model token metrics tracking prompt, candidate, and total tokens per user.'
      }
    ],
    notes: [
      'Resolved OAuth authentication token double-invocation guard',
      'Synchronized credit deduction writeback to database quota collection',
      'Added celebratory signup popup and loading states across auth and admin views',
      'Added public landing page technical companion demo',
      'Shared 3/3 guest trial across URL and OCR with locked tier indicators',
      'Added PDF, DOCX, and Markdown course export in course detail view',
      'Added feedback export and direct tester communication tools in admin panel',
      'Added token and API consumption monitor with rate limit tracking'
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
      'Ported animated Sun/Moon toggle with smooth transition styling',
      'Integrated developer portfolio, GitHub, and LinkedIn links in footer',
      'Added UserDetailsModal and Archived Accounts tab in Admin panel',
      'Delivered verified transactional email dispatch test suite'
    ]
  },
  {
    version: 'v1.4.0 BETA',
    date: 'September 16, 2026',
    title: 'Landing Page Separation, Step Readability & Scripted Companion',
    notes: [
      'Added dedicated public Landing Page with animated canvas background',
      'Revamped step instruction rendering into vertical numbered cards with language chips',
      'Introduced dockable CourseTutor Companion bot with scripted actions and quizzes',
      'Added Account Archiving workflow with automated confirmation dispatch',
      'Added DeleteConfirmModal to CourseCard, Profile, and Dashboard'
    ]
  },
  {
    version: 'v1.3.0',
    date: 'September 16, 2026',
    title: '250 Credits, Document OCR & Model Tiers',
    notes: [
      'Expanded credit quota from 50 to 250 free credits upon admin approval',
      'Added local document/diagram upload with client-side OCR extraction',
      'Introduced model pricing tiers: Flash Lite (0.5), 3.5 (1.0), 3.6 (2.0), 3.7 (5.0)',
      'Integrated transactional email approvals and password reset flow'
    ]
  },
  {
    version: 'v1.2.0',
    date: 'September 16, 2026',
    title: 'Cloud Database & Auth Integration',
    notes: [
      'Migrated database and auth sessions to cloud infrastructure',
      'Configured quota collection with status approval lifecycle',
      'Added OAuth2 social authentication handlers'
    ]
  }
];
