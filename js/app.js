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

// Water color progression (dirty -> clean). Each entry: {fill, stroke?}
const waterColorStops = [
  { fill:'#7a552d', stroke:'#563c1e' }, // raw
  { fill:'#5d5a3d', stroke:'#42402b' }, // after coag
  { fill:'#4a5d5f', stroke:'#354245' }, // after sedimentation
  { fill:'#3d6a87', stroke:'#27465a' }, // filtration
  { fill:'#2d7bb5', stroke:'#1a5276' }, // disinfection
  { fill:'#2b8bdc', stroke:'#1a5276' }  // distribution (cleanest)
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
// We'll also manage a manual horizontal droplet path to keep droplet under stage.
let manualDropletMode = true;
let shimmerRAF = null;
let shimmerActive = false;
// Droplet stabilization & bobbing
let dropletBasePos = { x: 0, y: 322 }; // baseline y just below pipes
let dropletBobRAF = null;
let dropletMoving = false;
const DROPLET_BOB_PERIOD = 3000; // ms (matches stage pulse 3s)
const DROPLET_BOB_AMPLITUDE = 4; // px vertical travel (peak to center)

function startDropletBob() {
  stopDropletBob();
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReduced) return;
  function bob(t) {
    // Adjust period by speed multiplier so higher speed tightens the bob
    const period = DROPLET_BOB_PERIOD / speedMultiplier;
    const phase = (t % period) / period; // 0..1
    const offsetY = Math.sin(phase * Math.PI * 2) * DROPLET_BOB_AMPLITUDE; // -A..A
    // Only apply bob if not in the middle of a horizontal move
    if (!dropletMoving) {
      droplet.setAttribute('transform', `translate(${dropletBasePos.x}, ${dropletBasePos.y + offsetY})`);
    }
    dropletBobRAF = requestAnimationFrame(bob);
  }
  dropletBobRAF = requestAnimationFrame(bob);
}

function stopDropletBob() {
  if (dropletBobRAF) cancelAnimationFrame(dropletBobRAF);
  dropletBobRAF = null;
}

function init() {
  renderStageNav();
  renderStageContent();
  setupEvents();
  positionDropletAtStage(currentStage);
  generateQuizQuestion();
  initSimulation();
  drawGraphs();
  initSedimentation();
  startShimmer();
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
  if (!manualDropletMode) {
    const length = flowPath.getTotalLength();
    const segment = length / (stages.length - 1);
    const point = flowPath.getPointAtLength(segment * stageIndex);
    dropletBasePos.x = point.x; dropletBasePos.y = point.y;
    droplet.setAttribute('transform', `translate(${dropletBasePos.x}, ${dropletBasePos.y})`);
  } else {
    // Anchor Y near center baseline of pipes (200), slightly below them for clarity
    const stageGroup = document.querySelector(`.stage-block[data-stage="${stageIndex}"] rect`);
    if (stageGroup) {
      const x = parseFloat(stageGroup.getAttribute('x')) + parseFloat(stageGroup.getAttribute('width'))/2;
      const y = 322; // original path y ~320; keep near that baseline
      dropletBasePos.x = x; dropletBasePos.y = y;
      droplet.setAttribute('transform', `translate(${dropletBasePos.x}, ${dropletBasePos.y})`);
    }
  }
  updateDropletColor(stageIndex);
  startDropletBob();
}

