let stepsW = 16
let stepsH = 16
let amp = 1
let scl = 4
let modW, modH, vel
let level
let tileLines = 12;

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

let windSpeed, windDirection, waveHeight, windGusts;

async function setup() {
  createCanvas(windowWidth, windowHeight);

  modW = width / stepsW
  modH = height / stepsH

  let geoData = await fetchData();

  if (geoData) {
    windSpeed = geoData.windSpeed;
    windDirection = geoData.windDirection;
    waveHeight = geoData.waveHeight;
    windGusts = geoData.windGusts;

    level = map(waveHeight, -0.2, 1.7, 0, 1);
    scl = level * 20;

    console.log(`Wind Speed: ${windSpeed} km/h`);
    console.log(`Wind Direction: ${windDirection}°`);
    console.log(`Wave Height: ${waveHeight} m`);
    console.log(`Wind Gusts: ${windGusts} km/h`);
  } else {
    console.log('Failed to retrieve meteorological data.');
  }
}

function draw() {
  background('#0067FF');
  fill(255)
  noStroke()

  vel = frameCount * map(windSpeed, 0, 50, 0.01, 0.05)

  // vel *= map(windDirection, 0, 360, -1, 1);
  const windToDeg = (windDirection + 180) % 360;
  const windRad = radians(windToDeg);            // p5.js radians()
  const windX = Math.cos(windRad);               // -1 = vento indo para a esquerda, +1 = direita

  // fator de intensidade do efeito baseado na velocidade do vento
  const speedFactor = map(windSpeed ?? 0, 0, 50, 0, 1);

  // aplicar: aumenta/diminui e define sinal da velocidade horizontal do padrão
  vel *= (1 + windX * speedFactor);

  modW = width / stepsW
  modH = height / stepsH
  
  for (let j = 0; j < stepsH; j++) {
    for (let i = 0; i < stepsW; i++) {
      let x = i * modW
      let y = j * modH
      
      // let r = floor(noise(x, y, t) * tileLines - 1)
      let r = cos(x / width * scl + 1 * sin(y / height * scl + 1) - vel) * .5 + .5
      // let r = noise(x, y, t) * 2
      
      let tileH = modH / tileLines
      let tileX = x
      let tileY = y + modH * r
      
      fill(255)
      rect(tileX, tileY, modW, tileH)
    } 
  }
}