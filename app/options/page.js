'use client'
// Options Mission Control — live monitoring of all 23 options strategies

import { useState, useEffect, useCallback } from 'react'
import { RefreshCw, Target, TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Clock, Zap, BarChart3, Activity } from 'lucide-react'

const PAPER_API = 'http://localhost:3002'

const STRATEGY_CATEGORIES = {
  'ETF_ShortStrangle':   { label: 'Short Strangle',   cat: 'PREMIUM',     color: 'purple' },
  'ETF_IronCondor':      { label: 'Iron Condor',       cat: 'PREMIUM',     color: 'purple' },
  'ETF_CoveredCall':     { label: 'Covered Call',      cat: 'PREMIUM',     color: 'purple' },
  'ETF_Wheel':           { label: 'Wheel',             cat: 'PREMIUM',     color: 'purple' },
  'ETF_CreditSpread':    { label: 'Credit Spread',     cat: 'PREMIUM',     color: 'purple' },
  'ETF_IVCrush':         { label: 'IV Crush',          cat: 'PREMIUM',     color: 'purple' },
  'ETF_JadeLizard':      { label: 'Jade Lizard',       cat: 'PREMIUM',     color: 'purple' },
  'ETF_DeltaNeutral':    { label: 'Delta Neutral',     cat: 'PREMIUM',     color: 'purple' },
  'ETF_BullCallSpread':  { label: 'Bull Call Spread',  cat: 'DIRECTIONAL', color: 'blue'   },
  'ETF_BearPutSpread':   { label: 'Bear Put Spread',   cat: 'DIRECTIONAL', color: 'blue'   },
  'ETF_PutCallRatio':    { label: 'P/C Ratio',         cat: 'DIRECTIONAL', color: 'blue'   },
  'ETF_LongStraddle':    { label: 'Long Straddle',     cat: 'VOL',         color: 'orange' },
  'ETF_LongStrangle':    { label: 'Long Strangle',     cat: 'VOL',         color: 'orange' },
  'ETF_VIXHedge':        { label: 'VIX Hedge',         cat: 'VOL',         color: 'orange' },
  'ETF_VIXTerm':         { label: 'VIX Term Struct',   cat: 'VOL',         color: 'orange' },
  'ETF_Butterfly':       { label: 'Butterfly',         cat: 'NEUTRAL',     color: 'teal'   },
  'ETF_CalendarSpread':  { label: 'Calendar Spread',   cat: 'NEUTRAL',     color: 'teal'   },
  'ETF_Collar':          { label: 'Collar',            cat: 'HEDGE',       color: 'green'  },
  'ETF_MonteCarlo':      { label: 'Monte Carlo',       cat: 'HEDGE',       color: 'green'  },
  'ETF_MeanRevShort':    { label: 'Mean Rev Short',    cat: 'SHORT',       color: 'red'    },
  'ETF_FalseBreakout':   { label: 'False Breakout',    cat: 'SHORT',       color: 'red'    },
  'ETF_ZeroDTE':         { label: '0DTE',              cat: '0DTE',        color: 'yellow' },
}

const CAT_COLORS = {
  PREMIUM:     { bg: 'bg-purple-500/20', text: 'text-purple-300', border: 'border-purple-500/30' },
  DIRECTIONAL: { bg: 'bg-blue-500/20',   text: 'text-blue-300',   border: 'border-blue-500/30'   },
  VOL:         { bg: 'bg-orange-500/20', text: 'text-orange-300', border: 'border-orange-500/30' },
  NEUTRAL:     { bg: 'bg-teal-500/20',   text: 'text-teal-300',   border: 'border-teal-500/30'   },
  HEDGE:       { bg: 'bg-green-500/20',  text: 'text-green-300',  border: 'border-green-500/30'  },
  SHORT:       { bg: 'bg-red-500/20',    text: 'text-red-300',    border: 'border-red-500/30'    },
  '0DTE':      { bg: 'bg-yellow-500/20', text: 'text-yellow-300', border: 'border-yellow-500/30' },
}

const AGENT_CATEGORIES = {
  TRADING:   { color: 'emerald' },
  ANALYTICS: { color: 'blue' },
  STRATEGY:  { color: 'violet' },
  INFRA:     { color: 'zinc' },
  RESEARCH:  { color: 'amber' },
}

