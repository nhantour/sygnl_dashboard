// SYGNL Intelligence API - Proxies to OVH VPS
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
    // Fetch from OVH VPS
    const apiRes = await fetch(`${OVH_API_BASE}/intelligence`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
    })
    
    if (apiRes.ok) {
      const data = await apiRes.json()
      return res.status(200).json(data)
    } else {
      throw new Error(`OVH API returned ${apiRes.status}`)
    }
    
  } catch (error) {
    console.error('Intelligence API error:', error)
    // Return fallback data
    res.status(200).json({
      lastUpdated: new Date().toISOString(),
      summary: { totalItems: 0, highPriority: 0, categories: {} },
      financial: [],
      openclaw: [],
      recommendations: [],
      all: [],
      error: error.message
    })
  }
}
