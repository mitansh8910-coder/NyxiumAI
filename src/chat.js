// --- Core UI Navigation ---
function showView(v) {
  document.querySelectorAll('.view').forEach(x => x.classList.remove('active'));
  document.getElementById(v).classList.add('active');
  if (v === 'chat') showRandomTip();
}

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

// --- AI Chat Logic ---
async function sendToAI() {
  const input = document.getElementById('user-input');
  const chatBox = document.getElementById('chat-messages');
  if (!input.value) return;

  chatBox.innerHTML += `
    <div class="flex gap-4 flex-row-reverse mb-4">
      <div class="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs">👤</div>
      <div class="bg-indigo-600 p-4 rounded-2xl rounded-tr-none max-w-[80%] text-sm">${input.value}</div>
    </div>
  `;

  const userMsg = input.value;
  input.value = '';

  const typingId = "typing-" + Date.now();
  chatBox.innerHTML += `
    <div id="${typingId}" class="flex gap-4 mb-4">
      <div class="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-xs">🤖</div>
      <div class="bg-slate-800 p-4 rounded-2xl rounded-tl-none max-w-[80%] text-sm text-slate-400 italic">Nyxium AI is thinking...</div>
    </div>
  `;
  chatBox.scrollTop = chatBox.scrollHeight;

  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: userMsg })
    });
    const data = await res.json();
    document.getElementById(typingId)?.remove();

    chatBox.innerHTML += `
      <div class="flex gap-4 mb-4">
        <div class="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-xs">🤖</div>
        <div class="bg-slate-800 p-4 rounded-2xl rounded-tl-none max-w-[80%] text-sm">
          <strong class="text-blue-400">Nyxium AI:</strong><br>${data.reply || data.error}
        </div>
      </div>
    `;
  } catch (err) {
    document.getElementById(typingId)?.remove();
    chatBox.innerHTML += `
      <div class="flex gap-4 mb-4">
        <div class="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center text-xs">⚠️</div>
        <div class="bg-slate-800 p-4 rounded-2xl rounded-tl-none max-w-[80%] text-sm text-red-400">Error: ${err.message}</div>
      </div>
    `;
  }
  chatBox.scrollTop = chatBox.scrollHeight;
}
