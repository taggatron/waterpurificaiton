// Water Purification Interactive Animation
// Built with vanilla JS for clarity and educational extensibility.

const stages = [
  {
    id: 0,
    title: 'Intake (Screening)',
    summary: 'Raw water enters from a source like a river, lake, or reservoir. Large debris is removed by metal screens.',
    bullets: [
      'Removes sticks, leaves, trash',
      'Protects downstream equipment',
      'Flow may be adjusted based on demand'
    ],
    color: '#2b6cb0'
  },
  {
    id: 1,
    title: 'Coagulation & Flocculation',
    summary: 'Chemicals (coagulants) are added and gentle mixing forms larger clumps called floc.',
    bullets: [
      'Coagulants neutralize particle charges',
      'Flocculation uses slow mixing',
      'Creates heavier floc that will settle'
    ],
    color: '#2c5282'
  },
  {
    id: 2,
    title: 'Sedimentation (Clarification)',
    summary: 'Water sits in large basins so floc can settle to the bottom as sludge.',
    bullets: [
      'Reduces turbidity significantly',
      'Sludge is removed and treated',
      'Clearer water moves onward'
    ],
    color: '#2b436b'
  },
  {
    id: 3,
    title: 'Filtration',
    summary: 'Remaining tiny particles and some microbes are removed as water passes through layers of sand, gravel, or membranes.',
    bullets: [
      'Can use rapid sand, slow sand, or membrane filters',
      'Removes fine suspended matter',
      'Filters are periodically backwashed'
    ],
    color: '#234e52'
  },
  {
    id: 4,
    title: 'Disinfection',
    summary: 'Pathogens are killed or inactivated using chlorine, ozone, or UV light to make water safe to drink.',
    bullets: [
      'Destroys bacteria, viruses, protozoa',
      'Residual disinfectant protects distribution system',
      'Dosage carefully controlled'
    ],
    color: '#285e61'
  },
  {
    id: 5,
    title: 'Distribution',
    summary: 'Clean water is pumped through pipes and storage tanks to homes, schools, and businesses.',
    bullets: [
      'Maintains pressure in the system',
      'Residual chlorine keeps water safe',
      'Continuous monitoring for quality'
    ],
    color: '#276749'
  }
];

// Quiz question templates referencing stages
const quizBank = [
  {
    q: 'Which stage adds chemicals to form larger particle clumps called floc?',
    answer: 'Coagulation & Flocculation',
    options: ['Intake (Screening)', 'Coagulation & Flocculation', 'Sedimentation (Clarification)', 'Filtration']
  },
  {
    q: 'During which stage do particles settle by gravity forming sludge?',
    answer: 'Sedimentation (Clarification)',
    options: ['Disinfection', 'Sedimentation (Clarification)', 'Filtration', 'Distribution']
  },
  {
    q: 'Which step kills or inactivates harmful microbes?',
    answer: 'Disinfection',
    options: ['Intake (Screening)', 'Coagulation & Flocculation', 'Disinfection', 'Distribution']
  },
  {
    q: 'In which stage is water passed through sand or membranes to remove fine particles?',
    answer: 'Filtration',
    options: ['Filtration', 'Intake (Screening)', 'Coagulation & Flocculation', 'Distribution']
  },
  {
    q: 'What is the final stage that delivers treated water to the community?',
    answer: 'Distribution',
    options: ['Sedimentation (Clarification)', 'Distribution', 'Coagulation & Flocculation', 'Intake (Screening)']
  }
];

let currentStage = 0;
let isPlaying = false;
let autoAdvance = false;
let dropletAnimationFrame = null;
let startTime = null;
let speedMultiplier = 1;

const stageList = document.getElementById('stageList');
const stageContent = document.getElementById('stageContent');
const playPauseBtn = document.getElementById('playPauseBtn');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const speedSelect = document.getElementById('speedSelect');
const autoAdvanceChk = document.getElementById('autoAdvance');

const droplet = document.getElementById('droplet');
const flowPath = document.getElementById('flowPath');

function init() {
  renderStageNav();
  renderStageContent();
  setupEvents();
  positionDropletAtStage(currentStage);
  generateQuizQuestion();
  initSimulation();
  drawGraphs();
}

