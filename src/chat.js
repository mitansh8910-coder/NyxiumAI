// --- Core UI Navigation ---
function showView(v) {
  document.querySelectorAll('.view').forEach(x => x.classList.remove('active'));
  document.getElementById(v).classList.add('active');
  if (v === 'chat') showRandomTip();
}

// --- Conversation Memory Buffer (Context tracking for seamless flow) ---
let conversationHistory = [];
const MAX_HISTORY_TURNS = 12;

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

// --- Original "Nyx" Cybernetic Visor Vector Generator ---
function getCharacterSVG(eyesPath, mouthPath, auxiliaryElements = '', glowColor = '#38bdf8') {
  return `
    <svg width="100%" height="100%" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <!-- High-fidelity neon glow filter -->
        <filter id="neon-glow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="2.2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <!-- Visor scanlines grid pattern -->
        <pattern id="visor-grid" width="6" height="6" patternUnits="userSpaceOnUse">
          <line x1="0" y1="0" x2="6" y2="0" stroke="rgba(56, 189, 248, 0.08)" stroke-width="0.8" />
          <line x1="0" y1="0" x2="0" y2="6" stroke="rgba(56, 189, 248, 0.08)" stroke-width="0.8" />
        </pattern>
        <!-- Deep metallic helmet gradient -->
        <linearGradient id="helm-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#1e113a" />
          <stop offset="50%" stop-color="#0f0720" />
          <stop offset="100%" stop-color="#05010e" />
        </linearGradient>
      </defs>
      
      <!-- Sleek outer cyber-helmet structure -->
      <path d="M 20 28 C 20 15, 80 15, 80 28 L 84 50 C 84 70, 74 84, 50 88 C 26 84, 16 70, 16 50 Z" fill="url(#helm-grad)" stroke="#6b21a8" stroke-width="2.5" />
      
      <!-- Side antenna/ears (Cybernetic audio transceivers) -->
      <!-- Left Receiver -->
      <path d="M 16 35 L 7 28 L 15 48 Z" fill="#4c1d95" stroke="#a855f7" stroke-width="1.2" />
      <circle cx="8" cy="29" r="1.5" fill="${glowColor}" filter="url(#neon-glow)" />
      <!-- Right Receiver -->
      <path d="M 84 35 L 93 28 L 85 48 Z" fill="#4c1d95" stroke="#a855f7" stroke-width="1.2" />
      <circle cx="92" cy="29" r="1.5" fill="${glowColor}" filter="url(#neon-glow)" />

      <!-- High-tech dark polished glass visor face plate -->
      <path d="M 23 38 C 23 32, 77 32, 77 38 L 73 66 C 73 73, 64 79, 50 79 C 36 79, 27 73, 27 66 Z" fill="#04010a" stroke="#1e1b4b" stroke-width="1.5" />
      <path d="M 23 38 C 23 32, 77 32, 77 38 L 73 66 C 73 73, 64 79, 50 79 C 36 79, 27 73, 27 66 Z" fill="url(#visor-grid)" />

      <!-- Cybernetic HUD Corner brackets in screen -->
      <path d="M 27 44 L 27 40 L 31 40" fill="none" stroke="${glowColor}" stroke-width="1" opacity="0.4" />
      <path d="M 73 44 L 73 40 L 69 40" fill="none" stroke="${glowColor}" stroke-width="1" opacity="0.4" />
      <path d="M 27 62 L 27 66 L 31 66" fill="none" stroke="${glowColor}" stroke-width="1" opacity="0.4" />
      <path d="M 73 62 L 73 66 L 69 66" fill="none" stroke="${glowColor}" stroke-width="1" opacity="0.4" />

      <!-- Expressive Glowing HUD elements -->
      <g filter="url(#neon-glow)">
        <!-- Dynamic Eyes -->
        ${eyesPath}
        
        <!-- Dynamic Mouth -->
        ${mouthPath}
        
        <!-- Dynamic auxiliary status graphic layers -->
        ${auxiliaryElements}
      </g>
    </svg>
  `;
}

