// Live Holdings API - Uses SQLite for persistence
import { getHoldings, saveHoldings, seedFromJsonFiles } from '../lib/db.js'

const COMPANY_NAMES = {
  'PLTR': 'Palantir Technologies',
  'TSLA': 'Tesla Inc',
  'NVDA': 'NVIDIA Corporation',
  'MSTR': 'MicroStrategy Inc',
  'VOO': 'Vanguard S&P 500 ETF',
  'BTC': 'Bitcoin',
  'ETH': 'Ethereum',
  'AAPL': 'Apple Inc',
  'MSFT': 'Microsoft Corp',
  'AMD': 'Advanced Micro Devices',
  'META': 'Meta Platforms',
  'GOOGL': 'Alphabet Inc',
  'AMZN': 'Amazon.com Inc',
  'NFLX': 'Netflix Inc',
  'CRM': 'Salesforce Inc'
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
    // Seed DB on first request if empty
    await seedFromJsonFiles()

    if (req.method === 'GET') {
      // Try to fetch from live API first
      try {
        const apiRes = await fetch('http://148.113.174.184:8000/public/holdings', {
          method: 'GET',
          headers: { 'Accept': 'application/json' },
        })
        
        if (apiRes.ok) {
          const data = await apiRes.json()
          // Save to database
          await saveHoldings(data)
          return res.status(200).json(data)
        }
      } catch (e) {
        console.log('Live holdings API unavailable, using DB data:', e.message)
      }
      
      // Return DB data
      const data = await getHoldings()
      if (data) {
        res.status(200).json(data)
      } else {
        res.status(200).json({
          lastUpdated: new Date().toISOString(),
          btcPrice: 60000,
          totalValue: 0,
          dayChange: 0,
          dayChangePercent: 0,
          holdings: [],
          allocationByType: {},
          btcTotal: 0
        })
      }
      
    } else if (req.method === 'POST') {
      // Execute live trade
      const { symbol, quantity, price, action, type = 'Equity' } = req.body
      
      if (!symbol || !quantity || !price || !action) {
        return res.status(400).json({ error: 'Missing required fields: symbol, quantity, price, action' })
      }
      
      // Get current holdings
      let data = await getHoldings() || { holdings: [], totalValue: 0 }
      const qty = parseFloat(quantity)
      const prc = parseFloat(price)
      const value = qty * prc
      
      if (!data.holdings) data.holdings = []
      
      if (action === 'BUY' || action === 'ADD') {
        // Check for existing non-wallet position
        const existingIdx = data.holdings.findIndex(h => 
          h.symbol === symbol.toUpperCase() && !h.wallet
        )
        
        if (existingIdx >= 0) {
          const existing = data.holdings[existingIdx]
          const newQty = existing.quantity + qty
          const currentValue = existing.current_value || (existing.quantity * existing.current_price)
          const newValue = currentValue + value
          const newPrice = newValue / newQty
          
          data.holdings[existingIdx] = {
            ...existing,
            quantity: newQty,
            current_price: newPrice,
            current_value: newValue,
            day_change: 0,
            day_change_pct: 0,
            type: existing.type || type
          }
        } else {
          // Add new holding
          data.holdings.push({
            symbol: symbol.toUpperCase(),
            name: COMPANY_NAMES[symbol.toUpperCase()] || symbol.toUpperCase(),
            quantity: qty,
            current_price: prc,
            current_value: value,
            day_change: 0,
            day_change_pct: 0,
            allocation_pct: 0,
            type: type,
            last_updated: new Date().toISOString()
          })
        }
        
      } else if (action === 'SELL' || action === 'REDUCE') {
        const existingIdx = data.holdings.findIndex(h => 
          h.symbol === symbol.toUpperCase() && !h.wallet
        )
        
        if (existingIdx < 0) {
          return res.status(400).json({ error: 'Position not found in live portfolio' })
        }
        
        const existing = data.holdings[existingIdx]
        
        if (qty > existing.quantity) {
          return res.status(400).json({ error: `Insufficient shares. Available: ${existing.quantity}` })
        }
        
        if (qty === existing.quantity) {
          // Remove position entirely
          data.holdings.splice(existingIdx, 1)
        } else {
          // Reduce position
          const newQty = existing.quantity - qty
          const sellValue = qty * prc
          const currentTotalValue = existing.current_value || (existing.quantity * existing.current_price)
          const newValue = currentTotalValue - sellValue
          const newPrice = newValue / newQty
          
          data.holdings[existingIdx] = {
            ...existing,
            quantity: newQty,
            current_price: newPrice,
            current_value: newValue,
            day_change: 0,
            day_change_pct: 0
          }
        }
      }
      
      // Recalculate totals
      data.totalValue = data.holdings.reduce((sum, h) => sum + (h.current_value || 0), 0)
      data.lastUpdated = new Date().toISOString()
      
      // Recalculate allocations
      data.holdings.forEach(h => {
        h.allocation_pct = data.totalValue > 0 ? ((h.current_value || 0) / data.totalValue) * 100 : 0
      })
      
      // Save to database
      await saveHoldings(data)
      
      res.status(200).json({
        success: true,
        message: `Live ${action}: ${qty} shares of ${symbol} @ $${prc}`,
        trade: {
          symbol: symbol.toUpperCase(),
          action,
          quantity: qty,
          price: prc,
          value,
          timestamp: new Date().toISOString()
        },
        portfolio: {
          totalValue: data.totalValue,
          holdings: data.holdings
        }
      })
    }
    
  } catch (error) {
    console.error('Holdings API error:', error)
    res.status(500).json({ error: error.message || 'Internal server error' })
  }
}
