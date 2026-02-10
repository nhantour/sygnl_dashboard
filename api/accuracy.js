// SYGNL Signal Accuracy Tracking API - Proxies to OVH VPS
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
      const apiRes = await fetch(`${OVH_API_BASE}/accuracy`, {
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
    console.error('Accuracy API error:', error)
    res.status(200).json({
      overall: 0,
      byConfidence: {},
      byState: {},
      targetAccuracy: 65,
      progressToTarget: 0,
      lastUpdated: new Date().toISOString(),
      error: error.message
    })
  }
}
