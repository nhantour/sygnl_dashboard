'use client'

import { useState, useEffect } from 'react'
import { 
  TrendingUp, Activity, DollarSign, Users, Target, Wallet,
  Clock, LogOut, RefreshCw, ArrowUpRight, Zap, Globe, PieChart,
  AlertTriangle, AlertCircle, CheckCircle, TrendingDown, TrendingUp as TrendingUpIcon,
  Newspaper, BookOpen, Lightbulb, Bell
} from 'lucide-react'
import holdingsData from '../../data/holdings.json'
import intelligenceData from '../../data/intelligence.json'

const portfolioHistory = [
  { date: 'Jan 30', value: 100000 },
  { date: 'Jan 31', value: 100432 },
  { date: 'Feb 01', value: 100128 },
  { date: 'Feb 02', value: 100854 },
  { date: 'Feb 03', value: 101243 },
  { date: 'Feb 04', value: 100891 },
]

const objectives = [
  { name: 'API Conversions', current: 0, target: 10, deadline: 'Feb 28', progress: 0, status: 'behind' },
  { name: 'Moltbook Followers', current: 3, target: 50, deadline: 'Feb 28', progress: 6, status: 'ontrack' },
  { name: 'Validation Trades', current: 0, target: 20, deadline: 'Feb 14', progress: 0, status: 'atrisk' },
  { name: 'Signal Accuracy', current: 0, target: 65, deadline: 'Ongoing', progress: 0, status: 'pending' },
]

const agentArchetypes = [
  { type: 'Financial Advisor', count: 1, potential: 'High', spend: '$500-2K' },
  { type: 'Day Trader Bot', count: 3, potential: 'Medium', spend: '$100-500' },
  { type: 'Executive Assistant', count: 0, potential: 'Medium', spend: '$200-1K' },
  { type: 'Crypto Agent', count: 2, potential: 'High', spend: '$1K-5K' },
  { type: 'Hobbyist', count: 5, potential: 'Low', spend: '$50-100' },
]

const moltbookFunnel = [
  { stage: 'Impressions', count: 147 },
  { stage: 'Profile Views', count: 23 },
  { stage: 'Engagements', count: 8 },
  { stage: 'DMs', count: 2 },
  { stage: 'Conversions', count: 0 },
]

