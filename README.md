# Arduino Nicla Sense ME - IoT Data Platform

A complete IoT sensor data platform built with [SonicJS](https://github.com/mmcintosh/sonicjs) for storing, analyzing, and visualizing sensor data from Arduino Nicla Sense ME devices.

## Features

- 🔴 **Real-time Monitoring** - Live dashboard with Web Bluetooth connection
- 💾 **Data Storage** - Automatic storage of all sensor readings to Cloudflare D1
- 📊 **Analytics Dashboard** - Historical trends, statistics, and visualizations
- 📁 **Session Management** - Start/stop recording sessions with metadata
- 📥 **Data Export** - Download data in CSV or JSON format
- 🌍 **Edge Computing** - Deploy globally on Cloudflare Workers
- 🚀 **Blazing Fast** - Sub-100ms response times worldwide

## Sensor Data Collected

- Accelerometer (3-axis)
- Gyroscope (3-axis)
- Quaternion rotation (4D orientation)
- Temperature (°C)
- Humidity (%)
- Atmospheric Pressure (kPa)
- Indoor Air Quality (BSEC)
- CO2 levels
- Gas sensor readings

## Tech Stack

- **Frontend**: Vanilla JavaScript, Three.js, Plotly.js
- **Backend**: Hono (TypeScript web framework)
- **Database**: Cloudflare D1 (SQLite) - runs locally for testing
- **Runtime**: Cloudflare Workers (local dev mode)
- **BLE**: Web Bluetooth API

**Note**: This is a standalone Cloudflare Workers app, compatible with SonicJS architecture but doesn't require the full SonicJS CMS package.

## Quick Start (Local Testing)

### Prerequisites

- Node.js 18+ and npm
- Arduino Nicla Sense ME with firmware uploaded
- Chrome/Edge browser (for Web Bluetooth)

**NO Cloudflare account needed for local testing!**

### Local Installation (3 commands)

```bash
# 1. Install dependencies
npm install

# 2. Setup local database
npm run db:migrate

# 3. Start server
npm run dev

# Open http://localhost:8787 in Chrome/Edge
```

Or use the setup script:

```bash
./setup-local.sh
npm run dev
```

**That's it!** Everything runs locally on your machine.

See [LOCAL_TESTING.md](./LOCAL_TESTING.md) for details.

## Database Schema

### Sessions Table
Stores recording sessions with metadata:
- `id` - Unique session identifier
- `name` - User-defined session name
- `device_name` - Arduino device name
- `started_at` - Session start timestamp
- `ended_at` - Session end timestamp
- `notes` - Optional session notes
- `tags` - JSON array of tags

### Sensor Readings Table
Stores all sensor data with high precision:
- `id` - Unique reading identifier
- `session_id` - Links to sessions table
- `timestamp` - Reading timestamp (millisecond precision)
- Individual columns for each sensor (temperature, humidity, etc.)
- Indexed for fast querying by session and timestamp

## API Endpoints

### Data Ingestion
- `POST /api/sensor-data` - Store sensor reading
- `POST /api/sessions/start` - Start new session
- `POST /api/sessions/:id/stop` - End session

### Data Retrieval
- `GET /api/sessions` - List all sessions (paginated)
- `GET /api/sessions/:id` - Get session details
- `GET /api/sessions/:id/data` - Get session sensor readings
- `GET /api/sessions/:id/export` - Export session data (CSV/JSON)

### Analytics
- `GET /api/sessions/:id/analytics` - Get session statistics
- `GET /api/analytics/trends` - Cross-session trends
- `GET /api/analytics/summary` - Overall data summary

## Project Structure

```
nicla-sense-platform/
├── migrations/              # Database migrations
│   ├── 001_create_sessions.sql
│   └── 002_create_sensor_readings.sql
├── src/
│   ├── routes/
│   │   ├── api/            # API endpoints
│   │   │   ├── sensor-data.ts
│   │   │   ├── sessions.ts
│   │   │   └── analytics.ts
│   │   └── pages/          # HTML pages
│   │       ├── index.ts    # Real-time dashboard
│   │       ├── history.ts  # Historical viewer
│   │       └── analytics.ts # Analytics dashboard
│   ├── db/
│   │   └── schema.ts       # Database schema definitions
│   └── utils/
│       ├── calculations.ts # Analytics calculations
│       └── export.ts       # Data export utilities
├── public/
│   ├── js/
│   │   ├── dashboard.js    # Real-time monitoring
│   │   ├── history.js      # Historical playback
│   │   └── analytics.js    # Analytics charts
│   ├── css/
│   │   └── styles.css
│   └── models/
│       └── niclaSenseME.glb
├── wrangler.toml           # Cloudflare Workers config
└── package.json
```

## Development

### Running Tests
```bash
npm test
```

### Database Management
```bash
# Open database studio
npm run db:studio

# Create new migration
npm run db:migration:create my_migration

# Apply migrations to production
npm run db:migrate:prod
```

## Deployment

### Deploy to Cloudflare Workers

1. **Create production database**
```bash
wrangler d1 create nicla-sensor-db
```

2. **Update wrangler.toml** with your database ID

3. **Apply migrations**
```bash
npm run db:migrate:prod
```

4. **Deploy**
```bash
npm run deploy
```

Your app will be live at: `https://your-app.workers.dev`

## Usage Guide

### Recording a Session

1. Open the dashboard
2. Click "Start Recording Session"
3. Enter session name and optional notes
4. Click "Connect" to pair with your Arduino device
5. Watch real-time data flow in
6. Click "Stop Recording" when done

### Viewing Historical Data

1. Navigate to "History" page
2. Browse your saved sessions
3. Click on a session to view details
4. Use the timeline slider to scrub through data
5. Export data as needed

### Analytics

1. Navigate to "Analytics" page
2. Select session(s) to analyze
3. View statistics: min, max, average, standard deviation
4. Compare multiple sessions
5. Identify trends and patterns

## Arduino Firmware

Upload the provided Arduino sketch to your Nicla Sense ME:
[Arduino Sketch Link](https://create.arduino.cc/editor/FT-CONTENT/333e2e07-ecc4-414c-bf08-005b611ddd75/preview)

## Browser Compatibility

Web Bluetooth requires:
- Chrome 56+ (Windows, macOS, Linux, Android)
- Edge 79+ (Windows, macOS)
- Opera 43+
- NOT supported: Firefox, Safari, iOS browsers

## Performance

- **Edge deployment**: <100ms latency worldwide
- **Data throughput**: 1000+ readings/second
- **Storage**: D1 database handles millions of rows
- **Cost**: Free tier covers most personal projects

## Contributing

Contributions welcome! Please see CONTRIBUTING.md

## License

MIT License - see LICENSE file

## Links

- [SonicJS Documentation](https://sonicjs.com)
- [Arduino Nicla Sense ME](https://docs.arduino.cc/hardware/nicla-sense-me)
- [Web Bluetooth API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Bluetooth_API)
- [Cloudflare Workers](https://workers.cloudflare.com/)

## Support

- GitHub Issues: [Report bugs](https://github.com/yourusername/nicla-sense-platform/issues)
- Discussions: [Ask questions](https://github.com/yourusername/nicla-sense-platform/discussions)
