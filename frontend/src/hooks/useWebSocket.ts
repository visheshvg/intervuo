"use client";
import { useEffect, useRef, useCallback } from "react";
import { useInterviewStore } from "@/store/interviewStore";
import type { WsEvent } from "@/types";

const WS_BASE = process.env.NEXT_PUBLIC_WS_URL ?? "ws://localhost:8000";

export function useInterviewWebSocket(sessionId: string | null, token: string | null) {
  const wsRef = useRef<WebSocket | null>(null);
  const { setFeedback, setAnalyzing } = useInterviewStore();

  useEffect(() => {
    if (!sessionId || !token) return;

    const ws = new WebSocket(
      `${WS_BASE}/api/interview/ws/${sessionId}?token=${token}`
    );
    wsRef.current = ws;

    ws.onmessage = (e: MessageEvent) => {
      const msg = JSON.parse(e.data as string) as WsEvent;
      if (msg.event === "feedback_loading") {
        setAnalyzing(true);
      } else if (msg.event === "feedback_ready") {
        setFeedback(msg.data);
        setAnalyzing(false);
      } else if (msg.event === "feedback_error") {
        setAnalyzing(false);
        console.error("WS feedback error:", msg.data.detail);
      }
    };

    ws.onerror = () => setAnalyzing(false);

    return () => {
      ws.close();
      wsRef.current = null;
    };
  }, [sessionId, token, setFeedback, setAnalyzing]);

  const sendAnswer = useCallback(
    (questionIndex: number, answerText: string) => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(
          JSON.stringify({
            event: "answer_ready",
            data: { question_index: questionIndex, answer_text: answerText },
          })
        );
      }
    },
    []
  );

  return { sendAnswer };
}
