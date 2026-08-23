/* ============================================================
   NYXIUM AI — CHAT ENGINE
   Modern chat UI + memory + commands + emotions + fallback AI
   ============================================================ */

"use strict";

/* ------------------------------------------------------------
   GLOBAL STATE
------------------------------------------------------------ */

let conversationHistory = [];
const MAX_HISTORY_TURNS = 16;

let currentEmotion = "NEUTRAL";
let idleTimeout = null;
let isGenerating = false;

const emotionColors = {
    NEUTRAL: "#38bdf8",
    HAPPY: "#22c55e",
    THINKING: "#f59e0b",
    SURPRISED: "#a855f7",
    SAD: "#3b82f6",
    ANGRY: "#ef4444"
};

/* ------------------------------------------------------------
   NAVIGATION
------------------------------------------------------------ */

function showView(viewId) {
    document.querySelectorAll(".view").forEach(view => {
        view.classList.remove("active");
    });

    const target = document.getElementById(viewId);

    if (target) {
        target.classList.add("active");
    }

    if (viewId === "chat") {
        showRandomTip();
        setTimeout(() => {
            const input = document.getElementById("user-input");
            if (input) input.focus();
        }, 100);
    }
}

/* ------------------------------------------------------------
   STARFIELD
------------------------------------------------------------ */

const canvas = document.getElementById("starfield");
const ctx = canvas ? canvas.getContext("2d") : null;

let stars = [];

function initStars() {
    if (!canvas || !ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const count = Math.min(
        180,
        Math.max(80, Math.floor((window.innerWidth * window.innerHeight) / 9000))
    );

    stars = Array.from({ length: count }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        radius: Math.random() * 1.4 + 0.2,
        speed: Math.random() * 0.35 + 0.08,
        opacity: Math.random() * 0.7 + 0.2,
        phase: Math.random() * Math.PI * 2
    }));
}

function animateStars(time = 0) {
    if (!canvas || !ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    stars.forEach(star => {
        star.y -= star.speed;

        if (star.y < -5) {
            star.y = canvas.height + 5;
            star.x = Math.random() * canvas.width;
        }

        const pulse =
            star.opacity +
            Math.sin(time * 0.0015 + star.phase) * 0.15;

        ctx.beginPath();
        ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);

        ctx.fillStyle = `rgba(216,180,254,${Math.max(
            0.08,
            Math.min(1, pulse)
        )})`;

        ctx.shadowBlur = 7;
        ctx.shadowColor = "#a855f7";
        ctx.fill();
    });

    ctx.shadowBlur = 0;

    requestAnimationFrame(animateStars);
}

window.addEventListener("resize", initStars);

initStars();
animateStars();

/* ------------------------------------------------------------
   CUSTOM CURSOR PARTICLES
------------------------------------------------------------ */

let lastCursorParticle = 0;

document.addEventListener("mousemove", event => {
    if (window.innerWidth < 700) return;

    const now = performance.now();

    if (now - lastCursorParticle < 35) return;
    lastCursorParticle = now;

    const star = document.createElement("div");
    star.className = "cursor-star";

    star.style.left = `${event.pageX}px`;
    star.style.top = `${event.pageY}px`;

    document.body.appendChild(star);

    setTimeout(() => {
        star.remove();
    }, 800);
});

/* ------------------------------------------------------------
   TIPS
------------------------------------------------------------ */

const nyxiumTips = [
    "Ask Nyxium AI to explain code, solve problems, brainstorm ideas, or help with projects.",
    "Use /clear whenever you want to start a completely fresh conversation.",
    "Nyxium AI keeps recent conversation context so follow-up questions feel natural.",
    "Try asking something complex — Nyxium AI can work through multi-step problems.",
    "You can press Enter to send a message instantly.",
    "Need a quick answer? Ask directly instead of using a command."
];

function showRandomTip() {
    const tipBox = document.getElementById("ai-tip-box");

    if (!tipBox) return;

    const tip =
        nyxiumTips[Math.floor(Math.random() * nyxiumTips.length)];

    tipBox.innerHTML = `
        <div class="nyx-tip">
            <div class="nyx-tip-icon">✦</div>
            <div>
                <div class="nyx-tip-title">Nyxium AI Tip</div>
                <div class="nyx-tip-text">${escapeHTML(tip)}</div>
            </div>
        </div>
    `;
}

