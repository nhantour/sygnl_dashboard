// Paper Trading API with live/paper toggle and manual/auto execution support
import fs from 'fs'
import path from 'path'

const PAPER_FILE = path.join(process.cwd(), 'data', 'paper_trading.json')

// Ensure file exists
function ensurePaperFile() {
  if (!fs.existsSync(PAPER_FILE)) {
    const initialData = {
      positions: [],
      total_value: 6000,
      total_invested: 0,
      total_pl: 0,
      total_pl_pct: 0,
      last_updated: new Date().toISOString(),
      settings: {
        autoExecuteStrong: true,  // Auto-execute signals >= 75% confidence
        startingBalance: 6000
      },
      tradeHistory: []
    }
    fs.mkdirSync(path.dirname(PAPER_FILE), { recursive: true })
    fs.writeFileSync(PAPER_FILE, JSON.stringify(initialData, null, 2))
    return initialData
  }
  return JSON.parse(fs.readFileSync(PAPER_FILE, 'utf8'))
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
      // Try to fetch from live API first
      try {
        const apiRes = await fetch('http://148.113.174.184:8000/public/paper-trading', {
          method: 'GET',
          headers: { 'Accept': 'application/json' },
        })
        
        if (apiRes.ok) {
          const data = await apiRes.json()
          // Merge with local data for any additional fields
          const localData = ensurePaperFile()
          const merged = {
            ...localData,
            ...data,
            positions: data.positions || localData.positions || [],
            settings: localData.settings || { autoExecuteStrong: true, startingBalance: 6000 },
            tradeHistory: localData.tradeHistory || []
          }
          fs.writeFileSync(PAPER_FILE, JSON.stringify(merged, null, 2))
          return res.status(200).json(merged)
        }
      } catch (e) {
        console.log('Live API unavailable, using local data:', e.message)
      }
      
      // Return local data with enhanced fields
      const data = ensurePaperFile()
      
      // Calculate additional metrics
      const positionsWithMetrics = data.positions.map(p => ({
        ...p,
        day_change: (p.current_price - p.entry_price) * p.quantity,
        day_change_pct: ((p.current_price - p.entry_price) / p.entry_price) * 100
      }))
      
      res.status(200).json({
        ...data,
        positions: positionsWithMetrics,
        buyingPower: (data.settings?.startingBalance || 6000) - data.total_invested,
        availableToTrade: Math.max(0, (data.settings?.startingBalance || 6000) - data.total_invested)
      })
      
    } else if (req.method === 'POST') {
      const { symbol, quantity, price, action, source = 'manual', signalConfidence, autoExecuted = false } = req.body
      
      if (!symbol || !quantity || !price || !action) {
        return res.status(400).json({ error: 'Missing required fields: symbol, quantity, price, action' })
      }
      
      const data = ensurePaperFile()
      const qty = parseFloat(quantity)
      const prc = parseFloat(price)
      const value = qty * prc
      
      const tradeRecord = {
        id: `trade-${Date.now()}`,
        symbol,
        action,
        quantity: qty,
        price: prc,
        value,
        timestamp: new Date().toISOString(),
        source, // 'manual', 'signal-auto', 'signal-manual'
        signalConfidence: signalConfidence || null,
        autoExecuted
      }
      
      if (action === 'BUY' || action === 'ADD') {
        // Check buying power
        const buyingPower = (data.settings?.startingBalance || 6000) - data.total_invested
        if (value > buyingPower) {
          return res.status(400).json({ error: `Insufficient buying power. Available: $${buyingPower.toFixed(2)}` })
        }
        
        const existingIdx = data.positions.findIndex(p => p.symbol === symbol)
        
        if (existingIdx >= 0) {
          const existing = data.positions[existingIdx]
          const newQty = existing.quantity + qty
          const newCostBasis = existing.cost_basis + value
          const newValue = newQty * prc
          
          data.positions[existingIdx] = {
            ...existing,
            quantity: newQty,
            entry_price: newCostBasis / newQty,
            current_price: prc,
            current_value: newValue,
            cost_basis: newCostBasis,
            unrealized_pl: newValue - newCostBasis,
            unrealized_pl_pct: ((newValue - newCostBasis) / newCostBasis) * 100,
            signal_confidence: signalConfidence || existing.signal_confidence,
            last_updated: new Date().toISOString()
          }
        } else {
          data.positions.push({
            symbol,
            quantity: qty,
            entry_price: prc,
            current_price: prc,
            current_value: value,
            cost_basis: value,
            unrealized_pl: 0,
            unrealized_pl_pct: 0,
            signal_confidence: signalConfidence || 0,
            order_id: `paper-${Date.now()}`,
            last_updated: new Date().toISOString(),
            source
          })
        }
        
        data.total_invested += value
        
      } else if (action === 'SELL' || action === 'REDUCE') {
        const existingIdx = data.positions.findIndex(p => p.symbol === symbol)
        
        if (existingIdx < 0) {
          return res.status(400).json({ error: 'Position not found' })
        }
        
        const existing = data.positions[existingIdx]
        
        if (qty > existing.quantity) {
          return res.status(400).json({ error: `Insufficient shares. Available: ${existing.quantity}` })
        }
        
        const realizedPL = (prc - existing.entry_price) * qty
        tradeRecord.realizedPL = realizedPL
        
        if (qty === existing.quantity) {
          data.positions.splice(existingIdx, 1)
        } else {
          const newQty = existing.quantity - qty
          const sellRatio = qty / existing.quantity
          const costBasisSold = existing.cost_basis * sellRatio
          const newCostBasis = existing.cost_basis - costBasisSold
          const newValue = newQty * prc
          
          data.positions[existingIdx] = {
            ...existing,
            quantity: newQty,
            current_price: prc,
            current_value: newValue,
            cost_basis: newCostBasis,
            unrealized_pl: newValue - newCostBasis,
            unrealized_pl_pct: ((newValue - newCostBasis) / newCostBasis) * 100,
            last_updated: new Date().toISOString()
          }
        }
        
        data.total_invested -= (existing.cost_basis * (qty / existing.quantity))
      }
      
      // Recalculate totals
      data.total_value = data.positions.reduce((sum, p) => sum + (p.current_value || 0), 0)
      data.total_pl = data.total_value - data.total_invested
      data.total_pl_pct = data.total_invested > 0 ? (data.total_pl / data.total_invested) * 100 : 0
      data.last_updated = new Date().toISOString()
      
      // Add to trade history
      if (!data.tradeHistory) data.tradeHistory = []
      data.tradeHistory.unshift(tradeRecord)
      if (data.tradeHistory.length > 100) data.tradeHistory = data.tradeHistory.slice(0, 100)
      
      fs.writeFileSync(PAPER_FILE, JSON.stringify(data, null, 2))
      
      res.status(200).json({ 
        success: true,
        message: `${autoExecuted ? 'Auto-executed' : 'Executed'}: ${action} ${qty} shares of ${symbol} @ $${prc}`,
        trade: tradeRecord,
        portfolio: {
          totalValue: data.total_value,
          totalInvested: data.total_invested,
          totalPL: data.total_pl,
          totalPLPct: data.total_pl_pct,
          buyingPower: (data.settings?.startingBalance || 6000) - data.total_invested,
          positions: data.positions
        }
      })
    }
    
  } catch (error) {
    console.error('Paper trading API error:', error)
    res.status(500).json({ error: error.message || 'Internal server error' })
  }
}