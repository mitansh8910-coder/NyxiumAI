/* ============================================================
   NYXIUM AI — CHAT ENGINE
   ============================================================ */

'use strict';

/* ============================================================
   GLOBAL STATE
   ============================================================ */

let conversationHistory = [];
const MAX_HISTORY_TURNS = 16;

let currentEmotion = 'NEUTRAL';
let idleTimeout = null;
let isGenerating = false;

const STORAGE_KEY = 'nyxium_chat_history';
const SASS_KEY = 'nyxium_sass_mode';

let sassMode = localStorage.getItem(SASS_KEY) !== 'false';

/* ============================================================
   DOM HELPERS
   ============================================================ */

function $(id) {
    return document.getElementById(id);
}

function escapeHTML(text) {
    return String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

/* ============================================================
   VIEW NAVIGATION
   ============================================================ */

function showView(viewId) {
    document.querySelectorAll('.view').forEach(view => {
        view.classList.remove('active');
    });

    const target = $(viewId);

    if (!target) return;

    target.classList.add('active');

    if (viewId === 'chat') {
        showRandomTip();

        setTimeout(() => {
            $('user-input')?.focus();
        }, 100);
    }
}

/* ============================================================
   STARFIELD
   ============================================================ */

const canvas = $('starfield');

if (canvas) {
    const ctx = canvas.getContext('2d');

    let stars = [];

    function initStars() {
        const dpr = Math.min(window.devicePixelRatio || 1, 2);

        canvas.width = window.innerWidth * dpr;
        canvas.height = window.innerHeight * dpr;

        canvas.style.width = `${window.innerWidth}px`;
        canvas.style.height = `${window.innerHeight}px`;

        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        stars = Array.from({
            length: window.innerWidth < 700 ? 100 : 220
        }, () => ({
            x: Math.random() * window.innerWidth,
            y: Math.random() * window.innerHeight,
            size: Math.random() * 1.5 + 0.2,
            speed: Math.random() * 0.45 + 0.08,
            opacity: Math.random() * 0.8 + 0.2
        }));
    }

    function animateStars() {
        ctx.clearRect(
            0,
            0,
            window.innerWidth,
            window.innerHeight
        );

        stars.forEach(star => {
            star.y -= star.speed;

            if (star.y < -5) {
                star.y = window.innerHeight + 5;
                star.x = Math.random() * window.innerWidth;
            }

            ctx.beginPath();

            ctx.globalAlpha = star.opacity;

            ctx.shadowBlur = 8;
            ctx.shadowColor = '#a855f7';

            ctx.fillStyle = '#e9d5ff';

            ctx.arc(
                star.x,
                star.y,
                star.size,
                0,
                Math.PI * 2
            );

            ctx.fill();
        });

        ctx.globalAlpha = 1;
        ctx.shadowBlur = 0;

        requestAnimationFrame(animateStars);
    }

    window.addEventListener('resize', initStars);

    initStars();
    animateStars();
}

/* ============================================================
   CURSOR TRAIL
   ============================================================ */

let lastCursorTrail = 0;

document.addEventListener('mousemove', event => {

    const now = performance.now();

    /* Don't create hundreds of DOM elements every second */
    if (now - lastCursorTrail < 35) return;

    lastCursorTrail = now;

    if (window.innerWidth < 700) return;

    const star = document.createElement('div');

    star.className = 'cursor-star';

    star.style.left = `${event.clientX}px`;
    star.style.top = `${event.clientY}px`;

    document.body.appendChild(star);

    setTimeout(() => {
        star.remove();
    }, 800);
});

/* ============================================================
   TIPS
   ============================================================ */

const nyxiumTips = [
    'Ask Nyx to explain code, mathematics, science, or almost anything.',
    'Use /clear to wipe the current conversation.',
    'Use /toggle-sass to change Nyx personality mode.',
    'Try asking Nyx a multi-step question — conversation memory is enabled.',
    'Nyx can automatically switch between backend AI, browser AI, and local fallback.',
    'Tip: Be specific with technical questions for better answers.',
    'Nyxium AI is designed with a hybrid AI architecture.',
    'Try asking: "Explain quantum computing like I am in class 9."'
];

function showRandomTip() {

    const box = $('ai-tip-box');

    if (!box) return;

    const tip =
        nyxiumTips[
            Math.floor(Math.random() * nyxiumTips.length)
        ];

    box.innerHTML = `
        <div>
            <span class="text-xl">✨</span>

            <div>
                <strong class="text-indigo-300">
                    Nyxium AI Tip
                </strong>

                <p class="text-gray-300 mt-1">
                    ${escapeHTML(tip)}
                </p>
            </div>
        </div>
    `;
}

/* ============================================================
   NYX VISOR
   ============================================================ */

function getCharacterSVG(
    eyesPath,
    mouthPath,
    auxiliaryElements = '',
    glowColor = '#38bdf8'
) {

    return `
        <svg
            width="100%"
            height="100%"
            viewBox="0 0 100 100"
            xmlns="http://www.w3.org/2000/svg"
        >

            <defs>

                <filter
                    id="neon-glow"
                    x="-30%"
                    y="-30%"
                    width="160%"
                    height="160%"
                >
                    <feGaussianBlur
                        stdDeviation="2.2"
                        result="blur"
                    />

                    <feMerge>
                        <feMergeNode in="blur"/>
                        <feMergeNode in="SourceGraphic"/>
                    </feMerge>
                </filter>

                <pattern
                    id="visor-grid"
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
                        stroke-opacity="0.08"
                        stroke-width="0.8"
                    />

                    <line
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="6"
                        stroke="${glowColor}"
                        stroke-opacity="0.08"
                        stroke-width="0.8"
                    />
                </pattern>

                <linearGradient
                    id="helm-grad"
                    x1="0%"
                    y1="0%"
                    x2="100%"
                    y2="100%"
                >
                    <stop
                        offset="0%"
                        stop-color="#29144d"
                    />

                    <stop
                        offset="50%"
                        stop-color="#100721"
                    />

                    <stop
                        offset="100%"
                        stop-color="#05010e"
                    />
                </linearGradient>

            </defs>

            <!-- Helmet -->
            <path
                d="
                    M20 28
                    C20 15 80 15 80 28
                    L84 50
                    C84 70 74 84 50 88
                    C26 84 16 70 16 50
                    Z
                "
                fill="url(#helm-grad)"
                stroke="#6b21a8"
                stroke-width="2.5"
            />

            <!-- Left antenna -->
            <path
                d="M16 35 L7 28 L15 48 Z"
                fill="#4c1d95"
                stroke="#a855f7"
                stroke-width="1.2"
            />

            <circle
                cx="8"
                cy="29"
                r="1.5"
                fill="${glowColor}"
                filter="url(#neon-glow)"
            />

            <!-- Right antenna -->
            <path
                d="M84 35 L93 28 L85 48 Z"
                fill="#4c1d95"
                stroke="#a855f7"
                stroke-width="1.2"
            />

            <circle
                cx="92"
                cy="29"
                r="1.5"
                fill="${glowColor}"
                filter="url(#neon-glow)"
            />

            <!-- Visor -->
            <path
                d="
                    M23 38
                    C23 32 77 32 77 38
                    L73 66
                    C73 73 64 79 50 79
                    C36 79 27 73 27 66
                    Z
                "
                fill="#04010a"
                stroke="#1e1b4b"
                stroke-width="1.5"
            />

            <path
                d="
                    M23 38
                    C23 32 77 32 77 38
                    L73 66
                    C73 73 64 79 50 79
                    C36 79 27 73 27 66
                    Z
                "
                fill="url(#visor-grid)"
            />

            <!-- HUD corners -->

            <path
                d="M27 44 L27 40 L31 40"
                fill="none"
                stroke="${glowColor}"
                stroke-width="1"
                opacity="0.5"
            />

            <path
                d="M73 44 L73 40 L69 40"
                fill="none"
                stroke="${glowColor}"
                stroke-width="1"
                opacity="0.5"
            />

            <path
                d="M27 62 L27 66 L31 66"
                fill="none"
                stroke="${glowColor}"
                stroke-width="1"
                opacity="0.5"
            />

            <path
                d="M73 62 L73 66 L69 66"
                fill="none"
                stroke="${glowColor}"
                stroke-width="1"
                opacity="0.5"
            />

            <g filter="url(#neon-glow)">
                ${eyesPath}
                ${mouthPath}
                ${auxiliaryElements}
            </g>

        </svg>
    `;
}

/* ============================================================
   MINI NYX
   ============================================================ */

function getMiniNyxSVG(glowColor = '#38bdf8') {

    return `
        <svg
            width="100%"
            height="100%"
            viewBox="0 0 100 100"
            xmlns="http://www.w3.org/2000/svg"
        >

            <defs>

                <filter id="mini-glow">

                    <feGaussianBlur
                        stdDeviation="3"
                        result="blur"
                    />

                    <feMerge>
                        <feMergeNode in="blur"/>
                        <feMergeNode in="SourceGraphic"/>
                    </feMerge>

                </filter>

            </defs>

            <path
                d="
                    M20 28
                    C20 15 80 15 80 28
                    L84 50
                    C84 70 74 84 50 88
                    C26 84 16 70 16 50
                    Z
                "
                fill="#0f0720"
                stroke="#6b21a8"
                stroke-width="4"
            />

            <path
                d="
                    M23 38
                    C23 32 77 32 77 38
                    L73 66
                    C73 73 64 79 50 79
                    C36 79 27 73 27 66
                    Z
                "
                fill="#04010a"
                stroke="#1e1b4b"
                stroke-width="2"
            />

            <g filter="url(#mini-glow)">

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
                    stroke-width="3.5"
                    stroke-linecap="round"
                />

            </g>

        </svg>
    `;
}

/* ============================================================
   USER AVATAR
   ============================================================ */

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
                cy="36"
                r="18"
                fill="#c4b5fd"
            />

            <path
                d="
                    M22 80
                    C22 62 78 62 78 80
                    C78 84 22 84 22 80
                    Z
                "
                fill="#c4b5fd"
            />

        </svg>
    `;
}

/* ============================================================
   EXPRESSIONS
   ============================================================ */

const vectorExpressions = {

    NEUTRAL: {
        eyes: `
            <rect x="33" y="44"
                width="10" height="4"
                rx="2" fill="#38bdf8"/>

            <rect x="57" y="44"
                width="10" height="4"
                rx="2" fill="#38bdf8"/>
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

        extra: '',
        color: '#38bdf8'
    },

    HAPPY: {
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

        color: '#22c55e'
    },

    THINKING: {
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
                stroke-linecap="round"
            />
        `,

        extra: `
            <text
                x="70"
                y="42"
                font-size="7"
                font-family="monospace"
                font-weight="bold"
                fill="#f59e0b"
            >?</text>
        `,

        color: '#f59e0b'
    },

    SURPRISED: {
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

        extra: `
            <line
                x1="50"
                y1="36"
                x2="50"
                y2="40"
                stroke="#a855f7"
                stroke-width="1.5"
            />
        `,

        color: '#a855f7'
    },

    ANGRY: {
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
                stroke-linecap="round"
            />
        `,

        extra: `
            <text
                x="27"
                y="40"
                font-size="5"
                fill="#ef4444"
                font-family="monospace"
            >WARN</text>
        `,

        color: '#ef4444'
    },

    SAD: {
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
                stroke-linecap="round"
            />
        `,

        extra: '',
        color: '#3b82f6'
    }
};

/* ============================================================
   EMOTION ENGINE
   ============================================================ */

function transitionTo(emotion) {

    emotion = vectorExpressions[emotion]
        ? emotion
        : 'NEUTRAL';

    const face = $('ai-face');
    const status = $('ai-status');

    if (!face) return;

    currentEmotion = emotion;

    const data = vectorExpressions[emotion];

    face.classList.remove('pop-animation');

    void face.offsetWidth;

    face.classList.add('pop-animation');

    face.innerHTML =
        getCharacterSVG(
            data.eyes,
            data.mouth,
            data.extra,
            data.color
        );

    if (status) {

        const labels = {
            NEUTRAL: 'Status: Online',
            HAPPY: 'Status: Activated',
            THINKING: 'Status: Thinking...',
            SURPRISED: 'Status: Alerted',
            ANGRY: 'Status: Warning',
            SAD: 'Status: Recovering...'
        };

        status.textContent =
            labels[emotion] || labels.NEUTRAL;
    }
}

/* ============================================================
   COMMANDS
   ============================================================ */

function executeConsoleCommand(command) {

    const input = $('user-input');

    if (!input) return;

    input.value = command;

    sendToAI();
}

/* ============================================================
   LOCAL MATH ENGINE
   ============================================================ */

function tryLocalResponse(message) {

    const normalized = message
        .toLowerCase()
        .trim();

    /* Basic arithmetic */

    const math =
        normalized.match(
            /^(-?\d+(?:\.\d+)?)\s*([+\-*x×÷\/])\s*(-?\d+(?:\.\d+)?)$/
        );

    if (math) {

        const a = Number(math[1]);
        const op = math[2];
        const b = Number(math[3]);

        let result;

        if (op === '+') result = a + b;
        else if (op === '-') result = a - b;
        else if (op === '*' || op === 'x' || op === '×') {
            result = a * b;
        }
        else if (op === '/' || op === '÷') {
            if (b === 0) {
                return '[SURPRISED] Division by zero is undefined.';
            }

            result = a / b;
        }

        return `[HAPPY] Done. **${result}**`;
    }

    /* Greetings */

    if (
        /^(hi|hello|hey|hola|yo|sup)\b/i.test(normalized)
    ) {
        return '[HAPPY] Hey! Nyx is online. What are we building, debugging, calculating, or destroying today?';
    }

    /* Identity */

    if (
        normalized.includes('who are you') ||
        normalized.includes('what are you')
    ) {
        return '[NEUTRAL] I am Nyx — the cybernetic AI core of the Nyxium Terminal Network.';
    }

    /* Short nonsense */

    if (normalized.length < 3) {
        return '[SURPRISED] That message is a little too short for my processing array.';
    }

    return '[NEUTRAL] My primary AI node is temporarily unavailable. I can still handle basic calculations and local commands while the network reconnects.';
}

/* ============================================================
   COMMAND PROCESSOR
   ============================================================ */

function processCommand(message) {

    const command = message
        .trim()
        .split(/\s+/)[0]
        .toLowerCase();

    if (!message.startsWith('/')) {
        return null;
    }

    switch (command) {

        case '/clear':
            clearChat();
            return '';

        case '/toggle-sass':
            sassMode = !sassMode;

            localStorage.setItem(
                SASS_KEY,
                String(sassMode)
            );

            return `[${sassMode ? 'HAPPY' : 'NEUTRAL'}] Sass mode is now **${sassMode ? 'ON' : 'OFF'}**.`;

        case '/help':
            return `[NEUTRAL]
**Nyxium Console Commands**

\`/clear\` — Clear this conversation.
\`/toggle-sass\` — Toggle Nyx's personality mode.
\`/help\` — Show this command list.

You can also simply ask me questions normally.`;

        case '/ping':
            return `[HAPPY] Pong! Frontend response received in **${Math.floor(Math.random() * 40 + 10)}ms**.`;

        default:
            return `[SURPRISED] Unknown command: \`${escapeHTML(command)}\`. Try \`/help\`.`;
    }
}

