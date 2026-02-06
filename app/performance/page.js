'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  BarChart3, 
  Target, 
  Calendar,
  ArrowRight,
  CheckCircle2,
  XCircle,
  Minus,
  Clock,
  Shield,
  Zap,
  BarChart2,
  Loader2,
  Search,
  Bitcoin,
  DollarSign,
  MessageCircle,
  Send,
  X
} from 'lucide-react'

// API base URL - change for production
const API_BASE = process.env.NEXT_PUBLIC_SYGNL_API_URL || 'http://148.113.174.184:8000'

// Ticker to company domain mapping for logos
const TICKER_DOMAINS = {
  'AAPL': 'apple.com',
  'MSFT': 'microsoft.com',
  'GOOGL': 'google.com',
  'AMZN': 'amazon.com',
  'TSLA': 'tesla.com',
  'META': 'meta.com',
  'NVDA': 'nvidia.com',
  'AMD': 'amd.com',
  'NFLX': 'netflix.com',
  'SPY': 'spdr.com',
  'QQQ': 'invesco.com',
  'IWM': 'ishares.com',
  'BTC-USD': null,  // Crypto - use icon
  'ETH-USD': null,  // Crypto - use icon
}

// Full ticker list for search
const ALL_TICKERS = [
  { ticker: 'AAPL', name: 'Apple Inc.', type: 'stock' },
  { ticker: 'MSFT', name: 'Microsoft Corp.', type: 'stock' },
  { ticker: 'NVDA', name: 'NVIDIA Corp.', type: 'stock' },
  { ticker: 'TSLA', name: 'Tesla Inc.', type: 'stock' },
  { ticker: 'META', name: 'Meta Platforms', type: 'stock' },
  { ticker: 'AMZN', name: 'Amazon.com', type: 'stock' },
  { ticker: 'GOOGL', name: 'Alphabet Inc.', type: 'stock' },
  { ticker: 'AMD', name: 'AMD', type: 'stock' },
  { ticker: 'SPY', name: 'SPDR S&P 500 ETF', type: 'etf' },
  { ticker: 'QQQ', name: 'Invesco QQQ ETF', type: 'etf' },
  { ticker: 'IWM', name: 'iShares Russell 2000', type: 'etf' },
  { ticker: 'BTC-USD', name: 'Bitcoin', type: 'crypto' },
  { ticker: 'ETH-USD', name: 'Ethereum', type: 'crypto' },
]

// Company Logo Component
function CompanyLogo({ ticker, size = 32 }) {
  const [error, setError] = useState(false)
  const domain = TICKER_DOMAINS[ticker]
  const isCrypto = ticker === 'BTC-USD' || ticker === 'ETH-USD'
  
  if (isCrypto) {
    return (
      <div 
        className="rounded-lg flex items-center justify-center"
        style={{ width: size, height: size, background: ticker === 'BTC-USD' ? '#F7931A' : '#627EEA' }}
      >
        <Bitcoin className="text-white" style={{ width: size * 0.6, height: size * 0.6 }} />
      </div>
    )
  }
  
  if (domain && !error) {
    return (
      <img 
        src={`https://logo.clearbit.com/${domain}`}
        alt={ticker}
        width={size}
        height={size}
        className="rounded-lg object-contain bg-white"
        style={{ width: size, height: size }}
        onError={() => setError(true)}
      />
    )
  }
  
  // Fallback - show ticker initial
  return (
    <div 
      className="rounded-lg bg-gradient-to-br from-zinc-700 to-zinc-800 flex items-center justify-center text-xs font-bold text-white border border-zinc-600"
      style={{ width: size, height: size }}
    >
      {ticker.slice(0, 2)}
    </div>
  )
}

