"use client";
import { useEffect, useRef } from "react";

interface VideoPanelProps {
  streamRef: React.RefObject<MediaStream | null>;
}

export function VideoPanel({ streamRef }: VideoPanelProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !streamRef.current) return;
    video.srcObject = streamRef.current;
    video.play().catch(() => {});
  }, [streamRef]);

  return (
    <div className="overflow-hidden rounded-xl bg-gray-900 aspect-[4/3]">
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        className="h-full w-full object-cover"
      />
    </div>
  );
}
