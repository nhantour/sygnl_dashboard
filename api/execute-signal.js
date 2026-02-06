// SYGNL.iq Signal Execution API - Handles auto/manual execution with tracking
import fs from 'fs'
import path from 'path'

const PAPER_FILE = path.join(process.cwd(), 'data', 'paper_trading.json')
const HOLDINGS_FILE = path.join(process.cwd(), 'data', 'holdings.json')
const ACCURACY_FILE = path.join(process.cwd(), 'data', 'signal_accuracy.json')

// Ensure files exist
function ensurePaperFile() {
  if (!fs.existsSync(PAPER_FILE)) {
    const initialData = {
      positions: [],
      total_value: 6000,
      total_invested: 0,
      total_pl: 0,
      total_pl_pct: 0,
      last_updated: new Date().toISOString()
    }
    fs.mkdirSync(path.dirname(PAPER_FILE), { recursive: true })
    fs.writeFileSync(PAPER_FILE, JSON.stringify(initialData, null, 2))
    return initialData
  }
  return JSON.parse(fs.readFileSync(PAPER_FILE, 'utf8'))
}

function ensureHoldingsFile() {
  if (!fs.existsSync(HOLDINGS_FILE)) {
    return { holdings: [], totalValue: 0, dayChange: 0 }
  }
  return JSON.parse(fs.readFileSync(HOLDINGS_FILE, 'utf8'))
}

function ensureAccuracyFile() {
  if (!fs.existsSync(ACCURACY_FILE)) {
    const initialData = {
      signals: [],
      accuracy: {
        overall: 0,
        byConfidence: {
          '80-100': { total: 0, wins: 0, accuracy: 0 },
          '65-79': { total: 0, wins: 0, accuracy: 0 },
          '50-64': { total: 0, wins: 0, accuracy: 0 },
          'below50': { total: 0, wins: 0, accuracy: 0 }
        },
        byState: {
          'Building': { total: 0, wins: 0, accuracy: 0 },
          'Clear': { total: 0, wins: 0, accuracy: 0 },
          'Fragile': { total: 0, wins: 0, accuracy: 0 },
          'Break': { total: 0, wins: 0, accuracy: 0 },
          'Crowded': { total: 0, wins: 0, accuracy: 0 }
        }
      },
      lastUpdated: new Date().toISOString(),
      targetAccuracy: 65,
      currentStreak: 0,
      bestStreak: 0,
      weakSignalExperiments: [] // Track weak signal performance
    }
    fs.mkdirSync(path.dirname(ACCURACY_FILE), { recursive: true })
    fs.writeFileSync(ACCURACY_FILE, JSON.stringify(initialData, null, 2))
    return initialData
  }
  return JSON.parse(fs.readFileSync(ACCURACY_FILE, 'utf8'))
}

