(async () => {
  const ID = "__LOCAL_QWEN_BOOKMARK__";

  // Toggle off if already open
  const old = document.getElementById(ID);
  if (old) {
    old.remove();
    return;
  }

  // Floating window
  const box = document.createElement("div");

  box.id = ID;

  box.style.cssText = `
    position: fixed !important;
    z-index: 2147483647 !important;

    width: 300px !important;
    height: 300px !important;

    left: 50% !important;
    top: 50% !important;

    transform: translate(-50%, -50%) !important;

    background: #090909 !important;

    border: 1px solid #444 !important;
    border-radius: 12px !important;

    overflow: hidden !important;

    box-shadow: 0 20px 60px rgba(0,0,0,.8) !important;
  `;

  document.body.appendChild(box);

  // Loading message
  const loading = document.createElement("div");

  loading.style.cssText = `
    width: 100%;
    height: 100%;

    display: flex;
    align-items: center;
    justify-content: center;

    background: #090909;
    color: white;

    font-family: Arial, sans-serif;
    font-size: 13px;
  `;

  loading.textContent = "Starting Qwen...";

  box.appendChild(loading);

  try {
    /*
      Load the actual Qwen page.
      The page itself remains the working WebGPU page.
    */

    const iframe = document.createElement("iframe");

    iframe.src =
      "https://markhasthebiggestmouth-cloud.github.io/local-ai/";

    iframe.allow =
      "webgpu; autoplay";

    iframe.style.cssText = `
      width: 100%;
      height: 100%;
      border: 0;
      display: none;
      background: #090909;
    `;

    box.appendChild(iframe);

    iframe.onload = () => {
      loading.remove();
      iframe.style.display = "block";
    };

  } catch (error) {

    loading.textContent =
      "Qwen failed to start.";

    console.error(error);
  }
})();
