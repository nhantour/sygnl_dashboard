# SYGNL Dashboard MVP - Action Plan

## Goal
Build product-focused demo dashboard for SYGNL signal platform launch.

---

## Demo Account Requirements

### What's IN (Product Features)
- ✅ SYGNL signal metrics
- ✅ Sample portfolio (daily updating)
- ✅ Market state classification
- ✅ Signal feed (BUY/SELL/HOLD)
- ✅ Stock search with SYGNL insights
- ✅ Company logos
- ✅ Performance tracking
- ✅ Intelligence hub (markets/stocks only)

### What's OUT (Internal Tools)
- ❌ Moltbook metrics
- ❌ OpenClaw tips/content
- ❌ Internal cost tracking
- ❌ API conversion goals
- ❌ Validation trade progress

---

## Recommended Sections (MVP)

### 1. Hero/Overview
- Portfolio value (sample data)
- Day P&L with market context
- Active signals count
- Current market state (Clear/Building/Crowded/Fragile/Break)
- Win rate metric (target: 70%+)

### 2. Live Holdings (Sample Portfolio)
- 7-10 sample positions
- Real market prices (delayed for demo)
- SYGNL signal overlay on each position
- Allocation percentages
- Performance per position

### 3. Stock Search (NEW - Priority)
- **Search bar**: Predictive, autofill
- **Company logos**: Display with search results
- **SYGNL Insight**: Signal confidence, recommendation
- **Current price**: Real-time (delayed for demo)
- **Market state**: For individual stock
- **Recent signals**: History for that ticker

### 4. Signal Feed
- Recent SYGNL signals
- Filter by: BUY/SELL/HOLD
- Confidence levels (70%+ highlighted)
- Market state at signal time
- Performance since signal (for closed positions)

### 5. Market State Dashboard
- Overall market regime
- 15-ticker universe status
- Heat map of market states
- State transitions (entering/exiting)

### 6. Performance Metrics
- Win rate (70%+ target)
- Average return per signal
- Signals by confidence bucket
- Comparison: SYGNL vs buy-and-hold
- Track record (validated trades)

### 7. Intelligence Hub (Refocused)
- Stock-specific intel
- ETF analysis
- Market sector trends
- Stable coin signals (if applicable)
- Economic indicators affecting signals
- **REMOVE**: OpenClaw, internal tools, agent tips

### 8. Watchlist
- User's saved tickers
- SYGNL signals on watchlisted stocks
- Price alerts (visual only for demo)

---

## Logo Upload

### How to Send Your Logo:
1. **Format**: PNG with transparent background (ideal)
2. **Size**: 512x512px minimum
3. **Send via**: 
   - Upload to this chat
   - Or: `scp logo.png ubuntu@vps-9d59e819:/home/ubuntu/.openclaw/workspace/sygnl-dashboard/public/`
   - Or: Email to yourself and I'll grab it

### Where It Goes:
- `/sygnl-dashboard/public/logo.png` - Main logo
- `/sygnl-dashboard/public/logo-icon.png` - Favicon/small version
- Used in: Header, login page, meta tags

---

## Company Logos for Stocks

### Approach:
Option 1: **External API** (recommended)
- Use Clearbit Logo API: `https://logo.clearbit.com/{domain}.com`
- Map tickers to domains (AAPL → apple.com)
- Fallback to generic icon if not found

Option 2: **Static Assets**
- Download logos for 15-ticker universe
- Store in `/public/logos/{TICKER}.png`
- Guaranteed availability

**Recommendation**: Start with Option 1 (Clearbit), cache results

---

## Search Implementation

### Features:
1. **Predictive Search**
   - Autocomplete ticker symbols
   - Company name search
   - Keyboard navigation (↑↓Enter)

2. **Search Results Card**
   ```
   [LOGO] AAPL - Apple Inc.
   ─────────────────────────
   Price: $195.82  ▲ +1.2%
   SYGNL: BUY (84% confidence)
   State: Building
   ─────────────────────────
   [View Analysis] [Add to Watchlist]
   ```

3. **Data Sources**
   - Prices: Yahoo Finance API (free tier)
   - Logos: Clearbit API
   - SYGNL signals: Internal algorithm

---

## Technical Stack Additions

### New Dependencies:
```bash
npm install @heroicons/react  # Already have lucide, but heroicons has more
npm install react-select       # For searchable dropdown
npm install fuse.js            # Fuzzy search for stocks
```

### APIs Needed:
1. **Stock Prices**: Yahoo Finance (free) or Alpha Vantage
2. **Company Logos**: Clearbit Logo API (free)
3. **SYGNL Signals**: Internal (already have)

---

## Sample Portfolio (Demo)

### Holdings (7 positions):
| Symbol | Company | Allocation | Signal |
|--------|---------|------------|--------|
| AAPL | Apple | 15% | BUY (84%) |
| NVDA | NVIDIA | 12% | ADD (74%) |
| MSFT | Microsoft | 10% | HOLD |
| TSLA | Tesla | 8% | WATCH |
| BTC-USD | Bitcoin | 20% | HOLD |
| ETH-USD | Ethereum | 15% | BUY |
| SPY | S&P 500 ETF | 20% | HOLD |

### Updates:
- Prices update daily (delayed for demo)
- Signals refresh at 3:50 PM ET
- Portfolio rebalances weekly (paper trading)

---

## Development Phases

### Phase 1: Foundation (Today)
- [ ] Create new dashboard layout
- [ ] Remove Moltbook/OpenClaw content
- [ ] Set up sample portfolio data
- [ ] Add company logo fetcher (Clearbit)

### Phase 2: Search (Today)
- [ ] Build search bar component
- [ ] Add predictive/autofill
- [ ] Create stock detail view
- [ ] Integrate SYGNL insights

### Phase 3: Polish (Tomorrow)
- [ ] Add user logo
- [ ] Style all sections
- [ ] Mobile responsive
- [ ] Performance optimization

### Phase 4: Deploy (Tomorrow)
- [ ] Final testing
- [ ] Deploy to Vercel
- [ ] Verify demo mode works

---

## Open Questions

1. **Stock Price API**: Yahoo Finance OK? (free, 2000 calls/day)
2. **Logo Source**: Clearbit OK? Or download static logos?
3. **Sample Portfolio**: 7 holdings OK? Which tickers?
4. **Logo**: Send when ready, or proceed with placeholder?

---

## Immediate Next Steps

1. **You**: Send logo (or say "use placeholder")
2. **Me**: Start Phase 1 - strip internal content, add product features
3. **Decision**: Confirm stock price API preference
4. **Me**: Build search component

**Ready to start? Confirm and I'll begin.**
