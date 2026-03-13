// SYGNL Dashboard v3.1 — safe number coercion for API string fields
'use client'

// Safe number coercion: Alpaca/APIs often return numeric strings
const N = (v) => Number(v) || 0

import { useState, useEffect } from 'react'
import { TrendingUp, Activity, DollarSign, Target, Wallet, LogOut, RefreshCw, Zap, PieChart, AlertTriangle, CheckCircle, TrendingUp as TrendingUpIcon, Newspaper, Plus, Minus, X, ChevronDown, ChevronUp, Brain, BarChart3, FileText, Download } from 'lucide-react'

const VPS_API_BASE = 'http://localhost:3001'   // Mac Mini (migrated from OVH VPS)
const RLM_API_BASE = 'http://localhost:3002'   // Paper engine (local)
const CHIEF_API_BASE = 'http://localhost:8003'

const COMPANY_NAMES = {
  'PLTR': 'Palantir', 'TSLA': 'Tesla', 'NVDA': 'NVIDIA', 'MSTR': 'MicroStrategy',
  'VOO': 'S&P 500 ETF', 'BTC': 'Bitcoin', 'ETH': 'Ethereum', 'AAPL': 'Apple',
  'MSFT': 'Microsoft', 'AMD': 'AMD', 'META': 'Meta', 'GOOGL': 'Google'
}

