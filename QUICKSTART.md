# Quick Setup Commands

This is a quick reference for setting up the IoT platform. See [SETUP.md](./SETUP.md) for detailed instructions.

## Initial Setup

```bash
# 1. Install dependencies
npm install

# 2. Login to Cloudflare
wrangler login

# 3. Create local database
wrangler d1 create nicla-sensor-db-dev

# 4. Update wrangler.toml with the database ID from step 3

# 5. Run migrations
wrangler d1 migrations apply nicla-sensor-db-dev --local

# 6. Start development server
npm run dev

# 7. Open http://localhost:8787 in Chrome/Edge
```

## Common Commands

```bash
# Development
npm run dev                    # Start dev server
npm run build                  # Build TypeScript

# Database
npm run db:migrate             # Apply migrations (local)
npm run db:migrate:prod        # Apply migrations (production)

# View database (local)
wrangler d1 execute nicla-sensor-db-dev --local --command="SELECT * FROM sessions"

# Deployment
npm run deploy                 # Deploy to Cloudflare Workers
```

## Testing the Platform

1. **Start a recording session**: Click "Start Recording" button
2. **Name your session**: e.g., "Test Run 1"
3. **Connect device**: Click "Connect" and select your Arduino
4. **Watch data flow**: Real-time graphs and 3D visualization
5. **Stop recording**: Click "Stop Recording" when done
6. **View history**: Navigate to History page to see all sessions
7. **Export data**: Download CSV or JSON from session details

## Arduino Sketch

Upload this sketch to your Nicla Sense ME:
https://create.arduino.cc/editor/FT-CONTENT/333e2e07-ecc4-414c-bf08-005b611ddd75/preview

## Browser Requirements

- ✅ Chrome 56+
- ✅ Edge 79+
- ✅ Opera 43+
- ❌ Firefox (no Web Bluetooth support)
- ❌ Safari (no Web Bluetooth support)

## Project URLs

- **Local Development**: http://localhost:8787
- **Production**: https://your-app.workers.dev (after deployment)
- **Dashboard**: `/` - Real-time monitoring
- **History**: `/history` - View past sessions
- **API**: `/api/*` - REST API endpoints

## Troubleshooting

- **Can't connect to Arduino**: Make sure Bluetooth is on and sketch is uploaded
- **No data saving**: Check that you started a recording session first
- **Database errors**: Run migrations with `npm run db:migrate`
- **Build errors**: Delete `node_modules` and run `npm install` again

For detailed troubleshooting, see [SETUP.md](./SETUP.md#troubleshooting).
