export async function GET() {
  const results = {}
  const endpoints = [
    ['leaderboard', 'http://localhost:3002/api/leaderboard'],
    ['positions', 'http://localhost:3002/api/positions'],
    ['status', 'http://localhost:3002/api/status'],
    ['sygnl-score', 'http://localhost:3002/api/sygnl-score'],
  ]
  
  for (const [name, url] of endpoints) {
    try {
      const res = await fetch(url, { cache: 'no-store' })
      const data = await res.json()
      results[name] = {
        status: res.status,
        ok: res.ok,
        sample: name === 'leaderboard' 
          ? { count: (data.leaderboard || data || []).length, first: (data.leaderboard || data || [])[0]?.name }
          : { keys: Object.keys(data).slice(0, 5) }
      }
    } catch (e) {
      results[name] = { error: e.message }
    }
  }
  
  return Response.json(results)
}
