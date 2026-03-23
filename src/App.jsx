import { useState } from "react";
import { runScreenwriter } from "./agents/screenwriter";
import { runCinematographer } from "./agents/cinematographer";
import { attachImagesToShots } from "./agents/visualArtist";
import "./App.css";

const STAGES = {
  IDLE: "idle",
  WRITING: "writing",
  DIRECTING: "directing",
  PAINTING: "painting",
  DONE: "done",
  ERROR: "error",
};

const GENRES = ["Sci-Fi", "Noir", "Horror", "Romance", "Action", "Fantasy", "Thriller"];

export default function App() {
  const [prompt, setPrompt] = useState("");
  const [genre, setGenre] = useState("Sci-Fi");
  const [stage, setStage] = useState(STAGES.IDLE);
  const [storyData, setStoryData] = useState(null);
  const [storyboard, setStoryboard] = useState(null);
  const [error, setError] = useState("");

  async function handleGenerate() {
    if (!prompt.trim()) return;
    try {
      setError("");
      setStoryData(null);
      setStoryboard(null);

      setStage(STAGES.WRITING);
      const story = await runScreenwriter(prompt, genre);
      setStoryData(story);

      setStage(STAGES.DIRECTING);
      const shots = await runCinematographer(story, genre);

      setStage(STAGES.PAINTING);
      const fullStoryboard = await attachImagesToShots(shots, genre, story.title);
      setStoryboard(fullStoryboard);

      setStage(STAGES.DONE);
    } catch (err) {
      console.error("⚠️ Auto-Director pipeline failed:", err);
      setError(err.message || "Something went wrong. Check your API key in .env");
      setStage(STAGES.ERROR);
    }
  }

  const isGenerating = stage !== STAGES.IDLE && stage !== STAGES.DONE && stage !== STAGES.ERROR;

  return (
    <div className="app">
      <header className="header">
        <h1 className="logo">🎬 The Auto-Director</h1>
        <p className="tagline">Turn any idea into a cinematic storyboard</p>
      </header>

      <section className="input-section">
        <div className="input-card">
          <input
            type="text"
            className="prompt-input"
            placeholder='Enter your story idea... e.g. "A futuristic heist in a high-security vault"'
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            disabled={isGenerating}
          />
          <div className="input-row">
            <select
              className="genre-select"
              value={genre}
              onChange={(e) => setGenre(e.target.value)}
              disabled={isGenerating}
            >
              {GENRES.map((g) => <option key={g} value={g}>{g}</option>)}
            </select>
            <button
              className="generate-btn"
              onClick={handleGenerate}
              disabled={!prompt.trim() || isGenerating}
            >
              {isGenerating ? "Generating..." : "Generate Storyboard"}
            </button>
          </div>
        </div>
      </section>

      {stage !== STAGES.IDLE && (
        <section className="agent-status">
          <AgentStep icon="✍️" label="Agent 1 — Screenwriter" sublabel="Writing your 3-act narrative"
            status={stage === STAGES.WRITING ? "active" : stage === STAGES.IDLE ? "waiting" : "done"} />
          <div className="status-connector" />
          <AgentStep icon="🎥" label="Agent 2 — Cinematographer" sublabel="Breaking into scenes and shots"
            status={stage === STAGES.WRITING ? "waiting" : stage === STAGES.DIRECTING ? "active" : "done"} />
          <div className="status-connector" />
          <AgentStep icon="🎨" label="Agent 3 — Visual Artist" sublabel="Generating 27 cinematic images"
            status={stage === STAGES.PAINTING ? "active" : stage === STAGES.DONE ? "done" : "waiting"} />
        </section>
      )}

      {stage === STAGES.ERROR && (
        <div className="error-box">⚠️ {error}</div>
      )}

      {storyData && (
        <section className="story-summary">
          <h2 className="movie-title">{storyData.title}</h2>
          <span className="genre-badge">{genre}</span>
          <div className="acts-row">
            {[storyData.act1, storyData.act2, storyData.act3].map((act, i) => (
              <div key={i} className="act-summary-card">
                <span className="act-number">Act {i + 1}</span>
                <h3>{act.title}</h3>
                <p>{act.synopsis}</p>
                <span className="mood-badge">🎭 {act.mood}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {storyboard && storyboard.acts && (
        <section className="storyboard">
          <h2 className="storyboard-heading">📽️ Full Storyboard</h2>
          {storyboard.acts.map((act) => (
            <div key={act.actNumber} className="act-block">
              <div className="act-header">
                <span className="act-label">Act {act.actNumber}</span>
                <h2 className="act-title">{act.actTitle}</h2>
              </div>

              {act.scenes && act.scenes.map((scene) => (
                <div key={scene.sceneNumber} className="scene-block">
                  <div className="scene-header">
                    <span className="scene-label">Scene {scene.sceneNumber}</span>
                    <h3 className="scene-title">{scene.sceneTitle}</h3>
                    <span className="setting-label">📍 {scene.setting}</span>
                  </div>

                  <div className="shots-grid">
                    {scene.shots && scene.shots.map((shot) => (
                      <div key={shot.shotNumber} className="shot-card">
                        <div className="shot-image-wrapper">
                          <img
                            src={shot.imageUrl}
                            alt={shot.description}
                            className="shot-image"
                            loading="lazy"
                            onError={(e) => {
                              if (!e.target.dataset.retried) {
                                e.target.dataset.retried = "true";
                                const fallback = shot.fallbackImageUrl || `https://placehold.co/768x432/13131a/6c63ff?text=${encodeURIComponent(shot.shotType)}`;
                                e.target.src = fallback;
                              }
                            }}
                          />
                          <span className="shot-type-badge">{shot.shotType}</span>
                        </div>
                        <p className="shot-description">{shot.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </section>
      )}
    </div>
  );
}

function AgentStep({ icon, label, sublabel, status }) {
  return (
    <div className={`agent-step agent-step--${status}`}>
      <span className="agent-icon">{icon}</span>
      <div>
        <div className="agent-label">{label}</div>
        <div className="agent-sublabel">{sublabel}</div>
      </div>
      <span className="agent-check">
        {status === "done" ? "✓" : status === "active" ? "⏳" : "○"}
      </span>
    </div>
  );
}