const N = (v) => Number(v) || 0

function fmt(n, decimals = 2) {
  const num = N(n)
  return (num >= 0 ? '+' : '') + num.toFixed(decimals)
}

function fmtK(n) {
  const num = N(n)
  if (Math.abs(num) >= 1000000) return (num / 1000000).toFixed(1) + 'M'
  if (Math.abs(num) >= 1000) return (num / 1000).toFixed(1) + 'K'
  return num.toFixed(0)
}

function timeAgo(ts) {
  if (!ts) return '—'
  const diff = Date.now() - new Date(ts).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

function timeSince(ts) {
  if (!ts) return '—'
  const diff = Date.now() - new Date(ts).getTime()
  const mins = Math.floor(diff / 60000)
  const hrs = Math.floor(mins / 60)
  if (hrs > 0) return `${hrs}h ${mins % 60}m`
  return `${mins}m`
}

function fmtDuration(ms) {
  if (ms == null) return '—'
  const s = Math.round(ms / 1000)
  if (s < 60) return `${s}s`
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m${s % 60}s`
  const h = Math.floor(m / 60)
  return `${h}h${m % 60}m`
}

function agentTimeAgo(ts) {
  if (!ts) return { text: 'never', color: 'text-zinc-600' }
  const diff = Date.now() - new Date(ts).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 5) return { text: 'just now', color: 'text-emerald-400' }
  if (mins < 60) return { text: `${mins}m ago`, color: 'text-zinc-400' }
  const hrs = Math.floor(mins / 60)
  return { text: `${hrs}h ago`, color: 'text-zinc-500' }
}

function agentStatusDot(agent) {
  const { lastStatus, lastRunMs, consecutiveErrors } = agent
  if (consecutiveErrors > 0 || lastStatus === 'error') {
    return 'bg-red-500'
  }
  if (lastStatus === 'pending' || !lastRunMs) {
    return 'bg-yellow-500'
  }
  if (lastStatus === 'ok') {
    const diff = lastRunMs ? Date.now() - new Date(lastRunMs).getTime() : Infinity
    if (diff < 10 * 60 * 1000) return 'bg-emerald-400 animate-pulse'
    return 'bg-emerald-400'
  }
  return 'bg-zinc-500'
}

function getMarketSession() {
  const hour = new Date().getUTCHours()
  if (hour >= 13 && hour < 21) return { label: 'US', color: 'text-green-400', bg: 'bg-green-500/10 border-green-500/30' }
  if (hour >= 0 && hour < 8)   return { label: 'ASIA', color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/30' }
  if (hour >= 7 && hour < 16)  return { label: 'EU', color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/30' }
  return { label: 'CRYPTO', color: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/30' }
}

function SummaryCard({ title, value, sub, color = 'text-white', icon: Icon }) {
  return (
    <div className="flex-1 bg-zinc-900/60 border border-zinc-700/40 rounded-xl p-4 flex items-center gap-4">
      {Icon && (
        <div className="w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center shrink-0">
          <Icon className="w-5 h-5 text-zinc-400" />
        </div>
      )}
      <div className="min-w-0">
        <div className="text-xs text-zinc-500 uppercase tracking-wider mb-1">{title}</div>
        <div className={`text-xl font-bold ${color} truncate`}>{value}</div>
        {sub && <div className="text-xs text-zinc-500 mt-0.5">{sub}</div>}
      </div>
    </div>
  )
}

function RiskStatusBar({ risk }) {
  if (!risk) {
    return (
      <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-zinc-900/60 border border-zinc-700/40 text-sm text-zinc-500 animate-pulse">
        <span className="w-2 h-2 rounded-full bg-zinc-600 inline-block" />
        Fetching risk data…
      </div>
    )
  }

  const status    = risk.risk_status || 'GREEN'
  const positions = risk.total_positions ?? 0
  const violation = risk.violations?.[0] || ''
  const warning   = risk.warnings?.[0]   || ''

  const cfg = {
    GREEN:  {
      bg:   'bg-emerald-950/60 border-emerald-700/40',
      dot:  'bg-emerald-400',
      text: 'text-emerald-300',
      msg:  `✅ All limits OK — ${positions} open positions`,
    },
    YELLOW: {
      bg:   'bg-yellow-950/60 border-yellow-600/40',
      dot:  'bg-yellow-400 animate-pulse',
      text: 'text-yellow-300',
      msg:  `⚠️ Warning: ${warning}`,
    },
    RED: {
      bg:   'bg-red-950/60 border-red-600/50',
      dot:  'bg-red-400 animate-pulse',
      text: 'text-red-300',
      msg:  `🚨 LIMIT BREACH: ${violation} — new trades paused`,
    },
  }[status] || {}

  const drawdown  = risk.drawdown_pct  ?? 0
  const dailyPnl  = risk.daily_pnl_pct ?? 0
  const volExp    = risk.vol_exposure_pct ?? 0

  return (
    <div className={`flex items-center gap-4 px-4 py-2.5 rounded-xl border ${cfg.bg} text-sm flex-wrap`}>
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${cfg.dot}`} />
        <span className={`font-medium truncate ${cfg.text}`}>{cfg.msg}</span>
      </div>
      <div className="flex items-center gap-6 text-xs text-zinc-400 shrink-0">
        <span>Drawdown: <span className={drawdown > 10 ? 'text-red-400' : drawdown > 7 ? 'text-yellow-400' : 'text-zinc-300'}>{drawdown.toFixed(1)}%</span></span>
        <span>Daily P&amp;L: <span className={dailyPnl < -3 ? 'text-red-400' : dailyPnl < -1 ? 'text-yellow-400' : 'text-emerald-400'}>{dailyPnl >= 0 ? '+' : ''}{dailyPnl.toFixed(2)}%</span></span>
        <span>Vol exp: <span className={volExp > 7 ? 'text-red-400' : 'text-zinc-300'}>{volExp.toFixed(1)}%</span></span>
        <span className="text-zinc-600">|</span>
        <span>{risk.violations?.length ?? 0} violation{risk.violations?.length !== 1 ? 's' : ''}, {risk.warnings?.length ?? 0} warning{risk.warnings?.length !== 1 ? 's' : ''}</span>
      </div>
    </div>
  )
}

