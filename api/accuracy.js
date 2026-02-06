// SYGNL Signal Accuracy Tracking API
import fs from 'fs'
import path from 'path'

const DATA_FILE = path.join(process.cwd(), 'data', 'signal_accuracy.json')

// Ensure data file exists
function ensureDataFile() {
  if (!fs.existsSync(DATA_FILE)) {
    const initialData = {
      signals: [],
      accuracy: {
        overall: 0,
        byConfidence: {
          '80-100': { total: 0, wins: 0, accuracy: 0 },
          '65-79': { total: 0, wins: 0, accuracy: 0 },
          '50-64': { total: 0, wins: 0, accuracy: 0 },
          'below50': { total: 0, wins: 0, accuracy: 0 }
        },
        byState: {
          'Building': { total: 0, wins: 0, accuracy: 0 },
          'Clear': { total: 0, wins: 0, accuracy: 0 },
          'Fragile': { total: 0, wins: 0, accuracy: 0 },
          'Break': { total: 0, wins: 0, accuracy: 0 },
          'Crowded': { total: 0, wins: 0, accuracy: 0 }
        }
      },
      lastUpdated: new Date().toISOString(),
      targetAccuracy: 65,
      currentStreak: 0,
      bestStreak: 0
    }
    fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true })
    fs.writeFileSync(DATA_FILE, JSON.stringify(initialData, null, 2))
    return initialData
  }
  return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'))
}

// Calculate accuracy from signal history
function calculateAccuracy(data) {
  const now = new Date()
  const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000)
  
  // Filter signals from last 30 days with outcomes
  const recentSignals = data.signals.filter(s => 
    new Date(s.timestamp) > thirtyDaysAgo && s.outcome !== undefined
  )
  
  if (recentSignals.length === 0) return data.accuracy
  
  const wins = recentSignals.filter(s => s.outcome === 'win').length
  const overall = Math.round((wins / recentSignals.length) * 100)
  
  // By confidence bracket
  const byConfidence = {
    '80-100': { total: 0, wins: 0, accuracy: 0 },
    '65-79': { total: 0, wins: 0, accuracy: 0 },
    '50-64': { total: 0, wins: 0, accuracy: 0 },
    'below50': { total: 0, wins: 0, accuracy: 0 }
  }
  
  recentSignals.forEach(s => {
    let bracket = 'below50'
    if (s.confidence >= 80) bracket = '80-100'
    else if (s.confidence >= 65) bracket = '65-79'
    else if (s.confidence >= 50) bracket = '50-64'
    
    byConfidence[bracket].total++
    if (s.outcome === 'win') byConfidence[bracket].wins++
  })
  
  Object.keys(byConfidence).forEach(key => {
    const b = byConfidence[key]
    b.accuracy = b.total > 0 ? Math.round((b.wins / b.total) * 100) : 0
  })
  
  // By market state
  const byState = {
    'Building': { total: 0, wins: 0, accuracy: 0 },
    'Clear': { total: 0, wins: 0, accuracy: 0 },
    'Fragile': { total: 0, wins: 0, accuracy: 0 },
    'Break': { total: 0, wins: 0, accuracy: 0 },
    'Crowded': { total: 0, wins: 0, accuracy: 0 }
  }
  
  recentSignals.forEach(s => {
    if (byState[s.marketState]) {
      byState[s.marketState].total++
      if (s.outcome === 'win') byState[s.marketState].wins++
    }
  })
  
  Object.keys(byState).forEach(key => {
    const s = byState[key]
    s.accuracy = s.total > 0 ? Math.round((s.wins / s.total) * 100) : 0
  })
  
  // Calculate streaks
  let currentStreak = 0
  let bestStreak = 0
  let streak = 0
  
  // Sort by timestamp descending
  const sorted = [...recentSignals].sort((a, b) => 
    new Date(b.timestamp) - new Date(a.timestamp)
  )
  
  sorted.forEach((s, i) => {
    if (s.outcome === 'win') {
      streak++
      if (i === 0) currentStreak = streak
      bestStreak = Math.max(bestStreak, streak)
    } else {
      streak = 0
    }
  })
  
  return {
    overall,
    totalSignals: recentSignals.length,
    wins,
    losses: recentSignals.length - wins,
    byConfidence,
    byState,
    currentStreak,
    bestStreak
  }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return
  }

  try {
    const data = ensureDataFile()
    
    if (req.method === 'GET') {
      // Return current accuracy metrics
      const accuracy = calculateAccuracy(data)
      res.status(200).json({
        ...accuracy,
        targetAccuracy: 65,
        progressToTarget: Math.min(100, Math.round((accuracy.overall / 65) * 100)),
        lastUpdated: new Date().toISOString()
      })
      
    } else if (req.method === 'POST') {
      // Record a new signal outcome
      const { symbol, action, confidence, marketState, outcome, pnl } = req.body
      
      if (!symbol || !outcome) {
        return res.status(400).json({ error: 'Missing required fields' })
      }
      
      data.signals.push({
        id: `${symbol}-${Date.now()}`,
        symbol,
        action,
        confidence: confidence || 0,
        marketState: marketState || 'Unknown',
        outcome,
        pnl: pnl || 0,
        timestamp: new Date().toISOString()
      })
      
      // Keep only last 500 signals
      if (data.signals.length > 500) {
        data.signals = data.signals.slice(-500)
      }
      
      fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2))
      
      const accuracy = calculateAccuracy(data)
      res.status(200).json({
        message: 'Signal recorded',
        ...accuracy,
        targetAccuracy: 65,
        progressToTarget: Math.min(100, Math.round((accuracy.overall / 65) * 100))
      })
    }
    
  } catch (error) {
    console.error('Accuracy API error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}
