# Quick Deploy Guide - Cloudflare Preview

## 🚀 Deploy to Cloudflare (Preview)

### Prerequisites
```bash
# Make sure you're logged in
npx wrangler login
```

### Step 1: Create Production D1 Database
```bash
# Create the database
npx wrangler d1 create nicla-sensor-db

# Copy the database_id from output and update wrangler.toml
```

### Step 2: Update wrangler.toml
```toml
[[d1_databases]]
binding = "DB"
database_name = "nicla-sensor-db"
database_id = "YOUR_DATABASE_ID_HERE"  # From step 1
```

### Step 3: Run Migrations
```bash
# Apply migrations to production database
npx wrangler d1 migrations apply DB --remote
```

### Step 4: Deploy!
```bash
# Deploy to Cloudflare
npx wrangler deploy
```

Your app will be live at: `https://nicla-sense-platform.YOUR_SUBDOMAIN.workers.dev`

## 🧪 CI/CD Status

Current test status:
- ✅ Sessions API: 13/13 passing
- ✅ Helpers: 23/23 passing  
- ✅ Integration: 8/8 passing
- ⚠️  Analytics: 9/13 passing (4 tests need mock data setup)
- ⚠️  Sensor Data: Needs fixes

### To Fix CI:
The failing tests need proper mock database setup. Options:
1. Skip flaky tests in CI with `.skip()`
2. Set up proper test database with seed data
3. Mock the database responses better

## 🔄 GitHub Actions

CI runs on every push to `main`. Check status at:
https://github.com/mmcintosh/arduino-nicla-sensor-suite/actions

Current workflow:
- Builds on Node 18.x and 20.x
- Runs linter
- Builds TypeScript
- Runs tests
- Uploads coverage

## 📝 Notes

- Local dev uses `.wrangler/state/v3/d1/` for database
- Production uses Cloudflare D1 (remote)
- Web Bluetooth only works over HTTPS (Cloudflare provides this)
- Browser console logging won't work in production (use Cloudflare Logs)
