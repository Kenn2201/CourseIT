# CourseIT — Versioning & Release Checklist

This document is a maintenance checklist for releasing new versions of CourseIT. It lists every location where a version string or badge resides to prevent version drift across the application.

---

## 1. Single Source of Truth (App UI)

All UI components and user-facing screens must import the active version from:
?? **[src/constants/version.js](src/constants/version.js)**

`javascript
export const CURRENT_VERSION = '1.8.0';
export const CURRENT_VERSION_LABEL = 'v1.8.0 BETA';
export const RELEASE_DATE = 'September 17, 2026';
export const RELEASE_NAME = 'Consistency & Polish';
`

Every UI surface imports from this constant:
- **Navbar logo tag** (src/components/Navbar.jsx)
- **Dashboard Studio hero badge** (src/pages/Dashboard.jsx)
- **Landing page hero pill** (src/pages/Landing.jsx)
- **Footer logo badge & release notes link** (src/components/Footer.jsx)
- **Changelog modal header & tabs** (src/components/ChangelogModal.jsx)
- **Terms & Privacy modal preamble** (src/components/TermsPrivacyModal.jsx)
- **Beta Feedback modal header tag** (src/components/FeedbackModal.jsx)

---

## 2. Release Checklist for Future Versions

When releasing a new version (e.g. 1.9.0), follow this checklist:

1. [ ] **Update Single Source of Truth**:
   - Edit [src/constants/version.js](src/constants/version.js) with the new CURRENT_VERSION, CURRENT_VERSION_LABEL, and RELEASE_DATE.
2. [ ] **Update Package Metadata**:
   - Edit [package.json](package.json) ("version": "1.9.0").
3. [ ] **Update In-App Changelog**:
   - Add new release entry to [src/data/changelog.js](src/data/changelog.js) with highlights and notes.
4. [ ] **Update Repository Changelog**:
   - Add matching section to [CHANGELOG.md](CHANGELOG.md) following Keep a Changelog guidelines.
5. [ ] **Update README.md**:
   - Update the version shield badge: img.shields.io/badge/version-v1.9.0--beta-indigo.svg.
   - Update the "Recent Changelog" bullet list.
6. [ ] **Verify Production Build**:
   - Run 
pm run build and ensure exit code 0.
7. [ ] **Git Commit & Tag**:
   - Commit changes to kenn/develop.
   - Merge into master.
   - Create annotated tag: git tag -a v1.9.0 -m "CourseIT v1.9.0 Release".
   - Push commits and tags to remote: git push origin master --tags.