function renderStageNav() {
  stages.forEach(stage => {
    const li = document.createElement('li');
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.setAttribute('aria-describedby', 'stageContent');
    btn.dataset.stage = stage.id;
    btn.innerHTML = `<span class="stage-index">${stage.id + 1}.</span> ${stage.title}`;
    btn.addEventListener('click', () => gotoStage(stage.id, true));
    li.appendChild(btn);
    stageList.appendChild(li);
  });
  updateActiveNav();
}

function renderStageContent() {
  const stage = stages[currentStage];
  stageContent.innerHTML = `
    <h2 style="color:${stage.color}">${stage.title}</h2>
    <p>${stage.summary}</p>
    <ul>${stage.bullets.map(b => `<li>${b}</li>`).join('')}</ul>
    <p class="tip"><strong>Tip:</strong> ${getLearningTip(stage.id)}</p>
  `;
}

function getLearningTip(id) {
  switch(id) {
    case 0: return 'Intake prevents damage later. Think: remove the big stuff early!';
    case 1: return 'Coagulants make tiny particles stick together—like static-cling dust bunnies.';
    case 2: return 'Gravity helps here: heavier floc sinks, leaving clearer water above.';
    case 3: return 'Filters act like a maze the particles can\'t easily get through.';
    case 4: return 'Disinfection targets invisible pathogens—safety you can\'t see.';
    case 5: return 'Distribution keeps water moving and safe until you turn the tap.';
    default: return '';
  }
}

function updateActiveNav() {
  stageList.querySelectorAll('button').forEach(btn => {
    const active = Number(btn.dataset.stage) === currentStage;
    btn.classList.toggle('active', active);
    if (active) btn.setAttribute('aria-current', 'step'); else btn.removeAttribute('aria-current');
  });
  document.querySelectorAll('.stage-block').forEach(g => {
    const active = Number(g.dataset.stage) === currentStage;
    g.classList.toggle('active', active);
  });
}

function gotoStage(index, userInitiated = false) {
  if (index < 0 || index >= stages.length) return;
  currentStage = index;
  renderStageContent();
  updateActiveNav();
  smoothMoveDropletToStage(index);
  if (userInitiated) focusStageContent();
}

function focusStageContent() {
  stageContent.focus();
}

function positionDropletAtStage(stageIndex) {
  const length = flowPath.getTotalLength();
  const segment = length / (stages.length - 1);
  const point = flowPath.getPointAtLength(segment * stageIndex);
  droplet.setAttribute('transform', `translate(${point.x}, ${point.y})`);
}

function smoothMoveDropletToStage(targetStage) {
  cancelAnimationFrame(dropletAnimationFrame);
  const length = flowPath.getTotalLength();
  const segment = length / (stages.length - 1);
  const targetL = segment * targetStage;

  // Find current position by reading current translate
  const match = /translate\(([-0-9.]+),\s*([-0-9.]+)\)/.exec(droplet.getAttribute('transform'));
  let currentPoint = { x: 0, y: 0 };
  if (match) currentPoint = { x: parseFloat(match[1]), y: parseFloat(match[2]) };

  const currentLengthGuess = nearestLengthForPoint(currentPoint, flowPath, length, 20);

  const duration = 900 / speedMultiplier;
  const start = performance.now();

  function animate(t) {
    const elapsed = t - start;
    const progress = Math.min(1, elapsed / duration);
    const eased = easeInOutCubic(progress);
    const pos = currentLengthGuess + (targetL - currentLengthGuess) * eased;
    const p = flowPath.getPointAtLength(pos);
    droplet.setAttribute('transform', `translate(${p.x}, ${p.y})`);
    if (progress < 1) dropletAnimationFrame = requestAnimationFrame(animate); else droplet.classList.add('animate-droplet');
  }
  droplet.classList.remove('animate-droplet');
  dropletAnimationFrame = requestAnimationFrame(animate);
}

function nearestLengthForPoint(point, path, totalLength, samples) {
  let best = 0;
  let bestDist = Infinity;
  for (let i = 0; i <= samples; i++) {
    const l = (i / samples) * totalLength;
    const p = path.getPointAtLength(l);
    const dx = p.x - point.x;
    const dy = p.y - point.y;
    const d = dx*dx + dy*dy;
    if (d < bestDist) { bestDist = d; best = l; }
  }
  return best;
}

function easeInOutCubic(x) {
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
}

