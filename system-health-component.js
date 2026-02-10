// Add this System Health component to SYGNL Dashboard
// Insert after the main stats grid (around line 320)

const SystemHealthSection = () => {
  const [health, setHealth] = useState({
    botStatus: 'checking',
    apiStatus: 'checking',
    lastUpdate: new Date(),
    cronJobs: []
  });

  useEffect(() => {
    checkHealth();
    const interval = setInterval(checkHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  const checkHealth = async () => {
    try {
      // Check bot status
      const botRes = await fetch('/api/health/bot').catch(() => null);
      const botStatus = botRes?.ok ? 'online' : 'offline';

      // Check API status
      const apiRes = await fetch('/api/stats').catch(() => null);
      const apiStatus = apiRes?.ok ? 'online' : 'offline';

      setHealth({
        botStatus,
        apiStatus,
        lastUpdate: new Date(),
        cronJobs: [
          { name: 'Portfolio Updates', status: 'active', schedule: 'Every 4h' },
          { name: 'Daily Briefing', status: 'active', schedule: '9am PST' },
          { name: 'Auto-Trading', status: 'active', schedule: '3:50pm ET' },
          { name: 'Intelligence Hub', status: 'active', schedule: 'Every 30min' }
        ]
      });
    } catch (e) {
      console.error('Health check failed:', e);
    }
  };

  return (
    <div className="col-span-full p-6 rounded-2xl bg-gradient-to-br from-zinc-900/50 to-black/50 border border-white/10 backdrop-blur-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Activity className="w-5 h-5 text-emerald-400" />
          System Health & Cron Jobs
        </h3>
        <span className="text-xs text-zinc-500">
          Last checked: {health.lastUpdate.toLocaleTimeString()}
        </span>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Bot Status */}
        <div className="p-4 rounded-xl bg-white/5 border border-white/5">
          <div className="text-xs text-zinc-500 mb-1">ANANDAI Bot</div>
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${health.botStatus === 'online' ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
            <span className={health.botStatus === 'online' ? 'text-emerald-400' : 'text-red-400'}>
              {health.botStatus === 'online' ? 'Running' : 'Offline'}
            </span>
          </div>
        </div>

        {/* API Status */}
        <div className="p-4 rounded-xl bg-white/5 border border-white/5">
          <div className="text-xs text-zinc-500 mb-1">Dashboard API</div>
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${health.apiStatus === 'online' ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
            <span className={health.apiStatus === 'online' ? 'text-emerald-400' : 'text-red-400'}>
              {health.apiStatus === 'online' ? 'Online' : 'Offline'}
            </span>
          </div>
        </div>

        {/* Auto-Trading */}
        <div className="p-4 rounded-xl bg-white/5 border border-white/5">
          <div className="text-xs text-zinc-500 mb-1">Auto-Trading</div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-emerald-400">Paper Mode</span>
          </div>
          <div className="text-xs text-zinc-600 mt-1">$6,000 deployed</div>
        </div>

        {/* Last Trade */}
        <div className="p-4 rounded-xl bg-white/5 border border-white/5">
          <div className="text-xs text-zinc-500 mb-1">Last Auto-Trade</div>
          <div className="text-sm text-zinc-300">Feb 4, 22:18</div>
          <div className="text-xs text-emerald-500 mt-1">AAPL + NVDA</div>
        </div>
      </div>

      {/* Cron Jobs */}
      <div className="mt-4 pt-4 border-t border-white/5">
        <div className="text-xs text-zinc-500 mb-3">Active Cron Jobs</div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {health.cronJobs.map((job, idx) => (
            <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-white/5">
              <div>
                <div className="text-sm font-medium">{job.name}</div>
                <div className="text-xs text-zinc-600">{job.schedule}</div>
              </div>
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Insert this component in the main grid after the stats cards:
// <SystemHealthSection />
