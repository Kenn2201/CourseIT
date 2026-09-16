# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
