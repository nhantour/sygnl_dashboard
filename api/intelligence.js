// SYGNL Intelligence API - Proxies to OVH VPS with local fallback
import fs from 'fs'
import path from 'path'

const OVH_API_BASE = process.env.OVH_API_URL || 'http://148.113.174.184:8000'
const INTEL_FILE = path.join(process.cwd(), 'data', 'intelligence.json')

function readLocalIntelligence() {
  try {
    if (fs.existsSync(INTEL_FILE)) {
      const data = JSON.parse(fs.readFileSync(INTEL_FILE, 'utf8'))
      return { ...data, source: 'local' }
    }
  } catch (e) {
    console.error('Error reading intelligence:', e)
  }
  
  return {
    lastUpdated: new Date().toISOString(),
    summary: { totalItems: 0, highPriority: 0, categories: {} },
    financial: [],
    openclaw: [],
    recommendations: [],
    all: [],
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
    // Try OVH VPS first
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 3000)
    
    const apiRes = await fetch(`${OVH_API_BASE}/intelligence`, {
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
    
  } catch (error) {
    console.log('OVH unavailable, using local intelligence data:', error.message)
    const data = readLocalIntelligence()
    res.status(200).json(data)
  }
}
