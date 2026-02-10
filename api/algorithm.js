// SYGNL Algorithm Progress API - Proxies to OVH VPS
const OVH_API_BASE = process.env.OVH_API_URL || 'http://148.113.174.184:8000'

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return
  }

  try {
    // Fetch from OVH VPS
    const apiRes = await fetch(`${OVH_API_BASE}/algorithm`, {
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
    console.error('Algorithm API error:', error)
    res.status(200).json({
      version: '2.1.0',
      goals: {
        accuracy: { current: 0, target: 65, progress: 0, deadline: '2026-03-01' },
        coverage: { current: 0, target: 20, progress: 0, deadline: '2026-02-15' }
      },
      lastUpdated: new Date().toISOString(),
      error: error.message
    })
  }
}