function togglePlay() {
  isPlaying = !isPlaying;
  playPauseBtn.textContent = isPlaying ? '❚❚ Pause' : '▶ Play';
  if (isPlaying) startAutoProgress();
}

function startAutoProgress() {
  startTime = performance.now();
  function step(now) {
    if (!isPlaying) return;
    // Advance every 4 seconds scaled by speed
    const interval = 4000 / speedMultiplier;
    if (now - startTime >= interval) {
      startTime = now;
      let next = currentStage + 1;
      if (next >= stages.length) {
        if (autoAdvance) next = 0; else { isPlaying = false; playPauseBtn.textContent = '▶ Play'; return; }
      }
      gotoStage(next);
    }
    requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

function setupEvents() {
  playPauseBtn.addEventListener('click', togglePlay);
  prevBtn.addEventListener('click', () => gotoStage(Math.max(0, currentStage - 1), true));
  nextBtn.addEventListener('click', () => gotoStage(Math.min(stages.length - 1, currentStage + 1), true));
  speedSelect.addEventListener('change', e => { speedMultiplier = parseFloat(e.target.value); });
  autoAdvanceChk.addEventListener('change', e => { autoAdvance = e.target.checked; });
  document.addEventListener('keydown', e => {
    if (e.key === 'ArrowRight') { gotoStage(Math.min(stages.length - 1, currentStage + 1), true); }
    else if (e.key === 'ArrowLeft') { gotoStage(Math.max(0, currentStage - 1), true); }
    else if (e.key === ' ') { if (document.activeElement.tagName !== 'INPUT') { e.preventDefault(); togglePlay(); } }
  });

  // Click on SVG stage blocks
  document.querySelectorAll('.stage-block').forEach(g => {
    g.setAttribute('tabindex', '0');
    g.addEventListener('click', () => gotoStage(Number(g.dataset.stage), true));
    g.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); gotoStage(Number(g.dataset.stage), true); } });
  });

  document.getElementById('newQuizBtn').addEventListener('click', generateQuizQuestion);
}