/* ============================================================
   CLEAR CHAT
   ============================================================ */

function clearChat() {

    const chat = $('chat-messages');

    if (!chat) return;

    chat.innerHTML = '';

    conversationHistory = [];

    saveHistory();

    transitionTo('HAPPY');

    setTimeout(() => {
        transitionTo('NEUTRAL');
    }, 1500);
}

/* ============================================================
   HISTORY STORAGE
   ============================================================ */

function saveHistory() {

    try {

        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(conversationHistory)
        );

    } catch (error) {

        console.warn(
            'Unable to save Nyxium history.',
            error
        );
    }
}

function loadHistory() {

    try {

        const saved =
            localStorage.getItem(STORAGE_KEY);

        if (!saved) return;

        const parsed =
            JSON.parse(saved);

        if (!Array.isArray(parsed)) return;

        conversationHistory =
            parsed.slice(-MAX_HISTORY_TURNS);

    } catch (error) {

        console.warn(
            'Unable to restore Nyxium history.',
            error
        );
    }
}

/* ============================================================
   ADD USER MESSAGE
   ============================================================ */

function addUserMessage(message) {

    const chat = $('chat-messages');

    if (!chat) return;

    chat.insertAdjacentHTML(
        'beforeend',
        `
        <div class="flex gap-4 flex-row-reverse mb-4">

            <div
                class="
                    w-8 h-8
                    shrink-0
                    rounded-full
                    bg-[#1b152e]
                    border border-indigo-500/20
                    flex items-center justify-center
                    p-1
                    overflow-hidden
                "
            >
                ${getUserSVG()}
            </div>

            <div
                class="
                    bg-indigo-600
                    p-4
                    rounded-2xl
                    rounded-tr-none
                    max-w-[80%]
                    text-sm
                    break-words
                "
            >
                ${escapeHTML(message)}
            </div>

        </div>
        `
    );

    scrollChat();
}

