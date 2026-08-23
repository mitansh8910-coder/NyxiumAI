/* ==========================================================================
   NYXIUM AI — CHAT ENGINE V2
   --------------------------------------------------------------------------
   Architecture:
   /api/chat -> Puter -> Local fallback

   Includes:
   - Conversation memory
   - Long-response handling
   - Streaming-style output
   - Markdown/code rendering
   - Copy / regenerate
   - /clear
   - /toggle-sass
   - /summarize
   - /translate
   - /code
   - /imagine
   - /edit
   - Image/video/search tool hooks
   - Pexels/Hugging Face backend hooks
   - Nyx emotional engine
   - Thinking / answering / success / error states
   - Tool execution UI
   - Persistent local settings
   ========================================================================== */


/* ==========================================================================
   1. GLOBAL STATE
   ========================================================================== */

let conversationHistory = [];
const MAX_HISTORY_TURNS = 20;

let sassEnabled = true;
let currentEmotion = "NEUTRAL";
let idleTimeout = null;

let currentRequestController = null;
let lastUserPrompt = "";
let lastAssistantResponse = "";

let isGenerating = false;

const STORAGE_KEYS = {
    history: "nyxium_chat_history_v2",
    sass: "nyxium_sass_v2"
};


/* ==========================================================================
   2. SAFE DOM HELPERS
   ========================================================================== */

function $(id) {
    return document.getElementById(id);
}

function escapeHTML(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


/* ==========================================================================
   3. VIEW NAVIGATION
   ========================================================================== */

function showView(viewId) {
    document.querySelectorAll(".view").forEach(view => {
        view.classList.remove("active");
    });

    const target = $(viewId);

    if (target) {
        target.classList.add("active");
    }

    if (viewId === "chat") {
        showRandomTip();
        scrollChatToBottom();
    }

    updateSidebarState(viewId);
}

function updateSidebarState(viewId) {
    document.querySelectorAll("[data-view]").forEach(button => {
        button.classList.toggle(
            "active",
            button.dataset.view === viewId
        );
    });
}


/* ==========================================================================
   4. STARFIELD
   ========================================================================== */

const canvas = $("starfield");

let ctx = null;
let stars = [];

if (canvas) {
    ctx = canvas.getContext("2d");
}

function initStars() {
    if (!canvas || !ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    stars = Array.from({
        length: window.innerWidth < 700 ? 100 : 220
    }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 1.5 + 0.2,
        speed: Math.random() * 0.45 + 0.05,
        opacity: Math.random() * 0.8 + 0.2
    }));
}

