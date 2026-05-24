// Switch views
function showView(v) {
  document.querySelectorAll('.view').forEach(x => x.classList.remove('active'));
  document.getElementById(v).classList.add('active');
}

// Chat handler with Nyxium AI identity
async function sendToAI() {
  const input = document.getElementById('user-input');
  const chatBox = document.getElementById('chat-messages');
  if (!input.value) return;

  // User message bubble
  chatBox.innerHTML += `
    <div class="flex gap-4 flex-row-reverse">
      <div class="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs">👤</div>
      <div class="bg-indigo-600 p-4 rounded-2xl rounded-tr-none max-w-[80%] text-sm">${input.value}</div>
    </div>
  `;

  const userMsg = input.value;
  input.value = '';

  // Typing indicator
  const typingId = "typing-" + Date.now();
  chatBox.innerHTML += `
    <div id="${typingId}" class="flex gap-4">
      <div class="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-xs">🤖</div>
      <div class="bg-slate-800 p-4 rounded-2xl rounded-tl-none max-w-[80%] text-sm text-slate-400 italic">Nyxium AI is thinking...</div>
    </div>
  `;
  chatBox.scrollTop = chatBox.scrollHeight;

  // Call backend (Vercel function)
  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: userMsg })
    });
    const data = await res.json();

    // Remove typing indicator
    document.getElementById(typingId)?.remove();

    // AI response bubble
    chatBox.innerHTML += `
      <div class="flex gap-4">
        <div class="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-xs">🤖</div>
        <div class="bg-slate-800 p-4 rounded-2xl rounded-tl-none max-w-[80%] text-sm">
          <strong class="text-blue-400">Nyxium AI:</strong><br>
          ${data.reply || data.error}
        </div>
      </div>
    `;
  } catch (err) {
    document.getElementById(typingId)?.remove();
    chatBox.innerHTML += `
      <div class="flex gap-4">
        <div class="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center text-xs">⚠️</div>
        <div class="bg-slate-800 p-4 rounded-2xl rounded-tl-none max-w-[80%] text-sm text-red-400">
          Nyxium AI Error: ${err.message}
        </div>
      </div>
    `;
  }

  chatBox.scrollTop = chatBox.scrollHeight;
}

// Galaxy Mode button
document.getElementById("galaxy-btn").addEventListener("click", () => {
  document.body.classList.toggle("galaxy-mode");
  alert("🌌 Galaxy Mode toggled!");
});

// View Stats button
document.getElementById("stats-btn").addEventListener("click", () => {
  showView("chat"); // Replace with analytics view if you add one
  alert("📊 Opening Analytics Dashboard...");
});
