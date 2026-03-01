'use client'

import { Target, TrendingUp, BarChart3, Award, TrendingDown } from 'lucide-react'
import { useState } from 'react'

const accuracyData = {
  overall: 68.2,
  target: 65,
  totalSignals: 142,
  wins: 97,
  losses: 45,
  progressToTarget: 105, // 68.2/65 * 100
  currentStreak: 8,
  bestStreak: 14,
  byConfidence: {
    '80-100%': { accuracy: 72.4, wins: 42, total: 58 },
    '60-79%': { accuracy: 67.8, wins: 38, total: 56 },
    '40-59%': { accuracy: 62.1, wins: 17, total: 28 },
  },
  byState: {
    'Bullish': { accuracy: 71.2, wins: 37, total: 52 },
    'Neutral': { accuracy: 66.8, wins: 45, total: 67 },
    'Bearish': { accuracy: 64.3, wins: 15, total: 23 },
  },
  recentPerformance: [
    { date: 'Feb 12', accuracy: 65.4, signals: 8 },
    { date: 'Feb 13', accuracy: 67.2, signals: 9 },
    { date: 'Feb 14', accuracy: 71.8, signals: 7 },
    { date: 'Feb 15', accuracy: 69.3, signals: 10 },
    { date: 'Today', accuracy: 68.2, signals: 5 },
  ]
}

