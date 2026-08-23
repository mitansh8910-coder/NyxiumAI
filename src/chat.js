/* =========================================================
   NYXIUM AI — CHAT ENGINE
   ========================================================= */

"use strict";

/* =========================================================
   CONFIG
========================================================= */

const NYXIUM_NAME = "Nyxium AI";

const NYXIUM_DISCORD_INVITE =
    "https://discord.com/oauth2/authorize?client_id=1497476268847796377&permissions=8&scope=bot%20applications.commands";

const MAX_HISTORY = 30;
const MAX_INPUT = 12000;

let conversationHistory = [];
let isGenerating = false;
let sassEnabled = false;


/* =========================================================
   DOM
========================================================= */

const $ = (id) => document.getElementById(id);

const chatMessages = $("chat-messages");
const chatScrollArea = $("chat-scroll-area");
const userInput = $("user-input");
const sendButton = $("send-button");
const characterCount = $("character-count");
const aiStatus = $("ai-status");
const aiTipBox = $("ai-tip-box");
const commandSuggestions = $("command-suggestions");


/* =========================================================
   INITIALIZATION
========================================================= */

document.addEventListener("DOMContentLoaded", () => {

    setupInput();

    setupMarkdown();

    setupCodeCopy();

    updateCharacterCount();

    loadConversation();

    updateTip();

    showView("chat");

});


/* =========================================================
   MARKDOWN
========================================================= */

function setupMarkdown() {

    if (typeof marked !== "undefined") {

        marked.setOptions({
            breaks: true,
            gfm: true
        });

    }

}


/* =========================================================
   INPUT
========================================================= */

function setupInput() {

    if (!userInput) return;

    userInput.addEventListener("input", () => {

        autoResizeInput();

        updateCharacterCount();

    });


    userInput.addEventListener("keydown", (event) => {

        if (event.key === "Enter" && !event.shiftKey) {

            event.preventDefault();

            sendToAI();

        }

    });


    userInput.addEventListener("input", () => {

        const value = userInput.value;

        if (value.startsWith("/")) {

            showCommandSuggestions();

        } else {

            hideCommandSuggestions();

        }

    });

}


function autoResizeInput() {

    if (!userInput) return;

    userInput.style.height = "auto";

    userInput.style.height =
        Math.min(userInput.scrollHeight, 190) + "px";

}


function updateCharacterCount() {

    if (!userInput || !characterCount) return;

    characterCount.textContent =
        `${userInput.value.length} / ${MAX_INPUT}`;

}


/* =========================================================
   COMMAND SUGGESTIONS
========================================================= */

function showCommandSuggestions() {

    if (commandSuggestions) {

        commandSuggestions.style.opacity = "1";

    }

}


function hideCommandSuggestions() {

    if (commandSuggestions) {

        commandSuggestions.style.opacity = "";

    }

}


/* =========================================================
   VIEW SYSTEM
========================================================= */

function showView(viewName) {

    document.querySelectorAll(".view").forEach(view => {

        view.classList.remove("active");

    });


    const target = $(viewName);

    if (target) {

        target.classList.add("active");

    }


    document.querySelectorAll(".nav-item").forEach(button => {

        button.classList.toggle(
            "active",
            button.dataset.view === viewName
        );

    });


    closeMobileSidebar();

}


/* =========================================================
   MOBILE SIDEBAR
========================================================= */

function toggleSidebar() {

    const sidebar = $("sidebar");
    const overlay = $("sidebar-overlay");

    if (!sidebar) return;

    const open = sidebar.classList.toggle("mobile-open");

    if (overlay) {

        overlay.classList.toggle("active", open);

    }

}


function closeMobileSidebar() {

    const sidebar = $("sidebar");
    const overlay = $("sidebar-overlay");

    if (sidebar) {

        sidebar.classList.remove("mobile-open");

    }

    if (overlay) {

        overlay.classList.remove("active");

    }

}