function animateStars() {
    if (!canvas || !ctx) return;

    ctx.clearRect(
        0,
        0,
        canvas.width,
        canvas.height
    );

    ctx.fillStyle = "#e9d5ff";

    stars.forEach(star => {
        star.y -= star.speed;

        if (star.y < -5) {
            star.y = canvas.height + 5;
            star.x = Math.random() * canvas.width;
        }

        ctx.globalAlpha = star.opacity;

        ctx.beginPath();

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

    requestAnimationFrame(animateStars);
}

window.addEventListener("resize", initStars);

initStars();
animateStars();


/* ==========================================================================
   5. CURSOR EFFECT
   ========================================================================== */

let lastCursorStar = 0;

document.addEventListener("mousemove", event => {
    const now = Date.now();

    // Prevent hundreds of DOM nodes being created every second.
    if (now - lastCursorStar < 35) return;

    lastCursorStar = now;

    const star = document.createElement("div");

    star.className = "cursor-star";

    star.style.left = `${event.pageX}px`;
    star.style.top = `${event.pageY}px`;

    document.body.appendChild(star);

    setTimeout(() => {
        star.remove();
    }, 800);
});


/* ==========================================================================
   6. LOCAL STORAGE
   ========================================================================== */

function loadSavedState() {
    try {
        const savedHistory =
            localStorage.getItem(STORAGE_KEYS.history);

        const savedSass =
            localStorage.getItem(STORAGE_KEYS.sass);

        if (savedHistory) {
            conversationHistory =
                JSON.parse(savedHistory);

            if (!Array.isArray(conversationHistory)) {
                conversationHistory = [];
            }
        }

        if (savedSass !== null) {
            sassEnabled = savedSass === "true";
        }
    } catch (error) {
        console.warn(
            "Nyxium local state recovery failed:",
            error
        );
    }
}

function saveState() {
    try {
        localStorage.setItem(
            STORAGE_KEYS.history,
            JSON.stringify(
                conversationHistory.slice(-MAX_HISTORY_TURNS)
            )
        );

        localStorage.setItem(
            STORAGE_KEYS.sass,
            String(sassEnabled)
        );
    } catch (error) {
        console.warn(
            "Nyxium state persistence unavailable:",
            error
        );
    }
}

loadSavedState();


/* ==========================================================================
   7. NYX TIPS
   ========================================================================== */

const nyxiumTips = [
    "Try /code followed by your programming request.",
    "Use /summarize to compress a long conversation.",
    "Use /translate to translate text into another language.",
    "Use /imagine to send an image-generation request.",
    "Use /clear to completely reset the current conversation.",
    "Use /toggle-sass to change Nyx's personality mode.",
    "Ask Nyxium to explain code step-by-step.",
    "You can ask follow-up questions because conversation memory is enabled.",
    "Long answers are automatically rendered progressively.",
    "Media tools can connect through your backend API routes."
];

function showRandomTip() {
    const tipBox = $("ai-tip-box");

    if (!tipBox) return;

    const tip =
        nyxiumTips[
            Math.floor(Math.random() * nyxiumTips.length)
        ];

    tipBox.innerHTML = `
        <div class="nyx-tip p-4 mb-6 rounded-xl
                    bg-indigo-900/30
                    border border-indigo-500/30
                    flex gap-3 items-start">

            <div class="text-xl">✨</div>

            <div>
                <strong class="text-indigo-300">
                    Nyxium Tip
                </strong>

                <p class="text-gray-300 mt-1 text-sm">
                    ${escapeHTML(tip)}
                </p>
            </div>
        </div>
    `;
}


/* ==========================================================================
   8. NYX CHARACTER SVG
   ========================================================================== */

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
        xmlns="http://www.w3.org/2000/svg">

        <defs>

            <filter
                id="neon-glow"
                x="-30%"
                y="-30%"
                width="160%"
                height="160%">

                <feGaussianBlur
                    stdDeviation="2.2"
                    result="blur"/>

                <feMerge>
                    <feMergeNode in="blur"/>
                    <feMergeNode in="SourceGraphic"/>
                </feMerge>
            </filter>

            <pattern
                id="visor-grid"
                width="6"
                height="6"
                patternUnits="userSpaceOnUse">

                <line
                    x1="0"
                    y1="0"
                    x2="6"
                    y2="0"
                    stroke="#38bdf8"
                    stroke-opacity=".08"
                    stroke-width=".8"/>

                <line
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="6"
                    stroke="#38bdf8"
                    stroke-opacity=".08"
                    stroke-width=".8"/>
            </pattern>

            <linearGradient
                id="helm-grad"
                x1="0%"
                y1="0%"
                x2="100%"
                y2="100%">

                <stop offset="0%" stop-color="#241344"/>
                <stop offset="50%" stop-color="#100721"/>
                <stop offset="100%" stop-color="#05010e"/>

            </linearGradient>

        </defs>

        <path
            d="M20 28 C20 15,80 15,80 28
               L84 50
               C84 70,74 84,50 88
               C26 84,16 70,16 50Z"
            fill="url(#helm-grad)"
            stroke="#6b21a8"
            stroke-width="2.5"/>

        <path
            d="M16 35 L7 28 L15 48Z"
            fill="#4c1d95"
            stroke="#a855f7"
            stroke-width="1.2"/>

        <circle
            cx="8"
            cy="29"
            r="1.5"
            fill="${glowColor}"
            filter="url(#neon-glow)"/>

        <path
            d="M84 35 L93 28 L85 48Z"
            fill="#4c1d95"
            stroke="#a855f7"
            stroke-width="1.2"/>

        <circle
            cx="92"
            cy="29"
            r="1.5"
            fill="${glowColor}"
            filter="url(#neon-glow)"/>

        <path
            d="M23 38 C23 32,77 32,77 38
               L73 66
               C73 73,64 79,50 79
               C36 79,27 73,27 66Z"
            fill="#04010a"
            stroke="#1e1b4b"
            stroke-width="1.5"/>

        <path
            d="M23 38 C23 32,77 32,77 38
               L73 66
               C73 73,64 79,50 79
               C36 79,27 73,27 66Z"
            fill="url(#visor-grid)"/>

        <g filter="url(#neon-glow)">
            ${eyesPath}
            ${mouthPath}
            ${auxiliaryElements}
        </g>

    </svg>
    `;
}


function getMiniNyxSVG(glowColor = "#38bdf8") {
    return `
    <svg
        width="100%"
        height="100%"
        viewBox="0 0 100 100"
        xmlns="http://www.w3.org/2000/svg">

        <defs>

            <filter
                id="mini-glow"
                x="-20%"
                y="-20%"
                width="140%"
                height="140%">

                <feGaussianBlur
                    stdDeviation="3"
                    result="blur"/>

                <feMerge>
                    <feMergeNode in="blur"/>
                    <feMergeNode in="SourceGraphic"/>
                </feMerge>

            </filter>

        </defs>

        <path
            d="M20 28 C20 15,80 15,80 28
               L84 50
               C84 70,74 84,50 88
               C26 84,16 70,16 50Z"
            fill="#0f0720"
            stroke="#6b21a8"
            stroke-width="4"/>

        <path
            d="M23 38 C23 32,77 32,77 38
               L73 66
               C73 73,64 79,50 79
               C36 79,27 73,27 66Z"
            fill="#04010a"
            stroke="#1e1b4b"
            stroke-width="2"/>

        <g filter="url(#mini-glow)">

            <rect
                x="33"
                y="44"
                width="10"
                height="4"
                rx="2"
                fill="${glowColor}"/>

            <rect
                x="57"
                y="44"
                width="10"
                height="4"
                rx="2"
                fill="${glowColor}"/>

            <line
                x1="44"
                y1="62"
                x2="56"
                y2="62"
                stroke="${glowColor}"
                stroke-width="3.5"
                stroke-linecap="round"/>

        </g>

    </svg>
    `;
}


function getUserSVG() {
    return `
    <svg
        width="100%"
        height="100%"
        viewBox="0 0 100 100"
        xmlns="http://www.w3.org/2000/svg">

        <circle
            cx="50"
            cy="36"
            r="18"
            fill="#c4b5fd"/>

        <path
            d="M22 80 C22 62,78 62,78 80
               C78 84,22 84,22 80Z"
            fill="#c4b5fd"/>

    </svg>
    `;
}


/* ==========================================================================
   9. EXPRESSIONS
   ========================================================================== */

const vectorExpressions = {

    "😐": {
        eyes: `
            <rect x="33" y="44" width="10" height="4"
                  rx="2" fill="#38bdf8"/>
            <rect x="57" y="44" width="10" height="4"
                  rx="2" fill="#38bdf8"/>
        `,
        mouth: `
            <line x1="44" y1="62"
                  x2="56" y2="62"
                  stroke="#38bdf8"
                  stroke-width="2.5"
                  stroke-linecap="round"/>
        `,
        extra: "",
        color: "#38bdf8"
    },

    "😊": {
        eyes: `
            <path d="M31 48 Q38 41 43 48"
                  fill="none"
                  stroke="#22c55e"
                  stroke-width="3"
                  stroke-linecap="round"/>

            <path d="M57 48 Q62 41 69 48"
                  fill="none"
                  stroke="#22c55e"
                  stroke-width="3"
                  stroke-linecap="round"/>
        `,
        mouth: `
            <path d="M40 60 Q50 71 60 60"
                  fill="none"
                  stroke="#22c55e"
                  stroke-width="3"
                  stroke-linecap="round"/>
        `,
        extra: "",
        color: "#22c55e"
    },

    "🤔": {
        eyes: `
            <path d="M31 43 L41 47"
                  stroke="#f59e0b"
                  stroke-width="3"
                  stroke-linecap="round"/>

            <rect x="57" y="44"
                  width="10"
                  height="4"
                  rx="2"
                  fill="#f59e0b"/>
        `,
        mouth: `
            <path d="M42 62 Q46 58 50 62 T58 62"
                  fill="none"
                  stroke="#f59e0b"
                  stroke-width="2.5"
                  stroke-linecap="round"/>
        `,
        extra: `
            <text
                x="70"
                y="42"
                font-size="7"
                font-family="monospace"
                font-weight="bold"
                fill="#f59e0b">?</text>
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
                stroke-width="2.5"/>

            <circle
                cx="63"
                cy="46"
                r="3.5"
                fill="none"
                stroke="#a855f7"
                stroke-width="2.5"/>
        `,
        mouth: `
            <circle
                cx="50"
                cy="62"
                r="4.5"
                fill="none"
                stroke="#a855f7"
                stroke-width="3"/>
        `,
        extra: "",
        color: "#a855f7"
    },

    "😠": {
        eyes: `
            <path d="M31 48 L41 43"
                  stroke="#ef4444"
                  stroke-width="3.5"
                  stroke-linecap="round"/>

            <path d="M69 48 L59 43"
                  stroke="#ef4444"
                  stroke-width="3.5"
                  stroke-linecap="round"/>
        `,
        mouth: `
            <path d="M41 62 L45 59 L49 64 L53 59 L57 62"
                  fill="none"
                  stroke="#ef4444"
                  stroke-width="2.8"
                  stroke-linecap="round"/>
        `,
        extra: "",
        color: "#ef4444"
    },

    "🙁": {
        eyes: `
            <rect x="33" y="47"
                  width="10"
                  height="2"
                  rx="1"
                  fill="#3b82f6"/>

            <rect x="57" y="47"
                  width="10"
                  height="2"
                  rx="1"
                  fill="#3b82f6"/>
        `,
        mouth: `
            <path d="M43 65 Q50 58 57 65"
                  fill="none"
                  stroke="#3b82f6"
                  stroke-width="2.2"
                  stroke-linecap="round"/>
        `,
        extra: "",
        color: "#3b82f6"
    },

    "😢": {
        eyes: `
            <path d="M32 42 L38 48 M38 42 L32 48"
                  stroke="#3b82f6"
                  stroke-width="2.5"
                  stroke-linecap="round"/>

            <path d="M62 42 L68 48 M68 42 L62 48"
                  stroke="#3b82f6"
                  stroke-width="2.5"
                  stroke-linecap="round"/>
        `,
        mouth: `
            <line x1="42" y1="63"
                  x2="58" y2="63"
                  stroke="#3b82f6"
                  stroke-width="2.5"
                  stroke-linecap="round"/>
        `,
        extra: `
            <text
                x="40"
                y="74"
                font-size="4.5"
                fill="#3b82f6"
                font-family="monospace">SYS_ERR</text>
        `,
        color: "#3b82f6"
    }
};


/* ==========================================================================
   10. EMOTION ENGINE
   ========================================================================== */

const emotionTransitions = {
    "NEUTRAL->HAPPY": ["😐", "😊"],
    "NEUTRAL->THINKING": ["😐", "🤔"],
    "NEUTRAL->SAD": ["😐", "🙁", "😢"],
    "THINKING->SURPRISED": ["🤔", "😲"],
    "THINKING->ANGRY": ["🤔", "😠"],
    "THINKING->HAPPY": ["🤔", "😊"],
    "SURPRISED->NEUTRAL": ["😲", "😐"],
    "ANGRY->NEUTRAL": ["😠", "😐"],
    "HAPPY->NEUTRAL": ["😊", "😐"],
    "SAD->NEUTRAL": ["😢", "🙁", "😐"]
};

const emotionStatus = {
    NEUTRAL: "Online • Chilling",
    THINKING: "Processing neural request...",
    HAPPY: "Response ready • Core stable",
    SURPRISED: "Alert • Unexpected input",
    ANGRY: "Warning • Sass protocol active",
    SAD: "System degraded • Recovering"
};

function transitionTo(targetEmotion) {
    if (!vectorExpressions) return;

    targetEmotion =
        vectorExpressions[
            Object.keys(vectorExpressions).find(
                key => key === targetEmotion
            )
        ]
            ? targetEmotion
            : targetEmotion;

    const faceElement = $("ai-face");
    const statusElement = $("ai-status");

    if (!faceElement) {
        currentEmotion = targetEmotion;
        return;
    }

    if (currentEmotion === targetEmotion) {
        if (statusElement) {
            statusElement.textContent =
                `Status: ${emotionStatus[targetEmotion] || "Online"}`;
        }
        return;
    }

    const emotionEmoji = {
        NEUTRAL: "😐",
        HAPPY: "😊",
        THINKING: "🤔",
        SAD: "😢",
        ANGRY: "😠",
        SURPRISED: "😲"
    };

    const routeKey =
        `${currentEmotion}->${targetEmotion}`;

    const frames =
        emotionTransitions[routeKey] ||
        [
            emotionEmoji[currentEmotion] || "😐",
            emotionEmoji[targetEmotion] || "😐"
        ];

    let frameIndex = 0;

    if (statusElement) {
        statusElement.textContent =
            `Status: ${emotionStatus[targetEmotion] || "Online"}`;
    }

    function nextFrame() {
        if (frameIndex >= frames.length) {
            currentEmotion = targetEmotion;
            return;
        }

        const emoji = frames[frameIndex];

        const vector =
            vectorExpressions[emoji] ||
            vectorExpressions["😐"];

        faceElement.classList.remove("pop-animation");

        void faceElement.offsetWidth;

        faceElement.classList.add("pop-animation");

        faceElement.innerHTML =
            getCharacterSVG(
                vector.eyes,
                vector.mouth,
                vector.extra,
                vector.color
            );

        frameIndex++;

        setTimeout(nextFrame, 160);
    }

    nextFrame();
}


/* ==========================================================================
   11. MARKDOWN RENDERER
   ========================================================================== */

function renderMarkdown(text) {

    let html = escapeHTML(text);

    // Code blocks first.
    html = html.replace(
        /```(\w+)?\n?([\s\S]*?)```/g,
        (_, language, code) => {

            const lang =
                language || "code";

            return `
                <div class="nyx-code-block my-4">

                    <div class="flex items-center
                                justify-between
                                px-3 py-2
                                border-b border-white/10
                                bg-black/20">

                        <span class="text-xs
                                     text-purple-300
                                     uppercase
                                     tracking-wider">
                            ${escapeHTML(lang)}
                        </span>

                        <button
                            onclick="copyText(this)"
                            data-copy="${encodeURIComponent(code)}"
                            class="text-xs text-gray-400
                                   hover:text-white">
                            Copy
                        </button>

                    </div>

                    <pre class="p-4 overflow-x-auto">
<code>${code}</code>
                    </pre>

                </div>
            `;
        }
    );

    // Inline code.
    html = html.replace(
        /`([^`]+)`/g,
        "<code>$1</code>"
    );

    // Bold.
    html = html.replace(
        /\*\*(.*?)\*\*/g,
        "<strong>$1</strong>"
    );

    // Italic.
    html = html.replace(
        /\*(.*?)\*/g,
        "<em>$1</em>"
    );

    // Headings.
    html = html.replace(
        /^### (.*)$/gm,
        "<h4 class='text-purple-300 font-bold text-lg mt-4 mb-2'>$1</h4>"
    );

    html = html.replace(
        /^## (.*)$/gm,
        "<h3 class='text-purple-300 font-bold text-xl mt-4 mb-2'>$1</h3>"
    );

    html = html.replace(
        /^# (.*)$/gm,
        "<h2 class='text-purple-300 font-bold text-2xl mt-4 mb-2'>$1</h2>"
    );

    // Bullets.
    html = html.replace(
        /^[-•] (.*)$/gm,
        "<li class='ml-5 list-disc'>$1</li>"
    );

    // Numbered list.
    html = html.replace(
        /^\d+\. (.*)$/gm,
        "<li class='ml-5 list-decimal'>$1</li>"
    );

    // Links.
    html = html.replace(
        /(https?:\/\/[^\s<]+)/g,
        `<a href="$1"
            target="_blank"
            rel="noopener noreferrer"
            class="text-indigo-400 hover:text-indigo-300 underline">
            $1
        </a>`
    );

    // Newlines.
    html = html.replace(/\n/g, "<br>");

    return html;
}


/* ==========================================================================
   12. CHAT UI
   ========================================================================== */

function scrollChatToBottom() {
    const chatBox = $("chat-messages");

    if (!chatBox) return;

    requestAnimationFrame(() => {
        chatBox.scrollTop =
            chatBox.scrollHeight;
    });
}


function appendUserMessage(message) {

    const chatBox = $("chat-messages");

    if (!chatBox) return null;

    const id =
        `user-${Date.now()}-${Math.random()
            .toString(36)
            .slice(2)}`;

    chatBox.insertAdjacentHTML(
        "beforeend",
        `
        <div
            id="${id}"
            class="nyx-message user-message
                   flex gap-4 flex-row-reverse mb-5">

            <div
                class="w-9 h-9 shrink-0 rounded-xl
                       bg-[#1b152e]
                       border border-indigo-500/30
                       flex items-center justify-center
                       p-1 overflow-hidden">

                ${getUserSVG()}

            </div>

            <div
                class="message-bubble
                       bg-indigo-600/90
                       border border-indigo-400/20
                       p-4 rounded-2xl rounded-tr-sm
                       max-w-[85%] text-sm
                       shadow-lg shadow-indigo-950/20">

                ${renderMarkdown(message)}

            </div>

        </div>
        `
    );

    scrollChatToBottom();

    return id;
}


function appendTypingIndicator() {

    const chatBox = $("chat-messages");

    if (!chatBox) return null;

    const id =
        `typing-${Date.now()}-${Math.random()
            .toString(36)
            .slice(2)}`;

    chatBox.insertAdjacentHTML(
        "beforeend",
        `
        <div
            id="${id}"
            class="nyx-message flex gap-4 mb-5">

            <div
                class="w-9 h-9 shrink-0 rounded-xl
                       bg-[#0d071a]
                       border border-yellow-500/30
                       flex items-center justify-center
                       p-1 overflow-hidden">

                ${getMiniNyxSVG("#f59e0b")}

            </div>

            <div
                class="bg-slate-800/80
                       border border-white/5
                       p-4 rounded-2xl
                       rounded-tl-sm
                       text-sm text-slate-400">

                <div class="nyx-thinking flex gap-1">
                    <span>●</span>
                    <span>●</span>
                    <span>●</span>
                    <span class="ml-2">
                        Nyx is thinking
                    </span>
                </div>

            </div>

        </div>
        `
    );

    scrollChatToBottom();

    return id;
}


/* ==========================================================================
   13. RESPONSE CONTROLS
   ========================================================================== */

function appendAssistantMessage(
    text,
    emotion = "NEUTRAL"
) {

    const chatBox = $("chat-messages");

    if (!chatBox) return null;

    const uniqueId =
        `msg-${Date.now()}-${Math.random()
            .toString(36)
            .slice(2)}`;

    const colorMap = {
        NEUTRAL: "#38bdf8",
        HAPPY: "#22c55e",
        THINKING: "#f59e0b",
        SURPRISED: "#a855f7",
        ANGRY: "#ef4444",
        SAD: "#3b82f6"
    };

    const color =
        colorMap[emotion] ||
        colorMap.NEUTRAL;

    chatBox.insertAdjacentHTML(
        "beforeend",
        `
        <div
            class="nyx-message flex gap-4 mb-5"
            data-message="${uniqueId}">

            <div
                class="w-9 h-9 shrink-0 rounded-xl
                       bg-[#0d071a]
                       border border-indigo-500/30
                       flex items-center justify-center
                       p-1 overflow-hidden">

                ${getMiniNyxSVG(color)}

            </div>

            <div class="max-w-[88%] min-w-0">

                <div
                    class="message-bubble
                           bg-slate-800/90
                           border border-white/5
                           p-4 rounded-2xl
                           rounded-tl-sm
                           text-sm">

                    <div
                        id="${uniqueId}"
                        class="nyx-response prose-invert">
                    </div>

                </div>

                <div
                    class="nyx-response-tools
                           flex flex-wrap gap-2 mt-2
                           opacity-70 hover:opacity-100">

                    <button
                        onclick="copyResponse('${uniqueId}')"
                        class="nyx-tool-button">
                        📋 Copy
                    </button>

                    <button
                        onclick="regenerateLastResponse()"
                        class="nyx-tool-button">
                        🔄 Regenerate
                    </button>

                    <button
                        onclick="speakResponse('${uniqueId}')"
                        class="nyx-tool-button">
                        🔊 Read
                    </button>

                </div>

            </div>

        </div>
        `
    );

    return uniqueId;
}


/* ==========================================================================
   14. STREAM RESPONSE
   ========================================================================== */

async function streamResponse(
    text,
    containerId
) {

    const element = $(containerId);

    if (!element) return;

    element.innerHTML = "";

    // Faster rendering for huge answers.
    const delay =
        text.length > 5000 ? 1 :
        text.length > 2500 ? 3 :
        text.length > 1000 ? 6 :
        12;

    let index = 0;

    return new Promise(resolve => {

        function writeChunk() {

            if (index >= text.length) {
                element.innerHTML =
                    renderMarkdown(text);

                scrollChatToBottom();

                resolve();
                return;
            }

            // Write multiple chars at once.
            const chunkSize =
                text.length > 4000 ? 12 :
                text.length > 2000 ? 8 :
                4;

            index =
                Math.min(
                    index + chunkSize,
                    text.length
                );

            element.innerHTML =
                renderMarkdown(
                    text.slice(0, index)
                );

            scrollChatToBottom();

            setTimeout(
                writeChunk,
                delay
            );
        }

        writeChunk();
    });
}


/* ==========================================================================
   15. COMMAND SYSTEM
   ========================================================================== */

function executeConsoleCommand(command) {

    const input =
        $("user-input");

    if (!input) return;

    input.value = command;

    sendToAI();
}


async function processCommand(command) {

    const parts =
        command.trim().split(/\s+/);

    const cmd =
        parts[0].toLowerCase();

    const argument =
        command
            .slice(parts[0].length)
            .trim();

    switch (cmd) {

        case "/clear":

            clearConversation();

            return true;


        case "/toggle-sass":

            sassEnabled = !sassEnabled;

            saveState();

            appendAssistantMessage(
                sassEnabled
                    ? "Sass protocol **enabled**. Try not to make me regret it."
                    : "Sass protocol **disabled**. Professional mode activated.",
                sassEnabled
                    ? "HAPPY"
                    : "NEUTRAL"
            );

            return true;


        case "/summarize":

            if (!conversationHistory.length) {

                appendAssistantMessage(
                    "There is no conversation to summarize yet.",
                    "SURPRISED"
                );

                return true;
            }

            await runSpecialTool(
                "summarize",
                argument ||
                "Summarize the conversation so far."
            );

            return true;


        case "/translate":

            await runSpecialTool(
                "translate",
                argument ||
                "Translate the previous response to English."
            );

            return true;


        case "/code":

            await runSpecialTool(
                "code",
                argument ||
                "Help me write or debug code."
            );

            return true;


        case "/imagine":

            await runMediaTool(
                "imagine",
                argument ||
                "Create an image based on this request."
            );

            return true;


        case "/draw":

            await runMediaTool(
                "imagine",
                argument ||
                "Create an image based on this request."
            );

            return true;


        case "/edit":

            await runMediaTool(
                "edit",
                argument ||
                "Edit the provided image."
            );

            return true;


        case "/image":

        case "/images":

            await runMediaTool(
                "image-search",
                argument ||
                "popular images"
            );

            return true;


        case "/video":

        case "/videos":

            await runMediaTool(
                "video-search",
                argument ||
                "popular videos"
            );

            return true;


        case "/help":

            showCommandHelp();

            return true;


        case "/status":

            showSystemStatus();

            return true;


        default:

            return false;
    }
}


function showCommandHelp() {

    const commands = `
### Nyxium Command Matrix

**AI**
- \`/ask question\` — Ask Nyxium AI
- \`/code request\` — Coding assistant
- \`/summarize\` — Summarize the conversation
- \`/translate text\` — Translation mode

**Media**
- \`/imagine prompt\` — Generate an image
- \`/draw prompt\` — Generate an image
- \`/edit request\` — Edit an image
- \`/images query\` — Image search
- \`/videos query\` — Video search

**System**
- \`/clear\` — Clear memory
- \`/toggle-sass\` — Toggle Nyx personality
- \`/status\` — System status
- \`/help\` — Show commands
    `;

    appendAssistantMessage(
        commands,
        "HAPPY"
    );
}


/* ==========================================================================
   16. SYSTEM STATUS
   ========================================================================== */

function showSystemStatus() {

    const historySize =
        conversationHistory.length;

    appendAssistantMessage(
        `
### ⚡ Nyxium System Status

| Module | Status |
|---|---|
| Core AI | 🟢 Online |
| Conversation Memory | 🟢 ${historySize} messages |
| Emotion Engine | 🟢 Online |
| Local Fallback | 🟢 Ready |
| Puter Auxiliary Node | 🟡 Available |
| Sass Protocol | ${sassEnabled ? "🟢 Enabled" : "⚪ Disabled"} |
| UI Engine | 🟢 Online |
        `,
        "HAPPY"
    );
}


/* ==========================================================================
   17. CLEAR CHAT
   ========================================================================== */

function clearConversation() {

    if (currentRequestController) {
        currentRequestController.abort();
        currentRequestController = null;
    }

    conversationHistory = [];

    saveState();

    const chatBox =
        $("chat-messages");

    if (chatBox) {
        chatBox.innerHTML = `
            <div class="nyx-empty-state
                        text-center py-12
                        text-gray-500">

                <div class="text-4xl mb-3">
                    🌌
                </div>

                <p class="font-semibold">
                    Nyxium memory cleared.
                </p>

                <p class="text-xs mt-1">
                    The next conversation starts fresh.
                </p>

            </div>
        `;
    }

    transitionTo("HAPPY");

    clearTimeout(idleTimeout);

    idleTimeout =
        setTimeout(
            () => transitionTo("NEUTRAL"),
            1500
        );
}


/* ==========================================================================
   18. LOCAL MATH ENGINE
   ========================================================================== */

function tryLocalResponse(message) {

    const normalized =
        message.toLowerCase().trim();

    const mathRegex =
        /(-?\d+)\s*(multiply by|times|\*|x|plus|add|\+|minus|subtract|-|divided by|divide|\/)\s*(-?\d+)/i;

    const match =
        message.match(mathRegex);

    if (match) {

        try {

            const a =
                BigInt(match[1]);

            const operator =
                match[2].toLowerCase();

            const b =
                BigInt(match[3]);

            let result;

            if (
                operator.includes("multiply") ||
                operator === "times" ||
                operator === "*" ||
                operator === "x"
            ) {
                result = a * b;
            }

            else if (
                operator.includes("plus") ||
                operator === "add" ||
                operator === "+"
            ) {
                result = a + b;
            }

            else if (
                operator.includes("minus") ||
                operator === "subtract" ||
                operator === "-"
            ) {
                result = a - b;
            }

            else if (
                operator.includes("divide") ||
                operator === "/"
            ) {

                if (b === 0n) {
                    return "[SURPRISED] Division by zero detected.";
                }

                result = a / b;
            }

            return `[HAPPY] Boom. The exact result is **${result}**.`;

        } catch {
            return "[SAD] My local arithmetic processor hit a numerical overflow.";
        }
    }

    if (
        normalized === "hi" ||
        normalized === "hello" ||
        normalized === "hey" ||
        normalized === "hola"
    ) {
        return sassEnabled
            ? "[HAPPY] Oh, hey. Nyxium core online. What are we building?"
            : "[HAPPY] Hello. Nyxium AI is ready.";
    }

    if (
        normalized.includes("who are you") ||
        normalized.includes("your name")
    ) {
        return "[NEUTRAL] I am **Nyx**, the cybernetic AI core of the Nyxium Terminal.";
    }

    if (normalized.length < 3) {
        return "[SURPRISED] That input is a little too short for my neural arrays.";
    }

    return "[NEUTRAL] My primary network is temporarily unavailable. I can still handle basic calculations and offline requests.";
}


/* ==========================================================================
   19. PRIMARY AI REQUEST
   ========================================================================== */

async function requestPrimaryAI(
    message
) {

    currentRequestController =
        new AbortController();

    const response =
        await fetch(
            "/api/chat",
            {
                method: "POST",

                headers: {
                    "Content-Type":
                        "application/json"
                },

                body: JSON.stringify({
                    message,
                    history:
                        conversationHistory
                            .slice(-MAX_HISTORY_TURNS)
                }),

                signal:
                    currentRequestController.signal
            }
        );

    if (!response.ok) {
        throw new Error(
            `API ${response.status}`
        );
    }

    const data =
        await response.json();

    if (!data.reply) {
        throw new Error(
            "Backend returned no reply"
        );
    }

    return data.reply;
}


/* ==========================================================================
   20. PUTER FALLBACK
   ========================================================================== */

async function requestPuterAI(
    message
) {

    if (
        typeof puter === "undefined" ||
        !puter.ai ||
        typeof puter.ai.chat !== "function"
    ) {
        throw new Error(
            "Puter unavailable"
        );
    }

    const historyText =
        conversationHistory
            .slice(-MAX_HISTORY_TURNS)
            .map(item =>
                `${item.role === "user"
                    ? "User"
                    : "Nyx"}: ${item.content}`
            )
            .join("\n");

    const personality =
        sassEnabled
            ? `
You may be witty, slightly sarcastic and playful
for simple or silly questions.
`
            : `
Remain professional, calm and concise.
Do not use sarcastic responses.
`;

    const prompt = `
You are Nyx, the AI core of Nyxium AI.

IDENTITY:
You are Nyx.
You are not an anime character.
Do not claim to be Google Gemini.
Do not claim to be another AI.

PERSONALITY:
${personality}

CAPABILITIES:
- Mathematics
- Science
- Programming
- Debugging
- Writing
- Reasoning
- Explanations
- Translation
- Summarization
- General knowledge

IMPORTANT:
Always answer the user's actual request.
Never intentionally give incorrect calculations.
For difficult questions, explain your reasoning clearly.
For programming requests, provide complete usable solutions.

FORMAT:
Begin your response with exactly one emotion tag:

[NEUTRAL]
[HAPPY]
[THINKING]
[SURPRISED]
[SAD]
[ANGRY]

Then write the answer.

CONVERSATION MEMORY:
${historyText}

CURRENT USER MESSAGE:
${message}
    `.trim();

    const result =
        await puter.ai.chat(prompt);

    /*
     * Puter can return different shapes depending
     * on the selected model/runtime.
     */

    if (typeof result === "string") {
        return result;
    }

    if (result?.message?.content) {
        if (typeof result.message.content === "string") {
            return result.message.content;
        }

        if (
            Array.isArray(result.message.content)
        ) {
            return result.message.content
                .map(x =>
                    typeof x === "string"
                        ? x
                        : x?.text || ""
                )
                .join("");
        }
    }

    if (result?.text) {
        return result.text;
    }

    return JSON.stringify(result);
}


/* ==========================================================================
   21. SPECIAL AI TOOLS
   ========================================================================== */

async function runSpecialTool(
    tool,
    request
) {

    const command =
        `/${tool} ${request}`;

    const input =
        $("user-input");

    if (input) {
        input.value = "";
    }

    appendUserMessage(command);

    transitionTo("THINKING");

    const typingId =
        appendTypingIndicator();

    let response = null;

    try {

        /*
         * Backend tool endpoint.
         *
         * Example:
         * POST /api/tools
         * {
         *   tool: "summarize",
         *   message: "...",
         *   history: [...]
         * }
         */

        const res =
            await fetch(
                "/api/tools",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({
                        tool,
                        message: request,
                        history:
                            conversationHistory
                    })
                }
            );

        if (res.ok) {

            const data =
                await res.json();

            response =
                data.reply ||
                data.result ||
                null;
        }

    } catch (error) {
        console.warn(
            `Tool ${tool} unavailable:`,
            error
        );
    }

    if (!response) {

        response =
            await requestPuterAI(
                `${command}\n\nUser request: ${request}`
            )
                .catch(() =>
                    tryLocalResponse(request)
                );
    }

    if (typingId) {
        $(typingId)?.remove();
    }

    handleEngineResponse(
        response,
        $("chat-messages")
    );
}


/* ==========================================================================
   22. MEDIA TOOLS
   ========================================================================== */

async function runMediaTool(
    tool,
    query
) {

    appendUserMessage(
        `/${tool} ${query}`
    );

    transitionTo("THINKING");

    const typingId =
        appendTypingIndicator();

    try {

        const res =
            await fetch(
                "/api/media",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({
                        tool,
                        query
                    })
                }
            );

        if (!res.ok) {
            throw new Error(
                `Media API ${res.status}`
            );
        }

        const data =
            await res.json();

        if (typingId) {
            $(typingId)?.remove();
        }

        renderMediaResult(
            data,
            tool
        );

        transitionTo("HAPPY");

    } catch (error) {

        console.warn(
            "Media node unavailable:",
            error
        );

        if (typingId) {
            $(typingId)?.remove();
        }

        appendAssistantMessage(
            `
### Media node unavailable

The **${tool}** operation could not connect to the media backend.

Make sure your backend exposes:

\`POST /api/media\`

Supported providers can be connected there, including Pexels and Hugging Face.
            `,
            "SAD"
        );
    }
}