export default function Dashboard() {
  // Core data state
  const [holdings, setHoldings] = useState({ holdings: [], totalValue: 0, dayChange: 0, dayChangePercent: 0, btcPrice: 0, allocationByType: {} })
  const [intelligence, setIntelligence] = useState({ all: [], summary: { totalItems: 0, highPriority: 0 } })
  const [paperPositions, setPaperPositions] = useState([])
  const [optionsPositions, setOptionsPositions] = useState([])
  const [shortPositions, setShortPositions] = useState([])
  const [paperSummary, setPaperSummary] = useState({ totalValue: 0, totalInvested: 0, totalPL: 0, totalPLPct: 0, buyingPower: 0 })
  const [tokenUsage, setTokenUsage] = useState({ total_cost_usd: 0, limit_used_pct: 0, limit_status: 'ok', ai_models: [] })
  const [accuracy, setAccuracy] = useState({ overall: 0, totalSignals: 0, wins: 0, losses: 0, targetAccuracy: 65, progressToTarget: 0, byConfidence: {}, byState: {}, currentStreak: 0, bestStreak: 0 })
  const [sygnliqSignals, setSygnliqSignals] = useState([])
  const [sygnliqStats, setSygnliqStats] = useState({ total: 0, strong: 0, medium: 0, weak: 0, weakExperimentsCount: 0, weakSuccessRate: 0 })
  const [autoExecuteEnabled, setAutoExecuteEnabled] = useState(true)
  const [lastUpdated, setLastUpdated] = useState(new Date())

  // RLM state
  const [rlmSignals, setRlmSignals] = useState([])
  const [rlmBudget, setRlmBudget] = useState({ total_budget: 10.0, spent_today: 0, remaining: 10.0 })
  const [rlmStatus, setRlmStatus] = useState({ status: 'operational', version: '2.0' })
  const [marketState, setMarketState] = useState(null)

  // Chief Strategist state
  const [chiefReport, setChiefReport] = useState(null)
  const [chiefOnline, setChiefOnline] = useState(false)
  const [cryptoSignals, setCryptoSignals] = useState(null)
  const [strategyPerf, setStrategyPerf] = useState(null)

  // Day trading P&L (from VPS paper positions)
  const [dayTotalPL, setDayTotalPL] = useState(0)

  // UI state
  const [showBuyModal, setShowBuyModal] = useState(false)
  const [showSellModal, setShowSellModal] = useState(false)
  const [tradeMode, setTradeMode] = useState('paper')
  const [selectedAsset, setSelectedAsset] = useState(null)
  const [tradeQuantity, setTradeQuantity] = useState('')
  const [tradePrice, setTradePrice] = useState('')
  const [tradeSymbol, setTradeSymbol] = useState('')
  const [isExecuting, setIsExecuting] = useState(false)
  const [executionError, setExecutionError] = useState('')
  const [executionSuccess, setExecutionSuccess] = useState('')
  const [showAlertsDropdown, setShowAlertsDropdown] = useState(false)
  const [expandedIntel, setExpandedIntel] = useState(null)
  const [alerts, setAlerts] = useState([])
  const [holdingsFilter, setHoldingsFilter] = useState('all')
  const [graphTimeframe, setGraphTimeframe] = useState('day')
  const [readIntelIds, setReadIntelIds] = useState(new Set())
  const [tradeLog, setTradeLog] = useState([])

  // Live feed state
  const [feedEvents, setFeedEvents] = useState([])
  const [feedFilter, setFeedFilter] = useState('all')
  const [feedLastFetch, setFeedLastFetch] = useState(null)

  // Reports dropdown state
  const [showReportsDropdown, setShowReportsDropdown] = useState(false)
  const [dailyReports, setDailyReports] = useState([])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setReadIntelIds(new Set(JSON.parse(localStorage.getItem('sygnl_read_intel') || '[]')))
      const localLog = JSON.parse(localStorage.getItem('sygnl_trade_log') || '[]')
      if (localLog.length > 0) setTradeLog(localLog)
    }
  }, [])

  // Live feed fetch + auto-refresh every 15s
  useEffect(() => {
    async function fetchFeed() {
      try {
        const url = feedLastFetch
          ? `${VPS_API_BASE}/api/live-feed?limit=50&since=${encodeURIComponent(feedLastFetch)}`
          : `${VPS_API_BASE}/api/live-feed?limit=50`
        const res = await fetch(url).catch(() => null)
        if (res?.ok) {
          const data = await res.json()
          const newEvents = data.events || []
          if (feedLastFetch && newEvents.length > 0) {
            setFeedEvents(prev => {
              const ids = new Set(prev.map(e => e.id))
              const merged = [...prev]
              for (const e of newEvents) { if (!ids.has(e.id)) merged.push(e) }
              merged.sort((a, b) => (b.timestamp || '').localeCompare(a.timestamp || ''))
              return merged.slice(0, 100)
            })
          } else if (!feedLastFetch) {
            setFeedEvents(newEvents)
          }
          setFeedLastFetch(new Date().toISOString())
        }
      } catch (e) { /* silent */ }
    }
    fetchFeed()
    const interval = setInterval(fetchFeed, 15000)
    return () => clearInterval(interval)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Main data fetch
  useEffect(() => {
    async function fetchData() {
      try {
        const [holdingsRes, paperRes, tokenRes, intelRes, accuracyRes, signalsRes, vpsPaperRes, optionsRes] = await Promise.all([
          fetch('/api/holdings').catch(() => null),
          fetch('/api/paper-trading').catch(() => null),
          fetch('/api/token-usage').catch(() => null),
          fetch('/api/intelligence').catch(() => null),
          fetch('/api/accuracy').catch(() => null),
          fetch('/api/execute-signal').catch(() => null),
          fetch(VPS_API_BASE + '/api/paper-trading').catch(() => null),
          fetch('/api/options-short').catch(() => null)
        ])

        // Options & Short positions
        if (optionsRes?.ok) {
          const data = await optionsRes.json()
          setOptionsPositions(data.options || [])
          setShortPositions(data.shorts || [])
        }

        if (holdingsRes?.ok) {
          const data = await holdingsRes.json()
          setHoldings({
            holdings: data.holdings || [],
            totalValue: data.totalValue || 0,
            dayChange: data.dayChange || 0,
            dayChangePercent: data.dayChangePercent || 0,
            btcPrice: data.btcPrice || 0,
            allocationByType: data.allocationByType || {}
          })
        }

        // VPS paper trading is the primary source
        if (vpsPaperRes?.ok) {
          const data = await vpsPaperRes.json()
          const positions = data.positions || []
          setPaperPositions(positions)
          // Compute total unrealized P&L for day P&L display
          const totalPL = positions.reduce((sum, p) => sum + (parseFloat(p.unrealized_pl) || 0), 0)
          setDayTotalPL(totalPL)
          const totalInvested = positions.reduce((sum, p) => sum + (parseFloat(p.cost_basis) || 0), 0)
          const totalValue = data.total_value || 0
          setPaperSummary({
            totalValue,
            totalInvested,
            totalPL: totalValue - totalInvested,
            totalPLPct: totalInvested > 0 ? ((totalValue - totalInvested) / totalInvested) * 100 : 0,
            buyingPower: data.buying_power || 0
          })
          if (data.trade_history) {
            const formattedTrades = data.trade_history.map(t => ({
              timestamp: t.timestamp,
              symbol: t.ticker || t.symbol,
              action: t.action,
              price: t.price || 0,
              quantity: t.quantity || t.qty || 0,
              value: t.notional || t.value || 0,
              source: t.vps_executed ? 'auto' : 'manual',
              strength: t.confidence > 80 ? 'STRONG' : t.confidence > 65 ? 'MEDIUM' : 'WEAK',
              status: t.status || (t.vps_executed ? 'EXECUTED' : 'REJECTED'),
              reason: t.reason
            }))
            setTradeLog(formattedTrades)
          }
        } else if (paperRes?.ok) {
          const data = await paperRes.json()
          setPaperPositions(data.positions || [])
          const positions = data.positions || []
          const totalPL = positions.reduce((sum, p) => sum + (parseFloat(p.unrealized_pl) || 0), 0)
          setDayTotalPL(totalPL)
          setPaperSummary({
            totalValue: data.total_value || 0,
            totalInvested: data.total_invested || 0,
            totalPL: data.total_pl || 0,
            totalPLPct: data.total_pl_pct || 0,
            buyingPower: data.buyingPower || 0
          })
          if (data.tradeHistory) setTradeLog(data.tradeHistory)
        }

        if (tokenRes?.ok) {
          const data = await tokenRes.json()
          setTokenUsage({
            total_cost_usd: data.total_cost_usd ?? 0,
            limit_used_pct: data.limit_used_pct ?? 0,
            limit_status: data.limit_status || 'ok',
            ai_models: data.ai_models || []
          })
        }
        if (intelRes?.ok) {
          const data = await intelRes.json()
          setIntelligence({ all: data.all || [], summary: data.summary || { totalItems: 0, highPriority: 0 } })
        }
        if (accuracyRes?.ok) {
          const data = await accuracyRes.json()
          setAccuracy(data)
        }
        if (signalsRes?.ok) {
          const data = await signalsRes.json()
          setSygnliqSignals(data.signals || [])
          setSygnliqStats(data.stats || {})
          setAutoExecuteEnabled(data.autoExecuteEnabled !== false)
        }
        setLastUpdated(new Date())
      } catch (e) { console.error('Fetch error:', e) }
    }
    fetchData()
    const interval = setInterval(fetchData, 30000)
    return () => clearInterval(interval)
  }, [])

  // RLM data fetch
  useEffect(() => {
    async function fetchRlmData() {
      try {
        const [rlmSignalsRes, rlmStatusRes] = await Promise.all([
          fetch(RLM_API_BASE + '/api/rlm/signals').catch(() => null),
          fetch(RLM_API_BASE + '/api/rlm/status').catch(() => null)
        ])
        if (rlmSignalsRes?.ok) {
          const data = await rlmSignalsRes.json()
          setRlmSignals(data.fast_signals || [])
          setRlmBudget({
            total_budget: data.budget_status?.total_budget || 10.0,
            spent_today: data.budget_status?.spent_today || 0,
            remaining: data.budget_status?.remaining || 10.0
          })
          if (data.market_state) setMarketState(data.market_state)
        }
        if (rlmStatusRes?.ok) {
          const data = await rlmStatusRes.json()
          setRlmStatus(data)
          if (data.market_state) setMarketState(data.market_state)
        }
      } catch (e) { console.error('RLM Fetch error:', e) }
    }
    fetchRlmData()
    const rlmInterval = setInterval(fetchRlmData, 60000)
    return () => clearInterval(rlmInterval)
  }, [])

  // Chief Strategist data fetch
  useEffect(() => {
    async function fetchChiefData() {
      try {
        const [reportRes, cryptoRes, strategyRes] = await Promise.all([
          fetch(CHIEF_API_BASE + '/api/chief-report').catch(() => null),
          fetch(CHIEF_API_BASE + '/api/crypto/signals').catch(() => null),
          fetch(CHIEF_API_BASE + '/api/metrics/by-strategy').catch(() => null)
        ])
        if (reportRes?.ok) { setChiefReport(await reportRes.json()); setChiefOnline(true) }
        else setChiefOnline(false)
        if (cryptoRes?.ok) setCryptoSignals(await cryptoRes.json())
        if (strategyRes?.ok) setStrategyPerf(await strategyRes.json())
      } catch (e) { console.error('Chief API error:', e); setChiefOnline(false) }
    }
    fetchChiefData()
    const chiefInterval = setInterval(fetchChiefData, 30000)
    return () => clearInterval(chiefInterval)
  }, [])

  // Daily Reports fetch
  useEffect(() => {
    async function fetchDailyReports() {
      try {
        // Try to fetch from the API endpoint for daily reports
        const res = await fetch(`${VPS_API_BASE}/api/daily-reports`).catch(() => null)
        if (res?.ok) {
          const data = await res.json()
          setDailyReports(data.reports || [])
        } else {
          // Fallback: generate from local data files
          const reports = []
          const today = new Date()
          
          // Generate last 7 days of report placeholders
          for (let i = 0; i < 7; i++) {
            const date = new Date(today)
            date.setDate(date.getDate() - i)
            const dateStr = date.toISOString().split('T')[0]
            const dateCompact = dateStr.replace(/-/g, '')
            
            reports.push({
              date: dateStr,
              label: i === 0 ? 'Today' : i === 1 ? 'Yesterday' : date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
              url: `/data/chief_daily_report_${dateCompact}.json`,
              available: i === 0 // Only mark today as available for now
            })
          }
          setDailyReports(reports)
        }
      } catch (e) { console.error('Daily reports fetch error:', e) }
    }
    fetchDailyReports()
  }, [])

  // Click outside handler for dropdowns
  useEffect(() => {
    function handleClickOutside(e) {
      const alertsDropdown = document.getElementById('alerts-dropdown')
      const reportsDropdown = document.getElementById('reports-dropdown')
      
      if (alertsDropdown && !alertsDropdown.contains(e.target)) {
        setShowAlertsDropdown(false)
      }
      if (reportsDropdown && !reportsDropdown.contains(e.target)) {
        setShowReportsDropdown(false)
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Auto-execute strong signals (only when signal carries a real price)
  useEffect(() => {
    if (!autoExecuteEnabled || sygnliqSignals.length === 0) return
    const strongSignals = sygnliqSignals.filter(s => s.strength === 'STRONG' && s.autoExecute)
    strongSignals.forEach(async (signal) => {
      const alreadyExecuted = tradeLog.some(t => t.signalId === signal.id && t.source === 'auto')
      if (alreadyExecuted) return
      const price = signal.price || signal.currentPrice || 0
      if (!price) return
      const qty = Math.floor((signal.suggestedSize || 5000) / price)
      if (qty < 1) return
      try {
        const res = await fetch('/api/paper-trading', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ symbol: signal.symbol, quantity: qty, price, action: signal.action, source: 'signal-auto', signalConfidence: signal.confidence, autoExecuted: true })
        })
        if (res.ok) {
          const newTrade = { id: Date.now(), signalId: signal.id, symbol: signal.symbol, action: signal.action, quantity: qty, price, value: qty * price, timestamp: new Date().toISOString(), source: 'auto', strength: signal.strength }
          const updatedLog = [newTrade, ...tradeLog].slice(0, 50)
          setTradeLog(updatedLog)
          if (typeof window !== 'undefined') localStorage.setItem('sygnl_trade_log', JSON.stringify(updatedLog))
        }
      } catch (e) { console.error('Auto-execute failed:', e) }
    })
  }, [sygnliqSignals, autoExecuteEnabled, tradeLog])

  useEffect(() => {
    const newAlerts = []
    if (intelligence.all) {
      intelligence.all.filter(item => item.priority === 'high' || !readIntelIds.has(item.id || item.title))
        .forEach(item => newAlerts.push({ id: item.id || item.title, type: 'intel', title: item.title, message: item.summary, priority: item.priority || 'normal', source: 'Intelligence' }))
    }
    const strongSignals = sygnliqSignals.filter(s => s.strength === 'STRONG' && s.autoExecute)
    if (strongSignals.length > 0) {
      newAlerts.push({ id: 'strong-signals', type: 'signal', title: strongSignals.length + ' Strong Signal' + (strongSignals.length > 1 ? 's' : ''), message: 'Auto-execute: ' + strongSignals.map(s => s.symbol).join(', '), priority: 'high', source: 'SYGNL.iq' })
    }
    setAlerts(newAlerts)
  }, [intelligence, sygnliqSignals, readIntelIds])

  const formatCurrency = (val) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val || 0)

  const markIntelAsRead = (id) => {
    setReadIntelIds(prev => {
      const newSet = new Set(prev)
      newSet.add(id)
      if (typeof window !== 'undefined') localStorage.setItem('sygnl_read_intel', JSON.stringify([...newSet]))
      return newSet
    })
  }

  const clearAlert = (id) => setAlerts(prev => prev.filter(a => a.id !== id))
  const newIntelCount = intelligence.all?.filter(item => !readIntelIds.has(item.id || item.title)).length || 0

  const handleTrade = async (action) => {
    const symbol = selectedAsset?.symbol || tradeSymbol
    if (!symbol || !tradeQuantity || !tradePrice) { setExecutionError('Fill all fields'); return }
    setIsExecuting(true); setExecutionError(''); setExecutionSuccess('')
    try {
      const endpoint = tradeMode === 'paper' ? '/api/paper-trading' : '/api/holdings'
      const res = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ symbol: symbol.toUpperCase(), quantity: parseFloat(tradeQuantity), price: parseFloat(tradePrice), action }) })
      if (!res.ok) throw new Error((await res.json()).error || 'Trade failed')
      setExecutionSuccess((await res.json()).message)
      setTimeout(() => window.location.reload(), 1500)
    } catch (e) { setExecutionError(e.message) }
    finally { setIsExecuting(false) }
  }

  const handleSygnliqExecute = async (signal, isWeak = false) => {
    if (!signal || isExecuting) return
    setIsExecuting(true); setExecutionError(''); setExecutionSuccess('')
    try {
      const price = signal.price || signal.currentPrice || 0
      const quantity = price > 0 ? Math.floor((signal.suggestedSize || 5000) / price) : 1
      const res = await fetch('/api/execute-signal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbol: signal.symbol, action: signal.action, confidence: signal.confidence, marketState: signal.marketState, mode: 'paper', quantity, price, signalId: signal.id, isWeakSignalExperiment: isWeak })
      })
      if (!res.ok) throw new Error((await res.json()).error || 'Failed')
      setExecutionSuccess(isWeak ? 'Experimental: ' + signal.action + ' ' + signal.symbol : 'Executed: ' + signal.action + ' ' + signal.symbol)
      setTimeout(() => window.location.reload(), 1500)
    } catch (e) { setExecutionError(e.message) }
    finally { setIsExecuting(false) }
  }

  const getSignalColor = (s) => s === 'STRONG' ? 'emerald' : s === 'MEDIUM' ? 'blue' : 'yellow'

  const filteredHoldings = holdings.holdings?.filter(h => {
    if (holdingsFilter === 'all') return true
    if (holdingsFilter === 'stocks') return h.type === 'Equity'
    if (holdingsFilter === 'etfs') return h.type === 'ETF'
    if (holdingsFilter === 'crypto') return h.type === 'Crypto'
    return true
  }) || []

  const totalsByType = { stocks: { value: 0, dayChange: 0 }, etfs: { value: 0, dayChange: 0 }, crypto: { value: 0, dayChange: 0 } }
  filteredHoldings.forEach(h => {
    if (h.type === 'Equity') { totalsByType.stocks.value += h.current_value || 0; totalsByType.stocks.dayChange += h.day_change || 0 }
    else if (h.type === 'ETF') { totalsByType.etfs.value += h.current_value || 0; totalsByType.etfs.dayChange += h.day_change || 0 }
    else if (h.type === 'Crypto') { totalsByType.crypto.value += h.current_value || 0; totalsByType.crypto.dayChange += h.day_change || 0 }
  })

  // Graph data: only real data points from holdings
  const getGraphData = () => {
    if (!holdings.totalValue) return []
    const today = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    return [{ date: today, value: holdings.totalValue, change: holdings.dayChangePercent || 0 }]
  }
  const graphData = getGraphData()

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-[128px]" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-[128px]" />
      </div>

      <header className="relative z-50 border-b border-white/5 bg-black/20 backdrop-blur-xl sticky top-0">
        <div className="max-w-[1600px] mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center">
            <img src="/logo.png" alt="SYGNL" className="h-24 w-auto object-contain" />
          </div>
          <div className="flex items-center gap-4">
            <div id="alerts-dropdown" className="relative">
              <button onClick={() => setShowAlertsDropdown(!showAlertsDropdown)} className="flex items-center gap-3 px-4 py-2 rounded-xl bg-black/40 border border-white/10 hover:bg-black/60 transition-colors">
                <AlertTriangle className={alerts.length > 0 ? 'w-4 h-4 text-red-400 animate-pulse' : 'w-4 h-4 text-zinc-500'} />
                <span className="text-sm font-medium text-zinc-300">Alerts</span>
                {alerts.length > 0 && <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full animate-pulse">{alerts.length}</span>}
                <ChevronDown className={'w-4 h-4 text-zinc-500 transition-transform ' + (showAlertsDropdown ? 'rotate-180' : '')} />
              </button>
              {showAlertsDropdown && (
                <div className="absolute right-0 top-full mt-2 w-96 bg-zinc-900 border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50">
                  <div className="p-3 border-b border-white/5"><span className="text-sm font-medium text-zinc-300">Active Alerts</span></div>
                  {alerts.length === 0 ? <div className="p-4 text-center text-sm text-zinc-500">No active alerts</div> : (
                    <div className="max-h-64 overflow-y-auto">
                      {alerts.map((alert, idx) => (
                        <div key={idx} onClick={() => { clearAlert(alert.id); if (alert.type === 'intel') setExpandedIntel(alert.id) }} className="p-3 border-b border-white/5 hover:bg-white/5 cursor-pointer transition-colors">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2"><span className={'w-2 h-2 rounded-full ' + (alert.priority === 'high' ? 'bg-red-500' : 'bg-yellow-500')} /><span className="text-sm font-medium">{alert.title}</span></div>
                              <p className="text-xs text-zinc-500 mt-1 line-clamp-2">{alert.message}</p>
                            </div>
                            <button onClick={(e) => { e.stopPropagation(); clearAlert(alert.id) }} className="p-1 hover:bg-white/10 rounded"><X className="w-3 h-3 text-zinc-500" /></button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20">
              <span className="relative flex h-3 w-3"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span></span>
              <span className="text-sm font-medium text-emerald-400">LIVE</span>
              <span className="text-xs text-emerald-500/60 ml-1">{lastUpdated.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}</span>
            </div>
            <button onClick={() => window.location.reload()} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 text-sm transition-colors"><RefreshCw className="w-4 h-4" /></button>
            <a href="/paper-trading" className="px-3 py-2 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 text-sm font-medium border border-cyan-500/20">Paper Trading →</a>
            <a href="/options" className="px-3 py-2 rounded-xl bg-violet-500/10 hover:bg-violet-500/20 text-violet-400 text-sm font-medium border border-violet-500/20">Options →</a>
            <a href="/mission-control" className="px-3 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-sm font-medium border border-rose-500/20">Mission Control →</a>
            <a href="/v2" className="px-3 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 text-sm font-medium border border-amber-500/20">⚡ v2 →</a>
            
            {/* Reports Dropdown */}
            <div id="reports-dropdown" className="relative">
              <button 
                onClick={() => setShowReportsDropdown(!showReportsDropdown)} 
                className="flex items-center gap-2 px-3 py-2 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 text-sm font-medium border border-blue-500/20 transition-colors"
              >
                <FileText className="w-4 h-4" />
                <span>Reports</span>
                <ChevronDown className={'w-4 h-4 transition-transform ' + (showReportsDropdown ? 'rotate-180' : '')} />
              </button>
              {showReportsDropdown && (
                <div className="absolute right-0 top-full mt-2 w-72 bg-zinc-900 border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50">
                  <div className="p-3 border-b border-white/5 flex items-center justify-between">
                    <span className="text-sm font-medium text-zinc-300">Daily Reports</span>
                    <span className="text-xs text-zinc-500">{dailyReports.filter(r => r.available).length} available</span>
                  </div>
                  {dailyReports.length === 0 ? (
                    <div className="p-4 text-center text-sm text-zinc-500">No reports available</div>
                  ) : (
                    <div className="max-h-64 overflow-y-auto">
                      {dailyReports.map((report, idx) => (
                        <div 
                          key={idx} 
                          className="p-3 border-b border-white/5 hover:bg-white/5 cursor-pointer transition-colors flex items-center justify-between group"
                          onClick={() => {
                            if (report.available) {
                              window.open(report.url, '_blank')
                            }
                          }}
                        >
                          <div className="flex items-center gap-3">
                            <div className={'w-8 h-8 rounded-lg flex items-center justify-center ' + (report.available ? 'bg-blue-500/20 text-blue-400' : 'bg-zinc-800 text-zinc-600')}>
                              <FileText className="w-4 h-4" />
                            </div>
                            <div>
                              <div className={'text-sm font-medium ' + (report.available ? 'text-zinc-200' : 'text-zinc-500')}>{report.label}</div>
                              <div className="text-xs text-zinc-600">{report.date}</div>
                            </div>
                          </div>
                          {report.available ? (
                            <Download className="w-4 h-4 text-zinc-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                          ) : (
                            <span className="text-xs text-zinc-600">Pending</span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="p-2 border-t border-white/5 bg-black/20">
                    <button 
                      onClick={() => window.open('/api/daily-reports/all', '_blank')}
                      className="w-full py-2 text-xs text-center text-zinc-400 hover:text-zinc-200 transition-colors"
                    >
                      View All Reports →
                    </button>
                  </div>
                </div>
              )}
            </div>
            
            <a href="/" className="p-2 rounded-xl bg-white/5 hover:bg-red-500/10"><LogOut className="w-5 h-5 text-zinc-400" /></a>
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-[1600px] mx-auto px-6 py-6">

        {/* ── Top Stats Bar (7 cards) ── */}
        <div className="flex justify-center mb-6">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 w-full">

            {/* 1. Accuracy */}
            <div className="p-4 rounded-xl bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/20">
              <div className="flex items-center gap-2 mb-2"><Target className="w-4 h-4 text-blue-400" /><span className="text-xs text-zinc-500">Accuracy</span></div>
              <div className={'text-xl font-bold ' + (accuracy.overall >= 65 ? 'text-emerald-400' : accuracy.overall >= 50 ? 'text-yellow-400' : 'text-red-400')}>{accuracy.overall ? accuracy.overall + '%' : '—'}</div>
              <div className="mt-2"><div className="flex justify-between text-xs text-zinc-500 mb-1"><span>Target: 65%</span><span>{accuracy.progressToTarget || 0}%</span></div><div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden"><div className={'h-full rounded-full transition-all duration-500 ' + (accuracy.progressToTarget >= 100 ? 'bg-emerald-500' : accuracy.progressToTarget >= 75 ? 'bg-blue-500' : 'bg-yellow-500')} style={{ width: Math.min(100, accuracy.progressToTarget || 0) + '%' }} /></div></div>
              <div className="mt-2 text-xs text-zinc-500">{accuracy.wins}W / {accuracy.losses}L</div>
            </div>

            {/* 2. Portfolio Value */}
            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
              <div className="flex items-center gap-2 mb-2"><Wallet className="w-4 h-4 text-emerald-400" /><span className="text-xs text-zinc-500">Portfolio</span></div>
              <div className="text-xl font-bold">{holdings.totalValue ? formatCurrency(holdings.totalValue) : '—'}</div>
              <div className={(holdings.dayChange || 0) >= 0 ? 'text-xs text-emerald-400' : 'text-xs text-red-400'}>{holdings.dayChange ? ((holdings.dayChange >= 0 ? '+' : '') + formatCurrency(holdings.dayChange) + ' today') : 'Loading...'}</div>
            </div>

            {/* 3. Day P&L */}
            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
              <div className="flex items-center gap-2 mb-2"><TrendingUp className="w-4 h-4 text-cyan-400" /><span className="text-xs text-zinc-500">Day P&amp;L</span></div>
              <div className={'text-xl font-bold ' + (dayTotalPL >= 0 ? 'text-emerald-400' : 'text-red-400')}>{paperPositions.length > 0 ? ((dayTotalPL >= 0 ? '+' : '') + formatCurrency(dayTotalPL)) : '—'}</div>
              <div className="text-xs text-zinc-500">{paperPositions.length} position{paperPositions.length !== 1 ? 's' : ''}</div>
            </div>

            {/* 4. Active Signals */}
            <div className="p-4 rounded-xl bg-white/5 border border-white/10 relative">
              <div className="flex items-center gap-2 mb-2"><Zap className="w-4 h-4 text-blue-400" /><span className="text-xs text-zinc-500">Signals</span>{newIntelCount > 0 && <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full animate-pulse">{newIntelCount} NEW</span>}</div>
              <div className="text-xl font-bold">{intelligence.summary?.totalItems || 0}</div>
              <div className="text-xs text-zinc-500">{intelligence.summary?.highPriority > 0 ? intelligence.summary.highPriority + ' high priority' : 'Monitoring'}</div>
            </div>

            {/* 5. Paper P&L */}
            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
              <div className="flex items-center gap-2 mb-2"><Target className="w-4 h-4 text-purple-400" /><span className="text-xs text-zinc-500">Paper P&amp;L</span></div>
              <div className={'text-xl font-bold ' + (paperSummary.totalPL >= 0 ? 'text-emerald-400' : 'text-red-400')}>{paperSummary.totalValue > 0 ? ((paperSummary.totalPL >= 0 ? '+' : '') + paperSummary.totalPLPct.toFixed(2) + '%') : '—'}</div>
              <div className="text-xs text-zinc-500">{formatCurrency(paperSummary.totalValue)} total</div>
            </div>

            {/* 6. AI Cost */}
            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
              <div className="flex items-center gap-2 mb-2"><DollarSign className={'w-4 h-4 ' + (tokenUsage.limit_status === 'ok' ? 'text-emerald-400' : 'text-yellow-400')} /><span className="text-xs text-zinc-500">AI Cost</span></div>
              <div className={'text-xl font-bold ' + (tokenUsage.limit_status === 'ok' ? 'text-emerald-400' : 'text-yellow-400')}>${tokenUsage.total_cost_usd.toFixed(2)}</div>
              <div className="text-xs text-zinc-500">{tokenUsage.limit_used_pct.toFixed(0)}% of $10</div>
            </div>

            {/* 7. Market Status */}
            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
              <div className="flex items-center gap-2 mb-2"><Activity className="w-4 h-4 text-yellow-400" /><span className="text-xs text-zinc-500">Market State</span></div>
              <div className={'text-xl font-bold ' + (marketState ? 'text-yellow-400' : 'text-zinc-500')}>{marketState || '—'}</div>
              <div className="text-xs text-zinc-500">{rlmStatus.status === 'operational' ? 'RLM online' : 'RLM offline'}</div>
            </div>

          </div>
        </div>

        {/* ── Day Trading Section (VPS-direct, no Chief required) ── */}
        <div id="day-trades-section" className="mb-6 p-4 rounded-xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/20">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-400" />
              Day Trading Positions
              <span className="text-xs text-zinc-500 font-normal">VPS Alpaca Paper</span>
            </h3>
            <div className="flex items-center gap-3">
              {paperPositions.length > 0 && (
                <span className={'text-sm font-semibold px-3 py-1 rounded-lg ' + (dayTotalPL >= 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400')}>
                  {dayTotalPL >= 0 ? '+' : ''}{formatCurrency(dayTotalPL)} total P&L
                </span>
              )}
              <span className="text-xs text-zinc-500">{paperPositions.length} active</span>
              <button onClick={() => { setTradeMode('paper'); setShowBuyModal(true) }} className="px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 text-sm flex items-center gap-1 hover:bg-emerald-500/30"><Plus className="w-4 h-4" /> Open</button>
            </div>
          </div>
          {paperPositions.length > 0 ? (
            <div className="space-y-2">
              {paperPositions.map((pos, i) => {
                const pl = parseFloat(pos.unrealized_pl) || 0
                const plPct = parseFloat(pos.unrealized_pl_pct) || 0
                const entryPrice = parseFloat(pos.entry_price || pos.avg_entry_price) || 0
                const currentPrice = parseFloat(pos.current_price || pos.lastprice) || 0
                return (
                  <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-black/30 border border-white/5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center font-bold text-sm text-emerald-400">{pos.symbol?.slice(0, 2)}</div>
                      <div>
                        <div className="font-medium">{pos.symbol}</div>
                        <div className="text-xs text-zinc-500">{pos.qty || pos.quantity} shares</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      {entryPrice > 0 && (
                        <div className="text-right">
                          <div className="text-xs text-zinc-500">Entry</div>
                          <div className="text-sm font-medium">${entryPrice.toFixed(2)}</div>
                        </div>
                      )}
                      {currentPrice > 0 && (
                        <div className="text-right">
                          <div className="text-xs text-zinc-500">Current</div>
                          <div className="text-sm font-medium">${currentPrice.toFixed(2)}</div>
                        </div>
                      )}
                      <div className="text-right min-w-[80px]">
                        <div className={pl >= 0 ? 'text-sm font-bold text-emerald-400' : 'text-sm font-bold text-red-400'}>{pl >= 0 ? '+' : ''}{formatCurrency(pl)}</div>
                        <div className={plPct >= 0 ? 'text-xs text-emerald-500' : 'text-xs text-red-500'}>{plPct >= 0 ? '+' : ''}{plPct.toFixed(2)}%</div>
                      </div>
                      <button onClick={() => { setTradeMode('paper'); setSelectedAsset(pos); setShowSellModal(true) }} className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20"><Minus className="w-4 h-4" /></button>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="p-8 text-center">
              <div className="text-zinc-500 mb-2">No active positions</div>
              <div className="text-xs text-zinc-600">Paper trading via VPS Alpaca API · {VPS_API_BASE}</div>
            </div>
          )}
        </div>

        {/* ── Chief Strategist Panel ── */}
        <div id="chief-section" className="mb-6 p-4 rounded-xl bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-500/20">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold flex items-center gap-2"><Brain className="w-5 h-5 text-cyan-400" />Chief Strategist</h3>
            <span className={'text-xs px-2 py-1 rounded ' + (chiefOnline ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400')}>{chiefOnline ? '● Online' : '● Offline'}</span>
          </div>
          {chiefOnline && chiefReport ? (
            <>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
                <div className="p-3 rounded-lg bg-black/30"><div className="text-xs text-zinc-500 mb-1">Equity</div><div className="text-lg font-bold text-white">{formatCurrency(chiefReport.equity || 0)}</div></div>
                <div className="p-3 rounded-lg bg-black/30"><div className="text-xs text-zinc-500 mb-1">R_total</div><div className={'text-lg font-bold ' + ((chiefReport.r_total || 0) >= 0.75 ? 'text-emerald-400' : 'text-yellow-400')}>{(chiefReport.r_total || 0).toFixed(3)}</div><div className="mt-1 h-1.5 bg-zinc-800 rounded-full overflow-hidden"><div className={'h-full rounded-full ' + ((chiefReport.r_total || 0) >= 0.75 ? 'bg-emerald-500' : 'bg-yellow-500')} style={{ width: Math.min(100, ((chiefReport.r_total || 0) / 0.75) * 100) + '%' }} /></div><div className="text-xs text-zinc-600 mt-1">Target: 0.75</div></div>
                <div className="p-3 rounded-lg bg-black/30"><div className="text-xs text-zinc-500 mb-1">Win Rate</div><div className={'text-lg font-bold ' + ((chiefReport.win_rate || 0) >= 55 ? 'text-emerald-400' : 'text-red-400')}>{(chiefReport.win_rate || 0).toFixed(1)}%</div></div>
                <div className="p-3 rounded-lg bg-black/30"><div className="text-xs text-zinc-500 mb-1">Sharpe Ratio</div><div className={'text-lg font-bold ' + ((chiefReport.sharpe_ratio || 0) >= 1 ? 'text-emerald-400' : 'text-yellow-400')}>{(chiefReport.sharpe_ratio || 0).toFixed(2)}</div></div>
                <div className="p-3 rounded-lg bg-black/30"><div className="text-xs text-zinc-500 mb-1">Max Drawdown</div><div className="text-lg font-bold text-red-400">{(chiefReport.max_drawdown || 0).toFixed(1)}%</div></div>
              </div>
              {chiefReport.pivot_criteria && (
                <div className="p-3 rounded-lg bg-black/20">
                  <div className="text-xs text-zinc-500 mb-2">Pivot Criteria ({(chiefReport.pivot_criteria.filter(c => c.met) || []).length}/7)</div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {(Array.isArray(chiefReport.pivot_criteria) ? chiefReport.pivot_criteria : []).map((c, i) => (
                      <div key={i} className={'flex items-center gap-2 text-xs p-2 rounded ' + (c.met ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400')}>
                        {c.met ? <CheckCircle className="w-3 h-3" /> : <X className="w-3 h-3" />}
                        <span>{c.name || c.label || ('Criterion ' + (i + 1))}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="p-6 text-center text-zinc-500">Chief API offline — start with <code className="bg-black/30 px-2 py-1 rounded text-xs">localhost:8003</code></div>
          )}
        </div>

        {/* ── Crypto Scanner (Chief-dependent) ── */}
        {chiefOnline && cryptoSignals && (Array.isArray(cryptoSignals) ? cryptoSignals : cryptoSignals.signals || []).length > 0 && (
          <div id="crypto-scanner-section" className="mb-6 p-4 rounded-xl bg-gradient-to-br from-orange-500/10 to-yellow-500/10 border border-orange-500/20">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2"><Zap className="w-5 h-5 text-orange-400" />Crypto Scanner</h3>
              <span className="text-xs text-zinc-500">{(Array.isArray(cryptoSignals) ? cryptoSignals : cryptoSignals.signals || []).length} signals</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
              {(Array.isArray(cryptoSignals) ? cryptoSignals : cryptoSignals.signals || []).slice(0, 9).map((s, i) => (
                <div key={i} className={'p-3 rounded-lg border ' + ((s.signal || '').toLowerCase().includes('buy') ? 'bg-emerald-500/5 border-emerald-500/20' : (s.signal || '').toLowerCase().includes('sell') ? 'bg-red-500/5 border-red-500/20' : 'bg-white/5 border-white/10')}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-sm">{s.symbol || s.ticker}</span>
                    <span className={'text-xs px-2 py-0.5 rounded font-medium ' + ((s.signal || '').toLowerCase().includes('buy') ? 'bg-emerald-500/20 text-emerald-400' : (s.signal || '').toLowerCase().includes('sell') ? 'bg-red-500/20 text-red-400' : 'bg-zinc-500/20 text-zinc-400')}>{s.signal || 'NEUTRAL'}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-zinc-500">
                    {s.rsi != null && <span>RSI: <span className={(N(s.rsi) > 70 ? 'text-red-400' : N(s.rsi) < 30 ? 'text-emerald-400' : 'text-zinc-300')}>{N(s.rsi).toFixed(1)}</span></span>}
                    {s.momentum != null && <span>Mom: <span className={N(s.momentum) > 0 ? 'text-emerald-400' : 'text-red-400'}>{N(s.momentum).toFixed(2)}</span></span>}
                    {s.strength != null && <span>Str: <span className="text-zinc-300">{typeof s.strength === 'number' ? s.strength.toFixed(0) + '%' : (isNaN(s.strength) ? s.strength : N(s.strength).toFixed(0) + '%')}</span></span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Strategy Performance (Chief-dependent) ── */}
        {chiefOnline && strategyPerf && (Array.isArray(strategyPerf) ? strategyPerf : strategyPerf.strategies || []).length > 0 && (
          <div id="strategy-perf-section" className="mb-6 p-4 rounded-xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2"><PieChart className="w-5 h-5 text-purple-400" />Strategy Performance</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {(Array.isArray(strategyPerf) ? strategyPerf : strategyPerf.strategies || []).map((st, i) => (
                <div key={i} className="p-3 rounded-lg bg-black/30">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-sm">{st.name || st.strategy}</span>
                    <span className={'text-sm font-bold ' + ((st.pnl || st.total_pnl || 0) >= 0 ? 'text-emerald-400' : 'text-red-400')}>{(st.pnl || st.total_pnl || 0) >= 0 ? '+' : ''}{formatCurrency(st.pnl || st.total_pnl || 0)}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-zinc-500">
                    {st.win_rate != null && <span>Win: <span className="text-zinc-300">{N(st.win_rate).toFixed(0)}%</span></span>}
                    {st.trades != null && <span>Trades: <span className="text-zinc-300">{st.trades}</span></span>}
                    {st.sharpe != null && <span>Sharpe: <span className="text-zinc-300">{N(st.sharpe).toFixed(2)}</span></span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Connected AI Models (real data only) ── */}
        {tokenUsage.ai_models?.length > 0 && (
          <div id="ai-models-section" className="mb-6 p-4 rounded-xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/20">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2"><Brain className="w-5 h-5 text-indigo-400" />Connected AI Models</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {tokenUsage.ai_models.map((m, i) => (
                <div key={i} className="p-3 rounded-lg bg-black/30">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-medium text-sm">{m.model.split('-')[0].toUpperCase()}</span>
                    <span className="text-xs text-zinc-500 ml-auto">${N(m.cost_usd).toFixed(2)}</span>
                  </div>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between text-zinc-500"><span>Calls</span><span className="text-zinc-300">{N(m.calls).toLocaleString()}</span></div>
                    <div className="flex justify-between text-zinc-500"><span>Tokens</span><span className="text-zinc-300">{((N(m.tokens_in) + N(m.tokens_out)) / 1000).toFixed(1)}k</span></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Today's Briefing Live Feed ── */}
        <div className="col-span-full mb-6 p-4 rounded-xl bg-gradient-to-br from-zinc-900/50 to-black/50 border border-white/10">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <span className="text-lg">📡</span> Today&#39;s Briefing
              <span className="flex items-center gap-1 ml-2 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-medium text-emerald-400 uppercase tracking-wider">Live</span>
              </span>
            </h3>
            <span className="text-xs text-zinc-500">{feedEvents.length} events</span>
          </div>

          {/* Filter pills */}
          <div className="flex gap-1.5 mb-3 flex-wrap">
            {[
              { key: 'all', label: 'All' },
              { key: 'trade', label: 'Trades' },
              { key: 'signal', label: 'Signals' },
              { key: 'job', label: 'Jobs' },
              { key: 'alert', label: 'Alerts' },
              { key: 'analysis', label: 'Analysis' },
              { key: 'briefing', label: 'Briefing' },
            ].map(f => (
              <button key={f.key} onClick={() => setFeedFilter(f.key)}
                className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-all ${feedFilter === f.key ? 'bg-white/10 text-white border border-white/20' : 'bg-white/5 text-zinc-500 border border-transparent hover:bg-white/10 hover:text-zinc-300'}`}>
                {f.label}
              </button>
            ))}
          </div>

          {/* Event list */}
          <div className="max-h-[500px] overflow-y-auto space-y-1 pr-1 scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent">
            {(() => {
              const FEED_ICONS = { trade: '💰', signal: '⚡', alert: '🚨', job: '⚙️', system: '🖥️', analysis: '📊', briefing: '📋' }
              const SEV_COLORS = { success: 'bg-emerald-500', info: 'bg-blue-500', warning: 'bg-yellow-500', error: 'bg-red-500' }
              const filtered = feedFilter === 'all' ? feedEvents : feedEvents.filter(e => e.type === feedFilter)
              if (filtered.length === 0) {
                return (
                  <div className="flex flex-col items-center justify-center py-12 text-zinc-600">
                    <span className="text-3xl mb-2">📡</span>
                    <span className="text-sm">No activity yet today</span>
                    <span className="text-xs mt-1">Events will appear as jobs run and data compiles</span>
                  </div>
                )
              }
              return filtered.map((evt, i) => {
                const icon = evt.icon || FEED_ICONS[evt.type] || '📡'
                const sevColor = SEV_COLORS[evt.severity] || SEV_COLORS.info
                let relTime = ''
                try {
                  const diff = Date.now() - new Date(evt.timestamp).getTime()
                  const mins = Math.floor(diff / 60000)
                  if (mins < 1) relTime = 'just now'
                  else if (mins < 60) relTime = `${mins}m ago`
                  else if (mins < 1440) relTime = `${Math.floor(mins / 60)}h ago`
                  else relTime = `${Math.floor(mins / 1440)}d ago`
                } catch { relTime = '' }
                return (
                  <div key={evt.id || i} className="flex items-start gap-3 p-2.5 rounded-lg bg-white/[0.02] hover:bg-white/[0.05] transition-colors border border-transparent hover:border-white/5 group">
                    <div className="flex flex-col items-center gap-1 min-w-[44px] pt-0.5">
                      <span className="text-base leading-none">{icon}</span>
                      <span className="text-[10px] text-zinc-600 whitespace-nowrap">{relTime}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-zinc-200 truncate">{evt.title}</div>
                      {evt.body && <div className="text-xs text-zinc-500 mt-0.5 line-clamp-2 leading-relaxed">{evt.body}</div>}
                    </div>
                    <div className="flex items-center gap-2 pt-1">
                      <span className="text-[10px] text-zinc-600 hidden group-hover:inline">{evt.source}</span>
                      <span className={`w-2 h-2 rounded-full ${sevColor} flex-shrink-0`} />
                    </div>
                  </div>
                )
              })
            })()}
          </div>
        </div>

        {/* ── Accuracy Breakdown ── */}
        {accuracy.totalSignals > 0 && (
          <div id="accuracy-section" className="mb-6 p-4 rounded-xl bg-gradient-to-br from-blue-500/5 to-purple-500/5 border border-blue-500/20">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2"><Target className="w-5 h-5 text-blue-400" />SYGNL Accuracy Breakdown<span className="text-xs text-zinc-500 font-normal ml-auto">Last 30 days · {accuracy.totalSignals} signals</span></h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-3 rounded-lg bg-black/30">
                <h4 className="text-sm font-medium text-zinc-400 mb-3">By Confidence Level</h4>
                <div className="space-y-2">
                  {Object.entries(accuracy.byConfidence || {}).map(([range, data]) => (
                    <div key={range} className="flex items-center gap-3">
                      <span className="text-xs text-zinc-500 w-16">{range}%</span>
                      <div className="flex-1 h-2 bg-zinc-800 rounded-full overflow-hidden"><div className={'h-full rounded-full ' + (data.accuracy >= 65 ? 'bg-emerald-500' : data.accuracy >= 50 ? 'bg-yellow-500' : 'bg-red-500')} style={{ width: data.accuracy + '%' }} /></div>
                      <span className={'text-xs font-medium w-12 text-right ' + (data.accuracy >= 65 ? 'text-emerald-400' : data.accuracy >= 50 ? 'text-yellow-400' : 'text-red-400')}>{data.accuracy}%</span>
                      <span className="text-xs text-zinc-600 w-16 text-right">{data.wins}/{data.total}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="p-3 rounded-lg bg-black/30">
                <h4 className="text-sm font-medium text-zinc-400 mb-3">By Market State</h4>
                <div className="space-y-2">
                  {Object.entries(accuracy.byState || {}).map(([state, data]) => (
                    <div key={state} className="flex items-center gap-3">
                      <span className="text-xs text-zinc-500 w-20">{state}</span>
                      <div className="flex-1 h-2 bg-zinc-800 rounded-full overflow-hidden"><div className={'h-full rounded-full ' + (data.accuracy >= 65 ? 'bg-emerald-500' : data.accuracy >= 50 ? 'bg-yellow-500' : 'bg-red-500')} style={{ width: data.accuracy + '%' }} /></div>
                      <span className={'text-xs font-medium w-12 text-right ' + (data.accuracy >= 65 ? 'text-emerald-400' : data.accuracy >= 50 ? 'text-yellow-400' : 'text-red-400')}>{data.accuracy}%</span>
                      <span className="text-xs text-zinc-600 w-16 text-right">{data.wins}/{data.total}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="mt-4 flex gap-4">
              <div className="px-4 py-2 rounded-lg bg-black/30"><span className="text-xs text-zinc-500">Current Streak</span><div className="text-lg font-bold text-emerald-400">{accuracy.currentStreak > 0 ? '🔥 ' + accuracy.currentStreak : '—'}</div></div>
              <div className="px-4 py-2 rounded-lg bg-black/30"><span className="text-xs text-zinc-500">Best Streak</span><div className="text-lg font-bold text-yellow-400">{accuracy.bestStreak > 0 ? '🏆 ' + accuracy.bestStreak : '—'}</div></div>
              <div className="px-4 py-2 rounded-lg bg-black/30 flex-1"><span className="text-xs text-zinc-500">Progress to 65% Target</span><div className="flex items-center gap-2 mt-1"><div className="flex-1 h-2 bg-zinc-800 rounded-full overflow-hidden"><div className={'h-full rounded-full ' + (accuracy.progressToTarget >= 100 ? 'bg-emerald-500' : accuracy.progressToTarget >= 75 ? 'bg-blue-500' : 'bg-yellow-500')} style={{ width: Math.min(100, accuracy.progressToTarget) + '%' }} /></div><span className="text-sm font-medium text-zinc-300">{accuracy.progressToTarget}%</span></div></div>
            </div>
          </div>
        )}

        {/* ── Signal Engine (RLM + SYGNL.iq unified) ── */}
        {(rlmSignals.length > 0 || sygnliqSignals.length > 0) && (
          <div id="signal-engine-section" className="mb-6 p-4 rounded-xl bg-gradient-to-br from-purple-500/10 to-blue-500/10 border border-purple-500/20">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Brain className="w-5 h-5 text-purple-400" />
                Signal Engine
                <span className="text-xs text-zinc-500 font-normal">RLM v{rlmStatus.version}</span>
              </h3>
              <div className="flex items-center gap-3">
                <span className="text-xs text-zinc-500">Budget: ${N(rlmBudget.spent_today).toFixed(2)}/${N(rlmBudget.total_budget).toFixed(2)}</span>
                <span className={'w-2 h-2 rounded-full ' + (rlmStatus.status === 'operational' ? 'bg-emerald-500' : 'bg-red-500')} />
              </div>
            </div>

            {/* RLM Fast Signals */}
            {rlmSignals.length > 0 && (
              <div className="mb-4">
                <h4 className="text-sm font-medium text-zinc-400 mb-3 flex items-center gap-2"><Zap className="w-4 h-4 text-purple-400" />RLM Fast Signals</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {rlmSignals.slice(0, 6).map((s, i) => (
                    <div key={i} className={`p-3 rounded-lg border ${s.signal === 'STRONG_BUY' ? 'bg-emerald-500/10 border-emerald-500/30' : s.signal === 'BUY' ? 'bg-emerald-500/5 border-emerald-500/20' : s.signal === 'STRONG_SELL' ? 'bg-red-500/10 border-red-500/30' : s.signal === 'SELL' ? 'bg-red-500/5 border-red-500/20' : 'bg-zinc-800/50 border-zinc-700'}`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-lg">{s.symbol}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-lg ${s.signal?.includes('BUY') ? 'bg-emerald-500/30 text-emerald-400' : s.signal?.includes('SELL') ? 'bg-red-500/30 text-red-400' : 'bg-zinc-700/50 text-zinc-400'}`}>{s.signal}</span>
                      </div>
                      <div className="flex items-center justify-between mb-1 text-xs">
                        <span className="text-zinc-400">Confidence: {s.confidence}%</span>
                        <span className="text-zinc-500">Tier: {s.tier || 'FAST'}</span>
                      </div>
                      <div className="text-xs text-zinc-500 flex items-center justify-between">
                        <span>Latency: {s.latency_ms}ms</span>
                        <span>{s.reasoning || 'Fast signal'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* SYGNL.iq Recommendations */}
            {sygnliqSignals.length > 0 && (
              <>
                {sygnliqSignals.length > 0 && rlmSignals.length > 0 && <div className="border-t border-white/5 my-4" />}
                <h4 className="text-sm font-medium text-zinc-400 mb-3 flex items-center gap-2"><BarChart3 className="w-4 h-4 text-blue-400" />SYGNL.iq Recommendations</h4>

                {/* Top 3 quick-execute cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                  {sygnliqSignals.slice(0, 3).map((s, i) => (
                    <div key={i} onClick={() => handleSygnliqExecute(s, s.strength === 'WEAK')} className={'p-3 rounded-lg cursor-pointer transition-all hover:scale-105 ' + (s.strength === 'STRONG' ? 'bg-emerald-500/10 border border-emerald-500/30' : s.strength === 'MEDIUM' ? 'bg-blue-500/10 border border-blue-500/30' : 'bg-yellow-500/10 border border-yellow-500/30')}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2"><span className="font-bold">{s.symbol}</span><span className={'text-xs px-2 py-0.5 rounded ' + (s.strength === 'STRONG' ? 'bg-emerald-500/30 text-emerald-400' : s.strength === 'MEDIUM' ? 'bg-blue-500/30 text-blue-400' : 'bg-yellow-500/30 text-yellow-400')}>{s.strength}</span></div>
                        <span className="text-sm font-medium">{s.confidence}%</span>
                      </div>
                      <p className="text-xs text-zinc-400 mt-1 line-clamp-2">{s.reasoning}</p>
                      <div className="flex items-center justify-between mt-2"><span className="text-xs text-zinc-500">{s.action}</span><span className="text-xs text-emerald-400">{s.suggestedSize ? '$' + N(s.suggestedSize).toLocaleString() : ''}</span></div>
                    </div>
                  ))}
                </div>

                {/* Full signal list */}
                <div className="space-y-2">
                  {sygnliqSignals.map((s, i) => {
                    const color = getSignalColor(s.strength)
                    return (
                      <div key={i} className={'flex items-start gap-3 p-3 rounded-lg border ' + (s.strength === 'STRONG' ? 'bg-emerald-500/5 border-emerald-500/20' : s.strength === 'MEDIUM' ? 'bg-blue-500/5 border-blue-500/20' : 'bg-yellow-500/5 border-yellow-500/20')}>
                        <div className={'w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm flex-shrink-0 ' + (s.action === 'BUY' || s.action === 'ADD' ? 'bg-' + color + '-500/20 text-' + color + '-400' : s.action === 'SELL' ? 'bg-red-500/20 text-red-400' : 'bg-yellow-500/20 text-yellow-400')}>{s.symbol?.slice(0, 2)}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold">{s.symbol}</span>
                            <span className={'text-sm px-2 py-0.5 rounded ' + (s.action === 'BUY' ? 'bg-emerald-500/20 text-emerald-400' : s.action === 'ADD' ? 'bg-blue-500/20 text-blue-400' : s.action === 'SELL' ? 'bg-red-500/20 text-red-400' : 'bg-yellow-500/20 text-yellow-400')}>{s.action}</span>
                            <span className={'text-xs px-2 py-0.5 rounded ' + (s.strength === 'STRONG' ? 'bg-emerald-500/20 text-emerald-400' : s.strength === 'MEDIUM' ? 'bg-blue-500/20 text-blue-400' : 'bg-yellow-500/20 text-yellow-400')}>{s.strength}</span>
                            <span className="text-xs text-zinc-500">{s.confidence}% confidence</span>
                            {s.experimental && <span className="text-xs text-amber-400">Experimental</span>}
                          </div>
                          <p className="text-sm text-zinc-400 mt-1">{s.reasoning}</p>
                          {s.suggestedSize && <div className="mt-2 text-sm text-emerald-400">Suggested: {formatCurrency(s.suggestedSize)}</div>}
                        </div>
                        <div className="flex flex-col gap-2">
                          {s.strength === 'STRONG' && autoExecuteEnabled ? (
                            <div className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 text-xs"><CheckCircle className="w-3 h-3" />Auto-Execute</div>
                          ) : (
                            <button onClick={() => handleSygnliqExecute(s, s.strength === 'WEAK')} disabled={isExecuting} className={'px-3 py-1.5 rounded-lg text-sm hover:opacity-80 disabled:opacity-50 ' + (s.strength === 'STRONG' ? 'bg-emerald-500/20 text-emerald-400' : s.strength === 'MEDIUM' ? 'bg-blue-500/20 text-blue-400' : 'bg-yellow-500/20 text-yellow-400')}>{isExecuting ? '...' : s.strength === 'WEAK' ? 'Test Signal' : 'Execute'}</button>
                          )}
                          {s.strength === 'WEAK' && <span className="text-xs text-center text-amber-400/70">Training data</span>}
                        </div>
                      </div>
                    )
                  })}
                </div>

                {sygnliqStats.weakExperimentsCount > 0 && (
                  <div className="mt-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                    <div className="flex items-center gap-2 text-sm"><BarChart3 className="w-4 h-4 text-amber-400" /><span className="text-amber-400">Weak Signal Experiments:</span><span className="text-zinc-300">{sygnliqStats.weakExperimentsCount} trades</span><span className="text-emerald-400">{sygnliqStats.weakSuccessRate}% success</span><span className="text-xs text-zinc-500 ml-auto">Helps train algorithm</span></div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ── Portfolio Performance Graph ── */}
        {graphData.length > 0 && (
          <div id="performance-section" className="mb-6 p-4 rounded-xl bg-white/5 border border-white/10">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2"><TrendingUpIcon className="w-5 h-5 text-emerald-400" />Portfolio Performance</h3>
              <div className="flex gap-1">
                {['day', 'week', 'month'].map(tf => (
                  <button key={tf} onClick={() => setGraphTimeframe(tf)} className={'px-3 py-1 rounded-lg text-sm capitalize transition-colors ' + (graphTimeframe === tf ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/5 text-zinc-400 hover:bg-white/10')}>{tf}</button>
                ))}
              </div>
            </div>
            <div className="h-48 flex items-end gap-4 px-4">
              {graphData.map((point, i) => {
                const maxVal = Math.max(...graphData.map(d => d.value))
                const minVal = Math.min(...graphData.map(d => d.value))
                const padding = (maxVal - minVal) * 0.1 || maxVal * 0.1
                const range = (maxVal + padding) - (minVal - padding) || 1
                const height = Math.max(((point.value - (minVal - padding)) / range) * 100, 15)
                const isUp = point.change >= 0
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-2 min-w-[60px]">
                    <div className="text-xs text-zinc-400 mb-1">${(N(point.value) / 1000).toFixed(0)}k</div>
                    <div className={'w-full min-w-[40px] max-w-[80px] rounded-t transition-all duration-500 ' + (isUp ? 'bg-emerald-500/70' : 'bg-red-500/70')} style={{ height: height + '%' }} />
                    <span className="text-xs text-zinc-500 font-medium">{point.date}</span>
                    <span className={'text-xs font-bold ' + (isUp ? 'text-emerald-400' : 'text-red-400')}>{isUp ? '+' : ''}{N(point.change).toFixed(1)}%</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ── Live Holdings ── */}
        <div id="holdings-section" className="mb-6 p-4 rounded-xl bg-white/5 border border-white/10">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold flex items-center gap-2"><PieChart className="w-5 h-5 text-emerald-400" />Live Holdings</h3>
            <div className="flex gap-2">
              {['all', 'stocks', 'etfs', 'crypto'].map(filter => (
                <button key={filter} onClick={() => setHoldingsFilter(filter)} className={'px-3 py-1.5 rounded-lg text-sm capitalize transition-colors ' + (holdingsFilter === filter ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-white/5 text-zinc-400 hover:bg-white/10')}>{filter}</button>
              ))}
              <button onClick={() => { setTradeMode('live'); setShowBuyModal(true) }} className="px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 text-sm flex items-center gap-1 hover:bg-emerald-500/30"><Plus className="w-4 h-4" /> Buy</button>
            </div>
          </div>
          <div className="space-y-2">
            {filteredHoldings.map((h, i) => (
              <div key={i} className="p-3 rounded-lg bg-black/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={'w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm ' + (h.type === 'Crypto' ? 'bg-gradient-to-br from-orange-500/20 to-yellow-600/20 text-orange-400' : 'bg-gradient-to-br from-emerald-500/20 to-teal-600/20 text-emerald-400')}>{h.symbol.slice(0, 2)}</div>
                    <div>
                      <div className="font-medium">{h.symbol}</div>
                      <div className="text-xs text-zinc-500">{COMPANY_NAMES[h.symbol] || h.name}{h.wallet && <span className="text-zinc-600"> ({h.wallet})</span>}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right"><div className="font-medium">{formatCurrency(h.current_value || 0)}</div><div className="text-xs text-zinc-500">{N(h.quantity).toLocaleString()} units</div></div>
                    <div className="text-right min-w-[80px]"><div className={(h.day_change || 0) >= 0 ? 'text-sm font-medium text-emerald-400' : 'text-sm font-medium text-red-400'}>{N(h.day_change) >= 0 ? '+' : ''}{formatCurrency(N(h.day_change))}</div><div className={N(h.day_change_pct) >= 0 ? 'text-xs text-emerald-500' : 'text-xs text-red-500'}>{N(h.day_change_pct) >= 0 ? '+' : ''}{N(h.day_change_pct).toFixed(2)}%</div></div>
                    <div className="text-right min-w-[60px]"><div className="text-sm text-zinc-300">${N(h.current_price).toLocaleString()}</div></div>
                    <button onClick={() => { setTradeMode('live'); setSelectedAsset(h); setShowSellModal(true) }} className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20"><Minus className="w-4 h-4" /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-white/10 grid grid-cols-3 gap-4">
            <div className="text-center"><div className="text-xs text-zinc-500 mb-1">Stocks</div><div className="font-bold">{formatCurrency(totalsByType.stocks.value)}</div><div className={totalsByType.stocks.dayChange >= 0 ? 'text-xs text-emerald-400' : 'text-xs text-red-400'}>{totalsByType.stocks.dayChange >= 0 ? '+' : ''}{formatCurrency(totalsByType.stocks.dayChange)}</div></div>
            <div className="text-center"><div className="text-xs text-zinc-500 mb-1">ETFs</div><div className="font-bold">{formatCurrency(totalsByType.etfs.value)}</div><div className={totalsByType.etfs.dayChange >= 0 ? 'text-xs text-emerald-400' : 'text-xs text-red-400'}>{totalsByType.etfs.dayChange >= 0 ? '+' : ''}{formatCurrency(totalsByType.etfs.dayChange)}</div></div>
            <div className="text-center"><div className="text-xs text-zinc-500 mb-1">Crypto</div><div className="font-bold">{formatCurrency(totalsByType.crypto.value)}</div><div className={totalsByType.crypto.dayChange >= 0 ? 'text-xs text-emerald-400' : 'text-xs text-red-400'}>{totalsByType.crypto.dayChange >= 0 ? '+' : ''}{formatCurrency(totalsByType.crypto.dayChange)}</div></div>
          </div>
        </div>

        {/* ── Paper Trading ── */}
        <div id="paper-section" className="mb-6 p-4 rounded-xl bg-white/5 border border-white/10">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold flex items-center gap-2"><Target className="w-5 h-5 text-purple-400" />Paper Trading</h3>
            <div className="flex items-center gap-3">
              <div className="text-right"><div className="text-xs text-zinc-500">Buying Power</div><div className="text-sm font-medium text-zinc-300">{formatCurrency(paperSummary.buyingPower)}</div></div>
              <span className={'px-3 py-1 rounded-lg text-sm ' + (paperSummary.totalPL >= 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400')}>{paperSummary.totalPL >= 0 ? '+' : ''}{paperSummary.totalPLPct.toFixed(2)}% P&L</span>
              <button onClick={() => { setTradeMode('paper'); setShowBuyModal(true) }} className="px-3 py-1.5 rounded-lg bg-purple-500/20 text-purple-400 text-sm flex items-center gap-1 hover:bg-purple-500/30"><Plus className="w-4 h-4" /> Paper Buy</button>
            </div>
          </div>
          <div className="space-y-2">
            {paperPositions.length > 0 ? paperPositions.map((pos, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-purple-500/5 border border-purple-500/10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center font-bold text-sm text-purple-400">{pos.symbol?.slice(0, 2)}</div>
                  <div><div className="font-medium">{pos.symbol}</div><div className="text-xs text-zinc-500">{Number(pos.quantity || pos.qty || 0).toFixed(2)} shares @ ${Number(pos.entry_price || pos.avg_entry_price || 0).toFixed(2)}</div></div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right"><div className="font-medium">${Number(pos.current_value || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}</div><div className="text-xs text-zinc-500">Current</div></div>
                  <div className="text-right min-w-[70px]"><div className={Number(pos.unrealized_pl || 0) >= 0 ? 'text-sm font-medium text-emerald-400' : 'text-sm font-medium text-red-400'}>{Number(pos.unrealized_pl || 0) >= 0 ? '+' : ''}{formatCurrency(Number(pos.unrealized_pl || 0))}</div><div className={(pos.unrealized_pl_pct || 0) >= 0 ? 'text-xs text-emerald-500' : 'text-xs text-red-500'}>{Number(pos.unrealized_pl_pct || 0) >= 0 ? '+' : ''}{Number(pos.unrealized_pl_pct || 0).toFixed(2)}%</div></div>
                  <button onClick={() => { setTradeMode('paper'); setSelectedAsset(pos); setShowSellModal(true) }} className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20"><Minus className="w-4 h-4" /></button>
                </div>
              </div>
            )) : <div className="p-4 text-center text-zinc-500">No paper positions. Use Signal Engine or manual trades.</div>}
          </div>
        </div>

        {/* ── Options & Short Trading ── */}
        <div id="options-short-section" className="mb-6 p-4 rounded-xl bg-gradient-to-br from-orange-500/10 to-red-500/10 border border-orange-500/20">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Target className="w-5 h-5 text-orange-400" />Options & Short Trading
              <span className="text-xs text-zinc-500 font-normal">Paper Mode</span>
            </h3>
            <div className="flex items-center gap-3">
              <span className="text-xs text-zinc-500">{optionsPositions.length + shortPositions.length} active</span>
              <span className="px-2 py-1 rounded text-xs bg-orange-500/20 text-orange-400">● Beta</span>
            </div>
          </div>
          
          {/* Options Positions */}
          <div className="mb-4">
            <div className="text-xs text-zinc-500 mb-2 uppercase tracking-wider">Options Positions</div>
            {optionsPositions.length > 0 ? (
              <div className="space-y-2">
                {optionsPositions.map((pos, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-orange-500/5 border border-orange-500/10">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center font-bold text-sm text-orange-400">{pos.symbol?.slice(0, 2)}</div>
                      <div>
                        <div className="font-medium">{pos.symbol} <span className={`text-xs px-1.5 py-0.5 rounded ${pos.direction?.includes('CALL') ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>{pos.direction}</span></div>
                        <div className="text-xs text-zinc-500">${N(pos.strike).toFixed(0)} strike · {pos.expiry || 'N/A'} · {pos.strategy}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-sm font-medium">${N(pos.premium).toFixed(2)} premium</div>
                        <div className={N(pos.pnl) >= 0 ? 'text-xs text-emerald-400' : 'text-xs text-red-400'}>{N(pos.pnl) >= 0 ? '+' : ''}{N(pos.pnl).toFixed(2)}%</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-3 text-center text-zinc-600 text-sm">No active options positions</div>
            )}
          </div>
          
          {/* Short Positions */}
          <div>
            <div className="text-xs text-zinc-500 mb-2 uppercase tracking-wider">Short Positions</div>
            {shortPositions.length > 0 ? (
              <div className="space-y-2">
                {shortPositions.map((pos, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-red-500/5 border border-red-500/10">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center font-bold text-sm text-red-400">{pos.symbol?.slice(0, 2)}</div>
                      <div>
                        <div className="font-medium">{pos.symbol} <span className="text-xs px-1.5 py-0.5 rounded bg-red-500/20 text-red-400">SHORT</span></div>
                        <div className="text-xs text-zinc-500">{N(pos.quantity).toFixed(0)} shares @ ${N(pos.entry_price).toFixed(2)} · {pos.strategy}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="font-medium">${N(pos.current_price).toFixed(2)}</div>
                        <div className="text-xs text-zinc-500">Current</div>
                      </div>
                      <div className="text-right min-w-[70px]">
                        <div className={N(pos.pnl) >= 0 ? 'text-sm font-medium text-emerald-400' : 'text-sm font-medium text-red-400'}>{N(pos.pnl) >= 0 ? '+' : ''}{formatCurrency(N(pos.pnl))}</div>
                        <div className={N(pos.pnl_pct) >= 0 ? 'text-xs text-emerald-500' : 'text-xs text-red-500'}>{N(pos.pnl_pct) >= 0 ? '+' : ''}{N(pos.pnl_pct).toFixed(2)}%</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-3 text-center text-zinc-600 text-sm">No active short positions</div>
            )}
          </div>
          
          {/* Strategy Summary */}
          <div className="mt-4 pt-4 border-t border-orange-500/10 grid grid-cols-4 gap-3">
            <div className="p-3 rounded-lg bg-black/30 text-center">
              <div className="text-xs text-zinc-500 mb-1">Strangles</div>
              <div className="text-sm font-medium text-orange-400">—</div>
            </div>
            <div className="p-3 rounded-lg bg-black/30 text-center">
              <div className="text-xs text-zinc-500 mb-1">Iron Condors</div>
              <div className="text-sm font-medium text-orange-400">—</div>
            </div>
            <div className="p-3 rounded-lg bg-black/30 text-center">
              <div className="text-xs text-zinc-500 mb-1">Mean Rev Shorts</div>
              <div className="text-sm font-medium text-red-400">—</div>
            </div>
            <div className="p-3 rounded-lg bg-black/30 text-center">
              <div className="text-xs text-zinc-500 mb-1">VIX Hedge</div>
              <div className="text-sm font-medium text-yellow-400">—</div>
            </div>
          </div>
        </div>

        {/* ── Trade Log ── */}
        <div id="trade-log-section" className="mb-6 p-4 rounded-xl bg-gradient-to-br from-zinc-800/50 to-zinc-900/50 border border-white/10">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold flex items-center gap-2"><BarChart3 className="w-5 h-5 text-emerald-400" />Trade Log</h3>
            <span className="text-xs text-zinc-500">Last 24 hours</span>
          </div>
          {tradeLog.length > 0 ? (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {tradeLog.slice(0, 10).map((trade, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-black/30">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${trade.status === 'REJECTED' ? 'bg-red-500/20 text-red-400' : trade.source === 'auto' ? 'bg-emerald-500/20 text-emerald-400' : trade.strength === 'WEAK' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-blue-500/20 text-blue-400'}`}>{trade.symbol?.slice(0, 2)}</div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{trade.symbol}</span>
                        <span className={`text-xs px-2 py-0.5 rounded ${trade.action === 'BUY' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>{trade.action}</span>
                        {trade.source === 'auto' && <span className="text-xs text-emerald-400">auto</span>}
                        {trade.strength === 'WEAK' && <span className="text-xs text-yellow-400">experimental</span>}
                        {trade.status === 'REJECTED' && <span className="text-xs text-red-400">rejected</span>}
                      </div>
                      <div className="text-xs text-zinc-500">
                        {new Date(trade.timestamp).toLocaleTimeString()}
                        {trade.status === 'REJECTED' && trade.reason ? (
                          <span className="text-red-400 ml-1">• {trade.reason.substring(0, 50)}...</span>
                        ) : (
                          <span> • {trade.quantity} @ ${trade.price}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">{trade.status === 'REJECTED' ? '—' : formatCurrency(trade.value)}</div>
                    <div className="text-xs text-zinc-500">{trade.source === 'auto' ? (trade.status === 'REJECTED' ? 'Auto-rejected' : 'Auto-executed') : 'Manual'}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 text-center text-zinc-500 text-sm">No trades yet. Enable auto-execute or manually trade signals.</div>
          )}
        </div>

        {/* ── Intelligence Hub ── */}
        {intelligence.all?.length > 0 && (
          <div id="intelligence-section" className="mb-6 p-4 rounded-xl bg-white/5 border border-white/10">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2"><Newspaper className="w-5 h-5 text-blue-400" />Intelligence Hub{newIntelCount > 0 && <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full animate-pulse">{newIntelCount} new</span>}</h3>
            </div>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {intelligence.all.slice(0, 10).map((item, i) => {
                const isNew = !readIntelIds.has(item.id || item.title)
                const isExpanded = expandedIntel === (item.id || item.title)
                return (
                  <div key={i} className={'rounded-lg border transition-all ' + (isNew ? 'bg-blue-500/10 border-blue-500/30' : 'bg-white/5 border-white/10') + ' ' + (isExpanded ? 'p-4' : 'p-3')}>
                    <div className="flex items-center gap-2 cursor-pointer" onClick={() => { markIntelAsRead(item.id || item.title); setExpandedIntel(isExpanded ? null : (item.id || item.title)) }}>
                      {isNew && <span className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />}
                      <span className="font-medium text-sm flex-1">{item.title}</span>
                      {item.priority === 'high' && <span className="text-xs text-red-400">● High Priority</span>}
                      {isNew && <span className="text-xs text-blue-400">NEW</span>}
                      {isExpanded ? <ChevronUp className="w-4 h-4 text-zinc-500" /> : <ChevronDown className="w-4 h-4 text-zinc-500" />}
                    </div>
                    <p className={'text-sm text-zinc-400 mt-2 ' + (isExpanded ? '' : 'line-clamp-1')}>{item.summary}</p>
                    {isExpanded && (
                      <div className="mt-3 pt-3 border-t border-white/10 space-y-2">
                        <div className="flex items-center gap-4 text-xs text-zinc-500"><span>Source: {item.source || 'Market Intelligence'}</span><span>Category: {item.category || 'General'}</span><span>Priority: {item.priority || 'Normal'}</span></div>
                        {item.details && <p className="text-sm text-zinc-400">{item.details}</p>}
                        {item.actionItems?.length > 0 && (
                          <div className="mt-2"><span className="text-xs text-zinc-500">Action Items:</span><ul className="mt-1 space-y-1">{item.actionItems.map((action, aidx) => (<li key={aidx} className="text-sm text-zinc-300 flex items-center gap-2"><CheckCircle className="w-3 h-3 text-emerald-400" />{action}</li>))}</ul></div>
                        )}
                        <div className="flex gap-2 mt-3">
                          <button className="px-3 py-1 rounded bg-blue-500/20 text-blue-400 text-xs hover:bg-blue-500/30">Create Signal</button>
                          <button className="px-3 py-1 rounded bg-white/10 text-zinc-400 text-xs hover:bg-white/20">Dismiss</button>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

      </main>

      {/* ── Buy Modal ── */}
      {showBuyModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-white/10 rounded-2xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Buy Asset</h3>
              <button onClick={() => { setShowBuyModal(false); setExecutionError(''); setExecutionSuccess(''); setTradeSymbol('') }}><X className="w-5 h-5 text-zinc-400" /></button>
            </div>
            <div className="flex gap-2 mb-4 p-1 bg-black/30 rounded-lg">
              <button onClick={() => setTradeMode('live')} className={'flex-1 py-2 rounded text-sm font-medium transition-colors ' + (tradeMode === 'live' ? 'bg-red-500/20 text-red-400' : 'text-zinc-500 hover:text-zinc-300')}>Live Trading</button>
              <button onClick={() => setTradeMode('paper')} className={'flex-1 py-2 rounded text-sm font-medium transition-colors ' + (tradeMode === 'paper' ? 'bg-purple-500/20 text-purple-400' : 'text-zinc-500 hover:text-zinc-300')}>Paper Trading</button>
            </div>
            <div className="mb-4 p-3 rounded-lg bg-white/5">
              <div className="text-xs text-zinc-500">Available Buying Power ({tradeMode})</div>
              <div className="text-lg font-bold text-zinc-300">{formatCurrency(tradeMode === 'paper' ? paperSummary.buyingPower : 50000)}</div>
            </div>
            <div className="space-y-4">
              <div><label className="block text-sm text-zinc-400 mb-1">Symbol</label><input type="text" value={tradeSymbol} onChange={(e) => setTradeSymbol(e.target.value.toUpperCase())} placeholder="e.g. AAPL, NVDA, BTC" className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-white uppercase" /></div>
              <div><label className="block text-sm text-zinc-400 mb-1">Quantity</label><input type="number" step="any" value={tradeQuantity} onChange={(e) => setTradeQuantity(e.target.value)} placeholder="Number of shares" className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-white" /></div>
              <div><label className="block text-sm text-zinc-400 mb-1">Price per Share</label><input type="number" step="any" value={tradePrice} onChange={(e) => setTradePrice(e.target.value)} placeholder="Enter price" className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-white" /></div>
              {tradeQuantity && tradePrice && <div className="p-3 rounded-lg bg-white/5"><div className="flex justify-between text-sm"><span className="text-zinc-500">Total Cost:</span><span className="font-medium">{formatCurrency(parseFloat(tradeQuantity) * parseFloat(tradePrice))}</span></div></div>}
              {executionError && <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{executionError}</div>}
              {executionSuccess && <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm">{executionSuccess}</div>}
              <button onClick={() => handleTrade('BUY')} disabled={isExecuting || !tradeSymbol || !tradeQuantity || !tradePrice} className={'w-full py-3 rounded-lg font-medium disabled:opacity-50 ' + (tradeMode === 'live' ? 'bg-red-500/20 hover:bg-red-500/30 text-red-400' : 'bg-purple-500/20 hover:bg-purple-500/30 text-purple-400')}>{isExecuting ? 'Processing...' : 'Confirm Buy (' + tradeMode + ')'}</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Sell Modal ── */}
      {showSellModal && selectedAsset && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-white/10 rounded-2xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Sell {selectedAsset.symbol}</h3>
              <button onClick={() => { setShowSellModal(false); setExecutionError(''); setExecutionSuccess('') }}><X className="w-5 h-5 text-zinc-400" /></button>
            </div>
            <div className="flex gap-2 mb-4 p-1 bg-black/30 rounded-lg">
              <button onClick={() => setTradeMode('live')} className={'flex-1 py-2 rounded text-sm font-medium transition-colors ' + (tradeMode === 'live' ? 'bg-red-500/20 text-red-400' : 'text-zinc-500 hover:text-zinc-300')}>Live Trading</button>
              <button onClick={() => setTradeMode('paper')} className={'flex-1 py-2 rounded text-sm font-medium transition-colors ' + (tradeMode === 'paper' ? 'bg-purple-500/20 text-purple-400' : 'text-zinc-500 hover:text-zinc-300')}>Paper Trading</button>
            </div>
            <div className="space-y-4">
              <div className="p-3 rounded-lg bg-white/5">
                <div className="text-sm text-zinc-400">Current Position ({tradeMode})</div>
                <div className="text-lg font-bold">{N(selectedAsset.quantity || selectedAsset.qty).toLocaleString()} shares</div>
                <div className="text-sm text-zinc-500">@ ${N(selectedAsset.current_price || selectedAsset.lastprice).toLocaleString()}</div>
                <div className="text-sm text-emerald-400 mt-1">Value: {formatCurrency(selectedAsset.current_value || (selectedAsset.quantity || selectedAsset.qty) * (selectedAsset.current_price || selectedAsset.lastprice))}</div>
              </div>
              <div><label className="block text-sm text-zinc-400 mb-1">Quantity to Sell</label><input type="number" step="any" value={tradeQuantity} onChange={(e) => setTradeQuantity(e.target.value)} placeholder={'Max: ' + (selectedAsset.quantity || selectedAsset.qty)} max={selectedAsset.quantity || selectedAsset.qty} className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-white" /></div>
              <div><label className="block text-sm text-zinc-400 mb-1">Price per Share</label><input type="number" step="any" value={tradePrice || (selectedAsset.current_price || selectedAsset.lastprice)} onChange={(e) => setTradePrice(e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-white" /></div>
              {executionError && <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{executionError}</div>}
              {executionSuccess && <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm">{executionSuccess}</div>}
              <button onClick={() => handleTrade('SELL')} disabled={isExecuting || !tradeQuantity} className={'w-full py-3 rounded-lg font-medium disabled:opacity-50 ' + (tradeMode === 'live' ? 'bg-red-500/20 hover:bg-red-500/30 text-red-400' : 'bg-purple-500/20 hover:bg-purple-500/30 text-purple-400')}>{isExecuting ? 'Processing...' : 'Confirm Sell (' + tradeMode + ')'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
