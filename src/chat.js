/* =========================================================
   NYXIUM AI — CHAT ENGINE
   Chat history + Puter AI + Tools + Markdown + UI
   ========================================================= */

(() => {
    "use strict";

    /* =====================================================
       CONFIG
    ===================================================== */

    const CONFIG = {
        storageKey: "nyxium_ai_chats_v3",
        activeChatKey: "nyxium_ai_active_chat_v3",
        sassKey: "nyxium_ai_sass_v2",

        discordInvite:
            "https://discord.com/oauth2/authorize?client_id=1497476268847796377&permissions=8&scope=bot%20applications.commands",

        avatar:
            "https://cdn.discordapp.com/attachments/1510306687687462952/1541024431198044221/nyxim.png?ex=6a8c1657&is=6a8ac4d7&hm=2812e46952c909bfc65b3592929e24381fabc9e267314329e69be52f94703d38&"
    };


    /* =====================================================
       STATE
       ===================================================== */

    let chats = [];
    let activeChatId = null;

    let isGenerating = false;
    let sassEnabled = false;

    let puterReady = false;


    /* =====================================================
       DOM
       ===================================================== */

    const $ = (selector) => document.querySelector(selector);

    const input = $("#user-input");
    const messages = $("#chat-messages");
    const welcome = $("#welcome-screen");
    const sendButton = $("#send-button");
    const characterCount = $("#character-count");
    const statusText = $("#ai-status");


    /* =====================================================
       STORAGE
       ===================================================== */

    function loadChats() {
        try {
            const saved = localStorage.getItem(CONFIG.storageKey);

            if (saved) {
                chats = JSON.parse(saved);

                if (!Array.isArray(chats)) {
                    chats = [];
                }
            }
        } catch (error) {
            console.error("Nyxium: failed to load chats", error);
            chats = [];
        }

        const savedActive = localStorage.getItem(CONFIG.activeChatKey);

        if (
            savedActive &&
            chats.some(chat => chat.id === savedActive)
        ) {
            activeChatId = savedActive;
        }
    }


    function saveChats() {
        try {
            localStorage.setItem(
                CONFIG.storageKey,
                JSON.stringify(chats)
            );

            if (activeChatId) {
                localStorage.setItem(
                    CONFIG.activeChatKey,
                    activeChatId
                );
            }
        } catch (error) {
            console.error("Nyxium: failed to save chats", error);
        }
    }


    /* =====================================================
       CHAT OBJECT
       ===================================================== */

    function createChat() {
        return {
            id:
                "chat_" +
                Date.now() +
                "_" +
                Math.random()
                    .toString(36)
                    .slice(2, 9),

            title: "New conversation",

            createdAt: Date.now(),

            updatedAt: Date.now(),

            messages: []
        };
    }


    function getActiveChat() {
        return chats.find(
            chat => chat.id === activeChatId
        );
    }


    /* =====================================================
       CHAT INITIALIZATION
       ===================================================== */

    function ensureChat() {
        if (!activeChatId || !getActiveChat()) {
            const chat = createChat();

            chats.unshift(chat);

            activeChatId = chat.id;

            saveChats();
        }

        return getActiveChat();
    }


    function startNewChat() {
        if (isGenerating) {
            showToast("Please wait for Nyxium to finish.");
            return;
        }

        const current = getActiveChat();

        if (
            current &&
            current.messages.length === 0 &&
            chats.length > 1
        ) {
            activeChatId = chats.find(
                chat => chat.id !== current.id
            )?.id || current.id;

            saveChats();

            renderActiveChat();
            renderChatHistory();

            return;
        }

        const chat = createChat();

        chats.unshift(chat);

        activeChatId = chat.id;

        saveChats();

        renderActiveChat();
        renderChatHistory();

        focusInput();

        showToast("New chat started");
    }


    /* =====================================================
       LOAD CHAT
       ===================================================== */

    function loadChat(chatId) {
        if (isGenerating) {
            showToast("Please wait for Nyxium to finish.");
            return;
        }

        const chat = chats.find(
            item => item.id === chatId
        );

        if (!chat) return;

        activeChatId = chat.id;

        saveChats();

        renderActiveChat();

        renderChatHistory();

        closeMobileSidebar();

        focusInput();
    }


    /* =====================================================
       DELETE CHAT
       ===================================================== */

    function deleteChat(chatId, event) {
        if (event) {
            event.stopPropagation();
        }

        const index = chats.findIndex(
            chat => chat.id === chatId
        );

        if (index === -1) return;

        chats.splice(index, 1);

        if (activeChatId === chatId) {
            if (chats.length > 0) {
                activeChatId = chats[0].id;
            } else {
                const chat = createChat();

                chats.push(chat);

                activeChatId = chat.id;
            }
        }

        saveChats();

        renderActiveChat();

        renderChatHistory();

        showToast("Chat deleted");
    }


    /* =====================================================
       RENAME CHAT
       ===================================================== */

    function renameChat(chatId, event) {
        if (event) {
            event.stopPropagation();
        }

        const chat = chats.find(
            item => item.id === chatId
        );

        if (!chat) return;

        const title = prompt(
            "Rename this chat:",
            chat.title
        );

        if (!title) return;

        const clean = title.trim().slice(0, 80);

        if (!clean) return;

        chat.title = clean;

        chat.updatedAt = Date.now();

        saveChats();

        renderChatHistory();

        updateHeader();

        showToast("Chat renamed");
    }


    /* =====================================================
       AUTO TITLE
       ===================================================== */

    function generateTitle(text) {
        if (!text) {
            return "New conversation";
        }

        let title = text
            .replace(/\s+/g, " ")
            .trim();

        title = title
            .replace(/^\/(ask|code|summarize|translate)\s*/i, "");

        if (title.length > 42) {
            title =
                title.slice(0, 42).trim() +
                "…";
        }

        return title || "New conversation";
    }


    function updateChatTitle(chat, userText) {
        if (
            chat.title === "New conversation" ||
            !chat.title
        ) {
            chat.title = generateTitle(userText);
        }

        chat.updatedAt = Date.now();

        saveChats();

        renderChatHistory();

        updateHeader();
    }


    /* =====================================================
       CHAT HISTORY UI
       ===================================================== */

    function injectHistoryUI() {
        const sidebar = $("#sidebar");

        if (!sidebar) return;

        let history = $("#nyxium-chat-history");

        if (history) return;

        const nav = sidebar.querySelector(".sidebar-nav");

        if (!nav) return;

        history = document.createElement("div");

        history.id = "nyxium-chat-history";

        history.innerHTML = `
            <div class="nyx-history-header">
                <span>RECENT CHATS</span>

                <button
                    class="nyx-history-search"
                    onclick="toggleChatSearch()"
                    title="Search chats"
                >
                    ⌕
                </button>
            </div>

            <div
                id="nyx-chat-search-box"
                class="nyx-chat-search-box"
                style="display:none;"
            >
                <input
                    id="nyx-chat-search"
                    type="text"
                    placeholder="Search chats..."
                    autocomplete="off"
                >
            </div>

            <div
                id="nyx-chat-list"
                class="nyx-chat-list"
            ></div>
        `;

        nav.insertAdjacentElement(
            "afterend",
            history
        );

        const searchInput =
            $("#nyx-chat-search");

        if (searchInput) {
            searchInput.addEventListener(
                "input",
                () => {
                    renderChatHistory(
                        searchInput.value
                    );
                }
            );
        }
    }


    function toggleChatSearch() {
        const box = $("#nyx-chat-search-box");

        if (!box) return;

        const visible =
            box.style.display !== "none";

        box.style.display =
            visible ? "none" : "block";

        if (!visible) {
            $("#nyx-chat-search")?.focus();
        }
    }


    function formatChatDate(timestamp) {
        const date = new Date(timestamp);

        const now = new Date();

        const startToday = new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate()
        );

        const startDate = new Date(
            date.getFullYear(),
            date.getMonth(),
            date.getDate()
        );

        const difference =
            Math.floor(
                (startToday - startDate) /
                86400000
            );

        if (difference === 0) {
            return "Today";
        }

        if (difference === 1) {
            return "Yesterday";
        }

        if (difference < 7) {
            return date.toLocaleDateString(
                undefined,
                {
                    weekday: "long"
                }
            );
        }

        return date.toLocaleDateString(
            undefined,
            {
                day: "numeric",
                month: "short"
            }
        );
    }


    function renderChatHistory(searchTerm = "") {
        const list = $("#nyx-chat-list");

        if (!list) return;

        const query =
            searchTerm
                .trim()
                .toLowerCase();

        let filtered = chats;

        if (query) {
            filtered = chats.filter(chat =>
                chat.title
                    .toLowerCase()
                    .includes(query)
            );
        }

        if (!filtered.length) {
            list.innerHTML = `
                <div class="nyx-history-empty">
                    ${
                        query
                            ? "No matching chats."
                            : "No previous chats yet."
                    }
                </div>
            `;

            return;
        }

        const groups = {};

        filtered.forEach(chat => {
            const group =
                formatChatDate(chat.updatedAt);

            if (!groups[group]) {
                groups[group] = [];
            }

            groups[group].push(chat);
        });

        let html = "";

        Object.entries(groups).forEach(
            ([groupName, groupChats]) => {

                html += `
                    <div class="nyx-history-group">
                        <div class="nyx-history-date">
                            ${escapeHTML(groupName)}
                        </div>
                `;

                groupChats
                    .sort(
                        (a, b) =>
                            b.updatedAt -
                            a.updatedAt
                    )
                    .forEach(chat => {

                        const active =
                            chat.id === activeChatId;

                        html += `
                            <div
                                class="nyx-history-item ${
                                    active
                                        ? "active"
                                        : ""
                                }"
                                onclick="loadChat('${chat.id}')"
                            >

                                <div class="nyx-history-icon">
                                    ◇
                                </div>

                                <div class="nyx-history-title">
                                    ${escapeHTML(
                                        chat.title
                                    )}
                                </div>

                                <div class="nyx-history-actions">

                                    <button
                                        onclick="renameChat('${chat.id}', event)"
                                        title="Rename"
                                    >
                                        ✎
                                    </button>

                                    <button
                                        onclick="deleteChat('${chat.id}', event)"
                                        title="Delete"
                                    >
                                        ×
                                    </button>

                                </div>

                            </div>
                        `;
                    });

                html += `</div>`;
            }
        );

        list.innerHTML = html;
    }


    /* =====================================================
       RENDER ACTIVE CHAT
       ===================================================== */

    function renderActiveChat() {
        const chat = ensureChat();

        if (!messages) return;

        messages.innerHTML = "";

        if (!chat.messages.length) {
            messages.appendChild(
                createWelcome()
            );

            return;
        }

        chat.messages.forEach(message => {
            renderMessage(
                message.role,
                message.content,
                false
            );
        });

        scrollToBottom(false);
    }


    /* =====================================================
       WELCOME
       ===================================================== */

    function createWelcome() {
        const div =
            document.createElement("div");

        div.id = "welcome-screen";

        div.className =
            "welcome-screen";

        div.innerHTML = `
            <div class="welcome-orb">
                <div class="welcome-orb-inner">
                    ✦
                </div>
            </div>

            <h2>
                What can I help you with?
            </h2>

            <p>
                Ask Nyxium AI anything — from coding
                and schoolwork to explanations, writing,
                analysis and creative ideas.
            </p>

            <div class="starter-grid">

                <button
                    class="starter-card"
                    onclick="useQuickPrompt(
                        'Explain quantum computing in simple words.'
                    )"
                >
                    <span class="starter-icon">⚛</span>

                    <span>
                        <strong>Explain something</strong>
                        <small>
                            Make a difficult topic simple
                        </small>
                    </span>
                </button>

                <button
                    class="starter-card"
                    onclick="useQuickPrompt(
                        'Help me build a clean and modern website.'
                    )"
                >
                    <span class="starter-icon">&lt;/&gt;</span>

                    <span>
                        <strong>Build something</strong>
                        <small>
                            Code, websites and projects
                        </small>
                    </span>
                </button>

                <button
                    class="starter-card"
                    onclick="useQuickPrompt(
                        'Summarize this clearly: '
                    )"
                >
                    <span class="starter-icon">▤</span>

                    <span>
                        <strong>Summarize</strong>
                        <small>
                            Turn long text into useful notes
                        </small>
                    </span>
                </button>

                <button
                    class="starter-card"
                    onclick="useQuickPrompt(
                        'Give me creative ideas for: '
                    )"
                >
                    <span class="starter-icon">✧</span>

                    <span>
                        <strong>Brainstorm</strong>
                        <small>
                            Ideas, stories and projects
                        </small>
                    </span>
                </button>

            </div>
        `;

        return div;
    }


    /* =====================================================
       MESSAGE RENDERING
       ===================================================== */

    function renderMessage(
        role,
        content,
        animate = true
    ) {
        if (!messages) return;

        const row =
            document.createElement("div");

        row.className =
            `message-row ${role}`;

        if (!animate) {
            row.style.animation = "none";
        }

        const avatar =
            document.createElement("div");

        avatar.className =
            "message-avatar";

        if (role === "assistant") {
            avatar.innerHTML = `
                <img
                    src="${CONFIG.avatar}"
                    alt="Nyxium"
                    style="
                        width:100%;
                        height:100%;
                        object-fit:cover;
                        border-radius:inherit;
                    "
                >
            `;
        } else {
            avatar.innerHTML = `
                <span
                    style="
                        font-size:11px;
                        font-weight:700;
                        color:#c4b5fd;
                    "
                >
                    YOU
                </span>
            `;
        }

        const body =
            document.createElement("div");

        body.className =
            "message-body";

        const contentElement =
            document.createElement("div");

        contentElement.className =
            "message-content";

        if (role === "assistant") {
            contentElement.innerHTML =
                renderMarkdown(content);
        } else {
            contentElement.textContent =
                content;
        }

        body.appendChild(contentElement);

        if (role === "assistant") {
            const actions =
                document.createElement("div");

            actions.className =
                "message-actions";

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
        }

        row.appendChild(avatar);

        row.appendChild(body);

        messages.appendChild(row);

        highlightCode(row);

        if (animate) {
            scrollToBottom(true);
        }

        return row;
    }


    /* =====================================================
       MARKDOWN
       ===================================================== */

    function renderMarkdown(text) {
        if (
            typeof marked === "undefined"
        ) {
            return escapeHTML(text)
                .replace(/\n/g, "<br>");
        }

        try {
            marked.setOptions({
                breaks: true,
                gfm: true
            });

            return marked.parse(text);
        } catch {
            return escapeHTML(text)
                .replace(/\n/g, "<br>");
        }
    }


    function highlightCode(container) {
        if (
            typeof hljs === "undefined"
        ) {
            return;
        }

        container
            .querySelectorAll("pre code")
            .forEach(code => {

                try {
                    hljs.highlightElement(
                        code
                    );
                } catch {}
            });

        container
            .querySelectorAll("pre")
            .forEach(pre => {

                if (
                    pre.parentElement
                        ?.classList
                        ?.contains("code-wrapper")
                ) {
                    return;
                }

                const code =
                    pre.querySelector("code");

                if (!code) return;

                const wrapper =
                    document.createElement(
                        "div"
                    );

                wrapper.className =
                    "code-wrapper";

                const header =
                    document.createElement(
                        "div"
                    );

                header.className =
                    "code-header";

                let language =
                    "code";

                const classes =
                    code.className
                        .split(" ");

                const langClass =
                    classes.find(
                        c =>
                            c.startsWith(
                                "language-"
                            )
                    );

                if (langClass) {
                    language =
                        langClass
                            .replace(
                                "language-",
                                ""
                            );
                }

                header.innerHTML = `
                    <span class="code-language">
                        ${escapeHTML(language)}
                    </span>

                    <button
                        class="copy-code-button"
                    >
                        Copy
                    </button>
                `;

                const copyButton =
                    header.querySelector(
                        ".copy-code-button"
                    );

                copyButton.onclick = async () => {

                    try {
                        await navigator
                            .clipboard
                            .writeText(
                                code.innerText
                            );

                        copyButton.textContent =
                            "Copied!";

                        setTimeout(() => {
                            copyButton.textContent =
                                "Copy";
                        }, 1200);

                    } catch {
                        showToast(
                            "Could not copy code."
                        );
                    }
                };

                pre.parentNode.insertBefore(
                    wrapper,
                    pre
                );

                wrapper.appendChild(header);

                wrapper.appendChild(pre);
            });
    }


    /* =====================================================
       SEND MESSAGE
       ===================================================== */

    async function sendToAI() {
        if (isGenerating) return;

        const text =
            input?.value?.trim();

        if (!text) return;

        await sendMessage(text);
    }


    async function sendMessage(text) {
        if (isGenerating) return;

        const cleanText =
            String(text).trim();

        if (!cleanText) return;

        const commandResult =
            await handleCommand(
                cleanText
            );

        if (commandResult) {
            return;
        }

        const chat = ensureChat();

        if (
            chat.messages.length === 0
        ) {
            updateChatTitle(
                chat,
                cleanText
            );
        }

        chat.messages.push({
            role: "user",
            content: cleanText,
            timestamp: Date.now()
        });

        chat.updatedAt = Date.now();

        saveChats();

        if (welcome) {
            welcome.remove();
        }

        renderMessage(
            "user",
            cleanText
        );

        input.value = "";

        updateCharacterCount();

        autoResize();

        isGenerating = true;

        setGeneratingUI(true);

        showTyping();

        try {
            await ensurePuterAuth();

            const response =
                await askPuter(
                    cleanText,
                    chat.messages
                );

            removeTyping();

            chat.messages.push({
                role: "assistant",
                content: response,
                timestamp: Date.now()
            });

            chat.updatedAt = Date.now();

            saveChats();

            renderMessage(
                "assistant",
                response
            );

            renderChatHistory();

        } catch (error) {

            console.error(
                "Nyxium AI error:",
                error
            );

            removeTyping();

            const message =
                getFriendlyError(error);

            chat.messages.push({
                role: "assistant",
                content: message,
                timestamp: Date.now()
            });

            saveChats();

            renderMessage(
                "assistant",
                message
            );

            showToast(
                "Nyxium couldn't complete that request."
            );

        } finally {
            isGenerating = false;

            setGeneratingUI(false);

            updateStatus(
                "Ready when you are"
            );

            focusInput();
        }
    }


    /* =====================================================
       PUTER AUTH
       ===================================================== */

    async function ensurePuterAuth() {
        if (
            typeof puter === "undefined"
        ) {
            throw new Error(
                "Puter is not available."
            );
        }

        try {
            if (
                puter.auth &&
                typeof puter.auth.isSignedIn ===
                    "function"
            ) {
                if (
                    puter.auth.isSignedIn()
                ) {
                    puterReady = true;
                    return true;
                }
            }
        } catch (error) {
            console.warn(
                "Puter auth state check failed:",
                error
            );
        }

        if (
            !puter.auth ||
            typeof puter.auth.signIn !==
                "function"
        ) {
            throw new Error(
                "Puter authentication is unavailable."
            );
        }

        updateStatus(
            "Sign in to unlock Nyxium AI…"
        );

        await puter.auth.signIn();

        puterReady = true;

        updateStatus(
            "Ready when you are"
        );

        return true;
    }


    /* =====================================================
       AI REQUEST
       ===================================================== */

    async function askPuter(
        userText,
        history
    ) {
        if (
            typeof puter === "undefined"
        ) {
            throw new Error(
                "Puter SDK has not loaded yet."
            );
        }

        const systemPrompt = `
You are Nyxium AI.

You are a helpful, intelligent, natural AI assistant.

Your personality:
- Friendly
- Smart
- Clear
- Slightly futuristic
- Never unnecessarily robotic
- Never call yourself "Nyx"
- Your name is always "Nyxium AI"

Answer naturally and directly.

For school questions:
- Explain at an appropriate student level.
- Use examples where useful.
- Do not make answers unnecessarily complicated.

For coding:
- Give working code.
- Explain important parts.
- Use Markdown code blocks.

For summaries:
- Preserve the important information.
- Use concise structure.

For translations:
- Translate naturally rather than word-for-word when appropriate.

For creative requests:
- Be imaginative and useful.

If the user asks for the Nyxium Discord bot invite link,
give them this exact link:
${CONFIG.discordInvite}

Do not claim that you have performed actions you cannot actually perform.
`;

        const recentHistory =
            history
                .slice(-14)
                .map(message => ({
                    role:
                        message.role ===
                        "assistant"
                            ? "assistant"
                            : "user",

                    content:
                        message.content
                }));

        const prompt =
            buildPrompt(
                systemPrompt,
                recentHistory,
                userText
            );

        let result;

        if (
            puter.ai &&
            typeof puter.ai.chat ===
                "function"
        ) {
            result =
                await puter.ai.chat(
                    prompt,
                    {
                        stream: false
                    }
                );
        } else {
            throw new Error(
                "Puter AI is unavailable."
            );
        }

        return extractAIText(result);
    }


    function buildPrompt(
        systemPrompt,
        history,
        current
    ) {
        let prompt =
            `${systemPrompt}\n\n`;

        if (history.length > 1) {
            prompt +=
                "Conversation history:\n\n";

            history
                .slice(0, -1)
                .forEach(message => {

                    prompt +=
                        `${
                            message.role ===
                            "assistant"
                                ? "Nyxium AI"
                                : "User"
                        }: ${
                            message.content
                        }\n\n`;
                });
        }

        prompt +=
            `User: ${current}\n\n`;

        prompt +=
            "Nyxium AI:";

        return prompt;
    }


    function extractAIText(result) {
        if (!result) {
            return "I didn't receive a response.";
        }

        if (
            typeof result === "string"
        ) {
            return result.trim();
        }

        if (
            typeof result.message ===
            "string"
        ) {
            return result.message.trim();
        }

        if (
            result.message &&
            typeof result.message.content ===
                "string"
        ) {
            return result.message.content.trim();
        }

        if (
            Array.isArray(result.message)
        ) {
            return result.message
                .map(item =>
                    typeof item === "string"
                        ? item
                        : item?.text || ""
                )
                .join("")
                .trim();
        }

        if (
            typeof result.text ===
            "string"
        ) {
            return result.text.trim();
        }

        if (
            result.content &&
            typeof result.content ===
                "string"
        ) {
            return result.content.trim();
        }

        return String(result).trim();
    }


    /* =====================================================
       COMMANDS
       ===================================================== */

    async function handleCommand(text) {
        const lower =
            text.toLowerCase().trim();

        if (
            lower === "/clear"
        ) {
            clearConversation();
            return true;
        }

        if (
            lower === "/help"
        ) {
            showCommandHelp();
            return true;
        }

        if (
            lower === "/toggle-sass"
        ) {
            toggleSass();
            return true;
        }

        if (
            lower.startsWith("/ask ")
        ) {
            await sendMessage(
                text.slice(5).trim()
            );

            return true;
        }

        if (
            lower.startsWith("/code ")
        ) {
            await sendMessage(
                `Act as a programming expert. Help me with this:\n\n${text.slice(6).trim()}`
            );

            return true;
        }

        if (
            lower.startsWith("/summarize ")
        ) {
            await sendMessage(
                `Summarize the following content clearly. Preserve the key facts and organize the result with useful headings or bullet points when appropriate:\n\n${text.slice(11).trim()}`
            );

            return true;
        }

        if (
            lower.startsWith("/translate ")
        ) {
            await sendMessage(
                `Translate the following text naturally. Preserve its meaning and formatting. If the target language is not specified, ask which language the user wants:\n\n${text.slice(11).trim()}`
            );

            return true;
        }

        return false;
    }


    function showCommandHelp() {
        const chat = ensureChat();

        const response = `
## Nyxium AI commands

- \`/ask <question>\` — Ask Nyxium anything.
- \`/code <request>\` — Programming mode.
- \`/summarize <text>\` — Summarize content.
- \`/translate <text>\` — Translation mode.
- \`/clear\` — Clear the current conversation.
- \`/toggle-sass\` — Toggle Nyxium's playful personality.
- \`/help\` — Show this help.

You can also simply talk to Nyxium normally.
`;

        chat.messages.push({
            role: "assistant",
            content: response,
            timestamp: Date.now()
        });

        saveChats();

        renderActiveChat();

        renderChatHistory();
    }


    /* =====================================================
       SPECIAL TOOLS
       ===================================================== */

    function useQuickPrompt(prompt) {
        if (!input) return;

        showView("chat");

        input.value = prompt;

        updateCharacterCount();

        autoResize();

        focusInput();

        if (
            !prompt.endsWith(": ") &&
            !prompt.endsWith(":")
        ) {
            setTimeout(() => {
                sendToAI();
            }, 80);
        }
    }


    /* =====================================================
       CLEAR
       ===================================================== */

    function clearConversation() {
        if (!activeChatId) {
            startNewChat();
            return;
        }

        const chat =
            getActiveChat();

        if (!chat) return;

        if (
            chat.messages.length === 0
        ) {
            renderActiveChat();
            return;
        }

        const confirmed =
            confirm(
                "Clear this conversation?"
            );

        if (!confirmed) return;

        chat.messages = [];

        chat.title =
            "New conversation";

        chat.updatedAt =
            Date.now();

        saveChats();

        renderActiveChat();

        renderChatHistory();

        showToast(
            "Conversation cleared"
        );
    }


    /* =====================================================
       REGENERATE
       ===================================================== */

    async function regenerateLastResponse() {
        if (isGenerating) return;

        const chat =
            getActiveChat();

        if (!chat) return;

        const lastAssistantIndex =
            chat.messages
                .map(
                    message =>
                        message.role
                )
                .lastIndexOf(
                    "assistant"
                );

        if (
            lastAssistantIndex === -1
        ) {
            showToast(
                "There is no response to regenerate."
            );

            return;
        }

        const userMessage =
            chat.messages
                .slice(
                    0,
                    lastAssistantIndex
                )
                .reverse()
                .find(
                    message =>
                        message.role ===
                        "user"
                );

        if (!userMessage) return;

        chat.messages.splice(
            lastAssistantIndex,
            1
        );

        saveChats();

        renderActiveChat();

        isGenerating = true;

        setGeneratingUI(true);

        showTyping();

        try {
            await ensurePuterAuth();

            const response =
                await askPuter(
                    userMessage.content,
                    chat.messages
                );

            removeTyping();

            chat.messages.push({
                role: "assistant",
                content: response,
                timestamp: Date.now()
            });

            chat.updatedAt =
                Date.now();

            saveChats();

            renderActiveChat();

            renderChatHistory();

        } catch (error) {

            removeTyping();

            renderMessage(
                "assistant",
                getFriendlyError(error)
            );

        } finally {
            isGenerating = false;

            setGeneratingUI(false);

            updateStatus(
                "Ready when you are"
            );
        }
    }


    /* =====================================================
       COPY MESSAGE
       ===================================================== */

    async function copyMessage(button) {
        const body =
            button
                .closest(".message-body");

        const content =
            body?.querySelector(
                ".message-content"
            );

        if (!content) return;

        try {
            await navigator
                .clipboard
                .writeText(
                    content.innerText
                );

            button.textContent =
                "Copied!";

            setTimeout(() => {
                button.textContent =
                    "Copy";
            }, 1200);

        } catch {
            showToast(
                "Could not copy message."
            );
        }
    }


    /* =====================================================
       TYPING
       ===================================================== */

    function showTyping() {
        removeTyping();

        if (!messages) return;

        const row =
            document.createElement("div");

        row.id =
            "nyxium-typing";

        row.className =
            "message-row assistant";

        row.innerHTML = `
            <div class="message-avatar">
                <img
                    src="${CONFIG.avatar}"
                    alt="Nyxium"
                    style="
                        width:100%;
                        height:100%;
                        object-fit:cover;
                        border-radius:inherit;
                    "
                >
            </div>

            <div class="message-body">
                <div class="typing-indicator">
                    <span class="typing-dot"></span>
                    <span class="typing-dot"></span>
                    <span class="typing-dot"></span>
                </div>
            </div>
        `;

        messages.appendChild(row);

        scrollToBottom(true);

        updateStatus(
            "Nyxium is thinking…"
        );
    }


    function removeTyping() {
        $("#nyxium-typing")?.remove();
    }


    /* =====================================================
       UI STATE
       ===================================================== */

    function setGeneratingUI(value) {
        if (sendButton) {
            sendButton.disabled =
                value;

            sendButton.innerHTML =
                value
                    ? "<span>…</span>"
                    : "<span>↑</span>";
        }

        if (input) {
            input.disabled =
                value;
        }
    }


    function updateStatus(text) {
        if (statusText) {
            statusText.textContent =
                text;
        }
    }


    function updateHeader() {
        const chat =
            getActiveChat();

        const title =
            document.querySelector(
                ".chat-title-row h1"
            );

        if (title) {
            title.textContent =
                "Nyxium AI";
        }

        if (chat) {
            updateStatus(
                chat.messages.length
                    ? `${chat.title}`
                    : "Ready when you are"
            );
        }
    }


    /* =====================================================
       INPUT
       ===================================================== */

    function updateCharacterCount() {
        if (!input || !characterCount)
            return;

        characterCount.textContent =
            `${input.value.length} / 12000`;
    }


    function autoResize() {
        if (!input) return;

        input.style.height = "auto";

        input.style.height =
            Math.min(
                input.scrollHeight,
                190
            ) + "px";
    }


    function focusInput() {
        setTimeout(() => {
            input?.focus();
        }, 50);
    }


    /* =====================================================
       SCROLL
       ===================================================== */

    function scrollToBottom(smooth = true) {
        const area =
            $("#chat-scroll-area");

        if (!area) return;

        requestAnimationFrame(() => {
            area.scrollTo({
                top: area.scrollHeight,
                behavior:
                    smooth
                        ? "smooth"
                        : "auto"
            });
        });
    }


    /* =====================================================
       SASS
       ===================================================== */

    function loadSass() {
        try {
            sassEnabled =
                localStorage.getItem(
                    CONFIG.sassKey
                ) === "true";
        } catch {}
    }


    function toggleSass() {
        sassEnabled =
            !sassEnabled;

        try {
            localStorage.setItem(
                CONFIG.sassKey,
                String(sassEnabled)
            );
        } catch {}

        const icon =
            $("#sass-icon");

        if (icon) {
            icon.textContent =
                sassEnabled
                    ? "🔥"
                    : "✦";
        }

        showToast(
            sassEnabled
                ? "Nyxium personality: playful"
                : "Nyxium personality: normal"
        );
    }


    /* =====================================================
       VIEW SYSTEM
       ===================================================== */

    function showView(viewName) {
        document
            .querySelectorAll(".view")
            .forEach(view => {
                view.classList.remove(
                    "active"
                );
            });

        const view =
            document.getElementById(
                viewName
            );

        if (view) {
            view.classList.add("active");
        }

        document
            .querySelectorAll(
                ".nav-item"
            )
            .forEach(button => {

                button.classList.toggle(
                    "active",
                    button.dataset.view ===
                        viewName
                );
            });

        closeMobileSidebar();

        if (viewName === "chat") {
            focusInput();
            scrollToBottom(false);
        }
    }


    /* =====================================================
       SIDEBAR
       ===================================================== */

    function toggleSidebar() {
        const sidebar =
            $("#sidebar");

        const overlay =
            $("#sidebar-overlay");

        if (!sidebar) return;

        sidebar.classList.toggle(
            "mobile-open"
        );

        overlay?.classList.toggle(
            "active"
        );
    }


    function closeMobileSidebar() {
        $("#sidebar")
            ?.classList
            .remove("mobile-open");

        $("#sidebar-overlay")
            ?.classList
            .remove("active");
    }


    /* =====================================================
       TOAST
       ===================================================== */

    function showToast(message) {
        const container =
            $("#toast-container");

        if (!container) return;

        const toast =
            document.createElement(
                "div"
            );

        toast.className =
            "nyxium-toast";

        toast.textContent =
            message;

        container.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = "0";

            toast.style.transform =
                "translateY(8px)";

            setTimeout(() => {
                toast.remove();
            }, 220);

        }, 2400);
    }


    /* =====================================================
       ERROR HANDLING
       ===================================================== */

    function getFriendlyError(error) {
        const message =
            error?.message ||
            String(error || "");

        if (
            /popup|closed|cancel/i.test(
                message
            )
        ) {
            return `
### Sign-in cancelled

Nyxium AI needs Puter authorization before it can use the AI engine.

Click **Send** again when you're ready to sign in.
`;
        }

        if (
            /auth|login|sign.?in/i.test(
                message
            )
        ) {
            return `
### Nyxium AI needs authentication

Please sign in to Puter and then try your message again.
`;
        }

        if (
            /puter.*unavailable|not.*loaded/i.test(
                message
            )
        ) {
            return `
### Nyxium is still starting

The AI engine has not finished loading yet.

Please wait a moment and try again.
`;
        }

        return `
### Something went wrong

I couldn't complete that request right now.

Please try again.
`;
    }


    /* =====================================================
       UTILITIES
       ===================================================== */

    function escapeHTML(value) {
        return String(value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }


    /* =====================================================
       EVENT LISTENERS
       ===================================================== */

    function setupEvents() {
        if (!input) return;

        input.addEventListener(
            "input",
            () => {
                updateCharacterCount();
                autoResize();
            }
        );

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


    /* =====================================================
       AVATAR
       ===================================================== */

    function setupAvatar() {
        const face =
            $("#ai-face");

        if (!face) return;

        face.innerHTML = `
            <img
                src="${CONFIG.avatar}"
                alt="Nyxium AI"
                style="
                    width:100%;
                    height:100%;
                    object-fit:cover;
                    border-radius:inherit;
                    display:block;
                "
            >
        `;
    }


    /* =====================================================
       GLOBAL FUNCTIONS
       ===================================================== */

    window.startNewChat =
        startNewChat;

    window.loadChat =
        loadChat;

    window.deleteChat =
        deleteChat;

    window.renameChat =
        renameChat;

    window.toggleChatSearch =
        toggleChatSearch;

    window.sendToAI =
        sendToAI;

    window.useQuickPrompt =
        useQuickPrompt;

    window.clearConversation =
        clearConversation;

    window.toggleSass =
        toggleSass;

    window.showView =
        showView;

    window.toggleSidebar =
        toggleSidebar;

    window.copyMessage =
        copyMessage;

    window.regenerateLastResponse =
        regenerateLastResponse;

    window.showToast =
        showToast;


    /* =====================================================
       INITIALIZATION
       ===================================================== */

    function init() {
        loadChats();

        loadSass();

        injectHistoryUI();

        setupEvents();

        setupAvatar();

        ensureChat();

        renderActiveChat();

        renderChatHistory();

        updateCharacterCount();

        autoResize();

        updateHeader();

        if ($("#sass-icon")) {
            $("#sass-icon").textContent =
                sassEnabled
                    ? "🔥"
                    : "✦";
        }

        updateStatus(
            "Ready when you are"
        );

        console.log(
            "✦ Nyxium AI initialized"
        );
    }


    if (
        document.readyState ===
        "loading"
    ) {
        document.addEventListener(
            "DOMContentLoaded",
            init
        );
    } else {
        init();
    }

})();
