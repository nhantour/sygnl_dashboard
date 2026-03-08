# Crypto Dashboard Section Spec

## Goal
Add a "Crypto" section to the paper trading dashboard at `app/paper-trading/page.js`. This shows all crypto and forex strategy performance, positions, and the new Crypto_Narrative_Momentum strategy.

## Section Registration

In the `SECTIONS` array (around line 354), add after `daytrading`:
```js
{ id: 'crypto', label: 'Crypto', icon: '₿' },
```

In the `openSections` state init (around line 438), add:
```js
crypto: false,
```

## Data Source
All data comes from existing API: `http://localhost:3002/api/status`

The `strategies` array contains objects with: `strategy_name`, `strategy_type`, `total_trades`, `current_cash`, `starting_capital`, `open_positions`, `total_pnl`, `metrics` (object with `win_rate`, `avg_pnl`, `max_drawdown`, etc.)

Filter crypto strategies by name containing "Crypto_" or "Forex_".

Also use existing `pos` (positions array) filtered to symbols ending in `-USD` or `=X`.

## Section Design

Follow the exact same visual style as other sections (CollapsibleSection component). Dark theme, zinc/emerald/red colors, glassmorphism cards.

### Layout: 3 rows

**Row 1: Crypto Overview Cards (4 cards in a grid)**
```
| Total Crypto P&L | Active Positions | Win Rate | Best Strategy |
```
- Total Crypto P&L: sum of total_pnl for all Crypto_* and Forex_* strategies. Green if positive, red if negative.
- Active Positions: count of open positions in crypto/forex symbols
- Win Rate: weighted average win rate across crypto/forex strategies  
- Best Strategy: name + P&L of best performing crypto/forex strategy

**Row 2: Strategy Performance Table**
Table showing each crypto/forex strategy:
| Strategy | Trades | Win Rate | P&L | Avg P&L | Capital | Status |
Strategy names: strip "Crypto_" and "Forex_" prefixes, replace underscores with spaces.
Status: green dot if enabled, red if disabled. Show "NEW" badge for Crypto_Narrative_Momentum if 0 trades.

**Row 3: Live Crypto Positions**
Show all currently open positions for crypto/forex symbols.
| Symbol | Direction | Entry | Current | P&L | Strategy | Hold Time |
Direction: LONG in green, SHORT in red.
P&L: colored green/red.
Show "No open positions" with subtle animation if empty.

### Important Style Notes
- Use the same component patterns as existing sections (look at the 'strategies' or 'daytrading' sections for reference)
- Card backgrounds: `bg-white/[0.02] border border-white/[0.06]`
- Text: `text-zinc-400` for labels, `text-white` for values
- Green: `text-emerald-400`, Red: `text-red-400`
- Small text: `text-[11px]` or `text-xs`
- Round corners: `rounded-xl`
- Don't import any new dependencies — use only what's already imported

## Placement
Add the crypto section AFTER the daytrading section and BEFORE the options section in the JSX.

Search for `section-daytrading` or the daytrading CollapsibleSection closing tag, and add the new section after it.

## Files to modify
Only: `app/paper-trading/page.js`

## Testing
After changes, the dashboard should show the new "₿ Crypto" pill in the section nav, and clicking it reveals the crypto panel with strategy data.
