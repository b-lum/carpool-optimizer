const fetch = (...args) => import('node-fetch').then(({default: f}) => f(...args));

const NOMINATIM_URL = process.env.NOMINATIM_URL || 'https://nominatim.openstreetmap.org';

export async function geocode(address) {
  const url = `${NOMINATIM_URL}/search?q=${encodeURIComponent(address)}&format=json&limit=1`;
  const res = await fetch(url, {
    headers: { 'User-Agent': 'OSMRoutingApp/1.0' }
  });
  const data = await res.json();
  if (!data.length) throw new Error(`Address not found: "${address}"`);
  return [parseFloat(data[0].lon), parseFloat(data[0].lat)];
}

export async function reverseGeocode(lon, lat) {
  const url = `${NOMINATIM_URL}/reverse?lat=${lat}&lon=${lon}&format=json`;
  const res = await fetch(url, {
    headers: { 'User-Agent': 'OSMRoutingApp/1.0' }
  });
  return res.json();
}