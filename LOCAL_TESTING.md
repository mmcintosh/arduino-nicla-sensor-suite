# Local Testing Guide (No Cloudflare Account Needed)

## Running Completely Locally

You can test this application entirely on your local machine without any Cloudflare account or authentication.

### How It Works

When you run `npm run dev`, Wrangler creates:
- A local web server on `http://localhost:8787`
- A local SQLite database in `.wrangler/state/` folder
- Simulates the Cloudflare Workers environment

**No internet connection needed after initial `npm install`!**

### Quick Local Setup

```bash
# 1. Install dependencies (one-time, needs internet)
npm install

# 2. Create local database and run migrations
npm run db:migrate

# 3. Start local server
npm run dev

# 4. Open browser
# Go to: http://localhost:8787
```

That's it! No Cloudflare login required.

### What Gets Created

```
.wrangler/
└── state/
    └── v3/
        └── d1/
            └── miniflare-D1DatabaseObject/
                └── *.sqlite   ← Your local database here
```

### Local Development Commands

```bash
# Start dev server
npm run dev

# View database (sessions table)
npm run db:studio

# Query database manually
npx wrangler d1 execute DB --local --command="SELECT * FROM sessions"

# Reset database
rm -rf .wrangler/state/
npm run db:migrate
```

### Testing Workflow

1. **Start server**: `npm run dev`
2. **Open app**: http://localhost:8787
3. **Start recording session**: Click "Start Recording"
4. **Connect Arduino**: Click "Connect" (requires Web Bluetooth)
5. **Collect data**: Watch real-time graphs
6. **Stop session**: Click "Stop Recording"
7. **View history**: Navigate to http://localhost:8787/history
8. **Export data**: Download CSV/JSON

### Advantages of Local Testing

- ✅ No Cloudflare account needed
- ✅ No internet required (after setup)
- ✅ Fast iteration
- ✅ Free unlimited requests
- ✅ Full database access
- ✅ No deployment delays
- ✅ Debug easily with console.log

### When You Need Cloudflare

You only need a Cloudflare account when you want to:
- Deploy to production
- Share with others online
- Use the global edge network
- Store data permanently in the cloud

### Deploying Later (Optional)

When ready for production:

```bash
# 1. Login to Cloudflare (one-time)
wrangler login

# 2. Create production database
wrangler d1 create nicla-sensor-db-prod

# 3. Update wrangler.toml with the database ID

# 4. Run production migrations
npm run db:migrate:prod

# 5. Deploy
npm run deploy
```

### Local vs Production

| Feature | Local (`npm run dev`) | Production (`npm run deploy`) |
|---------|----------------------|-------------------------------|
| Cloudflare Account | ❌ Not needed | ✅ Required |
| Database Location | `.wrangler/state/` | Cloudflare D1 |
| URL | localhost:8787 | your-app.workers.dev |
| Speed | Fast | Faster (edge) |
| Cost | Free | Free tier available |
| Sharing | No | Yes |
| Data Persistence | Local only | Cloud storage |

### Troubleshooting Local Mode

**"Module not found" errors**
```bash
npm install
```

**"Database not found" errors**
```bash
npm run db:migrate
```

**"Port 8787 in use" errors**
```bash
# Kill existing process
lsof -ti:8787 | xargs kill -9
# Or use different port
wrangler dev --port 8788
```

**Want fresh start**
```bash
rm -rf .wrangler/
rm -rf node_modules/
npm install
npm run db:migrate
npm run dev
```

### Summary

**For local testing, you only need:**
1. Node.js installed
2. Run `npm install`
3. Run `npm run db:migrate`
4. Run `npm run dev`

**NO Cloudflare account, NO authentication, NO deployment needed!**

The app runs entirely on your machine using Wrangler's local development mode.
