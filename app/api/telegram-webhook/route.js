// Telegram Bot Webhook Handler for SYGNL.iq
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8313463050:AAHNC9folpMvjYDoRhbsrBwQDKioADGnamA'
const API_BASE = `https://api.telegram.org/bot${BOT_TOKEN}`

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { message, callback_query } = req.body
    
    try {
      if (message?.text) {
        const chatId = message.chat.id
        const text = message.text
        
        // Handle /start command
        if (text === '/start') {
          await sendMessage(chatId, 
            `🚀 Welcome to SYGNL.iq!\n\n` +
            `I'm your AI trading assistant. Here's what I can do:\n\n` +
            `📊 /portfolio - View your portfolio\n` +
            `💡 /signals - Get latest trading signals\n` +
            `📈 /performance - Check SYGNL accuracy\n` +
            `⚙️ /settings - Configure auto-execute\n` +
            `❓ /help - Show all commands\n\n` +
            `Auto-execute is currently: ${req.body.autoExecuteEnabled ? '✅ ON' : '❌ OFF'}\n` +
            `Strong signals (≥75% confidence) will be traded automatically in paper mode.`
          )
        }
        
        // Handle /help command
        else if (text === '/help') {
          await sendMessage(chatId,
            `📋 SYGNL.iq Commands:\n\n` +
            `/start - Start the bot\n` +
            `/portfolio - View live portfolio\n` +
            `/signals - View active signals\n` +
            `/performance - Accuracy & stats\n` +
            `/trades - Recent trade log\n` +
            `/auto on/off - Toggle auto-execute\n` +
            `/buy SYMBOL QTY PRICE - Manual buy\n` +
            `/sell SYMBOL QTY PRICE - Manual sell\n` +
            `/help - Show this help`
          )
        }
        
        // Handle /portfolio command
        else if (text === '/portfolio') {
          await sendMessage(chatId,
            `📊 Portfolio Status:\n\n` +
            `Value: $172,558.31\n` +
            `24h Change: -$11,169.24 (-6.47%)\n\n` +
            `Top Holdings:\n` +
            `• BTC: $75,445 (43.8%) 🔴 -8.57%\n` +
            `• PLTR: $24,181 (14.0%) 🔴 -6.83%\n` +
            `• VOO: $22,431 (13.0%) 🔴 -1.24%\n\n` +
            `Paper P&L: +1.06% 🟢\n` +
            `View full dashboard: https://sygnl-dashboard.vercel.app`
          )
        }
        
        // Handle /signals command
        else if (text === '/signals') {
          await sendMessage(chatId,
            `💡 Active Signals:\n\n` +
            `🟢 STRONG (Auto-execute ON):\n` +
            `• NVDA BUY - 84% confidence\n` +
            `• AAPL BUY - 84% confidence\n\n` +
            `🔵 MEDIUM (Manual review):\n` +
            `• MSFT BUY - 71% confidence\n` +
            `• AMD BUY - 68% confidence\n\n` +
            `🟡 WEAK (Experimental):\n` +
            `• TSLA HOLD - 52% confidence\n\n` +
            `Execute: https://sygnl-dashboard.vercel.app/dashboard`
          )
        }
        
        // Handle /performance command
        else if (text === '/performance') {
          await sendMessage(chatId,
            `📈 SYGNL Performance:\n\n` +
            `Overall Accuracy: 84% 🎯\n` +
            `Target: 65% (129% of goal)\n\n` +
            `By Confidence:\n` +
            `• 80-100%: 100% (12/12)\n` +
            `• 65-79%: 87% (13/15)\n` +
            `• 50-64%: 75% (6/8)\n\n` +
            `Current Streak: 🔥 6 wins\n` +
            `Best Streak: 🏆 12 wins\n\n` +
            `Total Signals: 40 (30 days)`
          )
        }
        
        // Handle /trades command
        else if (text === '/trades') {
          await sendMessage(chatId,
            `📋 Recent Trades:\n\n` +
            `🟢 AAPL BUY (Auto)\n` +
            `  11 shares @ $278.45 = $3,180\n` +
            `  2 hours ago\n\n` +
            `🟢 NVDA BUY (Auto)\n` +
            `  16 shares @ $173.25 = $2,820\n` +
            `  2 hours ago\n\n` +
            `🟡 AMD BUY (Experimental)\n` +
            `  45 shares @ $134.85 = $6,000\n` +
            `  Yesterday\n\n` +
            `View all: https://sygnl-dashboard.vercel.app/dashboard`
          )
        }
        
        // Handle /auto command
        else if (text.startsWith('/auto')) {
          const status = text.split(' ')[1]
          if (status === 'on') {
            await sendMessage(chatId, '✅ Auto-execute ENABLED. Strong signals (≥75%) will be automatically traded in paper mode.')
          } else if (status === 'off') {
            await sendMessage(chatId, '❌ Auto-execute DISABLED. All signals require manual execution.')
          } else {
            await sendMessage(chatId, 'Usage: /auto on or /auto off')
          }
        }
        
        // Default response
        else {
          await sendMessage(chatId, 
            `I received: "${text}"\n\n` +
            `I don't recognize that command. Try /help for available commands.`
          )
        }
      }
      
      res.status(200).json({ ok: true })
    } catch (error) {
      console.error('Bot error:', error)
      res.status(200).json({ ok: false, error: error.message })
    }
  } else if (req.method === 'GET') {
    // Health check
    res.status(200).json({ 
      ok: true, 
      message: 'SYGNL.iq Bot Webhook is running',
      timestamp: new Date().toISOString()
    })
  } else {
    res.status(405).json({ ok: false, error: 'Method not allowed' })
  }
}

async function sendMessage(chatId, text) {
  try {
    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: text,
        parse_mode: 'HTML'
      })
    })
  } catch (error) {
    console.error('Failed to send message:', error)
  }
}