/* =========================================================
   NEW CHAT
========================================================= */

function startNewChat() {

    conversationHistory = [];

    saveConversation();

    if (!chatMessages) return;

    chatMessages.innerHTML = "";

    createWelcomeScreen();

    setAIStatus("Ready when you are");

    showToast("New conversation started");

}


function createWelcomeScreen() {

    if (!chatMessages) return;

    const welcome = document.createElement("div");

    welcome.id = "welcome-screen";

    welcome.className = "welcome-screen";

    welcome.innerHTML = `

        <div class="welcome-orb">
            <div class="welcome-orb-inner">✦</div>
        </div>

        <h2>What can I help you with?</h2>

        <p>
            Ask ${NYXIUM_NAME} anything — from coding and schoolwork
            to explanations, writing, analysis and creative ideas.
        </p>

        <div class="starter-grid">

            <button
                class="starter-card"
                onclick="useQuickPrompt('Explain quantum computing in simple words.')"
            >
                <span class="starter-icon">⚛</span>

                <span>
                    <strong>Explain something</strong>
                    <small>Make a difficult topic simple</small>
                </span>
            </button>

            <button
                class="starter-card"
                onclick="useQuickPrompt('Help me write a clean and modern website.')"
            >
                <span class="starter-icon">&lt;/&gt;</span>

                <span>
                    <strong>Build something</strong>
                    <small>Code, websites and projects</small>
                </span>
            </button>

            <button
                class="starter-card"
                onclick="useQuickPrompt('Summarize the following text clearly: ')"
            >
                <span class="starter-icon">▤</span>

                <span>
                    <strong>Summarize</strong>
                    <small>Turn long text into useful notes</small>
                </span>
            </button>

            <button
                class="starter-card"
                onclick="useQuickPrompt('Give me creative ideas for: ')"
            >
                <span class="starter-icon">✧</span>

                <span>
                    <strong>Brainstorm</strong>
                    <small>Ideas, stories and projects</small>
                </span>
            </button>

        </div>
    `;

    chatMessages.appendChild(welcome);

}


/* =========================================================
   QUICK PROMPTS
========================================================= */

function useQuickPrompt(prompt) {

    showView("chat");

    if (!userInput) return;

    userInput.value = prompt;

    autoResizeInput();

    updateCharacterCount();

    userInput.focus();

    if (!prompt.endsWith(": ")) {

        sendToAI();

    }

}


/* =========================================================
   SEND TO AI
========================================================= */

async function sendToAI() {

    if (isGenerating) return;

    if (!userInput) return;

    const text = userInput.value.trim();

    if (!text) return;

    if (text.length > MAX_INPUT) {

        showToast("Message is too long.");

        return;

    }


    userInput.value = "";

    autoResizeInput();

    updateCharacterCount();

    hideCommandSuggestions();


    /* -------------------------------------------------------
       LOCAL COMMANDS
    ------------------------------------------------------- */

    const commandResult = await handleCommand(text);

    if (commandResult) {

        return;

    }


    /* -------------------------------------------------------
       DISCORD INVITE
    ------------------------------------------------------- */

    if (isDiscordInviteRequest(text)) {

        addAIMessage(`
Sure! You can add **Nyxium AI** to your Discord server here:

🔗 [**Invite Nyxium AI to Discord**](${NYXIUM_DISCORD_INVITE})

Click the link, select your server, and authorize the bot.
`);

        return;

    }


    /* -------------------------------------------------------
       SPECIAL AI TOOLS
    ------------------------------------------------------- */

    const specialTool = detectSpecialTool(text);

    if (specialTool) {

        addUserMessage(text);

        await runSpecialTool(specialTool, text);

        return;

    }


    /* -------------------------------------------------------
       NORMAL AI CHAT
    ------------------------------------------------------- */

    addUserMessage(text);

    conversationHistory.push({
        role: "user",
        content: text
    });

    trimHistory();

    saveConversation();

    await generateAIResponse();

}


