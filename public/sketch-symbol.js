let stepsW = 16;
let stepsH = 5;
let div = 4
let amp = 1;
let scl = 4;
let modW, modH, vel;
let level;
let font, contours;

let windSpeed, windDirection, waveHeight, windGusts;

async function fetchData() {
  try {
    const response = await fetch('/api/data');
    const meteoData = await response.json();
    return meteoData;
  } catch (error) {
    console.error('Error fetching data:', error);
    return null;
  }
}

function isClockwise(points) {
  let sum = 0;
  for (let i = 0; i < points.length; i++) {
    const p1 = points[i];
    const p2 = points[(i + 1) % points.length];
    sum += (p2.x - p1.x) * (p2.y + p1.y);
  }
  return sum > 0;
}

function getNormal(pPrev, pNext) {
  let dx = pNext.x - pPrev.x;
  let dy = pNext.y - pPrev.y;
  const len = Math.hypot(dx, dy);
  if (len === 0) return { x: 0, y: 0 };
  dx /= len;
  dy /= len;
  return { x: -dy, y: dx };
}

async function setup() {
  createCanvas(windowWidth, windowHeight);

  modW = width / div;
  modH = height / div;

  let geoData = await fetchData();
  if (geoData) {
    windSpeed = geoData.windSpeed;
    windDirection = geoData.windDirection;
    waveHeight = geoData.waveHeight;
    windGusts = geoData.windGusts;
    level = map(waveHeight, -0.2, 1.7, 0, 1);

    console.log('Meteorological data retrieved:', geoData);
  } else {
    console.log('Failed to retrieve meteorological data.');
    level = 0;
  }
}

function draw() {
  background('#0067FF');
  stroke(0)
  // strokeWeight(level * 1000)
  strokeWeight(
    (sin(frameCount * .01) * .5 + .5)
    * 500
  )
  strokeCap(SQUARE)
  strokeJoin(BEVEL)
  noFill()
  
  beginShape()
  vertex(width - modW, height - modH)
  vertex(modW, height - modH)
  vertex(modW, modH)
  vertex(width - modW, modH * div / 2)
  vertex(width - modW, modH)
  endShape()
}
