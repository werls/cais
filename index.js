import { getWindDirection, getWindSpeed } from "./getMeteo.js";
import { getWaveHeight } from "./getWaveHeight.js";

const windSpeed = await getWindSpeed();
const windDirection = await getWindDirection();
const waveHeight = await getWaveHeight();

console.log(`Wind Speed: ${windSpeed} km/h`);
console.log(`Wind Direction: ${windDirection}°`);
console.log(`Wave Height: ${waveHeight} m`);