/* =========================================================
   DISCORD INVITE DETECTOR
========================================================= */

function isDiscordInviteRequest(text) {

    const t = text.toLowerCase().trim();

    const patterns = [

        "discord invite",
        "discord link",
        "bot invite",
        "bot link",
        "invite link",

        "invite nyxium",
        "invite nyxium ai",

        "add nyxium",
        "add nyxium ai",

        "add nyxium to discord",
        "add nyxium ai to discord",

        "invite the bot",
        "invite bot",

        "how do i add you to discord",
        "how can i add you to discord",

        "where is your discord",
        "where can i invite you",

        "your discord",
        "give me your discord",

        "give me the discord invite",
        "give me the bot invite",

        "send discord",
        "send the discord link",

        "send the invite",
        "send invite",

        "how do i invite you",
        "how can i invite you"

    ];

    return patterns.some(pattern => t.includes(pattern));

}


/* =========================================================
   COMMAND HANDLER
========================================================= */

async function handleCommand(text) {

    const lower = text.toLowerCase().trim();


    if (lower === "/clear") {

        startNewChat();

        return true;

    }


    if (lower === "/toggle-sass") {

        toggleSass();

        addAIMessage(
            sassEnabled
                ? "Sass mode is now **ON**. 😈"
                : "Sass mode is now **OFF**. Professional Nyxium activated."
        );

        return true;

    }


    if (lower === "/help") {

        addAIMessage(`

## Nyxium AI Commands

\`/ask\` — Ask Nyxium anything.

\`/code\` — Programming-focused assistance.

\`/summarize\` — Summarize text.

\`/translate\` — Translate text.

\`/clear\` — Start a new conversation.

\`/toggle-sass\` — Toggle Nyxium's playful personality.

\`/help\` — Show this help menu.

You can also simply talk normally — Nyxium will understand your request.

`);

        return true;

    }


    if (lower.startsWith("/ask ")) {

        const question = text.substring(5).trim();

        if (question) {

            userInput.value = question;

            await sendToAI();

        }

        return true;

    }


    if (lower.startsWith("/code ")) {

        const request = text.substring(6).trim();

        addUserMessage(request);

        conversationHistory.push({
            role: "user",
            content:
                `Act as an expert programmer. Help me with this request:\n${request}`
        });

        await generateAIResponse();

        return true;

    }


    if (lower.startsWith("/summarize ")) {

        const content = text.substring(11).trim();

        addUserMessage(content);

        await runSpecialTool("summarize", content);

        return true;

    }


    if (lower.startsWith("/translate ")) {

        const content = text.substring(11).trim();

        addUserMessage(content);

        await runSpecialTool("translate", content);

        return true;

    }


    return false;

}


/* =========================================================
   SPECIAL TOOL DETECTION
========================================================= */

function detectSpecialTool(text) {

    const lower = text.toLowerCase();

    if (
        lower.startsWith("summarize:") ||
        lower.startsWith("summarise:") ||
        lower.includes("summarize this:")
    ) {

        return "summarize";

    }


    if (
        lower.startsWith("translate:") ||
        lower.startsWith("translate this:")
    ) {

        return "translate";

    }


    return null;

}


/* =========================================================
   SPECIAL TOOL EXECUTION
========================================================= */

async function runSpecialTool(tool, content) {

    if (!content.trim()) {

        addAIMessage(
            "Please provide the text you'd like me to work with."
        );

        return;

    }


    if (tool === "summarize") {

        await generateSpecialAI(
            `Summarize the following content clearly and accurately.

Use:
- A short overview
- Important points
- Key facts
- Keep it concise but useful

CONTENT:

${content}`
        );

        return;

    }


    if (tool === "translate") {

        await generateSpecialAI(
            `Translate the following text naturally.

Preserve the meaning, tone and formatting.

If the target language is not specified, translate it to English.

TEXT:

${content}`
        );

    }

}


