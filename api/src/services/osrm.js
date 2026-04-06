const fetch = (...args) => import('node-fetch').then(({default: f}) => f(...args));

const OSRM_URL = process.env.OSRM_URL || 'http://localhost:5001';

export async function getRoute(coords, options = {}) {
  const { steps = true, alternatives = false } = options;

  const coordStr = coords.map(c => `${c[0]},${c[1]}`).join(';');

  const params = new URLSearchParams({
    steps,
    geometries: 'geojson',
    overview: 'full',
    alternatives,
  });

  const res = await fetch(`${OSRM_URL}/route/v1/driving/${coordStr}?${params}`);
  const data = await res.json();

  if (data.code !== 'Ok') throw new Error(`OSRM error: ${data.message}`);
  return data;
}