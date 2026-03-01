// SYGNL v2 Dashboard — Sprint 6
'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import {
  TrendingUp, TrendingDown, Activity, Target, Zap, BarChart3,
  RefreshCw, Trophy, AlertTriangle, CheckCircle, XCircle,
  DollarSign, ArrowUpRight, ArrowDownRight, Shield, Radio,
  Brain, Layers, ChevronRight, Clock, Globe, Flag, Grid3x3
} from 'lucide-react'

const V2_API = 'http://localhost:3003'

const fmt$ = (v) => {
  const n = Number(v) || 0
  const abs = Math.abs(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  return (n >= 0 ? '+$' : '-$') + abs
}

const fmtRaw$ = (v) => {
  const n = Number(v) || 0
  return '$' + Math.abs(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

const fmtPct = (v) => {
  const n = Number(v) || 0
  return (n >= 0 ? '+' : '') + (n * 100).toFixed(2) + '%'
}

const fmtScore = (v) => (Number(v) || 0).toFixed(4)

// Safe-access container fields that may be missing from API
const safeContainer = (c) => ({
  win_rate: 0, expectancy: 0, daily_risk_used: 0, daily_risk_cap: 0,
  sharpe: 0, max_drawdown: 0, total_trades: 0, today_pnl: 0, today_trades: 0,
  name: c.id, phase: 'paper', score: 0, open_positions: 0,
  ...c,
})

const parseArr = (v) => {
  if (Array.isArray(v)) return v
  if (typeof v === 'string') { try { const p = JSON.parse(v); if (Array.isArray(p)) return p } catch {} }
  return []
}

const profileColors = {
  options: 'bg-purple-500/20 text-purple-300 border border-purple-500/30',
  aggressive: 'bg-red-500/20 text-red-300 border border-red-500/30',
  balanced: 'bg-blue-500/20 text-blue-300 border border-blue-500/30',
  conservative: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30',
}

const phaseColors = {
  paper: 'bg-zinc-700/50 text-zinc-300',
  micro: 'bg-amber-500/20 text-amber-300',
  live: 'bg-emerald-500/20 text-emerald-300',
}

const regimeConfig = {
  Normal: { icon: '🟢', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/30' },
  Elevated: { icon: '🟡', color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/30' },
  Crisis: { icon: '🔴', color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/30' },
  Unknown: { icon: '⚪', color: 'text-zinc-400', bg: 'bg-zinc-500/10 border-zinc-500/30' },
}

// ============================================================
// LIVE STATUS BAR — real-time engine state at a glance
// ============================================================
function LiveStatusBar({ containers, signals, events, lastUpdated }) {
  // Derive live stats
  const openPositions = containers.reduce((sum, c) => sum + (c.open_positions || 0), 0)
  const todayTrades = containers.reduce((sum, c) => sum + (c.today_trades || c.total_trades || 0), 0)
  const todayPnl = containers.reduce((sum, c) => sum + (c.today_pnl || 0), 0)
  const activeContainers = containers.filter(c => c.enabled !== false).length
  const lastSignal = signals.length > 0 ? signals[0] : null

  // Use API-provided blackout status (from FRED)
  const now = new Date()
  const activeBlackouts = (events || []).filter(e => e.blackout_status === 'ACTIVE')
  const upcomingBlackouts = (events || []).filter(e => e.blackout_status === 'APPROACHING')

  // Market status
  const hour = now.getUTCHours()
  const minute = now.getUTCMinutes()
  // Proper ET conversion using Intl API (handles DST correctly)
  const etTime = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/New_York' }))
  const etHour = etTime.getHours() + etTime.getMinutes() / 60
  const etDay = etTime.getDay() // 0=Sun, 6=Sat
  const isWeekend = etDay === 0 || etDay === 6
  const isPremarket = !isWeekend && etHour >= 4 && etHour < 9.5
  const isMarketOpen = !isWeekend && etHour >= 9.5 && etHour < 16
  const isAfterHours = !isWeekend && etHour >= 16 && etHour < 20

  let marketStatus = '🔴 Closed'
  let marketColor = 'text-zinc-500'
  if (isMarketOpen) { marketStatus = '🟢 Market Open'; marketColor = 'text-emerald-400' }
  else if (isPremarket) { marketStatus = '🟡 Pre-Market'; marketColor = 'text-amber-400' }
  else if (isAfterHours) { marketStatus = '🟡 After Hours'; marketColor = 'text-amber-400' }

  // Engine status
  const rawTs = lastSignal ? (lastSignal.timestamp || lastSignal.created_at) : null
  const parsedTs = rawTs ? new Date(rawTs.endsWith('Z') ? rawTs : rawTs + 'Z') : null
  const lastScanAge = parsedTs ? Math.round((now - parsedTs) / 1000) : null
  const engineHealthy = lastScanAge !== null && lastScanAge < 600  // < 10 min
  const engineStatus = engineHealthy ? '🟢 Scanning' : lastScanAge === null ? '⚪ No Data' : '🔴 Stale'

  return (
    <div className="bg-zinc-900/90 border border-zinc-800 rounded-xl p-3 backdrop-blur">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs">
        {/* Engine Status */}
        <div className="flex items-center gap-2">
          <span className="text-zinc-500 uppercase tracking-wider font-medium">Engine</span>
          <span className={engineHealthy ? 'text-emerald-400' : 'text-red-400'}>{engineStatus}</span>
          {lastScanAge !== null && (
            <span className="text-zinc-600">{lastScanAge < 60 ? `${lastScanAge}s ago` : `${Math.round(lastScanAge / 60)}m ago`}</span>
          )}
        </div>

        <div className="h-3 w-px bg-zinc-700" />

        {/* Market */}
        <div className="flex items-center gap-2">
          <span className="text-zinc-500 uppercase tracking-wider font-medium">Market</span>
          <span className={marketColor}>{marketStatus}</span>
        </div>

        <div className="h-3 w-px bg-zinc-700" />

        {/* Positions */}
        <div className="flex items-center gap-2">
          <span className="text-zinc-500 uppercase tracking-wider font-medium">Open</span>
          <span className="text-white font-mono">{openPositions}</span>
          <span className="text-zinc-600">positions</span>
        </div>

        <div className="h-3 w-px bg-zinc-700" />

        {/* Today's P&L */}
        <div className="flex items-center gap-2">
          <span className="text-zinc-500 uppercase tracking-wider font-medium">Day P&L</span>
          <span className={`font-mono ${todayPnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {todayPnl >= 0 ? '+' : ''}{todayPnl.toFixed(2)}
          </span>
        </div>

        <div className="h-3 w-px bg-zinc-700" />

        {/* Containers */}
        <div className="flex items-center gap-2">
          <span className="text-zinc-500 uppercase tracking-wider font-medium">Containers</span>
          <span className="text-white font-mono">{activeContainers}</span>
          <span className="text-zinc-600">active</span>
        </div>

        {/* Active blackout — red, urgent */}
        {activeBlackouts.length > 0 && (
          <>
            <div className="h-3 w-px bg-zinc-700" />
            <div className="flex items-center gap-2 bg-red-500/15 border border-red-500/30 rounded px-2 py-0.5">
              <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
              <span className="text-red-400 font-bold uppercase tracking-wide">
                {activeBlackouts.map(e => e.type || e.name).join(', ')} Blackout
              </span>
            </div>
          </>
        )}

        {/* Upcoming events */}
        {upcomingBlackouts.length > 0 && activeBlackouts.length === 0 && (
          <>
            <div className="h-3 w-px bg-zinc-700" />
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-amber-400 font-medium">
                {upcomingBlackouts.map(e => e.name || e.type || 'Event').join(', ')} approaching
              </span>
            </div>
          </>
        )}

        {/* Last signal */}
        {lastSignal && (
          <>
            <div className="h-3 w-px bg-zinc-700" />
            <div className="flex items-center gap-2">
              <Radio className="w-3 h-3 text-blue-400 animate-pulse" />
              <span className="text-zinc-400">Last:</span>
              <span className={`font-mono ${(lastSignal.direction || '').toUpperCase() === 'SHORT' ? 'text-red-400' : (lastSignal.direction || '').toUpperCase() === 'LONG' ? 'text-emerald-400' : 'text-zinc-500'}`}>
                {lastSignal.symbol} {(lastSignal.direction || '—').toUpperCase()}
              </span>
              <span className="text-zinc-600">{(Number(lastSignal.confidence || 0) * 100).toFixed(0)}%</span>
              {parseArr(lastSignal.routed_to).length > 0 && (
                <span className="text-emerald-400">→ {parseArr(lastSignal.routed_to).join(', ')}</span>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// Mini sparkline SVG
function Sparkline({ data = [], width = 80, height = 28 }) {
  if (!data || data.length < 2) {
    return <div style={{ width, height }} className="flex items-center justify-center text-zinc-700 text-xs">—</div>
  }
  const vals = data.map(d => (typeof d === 'object' ? d.v : d))
  const min = Math.min(...vals)
  const max = Math.max(...vals)
  const range = max - min || 1
  const pts = vals.map((v, i) => {
    const x = (i / (vals.length - 1)) * width
    const y = height - ((v - min) / range) * height
    return `${x},${y}`
  }).join(' ')
  const lastVal = vals[vals.length - 1]
  const color = lastVal >= vals[0] ? '#34d399' : '#f87171'
  return (
    <svg width={width} height={height} className="overflow-visible">
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  )
}

// Progress bar
function ProgressBar({ value = 0, max = 1, color = 'bg-blue-500', label = '' }) {
  const pct = Math.min((value / max) * 100, 100)
  const barColor = pct > 80 ? 'bg-red-500' : pct > 50 ? 'bg-amber-500' : color
  return (
    <div className="w-full">
      {label && <div className="flex justify-between text-xs text-zinc-500 mb-1">
        <span>{label}</span>
        <span>{pct.toFixed(0)}%</span>
      </div>}
      <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${barColor}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// PANEL 1: Container Cards
// ─────────────────────────────────────────────
function ContainerCard({ container: _c }) {
  const container = safeContainer(_c)
  const pnlColor = container.today_pnl >= 0 ? 'text-emerald-400' : 'text-red-400'
  const totalColor = container.total_pnl >= 0 ? 'text-emerald-400' : 'text-red-400'

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex flex-col gap-3 hover:border-zinc-700 transition-colors">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="font-semibold text-white text-sm truncate">{container.name}</div>
          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
            <span className="text-xs text-zinc-400 font-mono">{container.symbol}</span>
            <span className={`text-xs px-1.5 py-0.5 rounded capitalize font-medium ${profileColors[container.profile] || 'bg-zinc-700 text-zinc-300'}`}>
              {container.profile}
            </span>
          </div>
        </div>
        <span className={`text-xs px-2 py-0.5 rounded-full capitalize shrink-0 ${phaseColors[container.phase] || 'bg-zinc-700 text-zinc-300'}`}>
          {container.phase}
        </span>
      </div>

      {/* Sparkline */}
      <div className="flex items-center justify-between">
        <Sparkline data={container.equity_curve} width={100} height={32} />
        <div className="text-right">
          <div className={`text-sm font-bold ${totalColor}`}>{fmt$(container.total_pnl)}</div>
          <div className="text-xs text-zinc-500">total PnL</div>
        </div>
      </div>

      {/* Today PnL */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-zinc-500">Today</span>
        <span className={`text-sm font-semibold ${pnlColor}`}>{fmt$(container.today_pnl)}</span>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-3 gap-2 text-xs">
        <div className="bg-zinc-800/50 rounded-lg p-2 text-center">
          <div className="text-zinc-400">Win Rate</div>
          <div className="text-white font-semibold mt-0.5">{(container.win_rate * 100).toFixed(1)}%</div>
        </div>
        <div className="bg-zinc-800/50 rounded-lg p-2 text-center">
          <div className="text-zinc-400">Trades</div>
          <div className="text-white font-semibold mt-0.5">{container.total_trades}</div>
        </div>
        <div className="bg-zinc-800/50 rounded-lg p-2 text-center">
          <div className="text-zinc-400">Expect.</div>
          <div className={`font-semibold mt-0.5 ${container.expectancy >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {container.expectancy >= 0 ? '+' : ''}{container.expectancy.toFixed(2)}
          </div>
        </div>
      </div>

      {/* Risk bar */}
      <div>
        <ProgressBar
          value={container.daily_risk_used}
          max={container.daily_risk_cap}
          color="bg-blue-500"
          label={`Risk: $${container.daily_risk_used.toFixed(0)} / $${container.daily_risk_cap}`}
        />
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// PANEL 2: Portfolio Overview (Enhanced)
// ─────────────────────────────────────────────
// ─────────────────────────────────────────────
// SYGNL SCORE — Composite readiness gauge
// ─────────────────────────────────────────────
function SygnlScorePanel({ data }) {
  if (!data) return null
  const score = data.sygnl_score || 0
  const comps = data.components || {}
  const statusColors = { green: 'text-emerald-400', orange: 'text-amber-400', yellow: 'text-yellow-400', red: 'text-red-400' }
  const statusBg = { green: 'bg-emerald-500/10 border-emerald-500/30', orange: 'bg-amber-500/10 border-amber-500/30', yellow: 'bg-yellow-500/10 border-yellow-500/30', red: 'bg-red-500/10 border-red-500/30' }
  const color = statusColors[data.status_color] || 'text-zinc-400'
  const bg = statusBg[data.status_color] || 'bg-zinc-800/50'

  const CompBar = ({ label, comp, icon }) => {
    const s = comp?.score || 0
    const w = comp?.weight || 0
    const passes = comp?.passes
    const barColor = s >= 70 ? 'bg-emerald-500' : s >= 40 ? 'bg-amber-500' : 'bg-red-500'
    return (
      <div className="flex items-center gap-3 group">
        <span className="text-zinc-500 text-xs w-24 shrink-0">{icon} {label}</span>
        <div className="flex-1 h-2 bg-zinc-800 rounded-full overflow-hidden">
          <div className={`h-full rounded-full transition-all duration-700 ${barColor}`} style={{ width: `${Math.min(s, 100)}%` }} />
        </div>
        <span className={`text-xs font-mono w-10 text-right ${s >= 70 ? 'text-emerald-400' : s >= 40 ? 'text-amber-400' : 'text-red-400'}`}>{s.toFixed(0)}</span>
        <span className="text-xs w-4">{passes ? '✅' : '❌'}</span>
      </div>
    )
  }

  return (
    <div className={`border rounded-xl p-5 ${bg}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h2 className="text-white font-semibold text-lg">SYGNL Score</h2>
          <span className={`text-3xl font-bold font-mono ${color}`}>{score.toFixed(1)}</span>
          <span className="text-zinc-500 text-sm">/ 100</span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-xs font-semibold px-2 py-1 rounded ${color} ${bg}`}>{data.status}</span>
          {data.go_live_ready && <span className="text-xs bg-emerald-500/20 text-emerald-300 px-2 py-1 rounded font-bold animate-pulse">🚀 LIVE READY</span>}
        </div>
      </div>

      <div className="space-y-2.5">
        <CompBar label="Calibration" comp={comps.calibration} icon="🎯" />
        <CompBar label="Expectancy" comp={comps.expectancy} icon="💰" />
        <CompBar label="Sharpe" comp={comps.sharpe} icon="📈" />
        <CompBar label="Drawdown" comp={comps.drawdown} icon="🛡️" />
        <CompBar label="Confidence" comp={comps.confidence} icon="📊" />
      </div>

      <div className="mt-4 pt-3 border-t border-zinc-700/50 flex items-center justify-between text-xs text-zinc-500">
        <span>{data.total_trades || 0} trades · {comps.confidence?.total_trades || 0}/{comps.confidence?.target || 200} for confidence gate</span>
        <span>Deploy threshold: ≥{data.deploy_threshold}</span>
      </div>
    </div>
  )
}

function PortfolioPanel({ portfolio, stats, exposure }) {
  if (!portfolio) return <div className="text-zinc-500 text-sm">Loading portfolio...</div>

  const p = {
    regime: 'Unknown', total_pnl: 0, total_equity: 0, vix: null,
    combined_sharpe: 0, max_drawdown_pct: 0, daily_risk_used: 0, daily_risk_cap: 0,
    ...portfolio,
  }
  const regime = p.regime
  const rc = regimeConfig[regime] || regimeConfig.Unknown
  const pnlColor = p.total_pnl >= 0 ? 'text-emerald-400' : 'text-red-400'
  const s = {
    realized_vol_5d: 0, realized_vol_60d: 0, sharpe_30d_rolling: 0,
    combined_win_rate_weighted: 0, max_drawdown_pct: 0, ...stats,
  }

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-white font-semibold flex items-center gap-2">
          <Layers className="w-4 h-4 text-blue-400" />
          Combined Portfolio
        </h2>
        <div className={`flex items-center gap-2 text-sm px-3 py-1 rounded-full border ${rc.bg}`}>
          <span>{rc.icon}</span>
          <span className={rc.color}>{regime}</span>
          {p.vix && <span className="text-zinc-400 text-xs">VIX {Number(p.vix).toFixed(1)}</span>}
          {s.realized_vol_5d !== undefined && (
            <span className="text-zinc-500 text-xs">Vol5d: {(s.realized_vol_5d * 100).toFixed(1)}%</span>
          )}
          {s.realized_vol_60d !== undefined && (
            <span className="text-zinc-500 text-xs">Vol60d: {(s.realized_vol_60d * 100).toFixed(1)}%</span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <div className="bg-zinc-800/50 rounded-xl p-3">
          <div className="text-zinc-400 text-xs mb-1">Total Equity</div>
          <div className="text-white text-lg font-bold">{fmtRaw$(p.total_equity || p.total_capital)}</div>
          <div className={`text-xs mt-0.5 ${pnlColor}`}>{fmt$(p.total_pnl)} all-time</div>
          {exposure && exposure.total_exposure_usd > 0 && (() => {
            const equity = p.total_equity || p.total_capital || 1
            const expUsd = exposure.total_exposure_usd
            const expPct = (expUsd / equity * 100)
            const expColor = expPct > 80 ? 'text-red-400' : expPct > 50 ? 'text-amber-400' : 'text-emerald-400'
            return (
              <div className={`text-xs mt-1 ${expColor}`}>
                {fmtRaw$(expUsd)} exposed ({expPct.toFixed(1)}%)
              </div>
            )
          })()}
        </div>
        <div className="bg-zinc-800/50 rounded-xl p-3">
          <div className="text-zinc-400 text-xs mb-1">Today PnL</div>
          <div className={`text-lg font-bold ${(p.today_pnl || 0) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {fmt$(p.today_pnl || 0)}
          </div>
          <div className="text-xs text-zinc-500 mt-0.5">{p.containers || p.active_containers || 0} containers</div>
        </div>
        <div className="bg-zinc-800/50 rounded-xl p-3">
          <div className="text-zinc-400 text-xs mb-1">30d Sharpe</div>
          <div className={`text-lg font-bold ${(s.sharpe_30d_rolling || p.combined_sharpe || 0) >= 0.5 ? 'text-emerald-400' : (s.sharpe_30d_rolling || p.combined_sharpe || 0) >= 0 ? 'text-amber-400' : 'text-red-400'}`}>
            {Number(s.sharpe_30d_rolling || p.combined_sharpe || 0).toFixed(3)}
          </div>
          <div className="text-xs text-zinc-500 mt-0.5">Target: &gt;0.5</div>
        </div>
        <div className="bg-zinc-800/50 rounded-xl p-3">
          <div className="text-zinc-400 text-xs mb-1">Max Drawdown</div>
          <div className={`text-lg font-bold ${(p.max_drawdown_pct || 0) <= 5 ? 'text-emerald-400' : (p.max_drawdown_pct || 0) <= 10 ? 'text-amber-400' : 'text-red-400'}`}>
            {Number(p.max_drawdown_pct || 0).toFixed(2)}%
          </div>
          <div className="text-xs text-zinc-500 mt-0.5">Limit: 10%</div>
        </div>
      </div>

      {/* Enhanced stats row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
        <div className="bg-zinc-800/30 rounded-lg p-2 text-center">
          <div className="text-zinc-500 text-xs">Win Rate (wtd)</div>
          <div className={`text-sm font-semibold mt-0.5 ${(s.combined_win_rate_weighted || 0) > 0.55 ? 'text-emerald-400' : (s.combined_win_rate_weighted || 0) > 0.45 ? 'text-amber-400' : 'text-red-400'}`}>
            {((s.combined_win_rate_weighted || 0) * 100).toFixed(1)}%
          </div>
        </div>
        <div className="bg-zinc-800/30 rounded-lg p-2 text-center">
          <div className="text-zinc-500 text-xs">Trades Today</div>
          <div className="text-sm font-semibold text-white mt-0.5">{s.trades_today || 0}</div>
        </div>
        <div className="bg-zinc-800/30 rounded-lg p-2 text-center">
          <div className="text-zinc-500 text-xs">This Week</div>
          <div className="text-sm font-semibold text-white mt-0.5">{s.trades_this_week || 0}</div>
        </div>
        <div className="bg-zinc-800/30 rounded-lg p-2 text-center">
          <div className="text-zinc-500 text-xs">All Time</div>
          <div className="text-sm font-semibold text-white mt-0.5">{s.trades_all_time || 0}</div>
        </div>
        <div className="bg-zinc-800/30 rounded-lg p-2 text-center">
          <div className="text-zinc-500 text-xs">Max DD %</div>
          <div className={`text-sm font-semibold mt-0.5 ${(s.max_drawdown_pct || 0) < 5 ? 'text-emerald-400' : (s.max_drawdown_pct || 0) < 10 ? 'text-amber-400' : 'text-red-400'}`}>
            {Number(s.max_drawdown_pct || 0).toFixed(2)}%
          </div>
        </div>
      </div>

      <div className="mt-3">
        <ProgressBar
          value={p.daily_risk_used || 0}
          max={p.daily_risk_cap || 1}
          color="bg-blue-500"
          label={`Daily Risk: $${Number(p.daily_risk_used || 0).toFixed(0)} / $${p.daily_risk_cap || 0} limit`}
        />
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// NEW: Container Heatmap
// ─────────────────────────────────────────────
function ContainerHeatmap({ containers: _containers }) {
  const containers = (_containers || []).map(safeContainer)
  if (containers.length === 0) return null

  const cellBg = (value, type) => {
    if (type === 'winrate') {
      if (value > 0.55) return 'bg-emerald-500/20 text-emerald-300'
      if (value > 0.45) return 'bg-amber-500/20 text-amber-300'
      return 'bg-red-500/20 text-red-300'
    }
    if (type === 'expectancy') {
      if (value > 0) return 'bg-emerald-500/20 text-emerald-300'
      return 'bg-red-500/20 text-red-300'
    }
    if (type === 'dd') {
      if (value < 5) return 'bg-emerald-500/20 text-emerald-300'
      if (value < 8) return 'bg-amber-500/20 text-amber-300'
      return 'bg-red-500/20 text-red-300'
    }
    return 'bg-zinc-800/50 text-zinc-300'
  }

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
      <h2 className="text-white font-semibold flex items-center gap-2 mb-4">
        <Grid3x3 className="w-4 h-4 text-blue-400" />
        Container Heatmap
      </h2>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-zinc-500 border-b border-zinc-800">
              <th className="text-left py-2 pr-3 min-w-[140px]">Container</th>
              <th className="text-center py-2 px-2">Win Rate</th>
              <th className="text-center py-2 px-2">Expectancy</th>
              <th className="text-center py-2 px-2">Trades Today</th>
              <th className="text-center py-2 px-2">Max DD</th>
              <th className="text-center py-2 px-2">Phase</th>
              <th className="text-center py-2 px-2">Deep Dive</th>
            </tr>
          </thead>
          <tbody>
            {containers.map(c => {
              const ddPct = c.capital > 0 ? (c.max_drawdown / c.capital * 100) : 0
              return (
                <tr key={c.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/20 transition-colors">
                  <td className="py-2 pr-3">
                    <div className="font-medium text-white">{c.name}</div>
                    <div className="text-zinc-500 text-xs">{c.symbol}</div>
                  </td>
                  <td className="py-1.5 px-2">
                    <div className={`rounded px-2 py-1 text-center font-semibold ${cellBg(c.win_rate, 'winrate')}`}>
                      {(c.win_rate * 100).toFixed(1)}%
                    </div>
                  </td>
                  <td className="py-1.5 px-2">
                    <div className={`rounded px-2 py-1 text-center font-semibold ${cellBg(c.expectancy, 'expectancy')}`}>
                      {c.expectancy >= 0 ? '+' : ''}{Number(c.expectancy).toFixed(2)}
                    </div>
                  </td>
                  <td className="py-1.5 px-2">
                    <div className="rounded px-2 py-1 text-center bg-zinc-800/50 text-zinc-300 font-semibold">
                      {/* today trades would require extra fetch; show total for now */}
                      {c.total_trades}
                    </div>
                  </td>
                  <td className="py-1.5 px-2">
                    <div className={`rounded px-2 py-1 text-center font-semibold ${cellBg(ddPct, 'dd')}`}>
                      {ddPct.toFixed(1)}%
                    </div>
                  </td>
                  <td className="py-1.5 px-2">
                    <div className="rounded px-2 py-1 text-center bg-zinc-700/50 text-zinc-300 capitalize">
                      {c.phase}
                    </div>
                  </td>
                  <td className="py-1.5 px-2 text-center">
                    <Link href={`/v2/container/${c.id}`} className="text-blue-400 hover:text-blue-300 underline">
                      →
                    </Link>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// NEW: Signal Correlation Matrix
// ─────────────────────────────────────────────
function CorrelationMatrix({ correlation }) {
  if (!correlation || !correlation.matrix) return null

  const ids = Object.keys(correlation.matrix)
  if (ids.length === 0) return null

  const getCellColor = (val, rowId, colId) => {
    if (rowId === colId) return 'bg-zinc-700 text-zinc-300'
    const abs = Math.abs(val)
    if (abs >= 0.85) return 'bg-red-500/40 text-red-200 font-bold'
    if (abs >= 0.7) return 'bg-amber-500/20 text-amber-300'
    if (abs >= 0.5) return 'bg-zinc-700/50 text-zinc-300'
    return 'bg-zinc-800/30 text-zinc-500'
  }

  // Short labels
  const shortId = (id) => id.replace('SPY_', 'S-').replace('QQQ_', 'Q-')
    .replace('Options', 'Opt').replace('Aggressive', 'Agg')
    .replace('Balanced', 'Bal').replace('Conservative', 'Con')

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
      <h2 className="text-white font-semibold flex items-center gap-2 mb-4">
        <Activity className="w-4 h-4 text-purple-400" />
        Signal Correlation Matrix
        <span className="text-xs text-zinc-500 font-normal ml-1">(correlation of signal directions)</span>
      </h2>
      <div className="overflow-x-auto">
        <table className="text-xs border-collapse">
          <thead>
            <tr>
              <th className="p-1 text-zinc-500 text-left w-20"></th>
              {ids.map(id => (
                <th key={id} className="p-1 text-zinc-500 text-center w-14">{shortId(id)}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ids.map(rowId => (
              <tr key={rowId}>
                <td className="p-1 text-zinc-400 text-right pr-2 whitespace-nowrap">{shortId(rowId)}</td>
                {ids.map(colId => {
                  const val = correlation.matrix[rowId]?.[colId] ?? 0
                  return (
                    <td key={colId} className="p-0.5">
                      <div className={`w-14 h-8 rounded flex items-center justify-center text-xs ${getCellColor(val, rowId, colId)}`}>
                        {rowId === colId ? '—' : Number(val).toFixed(2)}
                      </div>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {correlation.alerts && correlation.alerts.length > 0 && (
        <div className="mt-3 space-y-1">
          {correlation.alerts.map((a, i) => (
            <div key={i} className="flex items-center gap-2 text-xs bg-red-500/10 border border-red-500/20 rounded px-3 py-1.5">
              <AlertTriangle className="w-3 h-3 text-red-400 shrink-0" />
              <span className="text-red-300">High correlation: {a.pair.join(' ↔ ')} = {Number(a.correlation).toFixed(3)}</span>
            </div>
          ))}
        </div>
      )}
      {(!correlation.alerts || correlation.alerts.length === 0) && (
        <div className="mt-2 text-xs text-zinc-600">No high-correlation alerts (all pairs &lt; 0.85)</div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────
// NEW: Portfolio Equity Curve (stacked area)
// ─────────────────────────────────────────────
const CONTAINER_COLORS = [
  '#34d399', '#60a5fa', '#f59e0b', '#a78bfa',
  '#f87171', '#fb923c', '#22d3ee', '#e879f9'
]

function PortfolioEquityCurve({ equityCurve, containers }) {
  if (!equityCurve || !equityCurve.dates || equityCurve.dates.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-zinc-600 text-sm">
        No equity curve data yet
      </div>
    )
  }

  const { dates, total_equity, per_container } = equityCurve
  const W = 700, H = 180, PAD = 35
  const n = dates.length
  const maxEq = Math.max(...total_equity, 1)
  const minEq = Math.min(...total_equity)
  const range = maxEq - minEq || 1

  const xScale = (i) => PAD + (i / Math.max(n - 1, 1)) * (W - PAD * 2)
  const yScale = (v) => H - PAD - ((v - minEq) / range) * (H - PAD * 2)

  const cids = Object.keys(per_container)
  const totalPath = total_equity.map((v, i) => `${i === 0 ? 'M' : 'L'}${xScale(i).toFixed(1)},${yScale(v).toFixed(1)}`).join(' ')

  // Donut data
  const lastEquities = cids.map(cid => per_container[cid][per_container[cid].length - 1] || 0)
  const totalLast = lastEquities.reduce((a, b) => a + b, 0) || 1

  const donutSlices = []
  let angle = -Math.PI / 2
  cids.forEach((cid, i) => {
    const pct = lastEquities[i] / totalLast
    const sweep = pct * 2 * Math.PI
    const x1 = 60 + 45 * Math.cos(angle)
    const y1 = 60 + 45 * Math.sin(angle)
    const x2 = 60 + 45 * Math.cos(angle + sweep)
    const y2 = 60 + 45 * Math.sin(angle + sweep)
    const large = sweep > Math.PI ? 1 : 0
    donutSlices.push({ cid, color: CONTAINER_COLORS[i % CONTAINER_COLORS.length], pct, path: `M60,60 L${x1.toFixed(1)},${y1.toFixed(1)} A45,45,0,${large},1,${x2.toFixed(1)},${y2.toFixed(1)} Z` })
    angle += sweep
  })

  return (
    <div className="flex flex-col lg:flex-row gap-4">
      <div className="flex-1">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: H }}>
          {/* Individual container lines */}
          {cids.map((cid, ci) => {
            const vals = per_container[cid]
            const path = vals.map((v, i) => `${i === 0 ? 'M' : 'L'}${xScale(i).toFixed(1)},${yScale(v).toFixed(1)}`).join(' ')
            return <path key={cid} d={path} fill="none" stroke={CONTAINER_COLORS[ci % CONTAINER_COLORS.length]} strokeWidth="1" opacity="0.5" />
          })}
          {/* Total line overlay */}
          <path d={totalPath} fill="none" stroke="#ffffff" strokeWidth="2" strokeLinejoin="round" />
          {/* Labels */}
          {[minEq, maxEq].map((v, i) => (
            <text key={i} x={PAD - 4} y={yScale(v) + 4} textAnchor="end" fill="#71717a" fontSize="9">
              ${(v / 1000).toFixed(0)}k
            </text>
          ))}
          {n > 1 && [0, n - 1].map(i => (
            <text key={i} x={xScale(i)} y={H - 4} textAnchor="middle" fill="#71717a" fontSize="9">
              {dates[i]?.slice(5) || ''}
            </text>
          ))}
        </svg>
      </div>
      {/* Donut chart */}
      <div className="flex flex-col items-center gap-2">
        <div className="text-xs text-zinc-500 mb-1">Risk Allocation</div>
        <svg width={120} height={120} viewBox="0 0 120 120">
          {donutSlices.map(s => (
            <path key={s.cid} d={s.path} fill={s.color} opacity="0.8" />
          ))}
          <circle cx={60} cy={60} r={28} fill="#18181b" />
          <text x={60} y={65} textAnchor="middle" fill="#a1a1aa" fontSize="9">Alloc</text>
        </svg>
        <div className="grid grid-cols-2 gap-x-3 gap-y-0.5">
          {cids.map((cid, i) => (
            <div key={cid} className="flex items-center gap-1 text-xs">
              <div className="w-2 h-2 rounded-full shrink-0" style={{ background: CONTAINER_COLORS[i % CONTAINER_COLORS.length] }} />
              <span className="text-zinc-400 truncate max-w-[60px]">{cid.replace('SPY_', 'S-').replace('QQQ_', 'Q-')}</span>
              <span className="text-zinc-500">{(lastEquities[i] / totalLast * 100).toFixed(0)}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// NEW: Milestone Sidebar
// ─────────────────────────────────────────────
// ─────────────────────────────────────────────
// PANEL 3: Signal Feed
// ─────────────────────────────────────────────
function SignalRow({ signal }) {
  const dir = (signal.direction || signal.nar_direction || '').toUpperCase()
  const dirColor = dir === 'LONG' ? 'text-emerald-400' : dir === 'SHORT' ? 'text-red-400' : 'text-zinc-400'
  // Parse UTC timestamp and display in local time
  const raw = signal.timestamp || signal.created_at
  const ts = raw ? new Date(raw.endsWith('Z') ? raw : raw + 'Z') : null
  const timeStr = ts && !isNaN(ts) ? ts.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '—'
  const conf = Number(signal.confidence || signal.calibrated_prob || 0)
  const routed = parseArr(signal.routed_to)
  const family = signal.family || '—'
  const price = Number(signal.price || 0)

  // Parse metadata for extra context
  let meta = {}
  try { meta = typeof signal.metadata === 'string' ? JSON.parse(signal.metadata) : (signal.metadata || {}) } catch {}

  return (
    <div className="flex flex-wrap items-center gap-2 px-3 py-2 hover:bg-zinc-800/40 rounded-lg text-xs transition-colors">
      <span className="text-zinc-500 font-mono w-20 shrink-0">{timeStr}</span>
      <span className="text-white font-bold shrink-0">{signal.symbol}</span>
      <span className={`uppercase font-semibold w-12 shrink-0 ${dirColor}`}>{dir}</span>
      <span className="text-zinc-500">{family}</span>
      <span className={`font-mono ${conf >= 0.7 ? 'text-emerald-400' : conf >= 0.55 ? 'text-amber-400' : 'text-zinc-500'}`}>
        {(conf * 100).toFixed(1)}%
      </span>
      {price > 0 && <span className="text-zinc-600 font-mono">@{price > 100 ? price.toFixed(2) : price.toFixed(4)}</span>}
      {meta.spread_bps && <span className="text-zinc-600">{Number(meta.spread_bps).toFixed(1)}bps</span>}
      {routed.length > 0 && <span className="text-emerald-400/70">→ {routed.join(', ')}</span>}
      {signal.stop_loss && <span className="text-red-400/50 ml-auto">SL {Number(signal.stop_loss).toFixed(2)}</span>}
    </div>
  )
}

// ─────────────────────────────────────────────
// PANEL: Exposure (Open Positions)
// ─────────────────────────────────────────────
function ExposurePanel({ data }) {
  const positions = data?.positions || []
  const totalExposure = data?.total_exposure_usd || 0

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-white font-semibold flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-cyan-400" />
          Live Exposure
        </h2>
        <div className="flex items-center gap-2">
          <span className="text-xs text-zinc-500">{positions.length} open</span>
          <span className="text-xs font-mono text-cyan-400">${totalExposure.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
        </div>
      </div>
      {positions.length === 0 ? (
        <div className="text-zinc-600 text-sm text-center py-6">No open positions</div>
      ) : (
        <div className="space-y-2">
          {positions.map((p) => {
            const isLong = p.direction === 'LONG'
            return (
              <div key={p.position_id} className={`rounded-lg border p-3 ${isLong ? 'border-emerald-800/50 bg-emerald-500/5' : 'border-red-800/50 bg-red-500/5'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${isLong ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                      {p.direction}
                    </span>
                    <span className="text-white text-sm font-semibold">{p.symbol}</span>
                    <span className="text-zinc-500 text-[10px]">{p.container}</span>
                  </div>
                  <span className="text-white text-sm font-mono">${p.market_value?.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                </div>
                <div className="flex items-center gap-3 mt-1.5 text-[10px] text-zinc-500 font-mono">
                  <span>Entry: ${p.entry_price?.toFixed(2)}</span>
                  <span>Size: {p.size}</span>
                  {p.stop_loss && <span className="text-red-400">SL: ${p.stop_loss?.toFixed(2)}</span>}
                  {p.take_profit && <span className="text-emerald-400">TP: ${p.take_profit?.toFixed(2)}</span>}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function SignalFeed({ signals, loading }) {
  const listRef = useRef(null)

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex flex-col flex-1 max-h-[520px]">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-white font-semibold flex items-center gap-2">
          <Radio className="w-4 h-4 text-emerald-400" />
          Live Signal Feed
        </h2>
        <div className="flex items-center gap-2">
          {loading && <RefreshCw className="w-3 h-3 text-zinc-500 animate-spin" />}
          <span className="text-xs text-zinc-500">{signals.length} signals</span>
        </div>
      </div>
      <div ref={listRef} className="flex-1 overflow-y-auto space-y-0.5 scrollbar-thin scrollbar-thumb-zinc-700">
        {signals.length === 0 ? (
          <div className="text-zinc-600 text-sm text-center py-8">No signals yet — waiting for market action...</div>
        ) : (
          signals.map((s, i) => <SignalRow key={s.id || i} signal={s} />)
        )}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// PANEL 4: Leaderboard
// ─────────────────────────────────────────────
function Leaderboard({ leaderboard: _lb }) {
  const leaderboard = (_lb || []).map(safeContainer)
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
      <h2 className="text-white font-semibold flex items-center gap-2 mb-3">
        <Trophy className="w-4 h-4 text-amber-400" />
        Container Leaderboard
      </h2>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-zinc-500 border-b border-zinc-800">
              <th className="text-left py-2 pr-3 w-8">#</th>
              <th className="text-left py-2 pr-3">Container</th>
              <th className="text-right py-2 pr-3">Score</th>
              <th className="text-right py-2 pr-3">Win%</th>
              <th className="text-right py-2 pr-3">Sharpe</th>
              <th className="text-right py-2 pr-3">Expect.</th>
              <th className="text-right py-2 pr-3">Max DD</th>
              <th className="text-right py-2">Phase</th>
            </tr>
          </thead>
          <tbody>
            {leaderboard.map((c, i) => {
              const rowColor = i < 3
                ? 'bg-emerald-500/5 hover:bg-emerald-500/10'
                : i >= leaderboard.length - 3
                  ? 'bg-amber-500/5 hover:bg-amber-500/10'
                  : 'hover:bg-zinc-800/40'
              const rankIcon = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}`
              return (
                <tr key={c.id} className={`border-b border-zinc-800/50 transition-colors ${rowColor}`}>
                  <td className="py-2 pr-3 text-center">{rankIcon}</td>
                  <td className="py-2 pr-3">
                    <div className="font-medium text-white">{c.name}</div>
                    <div className="text-zinc-500">{c.symbol}</div>
                  </td>
                  <td className="py-2 pr-3 text-right">
                    <span className={`font-mono font-semibold ${i < 3 ? 'text-emerald-400' : 'text-zinc-300'}`}>
                      {fmtScore(c.weighted_score)}
                    </span>
                  </td>
                  <td className="py-2 pr-3 text-right text-zinc-300">{(c.win_rate * 100).toFixed(1)}%</td>
                  <td className="py-2 pr-3 text-right text-zinc-300">{Number(c.sharpe).toFixed(2)}</td>
                  <td className="py-2 pr-3 text-right">
                    <span className={c.expectancy >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                      {c.expectancy >= 0 ? '+' : ''}{Number(c.expectancy).toFixed(2)}
                    </span>
                  </td>
                  <td className="py-2 pr-3 text-right text-zinc-400">${Number(c.max_drawdown).toFixed(0)}</td>
                  <td className="py-2 text-right">
                    <span className={`px-1.5 py-0.5 rounded capitalize ${phaseColors[c.phase] || 'bg-zinc-700 text-zinc-300'}`}>
                      {c.phase}
                    </span>
                  </td>
                </tr>
              )
            })}
            {leaderboard.length === 0 && (
              <tr><td colSpan={8} className="py-8 text-center text-zinc-600">No data yet</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// PANEL 5: Walk-Forward Results
// ─────────────────────────────────────────────
function PassBadge({ value, threshold = 0.5, invert = false, label = '' }) {
  const pass = invert ? value <= threshold : value >= threshold
  return (
    <div className="flex items-center justify-between">
      <span className="text-zinc-500">{label}</span>
      <div className="flex items-center gap-1.5">
        <span className={`font-mono text-sm ${pass ? 'text-emerald-400' : 'text-red-400'}`}>
          {Number(value).toFixed(3)}
        </span>
        <span className={`text-xs px-1.5 py-0.5 rounded ${pass ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
          {pass ? 'PASS' : 'FAIL'}
        </span>
      </div>
    </div>
  )
}

function WalkForwardCard({ family, modes = [], regime_breakdown = {} }) {
  // Use the most recent / best mode (prefer 'anchored' then 'rolling')
  const mode = modes.find(m => m.mode === 'anchored') || modes[0]
  if (!mode) return null

  const allPass = mode.pass_rate > 0.5
  const regimeEntries = Object.entries(regime_breakdown).sort((a, b) => b[1] - a[1])

  const familyLabels = {
    vwap_reversion: { name: 'VWAP Reversion', icon: '📈', color: 'text-blue-400' },
    keltner_adx: { name: 'Keltner + ADX', icon: '📊', color: 'text-purple-400' },
    opening_range: { name: 'Opening Range', icon: '🕐', color: 'text-amber-400' },
  }
  const fl = familyLabels[family] || { name: family, icon: '🔬', color: 'text-zinc-400' }

  return (
    <div className={`bg-zinc-900 border rounded-xl p-4 ${allPass ? 'border-emerald-500/30' : 'border-zinc-800'}`}>
      <div className="flex items-center justify-between mb-3">
        <div>
          <span className="mr-2">{fl.icon}</span>
          <span className={`font-semibold ${fl.color}`}>{fl.name}</span>
        </div>
        <span className={`text-xs px-2 py-1 rounded-full ${allPass ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
          {allPass ? '✅ VALIDATED' : '❌ NOT VALIDATED'}
        </span>
      </div>

      <div className="space-y-1.5 text-xs mb-3">
        <PassBadge value={mode.avg_wfe} threshold={0.65} label="WFE" />
        <PassBadge value={mode.avg_dsr} threshold={0.5} label="DSR" />
        <PassBadge value={mode.avg_ece} threshold={0.1} invert label="ECE" />
        <PassBadge value={mode.avg_param_cv} threshold={0.3} invert label="Param CV" />
      </div>

      <div className="grid grid-cols-3 gap-2 text-xs mb-3">
        <div className="bg-zinc-800/50 rounded p-2 text-center">
          <div className="text-zinc-500">Win Rate</div>
          <div className="text-white font-semibold">{(mode.avg_win_rate * 100).toFixed(1)}%</div>
        </div>
        <div className="bg-zinc-800/50 rounded p-2 text-center">
          <div className="text-zinc-500">Sharpe</div>
          <div className="text-white font-semibold">{Number(mode.avg_sharpe).toFixed(2)}</div>
        </div>
        <div className="bg-zinc-800/50 rounded p-2 text-center">
          <div className="text-zinc-500">Windows</div>
          <div className="text-white font-semibold">{mode.gate_passes}/{mode.total_windows}</div>
        </div>
      </div>

      {regimeEntries.length > 0 && (
        <div className="text-xs">
          <div className="text-zinc-600 mb-1">Positive regimes</div>
          <div className="flex flex-wrap gap-1">
            {regimeEntries.map(([regime, count]) => (
              <span key={regime} className="bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded">
                {regime} ({count})
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="mt-2 text-xs text-zinc-600">
        {mode.total_trades} total trades · {mode.mode} mode · latest: {mode.latest_test?.slice(0, 10) || '—'}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// EVENTS sidebar
// ─────────────────────────────────────────────
// ─────────────────────────────────────────────
// Family Market Conditions
// ─────────────────────────────────────────────
function FamilyConditions({ families }) {
  const readinessConfig = {
    active: { color: 'text-emerald-400', bg: 'bg-emerald-500/20', icon: '🟢', label: 'ACTIVE' },
    ready: { color: 'text-emerald-400', bg: 'bg-emerald-500/15', icon: '🟡', label: 'READY' },
    watching: { color: 'text-amber-400', bg: 'bg-amber-500/15', icon: '🟡', label: 'WATCHING' },
    waiting: { color: 'text-zinc-400', bg: 'bg-zinc-700/50', icon: '⏸️', label: 'WAITING' },
    closed: { color: 'text-zinc-500', bg: 'bg-zinc-800/50', icon: '🔴', label: 'CLOSED' },
    error: { color: 'text-red-400', bg: 'bg-red-500/15', icon: '❌', label: 'ERROR' },
  }

  if (!families || families.length === 0) return null

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex flex-col flex-1">
      <h2 className="text-white font-semibold flex items-center gap-2 mb-3 shrink-0">
        <Activity className="w-4 h-4 text-blue-400" />
        Family Conditions
      </h2>
      <div className="flex-1 overflow-y-auto space-y-2 scrollbar-thin scrollbar-thumb-zinc-700">
        {families.map((f, i) => {
          const rc = readinessConfig[f.readiness] || readinessConfig.waiting
          const indicators = f.indicators || {}
          return (
            <div key={i} className={`rounded-lg border border-zinc-800 p-3 ${rc.bg}`}>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs">{rc.icon}</span>
                  <span className="text-white text-sm font-semibold">{f.name}</span>
                  <span className="text-zinc-600 text-[10px]">{(f.symbols || []).join(', ')}</span>
                </div>
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${rc.color} ${rc.bg}`}>{rc.label}</span>
              </div>
              {f.reason && <div className="text-xs text-zinc-400 mb-1.5">{f.reason}</div>}
              {/* Indicator pills */}
              <div className="flex flex-wrap gap-1.5">
                {Object.entries(indicators).map(([key, val]) => {
                  if (typeof val === 'object' && val !== null && !val.error) {
                    return (
                      <div key={key} className="flex items-center gap-1 text-[10px]">
                        <span className="text-zinc-500 font-mono">{key}</span>
                        {val.price && <span className="text-white font-mono">${val.price}</span>}
                        {val.trend && <span className={val.trend === 'bullish' ? 'text-emerald-400' : 'text-red-400'}>↗ {val.trend}</span>}
                        {val.rsi && <span className={`${val.rsi > 70 ? 'text-red-400' : val.rsi < 30 ? 'text-emerald-400' : 'text-zinc-400'}`}>RSI {val.rsi}</span>}
                        {val.vol_regime && <span className={`px-1 rounded ${val.vol_regime === 'high' ? 'bg-red-500/20 text-red-300' : val.vol_regime === 'normal' ? 'bg-zinc-700 text-zinc-300' : 'bg-zinc-800 text-zinc-500'}`}>{val.vol_regime} vol</span>}
                        {val.spread_bps !== undefined && <span className="text-amber-400 font-mono">{val.spread_bps}bps</span>}
                        {val.direction && <span className={val.direction === 'SHORT' ? 'text-red-400' : val.direction === 'LONG' ? 'text-emerald-400' : 'text-zinc-500'}>{val.direction}</span>}
                      </div>
                    )
                  }
                  return null
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function EventsPanel({ events }) {
  const impactConfig = {
    critical: { color: 'text-red-400', bg: 'bg-red-500/20 border-red-500/30', icon: '🔴', label: 'CRITICAL' },
    high: { color: 'text-amber-400', bg: 'bg-amber-500/20 border-amber-500/30', icon: '🟠', label: 'HIGH' },
    medium: { color: 'text-yellow-400', bg: 'bg-yellow-500/20 border-yellow-500/30', icon: '🟡', label: 'MED' },
    low: { color: 'text-zinc-400', bg: 'bg-zinc-500/20 border-zinc-500/30', icon: '⚪', label: 'LOW' },
  }
  const today = new Date().toISOString().slice(0, 10)
  const [expanded, setExpanded] = useState(null)

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex flex-col flex-1">
      <h2 className="text-white font-semibold flex items-center gap-2 mb-3 shrink-0">
        <Clock className="w-4 h-4 text-zinc-400" />
        Macro Calendar
      </h2>
      {events.length === 0 ? (
        <div className="text-zinc-600 text-xs">No events in next 60 days</div>
      ) : (
        <div className="flex-1 overflow-y-auto space-y-1.5 scrollbar-thin scrollbar-thumb-zinc-700">
          {events.slice(0, 10).map((e, i) => {
            const isToday = e.date === today
            const isTomorrow = (() => { const t = new Date(); t.setDate(t.getDate() + 1); return e.date === t.toISOString().slice(0, 10) })()
            const imp = impactConfig[e.impact] || impactConfig.low
            const isExpanded = expanded === i
            const daysUntil = e.days_until ?? Math.round((new Date(e.date) - new Date()) / 86400000)

            return (
              <div key={i}
                className={`rounded border transition-all cursor-pointer ${
                  isToday ? 'bg-amber-500/10 border-amber-500/30' :
                  isTomorrow ? 'bg-zinc-800/80 border-zinc-700' :
                  'border-zinc-800 hover:border-zinc-700'
                } ${isExpanded ? 'p-3' : 'px-3 py-2'}`}
                onClick={() => setExpanded(isExpanded ? null : i)}
              >
                {/* Header row */}
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-zinc-600 font-mono w-20 shrink-0">{e.date}</span>
                  <span className={`font-bold ${imp.color}`}>{e.type}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded border ${imp.bg}`}>{imp.label}</span>
                  {e.blackout_status === 'ACTIVE' && <span className="text-red-400 text-[10px] font-bold animate-pulse bg-red-500/20 px-1.5 rounded">🔴 BLACKOUT</span>}
                  {e.blackout_status === 'APPROACHING' && <span className="text-amber-400 text-[10px] font-bold bg-amber-500/10 px-1.5 rounded">⚠️ {Math.abs(Math.round(e.hours_until_release || 0))}h</span>}
                  {e.blackout_status === 'CLEAR' && isToday && <span className="text-amber-400 text-[10px] font-bold">TODAY</span>}
                  {e.blackout_status === 'CLEAR' && isTomorrow && <span className="text-zinc-400 text-[10px]">TOMORROW</span>}
                  {e.blackout_status === 'CLEAR' && !isToday && !isTomorrow && daysUntil > 0 && <span className="text-zinc-600 text-[10px] ml-auto">{daysUntil}d</span>}
                  {e.source === 'FRED' && <span className="text-zinc-700 text-[9px] ml-auto">FRED</span>}
                  <ChevronRight className={`w-3 h-3 text-zinc-600 ml-auto transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                </div>

                {/* Expanded detail */}
                {isExpanded && (
                  <div className="mt-2 space-y-1.5 text-xs">
                    <div className="text-zinc-300 font-medium">{e.name}</div>
                    <div className="text-zinc-500 leading-relaxed">{e.desc}</div>
                    {e.time && <div className="text-zinc-400">⏰ {e.time}</div>}
                    {e.affects && e.affects.length > 0 && (
                      <div className="flex items-center gap-1 flex-wrap">
                        <span className="text-zinc-500">Affects:</span>
                        {(Array.isArray(e.affects) ? e.affects : []).map((a, j) => (
                          <span key={j} className="bg-zinc-800 text-zinc-300 px-1.5 py-0.5 rounded">{a}</span>
                        ))}
                      </div>
                    )}
                    {e.action && (
                      <div className={`${imp.color} font-medium flex items-center gap-1`}>
                        <Shield className="w-3 h-3" /> {e.action}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────
// SYGNL BRIEF — Kofta's real-time situation summary
// ─────────────────────────────────────────────
function SYGNLBrief({ containers, portfolio, signals, events, portfolioStats, lastUpdated }) {
  const [briefUpdated, setBriefUpdated] = useState(null)
  const [refreshing, setRefreshing] = useState(false)

  // Generate summary from live data
  const generateBrief = useCallback(() => {
    setRefreshing(true)
    const now = new Date()
    setBriefUpdated(now)
    setTimeout(() => setRefreshing(false), 400)
  }, [])

  useEffect(() => {
    if (containers.length > 0 || signals.length > 0) {
      setBriefUpdated(new Date())
    }
  }, [containers.length, signals.length])

  // Build the paragraph
  const buildBrief = () => {
    const parts = []
    const now = new Date()

    // Market session
    const etHour = now.getUTCHours() - 5
    if (etHour >= 9.5 && etHour < 16) parts.push('US markets are open.')
    else if (etHour >= 4 && etHour < 9.5) parts.push('Pre-market session active.')
    else if (etHour >= 16 && etHour < 20) parts.push('After-hours trading.')
    else parts.push('US markets closed — crypto & forex engines scanning 24/7.')

    // Portfolio state
    const activeCount = containers.filter(c => c.enabled !== false).length
    const openPos = containers.reduce((s, c) => s + (c.open_positions || 0), 0)
    const todayPnl = containers.reduce((s, c) => s + (c.today_pnl || 0), 0)
    const totalTrades = containers.reduce((s, c) => s + (c.total_trades || 0), 0)

    if (activeCount > 0) {
      parts.push(`${activeCount} containers active with ${openPos} open position${openPos !== 1 ? 's' : ''}.`)
    }

    if (todayPnl !== 0) {
      parts.push(`Day P&L is ${todayPnl >= 0 ? '+' : ''}$${Math.abs(todayPnl).toFixed(2)}${todayPnl < 0 ? ' — drawdown in play' : ''}.`)
    }

    // Portfolio-level stats
    if (portfolio) {
      const equity = portfolio.total_equity || portfolio.equity || 0
      if (equity > 0) parts.push(`Total equity: $${equity.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}.`)
    }

    // Signals activity
    if (signals.length > 0) {
      const recentSignals = signals.filter(s => {
        const _st = s.timestamp || s.created_at || ''
        const age = (now - new Date(_st.endsWith('Z') ? _st : _st + 'Z')) / (1000 * 60)
        return age < 30
      })
      if (recentSignals.length > 0) {
        const symbols = [...new Set(recentSignals.map(s => s.symbol))].slice(0, 5)
        parts.push(`${recentSignals.length} signal${recentSignals.length !== 1 ? 's' : ''} in last 30 min across ${symbols.join(', ')}.`)
      } else {
        const lastSig = signals[0]
        const _lst = lastSig.timestamp || lastSig.created_at || ''
        const ageMin = Math.round((now - new Date(_lst.endsWith('Z') ? _lst : _lst + 'Z')) / (1000 * 60))
        parts.push(`Last signal was ${ageMin}m ago on ${lastSig.symbol} (${(lastSig.direction || 'N/A').toUpperCase()}).`)
      }
    } else {
      parts.push('No signals generated yet.')
    }

    // Top/bottom containers
    const sorted = [...containers].sort((a, b) => (b.today_pnl || 0) - (a.today_pnl || 0))
    const top = sorted[0]
    const bottom = sorted[sorted.length - 1]
    if (top && (top.today_pnl || 0) > 0) {
      parts.push(`Top performer: ${top.name || top.id} at +$${(top.today_pnl || 0).toFixed(2)}.`)
    }
    if (bottom && (bottom.today_pnl || 0) < 0) {
      parts.push(`Lagging: ${bottom.name || bottom.id} at -$${Math.abs(bottom.today_pnl || 0).toFixed(2)}.`)
    }

    // Events / blackouts — use FRED-sourced blackout_status
    const briefActiveBlackouts = (events || []).filter(e => e.blackout_status === 'ACTIVE')
    const briefApproaching = (events || []).filter(e => e.blackout_status === 'APPROACHING')

    if (briefActiveBlackouts.length > 0) {
      const names = briefActiveBlackouts.map(e => `${e.type} (${e.name})`).join(', ')
      parts.push(`🚨 BLACKOUT ACTIVE: ${names} — reduced position sizing, no new entries on affected pairs. Expect volatility spikes.`)
    }
    if (briefApproaching.length > 0) {
      const summaries = briefApproaching.map(e => {
        const hrs = Math.abs(Math.round(e.hours_until_release || 0))
        return `${e.type} in ${hrs}h`
      })
      parts.push(`⚠️ Approaching: ${summaries.join(', ')} — tightening risk.`)
    }

    // Walk-forward / portfolio stats
    if (portfolioStats) {
      const sharpe = portfolioStats.sharpe_ratio || portfolioStats.sharpe
      const winRate = portfolioStats.win_rate
      if (sharpe) parts.push(`Portfolio Sharpe: ${Number(sharpe).toFixed(2)}.`)
      if (winRate) parts.push(`Win rate: ${(winRate * 100).toFixed(1)}%.`)
    }

    return parts.join(' ')
  }

  const brief = buildBrief()

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-white font-semibold flex items-center gap-2">
          <Brain className="w-4 h-4 text-amber-400" />
          SYGNL Brief
          <span className="text-xs font-normal text-zinc-500">— Kofta&apos;s situational read</span>
        </h2>
        <div className="flex items-center gap-2">
          {briefUpdated && (
            <span className="text-[10px] text-zinc-600 font-mono">
              {briefUpdated.toLocaleTimeString()}
            </span>
          )}
          <button
            onClick={generateBrief}
            className="p-1 rounded hover:bg-zinc-800 transition-colors"
            title="Refresh brief"
          >
            <RefreshCw className={`w-3 h-3 text-zinc-500 hover:text-zinc-300 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>
      <p className="text-sm text-zinc-300 leading-relaxed">
        {brief || 'Loading data...'}
      </p>
    </div>
  )
}

// ─────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────
export default function V2Dashboard() {
  const [containers, setContainers] = useState([])
  const [portfolio, setPortfolio] = useState(null)
  const [portfolioStats, setPortfolioStats] = useState(null)
  const [equityCurve, setEquityCurve] = useState(null)
  const [correlation, setCorrelation] = useState(null)

  const [signals, setSignals] = useState([])
  const [leaderboard, setLeaderboard] = useState([])
  const [walkForward, setWalkForward] = useState([])
  const [events, setEvents] = useState([])
  const [familyConditions, setFamilyConditions] = useState([])
  const [exposure, setExposure] = useState({ positions: [], total_open: 0, total_exposure_usd: 0 })
  const [sygnlScore, setSygnlScore] = useState(null)
  const [loading, setLoading] = useState(true)
  const [signalLoading, setSignalLoading] = useState(false)
  const [lastUpdated, setLastUpdated] = useState(null)
  const [wsStatus, setWsStatus] = useState('disconnected')
  const wsRef = useRef(null)

  const fetchAll = useCallback(async () => {
    try {
      const [contRes, portRes, lbRes, wfRes, evRes, fcRes, statsRes, eqRes, corrRes, expRes, scoreRes] = await Promise.allSettled([
        fetch(`${V2_API}/api/v2/containers`),
        fetch(`${V2_API}/api/v2/portfolio`),
        fetch(`${V2_API}/api/v2/leaderboard`),
        fetch(`${V2_API}/api/v2/walk-forward`),
        fetch(`${V2_API}/api/v2/events`),
        fetch(`${V2_API}/api/v2/family-conditions`),
        fetch(`${V2_API}/api/v2/portfolio/stats`),
        fetch(`${V2_API}/api/v2/portfolio/equity-curve`),
        fetch(`${V2_API}/api/v2/correlation`),
        fetch(`${V2_API}/api/v2/exposure`),
        fetch(`${V2_API}/api/v2/sygnl-score`),

      ])

      if (contRes.status === 'fulfilled' && contRes.value.ok) {
        const d = await contRes.value.json()
        setContainers(d.containers || [])
      }
      if (portRes.status === 'fulfilled' && portRes.value.ok) {
        const d = await portRes.value.json()
        setPortfolio(d)
      }
      if (lbRes.status === 'fulfilled' && lbRes.value.ok) {
        const d = await lbRes.value.json()
        setLeaderboard(d.leaderboard || [])
      }
      if (wfRes.status === 'fulfilled' && wfRes.value.ok) {
        const d = await wfRes.value.json()
        setWalkForward(d.walk_forward || [])
      }
      if (evRes.status === 'fulfilled' && evRes.value.ok) {
        const d = await evRes.value.json()
        setEvents(d.events || [])
      }
      if (fcRes.status === 'fulfilled' && fcRes.value.ok) {
        const d = await fcRes.value.json()
        setFamilyConditions(d.families || [])
      }
      if (statsRes.status === 'fulfilled' && statsRes.value.ok) {
        const d = await statsRes.value.json()
        setPortfolioStats(d)
      }
      if (eqRes.status === 'fulfilled' && eqRes.value.ok) {
        const d = await eqRes.value.json()
        setEquityCurve(d)
      }
      if (corrRes.status === 'fulfilled' && corrRes.value.ok) {
        const d = await corrRes.value.json()
        setCorrelation(d)
      }
      if (expRes.status === 'fulfilled' && expRes.value.ok) {
        const d = await expRes.value.json()
        setExposure(d)
      }
      if (scoreRes.status === 'fulfilled' && scoreRes.value.ok) {
        const d = await scoreRes.value.json()
        setSygnlScore(d)
      }

      setLastUpdated(new Date())
    } catch (err) {
      console.error('Fetch error:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchSignals = useCallback(async () => {
    setSignalLoading(true)
    try {
      const res = await fetch(`${V2_API}/api/v2/signals?limit=50`)
      if (res.ok) {
        const d = await res.json()
        setSignals(d.signals || [])
      }
    } catch (err) {
      console.error('Signals fetch error:', err)
    } finally {
      setSignalLoading(false)
    }
  }, [])

  // Connect WebSocket
  useEffect(() => {
    let ws
    const connect = () => {
      try {
        ws = new WebSocket(`ws://localhost:3003/ws/v2/live`)
        wsRef.current = ws

        ws.onopen = () => {
          setWsStatus('connected')
          console.log('WS connected')
        }
        ws.onmessage = (evt) => {
          try {
            const msg = JSON.parse(evt.data)
            if (msg.type === 'snapshot') {
              setContainers(msg.containers || [])
            }
          } catch (e) {}
        }
        ws.onclose = () => {
          setWsStatus('disconnected')
          // Reconnect after 5s
          setTimeout(connect, 5000)
        }
        ws.onerror = () => {
          setWsStatus('error')
        }
      } catch (e) {
        setWsStatus('error')
      }
    }
    connect()
    return () => {
      if (ws) ws.close()
    }
  }, [])

  // Initial fetch + polling
  useEffect(() => {
    fetchAll()
    fetchSignals()

    // Refresh containers/portfolio every 30s
    const mainTimer = setInterval(fetchAll, 30000)
    // Refresh signals every 5s
    const signalTimer = setInterval(fetchSignals, 5000)

    return () => {
      clearInterval(mainTimer)
      clearInterval(signalTimer)
    }
  }, [fetchAll, fetchSignals])

  const wsColor = wsStatus === 'connected' ? 'text-emerald-400' : wsStatus === 'disconnected' ? 'text-zinc-500' : 'text-red-400'

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Header */}
      <div className="border-b border-zinc-800 bg-zinc-900/80 backdrop-blur sticky top-0 z-20">
        <div className="max-w-screen-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <a href="/dashboard" className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors flex items-center gap-1">
              ← Dashboard
            </a>
            <div className="h-4 w-px bg-zinc-700" />
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" />
              <span className="font-bold text-white">SYGNL</span>
              <span className="text-xs bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded font-mono">v2</span>
            </div>
            <div className="hidden md:flex items-center gap-3 text-xs">
              <span className="text-zinc-500">Capital</span>
              <span className="text-white font-mono">${(portfolio?.total_capital || containers.reduce((s, c) => s + (c.capital || 0), 0)).toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0})}</span>
              <span className="text-zinc-700">|</span>
              <span className="text-zinc-500">Exposure</span>
              <span className={`font-mono ${(() => { const eq = portfolio?.total_equity || portfolio?.total_capital || 1; const pct = (exposure?.total_exposure_usd || 0) / eq * 100; return pct > 80 ? 'text-red-400' : pct > 50 ? 'text-amber-400' : 'text-emerald-400' })()}`}>
                ${(exposure?.total_exposure_usd || 0).toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0})}
                <span className="text-zinc-500 ml-0.5">({((exposure?.total_exposure_usd || 0) / (portfolio?.total_equity || portfolio?.total_capital || 1) * 100).toFixed(1)}%)</span>
              </span>
              <span className="text-zinc-700">|</span>
              <span className="text-zinc-500">Realized</span>
              <span className={`font-mono ${(exposure?.total_realized_pnl || 0) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {(exposure?.total_realized_pnl || 0) >= 0 ? '+' : ''}${(exposure?.total_realized_pnl || 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
              </span>
              <span className="text-zinc-700">|</span>
              <span className="text-zinc-500">Unrealized</span>
              <span className={`font-mono ${(exposure?.total_unrealized_pnl || 0) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {(exposure?.total_unrealized_pnl || 0) >= 0 ? '+' : ''}${(exposure?.total_unrealized_pnl || 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
              </span>
              <span className="text-zinc-700">|</span>
              <span className="text-zinc-500">Total P&L</span>
              <span className={`font-mono font-bold ${((exposure?.total_realized_pnl || 0) + (exposure?.total_unrealized_pnl || 0)) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {((exposure?.total_realized_pnl || 0) + (exposure?.total_unrealized_pnl || 0)) >= 0 ? '+' : ''}${((exposure?.total_realized_pnl || 0) + (exposure?.total_unrealized_pnl || 0)).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <div className={`flex items-center gap-1 ${wsColor}`}>
              <div className={`w-1.5 h-1.5 rounded-full ${wsStatus === 'connected' ? 'bg-emerald-400 animate-pulse' : 'bg-zinc-500'}`} />
              WS {wsStatus}
            </div>
            {lastUpdated && (
              <span className="text-zinc-600">{lastUpdated.toLocaleTimeString()}</span>
            )}
            <button
              onClick={() => { fetchAll(); fetchSignals() }}
              className="p-1.5 rounded hover:bg-zinc-800 transition-colors"
              title="Refresh"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-zinc-400 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-screen-2xl mx-auto px-4 py-6 space-y-6">
        {/* LIVE STATUS BAR — always visible at top */}
        <LiveStatusBar containers={containers} signals={signals} events={events} lastUpdated={lastUpdated} />

        {/* SYGNL Brief — Kofta's real-time summary */}
        <SYGNLBrief containers={containers} portfolio={portfolio} signals={signals} events={events} portfolioStats={portfolioStats} lastUpdated={lastUpdated} />

        {/* Exposure — open positions */}
        <ExposurePanel data={exposure} />

        {/* Live Signal Feed + Family Conditions + Macro Calendar */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4" style={{alignItems:'stretch'}}>
          <div className="lg:col-span-1 flex flex-col">
            <SignalFeed signals={signals} loading={signalLoading} />
          </div>
          <div className="lg:col-span-1 flex flex-col">
            <FamilyConditions families={familyConditions} />
          </div>
          <div className="lg:col-span-1 flex flex-col">
            <EventsPanel events={events} />
          </div>
        </div>

        {/* SYGNL Score */}
        <SygnlScorePanel data={sygnlScore} />

        {/* Portfolio Overview */}
        <PortfolioPanel portfolio={portfolio} stats={portfolioStats} exposure={exposure} />

        {/* Container Grid */}
        <div>
          <h2 className="text-white font-semibold flex items-center gap-2 mb-3">
            <Activity className="w-4 h-4 text-blue-400" />
            Container Dashboard
            <span className="text-xs text-zinc-500 font-normal ml-1">({containers.length} active)</span>
          </h2>
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 h-52 animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {containers.map(c => <ContainerCard key={c.id} container={c} />)}
            </div>
          )}
        </div>

        {/* Combined Portfolio Equity Curve */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
          <h2 className="text-white font-semibold flex items-center gap-2 mb-4">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            Combined Portfolio Equity Curve
            <span className="text-xs text-zinc-500 font-normal ml-1">— white line = total · colored = per container</span>
          </h2>
          <PortfolioEquityCurve equityCurve={equityCurve} containers={containers} />
        </div>

        {/* Container Heatmap + Correlation */}
        <ContainerHeatmap containers={containers} />
        <CorrelationMatrix correlation={correlation} />

        {/* Leaderboard */}
        <Leaderboard leaderboard={leaderboard} />

        {/* Walk-Forward Results */}
        <div>
          <h2 className="text-white font-semibold flex items-center gap-2 mb-3">
            <Brain className="w-4 h-4 text-purple-400" />
            Walk-Forward Validation
            <span className="text-xs text-zinc-500 font-normal ml-1">({walkForward.length} families)</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {walkForward.map(wf => (
              <WalkForwardCard key={wf.family} {...wf} />
            ))}
            {walkForward.length === 0 && !loading && (
              <div className="col-span-3 text-zinc-600 text-sm text-center py-8">
                No walk-forward results yet. Run the WFA pipeline to see results here.
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="text-xs text-zinc-700 text-center pb-4">
          SYGNL v2 · SPY + QQQ + Gold + Silver Arb · $100k Paper · API: {V2_API} · Signals 5s · Containers 30s
        </div>
      </div>
    </div>
  )
}
