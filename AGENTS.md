# CourseIT Ai — Agent Operating Guidelines & Release Protocol

> **CRITICAL DIRECTIVE FOR ALL AI ASSISTANTS & AGENTS WORKING ON THIS REPO:**  
> This project adheres to strict Semantic Versioning. Because there is NO automated CI bot to increment versions, **YOU must manually execute the full versioning and changelog synchronization checklist for EVERY push or release** (even small hotfixes, patches, or config updates).

---

## 📌 Never Push Without SemVer Synchronization

Whenever you make changes, bug fixes, or new features, determine the version bump:
- **Small / Bug Fix / Hotfix / Config tweak**: **PATCH** (`1.11.1` → `1.11.2`)
- **Big / Feature / New UI / Routing changes**: **MINOR** (`1.11.x` → `1.12.0`)
- **Breaking changes**: **MAJOR** (`1.x.x` → `2.0.0`)

Active releases are labeled: `vX.Y.Z LIVE Beta`.

---

## 📋 The 6 Required Files to Update Together

Every release must update all 6 files simultaneously to prevent version drift:

1. **[`src/constants/version.js`](src/constants/version.js)**  
   Update `CURRENT_VERSION`, `CURRENT_VERSION_LABEL`, `RELEASE_DATE`, and `RELEASE_NAME`.
2. **[`package.json`](package.json)**  
   Update `"version": "X.Y.Z"`.
3. **[`src/data/changelog.js`](src/data/changelog.js)**  
   Add the new release object with `badge: 'Latest Release'`, highlights, and notes at the top.
4. **[`CHANGELOG.md`](CHANGELOG.md)**  
   Add the new version section following [Keep a Changelog](https://keepachangelog.com/).
5. **[`VERSIONING.md`](VERSIONING.md)**  
   Synchronize the single source of truth code snippet and package.json version reference.
6. **[`README.md`](README.md)**  
   Update version shield badge (`![Version](...)`), `Current Production Version` text, latest commit link, and the `Recent Release Notes` list.

---

## 🛠️ Pre-Push & Release Checklist

1. **Verify Build**: Run `npm run build` locally and ensure exit code 0.
2. **Check Tracking**: Run `git status` to ensure all 6 files are included in the commit.
3. **Commit on Develop**: `git commit -m "chore(release): bump version to vX.Y.Z LIVE Beta, sync CHANGELOG, README, and VERSIONING"`
4. **Push Develop**: `git push origin kenn/develop`
5. **Merge & Push Master**:
   ```bash
   git checkout master
   git merge kenn/develop
   git push origin master
   git checkout kenn/develop
   ```
6. **Deploy Verification**: Netlify auto-deploys `master` to `https://courseitai.kenncode.me`.

*Detailed rules and background context are preserved in [`.agents/rules/versioning.md`](.agents/rules/versioning.md) and [`VERSIONING.md`](VERSIONING.md).*
