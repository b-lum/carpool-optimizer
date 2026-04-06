import { getRoute } from '../services/osrm.js';
import { geocode } from '../services/nominatim.js';

async function resolve(input) {
  if (typeof input === 'string') return geocode(input);
  if (input.lat && input.lon) return [input.lon, input.lat];
  throw new Error('Each point must be an address string or { lat, lon }');
}

function formatDuration(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.round((seconds % 3600) / 60);
  if (h === 0) return `${m} min`;
  return `${h} hr ${m} min`;
}

export async function handleRoute(req, res) {
  try {
    const { origin, destination, waypoints = [], alternatives = false } = req.body;

    if (!origin || !destination) {
      return res.status(400).json({ error: 'origin and destination are required' });
    }

    const [originCoord, destCoord, ...waypointCoords] = await Promise.all([
      resolve(origin),
      resolve(destination),
      ...waypoints.map(resolve),
    ]);

    const allCoords = [originCoord, ...waypointCoords, destCoord];
    const osrmData = await getRoute(allCoords, { alternatives });

    const route = osrmData.routes[0];

    const legs = route.legs.map((leg, i) => ({
      from: i === 0 ? origin : waypoints[i - 1],
      to: i === route.legs.length - 1 ? destination : waypoints[i],
      distance_km: (leg.distance / 1000).toFixed(2),
      duration_min: (leg.duration / 60).toFixed(1),
      steps: leg.steps.map(step => ({
        instruction: step.maneuver.type,
        modifier: step.maneuver.modifier || null,
        street: step.name,
        distance_m: Math.round(step.distance),
        duration_sec: Math.round(step.duration),
      })),
    }));

    res.json({
      origin,
      destination,
      summary: {
        distance_km: (route.distance / 1000).toFixed(2),
        duration_min: (route.duration / 60).toFixed(1),
        duration_human: formatDuration(route.duration),
      },
      geometry: route.geometry,
      legs,
      alternatives: osrmData.routes.slice(1).map(r => ({
        distance_km: (r.distance / 1000).toFixed(2),
        duration_min: (r.duration / 60).toFixed(1),
        geometry: r.geometry,
      })),
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}