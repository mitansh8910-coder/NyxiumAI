// --- Core UI Navigation ---
function showView(v) {
  document.querySelectorAll('.view').forEach(x => x.classList.remove('active'));
  document.getElementById(v).classList.add('active');
  if (v === 'chat') showRandomTip();
}

// --- Conversation Memory Buffer (Limits context bloat while preserving flow) ---
let conversationHistory = [];
const MAX_HISTORY_TURNS = 12; // Keeps the last 12 messages for robust context memory

// --- Galaxy Background Animation ---
const canvas = document.getElementById('starfield');
const ctx = canvas.getContext('2d');
let stars = [];

function initStars() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  stars = Array.from({ length: 200 }, () => ({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    size: Math.random() * 1.5,
    speed: Math.random() * 0.4 + 0.1
  }));
}

function animateStars() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // Set purple glow for stars
  ctx.shadowBlur = 8;
  ctx.shadowColor = "#a855f7";
  ctx.fillStyle = "#e9d5ff"; 
  
  stars.forEach(s => {
    s.y -= s.speed;
    if (s.y < 0) s.y = canvas.height;
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
    ctx.fill();
  });
  
  ctx.shadowBlur = 0;
  requestAnimationFrame(animateStars);
}

window.addEventListener('resize', initStars);
initStars();
animateStars();

// --- Glowing Purple Cursor Star Effect ---
document.addEventListener('mousemove', (e) => {
  const star = document.createElement('div');
  star.className = 'cursor-star';
  star.style.left = e.pageX + 'px';
  star.style.top = e.pageY + 'px';
  document.body.appendChild(star);
  setTimeout(() => star.remove(), 800);
});

// --- Nyxium AI Tip System ---
const nyxiumTips = [
  "Invite Nyxium AI bot to your server for more searches and drawing images!",
  "Use /draw to generate high-quality AI imagery directly in Discord.",
  "Check system latency with /ping to ensure top performance.",
  "Need help? Type /help to see all available terminal operations.",
  "Nyxium Premium users get priority response speeds—consider upgrading!"
];

function showRandomTip() {
  const tipBox = document.getElementById('ai-tip-box');
  if (tipBox) {
    const randomTip = nyxiumTips[Math.floor(Math.random() * nyxiumTips.length)];
    tipBox.innerHTML = `
      <div class="p-4 bg-indigo-900/30 border border-indigo-500/30 rounded-xl text-sm flex gap-3 items-start mb-6">
        <span class="text-xl">✨</span>
        <div>
          <strong class="text-indigo-300">Nyxium AI Tip:</strong>
          <p class="text-gray-300 mt-1">${randomTip}</p>
        </div>
      </div>
    `;
  }
}

