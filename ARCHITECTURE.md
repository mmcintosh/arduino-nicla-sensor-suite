# Architecture Explanation

## How This Works Without SonicJS

You're right to question this! Let me clarify the architecture:

### What We Actually Built

This is a **standalone Cloudflare Workers application** that is:
- ✅ **Compatible** with SonicJS patterns
- ✅ Uses the same tech stack (Hono, D1, TypeScript)
- ✅ Can be integrated into SonicJS later
- ❌ **NOT** a SonicJS installation itself

### The Tech Stack

```
┌─────────────────────────────────────────┐
│  Your Application (Port 8787)          │
├─────────────────────────────────────────┤
│  Hono Framework (Web Server)            │  ← Lightweight, same as SonicJS uses
│  - Routes: /api/*, /, /history          │
│  - Static files: /css/*, /js/*          │
├─────────────────────────────────────────┤
│  Cloudflare Workers Runtime             │  ← V8 isolates, not Node.js
│  (Wrangler Dev Server locally)          │
├─────────────────────────────────────────┤
│  D1 Database (SQLite)                   │  ← Local .wrangler/state/ folder
│  - sessions table                       │
│  - sensor_readings table                │
└─────────────────────────────────────────┘
```

### How It Runs on localhost:8787

1. **Wrangler** (`npm run dev`) starts a local development server
2. **Hono** (the web framework in `src/index.ts`) handles HTTP requests
3. **D1** database runs as local SQLite in `.wrangler/state/`
4. Your browser connects to `http://localhost:8787`

### No Full SonicJS Needed Because...

**SonicJS is a CMS framework** - it provides:
- Content management
- Admin interface
- User authentication
- Full website builder

**We built a specialized IoT app** that only needs:
- Web server (Hono) ✅
- Database (D1) ✅
- API routes ✅
- Static file serving ✅

### The Dependencies Are Minimal

```json
{
  "dependencies": {
    "@cloudflare/workers-types": "^4.20241218.0",  // TypeScript types
    "hono": "^4.0.0",                               // Web framework
    "drizzle-orm": "^0.33.0"                        // Optional ORM
  }
}
```

**That's it!** No need for the full SonicJS package for this application.

### SonicJS Compatibility

If you later want to integrate this into a SonicJS site:

```bash
# In a SonicJS project
npx create-sonicjs my-site
cd my-site

# Copy our IoT routes into the SonicJS app
cp -r ../nicla/src/routes/* ./src/routes/
cp -r ../nicla/migrations/* ./migrations/

# They'll work seamlessly because both use Hono + D1
```

### Running Purely Locally (No Cloudflare)

```bash
# 1. Install dependencies
npm install

# 2. Setup local database (no auth needed)
npx wrangler d1 migrations apply DB --local

# 3. Start dev server
npm run dev

# That's it! Runs on localhost:8787
```

The local mode creates a SQLite database in `.wrangler/state/v3/d1/` directory.

### Why Port 8787?

That's Wrangler's default port for local development. It simulates the Cloudflare Workers environment locally.

### Summary

- ❌ This is NOT a full SonicJS CMS installation
- ✅ This IS a Cloudflare Workers app (like SonicJS apps are)
- ✅ Uses Hono framework (standalone, no SonicJS package needed)
- ✅ Runs completely locally for testing
- ✅ Can be deployed to Cloudflare later
- ✅ Can be integrated into SonicJS if you want

Think of it as: **A standalone IoT app built with the same architecture as SonicJS uses**, not **built inside SonicJS**.