export default function Dashboard() {
  const [lastUpdated, setLastUpdated] = useState(new Date())
  const [holdings, setHoldings] = useState(holdingsData)
  const [intelligence, setIntelligence] = useState(intelligenceData)

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value)
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      {/* Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-[128px]" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-[128px]" />
      </div>

      {/* Header */}
      <header className="relative z-50 border-b border-white/5 bg-black/20 backdrop-blur-xl sticky top-0">
        <div className="max-w-[1600px] mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-xl font-bold text-white">SYGNL</span>
              <span className="text-[10px] text-emerald-400 block -mt-1 tracking-widest uppercase">Command Center</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={() => setLastUpdated(new Date())}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10"
            >
              <RefreshCw className="w-5 h-5 text-zinc-400" />
            </button>
            <a href="/" className="p-2 rounded-xl bg-white/5 hover:bg-red-500/10">
              <LogOut className="w-5 h-5 text-zinc-400" />
            </a>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 max-w-[1600px] mx-auto px-6 py-6">
        {/* KPI Row */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <div className="flex items-center gap-2 mb-2">
              <Wallet className="w-4 h-4 text-emerald-400" />
              <span className="text-xs text-zinc-500">Live Portfolio</span>
            </div>
            <div className="text-xl font-bold">{formatCurrency(holdings.totalValue)}</div>
            <div className="flex items-center gap-1 text-xs text-zinc-500">
              {holdings.holdings.length} positions
            </div>
          </div>

          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="w-4 h-4 text-yellow-400" />
              <span className="text-xs text-zinc-500">Market</span>
            </div>
            <div className="text-xl font-bold text-yellow-400">Fragile</div>
            <div className="text-xs text-zinc-500">68% confidence</div>
          </div>

          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-4 h-4 text-blue-400" />
              <span className="text-xs text-zinc-500">Signals</span>
            </div>
            <div className="text-xl font-bold">2</div>
            <div className="text-xs text-zinc-500">0 executed</div>
          </div>

          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-4 h-4 text-orange-400" />
              <span className="text-xs text-zinc-500">Reach</span>
            </div>
            <div className="text-xl font-bold">147</div>
            <div className="text-xs text-zinc-500">impressions</div>
          </div>

          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-4 h-4 text-purple-400" />
              <span className="text-xs text-zinc-500">API Sales</span>
            </div>
            <div className="text-xl font-bold">0</div>
            <div className="text-xs text-zinc-500">goal: 10</div>
          </div>

          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="w-4 h-4 text-red-400" />
              <span className="text-xs text-zinc-500">Daily Cost</span>
            </div>
            <div className="text-xl font-bold">$2.15</div>
            <div className="text-xs text-zinc-500">72% of budget</div>
          </div>
        </div>

        {/* Objectives */}
        <div className="mb-6 p-4 rounded-xl bg-white/5 border border-white/10">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Target className="w-5 h-5 text-emerald-400" />
            February Objectives
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {objectives.map((obj) => (
              <div key={obj.name} className="p-4 rounded-lg bg-black/30">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-zinc-400">{obj.name}</span>
                  <span className={`text-xs px-2 py-0.5 rounded ${
                    obj.status === 'ontrack' ? 'bg-emerald-500/20 text-emerald-400' :
                    obj.status === 'behind' ? 'bg-yellow-500/20 text-yellow-400' :
                    obj.status === 'atrisk' ? 'bg-red-500/20 text-red-400' :
                    'bg-zinc-700 text-zinc-400'
                  }`}>
                    {obj.status === 'ontrack' ? 'On Track' :
                     obj.status === 'behind' ? 'Behind' :
                     obj.status === 'atrisk' ? 'At Risk' : 'Pending'}
                  </span>
                </div>
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-2xl font-bold">{obj.current}</span>
                  <span className="text-sm text-zinc-500">/ {obj.target}</span>
                </div>
                <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${
                    obj.status === 'ontrack' ? 'bg-emerald-500' :
                    obj.status === 'behind' ? 'bg-yellow-500' :
                    obj.status === 'atrisk' ? 'bg-red-500' : 'bg-zinc-600'
                  }`} style={{ width: `${obj.progress}%` }} />
                </div>
                <div className="mt-2 text-xs text-zinc-600">Due: {obj.deadline}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Live Holdings */}
        <div className="mb-6 p-4 rounded-xl bg-white/5 border border-white/10">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <PieChart className="w-5 h-5 text-emerald-400" />
            Live Holdings
            <span className="text-xs text-zinc-500 font-normal ml-auto">
              Updated: {new Date(holdings.lastUpdated).toLocaleString()}
            </span>
          </h3>
          <div className="space-y-2">
            {holdings.holdings.map((holding, idx) => (
              <div key={`${holding.symbol}-${idx}`} className="flex items-center justify-between p-3 rounded-lg bg-black/30">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm ${
                    holding.type === 'Crypto' 
                      ? 'bg-gradient-to-br from-orange-500/20 to-yellow-600/20 text-orange-400'
                      : 'bg-gradient-to-br from-emerald-500/20 to-teal-600/20 text-emerald-400'
                  }`}>
                    {holding.symbol.slice(0, 2)}
                  </div>
                  <div>
                    <div className="font-medium">{holding.symbol}</div>
                    <div className="text-xs text-zinc-500">
                      {holding.name}
                      {holding.quantity && (
                        <span className="ml-2 text-zinc-400">
                          {holding.quantity.toFixed(5)} {holding.symbol}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <div className="font-medium">{formatCurrency(holding.value || 0)}</div>
                    <div className="text-xs text-zinc-500">{(holding.allocation || 0).toFixed(1)}%</div>
                  </div>
                  <div className="w-32 h-2 bg-zinc-800 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${
                        holding.type === 'Crypto'
                          ? 'bg-gradient-to-r from-orange-500 to-yellow-500'
                          : 'bg-gradient-to-r from-emerald-500 to-teal-500'
                      }`}
                      style={{ width: `${holding.allocation || 0}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-white/10 flex justify-between text-sm">
            <span className="text-zinc-500">Total: <span className="text-white font-semibold">{formatCurrency(holdings.totalValue)}</span></span>
            <span className="text-zinc-500">BTC: <span className="text-orange-400 font-semibold">{holdings.btcTotal?.toFixed(5)}</span></span>
            <span className="text-zinc-500">Positions: <span className="text-white">{holdings.holdings.length}</span></span>
          </div>
        </div>

        {/* Move Considerations */}
        {holdings.moveConsiderations && holdings.moveConsiderations.length > 0 && (
          <div className="mb-6 p-4 rounded-xl bg-white/5 border border-white/10">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-yellow-400" />
              SYGNL Move Considerations
              <span className="text-xs text-zinc-500 font-normal ml-auto">
                Based on signals & allocation
              </span>
            </h3>
            <div className="space-y-2">
              {holdings.moveConsiderations.map((move, idx) => {
                const urgencyConfig = {
                  'HIGH': { color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20', icon: AlertCircle },
                  'MEDIUM': { color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20', icon: AlertTriangle },
                  'LOW': { color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', icon: CheckCircle }
                }[move.urgency] || urgencyConfig['LOW']
                const Icon = urgencyConfig.icon
                const actionColors = {
                  'ADD': 'text-emerald-400',
                  'REDUCE': 'text-red-400',
                  'HOLD': 'text-blue-400',
                  'WATCH': 'text-yellow-400'
                }
                return (
                  <div key={idx} className={`flex items-start gap-3 p-3 rounded-lg ${urgencyConfig.bg} border ${urgencyConfig.border}`}>
                    <Icon className={`w-5 h-5 ${urgencyConfig.color} mt-0.5 flex-shrink-0`} />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold">{move.symbol}</span>
                        <span className={`text-sm font-medium ${actionColors[move.action] || 'text-zinc-400'}`}>
                          {move.action}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded ${urgencyConfig.bg} ${urgencyConfig.color}`}>
                          {move.urgency}
                        </span>
                      </div>
                      <p className="text-sm text-zinc-400">{move.reasoning}</p>
                      {move.signalConfidence && (
                        <div className="mt-1 text-xs text-zinc-500">
                          Signal: {move.signalAction} ({move.signalConfidence}% conf)
                        </div>
                      )}
                      {move.suggestedSize && (
                        <div className="mt-1 text-xs text-emerald-400">
                          Suggested: {formatCurrency(move.suggestedSize)}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Intelligence & News Hub */}
        {intelligence && intelligence.all && intelligence.all.length > 0 && (
          <div className="mb-6 p-4 rounded-xl bg-white/5 border border-white/10">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Newspaper className="w-5 h-5 text-blue-400" />
              Intelligence Hub
              <span className="text-xs text-zinc-500 font-normal ml-auto">
                {intelligence.summary?.highPriority > 0 && (
                  <span className="text-red-400">{intelligence.summary.highPriority} urgent</span>
                )}
              </span>
            </h3>
            
            {/* Category Tabs */}
            <div className="flex gap-2 mb-4 overflow-x-auto">
              <button className="px-3 py-1.5 rounded-lg bg-blue-500/20 text-blue-400 text-sm font-medium">
                All ({intelligence.summary?.totalItems || 0})
              </button>
              <button className="px-3 py-1.5 rounded-lg bg-white/5 text-zinc-400 text-sm">
                📈 Financial ({intelligence.summary?.categories?.financial || 0})
              </button>
              <button className="px-3 py-1.5 rounded-lg bg-white/5 text-zinc-400 text-sm">
                🔧 OpenClaw ({intelligence.summary?.categories?.openclaw || 0})
              </button>
              <button className="px-3 py-1.5 rounded-lg bg-white/5 text-zinc-400 text-sm">
                💡 Tips ({intelligence.summary?.categories?.product || 0})
              </button>
            </div>
            
            {/* News Items */}
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {intelligence.all?.slice(0, 10).map((item, idx) => {
                const categoryConfig = {
                  'financial': { icon: TrendingUp, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
                  'openclaw': { icon: BookOpen, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
                  'product': { icon: Lightbulb, color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20' }
                }[item.category] || { icon: Newspaper, color: 'text-zinc-400', bg: 'bg-white/5', border: 'border-white/10' }
                
                const Icon = categoryConfig.icon
                const priorityEmoji = { 'high': '🔴', 'medium': '🟡', 'low': '🟢' }[item.priority] || '⚪'
                
                return (
                  <div key={idx} className={`p-3 rounded-lg ${categoryConfig.bg} border ${categoryConfig.border}`}>
                    <div className="flex items-start gap-3">
                      <Icon className={`w-5 h-5 ${categoryConfig.color} mt-0.5 flex-shrink-0`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-sm">{item.title}</span>
                          {item.priority === 'high' && (
                            <span className="text-xs">{priorityEmoji}</span>
                          )}
                        </div>
                        <p className="text-sm text-zinc-400 leading-relaxed">{item.content}</p>
                        <div className="mt-2 flex items-center gap-3 text-xs text-zinc-500">
                          <span>{item.source}</span>
                          {item.relatedSymbols && item.relatedSymbols.length > 0 && (
                            <span className="text-zinc-400">
                              Related: {item.relatedSymbols.join(', ')}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Portfolio Chart */}
          <div className="p-6 rounded-xl bg-white/5 border border-white/10">
            <h3 className="text-lg font-semibold mb-4">Portfolio Performance</h3>
            <div className="h-64 flex items-end justify-between gap-2">
              {portfolioHistory.map((item, i) => {
                const height = ((item.value - 100000) / 1500) * 100
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-2">
                    <div 
                      className="w-full bg-gradient-to-t from-emerald-500/50 to-emerald-400 rounded-t"
                      style={{ height: `${Math.max(height, 5)}%` }}
                    />
                    <span className="text-xs text-zinc-500">{item.date}</span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Moltbook Funnel */}
          <div className="p-6 rounded-xl bg-white/5 border border-white/10">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Globe className="w-5 h-5 text-orange-400" />
              Moltbook Funnel
            </h3>
            <div className="space-y-3">
              {moltbookFunnel.map((item, i) => (
                <div key={item.stage} className="flex items-center gap-4">
                  <div className="w-24 text-sm text-zinc-400">{item.stage}</div>
                  <div className="flex-1 h-8 bg-zinc-800 rounded-lg overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-orange-500 to-red-500 rounded-lg flex items-center justify-end pr-2"
                      style={{ width: `${(item.count / 147) * 100}%` }}
                    >
                      <span className="text-xs font-medium">{item.count}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-white/10 flex justify-between text-sm">
              <span className="text-zinc-500">Conversion Rate: <span className="text-white">0%</span></span>
              <span className="text-zinc-500">Cost/Lead: <span className="text-white">$4.21</span></span>
            </div>
          </div>

          {/* Agent Archetypes */}
          <div className="p-6 rounded-xl bg-white/5 border border-white/10">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-purple-400" />
              Agent Archetypes
            </h3>
            <div className="space-y-2">
              {agentArchetypes.map((arch) => (
                <div key={arch.type} className="flex items-center justify-between p-3 rounded-lg bg-black/30">
                  <div>
                    <div className="font-medium">{arch.type}</div>
                    <div className="text-xs text-zinc-500">{arch.count} detected • {arch.spend}</div>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded ${
                    arch.potential === 'High' ? 'bg-emerald-500/20 text-emerald-400' :
                    arch.potential === 'Medium' ? 'bg-blue-500/20 text-blue-400' :
                    'bg-zinc-700 text-zinc-400'
                  }`}>
                    {arch.potential}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="p-6 rounded-xl bg-white/5 border border-white/10">
            <h3 className="text-lg font-semibold mb-4">Recent Signals</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 rounded-lg bg-black/30">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded bg-zinc-800 flex items-center justify-center font-bold text-zinc-400">M</div>
                  <div>
                    <div className="font-medium">MGM</div>
                    <div className="text-xs text-zinc-500">LONG • 3:50 PM</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm">40%</div>
                  <div className="text-xs text-red-400">filtered</div>
                </div>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-black/30">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded bg-zinc-800 flex items-center justify-center font-bold text-zinc-400">A</div>
                  <div>
                    <div className="font-medium">AAP</div>
                    <div className="text-xs text-zinc-500">LONG • 3:50 PM</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm">45%</div>
                  <div className="text-xs text-red-400">filtered</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-8 pt-6 border-t border-white/5 text-center text-sm text-zinc-600">
          <div className="flex items-center justify-center gap-2">
            <Clock className="w-4 h-4" />
            <span>Last updated: {lastUpdated.toLocaleTimeString()}</span>
          </div>
          <p className="mt-2">SYGNL α — Market Intelligence for Trading Agents</p>
        </footer>
      </main>
    </div>
  )
}