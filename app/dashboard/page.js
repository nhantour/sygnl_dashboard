// SYGNL Dashboard v2.0
'use client'

import { useState, useEffect } from 'react'
import { TrendingUp, Activity, DollarSign, Users, Target, Wallet, LogOut, RefreshCw, Zap, PieChart, AlertTriangle, CheckCircle, TrendingUp as TrendingUpIcon, Newspaper, Plus, Minus, X, ChevronDown, ChevronUp, Brain, Play, Pause, BarChart3 } from 'lucide-react'
import holdingsData from '../../data/holdings.json'
import intelligenceData from '../../data/intelligence.json'
import performanceData from '../../data/performance_history.json'

const API_BASE = process.env.NEXT_PUBLIC_SYGNL_API_URL || 'http://148.113.174.184:8000'

const COMPANY_NAMES = {
  'PLTR': 'Palantir', 'TSLA': 'Tesla', 'NVDA': 'NVIDIA', 'MSTR': 'MicroStrategy',
  'VOO': 'S&P 500 ETF', 'BTC': 'Bitcoin', 'ETH': 'Ethereum', 'AAPL': 'Apple',
  'MSFT': 'Microsoft', 'AMD': 'AMD', 'META': 'Meta', 'GOOGL': 'Google'
}

export default function Dashboard() {
  const [holdings] = useState(holdingsData)
  const [intelligence, setIntelligence] = useState(intelligenceData)
  const [paperPositions, setPaperPositions] = useState([])
  const [paperSummary, setPaperSummary] = useState({ totalValue: 6000, totalInvested: 0, totalPL: 0, totalPLPct: 0, buyingPower: 6000 })
  const [tokenUsage, setTokenUsage] = useState({ total_cost_usd: 0, limit_used_pct: 0, limit_status: 'ok', ai_models: [] })
  const [accuracy, setAccuracy] = useState({ overall: 0, totalSignals: 0, wins: 0, losses: 0, targetAccuracy: 65, progressToTarget: 0, byConfidence: {}, byState: {}, currentStreak: 0, bestStreak: 0 })
  const [sygnliqSignals, setSygnliqSignals] = useState([])
  const [sygnliqStats, setSygnliqStats] = useState({ total: 0, strong: 0, medium: 0, weak: 0, weakExperimentsCount: 0, weakSuccessRate: 0 })
  const [autoExecuteEnabled, setAutoExecuteEnabled] = useState(true)
  const [lastUpdated, setLastUpdated] = useState(new Date())
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
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setReadIntelIds(new Set(JSON.parse(localStorage.getItem('sygnl_read_intel') || '[]')))
    }
  }, [])
  
  useEffect(() => {
    async function fetchData() {
      try {
        const [paperRes, tokenRes, intelRes, accuracyRes, signalsRes] = await Promise.all([
          fetch('/api/paper-trading').catch(() => null),
          fetch('/api/token-usage').catch(() => null),
          fetch(API_BASE + '/public/intelligence').catch(() => null),
          fetch('/api/accuracy').catch(() => null),
          fetch('/api/execute-signal').catch(() => null)
        ])
        
        if (paperRes?.ok) {
          const data = await paperRes.json()
          setPaperPositions(data.positions || [])
          setPaperSummary({
            totalValue: data.total_value || 0, totalInvested: data.total_invested || 0,
            totalPL: data.total_pl || 0, totalPLPct: data.total_pl_pct || 0,
            buyingPower: data.buyingPower || 6000
          })
        }
        if (tokenRes?.ok) {
          const data = await tokenRes.json()
          setTokenUsage({ total_cost_usd: data.total_cost_usd || 0, limit_used_pct: data.limit_used_pct || 0, limit_status: data.limit_status || 'ok', ai_models: data.ai_models || [] })
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
      if (typeof window !== 'undefined') {
        localStorage.setItem('sygnl_read_intel', JSON.stringify([...newSet]))
      }
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
  
  const fetchLivePrice = async (symbol) => {
    const prices = { 'NVDA': 173.25, 'AAPL': 278.45, 'MSFT': 592.15, 'AMD': 134.85, 'TSLA': 397.21, 'PLTR': 130.01, 'BTC': 63444, 'ETH': 3450, 'META': 735.20, 'GOOGL': 192.45 }
    return prices[symbol] || 100
  }
  
  const handleSygnliqExecute = async (signal, isWeak = false) => {
    if (!signal || isExecuting) return
    setIsExecuting(true); setExecutionError(''); setExecutionSuccess('')
    try {
      const price = await fetchLivePrice(signal.symbol)
      const quantity = Math.floor((signal.suggestedSize || 5000) / price)
      const res = await fetch('/api/execute-signal', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ symbol: signal.symbol, action: signal.action, confidence: signal.confidence, marketState: signal.marketState, mode: 'paper', quantity, price, signalId: signal.id, isWeakSignalExperiment: isWeak }) })
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
  
  const getGraphData = () => {
    if (performanceData?.history?.length > 0) return performanceData.history.slice(-20).map(h => ({ date: new Date(h.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), value: h.total_value || h.value }))
    if (graphTimeframe === 'day') return [{ date: '9:30', value: 172000 }, { date: '10:30', value: 171500 }, { date: '11:30', value: 171000 }, { date: '12:30', value: 170800 }, { date: '1:30', value: 170600 }, { date: '2:30', value: 170542 }]
    if (graphTimeframe === 'week') return [{ date: 'Mon', value: 175000 }, { date: 'Tue', value: 173500 }, { date: 'Wed', value: 172000 }, { date: 'Thu', value: 171200 }, { date: 'Fri', value: 170542 }]
    return [{ date: 'Jan 1', value: 165000 }, { date: 'Jan 10', value: 168000 }, { date: 'Jan 20', value: 172000 }, { date: 'Feb 1', value: 171500 }, { date: 'Feb 6', value: 170542 }]
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
            <div className="relative">
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
                        <div key={idx} onClick={() => { clearAlert(alert.id); if (alert.type === 'intel') setExpandedIntel(alert.id); }} className="p-3 border-b border-white/5 hover:bg-white/5 cursor-pointer transition-colors">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2"><span className={'w-2 h-2 rounded-full ' + (alert.priority === 'high' ? 'bg-red-500' : 'bg-yellow-500')} /><span className="text-sm font-medium">{alert.title}</span></div>
                              <p className="text-xs text-zinc-500 mt-1 line-clamp-2">{alert.message}</p>
                            </div>
                            <button onClick={(e) => { e.stopPropagation(); clearAlert(alert.id); }} className="p-1 hover:bg-white/10 rounded"><X className="w-3 h-3 text-zinc-500" /></button>
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
            <a href="/" className="p-2 rounded-xl bg-white/5 hover:bg-red-500/10"><LogOut className="w-5 h-5 text-zinc-400" /></a>
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-[1600px] mx-auto px-6 py-6">
        <div className="flex justify-center mb-6">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
            <div className="p-4 rounded-xl bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/20">
              <div className="flex items-center gap-2 mb-2"><Target className="w-4 h-4 text-blue-400" /><span className="text-xs text-zinc-500">SYGNL Accuracy</span></div>
              <div className={'text-xl font-bold ' + (accuracy.overall >= 65 ? 'text-emerald-400' : accuracy.overall >= 50 ? 'text-yellow-400' : 'text-red-400')}>{accuracy.overall}%</div>
              <div className="mt-2"><div className="flex justify-between text-xs text-zinc-500 mb-1"><span>Target: 65%</span><span>{accuracy.progressToTarget}%</span></div><div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden"><div className={'h-full rounded-full transition-all duration-500 ' + (accuracy.progressToTarget >= 100 ? 'bg-emerald-500' : accuracy.progressToTarget >= 75 ? 'bg-blue-500' : 'bg-yellow-500')} style={{ width: Math.min(100, accuracy.progressToTarget) + '%' }} /></div></div>
              <div className="mt-2 text-xs text-zinc-500">{accuracy.wins}W / {accuracy.losses}L</div>
            </div>
            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
              <div className="flex items-center gap-2 mb-2"><Wallet className="w-4 h-4 text-emerald-400" /><span className="text-xs text-zinc-500">Portfolio Value</span></div>
              <div className="text-xl font-bold">{formatCurrency(holdings.totalValue)}</div>
              <div className={(holdings.dayChange || 0) >= 0 ? 'text-xs text-emerald-400' : 'text-xs text-red-400'}>{(holdings.dayChange || 0) >= 0 ? '+' : ''}{formatCurrency(holdings.dayChange || 0)} today</div>
            </div>
            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
              <div className="flex items-center gap-2 mb-2"><Activity className="w-4 h-4 text-yellow-400" /><span className="text-xs text-zinc-500">Market State</span></div>
              <div className="text-xl font-bold text-yellow-400">Fragile</div>
              <div className="text-xs text-zinc-500">68% confidence</div>
            </div>
            <div className="p-4 rounded-xl bg-white/5 border border-white/10 relative">
              <div className="flex items-center gap-2 mb-2"><Zap className="w-4 h-4 text-blue-400" /><span className="text-xs text-zinc-500">Active Signals</span>{newIntelCount > 0 && <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full animate-pulse">{newIntelCount} NEW</span>}</div>
              <div className="text-xl font-bold">{intelligence.summary?.totalItems || 0}</div>
              <div className="text-xs text-zinc-500">{intelligence.summary?.highPriority > 0 ? intelligence.summary.highPriority + ' high priority' : 'Monitoring'}</div>
            </div>
            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
              <div className="flex items-center gap-2 mb-2"><Target className="w-4 h-4 text-purple-400" /><span className="text-xs text-zinc-500">Paper P&L</span></div>
              <div className={'text-xl font-bold ' + (paperSummary.totalPL >= 0 ? 'text-emerald-400' : 'text-red-400')}>{paperSummary.totalPL >= 0 ? '+' : ''}{paperSummary.totalPLPct.toFixed(2)}%</div>
              <div className="text-xs text-zinc-500">{paperPositions.length} positions</div>
            </div>
            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
              <div className="flex items-center gap-2 mb-2"><Users className="w-4 h-4 text-orange-400" /><span className="text-xs text-zinc-500">Moltbook</span></div>
              <div className="text-xl font-bold">147</div>
              <div className="text-xs text-zinc-500">impressions today</div>
            </div>
            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
              <div className="flex items-center gap-2 mb-2"><DollarSign className={'w-4 h-4 ' + (tokenUsage.limit_status === 'ok' ? 'text-emerald-400' : 'text-yellow-400')} /><span className="text-xs text-zinc-500">AI Cost Today</span></div>
              <div className={'text-xl font-bold ' + (tokenUsage.limit_status === 'ok' ? 'text-emerald-400' : 'text-yellow-400')}>${tokenUsage.total_cost_usd.toFixed(2)}</div>
              <div className="text-xs text-zinc-500">{tokenUsage.limit_used_pct.toFixed(0)}% of $10</div>
            </div>
          </div>
        </div>

        {tokenUsage.ai_models?.length > 0 && (
          <div className="mb-6 p-4 rounded-xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/20">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2"><Brain className="w-5 h-5 text-indigo-400" />Connected AI Models</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {tokenUsage.ai_models.map((m, i) => (
                <div key={i} className="p-3 rounded-lg bg-black/30">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-medium text-sm">{m.model.split('-')[0].toUpperCase()}</span>
                    <span className="text-xs text-zinc-500 ml-auto">${m.cost_usd.toFixed(2)}</span>
                  </div>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between text-zinc-500"><span>Calls</span><span className="text-zinc-300">{m.calls.toLocaleString()}</span></div>
                    <div className="flex justify-between text-zinc-500"><span>Tokens</span><span className="text-zinc-300">{((m.tokens_in + m.tokens_out) / 1000).toFixed(1)}k</span></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {accuracy.totalSignals > 0 && (
          <div className="mb-6 p-4 rounded-xl bg-gradient-to-br from-blue-500/5 to-purple-500/5 border border-blue-500/20">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2"><Target className="w-5 h-5 text-blue-400" />SYGNL Accuracy Breakdown<span className="text-xs text-zinc-500 font-normal ml-auto">Last 30 days - {accuracy.totalSignals} signals</span></h3>
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

        <div className="mb-6 p-4 rounded-xl bg-white/5 border border-white/10">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold flex items-center gap-2"><TrendingUpIcon className="w-5 h-5 text-emerald-400" />Portfolio Performance</h3>
            <div className="flex gap-1">
              {['day', 'week', 'month'].map(tf => (
                <button key={tf} onClick={() => setGraphTimeframe(tf)} className={'px-3 py-1 rounded-lg text-sm capitalize transition-colors ' + (graphTimeframe === tf ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/5 text-zinc-400 hover:bg-white/10')}>{tf}</button>
              ))}
            </div>
          </div>
          <div className="h-48 flex items-end gap-2">
            {graphData.map((point, i) => {
              const maxVal = Math.max(...graphData.map(d => d.value))
              const minVal = Math.min(...graphData.map(d => d.value))
              const range = maxVal - minVal || 1
              const height = ((point.value - minVal) / range) * 100
              const isUp = i > 0 && point.value >= graphData[i-1].value
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div className={'w-full rounded-t transition-all duration-500 ' + (isUp ? 'bg-emerald-500/60' : 'bg-red-500/60')} style={{ height: Math.max(height, 10) + '%' }} />
                  <span className="text-xs text-zinc-500">{point.date}</span>
                </div>
              )
            })}
          </div>
        </div>

        <div className="mb-6 p-4 rounded-xl bg-white/5 border border-white/10">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold flex items-center gap-2"><PieChart className="w-5 h-5 text-emerald-400" />Live Holdings</h3>
            <div className="flex gap-2">
              {['all', 'stocks', 'etfs', 'crypto'].map(filter => (
                <button key={filter} onClick={() => setHoldingsFilter(filter)} className={'px-3 py-1.5 rounded-lg text-sm capitalize transition-colors ' + (holdingsFilter === filter ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-white/5 text-zinc-400 hover:bg-white/10')}>{filter}</button>
              ))}
              <button onClick={() => { setTradeMode('live'); setShowBuyModal(true); }} className="px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 text-sm flex items-center gap-1 hover:bg-emerald-500/30"><Plus className="w-4 h-4" /> Buy</button>
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
                    <div className="text-right"><div className="font-medium">{formatCurrency(h.current_value || 0)}</div><div className="text-xs text-zinc-500">{h.quantity?.toLocaleString()} units</div></div>
                    <div className="text-right min-w-[80px]"><div className={(h.day_change || 0) >= 0 ? 'text-sm font-medium text-emerald-400' : 'text-sm font-medium text-red-400'}>{(h.day_change || 0) >= 0 ? '+' : ''}{formatCurrency(h.day_change || 0)}</div><div className={(h.day_change_pct || 0) >= 0 ? 'text-xs text-emerald-500' : 'text-xs text-red-500'}>{(h.day_change_pct || 0) >= 0 ? '+' : ''}{(h.day_change_pct || 0).toFixed(2)}%</div></div>
                    <div className="text-right min-w-[60px]"><div className="text-sm text-zinc-300">${h.current_price?.toLocaleString()}</div></div>
                    <button onClick={() => { setTradeMode('live'); setSelectedAsset(h); setShowSellModal(true); }} className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20"><Minus className="w-4 h-4" /></button>
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

        <div className="mb-6 p-4 rounded-xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/20">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold flex items-center gap-2"><Brain className="w-5 h-5 text-amber-400" />SYGNL.iq<span className="text-xs text-amber-400 font-normal">Signal Intelligence</span></h3>
            <div className="flex items-center gap-3">
              <button onClick={() => setAutoExecuteEnabled(!autoExecuteEnabled)} className={'flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors ' + (autoExecuteEnabled ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/5 text-zinc-400')}>{autoExecuteEnabled ? <Play className="w-3 h-3" /> : <Pause className="w-3 h-3" />}Auto-Execute Strong</button>
              <div className="flex gap-2">
                <span className="px-2 py-1 rounded bg-emerald-500/20 text-emerald-400 text-xs">{sygnliqStats.strong} Strong</span>
                <span className="px-2 py-1 rounded bg-blue-500/20 text-blue-400 text-xs">{sygnliqStats.medium} Medium</span>
                <span className="px-2 py-1 rounded bg-yellow-500/20 text-yellow-400 text-xs">{sygnliqStats.weak} Weak</span>
              </div>
            </div>
          </div>
          {sygnliqSignals.length > 0 && (
            <div className="mb-4 p-3 rounded-lg bg-black/30">
              <h4 className="text-sm font-medium text-zinc-400 mb-2 flex items-center gap-2"><BarChart3 className="w-4 h-4" />Recommendations</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {sygnliqSignals.slice(0, 3).map((s, i) => (
                  <div key={i} onClick={() => handleSygnliqExecute(s, s.strength === 'WEAK')} className={'p-3 rounded-lg cursor-pointer transition-all hover:scale-105 ' + (s.strength === 'STRONG' ? 'bg-emerald-500/10 border border-emerald-500/30' : s.strength === 'MEDIUM' ? 'bg-blue-500/10 border border-blue-500/30' : 'bg-yellow-500/10 border border-yellow-500/30')}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2"><span className="font-bold">{s.symbol}</span><span className={'text-xs px-2 py-0.5 rounded ' + (s.strength === 'STRONG' ? 'bg-emerald-500/30 text-emerald-400' : s.strength === 'MEDIUM' ? 'bg-blue-500/30 text-blue-400' : 'bg-yellow-500/30 text-yellow-400')}>{s.strength}</span></div>
                      <span className="text-sm font-medium">{s.confidence}%</span>
                    </div>
                    <p className="text-xs text-zinc-400 mt-1 line-clamp-2">{s.reasoning}</p>
                    <div className="flex items-center justify-between mt-2"><span className="text-xs text-zinc-500">{s.action}</span><span className="text-xs text-emerald-400">{s.suggestedSize ? '$' + s.suggestedSize.toLocaleString() : ''}</span></div>
                  </div>
                ))}
              </div>
            </div>
          )}
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
        </div>

        <div className="mb-6 p-4 rounded-xl bg-white/5 border border-white/10">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold flex items-center gap-2"><Target className="w-5 h-5 text-purple-400" />Paper Trading</h3>
            <div className="flex items-center gap-3">
              <div className="text-right"><div className="text-xs text-zinc-500">Buying Power</div><div className="text-sm font-medium text-zinc-300">{formatCurrency(paperSummary.buyingPower)}</div></div>
              <span className={'px-3 py-1 rounded-lg text-sm ' + (paperSummary.totalPL >= 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400')}>{paperSummary.totalPL >= 0 ? '+' : ''}{paperSummary.totalPLPct.toFixed(2)}% P&L</span>
              <button onClick={() => { setTradeMode('paper'); setShowBuyModal(true); }} className="px-3 py-1.5 rounded-lg bg-purple-500/20 text-purple-400 text-sm flex items-center gap-1 hover:bg-purple-500/30"><Plus className="w-4 h-4" /> Paper Buy</button>
            </div>
          </div>
          <div className="space-y-2">
            {paperPositions.length > 0 ? paperPositions.map((pos, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-purple-500/5 border border-purple-500/10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center font-bold text-sm text-purple-400">{pos.symbol?.slice(0, 2)}</div>
                  <div><div className="font-medium">{pos.symbol}</div><div className="text-xs text-zinc-500">{pos.quantity?.toFixed(2)} shares @ ${pos.entry_price?.toFixed(2)}</div></div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right"><div className="font-medium">${pos.current_value?.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div><div className="text-xs text-zinc-500">Current</div></div>
                  <div className="text-right min-w-[70px]"><div className={(pos.unrealized_pl || 0) >= 0 ? 'text-sm font-medium text-emerald-400' : 'text-sm font-medium text-red-400'}>{(pos.unrealized_pl || 0) >= 0 ? '+' : ''}{formatCurrency(pos.unrealized_pl || 0)}</div><div className={(pos.unrealized_pl_pct || 0) >= 0 ? 'text-xs text-emerald-500' : 'text-xs text-red-500'}>{(pos.unrealized_pl_pct || 0) >= 0 ? '+' : ''}{(pos.unrealized_pl_pct || 0).toFixed(2)}%</div></div>
                  <button onClick={() => { setTradeMode('paper'); setSelectedAsset(pos); setShowSellModal(true); }} className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20"><Minus className="w-4 h-4" /></button>
                </div>
              </div>
            )) : <div className="p-4 text-center text-zinc-500">No paper positions. Use SYGNL.iq or manual trades.</div>}
          </div>
        </div>

        {intelligence.all?.length > 0 && (
          <div className="mb-6 p-4 rounded-xl bg-white/5 border border-white/10">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2"><Newspaper className="w-5 h-5 text-blue-400" />Intelligence Hub{newIntelCount > 0 && <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full animate-pulse">{newIntelCount} new</span>}</h3>
            </div>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {intelligence.all.slice(0, 10).map((item, i) => {
                const isNew = !readIntelIds.has(item.id || item.title)
                const isExpanded = expandedIntel === (item.id || item.title)
                return (
                  <div key={i} className={'rounded-lg border transition-all ' + (isNew ? 'bg-blue-500/10 border-blue-500/30' : 'bg-white/5 border-white/10') + ' ' + (isExpanded ? 'p-4' : 'p-3')}>
                    <div className="flex items-center gap-2 cursor-pointer" onClick={() => { markIntelAsRead(item.id || item.title); setExpandedIntel(isExpanded ? null : (item.id || item.title)); }}>
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
                        {item.actionItems?.length > 0 && <div className="mt-2"><span className="text-xs text-zinc-500">Action Items:</span><ul className="mt-1 space-y-1">{item.actionItems.map((action, aidx) => (<li key={aidx} className="text-sm text-zinc-300 flex items-center gap-2"><CheckCircle className="w-3 h-3 text-emerald-400" />{action}</li>))}</ul></div>}
                        <div className="flex gap-2 mt-3"><button className="px-3 py-1 rounded bg-blue-500/20 text-blue-400 text-xs hover:bg-blue-500/30">Create Signal</button><button className="px-3 py-1 rounded bg-white/10 text-zinc-400 text-xs hover:bg-white/20">Dismiss</button></div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </main>

      {showBuyModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-white/10 rounded-2xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Buy Asset</h3>
              <button onClick={() => { setShowBuyModal(false); setExecutionError(''); setExecutionSuccess(''); setTradeSymbol(''); }}><X className="w-5 h-5 text-zinc-400" /></button>
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

      {showSellModal && selectedAsset && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-white/10 rounded-2xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Sell {selectedAsset.symbol}</h3>
              <button onClick={() => { setShowSellModal(false); setExecutionError(''); setExecutionSuccess(''); }}><X className="w-5 h-5 text-zinc-400" /></button>
            </div>
            <div className="flex gap-2 mb-4 p-1 bg-black/30 rounded-lg">
              <button onClick={() => setTradeMode('live')} className={'flex-1 py-2 rounded text-sm font-medium transition-colors ' + (tradeMode === 'live' ? 'bg-red-500/20 text-red-400' : 'text-zinc-500 hover:text-zinc-300')}>Live Trading</button>
              <button onClick={() => setTradeMode('paper')} className={'flex-1 py-2 rounded text-sm font-medium transition-colors ' + (tradeMode === 'paper' ? 'bg-purple-500/20 text-purple-400' : 'text-zinc-500 hover:text-zinc-300')}>Paper Trading</button>
            </div>
            <div className="space-y-4">
              <div className="p-3 rounded-lg bg-white/5">
                <div className="text-sm text-zinc-400">Current Position ({tradeMode})</div>
                <div className="text-lg font-bold">{selectedAsset.quantity?.toLocaleString()} shares</div>
                <div className="text-sm text-zinc-500">@ ${selectedAsset.current_price?.toLocaleString()}</div>
                <div className="text-sm text-emerald-400 mt-1">Value: {formatCurrency(selectedAsset.current_value || selectedAsset.quantity * selectedAsset.current_price)}</div>
              </div>
              <div><label className="block text-sm text-zinc-400 mb-1">Quantity to Sell</label><input type="number" step="any" value={tradeQuantity} onChange={(e) => setTradeQuantity(e.target.value)} placeholder={'Max: ' + selectedAsset.quantity} max={selectedAsset.quantity} className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-white" /></div>
              <div><label className="block text-sm text-zinc-400 mb-1">Price per Share</label><input type="number" step="any" value={tradePrice || selectedAsset.current_price} onChange={(e) => setTradePrice(e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-white" /></div>
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
