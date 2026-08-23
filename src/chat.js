/* ============================================================
   NYXIUM AI — CHAT ENGINE
   Version: 2.0
   ============================================================ */

/* ------------------------------------------------------------
   GLOBAL STATE
------------------------------------------------------------ */

let conversationHistory = [];
const MAX_HISTORY_TURNS = 12;

let currentEmotion = "NEUTRAL";
let idleTimeout = null;
let lastUserMessage = "";
let lastAssistantMessage = "";
let sassEnabled = true;
let isGenerating = false;

const nyxiumTips = [
  "Ask Nyxium AI to explain difficult topics step-by-step.",
  "Use Summarize to turn long text into quick notes.",
  "Use Translate to translate text between languages.",
  "Use Code mode for debugging, explanations, and programming help.",
  "You can continue a conversation without repeating previous context."
];


/* ============================================================
   NAVIGATION
============================================================ */

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


/* ============================================================
   SAFE HTML HELPERS
------------------------------------------------------------ */

function escapeHTML(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}


/* ============================================================
   MARKDOWN RENDERER
------------------------------------------------------------ */

function renderMarkdown(text) {
  if (!text) return "";

  let safe = escapeHTML(text);

  /*
    Protect fenced code blocks first.
  */

  const codeBlocks = [];

  safe = safe.replace(
    /```([a-zA-Z0-9_+-]*)\n?([\s\S]*?)```/g,
    (_, language, code) => {
      const id = `code-${codeBlocks.length}`;

      codeBlocks.push({
        id,
        language: language || "text",
        code
      });

      return `___CODE_BLOCK_${codeBlocks.length - 1}___`;
    }
  );

  /*
    Inline code
  */

  safe = safe.replace(
    /`([^`\n]+)`/g,
    '<code class="nyx-inline-code">$1</code>'
  );

  /*
    Bold
  */

  safe = safe.replace(
    /\*\*(.*?)\*\*/g,
    "<strong>$1</strong>"
  );

  /*
    Italic
  */

  safe = safe.replace(
    /(^|[^\*])\*([^*\n]+)\*/g,
    "$1<em>$2</em>"
  );

  /*
    Headings
  */

  safe = safe.replace(
    /^### (.+)$/gm,
    '<h4 class="nyx-heading nyx-h3">$1</h4>'
  );

  safe = safe.replace(
    /^## (.+)$/gm,
    '<h3 class="nyx-heading nyx-h2">$1</h3>'
  );

  safe = safe.replace(
    /^# (.+)$/gm,
    '<h2 class="nyx-heading nyx-h1">$1</h2>'
  );

  /*
    Unordered lists
  */

  safe = safe.replace(
    /^(?:[-*]) (.+)$/gm,
    '<li class="nyx-list-item">$1</li>'
  );

  safe = safe.replace(
    /(<li class="nyx-list-item">.*<\/li>)/gs,
    '<ul class="nyx-list">$1</ul>'
  );

  /*
    Ordered lists
  */

  safe = safe.replace(
    /^\d+\.\s+(.+)$/gm,
    '<li class="nyx-ordered-item">$1</li>'
  );

  safe = safe.replace(
    /(<li class="nyx-ordered-item">.*<\/li>)/gs,
    '<ol class="nyx-list">$1</ol>'
  );

  /*
    Links
  */

  safe = safe.replace(
    /(https?:\/\/[^\s<]+)/g,
    '<a href="$1" target="_blank" rel="noopener noreferrer" class="nyx-link">$1</a>'
  );

  /*
    Paragraphs / line breaks
  */

  safe = safe.replace(/\n{2,}/g, "</p><p>");
  safe = safe.replace(/\n/g, "<br>");

  safe = `<p>${safe}</p>`;

  /*
    Restore code blocks.
  */

  codeBlocks.forEach(block => {
    const escapedCode = block.code;

    const codeHTML = `
      <div class="nyx-code-wrapper">
        <div class="nyx-code-header">
          <span>${escapeHTML(block.language)}</span>

          <button
            class="nyx-copy-code"
            onclick="copyTextFromCode(this)"
            type="button"
          >
            Copy
          </button>
        </div>

        <pre><code>${escapedCode}</code></pre>
      </div>
    `;

    safe = safe.replace(
      `___CODE_BLOCK_${block.id.split("-")[1]}___`,
      codeHTML
    );
  });

  return safe;
}


/* ============================================================
   COPY SYSTEM
------------------------------------------------------------ */

async function copyText(text, button = null) {
  try {
    await navigator.clipboard.writeText(text);

    if (button) {
      const oldText = button.innerText;
      button.innerText = "Copied ✓";

      setTimeout(() => {
        button.innerText = oldText;
      }, 1500);
    }

    return true;
  } catch (error) {
    console.warn("Clipboard error:", error);
    return false;
  }
}


function copyTextFromCode(button) {
  const wrapper = button.closest(".nyx-code-wrapper");

  if (!wrapper) return;

  const code = wrapper.querySelector("code");

  if (!code) return;

  copyText(code.innerText, button);
}


function copyMessage(button) {
  const message = button.closest(".nyx-ai-message");

  if (!message) return;

  const content = message.querySelector(".nyx-message-content");

  if (!content) return;

  copyText(content.innerText, button);
}


/* ============================================================
   TIP SYSTEM
------------------------------------------------------------ */

function showRandomTip() {
  const tipBox = document.getElementById("ai-tip-box");

  if (!tipBox) return;

  const tip =
    nyxiumTips[Math.floor(Math.random() * nyxiumTips.length)];

  tipBox.innerHTML = `
    <div class="nyx-tip">
      <div class="nyx-tip-icon">✦</div>

      <div>
        <strong>Nyxium AI Tip</strong>
        <p>${escapeHTML(tip)}</p>
      </div>

      <button
        type="button"
        class="nyx-tip-close"
        onclick="this.parentElement.remove()"
      >
        ×
      </button>
    </div>
  `;
}


/* ============================================================
   NYXIUM AI VISOR
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
          <stop offset="0%" stop-color="#251445"/>
          <stop offset="50%" stop-color="#100720"/>
          <stop offset="100%" stop-color="#05010e"/>
        </linearGradient>

      </defs>

      <path
        d="M20 28 C20 15 80 15 80 28 L84 50 C84 70 74 84 50 88 C26 84 16 70 16 50Z"
        fill="url(#helm-grad)"
        stroke="#6b21a8"
        stroke-width="2.5"
      />

      <path
        d="M16 35 L7 28 L15 48Z"
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

      <path
        d="M84 35 L93 28 L85 48Z"
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

      <path
        d="M23 38 C23 32 77 32 77 38 L73 66 C73 73 64 79 50 79 C36 79 27 73 27 66Z"
        fill="#04010a"
        stroke="#1e1b4b"
        stroke-width="1.5"
      />

      <path
        d="M23 38 C23 32 77 32 77 38 L73 66 C73 73 64 79 50 79 C36 79 27 73 27 66Z"
        fill="url(#visor-grid)"
      />

      <path
        d="M27 44 L27 40 L31 40"
        fill="none"
        stroke="${glowColor}"
        stroke-width="1"
        opacity="0.4"
      />

      <path
        d="M73 44 L73 40 L69 40"
        fill="none"
        stroke="${glowColor}"
        stroke-width="1"
        opacity="0.4"
      />

      <path
        d="M27 62 L27 66 L31 66"
        fill="none"
        stroke="${glowColor}"
        stroke-width="1"
        opacity="0.4"
      />

      <path
        d="M73 62 L73 66 L69 66"
        fill="none"
        stroke="${glowColor}"
        stroke-width="1"
        opacity="0.4"
      />

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
      xmlns="http://www.w3.org/2000/svg"
    >

      <defs>
        <filter
          id="mini-glow"
          x="-20%"
          y="-20%"
          width="140%"
          height="140%"
        >
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
        d="M20 28 C20 15 80 15 80 28 L84 50 C84 70 74 84 50 88 C26 84 16 70 16 50Z"
        fill="#0f0720"
        stroke="#6b21a8"
        stroke-width="4"
      />

      <path
        d="M23 38 C23 32 77 32 77 38 L73 66 C73 73 64 79 50 79 C36 79 27 73 27 66Z"
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
        r="18"
        fill="#c4b5fd"
      />

      <path
        d="M20 83 C20 64 80 64 80 83Z"
        fill="#c4b5fd"
      />
    </svg>
  `;
}


