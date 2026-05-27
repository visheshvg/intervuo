"use client";
import { Mic, StopCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface RecordButtonProps {
  isRecording: boolean;
  isAnalyzing: boolean;
  hasFeedback: boolean;
  onToggle: () => void;
  onNext: () => void;
}

export function RecordButton({
  isRecording,
  isAnalyzing,
  hasFeedback,
  onToggle,
  onNext,
}: RecordButtonProps) {
  if (hasFeedback) {
    return (
      <Button size="full" onClick={onNext}>
        Next question →
      </Button>
    );
  }

  return (
    <Button
      size="full"
      variant={isRecording ? "danger" : "primary"}
      onClick={onToggle}
      loading={isAnalyzing}
      disabled={isAnalyzing}
    >
      {isAnalyzing ? (
        "Analysing…"
      ) : isRecording ? (
        <>
          <StopCircle className="h-4 w-4" />
          Stop & submit
        </>
      ) : (
        <>
          <Mic className="h-4 w-4" />
          Start recording
        </>
      )}
    </Button>
  );
}
