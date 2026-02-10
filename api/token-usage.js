// Token Usage API - Proxies to OVH VPS
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
    const apiRes = await fetch(`${OVH_API_BASE}/token-usage`, {
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
    console.error('Token usage API error:', error)
    res.status(200).json({
      date: new Date().toISOString().split('T')[0],
      total_calls: 0,
      total_cost_usd: 0,
      limit_soft: 10,
      limit_hard: 25,
      limit_used_pct: 0,
      limit_status: 'ok',
      error: error.message
    })
  }
}
