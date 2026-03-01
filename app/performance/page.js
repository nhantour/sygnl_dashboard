'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function PerformancePage() {
  const router = useRouter()

  useEffect(() => {
    // No authentication required - redirect to dashboard
    router.push('/dashboard')
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 rounded-xl gradient-accent flex items-center justify-center mx-auto mb-4">
          <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        </div>
        <h2 className="text-xl font-semibold mb-2">Loading Performance Dashboard</h2>
        <p className="text-zinc-500">Redirecting to appropriate view...</p>
      </div>
    </div>
  )
}