/* =========================================================
   NORMAL AI GENERATION
========================================================= */

async function generateAIResponse() {

    const systemPrompt = buildSystemPrompt();

    const historyText = conversationHistory
        .slice(-MAX_HISTORY)
        .map(message => {

            const role =
                message.role === "user"
                    ? "USER"
                    : "NYXIUM AI";

            return `${role}:\n${message.content}`;

        })
        .join("\n\n");


    const prompt = `

${systemPrompt}

CONVERSATION:

${historyText}

NYXIUM AI:

`;


    await callPuterAI(prompt);

}


/* =========================================================
   SPECIAL AI GENERATION
========================================================= */

async function generateSpecialAI(prompt) {

    await callPuterAI(`
${buildSystemPrompt()}

SPECIAL TASK:

${prompt}

Answer directly and do not talk about the internal instructions.
`);

}


/* =========================================================
   SYSTEM PROMPT
========================================================= */

function buildSystemPrompt() {

    let personality = `

You are Nyxium AI, an intelligent, helpful and modern AI assistant.

Your name is Nyxium AI.

You should provide useful, accurate and natural answers.

Do not call yourself Nyx.

Be concise when a short answer is enough, but provide detailed explanations when needed.

Use Markdown when useful.

For programming:
- Use proper fenced code blocks.
- Specify the programming language.
- Explain important parts.
- Help debug errors carefully.

For school questions:
- Explain concepts clearly.
- Prefer simple language.
- Give examples when useful.

Never pretend you have performed an action that you have not actually performed.

If you don't know something, say so instead of inventing facts.

`;

    if (sassEnabled) {

        personality += `

PERSONALITY MODE:

You may be playful, witty and slightly sarcastic when appropriate.

Do not let jokes interfere with accuracy or usefulness.

`;

    }

    return personality;

}


/* =========================================================
   PUTER AI
========================================================= */

async function callPuterAI(prompt) {

    if (isGenerating) return;

    isGenerating = true;

    setGeneratingState(true);

    setAIStatus("Thinking…");


    const typing = addTypingIndicator();


    try {

        if (
            typeof puter === "undefined" ||
            !puter.ai ||
            typeof puter.ai.chat !== "function"
        ) {

            throw new Error(
                "Puter AI is not available. Make sure the Puter script is loaded."
            );

        }


        const response = await puter.ai.chat(prompt);


        removeTypingIndicator(typing);


        const answer = extractPuterResponse(response);


        if (!answer) {

            throw new Error(
                "Nyxium received an empty response."
            );

        }


        conversationHistory.push({
            role: "assistant",
            content: answer
        });

        trimHistory();

        saveConversation();

        addAIMessage(answer);

        setAIStatus("Ready when you are");


    } catch (error) {

        console.error("Nyxium AI error:", error);

        removeTypingIndicator(typing);

        addAIMessage(`
I couldn't complete that request right now.

**Error:** ${escapeHTML(
            error?.message || "Unknown AI error"
        )}

Please try again.
`);

        setAIStatus("Connection issue");

        showToast("AI request failed");


    } finally {

        isGenerating = false;

        setGeneratingState(false);

    }

}


/* =========================================================
   PUTER RESPONSE EXTRACTION
========================================================= */

function extractPuterResponse(response) {

    if (!response) return "";


    if (typeof response === "string") {

        return response.trim();

    }


    if (response.message) {

        if (typeof response.message === "string") {

            return response.message.trim();

        }


        if (response.message.content) {

            if (typeof response.message.content === "string") {

                return response.message.content.trim();

            }


            if (Array.isArray(response.message.content)) {

                return response.message.content
                    .map(item => {

                        if (typeof item === "string") {

                            return item;

                        }

                        return item?.text || "";

                    })
                    .join("")
                    .trim();

            }

        }

    }


    if (response.content) {

        if (typeof response.content === "string") {

            return response.content.trim();

        }

    }


    if (response.text) {

        return String(response.text).trim();

    }


    return "";

}


