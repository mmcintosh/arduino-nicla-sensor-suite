# 🚀 Single Page Application (SPA) Implementation

## Overview

The application has been converted to a Single Page Application (SPA) architecture to preserve the Web Bluetooth connection across navigation. Previously, navigating between pages (Dashboard → History → Analytics) caused full page reloads, which disconnected the BLE device and required re-pairing.

## What Changed

### 1. **New SPA Architecture**
- Created `src/routes/spa.ts` and `src/routes/spa-html.ts`
- Implemented client-side hash-based routing (`#dashboard`, `#history`, `#analytics`)
- All "pages" are now components within a single HTML document
- Navigation happens without page reloads

### 2. **Persistent BLE Connection**
- BLE device connection stored in global `AppState` object
- Connection survives navigation between all pages
- No need to re-pair device when switching views
- Automatic reconnection handling on disconnect

### 3. **Modern Navigation Bar**
- Fixed top navigation with active page highlighting
- Real-time connection status indicator (green dot when connected)
- Smooth transitions between pages
- Consistent across all views

### 4. **Recording Feature**
- Recording continues across page navigation
- Can start recording on dashboard, view history, return to dashboard
- Data buffer persists in memory
- Automatic data flushing to API

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Hono Backend (src/index.ts)           │
│  ┌───────────────────────────────────────────────────┐  │
│  │ API Routes (unchanged)                            │  │
│  │ /api/sensor-data  /api/sessions  /api/analytics  │  │
│  └───────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────┐  │
│  │ SPA Route (new)                                   │  │
│  │ / → Serves SPA_HTML                               │  │
│  │ /history → Serves SPA_HTML (client-side routing)  │  │
│  │ /analytics → Serves SPA_HTML (client-side routing)│  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│              Single Page Application (Browser)           │
│  ┌───────────────────────────────────────────────────┐  │
│  │ Global State (AppState)                           │  │
│  │ • device, server, service                         │  │
│  │ • characteristics (BLE)                           │  │
│  │ • isConnected, isRecording                        │  │
│  │ • currentSessionId, dataBuffer                    │  │
│  └───────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────┐  │
│  │ Client-Side Router                                │  │
│  │ window.location.hash                              │  │
│  │ • #dashboard → Show dashboard component           │  │
│  │ • #history → Show history component               │  │
│  │ • #analytics → Show analytics component           │  │
│  └───────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────┐  │
│  │ Page Components (all in DOM, visibility toggled)  │  │
│  │ • Dashboard (3D model, sensors, charts)           │  │
│  │ • History (session list, filters)                 │  │
│  │ • Analytics (stats, sensor averages, trends)      │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

## Key Features

### ✅ Persistent BLE Connection
- Device remains paired across all navigation
- No reconnection required when switching pages
- Only disconnects when:
  - User clicks "DISCONNECT" button
  - Device moves out of BLE range
  - Device is powered off
  - Browser tab/window is closed

### ✅ Hash-Based Routing
- URLs: `/#dashboard`, `/#history`, `/#analytics`
- Browser back/forward buttons work correctly
- No server requests on navigation
- Instant page transitions

