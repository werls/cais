const url = 'https://api.open-meteo.com/v1/forecast?latitude=-20.3194&longitude=-40.3378&hourly=wind_gusts_10m,wind_speed_10m,wind_direction_10m&timezone=America%2FSao_Paulo';

const CACHE_TTL = 60 * 1000; // 60s
let _cache = { ts: 0, data: null };

const parseToDate = (timeStr) => {
  if (!timeStr) return null;
  let m = String(timeStr).match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
  if (m) return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), Number(m[4]), Number(m[5]));
  m = String(timeStr).match(/^(\d{2}):(\d{2})/);
  if (m) {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate(), Number(m[1]), Number(m[2]));
  }
  return null;
};

const fetchMeteo = async () => {
  if (_cache.data && (Date.now() - _cache.ts) < CACHE_TTL) return _cache.data;
  const res = await fetch(url);
  const json = await res.json();
  _cache = { ts: Date.now(), data: json };
  return json;
};

const findCurrentIndex = (times) => {
  if (!Array.isArray(times)) return null;
  const now = new Date();
  const currentDate = now.toISOString().split('T')[0];
  const hour = String(now.getHours()).padStart(2, '0');

  // exact / startsWith match
  for (let i = 0; i < times.length; i++) {
    const t = times[i];
    if (typeof t !== 'string') continue;
    if (t === `${currentDate}T${hour}:00` || t.startsWith(`${currentDate}T${hour}:`)) return i;
  }

  // parse YYYY-MM-DDTHH:MM and match
  for (let i = 0; i < times.length; i++) {
    const m = String(times[i]).match(/^(\d{4}-\d{2}-\d{2})T(\d{2}):/);
    if (m && m[1] === currentDate && m[2] === hour) return i;
  }

  // fallback: nearest timestamp
  let best = null;
  let bestDiff = Infinity;
  for (let i = 0; i < times.length; i++) {
    const dt = parseToDate(times[i]);
    if (!dt) continue;
    const diff = Math.abs(now - dt);
    if (diff < bestDiff) {
      best = i;
      bestDiff = diff;
    }
  }
  return best;
};

const getWindGusts = async () => {
  try {
    const data = await fetchMeteo();
    const times = data?.hourly?.time;
    const values = data?.hourly?.wind_gusts_10m;
    const idx = findCurrentIndex(times);
    return (idx != null && Array.isArray(values) && values[idx] != null) ? values[idx] : null;
  } catch (e) {
    console.error('Error fetching wind gusts data:', e);
    return null;
  }
};

const getWindSpeed = async () => {
  try {
    const data = await fetchMeteo();
    const times = data?.hourly?.time;
    const values = data?.hourly?.wind_speed_10m;
    const idx = findCurrentIndex(times);
    return (idx != null && Array.isArray(values) && values[idx] != null) ? values[idx] : null;
  } catch (e) {
    console.error('Error fetching wind speed data:', e);
    return null;
  }
};

const getWindDirection = async () => {
  try {
    const data = await fetchMeteo();
    const times = data?.hourly?.time;
    const values = data?.hourly?.wind_direction_10m;
    const idx = findCurrentIndex(times);
    return (idx != null && Array.isArray(values) && values[idx] != null) ? values[idx] : null;
  } catch (e) {
    console.error('Error fetching wind direction data:', e);
    return null;
  }
};

export { getWindSpeed, getWindDirection, getWindGusts };