/* =========================================================
   USER MESSAGE
========================================================= */

function addUserMessage(text) {

    removeWelcomeScreen();


    const row = document.createElement("div");

    row.className = "message-row user";


    const avatar = document.createElement("div");

    avatar.className = "message-avatar";

    avatar.innerHTML = `
        <span style="font-size:12px;">●</span>
    `;


    const body = document.createElement("div");

    body.className = "message-body";


    const content = document.createElement("div");

    content.className = "message-content";


    const bubble = document.createElement("div");

    bubble.textContent = text;

    content.appendChild(bubble);


    body.appendChild(content);

    row.appendChild(avatar);

    row.appendChild(body);


    chatMessages.appendChild(row);


    scrollToBottom();

}


/* =========================================================
   AI MESSAGE
========================================================= */

function addAIMessage(text) {

    removeWelcomeScreen();


    const row = document.createElement("div");

    row.className = "message-row";


    const avatar = document.createElement("div");

    avatar.className = "message-avatar";

    avatar.innerHTML = `
        <span style="
            color:#a78bfa;
            font-size:14px;
            text-shadow:0 0 10px rgba(167,139,250,.7);
        ">✦</span>
    `;


    const body = document.createElement("div");

    body.className = "message-body";


    const content = document.createElement("div");

    content.className = "message-content";


    content.innerHTML = renderMarkdown(text);


    body.appendChild(content);


    const actions = document.createElement("div");

    actions.className = "message-actions";


    actions.innerHTML = `

        <button
            class="message-action"
            onclick="copyMessage(this)"
        >
            Copy
        </button>

        <button
            class="message-action"
            onclick="regenerateLastResponse()"
        >
            Regenerate
        </button>

    `;


    body.appendChild(actions);


    row.appendChild(avatar);

    row.appendChild(body);


    chatMessages.appendChild(row);


    highlightCode(content);

    scrollToBottom();

    triggerAvatarAnimation();

}


/* =========================================================
   MARKDOWN RENDERING
========================================================= */

function renderMarkdown(text) {

    if (typeof marked === "undefined") {

        return escapeHTML(text)
            .replace(/\n/g, "<br>");

    }


    const renderer = new marked.Renderer();


    renderer.code = function(codeData) {

        let code = "";

        let language = "text";


        if (typeof codeData === "object") {

            code = codeData.text || "";

            language = codeData.lang || "text";

        } else {

            code = codeData;

        }


        code = escapeHTML(code);


        return `

            <div class="code-wrapper">

                <div class="code-header">

                    <span class="code-language">
                        ${escapeHTML(language)}
                    </span>

                    <button
                        class="copy-code-button"
                        onclick="copyCode(this)"
                    >
                        Copy
                    </button>

                </div>

                <pre><code class="language-${escapeHTML(language)}">${code}</code></pre>

            </div>

        `;

    };


    return marked.parse(text, {
        renderer
    });

}


/* =========================================================
   CODE HIGHLIGHTING
========================================================= */

function highlightCode(container) {

    if (
        typeof hljs === "undefined" ||
        !container
    ) return;


    container
        .querySelectorAll("pre code")
        .forEach(block => {

            try {

                hljs.highlightElement(block);

            } catch (error) {

                console.warn(
                    "Highlight error:",
                    error
                );

            }

        });

}


/* =========================================================
   COPY CODE
========================================================= */

function setupCodeCopy() {

    document.addEventListener("click", event => {

        const button =
            event.target.closest(".copy-code-button");

        if (!button) return;

        copyCode(button);

    });

}


