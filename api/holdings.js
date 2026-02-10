// Live Holdings API - Proxies to OVH VPS
const OVH_API_BASE = process.env.OVH_API_URL || 'http://148.113.174.184:8000'

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
      // Fetch from OVH VPS
      const apiRes = await fetch(`${OVH_API_BASE}/holdings`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
      })
      
      if (apiRes.ok) {
        const data = await apiRes.json()
        return res.status(200).json(data)
      } else {
        throw new Error(`OVH API returned ${apiRes.status}`)
      }
      
    } else if (req.method === 'POST') {
      // Forward trade to OVH VPS
      const response = await fetch(`${OVH_API_BASE}/holdings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req.body)
      })
      
      const data = await response.json()
      res.status(response.status).json(data)
    }
    
  } catch (error) {
    console.error('Holdings API error:', error)
    // Return fallback data
    res.status(200).json({
      lastUpdated: new Date().toISOString(),
      btcPrice: 60000,
      totalValue: 0,
      dayChange: 0,
      dayChangePercent: 0,
      holdings: [],
      allocationByType: {},
      btcTotal: 0,
      error: error.message
    })
  }
}
