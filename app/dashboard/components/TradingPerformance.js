'use client'

import { useState } from 'react'
import { 
  TrendingUp, 
  TrendingDown, 
  PieChart, 
  BarChart3,
  DollarSign,
  Calendar,
  Filter,
  Download
} from 'lucide-react'

const performanceData = {
  portfolioValue: 184598,
  dayChange: 4218,
  dayChangePercent: 2.34,
  totalInvested: 156000,
  totalPL: 28598,
  totalPLPercent: 18.33,
  positions: [
    { symbol: 'NVDA', name: 'NVIDIA', type: 'Equity', quantity: 85, avgPrice: 165.45, currentPrice: 178.45, value: 15168.25, dayChange: 425.50, dayChangePercent: 2.89 },
    { symbol: 'AAPL', name: 'Apple', type: 'Equity', quantity: 120, avgPrice: 185.20, currentPrice: 192.45, value: 23094.00, dayChange: 870.00, dayChangePercent: 3.92 },
    { symbol: 'MSFT', name: 'Microsoft', type: 'Equity', quantity: 65, avgPrice: 415.80, currentPrice: 425.60, value: 27664.00, dayChange: 637.00, dayChangePercent: 2.36 },
    { symbol: 'PLTR', name: 'Palantir', type: 'Equity', quantity: 450, avgPrice: 22.10, currentPrice: 24.85, value: 11182.50, dayChange: 1237.50, dayChangePercent: 12.44 },
    { symbol: 'BTC', name: 'Bitcoin', type: 'Crypto', quantity: 0.85, avgPrice: 62500, currentPrice: 63444, value: 53927.40, dayChange: 802.40, dayChangePercent: 1.51 },
    { symbol: 'ETH', name: 'Ethereum', type: 'Crypto', quantity: 5.2, avgPrice: 3350, currentPrice: 3450, value: 17940.00, dayChange: 520.00, dayChangePercent: 2.98 },
    { symbol: 'VOO', name: 'S&P 500 ETF', type: 'ETF', quantity: 45, avgPrice: 485.60, currentPrice: 492.85, value: 22178.25, dayChange: 326.25, dayChangePercent: 1.49 },
    { symbol: 'MSTR', name: 'MicroStrategy', type: 'Equity', quantity: 25, avgPrice: 680.20, currentPrice: 695.45, value: 17386.25, dayChange: 381.25, dayChangePercent: 2.24 },
  ],
  allocation: {
    stocks: 65.4,
    crypto: 28.2,
    etfs: 6.4
  },
  performanceHistory: [
    { date: 'Feb 9', value: 178450, change: 1.2 },
    { date: 'Feb 10', value: 175620, change: -1.6 },
    { date: 'Feb 11', value: 179830, change: 2.4 },
    { date: 'Feb 12', value: 182150, change: 1.3 },
    { date: 'Feb 13', value: 180920, change: -0.7 },
    { date: 'Feb 14', value: 183450, change: 1.4 },
    { date: 'Feb 15', value: 184598, change: 0.6 },
  ]
}

