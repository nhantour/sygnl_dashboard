// Diagnostic endpoint to check environment variables
export const dynamic = 'force-dynamic';

export async function GET() {
  const stripeKeyExists = !!process.env.STRIPE_SECRET_KEY;
  const stripeKeyPrefix = process.env.STRIPE_SECRET_KEY ? 
    process.env.STRIPE_SECRET_KEY.substring(0, 12) + '...' : 'not set';
  
  return new Response(JSON.stringify({
    status: 'ok',
    stripe_key_exists: stripeKeyExists,
    stripe_key_prefix: stripeKeyPrefix,
    timestamp: new Date().toISOString()
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}
