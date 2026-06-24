# StackSense ◈

StackSense is a terminal-style developer utility designed to explain programming stack traces in plain English and provide immediate, actionable fix suggestions. 

It runs **100% client-side in the browser**, requiring zero API keys, zero servers, and keeping your code traces fully private and secure.

---

## Key Features

- **On-Device LLM**: Runs the `SmolLM2-135M-Instruct` model inside the browser using ONNX Runtime and Transformers.js.
- **Hardware-Style Indicators**: Includes a virtual hardware-style LED status indicator (idle, loading, ready, running, error).
- **GPU Acceleration**: Built-in support for WebGPU acceleration. The app automatically detects support and offloads generation to your GPU for near-instant (under 1 second) responses. Falls back to single-threaded WebAssembly (WASM) for maximum compatibility.
- **Token Streaming**: Uses a real-time token streamer to output explanations as they generate, reducing perceived wait time.
- **Dark Terminal Theme**: Customized dark terminal design styling using a `#1e1e1e` base background and glowing `#00ff00` accents.
- **Privacy-First**: No data leaves your machine. The stack traces are parsed entirely in your browser's execution thread.

---

## Technical Architecture

- **Frontend**: Pure HTML5, CSS3 (Vanilla), and ES Modules.
- **AI Runtime**: [Transformers.js v3](https://huggingface.co/docs/transformers.js/index) loaded via jsDelivr CDN.
- **Neural Network**: `HuggingFaceTB/SmolLM2-135M-Instruct` quantised to 4-bit (`q4`) to reduce download size to ~90MB (once downloaded, the weights are cached automatically in your browser).

---

## Getting Started

### Prerequisites

You need a simple local HTTP server to run the app because browsers restrict ES modules (`type="module"`) and Web Workers from loading over local `file://` URLs.

### 1. Run the local server

You can launch a local server instantly using Python:

```bash
python3 -m http.server 8080
```

### 2. Open the application

Open your browser and navigate to:
```
http://localhost:8080
```

### 3. Usage

1. Paste any stack trace into the `stack_trace.log` terminal window.
2. Click **Analyze Trace**.
3. On the first click, the engine will download the weights (~90MB). The progress bar will show the download status.
4. Once loaded, the LED will turn green (**READY**) and stream the explanation. Subsequent runs will use the cached model instantly.

---

## Deployment

Since StackSense is a static single-page app, you can deploy it to any static hosting provider for free:

- **GitHub Pages**
- **Netlify**
- **Vercel**

### Option A: Static Deploy (Current)
Deploy the folder as-is. It will download the weights and execute locally on the visitor's device. 

### Option B: Cloud API Deploy (For older computers/mobile)
If you want to support mobile devices or older systems that run WASM slowly, you can switch the backend back to the **Google Gemini Cloud API**. To do this safely without exposing your API key:
1. Deploy the `index.html` as your frontend.
2. Host a tiny Vercel Serverless Function under `/api/analyze` to call Gemini using `process.env.GEMINI_API_KEY`.
3. Fetch `/api/analyze` from your frontend code.
