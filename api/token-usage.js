// Token Usage API - Proxies to OVH VPS with local fallback
import fs from 'fs'
import path from 'path'

const OVH_API_BASE = process.env.OVH_API_URL || 'http://148.113.174.184:8000'
const TOKEN_FILE = path.join(process.cwd(), '..', 'sygnl', 'token_usage_log.json')

function readTokenUsage() {
  try {
    const today = new Date().toISOString().split('T')[0]
    
    // Try to read from token usage log
    if (fs.existsSync(TOKEN_FILE)) {
      const logs = JSON.parse(fs.readFileSync(TOKEN_FILE, 'utf8'))
      const todayLogs = logs.filter(l => l.date === today)
      
      const totalCost = todayLogs.reduce((sum, l) => sum + (l.cost_usd || 0), 0)
      const totalCalls = todayLogs.length
      const totalTokensIn = todayLogs.reduce((sum, l) => sum + (l.tokens_in || 0), 0)
      const totalTokensOut = todayLogs.reduce((sum, l) => sum + (l.tokens_out || 0), 0)
      
      // Get model breakdown
      const models = {}
      todayLogs.forEach(l => {
        const model = l.model || 'unknown'
        if (!models[model]) {
          models[model] = { calls: 0, tokens_in: 0, tokens_out: 0, cost: 0 }
        }
        models[model].calls++
        models[model].tokens_in += l.tokens_in || 0
        models[model].tokens_out += l.tokens_out || 0
        models[model].cost += l.cost_usd || 0
      })
      
      // Convert to array format
      const ai_models = Object.entries(models).map(([name, data]) => ({
        model: name,
        calls: data.calls,
        tokens_in: data.tokens_in,
        tokens_out: data.tokens_out,
        cost_usd: Math.round(data.cost * 100) / 100
      })).sort((a, b) => b.cost_usd - a.cost_usd)
      
      return {
        date: today,
        total_calls: totalCalls,
        total_tokens_in: totalTokensIn,
        total_tokens_out: totalTokensOut,
        total_cost_usd: Math.round(totalCost * 100) / 100,
        limit_soft: 10,
        limit_hard: 25,
        limit_used_pct: Math.round((totalCost / 10) * 100 * 10) / 10,
        limit_status: totalCost < 10 ? 'ok' : totalCost < 25 ? 'warning' : 'critical',
        ai_models: ai_models.length > 0 ? ai_models : getDefaultModels(),
        source: 'local'
      }
    }
  } catch (e) {
    console.error('Error reading token usage:', e)
  }
  
  return getDefaultData()
}

function getDefaultModels() {
  return [
    { model: "moonshot/kimi-k2.5", calls: 0, tokens_in: 0, tokens_out: 0, cost_usd: 0 },
    { model: "anthropic/claude-haiku-4-5", calls: 0, tokens_in: 0, tokens_out: 0, cost_usd: 0 }
  ]
}

function getDefaultData() {
  const today = new Date().toISOString().split('T')[0]
  return {
    date: today,
    total_calls: 0,
    total_tokens_in: 0,
    total_tokens_out: 0,
    total_cost_usd: 0,
    limit_soft: 10,
    limit_hard: 25,
    limit_used_pct: 0,
    limit_status: 'ok',
    ai_models: getDefaultModels(),
    source: 'default'
  }
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
    // Try OVH VPS first
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 3000)
    
    const apiRes = await fetch(`${OVH_API_BASE}/token-usage`, {
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
    console.log('OVH unavailable, using local token usage data:', error.message)
    // Return local data
    const data = readTokenUsage()
    res.status(200).json(data)
  }
}
