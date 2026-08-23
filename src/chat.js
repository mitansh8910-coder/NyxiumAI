/* =========================================================
   NYXIUM AI — CHAT ENGINE
   Vercel + Puter.js
   ========================================================= */

(() => {
    "use strict";

    /* =====================================================
       CONFIG
    ===================================================== */

    const CONFIG = {
        appName: "Nyxium AI",

        avatar:
            "https://cdn.discordapp.com/attachments/1510306687687462952/1541024431198044221/nyxim.png?ex=6a8c1657&is=6a8ac4d7&hm=2812e46952c909bfc65b3592929e24381fabc9e267314329e69be52f94703d38&",

        discordClientId: "1497476268847796377",

        /*
         * Change this if you want a different permission level.
         * 0 = no permissions
         * 8 = Administrator
         */
        discordPermissions: "8",

        storageKey: "nyxium_ai_conversations_v3",
        sassKey: "nyxium_ai_sass",

        maxChats: 50,
        maxMessagesPerChat: 100,

        maxInputLength: 12000
    };


    /* =====================================================
       STATE
    ===================================================== */

    let conversations = [];
    let activeConversationId = null;

    let isGenerating = false;
    let sassEnabled = false;

    let currentUser = null;
    let authChecked = false;

    let currentAbortController = null;


    /* =====================================================
       DOM HELPERS
    ===================================================== */

    const $ = (selector) =>
        document.querySelector(selector);

    const $$ = (selector) =>
        document.querySelectorAll(selector);


    function getInput() {
        return $("#user-input");
    }

    function getMessages() {
        return $("#chat-messages");
    }

    function getScrollArea() {
        return $("#chat-scroll-area");
    }


    /* =====================================================
       INITIALIZATION
    ===================================================== */

    async function init() {

        loadLocalState();

        setupInput();

        setupAvatar();

        setupKeyboardShortcuts();

        setupNavigation();

        renderRecentChats();

        updateCharacterCount();

        updateSassUI();

        /*
         * IMPORTANT:
         *
         * We DO NOT call puter.auth.signIn() here.
         *
         * This prevents the Puter popup from appearing every
         * time the Vercel website opens.
         */

        await checkExistingAuth();

        updateSendButton();

        window.Nyxium = {
            send: sendToAI,
            newChat: startNewChat,
            login: requestLogin,
            logout: logout,
            conversations
        };
    }


    /* =====================================================
       PUTER AUTHENTICATION
       ===================================================== */

    async function checkExistingAuth() {

        if (!window.puter || !puter.auth) {
            console.warn("Puter.js is not available.");
            authChecked = true;
            return;
        }

        try {

            /*
             * This checks the existing Puter session.
             * It DOES NOT open a login popup.
             */

            const signedIn =
                puter.auth.isSignedIn();

            if (signedIn) {

                try {
                    currentUser =
                        await puter.auth.getUser();
                } catch {
                    currentUser = null;
                }

                authChecked = true;

                updateAuthUI(true);

                setAIStatus(
                    currentUser?.username
                        ? `Ready · ${currentUser.username}`
                        : "Ready when you are"
                );

            } else {

                authChecked = true;

                updateAuthUI(false);

                setAIStatus("Sign in to use Nyxium AI");
            }

        } catch (error) {

            console.error(
                "Authentication check failed:",
                error
            );

            authChecked = true;

            updateAuthUI(false);

            setAIStatus("Sign in to use Nyxium AI");
        }
    }


    /*
     * This is ONLY called by a user action.
     *
     * That is important because Puter requires signIn()
     * to be triggered from user interaction when opening
     * its authentication popup.
     */

    async function requestLogin() {

        if (!window.puter || !puter.auth) {

            showToast(
                "Puter authentication is unavailable."
            );

            return false;
        }

        if (puter.auth.isSignedIn()) {

            try {
                currentUser =
                    await puter.auth.getUser();
            } catch {
                currentUser = null;
            }

            updateAuthUI(true);

            return true;
        }


        const button =
            $("#nyxium-login-button");

        if (button) {
            button.disabled = true;
            button.textContent = "Opening login…";
        }

        try {

            /*
             * Puter displays its authentication flow.
             *
             * The user can authenticate through the
             * providers available in Puter's login screen.
             */

            await puter.auth.signIn();

            currentUser =
                await puter.auth.getUser();

            authChecked = true;

            updateAuthUI(true);

            setAIStatus(
                currentUser?.username
                    ? `Ready · ${currentUser.username}`
                    : "Ready when you are"
            );

            showToast(
                `Welcome to Nyxium AI${currentUser?.username
                    ? `, ${currentUser.username}`
                    : ""}!`
            );

            removeLoginOverlay();

            return true;

        } catch (error) {

            console.error(
                "Puter login failed:",
                error
            );

            if (
                error?.error === "auth_window_closed" ||
                error?.code === "auth_window_closed"
            ) {

                showToast(
                    "Login window was closed."
                );

            } else if (
                error?.error === "popup_blocked" ||
                error?.code === "popup_blocked"
            ) {

                showToast(
                    "Please allow the login popup."
                );

            } else {

                showToast(
                    "Login was not completed."
                );
            }

            return false;

        } finally {

            if (button) {
                button.disabled = false;
                button.textContent = "Continue with Puter";
            }
        }
    }


    async function logout() {

        if (
            window.puter &&
            puter.auth &&
            typeof puter.auth.signOut === "function"
        ) {

            try {
                await puter.auth.signOut();
            } catch (error) {
                console.error(error);
            }
        }

        currentUser = null;

        updateAuthUI(false);

        setAIStatus(
            "Sign in to use Nyxium AI"
        );

        showToast("Signed out.");

        ensureLoginOverlay();
    }


    /* =====================================================
       AUTH UI
    ===================================================== */

    function updateAuthUI(signedIn) {

        const existing =
            $("#nyxium-user-menu");

        if (existing) {
            existing.remove();
        }


        const headerActions =
            $(".chat-header-actions");

        if (!headerActions) {
            return;
        }


        if (signedIn) {

            const menu =
                document.createElement("div");

            menu.id =
                "nyxium-user-menu";

            menu.className =
                "nyxium-user-menu";

            const username =
                currentUser?.username ||
                currentUser?.email ||
                "Signed in";

            menu.innerHTML = `
                <button
                    class="header-icon-button nyxium-account-button"
                    title="Account"
                    type="button"
                >
                    <span class="nyxium-account-avatar">
                        ${escapeHTML(
                            username
                                .charAt(0)
                                .toUpperCase()
                        )}
                    </span>
                </button>

                <div class="nyxium-account-dropdown">
                    <div class="nyxium-account-name">
                        ${escapeHTML(username)}
                    </div>

                    <div class="nyxium-account-label">
                        Puter account
                    </div>

                    <button
                        type="button"
                        class="nyxium-logout-button"
                    >
                        Sign out
                    </button>
                </div>
            `;

            headerActions.prepend(menu);


            const accountButton =
                menu.querySelector(
                    ".nyxium-account-button"
                );

            const dropdown =
                menu.querySelector(
                    ".nyxium-account-dropdown"
                );

            accountButton.addEventListener(
                "click",
                (event) => {

                    event.stopPropagation();

                    dropdown.classList.toggle(
                        "open"
                    );
                }
            );


            menu.querySelector(
                ".nyxium-logout-button"
            ).addEventListener(
                "click",
                logout
            );


            document.addEventListener(
                "click",
                () => {
                    dropdown.classList.remove(
                        "open"
                    );
                },
                {
                    once: true
                }
            );

        }
    }


    function ensureLoginOverlay() {

        if (
            $("#nyxium-auth-overlay")
        ) {
            return;
        }


        const overlay =
            document.createElement("div");

        overlay.id =
            "nyxium-auth-overlay";

        overlay.innerHTML = `
            <div class="nyxium-auth-card">

                <div class="nyxium-auth-avatar">
                    <img
                        src="${CONFIG.avatar}"
                        alt="Nyxium AI"
                    >
                </div>

                <div class="nyxium-auth-brand">
                    Nyxium AI
                </div>

                <h2>
                    Sign in to continue
                </h2>

                <p>
                    Sign in with your Puter account
                    to use Nyxium AI.
                </p>

                <button
                    id="nyxium-login-button"
                    type="button"
                >
                    <span>✦</span>
                    Continue with Puter
                </button>

                <div class="nyxium-auth-note">
                    Your login session can be reused
                    on future visits.
                </div>

            </div>
        `;

        document.body.appendChild(overlay);


        const loginButton =
            $("#nyxium-login-button");

        loginButton.addEventListener(
            "click",
            requestLogin
        );
    }


    function removeLoginOverlay() {

        const overlay =
            $("#nyxium-auth-overlay");

        if (!overlay) {
            return;
        }

        overlay.classList.add(
            "nyxium-auth-closing"
        );

        setTimeout(() => {
            overlay.remove();
        }, 220);
    }


    /* =====================================================
       AVATAR
    ===================================================== */

    function setupAvatar() {

        const faces =
            $$(".ai-face");

        faces.forEach(face => {

            face.innerHTML = `
                <img
                    src="${CONFIG.avatar}"
                    alt="Nyxium AI"
                    draggable="false"
                >
            `;

        });
    }


    function popAvatar() {

        const faces =
            $$(".ai-face");

        faces.forEach(face => {

            face.classList.remove(
                "pop-animation"
            );

            void face.offsetWidth;

            face.classList.add(
                "pop-animation"
            );
        });
    }


    /* =====================================================
       INPUT
    ===================================================== */

    function setupInput() {

        const input =
            getInput();

        if (!input) {
            return;
        }


        input.addEventListener(
            "input",
            () => {

                updateCharacterCount();

                autoResizeTextarea();

                updateSendButton();

                handleCommandSuggestions();
            }
        );


        input.addEventListener(
            "keydown",
            (event) => {

                if (
                    event.key === "Enter" &&
                    !event.shiftKey
                ) {

                    event.preventDefault();

                    if (!isGenerating) {
                        sendToAI();
                    }
                }
            }
        );
    }


    function autoResizeTextarea() {

        const input =
            getInput();

        if (!input) {
            return;
        }

        input.style.height =
            "auto";

        input.style.height =
            Math.min(
                input.scrollHeight,
                190
            ) + "px";
    }


    function updateCharacterCount() {

        const input =
            getInput();

        const counter =
            $("#character-count");

        if (!input || !counter) {
            return;
        }

        counter.textContent =
            `${input.value.length} / ${CONFIG.maxInputLength}`;
    }


    function updateSendButton() {

        const button =
            $("#send-button");

        const input =
            getInput();

        if (!button || !input) {
            return;
        }

        const hasText =
            input.value.trim().length > 0;

        button.disabled =
            isGenerating ||
            !hasText;
    }


    function setupKeyboardShortcuts() {

        document.addEventListener(
            "keydown",
            event => {

                if (
                    (event.ctrlKey ||
                        event.metaKey) &&
                    event.key.toLowerCase() === "k"
                ) {

                    event.preventDefault();

                    getInput()?.focus();
                }


                if (
                    event.key === "Escape" &&
                    isGenerating
                ) {

                    stopGeneration();
                }
            }
        );
    }


    /* =====================================================
       NAVIGATION
    ===================================================== */

    function setupNavigation() {

        $$(".nav-item").forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    const view =
                        button.dataset.view;

                    if (view) {
                        showView(view);
                    }
                }
            );
        });
    }


    window.showView =
        function showView(viewName) {

            $$(".view").forEach(view => {
                view.classList.remove("active");
            });


            const target =
                document.getElementById(
                    viewName
                );

            if (target) {
                target.classList.add("active");
            }


            $$(".nav-item").forEach(item => {

                item.classList.toggle(
                    "active",
                    item.dataset.view === viewName
                );
            });


            if (
                viewName === "chat"
            ) {

                setTimeout(() => {
                    scrollToBottom();
                    getInput()?.focus();
                }, 50);
            }
        };


    window.toggleSidebar =
        function toggleSidebar() {

            const sidebar =
                $("#sidebar");

            const overlay =
                $("#sidebar-overlay");

            sidebar?.classList.toggle(
                "mobile-open"
            );

            overlay?.classList.toggle(
                "active"
            );
        };


    /* =====================================================
       CONVERSATIONS
    ===================================================== */

    function loadLocalState() {

        try {

            const stored =
                localStorage.getItem(
                    CONFIG.storageKey
                );

            conversations =
                stored
                    ? JSON.parse(stored)
                    : [];

        } catch (error) {

            console.error(
                "Could not load chats:",
                error
            );

            conversations = [];
        }


        if (
            !Array.isArray(conversations)
        ) {
            conversations = [];
        }


        try {

            sassEnabled =
                localStorage.getItem(
                    CONFIG.sassKey
                ) === "true";

        } catch {
            sassEnabled = false;
        }
    }


    function saveLocalState() {

        try {

            localStorage.setItem(
                CONFIG.storageKey,
                JSON.stringify(
                    conversations.slice(
                        0,
                        CONFIG.maxChats
                    )
                )
            );

            localStorage.setItem(
                CONFIG.sassKey,
                String(sassEnabled)
            );

        } catch (error) {

            console.error(
                "Could not save state:",
                error
            );
        }
    }


    function createConversation() {

        return {
            id:
                "chat_" +
                Date.now() +
                "_" +
                Math.random()
                    .toString(36)
                    .slice(2, 8),

            title: "New conversation",

            createdAt:
                Date.now(),

            updatedAt:
                Date.now(),

            messages: []
        };
    }


    function getActiveConversation() {

        if (!activeConversationId) {
            return null;
        }

        return conversations.find(
            chat =>
                chat.id ===
                activeConversationId
        ) || null;
    }


    function ensureActiveConversation() {

        let conversation =
            getActiveConversation();

        if (!conversation) {

            conversation =
                createConversation();

            conversations.unshift(
                conversation
            );

            activeConversationId =
                conversation.id;

            saveLocalState();
        }

        return conversation;
    }


    window.startNewChat =
        function startNewChat() {

            if (isGenerating) {
                showToast(
                    "Wait for Nyxium to finish first."
                );
                return;
            }


            const conversation =
                createConversation();

            conversations.unshift(
                conversation
            );

            conversations =
                conversations.slice(
                    0,
                    CONFIG.maxChats
                );

            activeConversationId =
                conversation.id;

            saveLocalState();

            renderConversation();

            renderRecentChats();

            showView("chat");

            const input =
                getInput();

            if (input) {

                input.value = "";

                input.style.height =
                    "auto";
            }

            updateCharacterCount();
            updateSendButton();

            setAIStatus(
                "Ready when you are"
            );

            input?.focus();
        };


    function saveConversation() {

        const conversation =
            getActiveConversation();

        if (!conversation) {
            return;
        }

        conversation.updatedAt =
            Date.now();

        saveLocalState();

        renderRecentChats();
    }


    function makeTitle(text) {

        const clean =
            text
                .replace(/\s+/g, " ")
                .trim();

        if (!clean) {
            return "New conversation";
        }

        return clean.length > 42
            ? clean.slice(0, 42) + "…"
            : clean;
    }


    /* =====================================================
       RECENT CHATS
    ===================================================== */

    function renderRecentChats() {

        let container =
            $("#recent-chats-list");

        /*
         * Your current HTML may not have this element.
         * Create it automatically below the New Chat button.
         */

        if (!container) {

            const sidebar =
                $("#sidebar");

            const nav =
                $(".sidebar-nav");

            if (!sidebar || !nav) {
                return;
            }

            container =
                document.createElement("div");

            container.id =
                "recent-chats-list";

            container.className =
                "recent-chats-list";

            nav.insertAdjacentElement(
                "afterend",
                container
            );
        }


        container.innerHTML = "";


        const heading =
            document.createElement("div");

        heading.className =
            "recent-chats-heading";

        heading.textContent =
            "RECENT CHATS";

        container.appendChild(
            heading
        );


        if (!conversations.length) {

            const empty =
                document.createElement("div");

            empty.className =
                "recent-chat-empty";

            empty.textContent =
                "No conversations yet";

            container.appendChild(
                empty
            );

            return;
        }


        const groups =
            groupConversations(
                conversations
            );


        Object.entries(groups)
            .forEach(
                ([groupName, chats]) => {

                    const group =
                        document.createElement(
                            "div"
                        );

                    group.className =
                        "recent-chat-group";


                    const label =
                        document.createElement(
                            "div"
                        );

                    label.className =
                        "recent-chat-date";

                    label.textContent =
                        groupName;

                    group.appendChild(
                        label
                    );


                    chats.forEach(chat => {

                        const button =
                            document.createElement(
                                "button"
                            );

                        button.type =
                            "button";

                        button.className =
                            "recent-chat-item" +
                            (
                                chat.id ===
                                activeConversationId
                                    ? " active"
                                    : ""
                            );


                        button.innerHTML = `
                            <span class="recent-chat-icon">
                                ◇
                            </span>

                            <span class="recent-chat-title">
                                ${escapeHTML(
                                    chat.title ||
                                    "New conversation"
                                )}
                            </span>
                        `;


                        button.addEventListener(
                            "click",
                            () => {
                                openConversation(
                                    chat.id
                                );
                            }
                        );


                        group.appendChild(
                            button
                        );
                    });


                    container.appendChild(
                        group
                    );
                }
            );
    }


    function groupConversations(chats) {

        const now =
            new Date();

        const todayStart =
            new Date(
                now.getFullYear(),
                now.getMonth(),
                now.getDate()
            ).getTime();

        const yesterdayStart =
            todayStart -
            86400000;


        const groups = {
            Today: [],
            Yesterday: [],
            Earlier: []
        };


        chats
            .slice()
            .sort(
                (a, b) =>
                    (b.updatedAt || 0) -
                    (a.updatedAt || 0)
            )
            .forEach(chat => {

                const time =
                    chat.updatedAt ||
                    chat.createdAt ||
                    0;


                if (time >= todayStart) {

                    groups.Today.push(
                        chat
                    );

                } else if (
                    time >= yesterdayStart
                ) {

                    groups.Yesterday.push(
                        chat
                    );

                } else {

                    groups.Earlier.push(
                        chat
                    );
                }
            });


        Object.keys(groups)
            .forEach(key => {

                if (
                    groups[key].length === 0
                ) {
                    delete groups[key];
                }

            });


        return groups;
    }


    function openConversation(id) {

        if (isGenerating) {
            showToast(
                "Wait for Nyxium to finish."
            );
            return;
        }


        const conversation =
            conversations.find(
                chat =>
                    chat.id === id
            );

        if (!conversation) {
            return;
        }


        activeConversationId =
            conversation.id;

        renderConversation();

        renderRecentChats();

        showView("chat");

        setTimeout(
            scrollToBottom,
            50
        );
    }


    function renderConversation() {

        const container =
            getMessages();

        if (!container) {
            return;
        }


        const conversation =
            getActiveConversation();


        if (
            !conversation ||
            !conversation.messages.length
        ) {

            container.innerHTML = `
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
                        Ask Nyxium AI anything — from
                        coding and schoolwork to
                        explanations, writing, analysis
                        and creative ideas.
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
                            onclick="useQuickPrompt('Give me a detailed summary of: ')"
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

            return;
        }


        container.innerHTML = "";

        conversation.messages.forEach(
            message => {

                appendMessageElement(
                    message.role,
                    message.content,
                    false
                );

            }
        );
    }


    /* =====================================================
       SEND TO AI
    ===================================================== */

    window.sendToAI =
        async function sendToAI(
            explicitPrompt = null,
            forcedMode = null
        ) {

            if (isGenerating) {
                showToast(
                    "Nyxium is already responding."
                );
                return;
            }


            /*
             * Check login ONLY when the user actually
             * attempts to use the AI.
             */

            if (
                window.puter &&
                puter.auth &&
                !puter.auth.isSignedIn()
            ) {

                ensureLoginOverlay();

                showToast(
                    "Please sign in to use Nyxium AI."
                );

                return;
            }


            const input =
                getInput();

            let prompt =
                explicitPrompt !== null
                    ? explicitPrompt
                    : input?.value || "";


            prompt =
                prompt.trim();


            if (!prompt) {
                return;
            }


            if (
                prompt.length >
                CONFIG.maxInputLength
            ) {

                showToast(
                    `Message is too long. Maximum ${CONFIG.maxInputLength} characters.`
                );

                return;
            }


            /*
             * Commands
             */

            if (
                prompt.startsWith("/")
            ) {

                const commandResult =
                    await handleCommand(
                        prompt
                    );

                if (commandResult) {
                    return;
                }
            }


            /*
             * Special invite request.
             */

            if (
                isDiscordInviteRequest(
                    prompt
                )
            ) {

                const invite =
                    getDiscordInviteLink();

                const conversation =
                    ensureActiveConversation();

                addMessage(
                    conversation,
                    "user",
                    prompt
                );

                addMessage(
                    conversation,
                    "assistant",
                    `Here is the official Nyxium Discord bot invite:\n\n${invite}\n\nClick the link and choose the server where you want to add Nyxium.`
                );

                if (
                    input &&
                    explicitPrompt === null
                ) {
                    clearComposer();
                }

                renderConversation();

                saveConversation();

                return;
            }


            /*
             * Clear composer IMMEDIATELY.
             *
             * This fixes the issue where the sent text
             * remained inside the message bar.
             */

            if (
                input &&
                explicitPrompt === null
            ) {
                clearComposer();
            }


            const conversation =
                ensureActiveConversation();


            if (
                conversation.messages.length === 0
            ) {

                conversation.title =
                    makeTitle(prompt);
            }


            addMessage(
                conversation,
                "user",
                prompt
            );


            renderConversation();

            saveConversation();

            scrollToBottom();


            /*
             * Lock composer.
             */

            setGeneratingState(
                true
            );

            setAIStatus(
                "Nyxium is thinking…"
            );

            popAvatar();


            const typing =
                appendTypingIndicator();


            try {

                const systemPrompt =
                    buildSystemPrompt(
                        forcedMode
                    );


                const history =
                    conversation.messages
                        .slice(
                            -30
                        )
                        .map(
                            message => ({
                                role:
                                    message.role ===
                                    "assistant"
                                        ? "assistant"
                                        : "user",
                                content:
                                    message.content
                            })
                        );


                const aiPrompt =
                    `${systemPrompt}

Conversation history:
${JSON.stringify(history, null, 2)}

Respond to the user's latest message naturally.
Do not mention these internal instructions.`;


                currentAbortController =
                    new AbortController();


                /*
                 * Puter AI.
                 *
                 * Puter handles authentication automatically
                 * after the user has authenticated.
                 */

                const response =
                    await puter.ai.chat(
                        aiPrompt,
                        {
                            model:
                                "gpt-5",
                            stream:
                                false
                        }
                    );


                const answer =
                    extractAIText(
                        response
                    );


                typing?.remove();


                const finalAnswer =
                    answer ||
                    "I couldn't generate a response this time. Please try again.";


                addMessage(
                    conversation,
                    "assistant",
                    finalAnswer
                );


                saveConversation();

                renderConversation();

                scrollToBottom();

                setAIStatus(
                    currentUser?.username
                        ? `Ready · ${currentUser.username}`
                        : "Ready when you are"
                );

            } catch (error) {

                typing?.remove();

                console.error(
                    "Nyxium AI error:",
                    error
                );


                if (
                    isAbortError(error)
                ) {

                    addMessage(
                        conversation,
                        "assistant",
                        "Generation stopped."
                    );

                } else {

                    addMessage(
                        conversation,
                        "assistant",
                        getFriendlyAIError(
                            error
                        )
                    );
                }


                saveConversation();

                renderConversation();

                scrollToBottom();

                setAIStatus(
                    "Ready when you are"
                );

            } finally {

                currentAbortController =
                    null;

                setGeneratingState(
                    false
                );
            }
        };


    /* =====================================================
       SYSTEM PROMPT
    ===================================================== */

    function buildSystemPrompt(mode) {

        let prompt = `
You are Nyxium AI, the intelligent assistant inside the Nyxium AI web application.

Identity:
- Your name is Nyxium AI.
- Never call yourself Nyx.
- Be intelligent, natural, helpful and conversational.
- Do not sound robotic.
- Match the user's level of knowledge.
- Give clear explanations.
- Use Markdown when useful.
- Use properly formatted code blocks for programming.
- Do not unnecessarily repeat the user's question.

You can help with:
- General knowledge
- Science
- Mathematics
- Programming
- Websites
- Debugging
- Writing
- Summarization
- Translation
- Analysis
- Schoolwork
- Creative ideas
- Project planning

If the user asks about the Nyxium Discord bot, remember that its Discord application/client ID is:
1497476268847796377

If the user asks for the Nyxium Discord bot invite link, provide:
${getDiscordInviteLink()}
`;


        if (sassEnabled) {

            prompt += `
Personality mode:
- You can be slightly playful and witty.
- Do not become rude or annoying.
- Still prioritize useful answers.
`;
        }


        if (mode === "code") {

            prompt += `
Mode: PROGRAMMING
Focus on correct, practical code.
Explain important implementation details.
`;
        }


        if (mode === "summarize") {

            prompt += `
Mode: SUMMARIZATION
Summarize the user's provided content.
Preserve important facts.
Use headings and bullets when helpful.
Do not invent information.
`;
        }


        if (mode === "translate") {

            prompt += `
Mode: TRANSLATION
Translate the user's content accurately.
Preserve meaning, tone and formatting.
If the target language is not specified, ask which language they want.
`;
        }


        if (mode === "analyze") {

            prompt += `
Mode: ANALYSIS
Break the information into important points.
Identify patterns, issues, strengths and weaknesses where relevant.
Give a useful conclusion.
`;
        }


        return prompt;
    }


    /* =====================================================
       AI TEXT EXTRACTION
    ===================================================== */

    function extractAIText(response) {

        if (!response) {
            return "";
        }


        if (
            typeof response ===
            "string"
        ) {
            return response;
        }


        if (
            response.message &&
            typeof response.message ===
                "string"
        ) {
            return response.message;
        }


        if (
            response.message?.content
        ) {

            if (
                typeof response.message.content ===
                "string"
            ) {

                return response.message.content;
            }


            if (
                Array.isArray(
                    response.message.content
                )
            ) {

                return response.message.content
                    .map(
                        item =>
                            item?.text ||
                            ""
                    )
                    .join("");
            }
        }


        if (
            response.content &&
            typeof response.content ===
                "string"
        ) {
            return response.content;
        }


        if (
            response.text &&
            typeof response.text ===
                "string"
        ) {
            return response.text;
        }


        if (
            Array.isArray(
                response
            )
        ) {

            return response
                .map(
                    item =>
                        item?.text ||
                        item?.content ||
                        ""
                )
                .join("");
        }


        return "";
    }


    /* =====================================================
       MESSAGE MANAGEMENT
    ===================================================== */

    function addMessage(
        conversation,
        role,
        content
    ) {

        conversation.messages.push({
            role,
            content,
            timestamp:
                Date.now()
        });


        if (
            conversation.messages.length >
            CONFIG.maxMessagesPerChat
        ) {

            conversation.messages =
                conversation.messages.slice(
                    -CONFIG.maxMessagesPerChat
                );
        }


        conversation.updatedAt =
            Date.now();
    }


    function appendMessageElement(
        role,
        content,
        animate = true
    ) {

        const container =
            getMessages();

        if (!container) {
            return null;
        }


        const row =
            document.createElement("div");

        row.className =
            `message-row ${role}` +
            (
                animate
                    ? ""
                    : " no-animation"
            );


        const avatar =
            document.createElement("div");

        avatar.className =
            "message-avatar";


        if (role === "assistant") {

            avatar.innerHTML = `
                <img
                    src="${CONFIG.avatar}"
                    alt="Nyxium AI"
                    draggable="false"
                >
            `;

        } else {

            avatar.innerHTML =
                `<span>●</span>`;
        }


        const body =
            document.createElement("div");

        body.className =
            "message-body";


        const contentElement =
            document.createElement("div");

        contentElement.className =
            "message-content";


        contentElement.innerHTML =
            renderMarkdown(
                content
            );


        body.appendChild(
            contentElement
        );


        const actions =
            document.createElement("div");

        actions.className =
            "message-actions";


        actions.innerHTML = `
            <button
                class="message-action"
                type="button"
                data-action="copy"
            >
                Copy
            </button>

            ${
                role === "assistant"
                    ? `
                        <button
                            class="message-action"
                            type="button"
                            data-action="regenerate"
                        >
                            Regenerate
                        </button>
                    `
                    : ""
            }
        `;


        body.appendChild(
            actions
        );


        row.appendChild(
            avatar
        );

        row.appendChild(
            body
        );


        actions
            .querySelector(
                '[data-action="copy"]'
            )
            ?.addEventListener(
                "click",
                () => {

                    copyText(
                        content
                    );
                }
            );


        actions
            .querySelector(
                '[data-action="regenerate"]'
            )
            ?.addEventListener(
                "click",
                () => {

                    regenerateLastResponse();
                }
            );


        container.appendChild(
            row
        );


        setupCodeCopyButtons(
            row
        );


        return row;
    }


    function renderMarkdown(text) {

        if (
            window.marked &&
            typeof marked.parse ===
                "function"
        ) {

            try {

                const html =
                    marked.parse(
                        text,
                        {
                            breaks: true,
                            gfm: true
                        }
                    );

                return sanitizeBasicHTML(
                    html
                );

            } catch {
                return escapeHTML(
                    text
                );
            }
        }


        return escapeHTML(
            text
        ).replace(
            /\n/g,
            "<br>"
        );
    }


    function sanitizeBasicHTML(html) {

        const template =
            document.createElement(
                "template"
            );

        template.innerHTML =
            html;


        /*
         * Remove dangerous elements.
         */

        template.content
            .querySelectorAll(
                "script, iframe, object, embed, form"
            )
            .forEach(
                element =>
                    element.remove()
            );


        template.content
            .querySelectorAll(
                "*"
            )
            .forEach(
                element => {

                    [...element.attributes]
                        .forEach(
                            attribute => {

                                if (
                                    attribute.name
                                        .startsWith(
                                            "on"
                                        )
                                ) {

                                    element.removeAttribute(
                                        attribute.name
                                    );
                                }


                                if (
                                    attribute.name ===
                                        "href" &&
                                    /^javascript:/i.test(
                                        attribute.value
                                    )
                                ) {

                                    element.removeAttribute(
                                        attribute.name
                                    );
                                }
                            }
                        );
                }
            );


        return template.innerHTML;
    }


    /* =====================================================
       CODE BLOCKS
    ===================================================== */

    function setupCodeCopyButtons(
        container
    ) {

        if (!container) {
            return;
        }


        container
            .querySelectorAll(
                "pre"
            )
            .forEach(pre => {

                if (
                    pre.parentElement?.classList
                        .contains(
                            "code-wrapper"
                        )
                ) {
                    return;
                }


                const code =
                    pre.querySelector(
                        "code"
                    );

                if (!code) {
                    return;
                }


                if (
                    window.hljs
                ) {

                    try {

                        hljs.highlightElement(
                            code
                        );

                    } catch {
                        // Ignore highlight failures.
                    }
                }


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


                const language =
                    code.className
                        .match(
                            /language-([\w+-]+)/
                        )?.[1] ||
                    "code";


                header.innerHTML = `
                    <span class="code-language">
                        ${escapeHTML(language)}
                    </span>

                    <button
                        class="copy-code-button"
                        type="button"
                    >
                        Copy
                    </button>
                `;


                pre.parentNode.insertBefore(
                    wrapper,
                    pre
                );

                wrapper.appendChild(
                    header
                );

                wrapper.appendChild(
                    pre
                );


                header
                    .querySelector(
                        ".copy-code-button"
                    )
                    .addEventListener(
                        "click",
                        () => {

                            copyText(
                                code.innerText
                            );

                            showToast(
                                "Code copied."
                            );
                        }
                    );
            });
    }


    /* =====================================================
       TYPING
    ===================================================== */

    function appendTypingIndicator() {

        const container =
            getMessages();

        if (!container) {
            return null;
        }


        const row =
            document.createElement(
                "div"
            );

        row.className =
            "message-row assistant";


        row.innerHTML = `
            <div class="message-avatar">
                <img
                    src="${CONFIG.avatar}"
                    alt="Nyxium AI"
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


        container.appendChild(
            row
        );

        scrollToBottom();


        return row;
    }


    /* =====================================================
       COMMANDS
    ===================================================== */

    async function handleCommand(
        commandText
    ) {

        const parts =
            commandText
                .trim()
                .split(/\s+/);

        const command =
            parts[0]
                .toLowerCase();


        const argument =
            commandText
                .slice(
                    parts[0].length
                )
                .trim();


        switch (command) {

            case "/clear":

                clearConversation();

                return true;


            case "/help":

                showCommandHelp();

                return true;


            case "/toggle-sass":

                toggleSass();

                return true;


            case "/code":

                if (argument) {

                    await sendToAI(
                        argument,
                        "code"
                    );

                } else {

                    useQuickPrompt(
                        "Help me with this programming task: "
                    );
                }

                return true;


            case "/summarize":

                if (argument) {

                    await sendToAI(
                        argument,
                        "summarize"
                    );

                } else {

                    useQuickPrompt(
                        "Summarize the following text clearly:\n\n"
                    );
                }

                return true;


            case "/translate":

                if (argument) {

                    await sendToAI(
                        argument,
                        "translate"
                    );

                } else {

                    useQuickPrompt(
                        "Translate the following text. Target language: \n\n"
                    );
                }

                return true;


            case "/analyze":

                if (argument) {

                    await sendToAI(
                        argument,
                        "analyze"
                    );

                } else {

                    useQuickPrompt(
                        "Analyze the following:\n\n"
                    );
                }

                return true;


            case "/invite":

                const invite =
                    getDiscordInviteLink();

                const conversation =
                    ensureActiveConversation();

                addMessage(
                    conversation,
                    "assistant",
                    `Here is the Nyxium Discord bot invite:\n\n${invite}`
                );

                renderConversation();

                saveConversation();

                return true;


            default:

                /*
                 * Unknown slash commands are allowed to
                 * continue to the AI instead of silently
                 * doing nothing.
                 */

                return false;
        }
    }


    function showCommandHelp() {

        const conversation =
            ensureActiveConversation();


        addMessage(
            conversation,
            "assistant",
            `
## Nyxium commands

- \`/ask\` — Ask Nyxium anything
- \`/code\` — Programming mode
- \`/summarize\` — Summarize text
- \`/translate\` — Translation mode
- \`/analyze\` — Analyze information
- \`/invite\` — Get the Nyxium Discord bot invite
- \`/toggle-sass\` — Toggle playful personality
- \`/clear\` — Clear the current chat
- \`/help\` — Show this help

You can also simply talk normally without using commands.
`
        );


        renderConversation();

        saveConversation();

        scrollToBottom();
    }


    /* =====================================================
       QUICK PROMPTS
    ===================================================== */

    window.useQuickPrompt =
        function useQuickPrompt(
            prompt
        ) {

            const input =
                getInput();

            if (!input) {
                return;
            }


            /*
             * If the prompt is an actual command,
             * send it directly.
             */

            if (
                prompt === "/clear" ||
                prompt === "/help" ||
                prompt === "/toggle-sass"
            ) {

                input.value =
                    prompt;

                sendToAI();

                return;
            }


            input.value =
                prompt;

            autoResizeTextarea();

            updateCharacterCount();

            updateSendButton();

            showView("chat");

            input.focus();


            /*
             * If it is a complete starter prompt,
             * send immediately.
             */

            if (
                !prompt.endsWith(": ") &&
                !prompt.endsWith("\n\n")
            ) {

                sendToAI();
            }
        };


    /* =====================================================
       SPECIAL AI TOOLS
       ===================================================== */

    window.runSummarize =
        function runSummarize() {

            useQuickPrompt(
                "Summarize the following text clearly:\n\n"
            );
        };


    window.runTranslate =
        function runTranslate() {

            useQuickPrompt(
                "Translate the following text.\nTarget language: \n\n"
            );
        };


    window.runAnalyze =
        function runAnalyze() {

            useQuickPrompt(
                "Analyze the following information and give me the important points:\n\n"
            );
        };


    window.runCode =
        function runCode() {

            useQuickPrompt(
                "Help me write or debug this code:\n\n"
            );
        };


    /* =====================================================
       CLEAR CHAT
    ===================================================== */

    window.clearConversation =
        function clearConversation() {

            if (isGenerating) {

                showToast(
                    "Stop the current response first."
                );

                return;
            }


            const conversation =
                getActiveConversation();

            if (!conversation) {
                startNewChat();
                return;
            }


            conversation.messages = [];

            conversation.title =
                "New conversation";

            conversation.updatedAt =
                Date.now();


            saveConversation();

            renderConversation();

            setAIStatus(
                "Ready when you are"
            );

            getInput()?.focus();
        };


    /* =====================================================
       REGENERATE
    ===================================================== */

    async function regenerateLastResponse() {

        if (isGenerating) {
            return;
        }


        const conversation =
            getActiveConversation();

        if (!conversation) {
            return;
        }


        const lastAssistantIndex =
            findLastAssistantIndex(
                conversation.messages
            );


        if (
            lastAssistantIndex === -1
        ) {
            return;
        }


        const previousUser =
            conversation.messages[
                lastAssistantIndex - 1
            ];


        if (
            !previousUser ||
            previousUser.role !== "user"
        ) {
            return;
        }


        conversation.messages =
            conversation.messages.slice(
                0,
                lastAssistantIndex
            );


        saveConversation();

        renderConversation();


        /*
         * Don't put the user's message into the UI again.
         * Just generate a replacement assistant answer.
         */

        const prompt =
            previousUser.content;


        setGeneratingState(
            true
        );

        setAIStatus(
            "Nyxium is thinking…"
        );


        const typing =
            appendTypingIndicator();


        try {

            const systemPrompt =
                buildSystemPrompt();


            const history =
                conversation.messages
                    .slice(-30)
                    .map(
                        message => ({
                            role:
                                message.role ===
                                "assistant"
                                    ? "assistant"
                                    : "user",
                            content:
                                message.content
                        })
                    );


            const response =
                await puter.ai.chat(
                    `${systemPrompt}

Conversation history:
${JSON.stringify(history, null, 2)}

Answer this user request again:
${prompt}`,
                    {
                        model:
                            "gpt-5",
                        stream:
                            false
                    }
                );


            typing?.remove();


            addMessage(
                conversation,
                "assistant",
                extractAIText(
                    response
                ) ||
                "I couldn't regenerate the response."
            );


            saveConversation();

            renderConversation();

            scrollToBottom();

        } catch (error) {

            typing?.remove();

            addMessage(
                conversation,
                "assistant",
                getFriendlyAIError(
                    error
                )
            );

            saveConversation();

            renderConversation();

        } finally {

            setGeneratingState(
                false
            );

            setAIStatus(
                "Ready when you are"
            );
        }
    }


    function findLastAssistantIndex(
        messages
    ) {

        for (
            let i =
                messages.length - 1;
            i >= 0;
            i--
        ) {

            if (
                messages[i].role ===
                "assistant"
            ) {

                return i;
            }
        }

        return -1;
    }


    /* =====================================================
       SASS
    ===================================================== */

    window.toggleSass =
        function toggleSass() {

            sassEnabled =
                !sassEnabled;

            saveLocalState();

            updateSassUI();

            showToast(
                sassEnabled
                    ? "Nyxium personality enabled."
                    : "Nyxium personality disabled."
            );
        };


    function updateSassUI() {

        const icon =
            $("#sass-icon");

        if (icon) {

            icon.textContent =
                sassEnabled
                    ? "✦"
                    : "◇";
        }
    }


    /* =====================================================
       COMPOSER CLEAR
    ===================================================== */

    function clearComposer() {

        const input =
            getInput();

        if (!input) {
            return;
        }


        input.value = "";

        input.style.height =
            "auto";


        updateCharacterCount();

        updateSendButton();

        hideCommandSuggestions();
    }


    /* =====================================================
       COMMAND SUGGESTIONS
    ===================================================== */

    function handleCommandSuggestions() {

        const input =
            getInput();

        const suggestions =
            $("#command-suggestions");

        if (!input || !suggestions) {
            return;
        }


        const value =
            input.value.trim();


        if (
            value.startsWith("/") &&
            !value.includes(" ")
        ) {

            suggestions.classList.add(
                "visible"
            );

        } else {

            suggestions.classList.remove(
                "visible"
            );
        }
    }


    function hideCommandSuggestions() {

        $("#command-suggestions")
            ?.classList.remove(
                "visible"
            );
    }


    /* =====================================================
       GENERATION STATE
    ===================================================== */

    function setGeneratingState(
        generating
    ) {

        isGenerating =
            generating;


        const input =
            getInput();

        const button =
            $("#send-button");


        if (input) {

            input.disabled =
                generating;

            input.placeholder =
                generating
                    ? "Nyxium is thinking…"
                    : "Message Nyxium AI...";
        }


        if (button) {

            if (generating) {

                button.innerHTML =
                    `<span>■</span>`;

                button.title =
                    "Stop generating";

                button.disabled =
                    false;

                button.onclick =
                    stopGeneration;

            } else {

                button.innerHTML =
                    `<span>↑</span>`;

                button.title =
                    "Send message";

                button.onclick =
                    sendToAI;
            }
        }


        updateSendButton();
    }


    function stopGeneration() {

        if (
            currentAbortController
        ) {

            currentAbortController.abort();
        }

        isGenerating =
            false;

        setGeneratingState(
            false
        );

        setAIStatus(
            "Ready when you are"
        );

        showToast(
            "Generation stopped."
        );
    }


    /* =====================================================
       AI STATUS
    ===================================================== */

    function setAIStatus(
        text
    ) {

        const status =
            $("#ai-status");

        if (status) {
            status.textContent =
                text;
        }
    }


    /* =====================================================
       SCROLL
    ===================================================== */

    function scrollToBottom() {

        const area =
            getScrollArea();

        if (!area) {
            return;
        }


        requestAnimationFrame(
            () => {

                area.scrollTop =
                    area.scrollHeight;
            }
        );
    }


    /* =====================================================
       DISCORD INVITE
    ===================================================== */

    function getDiscordInviteLink() {

        return (
            "https://discord.com/oauth2/authorize" +
            `?client_id=${encodeURIComponent(
                CONFIG.discordClientId
            )}` +
            `&permissions=${encodeURIComponent(
                CONFIG.discordPermissions
            )}` +
            "&scope=bot%20applications.commands"
        );
    }


    function isDiscordInviteRequest(
        text
    ) {

        const normalized =
            text
                .toLowerCase()
                .replace(
                    /[^a-z0-9\s]/g,
                    " "
                );


        const asksInvite =
            normalized.includes(
                "invite"
            ) ||
            normalized.includes(
                "add bot"
            ) ||
            normalized.includes(
                "bot link"
            );


        const mentionsDiscord =
            normalized.includes(
                "discord"
            ) ||
            normalized.includes(
                "server"
            );


        return (
            asksInvite &&
            mentionsDiscord
        );
    }


    /* =====================================================
       ERROR HANDLING
    ===================================================== */

    function isAbortError(
        error
    ) {

        return (
            error?.name ===
                "AbortError" ||
            String(
                error?.message || ""
            ).toLowerCase()
                .includes(
                    "abort"
                )
        );
    }


    function getFriendlyAIError(
        error
    ) {

        const message =
            String(
                error?.message ||
                error?.msg ||
                ""
            );


        if (
            message
                .toLowerCase()
                .includes(
                    "unauthorized"
                )
        ) {

            ensureLoginOverlay();

            return (
                "Please sign in to Puter before using Nyxium AI."
            );
        }


        if (
            message
                .toLowerCase()
                .includes(
                    "rate"
                )
        ) {

            return (
                "Nyxium is being rate-limited right now. Please try again in a moment."
            );
        }


        return (
            "Something went wrong while generating the response. Please try again."
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

        } catch {

            const textarea =
                document.createElement(
                    "textarea"
                );

            textarea.value =
                text;

            document.body.appendChild(
                textarea
            );

            textarea.select();

            document.execCommand(
                "copy"
            );

            textarea.remove();

            showToast(
                "Copied to clipboard."
            );
        }
    }


    /* =====================================================
       TOAST
    ===================================================== */

    window.showToast =
        function showToast(
            message
        ) {

            const container =
                $("#toast-container");

            if (!container) {
                return;
            }


            const toast =
                document.createElement(
                    "div"
                );

            toast.className =
                "nyxium-toast";

            toast.textContent =
                message;


            container.appendChild(
                toast
            );


            setTimeout(
                () => {

                    toast.style.opacity =
                        "0";

                    toast.style.transform =
                        "translateY(6px)";

                    setTimeout(
                        () => toast.remove(),
                        200
                    );

                },
                2800
            );
        };


    /* =====================================================
       ESCAPE HTML
    ===================================================== */

    function escapeHTML(
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
       STARTUP
    ===================================================== */

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