function smoothMoveDropletToStage(targetStage) {
  cancelAnimationFrame(dropletAnimationFrame);
  stopDropletBob(); // pause bob during movement
  if (!manualDropletMode) {
    // fallback to original path approach
  }
  // Use stored base position as authoritative starting point
  const match = /translate\(([-0-9.]+),\s*([-0-9.]+)\)/.exec(droplet.getAttribute('transform'));
  let currentPoint = { x: dropletBasePos.x, y: dropletBasePos.y };
  if (match) {
    const parsed = { x: parseFloat(match[1]), y: parseFloat(match[2]) };
    // If parsed differs meaningfully (e.g., during first move) sync base
    if (!Number.isNaN(parsed.x) && !Number.isNaN(parsed.y)) {
      currentPoint = parsed;
      dropletBasePos.x = parsed.x; dropletBasePos.y = parsed.y;
    }
  }
  const targetRect = document.querySelector(`.stage-block[data-stage="${targetStage}"] rect`);
  if (!targetRect) return;
  const targetX = parseFloat(targetRect.getAttribute('x')) + parseFloat(targetRect.getAttribute('width'))/2;
  // Keep a stable Y; if currentPoint.y is 0 (initial load), set baseline once
  const baseY = 322;
  const targetY = manualDropletMode ? baseY : currentPoint.y || baseY;
  const duration = 700 / speedMultiplier;
  const start = performance.now();
  dropletMoving = true;
  droplet.classList.remove('animate-droplet'); // legacy horizontal wiggle; disabled while we manage bob manually
  function animate(t) {
    const progress = Math.min(1, (t-start)/duration);
    const eased = easeInOutCubic(progress);
    const x = currentPoint.x + (targetX - currentPoint.x)*eased;
    const y = currentPoint.y + (targetY - currentPoint.y)*eased;
    droplet.setAttribute('transform', `translate(${x}, ${y})`);
    if (progress < 1) {
      dropletAnimationFrame = requestAnimationFrame(animate);
    } else {
      // store base position & restart bob
      dropletBasePos.x = targetX; dropletBasePos.y = targetY;
      dropletMoving = false;
      // Ensure final snap exactly at base (avoid sub-pixel drift)
      droplet.setAttribute('transform', `translate(${dropletBasePos.x}, ${dropletBasePos.y})`);
      startDropletBob();
    }
  }
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

/* ===================== Sedimentation Particle Animation ====================== */
let sedParticles = [];
let sedAnimating = false;
let sedraf = null;
const SED_STAGE_INDEX = 2;

function initSedimentation() {
  const container = document.getElementById('sedimentParticles');
  if (!container) return;
  // Add linear gradient for basin if not already added
  const svg = document.getElementById('plantDiagram');
  if (svg && !document.getElementById('sedGrad')) {
    const defs = svg.querySelector('defs');
    if (defs) {
      const lg = document.createElementNS('http://www.w3.org/2000/svg','linearGradient');
      lg.setAttribute('id','sedGrad');
      lg.setAttribute('x1','0'); lg.setAttribute('y1','0'); lg.setAttribute('x2','0'); lg.setAttribute('y2','1');
      const stop1 = document.createElementNS('http://www.w3.org/2000/svg','stop');
      stop1.setAttribute('offset','0%'); stop1.setAttribute('stop-color','#e8f2ff');
      const stop2 = document.createElementNS('http://www.w3.org/2000/svg','stop');
      stop2.setAttribute('offset','100%'); stop2.setAttribute('stop-color','#d7e7fa');
      lg.appendChild(stop1); lg.appendChild(stop2); defs.appendChild(lg);
    }
  }

  // Basin dimensions (match rect)
  const basin = { x:380, y:100, w:170, h:220 };
  // particle count dynamically influenced by coag efficiency if available later
  let eff = (simCache && simCache.eff) ? simCache.eff : 0.7; // default mid
  const count = Math.round(18 + eff * 20);
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  sedParticles = [];
  container.innerHTML = '';
  for (let i=0;i<count;i++) {
  const r = 3 + Math.random()* (5 + eff*4); // radius scales slightly with efficiency
    const startX = basin.x + 8 + Math.random()*(basin.w-16);
    const startY = basin.y + 10 + Math.random()* (basin.h*0.35); // start upper portion
    const vx = (Math.random()-0.5)*8; // gentle horizontal drift
    const vy = 8 + Math.random()*14; // downward speed (px per 10s frame baseline)
    const circle = document.createElementNS('http://www.w3.org/2000/svg','circle');
    circle.setAttribute('cx', startX);
    circle.setAttribute('cy', startY);
    circle.setAttribute('r', r);
    circle.classList.add('sed-particle');
    if (r < 6) circle.classList.add('small'); else if (r > 9) circle.classList.add('large');
    container.appendChild(circle);
    sedParticles.push({ el: circle, x:startX, y:startY, r, vx, vy, settled:false, settleDelay: 300 + Math.random()*1200 });
  }
  // Add a thin sludge layer representation
  let sludge = container.querySelector('rect.sludge');
  if (!sludge) {
    sludge = document.createElementNS('http://www.w3.org/2000/svg','rect');
    sludge.classList.add('sludge');
    sludge.setAttribute('x', basin.x+2); sludge.setAttribute('y', basin.y + basin.h - 14);
    sludge.setAttribute('width', basin.w-4); sludge.setAttribute('height', 12);
    sludge.setAttribute('fill', '#b2c0d1'); sludge.setAttribute('opacity','0.4');
    container.appendChild(sludge);
  }
  if (!prefersReduced && currentStage === SED_STAGE_INDEX) startSedAnimation();
  updateSedWaterClarity(eff);
}

function startSedAnimation() {
  if (sedAnimating) return;
  sedAnimating = true;
  let last = performance.now();
  const basinBottom = 100 + 220 - 16; // y bottom inside clip minus sludge layer
  function frame(now) {
    if (!sedAnimating) return;
    const dt = Math.min(100, now - last); // ms
    last = now;
    const speedScale = speedMultiplier; // tie to global speed control
    sedParticles.forEach(p => {
      if (p.settled) return;
      p.y += (p.vy * dt/1000) * speedScale;
      p.x += (p.vx * dt/16000) * speedScale; // slow horizontal drift
      // gentle drag on vx
      p.vx *= 0.995;
      if (p.y >= basinBottom - p.r) {
        p.y = basinBottom - p.r;
        // small random offset over time imitates compression/consolidation
        p.settleDelay -= dt;
        if (p.settleDelay <= 0) {
          p.settled = true;
          p.el.style.opacity = 0.9;
        } else {
          // wobble while settling
          p.x += Math.sin(now/300 + p.r) * 0.2;
        }
      }
      p.el.setAttribute('cx', p.x.toFixed(2));
      p.el.setAttribute('cy', p.y.toFixed(2));
    });
    sedraf = requestAnimationFrame(frame);
  }
  sedraf = requestAnimationFrame(frame);
}

function stopSedAnimation() {
  sedAnimating = false;
  if (sedraf) cancelAnimationFrame(sedraf);
}

function updateSedWaterClarity(eff) {
  // Eff closer to 1 -> clearer (lighter, more bluish)
  const rect = document.querySelector('#stage-sedimentation rect');
  if (!rect) return;
  const baseColor = { r: 226, g: 237, b: 255 }; // original
  // Mix with a murkier tone when low efficiency
  const murk = { r: 170, g: 180, b: 195 };
  const mix = (a,b,t)=> Math.round(a + (b-a)*t);
  const clarity = Math.min(1, eff); // 0.4..1 typical
  const r = mix(murk.r, baseColor.r, clarity);
  const g = mix(murk.g, baseColor.g, clarity);
  const b = mix(murk.b, baseColor.b, clarity);
  rect.setAttribute('fill', `rgb(${r},${g},${b})`);
  // Adjust particle opacity (clearer water -> particles slightly more distinct lower)
  sedParticles.forEach(p=>{ if(p.el) p.el.style.opacity = (0.5 + clarity*0.5); });
}

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
  // Update sedimentation environment if currently on that stage
  if (currentStage === SED_STAGE_INDEX) {
    initSedimentation();
  }
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
  if (i === SED_STAGE_INDEX) {
    // Re-initialize particles each time user returns (fresh batch)
    initSedimentation();
  } else {
    stopSedAnimation();
  }
  animatePipeFromStage(i-1, i);
  updateDropletColor(i);
};

