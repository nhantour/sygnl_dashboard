// SYGNL v2 — Container Deep Dive
'use client'

import { useState, useEffect } from 'react'
import { ArrowLeft, TrendingUp, TrendingDown, Activity, Target, BarChart3, Brain, Shield, Zap } from 'lucide-react'
import Link from 'next/link'

const V2_API = 'http://localhost:3003'

const fmt$ = (v) => {
  const n = Number(v) || 0
  const abs = Math.abs(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  return (n >= 0 ? '+$' : '-$') + abs
}

const fmtPct = (v) => {
  const n = Number(v) || 0
  return (n >= 0 ? '+' : '') + (n * 100).toFixed(2) + '%'
}

// Full-width equity curve with drawdown overlay
function EquityCurveChart({ data = [] }) {
  if (!data || data.length < 2) {
    return (
      <div className="flex items-center justify-center h-48 text-zinc-600 text-sm">
        No equity data yet — waiting for first trades...
      </div>
    )
  }

  const W = 900, H = 200, PAD = 40

  const equities = data.map(d => d.equity)
  const drawdowns = data.map(d => d.drawdown)
  const minEq = Math.min(...equities)
  const maxEq = Math.max(...equities)
  const maxDD = Math.max(...drawdowns, 1)
  const rangeEq = maxEq - minEq || 1

  const xScale = (i) => PAD + (i / (data.length - 1)) * (W - PAD * 2)
  const yScaleEq = (v) => H - PAD - ((v - minEq) / rangeEq) * (H - PAD * 2)
  const yScaleDD = (v) => PAD + (v / maxDD) * (H - PAD * 2) * 0.3

  const eqPath = data.map((d, i) => `${i === 0 ? 'M' : 'L'}${xScale(i).toFixed(1)},${yScaleEq(d.equity).toFixed(1)}`).join(' ')

  // Drawdown fill path
  const ddFill = data.map((d, i) => `${i === 0 ? 'M' : 'L'}${xScale(i).toFixed(1)},${yScaleDD(d.drawdown).toFixed(1)}`).join(' ')
    + ` L${xScale(data.length - 1).toFixed(1)},${PAD} L${xScale(0).toFixed(1)},${PAD} Z`

  // X-axis labels (first, mid, last)
  const xLabels = [0, Math.floor(data.length / 2), data.length - 1].map(i => ({
    x: xScale(i),
    label: data[i]?.date?.slice(5) || '',
  }))

  const yLabels = [minEq, (minEq + maxEq) / 2, maxEq].map(v => ({
    y: yScaleEq(v),
    label: '$' + v.toLocaleString(undefined, { maximumFractionDigits: 0 }),
  }))

  const lastVal = equities[equities.length - 1]
  const startVal = equities[0]
  const lineColor = lastVal >= startVal ? '#34d399' : '#f87171'

  return (
    <div className="w-full overflow-x-auto">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ minWidth: '400px', height: H }}>
        {/* Grid lines */}
        {yLabels.map((yl, i) => (
          <line key={i} x1={PAD} y1={yl.y} x2={W - PAD} y2={yl.y} stroke="#27272a" strokeWidth="1" />
        ))}
        {/* Y labels */}
        {yLabels.map((yl, i) => (
          <text key={i} x={PAD - 4} y={yl.y + 4} textAnchor="end" fill="#71717a" fontSize="10">{yl.label}</text>
        ))}
        {/* X labels */}
        {xLabels.map((xl, i) => (
          <text key={i} x={xl.x} y={H - 4} textAnchor="middle" fill="#71717a" fontSize="10">{xl.label}</text>
        ))}
        {/* Drawdown overlay */}
        <path d={ddFill} fill="rgba(239,68,68,0.15)" />
        {/* Equity line */}
        <path d={eqPath} fill="none" stroke={lineColor} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
        {/* Current value dot */}
        <circle
          cx={xScale(data.length - 1)}
          cy={yScaleEq(equities[equities.length - 1])}
          r="4" fill={lineColor}
        />
      </svg>
    </div>
  )
}