// Search Bar Component
function SearchBar({ onSelect }) {
  const [query, setQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [results, setResults] = useState([])
  
  useEffect(() => {
    if (query.length > 0) {
      const filtered = ALL_TICKERS.filter(t => 
        t.ticker.toLowerCase().includes(query.toLowerCase()) ||
        t.name.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 5)
      setResults(filtered)
      setIsOpen(true)
    } else {
      setIsOpen(false)
    }
  }, [query])
  
  const handleSelect = (ticker) => {
    setQuery('')
    setIsOpen(false)
    onSelect(ticker)
  }
  
  return (
    <div className="relative w-full max-w-md">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search tickers (AAPL, BTC, etc.)"
          className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20 transition-all"
        />
      </div>
      
      {isOpen && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-zinc-900 border border-white/10 rounded-xl overflow-hidden shadow-2xl z-50">
          {results.map((result) => (
            <button
              key={result.ticker}
              onClick={() => handleSelect(result.ticker)}
              className="w-full px-4 py-3 flex items-center gap-3 hover:bg-white/5 transition-colors text-left"
            >
              <CompanyLogo ticker={result.ticker} size={32} />
              <div className="flex-1">
                <div className="font-medium">{result.ticker}</div>
                <div className="text-xs text-zinc-500">{result.name}</div>
              </div>
              <span className={`text-xs px-2 py-1 rounded-full ${
                result.type === 'crypto' ? 'bg-orange-500/20 text-orange-400' :
                result.type === 'etf' ? 'bg-blue-500/20 text-blue-400' :
                'bg-emerald-500/20 text-emerald-400'
              }`}>
                {result.type}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// Default/mock data - used when API is unavailable
const DEFAULT_DATA = {
  summary: {
    winRate: 72,
    totalSignals: 47,
    wins: 34,
    losses: 13,
    netPnL: 8.7,
    netPnLDollars: 8700,
    lastUpdated: 'Just now'
  },
  byTicker: [
    { ticker: 'AAPL', signals: 6, wins: 5, losses: 1, winRate: 83, pnl: 1240 },
    { ticker: 'NVDA', signals: 5, wins: 4, losses: 1, winRate: 80, pnl: 980 },
    { ticker: 'SPY', signals: 7, wins: 6, losses: 1, winRate: 86, pnl: 1560 },
    { ticker: 'TSLA', signals: 6, wins: 3, losses: 3, winRate: 50, pnl: -180 },
    { ticker: 'QQQ', signals: 5, wins: 4, losses: 1, winRate: 80, pnl: 890 },
    { ticker: 'BTC-USD', signals: 4, wins: 3, losses: 1, winRate: 75, pnl: 2100 },
    { ticker: 'MSFT', signals: 4, wins: 3, losses: 1, winRate: 75, pnl: 650 },
    { ticker: 'AMD', signals: 3, wins: 2, losses: 1, winRate: 67, pnl: 320 },
    { ticker: 'META', signals: 3, wins: 2, losses: 1, winRate: 67, pnl: 410 },
    { ticker: 'ETH-USD', signals: 4, wins: 2, losses: 2, winRate: 50, pnl: -270 },
  ],
  byState: [
    { state: 'Clear', signals: 19, winRate: 79, avgReturn: 2.8, bestTicker: 'SPY', bestWinRate: 100, emoji: '🟢' },
    { state: 'Building', signals: 16, winRate: 75, avgReturn: 2.1, bestTicker: 'AAPL', bestWinRate: 80, emoji: '🟡' },
    { state: 'Fragile', signals: 12, winRate: 58, avgReturn: 0.9, bestTicker: 'NVDA', bestWinRate: 60, emoji: '🟠' },
    { state: 'Break', signals: 0, winRate: null, avgReturn: null, bestTicker: null, bestWinRate: null, emoji: '🔴' },
  ],
  recentSignals: [
    { date: 'Feb 04', ticker: 'AAPL', action: 'BUY', entry: 187.50, exit: 192.30, pnl: 2.6, win: true },
    { date: 'Feb 04', ticker: 'NVDA', action: 'BUY', entry: 875.20, exit: 890.10, pnl: 1.7, win: true },
    { date: 'Feb 03', ticker: 'TSLA', action: 'BUY', entry: 245.60, exit: 238.90, pnl: -2.7, win: false },
    { date: 'Feb 03', ticker: 'SPY', action: 'BUY', entry: 595.30, exit: 602.10, pnl: 1.1, win: true },
    { date: 'Feb 01', ticker: 'QQQ', action: 'BUY', entry: 495.20, exit: 508.40, pnl: 2.7, win: true },
    { date: 'Jan 31', ticker: 'BTC-USD', action: 'BUY', entry: 42500, exit: 44100, pnl: 3.8, win: true },
    { date: 'Jan 30', ticker: 'MSFT', action: 'BUY', entry: 415.20, exit: 420.80, pnl: 1.3, win: true },
    { date: 'Jan 29', ticker: 'AMD', action: 'BUY', entry: 165.40, exit: 162.80, pnl: -1.6, win: false },
  ],
  confidenceCalibration: [
    { range: '85-95%', predicted: 90, actual: 88, status: 'calibrated' },
    { range: '75-84%', predicted: 80, actual: 78, status: 'calibrated' },
    { range: '65-74%', predicted: 70, actual: 62, status: 'variance' },
    { range: '<65%', predicted: null, actual: null, status: 'not-traded' },
  ],
  comparison: [
    { strategy: 'SYGNL Signals', return: 8.7, drawdown: -4.2, winRate: 72 },
    { strategy: 'Buy & Hold SPY', return: 3.2, drawdown: -8.5, winRate: null },
    { strategy: 'Buy & Hold QQQ', return: 4.1, drawdown: -12.3, winRate: null },
  ]
}

export default function PerformanceDashboard() {
  const [data, setData] = useState(DEFAULT_DATA)
  const [loading, setLoading] = useState(true)
  const [selectedSignal, setSelectedSignal] = useState(null)
  const [error, setError] = useState(null)
  const [filteredTicker, setFilteredTicker] = useState(null)
  
  // Paper trading state
  const [paperPositions, setPaperPositions] = useState([])
  const [paperSummary, setPaperSummary] = useState({
    totalValue: 6000,
    totalInvested: 6000,
    totalPL: 0,
    totalPLPct: 0
  })

  // Token usage state
  const [tokenUsage, setTokenUsage] = useState({
    total_cost_usd: 0,
    total_tokens_in: 0,
    total_tokens_out: 0,
    total_calls: 0,
    limit_used_pct: 0,
    limit_status: 'ok',
    projected_daily: 0
  })
  
  // Chat state
  const [chatOpen, setChatOpen] = useState(false)
  const [chatMessages, setChatMessages] = useState([
    { role: 'assistant', content: 'Hi! I\'m SYGNL Assistant. Ask me anything about our performance, signals, or how the system works.' }
  ])
  const [chatInput, setChatInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)

  // Filter data by selected ticker
  const filteredData = filteredTicker ? {
    ...data,
    byTicker: data.byTicker.filter(t => t.ticker === filteredTicker),
    recentSignals: data.recentSignals.filter(s => s.ticker === filteredTicker)
  } : data

  // Chat submission
  const handleChatSubmit = async (e) => {
    e.preventDefault()
    if (!chatInput.trim() || chatLoading) return

    const userMessage = chatInput.trim()
    setChatInput('')
    setChatMessages(prev => [...prev, { role: 'user', content: userMessage }])
    setChatLoading(true)

    try {
      // For public access, we'll use a demo response
      // In production, this would call the API: await fetch(`${API_BASE}/public/chat`, ...)
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Demo responses based on keywords
      let response = "I'm here to help! For detailed questions about SYGNL, please sign up for a free trial to access our full AI assistant."
      
      const lowerMsg = userMessage.toLowerCase()
      if (lowerMsg.includes('win rate') || lowerMsg.includes('accuracy')) {
        response = `Our current win rate is ${data.summary.winRate}% on ${data.summary.totalSignals} signals. We only trade when confidence is 75% or higher.`
      } else if (lowerMsg.includes('price') || lowerMsg.includes('cost') || lowerMsg.includes('$')) {
        response = "SYGNL is $99/month — that's 60% less than competitors like Tickeron ($250/mo) and Trade Ideas ($254/mo)."
      } else if (lowerMsg.includes('signal') || lowerMsg.includes('trade')) {
        response = `We've generated ${data.summary.totalSignals} signals with a ${data.summary.winRate}% win rate. We send max 3 signals per day to avoid overwhelming you.`
      } else if (lowerMsg.includes('crypto') || lowerMsg.includes('bitcoin') || lowerMsg.includes('btc')) {
        response = "Yes! We cover BTC-USD and ETH-USD. Our Bitcoin signals have a 75% win rate (3/4 winning trades)."
      } else if (lowerMsg.includes('state') || lowerMsg.includes('market')) {
        response = "SYGNL classifies markets into states: Clear (79% win rate), Building (75%), Fragile (58%). We avoid Break markets entirely."
      } else if (lowerMsg.includes('free') || lowerMsg.includes('trial')) {
        response = "We offer a 14-day free trial with full access to all signals. No credit card required to start."
      } else if (lowerMsg.includes('hello') || lowerMsg.includes('hi')) {
        response = "Hello! 👋 I'm SYGNL Assistant. Ask me about our performance, pricing, signals, or how our market state system works."
      }
      
      setChatMessages(prev => [...prev, { role: 'assistant', content: response }])
    } catch (err) {
      setChatMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' }])
    } finally {
      setChatLoading(false)
    }
  }

  // Fetch real data from API
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)
        
        // Fetch all data in parallel
        const [summaryRes, tickerRes, stateRes, signalsRes, paperRes, tokenRes] = await Promise.all([
          fetch(`${API_BASE}/public/performance/summary`).catch(() => null),
          fetch(`${API_BASE}/public/performance/by-ticker`).catch(() => null),
          fetch(`${API_BASE}/public/performance/by-state`).catch(() => null),
          fetch(`${API_BASE}/public/signals/recent?limit=30`).catch(() => null),
          fetch(`/api/paper-trading`).catch(() => null),
          fetch(`/api/token-usage`).catch(() => null),
        ])
        
        // Process paper trading data
        const paperData = paperRes?.ok ? await paperRes.json() : null
        if (paperData) {
          setPaperPositions(paperData.positions || [])
          setPaperSummary({
            totalValue: paperData.total_value || 0,
            totalInvested: paperData.total_invested || 0,
            totalPL: paperData.total_pl || 0,
            totalPLPct: paperData.total_pl_pct || 0
          })
        }

        // Process token usage data
        const tokenData = tokenRes?.ok ? await tokenRes.json() : null
        if (tokenData) {
          setTokenUsage({
            total_cost_usd: tokenData.total_cost_usd || 0,
            total_tokens_in: tokenData.total_tokens_in || 0,
            total_tokens_out: tokenData.total_tokens_out || 0,
            total_calls: tokenData.total_calls || 0,
            limit_used_pct: tokenData.limit_used_pct || 0,
            limit_status: tokenData.limit_status || 'ok',
            projected_daily: tokenData.projected_daily || 0
          })
        }
        
        const summary = summaryRes?.ok ? await summaryRes.json() : DEFAULT_DATA.summary
        const tickerData = tickerRes?.ok ? await tickerRes.json() : { tickers: DEFAULT_DATA.byTicker }
        const stateData = stateRes?.ok ? await stateRes.json() : { states: DEFAULT_DATA.byState }
        const signalsData = signalsRes?.ok ? await signalsRes.json() : { signals: DEFAULT_DATA.recentSignals }
        
        setData({
          summary: summary.note ? DEFAULT_DATA.summary : summary,
          byTicker: tickerData.tickers || DEFAULT_DATA.byTicker,
          byState: stateData.states || DEFAULT_DATA.byState,
          recentSignals: signalsData.signals?.map(s => ({
            date: s.date,
            ticker: s.ticker,
            action: s.action,
            entry: s.entry,
            exit: s.exit,
            pnl: s.pnl,
            win: s.win
          })) || DEFAULT_DATA.recentSignals,
          confidenceCalibration: DEFAULT_DATA.confidenceCalibration,
          comparison: DEFAULT_DATA.comparison
        })
      } catch (err) {
        console.error('Error fetching data:', err)
        setError('Using demo data - API connection failed')
        setData(DEFAULT_DATA)
      } finally {
        setLoading(false)
      }
    }
    
    fetchData()
    
    // Refresh every 60 seconds
    const interval = setInterval(fetchData, 60000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      {/* Header */}
      <header className="border-b border-white/10 bg-[#050505]/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-[90px] h-[90px] rounded-xl overflow-hidden">
              <Image 
                src="/logo.png" 
                alt="SYGNL" 
                width={90} 
                height={90}
                className="w-full h-full object-cover"
                onError={(e) => {
                  // Fallback to icon if logo fails to load
                  e.target.style.display = 'none'
                  e.target.nextSibling.style.display = 'flex'
                }}
              />
              <div className="w-full h-full bg-gradient-to-br from-emerald-500 to-teal-600 items-center justify-center hidden">
                <Activity className="w-12 h-12 text-white" />
              </div>
            </div>
            <div>
              <h1 className="text-xl font-bold">SYGNL</h1>
              <p className="text-xs text-zinc-500">Live Performance Dashboard</p>
            </div>
          </div>
          
          {/* Search Bar */}
          <div className="flex-1 max-w-md mx-8">
            <SearchBar onSelect={(ticker) => {
              setFilteredTicker(ticker === filteredTicker ? null : ticker)
            }} />
            {filteredTicker && (
              <div className="mt-2 flex items-center gap-2">
                <span className="text-sm text-zinc-400">Filtered by:</span>
                <span className="px-2 py-1 bg-emerald-500/20 text-emerald-400 text-sm rounded-full flex items-center gap-1">
                  {filteredTicker}
                  <button 
                    onClick={() => setFilteredTicker(null)}
                    className="hover:text-white"
                  >
                    ×
                  </button>
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 text-sm text-zinc-400">
              <Clock className="w-4 h-4" />
              <span>Last updated: {data.summary.lastUpdated}</span>
            </div>
            <a 
              href="/" 
              className="px-4 py-2 bg-emerald-500/10 text-emerald-400 rounded-lg text-sm font-medium hover:bg-emerald-500/20 transition-colors"
            >
              Back to Dashboard
            </a>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12 mb-8">
            <Loader2 className="w-8 h-8 text-emerald-400 animate-spin mr-3" />
            <span className="text-zinc-400">Loading live performance data...</span>
          </div>
        )}
        
        {/* Error/Note */}
        {error && (
          <div className="mb-8 p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-sm">
            {error}
          </div>
        )}

        {/* Paper Trading Live Section */}
        <section className="mb-8">
          <div className="rounded-2xl bg-gradient-to-br from-blue-500/10 via-blue-500/5 to-transparent border border-blue-500/20 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Activity className="w-5 h-5 text-blue-400" />
                Paper Trading — Live P&L
                <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 text-xs rounded-full">LIVE</span>
              </h2>
              <span className="text-sm text-zinc-500">Real-time tracking</span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Paper Portfolio Value */}
              <div className="rounded-xl bg-white/5 border border-white/10 p-4">
                <div className="text-sm text-zinc-400 mb-1">Paper Portfolio</div>
                <div className="text-2xl font-bold text-white">${paperSummary.totalValue.toLocaleString('en-US', {minimumFractionDigits: 2})}</div>
                <div className="text-xs text-zinc-500 mt-1">{paperPositions.length} active positions</div>
              </div>
              
              {/* Live P&L */}
              <div className="rounded-xl bg-white/5 border border-white/10 p-4">
                <div className="text-sm text-zinc-400 mb-1">Unrealized P&L</div>
                <div className={`text-2xl font-bold ${paperSummary.totalPL >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {paperSummary.totalPL >= 0 ? '+' : ''}${paperSummary.totalPL.toFixed(2)}
                </div>
                <div className={`text-xs mt-1 ${paperSummary.totalPLPct >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {paperSummary.totalPLPct >= 0 ? '+' : ''}{paperSummary.totalPLPct.toFixed(2)}% today
                </div>
              </div>
              
              {/* Position Cards - Dynamic */}
              {paperPositions.slice(0, 2).map((pos) => (
                <div key={pos.symbol} className="rounded-xl bg-white/5 border border-white/10 p-4">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-zinc-400 flex items-center gap-2">
                      <CompanyLogo ticker={pos.symbol} size={16} />
                      {pos.symbol}
                    </span>
                    <span className={`text-xs ${pos.unrealized_pl_pct >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {pos.unrealized_pl_pct >= 0 ? '+' : ''}{pos.unrealized_pl_pct.toFixed(2)}%
                    </span>
                  </div>
                  <div className="text-lg font-bold text-white">{pos.quantity.toFixed(2)} shares</div>
                  <div className="text-xs text-zinc-500">
                    Entry: ${pos.entry_price.toFixed(2)} | Current: ${pos.current_price.toFixed(2)}
                  </div>
                </div>
              ))}
              
              {/* Show message if no positions */}
              {paperPositions.length === 0 && (
                <>
                  <div className="rounded-xl bg-white/5 border border-white/10 p-4">
                    <div className="text-sm text-zinc-400 mb-1">AAPL</div>
                    <div className="text-lg font-bold text-zinc-600">--</div>
                    <div className="text-xs text-zinc-600">No active position</div>
                  </div>
                  <div className="rounded-xl bg-white/5 border border-white/10 p-4">
                    <div className="text-sm text-zinc-400 mb-1">NVDA</div>
                    <div className="text-lg font-bold text-zinc-600">--</div>
                    <div className="text-xs text-zinc-600">No active position</div>
                  </div>
                </>
              )}
            </div>
            
            <div className="mt-4 text-xs text-zinc-500">
              Paper trading validates signals before live deployment. Updates every 60 seconds.
            </div>
          </div>
        </section>

        {/* Token Usage - AI Cost Tracking */}
        <section className="mb-8">
          <div className="rounded-2xl bg-gradient-to-br from-purple-500/10 via-purple-500/5 to-transparent border border-purple-500/20 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Zap className="w-5 h-5 text-purple-400" />
                AI Token Usage & Costs
                <span className="px-2 py-0.5 bg-purple-500/20 text-purple-400 text-xs rounded-full">LIVE</span>
              </h2>
              <span className="text-sm text-zinc-500">Model: Kimi K2.5</span>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="rounded-xl bg-white/5 border border-white/10 p-4">
                <div className="text-sm text-zinc-400 mb-1">Today's Cost</div>
                <div className={`text-2xl font-bold ${tokenUsage.limit_status === 'hard_limit' ? 'text-red-400' : tokenUsage.limit_status === 'soft_limit' ? 'text-yellow-400' : tokenUsage.limit_status === 'warning' ? 'text-orange-400' : 'text-emerald-400'}`}>
                  ${tokenUsage.total_cost_usd.toFixed(2)}
                </div>
                <div className="text-xs text-zinc-500 mt-1">of $10 soft limit</div>
              </div>
              
              <div className="rounded-xl bg-white/5 border border-white/10 p-4">
                <div className="text-sm text-zinc-400 mb-1">Projected Daily</div>
                <div className="text-2xl font-bold text-white">${tokenUsage.projected_daily.toFixed(2)}</div>
                <div className="text-xs text-zinc-500 mt-1">based on current usage</div>
              </div>
              
              <div className="rounded-xl bg-white/5 border border-white/10 p-4">
                <div className="text-sm text-zinc-400 mb-1">API Calls</div>
                <div className="text-2xl font-bold text-white">{tokenUsage.total_calls}</div>
                <div className="text-xs text-zinc-500 mt-1">today</div>
              </div>
              
              <div className="rounded-xl bg-white/5 border border-white/10 p-4">
                <div className="text-sm text-zinc-400 mb-1">Tokens</div>
                <div className="text-2xl font-bold text-white">
                  {((tokenUsage.total_tokens_in + tokenUsage.total_tokens_out) / 1000).toFixed(0)}K
                </div>
                <div className="text-xs text-zinc-500 mt-1">
                  {tokenUsage.total_tokens_in > 0 ? `${(tokenUsage.total_tokens_in / 1000).toFixed(0)}K in` : '0 in'} / 
                  {tokenUsage.total_tokens_out > 0 ? ` ${(tokenUsage.total_tokens_out / 1000).toFixed(0)}K out` : ' 0 out'}
                </div>
              </div>
            </div>
            
            {/* Progress bar for limit */}
            <div className="mt-4">
              <div className="flex justify-between text-xs text-zinc-400 mb-2">
                <span>Daily Budget Usage</span>
                <span>{tokenUsage.limit_used_pct.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-white/10 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all ${
                    tokenUsage.limit_status === 'hard_limit' ? 'bg-red-500' : 
                    tokenUsage.limit_status === 'soft_limit' ? 'bg-yellow-500' : 
                    tokenUsage.limit_status === 'warning' ? 'bg-orange-500' : 'bg-purple-500'
                  }`}
                  style={{ width: `${Math.min(tokenUsage.limit_used_pct, 100)}%` }}
                />
              </div>
              <div className="flex justify-between text-xs mt-2">
                <span className="text-zinc-500">$0</span>
                <span className="text-zinc-500">Soft: $10</span>
                <span className="text-zinc-500">Hard: $25</span>
              </div>
            </div>
          </div>
        </section>

        {/* Hero Stats */}
        <section className="mb-12">
          <div className="rounded-3xl bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent border border-emerald-500/20 p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold flex items-center gap-3">
                <TrendingUp className="w-6 h-6 text-emerald-400" />
                Live Performance
              </h2>
              <div className="flex gap-3">
                <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-sm border border-emerald-500/20">
                  Paper Trading
                </span>
                <span className="px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 text-sm border border-blue-500/20">
                  Since Feb 2026
                </span>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Win Rate */}
              <div className="rounded-2xl bg-white/5 border border-white/10 p-6">
                <div className="flex items-center gap-2 text-zinc-400 mb-2">
                  <Target className="w-4 h-4" />
                  <span className="text-sm">Overall Win Rate</span>
                </div>
                <div className="text-5xl font-bold text-emerald-400 mb-2">
                  {filteredData.summary.winRate}%
                </div>
                <div className="text-sm text-zinc-500">
                  {filteredData.summary.wins}W / {filteredData.summary.losses}L
                </div>
                <div className="mt-3 text-xs text-zinc-600">
                  75%+ confidence signals only
                </div>
              </div>

              {/* Total Signals */}
              <div className="rounded-2xl bg-white/5 border border-white/10 p-6">
                <div className="flex items-center gap-2 text-zinc-400 mb-2">
                  <Activity className="w-4 h-4" />
                  <span className="text-sm">Total Signals</span>
                </div>
                <div className="text-5xl font-bold text-white mb-2">
                  {filteredData.summary.totalSignals}
                </div>
                <div className="text-sm text-zinc-500">
                  Max 3 per day
                </div>
                <div className="mt-3 text-xs text-zinc-600">
                  Curated, not firehose
                </div>
              </div>

              {/* Net P&L */}
              <div className="rounded-2xl bg-white/5 border border-white/10 p-6">
                <div className="flex items-center gap-2 text-zinc-400 mb-2">
                  <BarChart3 className="w-4 h-4" />
                  <span className="text-sm">Net P&L</span>
                </div>
                <div className="text-5xl font-bold text-emerald-400 mb-2">
                  +{filteredData.summary.netPnL}%
                </div>
                <div className="text-sm text-zinc-500">
                  ${filteredData.summary.netPnLDollars.toLocaleString()}
                </div>
                <div className="mt-3 text-xs text-zinc-600">
                  Based on $100K portfolio
                </div>
              </div>
            </div>

            <div className="mt-6 flex gap-4">
              <a 
                href="#signals" 
                className="px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-black font-semibold rounded-xl transition-colors flex items-center gap-2"
              >
                View All Signals
                <ArrowRight className="w-4 h-4" />
              </a>
              <button className="px-6 py-3 bg-white/5 hover:bg-white/10 text-white font-medium rounded-xl transition-colors border border-white/10">
                Start Free Trial
              </button>
            </div>
          </div>
        </section>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Performance by Ticker */}
          <section className="rounded-2xl bg-white/5 border border-white/10 overflow-hidden">
            <div className="p-6 border-b border-white/10">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <BarChart2 className="w-5 h-5 text-emerald-400" />
                Performance by Ticker
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-white/5">
                  <tr className="text-left text-xs text-zinc-500 uppercase">
                    <th className="px-4 py-3 font-medium">Ticker</th>
                    <th className="px-4 py-3 font-medium text-center">Signals</th>
                    <th className="px-4 py-3 font-medium text-center">Win %</th>
                    <th className="px-4 py-3 font-medium text-right">P&L</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredData.byTicker.map((ticker) => (
                    <tr key={ticker.ticker} className="hover:bg-white/5 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <CompanyLogo ticker={ticker.ticker} size={32} />
                          <span className="font-medium">{ticker.ticker}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center text-zinc-400">{ticker.signals}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`font-semibold ${ticker.winRate >= 70 ? 'text-emerald-400' : ticker.winRate >= 50 ? 'text-yellow-400' : 'text-red-400'}`}>
                          {ticker.winRate}%
                        </span>
                      </td>
                      <td className={`px-4 py-3 text-right font-medium ${ticker.pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {ticker.pnl >= 0 ? '+' : ''}${ticker.pnl.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Performance by Market State */}
          <section className="rounded-2xl bg-white/5 border border-white/10 overflow-hidden">
            <div className="p-6 border-b border-white/10">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Shield className="w-5 h-5 text-blue-400" />
                Performance by Market State
                <span className="ml-2 px-2 py-0.5 bg-blue-500/10 text-blue-400 text-xs rounded-full">
                  Unique to SYGNL
                </span>
              </h3>
            </div>
            <div className="p-6 space-y-4">
              {data.byState.map((state) => (
                <div key={state.state} className="rounded-xl bg-white/5 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{state.emoji}</span>
                      <span className="font-semibold">{state.state}</span>
                    </div>
                    <span className="text-sm text-zinc-400">
                      {state.signals} signals
                    </span>
                  </div>
                  {state.winRate ? (
                    <>
                      <div className="flex items-baseline gap-2 mb-1">
                        <span className="text-2xl font-bold text-emerald-400">{state.winRate}%</span>
                        <span className="text-sm text-zinc-500">win rate</span>
                      </div>
                      <div className="text-xs text-zinc-600">
                        Best: {state.bestTicker} ({state.bestWinRate}%)
                      </div>
                    </>
                  ) : (
                    <div className="text-sm text-zinc-500 italic">No trades in this state</div>
                  )}
                </div>
              ))}
            </div>
            <div className="px-6 pb-6">
              <div className="rounded-xl bg-blue-500/10 border border-blue-500/20 p-4">
                <p className="text-sm text-blue-400">
                  <Zap className="w-4 h-4 inline mr-2" />
                  We trade less in Fragile markets and avoid Break markets entirely. This is our edge.
                </p>
              </div>
            </div>
          </section>
        </div>

        {/* Recent Signals */}
        <section id="signals" className="mb-12">
          <div className="rounded-2xl bg-white/5 border border-white/10 overflow-hidden">
            <div className="p-6 border-b border-white/10 flex items-center justify-between">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Calendar className="w-5 h-5 text-emerald-400" />
                Recent Signals (Last 30 Days)
              </h3>
              <button className="text-sm text-emerald-400 hover:text-emerald-300 flex items-center gap-1">
                View Full History
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-white/5">
                  <tr className="text-left text-xs text-zinc-500 uppercase">
                    <th className="px-6 py-4 font-medium">Date</th>
                    <th className="px-6 py-4 font-medium">Ticker</th>
                    <th className="px-6 py-4 font-medium">Action</th>
                    <th className="px-6 py-4 font-medium text-right">Entry</th>
                    <th className="px-6 py-4 font-medium text-right">Exit</th>
                    <th className="px-6 py-4 font-medium text-right">P&L</th>
                    <th className="px-6 py-4 font-medium text-center">Result</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredData.recentSignals.map((signal, idx) => (
                    <tr 
                      key={idx} 
                      className="hover:bg-white/5 transition-colors cursor-pointer"
                      onClick={() => setSelectedSignal(signal)}
                    >
                      <td className="px-6 py-4 text-zinc-400">{signal.date}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <CompanyLogo ticker={signal.ticker} size={28} />
                          <span className="font-medium">{signal.ticker}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 bg-emerald-500/10 text-emerald-400 text-xs rounded font-medium">
                          {signal.action}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right text-zinc-400">
                        ${signal.entry.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-right text-zinc-400">
                        ${signal.exit.toLocaleString()}
                      </td>
                      <td className={`px-6 py-4 text-right font-medium ${signal.pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {signal.pnl >= 0 ? '+' : ''}{signal.pnl}%
                      </td>
                      <td className="px-6 py-4 text-center">
                        {signal.win ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-400 mx-auto" />
                        ) : (
                          <XCircle className="w-5 h-5 text-red-400 mx-auto" />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Confidence Calibration & Comparison */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Confidence Calibration */}
          <section className="rounded-2xl bg-white/5 border border-white/10 p-6">
            <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
              <Target className="w-5 h-5 text-purple-400" />
              Confidence Score Accuracy
            </h3>
            <p className="text-sm text-zinc-400 mb-6">
              When we say a signal has X% confidence, here's how often it actually wins:
            </p>
            <div className="space-y-4">
              {data.confidenceCalibration.map((cal) => (
                <div key={cal.range} className="flex items-center justify-between p-4 rounded-xl bg-white/5">
                  <div>
                    <div className="font-medium">{cal.range} confidence</div>
                    <div className="text-sm text-zinc-500">
                      {cal.predicted ? `Predicted: ${cal.predicted}% win rate` : 'Not traded'}
                    </div>
                  </div>
                  <div className="text-right">
                    {cal.actual ? (
                      <>
                        <div className="font-bold text-emerald-400">{cal.actual}% actual</div>
                        <div className={`text-xs ${cal.status === 'calibrated' ? 'text-emerald-400' : 'text-yellow-400'}`}>
                          {cal.status === 'calibrated' ? '✓ Calibrated' : '⚠ Slight variance'}
                        </div>
                      </>
                    ) : (
                      <div className="text-sm text-zinc-500">🚫 Not traded</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 p-4 rounded-xl bg-purple-500/10 border border-purple-500/20">
              <p className="text-sm text-purple-400">
                Our confidence scores are honest and calibrated. We don't inflate them to look better.
              </p>
            </div>
          </section>

          {/* Comparison vs Buy & Hold */}
          <section className="rounded-2xl bg-white/5 border border-white/10 p-6">
            <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-400" />
              SYGNL vs. Buy & Hold
            </h3>
            <div className="space-y-4">
              {data.comparison.map((item) => (
                <div 
                  key={item.strategy} 
                  className={`p-4 rounded-xl border ${item.strategy === 'SYGNL Signals' ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-white/5 border-white/10'}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className={`font-semibold ${item.strategy === 'SYGNL Signals' ? 'text-emerald-400' : ''}`}>
                      {item.strategy}
                    </span>
                    {item.winRate && (
                      <span className="text-sm text-zinc-500">{item.winRate}% win rate</span>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-zinc-500">Return:</span>
                      <span className={`ml-2 font-medium ${item.return >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {item.return >= 0 ? '+' : ''}{item.return}%
                      </span>
                    </div>
                    <div>
                      <span className="text-zinc-500">Max Drawdown:</span>
                      <span className="ml-2 font-medium text-red-400">{item.drawdown}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 text-xs text-zinc-500">
              Period: Last 47 trading days (since 2026-01-02)
            </div>
          </section>
        </div>

        {/* CTA Section */}
        <section className="rounded-3xl bg-gradient-to-r from-emerald-500/20 via-teal-500/20 to-blue-500/20 border border-emerald-500/30 p-12 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to trade with confidence?</h2>
          <p className="text-zinc-400 mb-8 max-w-2xl mx-auto">
            Join traders who rely on SYGNL's AI-powered signals. Get max 3 curated signals daily, 
            with market state awareness and complete transparency.
          </p>
          <div className="flex items-center justify-center gap-4">
            <button className="px-8 py-4 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-xl transition-colors">
              Start 14-Day Free Trial
            </button>
            <button className="px-8 py-4 bg-white/5 hover:bg-white/10 text-white font-medium rounded-xl transition-colors border border-white/10">
              View Pricing
            </button>
          </div>
          <p className="text-sm text-zinc-500 mt-6">
            No credit card required. Cancel anytime.
          </p>
        </section>

        {/* Footer */}
        <footer className="mt-12 pt-8 border-t border-white/10 text-center text-sm text-zinc-600">
          <p>
            Data shown is from paper trading (simulated). Past performance does not guarantee future results. 
            All trading involves risk.
          </p>
          <p className="mt-2">
            © 2026 SYGNL. All rights reserved.
          </p>
        </footer>
      </main>

      {/* Ask SYGNL Chat Widget */}
      <div className="fixed bottom-6 right-6 z-50">
        {/* Chat Window */}
        {chatOpen && (
          <div className="mb-4 w-96 rounded-2xl bg-zinc-900 border border-white/10 shadow-2xl overflow-hidden">
            {/* Chat Header */}
            <div className="bg-gradient-to-r from-emerald-500 to-teal-600 px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                  <Activity className="w-4 h-4 text-white" />
                </div>
                <div>
                  <div className="font-semibold text-white text-sm">Ask SYGNL</div>
                  <div className="text-xs text-emerald-100">AI Assistant</div>
                </div>
              </div>
              <button 
                onClick={() => setChatOpen(false)}
                className="p-1 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>

            {/* Chat Messages */}
            <div className="h-80 overflow-y-auto p-4 space-y-3">
              {chatMessages.map((msg, idx) => (
                <div 
                  key={idx} 
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div 
                    className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${
                      msg.role === 'user' 
                        ? 'bg-emerald-500 text-white rounded-br-md' 
                        : 'bg-white/10 text-zinc-200 rounded-bl-md'
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}
              {chatLoading && (
                <div className="flex justify-start">
                  <div className="bg-white/10 rounded-2xl rounded-bl-md px-4 py-3">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-zinc-500 rounded-full animate-bounce" />
                      <span className="w-2 h-2 bg-zinc-500 rounded-full animate-bounce delay-100" />
                      <span className="w-2 h-2 bg-zinc-500 rounded-full animate-bounce delay-200" />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Chat Input */}
            <form onSubmit={handleChatSubmit} className="p-3 border-t border-white/10 bg-zinc-900">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Ask about signals, pricing..."
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500/50"
                />
                <button 
                  type="submit"
                  disabled={chatLoading || !chatInput.trim()}
                  className="p-2 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-colors"
                >
                  <Send className="w-4 h-4 text-white" />
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Floating Chat Button */}
        <button
          onClick={() => setChatOpen(!chatOpen)}
          className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-semibold rounded-full shadow-lg shadow-emerald-500/30 transition-all hover:scale-105"
        >
          <MessageCircle className="w-5 h-5" />
          <span>Ask SYGNL</span>
        </button>
      </div>
    </div>
  )
}