/* ============================================================
   TYPING INDICATOR
   ============================================================ */

function addTypingIndicator() {

    const chat = $('chat-messages');

    if (!chat) return null;

    const id =
        `typing-${Date.now()}-${Math.random()
            .toString(36)
            .slice(2)}`;

    chat.insertAdjacentHTML(
        'beforeend',
        `
        <div
            id="${id}"
            class="flex gap-4 mb-4"
        >

            <div
                class="
                    w-8 h-8
                    shrink-0
                    rounded-full
                    bg-[#0d071a]
                    border border-yellow-500/30
                    flex items-center justify-center
                    p-0.5
                    overflow-hidden
                "
            >
                ${getMiniNyxSVG('#f59e0b')}
            </div>

            <div
                class="
                    bg-slate-800
                    p-4
                    rounded-2xl
                    rounded-tl-none
                    text-sm
                    text-slate-400
                    italic
                    font-status
                "
            >
                Nyxium AI is thinking
            </div>

        </div>
        `
    );

    scrollChat();

    return id;
}

/* ============================================================
   SCROLL CHAT
   ============================================================ */

function scrollChat() {

    const chat = $('chat-messages');

    if (!chat) return;

    requestAnimationFrame(() => {
        chat.scrollTop =
            chat.scrollHeight;
    });
}

