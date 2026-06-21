"use client";
import { useCallback, useEffect, useRef, useState } from "react";

// The Web Speech API isn't in the standard TS DOM types, so these are minimal shapes.
type RecognitionEvent = { results: ArrayLike<ArrayLike<{ transcript: string }>> };
type RecognitionErrorEvent = { error: string };
type RecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((e: RecognitionEvent) => void) | null;
  onerror: ((e: RecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
};

function getRecognitionCtor(): (new () => RecognitionLike) | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: new () => RecognitionLike;
    webkitSpeechRecognition?: new () => RecognitionLike;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

const ERROR_MESSAGES: Record<string, string> = {
  "not-allowed":
    "Microphone access is blocked. Click the camera/mic icon in the address bar, allow it, then reload.",
  "service-not-allowed":
    "Microphone access is blocked. Allow it in your browser settings and reload.",
  "no-speech": "We couldn't catch any speech. Make sure your mic is working and try again.",
  "audio-capture": "No microphone was found. Plug one in or check your input device.",
  network: "Network error during speech recognition. Check your connection.",
};

export function useSpeechRecognition() {
  const recognitionRef = useRef<RecognitionLike | null>(null);
  const transcriptRef = useRef("");
  const [transcript, setTranscript] = useState("");
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setSupported(getRecognitionCtor() !== null);
  }, []);

  const start = useCallback(() => {
    const Ctor = getRecognitionCtor();
    if (!Ctor) {
      setSupported(false);
      return;
    }
    const recognition = new Ctor();
    recognition.lang = "en-US";
    recognition.continuous = true;
    recognition.interimResults = true;
    transcriptRef.current = "";
    setTranscript("");
    setError(null);

    recognition.onresult = (e: RecognitionEvent) => {
      let text = "";
      for (let i = 0; i < e.results.length; i++) {
        text += e.results[i][0].transcript;
      }
      transcriptRef.current = text;
      setTranscript(text); // live update so the UI shows words as they're spoken
    };
    recognition.onerror = (e: RecognitionErrorEvent) => {
      if (e.error === "aborted") return;
      setError(ERROR_MESSAGES[e.error] ?? `Speech recognition error: ${e.error}`);
    };
    recognition.onend = () => setListening(false);

    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
  }, []);

  const stop = useCallback((): Promise<string> => {
    return new Promise((resolve) => {
      const recognition = recognitionRef.current;
      if (!recognition) {
        resolve("");
        return;
      }
      recognition.onend = () => {
        setListening(false);
        resolve(transcriptRef.current.trim());
      };
      recognition.stop();
    });
  }, []);

  return { start, stop, transcript, listening, supported, error };
}
