# How This Works - Visual Guide

## The Complete Picture

```
┌─────────────────────────────────────────────────────────────┐
│  YOUR COMPUTER (No Cloud, No Auth Required!)               │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. You run: npm run dev                                    │
│     ↓                                                       │
│  2. Wrangler starts (from node_modules)                     │
│     ↓                                                       │
│  3. Loads src/index.ts                                      │
│     ↓                                                       │
│  4. Hono web framework starts                               │
│     ↓                                                       │
│  5. Listening on http://localhost:8787                      │
│                                                             │
│  Database: .wrangler/state/v3/d1/*.sqlite (local file)     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## What Gets Installed

```
npm install downloads:

node_modules/
├── hono/              ← Web server (like Express.js)
├── wrangler/          ← Local dev server (simulates Cloudflare)
├── drizzle-orm/       ← Database toolkit (optional)
└── @cloudflare/workers-types/  ← TypeScript definitions

Total: ~50MB of standard npm packages
```

## Request Flow (Local Mode)

```
Browser (Chrome)
    ↓
    http://localhost:8787
    ↓
Wrangler Dev Server (on your computer)
    ↓
Hono Framework (src/index.ts)
    ↓
    ├─→ GET / → dashboard.ts → HTML
    ├─→ GET /history → history.ts → HTML  
    ├─→ POST /api/sessions/start → sessions.ts → DB
    ├─→ GET /js/dashboard.js → static file
    └─→ GET /css/styles.css → static file
    ↓
D1 Database (.wrangler/state/*.sqlite)
```

## Comparison: What You HAVE vs What You DON'T Need

### ✅ What You HAVE

```javascript
// package.json
{
  "dependencies": {
    "hono": "^4.0.0"  // ← This IS your web server!
  }
}

// src/index.ts
import { Hono } from 'hono';
const app = new Hono();
app.get('/', (c) => c.html('...'));  // ← Routes work!
export default app;
```

### ❌ What You DON'T Need

```javascript
// You DON'T need this:
"@sonicjs/core": "..."     // Full CMS package
"@sonicjs/admin": "..."    // Admin interface
"@sonicjs/auth": "..."     // Authentication system

// Because Hono alone provides:
- Web server ✅
- Routing ✅
- Static files ✅
- Everything needed for this IoT app ✅
```

## SonicJS vs This App

### SonicJS (Full CMS)
```
SonicJS Package
├── Hono (web server)
├── Admin UI
├── Content Management
├── User Auth
├── Page Builder
└── Your custom code
```

### This IoT App (Specialized)
```
Direct Dependencies
├── Hono (web server) ← Same as SonicJS uses!
└── Your IoT code
```

**Analogy**: 
- SonicJS = Buying a fully-loaded car
- This app = Building a custom race car with same engine

## Why Port 8787?

```
Wrangler's default port for local development
  ↓
Chosen to avoid conflicts with:
- 3000 (React/Next.js)
- 8000 (Python)  
- 8080 (Java/Tomcat)
  ↓
You can change it: wrangler dev --port 3000
```

## The "Magic" Explained

**There's no magic!** Here's exactly what happens:

1. **npm install** → Downloads Hono package to node_modules/
2. **npm run dev** → Runs `wrangler dev` command
3. **wrangler dev** → Reads src/index.ts
4. **src/index.ts** → Imports Hono from node_modules/
5. **Hono** → Starts HTTP server on port 8787
6. **Browser** → Connects to localhost:8787

It's just Node.js + a web framework, running locally!

## File Locations

```
Your Project Directory
├── node_modules/
│   ├── hono/              ← Web server code
│   └── wrangler/          ← Dev server tool
├── src/
│   └── index.ts           ← Uses Hono from node_modules
├── .wrangler/
│   └── state/
│       └── *.sqlite       ← Your local database
└── package.json           ← Lists Hono as dependency
```

## No Internet After Setup

```
✅ With Internet:
npm install  ← Downloads packages from npm registry

❌ Without Internet:
npm run db:migrate  ← Creates local DB file
npm run dev         ← Starts local server
Open browser        ← Connect to localhost

Everything works offline!
```

## SonicJS Compatibility Path

**If you later want to integrate with SonicJS:**

```bash
# Create a SonicJS project
npx create-sonicjs my-cms
cd my-cms

# Copy your IoT routes
cp -r ../nicla/src/routes/* ./src/routes/
cp -r ../nicla/migrations/* ./migrations/

# They work seamlessly because both use Hono + D1!
```

But for this IoT app, **SonicJS package is NOT required**.

## Quick Start (3 commands)

```bash
npm install          # Downloads Hono, Wrangler → node_modules/
npm run db:migrate   # Creates .wrangler/state/*.sqlite
npm run dev          # Starts Hono on localhost:8787

# Open: http://localhost:8787
```

**That's it!** No cloud, no auth, no SonicJS package needed.

## Summary

| Component | What It Is | Where It Comes From |
|-----------|-----------|---------------------|
| Web Server | Hono | npm install (package.json) |
| Dev Runtime | Wrangler | npm install (package.json) |
| Database | SQLite | Created by wrangler locally |
| Port 8787 | HTTP listener | Wrangler's default |
| Routes | Your code | src/routes/*.ts |
| Frontend | Your code | public/js/*.js |

**No SonicJS package installation needed** - Hono provides everything required for this IoT application!
