// Telegram Bot Webhook - Pages Router
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8313463050:AAHNC9folpMvjYDoRhbsrBwQDKioADGnamA'

export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      const { message } = req.body
      
      if (message?.text) {
        const chatId = message.chat.id
        const text = message.text
        
        if (text === '/start') {
          await sendMessage(chatId, 
            '🚀 Welcome to SYGNL.iq!\n\n' +
            'I\'m your AI trading assistant.\n\n' +
            '📊 /portfolio - View portfolio\n' +
            '💡 /signals - Trading signals\n' +
            '📈 /performance - Accuracy stats\n' +
            '📋 /trades - Recent trades\n' +
            '❓ /help - All commands'
          )
        }
        else if (text === '/help') {
          await sendMessage(chatId,
            '📋 Commands:\n\n' +
            '/start - Start\n' +
            '/portfolio - Portfolio\n' +
            '/signals - Signals\n' +
            '/performance - Stats\n' +
            '/trades - Trade log\n' +
            '/help - Help'
          )
        }
        else if (text === '/portfolio') {
          await sendMessage(chatId,
            '📊 Portfolio:\n\n' +
            'Value: $172,558\n' +
            '24h: -$11,169 (-6.47%)\n\n' +
            'BTC: $75,445 (43.8%)\n' +
            'PLTR: $24,181 (14.0%)\n' +
            'VOO: $22,431 (13.0%)\n\n' +
            'Paper P&L: +1.06% 🟢'
          )
        }
        else if (text === '/signals') {
          await sendMessage(chatId,
            '💡 Signals:\n\n' +
            '🟢 STRONG:\n' +
            '• NVDA BUY 84%\n' +
            '• AAPL BUY 84%\n\n' +
            '🔵 MEDIUM:\n' +
            '• MSFT BUY 71%\n' +
            '• AMD BUY 68%'
          )
        }
        else if (text === '/performance') {
          await sendMessage(chatId,
            '📈 Performance:\n\n' +
            'Accuracy: 84% 🎯\n' +
            'Target: 65%\n\n' +
            '80-100%: 100% (12/12)\n' +
            '65-79%: 87% (13/15)\n' +
            '50-64%: 75% (6/8)\n\n' +
            'Streak: 🔥 6 wins'
          )
        }
        else if (text === '/trades') {
          await sendMessage(chatId,
            '📋 Trades:\n\n' +
            '🟢 AAPL BUY (Auto)\n' +
            '$3,180 @ $278.45\n\n' +
            '🟢 NVDA BUY (Auto)\n' +
            '$2,820 @ $173.25\n\n' +
            '🟡 AMD BUY (Exp)\n' +
            '$6,000 @ $134.85'
          )
        }
        else {
          await sendMessage(chatId, 'Try /help for commands')
        }
      }
      
      res.status(200).json({ ok: true })
    } catch (error) {
      console.error('Bot error:', error)
      res.status(200).json({ ok: false, error: error.message })
    }
  } else if (req.method === 'GET') {
    res.status(200).json({ 
      ok: true, 
      message: 'SYGNL.iq Bot is running',
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
        text: text
      })
    })
  } catch (error) {
    console.error('Send failed:', error)
  }
}