/* ==========================================================================
   23. MEDIA RESULT RENDERER
   ========================================================================== */

function renderMediaResult(
    data,
    tool
) {

    const chatBox =
        $("chat-messages");

    if (!chatBox) return;

    const items =
        Array.isArray(data?.results)
            ? data.results
            : Array.isArray(data)
                ? data
                : [];

    if (!items.length) {

        appendAssistantMessage(
            data?.message ||
            "The media node returned no results.",
            "SURPRISED"
        );

        return;
    }

    const titleMap = {
        imagine: "🌌 Generated Image",
        edit: "🛠️ Edited Image",
        "image-search": "🖼️ Image Results",
        "video-search": "🎬 Video Results"
    };

    const title =
        titleMap[tool] ||
        "Nyxium Media";

    const cards =
        items
            .slice(0, 12)
            .map((item, index) => {

                const image =
                    item.url ||
                    item.image ||
                    item.thumbnail ||
                    item.src;

                const video =
                    item.video ||
                    item.videoUrl;

                const name =
                    item.title ||
                    item.name ||
                    `Result ${index + 1}`;

                if (video) {

                    return `
                        <div class="nyx-media-card">

                            <video
                                src="${escapeHTML(video)}"
                                poster="${escapeHTML(
                                    item.thumbnail || ""
                                )}"
                                controls
                                class="w-full rounded-xl">
                            </video>

                            <div class="p-3">

                                <div class="font-semibold">
                                    ${escapeHTML(name)}
                                </div>

                                <a
                                    href="${escapeHTML(video)}"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    class="nyx-media-link">
                                    Open
                                </a>

                            </div>

                        </div>
                    `;
                }

                return `
                    <div class="nyx-media-card">

                        <img
                            src="${escapeHTML(image || "")}"
                            alt="${escapeHTML(name)}"
                            loading="lazy"
                            class="w-full aspect-video
                                   object-cover rounded-xl"/>

                        <div class="p-3">

                            <div class="font-semibold text-sm">
                                ${escapeHTML(name)}
                            </div>

                            <div class="flex gap-2 mt-3">

                                <a
                                    href="${escapeHTML(image || "")}"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    class="nyx-media-link">
                                    Open
                                </a>

                                <button
                                    onclick="copyTextValue('${encodeURIComponent(
                                        image || ""
                                    )}')"
                                    class="nyx-tool-button">
                                    Copy URL
                                </button>

                            </div>

                        </div>

                    </div>
                `;
            })
            .join("");

    chatBox.insertAdjacentHTML(
        "beforeend",
        `
        <div class="flex gap-4 mb-5">

            <div
                class="w-9 h-9 shrink-0 rounded-xl
                       bg-[#0d071a]
                       border border-purple-500/30
                       p-1">

                ${getMiniNyxSVG("#a855f7")}

            </div>

            <div class="max-w-[92%] min-w-0">

                <div
                    class="bg-slate-800/90
                           border border-white/5
                           p-4 rounded-2xl
                           rounded-tl-sm">

                    <div class="font-bold text-purple-300 mb-4">
                        ${title}
                    </div>

                    <div
                        class="grid grid-cols-1
                               sm:grid-cols-2
                               lg:grid-cols-3 gap-4">

                        ${cards}

                    </div>

                </div>

            </div>

        </div>
        `
    );

    scrollChatToBottom();
}


