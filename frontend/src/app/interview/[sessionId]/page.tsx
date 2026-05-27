"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { useInterviewStore } from "@/store/interviewStore";
import { useMediaStream } from "@/hooks/useMediaStream";
import { useInterviewWebSocket } from "@/hooks/useWebSocket";
import { api } from "@/lib/api";
import { VideoPanel } from "@/components/interview/VideoPanel";
import { QuestionCard } from "@/components/interview/QuestionCard";
import { FeedbackPanel } from "@/components/interview/FeedbackPanel";
import { RecordButton } from "@/components/interview/RecordButton";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export default function InterviewPage() {
  const params = useParams<{ sessionId: string }>();
  const sessionId = params.sessionId;
  const router = useRouter();
  const { data: authSession, status } = useSession();

  if (status === "unauthenticated") redirect("/login");

  const token = (authSession as { accessToken?: string } | null)?.accessToken ?? null;

  const {
    questions,
    currentIndex,
    feedback,
    isRecording,
    isAnalyzing,
    setRecording,
    setAnswer,
    nextQuestion,
  } = useInterviewStore();

  const { start, stop, startRecording, stopRecording, streamRef, error: mediaError } =
    useMediaStream();
  const { sendAnswer } = useInterviewWebSocket(sessionId, token);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isCompleting, setIsCompleting] = useState(false);
  const isLastQuestion = currentIndex === questions.length - 1;
  const currentFeedback = feedback[currentIndex];
  const allAnswered = questions.length > 0 && Object.keys(feedback).length === questions.length;

  useEffect(() => {
    if (status !== "authenticated") return;
    start();
    return () => stop();
  }, [start, status, stop]);

  const handleToggleRecord = async () => {
    if (isRecording) {
      setRecording(false);
      const blob = await stopRecording();
      if (!blob.size) return;
      setSubmitError(null);
      try {
        const result = await api.interview.submitAudio(sessionId, currentIndex, blob);
        setAnswer(currentIndex, result.transcript);
        sendAnswer(currentIndex, result.transcript);
      } catch (e) {
        setSubmitError(e instanceof Error ? e.message : "Submission failed.");
      }
    } else {
      setSubmitError(null);
      setRecording(true);
      startRecording();
    }
  };

  const handleNext = () => {
    if (isLastQuestion) return;
    nextQuestion();
  };

  const handleComplete = async () => {
    setIsCompleting(true);
    try {
      await api.session.complete(sessionId);
      router.push("/analytics");
    } catch {
      setIsCompleting(false);
    }
  };

  if (!questions.length) {
    return (
      <>
        <Navbar />
        <main className="mx-auto max-w-5xl px-4 py-12">
          <Card className="py-12 text-center">
            <p className="text-sm text-gray-400">Session not found or no questions loaded.</p>
            <Button className="mt-4" onClick={() => router.push("/dashboard")} variant="outline" size="sm">
              Back to dashboard
            </Button>
          </Card>
        </main>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-5xl px-4 py-6">
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm text-gray-500">
            {questions[0] && (
              <span className="font-medium text-gray-700">
                Q{currentIndex + 1} of {questions.length}
              </span>
            )}
          </p>
          {allAnswered && (
            <Button size="sm" onClick={handleComplete} loading={isCompleting}>
              Finish & see results
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="space-y-4">
            <VideoPanel streamRef={streamRef} />
            {mediaError && <p className="text-xs text-red-500">{mediaError}</p>}
          </div>

          <div className="space-y-3">
            <QuestionCard
              question={questions[currentIndex]}
              index={currentIndex}
              total={questions.length}
            />

            {currentFeedback ? (
              <>
                <FeedbackPanel feedback={currentFeedback} />
                <RecordButton
                  isRecording={false}
                  isAnalyzing={false}
                  hasFeedback
                  onToggle={handleToggleRecord}
                  onNext={handleNext}
                />
              </>
            ) : (
              <>
                {isAnalyzing && (
                  <Card className="py-4 text-center text-sm text-gray-400">
                    Analysing your answer...
                  </Card>
                )}
                {submitError && <p className="text-xs text-red-500">{submitError}</p>}
                <RecordButton
                  isRecording={isRecording}
                  isAnalyzing={isAnalyzing}
                  hasFeedback={false}
                  onToggle={handleToggleRecord}
                  onNext={handleNext}
                />
              </>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