// Get signal strength classification
function getSignalStrength(confidence) {
  if (confidence >= 75) return { level: 'STRONG', autoExecute: true, color: 'emerald' }
  if (confidence >= 60) return { level: 'MEDIUM', autoExecute: false, color: 'blue' }
  return { level: 'WEAK', autoExecute: false, color: 'yellow', experimental: true }
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
      // Get available signals with recommendations
      const holdings = ensureHoldingsFile()
      const accuracy = ensureAccuracyFile()
      
      // Generate mock current signals based on holdings
      const symbols = ['NVDA', 'AAPL', 'MSFT', 'AMD', 'TSLA', 'PLTR', 'BTC', 'ETH', 'META', 'GOOGL']
      const states = ['Building', 'Clear', 'Fragile', 'Break', 'Crowded']
      
      const signals = symbols.map((symbol, idx) => {
        const confidence = [84, 76, 71, 68, 52, 45, 78, 82, 63, 49][idx] || 65
        const state = states[idx % states.length]
        const strength = getSignalStrength(confidence)
        
        const holding = holdings.holdings?.find(h => h.symbol === symbol)
        const currentAllocation = holding ? ((holding.current_value / holdings.totalValue) * 100).toFixed(1) : 0
        
        let action = 'BUY'
        if (holding && confidence < 50) action = 'SELL'
        else if (holding && confidence < 65) action = 'HOLD'
        else if (holding && confidence >= 75) action = 'ADD'
        
        const suggestedSize = strength.level === 'STRONG' ? 8500 : 
                              strength.level === 'MEDIUM' ? 5000 : 2500
        
        return {
          id: `${symbol}-${Date.now()}-${idx}`,
          symbol,
          action,
          confidence,
          marketState: state,
          strength: strength.level,
          autoExecute: strength.autoExecute,
          color: strength.color,
          experimental: strength.experimental || false,
          currentAllocation: parseFloat(currentAllocation),
          suggestedSize,
          reasoning: generateReasoning(symbol, action, state, confidence),
          timestamp: new Date().toISOString()
        }
      }).filter(s => s.confidence > 40) // Only show signals above 40% confidence
       .sort((a, b) => b.confidence - a.confidence)
      
      // Separate into categories
      const strongSignals = signals.filter(s => s.strength === 'STRONG')
      const mediumSignals = signals.filter(s => s.strength === 'MEDIUM')
      const weakSignals = signals.filter(s => s.strength === 'WEAK')
      
      // Get weak signal experiment results
      const weakExperiments = accuracy.weakSignalExperiments || []
      const weakSuccessRate = weakExperiments.length > 0
        ? Math.round((weakExperiments.filter(e => e.outcome === 'success').length / weakExperiments.length) * 100)
        : 0
      
      res.status(200).json({
        signals,
        strongSignals,
        mediumSignals,
        weakSignals,
        stats: {
          total: signals.length,
          strong: strongSignals.length,
          medium: mediumSignals.length,
          weak: weakSignals.length,
          weakExperimentsCount: weakExperiments.length,
          weakSuccessRate
        },
        recommendations: [
          ...strongSignals.slice(0, 2).map(s => ({
            ...s,
            recommendation: 'AUTO_EXECUTE',
            message: 'Strong signal - Will auto-execute in paper trading'
          })),
          ...mediumSignals.slice(0, 2).map(s => ({
            ...s,
            recommendation: 'MANUAL_REVIEW',
            message: 'Review and execute if aligned with your strategy'
          })),
          ...weakSignals.slice(0, 1).map(s => ({
            ...s,
            recommendation: 'EXPERIMENTAL',
            message: 'Weak signal - Execute manually to train algorithm'
          }))
        ],
        autoExecuteEnabled: true // User can toggle this
      })
      
    } else if (req.method === 'POST') {
      const { 
        symbol, 
        action, 
        confidence, 
        marketState, 
        mode = 'paper', // 'paper' or 'live'
        quantity, 
        price,
        signalId,
        isWeakSignalExperiment = false // Track if this is a weak signal manual execution
      } = req.body
      
      if (!symbol || !action || !quantity || !price) {
        return res.status(400).json({ error: 'Missing required fields: symbol, action, quantity, price' })
      }
      
      const qty = parseFloat(quantity)
      const prc = parseFloat(price)
      const value = qty * prc
      const strength = getSignalStrength(confidence || 70)
      
      let result = {}
      
      if (mode === 'paper') {
        // Execute paper trade
        const data = ensurePaperFile()
        
        if (action === 'BUY' || action === 'ADD') {
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
              signal_confidence: confidence,
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
              signal_confidence: confidence,
              order_id: `sig-${Date.now()}`,
              last_updated: new Date().toISOString()
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
            return res.status(400).json({ error: 'Insufficient shares' })
          }
          
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
        }
        
        // Recalculate totals
        data.total_value = data.positions.reduce((sum, p) => sum + (p.current_value || 0), 0)
        data.total_pl = data.total_value - data.total_invested
        data.total_pl_pct = data.total_invested > 0 ? (data.total_pl / data.total_invested) * 100 : 0
        data.last_updated = new Date().toISOString()
        
        fs.writeFileSync(PAPER_FILE, JSON.stringify(data, null, 2))
        
        result = {
          mode: 'paper',
          message: `Paper ${action}: ${qty} shares of ${symbol} @ $${prc}`,
          positionValue: value,
          portfolioValue: data.total_value,
          totalPL: data.total_pl,
          totalPLPct: data.total_pl_pct
        }
        
      } else if (mode === 'live') {
        // Live trade - update holdings.json
        const holdings = ensureHoldingsFile()
        
        if (action === 'BUY' || action === 'ADD') {
          const existingIdx = holdings.holdings?.findIndex(h => h.symbol === symbol && !h.wallet)
          
          if (existingIdx >= 0) {
            const existing = holdings.holdings[existingIdx]
            const newQty = existing.quantity + qty
            const newCostBasis = (existing.quantity * existing.current_price) + value
            
            holdings.holdings[existingIdx] = {
              ...existing,
              quantity: newQty,
              current_price: prc,
              current_value: newQty * prc,
              day_change: 0,
              day_change_pct: 0
            }
          } else {
            holdings.holdings.push({
              symbol,
              name: symbol,
              quantity: qty,
              current_price: prc,
              current_value: value,
              day_change: 0,
              day_change_pct: 0,
              allocation_pct: 0,
              type: 'Equity'
            })
          }
        }
        
        // Recalculate totals
        holdings.totalValue = holdings.holdings.reduce((sum, h) => sum + (h.current_value || 0), 0)
        holdings.lastUpdated = new Date().toISOString()
        
        fs.writeFileSync(HOLDINGS_FILE, JSON.stringify(holdings, null, 2))
        
        result = {
          mode: 'live',
          message: `Live ${action}: ${qty} shares of ${symbol} @ $${prc}`,
          positionValue: value,
          portfolioValue: holdings.totalValue
        }
      }
      
      // Track weak signal experiments
      if (isWeakSignalExperiment || strength.level === 'WEAK') {
        const accuracy = ensureAccuracyFile()
        if (!accuracy.weakSignalExperiments) accuracy.weakSignalExperiments = []
        
        accuracy.weakSignalExperiments.push({
          id: signalId || `${symbol}-${Date.now()}`,
          symbol,
          action,
          confidence,
          marketState,
          executedAt: new Date().toISOString(),
          entryPrice: prc,
          quantity: qty,
          outcome: 'pending', // Will be updated later
          pnl: null
        })
        
        fs.writeFileSync(ACCURACY_FILE, JSON.stringify(accuracy, null, 2))
      }
      
      // Record signal for accuracy tracking
      const accuracy = ensureAccuracyFile()
      accuracy.signals.push({
        id: signalId || `${symbol}-${Date.now()}`,
        symbol,
        action,
        confidence: confidence || 70,
        marketState: marketState || 'Unknown',
        outcome: 'pending',
        mode,
        executedPrice: prc,
        timestamp: new Date().toISOString()
      })
      
      fs.writeFileSync(ACCURACY_FILE, JSON.stringify(accuracy, null, 2))
      
      res.status(200).json({
        success: true,
        signal: {
          symbol,
          action,
          confidence,
          strength: strength.level,
          mode,
          ...result
        }
      })
    }
    
  } catch (error) {
    console.error('Execute signal API error:', error)
    res.status(500).json({ error: error.message || 'Internal server error' })
  }
}

function generateReasoning(symbol, action, state, confidence) {
  const reasonings = {
    'NVDA': 'AI chip demand accelerating, Clear market state with strong momentum',
    'AAPL': 'Services revenue growing, stable fundamentals in Building phase',
    'MSFT': 'Cloud expansion continuing, AI integration driving growth',
    'AMD': 'Competitive positioning in AI chips, market share gains',
    'TSLA': 'Volatility high, signal confidence mixed - proceed with caution',
    'PLTR': 'Government contracts stable, commercial growth accelerating',
    'BTC': 'Institutional adoption trends, macro environment shifting',
    'ETH': 'DeFi ecosystem expansion, network upgrades complete',
    'META': 'AI investments paying off, Reality Labs stabilizing',
    'GOOGL': 'Search dominance intact, cloud growth steady'
  }
  
  return reasonings[symbol] || `${action} signal in ${state} market state with ${confidence}% confidence`
}