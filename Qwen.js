(async () => {
    const box = document.getElementById("qwen-box");

    if (!box) {
        console.error("Qwen box not found.");
        return;
    }

    const status = document.getElementById("qwen-status");

    try {
        status.textContent = "Loading Qwen model...";

        // Load Transformers.js
        const { pipeline } = await import(
            "https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.8.1"
        );

        status.textContent = "Downloading Qwen...";

        // Load Qwen 3 0.6B
        const generator = await pipeline(
            "text-generation",
            "onnx-community/Qwen3-0.6B-ONNX",
            {
                device: "webgpu",
                dtype: "q4f16"
            }
        );

        status.textContent = "Qwen is Ready!";

        // Chat area
        const chat = document.createElement("div");
        chat.style.cssText = `
            margin-top:10px;
            display:flex;
            flex-direction:column;
            gap:6px;
        `;

        const input = document.createElement("input");
        input.placeholder = "Ask Qwen...";
        input.style.cssText = `
            width:100%;
            box-sizing:border-box;
            padding:8px;
            border-radius:6px;
            border:1px solid #555;
            background:#181818;
            color:white;
            outline:none;
        `;

        const button = document.createElement("button");
        button.textContent = "Send";
        button.style.cssText = `
            margin-top:6px;
            width:100%;
            padding:8px;
            border:0;
            border-radius:6px;
            background:#444;
            color:white;
            cursor:pointer;
        `;

        const output = document.createElement("div");
        output.style.cssText = `
            margin-top:8px;
            padding:8px;
            height:130px;
            overflow:auto;
            background:#111;
            border-radius:6px;
            color:white;
            font-size:13px;
            white-space:pre-wrap;
        `;

        box.appendChild(chat);
        chat.appendChild(input);
        chat.appendChild(button);
        chat.appendChild(output);

        async function askQwen() {
            const question = input.value.trim();

            if (!question) return;

            button.disabled = true;
            button.textContent = "Thinking...";
            output.textContent = "";

            try {
                const result = await generator(question, {
                    max_new_tokens: 256,
                    do_sample: false,
                    return_full_text: false
                });

                output.textContent =
                    result?.[0]?.generated_text || "Qwen returned no answer.";
            } catch (err) {
                output.textContent = "Error: " + err.message;
                console.error(err);
            }

            button.disabled = false;
            button.textContent = "Send";
        }

        button.addEventListener("click", askQwen);

        input.addEventListener("keydown", (event) => {
            if (event.key === "Enter") {
                askQwen();
            }
        });

    } catch (err) {
        status.textContent = "Qwen failed to load.";
        console.error(err);

        const error = document.createElement("div");
        error.style.cssText = `
            color:#ff5555;
            margin-top:8px;
            font-size:12px;
            word-break:break-word;
        `;
        error.textContent = err.message;

        box.appendChild(error);
    }
})();
