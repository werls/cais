let stepsW = 16;
let stepsH = 5;
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
  font = await loadFont('Roboto-VariableFont_wdth,wght.ttf');

  textAlign(CENTER, CENTER);
  textSize(height * 0.5);
  contours = font.textToContours('CAIS', width/2, height/2, { sampleFactor: 0.1 });
  
  // Classificar cada contorno se é “buraco” ou “externo”
  for (let c of contours) {
    c.isHole = isClockwise(c);
  }

  modW = width / stepsW;
  modH = height / stepsH;

  let geoData = await fetchData();
  if (geoData) {
    windSpeed = geoData.windSpeed;
    windDirection = geoData.windDirection;
    waveHeight = geoData.waveHeight;
    windGusts = geoData.windGusts;
    level = map(waveHeight, -0.2, 1.7, 0, 1);
  } else {
    console.log('Failed to retrieve meteorological data.');
    level = 0;
  }
}

function draw() {
  background('#0067FF');
  fill(0);
  noStroke();

  vel = frameCount * map(windSpeed || 0, 0, 50, 0.01, 0.05);
  const windToDeg = ((windDirection || 0) + 180) % 360;
  const windRad = radians(windToDeg);
  const windX = Math.cos(windRad);
  const speedFactor = map(windSpeed || 0, 0, 50, 0, 1);
  vel *= (1 + windX * speedFactor);

  const bazBaseInflate = 100; // valor base menor para reduzir artefatos
  const inflateAmount = bazBaseInflate * level;

  // **Para debug**: mostrar normais/bisectors
  stroke(255, 0, 0, 100);
  strokeWeight(1);

  for (let c of contours) {
    noFill();
    beginShape();
    for (let j = 0; j < c.length; j++) {
      const prev = c[(j - 1 + c.length) % c.length];
      const curr = c[j];
      const next = c[(j + 1) % c.length];

      const vPrev = { x: curr.x - prev.x, y: curr.y - prev.y };
      const vNext = { x: next.x - curr.x, y: next.y - curr.y };
      const lenPrev = Math.hypot(vPrev.x, vPrev.y);
      const lenNext = Math.hypot(vNext.x, vNext.y);
      if (lenPrev === 0 || lenNext === 0) {
        vertex(curr.x, curr.y);
        continue;
      }
      vPrev.x /= lenPrev; vPrev.y /= lenPrev;
      vNext.x /= lenNext; vNext.y /= lenNext;

      const nPrev = { x: -vPrev.y, y: vPrev.x };
      const nNext = { x: -vNext.y, y: vNext.x };
      let bis = { x: nPrev.x + nNext.x, y: nPrev.y + nNext.y };
      const bisLen = Math.hypot(bis.x, bis.y);
      if (bisLen === 0) {
        bis = { x: nPrev.x, y: nPrev.y };
      } else {
        bis.x /= bisLen; bis.y /= bisLen;
      }

      const correction = 0.9;
      const dir = c.isHole ? -1 : 1;
      const newX = curr.x + bis.x * inflateAmount * dir * correction;
      const newY = curr.y + bis.y * inflateAmount * dir * correction;

      // desenho da normal / bisector para debug
      line(curr.x, curr.y, curr.x + bis.x * 20 * dir, curr.y + bis.y * 20 * dir);

      vertex(newX, newY);
    }
    endShape(CLOSE);
  }

  // Sobrepor o contorno “inflado” preenchido
  noStroke();
  fill(0);
  for (let c of contours) {
    beginShape();
    for (let j = 0; j < c.length; j++) {
      const prev = c[(j - 1 + c.length) % c.length];
      const curr = c[j];
      const next = c[(j + 1) % c.length];

      const vPrev = { x: curr.x - prev.x, y: curr.y - prev.y };
      const vNext = { x: next.x - curr.x, y: next.y - curr.y };
      const lenPrev = Math.hypot(vPrev.x, vPrev.y);
      const lenNext = Math.hypot(vNext.x, vNext.y);
      if (lenPrev === 0 || lenNext === 0) {
        vertex(curr.x, curr.y);
        continue;
      }
      vPrev.x /= lenPrev; vPrev.y /= lenPrev;
      vNext.x /= lenNext; vNext.y /= lenNext;

      const nPrev = { x: -vPrev.y, y: vPrev.x };
      const nNext = { x: -vNext.y, y: vNext.x };
      let bis = { x: nPrev.x + nNext.x, y: nPrev.y + nNext.y };
      const bisLen = Math.hypot(bis.x, bis.y);
      if (bisLen === 0) {
        bis = { x: nPrev.x, y: nPrev.y };
      } else {
        bis.x /= bisLen; bis.y /= bisLen;
      }

      const correction = 0.9;
      const dir = c.isHole ? -1 : 1;
      const newX = curr.x + bis.x * inflateAmount * dir * correction;
      const newY = curr.y + bis.y * inflateAmount * dir * correction;

      vertex(newX, newY);
    }
    endShape(CLOSE);
  }
}
