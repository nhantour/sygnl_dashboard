# SYGNL Dashboard API Server Deployment

## Option D: OVH VPS Backend

This setup uses your existing OVH VPS as the data backend for the Vercel dashboard.

### Architecture
```
Vercel Dashboard (Frontend) → Vercel API Routes (Proxy) → OVH VPS (Data API) → Local Files/SQLite
```

### Step 1: Deploy API Server to OVH VPS

1. SSH into your OVH VPS:
```bash
ssh ubuntu@your-ovh-ip
```

2. Install dependencies:
```bash
cd ~/.openclaw/workspace/sygnl
pip3 install -r requirements-api.txt
```

3. Start the API server:
```bash
python3 dashboard_api_server.py
```

4. (Optional) Run with PM2 for persistence:
```bash
npm install -g pm2
pm2 start dashboard_api_server.py --name sygnl-api --interpreter python3
pm2 save
pm2 startup
```

### Step 2: Configure Firewall

Ensure port 8000 is open:
```bash
sudo ufw allow 8000/tcp
sudo ufw reload
```

### Step 3: Deploy Vercel Dashboard

The Vercel dashboard API routes are already configured to proxy to your OVH VPS.

```bash
cd ~/.openclaw/workspace/sygnl-dashboard
git add -A
git commit -m "Update APIs to use OVH VPS backend"
git push
```

### Step 4: Set Environment Variable (Optional)

If your OVH VPS IP changes, update the environment variable in Vercel:

1. Go to https://vercel.com/dashboard
2. Select sygnl-dashboard project
3. Settings → Environment Variables
4. Add: `OVH_API_URL=http://your-ovh-ip:8000`

### Step 5: Verify

Test the API:
```bash
curl http://your-ovh-ip:8000/health
curl http://your-ovh-ip:8000/holdings
curl http://your-ovh-ip:8000/stats
```

### Updating Data

The API server reads from the same local files. When your cron jobs update:
- `data/holdings.json`
- `data/intelligence.json`
- `data/signal_accuracy.json`

The API will immediately serve the new data (no restart needed).

### Monitoring

Check if API is running:
```bash
pm2 status
pm2 logs sygnl-api
```

### Troubleshooting

**Port already in use:**
```bash
sudo lsof -i :8000
sudo kill -9 <PID>
```

**Firewall blocking:**
```bash
sudo ufw status
sudo ufw allow 8000/tcp
```

**CORS errors:**
- Ensure OVH_API_URL is correct
- Check that CORS headers are set in dashboard_api_server.py
