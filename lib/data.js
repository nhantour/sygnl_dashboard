// Data utilities for dashboard

// Mock data - replace with real API calls
export const fetchAlpacaPortfolio = async () => {
  // In production:
  // const response = await fetch('https://paper-api.alpaca.markets/v2/account', {
  //   headers: {
  //     'APCA-API-KEY-ID': process.env.ALPACA_API_KEY,
  //     'APCA-API-SECRET-KEY': process.env.ALPACA_SECRET_KEY,
  //   },
  // })
  // return response.json()
  
  return {
    portfolioValue: 100891.00,
    cash: 100000.00,
    buyingPower: 200000.00,
    pnl: 891.00,
    pnlPercent: 0.89,
    positions: [],
  }
}

export const fetchMoltbookStats = async () => {
  // In production:
  // const response = await fetch('https://www.moltbook.com/api/v1/agents/me', {
  //   headers: { 'Authorization': `Bearer ${process.env.MOLTBOOK_API_KEY}` },
  // })
  
  return {
    followers: 0,
    posts: 1,
    subscriptions: 3,
    engagement: 0,
    apiUsers: 0,
  }
}

export const fetchDailyBriefing = async () => {
  return {
    date: new Date().toISOString().split('T')[0],
    marketState: 'Fragile',
    confidence: 68,
    signals: 2,
    portfolioValue: 100891,
    pnl: '+0.89%',
    quote: 'The stock market is a device for transferring money from the impatient to the patient. — Warren Buffett',
  }
}