// Daily PnL bars
function DailyPnLChart({ data = [] }) {
  if (!data || data.length === 0) {
    return <div className="flex items-center justify-center h-32 text-zinc-600 text-sm">No daily P&L data yet</div>
  }

  const W = 900, H = 120, PAD = 30
  const pnls = data.map(d => d.pnl)
  const maxAbs = Math.max(...pnls.map(Math.abs), 1)
  const barW = Math.max(2, (W - PAD * 2) / data.length - 1)
  const midY = H / 2

  return (
    <div className="w-full overflow-x-auto">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ minWidth: '400px', height: H }}>
        <line x1={PAD} y1={midY} x2={W - PAD} y2={midY} stroke="#3f3f46" strokeWidth="1" />
        {data.map((d, i) => {
          const x = PAD + i * ((W - PAD * 2) / data.length)
          const barH = (Math.abs(d.pnl) / maxAbs) * (H / 2 - 8)
          const y = d.pnl >= 0 ? midY - barH : midY
          return (
            <rect key={i} x={x} y={d.pnl >= 0 ? midY - barH : midY}
              width={barW} height={barH}
              fill={d.pnl >= 0 ? '#34d399' : '#f87171'} opacity="0.8"
            />
          )
        })}
      </svg>
    </div>
  )
}

// Calibration reliability diagram
function CalibrationDiagram({ bins = [], ece = 0, brier = 0 }) {
  const W = 280, H = 220, PAD = 30

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-3 mb-2">
        <span className="bg-blue-500/20 text-blue-300 border border-blue-500/30 text-xs px-2 py-1 rounded">
          ECE: {ece.toFixed(4)}
        </span>
        <span className="bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs px-2 py-1 rounded">
          Brier: {brier.toFixed(4)}
        </span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H}>
        {/* Perfect calibration line */}
        <line x1={PAD} y1={H - PAD} x2={W - PAD} y2={PAD} stroke="#3f3f46" strokeWidth="1" strokeDasharray="4,4" />
        {/* Grid */}
        {[0.25, 0.5, 0.75].map((v, i) => {
          const x = PAD + v * (W - PAD * 2)
          const y = H - PAD - v * (H - PAD * 2)
          return (
            <g key={i}>
              <line x1={x} y1={H - PAD} x2={x} y2={PAD} stroke="#27272a" strokeWidth="1" />
              <line x1={PAD} y1={y} x2={W - PAD} y2={y} stroke="#27272a" strokeWidth="1" />
            </g>
          )
        })}
        {/* Axis labels */}
        <text x={W / 2} y={H - 4} textAnchor="middle" fill="#71717a" fontSize="9">Predicted</text>
        <text x={8} y={H / 2} textAnchor="middle" fill="#71717a" fontSize="9" transform={`rotate(-90,8,${H / 2})`}>Actual</text>
        {/* Reliability points */}
        {bins.map((b, i) => {
          const x = PAD + b.predicted * (W - PAD * 2)
          const y = H - PAD - b.actual * (H - PAD * 2)
          return (
            <circle key={i} cx={x} cy={y} r="5" fill="#60a5fa" opacity="0.8" />
          )
        })}
      </svg>
    </div>
  )
}

// Rolling 30d win rate line chart
function RollingWinRateChart({ data = [] }) {
  if (!data || data.length < 2) {
    return <div className="text-zinc-600 text-sm text-center py-8">Not enough data for rolling chart</div>
  }

  const W = 500, H = 100, PAD = 25
  const vals = data.map(d => d.value)
  const min = Math.min(...vals, 0)
  const max = Math.max(...vals, 1)
  const range = max - min || 1

  const pts = vals.map((v, i) => {
    const x = PAD + (i / (vals.length - 1)) * (W - PAD * 2)
    const y = H - PAD - ((v - min) / range) * (H - PAD * 2)
    return `${x.toFixed(1)},${y.toFixed(1)}`
  }).join(' ')

  const target55Y = H - PAD - ((0.55 - min) / range) * (H - PAD * 2)

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: H }}>
      {/* 55% target line */}
      {target55Y > PAD && target55Y < H - PAD && (
        <line x1={PAD} y1={target55Y} x2={W - PAD} y2={target55Y} stroke="#f59e0b" strokeWidth="1" strokeDasharray="3,3" />
      )}
      {/* Line */}
      <polyline points={pts} fill="none" stroke="#60a5fa" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  )
}

