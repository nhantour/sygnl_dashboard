// Consolidated API proxy for paper trading data
// Uses native http to avoid Next.js fetch issues with localhost

import http from 'http'

const PAPER_API = 'localhost'
const PAPER_PORT = 3002
const GLOBAL_API = 'localhost'
const GLOBAL_PORT = 3001

function fetchFromBackend(hostname, port, path, retries = 2) {
  return new Promise((resolve) => {
    const options = {
      hostname,
      port,
      path,
      method: 'GET',
      timeout: 10000, // Increased timeout
    }

    const req = http.request(options, (res) => {
      let data = ''
      res.on('data', (chunk) => data += chunk)
      res.on('end', () => {
        try {
          resolve(JSON.parse(data))
        } catch {
          resolve(null)
        }
      })
    })

    req.on('error', (e) => {
      console.error('Proxy fetch error:', path, e.message)
      if (retries > 0) {
        console.log('Retrying:', path)
        setTimeout(() => {
          fetchFromBackend(hostname, port, path, retries - 1).then(resolve)
        }, 100)
      } else {
        resolve(null)
      }
    })
    req.on('timeout', () => {
      console.error('Proxy fetch timeout:', path)
      req.destroy()
      if (retries > 0) {
        console.log('Retrying after timeout:', path)
        setTimeout(() => {
          fetchFromBackend(hostname, port, path, retries - 1).then(resolve)
        }, 100)
      } else {
        resolve(null)
      }
    })

    req.end()
  })
}

export async function GET() {
  const endpoints = [
    { key: 'accuracy', hostname: PAPER_API, port: PAPER_PORT, path: '/api/accuracy' },
    { key: 'leaderboard', hostname: PAPER_API, port: PAPER_PORT, path: '/api/leaderboard' },
    { key: 'positions', hostname: PAPER_API, port: PAPER_PORT, path: '/api/positions' },
    { key: 'trades', hostname: PAPER_API, port: PAPER_PORT, path: '/api/trades?days=7' },
    { key: 'dailyPnl', hostname: PAPER_API, port: PAPER_PORT, path: '/api/daily-pnl?days=90' },
    { key: 'status', hostname: PAPER_API, port: PAPER_PORT, path: '/api/status' },
    { key: 'globalMarkets', hostname: GLOBAL_API, port: GLOBAL_PORT, path: '/api/global-markets' },
    { key: 'intelligence', hostname: PAPER_API, port: PAPER_PORT, path: '/api/intelligence' },
    { key: 'rTotal', hostname: GLOBAL_API, port: GLOBAL_PORT, path: '/api/r-total' },
    { key: 'optionsShorts', hostname: PAPER_API, port: PAPER_PORT, path: '/api/options-shorts' },
    { key: 'sygnlScore', hostname: PAPER_API, port: PAPER_PORT, path: '/api/sygnl-score' },
    { key: 'dayTrading', hostname: GLOBAL_API, port: GLOBAL_PORT, path: '/api/day-trading' },
    { key: 'risk', hostname: PAPER_API, port: PAPER_PORT, path: '/api/risk' },
    { key: 'categoryAccuracy', hostname: GLOBAL_API, port: GLOBAL_PORT, path: '/api/category-accuracy' },
    { key: 'deployGate', hostname: GLOBAL_API, port: GLOBAL_PORT, path: '/api/deploy-gate' },
  ]

  const results = await Promise.all(
    endpoints.map(async (ep) => ({
      key: ep.key,
      data: await fetchFromBackend(ep.hostname, ep.port, ep.path)
    }))
  )

  const data = Object.fromEntries(results.map(r => [r.key, r.data]))
  
  return Response.json({
    ...data,
    timestamp: new Date().toISOString(),
    online: results.some(r => r.data !== null)
  })
}
