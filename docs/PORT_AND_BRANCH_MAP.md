# Port and Branch Configuration Map

## ✅ FINAL DECISION: LOCKED DOWN

### Port 8787 = Experimental (CAN MODIFY)
- **Directory:** `/home/siddhartha/Documents/cursor-nicla-sense-me/nicla/`
- **Branch:** `feature/spa-enhanced`
- **Purpose:** Testing new features

### Port 8788 = Baseline (NEVER MODIFY)
- **Directory:** `/home/siddhartha/Documents/cursor-nicla-sense-me/nicla-working-baseline/`
- **Branch:** `main` (frozen)
- **Purpose:** Working reference version

---

## 🗂️ Directory Structure

```
/home/siddhartha/Documents/cursor-nicla-sense-me/
├── nicla/                          ← Port 8787 (EXPERIMENTAL)
└── nicla-working-baseline/         ← Port 8788 (STABLE BASELINE)
```

---

## 📍 Port 8787 - EXPERIMENTAL BRANCH

### Location
```
/home/siddhartha/Documents/cursor-nicla-sense-me/nicla/
```

### Branch
- **Current:** `feature/spa-enhanced` (just created, not modified yet)
- **Purpose:** Testing new features, SPA experiments, modifications
- **Status:** Work in progress

### Configuration
- **Port:** `8787` (hardcoded in `package.json`)
- **Database:** `.wrangler/state/v3` (local)
- **Start Command:** `npm run dev`

### Rules
1. ✅ **CAN** be modified for testing
2. ✅ **CAN** have experimental features
3. ✅ **CAN** break occasionally
4. ❌ **DO NOT** touch without discussing with user first

---

## 📍 Port 8788 - STABLE BASELINE

### Location
```
/home/siddhartha/Documents/cursor-nicla-sense-me/nicla-working-baseline/
```

### Branch
- **Branch:** `main` (copied from working version)
- **Purpose:** Reference implementation that works correctly
- **Status:** **FROZEN - DO NOT MODIFY**

### Configuration
- **Port:** `8788` (hardcoded in `package.json`)
- **Database:** `.wrangler/state/v3` (separate from 8787)
- **Start Command:** `npm run dev`

### Rules
1. ❌ **NEVER** modify code in this directory
2. ❌ **NEVER** run git commands here
3. ✅ **ONLY** use for comparison/testing
4. ✅ This is the "source of truth" for working features

---

## 🔒 Current Status

### Port 8787 State
- **Directory:** `/home/siddhartha/Documents/cursor-nicla-sense-me/nicla/`
- **Branch:** `feature/spa-enhanced`
- **Modified:** No (clean slate)
- **Running:** Yes (user is currently using it)
- **Features:** Multi-page dashboard with recording, history, analytics

### Port 8788 State
- **Directory:** `/home/siddhartha/Documents/cursor-nicla-sense-me/nicla-working-baseline/`
- **Branch:** `main` (frozen copy)
- **Modified:** No (frozen)
- **Running:** Should be (currently port conflict)
- **Features:** Exact same as 8787 (reference copy)

---

## 🚀 How to Start Servers

### Start Port 8787 (Experimental)
```bash
cd /home/siddhartha/Documents/cursor-nicla-sense-me/nicla
npm run dev
# Starts on http://localhost:8787
```

### Start Port 8788 (Baseline)
```bash
cd /home/siddhartha/Documents/cursor-nicla-sense-me/nicla-working-baseline
npm run dev
# Starts on http://localhost:8788
```

**Note:** Both servers can run simultaneously since they use different ports and databases.

---

## 🔄 Workflow for Making Changes

### Step 1: Test Baseline (8788)
User tests the working version on port 8788 to confirm it works.

### Step 2: Propose Changes
AI discusses what changes to make to port 8787.

### Step 3: User Approval
User approves the specific changes before any code is modified.

### Step 4: Modify Experimental (8787)
AI makes changes ONLY to `/home/siddhartha/Documents/cursor-nicla-sense-me/nicla/`

### Step 5: Compare
User tests both:
- Port 8788: Original (still working)
- Port 8787: New version (with changes)

### Step 6: Decision
- If 8787 is better → Merge changes to main
- If 8787 is broken → Revert changes, 8788 still works

---

## ⚠️ Mistakes to Avoid

### ❌ NEVER DO THIS:
1. Modify code in `nicla-working-baseline/` directory
2. Change port numbers without updating this doc
3. Make changes to 8787 without user approval
4. Mix up which directory is which port
5. Run git commands in `nicla-working-baseline/`

### ✅ ALWAYS DO THIS:
1. Check which directory you're in before making changes
2. Discuss changes before modifying 8787
3. Keep 8788 as pristine reference copy
4. Update this doc if ports/directories change
5. Ask user before running commands that affect running servers

---

## 📊 Branch Map (nicla directory only)

```
nicla/
├── main                        ← Production-ready (NOT CURRENTLY CHECKED OUT)
├── feature/spa-persistent-ble  ← Old SPA attempt (reverted)
└── feature/spa-enhanced        ← CURRENT (clean, ready for modifications)
```

---

## 🎯 Current Goal

**Objective:** Decide whether to:
1. Keep the working multi-page version as-is (both ports identical)
2. Build a true SPA on port 8787 (experimental)
3. Add specific features to port 8787 while keeping 8788 stable

**Status:** Awaiting user decision

---

## 📝 Change Log

- **2026-01-13 01:15 UTC:** Created this document
- **2026-01-13 01:15 UTC:** Reset port 8787 to clean state (feature/spa-enhanced branch)
- **2026-01-13 01:15 UTC:** Port 8788 frozen as baseline reference

---

**Last Updated:** 2026-01-13 01:15 UTC  
**Maintained By:** AI Assistant  
**Approved By:** User (pending)