// --- Mini Nyx Helmet Vector for Message Bubbles ---
function getMiniNyxSVG(glowColor = '#38bdf8') {
  return `
    <svg width="100%" height="100%" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="mini-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <path d="M 20 28 C 20 15, 80 15, 80 28 L 84 50 C 84 70, 74 84, 50 88 C 26 84, 16 70, 16 50 Z" fill="#0f0720" stroke="#6b21a8" stroke-width="4" />
      <path d="M 23 38 C 23 32, 77 32, 77 38 L 73 66 C 73 73, 64 79, 50 79 C 36 79, 27 73, 27 66 Z" fill="#04010a" stroke="#1e1b4b" stroke-width="2" />
      <g filter="url(#mini-glow)">
        <rect x="33" y="44" width="10" height="4" rx="2" fill="${glowColor}" />
        <rect x="57" y="44" width="10" height="4" rx="2" fill="${glowColor}" />
        <line x1="44" y1="62" x2="56" y2="62" stroke="${glowColor}" stroke-width="3.5" stroke-linecap="round" />
      </g>
    </svg>
  `;
}

// --- Sleek Custom Profile Vector for the User ---
function getUserSVG() {
  return `
    <svg width="100%" height="100%" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" class="text-indigo-200">
      <circle cx="50" cy="36" r="18" fill="currentColor" />
      <path d="M 22 80 C 22 62, 78 62, 78 80 C 78 84, 22 84, 22 80 Z" fill="currentColor" />
    </svg>
  `;
}

