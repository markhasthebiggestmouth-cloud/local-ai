(() => {
  const OLD = document.getElementById("qwen-floating-chat");

  if (OLD) {
    OLD.remove();
  }

  if (window.__QWEN_SHORTCUT__) {
    document.removeEventListener(
      "keydown",
      window.__QWEN_SHORTCUT__
    );
    window.__QWEN_SHORTCUT__ = null;
  }

  const MODEL = "onnx-community/Qwen3-0.6B-ONNX";

  let generator = null;
  let busy = false;
  let messages = [];

  // =========================
  // CREATE GUI
  // =========================

  const box = document.createElement("div");

  box.id = "qwen-floating-chat";

  box.style.cssText = `
    position:fixed;
    width:300px;
    height:300px;
    right:20px;
    bottom:20px;
    background:#fff;
    color:#111;
    z-index:2147483647;
    border:1px solid #ddd;
    border-radius:14px;
    box-shadow:0 8px 30px rgba(0,0,0,.18);
    font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;
    display:flex;
    flex-direction:column;
    overflow:hidden;
  `;

  box.innerHTML = `
    <div id="qwen-header"
      style="
        height:40px;
        min-height:40px;
        border-bottom:1px solid #eee;
        display:flex;
        align-items:center;
        justify-content:space-between;
        padding:0 10px;
        box-sizing:border-box;
        cursor:grab;
        user-select:none;
      "
    >
      <div style="font-size:14px;font-weight:600;">
        Qwen
      </div>

      <button id="qwen-close"
        style="
          border:0;
          background:transparent;
          font-size:20px;
          color:#777;
          cursor:pointer;
          width:28px;
          height:28px;
        "
      >×</button>
    </div>

    <div id="qwen-status"
      style="
        font-size:11px;
        color:#777;
        padding:6px 10px;
        border-bottom:1px solid #eee;
      "
    >
      Loading Qwen3...
    </div>

    <div id="qwen-chat"
      style="
        flex:1;
        overflow-y:auto;
        padding:10px;
        box-sizing:border-box;
        background:#fff;
      "
    ></div>

    <div
      style="
        border-top:1px solid #eee;
        padding:8px;
        display:flex;
        gap:6px;
        box-sizing:border-box;
      "
    >
      <input
        id="qwen-input"
        type="text"
        placeholder="Message Qwen..."
        disabled
        style="
          flex:1;
          min-width:0;
          height:32px;
          border:1px solid #ddd;
          border-radius:9px;
          padding:0 10px;
          outline:none;
          font-size:13px;
          color:#111;
          background:#fff;
          box-sizing:border-box;
        "
      />

      <button
        id="qwen-send"
        disabled
        style="
          width:34px;
          height:32px;
          border:0;
          border-radius:9px;
          background:#111;
          color:#fff;
          cursor:pointer;
          font-size:16px;
        "
      >↑</button>
    </div>
  `;

  document.body.appendChild(box);

  const header = document.getElementById("qwen-header");
  const close = document.getElementById("qwen-close");
  const status = document.getElementById("qwen-status");
  const chat = document.getElementById("qwen-chat");
  const input = document.getElementById("qwen-input");
  const send = document.getElementById("qwen-send");

  // =========================
  // MESSAGES
  // =========================

  function addMessage(name, text) {

    const wrapper = document.createElement("div");

    wrapper.style.cssText = `
      margin-bottom:10px;
      line-height:1.4;
      font-size:13px;
      word-wrap:break-word;
    `;

    const nameEl = document.createElement("div");

    nameEl.textContent = name;

    nameEl.style.cssText = `
      font-size:11px;
      font-weight:600;
      color:${name === "You" ? "#777" : "#111"};
      margin-bottom:2px;
    `;

    const textEl = document.createElement("div");

    textEl.textContent = text;

    textEl.style.cssText = `
      color:#222;
      white-space:pre-wrap;
    `;

    wrapper.appendChild(nameEl);
    wrapper.appendChild(textEl);

    chat.appendChild(wrapper);
    chat.scrollTop = chat.scrollHeight;

    return textEl;
  }

  addMessage("Qwen", "Loading...");

  // =========================
  // LOAD QWEN
  // =========================

  async function loadAI() {

    try {

      if (!navigator.gpu) {
        throw new Error(
          "WebGPU is not available in this browser."
        );
      }

      status.textContent = "Loading Qwen3...";

      const { pipeline } = await import(
        "https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.8.1"
      );

      generator = await pipeline(
        "text-generation",
        MODEL,
        {
          device:"webgpu",
          dtype:"q4f16"
        }
      );

      status.textContent = "Qwen3 Ready ✓";

      input.disabled = false;
      send.disabled = false;

      chat.innerHTML = "";

      addMessage(
        "Qwen",
        "I'm ready. Ask me anything."
      );

      input.focus();

    } catch (error) {

      console.error(error);

      status.textContent = "Qwen failed to load";

      chat.innerHTML = "";

      addMessage(
        "Qwen",
        "Error loading Qwen: " +
        (error.message || String(error))
      );
    }
  }

  // =========================
  // ASK QWEN
  // =========================

  async function askQwen() {

    if (!generator || busy) {
      return;
    }

    const question = input.value.trim();

    if (!question) {
      return;
    }

    input.value = "";

    busy = true;

    input.disabled = true;
    send.disabled = true;

    addMessage("You", question);

    messages.push({
      role:"user",
      content:question
    });

    const answer = addMessage("Qwen", "");

    try {

      const output = await generator(
        messages,
        {
          max_new_tokens:256,
          do_sample:false,
          return_full_text:false
        }
      );

      let result = "";

      if (output && output[0]) {

        const generated =
          output[0].generated_text;

        if (typeof generated === "string") {

          result = generated;

        } else if (Array.isArray(generated)) {

          const last =
            generated[generated.length - 1];

          if (
            last &&
            typeof last.content === "string"
          ) {
            result = last.content;
          }
        }
      }

      if (!result) {
        result = "Qwen returned an empty response.";
      }

      answer.textContent = result;

      messages.push({
        role:"assistant",
        content:result
      });

    } catch (error) {

      console.error(error);

      answer.textContent =
        "Error: " +
        (error.message || String(error));
    }

    busy = false;

    input.disabled = false;
    send.disabled = false;

    input.focus();
  }

  // =========================
  // SEND
  // =========================

  send.addEventListener(
    "click",
    askQwen
  );

  input.addEventListener(
    "keydown",
    (event) => {

      if (event.key === "Enter") {

        event.preventDefault();

        askQwen();
      }

    }
  );

  // =========================
  // CLOSE
  // =========================

  close.addEventListener(
    "click",
    () => {

      box.remove();

      if (window.__QWEN_SHORTCUT__) {

        document.removeEventListener(
          "keydown",
          window.__QWEN_SHORTCUT__
        );

        window.__QWEN_SHORTCUT__ = null;
      }
    }
  );

  // =========================
  // DRAGGING
  // =========================

  let dragging = false;
  let offsetX = 0;
  let offsetY = 0;

  header.addEventListener(
    "mousedown",
    (event) => {

      dragging = true;

      const rect =
        box.getBoundingClientRect();

      offsetX =
        event.clientX - rect.left;

      offsetY =
        event.clientY - rect.top;

      header.style.cursor = "grabbing";
    }
  );

  document.addEventListener(
    "mousemove",
    (event) => {

      if (!dragging) {
        return;
      }

      box.style.left =
        (event.clientX - offsetX) + "px";

      box.style.top =
        (event.clientY - offsetY) + "px";

      box.style.right = "auto";
      box.style.bottom = "auto";
    }
  );

  document.addEventListener(
    "mouseup",
    () => {

      dragging = false;

      header.style.cursor = "grab";
    }
  );

  // =========================
  // CMD + SHIFT + Q
  // =========================

  const shortcutHandler = (event) => {

    if (
      event.metaKey &&
      event.shiftKey &&
      event.key.toLowerCase() === "q"
    ) {

      event.preventDefault();

      if (box.style.visibility === "hidden") {

        box.style.visibility = "visible";

      } else {

        box.style.visibility = "hidden";

      }
    }
  };

  window.__QWEN_SHORTCUT__ = shortcutHandler;

  document.addEventListener(
    "keydown",
    shortcutHandler
  );

  // =========================
  // START QWEN
  // =========================

  loadAI();

})();