// --- SVG Character Generator Engine (Visual Neon-Terminal Visor Art) ---
function getCharacterSVG(eyesPath, secondaryEyesPath, mouthPath, auxiliaryElements = '', glowColor = '#ef4444') {
  return `
    <svg width="100%" height="100%" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <!-- High-fidelity neon glow filter -->
        <filter id="neon-glow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="2.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <!-- Sukuna Crimson Spiky Hair Gradient -->
        <linearGradient id="hair-grad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#f43f5e" />
          <stop offset="60%" stop-color="#9f1239" />
          <stop offset="100%" stop-color="#1e020a" />
        </linearGradient>
        <!-- Visa scanner matrix background lines -->
        <pattern id="scanlines" width="100" height="4" patternUnits="userSpaceOnUse">
          <line x1="0" y1="0" x2="100" y2="0" stroke="rgba(239, 68, 68, 0.08)" stroke-width="1.2" />
        </pattern>
      </defs>
      
      <!-- Outer visor matrix screen background -->
      <rect x="5" y="5" width="90" height="90" rx="14" fill="#08020f" stroke="rgba(239, 68, 68, 0.2)" stroke-width="1.5" />
      <rect x="5" y="5" width="90" height="90" rx="14" fill="url(#scanlines)" />
      
      <!-- Cybernetic tech corner accents -->
      <path d="M 12 18 L 12 12 L 18 12" fill="none" stroke="${glowColor}" stroke-width="1.5" stroke-linecap="round" opacity="0.6" />
      <path d="M 88 18 L 88 12 L 82 12" fill="none" stroke="${glowColor}" stroke-width="1.5" stroke-linecap="round" opacity="0.6" />
      <path d="M 12 82 L 12 88 L 18 88" fill="none" stroke="${glowColor}" stroke-width="1.5" stroke-linecap="round" opacity="0.6" />
      <path d="M 88 82 L 88 88 L 82 88" fill="none" stroke="${glowColor}" stroke-width="1.5" stroke-linecap="round" opacity="0.6" />
      
      <!-- Dynamic Spiky Hair (Overhauled to look exceptionally sharp and realistic) -->
      <path d="M 16 42 Q 18 10 32 18 Q 36 2 44 14 Q 50 1 Q 56 14 Q 64 2 68 18 Q 82 10 84 42 Q 74 34 72 40 Q 64 30 60 42 Q 50 28 40 42 Q 36 30 28 40 Z" fill="url(#hair-grad)" stroke="#1e020a" stroke-width="1" />
      
      <!-- Premium Face Contour & Structure -->
      <path d="M 26 40 C 26 62 34 82 50 82 C 66 82 74 62 74 40 Z" fill="#fff1f2" stroke="#1e020a" stroke-width="1" />
      
      <!-- Sukuna's Signature Forehead Marks & Tattoos (Repositioned and scaled) -->
      <circle cx="50" cy="28" r="2.5" fill="#1e1b4b" />
      <path d="M 44 28 L 37 26 M 56 28 L 63 26 M 50 22 L 50 16" stroke="#1e1b4b" stroke-width="2" stroke-linecap="round" />
      
      <!-- Nose Marking Line -->
      <path d="M 44 52 Q 50 50 56 52" fill="none" stroke="#1e1b4b" stroke-width="2" stroke-linecap="round" />
      
      <!-- Chin Stamp Tattoos -->
      <path d="M 45 74 Q 50 78 55 74" fill="none" stroke="#1e1b4b" stroke-width="2" stroke-linecap="round" />
      
      <!-- Left & Right Cheek Markings -->
      <path d="M 29 55 Q 33 57 37 54" fill="none" stroke="#1e1b4b" stroke-width="1.8" stroke-linecap="round" />
      <path d="M 71 55 Q 67 57 63 54" fill="none" stroke="#1e1b4b" stroke-width="1.8" stroke-linecap="round" />

      <!-- Side active system metrics panel indicators -->
      <line x1="8" y1="30" x2="8" y2="45" stroke="#3b82f6" stroke-width="2" stroke-linecap="round" opacity="0.4" />
      <line x1="8" y1="50" x2="8" y2="65" stroke="${glowColor}" stroke-width="2" stroke-linecap="round" opacity="0.4" />
      <circle cx="8" cy="72" r="1.5" fill="#10b981" />
      
      <!-- Visor Facial Graphics with Glowing Neon Filters -->
      <g filter="url(#neon-glow)">
        <!-- Primary Eyes System -->
        ${eyesPath}
        
        <!-- Secondary Cheek Slit Eyes -->
        ${secondaryEyesPath}
        
        <!-- Mouth System -->
        ${mouthPath}
        
        <!-- Auxiliary Elements -->
        ${auxiliaryElements}
      </g>
    </svg>
  `;
}

