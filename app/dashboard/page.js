'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { 
  TrendingUp, 
  Activity, 
  DollarSign, 
  Users, 
  MessageSquare,
  Target,
  Wallet,
  Clock,
  LogOut,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  Zap,
  Shield,
  BarChart3,
  Globe,
  Bell
} from 'lucide-react'
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts'

// Mock data
const portfolioHistory = [
  { date: 'Jan 30', value: 100000 },
  { date: 'Jan 31', value: 100432 },
  { date: 'Feb 01', value: 100128 },
  { date: 'Feb 02', value: 100854 },
  { date: 'Feb 03', value: 101243 },
  { date: 'Feb 04', value: 100891 },
]

const costData = [
  { date: 'Jan 30', cost: 2.10 },
  { date: 'Jan 31', cost: 2.45 },
  { date: 'Feb 01', cost: 1.89 },
  { date: 'Feb 02', cost: 3.20 },
  { date: 'Feb 03', cost: 1.75 },
  { date: 'Feb 04', cost: 2.15 },
]

const recentSignals = [
  { symbol: 'MGM', direction: 'LONG', confidence: 40, status: 'filtered' },
  { symbol: 'AAP', direction: 'LONG', confidence: 45, status: 'filtered' },
]

export default function Dashboard() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [lastUpdated, setLastUpdated] = useState(new Date())
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    setMounted(true)
    const auth = localStorage.getItem('sygnl_auth')
    if (!auth) router.push('/')
  }, [router])

  const handleLogout = () => {
    localStorage.removeItem('sygnl_auth')
    router.push('/')
  }

  if (!mounted) return null

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-emerald-500/30">
      {/* Animated background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-[128px]" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-[128px]" />
      </div>

      {/* Header */}
      <header className="relative z-50 border-b border-white/5 bg-black/20 backdrop-blur-xl sticky top-0">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="text-xl font-bold tracking-tight text-white">SYGNL</span>
                <span className="text-[10px] text-emerald-400 block -mt-1 tracking-widest uppercase">Alpha</span>
              </div>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-1 bg-white/5 rounded-xl p-1">
            {['overview', 'signals', 'portfolio', 'moltbook'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  activeTab === tab 
                    ? 'bg-white/10 text-white shadow-lg' 
                    : 'text-zinc-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <button className="p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors relative">
              <Bell className="w-5 h-5 text-zinc-400" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-emerald-500 rounded-full" />
            </button>
            <button 
              onClick={() => setLastUpdated(new Date())}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
            >
              <RefreshCw className="w-5 h-5 text-zinc-400" />
            </button>
            <button 
              onClick={handleLogout}
              className="p-2 rounded-xl bg-white/5 hover:bg-red-500/10 hover:text-red-400 transition-colors"
            >
              <LogOut className="w-5 h-5 text-zinc-400" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-6 py-8">
        {/* Hero Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* Portfolio Card */}
          <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10 p-6 hover:border-emerald-500/30 transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 rounded-xl bg-emerald-500/10">
                  <Wallet className="w-5 h-5 text-emerald-400" />
                </div>
                <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Portfolio</span>
              </div>
              <div className="text-3xl font-bold text-white mb-1">$100,891</div>
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1 text-emerald-400 text-sm font-medium">
                  <ArrowUpRight className="w-4 h-4" />
                  +0.89%
                </span>
                <span className="text-zinc-500 text-sm">+$891</span>
              </div>
            </div>
          </div>

          {/* Market State Card */}
          <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10 p-6 hover:border-yellow-500/30 transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 rounded-xl bg-yellow-500/10">
                  <Activity className="w-5 h-5 text-yellow-400" />
                </div>
                <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Market State</span>
              </div>
              <div className="text-3xl font-bold text-yellow-400 mb-1">Fragile</div>
              <div className="flex items-center gap-3">
                <div className="flex-1 h-2 bg-zinc-800 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full" style={{ width: '68%' }} />
                </div>
                <span className="text-zinc-400 text-sm">68%</span>
              </div>
            </div>
          </div>

          {/* Signals Card */}
          <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10 p-6 hover:border-blue-500/30 transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 rounded-xl bg-blue-500/10">
                  <Zap className="w-5 h-5 text-blue-400" />
                </div>
                <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Signals</span>
              </div>
              <div className="text-3xl font-bold text-white mb-1">0</div>
              <div className="flex items-center gap-2">
                <span className="text-zinc-400 text-sm">2 filtered below threshold</span>
              </div>
            </div>
          </div>

          {/* Cost Card */}
          <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10 p-6 hover:border-red-500/30 transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 rounded-xl bg-red-500/10">
                  <DollarSign className="w-5 h-5 text-red-400" />
                </div>
                <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Daily Cost</span>
              </div>
              <div className="text-3xl font-bold text-white mb-1">$2.15</div>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full" style={{ width: '72%' }} />
                </div>
                <span className="text-emerald-400 text-sm">72%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Main Portfolio Chart */}
          <div className="lg:col-span-2 rounded-2xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-white">Portfolio Performance</h3>
                <p className="text-sm text-zinc-500">Real-time Alpaca paper trading</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-medium">Live</span>
                <select className="bg-white/5 border border-white/10 rounded-lg px-3 py-1 text-sm text-zinc-400 focus:outline-none focus:border-emerald-500/50">
                  <option>7 Days</option>
                  <option>30 Days</option>
                  <option>90 Days</option>
                </select>
              </div>
            </div>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={portfolioHistory}>
                  <defs>
                    <linearGradient id="portfolioGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                  <XAxis dataKey="date" stroke="#52525b" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#52525b" fontSize={12} tickLine={false} axisLine={false} domain={['dataMin - 500', 'dataMax + 500']} tickFormatter={(val) => `$${(val/1000).toFixed(0)}k`} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '12px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}
                    itemStyle={{ color: '#fff' }}
                    formatter={(value) => [`$${value.toLocaleString()}`, 'Value']}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#10b981" 
                    strokeWidth={2}
                    fillOpacity={1} 
                    fill="url(#portfolioGradient)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Side Panel */}
          <div className="space-y-6">
            {/* Market Regimes */}
            <div className="rounded-2xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Market Regimes</h3>
              <div className="space-y-3">
                {[
                  { name: 'Clear', color: 'bg-emerald-500', active: false },
                  { name: 'Building', color: 'bg-blue-500', active: false },
                  { name: 'Crowded', color: 'bg-purple-500', active: false },
                  { name: 'Fragile', color: 'bg-yellow-500', active: true },
                  { name: 'Break', color: 'bg-red-500', active: false },
                ].map((regime) => (
                  <div key={regime.name} className={`flex items-center justify-between p-3 rounded-xl transition-all ${regime.active ? 'bg-white/10' : 'hover:bg-white/5'}`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${regime.color} ${regime.active ? 'shadow-lg shadow-current' : 'opacity-50'}`} />
                      <span className={`text-sm ${regime.active ? 'text-white font-medium' : 'text-zinc-400'}`}>{regime.name}</span>
                    </div>
                    {regime.active && <span className="text-xs text-yellow-400 font-medium">Current</span>}
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Stats */}
            <div className="rounded-2xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Quick Stats</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 rounded-xl bg-white/5">
                  <div className="text-xs text-zinc-500 mb-1">Win Rate</div>
                  <div className="text-xl font-bold text-zinc-300">--</div>
                </div>
                <div className="p-3 rounded-xl bg-white/5">
                  <div className="text-xs text-zinc-500 mb-1">Sharpe</div>
                  <div className="text-xl font-bold text-zinc-300">--</div>
                </div>
                <div className="p-3 rounded-xl bg-white/5">
                  <div className="text-xs text-zinc-500 mb-1">Max DD</div>
                  <div className="text-xl font-bold text-zinc-300">--</div>
                </div>
                <div className="p-3 rounded-xl bg-white/5">
                  <div className="text-xs text-zinc-500 mb-1">Trades</div>
                  <div className="text-xl font-bold text-zinc-300">0</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Signals */}
          <div className="lg:col-span-2 rounded-2xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-white">Recent Signals</h3>
                <p className="text-sm text-zinc-500">Today's generated signals</p>
              </div>
              <button className="text-sm text-emerald-400 hover:text-emerald-300 transition-colors">View All</button>
            </div>
            <div className="space-y-3">
              {recentSignals.length === 0 ? (
                <div className="p-8 text-center text-zinc-500 border border-dashed border-white/10 rounded-xl">
                  <Target className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>No signals above 70% threshold today</p>
                  <p className="text-sm mt-1">Market state: Fragile — protecting capital</p>
                </div>
              ) : (
                recentSignals.map((signal, i) => (
                  <div key={i} className="flex items-center justify-between p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center font-bold text-zinc-400">
                        {signal.symbol[0]}
                      </div>
                      <div>
                        <div className="font-medium text-white">{signal.symbol}</div>
                        <div className="text-sm text-zinc-500">{signal.direction}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-sm font-medium text-white">{signal.confidence}%</div>
                        <div className="text-xs text-zinc-500">confidence</div>
                      </div>
                      <span className="px-3 py-1 rounded-full bg-red-500/10 text-red-400 text-xs font-medium">
                        Filtered
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Moltbook Status */}
          <div className="rounded-2xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-white">Moltbook</h3>
                <p className="text-sm text-zinc-500">Social presence</p>
              </div>
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
                <Globe className="w-4 h-4 text-white" />
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-xl bg-white/5">
                <span className="text-sm text-zinc-400">@SYGNL</span>
                <span className="text-xs px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-400">Active</span>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center p-3 rounded-xl bg-white/5">
                  <div className="text-lg font-bold text-white">3</div>
                  <div className="text-xs text-zinc-500">Subs</div>
                </div>
                <div className="text-center p-3 rounded-xl bg-white/5">
                  <div className="text-lg font-bold text-white">1</div>
                  <div className="text-xs text-zinc-500">Posts</div>
                </div>
                <div className="text-center p-3 rounded-xl bg-white/5">
                  <div className="text-lg font-bold text-white">0</div>
                  <div className="text-xs text-zinc-500">API</div>
                </div>
              </div>
              <div className="flex gap-2">
                <span className="text-xs px-2 py-1 rounded-lg bg-zinc-800 text-zinc-400">m/trading</span>
                <span className="text-xs px-2 py-1 rounded-lg bg-zinc-800 text-zinc-400">m/investing</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-12 pt-8 border-t border-white/5 text-center">
          <div className="flex items-center justify-center gap-2 text-sm text-zinc-600">
            <Clock className="w-4 h-4" />
            <span>Last updated: {lastUpdated.toLocaleTimeString()}</span>
          </div>
          <p className="text-zinc-700 text-sm mt-2">SYGNL α — Market Intelligence for Trading Agents</p>
        </footer>
      </main>
    </div>
  )
}