async function copyCode(button) {

    const wrapper =
        button.closest(".code-wrapper");

    if (!wrapper) return;


    const code =
        wrapper.querySelector("pre code");

    if (!code) return;


    try {

        await navigator.clipboard.writeText(
            code.textContent
        );

        button.textContent = "Copied!";

        setTimeout(() => {

            button.textContent = "Copy";

        }, 1500);

        showToast("Code copied");

    } catch (error) {

        showToast("Couldn't copy code");

    }

}


/* =========================================================
   COPY MESSAGE
========================================================= */

async function copyMessage(button) {

    const body =
        button.closest(".message-body");

    if (!body) return;


    const content =
        body.querySelector(".message-content");

    if (!content) return;


    try {

        await navigator.clipboard.writeText(
            content.innerText
        );

        button.textContent = "Copied!";

        setTimeout(() => {

            button.textContent = "Copy";

        }, 1500);

        showToast("Message copied");

    } catch (error) {

        showToast("Couldn't copy message");

    }

}


/* =========================================================
   TYPING INDICATOR
========================================================= */

function addTypingIndicator() {

    removeWelcomeScreen();


    const row = document.createElement("div");

    row.className =
        "message-row typing-message";


    const avatar = document.createElement("div");

    avatar.className = "message-avatar";

    avatar.innerHTML = `
        <span style="color:#a78bfa;">✦</span>
    `;


    const body = document.createElement("div");

    body.className = "message-body";


    body.innerHTML = `

        <div class="message-content">

            <div class="typing-indicator">

                <span class="typing-dot"></span>
                <span class="typing-dot"></span>
                <span class="typing-dot"></span>

            </div>

        </div>

    `;


    row.appendChild(avatar);

    row.appendChild(body);

    chatMessages.appendChild(row);

    scrollToBottom();


    return row;

}


function removeTypingIndicator(element) {

    if (element && element.parentNode) {

        element.remove();

    }

}


/* =========================================================
   WELCOME SCREEN
========================================================= */

function removeWelcomeScreen() {

    const welcome = $("welcome-screen");

    if (welcome) {

        welcome.remove();

    }

}


/* =========================================================
   SCROLL
========================================================= */

function scrollToBottom() {

    if (!chatScrollArea) return;

    requestAnimationFrame(() => {

        chatScrollArea.scrollTo({
            top: chatScrollArea.scrollHeight,
            behavior: "smooth"
        });

    });

}


/* =========================================================
   AI STATUS
========================================================= */

function setAIStatus(status) {

    if (aiStatus) {

        aiStatus.textContent = status;

    }

}


/* =========================================================
   GENERATING STATE
========================================================= */

function setGeneratingState(generating) {

    if (sendButton) {

        sendButton.disabled = generating;

        sendButton.innerHTML =
            generating
                ? `<span>•</span>`
                : `<span>↑</span>`;

    }


    if (userInput) {

        userInput.disabled = generating;

    }

}


/* =========================================================
   SASS
========================================================= */

function toggleSass() {

    sassEnabled = !sassEnabled;


    const icon = $("sass-icon");

    if (icon) {

        icon.textContent =
            sassEnabled
                ? "😈"
                : "✦";

    }


    showToast(
        sassEnabled
            ? "Sass mode enabled"
            : "Sass mode disabled"
    );

}


/* =========================================================
   CLEAR CONVERSATION
========================================================= */

function clearConversation() {

    if (conversationHistory.length === 0) {

        showToast("Conversation is already empty");

        return;

    }


    if (
        !confirm(
            "Clear this conversation?"
        )
    ) {

        return;

    }


    startNewChat();

}


/* =========================================================
   REGENERATE
========================================================= */

async function regenerateLastResponse() {

    if (isGenerating) return;


    if (
        conversationHistory.length === 0
    ) {

        return;

    }


    const last =
        conversationHistory[
            conversationHistory.length - 1
        ];


    if (last.role === "assistant") {

        conversationHistory.pop();

    }


    const lastUser =
        [...conversationHistory]
            .reverse()
            .find(item =>
                item.role === "user"
            );


    if (!lastUser) return;


    removeLastAIMessageFromUI();

    saveConversation();

    await generateAIResponse();

}