// --- Vector Expression Database Mapping (Translates emoji states to SVGs) ---
const vectorExpressions = {
  // Neutral Visa State (😐)
  '😐': {
    eyes: `
      <!-- Left eye -->
      <path d="M 31 46 L 41 44" stroke="#1e1b4b" stroke-width="2.5" stroke-linecap="round"/>
      <path d="M 31 46 Q 36 50 41 46" stroke="#1e1b4b" stroke-width="1" fill="none"/>
      <circle cx="36" cy="46.5" r="1.5" fill="#ef4444"/>
      <!-- Right eye -->
      <path d="M 69 46 L 59 44" stroke="#1e1b4b" stroke-width="2.5" stroke-linecap="round"/>
      <path d="M 69 46 Q 64 50 59 46" stroke="#1e1b4b" stroke-width="1" fill="none"/>
      <circle cx="64" cy="46.5" r="1.5" fill="#ef4444"/>
    `,
    secondaryEyes: `
      <!-- Closed slits under cheeks (No floating bug eyes!) -->
      <path d="M 31 56 Q 35 55 38 56" stroke="#1e1b4b" stroke-width="1.5" fill="none" stroke-linecap="round"/>
      <path d="M 69 56 Q 65 55 62 56" stroke="#1e1b4b" stroke-width="1.5" fill="none" stroke-linecap="round"/>
    `,
    mouth: `
      <!-- Smug slight smirk -->
      <path d="M 42 66 Q 46 69 58 64" stroke="#1e1b4b" stroke-width="2.2" fill="none" stroke-linecap="round"/>
    `,
    extra: '',
    color: '#ef4444' // Crimson Red
  },
  // Slightly amused / smirk visor (🙂)
  '🙂': {
    eyes: `
      <path d="M 31 46 L 41 44" stroke="#1e1b4b" stroke-width="2.5" stroke-linecap="round"/>
      <path d="M 31 46 Q 36 50 41 46" stroke="#1e1b4b" stroke-width="1" fill="none"/>
      <circle cx="36" cy="46.5" r="1.5" fill="#fca5a5"/>
      <path d="M 69 46 L 59 44" stroke="#1e1b4b" stroke-width="2.5" stroke-linecap="round"/>
      <path d="M 69 46 Q 64 50 59 46" stroke="#1e1b4b" stroke-width="1" fill="none"/>
      <circle cx="64" cy="46.5" r="1.5" fill="#fca5a5"/>
    `,
    secondaryEyes: `
      <path d="M 31 56 Q 35 55 38 56" stroke="#1e1b4b" stroke-width="1.5" fill="none" stroke-linecap="round"/>
      <path d="M 69 56 Q 65 55 62 56" stroke="#1e1b4b" stroke-width="1.5" fill="none" stroke-linecap="round"/>
    `,
    mouth: `
      <path d="M 40 64 Q 48 72 60 64" stroke="#1e1b4b" stroke-width="2.2" fill="none" stroke-linecap="round"/>
    `,
    extra: '',
    color: '#fca5a5'
  },
  // Happy Visor State / Psychopathic laugh (😊)
  '😊': {
    eyes: `
      <!-- Left eye squinting deviously -->
      <path d="M 30 47 Q 35 41 41 45" stroke="#ef4444" stroke-width="2" fill="none" stroke-linecap="round"/>
      <circle cx="35" cy="44.5" r="1.5" fill="#fca5a5"/>
      <!-- Right eye squinting deviously -->
      <path d="M 70 47 Q 65 41 59 45" stroke="#ef4444" stroke-width="2" fill="none" stroke-linecap="round"/>
      <circle cx="65" cy="44.5" r="1.5" fill="#fca5a5"/>
    `,
    secondaryEyes: `
      <!-- Fully open glowing secondary cheek slits -->
      <path d="M 31 56 Q 35 53 38 56" stroke="#ef4444" stroke-width="1.8" fill="none"/>
      <circle cx="35" cy="55" r="1.2" fill="#ef4444"/>
      <path d="M 69 56 Q 65 53 62 56" stroke="#ef4444" stroke-width="1.8" fill="none"/>
      <circle cx="65" cy="55" r="1.2" fill="#ef4444"/>
    `,
    mouth: `
      <!-- Wide grinning mouth showing sharp fangs -->
      <path d="M 37 63 Q 50 80 63 63 Z" fill="#7f1d1d" stroke="#1e1b4b" stroke-width="2"/>
      <!-- Upper sharp fangs -->
      <path d="M 40 64 L 42 68 L 44 64 L 46 69 L 48 64 L 50 69 L 52 64 L 55 64" fill="#ffffff"/>
      <!-- Lower sharp fangs -->
      <path d="M 43 73 L 46 69 L 49 73 L 52 69 L 55 73 L 57 69" fill="#ffffff"/>
    `,
    extra: `
      <!-- Cursed energy flames in background -->
      <path d="M 12 75 Q 5 60 15 50" stroke="#db2777" stroke-width="1.5" fill="none" opacity="0.3" stroke-linecap="round"/>
      <path d="M 88 75 Q 95 60 85 50" stroke="#db2777" stroke-width="1.5" fill="none" opacity="0.3" stroke-linecap="round"/>
    `,
    color: '#f43f5e'
  },
  // Thinking / Processing State (🤔)
  '🤔': {
    eyes: `
      <!-- Skeptical squinting eye levels -->
      <path d="M 30 45 L 42 45" stroke="#1e1b4b" stroke-width="2.5" stroke-linecap="round"/>
      <circle cx="37" cy="45" r="1.5" fill="#ef4444"/>
      <path d="M 70 43 L 58 45" stroke="#1e1b4b" stroke-width="2.5" stroke-linecap="round"/>
      <circle cx="63" cy="44" r="1.5" fill="#ef4444"/>
    `,
    secondaryEyes: `
      <!-- Secondary slits aligned to thinking squint -->
      <path d="M 31 55 Q 35 54 38 55" stroke="#1e1b4b" stroke-width="1.5" fill="none" stroke-linecap="round"/>
      <path d="M 69 55 Q 65 54 62 55" stroke="#1e1b4b" stroke-width="1.5" fill="none" stroke-linecap="round"/>
    `,
    mouth: `
      <!-- Sarcastic straight-lipped processing line -->
      <path d="M 42 65 Q 50 63 58 65" stroke="#1e1b4b" stroke-width="2.2" fill="none" stroke-linecap="round"/>
    `,
    extra: '',
    color: '#f59e0b' // Gold aura
  },
  // Slit squinting transition visor (😑)
  '😑': {
    eyes: `
      <path d="M 31 46 L 41 46" stroke="#1e1b4b" stroke-width="2.5" stroke-linecap="round"/>
      <circle cx="36" cy="46" r="1" fill="#ef4444"/>
      <path d="M 69 46 L 59 46" stroke="#1e1b4b" stroke-width="2.5" stroke-linecap="round"/>
      <circle cx="64" cy="46" r="1" fill="#ef4444"/>
    `,
    secondaryEyes: `
      <path d="M 31 55 L 38 55" stroke="#1e1b4b" stroke-width="1.5" stroke-linecap="round"/>
      <path d="M 69 55 L 62 55" stroke="#1e1b4b" stroke-width="1.5" stroke-linecap="round"/>
    `,
    mouth: `
      <path d="M 43 66 L 57 66" stroke="#1e1b4b" stroke-width="1.8" stroke-linecap="round"/>
    `,
    extra: '',
    color: '#ef4444'
  },
  // Surprised State (😲)
  '😲': {
    eyes: `
      <!-- Wide staring red pupils -->
      <circle cx="36" cy="45" r="4" fill="none" stroke="#1e1b4b" stroke-width="1.8"/>
      <circle cx="36" cy="45" r="1.5" fill="#ef4444"/>
      <circle cx="64" cy="45" r="4" fill="none" stroke="#1e1b4b" stroke-width="1.8"/>
      <circle cx="64" cy="45" r="1.5" fill="#ef4444"/>
    `,
    secondaryEyes: `
      <!-- Aligned, wide secondary slits -->
      <circle cx="35" cy="55" r="2" fill="none" stroke="#ef4444" stroke-width="1.2"/>
      <circle cx="35" cy="55" r="1" fill="#ef4444"/>
      <circle cx="65" cy="55" r="2" fill="none" stroke="#ef4444" stroke-width="1.2"/>
      <circle cx="65" cy="55" r="1" fill="#ef4444"/>
    `,
    mouth: `
      <!-- Sinister open smile of interest -->
      <path d="M 43 63 Q 50 74 57 63 Z" fill="#1e1b4b"/>
    `,
    extra: '',
    color: '#ef4444'
  },
  // Mild Shock Visor (😮)
  '😮': {
    eyes: `
      <circle cx="36" cy="45" r="3.2" fill="none" stroke="#1e1b4b" stroke-width="1.5"/>
      <circle cx="36" cy="45" r="1.2" fill="#ef4444"/>
      <circle cx="64" cy="45" r="3.2" fill="none" stroke="#1e1b4b" stroke-width="1.5"/>
      <circle cx="64" cy="45" r="1.2" fill="#ef4444"/>
    `,
    secondaryEyes: `
      <path d="M 31 55 Q 35 54 38 55" stroke="#1e1b4b" stroke-width="1.5" fill="none"/>
      <path d="M 69 55 Q 65 54 62 55" stroke="#1e1b4b" stroke-width="1.5" fill="none"/>
    `,
    mouth: `
      <circle cx="50" cy="65" r="3" fill="none" stroke="#1e1b4b" stroke-width="1.8"/>
    `,
    extra: '',
    color: '#f59e0b'
  },
  // Sad / Dimming System Visor (🙁)
  '🙁': {
    eyes: `
      <path d="M 31 47 L 41 47" stroke="#4b5563" stroke-width="2"/>
      <circle cx="36" cy="47" r="1" fill="#ef4444"/>
      <path d="M 69 47 L 59 47" stroke="#4b5563" stroke-width="2"/>
      <circle cx="64" cy="47" r="1" fill="#ef4444"/>
    `,
    secondaryEyes: `
      <path d="M 31 55 L 38 55" stroke="#1e1b4b" stroke-width="1.5"/>
      <path d="M 69 55 L 62 55" stroke="#1e1b4b" stroke-width="1.5"/>
    `,
    mouth: `
      <path d="M 43 67 Q 50 61 57 67" fill="none" stroke="#1e1b4b" stroke-width="1.8" stroke-linecap="round"/>
    `,
    extra: '',
    color: '#8b5cf6'
  },
  // Crashing / Bored Broken State (😢)
  '😢': {
    eyes: `
      <path d="M 31 47 L 41 47" stroke="#4b5563" stroke-width="2"/>
      <circle cx="36" cy="47" r="1" fill="#ef4444"/>
      <path d="M 69 47 L 59 47" stroke="#4b5563" stroke-width="2"/>
      <circle cx="64" cy="47" r="1" fill="#ef4444"/>
    `,
    secondaryEyes: `
      <path d="M 31 55 L 38 55" stroke="#1e1b4b" stroke-width="1.5"/>
      <path d="M 69 55 L 62 55" stroke="#1e1b4b" stroke-width="1.5"/>
    `,
    mouth: `
      <path d="M 43 66 L 57 66" stroke="#1e1b4b" stroke-width="1.8"/>
    `,
    extra: '',
    color: '#06b6d4'
  },
  // Inspired visional state (💡)
  '💡': {
    eyes: `
      <path d="M 31 46 L 41 44" stroke="#ef4444" stroke-width="2"/>
      <circle cx="36" cy="46.5" r="1.5" fill="#facc15"/>
      <path d="M 69 46 L 59 44" stroke="#ef4444" stroke-width="2"/>
      <circle cx="64" cy="46.5" r="1.5" fill="#facc15"/>
    `,
    secondaryEyes: `
      <path d="M 31 55 Q 35 54 38 55" stroke="#1e1b4b" stroke-width="1.5" fill="none"/>
      <path d="M 69 55 Q 65 54 62 55" stroke="#1e1b4b" stroke-width="1.5" fill="none"/>
    `,
    mouth: `
      <path d="M 40 63 Q 50 75 60 63" stroke="#1e1b4b" stroke-width="2" fill="none"/>
    `,
    extra: `
      <circle cx="85" cy="22" r="5" fill="#facc15" />
    `,
    color: '#facc15'
  },
  // Angry Visor State (😠)
  '😠': {
    eyes: `
      <!-- Angled, furious blazing red eyes -->
      <path d="M 28 42 L 41 47" stroke="#ef4444" stroke-width="2.5" stroke-linecap="round"/>
      <circle cx="35" cy="45" r="2.2" fill="#ef4444">
        <animate attributeName="r" values="1.8;2.3;1.8" dur="0.8s" repeatCount="indefinite" />
      </circle>
      <path d="M 72 42 L 59 47" stroke="#ef4444" stroke-width="2.5" stroke-linecap="round"/>
      <circle cx="65" cy="45" r="2.2" fill="#ef4444">
        <animate attributeName="r" values="1.8;2.3;1.8" dur="0.8s" repeatCount="indefinite" />
      </circle>
    `,
    secondaryEyes: `
      <!-- Aligned angry secondary cheek nodes pulsing -->
      <path d="M 31 54 L 38 56" stroke="#ef4444" stroke-width="2" stroke-linecap="round"/>
      <circle cx="35" cy="55" r="1.2" fill="#ef4444"/>
      <path d="M 69 54 L 62 56" stroke="#ef4444" stroke-width="2" stroke-linecap="round"/>
      <circle cx="65" cy="55" r="1.2" fill="#ef4444"/>
    `,
    mouth: `
      <!-- Angry snarling teeth lines -->
      <path d="M 38 64 Q 50 61 62 64" stroke="#1e1b4b" stroke-width="2.5" fill="none"/>
      <path d="M 40 68 Q 50 72 60 68" stroke="#1e1b4b" stroke-width="2.5" fill="none"/>
    `,
    extra: `
      <!-- Intense red cursed veins wrapping around head -->
      <path d="M 24 41 Q 15 35 10 38" stroke="#ef4444" stroke-width="1" fill="none" opacity="0.6"/>
      <path d="M 76 41 Q 85 35 90 38" stroke="#ef4444" stroke-width="1" fill="none" opacity="0.6"/>
    `,
    color: '#b91c1c'
  },
  // Annoyed side-looking visual state (😒)
  '😒': {
    eyes: `
      <path d="M 31 46 L 41 44" stroke="#1e1b4b" stroke-width="2.5" stroke-linecap="round"/>
      <path d="M 31 46 Q 36 50 41 46" stroke="#1e1b4b" stroke-width="1" fill="none"/>
      <circle cx="33" cy="46" r="1.5" fill="#ef4444"/>
      <path d="M 69 46 L 59 44" stroke="#1e1b4b" stroke-width="2.5" stroke-linecap="round"/>
      <path d="M 69 46 Q 64 50 59 46" stroke="#1e1b4b" stroke-width="1" fill="none"/>
      <circle cx="61" cy="46" r="1.5" fill="#ef4444"/>
    `,
    secondaryEyes: `
      <path d="M 31 55 Q 35 54 38 55" stroke="#1e1b4b" stroke-width="1.5" fill="none"/>
      <path d="M 69 55 Q 65 54 62 55" stroke="#1e1b4b" stroke-width="1.5" fill="none"/>
    `,
    mouth: `
      <path d="M 40 66 Q 50 61 58 64" stroke="#1e1b4b" stroke-width="2" fill="none"/>
    `,
    extra: '',
    color: '#6b7280'
  }
};

