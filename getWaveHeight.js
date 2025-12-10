const getWaveHeight = async () => {
  try {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth() + 1;
    const day = today.getDate();

    const pad = (n) => String(n).padStart(2, "0");

    const monthStr = pad(month);
    const dayStr = pad(day);

    const url = `https://tabuamare.devtu.qzz.io/api/v1/tabua-mare/13/${monthStr}/${dayStr}/`;
    const response = await fetch(url);
    const data = await response.json();

    const now = new Date();

    const parseToDate = (timeStr) => {
      if (!timeStr) return null;

      // ISO-like: YYYY-MM-DDTHH:MM or YYYY-MM-DDTHH:MM:SS
      let m = String(timeStr).match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
      if (m) return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), Number(m[4]), Number(m[5]));

      // HH:MM or HH:MM:SS (assume today's date)
      m = String(timeStr).match(/^(\d{2}):(\d{2})/);
      if (m) return new Date(year, month - 1, day, Number(m[1]), Number(m[2]));

      // plain hour number
      m = String(timeStr).match(/^(\d{1,2})$/);
      if (m) return new Date(year, month - 1, day, Number(m[1]));

      return null;
    };

    const candidates = [];

    // Case A: hourly.time / hourly.wave_height
    if (data?.hourly && Array.isArray(data.hourly.time) && Array.isArray(data.hourly.wave_height)) {
      const times = data.hourly.time;
      const values = data.hourly.wave_height;
      for (let i = 0; i < times.length && i < values.length; i++) {
        const dt = parseToDate(times[i]);
        if (dt) candidates.push({ date: dt, value: values[i] });
      }
    }

    // Case B: nested data[0].months[0].days[0].hours
    const hoursPath = data?.data?.[0]?.months?.[0]?.days?.[0]?.hours;
    if (Array.isArray(hoursPath)) {
      for (let i = 0; i < hoursPath.length; i++) {
        const entry = hoursPath[i];
        if (entry == null) continue;

        // numeric or string value array (index -> hour)
        if (typeof entry === "number" || typeof entry === "string") {
          const dt = new Date(year, month - 1, day, i);
          candidates.push({ date: dt, value: entry });
          continue;
        }

        // object entries: try to find time and value keys
        if (typeof entry === "object") {
          const valueKey = ["level", "value", "height", "wave_height", "waveHeight"].find((k) => k in entry);
          const timeKey = ["time", "hour", "t", "hora"].find((k) => k in entry);

          let dt = null;
          if (timeKey) dt = parseToDate(entry[timeKey]);
          if (!dt) {
            // fallback: assume array index is the hour
            dt = new Date(year, month - 1, day, i);
          }
          if (valueKey) {
            candidates.push({ date: dt, value: entry[valueKey] });
          } else if ("level" in entry || typeof entry === "number") {
            // last-resort: if entry itself is a number or contains level-like field
            const val = entry.level ?? entry.value ?? entry.height ?? entry.wave_height ?? entry.waveHeight;
            if (val != null) candidates.push({ date: dt, value: val });
          }
        }
      }
    }

    if (candidates.length === 0) {
      console.log("Current hour data not found.");
      return null;
    }

    // find nearest timestamp
    let best = candidates[0];
    let bestDiff = Math.abs(now - best.date);
    for (let i = 1; i < candidates.length; i++) {
      const diff = Math.abs(now - candidates[i].date);
      if (diff < bestDiff) {
        best = candidates[i];
        bestDiff = diff;
      }
    }

    return best.value ?? null;
  } catch (error) {
    console.error("Error fetching wave height data:", error);
    return null;
  }
};

export { getWaveHeight };