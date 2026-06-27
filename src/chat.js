let conversationHistory = [];
let isSassy = true;
let isThinking = false;

// --- SVG Avatar Engine ---
function getMiniNyxSVG(color) {
  return `
    <svg viewBox="0 0 100 100" class="w-6 h-6">
      <defs><filter id="glow"><feGaussianBlur stdDeviation="2.5" result="coloredBlur"/><feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>
      <path d="M20 40 L50 20 L80 40 L80 80 L20 80 Z" fill="#1e1b4b" stroke="${color}" stroke-width="4" filter="url(#glow)"/>
      <rect x="35" y="45" width="30" height="15" fill="${color}" rx="2"/>
    </svg>
  `;
}

// --- Terminal Aesthetic Chat Bubble Engine ---
function typeOutHumanResponse(text, container, emotion = 'NEUTRAL') {
  const uniqueMsgId = "msg-" + Date.now();
  let avatarColor = '#38bdf8'; 
  if (emotion === 'HAPPY') avatarColor = '#22c55e';
  else if (emotion === 'THINKING') avatarColor = '#f59e0b';
  else if (emotion === 'ANGRY') avatarColor = '#ef4444';
  
  container.innerHTML += `
    <div class="flex gap-4 mb-4">
      <div class="w-8 h-8 rounded-full bg-[#0d071a] border border-indigo-500/30 flex items-center justify-center p-0.5 overflow-hidden">
        ${getMiniNyxSVG(avatarColor)}
      </div>
      <div class="bg-[#0f0720]/80 border border-indigo-500/30 backdrop-blur-xl p-4 rounded-2xl rounded-tl-none max-w-[80%] text-sm shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
        <strong class="text-indigo-400 text-[10px] block mb-1 uppercase tracking-widest opacity-80">Nyxium AI Node:</strong>
        <span id="${uniqueMsgId}" class="italic text-gray-200 leading-relaxed font-mono"></span>
      </div>
    </div>
  `;
  
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

  chatMessages.innerHTML += `
    <div class="flex justify-end mb-4">
      <div class="bg-indigo-600/20 border border-indigo-500/50 p-3 rounded-2xl rounded-tr-none max-w-[80%] text-sm text-gray-100">
        ${userText}
      </div>
    </div>
  `;
  input.value = '';
  conversationHistory.push({ role: 'user', content: userText });

  const loadingId = "loading-" + Date.now();
  chatMessages.innerHTML += `
    <div id="${loadingId}" class="text-xs text-indigo-400/50 italic mb-4">Syncing with auxiliary node...</div>
  `;

  // Fallback Logic with 5-second timeout
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await Promise.race([
      puter.ai.chat(conversationHistory, { model: 'gemini-2.5-flash' }),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 5000))
    ]);
    clearTimeout(timeoutId);

    document.getElementById(loadingId)?.remove();
    typeOutHumanResponse(response, chatMessages, 'NEUTRAL');
  } catch (error) {
    document.getElementById(loadingId)?.remove();
    
    // Offline / Fallback Logic
    let offlineResponse = "System network fluctuating, but I'm here. ";
    if (isSassy && userText.length < 15) {
      offlineResponse += "I'm running locally since the node is sleepy. Ask me something useful, will ya?";
    } else {
      offlineResponse += "Processing locally. My core is active and I'm ready for your complex queries.";
    }
    typeOutHumanResponse(offlineResponse, chatMessages, 'THINKING');
  } finally {
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }
}

function executeConsoleCommand(cmd) {
  if (cmd === '/clear') {
    conversationHistory = [];
    document.getElementById('chat-messages').innerHTML = '';
  } else if (cmd === '/toggle-sass') {
    isSassy = !isSassy;
    alert(`Sassy mode: ${isSassy ? 'ON' : 'OFF'}`);
  }
}