/* ------------------------------------------------------------
   ESCAPE HTML
------------------------------------------------------------ */

function escapeHTML(value) {
    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

/* ------------------------------------------------------------
   MARKDOWN-LIKE MESSAGE FORMATTER
------------------------------------------------------------ */

function formatAIText(text) {
    let safe = escapeHTML(text);

    // Code blocks
    safe = safe.replace(
        /```([\s\S]*?)```/g,
        '<pre class="nyx-code"><code>$1</code></pre>'
    );

    // Inline code
    safe = safe.replace(
        /`([^`\n]+)`/g,
        '<code class="nyx-inline-code">$1</code>'
    );

    // Bold
    safe = safe.replace(
        /\*\*(.*?)\*\*/g,
        "<strong>$1</strong>"
    );

    // Italic
    safe = safe.replace(
        /\*([^*\n]+)\*/g,
        "<em>$1</em>"
    );

    // Headings
    safe = safe.replace(
        /^### (.*)$/gm,
        '<div class="nyx-heading nyx-heading-3">$1</div>'
    );

    safe = safe.replace(
        /^## (.*)$/gm,
        '<div class="nyx-heading nyx-heading-2">$1</div>'
    );

    safe = safe.replace(
        /^# (.*)$/gm,
        '<div class="nyx-heading nyx-heading-1">$1</div>'
    );

    // Bullet points
    safe = safe.replace(
        /^[-•] (.*)$/gm,
        '<div class="nyx-list-item"><span>•</span><span>$1</span></div>'
    );

    // Numbered points
    safe = safe.replace(
        /^(\d+)\. (.*)$/gm,
        '<div class="nyx-list-item"><span>$1.</span><span>$2</span></div>'
    );

    // New lines
    safe = safe.replace(/\n/g, "<br>");

    return safe;
}

/* ------------------------------------------------------------
   NYXIUM AI AVATAR
------------------------------------------------------------ */

function getCharacterSVG(
    eyesPath,
    mouthPath,
    auxiliaryElements = "",
    glowColor = "#38bdf8"
) {
    return `
    <svg
        width="100%"
        height="100%"
        viewBox="0 0 100 100"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="Nyxium AI"
    >
        <defs>

            <filter id="nyxGlow">
                <feGaussianBlur
                    stdDeviation="2.2"
                    result="blur"
                />
                <feMerge>
                    <feMergeNode in="blur"/>
                    <feMergeNode in="SourceGraphic"/>
                </feMerge>
            </filter>

            <linearGradient
                id="helmetGradient"
                x1="0%"
                y1="0%"
                x2="100%"
                y2="100%"
            >
                <stop offset="0%" stop-color="#271344"/>
                <stop offset="50%" stop-color="#10071f"/>
                <stop offset="100%" stop-color="#040108"/>
            </linearGradient>

            <linearGradient
                id="visorGradient"
                x1="0%"
                y1="0%"
                x2="0%"
                y2="100%"
            >
                <stop offset="0%" stop-color="#090514"/>
                <stop offset="100%" stop-color="#020106"/>
            </linearGradient>

            <pattern
                id="scanGrid"
                width="6"
                height="6"
                patternUnits="userSpaceOnUse"
            >
                <line
                    x1="0"
                    y1="0"
                    x2="6"
                    y2="0"
                    stroke="${glowColor}"
                    stroke-width="0.35"
                    opacity="0.12"
                />
                <line
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="6"
                    stroke="${glowColor}"
                    stroke-width="0.35"
                    opacity="0.12"
                />
            </pattern>

        </defs>

        <!-- helmet -->
        <path
            d="M20 28
               C20 15 80 15 80 28
               L84 50
               C84 70 74 84 50 88
               C26 84 16 70 16 50Z"
            fill="url(#helmetGradient)"
            stroke="#7c3aed"
            stroke-width="2"
        />

        <!-- side modules -->
        <path
            d="M16 35 L7 28 L15 48Z"
            fill="#4c1d95"
            stroke="${glowColor}"
            stroke-width="1"
        />

        <path
            d="M84 35 L93 28 L85 48Z"
            fill="#4c1d95"
            stroke="${glowColor}"
            stroke-width="1"
        />

        <circle
            cx="8"
            cy="29"
            r="1.5"
            fill="${glowColor}"
            filter="url(#nyxGlow)"
        />

        <circle
            cx="92"
            cy="29"
            r="1.5"
            fill="${glowColor}"
            filter="url(#nyxGlow)"
        />

        <!-- visor -->
        <path
            d="M23 38
               C23 32 77 32 77 38
               L73 66
               C73 73 64 79 50 79
               C36 79 27 73 27 66Z"
            fill="url(#visorGradient)"
            stroke="#312e81"
            stroke-width="1.5"
        />

        <path
            d="M23 38
               C23 32 77 32 77 38
               L73 66
               C73 73 64 79 50 79
               C36 79 27 73 27 66Z"
            fill="url(#scanGrid)"
        />

        <!-- HUD brackets -->

        <g
            stroke="${glowColor}"
            stroke-width="1"
            opacity="0.45"
        >
            <path d="M27 44V40H31"/>
            <path d="M73 44V40H69"/>
            <path d="M27 62V66H31"/>
            <path d="M73 62V66H69"/>
        </g>

        <!-- expression -->

        <g filter="url(#nyxGlow)">
            ${eyesPath}
            ${mouthPath}
            ${auxiliaryElements}
        </g>

    </svg>
    `;
}

/* ------------------------------------------------------------
   MINI AVATAR
------------------------------------------------------------ */

function getMiniNyxSVG(glowColor = "#38bdf8") {
    return `
    <svg
        width="100%"
        height="100%"
        viewBox="0 0 100 100"
        xmlns="http://www.w3.org/2000/svg"
    >

        <defs>
            <filter id="miniNyxGlow">
                <feGaussianBlur
                    stdDeviation="2"
                    result="blur"
                />
                <feMerge>
                    <feMergeNode in="blur"/>
                    <feMergeNode in="SourceGraphic"/>
                </feMerge>
            </filter>
        </defs>

        <path
            d="M20 28
               C20 15 80 15 80 28
               L84 50
               C84 70 74 84 50 88
               C26 84 16 70 16 50Z"
            fill="#0f0720"
            stroke="#7c3aed"
            stroke-width="4"
        />

        <path
            d="M23 38
               C23 32 77 32 77 38
               L73 66
               C73 73 64 79 50 79
               C36 79 27 73 27 66Z"
            fill="#030107"
            stroke="#312e81"
            stroke-width="2"
        />

        <g filter="url(#miniNyxGlow)">
            <rect
                x="33"
                y="44"
                width="10"
                height="4"
                rx="2"
                fill="${glowColor}"
            />

            <rect
                x="57"
                y="44"
                width="10"
                height="4"
                rx="2"
                fill="${glowColor}"
            />

            <line
                x1="44"
                y1="62"
                x2="56"
                y2="62"
                stroke="${glowColor}"
                stroke-width="3"
                stroke-linecap="round"
            />
        </g>

    </svg>
    `;
}

/* ------------------------------------------------------------
   USER AVATAR
------------------------------------------------------------ */

function getUserSVG() {
    return `
    <svg
        width="100%"
        height="100%"
        viewBox="0 0 100 100"
        xmlns="http://www.w3.org/2000/svg"
    >
        <circle
            cx="50"
            cy="35"
            r="17"
            fill="#c4b5fd"
        />

        <path
            d="M22 82
               C22 63 78 63 78 82
               Z"
            fill="#c4b5fd"
        />
    </svg>
    `;
}

/* ------------------------------------------------------------
   EXPRESSIONS
------------------------------------------------------------ */

const vectorExpressions = {

    "😐": {
        eyes: `
            <rect
                x="33"
                y="44"
                width="10"
                height="4"
                rx="2"
                fill="#38bdf8"
            />

            <rect
                x="57"
                y="44"
                width="10"
                height="4"
                rx="2"
                fill="#38bdf8"
            />
        `,

        mouth: `
            <line
                x1="44"
                y1="62"
                x2="56"
                y2="62"
                stroke="#38bdf8"
                stroke-width="2.5"
                stroke-linecap="round"
            />
        `,

        extra: "",
        color: "#38bdf8"
    },

    "😊": {
        eyes: `
            <path
                d="M31 48 Q38 41 43 48"
                fill="none"
                stroke="#22c55e"
                stroke-width="3"
                stroke-linecap="round"
            />

            <path
                d="M57 48 Q62 41 69 48"
                fill="none"
                stroke="#22c55e"
                stroke-width="3"
                stroke-linecap="round"
            />
        `,

        mouth: `
            <path
                d="M40 60 Q50 71 60 60"
                fill="none"
                stroke="#22c55e"
                stroke-width="3"
                stroke-linecap="round"
            />
        `,

        extra: `
            <circle
                cx="28"
                cy="40"
                r="1.5"
                fill="#22c55e"
            />

            <circle
                cx="72"
                cy="40"
                r="1.5"
                fill="#22c55e"
            />
        `,

        color: "#22c55e"
    },

    "🤔": {
        eyes: `
            <path
                d="M31 43 L41 47"
                stroke="#f59e0b"
                stroke-width="3"
                stroke-linecap="round"
            />

            <rect
                x="57"
                y="44"
                width="10"
                height="4"
                rx="2"
                fill="#f59e0b"
            />
        `,

        mouth: `
            <path
                d="M42 62 Q46 58 50 62 T58 62"
                fill="none"
                stroke="#f59e0b"
                stroke-width="2.5"
            />
        `,

        extra: `
            <text
                x="70"
                y="42"
                font-size="7"
                font-family="monospace"
                fill="#f59e0b"
            >?</text>
        `,

        color: "#f59e0b"
    },

    "😲": {
        eyes: `
            <circle
                cx="37"
                cy="46"
                r="3.5"
                fill="none"
                stroke="#a855f7"
                stroke-width="2.5"
            />

            <circle
                cx="63"
                cy="46"
                r="3.5"
                fill="none"
                stroke="#a855f7"
                stroke-width="2.5"
            />
        `,

        mouth: `
            <circle
                cx="50"
                cy="62"
                r="4.5"
                fill="none"
                stroke="#a855f7"
                stroke-width="3"
            />
        `,

        extra: "",
        color: "#a855f7"
    },

    "😠": {
        eyes: `
            <path
                d="M31 48 L41 43"
                stroke="#ef4444"
                stroke-width="3.5"
                stroke-linecap="round"
            />

            <path
                d="M69 48 L59 43"
                stroke="#ef4444"
                stroke-width="3.5"
                stroke-linecap="round"
            />
        `,

        mouth: `
            <path
                d="M41 62 L45 59 L49 64 L53 59 L57 62"
                fill="none"
                stroke="#ef4444"
                stroke-width="2.8"
            />
        `,

        extra: `
            <text
                x="29"
                y="40"
                font-size="5"
                fill="#ef4444"
                font-family="monospace"
            >WARN</text>
        `,

        color: "#ef4444"
    },

    "🙁": {
        eyes: `
            <rect
                x="33"
                y="47"
                width="10"
                height="2"
                rx="1"
                fill="#3b82f6"
            />

            <rect
                x="57"
                y="47"
                width="10"
                height="2"
                rx="1"
                fill="#3b82f6"
            />
        `,

        mouth: `
            <path
                d="M43 65 Q50 58 57 65"
                fill="none"
                stroke="#3b82f6"
                stroke-width="2.2"
            />
        `,

        extra: "",
        color: "#3b82f6"
    },

    "😢": {
        eyes: `
            <path
                d="M32 42L38 48M38 42L32 48"
                stroke="#3b82f6"
                stroke-width="2.5"
            />

            <path
                d="M62 42L68 48M68 42L62 48"
                stroke="#3b82f6"
                stroke-width="2.5"
            />
        `,

        mouth: `
            <line
                x1="42"
                y1="63"
                x2="58"
                y2="63"
                stroke="#3b82f6"
                stroke-width="2.5"
            />
        `,

        extra: `
            <text
                x="40"
                y="74"
                font-size="4.5"
                fill="#3b82f6"
                font-family="monospace"
            >SYS_ERR</text>
        `,

        color: "#3b82f6"
    }
};

/* ------------------------------------------------------------
   EMOTION ENGINE
------------------------------------------------------------ */

function getEmotionFrame(emotion) {

    const map = {
        NEUTRAL: "😐",
        HAPPY: "😊",
        THINKING: "🤔",
        SURPRISED: "😲",
        ANGRY: "😠",
        SAD: "😢"
    };

    return map[emotion] || "😐";
}

function transitionTo(emotion) {

    emotion = String(emotion || "NEUTRAL").toUpperCase();

    if (!vectorExpressions[getEmotionFrame(emotion)]) {
        emotion = "NEUTRAL";
    }

    currentEmotion = emotion;

    const face = document.getElementById("ai-face");
    const status = document.getElementById("ai-status");

    if (!face) return;

    const symbol = getEmotionFrame(emotion);
    const data = vectorExpressions[symbol];

    face.classList.remove("pop-animation");

    void face.offsetWidth;

    face.classList.add("pop-animation");

    face.innerHTML = getCharacterSVG(
        data.eyes,
        data.mouth,
        data.extra,
        data.color
    );

    if (status) {

        const statusMap = {
            NEUTRAL: "Online • Ready",
            HAPPY: "Online • Positive",
            THINKING: "Processing • Thinking",
            SURPRISED: "Alert • Interesting",
            ANGRY: "Alert • Defensive",
            SAD: "Degraded • Recovering"
        };

        status.textContent = statusMap[emotion];
    }
}

/* ------------------------------------------------------------
   CHAT HELPERS
------------------------------------------------------------ */

function scrollChat() {

    const box = document.getElementById("chat-messages");

    if (!box) return;

    requestAnimationFrame(() => {
        box.scrollTop = box.scrollHeight;
    });
}

function addUserMessage(text) {

    const box = document.getElementById("chat-messages");

    if (!box) return;

    const wrapper = document.createElement("div");

    wrapper.className = "nyx-message-row user";

    wrapper.innerHTML = `
        <div class="nyx-avatar user-avatar">
            ${getUserSVG()}
        </div>

        <div class="nyx-message user-message">
            ${formatAIText(text)}
        </div>
    `;

    box.appendChild(wrapper);

    scrollChat();
}

function addTypingMessage() {

    const box = document.getElementById("chat-messages");

    if (!box) return null;

    const id = `typing-${Date.now()}`;

    const wrapper = document.createElement("div");

    wrapper.id = id;
    wrapper.className = "nyx-message-row ai";

    wrapper.innerHTML = `
        <div class="nyx-avatar">
            ${getMiniNyxSVG("#f59e0b")}
        </div>

        <div class="nyx-message ai-message typing-message">

            <div class="nyx-message-name">
                Nyxium AI
            </div>

            <div class="typing-content">

                <span>Thinking</span>

                <div class="typing-dots">
                    <i></i>
                    <i></i>
                    <i></i>
                </div>

            </div>

        </div>
    `;

    box.appendChild(wrapper);

    scrollChat();

    return id;
}

function updateTypingMessage(id, text) {

    const element = document.getElementById(id);

    if (!element) return;

    const content =
        element.querySelector(".typing-content span");

    if (content) {
        content.textContent = text;
    }
}

function removeTypingMessage(id) {

    const element = document.getElementById(id);

    if (element) {
        element.remove();
    }
}

/* ------------------------------------------------------------
   AI MESSAGE
------------------------------------------------------------ */

function addAIMessage(text, emotion = "NEUTRAL") {

    const box = document.getElementById("chat-messages");

    if (!box) return;

    const color =
        emotionColors[emotion] ||
        emotionColors.NEUTRAL;

    const wrapper = document.createElement("div");

    wrapper.className = "nyx-message-row ai";

    const messageId =
        `ai-message-${Date.now()}-${Math.random()
            .toString(36)
            .slice(2)}`;

    wrapper.innerHTML = `
        <div class="nyx-avatar">
            ${getMiniNyxSVG(color)}
        </div>

        <div class="nyx-message ai-message">

            <div class="nyx-message-header">

                <span class="nyx-message-name">
                    Nyxium AI
                </span>

                <span class="nyx-message-status">
                    ${emotion}
                </span>

            </div>

            <div
                id="${messageId}"
                class="nyx-message-content"
            ></div>

        </div>
    `;

    box.appendChild(wrapper);

    const textElement =
        document.getElementById(messageId);

    let index = 0;

    function typeCharacter() {

        if (!textElement) return;

        if (index < text.length) {

            const partial =
                text.substring(0, index + 1);

            textElement.innerHTML =
                formatAIText(partial);

            index++;

            scrollChat();

            const delay =
                text.length > 700
                    ? 3
                    : Math.random() * 12 + 7;

            setTimeout(typeCharacter, delay);

        } else {

            conversationHistory.push({
                role: "assistant",
                content: text
            });

            trimHistory();

            clearTimeout(idleTimeout);

            idleTimeout = setTimeout(() => {
                transitionTo("NEUTRAL");
            }, 4000);
        }
    }

    typeCharacter();
}

/* ------------------------------------------------------------
   WELCOME MESSAGE
------------------------------------------------------------ */

function showWelcomeMessage() {

    const box =
        document.getElementById("chat-messages");

    if (!box || box.children.length > 0) return;

    const wrapper = document.createElement("div");

    wrapper.className = "nyx-welcome";

    wrapper.innerHTML = `
        <div class="nyx-welcome-orb">
            ${getMiniNyxSVG("#a855f7")}
        </div>

        <div class="nyx-welcome-title">
            Welcome to Nyxium AI
        </div>

        <p class="nyx-welcome-text">
            Your AI workspace for questions, coding,
            ideas, explanations, calculations and more.
        </p>

        <div class="nyx-suggestion-grid">

            <button
                onclick="useSuggestion('Explain quantum computing simply')"
            >
                <span>🧠</span>
                Explain something
            </button>

            <button
                onclick="useSuggestion('Help me write a Python program')"
            >
                <span>💻</span>
                Write code
            </button>

            <button
                onclick="useSuggestion('Give me 5 creative project ideas')"
            >
                <span>✨</span>
                Brainstorm
            </button>

            <button
                onclick="useSuggestion('Solve 2847 × 936')"
            >
                <span>⚡</span>
                Calculate
            </button>

        </div>
    `;

    box.appendChild(wrapper);
}

function useSuggestion(text) {

    const input =
        document.getElementById("user-input");

    if (!input) return;

    input.value = text;
    input.focus();

    sendToAI();
}

/* ------------------------------------------------------------
   HISTORY
------------------------------------------------------------ */

function trimHistory() {

    while (
        conversationHistory.length >
        MAX_HISTORY_TURNS
    ) {
        conversationHistory.shift();
    }
}

/* ------------------------------------------------------------
   LOCAL MATH ENGINE
------------------------------------------------------------ */

function tryLocalResponse(message) {

    const normalized =
        message.toLowerCase().trim();

    /* Basic arithmetic */

    const mathRegex =
        /(-?\d+(?:\.\d+)?)\s*(\+|-|\*|×|x|\/|÷)\s*(-?\d+(?:\.\d+)?)/;

    const match =
        message.match(mathRegex);

    if (match) {

        const a = Number(match[1]);
        const op = match[2];
        const b = Number(match[3]);

        let result;

        switch (op) {

            case "+":
                result = a + b;
                break;

            case "-":
                result = a - b;
                break;

            case "*":
            case "×":
            case "x":
                result = a * b;
                break;

            case "/":
            case "÷":
                if (b === 0) {
                    return "[SAD] Division by zero is undefined.";
                }

                result = a / b;
                break;
        }

        if (typeof result === "number") {

            return `[HAPPY] The answer is **${result}**.`;
        }
    }

    if (
        /^(hi|hello|hey|hola|yo)\b/i.test(normalized)
    ) {
        return "[HAPPY] Hey! Nyxium AI is online. What are we working on?";
    }

    if (
        normalized.includes("who are you") ||
        normalized.includes("what are you")
    ) {
        return "[NEUTRAL] I'm **Nyxium AI**, the AI system powering the Nyxium experience. I can help with questions, coding, ideas, calculations and technical problems.";
    }

    if (
        normalized === "thanks" ||
        normalized === "thank you" ||
        normalized === "thx"
    ) {
        return "[HAPPY] You're welcome. What are we building next?";
    }

    if (normalized.length < 2) {
        return "[SURPRISED] That's a little too short for me to work with. Give me a question or command.";
    }

    return null;
}

/* ------------------------------------------------------------
   COMMAND HANDLER
------------------------------------------------------------ */

function executeConsoleCommand(command) {

    const input =
        document.getElementById("user-input");

    if (!input) return;

    if (command === "/clear") {

        clearChat();
        return;
    }

    if (command === "/toggle-sass") {

        input.value =
            "Toggle your personality between professional and playful.";

        sendToAI();

        return;
    }

    input.value = command;
    input.focus();
}

/* ------------------------------------------------------------
   CLEAR CHAT
------------------------------------------------------------ */

function clearChat() {

    const box =
        document.getElementById("chat-messages");

    if (box) {
        box.innerHTML = "";
    }

    conversationHistory = [];

    transitionTo("HAPPY");

    setTimeout(() => {

        showWelcomeMessage();

        transitionTo("NEUTRAL");

    }, 500);
}

/* ------------------------------------------------------------
   SEND TO AI
------------------------------------------------------------ */

async function sendToAI() {

    if (isGenerating) return;

    const input =
        document.getElementById("user-input");

    if (!input) return;

    const message =
        input.value.trim();

    if (!message) return;

    isGenerating = true;

    input.value = "";

    input.disabled = true;

    const sendButton =
        document.querySelector(
            "#send-button"
        );

    if (sendButton) {
        sendButton.disabled = true;
        sendButton.innerHTML =
            `<span class="send-spinner"></span>`;
    }

    /* Commands */

    if (message === "/clear") {

        clearChat();

        finishGeneration();

        return;
    }

    /* Remove welcome panel */

    const welcome =
        document.querySelector(".nyx-welcome");

    if (welcome) {
        welcome.remove();
    }

    addUserMessage(message);

    conversationHistory.push({
        role: "user",
        content: message
    });

    trimHistory();

    transitionTo("THINKING");

    const typingId =
        addTypingMessage();

    let finalResponse = null;

    /* --------------------------------------------------------
       PRIMARY BACKEND
    -------------------------------------------------------- */

    try {

        updateTypingMessage(
            typingId,
            "Connecting to Nyxium Core..."
        );

        const response =
            await fetch("/api/chat", {

                method: "POST",

                headers: {
                    "Content-Type":
                        "application/json"
                },

                body: JSON.stringify({

                    message,

                    history:
                        conversationHistory

                })
            });

        if (response.ok) {

            const data =
                await response.json();

            if (
                data &&
                typeof data.reply === "string" &&
                data.reply.trim()
            ) {
                finalResponse =
                    data.reply.trim();
            }
        }

    } catch (error) {

        console.warn(
            "Nyxium backend unavailable:",
            error
        );
    }

    /* --------------------------------------------------------
       LOCAL RESPONSE
    -------------------------------------------------------- */

    if (!finalResponse) {

        const local =
            tryLocalResponse(message);

        if (local) {
            finalResponse = local;
        }
    }

    /* --------------------------------------------------------
       PUTER FALLBACK
    -------------------------------------------------------- */

    if (!finalResponse && window.puter?.ai) {

        try {

            updateTypingMessage(
                typingId,
                "Connecting to auxiliary AI..."
            );

            const historyText =
                conversationHistory
                    .map(item =>
                        `${item.role === "user"
                            ? "User"
                            : "Nyxium AI"}: ${item.content}`
                    )
                    .join("\n");

            const prompt = `
You are Nyxium AI.

You are a helpful, intelligent and conversational AI assistant.

PERSONALITY:
- Professional when solving serious tasks.
- Friendly and slightly witty.
- Never intentionally provide incorrect information.
- Explain difficult subjects clearly.
- Help with programming and technical problems.
- Perform calculations yourself.
- Do not claim to be Google Gemini.
- Your name is Nyxium AI.

RESPONSE FORMAT:
Begin every answer with exactly one emotion tag:

[NEUTRAL]
[HAPPY]
[THINKING]
[SURPRISED]
[SAD]
[ANGRY]

Then provide the actual answer.

CONVERSATION:
${historyText}

CURRENT USER MESSAGE:
${message}
`.trim();

            const result =
                await Promise.race([

                    puter.ai.chat(prompt),

                    new Promise((_, reject) =>
                        setTimeout(
                            () =>
                                reject(
                                    new Error(
                                        "Puter timeout"
                                    )
                                ),
                            10000
                        )
                    )

                ]);

            if (typeof result === "string") {

                finalResponse =
                    result.trim();

            } else if (
                result &&
                typeof result.message === "string"
            ) {

                finalResponse =
                    result.message.trim();

            } else if (
                result &&
                result.message &&
                typeof result.message.content === "string"
            ) {

                finalResponse =
                    result.message.content.trim();
            }

        } catch (error) {

            console.warn(
                "Auxiliary AI unavailable:",
                error
            );
        }
    }

    /* --------------------------------------------------------
       FINAL FALLBACK
    -------------------------------------------------------- */

    if (!finalResponse) {

        finalResponse =
            "[SAD] I couldn't reach the Nyxium AI network right now. Please try again in a moment.";
    }

    removeTypingMessage(typingId);

    handleEngineResponse(
        finalResponse
    );

    finishGeneration();
}

/* ------------------------------------------------------------
   RESPONSE PARSER
------------------------------------------------------------ */

function handleEngineResponse(text) {

    let emotion = "NEUTRAL";

    const match =
        String(text).match(
            /^\s*\[(NEUTRAL|HAPPY|THINKING|SURPRISED|SAD|ANGRY)\]\s*/i
        );

    if (match) {

        emotion =
            match[1].toUpperCase();

        text =
            String(text)
                .replace(match[0], "")
                .trim();
    }

    transitionTo(emotion);

    addAIMessage(
        text,
        emotion
    );
}

/* ------------------------------------------------------------
   GENERATION STATE
------------------------------------------------------------ */

function finishGeneration() {

    isGenerating = false;

    const input =
        document.getElementById("user-input");

    if (input) {
        input.disabled = false;
        input.focus();
    }

    const sendButton =
        document.querySelector(
            "#send-button"
        );

    if (sendButton) {

        sendButton.disabled = false;

        sendButton.innerHTML =
            `<span>Send</span><span>➤</span>`;
    }
}

/* ------------------------------------------------------------
   KEYBOARD SHORTCUTS
------------------------------------------------------------ */

document.addEventListener(
    "keydown",
    event => {

        /* Ctrl + K = focus chat */

        if (
            (event.ctrlKey || event.metaKey) &&
            event.key.toLowerCase() === "k"
        ) {

            event.preventDefault();

            showView("chat");

            const input =
                document.getElementById(
                    "user-input"
                );

            if (input) {
                input.focus();
            }
        }

        /* Escape = clear input */

        if (event.key === "Escape") {

            const input =
                document.getElementById(
                    "user-input"
                );

            if (
                input &&
                document.activeElement === input
            ) {
                input.value = "";
            }
        }
    }
);

/* ------------------------------------------------------------
   INITIALIZATION
------------------------------------------------------------ */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        transitionTo("NEUTRAL");

        showWelcomeMessage();

        const input =
            document.getElementById(
                "user-input"
            );

        if (input) {

            input.addEventListener(
                "keydown",
                event => {

                    if (
                        event.key === "Enter" &&
                        !event.shiftKey
                    ) {

                        event.preventDefault();

                        sendToAI();
                    }
                }
            );
        }

        showRandomTip();
    }
);

/* ------------------------------------------------------------
   BACKWARD COMPATIBILITY
------------------------------------------------------------ */

window.showView =
    showView;

window.sendToAI =
    sendToAI;

window.executeConsoleCommand =
    executeConsoleCommand;

window.clearChat =
    clearChat;

window.useSuggestion =
    useSuggestion;