function StrategyCard({ strategy, positions }) {
  const name = strategy.strategy_name || ''
  const meta = STRATEGY_CATEGORIES[name] || { label: name.replace('ETF_', ''), cat: 'UNKNOWN', color: 'zinc' }
  const catStyle = CAT_COLORS[meta.cat] || { bg: 'bg-zinc-500/20', text: 'text-zinc-300', border: 'border-zinc-500/30' }

  const myPositions_ = (positions || []).filter(p => p.strategy === (strategy.strategy_name || '') || p.strategy_name === (strategy.strategy_name || ''))
  const deployed = myPositions_.reduce((a, p) => a + Math.abs(N(p.market_value || (N(p.quantity) * N(p.entry_price)))), 0)
  const capital = deployed + N(strategy.current_cash)
  const deployPct = capital > 0 ? (deployed / capital) * 100 : 0
  const openPos = N(strategy.open_positions)
  const pnl = N(strategy.total_pnl ?? strategy.unrealized_pnl)
  const lastSignal = strategy.last_signal_time

  // Filter positions for this strategy
  const myPositions = (positions || []).filter(p => p.strategy === name || p.strategy_name === name)

  return (
    <div className="bg-zinc-900/60 border border-zinc-700/40 rounded-xl p-4 flex flex-col gap-3 hover:border-zinc-600/60 transition-colors">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="font-semibold text-white text-sm truncate">{meta.label}</div>
          <div className="text-xs text-zinc-500 mt-0.5">{name}</div>
        </div>
        <span className={`shrink-0 text-xs font-medium px-2 py-0.5 rounded-full border ${catStyle.bg} ${catStyle.text} ${catStyle.border}`}>
          {meta.cat}
        </span>
      </div>

      {/* Capital bar */}
      <div>
        <div className="flex justify-between text-xs text-zinc-400 mb-1">
          <span>${fmtK(capital)} allocated</span>
          <span className="text-zinc-300">{deployPct.toFixed(0)}% deployed</span>
        </div>
        <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-violet-500 to-blue-500 transition-all"
            style={{ width: `${Math.min(100, deployPct)}%` }}
          />
        </div>
      </div>

      {/* Stats row */}
      <div className="flex items-center gap-3 text-xs">
        <div className="flex items-center gap-1 text-zinc-400">
          <Activity className="w-3 h-3" />
          <span>{openPos} open</span>
        </div>
        <div className={`font-semibold ${pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
          P&L {fmt(pnl)}
        </div>
        <div className="ml-auto text-zinc-600 flex items-center gap-1">
          <Clock className="w-3 h-3" />
          <span>{timeAgo(lastSignal)}</span>
        </div>
      </div>

      {/* Positions list */}
      {myPositions.length > 0 && (
        <div className="border-t border-zinc-800 pt-2 space-y-1.5">
          {myPositions.slice(0, 4).map((pos, i) => {
            const posEntry = N(pos.entry_price)
            const posSL = N(pos.stop_loss)
            const posTP = N(pos.take_profit)
            const posCurrent = N(pos.current_price)
            const posPnl = N(pos.unrealized_pnl)
            const inTrade = timeSince(pos.entry_time || pos.created_at)
            const isLong = (pos.direction || '').toUpperCase().includes('BUY') || (pos.direction || '').toUpperCase() === 'LONG'
            return (
              <div key={i} className="grid grid-cols-3 gap-1 text-xs bg-zinc-800/40 rounded-lg px-2 py-1.5">
                <div className="font-medium text-zinc-200 truncate">{pos.symbol || '—'}</div>
                <div className={`text-center ${isLong ? 'text-emerald-400' : 'text-red-400'}`}>
                  {pos.direction || '—'}
                </div>
                <div className={`text-right ${posPnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {fmt(posPnl)}
                </div>
                <div className="text-zinc-500 col-span-2">
                  E:{posEntry.toFixed(2)} SL:{posSL.toFixed(2)} TP:{posTP.toFixed(2)}
                </div>
                <div className="text-right text-zinc-600">{inTrade}</div>
              </div>
            )
          })}
          {myPositions.length > 4 && (
            <div className="text-xs text-zinc-600 text-center">+{myPositions.length - 4} more</div>
          )}
        </div>
      )}
    </div>
  )
}

