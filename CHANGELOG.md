# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
