'use client'

import { useState } from 'react'
import { 
  Bell, 
  RefreshCw, 
  LogOut, 
  Settings, 
  User, 
  ChevronDown,
  Zap,
  Brain
} from 'lucide-react'

export default function Header() {
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [notifications, setNotifications] = useState([
    { id: 1, type: 'signal', title: 'Strong Buy Signal', message: 'NVDA confidence 87%', time: '2 min ago', unread: true },
    { id: 2, type: 'system', title: 'System Update', message: 'RLM engine updated to v2.1', time: '1 hour ago', unread: true },
    { id: 3, type: 'alert', title: 'Market Alert', message: 'Volatility spike detected', time: '3 hours ago', unread: false },
  ])
  const [showNotifications, setShowNotifications] = useState(false)

  const unreadCount = notifications.filter(n => n.unread).length

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, unread: false })))
  }

  const clearNotification = (id) => {
    setNotifications(notifications.filter(n => n.id !== id))
  }

  return (
    <header className="sticky top-0 z-50 border-b border-white/5 bg-black/20 backdrop-blur-xl">
      <div className="max-w-[1800px] mx-auto px-6 h-16 flex items-center justify-between">
        {/* Left: Logo and Navigation */}
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-xl gradient-accent flex items-center justify-center">
                <Brain className="w-5 h-5 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-accent-secondary border border-background flex items-center justify-center">
                <Zap className="w-2 h-2 text-background" />
              </div>
            </div>
            <div>
              <h1 className="text-lg font-bold bg-gradient-to-r from-accent-primary to-accent-secondary text-gradient">
                SYGNL
              </h1>
              <p className="text-xs text-zinc-500">Trading Intelligence</p>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-6">
            <a href="#dashboard" className="text-sm text-zinc-300 hover:text-white transition-colors">
              Dashboard
            </a>
            <a href="#signals" className="text-sm text-zinc-300 hover:text-white transition-colors">
              Signals
            </a>
            <a href="#performance" className="text-sm text-zinc-300 hover:text-white transition-colors">
              Performance
            </a>
            <a href="#automation" className="text-sm text-zinc-300 hover:text-white transition-colors">
              Automation
            </a>
            <a href="#api" className="text-sm text-zinc-300 hover:text-white transition-colors">
              API
            </a>
          </nav>
        </div>

        {/* Right: Controls */}
        <div className="flex items-center gap-3">
          {/* Live Status */}
          <div className="hidden md:flex items-center gap-2 px-3 py-2 rounded-xl bg-accent-secondary/10 border border-accent-secondary/20">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-secondary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-accent-secondary"></span>
            </span>
            <span className="text-xs font-medium text-accent-secondary">LIVE</span>
            <span className="text-xs text-accent-secondary/60 ml-1">
              {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>

          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors relative"
            >
              <Bell className="w-4 h-4 text-zinc-400" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-accent-primary text-white text-xs font-bold px-1.5 py-0.5 rounded-full animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 top-full mt-2 w-80 bg-surface border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50">
                <div className="p-3 border-b border-white/5 flex items-center justify-between">
                  <span className="text-sm font-medium text-zinc-300">Notifications</span>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="text-xs text-accent-primary hover:text-accent-primary/80"
                    >
                      Mark all read
                    </button>
                  )}
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-4 text-center text-sm text-zinc-500">No notifications</div>
                  ) : (
                    notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={`p-3 border-b border-white/5 hover:bg-white/5 transition-colors ${
                          notification.unread ? 'bg-white/2' : ''
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              {notification.unread && (
                                <span className="w-2 h-2 rounded-full bg-accent-primary" />
                              )}
                              <span className="text-sm font-medium">{notification.title}</span>
                            </div>
                            <p className="text-xs text-zinc-500 mt-1">{notification.message}</p>
                            <span className="text-xs text-zinc-600 mt-1">{notification.time}</span>
                          </div>
                          <button
                            onClick={() => clearNotification(notification.id)}
                            className="p-1 hover:bg-white/10 rounded"
                          >
                            <span className="text-xs text-zinc-500">×</span>
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Refresh */}
          <button
            onClick={() => window.location.reload()}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 text-sm transition-colors"
            title="Refresh data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          {/* User Menu */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
            >
              <div className="w-8 h-8 rounded-full gradient-accent flex items-center justify-center">
                <User className="w-4 h-4 text-white" />
              </div>
              <div className="hidden md:block text-left">
                <div className="text-sm font-medium">Admin</div>
                <div className="text-xs text-zinc-500">Full Access</div>
              </div>
              <ChevronDown className={`w-4 h-4 text-zinc-500 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
            </button>

            {showUserMenu && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-surface border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50">
                <div className="p-3 border-b border-white/5">
                  <div className="text-sm font-medium">Admin User</div>
                  <div className="text-xs text-zinc-500">admin@sygnl.ai</div>
                </div>
                <div className="p-1">
                  <a
                    href="#settings"
                    className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/5 text-sm text-zinc-300 transition-colors"
                  >
                    <Settings className="w-4 h-4" />
                    Settings
                  </a>
                  <a
                    href="/"
                    className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/5 text-sm text-zinc-300 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}