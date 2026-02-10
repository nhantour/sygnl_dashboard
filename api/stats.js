// SYGNL Stats API - Uses SQLite for aggregation
import { getHoldings, getIntelligence, getSignals, seedFromJsonFiles } from '../lib/db.js'
import fs from 'fs'
import path from 'path'

// Read file with fallback
function readJsonFile(filePath, fallback = {}) {
  try {
    if (fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath, 'utf8'))
    }
  } catch (e) {
    console.error(`Error reading ${filePath}:`, e.message)
  }
  return fallback
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
    // Seed DB on first request if empty
    await seedFromJsonFiles()

    // Load data from database
    const holdings = await getHoldings()
    const intelligence = await getIntelligence()
    const signals = await getSignals()
    
    // Calculate portfolio stats
    const portfolioValue = holdings?.totalValue || 0
    const dayChange = holdings?.dayChange || 0
    const dayChangePercent = holdings?.dayChangePercent || 0
    
    // Count holdings by type
    const cryptoValue = holdings?.holdings?.filter(h => h.type === 'Crypto').reduce((sum, h) => sum + (h.current_value || 0), 0) || 0
    const stocksValue = holdings?.holdings?.filter(h => h.type === 'Equity').reduce((sum, h) => sum + (h.current_value || 0), 0) || 0
    const etfValue = holdings?.holdings?.filter(h => h.type === 'ETF').reduce((sum, h) => sum + (h.current_value || 0), 0) || 0
    
    // Calculate costs - try token usage file
    const today = new Date().toISOString().split('T')[0]
    let todayCost = 0
    
    try {
      const tokenPath = path.join(process.cwd(), '..', 'sygnl', 'token_usage_log.json')
      if (fs.existsSync(tokenPath)) {
        const tokenLogs = readJsonFile(tokenPath, [])
        const todayLogs = tokenLogs.filter(t => t.date === today)
        todayCost = todayLogs.reduce((sum, t) => sum + (t.cost_usd || 0), 0)
      }
    } catch (e) {}
    
    // Calculate accuracy from signals
    const recentSignals = signals?.filter(s => {
      const signalDate = new Date(s.timestamp)
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      return signalDate > thirtyDaysAgo && s.outcome
    }) || []
    
    const wins = recentSignals.filter(s => s.outcome === 'win').length
    const accuracyOverall = recentSignals.length > 0 ? Math.round((wins / recentSignals.length) * 100) : 0
    
    // Calculate allocation percentages
    const totalValue = portfolioValue || 1
    
    const stats = {
      portfolio: {
        totalValue: portfolioValue,
        dayChange: dayChange,
        dayChangePercent: dayChangePercent,
        btcPrice: holdings?.btcPrice || 0,
        btcTotal: holdings?.btcTotal || 0,
        holdings: holdings?.holdings?.length || 0,
        allocation: {
          crypto: { value: cryptoValue, percent: (cryptoValue / totalValue * 100).toFixed(1) },
          stocks: { value: stocksValue, percent: (stocksValue / totalValue * 100).toFixed(1) },
          etfs: { value: etfValue, percent: (etfValue / totalValue * 100).toFixed(1) }
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
      intelligence: {
        totalItems: intelligence?.items?.length || 0,
        highPriority: intelligence?.items?.filter(i => i.priority === 'high').length || 0
      },
      lastUpdated: new Date().toISOString()
    }
    
    res.status(200).json(stats)
  } catch (error) {
    console.error('Stats API error:', error)
    res.status(500).json({ 
      error: error.message,
      portfolio: { totalValue: 0, dayChange: 0 },
      costs: { today: 0, limit: 10 },
      accuracy: { overall: 0 }
    })
  }
}