function SignalItem({ signal }) {
  const dir = (signal.direction || '').toUpperCase()
  const isBuy = dir.includes('BUY_CALL') || dir.includes('BUY_PUT')
  const isSell = dir.includes('SELL_CALL') || dir.includes('SELL_PUT')
  const isShort = dir.includes('SHORT')
  const color = isBuy ? 'border-l-emerald-500' : isSell ? 'border-l-red-500' : isShort ? 'border-l-orange-500' : 'border-l-zinc-600'
  const textColor = isBuy ? 'text-emerald-400' : isSell ? 'text-red-400' : isShort ? 'text-orange-400' : 'text-zinc-400'
  const conf = N(signal.confidence)
  const stratName = (signal.strategy || '').replace('ETF_', '')

  return (
    <div className={`border-l-2 ${color} pl-2 py-1.5 bg-zinc-800/30 rounded-r-lg`}>
      <div className="flex items-center justify-between gap-2">
        <span className="font-bold text-white text-xs">{signal.symbol || '—'}</span>
        <span className={`text-xs font-medium ${textColor}`}>{signal.direction || '—'}</span>
      </div>
      <div className="flex items-center justify-between mt-0.5">
        <span className="text-xs text-zinc-500">{stratName}</span>
        <div className="flex items-center gap-2 text-xs">
          {conf > 0 && <span className="text-zinc-400">{conf.toFixed(0)}%</span>}
          {signal.entry_price && <span className="text-zinc-500">${N(signal.entry_price).toFixed(2)}</span>}
        </div>
      </div>
      <div className="text-xs text-zinc-700 mt-0.5">{timeAgo(signal.signal_time || signal.timestamp)}</div>
    </div>
  )
}

