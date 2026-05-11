#!/bin/bash
# Vercel deployment script — run this after any fix

echo "=== JesAI v2.0 FREE — Vercel Deploy Script ==="
echo ""

# 1. Stage all changes
echo "[1/6] Staging changes..."
git add -A

# 2. Commit with timestamp
echo "[2/6] Committing..."
git commit -m "fix: $(date '+%Y-%m-%d %H:%M') — build fixes for Vercel"

# 3. Push to main
echo "[3/6] Pushing to GitHub..."
git push origin main

# 4. Deploy to Vercel (production)
echo "[4/6] Deploying to Vercel..."
npx vercel --prod --yes

# 5. Show status
echo "[5/6] Checking deployment status..."
npx vercel ls

echo ""
echo "=== Done! Your app is live at: ==="
echo "https://jes-v2.vercel.app (or your custom domain)"
