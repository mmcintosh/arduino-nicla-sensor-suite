# Cloudflare Deployment Plan

## 📋 Resource Naming Conventions

### Environments
- **Staging**: `nicla-sensor-staging`
- **Production**: `nicla-sensor-prod`

### D1 Databases
- **Staging**: `nicla-sensor-db-staging`
- **Production**: `nicla-sensor-db-prod`

### Workers
- **Staging**: `nicla-sense-platform-staging`
- **Production**: `nicla-sense-platform-prod`

### Custom Domains
- **Staging**: `staging.sensorsuites.com`
- **Production**: `nicla.sensorsuites.com` (or `sensorsuites.com`)

**Note**: Domain `sensorsuites.com` is already owned and ready for production deployment.

---

## 🚀 Deployment Steps

### Phase 1: Staging Environment

#### 1. Create D1 Database (Staging)
```bash
wrangler d1 create nicla-sensor-db-staging
```
- Copy the database ID to `wrangler.toml`
- Update binding name if needed

#### 2. Apply Migrations (Staging)
```bash
wrangler d1 migrations apply nicla-sensor-db-staging --remote
```

#### 3. Deploy to Staging
```bash
wrangler deploy --env staging
```

#### 4. Test Staging
- Verify API endpoints work
- Test Web Bluetooth connection (requires HTTPS ✅)
- Record sample session
- Check data in D1 database
- **URL**: `https://staging.sensorsuites.com` (or `*.workers.dev` initially)

### Phase 2: Production Environment

#### 1. Create D1 Database (Production)
```bash
wrangler d1 create nicla-sensor-db-prod
```

#### 2. Apply Migrations (Production)
```bash
wrangler d1 migrations apply nicla-sensor-db-prod --remote
```

#### 3. Setup Custom Domain
```bash
# Configure custom domain in Cloudflare Dashboard or via wrangler
wrangler domains add nicla.sensorsuites.com
```

#### 4. Deploy to Production
```bash
wrangler deploy --env production
```

**Production URL**: `https://nicla.sensorsuites.com` (or `https://sensorsuites.com`)

---

## 📦 Optional: R2 Storage

**Do we need R2?** Currently, all data is stored in D1 (SQLite). R2 would be useful for:
- Exporting large CSV files
- Storing sensor data archives
- Backup/restore functionality

**Recommendation**: Start without R2, add later if needed.

---

## ⚡ Caching Strategy

### Current Implementation
- No explicit caching (Cloudflare Workers are already fast)
- D1 queries are efficient for our use case

### Optional Enhancements
1. **KV for Sessions**: Cache active sessions in KV for faster access
2. **Browser Caching**: Add `Cache-Control` headers for static assets
3. **Analytics Caching**: Cache analytics summaries (5-15 minutes)

**Recommendation**: Start without additional caching, monitor performance.

---

## 🔐 Environment Variables

None currently required, but consider:
- `CORS_ORIGIN`: Restrict CORS if needed
- `MAX_SESSIONS`: Limit concurrent sessions
- `API_KEY`: Optional API authentication

---

## 📊 Wrangler Configuration

Create `wrangler.toml` environments:

```toml
name = "nicla-sense-platform"
main = "src/index.ts"
compatibility_date = "2024-01-01"

[[d1_databases]]
binding = "DB"
database_name = "nicla-sensor-db"
database_id = "YOUR_LOCAL_DB_ID"

[env.staging]
name = "nicla-sense-platform-staging"

[[env.staging.d1_databases]]
binding = "DB"
database_name = "nicla-sensor-db-staging"
database_id = "STAGING_DB_ID"

[env.production]
name = "nicla-sense-platform-prod"

[[env.production.d1_databases]]
binding = "DB"
database_name = "nicla-sensor-db-prod"
database_id = "PRODUCTION_DB_ID"
```

---

## ✅ Pre-Deployment Checklist

- [ ] Domain `sensorsuites.com` added to Cloudflare account
- [ ] DNS configured (nameservers pointing to Cloudflare)
- [ ] Naming conventions approved
- [ ] `wrangler.toml` configured for staging & production
- [ ] D1 database created (staging)
- [ ] Migrations applied (staging)
- [ ] All tests passing in CI (64 unit + 23 E2E)
- [ ] Custom domain routes configured

---

## 🎯 Next Actions

**Confirmed:**
- ✅ Production domain: `sensorsuites.com` (or `nicla.sensorsuites.com`)
- ✅ Staging domain: `staging.sensorsuites.com`
- ✅ Resource naming approved

**Ready to deploy:**
1. Update `wrangler.toml` with staging/production configs
2. Verify `sensorsuites.com` is in your Cloudflare account
3. Create D1 databases (staging & production)
4. Deploy to staging first
5. Test staging environment
6. Deploy to production

**Would you like me to:**
- Update `wrangler.toml` now?
- Deploy to staging?
- Setup both environments?
