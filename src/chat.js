/* =========================================================
   NYXIUM AI — CHAT ENGINE
   ========================================================= */

(() => {
    "use strict";

    /* =====================================================
       CONFIGURATION
    ===================================================== */

    const CONFIG = {
        name: "Nyxium AI",

        avatar:
            "https://cdn.discordapp.com/attachments/1510306687687462952/1541024431198044221/nyxim.png?ex=6a8c1657&is=6a8ac4d7&hm=2812e46952c909bfc65b3592929e24381fabc9e267314329e69be52f94703d38",

        discordInvite:
            "https://discord.com/oauth2/authorize?client_id=1497476268847796377&permissions=0&scope=bot%20applications.commands",

        storageKey: "nyxium_ai_conversation_v3",
        sassKey: "nyxium_ai_sass",

        maxHistory: 30,
        maxInput: 12000
    };


    /* =====================================================
       STATE
    ===================================================== */

    let conversation = [];
    let isGenerating = false;

    let sassMode =
        localStorage.getItem(CONFIG.sassKey) === "true";

    let currentView = "chat";


    /* =====================================================
       DOM
    ===================================================== */

    const $ = (selector) =>
        document.querySelector(selector);

    const chatMessages = $("#chat-messages");
    const chatScrollArea = $("#chat-scroll-area");
    const userInput = $("#user-input");
    const sendButton = $("#send-button");
    const characterCount = $("#character-count");
    const aiStatus = $("#ai-status");
    const aiTipBox = $("#ai-tip-box");
    const toastContainer = $("#toast-container");
    const commandSuggestions = $("#command-suggestions");


    /* =====================================================
       INITIALIZATION
    ===================================================== */

    document.addEventListener("DOMContentLoaded", initialize);

    function initialize() {

        setupAvatar();

        setupInput();

        loadConversation();

        updateSassIcon();

        updateCharacterCount();

        updateTips();

        setStatus("Ready when you are");

        window.addEventListener(
            "resize",
            () => {
                scrollToBottom(false);
            }
        );
    }


    /* =====================================================
       AVATAR
    ===================================================== */

    function setupAvatar() {

        const headerAvatar = $("#ai-face");

        if (headerAvatar) {

            headerAvatar.innerHTML = `
                <img
                    src="${CONFIG.avatar}"
                    alt="Nyxium AI"
                    draggable="false"
                    style="
                        width:100%;
                        height:100%;
                        object-fit:cover;
                        border-radius:11px;
                        display:block;
                    "
                >
            `;
        }

        /*
         * The message avatars are generated dynamically.
         * We use the same Nyxium image for every AI message.
         */
    }


    /* =====================================================
       INPUT
    ===================================================== */

    function setupInput() {

        if (!userInput) return;

        userInput.addEventListener(
            "input",
            () => {

                autoResizeInput();

                updateCharacterCount();

                updateCommandSuggestions();
            }
        );

        userInput.addEventListener(
            "keydown",
            (event) => {

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


    function autoResizeInput() {

        if (!userInput) return;

        userInput.style.height = "auto";

        const height =
            Math.min(
                userInput.scrollHeight,
                190
            );

        userInput.style.height =
            `${height}px`;
    }


    function updateCharacterCount() {

        if (!userInput || !characterCount)
            return;

        characterCount.textContent =
            `${userInput.value.length} / ${CONFIG.maxInput}`;
    }


    /* =====================================================
       COMMAND SUGGESTIONS
    ===================================================== */

    function updateCommandSuggestions() {

        if (!commandSuggestions || !userInput)
            return;

        const value =
            userInput.value.trim();

        commandSuggestions.style.display =
            value.startsWith("/")
                ? "flex"
                : "none";
    }


    /* =====================================================
       STATUS
    ===================================================== */

    function setStatus(text) {

        if (aiStatus)
            aiStatus.textContent = text;
    }


    /* =====================================================
       TOAST
    ===================================================== */

    function showToast(message) {

        if (!toastContainer) return;

        const toast =
            document.createElement("div");

        toast.className =
            "nyxium-toast";

        toast.textContent =
            message;

        toastContainer.appendChild(toast);

        setTimeout(() => {

            toast.style.opacity = "0";
            toast.style.transform =
                "translateY(8px)";

            setTimeout(
                () => toast.remove(),
                250
            );

        }, 2800);
    }


    /* =====================================================
       QUICK PROMPTS
    ===================================================== */

    window.useQuickPrompt =
        function (prompt) {

            showView("chat");

            if (!userInput)
                return;

            userInput.value = prompt;

            autoResizeInput();

            updateCharacterCount();

            updateCommandSuggestions();

            userInput.focus();

            /*
             * If the prompt already contains a complete sentence,
             * send it immediately only for selected starter cards.
             */

            const automaticPrompts = [
                "Explain quantum computing in simple words.",
                "Help me write a clean and modern website."
            ];

            if (
                automaticPrompts.includes(prompt)
            ) {

                sendToAI();
            }
        };


    /* =====================================================
       SEND MESSAGE
    ===================================================== */

    window.sendToAI =
        async function () {

            if (isGenerating)
                return;

            if (!userInput)
                return;

            const text =
                userInput.value.trim();

            if (!text)
                return;

            if (text.length > CONFIG.maxInput) {

                showToast(
                    `Message is too long. Maximum ${CONFIG.maxInput} characters.`
                );

                return;
            }


            /* ---------------------------------------------
               COMMANDS
            --------------------------------------------- */

            if (text.startsWith("/")) {

                const handled =
                    await handleCommand(text);

                if (handled) {

                    userInput.value = "";

                    autoResizeInput();

                    updateCharacterCount();

                    return;
                }
            }


            /* ---------------------------------------------
               SPECIAL DISCORD INVITE REQUEST
            --------------------------------------------- */

            if (isInviteRequest(text)) {

                addMessage(
                    "user",
                    text
                );

                userInput.value = "";

                autoResizeInput();

                updateCharacterCount();

                const inviteResponse = `
You can invite **Nyxium AI** to your Discord server here:

**[➜ Invite Nyxium AI to Discord](${CONFIG.discordInvite})**

Just open the link, select your server, authorize the bot, and you're ready to go.
`;

                addMessage(
                    "ai",
                    inviteResponse
                );

                saveConversation();

                return;
            }


            /* ---------------------------------------------
               USER MESSAGE
            --------------------------------------------- */

            addMessage(
                "user",
                text
            );

            userInput.value = "";

            autoResizeInput();

            updateCharacterCount();

            updateCommandSuggestions();


            /* ---------------------------------------------
               HISTORY
            --------------------------------------------- */

            conversation.push({
                role: "user",
                content: text
            });

            trimConversation();

            saveConversation();


            /* ---------------------------------------------
               GENERATE
            --------------------------------------------- */

            await generateAIResponse();
        };


    /* =====================================================
       AI GENERATION
    ===================================================== */

    async function generateAIResponse() {

        isGenerating = true;

        setComposerState(true);

        setStatus("Nyxium is thinking...");

        const typing =
            addTypingIndicator();

        try {

            if (
                typeof puter === "undefined" ||
                !puter.ai ||
                typeof puter.ai.chat !== "function"
            ) {

                throw new Error(
                    "Puter AI is not available."
                );
            }


            const prompt =
                buildAIContext();


            /*
             * Puter AI
             */

            const result =
                await puter.ai.chat(
                    prompt
                );


            removeTypingIndicator(
                typing
            );


            const response =
                extractAIResponse(result);


            if (!response) {

                throw new Error(
                    "Nyxium returned an empty response."
                );
            }


            addMessage(
                "ai",
                response
            );


            conversation.push({
                role: "assistant",
                content: response
            });

            trimConversation();

            saveConversation();

            setStatus(
                sassMode
                    ? "Nyxium is feeling playful"
                    : "Ready when you are"
            );

        }
        catch (error) {

            removeTypingIndicator(
                typing
            );

            console.error(
                "Nyxium AI error:",
                error
            );


            const errorMessage = `
I couldn't reach my AI core right now.

Please try again in a moment.

\`${escapeHtml(
    error?.message ||
    "Unknown AI error"
)}\`
`;

            addMessage(
                "ai",
                errorMessage
            );

            setStatus(
                "AI connection error"
            );

            showToast(
                "Nyxium AI could not generate a response."
            );
        }
        finally {

            isGenerating = false;

            setComposerState(false);

            scrollToBottom(true);
        }
    }


    /* =====================================================
       AI CONTEXT
    ===================================================== */

    function buildAIContext() {

        const systemPrompt = `
You are Nyxium AI, an intelligent general-purpose AI assistant.

Your personality:
- Intelligent
- Helpful
- Natural
- Clear
- Friendly
- Slightly futuristic
- Never unnecessarily robotic
- Never start every answer with "Sure!"
- Do not repeat the user's question unnecessarily.

IMPORTANT:
You are the AI inside a web application called Nyxium AI.

DISCORD BOT:
If the user asks how to invite Nyxium AI to Discord, provide this exact link:

${CONFIG.discordInvite}

The link is the official OAuth2 invitation link for the Nyxium AI Discord bot.

When providing it, make it clickable using Markdown.

RESPONSE STYLE:
- Use Markdown.
- Use headings when useful.
- Use bullet points for lists.
- Use numbered steps for instructions.
- Use code fences for code.
- Keep simple questions concise.
- Give detailed explanations when the user asks for detail.
- Never intentionally make answers worse just to be short.
- For school questions, explain at an appropriate educational level.
- For programming questions, give working code and explain important parts.
- For creative requests, be creative and natural.

TOOLS:
When the user asks to summarize, actually summarize.
When the user asks to translate, actually translate.
When the user asks to analyze, actually analyze.
When the user asks for code, prioritize correct usable code.
When the user asks to teach something, explain it step by step.

${sassMode ? `
PERSONALITY MODE:
Nyxium is currently in playful mode.
You may use light humor and personality, but never sacrifice accuracy.
` : `
PERSONALITY MODE:
Keep the personality calm, intelligent and professional.
`}

You have access to the conversation history below.
Maintain context naturally.
`;


        const history =
            conversation
                .slice(-CONFIG.maxHistory)
                .map(
                    item =>
                        `${item.role === "user"
                            ? "USER"
                            : "NYXIUM"}:
${item.content}`
                )
                .join("\n\n");


        return `
${systemPrompt}

CONVERSATION HISTORY:
${history}

Now respond to the latest USER message.
`;
    }


    /* =====================================================
       EXTRACT PUTER RESPONSE
    ===================================================== */

    function extractAIResponse(result) {

        if (!result)
            return "";

        if (typeof result === "string")
            return result;

        if (
            result.message &&
            typeof result.message === "string"
        ) {
            return result.message;
        }

        if (
            result.message &&
            result.message.content
        ) {
            return extractContent(
                result.message.content
            );
        }

        if (result.content) {

            return extractContent(
                result.content
            );
        }

        if (result.text)
            return result.text;

        if (
            result.output &&
            typeof result.output === "string"
        ) {
            return result.output;
        }

        try {

            return JSON.stringify(
                result,
                null,
                2
            );

        }
        catch {

            return "";
        }
    }


    function extractContent(content) {

        if (typeof content === "string")
            return content;

        if (Array.isArray(content)) {

            return content
                .map(item => {

                    if (
                        typeof item === "string"
                    )
                        return item;

                    return (
                        item?.text ||
                        item?.content ||
                        ""
                    );
                })
                .join("");
        }

        return (
            content?.text ||
            content?.content ||
            ""
        );
    }


    /* =====================================================
       ADD MESSAGE
    ===================================================== */

    function addMessage(
        role,
        content
    ) {

        if (!chatMessages)
            return;


        /* Remove welcome screen */

        const welcome =
            $("#welcome-screen");

        if (welcome)
            welcome.remove();


        const row =
            document.createElement("div");

        row.className =
            `message-row ${role}`;


        /* ---------------------------------------------
           AVATAR
        --------------------------------------------- */

        const avatar =
            document.createElement("div");

        avatar.className =
            "message-avatar";


        if (role === "ai") {

            avatar.innerHTML = `
                <img
                    src="${CONFIG.avatar}"
                    alt="Nyxium"
                    draggable="false"
                    style="
                        width:100%;
                        height:100%;
                        object-fit:cover;
                        border-radius:9px;
                        display:block;
                    "
                >
            `;

        }
        else {

            avatar.innerHTML = `
                <span
                    style="
                        font-size:12px;
                        font-weight:700;
                        color:#c4b5fd;
                    "
                >
                    You
                </span>
            `;
        }


        /* ---------------------------------------------
           BODY
        --------------------------------------------- */

        const body =
            document.createElement("div");

        body.className =
            "message-body";


        const contentElement =
            document.createElement("div");

        contentElement.className =
            "message-content";


        if (role === "ai") {

            contentElement.innerHTML =
                renderMarkdown(
                    content
                );

        }
        else {

            contentElement.textContent =
                content;
        }


        body.appendChild(
            contentElement
        );


        /* ---------------------------------------------
           ACTIONS
        --------------------------------------------- */

        if (role === "ai") {

            const actions =
                document.createElement("div");

            actions.className =
                "message-actions";

            actions.innerHTML = `
                <button
                    class="message-action"
                    data-action="copy"
                >
                    Copy
                </button>

                <button
                    class="message-action"
                    data-action="regenerate"
                >
                    Regenerate
                </button>
            `;


            actions
                .querySelector(
                    '[data-action="copy"]'
                )
                .addEventListener(
                    "click",
                    () => {
                        copyText(content);
                    }
                );


            actions
                .querySelector(
                    '[data-action="regenerate"]'
                )
                .addEventListener(
                    "click",
                    () => {
                        regenerateLastResponse();
                    }
                );


            body.appendChild(
                actions
            );
        }


        row.appendChild(
            avatar
        );

        row.appendChild(
            body
        );

        chatMessages.appendChild(
            row
        );


        setupCodeButtons(
            row
        );


        scrollToBottom(true);

        return row;
    }


    /* =====================================================
       MARKDOWN
    ===================================================== */

    function renderMarkdown(text) {

        if (
            typeof marked === "undefined"
        ) {

            return escapeHtml(
                text
            ).replace(
                /\n/g,
                "<br>"
            );
        }


        try {

            marked.setOptions({
                breaks: true,
                gfm: true
            });


            const renderer =
                new marked.Renderer();


            renderer.code =
                function (
                    code,
                    language
                ) {

                    /*
                     * marked versions can pass either:
                     * code string or token object.
                     */

                    let codeText = code;
                    let lang = language || "";

                    if (
                        typeof code === "object"
                    ) {

                        codeText =
                            code.text ||
                            "";

                        lang =
                            code.lang ||
                            "";
                    }


                    const safeCode =
                        escapeHtml(
                            codeText
                        );


                    return `
                        <div class="code-wrapper">

                            <div class="code-header">

                                <span class="code-language">
                                    ${escapeHtml(
                                        lang || "code"
                                    )}
                                </span>

                                <button
                                    class="copy-code-button"
                                    type="button"
                                >
                                    Copy
                                </button>

                            </div>

                            <pre><code
                                class="${
                                    lang
                                        ? `language-${escapeHtml(lang)}`
                                        : ""
                                }"
                            >${safeCode}</code></pre>

                        </div>
                    `;
                };


            return marked.parse(
                text,
                {
                    renderer
                }
            );

        }
        catch (error) {

            console.error(
                "Markdown error:",
                error
            );

            return escapeHtml(
                text
            ).replace(
                /\n/g,
                "<br>"
            );
        }
    }


    /* =====================================================
       CODE BUTTONS
    ===================================================== */

    function setupCodeButtons(
        container
    ) {

        if (!container)
            return;


        const blocks =
            container.querySelectorAll(
                "pre code"
            );


        blocks.forEach(
            block => {

                try {

                    if (
                        typeof hljs !==
                        "undefined"
                    ) {

                        hljs.highlightElement(
                            block
                        );
                    }

                }
                catch (error) {

                    console.warn(
                        "Highlight error:",
                        error
                    );
                }
            }
        );


        const buttons =
            container.querySelectorAll(
                ".copy-code-button"
            );


        buttons.forEach(
            button => {

                button.addEventListener(
                    "click",
                    async () => {

                        const wrapper =
                            button.closest(
                                ".code-wrapper"
                            );

                        const code =
                            wrapper?.querySelector(
                                "pre code"
                            );

                        if (!code)
                            return;


                        await copyText(
                            code.textContent
                        );


                        const original =
                            button.textContent;

                        button.textContent =
                            "Copied!";


                        setTimeout(
                            () => {
                                button.textContent =
                                    original;
                            },
                            1500
                        );
                    }
                );
            }
        );
    }


    /* =====================================================
       COPY
    ===================================================== */

    async function copyText(
        text
    ) {

        try {

            await navigator.clipboard.writeText(
                text
            );

            showToast(
                "Copied to clipboard."
            );

        }
        catch {

            const area =
                document.createElement(
                    "textarea"
                );

            area.value =
                text;

            area.style.position =
                "fixed";

            area.style.opacity =
                "0";

            document.body.appendChild(
                area
            );

            area.select();

            document.execCommand(
                "copy"
            );

            area.remove();

            showToast(
                "Copied to clipboard."
            );
        }
    }


    /* =====================================================
       TYPING INDICATOR
    ===================================================== */

    function addTypingIndicator() {

        if (!chatMessages)
            return null;


        const row =
            document.createElement("div");

        row.className =
            "message-row ai";


        row.innerHTML = `
            <div class="message-avatar">

                <img
                    src="${CONFIG.avatar}"
                    alt="Nyxium"
                    draggable="false"
                    style="
                        width:100%;
                        height:100%;
                        object-fit:cover;
                        border-radius:9px;
                        display:block;
                    "
                >

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


        chatMessages.appendChild(
            row
        );

        scrollToBottom(true);

        return row;
    }


    function removeTypingIndicator(
        element
    ) {

        if (element)
            element.remove();
    }


    /* =====================================================
       COMMAND HANDLER
    ===================================================== */

    async function handleCommand(
        input
    ) {

        const parts =
            input.trim().split(/\s+/);

        const command =
            parts[0].toLowerCase();

        const argument =
            input
                .slice(parts[0].length)
                .trim();


        switch (command) {

            case "/clear":

                clearConversation();

                return true;


            case "/toggle-sass":

                toggleSass();

                return true;


            case "/help":

                showHelp();

                return true;


            case "/ask":

                if (!argument) {

                    showToast(
                        "Usage: /ask your question"
                    );

                    return true;
                }

                userInput.value =
                    argument;

                await sendToAI();

                return true;


            case "/code":

                userInput.value =
                    `Write clean, production-ready code for:\n\n${argument}`;

                await sendToAI();

                return true;


            case "/summarize":

                userInput.value =
                    `Summarize the following content clearly. Include the most important points and remove unnecessary repetition:\n\n${argument}`;

                await sendToAI();

                return true;


            case "/translate":

                userInput.value =
                    `Translate the following text naturally. Preserve its meaning, tone and formatting. If no target language is specified, translate it to English:\n\n${argument}`;

                await sendToAI();

                return true;


            default:

                showToast(
                    `Unknown command: ${command}. Try /help`
                );

                return true;
        }
    }


    /* =====================================================
       HELP
    ===================================================== */

    function showHelp() {

        showView("chat");

        addMessage(
            "ai",
            `
## Nyxium AI Commands

| Command | What it does |
|---|---|
| \`/ask\` | Ask Nyxium anything |
| \`/code\` | Programming assistance |
| \`/summarize\` | Summarize text |
| \`/translate\` | Translate text |
| \`/clear\` | Clear conversation |
| \`/toggle-sass\` | Toggle playful personality |
| \`/help\` | Show this help |

You can also simply talk to me normally. You don't need commands.
`
        );
    }


    /* =====================================================
       INVITE DETECTION
    ===================================================== */

    function isInviteRequest(
        text
    ) {

        const value =
            text.toLowerCase();


        const keywords = [
            "invite nyxium",
            "invite nyx",
            "nyxium invite",
            "nyx invite",
            "discord invite",
            "invite link",
            "bot invite",
            "invite the bot",
            "add nyxium",
            "add nyx",
            "add the bot",
            "discord bot link"
        ];


        return keywords.some(
            keyword =>
                value.includes(keyword)
        );
    }


    /* =====================================================
       SASS
    ===================================================== */

    window.toggleSass =
        function () {

            sassMode =
                !sassMode;

            localStorage.setItem(
                CONFIG.sassKey,
                sassMode
            );

            updateSassIcon();

            updateTips();

            setStatus(
                sassMode
                    ? "Playful mode enabled"
                    : "Professional mode enabled"
            );

            showToast(
                sassMode
                    ? "Nyxium playful mode enabled."
                    : "Nyxium playful mode disabled."
            );
        };


    function updateSassIcon() {

        const icon =
            $("#sass-icon");

        if (!icon)
            return;

        icon.textContent =
            sassMode
                ? "✧"
                : "✦";
    }


    /* =====================================================
       TIPS
    ===================================================== */

    function updateTips() {

        if (!aiTipBox)
            return;

        aiTipBox.innerHTML = `
            <div class="nyxium-tip">
                <span>✦</span>

                <span>
                    <strong>Nyxium tip:</strong>
                    ${
                        sassMode
                            ? "Ask me something interesting. I promise not to judge your prompt."
                            : "Ask naturally — you don't need to use commands."
                    }
                </span>
            </div>
        `;
    }


    /* =====================================================
       CLEAR CONVERSATION
    ===================================================== */

    window.clearConversation =
        function () {

            conversation = [];

            localStorage.removeItem(
                CONFIG.storageKey
            );


            if (chatMessages) {

                chatMessages.innerHTML = `
                    <div
                        id="welcome-screen"
                        class="welcome-screen"
                    >

                        <div class="welcome-orb">

                            <div class="welcome-orb-inner">
                                ✦
                            </div>

                        </div>

                        <h2>
                            What can I help you with?
                        </h2>

                        <p>
                            Ask Nyxium AI anything — from coding and schoolwork
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

                    </div>
                `;
            }


            setStatus(
                "Ready when you are"
            );

            showToast(
                "Conversation cleared."
            );
        };


    /* =====================================================
       NEW CHAT
    ===================================================== */

    window.startNewChat =
        function () {

            if (
                conversation.length > 0
            ) {

                const confirmed =
                    confirm(
                        "Start a new Nyxium AI conversation?"
                    );

                if (!confirmed)
                    return;
            }

            clearConversation();

            showView("chat");

            if (userInput)
                userInput.focus();
        };


    /* =====================================================
       REGENERATE
    ===================================================== */

    async function regenerateLastResponse() {

        if (isGenerating)
            return;


        /*
         * Remove last assistant message
         */

        for (
            let i = conversation.length - 1;
            i >= 0;
            i--
        ) {

            if (
                conversation[i].role ===
                "assistant"
            ) {

                conversation.splice(
                    i,
                    1
                );

                break;
            }
        }


        /*
         * Remove last rendered AI row
         */

        const rows =
            chatMessages?.querySelectorAll(
                ".message-row.ai"
            );

        if (rows?.length) {

            rows[
                rows.length - 1
            ].remove();
        }


        saveConversation();

        await generateAIResponse();
    }


    /* =====================================================
       VIEW SWITCHING
    ===================================================== */

    window.showView =
        function (view) {

            const views =
                document.querySelectorAll(
                    ".view"
                );

            views.forEach(
                element => {

                    element.classList.toggle(
                        "active",
                        element.id === view
                    );
                }
            );


            const navItems =
                document.querySelectorAll(
                    ".nav-item"
                );

            navItems.forEach(
                item => {

                    item.classList.toggle(
                        "active",
                        item.dataset.view === view
                    );
                }
            );


            currentView =
                view;


            if (view === "chat") {

                setTimeout(
                    () => {
                        scrollToBottom(false);

                        userInput?.focus();
                    },
                    50
                );
            }


            /*
             * Close mobile sidebar
             */

            const sidebar =
                $("#sidebar");

            const overlay =
                $("#sidebar-overlay");

            if (sidebar) {

                sidebar.classList.remove(
                    "mobile-open"
                );
            }

            if (overlay) {

                overlay.classList.remove(
                    "active"
                );
            }
        };


    /* =====================================================
       MOBILE SIDEBAR
    ===================================================== */

    window.toggleSidebar =
        function () {

            const sidebar =
                $("#sidebar");

            const overlay =
                $("#sidebar-overlay");

            if (!sidebar)
                return;

            const open =
                sidebar.classList.toggle(
                    "mobile-open"
                );

            overlay?.classList.toggle(
                "active",
                open
            );
        };


    /* =====================================================
       SAVE CONVERSATION
    ===================================================== */

    function saveConversation() {

        try {

            localStorage.setItem(
                CONFIG.storageKey,
                JSON.stringify(
                    conversation.slice(
                        -CONFIG.maxHistory
                    )
                )
            );

        }
        catch (error) {

            console.warn(
                "Could not save conversation:",
                error
            );
        }
    }


    /* =====================================================
       LOAD CONVERSATION
    ===================================================== */

    function loadConversation() {

        try {

            const saved =
                localStorage.getItem(
                    CONFIG.storageKey
                );

            if (!saved)
                return;


            const parsed =
                JSON.parse(saved);


            if (
                !Array.isArray(parsed)
            )
                return;


            conversation =
                parsed.filter(
                    item =>
                        item &&
                        (
                            item.role === "user" ||
                            item.role === "assistant"
                        ) &&
                        typeof item.content ===
                            "string"
                );


            /*
             * Rebuild UI
             */

            if (
                conversation.length &&
                chatMessages
            ) {

                const welcome =
                    $("#welcome-screen");

                welcome?.remove();


                conversation.forEach(
                    item => {

                        addMessage(
                            item.role ===
                                "assistant"
                                ? "ai"
                                : "user",
                            item.content
                        );
                    }
                );
            }

        }
        catch (error) {

            console.warn(
                "Could not load conversation:",
                error
            );

            conversation = [];
        }
    }


    /* =====================================================
       TRIM HISTORY
    ===================================================== */

    function trimConversation() {

        if (
            conversation.length >
            CONFIG.maxHistory
        ) {

            conversation =
                conversation.slice(
                    -CONFIG.maxHistory
                );
        }
    }


    /* =====================================================
       COMPOSER STATE
    ===================================================== */

    function setComposerState(
        generating
    ) {

        if (userInput) {

            userInput.disabled =
                generating;
        }

        if (sendButton) {

            sendButton.disabled =
                generating;

            sendButton.innerHTML =
                generating
                    ? `<span>•••</span>`
                    : `<span>↑</span>`;
        }
    }


    /* =====================================================
       SCROLL
    ===================================================== */

    function scrollToBottom(
        smooth = true
    ) {

        if (!chatScrollArea)
            return;


        requestAnimationFrame(
            () => {

                chatScrollArea.scrollTo({
                    top:
                        chatScrollArea.scrollHeight,
                    behavior:
                        smooth
                            ? "smooth"
                            : "auto"
                });
            }
        );
    }


    /* =====================================================
       ESCAPE HTML
    ===================================================== */

    function escapeHtml(
        value
    ) {

        return String(
            value ?? ""
        )
            .replace(
                /&/g,
                "&amp;"
            )
            .replace(
                /</g,
                "&lt;"
            )
            .replace(
                />/g,
                "&gt;"
            )
            .replace(
                /"/g,
                "&quot;"
            )
            .replace(
                /'/g,
                "&#039;"
            );
    }


    /* =====================================================
       EXPOSE FUNCTIONS
       Used by index.html
    ===================================================== */

    window.NyxiumAI = {

        send: sendToAI,

        clear: clearConversation,

        newChat: startNewChat,

        toggleSass,

        showView,

        version: "3.0.0"
    };

})();
