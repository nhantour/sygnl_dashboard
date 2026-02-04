'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Lock, TrendingUp } from 'lucide-react'

export default function Login() {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    // Simple password check (in production, use proper auth)
    if (password === 'sygnl2026') {
      localStorage.setItem('sygnl_auth', 'true')
      router.push('/dashboard')
    } else {
      setError('Invalid password')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-md p-8">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <TrendingUp className="w-8 h-8 text-accent-primary" />
            <span className="text-2xl font-bold tracking-tight">SYGNL</span>
          </div>
          <p className="text-zinc-400">Market Intelligence Dashboard</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-2">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-surface border border-border rounded-lg py-3 pl-10 pr-4 text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-accent-primary transition-colors"
                placeholder="Enter password"
              />
            </div>
          </div>

          {error && (
            <div className="text-accent-secondary text-sm">{error}</div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-accent-primary hover:bg-teal-400 text-black font-semibold py-3 rounded-lg transition-colors disabled:opacity-50"
          >
            {loading ? 'Accessing...' : 'Access Dashboard'}
          </button>
        </form>

        <p className="text-center text-zinc-600 text-sm mt-8">
          Restricted access. Authorized personnel only.
        </p>
      </div>
    </div>
  )
}