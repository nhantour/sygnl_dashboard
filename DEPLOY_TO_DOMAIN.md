# SYGNL Dashboard - Quick Deploy to sygnliq.com

## 🚀 FASTEST METHOD: Netlify Drop (3 minutes)

### Step 1: Download the Build
The dashboard is built and ready at:
`/tmp/sygnl-dashboard-dist.tar.gz` (313KB)

Or I can provide the files directly.

### Step 2: Upload to Netlify
1. Go to https://app.netlify.com/drop
2. Drag and drop the `dist` folder
3. Get instant URL (e.g., `https://abc123.netlify.app`)

### Step 3: Add Custom Domain (sygnliq.com)
1. In Netlify dashboard, go to Site settings → Domain management
2. Add custom domain: `sygnliq.com`
3. Netlify will show DNS instructions

### Step 4: Configure Porkbun DNS
1. Log into porkbun.com
2. Find `sygnliq.com` → Manage
3. Go to DNS Records
4. Delete any existing A records
5. Add these records:

| Type | Name | Content |
|------|------|---------|
| A | @ | 75.2.60.5 |
| A | @ | 99.83.231.61 |
| CNAME | www | [your-netlify-site].netlify.app |

Or use Netlify's nameservers (easier):
- `dns1.p07.nsone.net`
- `dns2.p07.nsone.net`
- `dns3.p07.nsone.net`
- `dns4.p07.nsone.net`

### Step 5: Wait for SSL
Netlify auto-provisions SSL certificate (5-10 minutes)

---

## 🚀 ALTERNATIVE: Vercel + GitHub (10 minutes)

Since you have the repo at `https://github.com/nhantour/sygnl_dashboard.git`:

### Step 1: Push Code to Your Repo
From your local machine:
```bash
cd /path/to/sygnl-dashboard
git init
git remote add origin https://github.com/nhantour/sygnl_dashboard.git
git add .
git commit -m "Initial dashboard"
git push -u origin main
```

Or manually upload files to GitHub web interface.

### Step 2: Deploy to Vercel
1. Go to https://vercel.com/new
2. Import `nhantour/sygnl_dashboard`
3. Framework: Next.js
4. Build Command: `npm run build`
5. Output Directory: `dist`
6. Environment Variables:
   ```
   ALPACA_API_KEY=PKMP5VADWPMYNGKPZUIZPZTFAX
   ALPACA_SECRET_KEY=CWEhv5aS2sT85e4kL3uzyxuijhneeGGNJxF6qyjDzf2k
   MOLTBOOK_API_KEY=moltbook_sk_A3ncAWefHvvW9-AkzbMpwrx-apgK5SPZ
   ```
7. Click Deploy

### Step 3: Add Custom Domain
1. In Vercel project → Settings → Domains
2. Add `sygnliq.com`
3. Vercel will verify and provide DNS settings

### Step 4: Porkbun DNS
Option A - A Records:
- A @ 76.76.21.21
- CNAME www cname.vercel-dns.com

Option B - Nameservers (easier):
- `ns1.vercel-dns.com`
- `ns2.vercel-dns.com`

---

## 📁 Dashboard Files Location

All files are ready at:
```
/home/ubuntu/.openclaw/workspace/sygnl-dashboard/
├── dist/              ← Upload this folder
├── app/
├── lib/
├── package.json
└── README.md
```

The `dist/` folder contains the static site (1.3MB).

---

## ✅ Verification Checklist

After deployment:
- [ ] Visit `sygnliq.com` - shows login page
- [ ] Password `sygnl2026` works
- [ ] Dashboard loads with dark theme
- [ ] Click refresh - portfolio updates from Alpaca
- [ ] SSL certificate active (https://)

---

## 🔑 Password

**Default:** `sygnl2026`

To change: Edit `app/page.js`, find the password check.

---

## 🆘 Need Help?

If you get stuck, I can:
1. Provide the raw HTML files to upload manually
2. Walk through Porkbun DNS setup step-by-step
3. Troubleshoot deployment errors

**Which method do you want to use?**
- Netlify Drop (fastest, no Git needed)
- Vercel + GitHub (better long-term)

Let me know and I'll guide you through!