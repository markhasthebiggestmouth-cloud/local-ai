
(() => {
  // Prevent duplicate Qwen windows.
  if (window.__qwenFloating && !window.__qwenFloating.closed) {
    window.__qwenFloating.focus?.();
    return;
  }

  const existing = document.getElementById("qwen-ai-window");
  if (existing) existing.remove();

  let generator = null;
  let loadingPromise = null;
  let busy = false;
  let pipWindow = null;
  let dragged = false;

  const conversation = [
    {
      role: "system",
      content: "You are Qwen, a helpful AI assistant. Be friendly, accurate, and concise."
    }
  ];

  const originalParent = document.body;
  const originalNextSibling = null;

  const style = document.createElement("style");
  style.textContent = `
    #qwen-ai-window, #qwen-ai-window * {
      box-sizing: border-box;
    }

    #qwen-ai-window {
      position: fixed;
      right: 20px;
      bottom: 20px;
      width: 320px;
      height: 380px;
      z-index: 2147483647;
      background: #fff;
      color: #202123;
      border: 1px solid #e5e5e5;
      border-radius: 16px;
      box-shadow: 0 12px 40px rgba(0,0,0,.18);
      overflow: hidden;
      display: flex;
      flex-direction: column;
      font: 14px/1.45 Arial, sans-serif;
      animation: qwen-appear .22s ease-out;
    }

    @keyframes qwen-appear {
      from { opacity: 0; transform: translateY(12px) scale(.97); }
      to { opacity: 1; transform: translateY(0) scale(1); }
    }

    #qwen-ai-window button {
      font: inherit;
      cursor: pointer;
    }

    #qwen-header {
      height: 48px;
      min-height: 48px;
      padding: 0 10px 0 14px;
      border-bottom: 1px solid #eee;
      display: flex;
      align-items: center;
      justify-content: space-between;
      cursor: grab;
      user-select: none;
      background: #fff;
    }

    #qwen-header:active { cursor: grabbing; }

    #qwen-title {
      font-size: 14px;
      font-weight: 700;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    #qwen-dot {
      width: 9px;
      height: 9px;
      border-radius: 50%;
      background: #aaa;
      transition: background .2s;
    }

    #qwen-dot.ready {
      background: #22c55e;
      box-shadow: 0 0 8px #22c55e66;
    }

    .qwen-head-button {
      width: 30px;
      height: 30px;
      border: 0;
      border-radius: 8px;
      background: transparent;
      color: #333;
      font-size: 18px;
    }

    .qwen-head-button:hover { background: #f1f1f1; }

    #qwen-messages {
      flex: 1;
      min-height: 0;
      overflow-y: auto;
      padding: 12px;
      display: flex;
      flex-direction: column;
      gap: 10px;
      scroll-behavior: smooth;
    }

    .qwen-message {
      max-width: 92%;
      padding: 9px 11px;
      border-radius: 12px;
      overflow-wrap: anywhere;
      white-space: pre-wrap;
      animation: qwen-message-in .16s ease-out;
    }

    @keyframes qwen-message-in {
      from { opacity: 0; transform: translateY(4px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .qwen-message.user {
      align-self: flex-end;
      background: #f0f0f0;
      border-bottom-right-radius: 4px;
    }

    .qwen-message.assistant {
      align-self: flex-start;
      background: #fff;
      border: 1px solid #eee;
      border-bottom-left-radius: 4px;
    }

    .qwen-message.error {
      color: #b42318;
      background: #fff1f0;
      border: 1px solid #ffd5d2;
    }

    #qwen-status {
      padding: 5px 12px;
      color: #777;
      font-size: 11px;
      border-top: 1px solid #f3f3f3;
      min-height: 25px;
    }

    #qwen-form {
      padding: 8px;
      display: flex;
      align-items: flex-end;
      gap: 7px;
      border-top: 1px solid #eee;
      background: #fff;
    }

    #qwen-input {
      flex: 1;
      min-width: 0;
      height: 42px;
      max-height: 100px;
      resize: none;
      border: 1px solid #ddd;
      border-radius: 12px;
      padding: 11px;
      outline: none;
      font: 13px/1.4 Arial, sans-serif;
      color: #202123;
      background: #fff;
    }

    #qwen-input:focus { border-color: #999; }

    #qwen-send {
      width: 42px;
      height: 42px;
      flex-shrink: 0;
      border: 0;
      border-radius: 12px;
      background: #202123;
      color: white;
      font-size: 19px;
      transition: opacity .2s, transform .15s;
    }

    #qwen-send:hover { transform: scale(1.04); }
    #qwen-send:disabled { opacity: .45; cursor: wait; }

    #qwen-clear {
      font-size: 11px;
      color: #777;
      background: transparent;
      border: 0;
      padding: 4px;
    }

    #qwen-clear:hover { color: #111; }
  `;

  document.head.appendChild(style);

  const box = document.createElement("section");
  box.id = "qwen-ai-window";
  box.innerHTML = `
    <header id="qwen-header">
      <div id="qwen-title">
        <span id="qwen-dot"></span>
        <span>Qwen AI</span>
      </div>
      <div style="display:flex;align-items:center;gap:2px">
        <button id="qwen-clear" title="Clear conversation">Clear</button>
        <button class="qwen-head-button" id="qwen-pip"
          title="Pop out floating chat">⧉</button>
        <button class="qwen-head-button" id="qwen-close"
          title="Close chat">×</button>
      </div>
    </header>
    <div id="qwen-messages" aria-live="polite"></div>
    <div id="qwen-status">Preparing Qwen…</div>
    <form id="qwen-form">
      <textarea id="qwen-input" rows="1"
        placeholder="Message Qwen…" aria-label="Message Qwen"></textarea>
      <button id="qwen-send" type="submit" title="Send">↑</button>
    </form>
  `;

  document.body.appendChild(box);

  const header = box.querySelector("#qwen-header");
  const messages = box.querySelector("#qwen-messages");
  const status = box.querySelector("#qwen-status");
  const input = box.querySelector("#qwen-input");
  const send = box.querySelector("#qwen-send");
  const dot = box.querySelector("#qwen-dot");
  const pipButton = box.querySelector("#qwen-pip");
  const closeButton = box.querySelector("#qwen-close");
  const clearButton = box.querySelector("#qwen-clear");

  window.__qwenFloating = {
    get closed() {
      return !box.isConnected;
    },
    focus() {
      input.focus();
    }
  };

  function setStatus(text, ready = false) {
    status.textContent = text;
    dot.classList.toggle("ready", ready);
  }

  function addMessage(text, role = "assistant", error = false) {
    const el = box.ownerDocument.createElement("div");
    el.className = "qwen-message " + role +
      (error ? " error" : "");
    el.textContent = text;
    messages.appendChild(el);
    messages.scrollTop = messages.scrollHeight;
    return el;
  }

  addMessage(
    "Hey! I'm Qwen. Send a message to start chatting.",
    "assistant"
  );

  async function loadModel() {
    if (generator) return generator;
    if (loadingPromise) return loadingPromise;

    loadingPromise = (async () => {
      setStatus("Downloading Qwen model… this may take a while.");

      try {
        const { pipeline } = await import(
          "https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.8.1"
        );

        generator = await pipeline(
          "text-generation",
          "onnx-community/Qwen3-0.6B-ONNX",
          {
            device: "webgpu",
            dtype: "q4f16"
          }
        );

        setStatus("Qwen ready ✓", true);
        return generator;
      } catch (error) {
        generator = null;
        loadingPromise = null;
        setStatus("Model failed to load.");
        addMessage(
          "Couldn't load Qwen: " + error.message +
          "\n\nCheck WebGPU support and your internet connection, then reload the page.",
          "assistant",
          true
        );
        throw error;
      }
    })();

    return loadingPromise;
  }

  async function sendMessage(text) {
    text = text.trim();
    if (!text || busy) return;

    busy = true;
    send.disabled = true;
    input.disabled = true;

    addMessage(text, "user");
    conversation.push({ role: "user", content: text });

    const thinking = addMessage("Thinking…", "assistant");
    setStatus("Qwen is thinking…");

    try {
      const model = await loadModel();

      // Replace the temporary message while generating.
      thinking.textContent = "Generating response…";

      const output = await model(conversation, {
        max_new_tokens: 256,
        do_sample: false,
        return_full_text: false
      });

      let answer = "";

      if (Array.isArray(output)) {
        const result = output[0]?.generated_text;

        if (typeof result === "string") {
          answer = result;
        } else if (Array.isArray(result)) {
          answer = result[result.length - 1]?.content || "";
        }
      } else {
        answer = output?.generated_text || "";
      }

      answer = String(answer).trim();

      if (!answer) answer = "I couldn't generate a response. Try again.";

      thinking.textContent = answer;
      conversation.push({ role: "assistant", content: answer });
      messages.scrollTop = messages.scrollHeight;
      setStatus("Qwen ready ✓", true);
    } catch (error) {
      thinking.remove();

      // Remove the unanswered turn from conversation history.
      if (conversation[conversation.length - 1]?.role === "user") {
        conversation.pop();
      }

      if (!status.textContent.startsWith("Model failed")) {
        setStatus("Something went wrong.");
        addMessage(
          "Error: " + error.message,
          "assistant",
          true
        );
      }
    } finally {
      busy = false;
      send.disabled = false;
      input.disabled = false;
      input.focus();
    }
  }

  box.querySelector("#qwen-form").addEventListener("submit", event => {
    event.preventDefault();
    const text = input.value;
    input.value = "";
    input.style.height = "42px";
    sendMessage(text);
  });

  input.addEventListener("keydown", event => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      box.querySelector("#qwen-form").requestSubmit();
    }
  });

  input.addEventListener("input", () => {
    input.style.height = "42px";
    input.style.height = Math.min(input.scrollHeight, 100) + "px";
  });

  clearButton.addEventListener("click", () => {
    if (busy) return;

    for (const node of Array.from(messages.children)) {
      node.remove();
    }

    conversation.length = 0;
    conversation.push({
      role: "system",
      content: "You are Qwen, a helpful AI assistant. Be friendly, accurate, and concise."
    });

    addMessage("Conversation cleared. What would you like to ask?");
    setStatus(generator ? "Qwen ready ✓" : "Model loads when you send a message.", !!generator);
  });

  closeButton.addEventListener("click", () => {
    if (pipWindow && !pipWindow.closed) {
      pipWindow.close();
    }
    box.remove();
    style.remove();
  });

  // Drag the chat around the original webpage.
  let dragX = 0;
  let dragY = 0;
  let startX = 0;
  let startY = 0;

  header.addEventListener("pointerdown", event => {
    if (event.target.closest("button")) return;
    if (box.ownerDocument !== document) return;

    dragged = false;
    const rect = box.getBoundingClientRect();
    dragX = event.clientX - rect.left;
    dragY = event.clientY - rect.top;
    startX = event.clientX;
    startY = event.clientY;

    box.style.left = rect.left + "px";
    box.style.top = rect.top + "px";
    box.style.right = "auto";
    box.style.bottom = "auto";

    try {
      header.setPointerCapture(event.pointerId);
    } catch (_) {}
  });

  header.addEventListener("pointermove", event => {
    if (box.ownerDocument !== document) return;
    if (!header.hasPointerCapture?.(event.pointerId)) return;

    if (
      Math.abs(event.clientX - startX) > 3 ||
      Math.abs(event.clientY - startY) > 3
    ) {
      dragged = true;
    }

    if (!dragged) return;

    const maxX = Math.max(0, window.innerWidth - box.offsetWidth);
    const maxY = Math.max(0, window.innerHeight - box.offsetHeight);

    box.style.left = Math.max(0, Math.min(maxX, event.clientX - dragX)) + "px";
    box.style.top = Math.max(0, Math.min(maxY, event.clientY - dragY)) + "px";
  });

  header.addEventListener("pointerup", event => {
    try {
      header.releasePointerCapture(event.pointerId);
    } catch (_) {}
  });

  header.addEventListener("pointercancel", () => {
    dragged = false;
  });

  // Native Document Picture-in-Picture.
  pipButton.addEventListener("click", async () => {
    if (!("documentPictureInPicture" in window)) {
      setStatus("Use a recent desktop Chrome or Edge for floating mode.");
      return;
    }

    if (pipWindow && !pipWindow.closed) {
      pipWindow.focus();
      return;
    }

    try {
      const pip = await window.documentPictureInPicture.requestWindow({
        width: 340,
        height: 420
      });

      pipWindow = pip;

      // Move the existing UI so its event handlers and model state survive.
      pip.document.body.style.cssText =
        "margin:0;width:100%;height:100%;overflow:hidden;background:#fff;";

      pip.document.documentElement.style.cssText =
        "width:100%;height:100%;overflow:hidden;";

      pip.document.body.appendChild(box);

      Object.assign(box.style, {
        position: "absolute",
        inset: "0",
        width: "100%",
        height: "100%",
        borderRadius: "0",
        margin: "0",
        animation: "none"
      });

      setStatus(generator ? "Qwen ready ✓" : "Ready when you are.", !!generator);

      pip.addEventListener("pagehide", () => {
        pipWindow = null;

        // Return the chat to its original page if it still exists.
        if (document.documentElement.isConnected && box.isConnected) {
          Object.assign(box.style, {
            position: "fixed",
            inset: "auto",
            right: "20px",
            bottom: "20px",
            left: "",
            top: "",
            width: "320px",
            height: "380px",
            borderRadius: "16px",
            margin: "",
            animation: ""
          });

          originalParent.appendChild(box);
        } else {
          box.remove();
          style.remove();
        }
      }, { once: true });
    } catch (error) {
      setStatus("Couldn't open floating mode: " + error.message);
    }
  });

  setStatus("Ready. Model loads when you send a message.");
})();
