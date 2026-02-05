# SYGNL Dashboard - Dual Access System

## Access Levels

### 1. Demo Access (Public)
- **Password:** `sygnl2026`
- **Data:** Delayed 24 hours
- **Features:** Read-only, sample data
- **Purpose:** Show prospects the product

### 2. Live Access (Private)
- **Password:** `trymysignal`
- **Data:** Real-time
- **Features:** Full access, live signals
- **Purpose:** Actual trading decisions

## Implementation

Both passwords work on the same login page. The system stores access level in localStorage:
- `sygnl_mode`: 'demo' or 'live'
- `sygnl_access_level`: 'read-only' or 'full'

UI shows appropriate banner based on mode.

## Security Notes

- Demo password was previously leaked - now repurposed for public demo
- Live password is private and rotated regularly
- Demo shows sanitized/delayed data only
- No sensitive account info in demo mode