function removeLastAIMessageFromUI() {

    const rows =
        chatMessages.querySelectorAll(
            ".message-row:not(.user):not(.typing-message)"
        );


    const last =
        rows[rows.length - 1];

    if (last) {

        last.remove();

    }

}


/* =========================================================
   CONVERSATION STORAGE
========================================================= */

function saveConversation() {

    try {

        localStorage.setItem(
            "nyxium_conversation",
            JSON.stringify(conversationHistory)
        );

    } catch (error) {

        console.warn(
            "Could not save conversation",
            error
        );

    }

}


function loadConversation() {

    try {

        const saved =
            localStorage.getItem(
                "nyxium_conversation"
            );


        if (!saved) return;


        const history =
            JSON.parse(saved);


        if (!Array.isArray(history)) return;


        conversationHistory =
            history.slice(-MAX_HISTORY);


        if (
            conversationHistory.length === 0
        ) {

            return;

        }


        removeWelcomeScreen();


        conversationHistory.forEach(message => {

            if (message.role === "user") {

                addUserMessage(
                    message.content
                );

            } else if (
                message.role === "assistant"
            ) {

                addAIMessage(
                    message.content
                );

            }

        });


    } catch (error) {

        console.warn(
            "Could not load conversation",
            error
        );

    }

}


/* =========================================================
   HISTORY LIMIT
========================================================= */

function trimHistory() {

    if (
        conversationHistory.length >
        MAX_HISTORY
    ) {

        conversationHistory =
            conversationHistory.slice(
                -MAX_HISTORY
            );

    }

}


/* =========================================================
   TIP
========================================================= */

function updateTip() {

    if (!aiTipBox) return;


    const tips = [

        "Tip: Use Shift + Enter for a new line.",

        "Tip: Ask Nyxium to explain difficult topics step by step.",

        "Tip: Nyxium can help debug your code.",

        "Tip: Try /summarize or /translate.",

        "Tip: Ask for examples when learning something new.",

        "Tip: You can ask Nyxium for creative ideas too."

    ];


    const tip =
        tips[
            Math.floor(
                Math.random() * tips.length
            )
        ];


    aiTipBox.innerHTML = `

        <div class="nyxium-tip">

            <strong>✦ Nyxium</strong>

            <span>${tip.replace(
                "Tip: ",
                ""
            )}</span>

        </div>

    `;

}


/* =========================================================
   AVATAR ANIMATION
========================================================= */

function triggerAvatarAnimation() {

    const face = $("ai-face");

    if (!face) return;


    face.classList.remove(
        "pop-animation"
    );


    void face.offsetWidth;


    face.classList.add(
        "pop-animation"
    );

}


/* =========================================================
   TOAST
========================================================= */

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

        }, 200);

    }, 2200);

}


/* =========================================================
   ESCAPE HTML
========================================================= */

function escapeHTML(value) {

    const div =
        document.createElement("div");

    div.textContent =
        String(value ?? "");

    return div.innerHTML;

}


/* =========================================================
   GLOBAL EXPORTS
   Required by index.html onclick handlers
========================================================= */

window.sendToAI = sendToAI;

window.startNewChat = startNewChat;

window.useQuickPrompt = useQuickPrompt;

window.showView = showView;

window.toggleSidebar = toggleSidebar;

window.toggleSass = toggleSass;

window.clearConversation = clearConversation;

window.copyCode = copyCode;

window.copyMessage = copyMessage;

window.regenerateLastResponse =
    regenerateLastResponse;


/* =========================================================
   READY
========================================================= */

console.log(
    `%c✦ ${NYXIUM_NAME} initialized`,
    "color:#a78bfa;font-weight:bold;"
);
