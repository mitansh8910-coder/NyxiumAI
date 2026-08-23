/* =========================================================
   NYXIUM AI — CHAT ENGINE
   Real AI integration + tools + commands + Markdown
   ========================================================= */

(() => {
    "use strict";

    /* =====================================================
       STATE
    ===================================================== */

    const state = {
        messages: [],
        sass: true,
        generating: false,
        currentTool: null,
        maxHistory: 30
    };

    const STORAGE_KEY = "nyxium_ai_history_v3";
    const SASS_KEY = "nyxium_ai_sass";

    /* =====================================================
       DOM
    ===================================================== */

    const $ = (id) => document.getElementById(id);

    const input = $("user-input");
    const sendButton = $("send-button");
    const chatMessages = $("chat-messages");
    const chatScroll = $("chat-scroll-area");
    const welcomeScreen = $("welcome-screen");
    const characterCount = $("character-count");
    const aiStatus = $("ai-status");
    const aiFace = $("ai-face");
    const sidebar = $("sidebar");
    const sidebarOverlay = $("sidebar-overlay");

    /* =====================================================
       INITIALIZATION
    ===================================================== */

    function init() {
        loadState();
        setupInput();
        setupMarkdown();
        updateCharacterCount();
        updateAvatar("idle");
        updateStatus("Ready when you are");

        if (state.messages.length > 0) {
            hideWelcome();
            renderHistory();
        }

        window.addEventListener("resize", () => {
            autoResize();
        });

        console.log("Nyxium AI initialized.");
    }

    /* =====================================================
       MARKDOWN
    ===================================================== */

    function setupMarkdown() {
        if (window.marked) {
            marked.setOptions({
                breaks: true,
                gfm: true
            });
        }
    }

    function renderMarkdown(text) {
        if (!text) return "";

        if (!window.marked) {
            return escapeHTML(text).replace(/\n/g, "<br>");
        }

        try {
            return marked.parse(text);
        } catch {
            return escapeHTML(text).replace(/\n/g, "<br>");
        }
    }

    function escapeHTML(text) {
        return String(text)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    /* =====================================================
       CODE HIGHLIGHTING
    ===================================================== */

    function highlightCode(container) {
        if (!container || !window.hljs) return;

        container.querySelectorAll("pre code").forEach((block) => {
            try {
                hljs.highlightElement(block);
            } catch (error) {
                console.warn("Highlight error:", error);
            }
        });
    }

    /* =====================================================
       STORAGE
    ===================================================== */

    function loadState() {
        try {
            const history = localStorage.getItem(STORAGE_KEY);

            if (history) {
                state.messages = JSON.parse(history);

                if (!Array.isArray(state.messages)) {
                    state.messages = [];
                }
            }

            const sass = localStorage.getItem(SASS_KEY);

            if (sass !== null) {
                state.sass = sass === "true";
            }

        } catch (error) {
            console.warn("Could not load Nyxium state:", error);

            state.messages = [];
        }
    }

    function saveState() {
        try {
            const trimmed = state.messages.slice(-state.maxHistory);

            localStorage.setItem(
                STORAGE_KEY,
                JSON.stringify(trimmed)
            );

            localStorage.setItem(
                SASS_KEY,
                String(state.sass)
            );

        } catch (error) {
            console.warn("Could not save Nyxium state:", error);
        }
    }

    /* =====================================================
       INPUT
    ===================================================== */

    function setupInput() {
        if (!input) return;

        input.addEventListener("input", () => {
            autoResize();
            updateCharacterCount();
        });

        input.addEventListener("keydown", (event) => {
            if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();

                if (!state.generating) {
                    sendToAI();
                }
            }
        });
    }

    function autoResize() {
        if (!input) return;

        input.style.height = "auto";

        const height = Math.min(
            Math.max(input.scrollHeight, 30),
            190
        );

        input.style.height = `${height}px`;
    }

    function updateCharacterCount() {
        if (!input || !characterCount) return;

        characterCount.textContent =
            `${input.value.length} / 12000`;
    }

    /* =====================================================
       STATUS / AVATAR
    ===================================================== */

    function updateStatus(text) {
        if (aiStatus) {
            aiStatus.textContent = text;
        }
    }

    function updateAvatar(mode = "idle") {
        if (!aiFace) return;

        aiFace.classList.remove("pop-animation");

        /*
         * Small CSS-friendly Nyxium visor.
         * Kept deliberately small — not a huge avatar.
         */

        const colors = {
            idle: "rgba(167,139,250,0.85)",
            thinking: "rgba(56,189,248,0.95)",
            speaking: "rgba(139,92,246,1)",
            error: "rgba(239,68,68,0.95)"
        };

        const color = colors[mode] || colors.idle;

        aiFace.innerHTML = `
            <div style="
                width:27px;
                height:11px;
                border:1px solid ${color};
                border-radius:8px;
                background:
                    linear-gradient(
                        90deg,
                        transparent,
                        ${color},
                        transparent
                    );
                box-shadow:
                    0 0 12px ${color};
                position:relative;
            ">
                <span style="
                    position:absolute;
                    left:6px;
                    top:3px;
                    width:4px;
                    height:4px;
                    border-radius:50%;
                    background:${color};
                    box-shadow:9px 0 0 ${color};
                "></span>
            </div>
        `;

        void aiFace.offsetWidth;
        aiFace.classList.add("pop-animation");
    }

    /* =====================================================
       WELCOME
    ===================================================== */

    function hideWelcome() {
        if (welcomeScreen) {
            welcomeScreen.style.display = "none";
        }
    }

    function showWelcome() {
        if (welcomeScreen) {
            welcomeScreen.style.display = "";
        }
    }

    /* =====================================================
       MESSAGE CREATION
    ===================================================== */

    function createMessageElement(role, content, options = {}) {
        const row = document.createElement("div");

        row.className =
            `message-row ${role}`;

        const avatar = document.createElement("div");

        avatar.className = "message-avatar";

        if (role === "user") {
            avatar.innerHTML = `
                <span style="
                    font-size:12px;
                    opacity:.75;
                ">●</span>
            `;
        } else {
            avatar.innerHTML = `
                <span style="
                    width:20px;
                    height:8px;
                    display:block;
                    border:1px solid #a78bfa;
                    border-radius:6px;
                    box-shadow:0 0 8px rgba(167,139,250,.5);
                "></span>
            `;
        }

        const body = document.createElement("div");

        body.className = "message-body";

        const contentElement = document.createElement("div");

        contentElement.className = "message-content";

        if (options.raw === true) {
            contentElement.textContent = content;
        } else {
            contentElement.innerHTML =
                renderMarkdown(content);
        }

        body.appendChild(contentElement);

        /*
         * AI actions
         */

        if (role === "assistant" && !options.typing) {
            const actions = document.createElement("div");

            actions.className = "message-actions";

            actions.innerHTML = `
                <button
                    class="message-action"
                    data-action="copy"
                    title="Copy response"
                >
                    Copy
                </button>

                <button
                    class="message-action"
                    data-action="regenerate"
                    title="Regenerate response"
                >
                    Regenerate
                </button>
            `;

            actions
                .querySelector('[data-action="copy"]')
                .addEventListener("click", () => {
                    copyText(content);
                });

            actions
                .querySelector('[data-action="regenerate"]')
                .addEventListener("click", () => {
                    regenerateLast();
                });

            body.appendChild(actions);
        }

        row.appendChild(avatar);
        row.appendChild(body);

        return row;
    }

    function addMessage(role, content, save = true) {
        hideWelcome();

        const element =
            createMessageElement(role, content);

        chatMessages.appendChild(element);

        if (save) {
            state.messages.push({
                role,
                content,
                timestamp: Date.now()
            });

            state.messages =
                state.messages.slice(-state.maxHistory);

            saveState();
        }

        scrollToBottom();

        highlightCode(element);

        return element;
    }

    /* =====================================================
       HISTORY
    ===================================================== */

    function renderHistory() {
        if (!chatMessages) return;

        chatMessages.innerHTML = "";

        if (!state.messages.length) {
            showWelcome();
            return;
        }

        hideWelcome();

        state.messages.forEach((message) => {
            const element =
                createMessageElement(
                    message.role,
                    message.content
                );

            chatMessages.appendChild(element);

            highlightCode(element);
        });

        scrollToBottom();
    }

    /* =====================================================
       TYPING INDICATOR
    ===================================================== */

    function showTyping() {
        removeTyping();

        const row = document.createElement("div");

        row.id = "nyxium-typing";

        row.className = "message-row assistant";

        row.innerHTML = `
            <div class="message-avatar">
                <span style="
                    width:20px;
                    height:8px;
                    display:block;
                    border:1px solid #a78bfa;
                    border-radius:6px;
                    box-shadow:0 0 8px rgba(167,139,250,.5);
                "></span>
            </div>

            <div class="message-body">

                <div class="message-content">

                    <div class="typing-indicator">
                        <span class="typing-dot"></span>
                        <span class="typing-dot"></span>
                        <span class="typing-dot"></span>
                    </div>

                </div>

            </div>
        `;

        chatMessages.appendChild(row);

        scrollToBottom();
    }

    function removeTyping() {
        const typing = $("nyxium-typing");

        if (typing) {
            typing.remove();
        }
    }

    /* =====================================================
       SCROLL
    ===================================================== */

    function scrollToBottom() {
        if (!chatScroll) return;

        requestAnimationFrame(() => {
            chatScroll.scrollTo({
                top: chatScroll.scrollHeight,
                behavior: "smooth"
            });
        });
    }

    /* =====================================================
       TOOL DETECTION
    ===================================================== */

    function detectTool(text) {
        const lower = text.trim().toLowerCase();

        if (
            lower.startsWith("/summarize") ||
            lower.startsWith("/summary")
        ) {
            return "summarize";
        }

        if (
            lower.startsWith("/translate")
        ) {
            return "translate";
        }

        if (
            lower.startsWith("/code")
        ) {
            return "code";
        }

        if (
            lower.startsWith("/explain")
        ) {
            return "explain";
        }

        if (
            lower.startsWith("/analyze")
        ) {
            return "analyze";
        }

        if (
            lower.startsWith("/study")
        ) {
            return "study";
        }

        return state.currentTool;
    }

    /* =====================================================
       TOOL PROMPT BUILDERS
    ===================================================== */

    function buildToolPrompt(tool, userText) {
        switch (tool) {

            case "summarize":
                return `
You are Nyxium AI's Summarizer.

Summarize the user's provided content accurately.

Requirements:
- Preserve important facts.
- Remove unnecessary repetition.
- Use clear headings when useful.
- Use concise bullet points when appropriate.
- Do not invent information.
- If the text is already short, explain its key point instead of unnecessarily shortening it.

USER CONTENT:
${userText}
                `.trim();


            case "translate":
                return `
You are Nyxium AI's Translator.

Translate the user's content naturally.

Important:
- Preserve the original meaning.
- Preserve tone where possible.
- Do not add explanations unless needed.
- If the requested target language is not explicitly specified, infer it from the instruction.
- Do not summarize the content.

USER REQUEST:
${userText}
                `.trim();


            case "explain":
                return `
You are Nyxium AI's Explanation Engine.

Explain the user's topic clearly.

Requirements:
- Start with a simple explanation.
- Break difficult concepts into smaller parts.
- Give an example when useful.
- Avoid unnecessary jargon.
- Match the user's apparent level.
- Be accurate.

USER REQUEST:
${userText}
                `.trim();


            case "code":
                return `
You are Nyxium AI's Programming Assistant.

Help with the programming request below.

Requirements:
- Give working code where appropriate.
- Use Markdown code blocks.
- Explain important parts.
- Identify bugs clearly.
- Do not fabricate APIs or libraries.
- Prefer clean, maintainable solutions.

PROGRAMMING REQUEST:
${userText}
                `.trim();


            case "analyze":
                return `
You are Nyxium AI's Analysis Engine.

Analyze the user's content carefully.

Provide:
1. Main points
2. Important details
3. Problems or patterns
4. Useful conclusions
5. Recommendations when appropriate

Do not invent facts.

CONTENT:
${userText}
                `.trim();


            case "study":
                return `
You are Nyxium AI's Study Mode.

Teach the user step by step.

Structure the response with:
- Simple explanation
- Key concepts
- Examples
- Common mistakes
- Quick recap
- A few practice questions when useful

Adapt the explanation to the user's level.

TOPIC:
${userText}
                `.trim();


            default:
                return userText;
        }
    }

    /* =====================================================
       AI SYSTEM PROMPT
    ===================================================== */

    function getSystemPrompt() {
        return `
You are Nyxium AI.

Your identity is Nyxium AI.
Never call yourself "Nyx" as the product name.
Nyx is only the visual mascot/visor.

You are an intelligent, helpful general-purpose AI.

Behavior:
- Answer naturally.
- Be accurate.
- Do not unnecessarily repeat the user's question.
- Use Markdown when useful.
- Use headings and bullets for longer answers.
- Use fenced code blocks for programming.
- Do not make every response extremely long.
- Match the user's requested level of detail.
- If the user asks for a simple answer, keep it simple.
- If the user asks for detailed reasoning or teaching, provide more detail.

You can help with:
- General knowledge
- School subjects
- Programming
- Debugging
- Writing
- Summarization
- Translation
- Analysis
- Brainstorming
- Creative tasks
- Project planning

Personality:
${state.sass
    ? "You may be slightly playful and confident, but remain useful and respectful."
    : "Keep the personality professional, calm and direct."
}

Important:
Do not claim to have browsed the internet unless browsing actually occurred.
Do not claim to have executed code unless it actually happened.
        `.trim();
    }

    /* =====================================================
       PUTER AI
    ===================================================== */

    async function askPuterAI(prompt) {
        if (
            !window.puter ||
            !puter.ai ||
            typeof puter.ai.chat !== "function"
        ) {
            throw new Error(
                "Puter AI is not available."
            );
        }

        /*
         * Puter supports a normal prompt string.
         * We include the Nyxium system behavior directly
         * in the prompt so the browser version works
         * without requiring our own backend.
         */

        const historyText =
            state.messages
                .slice(-12)
                .map((message) => {
                    const speaker =
                        message.role === "user"
                            ? "USER"
                            : "NYXIUM AI";

                    return `${speaker}:\n${message.content}`;
                })
                .join("\n\n");

        const fullPrompt = `
${getSystemPrompt()}

CONVERSATION HISTORY:
${historyText || "(No previous conversation.)"}

CURRENT REQUEST:
${prompt}

Respond as Nyxium AI.
        `.trim();

        const response =
            await puter.ai.chat(fullPrompt);

        return extractPuterText(response);
    }

    /* =====================================================
       PUTER RESPONSE PARSER
    ===================================================== */

    function extractPuterText(response) {
        if (typeof response === "string") {
            return response;
        }

        if (!response) {
            return "";
        }

        if (
            response.message &&
            typeof response.message.content === "string"
        ) {
            return response.message.content;
        }

        if (
            response.message &&
            Array.isArray(response.message.content)
        ) {
            return response.message.content
                .map((part) => {
                    if (typeof part === "string") {
                        return part;
                    }

                    return part?.text || "";
                })
                .join("");
        }

        if (
            response.content &&
            typeof response.content === "string"
        ) {
            return response.content;
        }

        if (Array.isArray(response.content)) {
            return response.content
                .map((part) => {
                    if (typeof part === "string") {
                        return part;
                    }

                    return part?.text || "";
                })
                .join("");
        }

        if (response.text) {
            return String(response.text);
        }

        /*
         * Some Puter response variants expose
         * the result through toString().
         */

        try {
            const converted = String(response);

            if (
                converted &&
                converted !== "[object Object]"
            ) {
                return converted;
            }
        } catch {}

        return "";
    }

    /* =====================================================
       MAIN SEND FUNCTION
    ===================================================== */

    async function sendToAI() {
        if (state.generating) return;

        const raw = input?.value?.trim();

        if (!raw) {
            showToast("Type something first.");
            return;
        }

        /*
         * Commands are handled before sending to AI.
         */

        if (handleCommand(raw)) {
            input.value = "";
            autoResize();
            updateCharacterCount();
            return;
        }

        const tool = detectTool(raw);

        let aiPrompt = raw;

        /*
         * Remove command prefix before specialized prompts.
         */

        if (tool) {
            aiPrompt = removeToolPrefix(raw, tool);
            aiPrompt = buildToolPrompt(tool, aiPrompt);
        }

        state.generating = true;

        if (sendButton) {
            sendButton.disabled = true;
        }

        input.disabled = true;

        hideWelcome();

        addMessage("user", raw);

        input.value = "";
        autoResize();
        updateCharacterCount();

        updateStatus(
            tool
                ? `Using ${tool} mode...`
                : "Thinking..."
        );

        updateAvatar("thinking");

        showTyping();

        try {
            const answer =
                await askPuterAI(aiPrompt);

            removeTyping();

            if (!answer || !answer.trim()) {
                throw new Error(
                    "Nyxium returned an empty response."
                );
            }

            addMessage(
                "assistant",
                answer.trim()
            );

            updateStatus("Ready when you are");
            updateAvatar("speaking");

            setTimeout(() => {
                updateAvatar("idle");
            }, 900);

        } catch (error) {
            console.error(
                "Nyxium AI error:",
                error
            );

            removeTyping();

            const message =
                getFriendlyError(error);

            addMessage(
                "assistant",
                message
            );

            updateStatus("Connection error");
            updateAvatar("error");

            showToast(
                "Nyxium couldn't complete that request."
            );

        } finally {
            state.generating = false;

            input.disabled = false;

            if (sendButton) {
                sendButton.disabled = false;
            }

            input.focus();

            state.currentTool = null;

            setTimeout(() => {
                if (!state.generating) {
                    updateStatus("Ready when you are");
                    updateAvatar("idle");
                }
            }, 1200);
        }
    }

    /* =====================================================
       TOOL PREFIX
    ===================================================== */

    function removeToolPrefix(text, tool) {
        let result = text.trim();

        const prefixes = {
            summarize: [
                "/summarize",
                "/summary"
            ],

            translate: [
                "/translate"
            ],

            code: [
                "/code"
            ],

            explain: [
                "/explain"
            ],

            analyze: [
                "/analyze"
            ],

            study: [
                "/study"
            ]
        };

        for (const prefix of prefixes[tool] || []) {
            if (
                result
                    .toLowerCase()
                    .startsWith(prefix)
            ) {
                result =
                    result.slice(prefix.length).trim();

                break;
            }
        }

        /*
         * If the user used a quick-action phrase such as:
         *
         * "Summarize this: ..."
         *
         * remove the wrapper while keeping the content.
         */

        const wrappers = {
            summarize: [
                /^summarize\s*(this|the following|this text)?\s*:?\s*/i,
                /^give me a detailed summary of\s*:?\s*/i
            ],

            translate: [
                /^translate\s*(this|the following|this text)?\s*:?\s*/i
            ],

            code: [
                /^write code for\s*:?\s*/i,
                /^help me write and improve this code\s*:?\s*/i
            ],

            analyze: [
                /^analyze\s*(this)?\s*:?\s*/i,
                /^analyze this and give me the important points\s*:?\s*/i
            ],

            explain: [
                /^explain\s*(this|the following)?\s*:?\s*/i
            ],

            study: [
                /^teach me this topic step by step\s*:?\s*/i
            ]
        };

        for (const regex of wrappers[tool] || []) {
            result = result.replace(regex, "");
        }

        return result.trim() || text.trim();
    }

    /* =====================================================
       COMMANDS
    ===================================================== */

    function handleCommand(text) {
        const lower = text.trim().toLowerCase();

        if (lower === "/clear") {
            clearConversation();
            return true;
        }

        if (
            lower === "/toggle-sass" ||
            lower === "/sass"
        ) {
            toggleSass();
            return true;
        }

        if (lower === "/help") {
            showHelp();
            return true;
        }

        if (lower === "/ping") {
            addMessage(
                "assistant",
                "Pong. **Nyxium AI is online.** ⚡"
            );

            return true;
        }

        if (lower === "/new") {
            startNewChat();
            return true;
        }

        if (lower === "/summarize") {
            state.currentTool = "summarize";

            setInput(
                "Summarize this: "
            );

            return true;
        }

        if (lower === "/translate") {
            state.currentTool = "translate";

            setInput(
                "Translate this to English: "
            );

            return true;
        }

        if (lower === "/code") {
            state.currentTool = "code";

            setInput(
                "Write code for: "
            );

            return true;
        }

        if (lower === "/explain") {
            state.currentTool = "explain";

            setInput(
                "Explain this simply: "
            );

            return true;
        }

        if (lower === "/analyze") {
            state.currentTool = "analyze";

            setInput(
                "Analyze this: "
            );

            return true;
        }

        if (lower === "/study") {
            state.currentTool = "study";

            setInput(
                "Teach me this topic step by step: "
            );

            return true;
        }

        return false;
    }

    /* =====================================================
       HELP
    ===================================================== */

    function showHelp() {
        addMessage(
            "assistant",
            `
## Nyxium AI Commands

- \`/clear\` — Clear the conversation
- \`/new\` — Start a new chat
- \`/summarize\` — Summarize content
- \`/translate\` — Translate content
- \`/explain\` — Explain a topic
- \`/analyze\` — Analyze content
- \`/code\` — Programming mode
- \`/study\` — Study mode
- \`/toggle-sass\` — Toggle personality
- \`/ping\` — Check Nyxium status

You can also use the buttons in the sidebar or AI Tools page.
            `.trim()
        );
    }

    /* =====================================================
       QUICK PROMPTS
    ===================================================== */

    window.useQuickPrompt = function(prompt) {
        showView("chat");

        const detected = detectTool(prompt);

        /*
         * Recognize the existing HTML button text.
         */

        const lower = prompt.toLowerCase();

        if (
            lower.includes("summarize") ||
            lower.includes("summary")
        ) {
            state.currentTool = "summarize";
        } else if (
            lower.includes("translate")
        ) {
            state.currentTool = "translate";
        } else if (
            lower.includes("write code") ||
            lower.includes("programming") ||
            lower.includes("code for")
        ) {
            state.currentTool = "code";
        } else if (
            lower.includes("analyze")
        ) {
            state.currentTool = "analyze";
        } else if (
            lower.includes("explain")
        ) {
            state.currentTool = "explain";
        } else if (
            lower.includes("teach me")
        ) {
            state.currentTool = "study";
        } else {
            state.currentTool = detected;
        }

        setInput(prompt);

        setTimeout(() => {
            input?.focus();
            autoResize();
        }, 50);
    };

    function setInput(text) {
        if (!input) return;

        input.value = text;

        autoResize();
        updateCharacterCount();

        input.focus();

        const length = input.value.length;

        try {
            input.setSelectionRange(
                length,
                length
            );
        } catch {}
    }

    /* =====================================================
       NEW CHAT
    ===================================================== */

    window.startNewChat = function() {
        if (state.generating) {
            showToast(
                "Wait for the current response to finish."
            );

            return;
        }

        state.messages = [];
        state.currentTool = null;

        saveState();

        if (chatMessages) {
            chatMessages.innerHTML = "";

            if (welcomeScreen) {
                chatMessages.appendChild(
                    welcomeScreen
                );
            }
        }

        showWelcome();

        updateStatus("Ready when you are");
        updateAvatar("idle");

        showView("chat");

        if (input) {
            input.value = "";

            autoResize();
            updateCharacterCount();

            input.focus();
        }

        showToast("New chat started.");
    };

    /* =====================================================
       CLEAR CONVERSATION
    ===================================================== */

    window.clearConversation = function() {
        state.messages = [];
        state.currentTool = null;

        saveState();

        if (chatMessages) {
            chatMessages.innerHTML = "";

            if (welcomeScreen) {
                chatMessages.appendChild(
                    welcomeScreen
                );
            }
        }

        showWelcome();

        updateStatus("Ready when you are");
        updateAvatar("idle");

        showToast("Conversation cleared.");
    };

    /* =====================================================
       SASS
    ===================================================== */

    window.toggleSass = function() {
        state.sass = !state.sass;

        saveState();

        const icon = $("sass-icon");

        if (icon) {
            icon.textContent =
                state.sass ? "✦" : "•";
        }

        showToast(
            state.sass
                ? "Nyxium personality enabled."
                : "Nyxium personality set to professional."
        );
    };

    /* =====================================================
       COPY
    ===================================================== */

    async function copyText(text) {
        try {
            await navigator.clipboard.writeText(
                text
            );

            showToast("Copied to clipboard.");
        } catch {
            const area =
                document.createElement("textarea");

            area.value = text;

            document.body.appendChild(area);

            area.select();

            document.execCommand("copy");

            area.remove();

            showToast("Copied to clipboard.");
        }
    }

    /* =====================================================
       REGENERATE
    ===================================================== */

    async function regenerateLast() {
        if (state.generating) return;

        const lastUser =
            [...state.messages]
                .reverse()
                .find(
                    (message) =>
                        message.role === "user"
                );

        if (!lastUser) {
            showToast("Nothing to regenerate.");
            return;
        }

        /*
         * Remove the last assistant response.
         */

        const lastAssistantIndex =
            state.messages
                .map((m) => m.role)
                .lastIndexOf("assistant");

        if (lastAssistantIndex !== -1) {
            state.messages.splice(
                lastAssistantIndex,
                1
            );

            saveState();
        }

        renderHistory();

        /*
         * Temporarily remove user message from the
         * visible history and send again without creating
         * another user bubble.
         */

        state.generating = true;

        input.disabled = true;

        if (sendButton) {
            sendButton.disabled = true;
        }

        updateStatus("Regenerating...");
        updateAvatar("thinking");

        showTyping();

        try {
            const answer =
                await askPuterAI(
                    lastUser.content
                );

            removeTyping();

            addMessage(
                "assistant",
                answer
            );

            updateStatus("Ready when you are");
            updateAvatar("idle");

        } catch (error) {
            removeTyping();

            addMessage(
                "assistant",
                getFriendlyError(error)
            );

            updateAvatar("error");

        } finally {
            state.generating = false;

            input.disabled = false;

            if (sendButton) {
                sendButton.disabled = false;
            }

            input.focus();
        }
    }

    /* =====================================================
       ERROR HANDLING
    ===================================================== */

    function getFriendlyError(error) {
        const raw =
            error?.message ||
            String(error || "");

        console.error(
            "Nyxium raw error:",
            raw
        );

        if (
            raw.toLowerCase().includes("puter")
        ) {
            return `
### Nyxium AI connection issue

I couldn't reach the AI engine right now.

Please check that the **Puter.js** service is available and try again.
            `.trim();
        }

        if (
            raw.toLowerCase().includes("network") ||
            raw.toLowerCase().includes("fetch")
        ) {
            return `
### Network error

Nyxium AI couldn't connect to its AI engine.

Check your internet connection and try again.
            `.trim();
        }

        return `
### Something went wrong

Nyxium AI couldn't complete that request.

Please try again.
        `.trim();
    }

    /* =====================================================
       TOAST
    ===================================================== */

    function showToast(message) {
        const container =
            $("toast-container");

        if (!container) return;

        const toast =
            document.createElement("div");

        toast.className =
            "nyxium-toast";

        toast.textContent = message;

        container.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = "0";
            toast.style.transform =
                "translateY(6px)";

            setTimeout(() => {
                toast.remove();
            }, 220);

        }, 2300);
    }

    /* =====================================================
       VIEW SYSTEM
    ===================================================== */

    window.showView = function(viewName) {
        document
            .querySelectorAll(".view")
            .forEach((view) => {
                view.classList.remove("active");
            });

        const target =
            $(viewName);

        if (target) {
            target.classList.add("active");
        }

        document
            .querySelectorAll(".nav-item")
            .forEach((button) => {
                button.classList.toggle(
                    "active",
                    button.dataset.view === viewName
                );
            });

        /*
         * Close mobile sidebar.
         */

        if (
            window.innerWidth <= 760 &&
            sidebar?.classList.contains("mobile-open")
        ) {
            toggleSidebar();
        }
    };

    /* =====================================================
       SIDEBAR
    ===================================================== */

    window.toggleSidebar = function() {
        if (!sidebar) return;

        sidebar.classList.toggle(
            "mobile-open"
        );

        sidebarOverlay?.classList.toggle(
            "active"
        );
    };

    /* =====================================================
       CHAT COMMAND SUGGESTIONS
    ===================================================== */

    function updateCommandSuggestions() {
        const suggestions =
            $("command-suggestions");

        if (!suggestions || !input) return;

        const value =
            input.value.trim();

        if (value.startsWith("/")) {
            suggestions.style.display =
                "flex";
        } else {
            suggestions.style.display =
                "none";
        }
    }

    /* =====================================================
       INPUT OBSERVER
    ===================================================== */

    if (input) {
        input.addEventListener(
            "input",
            updateCommandSuggestions
        );
    }

    /* =====================================================
       FRIENDLY QUICK TOOL API
       ===================================================== */

    window.nyxiumTools = {

        summarize(text) {
            setInput(
                `Summarize this clearly:\n\n${text}`
            );

            state.currentTool =
                "summarize";
        },

        translate(text, language = "English") {
            setInput(
                `Translate this to ${language}:\n\n${text}`
            );

            state.currentTool =
                "translate";
        },

        explain(text) {
            setInput(
                `Explain this simply:\n\n${text}`
            );

            state.currentTool =
                "explain";
        },

        analyze(text) {
            setInput(
                `Analyze this:\n\n${text}`
            );

            state.currentTool =
                "analyze";
        },

        code(text) {
            setInput(
                `Write code for:\n\n${text}`
            );

            state.currentTool =
                "code";
        },

        study(text) {
            setInput(
                `Teach me this topic step by step:\n\n${text}`
            );

            state.currentTool =
                "study";
        }

    };

    /* =====================================================
       GLOBAL EXPORTS
       ===================================================== */

    window.sendToAI = sendToAI;

    window.copyNyxiumText = copyText;

    /* =====================================================
       START
    ===================================================== */

    if (
        document.readyState === "loading"
    ) {
        document.addEventListener(
            "DOMContentLoaded",
            init
        );
    } else {
        init();
    }

})();
