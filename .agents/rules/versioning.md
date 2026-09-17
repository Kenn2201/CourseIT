# Mandatory Semantic Versioning & Release Synchronization Protocol

## 🚨 Critical System Directive: Never Commit or Push Without SemVer Sync

There is **NO automated CI bot** (like semantic-release) in this repository. Versioning does **not** update automatically on git push.  
Therefore, the AI assistant **MUST systematically update all 6 versioning files for EVERY release, hotfix, or push**, whether the change is **small (patch)** or **big (minor/major)**.

---

## 1. SemVer Classification Guide

Before staging or committing any changes, determine the version increment:

| Change Type | SemVer Increment | Example |
| :--- | :--- | :--- |
| **Small / Hotfix / Bug Fix / Config Tweak** | **PATCH** (`x.y.Z`) | `1.11.1` → `1.11.2` |
| **Big / Feature / UX Overhaul / New Route** | **MINOR** (`x.Y.0`) | `1.11.x` → `1.12.0` |
| **Breaking API / Major Database Migration** | **MAJOR** (`X.0.0`) | `1.x.x` → `2.0.0` |

*Note: In CourseIT Ai, active beta releases follow the label format: `vX.Y.Z LIVE Beta`.*

---

## 2. The 6 Invariable Files to Update Simultaneously

Every version bump **MUST** be applied synchronously across all 6 files:

### 1. `src/constants/version.js` (Single Source of Truth for App UI)
Update:
- `CURRENT_VERSION`: e.g. `'1.11.2'`
- `CURRENT_VERSION_LABEL`: e.g. `'v1.11.2 LIVE Beta'`
- `RELEASE_DATE`: e.g. `'September 17, 2026'`
- `RELEASE_NAME`: e.g. `'Summary of this release'`

### 2. `package.json`
Update:
- `"version": "1.11.2"`

### 3. `src/data/changelog.js` (In-App Interactive Modal Data)
- Prepend the new release object to `CHANGELOG_DATA`:
  - `version`: `'v1.11.2 LIVE Beta'`
  - `date`: Today's date
  - `title`: Release title
  - `badge`: `'Latest Release'` *(Remove badge from previous release)*
  - `highlights`: Array of `{ title, desc }`
  - `notes`: Array of string notes

### 4. `CHANGELOG.md` (Repository Audit Trail)
- Prepend new version header following Keep a Changelog:
  ```markdown
  ## [1.11.2] - 2026-09-17 — Title Here (LIVE Beta)

  ### Fixed & Hardened (or Added / Changed)
  - Details of fixes and changes...
  ```

### 5. `VERSIONING.md`
- Update the code block snippet showing the current version constants.
- Update the `package.json` version reference.

### 6. `README.md`
- Update the version shield badge:
  `![Version](https://img.shields.io/badge/version-v1.11.2--LIVE--Beta-indigo.svg)`
- Update `Current Production Version`: `` `v1.11.2 LIVE Beta` ``
- Update `Recent Release Notes` list with the new entry at the top.
- Link the latest commit hash badge.

---

## 3. Mandatory Pre-Push Verification Workflow

Before running `git push`:
1. **Run Build Verification**:
   ```bash
   npm run build
   ```
   *Ensure exit code is 0 with zero syntax errors.*
2. **Git Commit Format**:
   ```bash
   git commit -m "chore(release): bump version to vX.Y.Z LIVE Beta, sync CHANGELOG, README, and VERSIONING"
   ```
3. **Dual Branch Synchronization**:
   - Push to development branch: `git push origin kenn/develop`
   - Merge to production branch:
     ```bash
     git checkout master
     git merge kenn/develop
     git push origin master
     git checkout kenn/develop
     ```
4. **Notify User of Netlify Deployment**:
   - Remind user that Netlify will automatically build the latest commit on `master`.
