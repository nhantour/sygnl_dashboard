// SYGNL Stripe Checkout - Simplified Version
// This works with static export

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const tier = searchParams.get('tier');
    
    // Price IDs
    const PRICE_IDS = {
      'basic': 'price_1SxeZ7GsXzrslQIc095njgnJ',
      'pro': 'price_1SxeZ8GsXzrslQIccZ6RzusB',
      'enterprise': 'price_1SxeZ8GsXzrslQIc3aoNAyyx'
    };
    
    if (!tier || !PRICE_IDS[tier]) {
      return new Response(JSON.stringify({ error: 'Invalid tier' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Get Stripe key from environment
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    
    if (!stripeKey) {
      return new Response(JSON.stringify({ error: 'Stripe not configured' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Create checkout session using Stripe API directly
    const response = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${stripeKey}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        'payment_method_types[0]': 'card',
        'line_items[0][price]': PRICE_IDS[tier],
        'line_items[0][quantity]': '1',
        'mode': 'subscription',
        'success_url': 'https://sygnl-dashboard.vercel.app/success?session_id={CHECKOUT_SESSION_ID}',
        'cancel_url': 'https://sygnl-dashboard.vercel.app/pricing',
        'metadata[tier]': tier
      })
    });
    
    if (!response.ok) {
      const error = await response.json();
      console.error('Stripe error:', error);
      return new Response(JSON.stringify({ error: 'Stripe API error' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const session = await response.json();
    
    // Redirect to Stripe Checkout
    return Response.redirect(session.url, 302);
    
  } catch (error) {
    console.error('Checkout error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
