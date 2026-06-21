"use client";
import { useCallback, useEffect, useRef, useState, type RefObject } from "react";
import type { FaceLandmarker } from "@mediapipe/tasks-vision";

// Pinned to the installed package version so the WASM matches the JS.
const WASM_URL = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.35/wasm";
const MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task";

// MediaPipe face-mesh landmark indices.
const NOSE_TIP = 1;
const LEFT_CHEEK = 234;
const RIGHT_CHEEK = 454;

// In-browser eye-contact tracking: the share of sampled frames where a face is
// detected and roughly facing the camera. Video never leaves the device.
export function useFaceTracking(streamRef: RefObject<MediaStream | null>) {
  const landmarkerRef = useRef<FaceLandmarker | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const intervalRef = useRef<number | null>(null);
  const samplesRef = useRef(0);
  const facingRef = useRef(0);
  const [liveEyeContact, setLiveEyeContact] = useState<number | null>(null);
  const [available, setAvailable] = useState(true);

  const ensureLandmarker = useCallback(async () => {
    if (landmarkerRef.current) return landmarkerRef.current;
    try {
      const vision = await import("@mediapipe/tasks-vision");
      const fileset = await vision.FilesetResolver.forVisionTasks(WASM_URL);
      landmarkerRef.current = await vision.FaceLandmarker.createFromOptions(fileset, {
        baseOptions: { modelAssetPath: MODEL_URL },
        runningMode: "VIDEO",
        numFaces: 1,
      });
      return landmarkerRef.current;
    } catch (err) {
      console.warn("Face tracking unavailable:", err);
      setAvailable(false);
      return null;
    }
  }, []);

  const start = useCallback(async () => {
    samplesRef.current = 0;
    facingRef.current = 0;
    setLiveEyeContact(null);

    const stream = streamRef.current;
    if (!stream) return;
    const landmarker = await ensureLandmarker();
    if (!landmarker) return;

    if (!videoRef.current) {
      const v = document.createElement("video");
      v.muted = true;
      v.playsInline = true;
      videoRef.current = v;
    }
    const video = videoRef.current;
    video.srcObject = stream;
    try {
      await video.play();
    } catch {
      /* autoplay can reject; detection still works once frames arrive */
    }

    intervalRef.current = window.setInterval(() => {
      if (!video.videoWidth) return;
      let result;
      try {
        result = landmarker.detectForVideo(video, performance.now());
      } catch {
        return;
      }
      samplesRef.current += 1;
      const face = result?.faceLandmarks?.[0];
      if (face) {
        const nose = face[NOSE_TIP];
        const left = face[LEFT_CHEEK];
        const right = face[RIGHT_CHEEK];
        if (nose && left && right) {
          const ld = Math.abs(nose.x - left.x);
          const rd = Math.abs(right.x - nose.x);
          const ratio = Math.min(ld, rd) / Math.max(ld, rd || 1e-6);
          if (ratio > 0.6) facingRef.current += 1; // balanced => roughly facing camera
        }
      }
      setLiveEyeContact(Math.round((facingRef.current / samplesRef.current) * 100));
    }, 400);
  }, [ensureLandmarker, streamRef]);

  const stop = useCallback((): number | null => {
    if (intervalRef.current != null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
    if (samplesRef.current === 0) return null;
    return Math.round((facingRef.current / samplesRef.current) * 100);
  }, []);

  useEffect(() => {
    return () => {
      if (intervalRef.current != null) clearInterval(intervalRef.current);
      landmarkerRef.current?.close?.();
    };
  }, []);

  return { start, stop, liveEyeContact, available };
}
