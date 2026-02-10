// SYGNL Database - SQLite backend for dashboard data
import sqlite3 from 'sqlite3'
import { open } from 'sqlite'
import path from 'path'
import fs from 'fs'

const DB_DIR = path.join(process.cwd(), 'data')
const DB_PATH = path.join(DB_DIR, 'sygnl.db')

// Ensure directory exists
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true })
}

let db = null

export async function getDb() {
  if (!db) {
    db = await open({
      filename: DB_PATH,
      driver: sqlite3.Database
    })
    await initDb()
  }
  return db
}

async function initDb() {
  // Holdings table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS holdings (
      symbol TEXT PRIMARY KEY,
      name TEXT,
      wallet TEXT,
      quantity REAL,
      current_price REAL,
      current_value REAL,
      day_change REAL,
      day_change_pct REAL,
      allocation_pct REAL,
      type TEXT,
      last_updated TEXT
    )
  `)

  // Portfolio summary
  await db.exec(`
    CREATE TABLE IF NOT EXISTS portfolio_summary (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      btc_price REAL,
      total_value REAL,
      day_change REAL,
      day_change_pct REAL,
      btc_total REAL,
      last_updated TEXT
    )
  `)

  // Intelligence items
  await db.exec(`
    CREATE TABLE IF NOT EXISTS intelligence (
      id TEXT PRIMARY KEY,
      category TEXT,
      title TEXT,
      content TEXT,
      source TEXT,
      timestamp TEXT,
      priority TEXT,
      related_symbols TEXT,
      action_url TEXT
    )
  `)

  // Signals for accuracy tracking
  await db.exec(`
    CREATE TABLE IF NOT EXISTS signals (
      id TEXT PRIMARY KEY,
      symbol TEXT,
      action TEXT,
      confidence INTEGER,
      market_state TEXT,
      outcome TEXT,
      pnl REAL,
      timestamp TEXT
    )
  `)

  // Paper trading positions
  await db.exec(`
    CREATE TABLE IF NOT EXISTS paper_positions (
      symbol TEXT PRIMARY KEY,
      quantity REAL,
      entry_price REAL,
      current_price REAL,
      current_value REAL,
      cost_basis REAL,
      unrealized_pl REAL,
      unrealized_pl_pct REAL,
      signal_confidence INTEGER,
      order_id TEXT,
      last_updated TEXT
    )
  `)

  // Token usage
  await db.exec(`
    CREATE TABLE IF NOT EXISTS token_usage (
      date TEXT PRIMARY KEY,
      total_calls INTEGER,
      total_tokens_in INTEGER,
      total_tokens_out INTEGER,
      total_cost_usd REAL,
      limit_soft REAL,
      limit_hard REAL,
      limit_used_pct REAL,
      limit_status TEXT
    )
  `)

  console.log('[DB] Initialized SQLite database at', DB_PATH)
}

// Holdings operations
export async function saveHoldings(holdingsData) {
  const db = await getDb()
  
  // Clear existing
  await db.run('DELETE FROM holdings')
  await db.run('DELETE FROM portfolio_summary')
  
  // Insert holdings
  for (const h of holdingsData.holdings || []) {
    await db.run(
      `INSERT INTO holdings VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [h.symbol, h.name, h.wallet, h.quantity, h.current_price, h.current_value,
       h.day_change, h.day_change_pct, h.allocation_pct, h.type, holdingsData.lastUpdated]
    )
  }
  
  // Insert summary
  await db.run(
    `INSERT INTO portfolio_summary VALUES (1, ?, ?, ?, ?, ?, ?)`,
    [holdingsData.btcPrice, holdingsData.totalValue, holdingsData.dayChange,
     holdingsData.dayChangePercent, holdingsData.btcTotal, holdingsData.lastUpdated]
  )
}

