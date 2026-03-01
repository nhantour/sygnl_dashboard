import { NextResponse } from 'next/server'
import { readFileSync, existsSync } from 'fs'
import { join } from 'path'

export async function GET() {
  try {
    const dataDir = join(process.cwd(), '..', 'sygnl', 'data')
    
    // Read latest options scan
    let options = []
    let shorts = []
    
    // Check for active positions file
    const posFile = join(dataDir, 'options_short_positions.json')
    if (existsSync(posFile)) {
      const data = JSON.parse(readFileSync(posFile, 'utf8'))
      options = data.options || []
      shorts = data.shorts || []
    }
    
    // Check for latest scan results
    const scanDir = join(dataDir)
    if (existsSync(scanDir)) {
      const files = require('fs').readdirSync(scanDir)
        .filter(f => f.startsWith('options_scan_'))
        .sort()
        .reverse()
      
      if (files.length > 0) {
        const latestScan = JSON.parse(readFileSync(join(scanDir, files[0]), 'utf8'))
        // Merge scan signals as potential positions
        if (!options.length && latestScan.signals) {
          options = latestScan.signals.filter(s => s.direction?.includes('CALL') || s.direction?.includes('PUT')).slice(0, 5)
          shorts = latestScan.signals.filter(s => s.direction === 'SHORT').slice(0, 5)
        }
      }
    }
    
    return NextResponse.json({
      options,
      shorts,
      summary: {
        total_options: options.length,
        total_shorts: shorts.length,
        options_pnl: options.reduce((sum, o) => sum + (Number(o.pnl) || 0), 0),
        shorts_pnl: shorts.reduce((sum, s) => sum + (Number(s.pnl) || 0), 0)
      }
    })
  } catch (error) {
    return NextResponse.json({ options: [], shorts: [], summary: { total_options: 0, total_shorts: 0 } })
  }
}
