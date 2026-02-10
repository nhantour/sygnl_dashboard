// SYGNL Signal Accuracy Tracking API - Proxies to OVH VPS with local fallback
import fs from 'fs'
import path from 'path'

const OVH_API_BASE = process.env.OVH_API_URL || 'http://148.113.174.184:8000'
const ACCURACY_FILE = path.join(process.cwd(), 'data', 'signal_accuracy.json')

function calculateAccuracy(signals) {
  const now = new Date()
  const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000)
  
  const recentSignals = signals.filter(s => 
    new Date(s.timestamp) > thirtyDaysAgo && s.outcome !== undefined && s.outcome !== null
  )
  
  if (recentSignals.length === 0) {
    return {
      overall: 0,
      totalSignals: 0,
      wins: 0,
      losses: 0,
      byConfidence: {},
      byState: {},
      currentStreak: 0,
      bestStreak: 0
    }
  }
  
  const wins = recentSignals.filter(s => s.outcome === 'win').length
  const overall = Math.round((wins / recentSignals.length) * 100)
  
  // Calculate by confidence
  const byConfidence = {
    '80-100': { total: 0, wins: 0, accuracy: 0 },
    '65-79': { total: 0, wins: 0, accuracy: 0 },
    '50-64': { total: 0, wins: 0, accuracy: 0 },
    'below50': { total: 0, wins: 0, accuracy: 0 }
  }
  
  recentSignals.forEach(s => {
    const conf = s.confidence || 0
    let bracket = 'below50'
    if (conf >= 80) bracket = '80-100'
    else if (conf >= 65) bracket = '65-79'
    else if (conf >= 50) bracket = '50-64'
    
    byConfidence[bracket].total++
    if (s.outcome === 'win') byConfidence[bracket].wins++
  })
  
  Object.keys(byConfidence).forEach(key => {
    const b = byConfidence[key]
    b.accuracy = b.total > 0 ? Math.round((b.wins / b.total) * 100) : 0
  })
  
  // Calculate by state
  const byState = {}
  recentSignals.forEach(s => {
    const state = s.marketState || 'Unknown'
    if (!byState[state]) byState[state] = { total: 0, wins: 0, accuracy: 0 }
    byState[state].total++
    if (s.outcome === 'win') byState[state].wins++
  })
  
  Object.keys(byState).forEach(key => {
    const s = byState[key]
    s.accuracy = s.total > 0 ? Math.round((s.wins / s.total) * 100) : 0
  })
  
  // Calculate streaks
  let currentStreak = 0
  let bestStreak = 0
  let streak = 0
  
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

function readLocalAccuracy() {
  try {
    if (fs.existsSync(ACCURACY_FILE)) {
      const data = JSON.parse(fs.readFileSync(ACCURACY_FILE, 'utf8'))
      const signals = data.signals || []
      const accuracy = calculateAccuracy(signals)
      return {
        ...accuracy,
        targetAccuracy: 65,
        progressToTarget: Math.min(100, Math.round((accuracy.overall / 65) * 100)),
        lastUpdated: new Date().toISOString(),
        source: 'local'
      }
    }
  } catch (e) {
    console.error('Error reading accuracy:', e)
  }
  
  return {
    overall: 0,
    byConfidence: {},
    byState: {},
    targetAccuracy: 65,
    progressToTarget: 0,
    lastUpdated: new Date().toISOString(),
    source: 'default'
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
    if (req.method === 'GET') {
      // Try OVH VPS first
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 3000)
      
      const apiRes = await fetch(`${OVH_API_BASE}/accuracy`, {
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
      
    } else if (req.method === 'POST') {
      // Forward to OVH VPS
      const response = await fetch(`${OVH_API_BASE}/accuracy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req.body)
      })
      
      const data = await response.json()
      res.status(response.status).json(data)
    }
    
  } catch (error) {
    console.log('OVH unavailable, using local accuracy data:', error.message)
    const data = readLocalAccuracy()
    res.status(200).json(data)
  }
}