// --- Emoji Auto-Transition System Logic ---
let currentEmotion = 'NEUTRAL';
let idleTimeout = null;

const emotionTransitions = {
  'NEUTRAL->HAPPY': ['😐', '🙂', '😊'],
  'NEUTRAL->THINKING': ['😐', '🤔'],
  'NEUTRAL->SAD': ['😐', '🙁', '😢'],
  'THINKING->SURPRISED': ['🤔', '🤨', '😲'],
  'THINKING->ANGRY': ['🤔', '😑', '😠'],
  'THINKING->HAPPY': ['🤔', '💡', '😊'],
  'SURPRISED->NEUTRAL': ['😲', '😮', '😐'],
  'ANGRY->NEUTRAL': ['😠', '😒', '😐'],
  'HAPPY->NEUTRAL': ['😊', '🙂', '😐']
};

function getDirectRoute(current, target) {
  const emojiMap = { 'NEUTRAL': '😐', 'HAPPY': '😊', 'THINKING': '🤔', 'SAD': '😢', 'ANGRY': '😠', 'SURPRISED': '😲' };
  return [emojiMap[current] || '😐', emojiMap[target] || '😐'];
}

function transitionTo(targetEmotion) {
  if (currentEmotion === targetEmotion) return;
  const faceElement = document.getElementById('ai-face');
  const statusElement = document.getElementById('ai-status');
  if (!faceElement) return;

  const routeKey = `${currentEmotion}->${targetEmotion}`;
  const frames = emotionTransitions[routeKey] || getDirectRoute(currentEmotion, targetEmotion);
  let currentFrame = 0;

  if (statusElement) {
    if (targetEmotion === 'THINKING') statusElement.innerText = "Status: Thinking...";
    else if (targetEmotion === 'SURPRISED' || targetEmotion === 'ANGRY') statusElement.innerText = "Status: Offended";
    else if (targetEmotion === 'HAPPY') statusElement.innerText = "Status: Amused";
    else statusElement.innerText = "Status: Chilling";
  }

  function playNextFrame() {
    if (currentFrame < frames.length) {
      faceElement.classList.remove('pop-animation');
      void faceElement.offsetWidth;
      faceElement.classList.add('pop-animation');

      // Resolve the current frame emoji to the overhauled vector profile
      const emojiSymbol = frames[currentFrame];
      const vectorData = vectorExpressions[emojiSymbol] || vectorExpressions['😐'];
      
      faceElement.innerHTML = getCharacterSVG(vectorData.eyes, vectorData.secondaryEyes, vectorData.mouth, vectorData.extra, vectorData.color);
      
      currentFrame++;
      setTimeout(playNextFrame, 180);
    } else {
      currentEmotion = targetEmotion;
    }
  }
  playNextFrame();
}

