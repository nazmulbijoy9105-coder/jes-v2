# JesAI v2.0 FREE — Build Fix Log & Git Commands

## 🔴 Error Fixed

```
Error: Configuring Next.js via 'next.config.ts' is not supported.
Please replace the file with 'next.config.js' or 'next.config.mjs'.
```

## ✅ Fixes Applied

### Fix 1: next.config.ts → next.config.mjs
**Problem:** Next.js 14.2 does NOT support `.ts` config files.
**Solution:** Renamed to `.mjs` and converted to plain ESM JavaScript.

```bash
# If you need to do this manually:
mv next.config.ts next.config.mjs
# Then rewrite content as ESM (see next.config.mjs)
```

### Fix 2: Removed vercel.json "builds" array
**Problem:** `builds` array in vercel.json causes warning and overrides auto-detection.
**Solution:** Removed `builds` — Vercel auto-detects Next.js from package.json.

```bash
# Edit vercel.json — remove this:
"builds": [{ "src": "package.json", "use": "@vercel/next" }],
# Keep only crons
```

### Fix 3: Added deploy.sh script
One-command deploy after any fix.

---

## 🚀 Quick Fix & Deploy (Copy-Paste These)

### Option A: Automatic (run deploy.sh)
```bash
chmod +x deploy.sh
./deploy.sh
```

### Option B: Manual Git Commands
```bash
# 1. Stage ALL changes
git add -A

# 2. Commit
git commit -m "fix: build fixes for Vercel — $(date '+%Y-%m-%d %H:%M')"

# 3. Push to GitHub (triggers Vercel auto-deploy)
git push origin main

# 4. Or deploy manually with Vercel CLI
npx vercel --prod

# 5. Check deployment logs
npx vercel logs --all

# 6. Open live site
npx vercel open
```

---

## 🔧 Common Vercel Build Errors & Fixes

### Error: "Cannot find module '@/lib/types'"
```bash
# Fix: Ensure tsconfig.json has paths configured
cat tsconfig.json | grep -A 3 '"paths"'
# Should show: "@/*": ["./src/*"]
```

### Error: "Module not found: groq-sdk"
```bash
# Fix: Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
git add package-lock.json
git commit -m "fix: reinstall deps"
git push
```

### Error: "Supabase URL not found"
```bash
# Fix: Check env vars in Vercel dashboard
npx vercel env ls
# Add missing vars:
npx vercel env add GROQ_API_KEY
npx vercel env add HF_API_TOKEN
npx vercel env add NEXT_PUBLIC_SUPABASE_URL
npx vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
npx vercel env add SUPABASE_SERVICE_ROLE_KEY
```

### Error: "pgvector extension not found"
```bash
# Fix: Enable in Supabase dashboard
# Go to: Database → Extensions → Search "vector" → Enable
# Then re-deploy: git push origin main
```

### Error: "Build exceeded maximum duration"
```bash
# Fix: Increase timeout in vercel.json
# Add: "functions": { "src/app/api/chat/route.ts": { "maxDuration": 30 } }
```

---

## 📋 Complete Git Workflow for Any Future Fix

```bash
# === STEP 0: Pull latest (if working on multiple machines) ===
git pull origin main

# === STEP 1: Make your fix ===
# Edit any file...

# === STEP 2: Check what changed ===
git status
git diff

# === STEP 3: Stage changes ===
git add -A
# OR stage specific files:
git add next.config.mjs
git add src/lib/safety/scanner.ts

# === STEP 4: Commit with descriptive message ===
git commit -m "fix: [what you fixed]"
# Examples:
git commit -m "fix: next.config.ts → .mjs for Vercel build"
git commit -m "feat: add more safety keywords"
git commit -m "fix: correct section numbers in company law"

# === STEP 5: Push (auto-triggers Vercel deploy) ===
git push origin main

# === STEP 6: Monitor deploy ===
npx vercel --version
npx vercel ls
npx vercel logs

# === STEP 7: If deploy fails, check logs ===
npx vercel logs --all | tail -50
```

---

## 🔄 Rollback (If New Deploy Breaks)

```bash
# Find last working commit
git log --oneline -10

# Revert to last working commit
git revert HEAD --no-edit
git push origin main

# OR hard reset (DANGER: loses changes)
git reset --hard [commit-hash]
git push origin main --force
```

---

## 🌍 Vercel CLI Commands Reference

```bash
# Login
npx vercel login

# Link project
npx vercel link

# Deploy to preview
npx vercel

# Deploy to production
npx vercel --prod

# Open live site
npx vercel open

# View logs
npx vercel logs

# List deployments
npx vercel ls

# Remove deployment
npx vercel remove [url]

# Environment variables
npx vercel env ls
npx vercel env add KEY_NAME
npx vercel env rm KEY_NAME
```

---

## ✅ Vercel-Only Deploy Checklist (No Localhost)

- [ ] Repo pushed to GitHub
- [ ] Vercel connected to GitHub repo
- [ ] All env vars set in Vercel dashboard
- [ ] Supabase pgvector enabled
- [ ] Migration SQL run in Supabase
- [ ] `next.config.mjs` exists (NOT `.ts`)
- [ ] `vercel.json` has NO `builds` array
- [ ] `package.json` has `"build": "next build"`
- [ ] Push to main → auto-deploys
- [ ] Run seed script after first deploy