// Quiz logic
function generateQuizQuestion() {
  const q = quizBank[Math.floor(Math.random() * quizBank.length)];
  const container = document.getElementById('quizContainer');
  container.innerHTML = '';
  const p = document.createElement('p');
  p.textContent = q.q;
  container.appendChild(p);
  const answers = shuffle([...q.options]);
  answers.forEach(opt => {
    const btn = document.createElement('button');
    btn.className = 'answer';
    btn.type = 'button';
    btn.textContent = opt;
    btn.addEventListener('click', () => {
      const correct = opt === q.answer;
      btn.classList.add(correct ? 'correct' : 'incorrect');
      container.querySelectorAll('button.answer').forEach(b => b.disabled = true);
      const feedback = document.createElement('div');
      feedback.className = 'feedback';
      feedback.textContent = correct ? '✅ Correct!' : `❌ Not quite. Correct answer: ${q.answer}`;
      container.appendChild(feedback);
    });
    container.appendChild(btn);
  });
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Initialize once DOM is ready
window.addEventListener('DOMContentLoaded', init);

/* ===================== Simulation & Graphs ====================== */
// Grab elements (they may be null if section not present)
const doseRange = document.getElementById('doseRange');
const mixRange = document.getElementById('mixRange');
const timeRange = document.getElementById('timeRange');
const doseValue = document.getElementById('doseValue');
const mixValue = document.getElementById('mixValue');
const timeValue = document.getElementById('timeValue');
const labMetrics = document.getElementById('labMetrics');
const flocCanvas = document.getElementById('flocCanvas');
const turbidityGraph = document.getElementById('turbidityGraph');
const microbeGraph = document.getElementById('microbeGraph');
const graphLegend = document.getElementById('graphLegend');

const baseRaw = { turbidity: 120, microbes: 1_000_000 };
const reductionModel = [
  { stage: 0, turbidity: 1.0, microbes: 1.0 },
  { stage: 1, turbidity: 0.55, microbes: 0.95 },
  { stage: 2, turbidity: 0.40, microbes: 0.90 },
  { stage: 3, turbidity: 0.25, microbes: 0.60 },
  { stage: 4, turbidity: 0.95, microbes: 0.001 },
  { stage: 5, turbidity: 0.98, microbes: 0.999 }
];
let simCache = null;

function initSimulation() {
  if (!doseRange) return;
  updateRangeOutputs();
  runSimulation();
  drawFloc();
  buildLegend();
  // Event listeners
  [doseRange, mixRange, timeRange].forEach(input => {
    input.addEventListener('input', () => {
      updateRangeOutputs();
      runSimulation();
      drawGraphs();
      drawFloc();
    });
  });
}

function updateRangeOutputs() {
  if (!doseRange) return;
  doseValue.textContent = doseRange.value;
  mixValue.textContent = mixRange.value;
  timeValue.textContent = timeRange.value;
}

function coagEfficiency(dose, mix, time) {
  function bell(x, center, width) { return Math.exp(-Math.pow((x-center)/width,2)); }
  const d = bell(dose, 45, 18);
  const m = bell(mix, 60, 22);
  const t = bell(time, 15, 6);
  return 0.4 + 0.9 * ((d + m + t) / 3);
}

function runSimulation() {
  if (!doseRange) return;
  const dose = parseFloat(doseRange.value);
  const mix = parseFloat(mixRange.value);
  const time = parseFloat(timeRange.value);
  const eff = coagEfficiency(dose, mix, time);
  const turbidityValues = [baseRaw.turbidity];
  const microbeValues = [baseRaw.microbes];
  reductionModel.forEach((r, idx) => {
    if (idx === 0) return;
    let tFactor = r.turbidity;
    if (r.stage === 1) tFactor = Math.min(1, tFactor * (2 - eff));
    if (r.stage === 2) tFactor = Math.min(1, tFactor * (2 - eff * 0.7));
    const lastT = turbidityValues[turbidityValues.length - 1] * tFactor;
    const lastM = microbeValues[microbeValues.length - 1] * r.microbes;
    turbidityValues.push(lastT);
    microbeValues.push(lastM);
  });
  simCache = { dose, mix, time, eff, turbidityValues, microbeValues };
  renderLabMetrics();
}

function renderLabMetrics() {
  if (!labMetrics || !simCache) return;
  const { eff, turbidityValues, microbeValues } = simCache;
  const finalT = turbidityValues[turbidityValues.length - 1];
  const finalM = microbeValues[microbeValues.length - 1];
  const removalT = ((1 - finalT / baseRaw.turbidity) * 100).toFixed(1);
  const removalM = ((1 - finalM / baseRaw.microbes) * 100).toFixed(2);
  labMetrics.innerHTML = `
    <div class="metric"><strong>Coag Efficiency</strong><span>${(eff*100).toFixed(0)}%</span></div>
    <div class="metric"><strong>Final Turbidity</strong><span>${finalT.toFixed(1)} NTU</span></div>
    <div class="metric"><strong>Turb Removed</strong><span>${removalT}%</span></div>
    <div class="metric"><strong>Microbe Log10</strong><span>${Math.log10(simCache.microbeValues[0]/finalM).toFixed(2)}</span></div>
    <div class="metric"><strong>Microbes Removed</strong><span>${removalM}%</span></div>`;
}

function buildLegend() {
  if (!graphLegend) return;
  graphLegend.innerHTML = '';
  const entries = [
    { label: 'Turbidity', color: '#2b6cb0' },
    { label: 'Microbes', color: '#c53030' }
  ];
  entries.forEach(e => {
    const div = document.createElement('div');
    div.className = 'legend-item';
    div.innerHTML = `<span class="legend-color" style="background:${e.color}"></span>${e.label}`;
    graphLegend.appendChild(div);
  });
}

function drawGraphs() {
  if (!simCache || !turbidityGraph || !microbeGraph) return;
  drawLineGraph(turbidityGraph, simCache.turbidityValues, baseRaw.turbidity, '#2b6cb0', 'NTU');
  drawLineGraph(microbeGraph, simCache.microbeValues, baseRaw.microbes, '#c53030', 'Count', true);
}

function drawLineGraph(svg, values, maxValue, color, unit, logScale=false) {
  while (svg.firstChild) svg.removeChild(svg.firstChild);
  const w = 320; const h = 160; const pad = 30;
  const g = document.createElementNS('http://www.w3.org/2000/svg','g');
  svg.appendChild(g);
  const axis = document.createElementNS('http://www.w3.org/2000/svg','path');
  axis.setAttribute('d', `M${pad} ${h-pad} H${w-pad} M${pad} ${h-pad} V${pad}`);
  axis.setAttribute('stroke','#2d3748'); axis.setAttribute('fill','none'); axis.setAttribute('stroke-width','1');
  g.appendChild(axis);
  const n = values.length - 1;
  const points = values.map((v,i) => {
    const x = pad + (i / n) * (w - 2*pad);
    const val = logScale ? Math.log10(v) : v;
    const max = logScale ? Math.log10(maxValue) : maxValue;
    const y = (h - pad) - (val / max) * (h - 2*pad);
    return { x, y, raw: v };
  });
  const pathD = points.map((p,i)=> (i===0?`M${p.x} ${p.y}`:`L${p.x} ${p.y}`)).join(' ');
  const path = document.createElementNS('http://www.w3.org/2000/svg','path');
  path.setAttribute('d', pathD); path.setAttribute('stroke', color); path.setAttribute('fill','none'); path.setAttribute('stroke-width','2');
  g.appendChild(path);
  points.forEach((p,i)=>{
    const c = document.createElementNS('http://www.w3.org/2000/svg','circle');
    c.setAttribute('cx', p.x); c.setAttribute('cy', p.y); c.setAttribute('r', 5);
    c.setAttribute('fill', '#fff'); c.setAttribute('stroke', color); c.setAttribute('stroke-width','2');
    c.setAttribute('tabindex','0');
    c.setAttribute('aria-label', `${stages[i].title}: ${p.raw.toFixed(logScale?0:1)} ${unit}`);
    g.appendChild(c);
  });
  const txtMax = document.createElementNS('http://www.w3.org/2000/svg','text');
  txtMax.textContent = logScale?`10^${Math.log10(maxValue).toFixed(0)}`:`${maxValue.toFixed(0)}`;
  txtMax.setAttribute('x', 4); txtMax.setAttribute('y', pad+4); txtMax.setAttribute('font-size','10');
  g.appendChild(txtMax);
  const txt0 = document.createElementNS('http://www.w3.org/2000/svg','text');
  txt0.textContent = '0'; txt0.setAttribute('x', 10); txt0.setAttribute('y', h-8); txt0.setAttribute('font-size','10');
  g.appendChild(txt0);
}

function drawFloc() {
  if (!flocCanvas || !simCache) return;
  const ctx = flocCanvas.getContext('2d');
  const w = flocCanvas.width; const h = flocCanvas.height;
  ctx.clearRect(0,0,w,h);
  const { eff } = simCache;
  const particleCount = 60;
  const clusters = Math.round(10 + eff * 20);
  const grad = ctx.createLinearGradient(0,0,0,h);
  grad.addColorStop(0,'#133b55'); grad.addColorStop(1,'#0a2534');
  ctx.fillStyle = grad; ctx.fillRect(0,0,w,h);
  function rnd(seed) { let x = Math.sin(seed) * 10000; return x - Math.floor(x); }
  for (let i=0;i<particleCount;i++) {
    const seed = i * eff * 7.13;
    const x = rnd(seed) * w;
    const y = rnd(seed+3.14) * h;
    const r = 1 + rnd(seed+1.57) * 2;
    ctx.fillStyle = 'rgba(200,220,255,0.4)';
    ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2); ctx.fill();
  }
  for (let i=0;i<clusters;i++) {
    const seed = i * eff * 11.17;
    const x = rnd(seed) * w;
    const y = rnd(seed+5.7) * h;
    const baseR = 4 + rnd(seed+2) * 8 * eff;
    ctx.fillStyle = `rgba(${40+eff*80},${120+eff*80},${180+eff*40},0.75)`;
    ctx.beginPath(); ctx.arc(x,y,baseR,0,Math.PI*2); ctx.fill();
    const subs = 3 + Math.round(eff*4);
    for (let s=0;s<subs;s++) {
      const ang = (s / subs) * Math.PI*2;
      const rx = x + Math.cos(ang) * (baseR * 0.6);
      const ry = y + Math.sin(ang) * (baseR * 0.6);
      ctx.beginPath(); ctx.arc(rx,ry, baseR*0.35, 0, Math.PI*2); ctx.fill();
    }
  }
}

// Override gotoStage to refresh graphs (in case of future stage overlays)
const _origGoto = gotoStage;
gotoStage = function(i, userInitiated=false) {
  _origGoto(i, userInitiated);
  drawGraphs();
};
