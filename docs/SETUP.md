# Arduino Nicla Sense ME - IoT Data Platform Setup Guide

## Quick Start Guide

Follow these steps to get your IoT sensor data platform up and running.

### Prerequisites

Before you begin, make sure you have:

- **Node.js** 18 or higher installed ([Download](https://nodejs.org/))
- **npm** (comes with Node.js)
- **Cloudflare account** (free tier is fine) - [Sign up here](https://dash.cloudflare.com/sign-up)
- **Arduino Nicla Sense ME** with the sketch uploaded
- **Chrome or Edge browser** (for Web Bluetooth support)

### Step 1: Install Dependencies

```bash
cd /path/to/nicla
npm install
```

### Step 2: Install Wrangler (Cloudflare CLI)

```bash
npm install -g wrangler
```

### Step 3: Authenticate with Cloudflare

```bash
wrangler login
```

This will open a browser window for you to log in to your Cloudflare account.

### Step 4: Create the Database

Create a local development database:

```bash
wrangler d1 create nicla-sensor-db-dev
```

This command will output a database ID. Copy it and update your `wrangler.toml` file:

```toml
[[d1_databases]]
binding = "DB"
database_name = "nicla-sensor-db-dev"
database_id = "YOUR_DATABASE_ID_HERE"  # Replace with the ID from the command above
migrations_dir = "migrations"
```

### Step 5: Run Database Migrations

Apply the database schema:

```bash
wrangler d1 migrations apply nicla-sensor-db-dev --local
```

You should see output confirming that the migrations were applied:
```
✅ Migrations applied successfully:
  - 0001_create_sessions.sql
  - 0002_create_sensor_readings.sql
  - 0003_create_analytics.sql
```

### Step 6: Start Development Server

```bash
npm run dev
```

The server will start at `http://localhost:8787`

### Step 7: Upload Arduino Sketch

If you haven't already, upload the Arduino sketch to your Nicla Sense ME:

**[Open Arduino Sketch](https://create.arduino.cc/editor/FT-CONTENT/333e2e07-ecc4-414c-bf08-005b611ddd75/preview)**

### Step 8: Start Recording!

1. Open `http://localhost:8787` in Chrome or Edge
2. Click **"Start Recording"**
3. Enter a session name (e.g., "Morning Air Quality Test")
4. Click **"Connect"** to pair with your Arduino device
5. Watch the data flow in real-time!

---

## Deployment to Production

Once you're ready to deploy to Cloudflare's edge network:

### 1. Create Production Database

```bash
wrangler d1 create nicla-sensor-db
```

Copy the database ID and update `wrangler.toml` for production:

```toml
[env.production]
[[env.production.d1_databases]]
binding = "DB"
database_name = "nicla-sensor-db"
database_id = "YOUR_PRODUCTION_DATABASE_ID"
```

### 2. Run Production Migrations

```bash
wrangler d1 migrations apply nicla-sensor-db --remote
```

### 3. Deploy

```bash
npm run deploy
```

Your app will be live at: `https://nicla-sense-platform.YOUR-SUBDOMAIN.workers.dev`

---

## Troubleshooting

### "Browser not supported" error
- Make sure you're using Chrome or Edge browser
- Firefox and Safari don't support Web Bluetooth yet

### "Failed to connect" error
- Make sure the Arduino sketch is uploaded and running
- Check that Bluetooth is enabled on your computer
- Try restarting the Arduino board

### Database errors
- Make sure migrations have been applied: `npm run db:migrate`
- Check that `wrangler.toml` has the correct database ID

### No data being stored
- Make sure you've started a recording session first
- Check browser console for errors (F12)
- Verify the Arduino is sending data (check BLE connection)

---

## Database Management

### View Data in Console

```bash
# View all sessions
wrangler d1 execute nicla-sensor-db-dev --local --command="SELECT * FROM sessions"

# View reading count
wrangler d1 execute nicla-sensor-db-dev --local --command="SELECT COUNT(*) FROM sensor_readings"
```

### Backup Data

Export your data as CSV from the web interface:
1. Go to History page
2. Click on a session
3. Click "Export as CSV"

### Reset Database

To start fresh:

```bash
# Delete all sessions (and their readings via CASCADE)
wrangler d1 execute nicla-sensor-db-dev --local --command="DELETE FROM sessions"
```

---

## Project Structure

```
nicla/
├── migrations/               # Database migrations
│   ├── 0001_create_sessions.sql
│   ├── 0002_create_sensor_readings.sql
│   └── 0003_create_analytics.sql
├── src/
│   ├── index.ts             # Main application entry
│   ├── routes/
│   │   ├── sensor-data.ts   # API for storing sensor data
│   │   ├── sessions.ts      # Session management API
│   │   ├── analytics.ts     # Analytics and export API
│   │   ├── dashboard.ts     # Real-time dashboard page
│   │   └── history.ts       # History viewer page
│   └── utils/
│       └── helpers.ts       # Utility functions
├── public/
│   ├── css/
│   │   └── styles.css       # Application styles
│   ├── js/
│   │   ├── dashboard.js     # Dashboard functionality
│   │   └── history.js       # History page functionality
│   └── models/
│       └── niclaSenseME.glb # 3D model of the board
├── wrangler.toml            # Cloudflare Workers config
├── package.json
└── README.md
```

---

## API Documentation

### Sessions API

#### Start a new session
```http
POST /api/sessions/start
Content-Type: application/json

{
  "name": "Session Name",
  "notes": "Optional notes",
  "tags": ["tag1", "tag2"],
  "device_name": "Arduino Nicla"
}
```

#### Stop a session
```http
POST /api/sessions/:id/stop
```

#### Get all sessions
```http
GET /api/sessions?page=1&limit=20&status=completed
```

#### Get session details
```http
GET /api/sessions/:id
```

### Sensor Data API

#### Store a single reading
```http
POST /api/sensor-data
Content-Type: application/json

{
  "session_id": "session-id",
  "timestamp": 1234567890,
  "temperature": 22.5,
  "humidity": 45,
  "pressure": 101.3,
  "accelerometer": {"x": 0.1, "y": 0.2, "z": 9.8},
  "gyroscope": {"x": 0, "y": 0, "z": 0},
  "quaternion": {"x": 0, "y": 0, "z": 0, "w": 1},
  "bsec": 50,
  "co2": 400,
  "gas": 50000
}
```

#### Store batch readings
```http
POST /api/sensor-data/batch
Content-Type: application/json

{
  "readings": [/* array of reading objects */]
}
```

### Analytics API

#### Get session analytics
```http
GET /api/analytics/sessions/:id
```

#### Export session data
```http
GET /api/analytics/export/:id?format=csv
GET /api/analytics/export/:id?format=json
```

---

## Features in Detail

### Real-Time Monitoring
- Live 3D visualization of board orientation
- Real-time graphs for all sensors
- RGB LED control via color picker
- Connection status monitoring

### Session Management
- Named recording sessions
- Add notes and tags
- Start/stop recording
- Duration tracking
- Data point counting

### Data Storage
- Automatic batching (10 readings per batch)
- Millisecond-precision timestamps
- Foreign key relationships
- Cascade delete protection

### Analytics
- Min/max/average calculations
- Motion magnitude calculations
- Time-series trends
- Statistical analysis

### Data Export
- CSV format for Excel/analysis tools
- JSON format for programmatic access
- Session metadata included
- Full timestamp precision

---

## Performance Tips

1. **Batch Size**: The default batch size is 10 readings. Increase for faster networks:
   ```javascript
   const BATCH_SIZE = 20; // In dashboard.js
   ```

2. **Graph Buffer**: Reduce `maxRecords` for better performance on slower devices:
   ```javascript
   var maxRecords = 32; // In dashboard.js (default: 64)
   ```

3. **Polling Interval**: Adjust sensor polling rate in the Arduino sketch or dashboard.js

---

## Next Steps

- **Add Alerts**: Set up threshold-based notifications
- **Machine Learning**: Train models on your sensor data
- **Multi-Device**: Connect multiple Arduino boards
- **Shared Dashboards**: Add authentication for team access
- **Advanced Analytics**: Time-series forecasting, anomaly detection

---

## Support & Resources

- **GitHub Issues**: [Report bugs](https://github.com/yourusername/nicla-sense-platform/issues)
- **Arduino Docs**: [Nicla Sense ME Documentation](https://docs.arduino.cc/hardware/nicla-sense-me)
- **Web Bluetooth**: [MDN Documentation](https://developer.mozilla.org/en-US/docs/Web/API/Web_Bluetooth_API)
- **Cloudflare Workers**: [Documentation](https://developers.cloudflare.com/workers/)

---

## License

MIT License - Feel free to use this for your projects!

---

**Happy monitoring! 🚀**
