'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { 
  TrendingUp, Activity, DollarSign, Users, Target, Wallet,
  Clock, LogOut, RefreshCw, ArrowUpRight, ArrowDownRight, Zap,
  Shield, Globe, Bell, BarChart3, PieChart, LineChart as LineChartIcon,
  Briefcase, MousePointer, Eye, ShoppingCart, TrendingDown,
  Brain, Cpu, Layers, AlertCircle, CheckCircle2, XCircle,
  ChevronRight, Filter, Download, MoreHorizontal
} from 'lucide-react'
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, BarChart, Bar, PieChart as RePieChart, Pie, Cell
} from 'recharts'

// Mock data - will be replaced with real API calls
const portfolioHistory = [
  { date: 'Jan 30', value: 100000, signals: 0 },
  { date: 'Jan 31', value: 100432, signals: 2 },
  { date: 'Feb 01', value: 100128, signals: 1 },
  { date: 'Feb 02', value: 100854, signals: 3 },
  { date: 'Feb 03', value: 101243, signals: 2 },
  { date: 'Feb 04', value: 100891, signals: 2 },
]

const signalAccuracy = [
  { date: 'Jan 30', accuracy: 0, count: 0 },
  { date: 'Jan 31', accuracy: 65, count: 2 },
  { date: 'Feb 01', accuracy: 72, count: 1 },
  { date: 'Feb 02', accuracy: 68, count: 3 },
  { date: 'Feb 03', accuracy: 75, count: 2 },
  { date: 'Feb 04', accuracy: 0, count: 2 },
]

const costBreakdown = [
  { name: 'API Calls', value: 3.20, color: '#10b981' },
  { name: 'Sub-agents', value: 3.50, color: '#3b82f6' },
  { name: 'Compute', value: 1.20, color: '#f59e0b' },
  { name: 'Other', value: 0.51, color: '#6b7280' },
]

const moltbookFunnel = [
  { stage: 'Impressions', count: 147, color: '#10b981' },
  { stage: 'Profile Views', count: 23, color: '#3b82f6' },
  { stage: 'Engagements', count: 8, color: '#f59e0b' },
  { stage: 'DMs', count: 2, color: '#8b5cf6' },
  { stage: 'Conversions', count: 0, color: '#ec4899' },
]

const agentArchetypes = [
  { type: 'Financial Advisor', count: 1, potential: 'High', spend: '$500-2K' },
  { type: 'Day Trader Bot', count: 3, potential: 'Medium', spend: '$100-500' },
  { type: 'Executive Assistant', count: 0, potential: 'Medium', spend: '$200-1K' },
  { type: 'Crypto Agent', count: 2, potential: 'High', spend: '$1K-5K' },
  { type: 'Hobbyist', count: 5, potential: 'Low', spend: '$50-100' },
]

const recentSignals = [
  { symbol: 'MGM', direction: 'LONG', confidence: 40, status: 'filtered', time: '3:50 PM' },
  { symbol: 'AAP', direction: 'LONG', confidence: 45, status: 'filtered', time: '3:50 PM' },
]

const objectives = [
  { 
    name: 'API Conversions', 
    current: 0, 
    target: 10, 
    deadline: 'Feb 28',
    progress: 0,
    status: 'behind'
  },
  { 
    name: 'Moltbook Followers', 
    current: 3, 
    target: 50, 
    deadline: 'Feb 28',
    progress: 6,
    status: 'ontrack'
  },
  { 
    name: 'Validation Trades', 
    current: 0, 
    target: 20, 
    deadline: 'Feb 14',
    progress: 0,
    status: 'atrisk'
  },
  { 
    name: 'Signal Accuracy', 
    current: 0, 
    target: 65, 
    deadline: 'Ongoing',
    progress: 0,
    status: 'pending'
  },
]

