// SYGNL Stats API - Proxies to OVH VPS with local fallback
import fs from 'fs'
import path from 'path'

const OVH_API_BASE = process.env.OVH_API_URL || 'http://148.113.174.184:8000'
const HOLDINGS_FILE = path.join(process.cwd(), 'data', 'holdings.json')
const ACCURACY_FILE = path.join(process.cwd(), 'data', 'signal_accuracy.json')
const TOKEN_FILE = path.join(process.cwd(), '..', 'sygnl', 'token_usage_log.json')

function readLocalStats() {
  try {
    // Load holdings
    let holdings = { totalValue: 0, dayChange: 0, dayChangePercent: 0, btcPrice: 0, btcTotal: 0, holdings: [] }
    if (fs.existsSync(HOLDINGS_FILE)) {
      holdings = JSON.parse(fs.readFileSync(HOLDINGS_FILE, 'utf8'))
    }
    
    // Calculate allocation
    const portfolioValue = holdings.totalValue || 0
    const holdingsList = holdings.holdings || []
    
    const cryptoValue = holdingsList.filter(h => h.type === 'Crypto').reduce((sum, h) => sum + (h.current_value || 0), 0)
    const stocksValue = holdingsList.filter(h => h.type === 'Equity').reduce((sum, h) => sum + (h.current_value || 0), 0)
    const etfValue = holdingsList.filter(h => h.type === 'ETF').reduce((sum, h) => sum + (h.current_value || 0), 0)
    
    // Calculate costs from token usage
    const today = new Date().toISOString().split('T')[0]
    let todayCost = 0
    
    if (fs.existsSync(TOKEN_FILE)) {
      const tokenLogs = JSON.parse(fs.readFileSync(TOKEN_FILE, 'utf8'))
      const todayLogs = tokenLogs.filter(t => t.date === today)
      todayCost = todayLogs.reduce((sum, t) => sum + (t.cost_usd || 0), 0)
    }
    
    // Calculate accuracy
    let accuracyOverall = 0
    if (fs.existsSync(ACCURACY_FILE)) {
      const accuracyData = JSON.parse(fs.readFileSync(ACCURACY_FILE, 'utf8'))
      const signals = accuracyData.signals || []
      const recentSignals = signals.filter(s => {
        const signalDate = new Date(s.timestamp)
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        return signalDate > thirtyDaysAgo && s.outcome
      })
      const wins = recentSignals.filter(s => s.outcome === 'win').length
      accuracyOverall = recentSignals.length > 0 ? Math.round((wins / recentSignals.length) * 100) : 0
    }
    
    const total = portfolioValue || 1
    
    return {
      portfolio: {
        totalValue: portfolioValue,
        dayChange: holdings.dayChange || 0,
        dayChangePercent: holdings.dayChangePercent || 0,
        btcPrice: holdings.btcPrice || 0,
        btcTotal: holdings.btcTotal || 0,
        holdings: holdingsList.length,
        allocation: {
          crypto: { value: cryptoValue, percent: (cryptoValue / total * 100).toFixed(1) },
          stocks: { value: stocksValue, percent: (stocksValue / total * 100).toFixed(1) },
          etfs: { value: etfValue, percent: (etfValue / total * 100).toFixed(1) }
        }
      },
      costs: {
        today: todayCost,
        limit: 10,
        percentUsed: ((todayCost / 10) * 100).toFixed(1)
      },
      accuracy: {
        overall: accuracyOverall,
        target: 65,
        targetProgress: accuracyOverall ? Math.min(100, (accuracyOverall / 65 * 100)).toFixed(1) : 0
      },
      lastUpdated: new Date().toISOString(),
      source: 'local'
    }
  } catch (e) {
    console.error('Error reading stats:', e)
    return {
      portfolio: { totalValue: 0, dayChange: 0, holdings: 0, allocation: {} },
      costs: { today: 0, limit: 10, percentUsed: 0 },
      accuracy: { overall: 0, target: 65, targetProgress: 0 },
      lastUpdated: new Date().toISOString(),
      source: 'error'
    }
  }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return
  }

  try {
    // Try OVH VPS first
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 3000)
    
    const apiRes = await fetch(`${OVH_API_BASE}/stats`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      signal: controller.signal
    })
    
    clearTimeout(timeout)
    
    if (apiRes.ok) {
      const data = await apiRes.json()
      return res.status(200).json({ ...data, source: 'ovh' })
    }
    throw new Error(`OVH API returned ${apiRes.status}`)
    
  } catch (error) {
    console.log('OVH unavailable, using local stats data:', error.message)
    const data = readLocalStats()
    res.status(200).json(data)
  }
}
