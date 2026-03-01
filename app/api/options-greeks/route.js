import { NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import { join } from 'path'

export async function GET() {
  try {
    const dataPath = join(process.cwd(), '..', 'sygnl', 'data', 'options_greeks_latest.json')
    const raw = await readFile(dataPath, 'utf8')
    const data = JSON.parse(raw)
    
    // Group by session
    const sessions = {
      us_market: { label: 'US Market', tickers: ['SPY', 'QQQ', 'NVDA', 'TSLA'] },
      futures: { label: 'Futures', tickers: ['ES', 'TQQQ', 'CL'] },
      asia: { label: 'Asia', tickers: ['EWJ', 'INDA'] },
      europe: { label: 'Europe', tickers: ['DAX', 'FEZ'] },
      crypto: { label: 'Overnight / Crypto', tickers: ['BITO', 'MSTR'] },
    }
    
    const grouped = {}
    for (const [sessionKey, sessionInfo] of Object.entries(sessions)) {
      grouped[sessionKey] = {
        label: sessionInfo.label,
        tickers: sessionInfo.tickers.map(t => {
          const d = data[t]
          if (!d) return { ticker: t, available: false }
          // Top 5 contracts by volume
          const top = (d.contracts || [])
            .filter(c => c.iv && c.volume > 0)
            .sort((a, b) => b.volume - a.volume)
            .slice(0, 5)
          return {
            ticker: t,
            available: true,
            spot: d.spot,
            timestamp: d.timestamp,
            stats: d.stats,
            topContracts: top,
          }
        })
      }
    }
    
    return NextResponse.json({ sessions: grouped, raw: data })
  } catch (e) {
    return NextResponse.json({ error: e.message, sessions: null }, { status: 200 })
  }
}
