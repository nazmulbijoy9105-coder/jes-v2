# JesAI v2.0 FREE — Build Fix Log & Git Commands

## 🔴 Error 1 (FIXED)
```
Error: Configuring Next.js via 'next.config.ts' is not supported.
```
**Fix:** Renamed `next.config.ts` → `next.config.mjs`

## 🔴 Error 2 (FIXED)
```
Type error: Cannot find module 'dotenv' or its corresponding type declarations.
  ./scripts/seed-knowledge-base.ts:3:24
```
**Fix:** 
1. Removed `import { config } from 'dotenv'` from seed script
2. Added `"exclude": ["node_modules", "scripts"]` to `tsconfig.json`
3. Created `.vercelignore` to skip scripts/ during Vercel build

**Why:** Next.js compiles ALL `.ts` files during build. Scripts are run separately via `npx tsx` and don't need to be compiled.

---

## 🚀 Redeploy Now

```bash
# 1. Extract the fixed zip OVER your repo
cd jes-v2

# 2. Verify fixes
ls next.config.mjs          # should exist (NOT .ts)
cat tsconfig.json | grep -A1 '"exclude"'   # should show "scripts"
ls .vercelignore            # should exist

# 3. Stage, commit, push
git add -A
git commit -m "fix: remove dotenv from scripts, exclude scripts from build"
git push origin main

# 4. Vercel auto-deploys. Check status:
npx vercel ls
```

---

## 📋 All Git Commands for Future Fixes

```bash
# After ANY edit:
git add -A && git commit -m "fix: description" && git push origin main

# Check deploy status:
npx vercel ls

# View build errors:
npx vercel logs --all | tail -50

# Add env var:
npx vercel env add KEY_NAME

# Rollback:
git revert HEAD --no-edit && git push origin main
```
