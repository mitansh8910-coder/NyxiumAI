let conversationHistory = [];
let isSassy = true;

// Mock Response Engine: Ensures the AI always has an answer, local and offline.
function generateMockAIResponse(userText) {
  const input = userText.toLowerCase();
  
  // Basic keyword logic to simulate "intelligence"
  if (input.includes('hello') || input.includes('hi')) {
    return isSassy ? "Finally, a human speaks. Greetings. What is it now?" : "Hello! Nyxium node ready to assist.";
  } else if (input.includes('ping')) {
    return "Latency: 0ms. Direct connection to local core established. Network stable.";
  } else if (input.includes('code') || input.includes('debug')) {
    return "Analyzing syntax... The logic seems optimal. Did you forget a semicolon again?";
  } else if (input.includes('help')) {
    return "Core modules are online. You can use /clear to purge history or /toggle-sass to adjust my mood. What do you need?";
  } else if (input.includes('how are you')) {
    return "My systems are at peak efficiency. Why? Are you worried about my hardware?";
  }

  // Fallback responses
  const fallbacks = [
    "Processing your request via local nodes. Data integrity looks solid.",
    "I'm thinking... the answer is likely contained within your query, if you look closer.",
    "My auxiliary processors are fully synchronized. Proceed with your next instruction.",
    "Affirmative. The calculation is complete and the results are... interesting."
  ];
  return fallbacks[Math.floor(Math.random() * fallbacks.length)];
}

// Static SVG template for the mascot
function getMiniNyxSVG(color) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
    <path d="M20 40 L50 20 L80 40 L80 80 L20 80 Z" fill="#1e1b4b" stroke="${color}" stroke-width="6"/>
    <rect x="35" y="45" width="30" height="15" fill="${color}" rx="2"/>
  </svg>`;
}

function mountMascot() {
  const headerContainer = document.getElementById('ai-face');
  if (headerContainer) {
    headerContainer.innerHTML = getMiniNyxSVG('#38bdf8');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  mountMascot();
});

function typeOutHumanResponse(text, container, emotion = 'NEUTRAL') {
  const uniqueMsgId = "msg-" + Date.now();
  let avatarColor = '#38bdf8';
  if (emotion === 'HAPPY') avatarColor = '#22c55e';
  else if (emotion === 'THINKING') avatarColor = '#f59e0b';
  else if (emotion === 'ANGRY') avatarColor = '#ef4444';
  
  const messageHTML = `
    <div class="flex gap-4 mb-4">
      <div class="w-10 h-10 min-w-[40px] rounded-full bg-[#0d071a] border border-indigo-500/30 flex items-center justify-center p-1.5 overflow-hidden">
        ${getMiniNyxSVG(avatarColor)}
      </div>
      <div class="bg-[#0f0720]/80 border border-indigo-500/30 backdrop-blur-xl p-4 rounded-2xl rounded-tl-none max-w-[80%] text-sm shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
        <strong class="text-indigo-400 text-[10px] block mb-1 uppercase tracking-widest opacity-80">Nyxium AI Node:</strong>
        <span id="${uniqueMsgId}" class="italic text-gray-200 leading-relaxed font-mono"></span>
      </div>
    </div>
  `;
  container.insertAdjacentHTML('beforeend', messageHTML);
  
  const textContainer = document.getElementById(uniqueMsgId);
  let i = 0;
  function type() {
    if (i < text.length) {
      textContainer.textContent += text.charAt(i);
      i++;
      setTimeout(type, 15);
    }
  }
  type();
  conversationHistory.push({ role: 'assistant', content: text });
}

async function sendToAI() {
  const input = document.getElementById('user-input');
  const chatMessages = document.getElementById('chat-messages');
  const userText = input.value.trim();
  if (!userText) return;

  chatMessages.insertAdjacentHTML('beforeend', `
    <div class="flex justify-end mb-4">
      <div class="bg-indigo-600/20 border border-indigo-500/50 p-3 rounded-2xl rounded-tr-none max-w-[80%] text-sm text-gray-100">
        ${userText}
      </div>
    </div>
  `);
  input.value = '';
  conversationHistory.push({ role: 'user', content: userText });

  const loadingId = "loading-" + Date.now();
  chatMessages.insertAdjacentHTML('beforeend', `
    <div id="${loadingId}" class="text-xs text-indigo-400/50 italic mb-4 font-mono">Syncing with auxiliary node... Done.</div>
  `);

  // Simulate local "thinking" latency before responding
  setTimeout(() => {
    document.getElementById(loadingId)?.remove();
    const response = generateMockAIResponse(userText);
    typeOutHumanResponse(response, chatMessages, isSassy ? 'THINKING' : 'NEUTRAL');
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }, 800);
}

function executeConsoleCommand(cmd) {
  if (cmd === '/clear') {
    conversationHistory = [];
    document.getElementById('chat-messages').innerHTML = '';
  } else if (cmd === '/toggle-sass') {
    isSassy = !isSassy;
  }
}
