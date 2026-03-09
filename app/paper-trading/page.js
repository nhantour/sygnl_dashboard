// SYGNL Paper Trading Command Center v2.0 — Dark Luxe Edition
'use client'

const N = (v) => Number(v) || 0

import { useState, useEffect, useCallback, useRef } from 'react'
import { TrendingUp, Activity, Target, Zap, BarChart3, RefreshCw, ChevronDown, ChevronUp, ChevronRight, Trophy, AlertTriangle, CheckCircle, Clock, DollarSign, ArrowUpRight, ArrowDownRight, Flame, Shield, Eye, Cpu, Globe, Radio, Brain, AlertCircle, XCircle, Layers, Crosshair } from 'lucide-react'

const PAPER_API = 'http://localhost:3002'
const GLOBAL_API = 'http://localhost:3001'

const fmt$ = (v) => {
  const n = N(v)
  const prefix = n >= 0 ? '+' : '-'
  return prefix + '$' + Math.abs(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

const fmtPct = (v) => {
  const n = N(v)
  return (n >= 0 ? '+' : '') + n.toFixed(2) + '%'
}

// Helper: format duration from minutes to human readable
const fmtDuration = (minutes) => {
  if (!minutes || minutes <= 0) return '—'
  const hrs = Math.floor(minutes / 60)
  const mins = Math.floor(minutes % 60)
  if (hrs > 0) return `${hrs}h ${mins}m`
  return `${mins}m`
}

// Helper: calculate time remaining until expiration/target
const fmtTimeRemaining = (targetDate) => {
  if (!targetDate) return '—'
  const target = new Date(targetDate)
  const now = new Date()
  const diffMs = target - now
  if (diffMs <= 0) return 'Expired'
  const diffMins = Math.floor(diffMs / 60000)
  const diffHrs = Math.floor(diffMins / 60)
  const days = Math.floor(diffHrs / 24)
  const hrs = diffHrs % 24
  const mins = diffMins % 60
  if (days > 0) return `${days}d ${hrs}h remaining`
  if (hrs > 0) return `${hrs}h ${mins}m remaining`
  return `${mins}m remaining`
}

// Helper: get duration color based on time remaining
const getTimeColor = (targetDate) => {
  if (!targetDate) return 'text-zinc-500'
  const target = new Date(targetDate)
  const now = new Date()
  const diffMs = target - now
  const diffHrs = diffMs / 3600000
  if (diffMs <= 0) return 'text-red-400'
  if (diffHrs <= 24) return 'text-amber-400'
  if (diffHrs <= 72) return 'text-yellow-400'
  return 'text-emerald-400'
}

// Helper: check US market hours (9:30AM-4PM ET)
const getMarketStatus = (globalData) => {
  if (!globalData || !globalData.coverage) return { open: false, label: 'Global data unavailable' }
  const currentlyOpen = globalData.coverage.currently_open || 0
  if (currentlyOpen > 0) return { open: true, label: `${currentlyOpen} exchange${currentlyOpen !== 1 ? 's' : ''} active` }
  
  // Fallback to US market hours if no global markets are open or data is missing
  const now = new Date()
  const localTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/Los_Angeles' }))
  const h = localTime.getHours()
  const m = localTime.getMinutes()
  const day = localTime.getDay()
  const mins = h * 60 + m
  if (day === 0 || day === 6) return { open: false, label: 'Markets closed - signals resume at next open' }
  if (mins < 570) return { open: false, label: 'Markets closed - signals resume at next open' } // before 9:30 ET
  if (mins >= 960) return { open: false, label: 'Markets closed - signals resume at next open' } // after 4:00 ET
  return { open: true, label: 'US markets open' }
}

// Helper to get a dynamic status message for the header
const getDynamicStatusMessage = (globalData, activeStatuses, activeStatusIdx) => {
  if (!globalData || !globalData.coverage) return activeStatuses[activeStatusIdx] // Fallback
  const openExchanges = (globalData.exchanges || []).filter(ex => ex.is_open).map(ex => ex.code)
  if (openExchanges.length > 0) {
    return `Active: ${openExchanges.join(', ')}`
  }
  return activeStatuses[activeStatusIdx]
}

const statusBadge = {
  VALIDATED: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-emerald-500/10 shadow-sm',
  TESTING: 'bg-amber-500/15 text-amber-400 border border-amber-500/30',
  ACTIVE: 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30',
  PAUSED: 'bg-zinc-500/15 text-zinc-400 border border-zinc-500/30',
  STOPPED: 'bg-red-500/15 text-red-400 border border-red-500/30',
}

const typeIcons = {
  momentum: { color: 'text-cyan-400 bg-cyan-500/10', icon: '⚡', desc: 'Rides strong price trends — buys strength, sells weakness' },
  breakout: { color: 'text-orange-400 bg-orange-500/10', icon: '🔥', desc: 'Catches explosive moves when price breaks key levels' },
  mean_reversion: { color: 'text-violet-400 bg-violet-500/10', icon: '🔄', desc: 'Bets on prices snapping back to average after extremes' },
  scalping: { color: 'text-emerald-400 bg-emerald-500/10', icon: '⚔️', desc: 'Ultra-fast trades capturing tiny price moves (minutes)' },
  pairs: { color: 'text-blue-400 bg-blue-500/10', icon: '🔗', desc: 'Trades two correlated assets when they diverge' },
  options: { color: 'text-yellow-400 bg-yellow-500/10', icon: '📊', desc: 'Options contracts — calls, puts, spreads' },
  short: { color: 'text-red-400 bg-red-500/10', icon: '📉', desc: 'Profits from falling prices — borrows and sells high' },
  custom: { color: 'text-pink-400 bg-pink-500/10', icon: '🧠', desc: 'AI-designed hybrid strategy' },
}

const GlowCard = ({ children, className = '', glow = '' }) => (
  <div className={`relative rounded-2xl bg-[#0a0a0f]/80 border border-white/[0.06] backdrop-blur-sm ${className}`}>
    {glow && <div className={`absolute inset-0 rounded-2xl ${glow} blur-xl opacity-30 -z-10`} />}
    {children}
  </div>
)

const MetricCard = ({ label, value, sub, color = 'text-white', icon: Icon, progress, progressTarget, tooltip, onClick, expandable }) => (
  <div
    className={`p-4 rounded-xl bg-black/40 border border-white/[0.04] hover:border-white/[0.08] transition-all duration-300 group relative ${expandable ? 'cursor-pointer hover:bg-white/[0.02]' : ''}`}
    onClick={onClick}
  >
    <div className="flex items-center justify-between mb-1">
      <span className="text-[11px] uppercase tracking-wider text-zinc-500 font-medium">{label}</span>
      <div className="flex items-center gap-1">
        {expandable && <ChevronDown className="w-3 h-3 text-zinc-700 group-hover:text-zinc-400 transition-colors" />}
        {Icon && <Icon className="w-3.5 h-3.5 text-zinc-600 group-hover:text-zinc-400 transition-colors" />}
      </div>
    </div>
    <div className={`text-2xl font-bold tracking-tight ${color}`}>{value}</div>
    {progress !== undefined && (
      <div className="mt-2 h-1 bg-zinc-800/80 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-1000 ${N(progress) >= 100 ? 'bg-emerald-500' : N(progress) >= 66 ? 'bg-cyan-500' : 'bg-amber-500'}`} style={{ width: Math.min(100, N(progress)) + '%' }} />
      </div>
    )}
    {sub && <div className="text-[11px] text-zinc-600 mt-1">{sub}</div>}
    {tooltip && (
      <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-3 py-2 rounded-xl bg-zinc-900/95 backdrop-blur border border-white/[0.08] shadow-2xl text-[11px] text-zinc-300 w-56 text-left opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-200 z-50 leading-relaxed">
        {tooltip}
      </div>
    )}
  </div>
)

// ── Sparkline — mini inline trend chart ──
const Sparkline = ({ data, width = 120, height = 32, color = '#22d3ee' }) => {
  if (!data || data.length < 2) return null
  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width
    const y = height - ((v - min) / range) * (height - 4) - 2
    return `${x},${y}`
  }).join(' ')
  const lastVal = data[data.length - 1]
  const firstVal = data[0]
  const lineColor = lastVal >= firstVal ? '#34d399' : '#f87171'
  return (
    <svg width={width} height={height} className="overflow-visible">
      <polyline points={points} fill="none" stroke={lineColor} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={(data.length - 1) / (data.length - 1) * width} cy={height - ((lastVal - min) / range) * (height - 4) - 2} r="2.5" fill={lineColor} />
    </svg>
  )
}

// ── Trend Detail Panel — expandable metric deep-dive ──
const TrendPanel = ({ title, isOpen, onClose, children }) => {
  if (!isOpen) return null
  return (
    <div className="col-span-full mt-1 mb-2 p-5 rounded-xl bg-black/60 border border-white/[0.06] backdrop-blur-xl animate-in slide-in-from-top-2 duration-300">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-sm font-bold text-zinc-200">{title}</h4>
        <button onClick={onClose} className="p-1 rounded-lg hover:bg-white/[0.06] transition-colors">
          <XCircle className="w-4 h-4 text-zinc-500" />
        </button>
      </div>
      {children}
    </div>
  )
}

