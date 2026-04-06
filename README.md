# OSM Carpool Optimizer

A carpooling optimization app built on OpenStreetMap data. Upload a roster, create cars, set a destination, and the app figures out who rides with who and the best pickup order to minimize travel time and distance.

## Stack

- **Frontend** — React + Vite + MapLibre GL
- **API** — Node.js + Express
- **Routing engine** — OSRM (self-hosted)
- **Map data** — OpenStreetMap (.pbf)

## Prerequisites

- Node.js 22.12+
- Homebrew (macOS)
- OSRM backend installed via Homebrew
- A `.osm.pbf` file for your region (download from [Geofabrik](https://download.geofabrik.de))

## First Time Setup


## Local Data (Optional)

Large local API datasets are not included in the repository.

Place your dataset in:

/local-api-data/

and run:

docker compose up

ignore following steps if you don't want to use a local api

### 1. Install OSRM
```bash
brew install osrm-backend
```

### 2. Process your map data
Run these three commands in order from the project root. This only needs to be done once.
```bash
# Extract road network (slow — 10-30 min for large regions)
osrm-extract -p /opt/homebrew/Cellar/osrm-backend/6.0.0_3/share/osrm/profiles/car.lua data/your-file.osm.pbf

# Partition the graph
osrm-partition data/your-file.osrm

# Precompute weights
osrm-customize data/your-file.osrm
```

### 3. Install dependencies
```bash
# API
cd api && npm install

# Frontend
cd frontend && npm install
```

### 4. Set up environment
Create `api/.env`:
```
OSRM_URL=http://localhost:5001
NOMINATIM_URL=http://localhost:8080
PORT=3000
```

## Running the App

You need three terminal tabs every time you run the app.

**Tab 1 — OSRM routing engine:**
```bash
osrm-routed --algorithm mld --port 5001 data/your-file.osrm
```

**Tab 2 — API server:**
```bash
cd api && npm run dev
```

**Tab 3 — Frontend:**
```bash
cd frontend && npm run dev
```

Then open [http://localhost:5173](http://localhost:5173) in your browser.

## Google Sheet Format

Your roster sheet must have these exact column headers:

| Name | Address | City | Zipcode | Status | Latitude | Longitude |
|------|---------|------|---------|--------|----------|-----------|
| John Smith | 123 Main St | Los Angeles | 90001 | Driver | 34.0522 | -118.2437 |
| Jane Doe | 456 Oak Ave | Los Angeles | 90002 | Passenger | 34.0489 | -118.2541 |

- **Status** must be exactly `Driver` or `Passenger`
- **Latitude** and **Longitude** must be decimal coordinates
- Publish the sheet as CSV via `File → Share → Publish to web → CSV`

## How to Use

1. Paste your Google Sheet CSV URL and click **Load Roster**
2. Enter the destination coordinates and click **Set Destination**
3. Select a driver from the roster, set their car capacity, and click **Add** — repeat for each car
4. Click **Optimize Routes**
5. Each car gets a different color on the map showing the pickup route

## API Endpoints

### `POST /api/route`
Returns the optimal route between an origin and destination with optional waypoints.

**Request:**
```json
{
  "origin": { "lat": 34.0522, "lon": -118.2437 },
  "destination": { "lat": 37.7749, "lon": -122.4194 },
  "waypoints": [
    { "lat": 35.3733, "lon": -119.0187 }
  ]
}
```

**Response:**
```json
{
  "summary": {
    "distance_km": "614.62",
    "duration_min": "427.2",
    "duration_human": "7 hr 7 min"
  },
  "geometry": { "type": "LineString", "coordinates": [[...]] },
  "legs": [...]
}
```

### `GET /health`
Returns `{ "status": "ok" }` if the API is running.

## Notes

- The OSRM data only covers the region in your `.pbf` file — routes outside that region will fail
- Port 5000 is used by macOS Control Center — use 5001 for OSRM instead
- The `.osrm.*` processed files are large and excluded from git
- Never commit your `.env` file