export default function ContainerDeepDive({ params }) {
  const { id } = params
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [haltConfirm, setHaltConfirm] = useState(false)

  useEffect(() => {
    fetch(`${V2_API}/api/v2/containers/${id}/deep`)
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.json()
      })
      .then(d => { setData(d); setLoading(false) })
      .catch(e => { setError(e.message); setLoading(false) })
  }, [id])

  const handleHalt = async () => {
    if (!haltConfirm) { setHaltConfirm(true); return }
    try {
      const res = await fetch(`${V2_API}/api/v2/containers/${id}/halt`, { method: 'POST' })
      const d = await res.json()
      alert(`Container ${id} halted: ${JSON.stringify(d)}`)
      setHaltConfirm(false)
    } catch (e) {
      alert(`Halt failed: ${e.message}`)
    }
  }

  if (loading) return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
      <div className="text-zinc-500 animate-pulse">Loading deep dive...</div>
    </div>
  )

  if (error || !data) return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
      <div className="text-red-400">Error: {error || 'No data'}</div>
    </div>
  )

  const { container, equity_curve, daily_pnl, calibration, rolling_30d, regime_breakdown, recent_trades } = data
  const pnlColor = container.total_pnl >= 0 ? 'text-emerald-400' : 'text-red-400'
  const winRatePct = (container.win_rate * 100).toFixed(1)
  const winRateColor = container.win_rate > 0.55 ? 'text-emerald-400' : container.win_rate > 0.45 ? 'text-amber-400' : 'text-red-400'

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Header */}
      <div className="border-b border-zinc-800 bg-zinc-900/80 backdrop-blur sticky top-0 z-20">
        <div className="max-w-screen-xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/v2" className="flex items-center gap-1 text-zinc-400 hover:text-white transition-colors text-sm">
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </Link>
            <div className="h-4 w-px bg-zinc-700" />
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" />
              <span className="font-bold">{container.name}</span>
              <span className="text-xs bg-zinc-700 text-zinc-300 px-1.5 py-0.5 rounded">{container.symbol}</span>
              <span className="text-xs bg-zinc-700 text-zinc-300 px-1.5 py-0.5 rounded capitalize">{container.profile}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {}}
              className="text-xs px-3 py-1.5 rounded border border-blue-500/50 text-blue-400 hover:bg-blue-500/10 transition-colors"
            >
              Run Discovery
            </button>
            <button
              onClick={handleHalt}
              className={`text-xs px-3 py-1.5 rounded border transition-colors ${haltConfirm ? 'bg-red-500 border-red-500 text-white' : 'border-red-500/50 text-red-400 hover:bg-red-500/10'}`}
            >
              {haltConfirm ? '⚠ Confirm Halt' : 'Halt Container'}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-screen-xl mx-auto px-4 py-6 space-y-6">
        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
          {[
            { label: 'Total P&L', value: fmt$(container.total_pnl), color: pnlColor },
            { label: 'Today P&L', value: fmt$(container.today_pnl), color: container.today_pnl >= 0 ? 'text-emerald-400' : 'text-red-400' },
            { label: 'Win Rate', value: `${winRatePct}%`, color: winRateColor },
            { label: 'Expectancy', value: container.expectancy >= 0 ? `+${container.expectancy.toFixed(2)}` : container.expectancy.toFixed(2), color: container.expectancy >= 0 ? 'text-emerald-400' : 'text-red-400' },
            { label: 'Sharpe', value: Number(container.sharpe).toFixed(3), color: container.sharpe >= 0.5 ? 'text-emerald-400' : container.sharpe >= 0 ? 'text-amber-400' : 'text-red-400' },
            { label: 'Max DD', value: `$${container.max_drawdown.toFixed(0)}`, color: container.max_drawdown < 500 ? 'text-emerald-400' : container.max_drawdown < 1000 ? 'text-amber-400' : 'text-red-400' },
          ].map((s, i) => (
            <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-xl p-3">
              <div className="text-zinc-500 text-xs mb-1">{s.label}</div>
              <div className={`text-lg font-bold ${s.color}`}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Equity Curve */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
          <h2 className="text-white font-semibold flex items-center gap-2 mb-4">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            Equity Curve
            <span className="text-xs text-zinc-500 font-normal ml-1">with drawdown overlay (red)</span>
          </h2>
          <EquityCurveChart data={equity_curve} />
        </div>

        {/* Daily PnL */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
          <h2 className="text-white font-semibold flex items-center gap-2 mb-4">
            <BarChart3 className="w-4 h-4 text-blue-400" />
            Daily P&L
          </h2>
          <DailyPnLChart data={daily_pnl} />
        </div>

        {/* Calibration + Rolling Win Rate */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Calibration */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
            <h2 className="text-white font-semibold flex items-center gap-2 mb-4">
              <Target className="w-4 h-4 text-purple-400" />
              Calibration Reliability
            </h2>
            <CalibrationDiagram bins={calibration.reliability_bins} ece={calibration.ece} brier={calibration.brier} />
          </div>

          {/* Rolling 30d Win Rate */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
            <h2 className="text-white font-semibold flex items-center gap-2 mb-3">
              <Activity className="w-4 h-4 text-blue-400" />
              Rolling 30-Day Win Rate
              <span className="text-xs text-amber-500 font-normal ml-1">--- 55% target</span>
            </h2>
            <RollingWinRateChart data={rolling_30d.win_rates} />
            <div className="mt-3 text-xs text-zinc-500">
              {rolling_30d.win_rates.length > 0
                ? `Latest: ${(rolling_30d.win_rates[rolling_30d.win_rates.length - 1]?.value * 100).toFixed(1)}%`
                : 'Not enough data yet'}
            </div>
          </div>
        </div>

        {/* Regime Breakdown */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
          <h2 className="text-white font-semibold flex items-center gap-2 mb-4">
            <Brain className="w-4 h-4 text-amber-400" />
            Regime Breakdown (VIX Tercile Performance)
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-zinc-500 border-b border-zinc-800">
                  <th className="text-left py-2 pr-4">Regime</th>
                  <th className="text-right py-2 pr-4">Sharpe</th>
                  <th className="text-right py-2">Trades</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(regime_breakdown).map(([regime, stats]) => (
                  <tr key={regime} className="border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors">
                    <td className="py-2 pr-4 capitalize text-zinc-300">{regime}</td>
                    <td className={`py-2 pr-4 text-right font-mono ${stats.sharpe >= 0.5 ? 'text-emerald-400' : stats.sharpe >= 0 ? 'text-amber-400' : 'text-red-400'}`}>
                      {Number(stats.sharpe).toFixed(3)}
                    </td>
                    <td className="py-2 text-right text-zinc-400">{stats.trades}</td>
                  </tr>
                ))}
                {Object.keys(regime_breakdown).length === 0 && (
                  <tr><td colSpan={3} className="py-6 text-center text-zinc-600">No regime data yet</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Trades */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
          <h2 className="text-white font-semibold flex items-center gap-2 mb-4">
            <Shield className="w-4 h-4 text-zinc-400" />
            Last {recent_trades.length} Trades
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-zinc-500 border-b border-zinc-800">
                  <th className="text-left py-2 pr-3">Time</th>
                  <th className="text-left py-2 pr-3">Symbol</th>
                  <th className="text-left py-2 pr-3">Dir</th>
                  <th className="text-right py-2 pr-3">Entry</th>
                  <th className="text-right py-2 pr-3">Exit</th>
                  <th className="text-right py-2 pr-3">P&L</th>
                  <th className="text-left py-2 pr-3">Reason</th>
                  <th className="text-left py-2 pr-3">Families</th>
                  <th className="text-center py-2">NL</th>
                </tr>
              </thead>
              <tbody>
                {recent_trades.map((t, i) => {
                  const ts = new Date(t.timestamp)
                  const timeStr = isNaN(ts) ? t.timestamp?.slice(11, 19) || '—' : ts.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
                  return (
                    <tr key={i} className="border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors">
                      <td className="py-2 pr-3 font-mono text-zinc-400 whitespace-nowrap">{timeStr}</td>
                      <td className="py-2 pr-3 font-bold text-white">{t.symbol}</td>
                      <td className={`py-2 pr-3 uppercase font-semibold ${t.direction === 'LONG' || t.direction === 'long' ? 'text-emerald-400' : 'text-red-400'}`}>
                        {t.direction}
                      </td>
                      <td className="py-2 pr-3 text-right font-mono text-zinc-300">${Number(t.entry_price).toFixed(2)}</td>
                      <td className="py-2 pr-3 text-right font-mono text-zinc-300">${Number(t.exit_price).toFixed(2)}</td>
                      <td className={`py-2 pr-3 text-right font-mono font-semibold ${t.pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {t.pnl >= 0 ? '+' : ''}{(Number(t.pnl) * 100).toFixed(3)}%
                      </td>
                      <td className="py-2 pr-3 text-zinc-400 capitalize">{t.exit_reason}</td>
                      <td className="py-2 pr-3 text-zinc-400">
                        {Array.isArray(t.families_confirmed) ? t.families_confirmed.join(', ') : '—'}
                      </td>
                      <td className="py-2 text-center">
                        {t.natural_laws_pass ? '✅' : '❌'}
                      </td>
                    </tr>
                  )
                })}
                {recent_trades.length === 0 && (
                  <tr><td colSpan={9} className="py-8 text-center text-zinc-600">No trades yet</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="text-xs text-zinc-700 text-center pb-4">
          SYGNL v2 · Container Deep Dive · {id} · Sprint 6
        </div>
      </div>
    </div>
  )
}
