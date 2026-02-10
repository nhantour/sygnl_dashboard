// Live Holdings API - Proxies to OVH VPS with local fallback
import fs from 'fs'
import path from 'path'

const OVH_API_BASE = process.env.OVH_API_URL || 'http://148.113.174.184:8000'
const HOLDINGS_FILE = path.join(process.cwd(), 'data', 'holdings.json')

function readLocalHoldings() {
  try {
    if (fs.existsSync(HOLDINGS_FILE)) {
      const data = JSON.parse(fs.readFileSync(HOLDINGS_FILE, 'utf8'))
      return { ...data, source: 'local' }
    }
  } catch (e) {
    console.error('Error reading holdings:', e)
  }
  
  return {
    lastUpdated: new Date().toISOString(),
    btcPrice: 65000,
    totalValue: 0,
    dayChange: 0,
    dayChangePercent: 0,
    holdings: [],
    allocationByType: {},
    btcTotal: 0,
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
      // Try OVH VPS first with timeout
      try {
        const controller = new AbortController()
        const timeout = setTimeout(() => controller.abort(), 3000)
        
        const apiRes = await fetch(`${OVH_API_BASE}/holdings`, {
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
      } catch (e) {
        console.log('OVH unavailable, using local holdings data:', e.message)
      }
      
      // Return local data
      const data = readLocalHoldings()
      res.status(200).json(data)
      
    } else if (req.method === 'POST') {
      // Forward trade to OVH VPS
      try {
        const response = await fetch(`${OVH_API_BASE}/holdings`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(req.body)
        })
        
        const data = await response.json()
        res.status(response.status).json(data)
      } catch (e) {
        res.status(500).json({ error: 'OVH VPS unavailable for trading' })
      }
    }
    
  } catch (error) {
    console.error('Holdings API error:', error)
    const data = readLocalHoldings()
    res.status(200).json({ ...data, error: error.message })
  }
}
