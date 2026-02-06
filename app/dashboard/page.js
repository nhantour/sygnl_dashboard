

        {/* Intelligence Hub - Expandable */}
        {intelligence.all && intelligence.all.length > 0 && (
          <div className="mb-6 p-4 rounded-xl bg-white/5 border border-white/10">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Newspaper className="w-5 h-5 text-blue-400" />
                Intelligence Hub
                {newIntelCount > 0 && (
                  <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full animate-pulse">
                    {newIntelCount} new
                  </span>
                )}
              </h3>
              <span className="text-xs text-zinc-500">{toPSTDayTime(new Date().toISOString())}</span>
            </div>
            
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {intelligence.all.slice(0, 10).map((item, idx) => {
                const isNew = !readIntelIds.has(item.id || item.title)
                const isExpanded = expandedIntel === (item.id || item.title)
                
                return (
                  <div 
                    key={idx} 
                    className={`rounded-lg border transition-all ${
                      isNew ? 'bg-blue-500/10 border-blue-500/30' : 'bg-white/5 border-white/10'
                    } ${isExpanded ? 'p-4' : 'p-3'}`}
                  >
                    <div 
                      className="flex items-center gap-2 cursor-pointer"
                      onClick={() => {
                        markIntelAsRead(item.id || item.title)
                        setExpandedIntel(isExpanded ? null : (item.id || item.title))
                      }}
                    >
                      {isNew && <span className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />}
                      <span className="font-medium text-sm flex-1">{item.title}</span>
                      {item.priority === 'high' && <span className="text-xs text-red-400">● High Priority</span>}
                      {isNew && <span className="text-xs text-blue-400">NEW</span>}
                      {isExpanded ? <ChevronUp className="w-4 h-4 text-zinc-500" /> : <ChevronDown className="w-4 h-4 text-zinc-500" />}
                    </div>
                    
                    <p className={`text-sm text-zinc-400 mt-2 ${isExpanded ? '' : 'line-clamp-1'}`}>
                      {item.summary}
                    </p>
                    
                    {isExpanded && (
                      <div className="mt-3 pt-3 border-t border-white/10 space-y-2">
                        <div className="flex items-center gap-4 text-xs text-zinc-500">
                          <span>Source: {item.source || 'Market Intelligence'}</span>
                          <span>Category: {item.category || 'General'}</span>
                          <span>Priority: {item.priority || 'Normal'}</span>
                        </div>
                        {item.details && (
                          <p className="text-sm text-zinc-400">{item.details}</p>
                        )}
                        {item.actionItems && item.actionItems.length > 0 && (
                          <div className="mt-2">
                            <span className="text-xs text-zinc-500">Action Items:</span>
                            <ul className="mt-1 space-y-1">
                              {item.actionItems.map((action, aidx) => (
                                <li key={aidx} className="text-sm text-zinc-300 flex items-center gap-2">
                                  <CheckCircle className="w-3 h-3 text-emerald-400" />
                                  {action}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        <div className="flex gap-2 mt-3">
                          <button className="px-3 py-1 rounded bg-blue-500/20 text-blue-400 text-xs hover:bg-blue-500/30">
                            Create Signal
                          </button>
                          <button className="px-3 py-1 rounded bg-white/10 text-zinc-400 text-xs hover:bg-white/20">
                            Dismiss
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </main>

      {/* Buy Modal - Live/Paper Toggle */}
      {showBuyModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-white/10 rounded-2xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Buy Asset</h3>
              <button onClick={() => { setShowBuyModal(false); setExecutionError(''); setExecutionSuccess(''); setTradeSymbol(''); }}>
                <X className="w-5 h-5 text-zinc-400" />
              </button>
            </div>
            
            {/* Live/Paper Toggle */}
            <div className="flex gap-2 mb-4 p-1 bg-black/30 rounded-lg">
              <button
                onClick={() => setTradeMode('live')}
                className={`flex-1 py-2 rounded text-sm font-medium transition-colors ${
                  tradeMode === 'live' 
                    ? 'bg-red-500/20 text-red-400' 
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                🔴 Live Trading
              </button>
              <button
                onClick={() => setTradeMode('paper')}
                className={`flex-1 py-2 rounded text-sm font-medium transition-colors ${
                  tradeMode === 'paper' 
                    ? 'bg-purple-500/20 text-purple-400' 
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                🟣 Paper Trading
              </button>
            </div>
            
            {/* Buying Power Display */}
            <div className="mb-4 p-3 rounded-lg bg-white/5">
              <div className="text-xs text-zinc-500">Available Buying Power ({tradeMode})</div>
              <div className="text-lg font-bold text-zinc-300">
                {formatCurrency(tradeMode === 'paper' ? paperSummary.buyingPower : 50000)}
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Symbol</label>
                <input
                  type="text"
                  value={tradeSymbol}
                  onChange={(e) => setTradeSymbol(e.target.value.toUpperCase())}
                  placeholder="e.g. AAPL, NVDA, BTC"
                  className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-white uppercase"
                />
              </div>
              
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Quantity</label>
                <input
                  type="number"
                  step="any"
                  value={tradeQuantity}
                  onChange={(e) => setTradeQuantity(e.target.value)}
                  placeholder="Number of shares"
                  className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-white"
                />
              </div>
              
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Price per Share</label>
                <input
                  type="number"
                  step="any"
                  value={tradePrice}
                  onChange={(e) => setTradePrice(e.target.value)}
                  placeholder="Enter price"
                  className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-white"
                />
              </div>
              
              {tradeQuantity && tradePrice && (
                <div className="p-3 rounded-lg bg-white/5">
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-500">Total Cost:</span>
                    <span className="font-medium">{formatCurrency(parseFloat(tradeQuantity) * parseFloat(tradePrice))}</span>
                  </div>
                </div>
              )}
              
              {executionError && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                  {executionError}
                </div>
              )}
              
              {executionSuccess && (
                <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm">
                  {executionSuccess}
                </div>
              )}
              
              <button
                onClick={() => handleTrade('BUY')}
                disabled={isExecuting || !tradeSymbol || !tradeQuantity || !tradePrice}
                className={`w-full py-3 rounded-lg font-medium disabled:opacity-50 ${
                  tradeMode === 'live' 
                    ? 'bg-red-500/20 hover:bg-red-500/30 text-red-400' 
                    : 'bg-purple-500/20 hover:bg-purple-500/30 text-purple-400'
                }`}
              >
                {isExecuting ? 'Processing...' : `Confirm Buy (${tradeMode})`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sell Modal - Live/Paper Toggle */}
      {showSellModal && selectedAsset && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-white/10 rounded-2xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Sell {selectedAsset.symbol}</h3>
              <button onClick={() => { setShowSellModal(false); setExecutionError(''); setExecutionSuccess(''); }}>
                <X className="w-5 h-5 text-zinc-400" />
              </button>
            </div>
            
            {/* Live/Paper Toggle */}
            <div className="flex gap-2 mb-4 p-1 bg-black/30 rounded-lg">
              <button
                onClick={() => setTradeMode('live')}
                className={`flex-1 py-2 rounded text-sm font-medium transition-colors ${
                  tradeMode === 'live' 
                    ? 'bg-red-500/20 text-red-400' 
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                🔴 Live Trading
              </button>
              <button
                onClick={() => setTradeMode('paper')}
                className={`flex-1 py-2 rounded text-sm font-medium transition-colors ${
                  tradeMode === 'paper' 
                    ? 'bg-purple-500/20 text-purple-400' 
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                🟣 Paper Trading
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="p-3 rounded-lg bg-white/5">
                <div className="text-sm text-zinc-400">Current Position ({tradeMode})</div>
                <div className="text-lg font-bold">{selectedAsset.quantity?.toLocaleString()} shares</div>
                <div className="text-sm text-zinc-500">@ ${selectedAsset.current_price?.toLocaleString()}</div>
                <div className="text-sm text-emerald-400 mt-1">
                  Value: {formatCurrency(selectedAsset.current_value || selectedAsset.quantity * selectedAsset.current_price)}
                </div>
              </div>
              
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Quantity to Sell</label>
                <input
                  type="number"
                  step="any"
                  value={tradeQuantity}
                  onChange={(e) => setTradeQuantity(e.target.value)}
                  placeholder={`Max: ${selectedAsset.quantity}`}
                  max={selectedAsset.quantity}
                  className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-white"
                />
              </div>
              
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Price per Share</label>
                <input
                  type="number"
                  step="any"
                  value={tradePrice || selectedAsset.current_price}
                  onChange={(e) => setTradePrice(e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-white"
                />
              </div>
              
              {executionError && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                  {executionError}
                </div>
              )}
              
              {executionSuccess && (
                <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm">
                  {executionSuccess}
                </div>
              )}
              
              <button
                onClick={() => handleTrade('SELL')}
                disabled={isExecuting || !tradeQuantity}
                className={`w-full py-3 rounded-lg font-medium disabled:opacity-50 ${
                  tradeMode === 'live' 
                    ? 'bg-red-500/20 hover:bg-red-500/30 text-red-400' 
                    : 'bg-purple-500/20 hover:bg-purple-500/30 text-purple-400'
                }`}
              >
                {isExecuting ? 'Processing...' : `Confirm Sell (${tradeMode})`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}