export default function AccuracyDashboard() {
  const [timeframe, setTimeframe] = useState('30d')

  const getAccuracyColor = (accuracy) => {
    if (accuracy >= 70) return 'text-success'
    if (accuracy >= 65) return 'text-accent-secondary'
    if (accuracy >= 60) return 'text-warning'
    return 'text-error'
  }

  const getProgressColor = (progress) => {
    if (progress >= 100) return 'bg-success'
    if (progress >= 90) return 'bg-accent-secondary'
    if (progress >= 80) return 'bg-warning'
    return 'bg-error'
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-surface/50 backdrop-blur-sm p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent-primary/10 border border-accent-primary/20 flex items-center justify-center">
            <Target className="w-5 h-5 text-accent-primary" />
          </div>
          <div>
            <h3 className="font-semibold">Signal Accuracy Dashboard</h3>
            <div className="text-sm text-zinc-500">
              {accuracyData.totalSignals} signals analyzed • Last {timeframe}
            </div>
          </div>
        </div>
        <div className="flex gap-1">
          {['7d', '30d', '90d', 'All'].map((tf) => (
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
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="rounded-xl border border-white/5 bg-black/30 p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-zinc-500">Overall Accuracy</div>
            <Target className="w-4 h-4 text-accent-primary" />
          </div>
          <div className={`text-3xl font-bold ${getAccuracyColor(accuracyData.overall)}`}>
            {accuracyData.overall}%
          </div>
          <div className="flex items-center gap-2 mt-2">
            <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full ${getProgressColor(accuracyData.progressToTarget)}`}
                style={{ width: `${Math.min(100, accuracyData.progressToTarget)}%` }}
              />
            </div>
            <div className="text-xs text-zinc-500">
              Target: {accuracyData.target}%
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-white/5 bg-black/30 p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-zinc-500">Win/Loss Ratio</div>
            <BarChart3 className="w-4 h-4 text-accent-secondary" />
          </div>
          <div className="text-3xl font-bold text-accent-secondary">
            {accuracyData.wins}:{accuracyData.losses}
          </div>
          <div className="text-sm text-zinc-500 mt-2">
            {((accuracyData.wins / accuracyData.totalSignals) * 100).toFixed(1)}% win rate
          </div>
        </div>

        <div className="rounded-xl border border-white/5 bg-black/30 p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-zinc-500">Current Streak</div>
            <TrendingUp className="w-4 h-4 text-success" />
          </div>
          <div className="text-3xl font-bold text-success">
            {accuracyData.currentStreak}
            <span className="text-lg">🔥</span>
          </div>
          <div className="text-sm text-zinc-500 mt-2">
            {accuracyData.currentStreak > 0 ? 'Winning streak' : 'No active streak'}
          </div>
        </div>

        <div className="rounded-xl border border-white/5 bg-black/30 p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-zinc-500">Best Streak</div>
            <Award className="w-4 h-4 text-warning" />
          </div>
          <div className="text-3xl font-bold text-warning">
            {accuracyData.bestStreak}
            <span className="text-lg">🏆</span>
          </div>
          <div className="text-sm text-zinc-500 mt-2">
            All-time record
          </div>
        </div>
      </div>

      {/* Detailed Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* By Confidence Level */}
        <div className="rounded-xl border border-white/5 bg-black/30 p-4">
          <h4 className="font-medium mb-4 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-accent-tertiary" />
            Accuracy by Confidence Level
          </h4>
          <div className="space-y-3">
            {Object.entries(accuracyData.byConfidence).map(([range, data]) => (
              <div key={range} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-zinc-400">{range}</span>
                  <div className="flex items-center gap-3">
                    <span className={`font-medium ${getAccuracyColor(data.accuracy)}`}>
                      {data.accuracy}%
                    </span>
                    <span className="text-zinc-600 text-xs">
                      {data.wins}/{data.total}
                    </span>
                  </div>
                </div>
                <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full ${getProgressColor(data.accuracy)}`}
                    style={{ width: `${data.accuracy}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* By Market State */}
        <div className="rounded-xl border border-white/5 bg-black/30 p-4">
          <h4 className="font-medium mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-accent-secondary" />
            Accuracy by Market State
          </h4>
          <div className="space-y-3">
            {Object.entries(accuracyData.byState).map(([state, data]) => (
              <div key={state} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-zinc-400">{state}</span>
                  <div className="flex items-center gap-3">
                    <span className={`font-medium ${getAccuracyColor(data.accuracy)}`}>
                      {data.accuracy}%
                    </span>
                    <span className="text-zinc-600 text-xs">
                      {data.wins}/{data.total}
                    </span>
                  </div>
                </div>
                <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full ${getProgressColor(data.accuracy)}`}
                    style={{ width: `${data.accuracy}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Performance Chart */}
      <div className="mt-6 rounded-xl border border-white/5 bg-black/30 p-4">
        <h4 className="font-medium mb-4">Recent Performance Trend</h4>
        <div className="h-32 flex items-end gap-2 px-4">
          {accuracyData.recentPerformance.map((day, index) => {
            const height = (day.accuracy / 80) * 100 // Scale to 80% max for visual clarity
            const isToday = day.date === 'Today'
            return (
              <div key={index} className="flex-1 flex flex-col items-center gap-1">
                <div className="text-xs text-zinc-500 mb-1">{day.accuracy}%</div>
                <div
                  className={`w-full rounded-t transition-all duration-500 ${
                    day.accuracy >= 70 ? 'bg-success' :
                    day.accuracy >= 65 ? 'bg-accent-secondary' :
                    'bg-warning'
                  }`}
                  style={{ height: `${height}%`, minHeight: '20px' }}
                />
                <div className="text-xs text-zinc-500 font-medium">
                  {day.date}
                </div>
                <div className="text-xs text-zinc-600">
                  {day.signals} sig
                </div>
              </div>
            )
          })}
        </div>
        <div className="mt-4 flex items-center justify-between text-sm text-zinc-500">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-success" />
              <span>≥70% (Excellent)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-accent-secondary" />
              <span>65-70% (Good)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-warning" />
              <span>&lt;65% (Needs improvement)</span>
            </div>
          </div>
          <div className="text-xs">
            Target: <span className="text-accent-primary">{accuracyData.target}%</span>
          </div>
        </div>
      </div>

      {/* Insights */}
      <div className="mt-6 p-4 rounded-xl gradient-accent/10 border border-accent-primary/20">
        <div className="flex items-start gap-3">
          <Target className="w-5 h-5 text-accent-primary mt-0.5" />
          <div>
            <h4 className="font-medium text-accent-primary mb-1">Accuracy Insights</h4>
            <p className="text-sm text-zinc-300">
              {accuracyData.overall >= accuracyData.target ? (
                <>
                  System is performing above target ({accuracyData.overall}% vs {accuracyData.target}% target). 
                  High-confidence signals ({accuracyData.byConfidence['80-100%'].accuracy}% accuracy) are particularly reliable. 
                  Consider increasing position sizes for signals with ≥80% confidence.
                </>
              ) : (
                <>
                  System is below target ({accuracyData.overall}% vs {accuracyData.target}% target). 
                  Focus on improving signal quality in {Object.entries(accuracyData.byState)
                    .reduce((lowest, [state, data]) => data.accuracy < lowest.accuracy ? { state, ...data } : lowest)
                    .state} market conditions.
                </>
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}