export default function TradingPerformance() {
  const [timeframe, setTimeframe] = useState('1w')
  const [filter, setFilter] = useState('all')

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value)
  }

  const getChangeColor = (change) => {
    return change >= 0 ? 'text-success' : 'text-error'
  }

  const getChangeIcon = (change) => {
    return change >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-surface/50 backdrop-blur-sm p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent-secondary/10 border border-accent-secondary/20 flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-accent-secondary" />
          </div>
          <div>
            <h3 className="font-semibold">Trading Performance</h3>
            <div className="text-sm text-zinc-500">
              Live portfolio tracking and analysis
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex gap-1">
            {['1d', '1w', '1m', '3m', '1y'].map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                  timeframe === tf
                    ? 'bg-accent-primary/20 text-accent-primary border border-accent-primary/30'
                    : 'bg-white/5 text-zinc-400 hover:bg-white/10'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>
          <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-sm transition-colors">
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {/* Portfolio Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="rounded-xl border border-white/5 bg-black/30 p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-zinc-500">Portfolio Value</div>
            <DollarSign className="w-4 h-4 text-accent-secondary" />
          </div>
          <div className="text-3xl font-bold">{formatCurrency(performanceData.portfolioValue)}</div>
          <div className={`flex items-center gap-2 mt-2 ${getChangeColor(performanceData.dayChange)}`}>
            {getChangeIcon(performanceData.dayChange)}
            <span className="font-medium">
              +{formatCurrency(performanceData.dayChange)} ({performanceData.dayChangePercent}%)
            </span>
            <span className="text-sm text-zinc-500">today</span>
          </div>
        </div>

        <div className="rounded-xl border border-white/5 bg-black/30 p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-zinc-500">Total P&L</div>
            <BarChart3 className="w-4 h-4 text-success" />
          </div>
          <div className="text-3xl font-bold text-success">
            +{formatCurrency(performanceData.totalPL)}
          </div>
          <div className="text-sm text-zinc-500 mt-2">
            {performanceData.totalPLPercent}% return • {formatCurrency(performanceData.totalInvested)} invested
          </div>
        </div>

        <div className="rounded-xl border border-white/5 bg-black/30 p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-zinc-500">Asset Allocation</div>
            <PieChart className="w-4 h-4 text-accent-tertiary" />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-accent-primary" />
                <span className="text-sm">Stocks: {performanceData.allocation.stocks}%</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-accent-secondary" />
                <span className="text-sm">Crypto: {performanceData.allocation.crypto}%</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-accent-tertiary" />
                <span className="text-sm">ETFs: {performanceData.allocation.etfs}%</span>
              </div>
            </div>
            <div className="w-20 h-20 relative">
              <div className="absolute inset-0 rounded-full border-8 border-accent-primary" 
                style={{ clipPath: `conic-gradient(transparent 0% ${performanceData.allocation.stocks}%, transparent ${performanceData.allocation.stocks}% ${performanceData.allocation.stocks + performanceData.allocation.crypto}%, transparent ${performanceData.allocation.stocks + performanceData.allocation.crypto}% 100%)` }}
              />
              <div className="absolute inset-0 rounded-full border-8 border-accent-secondary" 
                style={{ clipPath: `conic-gradient(transparent 0% ${performanceData.allocation.stocks}%, transparent ${performanceData.allocation.stocks}% ${performanceData.allocation.stocks + performanceData.allocation.crypto}%)` }}
              />
              <div className="absolute inset-0 rounded-full border-8 border-accent-tertiary" 
                style={{ clipPath: `conic-gradient(transparent ${performanceData.allocation.stocks + performanceData.allocation.crypto}% 100%)` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Performance Chart */}
      <div className="rounded-xl border border-white/5 bg-black/30 p-4 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-medium">Portfolio Performance</h4>
          <div className="flex items-center gap-2 text-sm text-zinc-500">
            <Calendar className="w-4 h-4" />
            <span>Last 7 days</span>
          </div>
        </div>
        <div className="h-48 flex items-end gap-2 px-4">
          {performanceData.performanceHistory.map((day, index) => {
            const maxValue = Math.max(...performanceData.performanceHistory.map(d => d.value))
            const minValue = Math.min(...performanceData.performanceHistory.map(d => d.value))
            const range = maxValue - minValue
            const height = range > 0 ? ((day.value - minValue) / range) * 100 : 50
            const isPositive = day.change >= 0
            
            return (
              <div key={index} className="flex-1 flex flex-col items-center gap-1">
                <div className="text-xs text-zinc-500 mb-1">{formatCurrency(day.value)}</div>
                <div
                  className={`w-full rounded-t transition-all duration-500 ${
                    isPositive ? 'bg-success' : 'bg-error'
                  }`}
                  style={{ height: `${Math.max(height, 15)}%`, minHeight: '20px' }}
                />
                <div className="text-xs text-zinc-500 font-medium">
                  {day.date}
                </div>
                <div className={`text-xs ${isPositive ? 'text-success' : 'text-error'}`}>
                  {isPositive ? '+' : ''}{day.change}%
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Positions Table */}
      <div className="rounded-xl border border-white/5 bg-black/30 overflow-hidden">
        <div className="border-b border-white/5 p-4 flex items-center justify-between">
          <h4 className="font-medium">Current Positions</h4>
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              {['all', 'stocks', 'crypto', 'etfs'].map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3 py-1 rounded text-sm transition-colors ${
                    filter === f
                      ? 'bg-accent-primary/20 text-accent-primary'
                      : 'bg-white/5 text-zinc-400 hover:bg-white/10'
                  }`}
                >
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>
            <button className="p-2 hover:bg-white/10 rounded">
              <Filter className="w-4 h-4 text-zinc-400" />
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left p-3 text-sm font-medium text-zinc-500">Symbol</th>
                <th className="text-left p-3 text-sm font-medium text-zinc-500">Name</th>
                <th className="text-left p-3 text-sm font-medium text-zinc-500">Quantity</th>
                <th className="text-left p-3 text-sm font-medium text-zinc-500">Avg Price</th>
                <th className="text-left p-3 text-sm font-medium text-zinc-500">Current</th>
                <th className="text-left p-3 text-sm font-medium text-zinc-500">Value</th>
                <th className="text-left p-3 text-sm font-medium text-zinc-500">Day Change</th>
              </tr>
            </thead>
            <tbody>
              {performanceData.positions
                .filter(p => filter === 'all' || p.type.toLowerCase() === filter)
                .map((position, index) => (
                  <tr key={index} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm ${
                          position.type === 'Crypto' 
                            ? 'bg-gradient-to-br from-orange-500/20 to-yellow-600/20 text-orange-400'
                            : position.type === 'ETF'
                            ? 'bg-gradient-to-br from-purple-500/20 to-pink-600/20 text-purple-400'
                            : 'bg-gradient-to-br from-emerald-500/20 to-teal-600/20 text-emerald-400'
                        }`}>
                          {position.symbol.slice(0, 2)}
                        </div>
                        <span className="font-medium">{position.symbol}</span>
                      </div>
                    </td>
                    <td className="p-3 text-sm text-zinc-400">{position.name}</td>
                    <td className="p-3 text-sm">{position.quantity.toLocaleString()}</td>
                    <td className="p-3 text-sm">{formatCurrency(position.avgPrice)}</td>
                    <td className="p-3 text-sm font-medium">{formatCurrency(position.currentPrice)}</td>
                    <td className="p-3 text-sm font-medium">{formatCurrency(position.value)}</td>
                    <td className="p-3">
                      <div className={`flex items-center gap-1 ${getChangeColor(position.dayChange)}`}>
                        {getChangeIcon(position.dayChange)}
                        <span className="font-medium">
                          {position.dayChange >= 0 ? '+' : ''}{formatCurrency(position.dayChange)}
                        </span>
                        <span className="text-sm">({position.dayChangePercent}%)</span>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
        <div className="p-3 border-t border-white/5 text-sm text-zinc-500">
          Showing {performanceData.positions.filter(p => filter === 'all' || p.type.toLowerCase() === filter).length} positions • Total value: {formatCurrency(
            performanceData.positions
              .filter(p => filter === 'all' || p.type.toLowerCase() === filter)
              .reduce((sum, p) => sum + p.value, 0)
          )}
        </div>
      </div>

      {/* Performance Insights */}
      <div className="mt-6 p-4 rounded-xl gradient-accent/10 border border-accent-primary/20">
        <div className="flex items-start gap-3">
          <TrendingUp className="w-5 h-5 text-accent-primary mt-0.5" />
          <div>
            <h4 className="font-medium text-accent-primary mb-1">Performance Insights</h4>
            <p className="text-sm text-zinc-300">
              Portfolio is up {performanceData.dayChangePercent}% today, outperforming the S&P 500 (+1.2%). 
              Top performers: PLTR (+12.4%), AAPL (+3.9%), NVDA (+2.9%). 
              Consider rebalancing to maintain target allocation (70% stocks, 25% crypto, 5% ETFs).
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}