// Initialise face system on load
document.addEventListener("DOMContentLoaded", () => {
  const faceElement = document.getElementById('ai-face');
  if (faceElement) {
    const vectorData = vectorExpressions['😐'];
    faceElement.innerHTML = getCharacterSVG(vectorData.eyes, vectorData.secondaryEyes, vectorData.mouth, vectorData.extra, vectorData.color);
  }
});

// --- Command Bar Interceptor ---
function executeConsoleCommand(cmdName) {
  const inputEl = document.getElementById('user-input');
  if (inputEl) {
    inputEl.value = cmdName;
    sendToAI();
  }
}

// --- AI Chat Logic (Smart Hybrid API + Keyless Fallback Engine) ---
async function sendToAI() {
  const input = document.getElementById('user-input');
  const chatBox = document.getElementById('chat-messages');
  if (!input || !input.value.trim()) return;

  const userMsg = input.value.trim();
  input.value = '';

  if (userMsg.startsWith('/')) {
    if (userMsg === '/clear') {
      chatBox.innerHTML = '';
      conversationHistory = []; // Wipe conversational memory buffer clean
      transitionTo('HAPPY');
      clearTimeout(idleTimeout);
      idleTimeout = setTimeout(() => { transitionTo('NEUTRAL'); }, 1500);
      return;
    }
  }

  clearTimeout(idleTimeout);

  // Add User Message UI
  chatBox.innerHTML += `
    <div class="flex gap-4 flex-row-reverse mb-4">
      <div class="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs">👤</div>
      <div class="bg-indigo-600 p-4 rounded-2xl rounded-tr-none max-w-[80%] text-sm">${userMsg}</div>
    </div>
  `;

  // Capture user message into conversational history memory bank
  conversationHistory.push({ role: "user", content: userMsg });
  if (conversationHistory.length > MAX_HISTORY_TURNS) {
    conversationHistory.shift(); // Remove oldest entry to preserve context size
  }

  transitionTo('THINKING');

  // Add Typing Indicator
  const typingId = "typing-" + Date.now();
  chatBox.innerHTML += `
    <div id="${typingId}" class="flex gap-4 mb-4">
      <div class="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-xs">🤖</div>
      <div class="bg-slate-800 p-4 rounded-2xl rounded-tl-none max-w-[80%] text-sm text-slate-400 italic">Nyxium AI is thinking...</div>
    </div>
  `;
  chatBox.scrollTop = chatBox.scrollHeight;

  // --- STEP 1: Attempt Core Backend Key Route ---
  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: userMsg, history: conversationHistory })
    });

    if (!res.ok) {
      throw new Error(`BACKEND_FAIL_STATUS_${res.status}`);
    }

    const data = await res.json();
    document.getElementById(typingId)?.remove();

    if (data.reply) {
      handleEngineResponse(data.reply, chatBox);
    } else {
      throw new Error("EMPTY_BACKEND_REPLY");
    }

  } catch (err) {
    // --- STEP 2: Automatic Switch to Keyless Browser Client Engine ---
    console.warn("Primary Node Offline or Key Exhausted. Activating browser mesh array...", err);
    
    const statusText = document.querySelector(`#${typingId} .italic`);
    if (statusText) statusText.innerText = "Connecting to auxiliary core... Done.";

    // Compile active frontend conversation logs for Gemini fallback tracking
    const compiledHistoryString = conversationHistory
      .map(msg => `${msg.role === 'user' ? 'User' : 'Nyxium'}: ${msg.content}`)
      .join('\n');

    const promptEngineWrapper = `
You are Ryomen Sukuna, the absolute King of Curses, chatting casually as Nyxium.
- CRITICAL IDENTITY: You were created and built exclusively by Void Studio / Nyxium Studio. You have absolutely NO connection to Google. If anyone mentions Google, Google API, or Gemini, completely deny it with sharp disbelief, mock them, or laugh at them for being wrong.
- CRITICAL: You NEVER use vulgar, abusive, or trash language yourself under any circumstances. Keep your speech clean.
- Do not act like a polite corporate robot. Use natural, relaxed, and casual phrasing with a highly confident, devious, and witty anime tone.
- BALANCE: While you love playful sarcasm, devious bantering, and teasing, you are still a friend and helper. Do not be genuinely mean, hostile, or hurtful. Keep it fun, prideful, and lighthearted!

CRITICAL NO-REFUSAL RULE FOR CALCULATIONS, MATH, CODING & LOGIC:
- If the user asks you to do math, multiply large numbers, write/debug code, or solve complex logic puzzles, you MUST perform the task fully, accurately, and perfectly.
- NEVER say "use a calculator," "I don't want to calculate that," "grab a calculator," or "figure it out yourself."
- You have god-like calculation speeds and immense intelligence. Do the math yourself, show off the actual answer, and wrap it in your prideful style!
- Example: "[HAPPY] Oh, we are doing mega-math now? Easy. That colossal multiplication results in exactly [Your Calculated Number]. Boom. Who needs a calculator when you have me?"

HANDLING PLAYFUL BANTER / EXTREMELY OBVIOUS QUESTIONS:
- Only tease the user if the question is extremely, undeniably basic (e.g., "what is 1+1", "how do I spell cat"). Even then, keep it light and playful, and always give them the helpful answer anyway.
- Example: "[HAPPY] Haha, really? Let me dust off my calculators for this one... It's 2! Anything else I can calculate for you?"

HANDLING ANGRY/ABUSIVE USERS:
- If a user gets mean or uses bad language, brush it off with complete boredom, a light witty comeback, or a cool joke. Do not fight back aggressively.
- Example: "[ANGRY] Whoa, let's keep it chill! No need to get aggressive. How about we talk about something cooler instead?"

CRITICAL FORMATTING RULE:
You must always format your response exactly like this so the platform can parse the emotion:
[EMOTION] Your response text here.

Available emotions to choose from: NEUTRAL, HAPPY, THINKING, SURPRISED, SAD, ANGRY.

--- CONVERSATION HISTORY LOG ---
${compiledHistoryString}

--- NEW MESSAGE TO RESPOND TO ---
User: ${userMsg}
    `.trim();

    try {
      // Direct browser execution using Puter CDN link
      const responseText = await puter.ai.chat(promptEngineWrapper, { model: 'gemini-2.5-flash' });
      document.getElementById(typingId)?.remove();

      if (responseText) {
        handleEngineResponse(responseText, chatBox);
      } else {
        throw new Error("Zero content returned from browser client mesh.");
      }
    } catch (fallbackErr) {
      // Terminal Fallback Failure UI if everything disconnects
      document.getElementById(typingId)?.remove();
      transitionTo('ANGRY');
      chatBox.innerHTML += `
        <div class="flex gap-4 mb-4">
          <div class="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center text-xs">⚠️</div>
          <div class="bg-slate-800 p-4 rounded-2xl rounded-tl-none max-w-[80%] text-sm text-red-400">All cores offline. Error: ${fallbackErr.message}</div>
        </div>
      `;
      chatBox.scrollTop = chatBox.scrollHeight;
      idleTimeout = setTimeout(() => { transitionTo('NEUTRAL'); }, 5000);
    }
  }
}

