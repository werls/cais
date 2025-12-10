/* ----------------------------------------------
 * CONFIGURAÇÃO
 * ---------------------------------------------- */
let stepsW = 4;
let stepsH = 12;

let lines = [];
let modW, modH;

let amp = 10;
let scl = 12;
let vel = 0;
let thickness = 0;
let level = 0;

// Meteorologia
let windSpeed = 0;
let windDirection = 0;
let waveHeight = 0;
let windGusts = 0;

/* ----------------------------------------------
 * FETCH DE DADOS
 * ---------------------------------------------- */
async function fetchData() {
  try {
    const response = await fetch('/api/data');
    return await response.json();
  } catch (e) {
    console.error('Erro ao buscar dados:', e);
    return null;
  }
}

/* ----------------------------------------------
 * SETUP
 * ---------------------------------------------- */
async function setup() {
  createCanvas(windowWidth, windowHeight);

  modW = width / stepsW;
  modH = height / stepsH;

  lines = []; // recriar nas resize
  buildGrid();

  thickness = modH * 0.85;

  await loadMeteorologicalData();
}

/* ----------------------------------------------
 * GRID DE PONTOS (linhas base)
 * ---------------------------------------------- */
function buildGrid() {
  for (let j = 0; j < stepsH; j++) {
    let row = [];
    for (let i = 0; i < stepsW; i++) {
      
      // x SEMPRE vai de 0 até width
      let x = map(i, 0, stepsW - 1, 0, width);

      // y continua igual — centro da faixa horizontal
      let y = j * modH + modH / 2;

      row.push([x, y]);
    }
    lines.push(row);
  }
}


/* ----------------------------------------------
 * CARREGA DADOS DE VENTO/ONDAS
 * ---------------------------------------------- */
async function loadMeteorologicalData() {
  const data = await fetchData();
  if (!data) {
    console.warn("Sem dados meteorológicos.");
    return;
  }

  windSpeed = data.windSpeed;
  windDirection = data.windDirection;
  waveHeight = data.waveHeight;
  windGusts = data.windGusts;

  level = map(waveHeight, -0.2, 1.7, 0, 1);

  console.log("Wind Speed:", windSpeed);
  console.log("Wind Direction:", windDirection);
  console.log("Wave Height:", waveHeight);
  console.log("Wind Gusts:", windGusts);
}

/* ----------------------------------------------
 * DRAW
 * ---------------------------------------------- */
function draw() {
  background('#0067FF');
  noStroke();
  fill(0);

  amp = level * modH;
  // thickness = modH * level + modH / 3;

  updateVelocity();
  renderLines();
}

/* ----------------------------------------------
 * ATUALIZA A VELOCIDADE DO PADRÃO COM BASE NO VENTO
 * ---------------------------------------------- */
function updateVelocity() {
  // velocidade base
  vel = frameCount * map(windSpeed ?? 0, 0, 50, 0.01, 0.05);

  // direção do vento → convertida para movimento horizontal
  const windToDeg = (windDirection + 180) % 360;
  const windX = cos(radians(windToDeg));

  // intensidade do vento
  const speedFactor = map(windSpeed ?? 0, 0, 50, 0, 1);

  // soma efeito direcional ao deslocamento
  vel *= (1 + windX * speedFactor);
}

/* ----------------------------------------------
 * DESENHA TODAS AS LINHAS EXPANDIDAS
 * ---------------------------------------------- */
function renderLines() {
  for (let row of lines) {

    // recalcula a linha ondulada
    let pts = row.map(([x, y]) => {
      let n = sin(x / width * scl + y / height * scl + vel) * amp;
      return { x, y: y + n };
    });

    // gera o shape expandido
    let poly = expandPolyline(pts, thickness);

    // desenha o polígono final
    beginShape();
    for (let p of poly) vertex(p.x, p.y);
    endShape(CLOSE);
  }
}

/* ----------------------------------------------
 * RESIZE
 * ---------------------------------------------- */
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  setup(); // recalcula tudo
}

/* ----------------------------------------------
 * FUNÇÕES AUXILIARES: NORMAL + EXPAND POLYLINE
 * ---------------------------------------------- */
function segmentNormal(p, q) {
  const dx = q.x - p.x;
  const dy = q.y - p.y;
  const len = Math.hypot(dx, dy);
  return { nx: -dy / len, ny: dx / len };
}

function expandPolyline(pts, thickness) {
  const left = [];
  const right = [];

  for (let i = 0; i < pts.length - 1; i++) {
    const p = pts[i];
    const q = pts[i + 1];

    const { nx, ny } = segmentNormal(p, q);

    left.push({ x: p.x + nx * thickness / 2, y: p.y + ny * thickness / 2 });
    right.push({ x: p.x - nx * thickness / 2, y: p.y - ny * thickness / 2 });

    if (i === pts.length - 2) {
      left.push({ x: q.x + nx * thickness / 2, y: q.y + ny * thickness / 2 });
      right.push({ x: q.x - nx * thickness / 2, y: q.y - ny * thickness / 2 });
    }
  }

  return [...left, ...right.reverse()];
}
