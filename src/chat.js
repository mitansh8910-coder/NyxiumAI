let conversationHistory = [];
let isSassy = true;

// Static SVG template: Simplified and robust.
function getMiniNyxSVG(color) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
    <path d="M20 40 L50 20 L80 40 L80 80 L20 80 Z" fill="#1e1b4b" stroke="${color}" stroke-width="6"/>
    <rect x="35" y="45" width="30" height="15" fill="${color}" rx="2"/>
  </svg>`;
}

// Logic: Strictly render once, and only once, when DOM is ready.
function mountMascot() {
  const headerContainer = document.getElementById('ai-face');
  if (headerContainer) {
    headerContainer.innerHTML = getMiniNyxSVG('#38bdf8');
  }
}

// Ensure execution triggers only after full DOM readiness.
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
    <div id="${loadingId}" class="text-xs text-indigo-400/50 italic mb-4 font-mono">System syncing...</div>
  `);

  try {
    const response = await puter.ai.chat(conversationHistory, { model: 'gemini-2.5-flash' });
    document.getElementById(loadingId)?.remove();
    typeOutHumanResponse(response, chatMessages, 'NEUTRAL');
  } catch (error) {
    document.getElementById(loadingId)?.remove();
    let offlineResponse = "System network fluctuating, but I'm here. ";
    offlineResponse += (isSassy && userText.length < 15) ? 
      "I'm running locally since the node is sleepy. Ask me something useful, will ya?" : 
      "Processing locally. My core is active and I'm ready for your complex queries.";
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
  }
}
