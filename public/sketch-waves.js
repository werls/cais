let stepsW = 16
let stepsH = 5
let amp = 1
let scl = 4
let modW, modH, vel
let level

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
  fill(0)
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

  for (let j = 0; j < stepsH; j++) {
    // beginShape()
    for (let i = 0; i < stepsW; i++) {
      const x = i * modW
      const y = j * modH + modH

      // y += noise(x) * amp;

      // let n = noise(x, y, frameCount * .01);
      // let n = sin(x / .1 + vel + cos(vel - y / .1));
      const normX = x / width;
      const normY = y / height;

      
      const gusts = map(windGusts, 10, 70, 1, 0);
      const n = sin(normX * scl + vel + cos(normY * scl / gusts)) * .5 + .5;
      // n *= noise(x, y);

      // let rectH = map(n, -1, 1, 0, modH * amp) + modH / 10;
      // let rectH = map(n, -1, 1, 0, modH * level) + modH / 10;
      const rectH = n * modH * level + modH / 10;


      // if (noise(x, y, frameCount * .05) > .5) {
      rect(x, y, modW, - rectH)
      // }



      // push()
      // strokeWeight(1)
      // stroke('red')
      // rect(x, y, modW, rectH)
      // pop()
    }
    // endShape()
  }
}