/* ==========================================================================
   24. MAIN CHAT FUNCTION
   ========================================================================== */

async function sendToAI() {

    if (isGenerating) {
        return;
    }

    const input =
        $("user-input");

    const chatBox =
        $("chat-messages");

    if (!input || !chatBox) {
        return;
    }

    const userMsg =
        input.value.trim();

    if (!userMsg) {
        return;
    }

    input.value = "";

    lastUserPrompt =
        userMsg;

    clearTimeout(idleTimeout);

    /*
     * Command interception.
     */

    if (
        userMsg.startsWith("/")
    ) {

        const handled =
            await processCommand(
                userMsg
            );

        if (handled) {
            return;
        }
    }

    /*
     * User message.
     */

    appendUserMessage(
        userMsg
    );

    conversationHistory.push({
        role: "user",
        content: userMsg
    });

    trimHistory();

    saveState();

    transitionTo(
        "THINKING"
    );

    const typingId =
        appendTypingIndicator();

    isGenerating = true;

    updateGenerationUI(true);

    let finalResponse = null;

    /*
     * STEP 1
     * Primary backend.
     */

    try {

        finalResponse =
            await requestPrimaryAI(
                userMsg
            );

    } catch (error) {

        if (
            error.name === "AbortError"
        ) {
            return;
        }

        console.warn(
            "Primary Nyxium API unavailable:",
            error
        );
    }

    /*
     * STEP 2
     * Puter.
     */

    if (!finalResponse) {

        updateTypingStatus(
            typingId,
            "Connecting to auxiliary AI node..."
        );

        try {

            finalResponse =
                await Promise.race([
                    requestPuterAI(
                        userMsg
                    ),

                    new Promise(
                        (_, reject) =>
                            setTimeout(
                                () =>
                                    reject(
                                        new Error(
                                            "Puter timeout"
                                        )
                                    ),
                                12000
                            )
                    )
                ]);

        } catch (error) {

            console.warn(
                "Puter fallback unavailable:",
                error
            );
        }
    }

    /*
     * STEP 3
     * Local processor.
     */

    if (!finalResponse) {

        updateTypingStatus(
            typingId,
            "Activating local processor..."
        );

        finalResponse =
            tryLocalResponse(
                userMsg
            );
    }

    /*
     * Remove typing bubble.
     */

    if (typingId) {
        $(typingId)?.remove();
    }

    /*
     * Final response.
     */

    handleEngineResponse(
        finalResponse,
        chatBox
    );

    isGenerating = false;

    updateGenerationUI(false);
}


