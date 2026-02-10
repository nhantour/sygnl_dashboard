// SYGNL Intelligence API - Uses SQLite for persistence
import { getIntelligence, saveIntelligence, seedFromJsonFiles } from '../lib/db.js'
import fs from 'fs'
import path from 'path'

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
      // Try to get from database first
      const dbData = await getIntelligence()
      
      if (dbData && dbData.items && dbData.items.length > 0) {
        // Format response to match expected structure
        const financial = dbData.items.filter(i => i.category === 'financial')
        const openclaw = dbData.items.filter(i => i.category === 'openclaw')
        const recommendations = dbData.items.filter(i => i.category === 'product')
        const highPriority = dbData.items.filter(i => i.priority === 'high')
        
        res.status(200).json({
          lastUpdated: dbData.lastUpdated,
          summary: {
            totalItems: dbData.items.length,
            highPriority: highPriority.length,
            categories: {
              financial: financial.length,
              openclaw: openclaw.length,
              product: recommendations.length
            }
          },
          financial,
          openclaw,
          recommendations,
          all: dbData.items
        })
      } else {
        // Fallback to JSON file
        const intelPath = path.join(process.cwd(), 'data', 'intelligence.json')
        if (fs.existsSync(intelPath)) {
          const data = JSON.parse(fs.readFileSync(intelPath, 'utf8'))
          // Save to DB for next time
          await saveIntelligence(data.all || [])
          res.status(200).json(data)
        } else {
          res.status(200).json({
            lastUpdated: new Date().toISOString(),
            summary: { totalItems: 0, highPriority: 0, categories: {} },
            financial: [],
            openclaw: [],
            recommendations: [],
            all: []
          })
        }
      }
      
    } else if (req.method === 'POST') {
      // Add new intelligence item
      const { category, title, content, source, priority, related_symbols, action_url } = req.body
      
      if (!title || !content) {
        return res.status(400).json({ error: 'Missing required fields: title, content' })
      }
      
      const newItem = {
        id: `intel_${Date.now()}`,
        category: category || 'product',
        title,
        content,
        source: source || 'SYGNL',
        timestamp: new Date().toISOString(),
        priority: priority || 'medium',
        related_symbols: related_symbols || [],
        action_url: action_url || null
      }
      
      // Get existing and add new
      const existing = await getIntelligence()
      const items = existing?.items || []
      items.unshift(newItem)
      
      // Keep only last 100 items
      if (items.length > 100) items.pop()
      
      await saveIntelligence(items)
      
      res.status(200).json({
        success: true,
        item: newItem,
        totalItems: items.length
      })
    }
    
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