/* ===================== Pipe Animation & Color Evolution ====================== */
function animatePipeFromStage(from, to) {
  if (from < 0 || to <= from) return; // first stage has no incoming pipe
  const pipe = document.querySelector(`.pipe[data-from="${from}"][data-to="${to}"]`);
  if (!pipe) return;
  const water = pipe.querySelector('.pipe-water');
  // Highlight only the active (currently filling) pipe
  document.querySelectorAll('.pipe.active-flow').forEach(p => p.classList.remove('active-flow'));
  pipe.classList.add('active-flow');
  pipe.setAttribute('data-filled','false');
  water.style.width = '0px';
  // Determine duration scaled by speed
  const duration = 900 / speedMultiplier;
  const start = performance.now();
  function step(now) {
    const progress = Math.min(1, (now - start)/duration);
    const eased = easeInOutCubic(progress);
    water.style.width = (30 * eased) + 'px';
    if (progress < 1) {
      if (progress < 0.33) pipe.setAttribute('data-stage-progress','early');
      else if (progress < 0.66) pipe.setAttribute('data-stage-progress','mid');
      else pipe.setAttribute('data-stage-progress','late');
      requestAnimationFrame(step);
    } else {
      pipe.setAttribute('data-filled','true');
      pipe.removeAttribute('data-stage-progress');
      pipe.classList.remove('active-flow'); // remove highlight once complete
    }
  }
  requestAnimationFrame(step);
  // Update water gradient morph (we approximate by blending colors)
  updatePipeWaterColors();
}

function updatePipeWaterColors() {
  // For each pipe already filled, set water color based on 'to' stage index
  document.querySelectorAll('.pipe').forEach(pipe => {
    const to = Number(pipe.getAttribute('data-to'));
    const water = pipe.querySelector('.pipe-water');
    if (!water) return;
    const color = waterColorStops[Math.min(to, waterColorStops.length-1)];
    // Interpolate from dirty to this stage color by to/stages.length
    water.setAttribute('fill', color.fill);
  });
}

function updateDropletColor(stageIndex) {
  const idx = Math.min(stageIndex, waterColorStops.length-1);
  const color = waterColorStops[idx];
  const path = droplet.querySelector('path');
  path.setAttribute('fill', color.fill);
  path.setAttribute('stroke', color.stroke);
}

/* ===================== Shimmer Animation ====================== */
function startShimmer() {
  if (shimmerActive) return;
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReduced) return; // honor accessibility
  shimmerActive = true;
  const mover = document.getElementById('flowMaskMover');
  if (!mover) return;
  let offset = 0;
  function loop(ts) {
    if (!shimmerActive) return;
    offset -= 0.6 * speedMultiplier; // speed tied to global speed
    if (offset <= -40) offset = 0;
    mover.setAttribute('x', offset.toFixed(2));
    shimmerRAF = requestAnimationFrame(loop);
  }
  shimmerRAF = requestAnimationFrame(loop);
}

function stopShimmer() {
  shimmerActive = false;
  if (shimmerRAF) cancelAnimationFrame(shimmerRAF);
}
