// SYGNL Intelligence API - Returns signal intelligence feed
import fs from 'fs'
import path from 'path'

const INTELLIGENCE_FILE = path.join(process.cwd(), 'data', 'intelligence.json')

// Ensure file exists with fallback data
function ensureIntelligenceFile() {
  if (!fs.existsSync(INTELLIGENCE_FILE)) {
    const initialData = {
      lastUpdated: new Date().toISOString(),
      summary: {
        totalItems: 0,
        highPriority: 0,
        categories: { financial: 0, openclaw: 0, product: 0 }
      },
      financial: [],
      openclaw: [],
      recommendations: [],
      all: []
    }
    fs.mkdirSync(path.dirname(INTELLIGENCE_FILE), { recursive: true })
    fs.writeFileSync(INTELLIGENCE_FILE, JSON.stringify(initialData, null, 2))
    return initialData
  }
  return JSON.parse(fs.readFileSync(INTELLIGENCE_FILE, 'utf8'))
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return
  }

  try {
    const data = ensureIntelligenceFile()
    res.status(200).json(data)
  } catch (error) {
    console.error('Intelligence API error:', error)
    // Return fallback data on error
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
