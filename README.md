# 🎬 Auto-Director

**Turn one idea into a cinematic 3-act storyboard—automatically.**  

---

## The Problem & Solution
### The Problem
Storyboarding is the slowest part of creative development. Teams often spend hours turning a single concept into:
- structured narrative beats (acts)
- scene breakdowns
- camera-ready shot descriptions
- visuals that match the tone

Most tools stop at writing—or they generate visuals without reliable structure—forcing creators to manually “glue” everything together.

### The Solution
**Auto-Director** runs a deterministic, multi-agent pipeline to generate a complete storyboard in one flow:
1. **Screenwriter agent** generates a strict **3-act narrative** (Act 1/2/3).
2. **Cinematographer agent** produces exactly **3 scenes per act** and **3 shots per scene** (**27 shots total**).
3. **Visual Artist agent** generates cinematic shot images using **FLUX.1-schnell** via **Hugging Face Router** (with a reliability-first fallback).

Result: a storyboard that is **structured, camera-oriented, and visually aligned**—ready for review and iteration.

---

## Key Features (Killer Features) 🚀
- **3-Act Narrative Generator** ✍️  
  Groq-powered LLM output constrained to a strict JSON schema for `act1`, `act2`, and `act3`.

- **Exact 27-Shot Cinematic Blueprint** 🎥  
  Enforces **3 acts × 3 scenes × 3 shots** with framing types and vivid shot descriptions.

- **Reliability-First JSON Parsing** 🛡️  
  Defensive extraction + sanitization so “almost JSON” model output can’t crash the pipeline.

- **FLUX Image Generation Orchestration** 🎨  
  Hugging Face Router calls with:
  - request timeouts (AbortController)
  - retry/wait behavior when models are still loading (503 + estimated time)
  - per-shot graceful fallback so the UI stays complete.

---

## Tech Stack 🧠
| Category | Tech |
|---|---|
| Frontend | **React 19**, **Vite** |
| LLM Orchestration | **groq-sdk** |
| Image Generation | **Hugging Face Router + FLUX.1-schnell** |
| UX | Custom CSS animations (shutter reveal) |
| Quality | ESLint |

---

## Deep Dive / Architecture
### Solving the “Almost JSON” Problem (End-to-End Reliability)
Even when an LLM is instructed to return valid JSON, real responses can include formatting deviations (extra backticks, trailing commas, unquoted keys, etc.).

Auto-Director solves this in **`src/agents/cinematographer.js`** (and mirrors the same strategy in **`src/agents/screenwriter.js`**) by:
1. **Extracting the first JSON object** from the response text.
2. **Sanitizing** common breakages:
   - remove trailing commas before `}` / `]`
   - quote unquoted object keys
   - normalize common quoting mistakes
3. **Attempt parse → fallback to sanitized parse**.

This transforms the pipeline from a fragile demo into a **production-minded workflow** where structure is preserved even under imperfect model output.

---

## Technical Excellence
- **Reliability-first inference orchestration**: image generation includes timeouts and model-loading handling (503 + estimated time retry).
- **Defensive structured parsing**: “almost JSON” responses no longer crash the storyboard pipeline.
- **Cinematic UX polish**: the shutter reveal effect prevents the “all images pop in at once” problem and creates a premium visual pacing.

---

## Installation & Setup ✅
### 1) Install dependencies
```bash
git clone https://github.com/<YOUR_USER>/<YOUR_REPO>.git
cd <YOUR_REPO>
npm install
```

### 2) Add environment variables
Create a `.env` file in the project root:
```bash
VITE_GROQ_API_KEY=your_groq_key_here
VITE_HF_API_KEY=your_huggingface_key_here
```

> ⚠️ Do not commit `.env` to GitHub. It is excluded via `.gitignore`.

### 3) Run locally
```bash
npm run dev
```

Open the URL printed in the terminal (typically `http://localhost:5173/`).

---

## The Team 👥
**Solo builder:** **Akshat Sharma** — Product, engineering, and design.

---

## A Note on Credits
Auto-Director is designed as a **creator-first** pipeline: structured narrative + camera-ready shots + FLUX-driven visuals, delivered with smooth cinematic pacing.
