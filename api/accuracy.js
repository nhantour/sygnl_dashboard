// SYGNL Signal Accuracy Tracking API - Uses SQLite
import { getSignals, saveSignals, seedFromJsonFiles } from '../lib/db.js'
import fs from 'fs'
import path from 'path'

// Calculate accuracy from signal history
function calculateAccuracy(signals) {
  const now = new Date()
  const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000)
  
  // Filter signals from last 30 days with outcomes
  const recentSignals = signals.filter(s => 
    new Date(s.timestamp) > thirtyDaysAgo && s.outcome !== undefined && s.outcome !== null
  )
  
  if (recentSignals.length === 0) {
    return {
      overall: 0,
      totalSignals: 0,
      wins: 0,
      losses: 0,
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
      },
      currentStreak: 0,
      bestStreak: 0
    }
  }
  
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
    if (byState[s.market_state]) {
      byState[s.market_state].total++
      if (s.outcome === 'win') byState[s.market_state].wins++
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
    // Seed DB on first request if empty
    await seedFromJsonFiles()

    if (req.method === 'GET') {
      // Get signals from database
      let signals = await getSignals()
      
      // If no signals in DB, try JSON file
      if (!signals || signals.length === 0) {
        const accuracyPath = path.join(process.cwd(), 'data', 'signal_accuracy.json')
        if (fs.existsSync(accuracyPath)) {
          const data = JSON.parse(fs.readFileSync(accuracyPath, 'utf8'))
          signals = data.signals || []
          // Save to DB for next time
          await saveSignals(signals)
        }
      }
      
      const accuracy = calculateAccuracy(signals)
      
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
      
      const newSignal = {
        id: `${symbol}-${Date.now()}`,
        symbol,
        action,
        confidence: confidence || 0,
        market_state: marketState || 'Unknown',
        outcome,
        pnl: pnl || 0,
        timestamp: new Date().toISOString()
      }
      
      // Get existing and add new
      const existing = await getSignals()
      const signals = existing || []
      signals.unshift(newSignal)
      
      // Keep only last 500 signals
      if (signals.length > 500) signals.pop()
      
      await saveSignals(signals)
      
      const accuracy = calculateAccuracy(signals)
      
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
