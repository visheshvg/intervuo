import { create } from "zustand";
import type { FeedbackPayload } from "@/types";

interface InterviewState {
  sessionId: string | null;
  questions: string[];
  currentIndex: number;
  answers: Record<number, string>;
  feedback: Record<number, FeedbackPayload>;
  isRecording: boolean;
  isAnalyzing: boolean;

  setSession: (id: string, questions: string[]) => void;
  nextQuestion: () => void;
  prevQuestion: () => void;
  setAnswer: (index: number, transcript: string) => void;
  setFeedback: (payload: FeedbackPayload) => void;
  setRecording: (v: boolean) => void;
  setAnalyzing: (v: boolean) => void;
  reset: () => void;
}

export const useInterviewStore = create<InterviewState>((set) => ({
  sessionId: null,
  questions: [],
  currentIndex: 0,
  answers: {},
  feedback: {},
  isRecording: false,
  isAnalyzing: false,

  setSession: (id, questions) =>
    set({ sessionId: id, questions, currentIndex: 0, answers: {}, feedback: {} }),
  nextQuestion: () =>
    set((s) => ({
      currentIndex: Math.min(s.currentIndex + 1, s.questions.length - 1),
    })),
  prevQuestion: () =>
    set((s) => ({ currentIndex: Math.max(s.currentIndex - 1, 0) })),
  setAnswer: (index, transcript) =>
    set((s) => ({ answers: { ...s.answers, [index]: transcript } })),
  setFeedback: (payload) =>
    set((s) => ({ feedback: { ...s.feedback, [payload.question_index]: payload } })),
  setRecording: (v) => set({ isRecording: v }),
  setAnalyzing: (v) => set({ isAnalyzing: v }),
  reset: () =>
    set({
      sessionId: null,
      questions: [],
      currentIndex: 0,
      answers: {},
      feedback: {},
      isRecording: false,
      isAnalyzing: false,
    }),
}));
