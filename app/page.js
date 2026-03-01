'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    // Auto-redirect to dashboard - no authentication required
    router.push('/dashboard')
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-accent-primary/10 rounded-full blur-[128px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent-secondary/10 rounded-full blur-[128px] animate-pulse delay-1000" />
      </div>

      {/* Grid pattern overlay */}
      <div className="absolute inset-0 bg-grid-pattern" />

      {/* Loading message */}
      <div className="relative z-10 text-center">
        <div className="w-16 h-16 border-4 border-accent-primary/30 border-t-accent-primary rounded-full animate-spin mx-auto mb-4"></div>
        <h1 className="text-2xl font-bold bg-gradient-to-r from-accent-primary to-accent-secondary text-gradient mb-2">
          KOFTA KORNER
        </h1>
        <p className="text-zinc-400">SYGNL Trading Dashboard</p>
        <p className="text-sm text-zinc-500 mt-4">Powered by OpenClaw.ai • v3.1.0</p>
      </div>
    </div>
  )
}