/* ==========================================================================
   25. RESPONSE HANDLER
   ========================================================================== */

async function handleEngineResponse(
    text,
    chatBox
) {

    if (!text) {
        text =
            "[SAD] Nyxium returned an empty response.";
    }

    /*
     * Normalize API response.
     */

    if (
        typeof text !== "string"
    ) {

        try {
            text =
                text?.message?.content ||
                text?.text ||
                JSON.stringify(text);

        } catch {
            text =
                String(text);
        }
    }

    /*
     * Remove accidental duplicate wrappers.
     */

    text =
        text.trim();

    const match =
        text.match(
            /^\[([A-Z]+)\]\s*([\s\S]*)$/i
        );

    let emotion =
        "NEUTRAL";

    let content =
        text;

    if (match) {

        emotion =
            match[1].toUpperCase();

        content =
            match[2].trim();

    }

    const validEmotions = [
        "NEUTRAL",
        "HAPPY",
        "THINKING",
        "SURPRISED",
        "SAD",
        "ANGRY"
    ];

    if (
        !validEmotions.includes(
            emotion
        )
    ) {
        emotion = "NEUTRAL";
    }

    lastAssistantResponse =
        content;

    conversationHistory.push({
        role: "assistant",
        content
    });

    trimHistory();

    saveState();

    transitionTo(
        emotion
    );

    const messageId =
        appendAssistantMessage(
            "",
            emotion
        );

    await streamResponse(
        content,
        messageId
    );

    idleTimeout =
        setTimeout(
            () => {
                transitionTo(
                    "NEUTRAL"
                );
            },
            5000
        );

    updateGenerationUI(false);
}


