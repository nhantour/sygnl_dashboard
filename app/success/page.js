export default function SuccessPage({ searchParams }) {
  const sessionId = searchParams?.session_id;
  
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white flex items-center justify-center">
      <div className="max-w-md w-full mx-auto px-6 text-center">
        <div className="mb-8">
          <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold mb-4">Welcome to SYGNL!</h1>
          <p className="text-gray-400">
            Your subscription is active. Check your email for your API key and getting started guide.
          </p>
        </div>
        
        <div className="bg-white/5 rounded-xl p-6 mb-8 text-left">
          <h3 className="font-semibold mb-4 text-indigo-400">What's Next?</h3>
          <ul className="space-y-3 text-sm text-gray-300">
            <li className="flex items-start gap-3">
              <span className="text-green-400 mt-0.5">1.</span>
              <span>Check your email for API key and documentation</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-green-400 mt-0.5">2.</span>
              <span>Visit the dashboard to explore your signals</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-green-400 mt-0.5">3.</span>
              <span>Start integrating the API into your workflow</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-green-400 mt-0.5">4.</span>
              <span>Join our Telegram for real-time alerts</span>
            </li>
          </ul>
        </div>
        
        <div className="space-y-3">
          <a 
            href="/dashboard" 
            className="block w-full py-3 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg font-semibold hover:opacity-90 transition"
          >
            Go to Dashboard
          </a>
          <a 
            href="https://t.me/sygnl_alerts" 
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full py-3 border border-white/20 rounded-lg hover:bg-white/5 transition"
          >
            Join Telegram Alerts
          </a>
        </div>
        
        <p className="mt-8 text-sm text-gray-500">
          Session ID: {sessionId}
        </p>
      </div>
    </div>
  );
}
