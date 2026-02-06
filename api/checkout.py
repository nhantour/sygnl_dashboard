# SYGNL Stripe Checkout API
# Deploy as Vercel serverless function

import stripe
import json
from http.server import BaseHTTPRequestHandler

# Initialize Stripe with your secret key
# Use environment variable in production
stripe.api_key = 'sk_test_placeholder'  # Replace with actual key from env

# Product/Price IDs from your Stripe Dashboard
PRICE_IDS = {
    'basic': 'price_1SxeZ7GsXzrslQIc095njgnJ',
    'pro': 'price_1SxeZ8GsXzrslQIccZ6RzusB',
    'enterprise': 'price_1SxeZ8GsXzrslQIc3aoNAyyx'
}

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        if '/api/checkout' in self.path:
            # Get tier from query params
            from urllib.parse import urlparse, parse_qs
            parsed = urlparse(self.path)
            params = parse_qs(parsed.query)
            tier = params.get('tier', [''])[0]
            
            if tier not in PRICE_IDS:
                self.send_response(400)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'error': 'Invalid tier'}).encode())
                return
            
            try:
                # Create Stripe Checkout Session
                session = stripe.checkout.Session.create(
                    payment_method_types=['card'],
                    line_items=[{
                        'price': PRICE_IDS[tier],
                        'quantity': 1,
                    }],
                    mode='subscription',
                    success_url='https://sygnl-dashboard.vercel.app/success?session_id={CHECKOUT_SESSION_ID}',
                    cancel_url='https://sygnl-dashboard.vercel.app/pricing',
                    metadata={
                        'tier': tier
                    }
                )
                
                # Redirect to Stripe Checkout
                self.send_response(302)
                self.send_header('Location', session.url)
                self.end_headers()
                
            except Exception as e:
                self.send_response(500)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'error': str(e)}).encode())
        else:
            self.send_response(404)
            self.end_headers()
    
    def do_POST(self):
        if '/api/webhook' in self.path:
            # Handle Stripe webhooks for subscription events
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            
            sig_header = self.headers.get('Stripe-Signature')
            webhook_secret = 'whsec_placeholder'  # From Stripe Dashboard
            
            try:
                event = stripe.Webhook.construct_event(
                    post_data, sig_header, webhook_secret
                )
                
                # Handle subscription events
                if event['type'] == 'checkout.session.completed':
                    session = event['data']['object']
                    # TODO: Create API key and send to customer
                    print(f"New subscription: {session['customer_email']} - {session['metadata']['tier']}")
                    
                elif event['type'] == 'invoice.payment_failed':
                    # Handle failed payment
                    pass
                
                self.send_response(200)
                self.end_headers()
                
            except Exception as e:
                self.send_response(400)
                self.end_headers()
        else:
            self.send_response(404)
            self.end_headers()