/* ==========================================================================
   26. HISTORY MANAGEMENT
   ========================================================================== */

function trimHistory() {

    if (
        conversationHistory.length >
        MAX_HISTORY_TURNS
    ) {

        conversationHistory =
            conversationHistory.slice(
                -MAX_HISTORY_TURNS
            );
    }
}


/* ==========================================================================
   27. TYPING STATUS
   ========================================================================== */

function updateTypingStatus(
    typingId,
    text
) {

    if (!typingId) return;

    const element =
        $(typingId);

    if (!element) return;

    const status =
        element.querySelector(
            ".nyx-thinking"
        );

    if (status) {
        status.innerHTML = `
            <span>●</span>
            <span>●</span>
            <span>●</span>
            <span class="ml-2">
                ${escapeHTML(text)}
            </span>
        `;
    }
}


/* ==========================================================================
   28. GENERATION UI
   ========================================================================== */

function updateGenerationUI(
    generating
) {

    const input =
        $("user-input");

    const sendButton =
        document.querySelector(
            "[onclick=\"sendToAI()\"]"
        );

    if (input) {
        input.disabled =
            generating;

        input.classList.toggle(
            "opacity-50",
            generating
        );
    }

    if (sendButton) {

        sendButton.disabled =
            generating;

        sendButton.textContent =
            generating
                ? "Thinking..."
                : "Send";
    }
}