### ✅ Unified Navigation
- Top navigation bar always visible
- Active page highlighted in yellow (#d8f41d)
- Connection status always visible
- Smooth hover effects

### ✅ Data Recording
- Recording state persists across navigation
- Can view analytics while recording
- Data buffer maintained in memory
- Automatic batch sending to API

## File Structure

```
src/
├── routes/
│   ├── spa.ts           # NEW: SPA route handler
│   ├── spa-html.ts      # NEW: Complete SPA HTML
│   ├── dashboard.ts     # OLD: No longer used (kept for reference)
│   ├── history.ts       # OLD: No longer used (kept for reference)
│   ├── analytics-page.ts# OLD: No longer used (kept for reference)
│   ├── sensor-data.ts   # Unchanged: API endpoint
│   ├── sessions.ts      # Unchanged: API endpoint
│   └── analytics.ts     # Unchanged: API endpoint
├── index.ts             # UPDATED: Now routes to SPA
└── utils/
    └── helpers.ts       # Unchanged
```

## How It Works

### Initial Load
1. User navigates to `http://localhost:8787/` (or any route)
2. Server responds with `SPA_HTML` (complete application)
3. JavaScript initializes:
   - Router attaches to hash changes
   - Event listeners set up
   - Page shows `#dashboard` by default

### Navigation
1. User clicks "History" link
2. JavaScript intercepts click, sets `window.location.hash = '#history'`
3. Router detects hash change
4. Hides all pages (`display: none`)
5. Shows history page (`display: block`)
6. Loads history data via API
7. **BLE connection remains active throughout**

### BLE Connection Flow
1. User clicks "CONNECT" button
2. Web Bluetooth API requests device
3. Device connected, stored in `AppState.device`
4. Characteristics discovered and cached
5. Notifications started for all sensors
6. User can navigate freely, connection persists
7. Sensor data continues streaming on all pages

### Recording Flow
1. User starts recording (creates session via API)
2. Session ID stored in `AppState.currentSessionId`
3. Recording flag set to `true`
4. All sensor updates trigger `recordSensorData()`
5. Data buffered in memory (batch size: 10)
6. Batch sent to API when full
7. User can navigate to History/Analytics
8. Recording continues in background
9. Stop recording from any page

## Testing Checklist

### ✅ To Test
- [ ] Open application in Chrome with Web Bluetooth enabled
- [ ] Connect to Arduino Nicla Sense ME
- [ ] Verify sensors are streaming
- [ ] Click "History" - connection should persist
- [ ] Click "Analytics" - connection should persist
- [ ] Click "Dashboard" - connection should persist
- [ ] Browser back button should work
- [ ] Browser forward button should work
- [ ] Start recording on dashboard
- [ ] Navigate to history while recording
- [ ] Return to dashboard, recording should still be active
- [ ] Stop recording
- [ ] Verify data saved correctly
- [ ] Disconnect device
- [ ] Try to reconnect
- [ ] Test on Chrome/Edge (Web Bluetooth supported browsers)

## Browser Requirements

### Supported Browsers
- ✅ Chrome 56+ (Desktop)
- ✅ Edge 79+ (Desktop)
- ✅ Opera 43+ (Desktop)
- ❌ Firefox (Web Bluetooth not supported)
- ❌ Safari (Web Bluetooth not supported)

### Chrome Setup
1. Navigate to `chrome://flags/#enable-experimental-web-platform-features`
2. Enable the flag
3. Restart Chrome

## Benefits of SPA Approach

### User Experience
- ⚡ **Instant Navigation**: No page reloads
- 🔌 **Persistent Connection**: No re-pairing needed
- 📊 **Live Updates**: Sensors continue streaming on all pages
- 💾 **Uninterrupted Recording**: Data capture never stops

### Technical
- 🎯 **Simplified State Management**: Single global state object
- 🔄 **Reduced Server Load**: Only API calls, no page requests
- 🚀 **Better Performance**: No repeated asset loading
- 🧩 **Maintainable Code**: All in one place

### Developer Experience
- 📝 **Single Source of Truth**: One HTML file
- 🛠️ **Easy Debugging**: All code in browser console
- 🔍 **Clear Data Flow**: Explicit state management
- 🎨 **Consistent Styling**: Shared CSS across all views

## Migration Notes

### What Was Removed
- ❌ Old dashboard route (`src/routes/dashboard.ts`)
- ❌ Old history route (`src/routes/history.ts`)
- ❌ Old analytics page route (`src/routes/analytics-page.ts`)
- ❌ `dashboard-html.ts` (replaced by `spa-html.ts`)

### What Was Kept
- ✅ All API routes (sensor-data, sessions, analytics)
- ✅ Database schema and migrations
- ✅ Test suite
- ✅ CI/CD pipeline

### Backwards Compatibility
- ✅ API endpoints unchanged
- ✅ Database unchanged
- ✅ Arduino sketch unchanged
- ✅ BLE UUIDs unchanged

## Known Limitations

1. **Browser Support**: Only works in Chrome/Edge/Opera
2. **URL Sharing**: Hash URLs are less clean than path URLs
3. **SEO**: SPA not ideal for SEO (not a concern for this app)
4. **Initial Load**: Slightly larger initial HTML payload

## Future Enhancements

### Potential Improvements
- [ ] Add loading spinners for async operations
- [ ] Implement virtual scrolling for long session lists
- [ ] Add real-time charts on history page
- [ ] Implement session comparison view
- [ ] Add export to PDF functionality
- [ ] Implement push state routing (if needed)
- [ ] Add service worker for offline support
- [ ] Implement progressive web app (PWA) features

### Performance Optimizations
- [ ] Lazy load chart libraries
- [ ] Virtual DOM for large lists
- [ ] Web Workers for data processing
- [ ] IndexedDB for local data caching

## Troubleshooting

### Connection Lost After Navigation
**Expected**: Should NOT happen with SPA
**If it happens**: 
1. Check browser console for errors
2. Verify `AppState.device` is not null
3. Check if device disconnected physically
4. Try manual reconnect

### Charts Not Updating
**Solution**: 
1. Check if `updateSensorDisplay()` is being called
2. Verify Plotly is loaded
3. Check console for JavaScript errors

### Recording Data Not Saving
**Solution**:
1. Verify session created successfully
2. Check `AppState.currentSessionId` is set
3. Monitor network tab for API calls
4. Check server logs for errors

## Documentation

See also:
- `docs/AVAILABLE_SENSORS.md` - List of all available sensors
- `docs/CLOUDFLARE_DEPLOY_PLAN.md` - Deployment guide
- `docs/PROJECT_STATE.md` - Current project status
- `README.md` - General project information

## Version History

- **v1.0.0**: Multi-page application (page reloads)
- **v1.1.0**: Single Page Application (persistent BLE) ← Current

---

**Implementation Date**: January 11, 2026  
**Status**: ✅ Ready for Testing  
**Breaking Changes**: None (API compatible)
