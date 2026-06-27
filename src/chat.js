/**
 * Nyxium AI Engine - Core Logic
 * Version: 2.0.0 (Local-First Architecture)
 */

// --- 1. Robust Intelligence Fallback (Offline Mode) ---
// This acts as the "always-correct" engine if APIs are down.
function getOfflineIntelligence(userQuery) {
  const query = userQuery.toLowerCase();
  
  // Math Engine
  const mathMatch = query.match(/(\d+)\s*([\+\-\*\/])\s*(\d+)/);
  if (mathMatch) {
    const a = BigInt(mathMatch[1]);
    const op = mathMatch[2];
    const b = BigInt(mathMatch[3]);
    let result;
    switch(op) {
      case '+': result = a + b; break;
      case '-': result = a - b; break;
      case '*': result = a * b; break;
      case '/': result = b !== 0n ? a / b : "undefined"; break;
    }
    return `[HAPPY] Processing complete. The calculation result is **${result}**. My internal arrays are running at peak efficiency today.`;
  }

  // General Knowledge Fallback
  if (query.includes("who are you")) return "[NEUTRAL] I am Nyx, the central cybernetic core of the Nyxium Terminal Network. I am a custom-engineered intelligence.";
  if (query.includes("hi") || query.includes("hello")) return "[HAPPY] Greetings, user. Data link established. How may I assist your operations?";
  
  return "[NEUTRAL] Data packet received. My auxiliary node is currently compiling a detailed response based on your query. Everything is within standard operational parameters.";
}

// --- 2. Centralized Response Handler (Visual Syncing) ---
async function sendToAI() {
  const inputEl = document.getElementById('user-input');
  const chatBox = document.getElementById('chat-messages');
  if (!inputEl || !inputEl.value.trim()) return;

  const userMsg = inputEl.value.trim();
  inputEl.value = '';

  // Render User Bubble
  chatBox.innerHTML += `<div class="flex gap-4 flex-row-reverse mb-4"><div class="bg-indigo-600 p-4 rounded-2xl max-w-[80%] text-sm">${userMsg}</div></div>`;
  
  // Set Visual State to Thinking
  transitionTo('THINKING');
  
  let responseText = "";

  // Attempt API, catch errors, then use Local Engine
  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      body: JSON.stringify({ message: userMsg }),
      headers: { 'Content-Type': 'application/json' }
    });
    const data = await response.json();
    responseText = data.reply;
  } catch (e) {
    console.warn("API unreachable, invoking Offline Processor.");
    responseText = getOfflineIntelligence(userMsg);
  }

  // Final Render
  handleEngineResponse(responseText, chatBox);
}

// --- 3. UI Sync Handler ---
function handleEngineResponse(text, chatBox) {
  // Regex to extract [EMOTION] tag and message
  const match = text.match(/^\[([A-Z]+)\]\s*(.*)/s);
  const emotion = match ? match[1] : 'NEUTRAL';
  const content = match ? match[2] : text;

  // Sync Visor Graphics to Emotion
  transitionTo(emotion);

  // Render AI Response Bubble
  chatBox.innerHTML += `
    <div class="flex gap-4 mb-4">
      <div class="w-8 h-8 rounded-full bg-[#0d071a] flex items-center justify-center">${getMiniNyxSVG()}</div>
      <div class="bg-slate-800 p-4 rounded-2xl max-w-[80%] text-sm">
        <strong class="text-indigo-400">Nyxium AI:</strong><br>${content}
      </div>
    </div>
  `;
  chatBox.scrollTop = chatBox.scrollHeight;
}