export default function Dashboard() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [lastUpdated, setLastUpdated] = useState(new Date())
  const [activeTab, setActiveTab] = useState('overview')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setMounted(true)
    const auth = localStorage.getItem('sygnl_auth')
    if (!auth) router.push('/')
  }, [router])

  const handleLogout = () => {
    localStorage.removeItem('sygnl_auth')
    router.push('/')
  }

  const handleRefresh = () => {
    setLoading(true)
    setTimeout(() => {
      setLastUpdated(new Date())
      setLoading(false)
    }, 1000)
  }

  if (!mounted) return null

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-emerald-500/30">
      {/* Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-[128px]" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-[128px]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px]" />
      </div>

      {/* Header */}
      <header className="relative z-50 border-b border-white/5 bg-black/20 backdrop-blur-xl sticky top-0">
        <div className="max-w-[1600px] mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-white">SYGNL</span>
              <span className="text-[10px] text-emerald-400 block -mt-1 tracking-widest uppercase">Command Center</span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-1 bg-white/5 rounded-xl p-1">
            {['overview', 'trading', 'moltbook', 'api', 'costs'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
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
            <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-zinc-400">Live</span>
            </div>
            <button className="p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors relative">
              <Bell className="w-5 h-5 text-zinc-400" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-emerald-500 rounded-full" />
            </button>
            <button 
              onClick={handleRefresh}
              disabled={loading}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
            >
              <RefreshCw className={`w-5 h-5 text-zinc-400 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button 
              onClick={handleLogout}
              className="p-2 rounded-xl bg-white/5 hover:bg-red-500/10 transition-colors"
            >
              <LogOut className="w-5 h-5 text-zinc-400" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 max-w-[1600px] mx-auto px-6 py-6">
        {/* KPI Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-6">
          <KPICard 
            icon={Wallet} 
            label="Portfolio" 
            value="$100,891" 
            change="+0.89%" 
            changeType="positive"
            subtext="+$891"
          />
          <KPICard 
            icon={Activity} 
            label="Market State" 
            value="Fragile" 
            change="68%"
            changeType="neutral"
            subtext="Confidence"
            highlight="yellow"
          />
          <KPICard 
            icon={Zap} 
            label="Signals Today" 
            value="2" 
            change="0 exe"
            changeType="neutral"
            subtext="3 filtered"
          />
          <KPICard 
            icon={Users} 
            label="Moltbook Reach" 
            value="147" 
            change="+12"
            changeType="positive"
            subtext="Impressions"
          />
          <KPICard 
            icon={Target} 
            label="API Conversions" 
            value="0" 
            change="0%"
            changeType="neutral"
            subtext="Goal: 10"
          />
          <KPICard 
            icon={DollarSign} 
            label="Daily Burn" 
            value="$2.15" 
            change="72%"
            changeType="positive"
            subtext="of $3 budget"
          />
        </div>

        {/* Objectives Tracker */}
        <div className="mb-6 p-4 rounded-2xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <Target className="w-5 h-5 text-emerald-400" />
              Monthly Objectives
            </h3>
            <span className="text-xs text-zinc-500">February 2026</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {objectives.map((obj) => (
              <div key={obj.name} className="p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-zinc-400">{obj.name}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    obj.status === 'ontrack' ? 'bg-emerald-500/10 text-emerald-400' :
                    obj.status === 'behind' ? 'bg-yellow-500/10 text-yellow-400' :
                    obj.status === 'atrisk' ? 'bg-red-500/10 text-red-400' :
                    'bg-zinc-700 text-zinc-400'
                  }`}>
                    {obj.status === 'ontrack' ? 'On Track' :
                     obj.status === 'behind' ? 'Behind' :
                     obj.status === 'atrisk' ? 'At Risk' : 'Pending'}
                  </span>
                </div>
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-2xl font-bold text-white">{obj.current}</span>
                  <span className="text-sm text-zinc-500">/ {obj.target}</span>
                </div>
                <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full ${
                      obj.status === 'ontrack' ? 'bg-emerald-500' :
                      obj.status === 'behind' ? 'bg-yellow-500' :
                      obj.status === 'atrisk' ? 'bg-red-500' : 'bg-zinc-600'
                    }`}
                    style={{ width: `${obj.progress}%` }}
                  />
                </div>
                <div className="mt-2 text-xs text-zinc-500">Due: {obj.deadline}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Charts */}
          <div className="lg:col-span-2 space-y-6">
            {/* Portfolio Performance */}
            <div className="rounded-2xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10 p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <LineChartIcon className="w-5 h-5 text-emerald-400" />
                    Portfolio vs Signals
                  </h3>
                  <p className="text-sm text-zinc-500">Tracking signal generation vs actual performance</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs">Alpaca Paper</span>
                </div>
              </div>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={portfolioHistory}>
                    <defs>
                      <linearGradient id="portfolioGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                    <XAxis dataKey="date" stroke="#52525b" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#52525b" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `$${(val/1000).toFixed(0)}k`} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '12px' }}
                      itemStyle={{ color: '#fff' }}
                    />
                    <Area type="monotone" dataKey="value" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#portfolioGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Signal Accuracy */}
            <div className="rounded-2xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10 p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <Brain className="w-5 h-5 text-blue-400" />
                    Signal Accuracy Tracking
                  </h3>
                  <p className="text-sm text-zinc-500">Validation of signal confidence vs outcomes</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
                  <span className="text-xs text-zinc-400">Collecting data...</span>
                </div>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={signalAccuracy}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                    <XAxis dataKey="date" stroke="#52525b" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#52525b" fontSize={12} tickLine={false} axisLine={false} unit="%" domain={[0, 100]} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '12px' }}
                      formatter={(val, name) => [name === 'accuracy' ? `${val}%` : val, name === 'accuracy' ? 'Accuracy' : 'Signals']}
                    />
                    <Line type="monotone" dataKey="accuracy" stroke="#3b82f6" strokeWidth={2} dot={{ fill: '#3b82f6' }} />
                    <Line type="monotone" dataKey="count" stroke="#f59e0b" strokeWidth={2} dot={{ fill: '#f59e0b' }} yAxisId={1} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Recent Signals Table */}
            <div className="rounded-2xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Today's Signals</h3>
                <button className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1">
                  View History <ChevronRight className="w-3 h-3" />
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left border-b border-white/5">
                      <th className="pb-3 text-xs font-medium text-zinc-500 uppercase">Symbol</th>
                      <th className="pb-3 text-xs font-medium text-zinc-500 uppercase">Direction</th>
                      <th className="pb-3 text-xs font-medium text-zinc-500 uppercase">Confidence</th>
                      <th className="pb-3 text-xs font-medium text-zinc-500 uppercase">Status</th>
                      <th className="pb-3 text-xs font-medium text-zinc-500 uppercase">Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentSignals.map((signal, i) => (
                      <tr key={i} className="border-b border-white/5 last:border-0">
                        <td className="py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center font-bold text-sm text-zinc-400">
                              {signal.symbol[0]}
                            </div>
                            <span className="font-medium text-white">{signal.symbol}</span>
                          </div>
                        </td>
                        <td className="py-4">
                          <span className={`text-sm ${signal.direction === 'LONG' ? 'text-emerald-400' : 'text-red-400'}`}>
                            {signal.direction}
                          </span>
                        </td>
                        <td className="py-4">
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-2 bg-zinc-800 rounded-full overflow-hidden">
                              <div 
                                className={`h-full rounded-full ${signal.confidence >= 70 ? 'bg-emerald-500' : signal.confidence >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
                                style={{ width: `${signal.confidence}%` }}
                              />
                            </div>
                            <span className="text-sm text-zinc-400">{signal.confidence}%</span>
                          </div>
                        </td>
                        <td className="py-4">
                          <span className="px-2 py-1 rounded-full bg-red-500/10 text-red-400 text-xs">
                            {signal.status}
                          </span>
                        </td>
                        <td className="py-4 text-sm text-zinc-500">{signal.time}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Right Column - Business Intel */}
          <div className="space-y-6">
            {/* Moltbook Funnel */}
            <div className="rounded-2xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10 p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Globe className="w-5 h-5 text-orange-400" />
                Moltbook Funnel
              </h3>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={moltbookFunnel} layout="vertical">
                    <XAxis type="number" hide />
                    <YAxis dataKey="stage" type="category" width={100} tick={{ fill: '#9ca3af', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '12px' }}
                      cursor={{ fill: 'transparent' }}
                    />
                    <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                      {moltbookFunnel.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 pt-4 border-t border-white/5">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-zinc-400">Conversion Rate</span>
                  <span className="text-zinc-300">0%</span>
                </div>
                <div className="flex items-center justify-between text-sm mt-2">
                  <span className="text-zinc-400">Cost per Lead</span>
                  <span className="text-zinc-300">$4.21</span>
                </div>
              </div>
            </div>

            {/* Agent Archetypes */}
            <div className="rounded-2xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10 p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Users className="w-5 h-5 text-purple-400" />
                Agent Archetypes
              </h3>
              <div className="space-y-3">
                {agentArchetypes.map((archetype) => (
                  <div key={archetype.type} className="flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors">
                    <div>
                      <div className="text-sm font-medium text-white">{archetype.type}</div>
                      <div className="text-xs text-zinc-500">{archetype.count} detected • {archetype.spend}</div>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      archetype.potential === 'High' ? 'bg-emerald-500/10 text-emerald-400' :
                      archetype.potential === 'Medium' ? 'bg-blue-500/10 text-blue-400' :
                      'bg-zinc-700 text-zinc-400'
                    }`}>
                      {archetype.potential}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Cost Breakdown */}
            <div className="rounded-2xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10 p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <PieChart className="w-5 h-5 text-red-400" />
                Cost Breakdown
              </h3>
              <div className="h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <RePieChart>
                    <Pie
                      data={costBreakdown}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={60}
                      dataKey="value"
                    >
                      {costBreakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '12px' }}
                      formatter={(val) => [`$${val}`, 'Cost']}
                    />
                  </RePieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-2 mt-2">
                {costBreakdown.map((item) => (
                  <div key={item.name} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-zinc-400">{item.name}</span>
                    </div>
                    <span className="text-white">${item.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="rounded-2xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
              <div className="space-y-2">
                <button className="w-full p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors text-left flex items-center justify-between group">
                  <div className="flex items-center gap-3">
                    <Globe className="w-5 h-5 text-orange-400" />
                    <span className="text-sm text-white">Post to Moltbook</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-zinc-500 group-hover:text-white transition-colors" />
                </button>
                <button className="w-full p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors text-left flex items-center justify-between group">
                  <div className="flex items-center gap-3">
                    <Download className="w-5 h-5 text-blue-400" />
                    <span className="text-sm text-white">Export Report</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-zinc-500 group-hover:text-white transition-colors" />
                </button>
                <button className="w-full p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors text-left flex items-center justify-between group">
                  <div className="flex items-center gap-3">
                    <BarChart3 className="w-5 h-5 text-emerald-400" />
                    <span className="text-sm text-white">View Analytics</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-zinc-500 group-hover:text-white transition-colors" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

// KPI Card Component
function KPICard({ icon: Icon, label, value, change, changeType, subtext, highlight }) {
  return (
    <div className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10 p-4 hover:border-white/20 transition-all">
      <div className="flex items-start justify-between mb-2">
        <div className={`p-2 rounded-lg ${
          highlight === 'yellow' ? 'bg-yellow-500/10' :
          highlight === 'red' ? 'bg-red-500/10' :
          'bg-emerald-500/10'
        }`}>
          <Icon className={`w-4 h-4 ${
            highlight === 'yellow' ? 'text-yellow-400' :
            highlight === 'red' ? 'text-red-400' :
            'text-emerald-400'
          }`} />
        </div>
        {change && (
          <span className={`text-xs font-medium flex items-center ${
            changeType === 'positive' ? 'text-emerald-400' :
            changeType === 'negative' ? 'text-red-400' :
            'text-zinc-400'
          }`}>
            {changeType === 'positive' && <ArrowUpRight className="w-3 h-3 mr-0.5" />}
            {changeType === 'negative' && <ArrowDownRight className="w-3 h-3 mr-0.5" />}
            {change}
          </span>
        )}
      </div>
      <div className="text-xl font-bold text-white mb-0.5">{value}</div>
      <div className="text-xs text-zinc-500">{label}</div>
      {subtext && <div className="text-xs text-zinc-600 mt-1">{subtext}</div>}
    </div>
  )
}