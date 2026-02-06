// SYGNL Stripe Webhook Handler
// File: app/api/webhook/route.js

import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    // Dynamic import Stripe to avoid build-time issues
    const Stripe = (await import('stripe')).default;
    
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    
    if (!stripeKey || !webhookSecret) {
      return NextResponse.json(
        { error: 'Stripe not configured' },
        { status: 500 }
      );
    }
    
    const stripe = new Stripe(stripeKey, {
      apiVersion: '2023-10-16',
    });
    
    const payload = await request.text();
    const signature = request.headers.get('stripe-signature');
    
    let event;
    
    try {
      event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err.message);
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      );
    }
    
    // Handle events
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const tier = session.metadata?.tier;
        const customerEmail = session.customer_email;
        
        console.log(`✅ New subscription: ${customerEmail} - ${tier}`);
        
        // TODO: 
        // 1. Create API key in database
        // 2. Send welcome email with API key
        // 3. Log subscription to database
        
        break;
      }
      
      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        console.log(`⚠️ Payment failed for: ${invoice.customer_email}`);
        
        // TODO: Send payment failure email
        
        break;
      }
      
      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        console.log(`❌ Subscription cancelled: ${subscription.id}`);
        
        // TODO: Deactivate API key
        
        break;
      }
      
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }
    
    return NextResponse.json({ received: true });
    
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}
