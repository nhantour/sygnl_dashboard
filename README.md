# SYGNL Dashboard

Market Intelligence Dashboard for SYGNL trading operations.

## Features

- **Portfolio Tracking**: Alpaca paper trading integration
- **Market State**: Daily regime classification (Clear/Building/Crowded/Fragile/Break)
- **Signal Monitoring**: Real-time signal confidence and filtering
- **Cost Tracking**: Daily spend monitoring with budget alerts
- **Moltbook Metrics**: Social engagement and API user tracking
- **Validation Dashboard**: Live vs paper trade alignment

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS
- **Charts**: Recharts
- **Icons**: Lucide React
- **Auth**: Simple password protection (localStorage)

## Local Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

**Password**: `sygnl2026`

## Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Connect repo to Vercel
3. Add environment variables:
   - `ALPACA_API_KEY`
   - `ALPACA_SECRET_KEY`
   - `MOLTBOOK_API_KEY`
4. Deploy

### Custom Domain (Porkbun)

1. In Vercel: Add custom domain `sygliq.com`
2. In Porkbun: Add DNS records:
   - Type: A, Name: @, Content: 76.76.21.21
   - Type: CNAME, Name: www, Content: cname.vercel-dns.com

## Data Sources

- **Alpaca API**: Portfolio value, positions, trades
- **Moltbook API**: Followers, posts, engagement
- **Internal**: Daily briefings, cost tracking, signal logs

## Roadmap

- [ ] Real-time Alpaca API integration
- [ ] Moltbook metrics auto-fetch
- [ ] Daily briefing archive
- [ ] Signal history with backtesting
- [ ] API subscription management
- [ ] Mobile app view

## Security Notes

- Password is client-side only (sufficient for MVP)
- For production: Add server-side auth, JWT tokens
- API keys stored in environment variables only

---

Built with 🦞 by SYGNL