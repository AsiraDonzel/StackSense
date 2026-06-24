# StackSense ◈

StackSense is a terminal-style developer utility designed to explain programming stack traces in plain English and provide immediate, actionable fix suggestions. 

It features a **Dual-Engine Architecture** that lets you toggle between:
1. **Local Engine (SmolLM2-135M)**: Runs entirely client-side inside the browser using ONNX Runtime and Transformers.js (zero servers, 100% private, runs offline once cached).
2. **Cloud Engine (Gemini 2.0 Flash)**: Queries Google's Gemini API via a secure, zero-config Vercel Serverless Function (instant, lightweight, compatible with all devices and browsers).

---

## Key Features

- **Dual-Engine Toggle**: Instantly switch between **LOCAL** and **CLOUD** mode in the UI.
- **Hardware-Style LED**: Virtual status indicator (idle, loading, ready, running, error) that changes color and blink states in real time.
- **GPU Acceleration**: Built-in support for WebGPU in Local mode. The app automatically detects support and offloads execution to your GPU for near-instant responses. Falls back to single-threaded WebAssembly (WASM) where GPU is not available.
- **Token Streaming**: Streams explanations token-by-token for the Local engine, reducing perceived wait time.
- **Sleek Terminal Theme**: Customized dark terminal design styling using a `#1e1e1e` base background and glowing `#00ff00` accents.
- **Secure Serverless Proxy**: Hides your personal Gemini API key behind a Vercel serverless function (`/api/analyze`), preventing public exposure.

---

## Technical Architecture

- **Frontend**: Pure HTML5, CSS3 (Vanilla), and ES Modules.
- **AI Runtime (Local)**: [Transformers.js v3](https://huggingface.co/docs/transformers.js/index) loaded via jsDelivr CDN.
- **Local Neural Network**: `HuggingFaceTB/SmolLM2-135M-Instruct` quantised to 4-bit (`q4`) to reduce download size to ~90MB (once downloaded, the weights are cached automatically in your browser).
- **Backend (Cloud)**: A lightweight Node.js Serverless Function hosted at `/api/analyze.js` that relays requests to the Gemini 2.0 Flash API.

---

## Getting Started

### Local Development

Because the app uses ES modules (`type="module"`) and Web Workers, browsers restrict loading it over raw `file://` URLs. You need a simple local HTTP server:

1. Launch a local server using Python:
   ```bash
   python3 -m http.server 8080
   ```
2. Open your browser and navigate to:
   ```
   http://localhost:8080
   ```
3. Test **LOCAL** mode (will download weights on first run) or **CLOUD** mode (requires setting up Vercel locally).

---

## Deployment on Vercel

StackSense is pre-configured to deploy on Vercel with zero code changes.

### 1. Import Project to Vercel
1. Log in to your [Vercel Dashboard](https://vercel.com).
2. Click **Add New** → **Project**.
3. Import your **`StackSense`** repository from GitHub.

### 2. Configure Environment Variable
To enable **CLOUD** mode, you need to add your Gemini API Key:
1. Go to your project page on the Vercel Dashboard.
2. Navigate to **Settings** → **Environment Variables**.
3. Create a new variable:
   - **Key**: `GEMINI_API_KEY`
   - **Value**: *Your Google AI Studio API key* (Get one free at [aistudio.google.com](https://aistudio.google.com))
4. Click **Save** and trigger a redeployment.
