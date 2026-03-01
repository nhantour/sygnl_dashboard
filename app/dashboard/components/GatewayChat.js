'use client'

import { useState, useRef, useEffect } from 'react'
import { 
  Send, 
  Bot, 
  User, 
  Zap, 
  Clock, 
  Copy,
  Check,
  Terminal,
  Cpu
} from 'lucide-react'

const initialMessages = [
  {
    id: 1,
    role: 'assistant',
    content: 'Hello! I\'m your OpenClaw gateway assistant. I can help you execute trades, analyze signals, monitor system health, and automate trading workflows. What would you like to do?',
    timestamp: '10:30 AM',
    type: 'welcome'
  },
  {
    id: 2,
    role: 'user',
    content: 'Show me strong buy signals from the last hour',
    timestamp: '10:32 AM',
    type: 'query'
  },
  {
    id: 3,
    role: 'assistant',
    content: 'Found 3 strong buy signals in the last hour:\n\n1. **NVDA** - Confidence: 87% - Action: BUY\n2. **AAPL** - Confidence: 82% - Action: BUY\n3. **MSFT** - Confidence: 79% - Action: BUY\n\nWould you like me to execute any of these trades?',
    timestamp: '10:32 AM',
    type: 'response'
  },
  {
    id: 4,
    role: 'user',
    content: 'Execute NVDA with $5k position',
    timestamp: '10:33 AM',
    type: 'command'
  },
  {
    id: 5,
    role: 'assistant',
    content: '✅ Executed: BUY 28 shares of NVDA @ $178.45\nTotal: $4,996.60\nOrder ID: TRD-2026-0216-001\nStatus: Filled\n\nPosition added to paper trading portfolio.',
    timestamp: '10:33 AM',
    type: 'execution'
  }
]

const quickActions = [
  { id: 1, label: 'Check signals', command: 'Show me current trading signals', icon: Zap },
  { id: 2, label: 'Portfolio', command: 'What\'s my current portfolio status?', icon: Terminal },
  { id: 3, label: 'System health', command: 'Check system health and API status', icon: Cpu },
  { id: 4, label: 'Execute trade', command: 'Buy $2k of AAPL', icon: Send },
]

export default function GatewayChat() {
  const [messages, setMessages] = useState(initialMessages)
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [copiedId, setCopiedId] = useState(null)
  const messagesEndRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSend = async () => {
    if (!input.trim() || isLoading) return

    const userMessage = {
      id: messages.length + 1,
      role: 'user',
      content: input,
      timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      type: 'query'
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    // Simulate AI response
    setTimeout(() => {
      const aiResponse = {
        id: messages.length + 2,
        role: 'assistant',
        content: `I received your message: "${input}". This is a simulated response from the OpenClaw gateway. In a real implementation, this would connect to your actual OpenClaw instance.`,
        timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        type: 'response'
      }
      setMessages(prev => [...prev, aiResponse])
      setIsLoading(false)
    }, 1000)
  }

  const handleQuickAction = (command) => {
    setInput(command)
  }

  const handleCopy = (text, id) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-surface/50 backdrop-blur-sm overflow-hidden">
      {/* Header */}
      <div className="border-b border-white/5 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl gradient-accent flex items-center justify-center">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold">OpenClaw Gateway</h3>
              <div className="flex items-center gap-2 text-xs text-zinc-500">
                <span className="w-2 h-2 rounded-full bg-accent-secondary animate-pulse" />
                <span>Connected to gateway://localhost:8080</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-zinc-500">
            <Clock className="w-3 h-3" />
            <span>Session: 24m active</span>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="border-b border-white/5 p-4">
        <div className="flex items-center gap-2 mb-2">
          <Zap className="w-4 h-4 text-accent-primary" />
          <span className="text-sm font-medium">Quick Actions</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {quickActions.map((action) => {
            const Icon = action.icon
            return (
              <button
                key={action.id}
                onClick={() => handleQuickAction(action.command)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 text-sm transition-colors"
              >
                <Icon className="w-3 h-3" />
                {action.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Chat Messages */}
      <div className="h-[400px] overflow-y-auto p-4">
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : ''}`}
            >
              {message.role === 'assistant' && (
                <div className="w-8 h-8 rounded-lg bg-accent-primary/10 border border-accent-primary/20 flex items-center justify-center flex-shrink-0">
                  <Bot className="w-4 h-4 text-accent-primary" />
                </div>
              )}
              
              <div
                className={`max-w-[80%] rounded-xl p-3 ${
                  message.role === 'user'
                    ? 'bg-accent-primary/10 border border-accent-primary/20'
                    : 'bg-white/5 border border-white/10'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {message.role === 'user' ? (
                      <User className="w-3 h-3 text-accent-primary" />
                    ) : (
                      <Bot className="w-3 h-3 text-accent-primary" />
                    )}
                    <span className="text-xs font-medium">
                      {message.role === 'user' ? 'You' : 'OpenClaw'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-zinc-500">{message.timestamp}</span>
                    <button
                      onClick={() => handleCopy(message.content, message.id)}
                      className="p-1 hover:bg-white/10 rounded"
                      title="Copy message"
                    >
                      {copiedId === message.id ? (
                        <Check className="w-3 h-3 text-success" />
                      ) : (
                        <Copy className="w-3 h-3 text-zinc-500" />
                      )}
                    </button>
                  </div>
                </div>
                
                <div className="text-sm whitespace-pre-wrap">
                  {message.content.split('**').map((part, index) => 
                    index % 2 === 1 ? (
                      <span key={index} className="font-semibold text-accent-primary">
                        {part}
                      </span>
                    ) : (
                      part
                    )
                  )}
                </div>
                
                {message.type === 'execution' && (
                  <div className="mt-2 pt-2 border-t border-white/5">
                    <div className="text-xs text-success flex items-center gap-1">
                      <Check className="w-3 h-3" />
                      Trade executed successfully
                    </div>
                  </div>
                )}
              </div>
              
              {message.role === 'user' && (
                <div className="w-8 h-8 rounded-lg bg-accent-primary/20 border border-accent-primary/30 flex items-center justify-center flex-shrink-0">
                  <User className="w-4 h-4 text-accent-primary" />
                </div>
              )}
            </div>
          ))}
          
          {isLoading && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-lg bg-accent-primary/10 border border-accent-primary/20 flex items-center justify-center">
                <Bot className="w-4 h-4 text-accent-primary" />
              </div>
              <div className="bg-white/5 border border-white/10 rounded-xl p-3">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 rounded-full bg-accent-primary animate-pulse" />
                    <div className="w-2 h-2 rounded-full bg-accent-primary animate-pulse delay-150" />
                    <div className="w-2 h-2 rounded-full bg-accent-primary animate-pulse delay-300" />
                  </div>
                  <span className="text-sm text-zinc-500">Thinking...</span>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="border-t border-white/5 p-4">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Message OpenClaw gateway... (Type / for commands)"
              className="w-full bg-black/30 border border-white/10 rounded-xl py-3 px-4 text-sm placeholder-zinc-600 focus:outline-none focus:border-accent-primary/50 focus:ring-2 focus:ring-accent-primary/20 transition-all resize-none"
              rows="2"
            />
            <div className="absolute right-2 bottom-2 text-xs text-zinc-600">
              Press Enter to send
            </div>
          </div>
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="gradient-accent text-white p-3 rounded-xl hover:shadow-lg hover:shadow-accent-primary/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
        
        <div className="mt-2 text-xs text-zinc-600">
          <span className="text-accent-primary">Tip:</span> Try commands like "execute trade", "check signals", or "system status"
        </div>
      </div>
    </div>
  )
}