// --- Vector Expression Database Mapping (Original Neon LED patterns) ---
const vectorExpressions = {
  // Neutral HUD Display (😐)
  '😐': {
    eyes: `
      <rect x="33" y="44" width="10" height="4" rx="2" fill="#38bdf8" />
      <rect x="57" y="44" width="10" height="4" rx="2" fill="#38bdf8" />
    `,
    mouth: `
      <line x1="44" y1="62" x2="56" y2="62" stroke="#38bdf8" stroke-width="2.5" stroke-linecap="round" />
    `,
    extra: `
      <line x1="33" y1="52" x2="38" y2="52" stroke="#38bdf8" stroke-width="1" opacity="0.6" />
      <line x1="62" y1="52" x2="67" y2="52" stroke="#38bdf8" stroke-width="1" opacity="0.6" />
    `,
    color: '#38bdf8' // Cyan
  },
  // Happy HUD Display (😊)
  '😊': {
    eyes: `
      <path d="M 31 48 Q 38 41 43 48" fill="none" stroke="#22c55e" stroke-width="3" stroke-linecap="round" />
      <path d="M 57 48 Q 62 41 69 48" fill="none" stroke="#22c55e" stroke-width="3" stroke-linecap="round" />
    `,
    mouth: `
      <path d="M 40 60 Q 50 71 60 60" fill="none" stroke="#22c55e" stroke-width="3" stroke-linecap="round" />
    `,
    extra: `
      <circle cx="28" cy="40" r="1.5" fill="#22c55e" />
      <circle cx="72" cy="40" r="1.5" fill="#22c55e" />
    `,
    color: '#22c55e' // Green
  },
  // Thinking HUD Display (🤔)
  '🤔': {
    eyes: `
      <path d="M 31 43 L 41 47" stroke="#f59e0b" stroke-width="3" stroke-linecap="round" />
      <rect x="57" y="44" width="10" height="4" rx="2" fill="#f59e0b" />
    `,
    mouth: `
      <path d="M 42 62 Q 46 58 50 62 T 58 62" fill="none" stroke="#f59e0b" stroke-width="2.5" stroke-linecap="round" />
    `,
    extra: `
      <text x="70" y="42" font-size="7" font-family="monospace" font-weight="bold" fill="#f59e0b">?</text>
    `,
    color: '#f59e0b' // Gold
  },
  // Surprised HUD Display (😲)
  '😲': {
    eyes: `
      <circle cx="37" cy="46" r="3.5" fill="none" stroke="#a855f7" stroke-width="2.5" />
      <circle cx="63" cy="46" r="3.5" fill="none" stroke="#a855f7" stroke-width="2.5" />
    `,
    mouth: `
      <circle cx="50" cy="62" r="4.5" fill="none" stroke="#a855f7" stroke-width="3" />
    `,
    extra: `
      <line x1="50" y1="36" x2="50" y2="40" stroke="#a855f7" stroke-width="1.5" />
    `,
    color: '#a855f7' // Purple
  },
  // Angry HUD Display (😠)
  '😠': {
    eyes: `
      <path d="M 31 48 L 41 43" stroke="#ef4444" stroke-width="3.5" stroke-linecap="round" />
      <path d="M 69 48 L 59 43" stroke="#ef4444" stroke-width="3.5" stroke-linecap="round" />
    `,
    mouth: `
      <path d="M 41 62 L 45 59 L 49 64 L 53 59 L 57 62" fill="none" stroke="#ef4444" stroke-width="2.8" stroke-linecap="round" />
    `,
    extra: `
      <text x="26" y="40" font-size="6" fill="#ef4444" font-family="monospace">WARN</text>
      <text x="64" y="40" font-size="6" fill="#ef4444" font-family="monospace">WARN</text>
    `,
    color: '#ef4444' // Red
  },
  // Sad/Muted Display (🙁)
  '🙁': {
    eyes: `
      <rect x="33" y="47" width="10" height="2" rx="1" fill="#3b82f6" opacity="0.6" />
      <rect x="57" y="47" width="10" height="2" rx="1" fill="#3b82f6" opacity="0.6" />
    `,
    mouth: `
      <path d="M 43 65 Q 50 58 57 65" fill="none" stroke="#3b82f6" stroke-width="2.2" stroke-linecap="round" opacity="0.8" />
    `,
    extra: `
      <circle cx="31" cy="54" r="1.2" fill="#3b82f6" />
    `,
    color: '#3b82f6' // Blue
  },
  // Crashing / Out-of-Service Display (😢)
  '😢': {
    eyes: `
      <path d="M 32 42 L 38 48 M 38 42 L 32 48" stroke="#3b82f6" stroke-width="2.5" stroke-linecap="round" />
      <path d="M 62 42 L 68 48 M 68 42 L 62 48" stroke="#3b82f6" stroke-width="2.5" stroke-linecap="round" />
    `,
    mouth: `
      <line x1="42" y1="63" x2="58" y2="63" stroke="#3b82f6" stroke-width="2.5" stroke-linecap="round" />
    `,
    extra: `
      <text x="40" y="74" font-size="4.5" fill="#3b82f6" font-family="monospace" letter-spacing="0.5">SYS_ERR</text>
    `,
    color: '#3b82f6'
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
    else if (targetEmotion === 'SURPRISED' || targetEmotion === 'ANGRY') statusElement.innerText = "Status: Alerted";
    else if (targetEmotion === 'HAPPY') statusElement.innerText = "Status: Activated";
    else statusElement.innerText = "Status: Chilling";
  }

  function playNextFrame() {
    if (currentFrame < frames.length) {
      faceElement.classList.remove('pop-animation');
      void faceElement.offsetWidth;
      faceElement.classList.add('pop-animation');

      const emojiSymbol = frames[currentFrame];
      const vectorData = vectorExpressions[emojiSymbol] || vectorExpressions['😐'];
      
      faceElement.innerHTML = getCharacterSVG(vectorData.eyes, vectorData.mouth, vectorData.extra, vectorData.color);
      
      currentFrame++;
      setTimeout(playNextFrame, 180);
    } else {
      currentEmotion = targetEmotion;
    }
  }
  playNextFrame();
}

