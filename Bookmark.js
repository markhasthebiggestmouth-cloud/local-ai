(async () => {

    const old = document.getElementById("grandpa-qwen");

    if (old) {
        old.remove();
        return;
    }

    // =========================
    // WINDOW
    // =========================

    const box = document.createElement("div");

    box.id = "grandpa-qwen";

    box.style.cssText = `
        position:fixed;
        z-index:2147483647;

        width:300px;
        height:300px;

        top:20px;
        right:20px;

        background:#ffffff;
        color:#111111;

        border:1px solid #e5e5e5;
        border-radius:16px;

        box-shadow:
            0 12px 35px rgba(0,0,0,.14),
            0 2px 8px rgba(0,0,0,.08);

        overflow:hidden;

        font-family:
            -apple-system,
            BlinkMacSystemFont,
            "Segoe UI",
            Arial,
            sans-serif;

        display:flex;
        flex-direction:column;
    `;

    // =========================
    // HEADER
    // =========================

    const header = document.createElement("div");

    header.style.cssText = `
        height:42px;
        min-height:42px;

        display:flex;
        align-items:center;
        justify-content:space-between;

        padding:0 12px;

        border-bottom:1px solid #eeeeee;

        background:#ffffff;

        cursor:move;
        user-select:none;
    `;

    const title = document.createElement("div");

    title.textContent = "Qwen";

    title.style.cssText = `
        font-size:14px;
        font-weight:600;
    `;

    const close = document.createElement("button");

    close.textContent = "×";

    close.style.cssText = `
        width:28px;
        height:28px;

        border:0;
        border-radius:8px;

        background:transparent;

        color:#777;

        font-size:20px;

        cursor:pointer;
    `;

    close.onclick = () => {
        box.remove();
    };

    header.appendChild(title);
    header.appendChild(close);

    // =========================
    // CHAT
    // =========================

    const chat = document.createElement("div");

    chat.style.cssText = `
        flex:1;

        padding:10px;

        overflow-y:auto;

        background:#ffffff;

        display:flex;
        flex-direction:column;

        gap:8px;
    `;

    // =========================
    // STATUS
    // =========================

    const status = document.createElement("div");

    status.style.cssText = `
        align-self:flex-start;

        max-width:85%;

        padding:8px 10px;

        background:#f1f1f1;

        border-radius:12px;

        font-size:12px;

        line-height:1.4;

        white-space:pre-wrap;
    `;

    status.textContent = "Loading Qwen...";

    chat.appendChild(status);

    // =========================
    // INPUT AREA
    // =========================

    const inputArea = document.createElement("div");

    inputArea.style.cssText = `
        padding:8px;

        border-top:1px solid #eeeeee;

        display:flex;

        gap:6px;

        background:#ffffff;
    `;

    const input = document.createElement("input");

    input.placeholder = "Message Qwen...";

    input.style.cssText = `
        flex:1;

        min-width:0;

        height:32px;

        box-sizing:border-box;

        padding:0 10px;

        border:1px solid #dddddd;

        border-radius:10px;

        background:#ffffff;

        color:#111111;

        outline:none;

        font-size:12px;
    `;

    const send = document.createElement("button");

    send.textContent = "↑";

    send.style.cssText = `
        width:32px;
        height:32px;

        border:0;
        border-radius:10px;

        background:#111111;

        color:#ffffff;

        font-size:16px;

        cursor:pointer;
    `;

    inputArea.appendChild(input);
    inputArea.appendChild(send);

    box.appendChild(header);
    box.appendChild(chat);
    box.appendChild(inputArea);

    document.body.appendChild(box);

    // =========================
    // DRAGGING
    // =========================

    let dragging = false;
    let offsetX = 0;
    let offsetY = 0;

    header.addEventListener("pointerdown", event => {

        if (event.target === close) {
            return;
        }

        dragging = true;

        const rect = box.getBoundingClientRect();

        offsetX =
            event.clientX - rect.left;

        offsetY =
            event.clientY - rect.top;

        header.setPointerCapture(
            event.pointerId
        );
    });

    header.addEventListener("pointermove", event => {

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

    // =========================
    // QWEN
    // =========================

    let generator = null;

    // THIS IS THE IMPORTANT PART:
    // Same conversation format as your
    // working index.html.

    const messages = [];

    let busy = false;

    try {

        status.textContent =
            "Loading Transformers.js...";

        const { pipeline } =
            await import(
                "https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.8.1"
            );

        status.textContent =
            "Loading Qwen3...";

        generator =
            await pipeline(
                "text-generation",
                "onnx-community/Qwen3-0.6B-ONNX",
                {
                    device:"webgpu",
                    dtype:"q4f16"
                }
            );

        status.textContent =
            "Qwen is ready!";

    } catch (error) {

        status.textContent =
            "Qwen failed to load:\n" +
            error.message;

        console.error(error);

        return;
    }

    // =========================
    // MESSAGE FUNCTION
    // =========================

    function addMessage(text, user) {

        const message =
            document.createElement("div");

        message.style.cssText = `
            align-self:
                ${user ? "flex-end" : "flex-start"};

            max-width:85%;

            padding:8px 10px;

            border-radius:12px;

            background:
                ${user ? "#111111" : "#f1f1f1"};

            color:
                ${user ? "#ffffff" : "#222222"};

            font-size:12px;

            line-height:1.4;

            white-space:pre-wrap;

            word-break:break-word;
        `;

        message.textContent = text;

        chat.appendChild(message);

        chat.scrollTop =
            chat.scrollHeight;

        return message;
    }

    // =========================
    // ASK QWEN
    // =========================

    async function askQwen() {

        if (!generator || busy) {
            return;
        }

        const text =
            input.value.trim();

        if (!text) {
            return;
        }

        input.value = "";

        busy = true;

        input.disabled = true;
        send.disabled = true;

        addMessage(
            text,
            true
        );

        // EXACT SAME MESSAGE FORMAT
        // USED BY YOUR WORKING INDEX

        messages.push({
            role:"user",
            content:text
        });

        const answer =
            addMessage(
                "",
                false
            );

        try {

            // IMPORTANT:
            // Send the FULL conversation,
            // NOT just the string.

            const output =
                await generator(
                    messages,
                    {
                        max_new_tokens:256,

                        do_sample:false,

                        return_full_text:false
                    }
                );

            let result = "";

            if (
                output &&
                output[0]
            ) {

                const generated =
                    output[0].generated_text;

                // Normal string response

                if (
                    typeof generated ===
                    "string"
                ) {

                    result =
                        generated;
                }

                // Chat-style response

                else if (
                    Array.isArray(
                        generated
                    )
                ) {

                    const last =
                        generated[
                            generated.length - 1
                        ];

                    if (
                        last &&
                        typeof last.content ===
                        "string"
                    ) {

                        result =
                            last.content;
                    }
                }
            }

            if (!result) {

                result =
                    "Qwen returned an empty response.";
            }

            answer.textContent =
                result;

            // Keep conversation history

            messages.push({
                role:"assistant",
                content:result
            });

        } catch (error) {

            answer.textContent =
                "Error:\n" +
                (
                    error.message ||
                    String(error)
                );

            console.error(error);
        }

        busy = false;

        input.disabled = false;
        send.disabled = false;

        input.focus();

        chat.scrollTop =
            chat.scrollHeight;
    }

    // =========================
    // BUTTON
    // =========================

    send.addEventListener(
        "click",
        askQwen
    );

    // =========================
    // ENTER
    // =========================

    input.addEventListener(
        "keydown",
        event => {

            if (
                event.key ===
                "Enter"
            ) {

                event.preventDefault();

                askQwen();
            }
        }
    );

})();
