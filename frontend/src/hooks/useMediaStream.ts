"use client";
import { useRef, useState, useCallback } from "react";

// Camera stream for the video panel. The microphone is handled separately by
// the Web Speech API, so this only requests video.
export function useMediaStream() {
  const streamRef = useRef<MediaStream | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const start = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720, facingMode: "user" },
        audio: false,
      });
      streamRef.current = stream;
      setIsReady(true);
      setError(null);
      return stream;
    } catch (err) {
      setError("Camera access denied.");
      throw err;
    }
  }, []);

  const stop = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setIsReady(false);
  }, []);

  return { start, stop, streamRef, isReady, error };
}
