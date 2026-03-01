'use client'

import { 
  TrendingUp, 
  Target, 
  Activity, 
  DollarSign, 
  Zap, 
  Brain,
  BarChart3,
  Shield
} from 'lucide-react'

const stats = [
  {
    id: 1,
    title: 'SYGNL Accuracy',
    value: '68.2%',
    change: '+2.4%',
    trend: 'up',
    icon: Target,
    color: 'accent-primary',
    description: '30-day rolling',
  },
  {
    id: 2,
    title: 'Portfolio Value',
    value: '$184,598',
    change: '+$4,218',
    trend: 'up',
    icon: DollarSign,
    color: 'accent-secondary',
    description: 'Today\'s change',
  },
  {
    id: 3,
    title: 'Market State',
    value: 'Fragile',
    change: '68% confidence',
    trend: 'neutral',
    icon: Activity,
    color: 'warning',
    description: 'Risk assessment',
  },
  {
    id: 4,
    title: 'Active Signals',
    value: '24',
    change: '+3 new',
    trend: 'up',
    icon: Zap,
    color: 'accent-tertiary',
    description: 'Real-time monitoring',
  },
  {
    id: 5,
    title: 'Paper P&L',
    value: '+12.4%',
    change: '+$2,845',
    trend: 'up',
    icon: TrendingUp,
    color: 'success',
    description: '30-day performance',
  },
  {
    id: 6,
    title: 'AI Cost Today',
    value: '$4.82',
    change: '48% of $10',
    trend: 'neutral',
    icon: Brain,
    color: 'info',
    description: 'Model usage',
  },
  {
    id: 7,
    title: 'API Health',
    value: '100%',
    change: 'All systems',
    trend: 'up',
    icon: Shield,
    color: 'success',
    description: 'Uptime 30d',
  },
  {
    id: 8,
    title: 'Gateway Sessions',
    value: '3',
    change: 'Active',
    trend: 'neutral',
    icon: BarChart3,
    color: 'accent-tertiary',
    description: 'OpenClaw connected',
  },
]

export default function StatsBar() {
  const getColorClasses = (color) => {
    switch (color) {
      case 'accent-primary':
        return 'bg-accent-primary/10 border-accent-primary/20 text-accent-primary'
      case 'accent-secondary':
        return 'bg-accent-secondary/10 border-accent-secondary/20 text-accent-secondary'
      case 'accent-tertiary':
        return 'bg-accent-tertiary/10 border-accent-tertiary/20 text-accent-tertiary'
      case 'success':
        return 'bg-success/10 border-success/20 text-success'
      case 'warning':
        return 'bg-warning/10 border-warning/20 text-warning'
      case 'error':
        return 'bg-error/10 border-error/20 text-error'
      case 'info':
        return 'bg-info/10 border-info/20 text-info'
      default:
        return 'bg-white/5 border-white/10 text-zinc-400'
    }
  }

  const getTrendIcon = (trend) => {
    switch (trend) {
      case 'up':
        return '↗'
      case 'down':
        return '↘'
      default:
        return '→'
    }
  }

  return (
    <div className="px-6 py-4">
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
        {stats.map((stat) => {
          const Icon = stat.icon
          const colorClasses = getColorClasses(stat.color)
          const trendIcon = getTrendIcon(stat.trend)
          
          return (
            <div
              key={stat.id}
              className="group relative overflow-hidden rounded-xl border border-white/5 bg-surface/50 backdrop-blur-sm p-4 hover:border-white/10 transition-all duration-300 hover:scale-[1.02] cursor-pointer"
            >
              {/* Background glow effect */}
              <div className={`absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity duration-300 ${stat.color === 'accent-primary' ? 'bg-accent-primary' : stat.color === 'accent-secondary' ? 'bg-accent-secondary' : 'bg-white'}`} />
              
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-2">
                  <div className={`p-2 rounded-lg ${colorClasses}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className={`text-xs font-medium ${stat.trend === 'up' ? 'text-success' : stat.trend === 'down' ? 'text-error' : 'text-zinc-500'}`}>
                    {trendIcon} {stat.change}
                  </span>
                </div>
                
                <div className="mb-1">
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <div className="text-xs text-zinc-500 truncate">{stat.title}</div>
                </div>
                
                <div className="text-xs text-zinc-600 mt-2 truncate">{stat.description}</div>
              </div>
            </div>
          )
        })}
      </div>
      
      {/* Last Updated */}
      <div className="mt-4 flex items-center justify-end">
        <div className="flex items-center gap-2 text-xs text-zinc-500">
          <span className="w-2 h-2 rounded-full bg-accent-secondary animate-pulse" />
          <span>Last updated: {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
          <span className="text-zinc-700">•</span>
          <span>Auto-refresh: 30s</span>
        </div>
      </div>
    </div>
  )
}