// SYGNL Stats API - Returns dashboard statistics
import fs from 'fs'
import path from 'path'

const HOLDINGS_FILE = path.join(process.cwd(), 'data', 'holdings.json')
const COSTS_FILE = path.join(process.cwd(), 'data', 'costs.json')
const ACCURACY_FILE = path.join(process.cwd(), 'data', 'signal_accuracy.json')
const TOKEN_FILE = path.join(process.cwd(), '..', 'sygnl', 'token_usage_log.json')

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
    // Load data from files
    const holdings = readJsonFile(HOLDINGS_FILE, { totalValue: 0, dayChange: 0, holdings: [] })
    const costs = readJsonFile(COSTS_FILE, [])
    const accuracy = readJsonFile(ACCURACY_FILE, { accuracy: { overall: 0 } })
    
    // Calculate portfolio stats
    const portfolioValue = holdings.totalValue || 0
    const dayChange = holdings.dayChange || 0
    const dayChangePercent = holdings.dayChangePercent || 0
    
    // Count holdings by type
    const cryptoValue = holdings.holdings?.filter(h => h.type === 'Crypto').reduce((sum, h) => sum + (h.current_value || 0), 0) || 0
    const stocksValue = holdings.holdings?.filter(h => h.type === 'Equity').reduce((sum, h) => sum + (h.current_value || 0), 0) || 0
    const etfValue = holdings.holdings?.filter(h => h.type === 'ETF').reduce((sum, h) => sum + (h.current_value || 0), 0) || 0
    
    // Calculate costs - handle both array format and object format
    const today = new Date().toISOString().split('T')[0]
    let todayCost = 0
    
    if (Array.isArray(costs)) {
      // Old format: array of daily costs
      const todayEntry = costs.find(c => c.date === today)
      todayCost = todayEntry?.cost || 0
    } else {
      // New format: object with today property
      todayCost = costs.today || 0
    }
    
    // Also try to get from token usage log
    try {
      const tokenLogs = readJsonFile(TOKEN_FILE, [])
      const todayLogs = tokenLogs.filter(t => t.date === today)
      const tokenCost = todayLogs.reduce((sum, t) => sum + (t.cost_usd || 0), 0)
      if (tokenCost > todayCost) todayCost = tokenCost
    } catch (e) {}
    
    // Calculate allocation percentages
    const totalValue = portfolioValue || 1  // Avoid division by zero
    const stats = {
      portfolio: {
        totalValue: portfolioValue,
        dayChange: dayChange,
        dayChangePercent: dayChangePercent,
        btcPrice: holdings.btcPrice || 0,
        btcTotal: holdings.btcTotal || 0,
        holdings: holdings.holdings?.length || 0,
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
        overall: accuracy.accuracy?.overall || 0,
        target: 65,
        targetProgress: accuracy.accuracy?.overall ? Math.min(100, (accuracy.accuracy.overall / 65 * 100)).toFixed(1) : 0
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