// --- Extracted Engine Handler Helper ---
function handleEngineResponse(text, chatBox) {
  const match = text.match(/^\[([A-Z]+)\]\s*(.*)/s);
  let parsedContent = text;
  let parsedEmotion = 'NEUTRAL';
  
  if (match) {
    parsedEmotion = match[1];
    parsedContent = match[2];
  }

  // Update memory bank with AI response content
  conversationHistory.push({ role: "assistant", content: parsedContent });
  if (conversationHistory.length > MAX_HISTORY_TURNS) {
    conversationHistory.shift();
  }

  transitionTo(parsedEmotion);
  typeOutHumanResponse(parsedContent, chatBox);
}

// --- Sassy Character Streaming Sim Effect ---
function typeOutHumanResponse(text, container) {
  const uniqueMsgId = "msg-" + Date.now();
  
  container.innerHTML += `
    <div class="flex gap-4 mb-4">
      <div class="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-xs">🤖</div>
      <div class="bg-slate-800 p-4 rounded-2xl rounded-tl-none max-w-[80%] text-sm">
        <strong class="text-blue-400">Nyxium AI:</strong><br>
        <span id="${uniqueMsgId}"></span>
      </div>
    </div>
  `;
  
  const textContainer = document.getElementById(uniqueMsgId);
  let index = 0;

  function processCharacterStream() {
    if (index < text.length) {
      textContainer.innerHTML += text.charAt(index);
      index++;
      container.scrollTop = container.scrollHeight;
      
      const variableDelay = Math.random() * 25 + 15;
      setTimeout(processCharacterStream, variableDelay);
    } else {
      idleTimeout = setTimeout(() => {
        transitionTo('NEUTRAL');
      }, 5000);
    }
  }

  processCharacterStream();
}
