import { useEffect, useRef, useState, type FormEvent } from "react";
import type { RunSummary } from "../types";
import { useSpeechRecognition } from "../hooks/useSpeechRecognition";
import { useToasts } from "./Toasts";

interface CommandBarProps {
  onRun: (prompt: string) => Promise<RunSummary[]>;
  running: boolean;
}

const EXAMPLES = [
  "Plan my day: add a workout, reading, and deep work block",
  "Create a grocery list with breakfast items",
  "Mark my oldest note as completed",
];

export default function CommandBar({ onRun, running }: CommandBarProps) {
  const [prompt, setPrompt] = useState("");
  const [results, setResults] = useState<RunSummary[] | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dictationBase = useRef("");
  const { push } = useToasts();

  const { supported: micSupported, listening: micListening, start: micStart, stop: micStop } =
    useSpeechRecognition(
      (text) => setPrompt(dictationBase.current ? `${dictationBase.current} ${text}` : text),
      (message) => push({ kind: "error", title: "Voice typing", body: message })
    );

  const startDictation = () => {
    dictationBase.current = prompt.trim();
    setResults(null);
    micStart();
  };

  useEffect(() => {
    const focus = () => inputRef.current?.focus();
    window.addEventListener("tf:focus-command", focus);
    return () => window.removeEventListener("tf:focus-command", focus);
  }, []);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (micListening) micStop();
    const trimmed = prompt.trim();
    if (!trimmed || running) return;
    setResults(null);
    const summary = await onRun(trimmed);
    setResults(summary);
    setPrompt("");
  };

  return (
    <header className="hero">
      <div className="hero-glow" aria-hidden="true" />

      <div className="hero-badge">
        <span className="msz filled" aria-hidden="true">
          neurology
        </span>
        <span className="hero-badge-label">Agent Note Runtime</span>
        <span className="pulse-dot" />
      </div>

      <h1 className="hero-headline">
        Capture at the Speed of <em>Thought.</em>
      </h1>
      <p className="hero-sub">
        One instruction and your agent writes, rewrites, completes and clears notes for you.
      </p>

      <form className={`command-bar ${running ? "busy" : ""}`} onSubmit={submit}>
        <span className="msz command-spark" aria-hidden="true">
          auto_awesome
        </span>
        <input
          ref={inputRef}
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder={
            running
              ? "Agent is working…"
              : micListening
                ? "Listening… speak your instruction, click the mic to stop"
                : "Instruct your agent — add, update, complete or clear notes…"
          }
          aria-label="Agent instruction"
          disabled={running}
        />
        {micSupported ? (
          <button
            type="button"
            className={`mic-btn ${micListening ? "listening" : ""}`}
            title={micListening ? "Stop voice typing" : "Voice typing"}
            aria-label={micListening ? "Stop voice typing" : "Start voice typing"}
            aria-pressed={micListening}
            disabled={running}
            onClick={() => (micListening ? micStop() : startDictation())}
          >
            <span className="msz" aria-hidden="true">
              mic
            </span>
          </button>
        ) : (
          <button
            type="button"
            className="mic-btn"
            title="Voice typing needs Chrome or Edge"
            aria-label="Voice typing unavailable"
            disabled
          >
            <span className="msz" aria-hidden="true">
              mic_off
            </span>
          </button>
        )}
        <button type="submit" className="btn btn-primary btn-run" disabled={running || !prompt.trim()}>
          {running ? (
            <>
              <span className="spinner spinner-light" aria-hidden="true" />
              Running…
            </>
          ) : (
            <>
              <span className="msz filled" aria-hidden="true">
                bolt
              </span>
              Run Agent
            </>
          )}
        </button>
      </form>

      {!results && !running ? (
        <div className="example-row">
          {EXAMPLES.map((ex) => (
            <button
              key={ex}
              type="button"
              className="example-chip"
              onClick={() => {
                setPrompt(ex);
                inputRef.current?.focus();
              }}
            >
              {ex}
            </button>
          ))}
        </div>
      ) : null}

      {running ? (
        <div className="status-strip">
          <div className="pill pill-active">
            <span className="ping-dot">
              <span className="ping-ring clay" />
              <span className="ping-core clay" />
            </span>
            <span className="pill-active-label">Executing agent ops…</span>
          </div>
        </div>
      ) : null}

      {results && results.length > 0 ? (
        <div className="status-strip" aria-live="polite">
          <div className="pill pill-active">
            <span className="ping-dot">
              <span className="ping-ring clay" />
              <span className="ping-core clay" />
            </span>
            <span className="pill-active-label">
              {results.length} op{results.length === 1 ? "" : "s"} completed
            </span>
          </div>
          {results.map((r, i) => (
            <div key={i} className={`pill ${r.ok ? "" : "pill-failed"}`}>
              <span className="msz" aria-hidden="true">
                {r.ok
                  ? r.verb === "Deleted"
                    ? "archive"
                    : r.verb === "Updated"
                      ? "sync"
                      : "check_circle"
                  : "error"}
              </span>
              <span>
                {r.verb}: <strong>{r.title}</strong>
              </span>
            </div>
          ))}
        </div>
      ) : null}
    </header>
  );
}