function AlertItem({ trade }) {
  const pnl = N(trade.pnl)
  const reason = trade.exit_reason || 'unknown'
  const isStop = reason === 'stop_loss'
  const isTP = reason === 'take_profit'
  const emoji = isTP ? '✅' : isStop ? '🛑' : '🔶'
  const pnlColor = pnl >= 0 ? 'text-emerald-400' : 'text-red-400'

  return (
    <div className="flex items-center gap-3 p-2 bg-zinc-800/30 rounded-lg border border-zinc-700/20">
      <span className="text-base">{emoji}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-white text-xs">{trade.symbol || '—'}</span>
          <span className="text-xs text-zinc-500">{(trade.strategy || '').replace('ETF_', '')}</span>
        </div>
        <div className="text-xs text-zinc-500">{reason.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</div>
      </div>
      <div className={`text-sm font-bold ${pnlColor} shrink-0`}>{fmt(pnl)}</div>
      <div className="text-xs text-zinc-600 shrink-0">{timeAgo(trade.exit_time)}</div>
    </div>
  )
}

function AgentControlCenter({ agents }) {
  // Group agents by category
  const grouped = {}
  for (const agent of agents) {
    const cat = agent.category || 'INFRA'
    if (!grouped[cat]) grouped[cat] = []
    grouped[cat].push(agent)
  }

  const catOrder = ['TRADING', 'ANALYTICS', 'STRATEGY', 'INFRA', 'RESEARCH']
  const catAccent = {
    TRADING: 'text-emerald-400',
    ANALYTICS: 'text-blue-400',
    STRATEGY: 'text-violet-400',
    INFRA: 'text-zinc-400',
    RESEARCH: 'text-amber-400',
  }

  return (
    <section>
      <div className="bg-zinc-900/60 border border-zinc-700/40 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
            <Zap className="w-4 h-4 text-violet-400" />
            Agent Control Center
          </h2>
          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 border border-zinc-700/50">
            {agents.length} agents
          </span>
        </div>

        <div className="max-h-[300px] overflow-y-auto space-y-4">
          {catOrder.filter(c => grouped[c]?.length).map(cat => (
            <div key={cat}>
              <div className={`text-[10px] font-bold uppercase tracking-widest mb-1.5 ${catAccent[cat] || 'text-zinc-500'}`}>
                {cat}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {grouped[cat].map((agent, i) => {
                  const dot = agentStatusDot(agent)
                  const ago = agentTimeAgo(agent.lastRunMs)
                  const dur = fmtDuration(agent.durationMs)
                  const name = (agent.name || '').length > 24
                    ? (agent.name || '').slice(0, 24) + '…'
                    : (agent.name || '')
                  return (
                    <div
                      key={agent.id || i}
                      className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-zinc-800/60 transition-colors group"
                    >
                      <span className={`w-2 h-2 rounded-full shrink-0 ${dot}`} />
                      <span className="text-xs font-medium text-zinc-200 truncate max-w-[150px]">{name}</span>
                      <span className="text-[10px] text-zinc-500">{agent.schedule || ''}</span>
                      <span className={`text-[10px] ${ago.color}`}>{ago.text}</span>
                      <span className="text-[10px] text-zinc-500">{dur}</span>
                      {agent.consecutiveErrors > 0 && (
                        <span className="text-[10px] font-bold text-red-400 bg-red-500/20 px-1.5 py-0.5 rounded-full">ERR</span>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
          {agents.length === 0 && (
            <div className="text-center py-6 text-zinc-600 text-sm">No agents loaded</div>
          )}
        </div>
      </div>
    </section>
  )
}

export default function OptionsMissionControl() {
  const [clock, setClock] = useState(new Date())
  const [loading, setLoading] = useState(true)
  const [lastRefresh, setLastRefresh] = useState(null)

  const [strategies, setStrategies] = useState([])
  const [positions, setPositions] = useState([])
  const [signals, setSignals] = useState([])
  const [trades, setTrades] = useState([])
  const [summary, setSummary] = useState({
    totalCapital: 0,
    deployed: 0,
    openPositions: 0,
    totalPnl: 0,
  })
  const [riskData, setRiskData] = useState(null)
  const [agentsData, setAgentsData] = useState([])

  // Live clock
  useEffect(() => {
    const t = setInterval(() => setClock(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  const fetchAll = useCallback(async () => {
    setLoading(true)
    try {
      const [statusRes, posRes, optsRes, tradesRes, riskRes, agentsRes] = await Promise.allSettled([
        fetch(`${PAPER_API}/api/status`).then(r => r.ok ? r.json() : null).catch(() => null),
        fetch(`${PAPER_API}/api/positions`).then(r => r.ok ? r.json() : null).catch(() => null),
        fetch(`${PAPER_API}/api/options-shorts`).then(r => r.ok ? r.json() : null).catch(() => null),
        fetch(`${PAPER_API}/api/trades?days=1`).then(r => r.ok ? r.json() : null).catch(() => null),
        fetch(`${PAPER_API}/api/risk`).then(r => r.ok ? r.json() : null).catch(() => null),
        fetch(`${PAPER_API}/api/agents`).then(r => r.ok ? r.json() : null).catch(() => null),
      ])

      const statusData   = statusRes.value
      const posData      = posRes.value
      const optsData     = optsRes.value
      const tradesData   = tradesRes.value
      const riskPayload  = riskRes.value
      if (riskPayload) setRiskData(riskPayload)

      const agentsPayload = agentsRes.value
      if (agentsPayload) setAgentsData(agentsPayload.agents || [])

      // Strategies — filter to ETF_ options strategies
      const allStrategies = statusData?.strategies || []
      const etfStrategies = allStrategies.filter(s => s.strategy_name?.startsWith('ETF_'))
      setStrategies(etfStrategies)

      // Portfolio summary
      const totalPos = etfStrategies.reduce((a, s) => a + N(s.open_positions), 0)
      const totalPnl = etfStrategies.reduce((a, s) => a + N(s.total_pnl ?? s.unrealized_pnl), 0)
      // Deployed = actual value in open ETF positions only
      const etfNames = new Set(etfStrategies.map(s => s.strategy_name))
      const etfPositions = (posData?.positions || []).filter(p => etfNames.has(p.strategy) || etfNames.has(p.strategy_name))
      const totalDep = etfPositions.reduce((a, p) => a + Math.abs(N(p.market_value || (N(p.quantity) * N(p.entry_price)))), 0)
      const totalCap = totalDep + etfStrategies.reduce((a, s) => a + N(s.current_cash), 0)
      setSummary({ totalCapital: totalCap, deployed: totalDep, openPositions: totalPos, totalPnl })

      // Positions
      const allPos = posData?.positions || []
      setPositions(allPos)

      // Signals: merge from opts and status
      const optsSignals = optsData?.signals || []
      const statusSignals = statusData?.recent_signals || []
      const allSignals = [...optsSignals, ...statusSignals]
        .sort((a, b) => new Date(b.signal_time || b.timestamp || 0) - new Date(a.signal_time || a.timestamp || 0))
        .slice(0, 20)
      setSignals(allSignals)

      // Trades
      const allTrades = tradesData?.trades || []
      const exits = allTrades.filter(t => ['stop_loss', 'take_profit', 'trailing_stop', 'manual'].includes(t.exit_reason))
      setTrades(exits.slice(0, 20))

    } catch (err) {
      console.error('Fetch error:', err)
    } finally {
      setLoading(false)
      setLastRefresh(new Date())
    }
  }, [])

  // Initial fetch + 30-second auto-refresh
  useEffect(() => {
    fetchAll()
    const t = setInterval(fetchAll, 30000)
    return () => clearInterval(t)
  }, [fetchAll])

  const session = getMarketSession()
  const stopLossCount = trades.filter(t => t.exit_reason === 'stop_loss').length
  const tpCount = trades.filter(t => t.exit_reason === 'take_profit').length

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* ── Header ── */}
      <header className="sticky top-0 z-50 bg-zinc-900/90 border-b border-zinc-800/60 backdrop-blur-md px-6 py-3">
        <div className="max-w-[1800px] mx-auto flex items-center justify-between gap-4">
          {/* Left: brand + title */}
          <div className="flex items-center gap-3">
            <a href="/dashboard" className="text-zinc-500 hover:text-zinc-300 text-sm transition-colors">← Dashboard</a>
            <div className="w-px h-5 bg-zinc-700" />
            <Target className="w-5 h-5 text-violet-400" />
            <span className="font-bold text-white tracking-widest text-sm uppercase">Options Mission Control</span>
          </div>

          {/* Right: clock, session badge, refresh */}
          <div className="flex items-center gap-3">
            <div className="text-sm text-zinc-400 font-mono">
              {clock.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}
            </div>
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${session.bg} ${session.color}`}>
              {session.label}
            </span>
            {lastRefresh && (
              <span className="text-xs text-zinc-600">Updated {timeAgo(lastRefresh)}</span>
            )}
            <button
              onClick={fetchAll}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-[1800px] mx-auto px-6 py-6 space-y-6">

        {/* ── Portfolio Summary Strip ── */}
        <section>
          <div className="flex gap-4">
            <SummaryCard
              title="Total Virtual Capital"
              value={`$${fmtK(summary.totalCapital)}`}
              sub={`${strategies.length} active strategies`}
              icon={BarChart3}
            />
            <SummaryCard
              title="Deployed Capital"
              value={`$${fmtK(summary.deployed)}`}
              sub={summary.totalCapital > 0 ? `${((summary.deployed / summary.totalCapital) * 100).toFixed(1)}% of total` : '—'}
              color={summary.deployed > 0 ? 'text-blue-300' : 'text-zinc-400'}
              icon={TrendingUp}
            />
            <SummaryCard
              title="Open Positions"
              value={summary.openPositions}
              sub="across all ETF strategies"
              color={summary.openPositions > 0 ? 'text-yellow-300' : 'text-zinc-400'}
              icon={Activity}
            />
            <SummaryCard
              title="Total P&L"
              value={fmt(summary.totalPnl)}
              sub="unrealized across strategies"
              color={summary.totalPnl >= 0 ? 'text-emerald-400' : 'text-red-400'}
              icon={summary.totalPnl >= 0 ? TrendingUp : TrendingDown}
            />
          </div>
        </section>

        {/* ── Risk Status Bar ── */}
        <RiskStatusBar risk={riskData} />

        {/* ── Main Body: Strategy Grid + Signal Feed ── */}
        <div className="flex gap-6">

          {/* Strategy Grid */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider">Strategy Grid</h2>
              <span className="text-xs text-zinc-600">{strategies.length} strategies loaded</span>
            </div>

            {loading && strategies.length === 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-48 bg-zinc-900/40 border border-zinc-800/40 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : strategies.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-zinc-600">
                <Target className="w-10 h-10 mb-3 opacity-30" />
                <p className="text-sm">No ETF strategies found</p>
                <p className="text-xs mt-1">Paper engine may be offline (localhost:3002)</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {strategies.map((s, i) => (
                  <StrategyCard key={s.strategy_name || i} strategy={s} positions={positions} />
                ))}
              </div>
            )}
          </div>

          {/* Live Signal Feed sidebar */}
          <aside className="w-72 shrink-0">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
                <Zap className="w-4 h-4 text-yellow-400" />
                Live Signals
              </h2>
              <span className="text-xs text-zinc-600">{signals.length}</span>
            </div>

            <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
              {signals.length === 0 ? (
                <div className="text-center py-8 text-zinc-600 text-sm">No signals yet</div>
              ) : (
                signals.map((sig, i) => <SignalItem key={i} signal={sig} />)
              )}
            </div>
          </aside>
        </div>

        {/* ── Agent Control Center ── */}
        <AgentControlCenter agents={agentsData} />

        {/* ── Alert Panel ── */}
        <section>
          <div className="bg-zinc-900/60 border border-zinc-700/40 rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-orange-400" />
                Alert Panel — Last 24h
              </h2>
              <div className="flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1 text-red-400">
                  🛑 {stopLossCount} stop-loss{stopLossCount !== 1 ? 'es' : ''}
                </span>
                <span className="flex items-center gap-1 text-emerald-400">
                  ✅ {tpCount} take-profit{tpCount !== 1 ? 's' : ''}
                </span>
                <span className="text-zinc-500">{trades.length} total exits</span>
              </div>
            </div>

            {trades.length === 0 ? (
              <div className="flex items-center justify-center py-8 text-zinc-600 gap-2">
                <CheckCircle className="w-5 h-5 opacity-40" />
                <span className="text-sm">No exits recorded in last 24h</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2">
                {trades.map((t, i) => <AlertItem key={i} trade={t} />)}
              </div>
            )}
          </div>
        </section>

      </div>
    </div>
  )
}