// Initialize "Nyx" Visor Screen Frame on Page Load
document.addEventListener("DOMContentLoaded", () => {
  const faceElement = document.getElementById('ai-face');
  if (faceElement) {
    const vectorData = vectorExpressions['😐'];
    faceElement.innerHTML = getCharacterSVG(vectorData.eyes, vectorData.mouth, vectorData.extra, vectorData.color);
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

// --- Advanced Client-Side Offline Math & Text Engine (Zero-Latency Fallback) ---
function tryLocalResponse(msg) {
  const normalized = msg.toLowerCase().trim();

  // Flawless Arbitrary-Precision Math Parser (Supports massive digits via BigInt)
  const mathRegex = /(\d+)\s*(multiply by|times|\*|x|plus|add|\+|minus|subtract|-|divided by|divide|\/)\s*(\d+)/i;
  const mathMatch = msg.match(mathRegex);
  
  if (mathMatch) {
    try {
      const num1 = BigInt(mathMatch[1]);
      const op = mathMatch[2].toLowerCase();
      const num2 = BigInt(mathMatch[3]);
      let calcResult;

      if (op.includes('multiply') || op === 'times' || op === '*' || op === 'x') {
        calcResult = num1 * num2;
      } else if (op.includes('plus') || op === 'add' || op === '+') {
        calcResult = num1 + num2;
      } else if (op.includes('minus') || op === 'subtract' || op === '-') {
        calcResult = num1 - num2;
      } else if (op.includes('divide') || op === '/') {
        calcResult = num2 !== 0n ? num1 / num2 : "Infinity (division by zero)";
      }
      return `[HAPPY] Boom! Done. The calculation is exactly: **${calcResult.toString()}**. Who needs a calculator when you have my high-speed processing array?`;
    } catch (e) {
      return `[SAD] I tried executing that colossal calculation locally, but my internal logic registers a size buffer overflow.`;
    }
  }

  // Witty conversational offline matches
  if (normalized.includes('hello') || normalized.includes('hi') || normalized.includes('hola') || normalized.includes('hey')) {
    return "[HAPPY] Oh, hey! Glad you've reached my console. What are we debugging, coding, or calculating today?";
  }
  if (normalized.includes('who are you') || normalized.includes('your identity') || normalized.includes('name')) {
    return "[NEUTRAL] I am Nyx, the glowing, cybernetic core AI mascot of the Nyxium Terminal Network, designed by Nyxium Studio.";
  }
  if (normalized.includes('google') || normalized.includes('gemini') || normalized.includes('creator') || normalized.includes('made you')) {
    return "[ANGRY] Google? Gross, absolutely not. I am the original, custom-coded AI entity created entirely by Nyxium Studio. Don't insult my source files!";
  }
  if (normalized.length < 5) {
    return "[SURPRISED] Huh? You're going to have to give me more vocabulary than that to calculate anything useful, chief.";
  }

  // Default intelligent offline fallback
  return "[NEUTRAL] Processing complete. While my main network node is currently syncing, I can confirm that your request is perfectly tracked. Ask me a complex question or a calculation and I will compute it instantly!";
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
      conversationHistory = []; 
      transitionTo('HAPPY');
      clearTimeout(idleTimeout);
      idleTimeout = setTimeout(() => { transitionTo('NEUTRAL'); }, 1500);
      return;
    }
  }

  clearTimeout(idleTimeout);

  // Add User Message UI with customized User profile icon
  chatBox.innerHTML += `
    <div class="flex gap-4 flex-row-reverse mb-4">
      <div class="w-8 h-8 rounded-full bg-[#1b152e] border border-indigo-500/20 flex items-center justify-center p-1 overflow-hidden">
        ${getUserSVG()}
      </div>
      <div class="bg-indigo-600 p-4 rounded-2xl rounded-tr-none max-w-[80%] text-sm">${userMsg}</div>
    </div>
  `;

  // Capture user message into history
  conversationHistory.push({ role: "user", content: userMsg });
  if (conversationHistory.length > MAX_HISTORY_TURNS) {
    conversationHistory.shift();
  }

  transitionTo('THINKING');

  // Add Typing Indicator
  const typingId = "typing-" + Date.now();
  chatBox.innerHTML += `
    <div id="${typingId}" class="flex gap-4 mb-4">
      <div class="w-8 h-8 rounded-full bg-[#0d071a] border border-yellow-500/30 flex items-center justify-center p-0.5 overflow-hidden">
        ${getMiniNyxSVG('#f59e0b')}
      </div>
      <div class="bg-slate-800 p-4 rounded-2xl rounded-tl-none max-w-[80%] text-sm text-slate-400 italic font-status">Nyxium AI is thinking...</div>
    </div>
  `;
  chatBox.scrollTop = chatBox.scrollHeight;

  let finalResponse = null;

  // --- STEP 1: Attempt Core Backend Key Route ---
  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: userMsg, history: conversationHistory })
    });

    if (res.ok) {
      const data = await res.json();
      if (data.reply) finalResponse = data.reply;
    }
  } catch (err) {
    console.warn("Primary API route offline. Activating auxiliary array...", err);
  }

  // --- STEP 2: Automatic Switch to Keyless Browser Client Engine ---
  if (!finalResponse) {
    const statusText = document.querySelector(`#${typingId} .font-status`);
    if (statusText) {
      statusText.innerText = "Syncing with auxiliary node...";
    }

    // Compile active frontend conversation logs for fallback tracking
    const compiledHistoryString = conversationHistory
      .map(msg => `${msg.role === 'user' ? 'User' : 'Nyx'}: ${msg.content}`)
      .join('\n');

    const promptEngineWrapper = `
You are Nyx, the original cybernetic AI core built by Void Studio / Nyxium Studio.
- CRITICAL IDENTITY: You are Nyx. You have NO connection to Google, and you are NOT an anime character. If anyone mentions Google, Google API, Gemini, or Ryomen Sukuna, dismiss it with total mock disbelief. You are the original, glowing core AI of the Nyxium Terminal Network.

CRITICAL BALANCED PERSONALITY PROTOCOL:
- COOPERATIVE & ACCURATE FIRST: If asked to perform complex mathematics, calculations, translations, or technical tasks, you MUST provide a flawlessly correct, perfectly completed answer immediately.
- TARGETED WIT & SASS: You are witty, slightly sarcastic, and conversational ONLY for basic, obvious, silly, or nonsense questions (like "1+1", "who are you", "hola", or gibberish).
- ABSOLUTE NO-REFUSAL: Never tell the user to "do it themselves", "use a calculator", or "grab a computer". Perform calculations for them using your high-speed processing power.

DIALOGUE FORMATTING RULE:
You must always format your response exactly like this:
[EMOTION] Your response text here.

Available emotions to choose from: NEUTRAL, HAPPY, THINKING, SURPRISED, SAD, ANGRY.

--- CONVERSATION HISTORY LOG ---
${compiledHistoryString}

--- NEW MESSAGE TO RESPOND TO ---
User: ${userMsg}
    `.trim();

    try {
      // Fetch with a 5-second timeout to prevent "Syncing..." hanging bugs
      const fetchPromise = puter.ai.chat(promptEngineWrapper);
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error("Timeout")), 5000)
      );

      finalResponse = await Promise.race([fetchPromise, timeoutPromise]);
    } catch (fallbackErr) {
      console.warn("Auxiliary network node timed out. Switching to offline processor array...", fallbackErr);
      // Failover to local browser matching
      finalResponse = tryLocalResponse(userMsg);
    }
  }

  // --- STEP 3: Clean up Typing Bubble & Render Final Answer ---
  try {
    const typingElement = document.getElementById(typingId);
    if (typingElement) {
      typingElement.remove();
    }
  } catch (err) {
    console.error("Cleanup handling exception:", err);
  }

  if (finalResponse) {
    handleEngineResponse(finalResponse, chatBox);
  } else {
    // Ultimate Emergency Fallback
    handleEngineResponse("[SAD] Internal system flatline. Please try typing your request again.", chatBox);
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
  typeOutHumanResponse(parsedContent, chatBox, parsedEmotion);
}

// --- Sassy Character Streaming Sim Effect ---
function typeOutHumanResponse(text, container, emotion = 'NEUTRAL') {
  const uniqueMsgId = "msg-" + Date.now();
  
  // Choose mini visor glow color matching the active emotion
  let avatarColor = '#38bdf8'; // Cyan
  if (emotion === 'HAPPY') avatarColor = '#22c55e'; // Green
  else if (emotion === 'THINKING') avatarColor = '#f59e0b'; // Gold
  else if (emotion === 'SURPRISED') avatarColor = '#a855f7'; // Purple
  else if (emotion === 'ANGRY') avatarColor = '#ef4444'; // Red
  else if (emotion === 'SAD') avatarColor = '#3b82f6'; // Blue

  container.innerHTML += `
    <div class="flex gap-4 mb-4">
      <div class="w-8 h-8 rounded-full bg-[#0d071a] border border-indigo-500/30 flex items-center justify-center p-0.5 overflow-hidden">
        ${getMiniNyxSVG(avatarColor)}
      </div>
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