// ── Cumulative P&L Area Chart ──
const PnLChart = ({ data, height = 200, trades = [] }) => {
  // Build chart data — use hourly from trades if only 1 day of daily data
  let chartData = []
  if (data && data.length > 1) {
    let cum = 0
    chartData = data.map(d => {
      cum += N(d.pnl || d.daily_pnl)
      return { label: d.date, value: N(d.pnl || d.daily_pnl), cum, daily: N(d.pnl || d.daily_pnl) }
    })
  } else if (trades && trades.length > 0) {
    // Build hourly cumulative from trades
    const hourly = {}
    for (const t of trades) {
      const et = t.exit_time || t.entry_time || ''
      const hr = et.substring(11, 13) || '00'
      hourly[hr] = (hourly[hr] || 0) + N(t.pnl)
    }
    let cum = 0
    for (const hr of Object.keys(hourly).sort()) {
      cum += hourly[hr]
      chartData.push({ label: `${hr}:00`, value: hourly[hr], cum, daily: hourly[hr] })
    }
  } else if (data && data.length === 1) {
    const val = N(data[0].pnl || data[0].daily_pnl)
    chartData = [
      { label: 'Start', value: 0, cum: 0, daily: 0 },
      { label: data[0].date, value: val, cum: val, daily: val }
    ]
  }

  if (chartData.length === 0) return null

  const values = chartData.map(d => d.cum)
  const min = Math.min(...values, 0)
  const max = Math.max(...values, 1)
  const range = max - min || 1
  const pad = 24
  const w = 600
  const h = height
  const chartW = w - pad * 2
  const chartH = h - pad * 2

  const zeroY = pad + chartH - ((-min) / range) * chartH

  const points = chartData.map((d, i) => ({
    x: pad + (i / Math.max(chartData.length - 1, 1)) * chartW,
    y: pad + chartH - ((d.cum - min) / range) * chartH,
    ...d
  }))

  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
  const areaD = pathD + ` L ${points[points.length - 1].x} ${zeroY} L ${points[0].x} ${zeroY} Z`
  const finalVal = values[values.length - 1]
  
  const lineColor = finalVal >= 0 ? '#06b6d4' : '#f43f5e'
  const lineColorBright = finalVal >= 0 ? '#22d3ee' : '#fb7185'
  const fillId = `pnl-grad-${finalVal >= 0 ? 'up' : 'down'}`

  return (
    <div className="relative w-full rounded-xl bg-black/40 border border-white/[0.04] p-3" style={{ height: height + 24 }}>
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-full">
        <defs>
          <linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={lineColor} stopOpacity="0.3" />
            <stop offset="100%" stopColor={lineColor} stopOpacity="0.02" />
          </linearGradient>
          <filter id="chartGlow">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map(pct => {
          const y = pad + pct * chartH
          return <line key={pct} x1={pad} y1={y} x2={w - pad} y2={y} stroke="rgba(255,255,255,0.04)" strokeWidth="0.5" />
        })}

        {/* Zero line */}
        <line x1={pad} y1={zeroY} x2={w - pad} y2={zeroY} stroke="rgba(255,255,255,0.12)" strokeWidth="0.8" strokeDasharray="4,4" />
        <text x={pad - 4} y={zeroY + 3} textAnchor="end" fill="rgba(255,255,255,0.25)" fontSize="9">$0</text>

        {/* Area fill */}
        <path d={areaD} fill={`url(#${fillId})`} />

        {/* Glow line */}
        <path d={pathD} fill="none" stroke={lineColor} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" opacity="0.3" filter="url(#chartGlow)" />
        
        {/* Main line */}
        <path d={pathD} fill="none" stroke={lineColorBright} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

        {/* Data points */}
        {points.map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r="4" fill="transparent" className="hover:fill-white/20 cursor-pointer" />
            {i === points.length - 1 && (
              <>
                <circle cx={p.x} cy={p.y} r="5" fill={lineColor} opacity="0.3">
                  <animate attributeName="r" values="5;8;5" dur="2s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.3;0.1;0.3" dur="2s" repeatCount="indefinite" />
                </circle>
                <circle cx={p.x} cy={p.y} r="3.5" fill={lineColorBright} stroke="#0a0a0f" strokeWidth="1.5" />
              </>
            )}
          </g>
        ))}

        {/* Y-axis labels */}
        <text x={pad - 4} y={pad + 4} textAnchor="end" fill="rgba(255,255,255,0.3)" fontSize="9">{fmt$(max)}</text>
        <text x={pad - 4} y={pad + chartH + 4} textAnchor="end" fill="rgba(255,255,255,0.3)" fontSize="9">{fmt$(min)}</text>

        {/* X-axis labels */}
        {points.filter((_, i) => i === 0 || i === points.length - 1 || i % Math.max(1, Math.floor(points.length / 5)) === 0).map((p, i) => (
          <text key={i} x={p.x} y={h - 2} textAnchor="middle" fill="rgba(255,255,255,0.25)" fontSize="8">{p.label}</text>
        ))}

        {/* Current value label */}
        <text x={points[points.length - 1].x + 8} y={points[points.length - 1].y + 4} fill={lineColorBright} fontSize="11" fontWeight="bold">
          {fmt$(finalVal)}
        </text>
      </svg>

      {/* Hover overlay */}
      <div className="absolute inset-0 flex p-3" style={{ paddingLeft: pad + 12, paddingRight: pad + 12 }}>
        {points.map((p, i) => (
          <div key={i} className="flex-1 relative group cursor-crosshair">
            <div className="absolute hidden group-hover:block z-30 px-3 py-2 rounded-lg bg-zinc-900/95 border border-white/10 shadow-2xl text-[11px] whitespace-nowrap left-1/2 -translate-x-1/2 bottom-[60%]">
              <div className="text-zinc-400 font-medium">{p.label}</div>
              <div className={`font-bold text-sm ${p.cum >= 0 ? 'text-cyan-400' : 'text-rose-400'}`}>
                {fmt$(p.cum)}
              </div>
              <div className={`text-[10px] ${p.daily >= 0 ? 'text-emerald-400/80' : 'text-red-400/80'}`}>
                {p.daily >= 0 ? '↑' : '↓'} {fmt$(p.daily)} this period
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Collapsible Section Wrapper ──
const CollapsibleSection = ({ id, title, subtitle, icon: Icon, iconColor = 'text-cyan-400', iconBg = 'bg-cyan-500/10 border-cyan-500/20', glow, badge, badgeColor, isOpen, onToggle, children }) => (
  <div id={`section-${id}`} data-section={id}>
    <GlowCard glow={isOpen ? glow : ''} className={`transition-all duration-300 ${isOpen ? 'p-5 md:p-6' : 'p-4'}`}>
      <button onClick={() => onToggle(id)} className="w-full flex items-center justify-between group">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-xl bg-gradient-to-br ${iconBg} border`}>
            <Icon className={`w-5 h-5 ${iconColor}`} />
          </div>
          <div className="text-left">
            <h3 className="text-lg font-bold tracking-tight">{title}</h3>
            {subtitle && <p className="text-[11px] text-zinc-500">{subtitle}</p>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {badge && <span className={`text-[10px] px-2 py-1 rounded-lg font-medium border ${badgeColor || 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20'}`}>{badge}</span>}
          <div className={`p-1.5 rounded-lg transition-all duration-300 group-hover:bg-white/[0.06] ${isOpen ? 'rotate-180' : ''}`}>
            <ChevronDown className="w-4 h-4 text-zinc-500 group-hover:text-zinc-300 transition-colors" />
          </div>
        </div>
      </button>
      <div className={`overflow-hidden transition-all duration-500 ease-in-out ${isOpen ? 'max-h-[5000px] opacity-100 mt-5' : 'max-h-0 opacity-0 mt-0'}`}>
        {isOpen && children}
      </div>
    </GlowCard>
  </div>
)

// ── Section Nav Pills ──
const SECTIONS = [
  { id: 'score', label: 'Score', icon: '⚡' },
  { id: 'live', label: 'Live', icon: '🧠' },
  { id: 'intel', label: 'Intel', icon: '🔮' },
  { id: 'strategies', label: 'Strategies', icon: '🏆' },
  { id: 'daytrading', label: 'Day Trading', icon: '⚔️' },
  { id: 'crypto', label: 'Crypto', icon: '₿' },
  { id: 'commodity', label: 'Oil & Gas', icon: '🛢️' },
  { id: 'options', label: 'Options', icon: '📊' },
  { id: 'positions', label: 'Positions', icon: '👁️' },
  { id: 'global', label: 'Global', icon: '🌍' },
  { id: 'pnl', label: 'P&L', icon: '💰' },
]

const SectionNav = ({ activeSection, openSections, onJump }) => (
  <div className="sticky top-14 z-40 border-b border-white/[0.04] bg-[#030305]/90 backdrop-blur-xl">
    <div className="max-w-[1600px] mx-auto px-6 py-2 flex items-center gap-1.5 overflow-x-auto scrollbar-hide">
      {SECTIONS.map(s => (
        <button
          key={s.id}
          onClick={() => onJump(s.id)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all duration-200 border ${
            activeSection === s.id
              ? 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30 shadow-cyan-500/10 shadow-sm'
              : openSections[s.id]
                ? 'bg-white/[0.04] text-zinc-300 border-white/[0.06] hover:bg-white/[0.06]'
                : 'bg-transparent text-zinc-600 border-transparent hover:text-zinc-400 hover:bg-white/[0.03]'
          }`}
        >
          <span className="text-[11px]">{s.icon}</span>
          {s.label}
        </button>
      ))}
    </div>
  </div>
)

// ── Display helper: show dash for empty/null values ──
const D = (v, formatter) => {
  if (v === null || v === undefined || v === '' || (typeof v === 'number' && isNaN(v))) return '—'
  const n = Number(v)
  if (typeof v === 'number' && n === 0) return formatter ? formatter(0) : '0'
  if (formatter) return formatter(n)
  return v
}

const RankBadge = ({ rank }) => {
  const styles = {
    1: 'bg-gradient-to-br from-yellow-500/30 to-yellow-600/10 text-yellow-400 border-yellow-500/30 shadow-yellow-500/20 shadow-lg',
    2: 'bg-gradient-to-br from-zinc-400/20 to-zinc-500/10 text-zinc-300 border-zinc-400/20',
    3: 'bg-gradient-to-br from-orange-500/20 to-orange-600/10 text-orange-400 border-orange-500/20',
  }
  return (
    <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-black border ${styles[rank] || 'bg-white/[0.03] text-zinc-500 border-white/[0.04]'}`}>
      {rank <= 3 ? ['🥇','🥈','🥉'][rank-1] : `#${rank}`}
    </div>
  )
}

export default function PaperTradingDashboard() {
  const [data, setData] = useState({ accuracy: null, leaderboard: [], positions: [], trades: [], dailyPnl: [], status: null })
  const [intel, setIntel] = useState(null)
  const [marketIntel, setMarketIntel] = useState(null)
  const [rTotal, setRTotal] = useState(null)
  const [score, setScore] = useState(null)  // consolidated sygnl-score
  const [globalData, setGlobalData] = useState(null)
  const [expanded, setExpanded] = useState(null)
  const [pnlPeriod, setPnlPeriod] = useState('month')
  const [detail, setDetail] = useState(null)
  const [online, setOnline] = useState(false)
  const [loading, setLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState(null)
  const [pulse, setPulse] = useState(false)
  const [optionsData, setOptionsData] = useState(null)
  const [dayTrading, setDayTrading] = useState(null)
  const [dayTradingPerf, setDayTradingPerf] = useState(null)
  const [activeStatusIdx, setActiveStatusIdx] = useState(0)
  const [greeksData, setGreeksData] = useState(null)
  const [tickerSpeed, setTickerSpeed] = useState(480) // seconds per cycle
  const [brainFilter, setBrainFilter] = useState({ direction: 'all', strategy: 'all', search: '' })
  const [riskData, setRiskData] = useState(null)
  const [categoryData, setCategoryData] = useState(null)
  const [deployGate, setDeployGate] = useState(null)
  const [systemState, setSystemState] = useState(null)
  const [gateOn, setGateOn] = useState(false)
  const [simData, setSimData] = useState(null)
  const [activeSection, setActiveSection] = useState('score')
  const [openSections, setOpenSections] = useState({
    score: true,
    live: true,
    intel: false,
    strategies: true,
    daytrading: false,
    crypto: false,
    commodity: true,
    options: false,
    positions: false,
    global: false,
    pnl: true,
  })
  const sectionRefs = useRef({})

  const toggleSection = (id) => {
    setOpenSections(prev => ({ ...prev, [id]: !prev[id] }))
  }

  const jumpToSection = (id) => {
    setOpenSections(prev => ({ ...prev, [id]: true }))
    setActiveSection(id)
    if (id === 'score') setHeroExpanded(true)
    setTimeout(() => {
      const el = document.getElementById(`section-${id}`)
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 100)
  }

  // Intersection observer for active section tracking
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.dataset.section)
          }
        })
      },
      { rootMargin: '-100px 0px -60% 0px', threshold: 0.1 }
    )
    SECTIONS.forEach(s => {
      const el = document.getElementById(`section-${s.id}`)
      if (el) observer.observe(el)
    })
    return () => observer.disconnect()
  }, [loading])
  const [expandedMetric, setExpandedMetric] = useState(null) // 'score' | 'winrate' | 'pnl' | 'positions' | 'capital'
  const [heroExpanded, setHeroExpanded] = useState(false)
  const activeStatuses = ['Monitoring Markets', 'Scanning Signals', 'Tracking Positions', 'Analyzing Patterns', 'Evaluating Risk']

  const fetchAll = useCallback(async () => {
    setPulse(true)
    try {
      // Fetch live data directly from Python backend APIs
      const rTotalRes = await fetch('http://localhost:3001/api/r-total', { cache: 'no-store' }).catch(() => null)
      const statusRes = await fetch('http://localhost:3002/api/status', { cache: 'no-store' }).catch(() => null)
      const positionsRes = await fetch('http://localhost:3002/api/positions', { cache: 'no-store' }).catch(() => null)
      const leaderboardRes = await fetch('http://localhost:3002/api/leaderboard', { cache: 'no-store' }).catch(() => null)
      const paperTradingRes = await fetch('http://localhost:3002/api/paper-trading', { cache: 'no-store' }).catch(() => null)
      const accountRes = await fetch('http://localhost:3002/api/account', { cache: 'no-store' }).catch(() => null)
      const greeksRes = await fetch('http://localhost:3001/api/options-greeks', { cache: 'no-store' }).catch(() => null)
      const marketIntelRes = await fetch('http://localhost:3002/api/market-intel', { cache: 'no-store' }).catch(() => null)
      
      const rTotal = rTotalRes?.ok ? await rTotalRes.json() : null
      const status = statusRes?.ok ? await statusRes.json() : null
      const positionsData = positionsRes?.ok ? await positionsRes.json() : null
      const leaderboardData = leaderboardRes?.ok ? await leaderboardRes.json() : null
      const paperTrading = paperTradingRes?.ok ? await paperTradingRes.json() : null
      const accountData = accountRes?.ok ? await accountRes.json() : null
      const greeksData = greeksRes?.ok ? await greeksRes.json() : null
      
      if (rTotal) {
        setRTotal({
          r_total: rTotal.r_total,
          components: rTotal.components,
          total_pnl: rTotal.realized_pnl || rTotal.total_pnl,  // Use realized_pnl for accuracy
          realized_pnl: rTotal.realized_pnl,
          unrealized_pnl: rTotal.unrealized_pnl,
          trade_count: rTotal.trades_count || rTotal.trade_count,
          win_rate: rTotal.validation_metrics?.win_rate,
          label: rTotal.label,
          status: 'ok'
        })
      }
      
      if (status || positionsData || leaderboardData || paperTrading) {
        setData({
          status: status || {},
          positions: positionsData?.positions || status?.positions || [],
          leaderboard: leaderboardData?.leaderboard || [],
          trades: status?.trades || []
        })
      }
      
      setGreeksData(greeksData)
      const mktIntel = marketIntelRes?.ok ? await marketIntelRes.json() : null
      if (mktIntel) setMarketIntel(mktIntel)
      setOnline(rTotal && status ? true : false)
      setLastUpdate(new Date())
    } catch (e) {
      console.error('Fetch failed:', e)
      setOnline(false)
    }
    setLoading(false)
    setTimeout(() => setPulse(false), 600)
  }, [])

  const fetchDetail = async (name) => {
    try {
      const res = await fetch(`${PAPER_API}/api/strategy/${name}`)
      if (res.ok) setDetail(await res.json())
    } catch {}
  }

  // Update interval for all data fetches (reduced for more real-time feel)
  useEffect(() => { fetchAll(); const i = setInterval(fetchAll, 5000); return () => clearInterval(i) }, [fetchAll])
  useEffect(() => { const i = setInterval(() => setActiveStatusIdx(p => (p + 1) % activeStatuses.length), 3000); return () => clearInterval(i) }, [activeStatuses.length])

  useEffect(() => {
    if (!expanded) return
    const i = setInterval(() => fetchDetail(expanded), 15000)
    return () => clearInterval(i)
  }, [expanded])

  const toggle = (name) => {
    if (expanded === name) { setExpanded(null); setDetail(null) }
    else { setExpanded(name); fetchDetail(name) }
  }

  const { accuracy: acc, leaderboard: lb, positions: pos, trades, dailyPnl } = data
  
  // Use database-accurate P&L from rTotal endpoint (realized) + positions (unrealized)
  // Fallback to leaderboard calculation if rTotal unavailable
  const totalRealized = rTotal?.realized_pnl ?? lb.reduce((s, x) => s + N(x.total_pnl), 0)
  const totalUnrealized = rTotal?.unrealized_pnl ?? pos.reduce((acc, p) => acc + N(p.unrealized_pnl), 0)
  
  const totalPnl = totalRealized + totalUnrealized
  const totalTrades = rTotal?.trade_count ?? lb.reduce((s, x) => s + N(x.total_trades), 0)
  
  // Unrealized P&L per strategy (from open positions) - for breakdown only
  const unrealizedByStrategy = pos.reduce((acc, p) => {
    const key = p.strategy || p.strategy_name || ''
    acc[key] = (acc[key] || 0) + N(p.unrealized_pnl)
    return acc
  }, {})
  // Capital = actual money in positions + available cash
  const capitalDeployed = pos.reduce((s, p) => s + Math.abs(N(p.market_value || (N(p.quantity) * N(p.entry_price)))), 0)
  const totalCash = lb.reduce((s, x) => s + N(x.current_cash || 0), 0)
  const totalCapital = capitalDeployed + totalCash
  const freeCapital = totalCash
  const utilization = totalCapital > 0 ? (capitalDeployed / totalCapital * 100) : 0

  // LIVE vs PAPER mode — LIVE shows zeros (no real capital deployed yet)
  const isLive = systemState?.mode === 'LIVE'
  const V = (v) => isLive ? 0 : v  // Value wrapper — zeroes in live mode
  const VA = (arr) => isLive ? [] : arr  // Array wrapper — empty in live mode

  // Issue 4: Compute daily P&L from trades if dailyPnl is empty
  const effectiveDailyPnl = (() => {
    if (dailyPnl && dailyPnl.length > 0) return dailyPnl
    if (!trades || !Array.isArray(trades) || trades.length === 0) return []
    const byDay = {}
    trades.forEach(t => {
      const date = (t.exit_time || t.close_time || t.timestamp || '').slice(0, 10)
      if (!date) return
      byDay[date] = (byDay[date] || 0) + N(t.pnl)
    })
    return Object.entries(byDay).sort((a, b) => a[0].localeCompare(b[0])).map(([date, pnl]) => ({ date, pnl }))
  })()

  const statusData = data.status || {}
  const normalizeWinRate = (value) => {
    const n = N(value)
    return n > 1 ? n : n * 100
  }
  const cleanCryptoStrategyName = (name = '') => name.replace(/^(Crypto_|Forex_|Meme_|Fear_Greed_)/, '').replace(/_/g, ' ').trim()
  const fmtAssetPrice = (value, symbol = '') => {
    const digits = String(symbol).endsWith('=X') ? 4 : 2
    return '$' + N(value).toLocaleString(undefined, { minimumFractionDigits: digits, maximumFractionDigits: digits })
  }

  const cryptoStrategies = (Array.isArray(statusData?.strategies) ? statusData.strategies : [])
    .filter((strategy) => {
      const name = strategy.strategy_name || strategy.strategy || strategy.name || ''
      return name.includes('Crypto_') || name.includes('Forex_') || name.includes('Meme_') || name.includes('Fear_Greed_')
    })
    .map((strategy) => {
      const rawName = strategy.strategy_name || strategy.strategy || strategy.name || ''
      const metrics = strategy.metrics || {}
      const tradesCount = N(strategy.total_trades ?? metrics.trade_count)
      const totalPnl = N(strategy.total_pnl ?? strategy.unrealized_pnl)
      const winRate = normalizeWinRate(metrics.win_rate ?? strategy.win_rate)
      const avgPnl = N(metrics.avg_pnl ?? metrics.avg_pnl_per_trade ?? strategy.avg_pnl ?? strategy.avg_pnl_per_trade)
      const capital = N(strategy.starting_capital || strategy.current_cash)
      const status = String(strategy.status || '').toUpperCase()
      const isEnabled = strategy.enabled ?? strategy.is_enabled ?? strategy.active ?? (status ? !['DISABLED', 'PAUSED', 'STOPPED'].includes(status) : true)
      return {
        ...strategy,
        rawName,
        displayName: cleanCryptoStrategyName(rawName),
        tradesCount,
        totalPnl,
        winRate,
        avgPnl,
        capital,
        isEnabled,
      }
    })

  const cryptoStrategiesSorted = [...cryptoStrategies].sort((a, b) => b.totalPnl - a.totalPnl)
  const cryptoPositions = (Array.isArray(pos) ? pos : []).filter((position) => {
    const symbol = String(position.symbol || '')
    return symbol.endsWith('-USD') || symbol.endsWith('=X')
  })
  const cryptoTotalPnl = cryptoStrategies.reduce((sum, strategy) => sum + strategy.totalPnl, 0)
  const cryptoWeightedTrades = cryptoStrategies.reduce((sum, strategy) => sum + strategy.tradesCount, 0)
  const cryptoWinRate = cryptoWeightedTrades > 0
    ? cryptoStrategies.reduce((sum, strategy) => sum + (strategy.winRate * strategy.tradesCount), 0) / cryptoWeightedTrades
    : 0
  const cryptoBestStrategy = cryptoStrategiesSorted[0] || null

  // ── Oil & Gas / Commodity data ─────────────────────────────────────────
  const _OIL_GAS_ETF = new Set(['XLE','XOP','OIH','USO','UCO','DBO','BNO','DRLL'])
  const _OIL_GAS_EQ  = new Set(['XOM','CVX','SHEL','BP','TTE','COP','EOG','DVN','OXY','APA','MRO','CTRA','FANG','LNG','AR','EQT','RRC','MPC','VLO','PSX','DK','SLB','HAL','BKR','NOV','WHD','ET','EPD','WMB','MPLX','PAA'])
  const _AIRLINES    = new Set(['UAL','DAL','AAL','LUV','JBLU','SAVE','JETS'])
  const commodityStrategies = (Array.isArray(statusData?.strategies) ? statusData.strategies : [])
    .filter(s => {
      const n = (s.name || s.strategy_name || '')
      return n.includes('Commodity_') || n.includes('Oil_Sector')
    })
  const commodityPositions = (Array.isArray(pos) ? pos : []).filter(p => {
    const sym = (p.symbol || '').toUpperCase()
    return _OIL_GAS_ETF.has(sym) || _OIL_GAS_EQ.has(sym) || _AIRLINES.has(sym)
  })
  const commodityTotalPnl = commodityStrategies.reduce((sum, s) => sum + (s.totalPnl || 0), 0)
  const commodityTrades = commodityStrategies.reduce((sum, s) => sum + (s.tradesCount || 0), 0)
  const commodityWR = commodityTrades > 0
    ? commodityStrategies.reduce((sum, s) => sum + ((s.winRate || 0) * (s.tradesCount || 0)), 0) / commodityTrades
    : 0
  const _OIL_WATCH = [
    { sym: 'USO',  label: 'Crude (USO)',  emoji: '🛢️' },
    { sym: 'XLE',  label: 'Energy ETF',   emoji: '⚡' },
    { sym: 'XOP',  label: 'E&P Pure Play',emoji: '⛏️' },
    { sym: 'XOM',  label: 'ExxonMobil',   emoji: '🏭' },
    { sym: 'CVX',  label: 'Chevron',       emoji: '🏭' },
    { sym: 'OXY',  label: 'Occidental',   emoji: '🏭' },
    { sym: 'UAL',  label: 'United (Short)',emoji: '✈️' },
    { sym: 'DAL',  label: 'Delta (Short)', emoji: '✈️' },
  ]

  return (
    <div className="min-h-screen bg-[#030305] text-white antialiased selection:bg-cyan-500/30">
      {/* Ambient glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 left-1/3 w-[600px] h-[600px] bg-cyan-500/[0.04] rounded-full blur-[160px]" />
        <div className="absolute -bottom-40 right-1/4 w-[500px] h-[500px] bg-violet-500/[0.04] rounded-full blur-[140px]" />
        <div className="absolute top-1/2 left-0 w-[300px] h-[400px] bg-emerald-500/[0.02] rounded-full blur-[120px]" />
      </div>

      {/* Sticky Header */}
      <header className="sticky top-0 z-50 border-b border-white/[0.04] bg-[#030305]/80 backdrop-blur-2xl">
        <div className="max-w-[1600px] mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Cpu className="w-5 h-5 text-cyan-400" />
              <h1 className="text-lg font-bold tracking-tight">
                <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-violet-400 bg-clip-text text-transparent">SYGNL</span>
                <span className="text-zinc-400 font-medium ml-2">Paper Trading</span>
              </h1>
            </div>
            <div className="hidden md:flex items-center gap-1.5 ml-3 px-2.5 py-1 rounded-lg bg-white/[0.03]">
              <span className="text-[10px] text-zinc-500">{new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</span>
            </div>
            <div className="hidden md:flex items-center gap-2 ml-3 px-3 py-1.5 rounded-full bg-gradient-to-r from-cyan-500/[0.08] to-violet-500/[0.08] border border-cyan-500/20">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-60" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-cyan-500" />
              </span>
              <span className="text-[10px] font-bold tracking-wider text-cyan-400">24/7 ACTIVE</span>
              <span className="text-[10px] text-zinc-500">·</span>
              <span className="text-[10px] text-zinc-400 min-w-[110px] transition-all duration-500">{getDynamicStatusMessage(globalData, activeStatuses, activeStatusIdx)}</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* ═══ LIVE / PAPER TOGGLE ═══ */}
            <div className="flex items-center bg-white/[0.04] rounded-full border border-white/[0.06] p-0.5">
              <button 
                onClick={async () => {
                  try {
                    const r = await fetch(`${GLOBAL_API}/api/system-state`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ mode: 'PAPER' }) })
                    if (r.ok) { const s = await r.json(); setSystemState(s); }
                  } catch {}
                }}
                className={`px-3.5 py-1.5 rounded-full text-[11px] font-bold tracking-wider transition-all duration-300 ${
                  systemState?.mode !== 'LIVE' 
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30 shadow-lg shadow-amber-500/10' 
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                🟡 PAPER
              </button>
              <button 
                onClick={async () => {
                  try {
                    const r = await fetch(`${GLOBAL_API}/api/system-state`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ mode: 'LIVE' }) })
                    if (r.ok) { const s = await r.json(); setSystemState(s); }
                  } catch {}
                }}
                className={`px-3.5 py-1.5 rounded-full text-[11px] font-bold tracking-wider transition-all duration-300 ${
                  systemState?.mode === 'LIVE' 
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-lg shadow-emerald-500/10' 
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                🟢 LIVE
              </button>
            </div>

            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition-all duration-500 ${online ? 'bg-emerald-500/[0.08] border border-emerald-500/20' : 'bg-red-500/[0.08] border border-red-500/20'}`}>
              <span className="relative flex h-2 w-2">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-60 ${online ? 'bg-emerald-400' : 'bg-red-400'}`} />
                <span className={`relative inline-flex rounded-full h-2 w-2 ${online ? 'bg-emerald-500' : 'bg-red-500'}`} />
              </span>
              <span className={`text-xs font-semibold tracking-wide ${online ? 'text-emerald-400' : 'text-red-400'}`}>
                {online ? (systemState?.mode === 'LIVE' ? 'LIVE' : 'CONNECTED') : 'CONNECTING...'}
              </span>
            </div>
            <button onClick={fetchAll} className={`p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.04] transition-all ${pulse ? 'animate-spin' : ''}`}>
              <RefreshCw className="w-4 h-4 text-zinc-400" />
            </button>
            <a href="/dashboard" className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors">← Dashboard</a>
            <a href="/v2" className="text-xs text-amber-500 hover:text-amber-400 transition-colors font-medium">⚡ v2</a>
          </div>
        </div>
      </header>

      <SectionNav activeSection={activeSection} openSections={openSections} onJump={jumpToSection} />

      <main className="relative z-10 max-w-[1600px] mx-auto px-6 py-8 space-y-6">

        {/* ═══ SYSTEM MODE BANNER — Truth about what mode we're in ═══ */}
        {systemState && (
          <div className={`rounded-2xl border px-5 py-3 flex items-center justify-between ${
            systemState.mode === 'LIVE' 
              ? 'bg-emerald-500/[0.06] border-emerald-500/20' 
              : 'bg-amber-500/[0.06] border-amber-500/20'
          }`}>
            <div className="flex items-center gap-4">
              <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold tracking-widest ${
                systemState.mode === 'LIVE'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
              }`}>
                <span className="relative flex h-2 w-2">
                  <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-60 ${
                    systemState.mode === 'LIVE' ? 'bg-emerald-400' : 'bg-amber-400'
                  }`} />
                  <span className={`relative inline-flex rounded-full h-2 w-2 ${
                    systemState.mode === 'LIVE' ? 'bg-emerald-500' : 'bg-amber-500'
                  }`} />
                </span>
                {systemState.mode === 'LIVE' ? '🟢 LIVE TRADING — No capital deployed yet' : '🟡 PAPER MODE'}
              </div>
              <span className="text-xs text-zinc-400">{systemState.mode_description}</span>
            </div>
            <div className="flex items-center gap-4 text-[11px] text-zinc-500">
              {systemState.active_strategies != null && (
                <span>
                  <span className="text-zinc-300 font-semibold">{systemState.active_strategies}</span> active / 
                  <span className="text-red-400 font-semibold"> {systemState.halted_strategies}</span> halted
                </span>
              )}
              {systemState.deploy_override && (
                <span className="text-red-400 font-bold animate-pulse">⚠️ OVERRIDE ACTIVE</span>
              )}
              {!systemState.live_ready && systemState.live_blockers?.length > 0 && (
                <span className="text-zinc-500" title={systemState.live_blockers.join('\n')}>
                  {systemState.live_blockers.length} blockers to live
                </span>
              )}
            </div>
          </div>
        )}

        {/* ═══ HERO BANNER — Capital Deployed + Total Gains ═══ */}
        <div id="section-score" data-section="score">
        <GlowCard glow="bg-gradient-to-r from-cyan-500/20 to-violet-500/20" className="p-6">
          {/* Big numbers */}
          <div
            className="flex items-center justify-between cursor-pointer group"
            onClick={() => setHeroExpanded(!heroExpanded)}
          >
            <div className="flex items-center gap-8">
              <div>
                <div className="text-[11px] uppercase tracking-widest text-zinc-500 mb-1">Capital Deployed</div>
                <div className="text-4xl font-black tracking-tight text-cyan-400">
                  ${V(N(score?.portfolio?.deployed ?? capitalDeployed)).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </div>
                <div className="text-[11px] text-zinc-500 mt-1">
                  {V(score?.portfolio?.deploy_pct ?? utilization).toFixed(1)}% of ${V(N(score?.portfolio?.total_capital ?? totalCapital)).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </div>
              </div>
              <div className="h-16 w-px bg-white/[0.06]" />
              <div>
                <div className="text-[11px] uppercase tracking-widest text-zinc-500 mb-1">Total Gains</div>
                <div className={`text-4xl font-black tracking-tight ${V(totalRealized + totalUnrealized) >= 0 ? (isLive ? 'text-zinc-600' : 'text-emerald-400') : 'text-red-400'}`}>
                  {isLive ? '$0.00' : fmt$(totalRealized + totalUnrealized)}
                </div>
                <div className="flex items-center gap-3 mt-1">
                  <span className={`text-[11px] ${isLive ? 'text-zinc-600' : (N(totalRealized) >= 0 ? 'text-emerald-500/60' : 'text-red-500/60')}`}>
                    {isLive ? '$0.00 realized' : `${fmt$(totalRealized)} realized`}
                  </span>
                  <span className={`text-[11px] ${isLive ? 'text-zinc-600' : (N(totalUnrealized) >= 0 ? 'text-cyan-400/60' : 'text-amber-400/60')}`}>
                    {isLive ? '$0.00 unrealized' : `${fmt$(totalUnrealized)} unrealized`}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {lastUpdate && (
                <div className="flex items-center gap-1.5 text-[11px] text-zinc-600">
                  <Clock className="w-3 h-3" />
                  {lastUpdate.toLocaleTimeString()}
                </div>
              )}
              <div className={`p-2 rounded-lg bg-white/[0.03] group-hover:bg-white/[0.06] transition-all duration-300 ${heroExpanded ? 'rotate-180' : ''}`}>
                <ChevronDown className="w-4 h-4 text-zinc-500" />
              </div>
            </div>
          </div>

          {/* ── Drill-down: 5 consolidated metrics (clickable) ── */}
          <div className={`overflow-hidden transition-all duration-500 ${heroExpanded ? 'max-h-[2000px] opacity-100 mt-5' : 'max-h-0 opacity-0 mt-0'}`}>
          <div className="text-[10px] uppercase tracking-wider text-zinc-600 mb-3">Breakdown</div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {/* 1. SYGNL Score */}
            <MetricCard
              label="SYGNL Score"
              value={isLive ? '0.0%' : (N(score?.sygnl_score ?? rTotal?.r_total) * 100).toFixed(1) + '%'}
              color={isLive ? 'text-zinc-600' : N(score?.sygnl_score ?? rTotal?.r_total) >= 0.85 ? 'text-emerald-400' : N(score?.sygnl_score ?? rTotal?.r_total) >= 0.75 ? 'text-orange-400' : N(score?.sygnl_score ?? rTotal?.r_total) >= 0.65 ? 'text-yellow-400' : 'text-red-400'}
              icon={Shield}
              progress={isLive ? 0 : N(score?.sygnl_score ?? rTotal?.r_total) / 0.85 * 100}
              sub={isLive ? '⚪ NO LIVE DATA' : (score?.score_label ?? '🔴 BUILDING DATA')}
              tooltip={`Composite score: Calibration (30%) + Expectancy (25%) + Sharpe (20%) + IR (15%) + Drawdown (10%). Target: ≥85% for live trading. Current: ${(N(score?.sygnl_score ?? rTotal?.r_total) * 100).toFixed(1)}%`}
              expandable
              onClick={() => setExpandedMetric(expandedMetric === 'score' ? null : 'score')}
            />
            {/* 2. Win Rate */}
            <div
              className="p-4 rounded-xl bg-black/40 border border-white/[0.04] hover:border-white/[0.08] cursor-pointer hover:bg-white/[0.02] transition-all duration-300 group relative"
              onClick={() => setExpandedMetric(expandedMetric === 'winrate' ? null : 'winrate')}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="text-[10px] uppercase tracking-wider text-zinc-500">Win Rate</div>
                <ChevronDown className="w-3 h-3 text-zinc-700 group-hover:text-zinc-400 transition-colors" />
              </div>
              <div className={`text-xl font-bold ${isLive ? 'text-zinc-600' : N(score?.live?.win_rate || score?.backtest?.win_rate) >= 0.5 ? 'text-emerald-400' : N(score?.live?.win_rate || score?.backtest?.win_rate) > 0 ? 'text-amber-400' : 'text-zinc-500'}`}>
                {isLive ? '0.0%' : (N(score?.live?.win_rate || score?.backtest?.win_rate) * 100).toFixed(1) + '%'}
              </div>
              <div className="text-[10px] text-zinc-500 mt-1">
                {isLive ? '0 live trades · 0 open' : `${score?.live?.trades ?? 0} live trades · ${score?.live?.open_positions ?? 0} open`}
              </div>
              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-3 py-2 rounded-xl bg-zinc-900/95 backdrop-blur border border-white/[0.08] shadow-2xl text-[11px] text-zinc-300 w-56 text-left opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-200 z-50 leading-relaxed">
                Percentage of closed trades with positive P&L. Low win rate can be offset by high risk:reward ratio (big winners, small losers).
              </div>
            </div>
            {/* 3. P&L */}
            <div
              className="p-4 rounded-xl bg-black/40 border border-white/[0.04] hover:border-white/[0.08] cursor-pointer hover:bg-white/[0.02] transition-all duration-300 group relative"
              onClick={() => setExpandedMetric(expandedMetric === 'pnl' ? null : 'pnl')}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="text-[10px] uppercase tracking-wider text-zinc-500">P&L</div>
                <ChevronDown className="w-3 h-3 text-zinc-700 group-hover:text-zinc-400 transition-colors" />
              </div>
              <div className={`text-xl font-bold ${isLive ? 'text-zinc-600' : (totalRealized + totalUnrealized) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {isLive ? '$0.00' : fmt$(totalRealized + totalUnrealized)}
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className={`text-[10px] ${isLive ? 'text-zinc-600' : N(totalRealized) !== 0 ? (N(totalRealized) >= 0 ? 'text-emerald-500/60' : 'text-red-500/60') : 'text-zinc-600'}`}>
                  {isLive ? '$0.00 closed' : (N(totalRealized) !== 0 ? `${fmt$(totalRealized)} closed` : 'No closed trades')}
                </span>
                <span className={`text-[10px] font-medium ${isLive ? 'text-zinc-600' : N(totalUnrealized) >= 0 ? 'text-cyan-400' : 'text-amber-400'}`}>
                  {isLive ? '$0.00 open' : `${fmt$(totalUnrealized)} open`}
                </span>
              </div>
              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-3 py-2 rounded-xl bg-zinc-900/95 backdrop-blur border border-white/[0.08] shadow-2xl text-[11px] text-zinc-300 w-56 text-left opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-200 z-50 leading-relaxed">
                Total profit & loss. Realized = closed trades. Unrealized = open positions at current market prices.
              </div>
            </div>
            {/* 4. Positions */}
            <MetricCard
              label="Open Positions"
              value={isLive ? 0 : (score?.live?.open_positions ?? pos.length)}
              color={isLive ? 'text-zinc-600' : 'text-blue-400'}
              icon={Activity}
              sub={isLive ? '0 strategies active' : `${score?.portfolio?.strategies ?? (lb?.length || 0)} strategies active`}
              tooltip={`${score?.live?.open_positions ?? pos.length} positions across ${new Set(pos.map(p => p.strategy)).size} strategies. ${pos.filter(p => N(p.unrealized_pnl) > 0).length} winning, ${pos.filter(p => N(p.unrealized_pnl) <= 0).length} losing. Unrealized: ${fmt$(totalUnrealized)}`}
              expandable
              onClick={() => setExpandedMetric(expandedMetric === 'positions' ? null : 'positions')}
            />
            {/* 5. Capital */}
            <div
              className="p-4 rounded-xl bg-black/40 border border-white/[0.04] hover:border-white/[0.08] cursor-pointer hover:bg-white/[0.02] transition-all duration-300 group relative"
              onClick={() => setExpandedMetric(expandedMetric === 'capital' ? null : 'capital')}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="text-[10px] uppercase tracking-wider text-zinc-500">Capital Deployed</div>
                <ChevronDown className="w-3 h-3 text-zinc-700 group-hover:text-zinc-400 transition-colors" />
              </div>
              <div className={`text-xl font-bold ${isLive ? 'text-zinc-600' : 'text-cyan-400'}`}>
                ${isLive ? '0' : V(N(score?.portfolio?.deployed ?? capitalDeployed)).toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </div>
              <div className="text-[10px] text-zinc-400 mt-1">
                of ${isLive ? '0' : V(N(score?.portfolio?.total_capital ?? totalCapital)).toLocaleString(undefined, { maximumFractionDigits: 0 })} total
              </div>
              <div className="w-full h-1.5 rounded-full bg-white/[0.06] mt-2 mb-1">
                <div className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-violet-500"
                  style={{ width: `${isLive ? 0 : Math.min(100, score?.portfolio?.deploy_pct ?? utilization)}%` }} />
              </div>
              <div className="text-[10px] text-zinc-500">
                {isLive ? '0.0' : (score?.portfolio?.deploy_pct ?? utilization).toFixed(1)}% utilized · ${isLive ? '0' : V(N(score?.portfolio?.free_capital ?? freeCapital)).toLocaleString(undefined, { maximumFractionDigits: 0 })} free
              </div>
              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-3 py-2 rounded-xl bg-zinc-900/95 backdrop-blur border border-white/[0.08] shadow-2xl text-[11px] text-zinc-300 w-56 text-left opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-200 z-50 leading-relaxed">
                Capital currently in open positions. Higher utilization = more exposure to market moves. Free capital is available for new trades.
              </div>
            </div>
          </div>

          {/* ── Risk Engine Panel ── */}
          {riskData && (
            <div className="mt-4 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-cyan-400" />
                  <span className="text-sm font-semibold text-zinc-200">Risk Engine</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${riskData.trading_enabled ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                    {riskData.trading_enabled ? 'ACTIVE' : 'KILL SWITCH'}
                  </span>
                  {riskData.kill_switch && (
                    <span className="px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 text-[10px] font-bold">
                      {riskData.kill_switch}
                    </span>
                  )}
                </div>
                <span className="text-[10px] text-zinc-500">
                  {riskData.last_updated ? new Date(riskData.last_updated).toLocaleTimeString() : '—'}
                </span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
                {/* Risk Multiplier */}
                <div className="rounded-xl bg-white/[0.03] border border-white/[0.05] p-3">
                  <div className="text-[10px] text-zinc-500 mb-1">Risk Multiplier</div>
                  <div className={`text-lg font-bold ${N(riskData.risk_multiplier) >= 0.75 ? 'text-emerald-400' : N(riskData.risk_multiplier) >= 0.5 ? 'text-amber-400' : 'text-red-400'}`}>
                    {(N(riskData.risk_multiplier) * 100).toFixed(0)}%
                  </div>
                </div>
                {/* Regime */}
                <div className="rounded-xl bg-white/[0.03] border border-white/[0.05] p-3">
                  <div className="text-[10px] text-zinc-500 mb-1">Regime</div>
                  <div className={`text-sm font-bold ${riskData.regime === 'normal' ? 'text-emerald-400' : riskData.regime === 'high_vol' ? 'text-amber-400' : 'text-red-400'}`}>
                    {(riskData.regime || 'unknown').replace('_', ' ').toUpperCase()}
                  </div>
                </div>
                {/* Drawdown */}
                <div className="rounded-xl bg-white/[0.03] border border-white/[0.05] p-3">
                  <div className="text-[10px] text-zinc-500 mb-1">Drawdown</div>
                  <div className={`text-lg font-bold ${N(riskData.drawdown) < 0.05 ? 'text-emerald-400' : N(riskData.drawdown) < 0.10 ? 'text-amber-400' : 'text-red-400'}`}>
                    {(N(riskData.drawdown) * 100).toFixed(1)}%
                  </div>
                  <div className="text-[9px] text-zinc-600">mult: {N(riskData.drawdown_mult).toFixed(2)}x</div>
                </div>
                {/* Portfolio Heat */}
                <div className="rounded-xl bg-white/[0.03] border border-white/[0.05] p-3">
                  <div className="text-[10px] text-zinc-500 mb-1">Portfolio Heat</div>
                  <div className={`text-lg font-bold ${N(riskData.portfolio_heat) < 0.04 ? 'text-emerald-400' : N(riskData.portfolio_heat) < 0.06 ? 'text-amber-400' : 'text-red-400'}`}>
                    {(N(riskData.portfolio_heat) * 100).toFixed(1)}%
                  </div>
                  <div className="text-[9px] text-zinc-600">max: {(N(riskData.config?.max_portfolio_heat) * 100).toFixed(0)}%</div>
                </div>
                {/* Correlation */}
                <div className="rounded-xl bg-white/[0.03] border border-white/[0.05] p-3">
                  <div className="text-[10px] text-zinc-500 mb-1">Corr Mult</div>
                  <div className={`text-lg font-bold ${N(riskData.corr_mult) >= 0.8 ? 'text-emerald-400' : N(riskData.corr_mult) >= 0.5 ? 'text-amber-400' : 'text-red-400'}`}>
                    {N(riskData.corr_mult).toFixed(2)}x
                  </div>
                </div>
                {/* Signals */}
                <div className="rounded-xl bg-white/[0.03] border border-white/[0.05] p-3">
                  <div className="text-[10px] text-zinc-500 mb-1">Signals</div>
                  <div className="text-lg font-bold text-zinc-200">
                    {N(riskData.final_positions)}<span className="text-zinc-500 text-xs">/{N(riskData.candidates)}</span>
                  </div>
                  <div className="text-[9px] text-zinc-600">passed / candidates</div>
                </div>
              </div>
              {riskData.reject_reasons && riskData.reject_reasons.length > 0 && (
                <div className="mt-2 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20">
                  <div className="text-[10px] text-red-400 font-semibold">⚠ {riskData.reject_reasons.join(' · ')}</div>
                </div>
              )}
            </div>
          )}

          {/* ── Simulator Health Panel ── */}
          {simData && (
            <div className="rounded-2xl bg-white/[0.03] border border-white/[0.06] p-4 mt-2">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-zinc-300">🧪 System Health</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    simData.status === 'PASS' ? 'bg-emerald-500/20 text-emerald-400' :
                    simData.status === 'CRITICAL' ? 'bg-red-500/20 text-red-400' :
                    simData.status === 'FAIL' ? 'bg-amber-500/20 text-amber-400' :
                    'bg-zinc-500/20 text-zinc-400'
                  }`}>{simData.status}</span>
                </div>
                <div className="text-[10px] text-zinc-600">
                  {simData.run_at ? new Date(simData.run_at).toLocaleString() : 'never run'}
                </div>
              </div>
              <div className="grid grid-cols-4 gap-2 mb-3">
                <div className="rounded-xl bg-white/[0.03] border border-white/[0.05] p-3 text-center">
                  <div className="text-[10px] text-zinc-500 mb-1">Pass Rate</div>
                  <div className={`text-lg font-bold ${N(simData.pass_rate) >= 95 ? 'text-emerald-400' : N(simData.pass_rate) >= 80 ? 'text-amber-400' : 'text-red-400'}`}>
                    {N(simData.pass_rate).toFixed(0)}%
                  </div>
                </div>
                <div className="rounded-xl bg-white/[0.03] border border-white/[0.05] p-3 text-center">
                  <div className="text-[10px] text-zinc-500 mb-1">Passed</div>
                  <div className="text-lg font-bold text-emerald-400">{simData.summary?.passed ?? '—'}</div>
                </div>
                <div className="rounded-xl bg-white/[0.03] border border-white/[0.05] p-3 text-center">
                  <div className="text-[10px] text-zinc-500 mb-1">Failed</div>
                  <div className={`text-lg font-bold ${(simData.summary?.failed ?? 0) === 0 ? 'text-zinc-400' : 'text-red-400'}`}>{simData.summary?.failed ?? '—'}</div>
                </div>
                <div className="rounded-xl bg-white/[0.03] border border-white/[0.05] p-3 text-center">
                  <div className="text-[10px] text-zinc-500 mb-1">Critical</div>
                  <div className={`text-lg font-bold ${(simData.critical_count ?? 0) === 0 ? 'text-zinc-400' : 'text-red-400'}`}>{simData.critical_count ?? 0}</div>
                </div>
              </div>
              {simData.failed_tests && simData.failed_tests.length > 0 && (
                <div className="space-y-1">
                  {simData.failed_tests.map((t, i) => (
                    <div key={i} className={`px-3 py-2 rounded-lg border text-[10px] ${
                      t.severity === 'CRITICAL' ? 'bg-red-500/10 border-red-500/20 text-red-300' :
                      t.severity === 'HIGH'     ? 'bg-amber-500/10 border-amber-500/20 text-amber-300' :
                      'bg-zinc-500/10 border-zinc-500/20 text-zinc-400'
                    }`}>
                      <span className="font-semibold">[{t.severity}]</span> {t.name} — expected: {t.expected} · got: {t.actual}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── Expanded Trend Panels ── */}
          <TrendPanel title="📊 SYGNL Score Breakdown" isOpen={expandedMetric === 'score'} onClose={() => setExpandedMetric(null)}>
            <div className="grid grid-cols-5 gap-3 mb-4">
              {(() => {
                const descriptions = {
                  calibration: { weight: '30%', desc: 'How well predicted probabilities match actual outcomes. A 70% confidence signal should win ~70% of the time.' },
                  expectancy: { weight: '25%', desc: 'Average expected profit per trade, normalized to risk. Positive = every trade has a statistical edge.' },
                  sharpe: { weight: '20%', desc: 'Risk-adjusted return vs benchmark. Higher = more return per unit of risk taken.' },
                  information_ratio: { weight: '15%', desc: 'Excess return consistency over benchmark. Measures how reliably we beat the market.' },
                  drawdown: { weight: '10%', desc: 'Maximum peak-to-trough decline stability. Lower drawdowns = smoother equity curve.' },
                  ir: { weight: '15%', desc: 'Information Ratio — consistency of excess returns over benchmark.' },
                  dd: { weight: '10%', desc: 'Drawdown stability — how well the system avoids large peak-to-trough declines.' },
                }
                const details = rTotal?.component_details || score?.component_details || {}
                return Object.entries(score?.score_components || rTotal?.components || {}).map(([key, val]) => {
                  const info = descriptions[key.toLowerCase()] || descriptions[key.toLowerCase().replace(/_/g, '')] || { weight: '—', desc: 'Component of the overall SYGNL score.' }
                  const detail = details[key] || details[key.toLowerCase()] || ''
                  const whyZero = N(val) === 0 ? (
                    key === 'calibration' ? '⚠️ Score is 0% because Brier score > 0.25 (random baseline). Confidence predictions don\'t yet match actual outcomes.' :
                    key === 'drawdown' ? '⚠️ Score is 0% because max drawdown far exceeds the $500 benchmark. Need tighter risk controls.' :
                    '⚠️ Score is 0% — see detail above.'
                  ) : null
                  return (
                    <div key={key} className="text-center p-3 rounded-lg bg-white/[0.02] group relative cursor-help hover:bg-white/[0.04] transition-colors">
                      <div className="text-[9px] uppercase text-zinc-500 mb-1">{key} <span className="text-zinc-700">({info.weight})</span></div>
                      <div className={`text-lg font-bold ${N(val) > 0.5 ? 'text-emerald-400' : N(val) > 0 ? 'text-amber-400' : 'text-red-400'}`}>
                        {(N(val) * 100).toFixed(1) + '%'}
                      </div>
                      {detail && <div className="text-[9px] text-zinc-600 mt-1 font-mono">{detail}</div>}
                      <div className="h-1 bg-zinc-800 rounded-full mt-2">
                        <div className={`h-full rounded-full ${N(val) > 0.5 ? 'bg-emerald-500' : N(val) > 0 ? 'bg-amber-500' : 'bg-red-500'}`}
                          style={{ width: `${Math.min(100, Math.abs(N(val)) * 100)}%` }} />
                      </div>
                      <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-3 py-2 rounded-lg bg-zinc-900 border border-white/10 shadow-xl text-[10px] text-zinc-300 w-56 text-left opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 z-50">
                        <p className="mb-1.5">{info.desc}</p>
                        {detail && <p className="font-mono text-cyan-400/80 mb-1">📊 {detail}</p>}
                        {whyZero && <p className="text-red-400/80 mt-1">{whyZero}</p>}
                      </div>
                    </div>
                  )
                })
              })()}
            </div>
            <div className="text-[11px] text-zinc-500 mb-3">
              Target: ≥0.85 for live trading · Current bottleneck: {
                (() => {
                  const c = score?.score_components || rTotal?.components || {}
                  const worst = Object.entries(c).sort((a, b) => N(a[1]) - N(b[1]))[0]
                  return worst ? <span className="text-red-400 font-semibold">{worst[0]} ({(N(worst[1]) * 100).toFixed(1)}%)</span> : 'loading...'
                })()
              }
            </div>

            {/* Validation Metrics */}
            {(rTotal?.validation_metrics || score?.validation_metrics) && (() => {
              const vm = rTotal?.validation_metrics || score?.validation_metrics || {}
              const alerts = rTotal?.validation_alerts || score?.validation_alerts || []
              return (
                <div className="border-t border-white/[0.04] pt-3">
                  <div className="text-[10px] uppercase text-zinc-500 mb-2">Live Validation Metrics</div>
                  <div className="grid grid-cols-4 gap-2 mb-2">
                    {[
                      { label: 'Win Rate', value: `${(N(vm.win_rate) * 100).toFixed(1)}%`, target: '>55%', ok: N(vm.win_rate) > 0.55, tip: 'Percentage of trades that are profitable. 36% is low but offset by high profit factor — winners are much larger than losers.' },
                      { label: 'Profit Factor', value: N(vm.profit_factor).toFixed(2), target: '>1.75', ok: N(vm.profit_factor) > 1.75, tip: 'Gross profit / gross loss. Values >2 are strong. Shows how much you earn per dollar lost.' },
                      { label: 'Sharpe', value: N(vm.sharpe_ratio).toFixed(2), target: '>1.2', ok: N(vm.sharpe_ratio) > 1.2, tip: 'Risk-adjusted return. Annualized (avg return × √252) / std dev. >2 is excellent, >3 is exceptional.' },
                      { label: 'Sortino', value: N(vm.sortino_ratio).toFixed(2), target: '>1.0', ok: N(vm.sortino_ratio) > 1.0, tip: 'Like Sharpe but only penalizes downside volatility. Higher = better risk management on the loss side.' },
                      { label: 'Max DD', value: `${(N(vm.max_drawdown_pct) * 100).toFixed(1)}%`, target: '<20%', ok: N(vm.max_drawdown_pct) < 0.20, tip: 'Largest peak-to-trough decline. 44% means at one point the portfolio was down 44% from its high. Target: <20% for live trading.' },
                      { label: 'Risk:Reward', value: `${N(vm.risk_reward_ratio).toFixed(1)}:1`, target: '>2:1', ok: N(vm.risk_reward_ratio) > 2, tip: 'Average win size / average loss size. 9:1 means winners are 9× larger than losers. Compensates for low win rate.' },
                      { label: 'Avg PnL', value: `$${N(vm.avg_pnl_per_trade).toFixed(2)}`, target: '>$50', ok: N(vm.avg_pnl_per_trade) > 50, tip: 'Average profit/loss per trade including losers. Positive = each trade has a statistical edge.' },
                      { label: 'Alpha', value: N(vm.alpha).toFixed(4), target: '>0', ok: N(vm.alpha) > 0, tip: 'Excess return above the market benchmark. Positive alpha = the system generates returns beyond buy-and-hold.' },
                    ].map(m => (
                      <div key={m.label} className="p-2 rounded-lg bg-white/[0.02] text-center group relative cursor-help hover:bg-white/[0.04] transition-colors">
                        <div className="text-[9px] text-zinc-500">{m.label} <span className="text-zinc-700">({m.target})</span></div>
                        <div className={`text-sm font-bold ${m.ok ? 'text-emerald-400' : 'text-red-400'}`}>{m.value}</div>
                        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-3 py-2 rounded-lg bg-zinc-900 border border-white/10 shadow-xl text-[10px] text-zinc-300 w-52 text-left opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 z-50">
                          {m.tip}
                        </div>
                      </div>
                    ))}
                  </div>
                  {alerts.length > 0 && (
                    <div className="space-y-1">
                      {alerts.map((a, i) => (
                        <div key={i} className="text-[10px] text-red-400/80 flex items-center gap-1.5">
                          <span className="w-1 h-1 rounded-full bg-red-400 flex-shrink-0" />
                          {a}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })()}
          </TrendPanel>

          <TrendPanel title="📈 Win Rate Trend" isOpen={expandedMetric === 'winrate'} onClose={() => setExpandedMetric(null)}>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <div className="text-[10px] uppercase text-zinc-500 mb-2">Win Rate by Strategy (Live)</div>
                <div className="space-y-2">
                  {(acc?.strategies ? Object.entries(acc.strategies) : []).filter(([,s]) => s.trades > 0).sort((a, b) => b[1].win_rate - a[1].win_rate).map(([name, s]) => {
                    const wr = N(s.win_rate) <= 1 ? N(s.win_rate) * 100 : N(s.win_rate) // handle both 0.4 and 40 formats
                    return (
                    <div key={name} className="flex items-center gap-2">
                      <span className="text-[10px] text-zinc-400 w-32 truncate">{name.replace(/_/g, ' ')}</span>
                      <div className="flex-1 h-2 bg-zinc-800 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${wr >= 50 ? 'bg-emerald-500' : wr >= 30 ? 'bg-amber-500' : 'bg-red-500'}`}
                          style={{ width: `${wr}%` }} />
                      </div>
                      <span className={`text-[10px] font-bold w-12 text-right ${wr >= 50 ? 'text-emerald-400' : wr >= 30 ? 'text-amber-400' : 'text-red-400'}`}>{wr.toFixed(1)}%</span>
                      <span className="text-[9px] text-zinc-600 w-10 text-right">{s.trades}t · {fmt$(s.pnl)}</span>
                    </div>
                  )}
                  )}
                </div>
              </div>
              <div>
                <div className="text-[10px] uppercase text-zinc-500 mb-2">Backtest vs Live</div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg bg-white/[0.02] text-center">
                    <div className="text-[9px] text-zinc-500 uppercase">Backtest</div>
                    <div className="text-2xl font-bold text-emerald-400">{(N(score?.backtest?.win_rate) <= 1 ? N(score?.backtest?.win_rate) * 100 : N(score?.backtest?.win_rate)).toFixed(1)}%</div>
                    <div className="text-[9px] text-zinc-600">{score?.backtest?.trades ?? 0} trades · 6mo</div>
                  </div>
                  <div className="p-3 rounded-lg bg-white/[0.02] text-center">
                    <div className="text-[9px] text-zinc-500 uppercase">Live</div>
                    <div className={`text-2xl font-bold ${(N(score?.live?.win_rate) <= 1 ? N(score?.live?.win_rate) : N(score?.live?.win_rate)/100) >= 0.5 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {(N(score?.live?.win_rate) <= 1 ? N(score?.live?.win_rate) * 100 : N(score?.live?.win_rate)).toFixed(1)}%
                    </div>
                    <div className="text-[9px] text-zinc-600">{score?.live?.trades ?? 0} trades</div>
                  </div>
                </div>
                {(() => {
                  const btWr = N(score?.backtest?.win_rate) <= 1 ? N(score?.backtest?.win_rate) * 100 : N(score?.backtest?.win_rate)
                  const liveWr = N(score?.live?.win_rate) <= 1 ? N(score?.live?.win_rate) * 100 : N(score?.live?.win_rate)
                  const gap = btWr - liveWr
                  return gap > 0 ? (
                <div className="mt-3 p-2 rounded-lg bg-amber-500/5 border border-amber-500/10">
                  <div className="text-[10px] text-amber-400">
                    ⚠️ Gap: {gap.toFixed(1)}pp — live underperforming backtest
                  </div>
                </div>
                  ) : (
                <div className="mt-3 p-2 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
                  <div className="text-[10px] text-emerald-400">
                    ✅ Live tracking backtest ({Math.abs(gap).toFixed(1)}pp)
                  </div>
                </div>
                  )
                })()}
              </div>
            </div>
          </TrendPanel>

          <TrendPanel title="💰 P&L Trend" isOpen={expandedMetric === 'pnl'} onClose={() => setExpandedMetric(null)}>
            <div className="mb-4">
              <div className="text-[10px] uppercase text-zinc-500 mb-2">Cumulative P&L</div>
              <PnLChart data={effectiveDailyPnl} height={160} trades={trades} />
            </div>
            <div className="grid grid-cols-4 gap-3">
              <div className="p-3 rounded-lg bg-white/[0.02] text-center">
                <div className="text-[9px] text-zinc-500 uppercase">Realized</div>
                <div className={`text-lg font-bold ${N(totalRealized) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{fmt$(totalRealized)}</div>
              </div>
              <div className="p-3 rounded-lg bg-white/[0.02] text-center">
                <div className="text-[9px] text-zinc-500 uppercase">Unrealized</div>
                <div className={`text-lg font-bold ${N(totalUnrealized) >= 0 ? 'text-cyan-400' : 'text-amber-400'}`}>{fmt$(totalUnrealized)}</div>
              </div>
              <div className="p-3 rounded-lg bg-white/[0.02] text-center">
                <div className="text-[9px] text-zinc-500 uppercase">Sharpe</div>
                <div className={`text-lg font-bold ${N(score?.live?.sharpe) > 0 ? 'text-emerald-400' : 'text-red-400'}`}>{N(score?.live?.sharpe).toFixed(2)}</div>
              </div>
              <div className="p-3 rounded-lg bg-white/[0.02] text-center">
                <div className="text-[9px] text-zinc-500 uppercase">Best Day</div>
                <div className="text-lg font-bold text-emerald-400">
                  {fmt$(Math.max(...(effectiveDailyPnl || []).map(d => N(d.pnl || d.daily_pnl)), 0))}
                </div>
              </div>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <div>
                <div className="text-[10px] uppercase text-zinc-500 mb-1">P&L by Strategy</div>
                {(acc?.strategies ? Object.entries(acc.strategies) : []).filter(([,s]) => s.pnl !== 0).sort((a, b) => b[1].pnl - a[1].pnl).slice(0, 6).map(([name, s]) => (
                  <div key={name} className="flex items-center justify-between py-1 text-[10px]">
                    <span className="text-zinc-400 truncate w-28">{name.replace(/_/g, ' ')}</span>
                    <span className={N(s.pnl) >= 0 ? 'text-emerald-400 font-semibold' : 'text-red-400 font-semibold'}>{fmt$(s.pnl)}</span>
                  </div>
                ))}
              </div>
              <div>
                <div className="text-[10px] uppercase text-zinc-500 mb-1">Daily Breakdown</div>
                {(effectiveDailyPnl || []).slice(-5).reverse().map((d, i) => (
                  <div key={i} className="flex items-center justify-between py-1 text-[10px]">
                    <span className="text-zinc-500">{d.date}</span>
                    <span className={N(d.pnl || d.daily_pnl) >= 0 ? 'text-emerald-400 font-semibold' : 'text-red-400 font-semibold'}>
                      {fmt$(d.pnl || d.daily_pnl)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </TrendPanel>

          <TrendPanel title="📍 Position Breakdown" isOpen={expandedMetric === 'positions'} onClose={() => setExpandedMetric(null)}>
            <div className="space-y-2">
              {pos.map((p, i) => {
                const exposure = Math.abs(N(p.current_price) * N(p.quantity))
                return (
                  <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg bg-white/[0.02] hover:bg-white/[0.04] transition-colors">
                    <div className={`w-1.5 h-8 rounded-full flex-shrink-0 ${N(p.unrealized_pnl) >= 0 ? 'bg-emerald-500' : 'bg-red-500'}`} />
                    <div className="w-14 font-bold text-sm">{p.symbol}</div>
                    <div className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${p.direction === 'LONG' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>{p.direction}</div>
                    <div className="text-[10px] text-zinc-500 w-20">{p.strategy}</div>
                    <div className="text-[10px] text-zinc-400 w-16">qty: {p.quantity}</div>
                    <div className="text-[10px] text-zinc-400 w-20">${N(exposure).toLocaleString(undefined, {maximumFractionDigits: 0})}</div>
                    <div className="flex-1" />
                    <div className={`text-sm font-bold ${N(p.unrealized_pnl) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {fmt$(p.unrealized_pnl)} <span className="text-[9px] opacity-70">({fmtPct(N(p.unrealized_pnl_pct) * 100)})</span>
                    </div>
                  </div>
                )
              })}
            </div>
            <div className="mt-3 flex items-center justify-between text-[10px] text-zinc-500 pt-2 border-t border-white/[0.04]">
              <span>{pos.length} positions across {new Set(pos.map(p => p.strategy)).size} strategies</span>
              <span className={N(totalUnrealized) >= 0 ? 'text-emerald-400 font-bold' : 'text-red-400 font-bold'}>
                Total: {fmt$(totalUnrealized)}
              </span>
            </div>
          </TrendPanel>

          <TrendPanel title="🏦 Capital Allocation" isOpen={expandedMetric === 'capital'} onClose={() => setExpandedMetric(null)}>
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="p-3 rounded-lg bg-white/[0.02] text-center">
                <div className="text-[9px] text-zinc-500 uppercase">Capital Deployed</div>
                <div className="text-lg font-bold text-cyan-400">${N(score?.portfolio?.deployed ?? capitalDeployed).toLocaleString(undefined, {maximumFractionDigits: 0})}</div>
              </div>
              <div className="p-3 rounded-lg bg-white/[0.02] text-center">
                <div className="text-[9px] text-zinc-500 uppercase">Open Positions</div>
                <div className="text-lg font-bold text-zinc-200">{pos?.length || 0}</div>
              </div>
              <div className="p-3 rounded-lg bg-white/[0.02] text-center">
                <div className="text-[9px] text-zinc-500 uppercase">Strategy Types</div>
                <div className="text-lg font-bold text-zinc-400">{new Set(lb.map(s => s.type || 'generic')).size}</div>
              </div>
            </div>
            <div className="text-[10px] uppercase text-zinc-500 mb-2">By Strategy Type</div>
            <div className="space-y-1.5">
              {(() => {
                // Build position value per strategy name
                const posValueByStrategy = {}
                if (pos && Array.isArray(pos)) {
                  pos.forEach(p => {
                    const sn = p.strategy || p.strategy_name || ''
                    posValueByStrategy[sn] = (posValueByStrategy[sn] || 0) + Math.abs(N(p.market_value || (N(p.quantity) * N(p.entry_price))))
                  })
                }
                const typeMap = {}
                if (lb && Array.isArray(lb)) {
                  lb.forEach(s => {
                    const t = s.type || 'generic'
                    if (!typeMap[t]) typeMap[t] = { deployed: 0, count: 0 }
                    typeMap[t].deployed += N(posValueByStrategy[s.name] || 0)
                    typeMap[t].count++
                  })
                }
                const maxDep = Math.max(...Object.values(typeMap).map(d => d.deployed), 1)
                return Object.entries(typeMap).filter(([, d]) => d.deployed > 0).sort((a, b) => b[1].deployed - a[1].deployed).map(([type, d]) => (
                  <div key={type} className="flex items-center gap-2">
                    <span className="text-[10px] text-zinc-400 w-24 capitalize">{type}</span>
                    <div className="flex-1 h-2 bg-zinc-800 rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-gradient-to-r from-cyan-600 to-violet-600"
                        style={{ width: `${(d.deployed / maxDep) * 100}%` }} />
                    </div>
                    <span className="text-[10px] text-cyan-300 w-20 text-right">${d.deployed.toLocaleString(undefined, {maximumFractionDigits: 0})}</span>
                    <span className="text-[9px] text-zinc-600 w-8">{d.count}s</span>
                  </div>
                ))
              })()}
            </div>
          </TrendPanel>
          </div>{/* end drill-down */}
        </GlowCard>
        </div>{/* end section-score */}

        {/* ═══ CATEGORY ACCURACY + AUTO-DEPLOY ═══ */}
        {categoryData && (
        <div id="section-category" data-section="category" className="mb-6">
          <GlowCard glow="bg-gradient-to-r from-violet-500/20 via-purple-500/20 to-indigo-500/20" className="p-6">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-gradient-to-br from-violet-500/20 to-purple-500/20 border border-violet-500/30">
                  <Target className="w-5 h-5 text-violet-400" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-white tracking-wide">CATEGORY ACCURACY</h2>
                  <p className="text-[10px] text-zinc-500">Per-strategy-type R_total · {systemState?.mode === 'LIVE' ? 'LIVE — gate enforcing real capital' : gateOn ? 'PAPER — gate enforcing accuracy thresholds' : 'PAPER — gate off, all categories trading freely'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {/* Deploy Gate status badge + toggle */}
                {deployGate && systemState?.mode !== 'LIVE' && (
                  <button
                    onClick={() => setGateOn(g => !g)}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[10px] font-semibold cursor-pointer transition-all duration-300 ${
                      gateOn
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
                        : 'bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20'
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${gateOn ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
                    {gateOn ? '🛡️ GATE ON' : '⚡ GATE OFF'}
                  </button>
                )}
                {deployGate && systemState?.mode === 'LIVE' && (
                  <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[10px] font-semibold ${
                    deployGate.deploy_gate_active
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                      : 'bg-red-500/10 border-red-500/30 text-red-400'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${deployGate.deploy_gate_active ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`} />
                    {deployGate.deploy_gate_active ? 'GATE ACTIVE' : 'GATE OFFLINE'}
                  </div>
                )}
                <div className="text-[10px] text-zinc-600">
                  {categoryData.summary?.deploy_ready?.length > 0
                    ? <span className="text-emerald-400 font-semibold">✅ {categoryData.summary.deploy_ready.length} ready to deploy</span>
                    : <span className="text-zinc-500">No categories deploy-ready yet</span>}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-5 gap-3">
              {Object.entries(categoryData.categories || {}).map(([cat, data]) => {
                const dec = categoryData.decisions?.[cat] || {}
                const gate = deployGate?.categories?.[cat] || {}
                const r = N(data.r_total)
                const threshold = N(data.deploy_threshold)
                const pct = Math.min(100, (r / (threshold || 0.85)) * 100)
                const actionColors = {
                  DEPLOY:      { bar: 'bg-emerald-500', text: 'text-emerald-400', badge: 'bg-emerald-500/20 border-emerald-500/30 text-emerald-300' },
                  SCALE_PAPER: { bar: 'bg-orange-500',  text: 'text-orange-400',  badge: 'bg-orange-500/20 border-orange-500/30 text-orange-300' },
                  HALT:        { bar: 'bg-red-500',      text: 'text-red-400',     badge: 'bg-red-500/20 border-red-500/30 text-red-300' },
                  PAPER_ONLY:  { bar: 'bg-blue-500',    text: 'text-blue-400',    badge: 'bg-blue-500/20 border-blue-500/30 text-blue-300' },
                }
                const cols = actionColors[dec.action] || actionColors.PAPER_ONLY
                const trendIcon = { improving: '📈', declining: '📉', stable: '➡️', insufficient_data: '❓' }[data.trend] || '❓'
                const isEnforced = deployGate?.deploy_gate_active && Object.keys(gate).length > 0
                const isPaper = systemState?.mode !== 'LIVE' && !gateOn

                return (
                  <div key={cat} className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.04] transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-[9px] uppercase tracking-wider text-zinc-400 font-semibold truncate">{data.category_label}</div>
                      <span className="text-base">{trendIcon}</span>
                    </div>

                    {/* R_total gauge */}
                    <div className={`text-xl font-black ${cols.text} mb-0.5`}>{(r * 100).toFixed(1)}%</div>
                    <div className="text-[9px] text-zinc-600 mb-2">target {(threshold * 100).toFixed(0)}%</div>
                    <div className="h-1.5 bg-zinc-800 rounded-full mb-2">
                      <div className={`h-full rounded-full transition-all duration-700 ${cols.bar}`} style={{ width: `${pct}%` }} />
                    </div>

                    {/* Stats */}
                    <div className="space-y-0.5 mb-2">
                      <div className="flex justify-between text-[9px]">
                        <span className="text-zinc-600">Trades</span>
                        <span className="text-zinc-400">{data.trades}</span>
                      </div>
                      <div className="flex justify-between text-[9px]">
                        <span className="text-zinc-600">WR</span>
                        <span className={N(data.win_rate) >= 0.45 ? 'text-emerald-400' : 'text-amber-400'}>{(N(data.win_rate)*100).toFixed(1)}%</span>
                      </div>
                      <div className="flex justify-between text-[9px]">
                        <span className="text-zinc-600">Avg P&L</span>
                        <span className={N(data.avg_pnl_per_trade) >= 0 ? 'text-emerald-400' : 'text-red-400'}>${N(data.avg_pnl_per_trade).toFixed(1)}</span>
                      </div>
                      {dec.trades_needed > 0 && (
                        <div className="flex justify-between text-[9px]">
                          <span className="text-zinc-600">Need</span>
                          <span className="text-amber-400">{dec.trades_needed} more trades</span>
                        </div>
                      )}
                    </div>

                    {/* Status badge */}
                    {isPaper ? (
                      <div className="text-[9px] font-semibold px-2 py-1 rounded-lg border text-center bg-emerald-500/20 border-emerald-500/30 text-emerald-300">
                        {dec.action === 'HALT' && cat === 'forex' ? '⛔ HALTED (disabled)' : '🟢 TRADING'}
                      </div>
                    ) : (
                      <div className={`text-[9px] font-semibold px-2 py-1 rounded-lg border text-center ${cols.badge}`}>
                        {dec.status_label || '🔵 PAPER ONLY'}
                      </div>
                    )}

                    {/* Gate enforcement indicator — only in LIVE mode */}
                    {!isPaper && isEnforced && (
                      <div className={`mt-1 text-[8px] flex items-center justify-center gap-1 ${gate.halted ? 'text-red-400' : 'text-zinc-500'}`}>
                        <span className={`w-1 h-1 rounded-full ${gate.halted ? 'bg-red-400 animate-pulse' : 'bg-zinc-600'}`} />
                        {gate.halted ? '🔒 GATE: BLOCKING' : '✓ GATE: ENFORCING'}
                      </div>
                    )}

                    {/* Alerts */}
                    {data.alerts?.length > 0 && (
                      <div className="mt-1.5 space-y-0.5">
                        {data.alerts.slice(0,2).map((a, i) => (
                          <div key={i} className="text-[8px] text-amber-400/70 truncate">{a}</div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Deploy decision row */}
            {Object.values(categoryData.decisions || {}).some(d => d.action === 'DEPLOY') && (
              <div className="mt-4 p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
                <div className="text-[10px] text-emerald-400 font-semibold mb-1">🟢 AUTO-DEPLOY DECISIONS</div>
                <div className="space-y-1">
                  {Object.entries(categoryData.decisions).filter(([,d]) => d.action === 'DEPLOY').map(([cat, d]) => (
                    <div key={cat} className="flex justify-between text-[10px]">
                      <span className="text-zinc-400">{d.category_label}</span>
                      <span className="text-emerald-400 font-mono">${d.position_size_usd.toFixed(0)} · {d.reason}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* All paper for now — show what's closest */}
            {!Object.values(categoryData.decisions || {}).some(d => d.action === 'DEPLOY') && (
              <div className="mt-4 p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                <div className="text-[10px] text-zinc-500 mb-1.5">CLOSEST TO DEPLOY</div>
                <div className="space-y-1">
                  {Object.entries(categoryData.decisions)
                    .sort((a, b) => N(b[1].r_total) - N(a[1].r_total))
                    .slice(0, 3)
                    .map(([cat, d]) => (
                      <div key={cat} className="flex justify-between text-[10px]">
                        <span className="text-zinc-400">{d.category_label}</span>
                        <span className="text-zinc-500">{d.reason}</span>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Live deploy gate strip */}
            {deployGate && (
              <div className={`mt-3 p-3 rounded-xl flex items-center justify-between border ${
                systemState?.mode !== 'LIVE' && !gateOn
                  ? 'bg-amber-500/5 border-amber-500/15'
                  : 'bg-emerald-500/5 border-emerald-500/15'
              }`}>
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${systemState?.mode !== 'LIVE' && !gateOn ? 'bg-amber-400' : 'bg-emerald-400 animate-pulse'}`} />
                  <span className="text-[10px] font-semibold text-zinc-300">
                    {systemState?.mode !== 'LIVE' && !gateOn
                      ? 'DEPLOY GATE — OFF · All categories trading freely for validation'
                      : systemState?.mode !== 'LIVE' && gateOn
                        ? 'DEPLOY GATE — ON (paper) · Enforcing accuracy thresholds'
                        : 'DEPLOY GATE — LIVE & ENFORCING'}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-[9px]">
                  {Object.entries(deployGate.categories || {}).map(([cat, g]) => {
                    const gateOff = systemState?.mode !== 'LIVE' && !gateOn
                    const halted = gateOn ? g.halted : false
                    return (
                      <span key={cat} className={`flex items-center gap-1 ${
                        gateOff
                          ? (cat === 'forex' ? 'text-red-400' : 'text-emerald-400')
                          : (halted || g.halted) ? 'text-red-400' : 'text-emerald-400'
                      }`}>
                        <span className={`w-1 h-1 rounded-full ${
                          gateOff
                            ? (cat === 'forex' ? 'bg-red-400' : 'bg-emerald-400')
                            : (halted || g.halted) ? 'bg-red-400' : 'bg-emerald-400'
                        }`} />
                        {cat.replace('_', ' ')}
                        {gateOff
                          ? (cat === 'forex' ? ' ⛔' : ' ✓')
                          : (halted || g.halted) ? ' 🔒' : ' ✓'}
                      </span>
                    )
                  })}
                </div>
              </div>
            )}
          </GlowCard>
        </div>
        )}

        {/* ═══ LIVE ACTION — INSIDE THE BRAIN ═══ */}
        <div id="section-live" data-section="live">
        <GlowCard glow="bg-gradient-to-r from-emerald-500/20 via-cyan-500/20 to-violet-500/20" className="p-6">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 border border-emerald-500/20">
                <Brain className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold tracking-tight">Live Action — Inside the Brain</h3>
                <div className="flex items-center gap-3 mt-0.5">
                  {(globalData?.exchanges || []).filter(ex => ex.is_open || ex.always_open).length > 0 ? (
                    <>
                      <span className="text-[11px] text-emerald-400 font-medium">
                        {(globalData?.exchanges || []).filter(ex => ex.is_open || ex.always_open).map(ex => ex.code).join(', ')} open
                      </span>
                      <span className="text-[11px] text-zinc-600">·</span>
                    </>
                  ) : null}
                  {(globalData?.exchanges || []).filter(ex => !ex.is_open && !ex.always_open).length > 0 && (
                    <span className="text-[11px] text-zinc-600">
                      {(globalData?.exchanges || []).filter(ex => !ex.is_open && !ex.always_open).map(ex => ex.code).join(', ')} closed
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span className="text-[10px] font-bold text-emerald-400">LIVE</span>
            </div>
          </div>

          {/* Live Ticker Bar — only active market positions */}
          {(() => {
            const CRYPTO_FOREX = new Set(['BTC','ETH','SOL','DOGE','AVAX','MATIC','ADA','DOT','LINK','UNI','AAVE','XRP','BNB','LTC',
              'BITX','MARA','RIOT','COIN','MSTR','BITO','GBTC','ETHE',
              'PEPE','WIF','BONK','TRUMP','SHIB','FLOKI','MOG','POPCAT','NEIRO','SUI','APT','SEI','ARB','FET','RENDER','TAO','PENDLE','LDO','NEAR','TIA',
              'EUR/USD','GBP/USD','USD/JPY','AUD/USD','USD/CAD','USD/CHF',
              'BTC-USD','ETH-USD','SOL-USD','DOGE-USD','AVAX-USD','MATIC-USD','ADA-USD','DOT-USD','LINK-USD','UNI-USD','AAVE-USD','XRP-USD','BNB-USD','LTC-USD',
              'PEPE-USD','WIF-USD','BONK-USD','TRUMP-USD','SHIB-USD','FLOKI-USD','SPX6900-USD','MOG-USD','POPCAT-USD','NEIRO-USD',
              'SUI-USD','APT-USD','SEI-USD','ARB-USD','FET-USD','RENDER-USD','TAO-USD','AAVE-USD','PENDLE-USD','LDO-USD','NEAR-USD','TIA-USD',
              'EURUSD=X','GBPUSD=X','USDJPY=X','AUDUSD=X','USDCAD=X','USDCHF=X','XAUUSD=X'])
            const openExchanges = new Set((globalData?.exchanges || []).filter(ex => ex.is_open || ex.always_open).map(ex => ex.code))
            const usOpen = openExchanges.has('NYSE') || openExchanges.has('NASDAQ')
            const cryptoOpen = openExchanges.has('CRYPTO') || openExchanges.has('FOREX')
            // If US markets open, show all. If only crypto/forex, filter to those.
            const tickerPositions = usOpen ? pos : cryptoOpen ? pos.filter(p => CRYPTO_FOREX.has(p.symbol)) : pos
            return tickerPositions.length > 0 ? (
          <div className="mb-4 overflow-hidden rounded-xl bg-black/60 border border-white/[0.04] relative group">
            <div className="absolute right-2 top-1/2 -translate-y-1/2 z-10 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-black/80 rounded-lg px-2 py-1 border border-white/[0.08]">
              {[{label:'⏸', val:0}, {label:'0.25×', val:480}, {label:'0.5×', val:240}, {label:'1×', val:120}, {label:'2×', val:60}].map(opt => (
                <button key={opt.val} onClick={() => setTickerSpeed(opt.val)}
                  className={`text-[10px] px-2 py-0.5 rounded ${tickerSpeed === opt.val ? 'bg-white/20 text-white' : 'text-zinc-500 hover:text-zinc-300'} transition-colors`}>
                  {opt.label}
                </button>
              ))}
            </div>
            <div className="flex items-center animate-scroll-x">
              <div className="flex items-center gap-6 px-4 py-2 whitespace-nowrap" style={{ animation: tickerSpeed === 0 ? 'none' : `scroll-ticker ${tickerSpeed}s linear infinite` }}>
                {tickerPositions.map((p, i) => {
                  const pnl = N(p.unrealized_pnl)
                  const pnlPct = N(p.unrealized_pnl_pct) * 100
                  return (
                    <span key={`t1-${i}`} className="flex items-center gap-2 text-xs">
                      <span className="font-bold text-zinc-200">{p.symbol}</span>
                      <span className={`font-medium ${p.direction === 'LONG' ? 'text-emerald-500' : 'text-red-500'}`}>{p.direction === 'LONG' ? '▲' : '▼'}</span>
                      <span className={`font-bold ${pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{fmt$(pnl)}</span>
                      <span className={`text-[10px] ${pnl >= 0 ? 'text-emerald-500/60' : 'text-red-500/60'}`}>({pnlPct.toFixed(1)}%)</span>
                      <span className="text-zinc-700 mx-1">|</span>
                    </span>
                  )
                })}
                {/* Duplicate for seamless scroll */}
                {tickerPositions.map((p, i) => {
                  const pnl = N(p.unrealized_pnl)
                  const pnlPct = N(p.unrealized_pnl_pct) * 100
                  return (
                    <span key={`t2-${i}`} className="flex items-center gap-2 text-xs">
                      <span className="font-bold text-zinc-200">{p.symbol}</span>
                      <span className={`font-medium ${p.direction === 'LONG' ? 'text-emerald-500' : 'text-red-500'}`}>{p.direction === 'LONG' ? '▲' : '▼'}</span>
                      <span className={`font-bold ${pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{fmt$(pnl)}</span>
                      <span className={`text-[10px] ${pnl >= 0 ? 'text-emerald-500/60' : 'text-red-500/60'}`}>({pnlPct.toFixed(1)}%)</span>
                      <span className="text-zinc-700 mx-1">|</span>
                    </span>
                  )
                })}
              </div>
            </div>
          </div>
            ) : (
              <div className="mb-4 p-3 rounded-xl bg-black/40 border border-white/[0.04] text-center text-[11px] text-zinc-600">
                No active market positions — {(globalData?.exchanges || []).filter(ex => !ex.is_open && !ex.always_open).map(ex => ex.code).join(', ')} closed
              </div>
            )
          })()}

          {/* Brain Activity */}
          <div className="flex items-center gap-3 mb-4 p-3 rounded-xl bg-black/40 border border-white/[0.04]">
            <Cpu className="w-4 h-4 text-cyan-400" />
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] uppercase tracking-wider text-zinc-500">Brain Activity</span>
                <span className="text-[10px] text-cyan-400 font-bold">{pos.length + (optionsData?.positions?.length || 0)} active threads</span>
              </div>
              <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                <div className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-emerald-500 transition-all duration-1000" style={{ width: Math.min(100, (pos.length + (optionsData?.positions?.length || 0)) * 10) + '%' }} />
              </div>
            </div>
          </div>

          <div className="space-y-1.5 max-h-96 overflow-y-auto pr-1">
            {/* Assessments */}
            {intel?.priority_actions && intel.priority_actions.length > 0 && (
              <div className="mb-3">
                <div className="text-[10px] uppercase tracking-wider text-blue-400 mb-2 flex items-center gap-1.5">
                  <Crosshair className="w-3 h-3" /> Current Assessments
                </div>
                {intel.priority_actions.slice(0, 5).map((action, i) => (
                  <div key={`a-${i}`} className="flex items-center gap-2 p-2 rounded-lg bg-blue-500/[0.04] border border-blue-500/10 mb-1 text-xs">
                    <span className="w-1 h-6 rounded-full bg-blue-500 flex-shrink-0" />
                    <span className="text-blue-300">{action}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Filters */}
            {pos?.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 mb-3 pb-3 border-b border-white/[0.04]">
                <input
                  type="text"
                  placeholder="Search symbol..."
                  value={brainFilter.search}
                  onChange={e => setBrainFilter(f => ({ ...f, search: e.target.value }))}
                  className="px-2.5 py-1 rounded-lg bg-black/40 border border-white/[0.06] text-xs text-zinc-300 placeholder-zinc-600 w-28 focus:outline-none focus:border-cyan-500/30"
                />
                {[{key:'all',label:'ALL'},{key:'LONG',label:'BUY'},{key:'SHORT',label:'SELL'}].map(d => (
                  <button key={d.key} onClick={() => setBrainFilter(f => ({ ...f, direction: d.key }))}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold transition-colors ${brainFilter.direction === d.key ? (d.key === 'LONG' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : d.key === 'SHORT' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30') : 'bg-white/[0.03] text-zinc-500 border border-white/[0.06] hover:text-zinc-300'}`}>
                    {d.label}
                  </button>
                ))}
                <select
                  value={brainFilter.strategy}
                  onChange={e => setBrainFilter(f => ({ ...f, strategy: e.target.value }))}
                  className="px-2 py-1 rounded-lg bg-black/40 border border-white/[0.06] text-[10px] text-zinc-400 focus:outline-none focus:border-cyan-500/30 appearance-none cursor-pointer"
                >
                  <option value="all">All strategies</option>
                  {[...new Set(pos.map(p => p.strategy || ''))].sort().map(s => (
                    <option key={s} value={s}>{(s || 'unknown').replace(/_/g, ' ')}</option>
                  ))}
                </select>
                {(brainFilter.search || brainFilter.direction !== 'all' || brainFilter.strategy !== 'all') && (
                  <button onClick={() => setBrainFilter({ direction: 'all', strategy: 'all', search: '' })}
                    className="px-2 py-0.5 rounded text-[10px] text-zinc-600 hover:text-zinc-400 transition-colors">
                    ✕ Clear
                  </button>
                )}
              </div>
            )}

            {/* Live Positions */}
            {pos?.length > 0 ? [...pos]
              .filter(p => brainFilter.direction === 'all' || p.direction === brainFilter.direction)
              .filter(p => brainFilter.strategy === 'all' || p.strategy === brainFilter.strategy)
              .filter(p => !brainFilter.search || p.symbol?.toLowerCase().includes(brainFilter.search.toLowerCase()))
              .sort((a, b) => new Date(b.entry_time || 0) - new Date(a.entry_time || 0)).map((p, i) => {
              const pnl = N(p.unrealized_pnl)
              const pnlPct = N(p.unrealized_pnl_pct) * 100
              const holdMs = p.entry_time ? (new Date() - new Date(p.entry_time)) : 0
              return (
                <div key={`lp-${i}`} className={`p-3 rounded-lg mb-1.5 border ${pnl >= 0 ? 'bg-emerald-500/[0.04] border-emerald-500/10' : 'bg-red-500/[0.04] border-red-500/10'}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className={`w-1 h-10 rounded-full flex-shrink-0 ${pnl >= 0 ? 'bg-emerald-500' : 'bg-red-500'}`} />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-zinc-200">{p.symbol}</span>
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${p.direction === 'LONG' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400'}`}>
                            {p.trade_type === 'option'
                              ? `${p.direction === 'LONG' ? 'BUY' : 'SELL'} ${p.option_type || (p.direction === 'LONG' ? 'CALL' : 'PUT')}`
                              : p.direction === 'LONG' ? 'BUY · LONG' : 'SELL · SHORT'}
                          </span>
                          <span className={`px-1 py-0.5 rounded text-[9px] font-medium ${p.trade_type === 'option' ? 'bg-violet-500/15 text-violet-400' : 'bg-zinc-500/15 text-zinc-500'}`}>
                            {p.trade_type || 'equity'}
                          </span>
                          <span className="text-[10px] text-zinc-600">{(p.strategy || '').replace(/_/g, ' ')}</span>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-zinc-500 mt-0.5">
                          <span>@${N(p.entry_price).toFixed(2)}</span>
                          <span className="text-zinc-700">→</span>
                          <span>${N(p.current_price || p.entry_price).toFixed(2)}</span>
                          <span className="text-zinc-700">·</span>
                          <span>{N(p.quantity).toLocaleString()} {p.trade_type === 'option' ? 'contracts' : 'shares'}</span>
                          <span className="text-zinc-700">·</span>
                          <span>{fmtDuration(holdMs / 60000)}</span>
                          {p.entry_time && (<>
                            <span className="text-zinc-700">·</span>
                            <span className="text-zinc-600">{new Date(p.entry_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </>)}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-sm font-bold ${pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{fmt$(pnl)}</div>
                      <div className={`text-[10px] ${pnl >= 0 ? 'text-emerald-500/70' : 'text-red-500/70'}`}>{pnlPct.toFixed(2)}%</div>
                    </div>
                  </div>
                  {/* Risk levels row */}
                  <div className="flex items-center gap-3 mt-1.5 ml-[22px] text-[9px]">
                    {p.stop_loss && (
                      <span className="text-red-400/70">SL ${N(p.stop_loss).toFixed(2)}</span>
                    )}
                    {p.take_profit && (
                      <span className="text-emerald-400/70">TP ${N(p.take_profit).toFixed(2)}</span>
                    )}
                    {p.trailing_stop && (
                      <span className="text-amber-400/70">Trail {N(p.trailing_stop_pct) ? (N(p.trailing_stop_pct) * 100).toFixed(1) + '%' : '$' + N(p.trailing_stop).toFixed(2)}</span>
                    )}
                    {(p.stop_loss || p.take_profit) && (
                      <span className="text-zinc-700">·</span>
                    )}
                    <span className="text-zinc-600">
                      Size ${(N(p.quantity) * N(p.entry_price)).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </span>
                    {p.confidence > 0 && (<>
                      <span className="text-zinc-700">·</span>
                      <span className={`font-medium ${p.confidence >= 0.7 ? 'text-emerald-400/70' : p.confidence >= 0.4 ? 'text-amber-400/70' : 'text-red-400/70'}`}>
                        {(p.confidence * 100).toFixed(0)}% conf
                      </span>
                    </>)}
                  </div>
                </div>
              )
            }) : (
              <div className="flex flex-col items-center justify-center py-8 text-zinc-700">
                <Brain className="w-8 h-8 mb-3 opacity-20" />
                <p className="text-sm">Brain idle — no active positions</p>
              </div>
            )}
          </div>

          {/* Summary */}
          <div className="mt-4 flex items-center justify-between p-3 rounded-xl bg-black/40 border border-white/[0.04]">
            <div className="flex items-center gap-4 text-[11px]">
              <span className="text-zinc-500">Unrealized: <span className={`font-bold ${totalUnrealized >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{fmt$(totalUnrealized)}</span></span>
              <span className="text-zinc-700">·</span>
              <span className="text-zinc-500">Realized: <span className={`font-bold ${totalRealized >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{fmt$(totalRealized)}</span></span>
            </div>
            <span className="text-[10px] text-zinc-600">{lastUpdate ? lastUpdate.toLocaleTimeString() : ''}</span>
          </div>
        </GlowCard>
        </div>{/* end section-live */}

        <div id="section-intel" data-section="intel">
        {/* ═══ SYGNL INTELLIGENCE SCORE ═══ */}
        {(intel || rTotal) && (
          <GlowCard glow="bg-gradient-to-r from-violet-500/20 to-cyan-500/20" className="p-6">
          <button onClick={() => toggleSection('intel')} className="w-full flex items-center justify-between group">
            <div className="flex items-center gap-3">
<div className="flex items-center gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-gradient-to-br from-violet-500/20 to-cyan-500/20 border border-violet-500/20">
                  <Brain className="w-5 h-5 text-violet-400" />
                </div>
                <div>
                  <h2 className="text-lg font-bold tracking-tight">SYGNL Intelligence Score</h2>
                  <p className="text-[11px] text-zinc-500">Data quality · Strategy health · Pattern analysis</p>
                </div>
              </div>
              {intel?.timestamp && (
                <div className="flex items-center gap-1.5 text-[10px] text-zinc-600">
                  <Clock className="w-3 h-3" />
                  {new Date(intel.timestamp).toLocaleString()}
                </div>
              )}
            </div>
            </div>
            <ChevronDown className={`w-4 h-4 text-zinc-600 group-hover:text-zinc-400 transition-all duration-300 ${openSections.intel ? 'rotate-180' : ''}`} />
          </button>
          <div className={`overflow-hidden transition-all duration-500 ${openSections.intel ? 'max-h-[5000px] opacity-100 mt-5' : 'max-h-0 opacity-0 mt-0'}`}>

            {/* 3 Key Metrics */}
            <div className="grid grid-cols-3 gap-4 mb-5">
              {/* Win Rate */}
              <div className="p-5 rounded-xl bg-black/40 border border-white/[0.04]">
                <div className="text-[10px] uppercase tracking-wider text-zinc-500 mb-2">Win Rate</div>
                <div className={`text-3xl font-black ${N(rTotal?.details?.overall_win_rate || rTotal?.validation_metrics?.win_rate) >= 0.55 ? 'text-emerald-400' : N(rTotal?.details?.overall_win_rate || rTotal?.validation_metrics?.win_rate) >= 0.45 ? 'text-amber-400' : 'text-red-400'}`}>
                  {(N(rTotal?.details?.overall_win_rate || rTotal?.validation_metrics?.win_rate) * 100).toFixed(1)}%
                </div>
                <div className="text-[10px] text-zinc-600 mt-1">{N(rTotal?.details?.total_trades || rTotal?.validation_metrics?.trade_count || rTotal?.trades_count)} trades · target ≥55%</div>
                <div className="h-1.5 bg-zinc-800 rounded-full mt-3 overflow-hidden">
                  <div className={`h-full rounded-full ${N(rTotal?.details?.overall_win_rate || rTotal?.validation_metrics?.win_rate) >= 0.55 ? 'bg-emerald-500' : 'bg-red-500'}`}
                    style={{ width: `${Math.min(100, N(rTotal?.details?.overall_win_rate || rTotal?.validation_metrics?.win_rate) * 100)}%` }} />
                </div>
              </div>

              {/* P&L — click to drill down */}
              <div className="p-5 rounded-xl bg-black/40 border border-white/[0.04] cursor-pointer hover:border-white/[0.08] transition-all"
                onClick={() => setExpandedMetric(expandedMetric === 'intel-pnl' ? null : 'intel-pnl')}>
                <div className="flex items-center justify-between">
                  <div className="text-[10px] uppercase tracking-wider text-zinc-500 mb-2">Total P&L</div>
                  <ChevronDown className={`w-3 h-3 text-zinc-600 transition-transform ${expandedMetric === 'intel-pnl' ? 'rotate-180' : ''}`} />
                </div>
                <div className={`text-3xl font-black ${N(intel?.summary?.total_pnl) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {fmt$(intel?.summary?.total_pnl)}
                </div>
                <div className="text-[10px] text-zinc-600 mt-1">
                  {N(intel?.summary?.total_strategies)} strategies · {intel?.strategy_audits ? intel.strategy_audits.filter(s => N(s.pnl) > 0).length : 0} profitable
                </div>
              </div>

              {/* Max Drawdown */}
              <div className="p-5 rounded-xl bg-black/40 border border-white/[0.04]">
                <div className="text-[10px] uppercase tracking-wider text-zinc-500 mb-2">Max Drawdown</div>
                <div className={`text-3xl font-black ${N(rTotal?.details?.max_drawdown_pct || rTotal?.validation_metrics?.max_drawdown_pct) <= 0.15 ? 'text-emerald-400' : N(rTotal?.details?.max_drawdown_pct || rTotal?.validation_metrics?.max_drawdown_pct) <= 0.25 ? 'text-amber-400' : 'text-red-400'}`}>
                  {(N(rTotal?.details?.max_drawdown_pct || rTotal?.validation_metrics?.max_drawdown_pct) * 100).toFixed(1)}%
                </div>
                <div className="text-[10px] text-zinc-600 mt-1">target ≤15% · PF {N(rTotal?.details?.profit_factor || rTotal?.validation_metrics?.profit_factor).toFixed(1)}x</div>
                <div className="h-1.5 bg-zinc-800 rounded-full mt-3 overflow-hidden">
                  <div className={`h-full rounded-full ${N(rTotal?.details?.max_drawdown_pct || rTotal?.validation_metrics?.max_drawdown_pct) <= 0.15 ? 'bg-emerald-500' : 'bg-red-500'}`}
                    style={{ width: `${Math.min(100, N(rTotal?.details?.max_drawdown_pct || rTotal?.validation_metrics?.max_drawdown_pct) * 100)}%` }} />
                </div>
              </div>
            </div>

            {/* P&L Breakdown by Strategy (expandable) */}
            {expandedMetric === 'intel-pnl' && intel?.strategy_audits && (
              <div className="mb-5 p-4 rounded-xl bg-black/60 border border-white/[0.06]">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-bold text-zinc-200">P&L by Strategy</h4>
                  <button onClick={() => setExpandedMetric(null)} className="p-1 rounded-lg hover:bg-white/[0.06]"><XCircle className="w-4 h-4 text-zinc-500" /></button>
                </div>
                <div className="grid grid-cols-2 gap-1 max-h-[400px] overflow-y-auto">
                  {[...intel.strategy_audits].sort((a, b) => N(b.pnl) - N(a.pnl)).map((s, i) => {
                    const pnl = N(s.pnl)
                    const maxPnl = Math.max(...intel.strategy_audits.map(x => Math.abs(N(x.pnl))), 1)
                    return (
                      <div key={i} className="flex items-center gap-2 p-2 rounded-lg hover:bg-white/[0.02]">
                        <span className={`text-[10px] font-bold w-5 ${s.grade === 'A' ? 'text-emerald-400' : s.grade === 'B' ? 'text-cyan-400' : s.grade === 'C' ? 'text-amber-400' : 'text-red-400'}`}>{s.grade}</span>
                        <span className="text-[11px] text-zinc-400 truncate flex-1">{(s.strategy || '').replace(/_/g, ' ')}</span>
                        <div className="w-20 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${pnl >= 0 ? 'bg-emerald-500' : 'bg-red-500'}`}
                            style={{ width: `${Math.min(100, (Math.abs(pnl) / maxPnl) * 100)}%` }} />
                        </div>
                        <span className={`text-[11px] font-mono w-20 text-right ${pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{fmt$(pnl)}</span>
                      </div>
                    )
                  })}
                </div>
                <div className="mt-3 pt-3 border-t border-white/[0.04] flex items-center justify-between">
                  <span className="text-[10px] text-zinc-500">{intel.strategy_audits.filter(s => N(s.pnl) > 0).length} profitable / {intel.strategy_audits.length} total</span>
                  <span className={`text-sm font-bold ${N(intel?.summary?.total_pnl) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{fmt$(intel?.summary?.total_pnl)}</span>
                </div>
              </div>
            )}

            {/* Risk Alerts */}
            {intel?.risk_alerts?.length > 0 && (
              <div className="mb-4">
                <div className="text-[10px] uppercase tracking-wider text-red-500/70 mb-2 flex items-center gap-1.5">
                  <AlertCircle className="w-3 h-3" /> Risk Alerts
                </div>
                <div className="space-y-1.5">
                  {intel.risk_alerts.map((alert, i) => (
                    <div key={i} className="p-2.5 rounded-lg bg-red-500/[0.06] border border-red-500/20 text-xs text-red-300/80">
                      {alert}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Priority Actions */}
            {intel?.priority_actions?.length > 0 && (
              <div className="mb-4">
                <div className="text-[10px] uppercase tracking-wider text-amber-500/70 mb-2 flex items-center gap-1.5">
                  <Zap className="w-3 h-3" /> Priority Actions
                </div>
                <div className="space-y-1.5">
                  {intel.priority_actions.map((action, i) => (
                    <div key={i} className="p-2.5 rounded-lg bg-amber-500/[0.06] border border-amber-500/20 text-xs text-amber-300/80 flex items-center gap-2">
                      <span className="text-amber-400 font-bold">{i + 1}.</span> {action}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Strategy Grades */}
            {intel?.strategy_grades && (
              <div>
                <div className="text-[10px] uppercase tracking-wider text-zinc-500 mb-2 flex items-center gap-1.5">
                  <Trophy className="w-3 h-3" /> Strategy Intelligence Grades
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                  {Object.entries(intel.strategy_grades)
                    .sort((a, b) => N(b[1].score) - N(a[1].score))
                    .map(([name, info]) => {
                      const gradeColors = {
                        A: 'border-emerald-500/30 bg-emerald-500/[0.06]',
                        B: 'border-cyan-500/30 bg-cyan-500/[0.06]',
                        C: 'border-amber-500/30 bg-amber-500/[0.06]',
                        D: 'border-orange-500/30 bg-orange-500/[0.06]',
                        F: 'border-red-500/30 bg-red-500/[0.06]',
                      }
                      const gradeTextColors = { A: 'text-emerald-400', B: 'text-cyan-400', C: 'text-amber-400', D: 'text-orange-400', F: 'text-red-400' }
                      return (
                        <div key={name} className={`p-3 rounded-xl border ${gradeColors[info.grade] || gradeColors.F}`}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-semibold text-zinc-300">{name.replace(/_/g, ' ')}</span>
                            <div className="flex items-center gap-2">
                              <span className={`text-lg font-black ${gradeTextColors[info.grade] || 'text-red-400'}`}>{info.grade}</span>
                              <span className="text-[10px] text-zinc-500">{info.score}pts</span>
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className={`text-xs font-semibold ${N(info.pnl) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{fmt$(info.pnl)}</span>
                            <span className="text-[10px] text-zinc-600 text-right max-w-[180px] truncate">{info.action}</span>
                          </div>
                        </div>
                      )
                    })}
                </div>
              </div>
            )}

            {/* Top Tickers from Pattern Detection */}
            {intel?.patterns?.best_tickers?.length > 0 && (
              <div className="mt-4">
                <div className="text-[10px] uppercase tracking-wider text-zinc-500 mb-2 flex items-center gap-1.5">
                  <Flame className="w-3 h-3" /> Top Performing Tickers
                </div>
                <div className="flex gap-2 flex-wrap">
                  {intel.patterns.best_tickers.slice(0, 6).map((t, i) => (
                    <div key={i} className={`px-3 py-2 rounded-xl border text-xs ${N(t.pnl) >= 0 ? 'border-emerald-500/20 bg-emerald-500/[0.06]' : 'border-red-500/20 bg-red-500/[0.06]'}`}>
                      <span className="font-bold text-zinc-200">{t.ticker}</span>
                      <span className={`ml-2 font-semibold ${N(t.pnl) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{fmt$(t.pnl)}</span>
                      <span className="ml-2 text-zinc-500">{t.win_rate}% WR · {t.trades} trades</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ═══ NATURALNESS ENGINE ═══ */}
            {intel?.naturalness && (
              <div className="mt-4">
                <div className="flex items-center gap-1.5 mb-3">
                  <div className="p-1.5 rounded-lg bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 border border-emerald-500/20">
                    <Brain className="w-3.5 h-3.5 text-emerald-400" />
                  </div>
                  <span className="text-[10px] uppercase tracking-wider text-zinc-500">Market Naturalness</span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {/* Main Score Card */}
                  <div className="p-4 rounded-xl bg-black/30 border border-white/[0.03]">
                    <div className="text-[10px] uppercase tracking-wider text-zinc-600 mb-2">Market Score</div>
                    <div className={`text-4xl font-black ${
                      N(intel.naturalness.market_score) > 70 ? 'text-emerald-400' :
                      N(intel.naturalness.market_score) >= 40 ? 'text-amber-400' :
                      'text-red-400'
                    }`}>
                      {N(intel.naturalness.market_score).toFixed(1)}
                    </div>
                    <div className={`mt-1 text-xs font-semibold px-2 py-0.5 rounded-full inline-block ${
                      intel.naturalness.market_regime === 'trending' ? 'bg-cyan-500/15 text-cyan-400' :
                      intel.naturalness.market_regime === 'mean_reverting' ? 'bg-violet-500/15 text-violet-400' :
                      intel.naturalness.market_regime === 'chaotic' ? 'bg-red-500/15 text-red-400' :
                      'bg-zinc-500/15 text-zinc-400'
                    }`}>
                      {intel.naturalness.market_regime?.toUpperCase().replace(/_/g, ' ')}
                    </div>
                    {N(intel.naturalness.market_score) > 70 && (
                      <div className="mt-2 text-[10px] text-emerald-400/70">Market behaving naturally</div>
                    )}
                    {N(intel.naturalness.market_score) >= 40 && N(intel.naturalness.market_score) <= 70 && (
                      <div className="mt-2 text-[10px] text-amber-400/70">Mild deviations detected</div>
                    )}
                    {N(intel.naturalness.market_score) < 40 && (
                      <div className="mt-2 text-[10px] text-red-400/70">Significant anomaly</div>
                    )}
                  </div>

                  {/* Anomaly Status + Position Scalars removed — not enough data with SPY+QQQ only */}
                </div>

                {/* Component Breakdown */}
                {intel.naturalness.components && (
                  <div className="mt-3 p-3 rounded-xl bg-black/30 border border-white/[0.03]">
                    <div className="text-[10px] uppercase tracking-wider text-zinc-600 mb-2">Component Breakdown</div>
                    <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                      {Object.entries(intel.naturalness.components).map(([name, value]) => (
                        <div key={name} className="text-center p-2 rounded-lg bg-white/[0.02]">
                          <div className="text-[9px] uppercase text-zinc-500 mb-1">{name}</div>
                          <div className={`text-sm font-bold ${
                            N(value) >= 70 ? 'text-emerald-400' :
                            N(value) >= 40 ? 'text-amber-400' :
                            'text-red-400'
                          }`}>
                            {N(value).toFixed(0)}
                          </div>
                          <div className="mt-1 h-1 bg-zinc-800 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${
                              N(value) >= 70 ? 'bg-emerald-500' :
                              N(value) >= 40 ? 'bg-amber-500' :
                              'bg-red-500'
                            }`} style={{ width: `${Math.min(100, N(value))}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
                    </div>{/* end collapse */}
        </GlowCard>
        )}

        </div>{/* end section-intel */}

        <div id="section-strategies" data-section="strategies">
        {/* ═══ STRATEGY LEADERBOARD ═══ */}
        <GlowCard glow={openSections.strategies ? 'from-yellow-500/20 to-amber-500/20' : ''} className="p-5">
          <button onClick={() => toggleSection('strategies')} className="w-full flex items-center justify-between group">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
                <Trophy className="w-5 h-5 text-yellow-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold tracking-tight">Strategy Leaderboard</h3>
                <p className="text-[11px] text-zinc-500">{isLive ? '0 strategies · $0K capital · 0 trades' : `${lb?.length || 0} strategies · $${(totalCapital/1000).toFixed(0)}K capital · ${totalTrades} trades`}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className={`text-sm font-bold ${isLive ? 'text-zinc-600' : totalPnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{isLive ? '$0.00' : fmt$(totalPnl)}</span>
              <ChevronDown className={`w-4 h-4 text-zinc-600 group-hover:text-zinc-400 transition-all duration-300 ${openSections.strategies ? 'rotate-180' : ''}`} />
            </div>
          </button>
          <div className={`overflow-hidden transition-all duration-500 ${openSections.strategies ? 'max-h-[5000px] opacity-100 mt-5' : 'max-h-0 opacity-0 mt-0'}`}>

          {/* Summary Cards */}
          <div className="grid grid-cols-4 gap-3 mb-4">
            {(() => {
              const sorted = [...(Array.isArray(lb) ? lb : [])].sort((a, b) => N(b.total_pnl) - N(a.total_pnl))
              const profitable = sorted.filter(s => N(s.total_pnl) > 0).length
              const avgWR = sorted.length ? sorted.reduce((s, x) => s + (N(x.win_rate) <= 1 ? N(x.win_rate) * 100 : N(x.win_rate)), 0) / sorted.length : 0
              const bestStrategy = sorted[0]
              const worstStrategy = sorted[sorted.length - 1]
              return [
                { label: 'Profitable', value: `${profitable}/${sorted.length}`, color: 'text-emerald-400', sub: `${(profitable/Math.max(sorted.length,1)*100).toFixed(0)}% hit rate` },
                { label: 'Avg Win Rate', value: `${avgWR.toFixed(1)}%`, color: avgWR >= 50 ? 'text-emerald-400' : 'text-amber-400', sub: 'across all strategies' },
                { label: 'Best', value: bestStrategy ? fmt$(bestStrategy.total_pnl) : '—', color: 'text-emerald-400', sub: bestStrategy?.name?.replace(/_/g, ' ') || '—' },
                { label: 'Worst', value: worstStrategy ? fmt$(worstStrategy.total_pnl) : '—', color: 'text-red-400', sub: worstStrategy?.name?.replace(/_/g, ' ') || '—' },
              ].map(({ label, value, color, sub }) => (
                <div key={label} className="p-3 rounded-xl bg-black/40 border border-white/[0.04]">
                  <div className="text-[10px] uppercase tracking-wider text-zinc-600">{label}</div>
                  <div className={`text-lg font-bold ${color}`}>{value}</div>
                  <div className="text-[10px] text-zinc-500 truncate">{sub}</div>
                </div>
              ))
            })()}
          </div>

          {/* Compact Table */}
          <div className="rounded-xl border border-white/[0.04] overflow-hidden">
            {/* Header */}
            <div className="grid grid-cols-[2rem_1fr_5rem_5rem_5rem_6rem] md:grid-cols-[2rem_1fr_4rem_5rem_5rem_5rem_5rem_6rem] gap-2 px-3 py-2 bg-white/[0.02] border-b border-white/[0.04]">
              <span className="text-[9px] uppercase tracking-wider text-zinc-600">#</span>
              <span className="text-[9px] uppercase tracking-wider text-zinc-600">Strategy</span>
              <span className="text-[9px] uppercase tracking-wider text-zinc-600 text-right hidden md:block">Trades</span>
              <span className="text-[9px] uppercase tracking-wider text-zinc-600 text-right">WR</span>
              <span className="text-[9px] uppercase tracking-wider text-zinc-600 text-right hidden md:block">Sharpe</span>
              <span className="text-[9px] uppercase tracking-wider text-zinc-600 text-right">PF</span>
              <span className="text-[9px] uppercase tracking-wider text-zinc-600 text-right">P&L</span>
            </div>

            {/* Rows */}
            <div className="max-h-[500px] overflow-y-auto">
              {(Array.isArray(lb) ? [...lb].sort((a, b) => N(b.total_pnl) - N(a.total_pnl)) : []).map((s, i) => {
                const ti = typeIcons[s.type || s.strategy_type] || typeIcons.custom
                const name = s.strategy || s.name || s.strategy_name
                const pnl = N(s.total_pnl)
                const wr = N(s.win_rate) <= 1 ? N(s.win_rate) * 100 : N(s.win_rate)
                const maxPnl = Math.max(...lb.map(x => Math.abs(N(x.total_pnl))), 1)
                const barWidth = Math.abs(pnl) / maxPnl * 100

                return (
                  <div key={name}
                    className={`grid grid-cols-[2rem_1fr_5rem_5rem_5rem_6rem] md:grid-cols-[2rem_1fr_4rem_5rem_5rem_5rem_5rem_6rem] gap-2 px-3 py-2.5 border-b border-white/[0.02] hover:bg-white/[0.03] cursor-pointer transition-all duration-150 relative group ${expanded === name ? 'bg-white/[0.04]' : ''}`}
                    onClick={() => toggle(name)}
                  >
                    {/* P&L bar background */}
                    <div className={`absolute inset-0 opacity-[0.04] ${pnl >= 0 ? 'bg-emerald-500' : 'bg-red-500'}`}
                      style={{ width: `${barWidth}%` }} />

                    <span className={`text-xs font-bold relative z-10 ${i < 3 ? 'text-yellow-400' : 'text-zinc-600'}`}>
                      {i < 3 ? ['🥇','🥈','🥉'][i] : i + 1}
                    </span>
                    <div className="relative z-10 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-semibold text-zinc-200 truncate">{name?.replace(/_/g, ' ')}</span>
                        <span className={`text-[9px] ${ti.color} flex-shrink-0`}>{ti.icon}</span>
                      </div>
                    </div>
                    <span className="text-xs text-zinc-400 text-right relative z-10 hidden md:block">{N(s.total_trades)}</span>
                    <span className={`text-xs font-semibold text-right relative z-10 ${wr >= 60 ? 'text-emerald-400' : wr >= 50 ? 'text-amber-400' : wr > 0 ? 'text-red-400' : 'text-zinc-600'}`}>
                      {wr.toFixed(1)}%
                    </span>
                    <span className={`text-xs text-right relative z-10 hidden md:block ${N(s.sharpe) >= 2 ? 'text-emerald-400' : N(s.sharpe) >= 1 ? 'text-cyan-400' : 'text-zinc-500'}`}>
                      {N(s.sharpe).toFixed(2)}
                    </span>
                    <span className="text-xs text-zinc-400 text-right relative z-10">{N(s.profit_factor).toFixed(2)}</span>
                    <span className={`text-xs font-bold text-right relative z-10 ${pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {fmt$(pnl)}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          {lb?.length === 0 && (
            <div className="text-center py-12 text-zinc-600">
              <Cpu className="w-8 h-8 mx-auto mb-3 opacity-30" />
              <p>No strategies registered yet</p>
            </div>
          )}
                  </div>{/* end collapse */}
        </GlowCard>

        </div>{/* end section-strategies */}

        <div id="section-daytrading" data-section="daytrading">
        {/* ═══ DAY TRADING COMMAND CENTER ═══ */}
        <GlowCard glow="bg-gradient-to-r from-amber-500/20 to-orange-500/20" className="p-6">
          <button onClick={() => toggleSection('daytrading')} className="w-full flex items-center justify-between group">
            <div className="flex items-center gap-3">
<div className="flex items-center gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/20">
                <Zap className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold tracking-tight">Day Trading Command Center</h3>
                <p className="text-[11px] text-zinc-500">
                  {dayTrading?.today?.date || 'Today'} · Intraday strategies (&lt;4h hold)
                </p>
              </div>
            </div>
            {dayTrading?.today && (
              <div className="flex items-center gap-2">
                <span className={`text-sm font-bold px-3 py-1 rounded-lg ${N(dayTrading.today.pnl) >= 0 ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                  {fmt$(dayTrading.today.pnl)} today
                </span>
              </div>
            )}
          </div>
            </div>
            <ChevronDown className={`w-4 h-4 text-zinc-600 group-hover:text-zinc-400 transition-all duration-300 ${openSections.daytrading ? 'rotate-180' : ''}`} />
          </button>
          <div className={`overflow-hidden transition-all duration-500 ${openSections.daytrading ? 'max-h-[5000px] opacity-100 mt-5' : 'max-h-0 opacity-0 mt-0'}`}>

          {/* Starting Capital & Progressive P&L */}
          <div className="mb-5 p-4 rounded-xl bg-black/40 border border-white/[0.04]">
            <div className="flex items-center justify-between mb-3">
              <div className="text-[10px] uppercase tracking-wider text-zinc-500">Capital Deployed</div>
              <div className="text-lg font-bold text-zinc-200">${N(dayTrading?.deployed_capital).toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Today', pnl: dayTrading?.today?.pnl, pct: dayTrading?.today?.pnl_pct, trades: dayTrading?.today?.trades, wr: dayTrading?.today?.win_rate },
                { label: 'This Week', pnl: dayTrading?.week?.pnl, pct: dayTrading?.week?.pnl_pct, trades: dayTrading?.week?.trades, wr: dayTrading?.week?.win_rate },
                { label: 'This Month', pnl: dayTrading?.month?.pnl, pct: dayTrading?.month?.pnl_pct, trades: dayTrading?.month?.trades, wr: dayTrading?.month?.win_rate },
              ].map(({ label, pnl, pct, trades, wr }) => (
                <div key={label} className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.03]">
                  <div className="text-[10px] uppercase tracking-wider text-zinc-600 mb-2">{label}</div>
                  <div className={`text-xl font-bold ${N(pnl) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {fmt$(pnl || 0)}
                  </div>
                  <div className={`text-sm font-semibold ${N(pct) >= 0 ? 'text-emerald-400/70' : 'text-red-400/70'}`}>
                    {N(pct) >= 0 ? '+' : ''}{N(pct).toFixed(2)}%
                  </div>
                  <div className="text-[10px] text-zinc-500 mt-1.5">
                    {N(trades)} trades · {(N(wr) * 100).toFixed(1)}% WR
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top metrics row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
            <MetricCard
              label="Win Rate"
              value={(N(dayTrading?.today?.win_rate) * 100).toFixed(1) + '%'}
              color={N(dayTrading?.today?.win_rate) >= 0.5 ? 'text-emerald-400' : N(dayTrading?.today?.win_rate) > 0 ? 'text-amber-400' : 'text-zinc-500'}
              icon={Target}
              sub={`${dayTrading?.today?.wins || 0}W / ${dayTrading?.today?.losses || 0}L`}
              tooltip="Today's intraday win rate"
            />
            <MetricCard
              label="Trades"
              value={dayTrading?.today?.trades || 0}
              color="text-cyan-400"
              icon={Activity}
              sub={`Vol: ${(dayTrading?.today?.total_volume || 0).toLocaleString()} shares`}
              tooltip="Number of day trades completed today"
            />
            <MetricCard
              label="Avg Hold"
              value={N(dayTrading?.today?.avg_hold_min).toFixed(1) + 'm'}
              color="text-violet-400"
              icon={Clock}
              sub="target < 60m"
              tooltip="Average hold time for today's day trades"
            />
            <MetricCard
              label="Streak"
              value={(N(dayTrading?.streak) > 0 ? '+' : '') + N(dayTrading?.streak)}
              color={N(dayTrading?.streak) > 0 ? 'text-emerald-400' : N(dayTrading?.streak) < 0 ? 'text-red-400' : 'text-zinc-500'}
              icon={Flame}
              sub={N(dayTrading?.streak) > 0 ? 'winning' : N(dayTrading?.streak) < 0 ? 'losing' : 'neutral'}
              tooltip="Current consecutive win/loss streak"
            />
          </div>

          {/* Session P&L by Hour */}
          {dayTrading?.session_pnl_by_hour && Object.keys(dayTrading.session_pnl_by_hour).length > 0 && (
            <div className="mb-5">
              <div className="text-[10px] uppercase tracking-wider text-zinc-500 mb-2">Session P&L by Hour</div>
              <div className="flex items-end gap-1 h-24 px-1">
                {(() => {
                  const hours = dayTrading.session_pnl_by_hour
                  const maxAbs = Math.max(...Object.values(hours).map(v => Math.abs(N(v))), 1)
                  return Object.entries(hours).map(([hr, pnl]) => {
                    const pct = (Math.abs(N(pnl)) / maxAbs) * 100
                    const isGreen = N(pnl) >= 0
                    return (
                      <div key={hr} className="flex-1 flex flex-col items-center justify-end h-full group relative">
                        <div className="absolute -top-8 hidden group-hover:block text-[10px] bg-black/90 border border-white/10 px-2 py-1 rounded-lg whitespace-nowrap z-20 shadow-xl">
                          <div className="font-semibold">{hr}:00</div>
                          <div className={isGreen ? 'text-emerald-400' : 'text-red-400'}>{fmt$(pnl)}</div>
                        </div>
                        <div
                          className={`w-full rounded-t-sm transition-all duration-300 hover:opacity-100 opacity-80 ${isGreen ? 'bg-gradient-to-t from-emerald-600/50 to-emerald-400/30' : 'bg-gradient-to-t from-red-600/50 to-red-400/30'}`}
                          style={{ height: Math.max(4, pct) + '%' }}
                        />
                        <span className="text-[8px] text-zinc-600 mt-1">{hr}</span>
                      </div>
                    )
                  })
                })()}
              </div>
            </div>
          )}

          {/* Day Trading Strategy Cards */}
          {dayTrading?.active_day_strategies?.length > 0 && (
            <div className="mb-5">
              <div className="text-[10px] uppercase tracking-wider text-zinc-500 mb-2 flex items-center gap-1.5">
                <Cpu className="w-3 h-3" /> Day Trading Strategies ({dayTrading.active_day_strategies.length})
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {dayTrading.active_day_strategies.map((s, i) => {
                  const statusColors = {
                    VALIDATED: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
                    TESTING: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
                    FAILING: 'bg-red-500/15 text-red-400 border-red-500/30',
                  }
                  return (
                    <div key={i} className="p-4 rounded-xl bg-black/40 border border-white/[0.04] hover:border-white/[0.08] transition-all duration-300">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-zinc-200">{s.name?.replace(/_/g, ' ')}</span>
                          {s.created_at && (Date.now() - new Date(s.created_at).getTime()) < 86400000 * 2 && (
                            <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 font-bold animate-pulse">NEW</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {s.created_at && <span className="text-[9px] text-zinc-600">{new Date(s.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>}
                          <span className={`text-[9px] px-2 py-0.5 rounded-full font-semibold border ${statusColors[s.status] || statusColors.TESTING}`}>
                            {s.status}
                          </span>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-2 mb-3">
                        <div className="text-center p-2 rounded-lg bg-white/[0.02]">
                          <div className="text-[9px] text-zinc-500 uppercase">Today</div>
                          <div className={`text-sm font-bold ${N(s.today_pnl) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{fmt$(s.today_pnl)}</div>
                          <div className="text-[9px] text-zinc-600">{s.today_trades} trades</div>
                        </div>
                        <div className="text-center p-2 rounded-lg bg-white/[0.02]">
                          <div className="text-[9px] text-zinc-500 uppercase">Win Rate</div>
                          <div className={`text-sm font-bold ${N(s.win_rate) >= 0.5 ? 'text-emerald-400' : 'text-amber-400'}`}>{(N(s.win_rate) * 100).toFixed(1)}%</div>
                          <div className="text-[9px] text-zinc-600">PF {s.profit_factor}</div>
                        </div>
                        <div className="text-center p-2 rounded-lg bg-white/[0.02]">
                          <div className="text-[9px] text-zinc-500 uppercase">Avg Hold</div>
                          <div className="text-sm font-bold text-violet-400">{N(s.avg_hold_min).toFixed(0)}m</div>
                          <div className="text-[9px] text-zinc-600">{s.total_trades} total</div>
                        </div>
                      </div>
                      <div className="flex items-center justify-end">
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Today's Intraday Trades */}
          {dayTrading?.intraday_trades?.length > 0 ? (
            <div>
              <div className="text-[10px] uppercase tracking-wider text-zinc-500 mb-2 flex items-center gap-1.5">
                <Radio className="w-3 h-3" /> Today's Trades ({dayTrading.intraday_trades.length})
              </div>
              <div className="space-y-1 max-h-64 overflow-y-auto pr-1">
                {dayTrading.intraday_trades.map((t, i) => (
                  <div key={i} className="flex items-center justify-between p-2.5 rounded-lg bg-white/[0.02] hover:bg-white/[0.04] transition-colors text-xs border border-transparent hover:border-white/[0.04]">
                    <div className="flex items-center gap-3">
                      <div className={`w-1 h-6 rounded-full flex-shrink-0 ${N(t.pnl) >= 0 ? 'bg-emerald-500' : 'bg-red-500'}`} />
                      <span className="font-bold min-w-[50px]">{t.symbol}</span>
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${t.direction === 'LONG' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>{t.direction}</span>
                      <span className="text-zinc-500 text-[10px]">{t.strategy?.replace(/_/g, ' ')}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] text-zinc-500 flex items-center gap-1"><Clock className="w-3 h-3" />{t.hold_min}m</span>
                      <span className={`font-semibold ${N(t.pnl) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{fmt$(t.pnl)}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${{
                        stop_loss: 'text-red-400 bg-red-500/10',
                        take_profit: 'text-emerald-400 bg-emerald-500/10',
                        trailing_stop: 'text-amber-400 bg-amber-500/10',
                      }[t.exit_reason] || 'text-zinc-500 bg-zinc-500/10'}`}>{(t.exit_reason || '').replace(/_/g, ' ')}</span>
                      <span className="text-[10px] text-zinc-600">{t.exit_time ? new Date(t.exit_time).toLocaleTimeString() : ''}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-zinc-700">
              <Zap className="w-8 h-8 mb-3 opacity-30" />
              <p className="text-sm">No day trades yet today</p>
              <p className="text-[11px] mt-1">
                {dayTrading?.week?.trades ? `${dayTrading.week.trades} day trades this week · ${fmt$(dayTrading.week.pnl)}` : 'Waiting for intraday signals'}
              </p>
            </div>
          )}

          {/* Week summary footer */}
          {dayTrading?.week && (
            <div className="mt-4 pt-3 border-t border-white/[0.04] flex items-center justify-between text-[11px]">
              <span className="text-zinc-600">7-day: {dayTrading.week.trades} trades · {(N(dayTrading.week.win_rate) * 100).toFixed(1)}% WR · avg hold {N(dayTrading.week.avg_hold_min).toFixed(0)}m</span>
              <span className={N(dayTrading.week.pnl) >= 0 ? 'text-emerald-400' : 'text-red-400'}>{fmt$(dayTrading.week.pnl)} this week</span>
            </div>
          )}
                  </div>{/* end collapse */}
        </GlowCard>

        </div>{/* end section-daytrading */}

        <CollapsibleSection
          id="crypto"
          title="Crypto Dashboard"
          subtitle={cryptoStrategies.length
            ? `${cryptoStrategies.length} crypto/forex strategies · ${cryptoPositions.length} live positions`
            : 'Crypto and forex strategies awaiting signals'}
          icon={Globe}
          iconColor="text-cyan-400"
          iconBg="from-cyan-500/20 via-blue-500/15 to-emerald-500/20 border-cyan-500/20"
          glow="bg-gradient-to-r from-cyan-500/20 via-blue-500/10 to-emerald-500/20"
          badge={cryptoStrategies.length ? fmt$(cryptoTotalPnl) : 'IDLE'}
          badgeColor={
            cryptoStrategies.length
              ? (cryptoTotalPnl >= 0
                ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                : 'bg-red-500/15 text-red-400 border-red-500/30')
              : 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20'
          }
          isOpen={openSections.crypto}
          onToggle={toggleSection}
        >
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 mb-5">
            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
              <div className="text-[11px] uppercase tracking-wider text-zinc-400 mb-1">Total Crypto P&amp;L</div>
              <div className={`text-2xl font-bold tracking-tight ${cryptoTotalPnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {fmt$(cryptoTotalPnl)}
              </div>
              <div className="text-[11px] text-zinc-500 mt-1">{cryptoStrategies.length} strategies tracked</div>
            </div>
            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
              <div className="text-[11px] uppercase tracking-wider text-zinc-400 mb-1">Active Positions</div>
              <div className="text-2xl font-bold tracking-tight text-white">{cryptoPositions.length}</div>
              <div className="text-[11px] text-zinc-500 mt-1">Open crypto and FX symbols</div>
            </div>
            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
              <div className="text-[11px] uppercase tracking-wider text-zinc-400 mb-1">Win Rate</div>
              <div className={`text-2xl font-bold tracking-tight ${cryptoWinRate >= 50 ? 'text-emerald-400' : cryptoWinRate > 0 ? 'text-amber-400' : 'text-zinc-500'}`}>
                {cryptoWinRate.toFixed(1)}%
              </div>
              <div className="text-[11px] text-zinc-500 mt-1">{cryptoWeightedTrades} weighted trades</div>
            </div>
            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
              <div className="text-[11px] uppercase tracking-wider text-zinc-400 mb-1">Best Strategy</div>
              <div className="text-lg font-bold tracking-tight text-white truncate">{cryptoBestStrategy?.displayName || '—'}</div>
              <div className={`text-[11px] mt-1 ${cryptoBestStrategy ? (cryptoBestStrategy.totalPnl >= 0 ? 'text-emerald-400' : 'text-red-400') : 'text-zinc-500'}`}>
                {cryptoBestStrategy ? fmt$(cryptoBestStrategy.totalPnl) : 'No crypto strategies'}
              </div>
            </div>
          </div>

          {/* Market Intelligence Feed */}
          {marketIntel && (
          <div className="mb-5">
            <div className="text-[10px] uppercase tracking-wider text-zinc-500 mb-2">Market Intelligence</div>
            <div className="grid grid-cols-2 xl:grid-cols-5 gap-3">
              {/* Fear & Greed */}
              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                <div className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1">Fear & Greed</div>
                <div className={`text-2xl font-black ${
                  N(marketIntel.fear_greed?.value) < 20 ? 'text-red-400' :
                  N(marketIntel.fear_greed?.value) < 40 ? 'text-amber-400' :
                  N(marketIntel.fear_greed?.value) < 60 ? 'text-zinc-300' :
                  N(marketIntel.fear_greed?.value) < 80 ? 'text-emerald-400' : 'text-emerald-300'
                }`}>{marketIntel.fear_greed?.value ?? '—'}</div>
                <div className="text-[10px] text-zinc-500">{marketIntel.fear_greed?.classification} → {marketIntel.fear_greed?.signal}</div>
              </div>
              {/* Sentiment */}
              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                <div className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1">Sentiment</div>
                <div className={`text-2xl font-black ${
                  N(marketIntel.sentiment_score) < 30 ? 'text-red-400' :
                  N(marketIntel.sentiment_score) < 45 ? 'text-amber-400' :
                  N(marketIntel.sentiment_score) < 55 ? 'text-zinc-300' : 'text-emerald-400'
                }`}>{N(marketIntel.sentiment_score).toFixed(0)}</div>
                <div className="text-[10px] text-zinc-500">{marketIntel.sentiment_label}</div>
              </div>
              {/* Macro */}
              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                <div className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1">Macro Regime</div>
                <div className={`text-lg font-bold ${
                  marketIntel.macro?.regime === 'RISK_ON' ? 'text-emerald-400' :
                  marketIntel.macro?.regime === 'CAUTIOUS' ? 'text-amber-400' : 'text-red-400'
                }`}>{marketIntel.macro?.regime?.replace('_', ' ') || '—'}</div>
                <div className="text-[10px] text-zinc-500">VIX: {marketIntel.macro?.vix ?? '—'} | Spread: {N(marketIntel.macro?.yield_spread_10y2y).toFixed(2)}</div>
              </div>
              {/* Trending */}
              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                <div className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1">Trending</div>
                <div className="text-sm font-semibold text-white">{(marketIntel.trending_coins || []).slice(0, 4).join(', ') || '—'}</div>
                <div className="text-[10px] text-zinc-500">CoinGecko top trending</div>
              </div>
              {/* Options P/C */}
              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                <div className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1">SPY P/C Ratio</div>
                <div className={`text-2xl font-black ${
                  N(marketIntel.options_flow?.SPY?.put_call_ratio) > 1.0 ? 'text-emerald-400' :
                  N(marketIntel.options_flow?.SPY?.put_call_ratio) > 0.7 ? 'text-zinc-300' : 'text-red-400'
                }`}>{N(marketIntel.options_flow?.SPY?.put_call_ratio).toFixed(2) || '—'}</div>
                <div className="text-[10px] text-zinc-500">{marketIntel.options_flow?.SPY?.signal || 'N/A'}</div>
              </div>
            </div>
          </div>
          )}

          <div className="mb-5">
            <div className="text-[10px] uppercase tracking-wider text-zinc-500 mb-2">Strategy Performance</div>
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] overflow-x-auto">
              <div className="min-w-[760px]">
                <div className="grid grid-cols-[minmax(0,1.7fr)_4.5rem_5rem_6rem_6rem_7rem_6rem] gap-3 px-4 py-3 border-b border-white/[0.06] text-[11px] uppercase tracking-wider text-zinc-500">
                  <span>Strategy</span>
                  <span className="text-right">Trades</span>
                  <span className="text-right">Win Rate</span>
                  <span className="text-right">P&amp;L</span>
                  <span className="text-right">Avg P&amp;L</span>
                  <span className="text-right">Capital</span>
                  <span className="text-right">Status</span>
                </div>
                {cryptoStrategiesSorted.length > 0 ? (
                  cryptoStrategiesSorted.map((strategy) => (
                    <div
                      key={strategy.rawName}
                      className="grid grid-cols-[minmax(0,1.7fr)_4.5rem_5rem_6rem_6rem_7rem_6rem] gap-3 px-4 py-3 border-b border-white/[0.04] last:border-b-0 hover:bg-white/[0.03] transition-colors"
                    >
                      <div className="min-w-0 flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${strategy.isEnabled ? 'bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.6)]' : 'bg-red-400 shadow-[0_0_10px_rgba(248,113,113,0.5)]'}`} />
                        <div className="min-w-0">
                          <div className="text-sm font-semibold text-white truncate">{strategy.displayName || strategy.rawName}</div>
                          <div className="text-[11px] text-zinc-500 truncate">{strategy.strategy_type || 'crypto/forex strategy'}</div>
                        </div>
                        {(strategy.rawName === 'Crypto_Narrative_Momentum' || strategy.rawName === 'Meme_Surge') && strategy.tradesCount === 0 && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 font-bold animate-pulse">NEW</span>
                        )}
                        {strategy.rawName === 'Meme_Surge' && strategy.tradesCount > 0 && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30 font-bold">🐸 MEME</span>
                        )}
                      </div>
                      <span className="text-sm text-zinc-300 text-right">{strategy.tradesCount}</span>
                      <span className={`text-sm font-semibold text-right ${strategy.winRate >= 50 ? 'text-emerald-400' : strategy.winRate > 0 ? 'text-amber-400' : 'text-zinc-500'}`}>
                        {strategy.winRate.toFixed(1)}%
                      </span>
                      <span className={`text-sm font-bold text-right ${strategy.totalPnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {fmt$(strategy.totalPnl)}
                      </span>
                      <span className={`text-sm text-right ${strategy.avgPnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {fmt$(strategy.avgPnl)}
                      </span>
                      <span className="text-sm text-zinc-300 text-right">
                        ${strategy.capital.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </span>
                      <div className="flex items-center justify-end gap-2">
                        <span className={`w-2 h-2 rounded-full ${strategy.isEnabled ? 'bg-emerald-400' : 'bg-red-400'}`} />
                        <span className={`text-[11px] font-medium ${strategy.isEnabled ? 'text-emerald-400' : 'text-red-400'}`}>
                          {strategy.isEnabled ? 'Enabled' : 'Disabled'}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="px-4 py-8 text-center">
                    <Globe className="w-7 h-7 mx-auto mb-2 text-zinc-700" />
                    <p className="text-sm text-zinc-500">No crypto or forex strategies found</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div>
            <div className="text-[10px] uppercase tracking-wider text-zinc-500 mb-2">Live Crypto Positions</div>
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] overflow-x-auto">
              {cryptoPositions.length > 0 ? (
                <div className="min-w-[720px]">
                  <div className="grid grid-cols-[6.5rem_6rem_7rem_7rem_6rem_minmax(0,1fr)_6rem] gap-3 px-4 py-3 border-b border-white/[0.06] text-[11px] uppercase tracking-wider text-zinc-500">
                    <span>Symbol</span>
                    <span>Direction</span>
                    <span className="text-right">Entry</span>
                    <span className="text-right">Current</span>
                    <span className="text-right">P&amp;L</span>
                    <span>Strategy</span>
                    <span className="text-right">Hold Time</span>
                  </div>
                  {cryptoPositions.map((position, index) => {
                    const entryTime = position.entry_time ? new Date(position.entry_time) : null
                    const holdMinutes = N(position.hold_duration_minutes) || (entryTime && !isNaN(entryTime.getTime()) ? (Date.now() - entryTime.getTime()) / 60000 : 0)
                    const strategyName = cleanCryptoStrategyName(position.strategy || position.strategy_name || '—')
                    return (
                      <div
                        key={`${position.symbol || 'crypto'}-${index}`}
                        className="grid grid-cols-[6.5rem_6rem_7rem_7rem_6rem_minmax(0,1fr)_6rem] gap-3 px-4 py-3 border-b border-white/[0.04] last:border-b-0 hover:bg-white/[0.03] transition-colors"
                      >
                        <span className="text-sm font-semibold text-white">{position.symbol}</span>
                        <span className={`text-sm font-semibold ${position.direction === 'SHORT' ? 'text-red-400' : 'text-emerald-400'}`}>
                          {position.direction === 'SHORT' ? 'SHORT' : 'LONG'}
                        </span>
                        <span className="text-sm text-zinc-300 text-right">{fmtAssetPrice(position.entry_price, position.symbol)}</span>
                        <span className="text-sm text-zinc-300 text-right">{fmtAssetPrice(position.current_price || position.market_price || position.entry_price, position.symbol)}</span>
                        <span className={`text-sm font-bold text-right ${N(position.unrealized_pnl) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                          {fmt$(position.unrealized_pnl)}
                        </span>
                        <span className="text-sm text-zinc-400 truncate">{strategyName}</span>
                        <span className="text-sm text-zinc-400 text-right">{fmtDuration(holdMinutes)}</span>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-10 text-zinc-600">
                  <Radio className="w-7 h-7 mb-2 opacity-40 animate-pulse" />
                  <p className="text-sm text-zinc-500">No open positions</p>
                  <p className="text-[11px] text-zinc-600 mt-1">Crypto and forex symbols will appear here when active.</p>
                </div>
              )}
            </div>
          </div>
        </CollapsibleSection>

        {/* ═══ OIL & GAS — COMMODITY SURGE ═══ */}
        <CollapsibleSection
          id="commodity"
          title="Oil & Gas — Commodity Surge"
          subtitle={commodityStrategies.length
            ? `${commodityStrategies.length} strategies · ${commodityPositions.length} live positions · ${commodityTrades} trades`
            : 'Commodity_Surge & Oil_Sector_Rotation · Energy ETFs + Equities + Airline Shorts'}
          icon={TrendingUp}
          iconColor="text-amber-400"
          iconBg="from-amber-500/20 via-orange-500/15 to-red-500/20 border-amber-500/20"
          glow="bg-gradient-to-r from-amber-500/20 via-orange-500/10 to-red-500/20"
          badge={commodityStrategies.length ? fmt$(commodityTotalPnl) : 'NEW'}
          badgeColor={commodityTotalPnl >= 0 ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}
          isOpen={openSections.commodity}
          onToggle={toggleSection}
        >
          <div className="space-y-4">
            {/* Strategy overview cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-white/[0.03] rounded-xl p-3 border border-white/[0.06]">
                <div className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1">Total P&L</div>
                <div className={`text-lg font-bold ${commodityTotalPnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {fmt$(commodityTotalPnl)}
                </div>
              </div>
              <div className="bg-white/[0.03] rounded-xl p-3 border border-white/[0.06]">
                <div className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1">Win Rate</div>
                <div className={`text-lg font-bold ${commodityWR >= 0.5 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {commodityTrades > 0 ? `${(commodityWR * 100).toFixed(0)}%` : '—'}
                </div>
              </div>
              <div className="bg-white/[0.03] rounded-xl p-3 border border-white/[0.06]">
                <div className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1">Trades</div>
                <div className="text-lg font-bold text-white">{commodityTrades || 0}</div>
              </div>
              <div className="bg-white/[0.03] rounded-xl p-3 border border-white/[0.06]">
                <div className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1">Open Positions</div>
                <div className="text-lg font-bold text-white">{commodityPositions.length}</div>
              </div>
            </div>

            {/* Regime context */}
            <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-amber-400 text-sm font-bold">🛢️ Oil Surge Context</span>
                <span className="text-[10px] text-zinc-500 bg-zinc-800 px-2 py-0.5 rounded-full">US-Iran escalation active</span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs text-zinc-400">
                <div>
                  <span className="text-emerald-400 font-medium">LONG: </span>
                  XLE, XOP, USO, XOM, CVX, OXY, COP — energy breakout
                </div>
                <div>
                  <span className="text-red-400 font-medium">SHORT: </span>
                  UAL, DAL, AAL — airline inverse (fuel cost squeeze)
                </div>
              </div>
            </div>

            {/* Watchlist */}
            <div>
              <div className="text-[11px] text-zinc-500 font-medium uppercase tracking-wider mb-2">Watchlist — Key Oil Symbols</div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {_OIL_WATCH.map(({ sym, label, emoji }) => {
                  const livePos = commodityPositions.find(p => (p.symbol || '').toUpperCase() === sym)
                  const isAirline = _AIRLINES.has(sym)
                  return (
                    <div key={sym} className={`bg-white/[0.03] border rounded-lg p-2.5 ${livePos ? 'border-amber-500/40 bg-amber-500/5' : 'border-white/[0.06]'}`}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[11px] text-zinc-500">{emoji}</span>
                        {livePos && (
                          <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${livePos.direction === 'LONG' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                            {livePos.direction}
                          </span>
                        )}
                        {!livePos && isAirline && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold bg-red-500/10 text-red-500">SHORT target</span>
                        )}
                      </div>
                      <div className="text-xs font-bold text-white">{sym}</div>
                      <div className="text-[10px] text-zinc-500">{label}</div>
                      {livePos && (
                        <div className={`text-[10px] font-medium mt-1 ${(livePos.unrealized_pnl || 0) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                          {fmt$((livePos.unrealized_pnl || 0))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Active positions from commodity strategies */}
            {commodityPositions.length > 0 && (
              <div>
                <div className="text-[11px] text-zinc-500 font-medium uppercase tracking-wider mb-2">Live Positions</div>
                <div className="space-y-2">
                  {commodityPositions.map((p, i) => (
                    <div key={i} className="flex items-center justify-between bg-white/[0.03] border border-white/[0.06] rounded-lg px-3 py-2">
                      <div className="flex items-center gap-3">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded ${p.direction === 'LONG' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                          {p.direction}
                        </span>
                        <span className="text-sm font-medium">{p.symbol}</span>
                        <span className="text-[10px] text-zinc-500">qty {Number(p.quantity || 0).toFixed(2)}</span>
                      </div>
                      <div className={`text-sm font-bold ${(p.unrealized_pnl || 0) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {fmt$((p.unrealized_pnl || 0))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Strategy status */}
            {commodityStrategies.length > 0 ? (
              <div className="space-y-2">
                {commodityStrategies.map((s, i) => (
                  <div key={i} className="flex items-center justify-between bg-white/[0.03] border border-white/[0.06] rounded-lg px-3 py-2.5">
                    <div>
                      <div className="text-sm font-medium">{(s.name || s.strategy_name || '').replace(/_/g, ' ')}</div>
                      <div className="text-[10px] text-zinc-500">{s.tradesCount || 0} trades · {((s.winRate || 0) * 100).toFixed(0)}% WR</div>
                    </div>
                    <div className={`text-sm font-bold ${(s.totalPnl || 0) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {fmt$(s.totalPnl || 0)}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-zinc-600 text-sm">
                🛢️ Commodity strategies registered — awaiting Monday open signals
              </div>
            )}
          </div>
        </CollapsibleSection>

        <div id="section-options" data-section="options">
        {/* ═══ OPTIONS GREEKS — FOCUS TICKERS ═══ */}
        <GlowCard glow={openSections.options ? "bg-gradient-to-r from-orange-500/20 via-violet-500/20 to-cyan-500/20" : ""} className="p-5">
          <button onClick={() => toggleSection('options')} className="w-full flex items-center justify-between group">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-orange-500/20 to-violet-500/20 border border-orange-500/20">
                <Layers className="w-5 h-5 text-orange-400" />
              </div>
              <div className="text-left">
                <h3 className="text-lg font-bold tracking-tight">Options Flow — Greeks & IV</h3>
                <p className="text-[11px] text-zinc-500">13 focus tickers · Black-Scholes IV + Greeks · Session-based</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] px-2 py-1 rounded-lg bg-orange-500/10 text-orange-400 border border-orange-500/20 font-medium">GREEKS</span>
              <ChevronDown className={`w-4 h-4 text-zinc-600 group-hover:text-zinc-400 transition-all duration-300 ${openSections.options ? 'rotate-180' : ''}`} />
            </div>
          </button>
          <div className={`overflow-hidden transition-all duration-500 ${openSections.options ? 'max-h-[5000px] opacity-100 mt-5' : 'max-h-0 opacity-0 mt-0'}`}>

          {greeksData?.sessions ? (
            <div className="space-y-4">
              {Object.entries(greeksData.sessions).map(([sessionKey, session]) => (
                <div key={sessionKey}>
                  <div className="text-[10px] uppercase tracking-wider text-zinc-500 mb-2 flex items-center gap-1.5">
                    <Globe className="w-3 h-3" /> {session.label}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {session.tickers.map(t => (
                      <div key={t.ticker} className={`p-3 rounded-xl border transition-all ${t.available ? 'bg-black/40 border-white/[0.06] hover:border-white/[0.10]' : 'bg-black/20 border-white/[0.03] opacity-50'}`}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-bold text-sm text-zinc-200">{t.ticker}</span>
                          {t.available ? (
                            <span className="text-xs text-zinc-400 font-medium">${N(t.spot).toFixed(2)}</span>
                          ) : (
                            <span className="text-[10px] text-zinc-600">No data</span>
                          )}
                        </div>
                        {t.available && t.topContracts && t.topContracts.length > 0 ? (
                          <div className="space-y-1">
                            <div className="flex items-center gap-1 text-[9px] text-zinc-600 uppercase mb-1">
                              <span className="w-8">Type</span>
                              <span className="w-14">Strike</span>
                              <span className="w-10 text-right">IV</span>
                              <span className="w-12 text-right">Delta</span>
                              <span className="w-12 text-right">Theta</span>
                              <span className="w-10 text-right">Vol</span>
                            </div>
                            {t.topContracts.map((c, ci) => (
                              <div key={ci} className="flex items-center gap-1 text-[10px]">
                                <span className={`w-8 font-bold ${c.type === 'call' ? 'text-emerald-400' : 'text-red-400'}`}>
                                  {c.type === 'call' ? 'C' : 'P'}
                                </span>
                                <span className="w-14 text-zinc-300">{c.strike}</span>
                                <span className={`w-10 text-right font-medium ${N(c.iv) > 0.5 ? 'text-orange-400' : N(c.iv) > 0.3 ? 'text-amber-400' : 'text-zinc-400'}`}>
                                  {(N(c.iv) * 100).toFixed(0)}%
                                </span>
                                <span className={`w-12 text-right ${N(c.delta) > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                  {N(c.delta).toFixed(2)}
                                </span>
                                <span className="w-12 text-right text-red-400/70">{N(c.theta).toFixed(2)}</span>
                                <span className="w-10 text-right text-zinc-500">{N(c.volume).toLocaleString()}</span>
                              </div>
                            ))}
                          </div>
                        ) : t.available ? (
                          <div className="text-[10px] text-zinc-600 italic">No active contracts</div>
                        ) : null}
                        {t.stats && (
                          <div className="mt-2 text-[9px] text-zinc-600">
                            {t.stats.with_greeks}/{t.stats.total} contracts with Greeks
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-zinc-700">
              <Layers className="w-8 h-8 mb-3 opacity-30" />
              <p className="text-sm">Loading options Greeks data...</p>
              <p className="text-[11px] mt-1">Fetching from /api/options-greeks</p>
            </div>
          )}
                  </div>{/* end collapse */}
        </GlowCard>
        </div>{/* end section-options */}

        <div id="section-positions" data-section="positions">
        {/* ═══ POSITIONS + TRADES GRID ═══ */}
        <GlowCard className="p-2">
          <button onClick={() => toggleSection('positions')} className="w-full flex items-center justify-between p-3 group">
            <div className="flex items-center gap-3">
              <Activity className="w-4 h-4 text-blue-400" />
              <span className="text-sm font-bold">Positions & Trades</span>
              <span className="text-[10px] text-zinc-500">{isLive ? '0 open · 0 recent' : `${pos.length} open · ${trades?.length || 0} recent`}</span>
            </div>
            <ChevronDown className={`w-4 h-4 text-zinc-600 group-hover:text-zinc-400 transition-all duration-300 ${openSections.positions ? 'rotate-180' : ''}`} />
          </button>
        </GlowCard>
        <div className={`overflow-hidden transition-all duration-500 ${openSections.positions ? 'max-h-[5000px] opacity-100 mt-2' : 'max-h-0 opacity-0 mt-0'}`}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Open Positions */}
          <GlowCard className="p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/20">
                <Activity className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <h3 className="font-bold">Open Positions</h3>
                <p className="text-[11px] text-zinc-500">{isLive ? 'No live positions' : `${pos.length} active across all strategies`}</p>
              </div>
            </div>
            {isLive ? (
              <div className="text-center py-8">
                <div className="text-zinc-600 text-sm">No live capital deployed</div>
                <div className="text-zinc-700 text-xs mt-1">Switch to Paper to view simulated positions</div>
              </div>
            ) : pos?.length > 0 ? (
              <div className="space-y-1.5 max-h-80 overflow-y-auto pr-1">
                {pos.map((p, i) => {
                  const entryTime = p.entry_time ? new Date(p.entry_time) : null
                  const durationMs = entryTime ? (new Date() - entryTime) : 0
                  const durationMins = durationMs / 60000
                  // Options expiration: use expiration_time if set, else entry + 30d for options/SHORT
                  const expiry = p.expiration_time
                    ? new Date(p.expiration_time)
                    : (p.trade_type === 'option' || p.strategy?.includes('ETF_'))
                      ? new Date((entryTime || new Date()).getTime() + 30 * 86400000)
                      : null
                  const entryFmt = entryTime
                    ? entryTime.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
                    : '—'
                  // Stop distance %
                  const cur = N(p.current_price || p.entry_price)
                  const sl = N(p.stop_loss)
                  const tp = N(p.take_profit)
                  const slDist = (sl > 0 && cur > 0)
                    ? (p.direction === 'LONG' ? ((cur - sl) / cur * 100) : ((sl - cur) / cur * 100))
                    : null
                  const tpDist = (tp > 0 && cur > 0)
                    ? (p.direction === 'LONG' ? ((tp - cur) / cur * 100) : ((cur - tp) / cur * 100))
                    : null
                  return (
                    <div key={i} className="p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.04] transition-colors border border-transparent hover:border-white/[0.04]">
                      {/* Row 1: Symbol + direction + P&L */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${p.direction === 'LONG' ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-red-500/10 border border-red-500/20'}`}>
                            {p.direction === 'LONG' ? <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400" /> : <ArrowDownRight className="w-3.5 h-3.5 text-red-400" />}
                          </div>
                          <div>
                            <div className="font-bold text-sm">{p.symbol}</div>
                            <div className="text-[10px] text-zinc-500">{(p.strategy || p.strategy_name)?.replace(/ETF_|_/g, ' ').trim()} · qty {N(p.quantity)}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`text-sm font-bold ${N(p.unrealized_pnl) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                            {fmt$(p.unrealized_pnl)}
                          </div>
                          <div className={`text-[11px] font-medium ${N(p.unrealized_pnl_pct) >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                            {(N(p.unrealized_pnl_pct) * 100).toFixed(2)}%
                          </div>
                        </div>
                      </div>
                      {/* Row 2: Entry details */}
                      <div className="mt-2 flex items-center gap-3 flex-wrap text-[10px]">
                        <span className="flex items-center gap-1 text-zinc-400">
                          <Clock className="w-3 h-3" />
                          In: <span className="text-zinc-300 font-medium">{entryFmt}</span>
                        </span>
                        <span className="text-zinc-600">·</span>
                        <span className="text-zinc-400">
                          Held: <span className="text-zinc-300 font-medium">{fmtDuration(durationMins)}</span>
                        </span>
                        {expiry && (
                          <>
                            <span className="text-zinc-600">·</span>
                            <span className={`flex items-center gap-1 ${getTimeColor(expiry)}`}>
                              Exp: <span className="font-medium">{fmtTimeRemaining(expiry)}</span>
                            </span>
                          </>
                        )}
                        <span className="text-zinc-600">·</span>
                        <span className="text-zinc-400">
                          @<span className="text-zinc-300 font-medium">${N(p.entry_price).toFixed(2)}</span>
                        </span>
                      </div>
                      {/* Row 3: SL / TP targets */}
                      <div className="mt-1.5 flex items-center gap-3 text-[10px]">
                        {sl > 0 && (
                          <span className={`flex items-center gap-1 px-1.5 py-0.5 rounded bg-red-500/10 ${slDist !== null && slDist < 2 ? 'text-red-300 font-bold' : 'text-red-400'}`}>
                            SL ${sl.toFixed(2)}{slDist !== null ? ` (${slDist.toFixed(1)}% away)` : ''}
                          </span>
                        )}
                        {tp > 0 && (
                          <span className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400">
                            TP ${tp.toFixed(2)}{tpDist !== null ? ` (+${tpDist.toFixed(1)}%)` : ''}
                          </span>
                        )}
                        {!sl && !tp && <span className="text-zinc-600 italic">No stops set</span>}
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-zinc-700">
                <Eye className="w-8 h-8 mb-3 opacity-30" />
                <p className="text-sm">No open positions</p>
                <p className="text-[11px] mt-1">{getMarketStatus().label}</p>
              </div>
            )}
          </GlowCard>

          {/* Recent Trades */}
          <GlowCard className="p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-xl bg-violet-500/10 border border-violet-500/20">
                <BarChart3 className="w-5 h-5 text-violet-400" />
              </div>
              <div>
                <h3 className="font-bold">Recent Trades</h3>
                <p className="text-[11px] text-zinc-500">{isLive ? 'No live trades' : `Last 7 days · ${trades?.length || 0} trades`}</p>
              </div>
            </div>
            {isLive ? (
              <div className="text-center py-8">
                <div className="text-zinc-600 text-sm">No live trades executed</div>
                <div className="text-zinc-700 text-xs mt-1">Switch to Paper to view simulated trades</div>
              </div>
            ) : trades?.length > 0 ? (
              <div className="space-y-1.5 max-h-80 overflow-y-auto pr-1">
                {trades.slice(0, 20).map((t, i) => {
                  const holdMins = t.hold_duration_minutes || (
                    t.entry_time && t.exit_time
                      ? (new Date(t.exit_time) - new Date(t.entry_time)) / 60000
                      : 0
                  )
                  const entryFmt = t.entry_time
                    ? new Date(t.entry_time).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
                    : '—'
                  const exitFmt = t.exit_time
                    ? new Date(t.exit_time).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
                    : '—'
                  const reasonColor = {
                    stop_loss: 'text-red-400 bg-red-500/10',
                    take_profit: 'text-emerald-400 bg-emerald-500/10',
                    trailing_stop: 'text-amber-400 bg-amber-500/10',
                    manual: 'text-zinc-400 bg-zinc-500/10',
                    signal: 'text-blue-400 bg-blue-500/10',
                  }[t.exit_reason] || 'text-zinc-500 bg-zinc-500/10'
                  return (
                    <div key={i} className="p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.04] transition-colors border border-transparent hover:border-white/[0.04]">
                      {/* Row 1: Symbol + direction + realized P&L */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`w-1 h-8 rounded-full flex-shrink-0 ${N(t.pnl) >= 0 ? 'bg-emerald-500' : 'bg-red-500'}`} />
                          <div>
                            <div className="text-sm font-bold flex items-center gap-1.5">
                              {t.symbol}
                              <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${t.direction === 'LONG' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>{t.direction}</span>
                              <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${reasonColor}`}>{(t.exit_reason || '').replace(/_/g,' ')}</span>
                            </div>
                            <div className="text-[10px] text-zinc-500">{(t.strategy || t.strategy_name)?.replace(/ETF_|_/g, ' ').trim()}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`text-sm font-bold ${N(t.pnl) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                            {fmt$(t.pnl)}
                          </div>
                          <div className={`text-[11px] font-medium ${N(t.pnl_pct) >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                            {(N(t.pnl_pct) * 100).toFixed(2)}%
                          </div>
                        </div>
                      </div>
                      {/* Row 2: Entry → Exit timeline */}
                      <div className="mt-1.5 flex items-center gap-2 text-[10px] text-zinc-500 flex-wrap">
                        <span>In: <span className="text-zinc-300">{entryFmt}</span></span>
                        <span className="text-zinc-700">→</span>
                        <span>Out: <span className="text-zinc-300">{exitFmt}</span></span>
                        <span className="text-zinc-700">·</span>
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" /><span className="text-zinc-300">{fmtDuration(holdMins)}</span></span>
                      </div>
                      {/* Row 3: Entry / Exit prices */}
                      <div className="mt-1 flex items-center gap-3 text-[10px]">
                        <span className="text-zinc-500">Entry <span className="text-zinc-200 font-medium">${N(t.entry_price).toFixed(2)}</span></span>
                        <span className="text-zinc-700">→</span>
                        <span className="text-zinc-500">Exit <span className="text-zinc-200 font-medium">${N(t.exit_price).toFixed(2)}</span></span>
                        <span className="text-zinc-700">·</span>
                        <span className="text-zinc-500">qty <span className="text-zinc-300">{t.quantity}</span></span>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-zinc-700">
                <BarChart3 className="w-8 h-8 mb-3 opacity-30" />
                <p className="text-sm">No trades yet</p>
                <p className="text-[11px] mt-1">{getMarketStatus().label}</p>
              </div>
            )}
          </GlowCard>
        </div>

        </div>{/* end collapse positions */}
        </div>{/* end section-positions */}

        <div id="section-global" data-section="global">
        {/* ═══ GLOBAL MARKETS ═══ */}
        {globalData && (
          <GlowCard glow="bg-gradient-to-r from-blue-500/20 to-emerald-500/20" className="p-5">
          <button onClick={() => toggleSection('global')} className="w-full flex items-center justify-between group">
            <div className="flex items-center gap-3">
<div className="flex items-center gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/20">
                  <Globe className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold tracking-tight">Global Markets</h3>
                  <p className="text-[11px] text-zinc-500">
                    {globalData.coverage?.currently_open || 0} exchange{globalData.coverage?.currently_open !== 1 ? 's' : ''} open · {globalData.accuracy?.total_signals || 0} signals tracked
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">
                  1H: {N(globalData.accuracy?.accuracy_1h).toFixed(1)}%
                </span>
                {globalData.accuracy?.accuracy_4h > 0 && (
                  <span className="text-[10px] px-2.5 py-1 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-semibold">
                    4H: {N(globalData.accuracy?.accuracy_4h).toFixed(1)}%
                  </span>
                )}
              </div>
            </div>
            </div>
            <ChevronDown className={`w-4 h-4 text-zinc-600 group-hover:text-zinc-400 transition-all duration-300 ${openSections.global ? 'rotate-180' : ''}`} />
          </button>
          <div className={`overflow-hidden transition-all duration-500 ${openSections.global ? 'max-h-[5000px] opacity-100 mt-5' : 'max-h-0 opacity-0 mt-0'}`}>

            {/* Exchange Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-5">
              {(globalData.exchanges || []).map(ex => {
                const signalCount = (globalData.by_exchange || []).find(b => b.exchange === ex.code)?.count || 0
                const hasSignals = signalCount > 0
                // Determine exchange status
                const getStatus = () => {
                  // Only show OPEN if exchange is actually open right now (is_open from API) or truly 24/7 (crypto/forex with always_open)
                  const _alwaysOpenCodes = new Set(['CRYPTO', 'FOREX'])
                  if (ex.is_open || (ex.always_open && _alwaysOpenCodes.has(ex.code))) return { label: 'OPEN', style: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30', dot: 'bg-emerald-500', ping: true, card: 'bg-emerald-500/[0.06] border-emerald-500/20 shadow-emerald-500/5 shadow-lg' }
                  if (!ex.hours) return { label: 'CLOSED', style: 'bg-red-500/15 text-red-400 border-red-500/20', dot: 'bg-red-500', ping: false, card: 'bg-white/[0.015] border-white/[0.04] opacity-60' }
                  const parts = ex.hours.match(/(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})/)
                  const localParts = (ex.local_time || '').match(/(\d{1,2}):(\d{2})/)
                  if (parts && localParts) {
                    const nowMins = parseInt(localParts[1]) * 60 + parseInt(localParts[2])
                    const openMins = parseInt(parts[1]) * 60 + parseInt(parts[2])
                    const closeMins = parseInt(parts[3]) * 60 + parseInt(parts[4])
                    if (nowMins >= openMins - 90 && nowMins < openMins) return { label: 'OPENS SOON', style: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/20', dot: 'bg-cyan-500', ping: true, card: 'bg-cyan-500/[0.04] border-cyan-500/15' }
                    if (nowMins > closeMins && nowMins < closeMins + 120) return { label: 'AFTER HOURS', style: 'bg-amber-500/15 text-amber-400 border-amber-500/20', dot: 'bg-amber-500', ping: false, card: 'bg-amber-500/[0.03] border-amber-500/10' }
                  }
                  return { label: 'CLOSED', style: 'bg-red-500/15 text-red-400 border-red-500/20', dot: 'bg-red-500', ping: false, card: 'bg-white/[0.015] border-white/[0.04] opacity-60' }
                }
                const status = getStatus()
                return (
                  <div key={ex.code} className={`p-3 rounded-xl border transition-all duration-300 ${status.card}`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-sm font-bold ${status.label === 'CLOSED' ? 'text-zinc-500' : 'text-zinc-200'}`}>{ex.code}</span>
                      <div className="flex items-center gap-1.5">
                        <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold border ${status.style}`}>
                          {status.label}
                        </span>
                        <span className="relative flex h-2 w-2">
                          {status.ping && <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${status.dot} opacity-60`} />}
                          <span className={`relative inline-flex rounded-full h-2 w-2 ${status.dot}`} />
                        </span>
                      </div>
                    </div>
                    <div className="text-[10px] text-zinc-500 mb-1">{ex.region} · {ex.currency}</div>
                    <div className="text-[10px] text-zinc-600">{ex.local_time} · {ex.hours}</div>
                    {signalCount > 0 && (
                      <div className="mt-1.5">
                        <span className="text-[10px] text-zinc-400">{signalCount} signal{signalCount !== 1 ? 's' : ''}</span>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Recent Global Signals */}
            {(globalData.signals || []).length > 0 && (
              <div>
                <div className="text-[10px] uppercase tracking-wider text-zinc-600 mb-2">Latest Signals</div>
                <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
                  {(globalData.signals || []).filter((s, i, arr) => arr.findIndex(x => x.symbol === s.symbol && x.direction === s.direction) === i).slice(0, 10).map((s, i) => (
                    <div key={i} className="flex items-center justify-between p-2.5 rounded-lg bg-white/[0.02] hover:bg-white/[0.04] transition-colors text-xs">
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-zinc-300 min-w-[45px]">{s.exchange}</span>
                        <span className="font-semibold min-w-[80px]">{s.symbol}</span>
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${s.direction?.toUpperCase() === 'LONG' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                          {s.direction?.toUpperCase() === 'LONG' ? '▲ LONG' : '▼ SHORT'}
                        </span>
                        <span className="text-zinc-500 truncate max-w-[100px]">{s.strategy}</span>
                      </div>
                      <div className="text-right text-zinc-500 flex items-center gap-2">
                        {N(s.entry_price) > 0 && <span>${N(s.entry_price).toFixed(2)}</span>}
                        <span className="text-[10px]">{(() => { if (!s.signal_time) return ''; const t = new Date(s.signal_time); if (isNaN(t)) return ''; const d = (Date.now() - t.getTime()) / 60000; if (d < 0 || d > 100000) return ''; return d < 1 ? 'just now' : d < 60 ? `${Math.floor(d)}m ago` : d < 1440 ? `${Math.floor(d/60)}h ago` : `${Math.floor(d/1440)}d ago` })()}</span>
                        {(() => { if (!s.signal_time) return null; const t = new Date(s.signal_time); if (isNaN(t)) return null; const mins = (Date.now() - t.getTime()) / 60000; return mins >= 0 && mins < 5 ? <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> : null })()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
                    </div>{/* end collapse */}
        </GlowCard>
        )}

        </div>{/* end section-global */}

        <div id="section-pnl" data-section="pnl">
        {/* ═══ DAILY P&L ═══ */}
        <GlowCard className="p-5">
          <button onClick={() => toggleSection('pnl')} className="w-full flex items-center justify-between group">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                <TrendingUp className="w-5 h-5 text-emerald-400" />
              </div>
              <div className="text-left">
                <h3 className="font-bold">P&L Performance</h3>
                <p className="text-[11px] text-zinc-500">Combined performance across all strategies</p>
              </div>
            </div>
            <ChevronDown className={`w-4 h-4 text-zinc-600 group-hover:text-zinc-400 transition-all duration-300 ${openSections.pnl ? 'rotate-180' : ''}`} />
          </button>
          <div className={`overflow-hidden transition-all duration-500 ${openSections.pnl ? 'max-h-[5000px] opacity-100 mt-5' : 'max-h-0 opacity-0 mt-0'}`}>

          {/* Period Toggle */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-1 p-0.5 rounded-lg bg-white/[0.03] border border-white/[0.04]">
              {[
                { key: 'day', label: '1D', days: 1 },
                { key: 'week', label: '1W', days: 7 },
                { key: 'month', label: '1M', days: 30 },
                { key: 'all', label: 'ALL', days: 999 },
              ].map(({ key, label, days }) => (
                <button
                  key={key}
                  onClick={() => setPnlPeriod(key)}
                  className={`px-3 py-1 rounded-md text-[11px] font-semibold transition-all duration-200 ${
                    pnlPeriod === key
                      ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-sm'
                      : 'text-zinc-500 hover:text-zinc-300 border border-transparent'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            {(() => {
              const rangeData = effectiveDailyPnl.slice(pnlPeriod === 'day' ? -1 : pnlPeriod === 'week' ? -7 : pnlPeriod === 'month' ? -30 : 0)
              const totalPnl = rangeData.reduce((s, d) => s + N(d.pnl || d.daily_pnl), 0)
              const totalDays = rangeData.length
              return (
                <div className="flex items-center gap-3">
                  <span className={`text-lg font-bold ${totalPnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {fmt$(totalPnl)}
                  </span>
                  <span className="text-[10px] text-zinc-500">{totalDays} day{totalDays !== 1 ? 's' : ''}</span>
                </div>
              )
            })()}
          </div>

          {effectiveDailyPnl.length > 0 ? (
            <>
              <PnLChart data={effectiveDailyPnl.slice(pnlPeriod === 'day' ? -1 : pnlPeriod === 'week' ? -7 : pnlPeriod === 'month' ? -30 : 0)} height={260} trades={trades} />
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/[0.04]">
                <div className="flex items-center gap-4">
                  {effectiveDailyPnl.slice(-5).reverse().map((d, i) => (
                    <div key={i} className="text-[10px]">
                      <span className="text-zinc-500">{d.date}: </span>
                      <span className={N(d.pnl || d.daily_pnl) >= 0 ? 'text-emerald-400 font-semibold' : 'text-red-400 font-semibold'}>
                        {fmt$(d.pnl || d.daily_pnl)}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="text-[10px] text-zinc-500">
                  {effectiveDailyPnl.length} days tracked
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-zinc-700">
              <TrendingUp className="w-8 h-8 mb-3 opacity-30" />
              <p className="text-sm">No daily P&L data yet</p>
              <p className="text-[11px] mt-1">Will populate as trades close</p>
            </div>
          )}
                  </div>{/* end collapse */}
        </GlowCard>

        </div>{/* end section-pnl */}

        {/* Footer */}
        <div className="text-center py-6">
          <p className="text-[11px] text-zinc-700">
            SYGNL Paper Trading Engine v2.0 · {lb?.length || 0} strategies · {totalTrades} total trades · {globalData ? '6 exchanges' : ''} · 24/7 Global Coverage
          </p>
        </div>
      </main>
    </div>
  )
}
