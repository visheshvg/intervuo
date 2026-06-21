import { Card } from "@/components/ui/Card";
import { ScoreRing } from "@/components/ui/ScoreRing";
import type { FeedbackPayload } from "@/types";

interface FeedbackPanelProps {
  feedback: FeedbackPayload;
}

function toneLabel(compound: number): string {
  if (compound >= 0.25) return "Positive";
  if (compound <= -0.25) return "Negative";
  return "Neutral";
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-paper p-2 text-center">
      <p className="font-semibold text-ink">{value}</p>
      <p className="text-ink-soft">{label}</p>
    </div>
  );
}

export function FeedbackPanel({ feedback }: FeedbackPanelProps) {
  const hasPresence = feedback.eye_contact_pct != null;
  // ~60% eye contact already counts as full marks (matches the backend calibration).
  const presenceScore = hasPresence
    ? Math.min(10, feedback.eye_contact_pct! / 6)
    : null;

  // The transparent weighting behind the final score.
  const bars = [
    { label: "Content", weight: "70%", score: feedback.content_score },
    { label: "Communication", weight: hasPresence ? "20%" : "30%", score: feedback.sentiment_score },
    ...(presenceScore != null
      ? [{ label: "Presence", weight: "10%", score: presenceScore }]
      : []),
  ];

  return (
    <Card className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="eyebrow text-ink-soft">AI Feedback</p>
        <ScoreRing score={feedback.final_score} size="sm" />
      </div>

      <div className="space-y-2">
        {bars.map((b) => (
          <div key={b.label}>
            <div className="mb-0.5 flex items-center justify-between text-xs">
              <span className="text-ink-soft">
                {b.label} <span className="text-ink-soft/60">({b.weight})</span>
              </span>
              <span className="font-semibold text-ink">{b.score.toFixed(1)}/10</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-paper">
              <div
                className="h-full rounded-full bg-primary"
                style={{ width: `${Math.min(100, (b.score / 10) * 100)}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-2">
        <div className="grid grid-cols-3 gap-2 text-xs">
          <Metric label="words" value={String(feedback.word_count)} />
          <Metric
            label="words/min"
            value={feedback.speaking_wpm != null ? String(Math.round(feedback.speaking_wpm)) : "-"}
          />
          <Metric label="fillers" value={String(feedback.filler_count)} />
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <Metric
            label="eye contact"
            value={hasPresence ? `${Math.round(feedback.eye_contact_pct!)}%` : "-"}
          />
          <Metric label="tone" value={toneLabel(feedback.vader_compound)} />
        </div>
      </div>

      <div className="rounded-md bg-green-50 p-3 text-xs text-green-800">
        <p className="mb-1 font-semibold">Strengths</p>
        <p className="leading-relaxed">{feedback.strengths}</p>
      </div>

      <div className="rounded-md bg-amber-50 p-3 text-xs text-amber-800">
        <p className="mb-1 font-semibold">To improve</p>
        <p className="leading-relaxed">{feedback.improvements}</p>
      </div>

      {feedback.model_answer && (
        <div className="rounded-md border border-line p-3 text-xs">
          <p className="mb-1 font-semibold text-ink">What a strong answer covers</p>
          <p className="whitespace-pre-line leading-relaxed text-ink-soft">
            {feedback.model_answer}
          </p>
        </div>
      )}
    </Card>
  );
}
