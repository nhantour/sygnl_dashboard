'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  DollarSign, 
  Users, 
  MessageSquare,
  Target,
  AlertTriangle,
  Wallet,
  BarChart3,
  Clock,
  LogOut,
  RefreshCw,
  Loader2
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
import { fetchAlpacaPortfolio, fetchAlpacaPositions, fetchMoltbookStats } from '../../lib/api'

// Cost data
const costData = [
  { date: 'Jan 30', cost: 2.10 },
  { date: 'Jan 31', cost: 2.45 },
  { date: 'Feb 01', cost: 1.89 },
  { date: 'Feb 02', cost: 3.20 },
  { date: 'Feb 03', cost: 1.75 },
  { date: 'Feb 04', cost: 2.15 },
]

const briefings = [
  {
    date: '2026-02-04',
    marketState: 'Fragile',
    confidence: 68,
    signals: 2,
    portfolioValue: 100891,
    pnl: '+0.89%',
  },
  {
    date: '2026-02-03',
    marketState: 'Building',
    confidence: 72,
    signals: 3,
    portfolioValue: 101243,
    pnl: '+1.24%',
  },
  {
    date: '2026-02-02',
    marketState: 'Clear',
    confidence: 78,
    signals: 3,
    portfolioValue: 100854,
    pnl: '+0.85%',
  },
]

