// POST /api/chat — proxy to OpenClaw gateway chat completions (streaming)
// Token stays server-side. Frontend never sees it.

const GATEWAY_URL = process.env.OPENCLAW_GATEWAY_URL || 'http://127.0.0.1:18789'
const GATEWAY_TOKEN = process.env.OPENCLAW_GATEWAY_TOKEN || '43159488d62c51d5a0205fcf73e08661507e20f6676087e6'

export async function POST(request) {
  try {
    const body = await request.json()
    const { messages, stream = true, user = 'mission-control' } = body

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return Response.json({ error: 'messages array required' }, { status: 400 })
    }

    const payload = {
      model: 'openclaw:main',
      messages,
      stream,
      user, // stable session key — conversation persists
    }

    const res = await fetch(`${GATEWAY_URL}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GATEWAY_TOKEN}`,
      },
      body: JSON.stringify(payload),
    })

    if (!res.ok) {
      const errorText = await res.text()
      console.error('[chat proxy] Gateway error:', res.status, errorText)
      return Response.json(
        { error: `Gateway returned ${res.status}`, details: errorText },
        { status: res.status }
      )
    }

    if (stream) {
      // Forward SSE stream directly
      return new Response(res.body, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      })
    } else {
      const data = await res.json()
      return Response.json(data)
    }
  } catch (err) {
    console.error('[chat proxy] Error:', err)
    return Response.json({ error: 'Internal proxy error', message: err.message }, { status: 500 })
  }
}