/* ==========================================================================
   29. COPY SYSTEM
   ========================================================================== */

async function copyText(
    button
) {

    const encoded =
        button.dataset.copy;

    if (!encoded) return;

    const value =
        decodeURIComponent(
            encoded
        );

    await copyToClipboard(
        value
    );

    const oldText =
        button.textContent;

    button.textContent =
        "Copied ✓";

    setTimeout(
        () => {
            button.textContent =
                oldText;
        },
        1200
    );
}


async function copyTextValue(
    encoded
) {

    const value =
        decodeURIComponent(
            encoded
        );

    await copyToClipboard(
        value
    );
}


async function copyToClipboard(
    text
) {

    try {

        await navigator.clipboard.writeText(
            text
        );

    } catch {

        const textarea =
            document.createElement(
                "textarea"
            );

        textarea.value =
            text;

        textarea.style.position =
            "fixed";

        textarea.style.opacity =
            "0";

        document.body.appendChild(
            textarea
        );

        textarea.select();

        document.execCommand(
            "copy"
        );

        textarea.remove();
    }
}


async function copyResponse(
    messageId
) {

    const element =
        $(messageId);

    if (!element) return;

    await copyToClipboard(
        element.innerText
    );
}


async function speakResponse(
    messageId
) {

    const element =
        $(messageId);

    if (
        !element ||
        !("speechSynthesis" in window)
    ) {
        return;
    }

    window.speechSynthesis.cancel();

    const speech =
        new SpeechSynthesisUtterance(
            element.innerText
        );

    speech.rate =
        1;

    speech.pitch =
        0.95;

    speech.volume =
        1;

    window.speechSynthesis.speak(
        speech
    );
}