/* ============================================================
   EXPRESSIONS
------------------------------------------------------------ */

const vectorExpressions = {

  "😐": {
    eyes: `
      <rect x="33" y="44" width="10" height="4" rx="2" fill="#38bdf8"/>
      <rect x="57" y="44" width="10" height="4" rx="2" fill="#38bdf8"/>
    `,
    mouth: `
      <line x1="44" y1="62" x2="56" y2="62"
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
    extra: "",
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
        stroke-linecap="round"
      />
    `,
    extra: "",
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
        stroke-linecap="round"
      />
    `,
    extra: "",
    color: "#3b82f6"
  },

  "😢": {
    eyes: `
      <path
        d="M32 42 L38 48 M38 42 L32 48"
        stroke="#3b82f6"
        stroke-width="2.5"
        stroke-linecap="round"
      />

      <path
        d="M62 42 L68 48 M68 42 L62 48"
        stroke="#3b82f6"
        stroke-width="2.5"
        stroke-linecap="round"
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
        stroke-linecap="round"
      />
    `,
    extra: "",
    color: "#3b82f6"
  }
};


/* ============================================================
   EMOTION ENGINE
------------------------------------------------------------ */

const emotionMap = {
  NEUTRAL: "😐",
  HAPPY: "😊",
  THINKING: "🤔",
  SAD: "😢",
  ANGRY: "😠",
  SURPRISED: "😲"
};


function transitionTo(targetEmotion) {

  if (!emotionMap[targetEmotion]) {
    targetEmotion = "NEUTRAL";
  }

  const face = document.getElementById("ai-face");
  const status = document.getElementById("ai-status");

  if (!face) return;

  const emoji = emotionMap[targetEmotion];
  const vector = vectorExpressions[emoji];

  currentEmotion = targetEmotion;

  if (status) {

    const statusMap = {
      NEUTRAL: "Online • Ready",
      HAPPY: "Online • Engaged",
      THINKING: "Processing request...",
      SAD: "System • Degraded",
      ANGRY: "System • Alert",
      SURPRISED: "System • Attention"
    };

    status.innerText =
      statusMap[targetEmotion] || "Online • Ready";
  }

  face.classList.remove("pop-animation");
  void face.offsetWidth;
  face.classList.add("pop-animation");

  face.innerHTML = getCharacterSVG(
    vector.eyes,
    vector.mouth,
    vector.extra,
    vector.color
  );
}


/* ============================================================
   CHAT MESSAGE UI
------------------------------------------------------------ */

function addUserMessage(text) {

  const chatBox = document.getElementById("chat-messages");

  if (!chatBox) return;

  chatBox.insertAdjacentHTML(
    "beforeend",
    `
      <div class="nyx-message nyx-user-message">

        <div class="nyx-message-body">

          <div class="nyx-message-label">
            You
          </div>

          <div class="nyx-message-content">
            ${renderMarkdown(text)}
          </div>

        </div>

        <div class="nyx-avatar nyx-user-avatar">
          ${getUserSVG()}
        </div>

      </div>
    `
  );

  scrollChat();
}


function addTypingMessage() {

  const chatBox = document.getElementById("chat-messages");

  if (!chatBox) return null;

  const id =
    "typing-" +
    Date.now() +
    "-" +
    Math.floor(Math.random() * 10000);

  chatBox.insertAdjacentHTML(
    "beforeend",
    `
      <div
        id="${id}"
        class="nyx-message nyx-ai-message"
      >

        <div class="nyx-avatar nyx-ai-avatar">
          ${getMiniNyxSVG("#f59e0b")}
        </div>

        <div class="nyx-message-body">

          <div class="nyx-message-label">
            Nyxium AI
          </div>

          <div class="nyx-thinking-box">

            <span>Processing</span>

            <div class="nyx-thinking-dots">
              <i></i>
              <i></i>
              <i></i>
            </div>

          </div>

        </div>

      </div>
    `
  );

  scrollChat();

  return id;
}


function removeTypingMessage(id) {

  const element = document.getElementById(id);

  if (element) {
    element.remove();
  }
}


/* ============================================================
   AI RESPONSE
------------------------------------------------------------ */

function addAIMessage(text, emotion = "NEUTRAL") {

  const chatBox =
    document.getElementById("chat-messages");

  if (!chatBox) return;

  const id =
    "ai-message-" +
    Date.now() +
    "-" +
    Math.floor(Math.random() * 10000);

  let avatarColor = "#38bdf8";

  const colors = {
    HAPPY: "#22c55e",
    THINKING: "#f59e0b",
    SURPRISED: "#a855f7",
    ANGRY: "#ef4444",
    SAD: "#3b82f6"
  };

  if (colors[emotion]) {
    avatarColor = colors[emotion];
  }

  chatBox.insertAdjacentHTML(
    "beforeend",
    `
      <div
        class="nyx-message nyx-ai-message"
        data-message-id="${id}"
      >

        <div class="nyx-avatar nyx-ai-avatar">
          ${getMiniNyxSVG(avatarColor)}
        </div>

        <div class="nyx-message-body">

          <div class="nyx-message-label">
            Nyxium AI
          </div>

          <div
            id="${id}"
            class="nyx-message-content"
          ></div>

          <div class="nyx-message-actions">

            <button
              type="button"
              onclick="copyMessage(this)"
            >
              Copy
            </button>

            <button
              type="button"
              onclick="regenerateLastResponse()"
            >
              Regenerate
            </button>

          </div>

        </div>

      </div>
    `
  );

  const container =
    document.getElementById(id);

  if (!container) return;

  /*
    Render the entire response progressively
    without destroying Markdown.
  */

  let index = 0;

  function stream() {

    if (index < text.length) {

      index += Math.floor(
        Math.random() * 3
      ) + 1;

      if (index > text.length) {
        index = text.length;
      }

      container.innerHTML =
        renderMarkdown(text.substring(0, index));

      scrollChat();

      setTimeout(stream, 12);

    } else {

      container.innerHTML =
        renderMarkdown(text);

      scrollChat();

      idleTimeout =
        setTimeout(() => {
          transitionTo("NEUTRAL");
        }, 5000);
    }
  }

  stream();
}


/* ============================================================
   CHAT SCROLL
------------------------------------------------------------ */

function scrollChat() {

  const chatBox =
    document.getElementById("chat-messages");

  if (!chatBox) return;

  requestAnimationFrame(() => {
    chatBox.scrollTo({
      top: chatBox.scrollHeight,
      behavior: "smooth"
    });
  });
}


/* ============================================================
   EMPTY CHAT STATE
------------------------------------------------------------ */

function showChatWelcome() {

  const chatBox =
    document.getElementById("chat-messages");

  if (!chatBox || chatBox.children.length > 0) {
    return;
  }

  chatBox.innerHTML = `
    <div class="nyx-welcome">

      <div class="nyx-welcome-icon">
        ${getMiniNyxSVG("#a855f7")}
      </div>

      <h3>Welcome to Nyxium AI</h3>

      <p>
        Ask questions, write code, summarize text,
        translate languages, or explore ideas.
      </p>

      <div class="nyx-suggestion-grid">

        <button
          onclick="useSuggestion('Explain quantum computing in simple terms')"
        >
          <span>🧠</span>
          <strong>Explain something</strong>
          <small>Learn a difficult concept</small>
        </button>

        <button
          onclick="useSuggestion('Summarize this: ')"
        >
          <span>📝</span>
          <strong>Summarize</strong>
          <small>Turn text into key points</small>
        </button>

        <button
          onclick="useSuggestion('Translate this to Hindi: ')"
        >
          <span>🌐</span>
          <strong>Translate</strong>
          <small>Translate between languages</small>
        </button>

        <button
          onclick="useSuggestion('Help me debug this code: ')"
        >
          <span>💻</span>
          <strong>Code</strong>
          <small>Debug and explain code</small>
        </button>

      </div>

    </div>
  `;
}


function useSuggestion(text) {

  const input =
    document.getElementById("user-input");

  if (!input) return;

  input.value = text;
  input.focus();

  if (!text.endsWith(": ")) {
    sendToAI();
  }
}


/* ============================================================
   TOOL BUTTONS
------------------------------------------------------------ */

function getComposerText() {

  const input =
    document.getElementById("user-input");

  if (!input) return "";

  return input.value.trim();
}


function useAIExplain() {

  const text = getComposerText();

  if (!text) {
    focusComposer("Type or paste something you want Nyxium AI to explain.");
    return;
  }

  sendToolPrompt(
    `Explain the following clearly and accurately. Break difficult concepts into simple steps when useful:\n\n${text}`
  );
}


function useAISummarize() {

  const text = getComposerText();

  if (!text) {
    focusComposer("Paste the text you want Nyxium AI to summarize.");
    return;
  }

  sendToolPrompt(
    `Summarize the following text. Give the key points first and preserve important facts:\n\n${text}`
  );
}


function useAITranslate(language = "English") {

  const text = getComposerText();

  if (!text) {
    focusComposer("Type or paste the text you want translated.");
    return;
  }

  sendToolPrompt(
    `Translate the following text into ${language}. Preserve its meaning and tone. Return only the translation unless a brief clarification is necessary:\n\n${text}`
  );
}


function useAICode() {

  const text = getComposerText();

  if (!text) {
    focusComposer("Describe the code you want help with.");
    return;
  }

  sendToolPrompt(
    `Act as a programming expert. Analyze the following request or code, identify problems, and provide a correct solution with clear explanation:\n\n${text}`
  );
}


function useAIImagine() {

  const text = getComposerText();

  if (!text) {
    focusComposer("Describe the image you want to create.");
    return;
  }

  sendToolPrompt(
    `Create a detailed image-generation prompt based on this request. Include subject, environment, composition, lighting, camera style, colors, atmosphere, and important visual details:\n\n${text}`
  );
}


function focusComposer(placeholder) {

  const input =
    document.getElementById("user-input");

  if (!input) return;

  if (!input.value.trim()) {
    input.placeholder = placeholder;
  }

  input.focus();
}


function sendToolPrompt(prompt) {

  const input =
    document.getElementById("user-input");

  if (!input) return;

  input.value = prompt;

  sendToAI();
}


/* ============================================================
   TRANSLATE LANGUAGE MENU
------------------------------------------------------------ */

function openTranslateMenu(button) {

  const existing =
    document.getElementById("translate-menu");

  if (existing) {
    existing.remove();
    return;
  }

  const menu =
    document.createElement("div");

  menu.id = "translate-menu";

  menu.className =
    "nyx-translate-menu";

  const languages = [
    "English",
    "Hindi",
    "Spanish",
    "French",
    "German",
    "Japanese",
    "Korean",
    "Chinese",
    "Russian",
    "Arabic"
  ];

  menu.innerHTML = `
    <div class="nyx-translate-title">
      Translate to
    </div>

    ${languages.map(language => `
      <button
        type="button"
        onclick="useAITranslate('${language}')"
      >
        ${language}
      </button>
    `).join("")}
  `;

  document.body.appendChild(menu);

  const rect =
    button.getBoundingClientRect();

  menu.style.left =
    `${Math.min(
      rect.left,
      window.innerWidth - 210
    )}px`;

  menu.style.top =
    `${rect.top - menu.offsetHeight - 8}px`;

  setTimeout(() => {

    document.addEventListener(
      "click",
      function closeMenu(event) {

        if (
          !menu.contains(event.target) &&
          event.target !== button
        ) {
          menu.remove();

          document.removeEventListener(
            "click",
            closeMenu
          );
        }

      },
      { once: true }
    );

  }, 0);
}


/* ============================================================
   COMMAND SYSTEM
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
    sassEnabled = !sassEnabled;

    transitionTo(
      sassEnabled ? "HAPPY" : "NEUTRAL"
    );

    addAIMessage(
      sassEnabled
        ? "Sass protocol enabled. I can be witty again."
        : "Sass protocol disabled. Switching to professional mode.",
      sassEnabled ? "HAPPY" : "NEUTRAL"
    );

    return;
  }

  input.value = command;
  input.focus();
  sendToAI();
}


function clearChat() {

  const chatBox =
    document.getElementById("chat-messages");

  if (!chatBox) return;

  chatBox.innerHTML = "";

  conversationHistory = [];

  lastUserMessage = "";
  lastAssistantMessage = "";

  transitionTo("HAPPY");

  setTimeout(() => {
    transitionTo("NEUTRAL");
  }, 1200);

  showChatWelcome();
}


/* ============================================================
   LOCAL MATH ENGINE
------------------------------------------------------------ */

function tryLocalResponse(message) {

  const msg =
    message.trim();

  const mathRegex =
    /^(-?\d+(?:\.\d+)?)\s*(\+|-|\*|x|×|\/|÷)\s*(-?\d+(?:\.\d+)?)$/;

  const match =
    msg.match(mathRegex);

  if (match) {

    const a =
      Number(match[1]);

    const operator =
      match[2];

    const b =
      Number(match[3]);

    let result;

    switch (operator) {

      case "+":
        result = a + b;
        break;

      case "-":
        result = a - b;
        break;

      case "*":
      case "x":
      case "×":
        result = a * b;
        break;

      case "/":
      case "÷":
        result =
          b === 0
            ? "undefined — division by zero"
            : a / b;
        break;
    }

    return `[HAPPY] The answer is **${result}**.`;
  }


  const normalized =
    msg.toLowerCase();


  if (
    /^(hi|hello|hey|hola|yo)\b/.test(normalized)
  ) {
    return sassEnabled
      ? "[HAPPY] Hey! Nyxium AI is online. What are we building, solving, or breaking today?"
      : "[HAPPY] Hello! Nyxium AI is ready to help.";
  }


  if (
    normalized.includes("who are you") ||
    normalized.includes("what are you")
  ) {
    return "[NEUTRAL] I’m **Nyxium AI**, an AI assistant built for the Nyxium ecosystem. The cybernetic visor you see is my visual mascot.";
  }


  if (normalized === "1+1") {
    return sassEnabled
      ? "[HAPPY] **2**. Humanity survives another mathematical challenge."
      : "[HAPPY] **2**.";
  }


  return null;
}


/* ============================================================
   AI RESPONSE NORMALIZATION
------------------------------------------------------------ */

function extractPuterText(response) {

  if (!response) return null;

  if (typeof response === "string") {
    return response;
  }

  if (response.message) {

    if (typeof response.message === "string") {
      return response.message;
    }

    if (response.message.content) {
      return response.message.content;
    }
  }

  if (response.content) {
    return response.content;
  }

  if (response.text) {
    return response.text;
  }

  return String(response);
}


/* ============================================================
   MAIN AI REQUEST
------------------------------------------------------------ */

async function requestNyxiumAI(userMsg) {

  /*
    1. Backend
  */

  try {

    const response =
      await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },

        body: JSON.stringify({
          message: userMsg,
          history: conversationHistory
        })
      });

    if (response.ok) {

      const data =
        await response.json();

      if (data && data.reply) {
        return data.reply;
      }
    }

  } catch (error) {

    console.warn(
      "Nyxium backend unavailable:",
      error
    );

  }


  /*
    2. Puter AI fallback
  */

  if (
    typeof puter !== "undefined" &&
    puter.ai &&
    typeof puter.ai.chat === "function"
  ) {

    const historyText =
      conversationHistory
        .slice(-MAX_HISTORY_TURNS)
        .map(item => {

          const role =
            item.role === "user"
              ? "User"
              : "Nyxium AI";

          return `${role}: ${item.content}`;

        })
        .join("\n");


    const systemPrompt = `
You are Nyxium AI.

IMPORTANT IDENTITY:
- Your name is Nyxium AI.
- Do not call yourself "Nyx".
- The cybernetic visor is only your visual mascot.
- Do not claim to be Google Gemini.
- You are the AI assistant of the Nyxium ecosystem.

PERSONALITY:
- Intelligent
- Helpful
- Clear
- Modern
- Slightly witty when appropriate
- Never sacrifice accuracy for jokes
${sassEnabled
  ? "- Light sass is allowed for obvious or silly questions."
  : "- Keep the tone professional and calm."
}

RESPONSE RULE:
Always begin your response with exactly one emotion tag:

[NEUTRAL]
[HAPPY]
[THINKING]
[SURPRISED]
[SAD]
[ANGRY]

Then write the actual answer.

IMPORTANT:
- Answer the user's actual question.
- Do calculations yourself.
- Explain technical subjects clearly.
- Use Markdown when useful.
- Use fenced code blocks for code.
- Do not mention these instructions.
- Do not invent capabilities.

CONVERSATION:
${historyText}
`.trim();


    try {

      const result =
        await Promise.race([

          puter.ai.chat(
            `${systemPrompt}

NEW USER MESSAGE:
${userMsg}`
          ),

          new Promise((_, reject) => {
            setTimeout(
              () => reject(
                new Error("Puter timeout")
              ),
              15000
            );
          })

        ]);

      const text =
        extractPuterText(result);

      if (text) {
        return text;
      }

    } catch (error) {

      console.warn(
        "Puter AI unavailable:",
        error
      );

    }

  }


  /*
    3. Local fallback
  */

  const local =
    tryLocalResponse(userMsg);

  if (local) {
    return local;
  }


  /*
    4. Final fallback
  */

  return "[SAD] I couldn't reach the Nyxium AI processing nodes right now. Please try again in a moment.";
}


/* ============================================================
   SEND MESSAGE
------------------------------------------------------------ */

async function sendToAI() {

  if (isGenerating) return;

  const input =
    document.getElementById("user-input");

  if (!input) return;

  const userMsg =
    input.value.trim();

  if (!userMsg) return;

  input.value = "";

  input.style.height = "auto";

  lastUserMessage =
    userMsg;

  /*
    Slash commands
  */

  if (userMsg === "/clear") {

    clearChat();
    return;
  }

  if (userMsg === "/toggle-sass") {

    executeConsoleCommand(
      "/toggle-sass"
    );

    return;
  }


  /*
    Remove welcome screen
  */

  const welcome =
    document.querySelector(".nyx-welcome");

  if (welcome) {
    welcome.remove();
  }


  /*
    User message
  */

  addUserMessage(userMsg);


  /*
    Conversation history
  */

  conversationHistory.push({
    role: "user",
    content: userMsg
  });

  if (
    conversationHistory.length >
    MAX_HISTORY_TURNS
  ) {
    conversationHistory.shift();
  }


  /*
    AI state
  */

  transitionTo("THINKING");

  isGenerating = true;

  const sendButton =
    document.querySelector(".nyx-send-button");

  if (sendButton) {
    sendButton.disabled = true;
    sendButton.innerHTML = "●";
  }


  /*
    Typing UI
  */

  const typingId =
    addTypingMessage();


  try {

    const response =
      await requestNyxiumAI(
        userMsg
      );

    removeTypingMessage(
      typingId
    );


    /*
      Parse emotion
    */

    let emotion =
      "NEUTRAL";

    let content =
      response || "";


    const emotionMatch =
      content.match(
        /^\s*\[(NEUTRAL|HAPPY|THINKING|SURPRISED|SAD|ANGRY)\]\s*/i
      );


    if (emotionMatch) {

      emotion =
        emotionMatch[1].toUpperCase();

      content =
        content.substring(
          emotionMatch[0].length
        );
    }


    /*
      Save assistant response
    */

    lastAssistantMessage =
      content;

    conversationHistory.push({
      role: "assistant",
      content
    });

    if (
      conversationHistory.length >
      MAX_HISTORY_TURNS
    ) {
      conversationHistory.shift();
    }


    transitionTo(
      emotion
    );


    /*
      Render response
    */

    addAIMessage(
      content,
      emotion
    );


  } catch (error) {

    console.error(
      "Nyxium AI error:",
      error
    );

    removeTypingMessage(
      typingId
    );

    transitionTo(
      "SAD"
    );

    addAIMessage(
      "Something went wrong while processing that request. Please try again.",
      "SAD"
    );

  } finally {

    isGenerating = false;

    if (sendButton) {

      sendButton.disabled = false;

      sendButton.innerHTML =
        "Send <span>➤</span>";
    }

  }
}


/* ============================================================
   REGENERATE
------------------------------------------------------------ */

async function regenerateLastResponse() {

  if (
    isGenerating ||
    !lastUserMessage
  ) {
    return;
  }


  /*
    Remove last assistant response
  */

  const messages =
    document.querySelectorAll(
      ".nyx-ai-message"
    );

  const last =
    messages[messages.length - 1];

  if (last) {
    last.remove();
  }


  /*
    Remove last assistant history entry
  */

  if (
    conversationHistory.length &&
    conversationHistory[
      conversationHistory.length - 1
    ].role === "assistant"
  ) {

    conversationHistory.pop();

  }


  /*
    Re-request
  */

  isGenerating = true;

  transitionTo(
    "THINKING"
  );

  const typingId =
    addTypingMessage();


  try {

    const response =
      await requestNyxiumAI(
        lastUserMessage
      );

    removeTypingMessage(
      typingId
    );


    let emotion =
      "NEUTRAL";

    let content =
      response || "";


    const match =
      content.match(
        /^\s*\[(NEUTRAL|HAPPY|THINKING|SURPRISED|SAD|ANGRY)\]\s*/i
      );


    if (match) {

      emotion =
        match[1].toUpperCase();

      content =
        content.substring(
          match[0].length
        );
    }


    lastAssistantMessage =
      content;


    conversationHistory.push({
      role: "assistant",
      content
    });


    if (
      conversationHistory.length >
      MAX_HISTORY_TURNS
    ) {
      conversationHistory.shift();
    }


    transitionTo(
      emotion
    );

    addAIMessage(
      content,
      emotion
    );

  } catch (error) {

    removeTypingMessage(
      typingId
    );

    addAIMessage(
      "Regeneration failed. Please try again.",
      "SAD"
    );

  } finally {

    isGenerating = false;

  }
}


/* ============================================================
   INPUT AUTO RESIZE
------------------------------------------------------------ */

function setupComposer() {

  const input =
    document.getElementById("user-input");

  if (!input) return;


  input.addEventListener(
    "input",
    () => {

      input.style.height =
        "auto";

      input.style.height =
        Math.min(
          input.scrollHeight,
          180
        ) + "px";

    }
  );


  input.addEventListener(
    "keydown",
    event => {

      /*
        Enter = send
        Shift + Enter = new line
      */

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


/* ============================================================
   KEYBOARD SHORTCUTS
------------------------------------------------------------ */

document.addEventListener(
  "keydown",
  event => {

    /*
      Ctrl + K
      Focus chat
    */

    if (
      event.ctrlKey &&
      event.key.toLowerCase() === "k"
    ) {

      event.preventDefault();

      const input =
        document.getElementById(
          "user-input"
        );

      if (input) {
        input.focus();
      }

    }


    /*
      Escape
    */

    if (event.key === "Escape") {

      const menu =
        document.getElementById(
          "translate-menu"
        );

      if (menu) {
        menu.remove();
      }

    }

  }
);


/* ============================================================
   INITIALIZATION
------------------------------------------------------------ */

document.addEventListener(
  "DOMContentLoaded",
  () => {

    /*
      Initialize visor
    */

    transitionTo(
      "NEUTRAL"
    );


    /*
      Initialize chat
    */

    showChatWelcome();


    /*
      Composer
    */

    setupComposer();


    /*
      Tip
    */

    showRandomTip();

  }
);


/* ============================================================
   BACKWARD COMPATIBILITY
------------------------------------------------------------ */

window.showView =
  showView;

window.sendToAI =
  sendToAI;

window.executeConsoleCommand =
  executeConsoleCommand;

window.useAIExplain =
  useAIExplain;

window.useAISummarize =
  useAISummarize;

window.useAITranslate =
  useAITranslate;

window.useAICode =
  useAICode;

window.useAIImagine =
  useAIImagine;

window.openTranslateMenu =
  openTranslateMenu;

window.copyMessage =
  copyMessage;

window.copyTextFromCode =
  copyTextFromCode;

window.regenerateLastResponse =
  regenerateLastResponse;

window.clearChat =
  clearChat;

window.useSuggestion =
  useSuggestion;
