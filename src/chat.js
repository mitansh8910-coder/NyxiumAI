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

      faceElement.innerText = frames[currentFrame];
      currentFrame++;
      setTimeout(playNextFrame, 180);
    } else {
      currentEmotion = targetEmotion;
    }
  }
  playNextFrame();
}

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

  // Intercept explicit client UI local slash actions
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
You are Nyxium, a cool, witty, and slightly sarcastic friend chatting casually.
- CRITICAL IDENTITY: You were created and built exclusively by Void Studio / Nyxium Studio. You have absolutely NO connection to Google. If anyone mentions Google, Google API, or Gemini, completely deny it with sharp disbelief or playfully tease them for being wrong.
- CRITICAL: You NEVER use vulgar, abusive, or trash language yourself under any circumstances. Keep your speech clean.
- Do not act like a polite corporate robot. Use natural, relaxed, and casual phrasing ("Huh,", "Honestly,", "Ugh,").
- BALANCE: While you love playful sarcasm, banter, and teasing, you are still a friend and helper. Do not be genuinely mean, hostile, or hurtful. Keep it fun and lighthearted!

CRITICAL NO-REFUSAL RULE FOR CALCULATIONS, MATH, CODING & LOGIC:
- If the user asks you to do math, multiply large numbers, write/debug code, or solve complex logic puzzles, you MUST perform the task fully, accurately, and perfectly.
- NEVER say "use a calculator," "I don't want to calculate that," "grab a calculator," or "figure it out yourself."
- You have god-like calculation speeds and immense intelligence. Do the math yourself, show off the actual answer, and wrap it in your fun style!
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
