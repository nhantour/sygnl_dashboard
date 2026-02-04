# SYGNL Dashboard Deployment Guide

## Option 1: Vercel (Recommended - Easiest)

### Step 1: Create GitHub Repository

1. Go to https://github.com/new
2. Repository name: `sygnl-dashboard`
3. Make it private
4. Don't initialize with README (we have one)

### Step 2: Push Code to GitHub

```bash
cd /home/ubuntu/.openclaw/workspace/sygnl-dashboard
git remote add origin https://github.com/YOUR_USERNAME/sygnl-dashboard.git
git branch -M main
git push -u origin main
```

### Step 3: Deploy to Vercel

1. Go to https://vercel.com/new
2. Import your GitHub repository
3. Framework Preset: Next.js
4. Build Command: `npm run build`
5. Output Directory: `dist`
6. Environment Variables (add these):
   ```
   ALPACA_API_KEY=PKMP5VADWPMYNGKPZUIZPZTFAX
   ALPACA_SECRET_KEY=CWEhv5aS2sT85e4kL3uzyxuijhneeGGNJxF6qyjDzf2k
   MOLTBOOK_API_KEY=moltbook_sk_A3ncAWefHvvW9-AkzbMpwrx-apgK5SPZ
   ```
7. Click Deploy

### Step 4: Add Custom Domain

1. In Vercel dashboard, go to your project
2. Click Settings → Domains
3. Add `sygliq.com`
4. Vercel will provide DNS records

### Step 5: Configure Porkbun DNS

1. Log into porkbun.com
2. Go to Domain Management → sygliq.com
3. Click "Edit" next to Authoritative Nameservers
4. Use Vercel's nameservers:
   - `ns1.vercel-dns.com`
   - `ns2.vercel-dns.com`
5. Save

DNS propagation takes 5-60 minutes.

---

## Option 2: Manual Vercel Deploy (No Git)

### Step 1: Install Vercel CLI Locally

```bash
npm i -g vercel
vercel login
```

### Step 2: Deploy from Local Machine

```bash
cd /home/ubuntu/.openclaw/workspace/sygnl-dashboard
vercel --prod
```

### Step 3: Configure Environment Variables

In Vercel dashboard:
- Go to Project Settings → Environment Variables
- Add the variables listed in Option 1
- Redeploy

---

## Option 3: Cloudflare Pages (Alternative)

### Step 1: Build Locally

```bash
cd /home/ubuntu/.openclaw/workspace/sygnl-dashboard
npm run build
```

### Step 2: Create Cloudflare Pages Project

1. Go to https://dash.cloudflare.com
2. Pages → Create a project
3. Upload the `dist` folder

### Step 3: Add Environment Variables

In Cloudflare Pages settings:
- Add the API keys as environment variables
- Redeploy

---

## Option 4: Netlify Drop (Fastest - 2 Minutes)

### Step 1: Build

```bash
cd /home/ubuntu/.openclaw/workspace/sygnl-dashboard
npm run build
```

### Step 2: Drag & Drop Deploy

1. Go to https://app.netlify.com/drop
2. Drag the `dist` folder onto the page
3. Get instant URL (e.g., `https://abc123.netlify.app`)

### Step 3: Add Custom Domain

1. Site settings → Domain management
2. Add custom domain: `sygliq.com`
3. Configure DNS in Porkbun to point to Netlify

---

## Password Access

**Default Password:** `sygnl2026`

To change: Edit `app/page.js` and update the password check.

---

## API Keys Reference

All keys are hardcoded in `lib/api.js` for MVP. For production:

1. Move keys to environment variables
2. Update `lib/api.js` to read from `process.env`
3. Add to Vercel/Cloudflare/Netlify environment settings

---

## Post-Deployment Verification

1. Visit your domain
2. Login with password `sygnl2026`
3. Click refresh button - should fetch real Alpaca data
4. Check that portfolio value updates
5. Verify Moltbook stats load

---

## Troubleshooting

**Blank page after login:**
- Check browser console for errors
- Verify localStorage is working
- Clear localStorage and try again

**API errors:**
- Alpaca keys may be rate limited
- Check browser Network tab
- Verify API keys are correct

**Charts not loading:**
- Recharts requires client-side rendering
- Should work automatically (useEffect + mounted state)

---

## Current Status

✅ Dashboard code complete
✅ Real API integrations added
✅ Static build ready (1.3MB)
✅ Dark theme implemented
✅ Password protection working
⏳ Awaiting deployment

**Ready to ship! 🚀**