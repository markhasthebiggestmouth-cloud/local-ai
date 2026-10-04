(async () => {
    // ==============================
    // REMOVE OLD WINDOW
    // ==============================

    const existing = document.getElementById("grandpa-qwen");

    if (existing) {
        existing.remove();
        return;
    }

    // ==============================
    // MAIN WINDOW
    // ==============================

    const box = document.createElement("div");

    box.id = "grandpa-qwen";

    box.style.cssText = `
        position: fixed;
        z-index: 2147483647;

        width: 300px;
        height: 300px;

        top: 20px;
        right: 20px;

        background: #ffffff;
        color: #111111;

        border: 1px solid #e5e5e5;
        border-radius: 16px;

        box-shadow:
            0 12px 35px rgba(0,0,0,0.14),
            0 2px 8px rgba(0,0,0,0.08);

        overflow: hidden;

        font-family:
            -apple-system,
            BlinkMacSystemFont,
            "Segoe UI",
            Arial,
            sans-serif;

        display: flex;
        flex-direction: column;
    `;

    // ==============================
    // HEADER
    // ==============================

    const header = document.createElement("div");

    header.style.cssText = `
        height: 42px;
        min-height: 42px;

        display: flex;
        align-items: center;
        justify-content: space-between;

        padding: 0 12px;

        border-bottom: 1px solid #eeeeee;

        background: #ffffff;

        cursor: move;
        user-select: none;
    `;

    const title = document.createElement("div");

    title.textContent = "Qwen";

    title.style.cssText = `
        font-size: 14px;
        font-weight: 600;
        color: #111111;
    `;

    const closeButton = document.createElement("button");

    closeButton.textContent = "×";

    closeButton.style.cssText = `
        width: 28px;
        height: 28px;

        border: none;
        border-radius: 8px;

        background: transparent;
        color: #777777;

        font-size: 20px;
        line-height: 20px;

        cursor: pointer;
    `;

    closeButton.onmouseenter = () => {
        closeButton.style.background = "#f2f2f2";
    };

    closeButton.onmouseleave = () => {
        closeButton.style.background = "transparent";
    };

    closeButton.onclick = () => {
        box.remove();
    };

    header.appendChild(title);
    header.appendChild(closeButton);

    // ==============================
    // CHAT AREA
    // ==============================

    const chat = document.createElement("div");

    chat.style.cssText = `
        flex: 1;

        padding: 10px;

        overflow-y: auto;
        overflow-x: hidden;

        background: #ffffff;

        display: flex;
        flex-direction: column;

        gap: 8px;

        scrollbar-width: thin;
    `;

    // ==============================
    // WELCOME MESSAGE
    // ==============================

    const welcome = document.createElement("div");

    welcome.style.cssText = `
        align-self: flex-start;

        max-width: 85%;

        padding: 8px 10px;

        background: #f1f1f1;

        border-radius: 12px;

        font-size: 12px;
        line-height: 1.4;

        color: #222222;

        white-space: pre-wrap;
        word-break: break-word;
    `;

    welcome.textContent = "Loading Qwen...";

    chat.appendChild(welcome);

    // ==============================
    // INPUT AREA
    // ==============================

    const inputArea = document.createElement("div");

    inputArea.style.cssText = `
        padding: 8px;

        border-top: 1px solid #eeeeee;

        background: #ffffff;

        display: flex;

        gap: 6px;

        align-items: center;
    `;

    const input = document.createElement("input");

    input.type = "text";

    input.placeholder = "Message Qwen...";

    input.style.cssText = `
        flex: 1;

        min-width: 0;

        height: 32px;

        box-sizing: border-box;

        padding: 0 10px;

        border: 1px solid #dddddd;

        border-radius: 10px;

        background: #ffffff;

        color: #111111;

        outline: none;

        font-size: 12px;
    `;

    input.onfocus = () => {
        input.style.borderColor = "#999999";
    };

    input.onblur = () => {
        input.style.borderColor = "#dddddd";
    };

    const send = document.createElement("button");

    send.textContent = "↑";

    send.style.cssText = `
        width: 32px;
        height: 32px;

        flex-shrink: 0;

        border: none;

        border-radius: 10px;

        background: #111111;

        color: #ffffff;

        font-size: 16px;

        font-weight: bold;

        cursor: pointer;
    `;

    inputArea.appendChild(input);
    inputArea.appendChild(send);

    // ==============================
    // BUILD WINDOW
    // ==============================

    box.appendChild(header);
    box.appendChild(chat);
    box.appendChild(inputArea);

    document.body.appendChild(box);

    // ==============================
    // DRAGGING
    // ==============================

    let dragging = false;

    let offsetX = 0;
    let offsetY = 0;

    header.addEventListener("pointerdown", (event) => {

        if (event.target === closeButton) {
            return;
        }

        dragging = true;

        const rect = box.getBoundingClientRect();

        offsetX = event.clientX - rect.left;
        offsetY = event.clientY - rect.top;

        header.setPointerCapture(event.pointerId);
    });

    header.addEventListener("pointermove", (event) => {

        if (!dragging) {
            return;
        }

        box.style.left =
            `${event.clientX - offsetX}px`;

        box.style.top =
            `${event.clientY - offsetY}px`;

        box.style.right = "auto";
    });

    header.addEventListener("pointerup", () => {
        dragging = false;
    });

    // ==============================
    // LOAD TRANSFORMERS.JS
    // ==============================

    let generator;

    try {

        welcome.textContent =
            "Loading Transformers.js...";

        const transformers =
            await import(
                "https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.8.1"
            );

        const pipeline =
            transformers.pipeline;

        welcome.textContent =
            "Loading Qwen 3...";

        // ==============================
        // LOAD QWEN
        // ==============================

        generator = await pipeline(
            "text-generation",
            "onnx-community/Qwen3-0.6B-ONNX",
            {
                device: "webgpu",
                dtype: "q4f16"
            }
        );

        welcome.textContent =
            "Qwen is ready!";

    } catch (error) {

        welcome.textContent =
            "Qwen failed to load:\n" +
            error.message;

        console.error(
            "Qwen loading error:",
            error
        );

        return;
    }

    // ==============================
    // ADD MESSAGE
    // ==============================

    function addMessage(text, isUser) {

        const message =
            document.createElement("div");

        message.style.cssText = `
            align-self:
                ${isUser ? "flex-end" : "flex-start"};

            max-width: 85%;

            padding: 8px 10px;

            border-radius: 12px;

            font-size: 12px;

            line-height: 1.4;

            white-space: pre-wrap;

            word-break: break-word;

            background:
                ${isUser ? "#111111" : "#f1f1f1"};

            color:
                ${isUser ? "#ffffff" : "#222222"};
        `;

        message.textContent = text;

        chat.appendChild(message);

        chat.scrollTop =
            chat.scrollHeight;

        return message;
    }

    // ==============================
    // ASK QWEN
    // ==============================

    async function askQwen() {

        const question =
            input.value.trim();

        if (!question) {
            return;
        }

        input.value = "";

        // User message
        addMessage(
            question,
            true
        );

        // Thinking message
        const answer =
            addMessage(
                "Thinking...",
                false
            );

        send.disabled = true;

        send.style.opacity = "0.5";

        input.disabled = true;

        try {

            const result =
                await generator(
                    question,
                    {
                        max_new_tokens: 256,

                        do_sample: false,

                        return_full_text: false
                    }
                );

            // ==============================
            // SAFELY EXTRACT TEXT
            // ==============================

            let text = "";

            if (
                Array.isArray(result) &&
                result.length > 0
            ) {

                const first =
                    result[0];

                if (
                    first &&
                    typeof first.generated_text ===
                    "string"
                ) {

                    text =
                        first.generated_text;

                } else if (
                    first &&
                    typeof first.text ===
                    "string"
                ) {

                    text =
                        first.text;

                } else if (
                    typeof first ===
                    "string"
                ) {

                    text =
                        first;
                }
            }

            // Prevent empty responses
            if (!text) {

                text =
                    "Qwen didn't return any text.";
            }

            answer.textContent =
                text;

        } catch (error) {

            answer.textContent =
                "Generation error:\n" +
                error.message;

            console.error(
                "Qwen generation error:",
                error
            );
        }

        send.disabled = false;

        send.style.opacity = "1";

        input.disabled = false;

        input.focus();

        chat.scrollTop =
            chat.scrollHeight;
    }

    // ==============================
    // SEND BUTTON
    // ==============================

    send.addEventListener(
        "click",
        askQwen
    );

    // ==============================
    // ENTER TO SEND
    // ==============================

    input.addEventListener(
        "keydown",
        (event) => {

            if (event.key === "Enter") {

                event.preventDefault();

                askQwen();
            }
        }
    );

})();