export async function getHoldings() {
  const db = await getDb()
  
  const summary = await db.get('SELECT * FROM portfolio_summary WHERE id = 1')
  const holdings = await db.all('SELECT * FROM holdings')
  
  if (!summary) return null
  
  return {
    lastUpdated: summary.last_updated,
    btcPrice: summary.btc_price,
    totalValue: summary.total_value,
    dayChange: summary.day_change,
    dayChangePercent: summary.day_change_pct,
    btcTotal: summary.btc_total,
    holdings
  }
}

// Intelligence operations
export async function saveIntelligence(items) {
  const db = await getDb()
  await db.run('DELETE FROM intelligence')
  
  for (const item of items) {
    await db.run(
      `INSERT INTO intelligence VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [item.id || `intel_${Date.now()}_${Math.random()}`, item.category, item.title,
       item.content, item.source, item.timestamp, item.priority,
       JSON.stringify(item.related_symbols || []), item.action_url]
    )
  }
}

export async function getIntelligence() {
  const db = await getDb()
  const items = await db.all('SELECT * FROM intelligence ORDER BY timestamp DESC')
  
  return {
    lastUpdated: new Date().toISOString(),
    items: items.map(i => ({
      ...i,
      related_symbols: JSON.parse(i.related_symbols || '[]')
    }))
  }
}

// Signal/Accuracy operations
export async function saveSignals(signals) {
  const db = await getDb()
  await db.run('DELETE FROM signals')
  
  for (const s of signals) {
    await db.run(
      `INSERT INTO signals VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [s.id, s.symbol, s.action, s.confidence, s.marketState, s.outcome, s.pnl, s.timestamp]
    )
  }
}

export async function getSignals() {
  const db = await getDb()
  return await db.all('SELECT * FROM signals ORDER BY timestamp DESC')
}

// Paper trading operations
export async function savePaperPositions(positions) {
  const db = await getDb()
  await db.run('DELETE FROM paper_positions')
  
  for (const p of positions) {
    await db.run(
      `INSERT INTO paper_positions VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [p.symbol, p.quantity, p.entry_price, p.current_price, p.current_value,
       p.cost_basis, p.unrealized_pl, p.unrealized_pl_pct, p.signal_confidence,
       p.order_id, p.last_updated]
    )
  }
}

export async function getPaperPositions() {
  const db = await getDb()
  return await db.all('SELECT * FROM paper_positions')
}

// Seed with initial data
export async function seedFromJsonFiles() {
  const db = await getDb()
  
  // Check if already has data
  const count = await db.get('SELECT COUNT(*) as count FROM portfolio_summary')
  if (count.count > 0) {
    console.log('[DB] Already has data, skipping seed')
    return
  }
  
  try {
    // Import holdings
    const holdingsPath = path.join(process.cwd(), 'data', 'holdings.json')
    if (fs.existsSync(holdingsPath)) {
      const holdings = JSON.parse(fs.readFileSync(holdingsPath, 'utf8'))
      await saveHoldings(holdings)
      console.log('[DB] Seeded holdings:', holdings.holdings?.length, 'positions')
    }
    
    // Import intelligence
    const intelPath = path.join(process.cwd(), 'data', 'intelligence.json')
    if (fs.existsSync(intelPath)) {
      const intel = JSON.parse(fs.readFileSync(intelPath, 'utf8'))
      await saveIntelligence(intel.all || [])
      console.log('[DB] Seeded intelligence:', intel.all?.length, 'items')
    }
    
    // Import signals
    const accuracyPath = path.join(process.cwd(), 'data', 'signal_accuracy.json')
    if (fs.existsSync(accuracyPath)) {
      const accuracy = JSON.parse(fs.readFileSync(accuracyPath, 'utf8'))
      await saveSignals(accuracy.signals || [])
      console.log('[DB] Seeded signals:', accuracy.signals?.length, 'signals')
    }
    
  } catch (e) {
    console.error('[DB] Seed error:', e)
  }
}

export default { getDb, saveHoldings, getHoldings, saveIntelligence, getIntelligence, saveSignals, getSignals, savePaperPositions, getPaperPositions, seedFromJsonFiles }
