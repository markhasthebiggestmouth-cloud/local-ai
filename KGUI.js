(() => {
    if (document.getElementById("k-gui-window")) return;

    const style = document.createElement("style");
    style.textContent = `
        #k-gui-window {
            position: fixed;
            top: 80px;
            left: 80px;
            width: 800px;
            height: 500px;
            z-index: 2147483647;
            background: #111;
            color: white;
            border: 1px solid #333;
            border-radius: 12px;
            overflow: hidden;
            font-family: Arial, sans-serif;
            box-shadow: 0 20px 60px rgba(0,0,0,.6);
        }

        #k-gui-bar {
            height: 44px;
            background: #181818;
            display: flex;
            align-items: center;
            padding: 0 14px;
            cursor: move;
            user-select: none;
        }

        #k-gui-title {
            font-weight: bold;
            flex: 1;
        }

        #k-gui-close,
        #k-gui-min {
            border: 0;
            background: transparent;
            color: white;
            font-size: 20px;
            cursor: pointer;
            width: 35px;
        }

        #k-gui-body {
            display: flex;
            height: calc(100% - 44px);
        }

        #k-gui-side {
            width: 150px;
            background: #151515;
            padding: 10px;
        }

        .k-btn {
            width: 100%;
            padding: 11px;
            margin-bottom: 7px;
            border: 0;
            border-radius: 7px;
            background: #222;
            color: white;
            text-align: left;
            cursor: pointer;
        }

        .k-btn:hover {
            background: #333;
        }

        #k-gui-content {
            flex: 1;
            padding: 20px;
            overflow: auto;
        }

        #k-qwen-output {
            width: 100%;
            height: 310px;
            box-sizing: border-box;
            resize: none;
            background: #0b0b0b;
            color: white;
            border: 1px solid #333;
            border-radius: 8px;
            padding: 12px;
        }

        #k-qwen-input {
            width: calc(100% - 90px);
            box-sizing: border-box;
            margin-top: 10px;
            padding: 11px;
            background: #181818;
            color: white;
            border: 1px solid #333;
            border-radius: 7px;
        }

        #k-qwen-send {
            width: 80px;
            padding: 11px;
            margin-left: 5px;
            border: 0;
            border-radius: 7px;
            background: #333;
            color: white;
            cursor: pointer;
        }
    `;
    document.head.appendChild(style);

    const gui = document.createElement("div");
    gui.id = "k-gui-window";

    gui.innerHTML = `
        <div id="k-gui-bar">
            <div id="k-gui-title">K-GUI</div>
            <button id="k-gui-min">−</button>
            <button id="k-gui-close">×</button>
        </div>

        <div id="k-gui-body">
            <div id="k-gui-side">
                <button class="k-btn" id="k-home">Home</button>
                <button class="k-btn" id="k-qwen">Qwen AI</button>
            </div>

            <div id="k-gui-content">
                <h2>Welcome</h2>
                <p>K-GUI loaded successfully from GitHub.</p>
            </div>
        </div>
    `;

    document.body.appendChild(gui);

    const content = gui.querySelector("#k-gui-content");

    gui.querySelector("#k-home").onclick = () => {
        content.innerHTML = `
            <h2>Home</h2>
            <p>K-GUI is running.</p>
        `;
    };

    gui.querySelector("#k-qwen").onclick = () => {
        content.innerHTML = `
            <h2>Qwen AI</h2>
            <textarea id="k-qwen-output" readonly>Qwen is loading...</textarea>
            <div>
                <input id="k-qwen-input" placeholder="Ask Qwen something...">
                <button id="k-qwen-send">Send</button>
            </div>
        `;

        loadQwen();
    };

    gui.querySelector("#k-gui-close").onclick = () => {
        gui.remove();
        style.remove();
    };

    let minimized = false;

    gui.querySelector("#k-gui-min").onclick = () => {
        minimized = !minimized;

        gui.querySelector("#k-gui-body").style.display =
            minimized ? "none" : "flex";

        gui.style.height = minimized ? "44px" : "500px";
    };

    // Dragging
    const bar = gui.querySelector("#k-gui-bar");

    let dragging = false;
    let offsetX = 0;
    let offsetY = 0;

    bar.addEventListener("pointerdown", e => {
        dragging = true;
        offsetX = e.clientX - gui.offsetLeft;
        offsetY = e.clientY - gui.offsetTop;
        bar.setPointerCapture(e.pointerId);
    });

    bar.addEventListener("pointermove", e => {
        if (!dragging) return;

        gui.style.left = `${e.clientX - offsetX}px`;
        gui.style.top = `${e.clientY - offsetY}px`;
    });

    bar.addEventListener("pointerup", () => {
        dragging = false;
    });

    async function loadQwen() {
        const output = document.getElementById("k-qwen-output");

        try {
            output.value = "Loading Qwen...\nThis may take a while the first time.";

            const { pipeline, env } =
                await import(
                    "https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.8.1/+esm"
                );

            env.allowLocalModels = false;
            env.useBrowserCache = true;

            const model = "onnx-community/Qwen3-0.6B-ONNX";

            const generator = await pipeline(
                "text-generation",
                model,
                {
                    device: "webgpu",
                    dtype: "q4f16"
                }
            );

            output.value = "Qwen is ready.";

            document.getElementById("k-qwen-send").onclick =
                async () => {

                    const input =
                        document.getElementById("k-qwen-input");

                    const prompt = input.value.trim();

                    if (!prompt) return;

                    input.value = "";

                    output.value +=
                        `\n\nYou: ${prompt}\nQwen: `;

                    try {
                        const result = await generator(prompt, {
                            max_new_tokens: 150
                        });

                        const text =
                            result?.[0]?.generated_text || "";

                        output.value += text;
                    } catch (err) {
                        output.value +=
                            "\nGeneration error: " + err.message;
                    }
                };

        } catch (err) {
            output.value =
                "Qwen failed to load.\n\n" +
                err.message;
        }
    }
})();
