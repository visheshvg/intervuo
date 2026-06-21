"use client";
import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useInterviewStore } from "@/store/interviewStore";
import { useMediaStream } from "@/hooks/useMediaStream";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { useFaceTracking } from "@/hooks/useFaceTracking";
import { useSpeechSynthesis } from "@/hooks/useSpeechSynthesis";
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
  const { status } = useSession();

  if (status === "unauthenticated") redirect("/login");

  const {
    questions,
    currentIndex,
    feedback,
    isRecording,
    isAnalyzing,
    setRecording,
    setAnalyzing,
    setSession,
    setAnswer,
    setFeedback,
    nextQuestion,
  } = useInterviewStore();

  const { start: startCamera, stop: stopCamera, streamRef, error: mediaError } =
    useMediaStream();
  const {
    start: startListening,
    stop: stopListening,
    transcript: liveTranscript,
    supported: speechSupported,
    error: speechError,
  } = useSpeechRecognition();
  const {
    start: startTracking,
    stop: stopTracking,
    liveEyeContact,
  } = useFaceTracking(streamRef);
  const { speak: speakQuestion, cancel: cancelSpeech, speaking: isSpeaking } =
    useSpeechSynthesis();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isCompleting, setIsCompleting] = useState(false);
  const recordStartRef = useRef(0);
  const isLastQuestion = currentIndex === questions.length - 1;
  const currentFeedback = feedback[currentIndex];
  const answeredCount = Object.keys(feedback).length;
  const canFinish = answeredCount >= 2;

  const {
    data: sessionDetail,
    isLoading: isSessionLoading,
    isError: isSessionError,
  } = useQuery({
    queryKey: ["session", sessionId],
    queryFn: () => api.session.get(sessionId),
    enabled: status === "authenticated" && !questions.length,
  });

  useEffect(() => {
    if (status !== "authenticated") return;
    startCamera();
    return () => stopCamera();
  }, [startCamera, status, stopCamera]);

  // Read each new question aloud when it appears.
  useEffect(() => {
    if (questions.length && questions[currentIndex]) {
      speakQuestion(questions[currentIndex]);
    }
  }, [currentIndex, questions, speakQuestion]);

  useEffect(() => {
    if (!sessionDetail || questions.length) return;

    setSession(sessionDetail.id, sessionDetail.questions);
    sessionDetail.answers.forEach((answer) => {
      if (answer.answer_text) {
        setAnswer(answer.question_index, answer.answer_text);
      }
      if (
        answer.content_score != null &&
        answer.sentiment_score != null &&
        answer.final_score != null
      ) {
        setFeedback({
          question_index: answer.question_index,
          content_score: answer.content_score,
          sentiment_score: answer.sentiment_score,
          final_score: answer.final_score,
          strengths: answer.strengths ?? "",
          improvements: answer.improvements ?? "",
          model_answer: answer.model_answer ?? "",
          word_count: answer.word_count ?? 0,
          filler_count: answer.filler_count ?? 0,
          speaking_wpm: answer.speaking_wpm ?? null,
          vader_compound: answer.vader_compound ?? 0,
          eye_contact_pct: answer.eye_contact_pct ?? null,
        });
      }
    });
  }, [questions.length, sessionDetail, setAnswer, setFeedback, setSession]);

  const handleToggleRecord = async () => {
    if (isRecording) {
      setRecording(false);
      const eyeContact = stopTracking();
      const finalTranscript = await stopListening();
      if (!finalTranscript) {
        setSubmitError(speechError ?? "We couldn't catch any speech. Please try again.");
        return;
      }
      setSubmitError(null);
      setAnalyzing(true);
      const durationSeconds = recordStartRef.current
        ? (Date.now() - recordStartRef.current) / 1000
        : 0;
      try {
        const result = await api.interview.submitAnswer(
          sessionId,
          currentIndex,
          finalTranscript,
          durationSeconds,
          eyeContact
        );
        setAnswer(currentIndex, finalTranscript);
        setFeedback({
          question_index: currentIndex,
          content_score: result.content_score,
          sentiment_score: result.sentiment_score,
          final_score: result.final_score,
          strengths: result.strengths,
          improvements: result.improvements,
          model_answer: result.model_answer,
          word_count: result.word_count,
          filler_count: result.filler_count,
          speaking_wpm: result.speaking_wpm,
          vader_compound: result.vader_compound,
          eye_contact_pct: result.eye_contact_pct,
        });
      } catch (e) {
        setSubmitError(e instanceof Error ? e.message : "Submission failed.");
      } finally {
        setAnalyzing(false);
      }
    } else {
      if (!speechSupported) {
        setSubmitError("Speech recognition needs Chrome or Edge. Please switch browsers.");
        return;
      }
      setSubmitError(null);
      cancelSpeech();
      setRecording(true);
      recordStartRef.current = Date.now();
      startListening();
      startTracking();
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
      router.push(`/report/${sessionId}`);
    } catch {
      setIsCompleting(false);
    }
  };

  if (!questions.length && isSessionLoading) {
    return (
      <>
        <Navbar />
        <main className="mx-auto max-w-5xl px-4 py-12">
          <Card className="py-12 text-center">
            <p className="text-sm text-ink-soft">Loading interview...</p>
          </Card>
        </main>
      </>
    );
  }

  if (!questions.length || isSessionError) {
    return (
      <>
        <Navbar />
        <main className="mx-auto max-w-5xl px-4 py-12">
          <Card className="py-12 text-center">
            <p className="text-sm text-ink-soft">Session not found or no questions loaded.</p>
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
          <p className="text-sm text-ink-soft">
            {questions[0] && (
              <span className="font-medium text-ink">
                Q{currentIndex + 1} of {questions.length}
              </span>
            )}
          </p>
          {canFinish && (
            <Button size="sm" onClick={handleComplete} loading={isCompleting}>
              End interview & see report ({answeredCount} answered)
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="space-y-4">
            <VideoPanel streamRef={streamRef} />
            {mediaError && (
              <p className="text-xs text-ink-soft">
                Camera is off (optional). You can still answer by voice.
              </p>
            )}
          </div>

          <div className="space-y-3">
            <QuestionCard
              question={questions[currentIndex]}
              index={currentIndex}
              total={questions.length}
              onReplay={() => speakQuestion(questions[currentIndex])}
              speaking={isSpeaking}
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
                {isRecording && !speechError && (
                  <Card className="min-h-[88px]">
                    <p className="eyebrow mb-2 flex items-center justify-between text-primary">
                      <span className="flex items-center gap-2">
                        <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
                        Listening
                      </span>
                      {liveEyeContact != null && (
                        <span className="text-ink-soft">Eye contact {liveEyeContact}%</span>
                      )}
                    </p>
                    {liveTranscript ? (
                      <p className="text-sm leading-relaxed text-ink">{liveTranscript}</p>
                    ) : (
                      <p className="text-sm text-ink-soft">
                        Start speaking and your words will appear here...
                      </p>
                    )}
                  </Card>
                )}
                {isAnalyzing && (
                  <Card className="py-4 text-center text-sm text-ink-soft">
                    Analysing your answer...
                  </Card>
                )}
                {(submitError || speechError) && (
                  <p className="text-xs text-red-600">{submitError || speechError}</p>
                )}
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