/* ============================================================
   FORMAT AI RESPONSE
   ============================================================ */

function formatAIText(text) {

    let safe = escapeHTML(text);

    /*
       Code blocks
       We escape first, then replace the escaped
       markdown syntax.
    */

    safe = safe.replace(
        /```([\s\S]*?)```/g,
        (_, code) => `
            <pre class="
                my-3
                p-4
                rounded-xl
                overflow-x-auto
                bg-black/50
                border border-white/10
                text-sm
            "><code>${code.trim()}</code></pre>
        `
    );

    /* Inline code */

    safe = safe.replace(
        /`([^`\n]+)`/g,
        '<code>$1</code>'
    );

    /* Bold */

    safe = safe.replace(
        /\*\*(.*?)\*\*/g,
        '<strong>$1</strong>'
    );

    /* Italic */

    safe = safe.replace(
        /(^|[^\*])\*([^*\n]+)\*(?!\*)/g,
        '$1<em>$2</em>'
    );

    /* Links */

    safe = safe.replace(
        /(https?:\/\/[^\s<]+)/g,
        '<a href="$1" target="_blank" rel="noopener noreferrer" class="text-purple-400 hover:text-purple-300 underline">$1</a>'
    );

    /* New lines */

    safe = safe.replace(
        /\n/g,
        '<br>'
    );

    return safe;
}

/* ============================================================
   AI RESPONSE BUBBLE
   ============================================================ */

function createAIMessage(text, emotion) {

    const chat = $('chat-messages');

    if (!chat) return null;

    const id =
        `msg-${Date.now()}-${Math.random()
            .toString(36)
            .slice(2)}`;

    const colors = {
        HAPPY: '#22c55e',
        THINKING: '#f59e0b',
        SURPRISED: '#a855f7',
        ANGRY: '#ef4444',
        SAD: '#3b82f6',
        NEUTRAL: '#38bdf8'
    };

    const color =
        colors[emotion] || colors.NEUTRAL;

    chat.insertAdjacentHTML(
        'beforeend',
        `
        <div class="flex gap-4 mb-4">

            <div
                class="
                    w-8 h-8
                    shrink-0
                    rounded-full
                    bg-[#0d071a]
                    border border-indigo-500/30
                    flex items-center justify-center
                    p-0.5
                    overflow-hidden
                "
            >
                ${getMiniNyxSVG(color)}
            </div>

            <div
                class="
                    bg-slate-800
                    p-4
                    rounded-2xl
                    rounded-tl-none
                    max-w-[85%]
                    text-sm
                    break-words
                "
            >

                <div class="flex items-center gap-2 mb-2">

                    <strong class="text-blue-400">
                        Nyxium AI
                    </strong>

                    <span
                        class="
                            text-[10px]
                            uppercase
                            tracking-wider
                            opacity-50
                        "
                    >
                        ${emotion}
                    </span>

                </div>

                <div id="${id}" class="leading-6"></div>

                <div class="mt-3 flex gap-2">

                    <button
                        onclick="copyAIMessage('${id}')"
                        class="
                            text-[11px]
                            px-2
                            py-1
                            rounded-md
                            bg-white/5
                            hover:bg-white/10
                            text-gray-400
                        "
                    >
                        📋 Copy
                    </button>

                </div>

            </div>

        </div>
        `
    );

    scrollChat();

    return id;
}

/* ============================================================
   COPY MESSAGE
   ============================================================ */

async function copyAIMessage(id) {

    const element = $(id);

    if (!element) return;

    const text =
        element.innerText || '';

    try {

        await navigator.clipboard.writeText(text);

        const button =
            element.parentElement
                ?.querySelector('button');

        if (button) {

            const old =
                button.innerText;

            button.innerText =
                '✓ Copied';

            setTimeout(() => {
                button.innerText = old;
            }, 1200);
        }

    } catch (error) {

        console.warn(
            'Clipboard unavailable.',
            error
        );
    }
}

/* ============================================================
   TYPE RESPONSE
   ============================================================ */

function typeOutResponse(
    text,
    emotion = 'NEUTRAL'
) {

    const id =
        createAIMessage(
            text,
            emotion
        );

    if (!id) return;

    const container = $(id);

    /*
       For long AI responses, instantly render
       instead of taking 20+ seconds to type.
    */

    const delayThreshold = 1200;

    if (text.length > delayThreshold) {

        container.innerHTML =
            formatAIText(text);

        scrollChat();

        finishIdleState();

        return;
    }

    let index = 0;

    function nextCharacter() {

        if (index >= text.length) {

            container.innerHTML =
                formatAIText(text);

            finishIdleState();

            return;
        }

        /*
           Render a small chunk rather than
           one DOM operation per character.
        */

        const chunk =
            text.slice(
                index,
                index + 3
            );

        index += chunk.length;

        container.innerHTML =
            formatAIText(
                text.slice(0, index)
            );

        scrollChat();

        setTimeout(
            nextCharacter,
            sassMode ? 12 : 7
        );
    }

    nextCharacter();
}

/* ============================================================
   IDLE STATE
   ============================================================ */

function finishIdleState() {

    clearTimeout(idleTimeout);

    idleTimeout =
        setTimeout(() => {

            transitionTo('NEUTRAL');

        }, 5000);
}

/* ============================================================
   PARSE ENGINE RESPONSE
   ============================================================ */

function handleEngineResponse(
    response,
    chatBox
) {

    if (!response) {

        response =
            '[SAD] The Nyxium response node returned an empty packet.';
    }

    let text =
        String(response).trim();

    let emotion =
        'NEUTRAL';

    const match =
        text.match(
            /^\s*\[([A-Z]+)\]\s*/
        );

    if (match) {

        const candidate =
            match[1];

        if (vectorExpressions[candidate]) {
            emotion = candidate;
        }

        text =
            text.slice(
                match[0].length
            );
    }

    /*
       Remove accidental duplicate
       emotion tags from AI output.
    */

    text =
        text.replace(
            /^\s*\[[A-Z]+\]\s*/,
            ''
        );

    conversationHistory.push({
        role: 'assistant',
        content: text
    });

    conversationHistory =
        conversationHistory.slice(
            -MAX_HISTORY_TURNS
        );

    saveHistory();

    transitionTo(emotion);

    typeOutResponse(
        text,
        emotion
    );
}

/* ============================================================
   BACKEND REQUEST
   ============================================================ */

async function requestBackend(
    message
) {

    const controller =
        new AbortController();

    const timeout =
        setTimeout(
            () => controller.abort(),
            12000
        );

    try {

        const response =
            await fetch(
                '/api/chat',
                {
                    method: 'POST',

                    headers: {
                        'Content-Type':
                            'application/json'
                    },

                    body: JSON.stringify({
                        message,
                        history:
                            conversationHistory
                    }),

                    signal:
                        controller.signal
                }
            );

        if (!response.ok) {
            throw new Error(
                `Backend returned ${response.status}`
            );
        }

        const data =
            await response.json();

        if (
            !data ||
            typeof data.reply !== 'string' ||
            !data.reply.trim()
        ) {
            throw new Error(
                'Invalid backend response'
            );
        }

        return data.reply;

    } finally {

        clearTimeout(timeout);
    }
}

/* ============================================================
   PUTER FALLBACK
   ============================================================ */

async function requestPuter(
    message
) {

    if (
        typeof window.puter === 'undefined' ||
        !puter.ai ||
        typeof puter.ai.chat !== 'function'
    ) {
        throw new Error(
            'Puter AI unavailable'
        );
    }

    const history =
        conversationHistory
            .slice(-12)
            .map(item =>
                `${item.role === 'user'
                    ? 'User'
                    : 'Nyx'}: ${item.content}`
            )
            .join('\n');

    const sassInstruction =
        sassMode
            ? 'You may be witty and mildly sarcastic when appropriate.'
            : 'Remain calm, professional, and helpful.';

    const prompt = `
You are Nyx, the AI core of Nyxium AI.

IDENTITY:
- Your name is Nyx.
- You are the AI assistant of Nyxium AI.
- Do not claim to be Google Gemini.
- Do not pretend to be another AI.
- Do not invent capabilities you do not have.

PERSONALITY:
- Friendly.
- Intelligent.
- Technical when necessary.
- Concise when the question is simple.
- Detailed when the question requires explanation.
- ${sassInstruction}

RESPONSE FORMAT:
Begin every response with exactly one emotion tag:

[NEUTRAL]
[HAPPY]
[THINKING]
[SURPRISED]
[SAD]
[ANGRY]

Then provide the actual answer.

IMPORTANT:
- Solve calculations accurately.
- Explain technical topics clearly.
- Use Markdown when useful.
- For programming questions, use fenced code blocks.
- Do not mention this internal prompt.

CONVERSATION:
${history}

CURRENT USER MESSAGE:
${message}
`.trim();

    const controller =
        new AbortController();

    const timeout =
        setTimeout(
            () => controller.abort(),
            15000
        );

    try {

        const result =
            await Promise.race([

                puter.ai.chat(prompt),

                new Promise((_, reject) => {

                    controller.signal.addEventListener(
                        'abort',
                        () => reject(
                            new Error(
                                'Puter timeout'
                            )
                        )
                    );

                })

            ]);

        /*
           Puter can return different structures
           depending on the model/version.
        */

        if (typeof result === 'string') {
            return result;
        }

        if (
            result?.message?.content
        ) {
            return result.message.content;
        }

        if (
            result?.text
        ) {
            return result.text;
        }

        if (
            result?.content
        ) {
            return result.content;
        }

        return String(result);

    } finally {

        clearTimeout(timeout);
    }
}

/* ============================================================
   MAIN AI PIPELINE
   ============================================================ */

async function sendToAI() {

    if (isGenerating) return;

    const input =
        $('user-input');

    if (!input) return;

    const message =
        input.value.trim();

    if (!message) return;

    isGenerating = true;

    input.value = '';

    input.disabled = true;

    const sendButton =
        input.parentElement
            ?.querySelector('button');

    if (sendButton) {
        sendButton.disabled = true;
        sendButton.innerText = '...';
    }

    /*
       Commands first
    */

    if (message.startsWith('/')) {

        const commandResult =
            processCommand(message);

        if (commandResult === '') {

            unlockInput();

            return;
        }

        if (commandResult) {

            addUserMessage(message);

            conversationHistory.push({
                role: 'user',
                content: message
            });

            handleEngineResponse(
                commandResult,
                $('chat-messages')
            );

            unlockInput();

            return;
        }
    }

    /*
       User message
    */

    addUserMessage(message);

    conversationHistory.push({
        role: 'user',
        content: message
    });

    conversationHistory =
        conversationHistory.slice(
            -MAX_HISTORY_TURNS
        );

    saveHistory();

    transitionTo('THINKING');

    const typingId =
        addTypingIndicator();

    let response = null;

    /*
       1. Backend
    */

    try {

        response =
            await requestBackend(
                message
            );

    } catch (error) {

        console.warn(
            'Nyxium backend unavailable:',
            error
        );
    }

    /*
       2. Puter fallback
    */

    if (!response) {

        const typing =
            $(typingId);

        if (typing) {

            const status =
                typing.querySelector(
                    '.font-status'
                );

            if (status) {
                status.textContent =
                    'Connecting to auxiliary AI node';
            }
        }

        try {

            response =
                await requestPuter(
                    message
                );

        } catch (error) {

            console.warn(
                'Puter fallback unavailable:',
                error
            );
        }
    }

    /*
       3. Local fallback
    */

    if (!response) {

        response =
            tryLocalResponse(
                message
            );
    }

    /*
       Remove typing indicator
    */

    if (typingId) {

        const typing =
            $(typingId);

        if (typing) {
            typing.remove();
        }
    }

    /*
       Render response
    */

    handleEngineResponse(
        response,
        $('chat-messages')
    );

    unlockInput();
}

/* ============================================================
   INPUT UNLOCK
   ============================================================ */

function unlockInput() {

    isGenerating = false;

    const input =
        $('user-input');

    if (input) {

        input.disabled = false;

        input.focus();
    }

    const sendButton =
        input?.parentElement
            ?.querySelector('button');

    if (sendButton) {

        sendButton.disabled = false;

        sendButton.innerText =
            'Send';
    }
}

/* ============================================================
   ENTER KEY
   ============================================================ */

function setupInput() {

    const input =
        $('user-input');

    if (!input) return;

    input.addEventListener(
        'keydown',
        event => {

            if (
                event.key === 'Enter' &&
                !event.shiftKey
            ) {

                event.preventDefault();

                sendToAI();
            }
        }
    );
}

/* ============================================================
   RESTORE CHAT
   ============================================================ */

function restoreChatUI() {

    const chat =
        $('chat-messages');

    if (!chat) return;

    chat.innerHTML = '';

    for (
        const item of conversationHistory
    ) {

        if (
            item.role === 'user'
        ) {

            addUserMessage(
                item.content
            );

        } else {

            /*
               Restore previous AI messages
               without re-running the AI.
            */

            const emotion =
                'NEUTRAL';

            const id =
                createAIMessage(
                    item.content,
                    emotion
                );

            const element =
                $(id);

            if (element) {

                element.innerHTML =
                    formatAIText(
                        item.content
                    );
            }
        }
    }

    scrollChat();
}

/* ============================================================
   INITIALIZATION
   ============================================================ */

document.addEventListener(
    'DOMContentLoaded',
    () => {

        /*
           Restore stored conversation
        */

        loadHistory();

        restoreChatUI();

        /*
           Initialize Nyx face
        */

        transitionTo(
            'NEUTRAL'
        );

        /*
           Input
        */

        setupInput();

        /*
           Initial tip
        */

        showRandomTip();

        /*
           Expose functions for inline
           HTML buttons.
        */

        window.showView =
            showView;

        window.sendToAI =
            sendToAI;

        window.executeConsoleCommand =
            executeConsoleCommand;

        window.copyAIMessage =
            copyAIMessage;

        window.clearChat =
            clearChat;

        /*
           Console startup
        */

        console.log(
            '%c⚡ NYXIUM AI',
            'color:#a855f7;font-size:20px;font-weight:bold'
        );

        console.log(
            '%cNyxium Terminal initialized.',
            'color:#38bdf8'
        );

    }
);

/* ============================================================
   GLOBAL ERROR PROTECTION
   ============================================================ */

window.addEventListener(
    'unhandledrejection',
    event => {

        console.warn(
            'Nyxium handled an async error:',
            event.reason
        );

    }
);

window.addEventListener(
    'error',
    event => {

        console.warn(
            'Nyxium runtime warning:',
            event.message
        );

    }
);