/* ==========================================================================
   30. REGENERATE
   ========================================================================== */

async function regenerateLastResponse() {

    if (
        !lastUserPrompt ||
        isGenerating
    ) {
        return;
    }

    const chatBox =
        $("chat-messages");

    if (!chatBox) return;

    /*
     * Remove the last assistant response
     * from memory.
     */

    for (
        let i =
            conversationHistory.length - 1;
        i >= 0;
        i--
    ) {

        if (
            conversationHistory[i].role ===
            "assistant"
        ) {

            conversationHistory.splice(
                i,
                1
            );

            break;
        }
    }

    saveState();

    /*
     * Re-send without creating another
     * visible user message.
     */

    const typingId =
        appendTypingIndicator();

    transitionTo(
        "THINKING"
    );

    isGenerating = true;

    let response = null;

    try {

        response =
            await requestPrimaryAI(
                lastUserPrompt
            );

    } catch {

        try {

            response =
                await requestPuterAI(
                    lastUserPrompt
                );

        } catch {

            response =
                tryLocalResponse(
                    lastUserPrompt
                );
        }
    }

    if (typingId) {
        $(typingId)?.remove();
    }

    handleEngineResponse(
        response,
        chatBox
    );

    isGenerating = false;
}


/* ==========================================================================
   31. KEYBOARD SHORTCUTS
   ========================================================================== */

document.addEventListener(
    "keydown",
    event => {

        /*
         * Ctrl + K
         * Focus chat.
         */

        if (
            (event.ctrlKey ||
                event.metaKey) &&
            event.key.toLowerCase() === "k"
        ) {

            event.preventDefault();

            const input =
                $("user-input");

            if (input) {
                showView("chat");
                input.focus();
            }
        }

        /*
         * Escape stops speech.
         */

        if (
            event.key === "Escape" &&
            "speechSynthesis" in window
        ) {

            speechSynthesis.cancel();
        }
    }
);


/* ==========================================================================
   32. ENTER KEY
   ========================================================================== */

document.addEventListener(
    "keydown",
    event => {

        const target =
            event.target;

        if (
            target &&
            target.id ===
            "user-input" &&
            event.key === "Enter" &&
            !event.shiftKey
        ) {

            event.preventDefault();

            sendToAI();
        }
    }
);


/* ==========================================================================
   33. AUTO RESTORE CHAT
   ========================================================================== */

function restoreConversationUI() {

    const chatBox =
        $("chat-messages");

    if (!chatBox) return;

    if (
        !conversationHistory.length
    ) {
        return;
    }

    chatBox.innerHTML = "";

    conversationHistory.forEach(
        message => {

            if (
                message.role ===
                "user"
            ) {

                appendUserMessage(
                    message.content
                );

            }

            else if (
                message.role ===
                "assistant"
            ) {

                appendAssistantMessage(
                    message.content,
                    "NEUTRAL"
                );

                const messages =
                    chatBox.querySelectorAll(
                        ".nyx-response"
                    );

                const last =
                    messages[
                        messages.length - 1
                    ];

                if (last) {
                    last.innerHTML =
                        renderMarkdown(
                            message.content
                        );
                }
            }
        }
    );

    scrollChatToBottom();
}


/* ==========================================================================
   34. INITIALIZATION
   ========================================================================== */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        const face =
            $("ai-face");

        if (face) {

            const vector =
                vectorExpressions["😐"];

            face.innerHTML =
                getCharacterSVG(
                    vector.eyes,
                    vector.mouth,
                    vector.extra,
                    vector.color
                );
        }

        restoreConversationUI();

        updateSidebarState(
            "dashboard"
        );

        /*
         * Expose initial status.
         */

        const status =
            $("ai-status");

        if (status) {
            status.textContent =
                `Status: ${emotionStatus.NEUTRAL}`;
        }

        /*
         * Make sass state available to
         * any settings UI.
         */

        document.body.dataset.sass =
            sassEnabled
                ? "on"
                : "off";

    }
);


/* ==========================================================================
   35. GLOBAL API
   --------------------------------------------------------------------------
   Makes buttons from index.html able to access Nyxium functions.
   ========================================================================== */

window.showView =
    showView;

window.sendToAI =
    sendToAI;

window.executeConsoleCommand =
    executeConsoleCommand;

window.copyText =
    copyText;

window.copyTextValue =
    copyTextValue;

window.copyResponse =
    copyResponse;

window.speakResponse =
    speakResponse;

window.regenerateLastResponse =
    regenerateLastResponse;

window.transitionTo =
    transitionTo;

window.clearConversation =
    clearConversation;


/* ==========================================================================
   NYXIUM CORE ONLINE
   ========================================================================== */

console.log(
    "%c⚡ NYXIUM AI CORE ONLINE",
    "color:#a855f7;font-size:18px;font-weight:bold;"
);

console.log(
    "%cNeural UI V2 • Memory • Tools • Media • Fallback Engine",
    "color:#38bdf8;font-size:12px;"
);