export default function Dashboard() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState(new Date())
  
  // Data states
  const [portfolio, setPortfolio] = useState({
    portfolioValue: 100000,
    cash: 100000,
    buyingPower: 200000,
    pnl: 0,
    pnlPercent: 0,
  })
  const [positions, setPositions] = useState([])
  const [moltbook, setMoltbook] = useState({
    followers: 0,
    posts: 1,
    subscriptions: 3,
    engagement: 0,
    apiUsers: 0,
  })
  const [portfolioHistory, setPortfolioHistory] = useState([
    { date: 'Jan 30', value: 100000 },
    { date: 'Jan 31', value: 100432 },
    { date: 'Feb 01', value: 100128 },
    { date: 'Feb 02', value: 100854 },
    { date: 'Feb 03', value: 101243 },
    { date: 'Feb 04', value: 100891 },
  ])

  // Fetch data on mount
  useEffect(() => {
    setMounted(true)
    
    // Check auth
    const auth = localStorage.getItem('sygnl_auth')
    if (!auth) {
      router.push('/')
      return
    }
    
    // Fetch real data
    loadData()
  }, [router])

  const loadData = async () => {
    setLoading(true)
    
    try {
      // Fetch Alpaca data
      const alpacaData = await fetchAlpacaPortfolio()
      setPortfolio(alpacaData)
      
      // Fetch positions
      const positionsData = await fetchAlpacaPositions()
      setPositions(positionsData)
      
      // Fetch Moltbook stats
      const moltbookData = await fetchMoltbookStats()
      setMoltbook(moltbookData)
      
      // Update portfolio history with current value
      setPortfolioHistory(prev => {
        const newHistory = [...prev]
        newHistory[newHistory.length - 1].value = alpacaData.portfolioValue
        return newHistory
      })
      
      setLastUpdated(new Date())
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('sygnl_auth')
    router.push('/')
  }

  const handleRefresh = () => {
    loadData()
  }

  const getMarketStateColor = (state) => {
    switch (state) {
      case 'Clear': return 'bg-emerald-500'
      case 'Building': return 'bg-blue-500'
      case 'Crowded': return 'bg-purple-500'
      case 'Fragile': return 'bg-yellow-500'
      case 'Break': return 'bg-red-500'
      default: return 'bg-zinc-500'
    }
  }

  if (!mounted) return null

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-surface border-b border-border sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-7 h-7 text-accent-primary" />
              <span className="text-xl font-bold tracking-tight">SYGNL</span>
              <span className="text-xs text-accent-primary bg-accent-primary/10 px-2 py-0.5 rounded">
                ALPHA
              </span>
            </div>
            <div className="flex items-center gap-4">
              {loading && <Loader2 className="w-5 h-5 text-accent-primary animate-spin" />}
              <button 
                onClick={handleRefresh}
                disabled={loading}
                className="p-2 text-zinc-400 hover:text-zinc-100 transition-colors disabled:opacity-50"
              >
                <RefreshCw className="w-5 h-5" />
              </button>
              <button 
                onClick={handleLogout}
                className="p-2 text-zinc-400 hover:text-accent-secondary transition-colors"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* Portfolio Value */}
          <div className="bg-surface border border-border rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-zinc-400">
                <Wallet className="w-4 h-4" />
                <span className="text-sm">Portfolio Value</span>
              </div>
              <span className="text-xs text-zinc-500">Alpaca Paper</span>
            </div>
            <div className="text-2xl font-bold">${portfolio.portfolioValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            <div className="flex items-center gap-2 mt-2">
              {portfolio.pnl >= 0 ? (
                <TrendingUp className="w-4 h-4 text-accent-primary" />
              ) : (
                <TrendingDown className="w-4 h-4 text-accent-secondary" />
              )}
              <span className={portfolio.pnl >= 0 ? 'text-accent-primary text-sm' : 'text-accent-secondary text-sm'}>
                {portfolio.pnl >= 0 ? '+' : ''}{portfolio.pnlPercent.toFixed(2)}%
              </span>
              <span className="text-zinc-500 text-sm">${Math.abs(portfolio.pnl).toFixed(0)}</span>
            </div>
          </div>

          {/* Market State */}
          <div className="bg-surface border border-border rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-zinc-400">
                <Activity className="w-4 h-4" />
                <span className="text-sm">Market State</span>
              </div>
              <span className="text-xs text-zinc-500">Today</span>
            </div>
            <div className="text-2xl font-bold text-yellow-500">Fragile</div>
            <div className="flex items-center gap-2 mt-2">
              <div className="w-full bg-zinc-800 rounded-full h-2">
                <div className="bg-yellow-500 h-2 rounded-full transition-all duration-500" style={{ width: '68%' }}></div>
              </div>
              <span className="text-sm text-zinc-400">68%</span>
            </div>
          </div>

          {/* Active Signals */}
          <div className="bg-surface border border-border rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-zinc-400">
                <Target className="w-4 h-4" />
                <span className="text-sm">Active Signals</span>
              </div>
              <span className="text-xs text-zinc-500">3:50 PM ET</span>
            </div>
            <div className="text-2xl font-bold">{positions.length}</div>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-zinc-500 text-sm">{positions.length > 0 ? `${positions.length} positions open` : 'No active positions'}</span>
            </div>
          </div>

          {/* Daily Cost */}
          <div className="bg-surface border border-border rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-zinc-400">
                <DollarSign className="w-4 h-4" />
                <span className="text-sm">Daily Cost</span>
              </div>
              <span className="text-xs text-zinc-500">Today</span>
            </div>
            <div className="text-2xl font-bold">$2.15</div>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-zinc-500 text-sm">Budget: $3.00/day</span>
              <span className="text-accent-primary text-sm">72%</span>
            </div>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Portfolio Chart */}
          <div className="bg-surface border border-border rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-semibold">Portfolio Performance</h3>
              <span className="text-xs text-zinc-500">7 Days</span>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={portfolioHistory}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00d4aa" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#00d4aa" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                  <XAxis dataKey="date" stroke="#71717a" fontSize={12} />
                  <YAxis stroke="#71717a" fontSize={12} domain={['dataMin - 500', 'dataMax + 500']} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#141416', border: '1px solid #27272a', borderRadius: '8px' }}
                    itemStyle={{ color: '#fafafa' }}
                    formatter={(value) => [`$${value.toLocaleString()}`, 'Value']}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#00d4aa" 
                    strokeWidth={2}
                    fillOpacity={1} 
                    fill="url(#colorValue)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Cost Tracking */}
          <div className="bg-surface border border-border rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-semibold">Cost Tracking</h3>
              <span className="text-xs text-zinc-500">7 Days</span>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={costData}>
                  <defs>
                    <linearGradient id="colorCost" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#e01b24" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#e01b24" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                  <XAxis dataKey="date" stroke="#71717a" fontSize={12} />
                  <YAxis stroke="#71717a" fontSize={12} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#141416', border: '1px solid #27272a', borderRadius: '8px' }}
                    itemStyle={{ color: '#fafafa' }}
                    formatter={(value) => [`$${value}`, 'Cost']}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="cost" 
                    stroke="#e01b24" 
                    strokeWidth={2}
                    fillOpacity={1} 
                    fill="url(#colorCost)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 flex justify-between text-sm">
              <span className="text-zinc-500">Total Spent: <span className="text-zinc-300">$8.41</span></span>
              <span className="text-zinc-500">Remaining: <span className="text-accent-primary">$41.59</span></span>
            </div>
          </div>
        </div>

        {/* Positions & Metrics */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Positions */}
          <div className="lg:col-span-2 bg-surface border border-border rounded-xl p-6">
            <h3 className="font-semibold mb-4">Open Positions</h3>
            {positions.length === 0 ? (
              <div className="p-8 text-center text-zinc-500 border border-dashed border-border rounded-lg">
                <Target className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No active positions</p>
                <p className="text-sm mt-1">Signals will execute at 3:50 PM ET if confidence {'>'} 70%</p>
              </div>
            ) : (
              <div className="space-y-3">
                {positions.map((pos, i) => (
                  <div key={i} className="flex items-center justify-between p-4 bg-background rounded-lg border border-border">
                    <div className="flex items-center gap-4">
                      <div className={`w-2 h-12 rounded-full ${pos.unrealized_pl >= 0 ? 'bg-accent-primary' : 'bg-accent-secondary'}`} />
                      <div>
                        <div className="font-medium">{pos.symbol}</div>
                        <div className="text-sm text-zinc-500">{pos.qty} shares @ ${parseFloat(pos.avg_entry_price).toFixed(2)}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`font-semibold ${pos.unrealized_pl >= 0 ? 'text-accent-primary' : 'text-accent-secondary'}`}>
                        {pos.unrealized_pl >= 0 ? '+' : ''}${parseFloat(pos.unrealized_pl).toFixed(2)}
                      </div>
                      <div className="text-sm text-zinc-500">Current: ${parseFloat(pos.current_price).toFixed(2)}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Moltbook Metrics */}
          <div className="bg-surface border border-border rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Moltbook</h3>
              <span className="text-xs text-accent-primary bg-accent-primary/10 px-2 py-1 rounded">@SYGNL</span>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-background rounded-lg">
                <div className="flex items-center gap-2 text-zinc-400">
                  <Users className="w-4 h-4" />
                  <span className="text-sm">Subscribers</span>
                </div>
                <span className="font-semibold">{moltbook.subscriptions}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-background rounded-lg">
                <div className="flex items-center gap-2 text-zinc-400">
                  <MessageSquare className="w-4 h-4" />
                  <span className="text-sm">Posts</span>
                </div>
                <span className="font-semibold">{moltbook.posts}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-background rounded-lg">
                <div className="flex items-center gap-2 text-zinc-400">
                  <TrendingUp className="w-4 h-4" />
                  <span className="text-sm">Engagement</span>
                </div>
                <span className="font-semibold">{moltbook.engagement}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-background rounded-lg">
                <div className="flex items-center gap-2 text-zinc-400">
                  <Target className="w-4 h-4" />
                  <span className="text-sm">API Users</span>
                </div>
                <span className="font-semibold text-zinc-500">{moltbook.apiUsers}</span>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-border">
              <div className="text-xs text-zinc-500 mb-2">Submolts</div>
              <div className="flex flex-wrap gap-2">
                <span className="text-xs bg-zinc-800 px-2 py-1 rounded text-zinc-300">m/trading</span>
                <span className="text-xs bg-zinc-800 px-2 py-1 rounded text-zinc-300">m/investing</span>
              </div>
            </div>
          </div>
        </div>

        {/* Validation Metrics */}
        <div className="bg-surface border border-border rounded-xl p-6 mb-8">
          <h3 className="font-semibold mb-4">Validation Metrics</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-background rounded-lg text-center">
              <div className="text-2xl font-bold text-accent-primary">{positions.length}</div>
              <div className="text-sm text-zinc-500 mt-1">Live Trades</div>
            </div>
            <div className="p-4 bg-background rounded-lg text-center">
              <div className="text-2xl font-bold text-zinc-500">0%</div>
              <div className="text-sm text-zinc-500 mt-1">Win Rate</div>
            </div>
            <div className="p-4 bg-background rounded-lg text-center">
              <div className="text-2xl font-bold text-zinc-500">0.00</div>
              <div className="text-sm text-zinc-500 mt-1">Sharpe Ratio</div>
            </div>
            <div className="p-4 bg-background rounded-lg text-center">
              <div className="text-2xl font-bold text-zinc-500">0%</div>
              <div className="text-sm text-zinc-500 mt-1">Max Drawdown</div>
            </div>
          </div>
          <div className="mt-4 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-500" />
            <div>
              <div className="text-sm font-medium text-yellow-500">Validation Phase</div>
              <div className="text-xs text-zinc-400">First signals pending. Paper trades will execute at 3:50 PM ET if confidence {'>'} 70%.</div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="border-t border-border pt-6 text-center text-sm text-zinc-500">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Clock className="w-4 h-4" />
            <span>Last updated: {lastUpdated.toLocaleTimeString()}</span>
          </div>
          <p>SYGNL α — Market Intelligence for Trading Agents</p>
        </footer>
      </main>
    </div>
  )
}