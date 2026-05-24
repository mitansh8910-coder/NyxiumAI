// Switch views
function showView(v) {
  document.querySelectorAll('.view').forEach(x => x.classList.remove('active'));
  document.getElementById(v).classList.add('active');
}

// Chat handler with Nyxium AI identity
async function sendToAI() {
  const input = document.getElementById('user-input');
  const chatBox = document.getElementById('chat-messages');
  if(!input.value) return;

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

  // Call backend
  try {
    const res = await fetch('/api/chat', { 
      method: 'POST', 
      headers: {'Content-Type': 'application/json'}, 
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
          ${marked.parse(data.reply || data.error)}
        </div>
      </div>
    `;

    // Extra tip message
    chatBox.innerHTML += `
      <div class="flex gap-4">
        <div class="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center text-xs">✨</div>
        <div class="bg-slate-800 p-4 rounded-2xl rounded-tl-none max-w-[80%] text-sm">
          <strong class="text-purple-400">Nyxium AI Tip:</strong><br>
          Try <code>/draw</code> for cosmic art or <code>/ask</code> for instant answers!
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
// Starfield animation
const canvas = document.getElementById("starfield");
const ctx = canvas.getContext("2d");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

window.addEventListener("resize", () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
});

class Star {
  constructor() { this.reset(); }
  reset() {
    this.x = Math.random() * canvas.width;
    this.y = Math.random() * canvas.height;
    this.size = Math.random() * 2;
    this.speed = 0.2 + Math.random() * 0.8;
    this.opacity = 0.2 + Math.random() * 0.8;
  }
  update() {
    this.y += this.speed;
    if (this.y > canvas.height) {
      this.reset();
      this.y = 0;
    }
  }
  draw() {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255,255,255,${this.opacity})`;
    ctx.fill();
  }
}

const stars = Array.from({ length: 300 }, () => new Star());

// Shooting stars
function createShootingStar() {
  const x = Math.random() * canvas.width;
  const y = Math.random() * canvas.height / 2;
  const length = 200;
  const speed = 8;

  let posX = x, posY = y;

  function draw() {
    ctx.strokeStyle = "rgba(255,255,255,0.8)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(posX, posY);
    ctx.lineTo(posX - length, posY + length/2);
    ctx.stroke();
  }

  function update() {
    posX -= speed;
    posY += speed/2;
  }

  function animateStar() {
    update();
    draw();
    if (posX > -length && posY < canvas.height + length) {
      requestAnimationFrame(animateStar);
    }
  }
  animateStar();
}
setInterval(() => {
  if (Math.random() < 0.3) createShootingStar();
}, 4000);

// Nebula pulse
let pulse = 0;
function animate() {
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  pulse = (pulse + 0.01) % 1;
  const gradient = ctx.createRadialGradient(
    canvas.width/2, canvas.height/2, 0,
    canvas.width/2, canvas.height/2, canvas.width
  );
  gradient.addColorStop(0, `rgba(120,0,180,${0.2 + 0.2*Math.sin(pulse*2*Math.PI)})`);
  gradient.addColorStop(1, "rgba(0,0,0,0.9)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  stars.forEach(star => { star.update(); star.draw(); });
  requestAnimationFrame(animate);
}
animate();
// Star cursor movement + twinkle
const starCursor = document.getElementById("star-cursor");
document.addEventListener("mousemove", (e) => {
  starCursor.style.left = e.pageX + "px";
  starCursor.style.top = e.pageY + "px";
});

setInterval(() => {
  starCursor.style.transform = "translate(-50%, -50%) scale(1.2)";
  setTimeout(() => {
    starCursor.style.transform = "translate(-50%, -50%) scale(1)";
  }, 150);
}, 1000);

// Sparkle trail effect with color-shifting sparkles
const trailContainer = document.createElement("div");
document.body.appendChild(trailContainer);

let lastX = 0, lastY = 0, lastTime = Date.now();
const sparkleColors = [
  "radial-gradient(circle, #fff, #9d4edd)", // purple
  "radial-gradient(circle, #fff, #4361ee)", // blue
  "radial-gradient(circle, #fff, #4cc9f0)"  // cyan
];

function createSparkle(x, y) {
  const sparkle = document.createElement("div");
  sparkle.style.position = "fixed";
  sparkle.style.left = x + "px";
  sparkle.style.top = y + "px";
  sparkle.style.width = "6px";
  sparkle.style.height = "6px";
  sparkle.style.borderRadius = "50%";
  sparkle.style.background = sparkleColors[Math.floor(Math.random()*sparkleColors.length)];
  sparkle.style.boxShadow = "0 0 6px #c77dff, 0 0 12px #9d4edd";
  sparkle.style.pointerEvents = "none";
  sparkle.style.zIndex = "9998";
  trailContainer.appendChild(sparkle);

  sparkle.animate(
    [
      { opacity: 1, transform: "scale(1)" },
      { opacity: 0, transform: "scale(0.5)" }
    ],
    { duration: 600, easing: "ease-out" }
  ).onfinish = () => sparkle.remove();
}

document.addEventListener("mousemove", (e) => {
  const now = Date.now();
  const dx = e.pageX - lastX;
  const dy = e.pageY - lastY;
  const dt = now - lastTime;

  const speed = Math.sqrt(dx*dx + dy*dy) / dt;
  const sparkleCount = Math.min(5, Math.max(1, Math.floor(speed * 3)));

  for (let i = 0; i < sparkleCount; i++) {
    const offsetX = e.pageX + (Math.random() - 0.5) * 10;
    const offsetY = e.pageY + (Math.random() - 0.5) * 10;
    createSparkle(offsetX, offsetY);
  }

  lastX = e.pageX;
  lastY = e.pageY;
  lastTime = now;
});
// Planet orbit effect
const planets = [
  { radius: 80, size: 12, color: "#9d4edd", speed: 0.01 },   // purple planet
  { radius: 140, size: 16, color: "#4361ee", speed: 0.008 }, // blue planet
  { radius: 200, size: 20, color: "#4cc9f0", speed: 0.006 }  // cyan planet (Saturn-like)
];

let angle = 0;

function drawPlanets() {
  planets.forEach((planet, i) => {
    const x = canvas.width/2 + planet.radius * Math.cos(angle * planet.speed * (i+1));
    const y = canvas.height/2 + planet.radius * Math.sin(angle * planet.speed * (i+1));

    // Planet body
    ctx.beginPath();
    ctx.arc(x, y, planet.size, 0, Math.PI * 2);
    ctx.fillStyle = planet.color;
    ctx.shadowColor = planet.color;
    ctx.shadowBlur = 20;
    ctx.fill();

    // Saturn-style ring for the last planet
    if (i === 2) {
      ctx.beginPath();
      ctx.ellipse(x, y, planet.size * 2.5, planet.size * 1.2, angle/50, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(200,200,255,0.6)";
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  });

  angle += 1;
}

// Extend animate loop to include planets + rings
function animate() {
  // Clear background
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Nebula pulse
  pulse = (pulse + 0.01) % 1;
  const gradient = ctx.createRadialGradient(
    canvas.width/2, canvas.height/2, 0,
    canvas.width/2, canvas.height/2, canvas.width
  );
  gradient.addColorStop(0, `rgba(120,0,180,${0.2 + 0.2*Math.sin(pulse*2*Math.PI)})`);
  gradient.addColorStop(1, "rgba(0,0,0,0.9)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Stars
  stars.forEach(star => { star.update(); star.draw(); });

  // Planets + Saturn ring
  drawPlanets();

  // Shooting stars run independently via setInterval → no need to call here

  requestAnimationFrame(animate);
}
animate();
