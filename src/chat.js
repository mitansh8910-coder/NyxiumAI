/* =========================================================
   NYXIUM AI — CHAT ENGINE
   Puter AI + Authentication + Chat History
   User Puter Avatar Support
   ========================================================= */

(() => {
    "use strict";

    /* =====================================================
       CONFIG
       ===================================================== */

    const CONFIG = {
        BOT_NAME: "Nyxium AI",

        AVATAR_URL:
            "https://cdn.discordapp.com/attachments/1510306687687462952/1541024431198044221/nyxim.png?ex=6a8c1657&is=6a8ac4d7&hm=2812e46952c909bfc65b3592929e24381fabc9e267314329e69be52f94703d38&",

        DISCORD_BOT_ID: "1497476268847796377",

        STORAGE_CHATS: "nyxium_chats_v3",
        STORAGE_ACTIVE: "nyxium_active_chat_v3",
        STORAGE_SASS: "nyxium_sass_v3",

        MAX_CHATS: 50,
        MAX_MESSAGES_PER_CHAT: 100,

        MAX_INPUT: 12000,

        PUTER_MODEL: "gpt-5-mini"
    };


    /* =====================================================
       STATE
       ===================================================== */

    let chats = [];
    let activeChatId = null;

    let isGenerating = false;
    let sassEnabled = false;

    let puterUser = null;

    let initialized = false;


    /* =====================================================
       DOM HELPERS
       ===================================================== */

    const $ = selector =>
        document.querySelector(selector);

    const $$ = selector =>
        [...document.querySelectorAll(selector)];


    /* =====================================================
       STORAGE
       ===================================================== */

    function loadChats() {

        try {

            const saved =
                localStorage.getItem(
                    CONFIG.STORAGE_CHATS
                );

            chats = saved
                ? JSON.parse(saved)
                : [];

            if (!Array.isArray(chats)) {
                chats = [];
            }

        } catch (error) {

            console.error(
                "Nyxium: failed to load chats",
                error
            );

            chats = [];
        }


        activeChatId =
            localStorage.getItem(
                CONFIG.STORAGE_ACTIVE
            );


        if (
            activeChatId &&
            !chats.some(
                chat =>
                    chat.id === activeChatId
            )
        ) {
            activeChatId = null;
        }


        sassEnabled =
            localStorage.getItem(
                CONFIG.STORAGE_SASS
            ) === "true";
    }


    function saveChats() {

        try {

            localStorage.setItem(
                CONFIG.STORAGE_CHATS,
                JSON.stringify(chats)
            );


            if (activeChatId) {

                localStorage.setItem(
                    CONFIG.STORAGE_ACTIVE,
                    activeChatId
                );

            } else {

                localStorage.removeItem(
                    CONFIG.STORAGE_ACTIVE
                );
            }

        } catch (error) {

            console.error(
                "Nyxium: failed to save chats",
                error
            );
        }
    }


    /* =====================================================
       CHAT OBJECT
       ===================================================== */

    function createChat() {

        const now = Date.now();

        return {
            id:
                "chat_" +
                now +
                "_" +
                Math.random()
                    .toString(36)
                    .slice(2, 8),

            title:
                "New conversation",

            createdAt:
                now,

            updatedAt:
                now,

            messages:
                []
        };
    }


    function getActiveChat() {

        return chats.find(
            chat =>
                chat.id === activeChatId
        );
    }


    function ensureChat() {

        let chat =
            getActiveChat();

        if (!chat) {

            chat =
                createChat();

            chats.unshift(
                chat
            );

            activeChatId =
                chat.id;

            saveChats();
        }

        return chat;
    }


    /* =====================================================
       PUTER AUTHENTICATION
       ===================================================== */

    async function checkPuterLogin() {

        if (
            typeof window.puter ===
                "undefined" ||
            !puter.auth
        ) {
            return false;
        }


        try {

            if (
                typeof puter.auth.isSignedIn ===
                "function"
            ) {

                const signedIn =
                    await puter.auth.isSignedIn();


                if (signedIn) {

                    await loadPuterUser();

                    return true;
                }
            }

        } catch (error) {

            console.warn(
                "Nyxium: auth check failed",
                error
            );
        }


        puterUser = null;

        return false;
    }


    /* =====================================================
       LOAD PUTER USER
       ===================================================== */

    async function loadPuterUser() {

        if (
            typeof window.puter ===
                "undefined" ||
            !puter.auth
        ) {
            return null;
        }


        try {

            if (
                typeof puter.auth.getUser ===
                "function"
            ) {

                const user =
                    await puter.auth.getUser();

                if (user) {

                    puterUser =
                        user;

                    console.log(
                        "Nyxium: Puter user loaded",
                        user
                    );

                    updateAuthUI();

                    refreshUserAvatars();
                }
            }

        } catch (error) {

            console.warn(
                "Nyxium: couldn't load Puter user",
                error
            );
        }


        return puterUser;
    }


    async function requestPuterLogin() {

        if (
            typeof window.puter ===
                "undefined" ||
            !puter.auth
        ) {

            showToast(
                "Puter authentication is unavailable."
            );

            return false;
        }


        try {

            setAIStatus(
                "Authentication required…"
            );


            /*
             * Login is ONLY triggered after the
             * user explicitly requests it.
             */

            if (
                typeof puter.auth.signIn ===
                "function"
            ) {

                await puter.auth.signIn();

            } else if (
                typeof puter.auth.login ===
                "function"
            ) {

                await puter.auth.login();

            } else {

                throw new Error(
                    "Puter authentication method unavailable."
                );
            }


            const loggedIn =
                await checkPuterLogin();


            if (loggedIn) {

                updateAuthUI();

                refreshUserAvatars();

                showToast(
                    "Signed in successfully."
                );

                return true;
            }


            showToast(
                "Sign-in was not completed."
            );

            return false;

        } catch (error) {

            console.error(
                "Nyxium authentication error:",
                error
            );

            setAIStatus(
                "Ready when you are"
            );

            showToast(
                "Sign-in cancelled or failed."
            );

            return false;
        }
    }


    async function signOutPuter() {

        try {

            if (
                window.puter &&
                puter.auth &&
                typeof puter.auth.signOut ===
                "function"
            ) {

                await puter.auth.signOut();
            }


            puterUser = null;

            updateAuthUI();

            refreshUserAvatars();

            showToast(
                "Signed out."
            );

        } catch (error) {

            console.error(
                "Nyxium sign-out error:",
                error
            );

            showToast(
                "Unable to sign out."
            );
        }
    }


    /* =====================================================
       USER DISPLAY NAME
       ===================================================== */

    function getUserDisplayName() {

        if (!puterUser) {
            return "Signed in";
        }


        return (
            puterUser.username ||
            puterUser.name ||
            puterUser.full_name ||
            puterUser.email ||
            "Signed in"
        );
    }


    /* =====================================================
       USER AVATAR RESOLVER
       ===================================================== */

    function getPuterAvatar() {

        if (!puterUser) {
            return null;
        }


        /*
         * Different Puter versions / user objects may expose
         * profile images under different property names.
         */

        const possibleAvatars = [

            puterUser.avatar,

            puterUser.avatar_url,

            puterUser.avatarUrl,

            puterUser.profile_picture,

            puterUser.profilePicture,

            puterUser.profile_image,

            puterUser.profileImage,

            puterUser.picture,

            puterUser.photoURL,

            puterUser.photoUrl,

            puterUser.image,

            puterUser.image_url,

            puterUser.imageUrl
        ];


        for (
            const avatar of possibleAvatars
        ) {

            if (
                typeof avatar === "string" &&
                avatar.trim()
            ) {

                return avatar.trim();
            }
        }


        return null;
    }


    /* =====================================================
       USER FALLBACK AVATAR
       ===================================================== */

    function createUserFallbackAvatar(
        avatar
    ) {

        avatar.innerHTML = "";

        avatar.classList.add(
            "user-avatar-fallback"
        );


        const name =
            getUserDisplayName();


        const firstLetter =
            name
                .trim()
                .charAt(0)
                .toUpperCase() ||
            "U";


        const span =
            document.createElement(
                "span"
            );

        span.textContent =
            firstLetter;


        avatar.appendChild(
            span
        );
    }


    /* =====================================================
       USER AVATAR ELEMENT
       ===================================================== */

    function createUserAvatar(
        avatar
    ) {

        avatar.innerHTML = "";

        avatar.classList.remove(
            "user-avatar-fallback"
        );


        const avatarURL =
            getPuterAvatar();


        if (!avatarURL) {

            createUserFallbackAvatar(
                avatar
            );

            return;
        }


        const img =
            document.createElement(
                "img"
            );


        img.src =
            avatarURL;

        img.alt =
            getUserDisplayName();

        img.loading =
            "eager";

        img.referrerPolicy =
            "no-referrer";


        img.style.width =
            "100%";

        img.style.height =
            "100%";

        img.style.objectFit =
            "cover";

        img.style.borderRadius =
            "inherit";


        img.onerror =
            () => {

                createUserFallbackAvatar(
                    avatar
                );
            };


        avatar.appendChild(
            img
        );
    }


    /* =====================================================
       REFRESH ALL USER AVATARS
       ===================================================== */

    function refreshUserAvatars() {

        $$(".message-row.user .message-avatar")
            .forEach(
                avatar => {

                    createUserAvatar(
                        avatar
                    );
                }
            );


        /*
         * Also update any user profile/avatar elements
         * that your HTML may already contain.
         */

        $$(".user-avatar")
            .forEach(
                avatar => {

                    createUserAvatar(
                        avatar
                    );
                }
            );
    }


    /* =====================================================
       AUTH UI
       ===================================================== */

    function updateAuthUI() {

        let authButton =
            $("#nyxium-auth-button");


        if (!authButton) {

            const sidebar =
                document.querySelector(
                    "#sidebar .sidebar-top"
                );


            if (sidebar) {

                authButton =
                    document.createElement(
                        "button"
                    );

                authButton.id =
                    "nyxium-auth-button";

                authButton.className =
                    "new-chat-button nyxium-auth-button";

                authButton.type =
                    "button";


                authButton.addEventListener(
                    "click",
                    handleAuthButton
                );


                const newChat =
                    $("#new-chat-btn");


                if (newChat) {

                    newChat.after(
                        authButton
                    );

                } else {

                    sidebar.prepend(
                        authButton
                    );
                }
            }
        }


        if (!authButton) {
            return;
        }


        if (puterUser) {

            const username =
                getUserDisplayName();


            const avatarURL =
                getPuterAvatar();


            authButton.innerHTML = "";


            const avatar =
                document.createElement(
                    "span"
                );

            avatar.className =
                "auth-user-avatar";


            if (avatarURL) {

                const img =
                    document.createElement(
                        "img"
                    );

                img.src =
                    avatarURL;

                img.alt =
                    username;

                img.referrerPolicy =
                    "no-referrer";


                img.onerror =
                    () => {

                        avatar.textContent =
                            username
                                .charAt(0)
                                .toUpperCase();
                    };


                avatar.appendChild(
                    img
                );

            } else {

                avatar.textContent =
                    username
                        .charAt(0)
                        .toUpperCase();
            }


            const name =
                document.createElement(
                    "span"
                );

            name.textContent =
                username;


            authButton.appendChild(
                avatar
            );

            authButton.appendChild(
                name
            );


            authButton.title =
                "Click to sign out";

        } else {

            authButton.innerHTML = `
                <span>⇥</span>
                <span>Sign in</span>
            `;

            authButton.title =
                "Sign in to use Nyxium AI";
        }
    }


    async function handleAuthButton() {

        if (puterUser) {

            const confirmed =
                window.confirm(
                    "Sign out of Nyxium AI?"
                );


            if (confirmed) {

                await signOutPuter();
            }

        } else {

            await requestPuterLogin();
        }
    }


    /* =====================================================
       AUTH GATE
       ===================================================== */

    async function requireAuthentication() {

        const alreadyLoggedIn =
            await checkPuterLogin();


        if (alreadyLoggedIn) {

            updateAuthUI();

            return true;
        }


        const proceed =
            window.confirm(
                "Sign in to Nyxium AI to start chatting.\n\n" +
                "Puter will handle authentication. " +
                "You won't be asked again while your login session remains active."
            );


        if (!proceed) {

            setAIStatus(
                "Sign in required to use AI"
            );

            return false;
        }


        return await requestPuterLogin();
    }


    /* =====================================================
       INITIALIZATION
       ===================================================== */

    async function initialize() {

        if (initialized) {
            return;
        }


        initialized = true;


        loadChats();

        setupInput();

        setupAvatar();

        setupAIStatus();

        updateCharacterCount();

        renderChatHistory();

        updateSassUI();


        try {

            const loggedIn =
                await checkPuterLogin();


            if (loggedIn) {

                updateAuthUI();

                refreshUserAvatars();

                setAIStatus(
                    "Ready when you are"
                );

            } else {

                updateAuthUI();

                setAIStatus(
                    "Sign in to start chatting"
                );
            }

        } catch (error) {

            console.warn(
                "Nyxium startup auth check:",
                error
            );

            updateAuthUI();
        }


        if (!activeChatId) {

            renderMessages([]);

        } else {

            const chat =
                getActiveChat();


            renderMessages(
                chat?.messages || []
            );
        }


        updateRecentChatsUI();


        console.log(
            "✦ Nyxium AI initialized"
        );
    }


    /* =====================================================
       AI AVATAR
       ===================================================== */

    function setupAvatar() {

        const avatars =
            $$(".ai-face");


        avatars.forEach(
            avatar => {

                avatar.innerHTML = "";


                const img =
                    document.createElement(
                        "img"
                    );


                img.src =
                    CONFIG.AVATAR_URL;

                img.alt =
                    CONFIG.BOT_NAME;

                img.loading =
                    "eager";

                img.referrerPolicy =
                    "no-referrer";


                img.style.width =
                    "100%";

                img.style.height =
                    "100%";

                img.style.objectFit =
                    "cover";

                img.style.borderRadius =
                    "inherit";


                avatar.appendChild(
                    img
                );
            }
        );
    }


    /* =====================================================
       INPUT
       ===================================================== */

    function setupInput() {

        const input =
            $("#user-input");


        if (!input) {
            return;
        }


        input.addEventListener(
            "input",
            () => {

                autoResizeInput();

                updateCharacterCount();
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


                    if (!isGenerating) {

                        sendToAI();
                    }
                }
            }
        );
    }


    function autoResizeInput() {

        const input =
            $("#user-input");


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
            $("#user-input");

        const counter =
            $("#character-count");


        if (!input || !counter) {
            return;
        }


        counter.textContent =
            `${input.value.length} / ${CONFIG.MAX_INPUT}`;
    }


    /* =====================================================
       SEND MESSAGE
       ===================================================== */

    async function sendToAI() {

        if (isGenerating) {
            return;
        }


        const input =
            $("#user-input");


        if (!input) {
            return;
        }


        const text =
            input.value.trim();


        if (!text) {
            return;
        }


        /* Commands don't require login. */

        if (
            text.startsWith("/")
        ) {

            await handleCommand(
                text
            );


            input.value = "";

            autoResizeInput();

            updateCharacterCount();

            return;
        }


        /* AI requires authentication. */

        const authenticated =
            await requireAuthentication();


        if (!authenticated) {
            return;
        }


        /*
         * Discord bot invite request.
         */

        if (
            isInviteRequest(text)
        ) {

            const invite =
                generateBotInvite();


            addMessage(
                "assistant",
                `Here is the official **Nyxium AI Discord bot invite**:\n\n${invite}\n\nYou can use that link to add Nyxium AI to a server where you have permission to add bots.`
            );


            input.value = "";

            autoResizeInput();

            updateCharacterCount();

            return;
        }


        const chat =
            ensureChat();


        /*
         * Prevent accidental duplicate submissions.
         */

        const lastMessage =
            chat.messages[
                chat.messages.length - 1
            ];


        if (
            lastMessage &&
            lastMessage.role === "user" &&
            lastMessage.content === text
        ) {
            return;
        }


        input.value = "";

        autoResizeInput();

        updateCharacterCount();


        addMessage(
            "user",
            text
        );


        setGenerating(
            true
        );


        setAIStatus(
            "Nyxium is thinking…"
        );


        try {

            const response =
                await generateAIResponse(
                    text,
                    chat
                );


            addMessage(
                "assistant",
                response
            );


            setAIStatus(
                "Ready when you are"
            );

        } catch (error) {

            console.error(
                "Nyxium AI error:",
                error
            );


            addMessage(
                "assistant",
                formatAIError(
                    error
                )
            );


            setAIStatus(
                "Something went wrong"
            );

        } finally {

            setGenerating(
                false
            );

            updateRecentChatsUI();

            renderChatHistory();
        }
    }


    /* =====================================================
       PUTER AI
       ===================================================== */

    async function generateAIResponse(
        userText,
        chat
    ) {

        if (
            typeof window.puter ===
                "undefined" ||
            !puter.ai
        ) {

            throw new Error(
                "Puter AI is unavailable."
            );
        }


        const systemPrompt =
            buildSystemPrompt();


        const history =
            chat.messages
                .slice(-20)
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


        const messages = [
            {
                role:
                    "system",

                content:
                    systemPrompt
            },

            ...history
        ];


        try {

            const result =
                await puter.ai.chat(
                    messages,
                    {
                        model:
                            CONFIG.PUTER_MODEL,

                        stream:
                            false
                    }
                );


            return extractPuterText(
                result
            );

        } catch (firstError) {

            console.warn(
                "Nyxium: primary Puter call failed. Retrying compatible format.",
                firstError
            );


            const prompt =
                systemPrompt +
                "\n\nConversation:\n" +
                history
                    .map(
                        message =>
                            `${message.role}: ${message.content}`
                    )
                    .join("\n\n") +
                "\n\nassistant:";


            const fallback =
                await puter.ai.chat(
                    prompt,
                    {
                        model:
                            CONFIG.PUTER_MODEL,

                        stream:
                            false
                    }
                );


            return extractPuterText(
                fallback
            );
        }
    }


    function buildSystemPrompt() {

        let prompt = `
You are Nyxium AI.

Your name is Nyxium AI, never "Nyx".

You are a helpful, intelligent, natural AI assistant.

Your personality:
- Friendly
- Clear
- Confident
- Modern
- Helpful
- Slightly futuristic
- Natural rather than robotic

Answer naturally and directly.

Do not unnecessarily repeat the user's question.

Use Markdown when it improves readability.

For programming:
- Explain solutions clearly.
- Use proper fenced code blocks.
- Preserve indentation.
- Mention important bugs or compatibility issues.

For school questions:
- Explain concepts at an appropriate student level.
- Use examples when useful.
- Don't make answers unnecessarily complicated.

For summaries:
- Extract important information.
- Use concise headings and bullet points when useful.

For translations:
- Preserve the original meaning.
- Do not add unnecessary commentary unless requested.

For creative requests:
- Be imaginative while following the user's requested style.

If the user asks about Nyxium AI itself, describe it as an AI assistant called Nyxium AI.

If asked for the Nyxium Discord bot invite, provide the invite link generated by the application.

Never claim to have performed an action that you did not actually perform.
        `;


        if (sassEnabled) {

            prompt += `

Nyxium personality mode is enabled.

You may occasionally use light humor,
playful wording, or witty comments,
but remain genuinely helpful.

Do not overdo it.
            `;
        }


        return prompt.trim();
    }


    /* =====================================================
       PUTER RESPONSE EXTRACTION
       ===================================================== */

    function extractPuterText(
        result
    ) {

        if (!result) {

            throw new Error(
                "Empty AI response."
            );
        }


        if (
            typeof result ===
            "string"
        ) {

            return result.trim();
        }


        if (
            result.message &&
            typeof result.message.content ===
            "string"
        ) {

            return result.message.content.trim();
        }


        if (
            result.message &&
            Array.isArray(
                result.message.content
            )
        ) {

            return result.message.content
                .map(
                    part =>
                        typeof part === "string"
                            ? part
                            : part?.text || ""
                )
                .join("")
                .trim();
        }


        if (
            typeof result.content ===
            "string"
        ) {

            return result.content.trim();
        }


        if (
            typeof result.text ===
            "string"
        ) {

            return result.text.trim();
        }


        if (
            result.choices &&
            result.choices[0]
        ) {

            const choice =
                result.choices[0];


            if (
                choice.message &&
                typeof choice.message.content ===
                "string"
            ) {

                return choice.message.content.trim();
            }


            if (
                typeof choice.text ===
                "string"
            ) {

                return choice.text.trim();
            }
        }


        throw new Error(
            "Could not read the AI response."
        );
    }


    /* =====================================================
       MESSAGE MANAGEMENT
       ===================================================== */

    function addMessage(
        role,
        content
    ) {

        const chat =
            ensureChat();


        chat.messages.push({

            id:
                "msg_" +
                Date.now() +
                "_" +
                Math.random()
                    .toString(36)
                    .slice(2, 7),

            role,

            content,

            timestamp:
                Date.now()
        });


        if (
            role === "user" &&
            chat.title ===
                "New conversation"
        ) {

            chat.title =
                generateChatTitle(
                    content
                );
        }


        chat.updatedAt =
            Date.now();


        if (
            chat.messages.length >
            CONFIG.MAX_MESSAGES_PER_CHAT
        ) {

            chat.messages =
                chat.messages.slice(
                    -CONFIG.MAX_MESSAGES_PER_CHAT
                );
        }


        saveChats();


        renderMessages(
            chat.messages
        );


        updateRecentChatsUI();
    }


    function generateChatTitle(
        text
    ) {

        const clean =
            text
                .replace(
                    /\s+/g,
                    " "
                )
                .trim();


        if (!clean) {
            return "New conversation";
        }


        return clean.length > 42
            ? clean.slice(0, 42) + "…"
            : clean;
    }


    /* =====================================================
       MESSAGE RENDERING
       ===================================================== */

    function renderMessages(
        messages
    ) {

        const container =
            $("#chat-messages");


        if (!container) {
            return;
        }


        if (
            !messages ||
            messages.length === 0
        ) {

            renderWelcomeScreen();

            return;
        }


        container.innerHTML = "";


        messages.forEach(
            message => {

                container.appendChild(
                    createMessageElement(
                        message
                    )
                );
            }
        );


        highlightCode();

        scrollChatToBottom();
    }


    function createMessageElement(
        message
    ) {

        const row =
            document.createElement(
                "div"
            );


        row.className =
            `message-row ${message.role}`;


        const avatar =
            document.createElement(
                "div"
            );


        avatar.className =
            "message-avatar";


        /*
         * ASSISTANT AVATAR
         */

        if (
            message.role ===
            "assistant"
        ) {

            const img =
                document.createElement(
                    "img"
                );


            img.src =
                CONFIG.AVATAR_URL;

            img.alt =
                CONFIG.BOT_NAME;

            img.referrerPolicy =
                "no-referrer";

            img.loading =
                "eager";


            img.style.width =
                "100%";

            img.style.height =
                "100%";

            img.style.objectFit =
                "cover";

            img.style.borderRadius =
                "inherit";


            avatar.appendChild(
                img
            );


        /*
         * USER AVATAR
         */

        } else {

            createUserAvatar(
                avatar
            );
        }


        const body =
            document.createElement(
                "div"
            );


        body.className =
            "message-body";


        const content =
            document.createElement(
                "div"
            );


        content.className =
            "message-content";


        content.innerHTML =
            renderMarkdown(
                message.content
            );


        body.appendChild(
            content
        );


        const actions =
            document.createElement(
                "div"
            );


        actions.className =
            "message-actions";


        if (
            message.role ===
            "assistant"
        ) {

            actions.innerHTML = `
                <button
                    class="message-action"
                    type="button"
                    data-action="copy"
                >
                    Copy
                </button>

                <button
                    class="message-action"
                    type="button"
                    data-action="regenerate"
                >
                    Regenerate
                </button>
            `;


            actions
                .querySelector(
                    '[data-action="copy"]'
                )
                ?.addEventListener(
                    "click",
                    () =>
                        copyText(
                            message.content
                        )
                );


            actions
                .querySelector(
                    '[data-action="regenerate"]'
                )
                ?.addEventListener(
                    "click",
                    () =>
                        regenerateLastResponse()
                );
        }


        body.appendChild(
            actions
        );


        row.appendChild(
            avatar
        );


        row.appendChild(
            body
        );


        return row;
    }


    /* =====================================================
       WELCOME SCREEN
       ===================================================== */

    function renderWelcomeScreen() {

        const container =
            $("#chat-messages");


        if (!container) {
            return;
        }


        const welcome =
            document.createElement(
                "div"
            );


        welcome.id =
            "welcome-screen";


        welcome.className =
            "welcome-screen";


        welcome.innerHTML = `
            <div class="welcome-orb">
                <div class="welcome-orb-inner">
                    ✦
                </div>
            </div>

            <h2>
                What can I help you with?
            </h2>

            <p>
                Ask Nyxium AI anything — coding,
                schoolwork, analysis, writing,
                ideas and more.
            </p>

            <div class="starter-grid">

                <button
                    class="starter-card"
                    type="button"
                    data-prompt="Explain quantum computing in simple words."
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
                    type="button"
                    data-prompt="Help me build a clean and modern website."
                >
                    <span class="starter-icon">
                        &lt;/&gt;
                    </span>

                    <span>
                        <strong>Build something</strong>
                        <small>
                            Code, websites and projects
                        </small>
                    </span>
                </button>

                <button
                    class="starter-card"
                    type="button"
                    data-prompt="Summarize the following text: "
                >
                    <span class="starter-icon">
                        ▤
                    </span>

                    <span>
                        <strong>Summarize</strong>
                        <small>
                            Turn long text into useful notes
                        </small>
                    </span>
                </button>

                <button
                    class="starter-card"
                    type="button"
                    data-prompt="Give me creative ideas for: "
                >
                    <span class="starter-icon">
                        ✧
                    </span>

                    <span>
                        <strong>Brainstorm</strong>
                        <small>
                            Ideas, stories and projects
                        </small>
                    </span>
                </button>

            </div>
        `;


        container.innerHTML = "";


        container.appendChild(
            welcome
        );


        $$(".starter-card")
            .forEach(
                button => {

                    button.addEventListener(
                        "click",
                        () => {

                            useQuickPrompt(
                                button.dataset.prompt
                            );
                        }
                    );
                }
            );
    }


    /* =====================================================
       MARKDOWN
       ===================================================== */

    function renderMarkdown(
        text
    ) {

        if (
            typeof marked ===
            "undefined"
        ) {

            return escapeHTML(
                text
            ).replace(
                /\n/g,
                "<br>"
            );
        }


        try {

            marked.setOptions({

                breaks:
                    true,

                gfm:
                    true
            });


            return marked.parse(
                text
            );

        } catch (error) {

            console.warn(
                "Markdown rendering failed:",
                error
            );


            return escapeHTML(
                text
            ).replace(
                /\n/g,
                "<br>"
            );
        }
    }


    /* =====================================================
       CODE HIGHLIGHTING
       ===================================================== */

    function highlightCode() {

        if (
            typeof hljs ===
            "undefined"
        ) {
            return;
        }


        $$("#chat-messages pre code")
            .forEach(
                block => {

                    try {

                        hljs.highlightElement(
                            block
                        );

                        addCodeWrapper(
                            block
                        );

                    } catch (_) {}
                }
            );
    }


    function addCodeWrapper(
        codeBlock
    ) {

        const pre =
            codeBlock.parentElement;


        if (!pre) {
            return;
        }


        if (
            pre.parentElement?.classList
                .contains(
                    "code-wrapper"
                )
        ) {
            return;
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
            document.createElement(
                "span"
            );


        language.className =
            "code-language";


        language.textContent =
            detectCodeLanguage(
                codeBlock
            );


        const copy =
            document.createElement(
                "button"
            );


        copy.className =
            "copy-code-button";


        copy.type =
            "button";


        copy.textContent =
            "Copy";


        copy.addEventListener(
            "click",
            async () => {

                await copyText(
                    codeBlock.innerText
                );


                copy.textContent =
                    "Copied!";


                setTimeout(
                    () => {

                        copy.textContent =
                            "Copy";

                    },
                    1200
                );
            }
        );


        header.appendChild(
            language
        );


        header.appendChild(
            copy
        );


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
    }


    function detectCodeLanguage(
        code
    ) {

        const classes =
            code.className
                .split(/\s+/);


        const languageClass =
            classes.find(
                c =>
                    c.startsWith(
                        "language-"
                    )
            );


        return languageClass
            ? languageClass.replace(
                "language-",
                ""
            )
            : "code";
    }


    /* =====================================================
       QUICK PROMPTS
       ===================================================== */

    window.useQuickPrompt =
        function useQuickPrompt(
            prompt
        ) {

            const input =
                $("#user-input");


            if (!input) {
                return;
            }


            input.value =
                prompt || "";


            input.focus();


            autoResizeInput();

            updateCharacterCount();
        };


    /* =====================================================
       COMMANDS
       ===================================================== */

    async function handleCommand(
        command
    ) {

        const lower =
            command
                .trim()
                .toLowerCase();


        if (
            lower === "/clear"
        ) {

            clearConversation();

            return;
        }


        if (
            lower === "/toggle-sass"
        ) {

            toggleSass();

            return;
        }


        if (
            lower === "/help"
        ) {

            showHelp();

            return;
        }


        if (
            lower.startsWith(
                "/summarize "
            )
        ) {

            useQuickPrompt(
                "Summarize this clearly:\n\n" +
                command.slice(11)
            );

            return;
        }


        if (
            lower.startsWith(
                "/translate "
            )
        ) {

            useQuickPrompt(
                "Translate this naturally:\n\n" +
                command.slice(11)
            );

            return;
        }


        if (
            lower.startsWith(
                "/code "
            )
        ) {

            useQuickPrompt(
                "Help me with this code:\n\n" +
                command.slice(6)
            );

            return;
        }


        showToast(
            "Unknown command. Try /help"
        );
    }


    function showHelp() {

        addMessage(
            "assistant",
            `
## Nyxium AI Commands

**/clear** — Clear the current conversation.

**/toggle-sass** — Toggle Nyxium's playful personality.

**/help** — Show available commands.

**/code [text]** — Start a coding request.

**/summarize [text]** — Summarize content.

**/translate [text]** — Translate content.

You can also simply ask Nyxium AI normally.
            `.trim()
        );
    }


    /* =====================================================
       SASS
       ===================================================== */

    window.toggleSass =
        function toggleSass() {

            sassEnabled =
                !sassEnabled;


            localStorage.setItem(
                CONFIG.STORAGE_SASS,
                String(sassEnabled)
            );


            updateSassUI();


            showToast(
                sassEnabled
                    ? "Nyxium personality: ON"
                    : "Nyxium personality: OFF"
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
       NEW CHAT
       ===================================================== */

    window.startNewChat =
        function startNewChat() {

            const chat =
                createChat();


            chats.unshift(
                chat
            );


            chats =
                chats.slice(
                    0,
                    CONFIG.MAX_CHATS
                );


            activeChatId =
                chat.id;


            saveChats();


            renderMessages([]);

            updateRecentChatsUI();

            renderChatHistory();


            setAIStatus(
                "Ready when you are"
            );


            const input =
                $("#user-input");


            if (input) {

                input.value = "";

                autoResizeInput();

                updateCharacterCount();

                input.focus();
            }


            closeMobileSidebar();


            showToast(
                "New conversation started."
            );
        };


    /* =====================================================
       CLEAR CONVERSATION
       ===================================================== */

    window.clearConversation =
        function clearConversation() {

            const chat =
                getActiveChat();


            if (!chat) {

                renderMessages([]);

                return;
            }


            const confirmed =
                window.confirm(
                    "Clear this conversation?"
                );


            if (!confirmed) {
                return;
            }


            chat.messages =
                [];


            chat.title =
                "New conversation";


            chat.updatedAt =
                Date.now();


            saveChats();


            renderMessages([]);

            updateRecentChatsUI();


            setAIStatus(
                "Ready when you are"
            );


            showToast(
                "Conversation cleared."
            );
        };


    /* =====================================================
       REGENERATE
       ===================================================== */

    async function regenerateLastResponse() {

        if (isGenerating) {
            return;
        }


        const authenticated =
            await requireAuthentication();


        if (!authenticated) {
            return;
        }


        const chat =
            getActiveChat();


        if (!chat) {
            return;
        }


        const lastAssistantIndex =
            [...chat.messages]
                .map(
                    (message, index) => ({
                        message,
                        index
                    })
                )
                .reverse()
                .find(
                    item =>
                        item.message.role ===
                        "assistant"
                )?.index;


        if (
            lastAssistantIndex ===
            undefined
        ) {
            return;
        }


        const previousUser =
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


        if (!previousUser) {
            return;
        }


        chat.messages.splice(
            lastAssistantIndex,
            1
        );


        saveChats();


        renderMessages(
            chat.messages
        );


        setGenerating(
            true
        );


        setAIStatus(
            "Nyxium is regenerating…"
        );


        try {

            const response =
                await generateAIResponse(
                    previousUser.content,
                    chat
                );


            addMessage(
                "assistant",
                response
            );


            setAIStatus(
                "Ready when you are"
            );

        } catch (error) {

            console.error(
                error
            );


            addMessage(
                "assistant",
                formatAIError(
                    error
                )
            );

        } finally {

            setGenerating(
                false
            );
        }
    }


    /* =====================================================
       RECENT CHAT HISTORY
       ===================================================== */

    function renderChatHistory() {

        let history =
            $("#recent-chats");


        if (!history) {

            const sidebarTop =
                document.querySelector(
                    "#sidebar .sidebar-top"
                );


            if (!sidebarTop) {
                return;
            }


            history =
                document.createElement(
                    "div"
                );


            history.id =
                "recent-chats";


            history.className =
                "recent-chats";


            const nav =
                document.querySelector(
                    ".sidebar-nav"
                );


            if (nav) {

                nav.after(
                    history
                );

            } else {

                sidebarTop.appendChild(
                    history
                );
            }
        }


        history.innerHTML = `
            <div class="sidebar-label">
                RECENT CHATS
            </div>
        `;


        if (chats.length === 0) {

            const empty =
                document.createElement(
                    "div"
                );


            empty.className =
                "recent-empty";


            empty.textContent =
                "No conversations yet.";


            history.appendChild(
                empty
            );


            return;
        }


        const sorted =
            [...chats]
                .sort(
                    (a, b) =>
                        b.updatedAt -
                        a.updatedAt
                )
                .slice(
                    0,
                    8
                );


        sorted.forEach(
            chat => {

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
                        activeChatId
                            ? " active"
                            : ""
                    );


                button.innerHTML = `
                    <span class="recent-chat-icon">
                        ◇
                    </span>

                    <span class="recent-chat-title">
                        ${escapeHTML(chat.title)}
                    </span>
                `;


                button.addEventListener(
                    "click",
                    () =>
                        openChat(
                            chat.id
                        )
                );


                history.appendChild(
                    button
                );
            }
        );
    }


    function updateRecentChatsUI() {

        renderChatHistory();
    }


    function openChat(
        chatId
    ) {

        const chat =
            chats.find(
                item =>
                    item.id === chatId
            );


        if (!chat) {
            return;
        }


        activeChatId =
            chatId;


        saveChats();


        renderMessages(
            chat.messages
        );


        renderChatHistory();


        setAIStatus(
            "Ready when you are"
        );


        closeMobileSidebar();
    }


    /* =====================================================
       VIEW SYSTEM
       ===================================================== */

    window.showView =
        function showView(
            viewName
        ) {

            $$(".view")
                .forEach(
                    view => {

                        view.classList.toggle(
                            "active",
                            view.id ===
                            viewName
                        );
                    }
                );


            $$(".nav-item")
                .forEach(
                    item => {

                        item.classList.toggle(
                            "active",
                            item.dataset.view ===
                            viewName
                        );
                    }
                );


            closeMobileSidebar();
        };


    /* =====================================================
       SIDEBAR
       ===================================================== */

    window.toggleSidebar =
        function toggleSidebar() {

            const sidebar =
                $("#sidebar");

            const overlay =
                $("#sidebar-overlay");


            if (!sidebar) {
                return;
            }


            sidebar.classList.toggle(
                "mobile-open"
            );


            if (overlay) {

                overlay.classList.toggle(
                    "active"
                );
            }
        };


    function closeMobileSidebar() {

        const sidebar =
            $("#sidebar");


        const overlay =
            $("#sidebar-overlay");


        sidebar?.classList.remove(
            "mobile-open"
        );


        overlay?.classList.remove(
            "active"
        );
    }


    /* =====================================================
       AI STATUS
       ===================================================== */

    function setupAIStatus() {

        setAIStatus(
            "Ready when you are"
        );
    }


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
       GENERATION STATE
       ===================================================== */

    function setGenerating(
        value
    ) {

        isGenerating =
            value;


        const sendButton =
            $("#send-button");


        const input =
            $("#user-input");


        if (sendButton) {

            sendButton.disabled =
                value;


            sendButton.innerHTML =
                value
                    ? "<span>•••</span>"
                    : "<span>↑</span>";
        }


        /*
         * The textarea stays usable.
         * Sending is prevented while generation is active.
         */

        if (input) {

            input.placeholder =
                value
                    ? "Nyxium is thinking…"
                    : "Message Nyxium AI...";
        }
    }


    /* =====================================================
       SCROLL
       ===================================================== */

    function scrollChatToBottom() {

        const area =
            $("#chat-scroll-area");


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

    function generateBotInvite() {

        return (
            "https://discord.com/oauth2/authorize" +
            "?client_id=" +
            encodeURIComponent(
                CONFIG.DISCORD_BOT_ID
            ) +
            "&scope=bot%20applications.commands" +
            "&permissions=8"
        );
    }


    function isInviteRequest(
        text
    ) {

        const value =
            text
                .toLowerCase()
                .replace(
                    /[?!.,]/g,
                    ""
                );


        const keywords = [

            "invite nyxium",

            "invite nyxium ai",

            "nyxium invite",

            "nyxium bot invite",

            "invite link",

            "bot invite",

            "discord bot link",

            "add nyxium",

            "add nyxium ai",

            "add the bot",

            "invite the bot"
        ];


        return keywords.some(
            keyword =>
                value.includes(
                    keyword
                )
        );
    }


    /* =====================================================
       UTILITIES
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


            return true;

        } catch (error) {

            console.warn(
                "Clipboard failed:",
                error
            );


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
                "Copied."
            );


            return true;
        }
    }


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


    function formatAIError(
        error
    ) {

        const message =
            error?.message ||
            String(error);


        if (
            /auth|login|sign.?in/i.test(
                message
            )
        ) {

            return (
                "🔐 **Nyxium needs you to sign in first.**\n\n" +
                "Use the **Sign in** button in the sidebar and then try your message again."
            );
        }


        if (
            /quota|limit|credit/i.test(
                message
            )
        ) {

            return (
                "⚠️ Nyxium couldn't generate a response because the AI service reported a usage limit."
            );
        }


        return (
            "⚠️ **Nyxium couldn't generate a response.**\n\n" +
            "Please try again in a moment."
        );
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
                        "translateY(8px)";


                    setTimeout(
                        () =>
                            toast.remove(),
                        200
                    );

                },
                2500
            );
        };


    /* =====================================================
       GLOBAL FUNCTIONS
       ===================================================== */

    window.sendToAI =
        sendToAI;

    window.checkPuterLogin =
        checkPuterLogin;

    window.requestPuterLogin =
        requestPuterLogin;

    window.signOutPuter =
        signOutPuter;

    window.loadPuterUser =
        loadPuterUser;


    /* =====================================================
       START
       ===================================================== */

    if (
        document.readyState ===
        "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            initialize,
            {
                once: true
            }
        );

    } else {

        initialize();
    }

})();
