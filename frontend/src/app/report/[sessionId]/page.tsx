"use client";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Navbar } from "@/components/layout/Navbar";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { ScoreRing } from "@/components/ui/ScoreRing";
import { FeedbackPanel } from "@/components/interview/FeedbackPanel";
import { formatDate } from "@/lib/utils";
import type { InterviewAnswer, FeedbackPayload } from "@/types";

function toFeedback(a: InterviewAnswer): FeedbackPayload {
  return {
    question_index: a.question_index,
    content_score: a.content_score ?? 0,
    sentiment_score: a.sentiment_score ?? 0,
    final_score: a.final_score ?? 0,
    strengths: a.strengths ?? "",
    improvements: a.improvements ?? "",
    model_answer: a.model_answer ?? "",
    word_count: a.word_count ?? 0,
    filler_count: a.filler_count ?? 0,
    speaking_wpm: a.speaking_wpm ?? null,
    vader_compound: a.vader_compound ?? 0,
    eye_contact_pct: a.eye_contact_pct ?? null,
  };
}

function avg(values: number[]): number {
  return values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;
}

export default function ReportPage() {
  const params = useParams<{ sessionId: string }>();
  const router = useRouter();
  const { status } = useSession();

  if (status === "unauthenticated") redirect("/login");

  const { data, isLoading } = useQuery({
    queryKey: ["report", params.sessionId],
    queryFn: () => api.session.get(params.sessionId),
    enabled: status === "authenticated",
  });

  if (isLoading || !data) {
    return (
      <>
        <Navbar />
        <main className="mx-auto max-w-3xl px-4 py-12">
          <Card className="py-12 text-center">
            <p className="text-sm text-ink-soft">Loading report...</p>
          </Card>
        </main>
      </>
    );
  }

  const answered = [...data.answers].sort((a, b) => a.question_index - b.question_index);
  const finalScores = answered.map((a) => a.final_score).filter((s): s is number => s != null);
  const overall = data.total_score ?? avg(finalScores);
  const avgContent = avg(answered.map((a) => a.content_score).filter((s): s is number => s != null));
  const eyeVals = answered.map((a) => a.eye_contact_pct).filter((s): s is number => s != null);
  const avgEye = eyeVals.length ? Math.round(avg(eyeVals)) : null;

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-3xl space-y-6 px-4 py-8">
        <Card className="flex items-center justify-between">
          <div>
            <p className="eyebrow text-ink-soft">Interview report</p>
            <h1 className="mt-1 text-xl font-semibold text-ink">{data.field}</h1>
            <p className="mt-2 flex items-center gap-2 text-sm text-ink-soft">
              <Badge variant="accent">{data.experience_level}</Badge>
              {data.created_at && formatDate(data.created_at)}
            </p>
          </div>
          <div className="text-center">
            <ScoreRing score={overall} size="lg" />
            <p className="eyebrow mt-1 text-ink-soft">Overall</p>
          </div>
        </Card>

        <div className="grid grid-cols-3 gap-4">
          <Card>
            <p className="eyebrow text-ink-soft">Answered</p>
            <p className="mt-1 text-2xl font-bold text-ink">
              {answered.length} / {data.questions.length}
            </p>
          </Card>
          <Card>
            <p className="eyebrow text-ink-soft">Avg content</p>
            <p className="mt-1 text-2xl font-bold text-ink">{avgContent.toFixed(1)}</p>
          </Card>
          <Card>
            <p className="eyebrow text-ink-soft">Avg eye contact</p>
            <p className="mt-1 text-2xl font-bold text-ink">
              {avgEye != null ? `${avgEye}%` : "-"}
            </p>
          </Card>
        </div>

        {answered.length === 0 ? (
          <Card className="py-10 text-center text-sm text-ink-soft">
            No answers were recorded for this session.
          </Card>
        ) : (
          answered.map((a) => (
            <div key={a.question_index} className="space-y-3">
              <Card className="space-y-2">
                <p className="eyebrow text-primary">Question {a.question_index + 1}</p>
                <p className="text-sm font-medium leading-relaxed text-ink">{a.question_text}</p>
                {a.answer_text && (
                  <div className="rounded-md bg-paper p-3 text-xs">
                    <p className="eyebrow mb-1 text-ink-soft">Your answer</p>
                    <p className="leading-relaxed text-ink-soft">{a.answer_text}</p>
                  </div>
                )}
              </Card>
              <FeedbackPanel feedback={toFeedback(a)} />
            </div>
          ))
        )}

        <div className="flex gap-3">
          <Button variant="outline" onClick={() => router.push("/dashboard")}>
            Back to dashboard
          </Button>
          <Button variant="outline" onClick={() => router.push("/analytics")}>
            All sessions
          </Button>
        </div>
      </main>
    </>
  );
}
