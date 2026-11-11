import { useCallback, useEffect, useRef, useState } from "react";

// Minimal typings for the Web Speech API — not yet in the TS DOM lib.
interface SpeechRecognitionAlternativeLike {
  transcript: string;
}
interface SpeechRecognitionResultLike {
  isFinal: boolean;
  length: number;
  [index: number]: SpeechRecognitionAlternativeLike;
}
interface SpeechRecognitionEventLike extends Event {
  resultIndex: number;
  results: { length: number; [index: number]: SpeechRecognitionResultLike };
}
interface SpeechRecognitionLike extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: Event & { error?: string }) => void) | null;
  onend: (() => void) | null;
}
type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

const ERROR_MESSAGES: Record<string, string> = {
  "not-allowed": "Microphone permission was denied. Allow mic access and try again.",
  "service-not-allowed": "Microphone permission was denied. Allow mic access and try again.",
  network:
    "This browser can't reach the speech service. Embedded browsers lack it — open the app in Chrome or Edge for voice typing.",
  "audio-capture": "No microphone was found on this device.",
};

/**
 * Dictation via the browser's Web Speech API (Chrome/Edge).
 * `onTranscript` fires continuously with the cumulative transcript
 * (final + interim words) while listening.
 */
export function useSpeechRecognition(
  onTranscript: (text: string) => void,
  onError?: (message: string) => void
) {
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const onTranscriptRef = useRef(onTranscript);
  const onErrorRef = useRef(onError);
  onTranscriptRef.current = onTranscript;
  onErrorRef.current = onError;

  const speechWindow = typeof window !== "undefined"
    ? (window as unknown as {
        SpeechRecognition?: SpeechRecognitionCtor;
        webkitSpeechRecognition?: SpeechRecognitionCtor;
      })
    : undefined;
  const supported =
    typeof speechWindow?.SpeechRecognition === "function" ||
    typeof speechWindow?.webkitSpeechRecognition === "function";

  const start = useCallback(() => {
    if (!supported || listening) return;
    const Ctor = speechWindow!.SpeechRecognition ?? speechWindow!.webkitSpeechRecognition;
    if (!Ctor) return;

    const recognition = new Ctor();
    recognition.lang = navigator.language || "en-US";
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onresult = (event) => {
      let text = "";
      for (let i = 0; i < event.results.length; i++) {
        text += event.results[i][0].transcript;
      }
      onTranscriptRef.current(text.trim());
    };

    recognition.onerror = (event) => {
      const code = event.error ?? "";
      if (code === "no-speech" || code === "aborted") return;
      onErrorRef.current?.(ERROR_MESSAGES[code] ?? "Voice typing failed. Please try again.");
    };

    recognition.onend = () => setListening(false);

    try {
      recognition.start();
      recognitionRef.current = recognition;
      setListening(true);
    } catch {
      onErrorRef.current?.("Could not start voice typing. Please try again.");
    }
  }, [supported, listening, speechWindow]);

  const stop = useCallback(() => {
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    setListening(false);
  }, []);

  useEffect(
    () => () => {
      recognitionRef.current?.abort();
      recognitionRef.current = null;
    },
    []
  );

  return { supported, listening, start, stop };
}
