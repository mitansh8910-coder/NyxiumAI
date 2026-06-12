// Switch views
function showView(v) {
  document.querySelectorAll('.view').forEach(x => x.classList.remove('active'));
  document.getElementById(v).classList.add('active');
}

// --- NEW: Galaxy Canvas Logic ---
const canvas = document.getElementById('starfield');
const ctx = canvas.getContext('2d');
let stars = [];
let isGalaxyActive = false;

function initStars() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  stars = Array.from({ length: 150 }, () => ({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    size: Math.random() * 1.5,
    speed: Math.random() * 0.5 + 0.1
  }));
}

function animateStars() {
  if (!isGalaxyActive) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = 'white';
  stars.forEach(s => {
    s.y -= s.speed;
    if (s.y < 0) s.y = canvas.height;
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
    ctx.fill();
  });
  requestAnimationFrame(animateStars);
}

// Galaxy Mode button
document.getElementById("galaxy-btn").addEventListener("click", () => {
  isGalaxyActive = !isGalaxyActive;
  document.body.classList.toggle("galaxy-mode");
  if (isGalaxyActive) {
    initStars();
    animateStars();
  } else {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }
});

// --- NEW: Cursor Star Effect ---
document.addEventListener('mousemove', (e) => {
  const star = document.createElement('div');
  star.className = 'cursor-star';
  star.style.left = e.pageX + 'px';
  star.style.top = e.pageY + 'px';
  document.body.appendChild(star);
  setTimeout(() => star.remove(), 800);
});

// Chat handler with Nyxium AI identity
async function sendToAI() {
  const input = document.getElementById('user-input');
  const chatBox = document.getElementById('chat-messages');
  if (!input.value) return;

  chatBox.innerHTML += `
    <div class="flex gap-4 flex-row-reverse">
      <div class="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs">👤</div>
      <div class="bg-indigo-600 p-4 rounded-2xl rounded-tr-none max-w-[80%] text-sm">${input.value}</div>
    </div>
  `;

  const userMsg = input.value;
  input.value = '';

  const typingId = "typing-" + Date.now();
  chatBox.innerHTML += `
    <div id="${typingId}" class="flex gap-4">
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
        <div class="bg-slate-800 p-4 rounded-2xl rounded-tl-none max-w-[80%] text-sm text-red-400">Nyxium AI Error: ${err.message}</div>
      </div>
    `;
  }
  chatBox.scrollTop = chatBox.scrollHeight;
}
