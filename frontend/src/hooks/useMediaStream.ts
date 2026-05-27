"use client";
import { useRef, useState, useCallback } from "react";

export function useMediaStream() {
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const start = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: { width: 1280, height: 720, facingMode: "user" },
      });
      streamRef.current = stream;
      setIsReady(true);
      setError(null);
      return stream;
    } catch (err) {
      setError("Camera/microphone access denied.");
      throw err;
    }
  }, []);

  const stop = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setIsReady(false);
  }, []);

  const startRecording = useCallback(() => {
    if (!streamRef.current) return;
    chunksRef.current = [];
    const recorder = new MediaRecorder(streamRef.current, {
      mimeType: "audio/webm",
    });
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };
    recorder.start(250);
    recorderRef.current = recorder;
  }, []);

  const stopRecording = useCallback((): Promise<Blob> => {
    return new Promise((resolve) => {
      const recorder = recorderRef.current;
      if (!recorder || recorder.state === "inactive") {
        resolve(new Blob([], { type: "audio/webm" }));
        return;
      }
      recorder.onstop = () =>
        resolve(new Blob(chunksRef.current, { type: "audio/webm" }));
      recorder.stop();
    });
  }, []);

  return { start, stop, startRecording, stopRecording, streamRef, isReady, error };
}
