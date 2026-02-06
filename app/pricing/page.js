export default function PricingPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      <div className="max-w-6xl mx-auto px-6 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="flex justify-center mb-6">
            <img 
              src="/logo.png" 
              alt="SYGNL" 
              className="h-36 w-auto object-contain"
            />
          </div>
          <p className="text-xl text-gray-400">AI-powered trading signals for agents and traders</p>
          
          {/* Stats */}
          <div className="flex justify-center gap-10 mt-10">
            <div className="text-center">
              <div className="text-3xl font-bold text-indigo-400">580</div>
              <div className="text-sm text-gray-500">Symbols Analyzed</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-indigo-400">65%+</div>
              <div className="text-sm text-gray-500">Signal Accuracy</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-indigo-400">24/7</div>
              <div className="text-sm text-gray-500">Market Coverage</div>
            </div>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {/* Free */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <h3 className="text-xl font-semibold mb-2">Free</h3>
            <div className="text-4xl font-bold mb-2">$0<span className="text-base font-normal text-gray-500">/mo</span></div>
            <p className="text-gray-400 text-sm mb-6">Perfect for trying out SYGNL signals</p>
            <ul className="space-y-3 mb-6 text-sm">
              <li className="flex items-center gap-2"><span className="text-green-400">✓</span> 10 signals/day</li>
              <li className="flex items-center gap-2"><span className="text-green-400">✓</span> 15-minute delayed data</li>
              <li className="flex items-center gap-2"><span className="text-green-400">✓</span> Email support</li>
              <li className="flex items-center gap-2"><span className="text-green-400">✓</span> Basic API access</li>
              <li className="flex items-center gap-2"><span className="text-green-400">✓</span> Market state classifications</li>
            </ul>
            <a href="/signup?tier=free" className="block w-full py-3 text-center border border-white/20 rounded-lg hover:bg-white/5 transition">
              Get Started Free
            </a>
          </div>

          {/* Basic */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <h3 className="text-xl font-semibold mb-2">Basic</h3>
            <div className="text-4xl font-bold mb-2">$49<span className="text-base font-normal text-gray-500">/mo</span></div>
            <p className="text-gray-400 text-sm mb-6">For individual traders and small bots</p>
            <ul className="space-y-3 mb-6 text-sm">
              <li className="flex items-center gap-2"><span className="text-green-400">✓</span> 100 signals/day</li>
              <li className="flex items-center gap-2"><span className="text-green-400">✓</span> Real-time data</li>
              <li className="flex items-center gap-2"><span className="text-green-400">✓</span> API access with webhooks</li>
              <li className="flex items-center gap-2"><span className="text-green-400">✓</span> Priority email support</li>
              <li className="flex items-center gap-2"><span className="text-green-400">✓</span> Portfolio tracking</li>
              <li className="flex items-center gap-2"><span className="text-green-400">✓</span> Signal history (30 days)</li>
            </ul>
            <a href="/api/checkout?tier=basic" className="block w-full py-3 text-center bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg hover:opacity-90 transition">
              Start Basic Plan
            </a>
          </div>

          {/* Pro */}
          <div className="bg-white/5 border border-indigo-500/50 rounded-2xl p-6 relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-500 px-4 py-1 rounded-full text-xs font-bold">
              MOST POPULAR
            </div>
            <h3 className="text-xl font-semibold mb-2">Pro</h3>
            <div className="text-4xl font-bold mb-2">$199<span className="text-base font-normal text-gray-500">/mo</span></div>
            <p className="text-gray-400 text-sm mb-6">For serious traders and fintech apps</p>
            <ul className="space-y-3 mb-6 text-sm">
              <li className="flex items-center gap-2"><span className="text-green-400">✓</span> 500 signals/day</li>
              <li className="flex items-center gap-2"><span className="text-green-400">✓</span> Real-time data</li>
              <li className="flex items-center gap-2"><span className="text-green-400">✓</span> Priority API access</li>
              <li className="flex items-center gap-2"><span className="text-green-400">✓</span> Custom webhooks</li>
              <li className="flex items-center gap-2"><span className="text-green-400">✓</span> Multi-timeframe analysis</li>
              <li className="flex items-center gap-2"><span className="text-green-400">✓</span> Telegram alerts</li>
              <li className="flex items-center gap-2"><span className="text-green-400">✓</span> Signal history (90 days)</li>
              <li className="flex items-center gap-2"><span className="text-green-400">✓</span> Dedicated support</li>
            </ul>
            <a href="/api/checkout?tier=pro" className="block w-full py-3 text-center bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg hover:opacity-90 transition">
              Start Pro Plan
            </a>
          </div>

          {/* Enterprise */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <h3 className="text-xl font-semibold mb-2">Enterprise</h3>
            <div className="text-4xl font-bold mb-2">$999<span className="text-base font-normal text-gray-500">/mo</span></div>
            <p className="text-gray-400 text-sm mb-6">For institutions and white-label partners</p>
            <ul className="space-y-3 mb-6 text-sm">
              <li className="flex items-center gap-2"><span className="text-green-400">✓</span> Unlimited signals</li>
              <li className="flex items-center gap-2"><span className="text-green-400">✓</span> Custom symbol universe</li>
              <li className="flex items-center gap-2"><span className="text-green-400">✓</span> 99.9% SLA guarantee</li>
              <li className="flex items-center gap-2"><span className="text-green-400">✓</span> White-label option</li>
              <li className="flex items-center gap-2"><span className="text-green-400">✓</span> Dedicated infrastructure</li>
              <li className="flex items-center gap-2"><span className="text-green-400">✓</span> API rate limit: 1000/min</li>
              <li className="flex items-center gap-2"><span className="text-green-400">✓</span> Custom integrations</li>
              <li className="flex items-center gap-2"><span className="text-green-400">✓</span> Phone support</li>
            </ul>
            <a href="mailto:sales@sygnl.ai" className="block w-full py-3 text-center border border-white/20 rounded-lg hover:bg-white/5 transition">
              Contact Sales
            </a>
          </div>
        </div>

        {/* FAQ */}
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-10">Frequently Asked Questions</h2>
          
          <div className="space-y-4">
            <div className="bg-white/5 rounded-xl p-6">
              <h3 className="text-indigo-400 font-semibold mb-2">How accurate are SYGNL signals?</h3>
              <p className="text-gray-400">Our signals with 65%+ confidence have a historical accuracy of 72-78% depending on market regime. All signals include confidence scores and market state classifications so you can make informed decisions.</p>
            </div>
            
            <div className="bg-white/5 rounded-xl p-6">
              <h3 className="text-indigo-400 font-semibold mb-2">What markets do you cover?</h3>
              <p className="text-gray-400">We analyze 580 symbols including 480 US equities (S&P 500), 75 ETFs (sectors, bonds, commodities), and 25 crypto assets (BTC, ETH, SOL, etc.).</p>
            </div>
            
            <div className="bg-white/5 rounded-xl p-6">
              <h3 className="text-indigo-400 font-semibold mb-2">How often are signals generated?</h3>
              <p className="text-gray-400">Signals are generated every 4 hours during market hours (9:30 AM - 4:00 PM ET). Pro and Enterprise users also get pre-market and after-hours scans.</p>
            </div>
            
            <div className="bg-white/5 rounded-xl p-6">
              <h3 className="text-indigo-400 font-semibold mb-2">Can I cancel anytime?</h3>
              <p className="text-gray-400">Yes! All plans are month-to-month with no contracts. Cancel anytime from your dashboard or by emailing support.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}