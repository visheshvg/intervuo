import { Card } from "@/components/ui/Card";
import { ScoreRing } from "@/components/ui/ScoreRing";
import type { FeedbackPayload } from "@/types";

interface FeedbackPanelProps {
  feedback: FeedbackPayload;
}

export function FeedbackPanel({ feedback }: FeedbackPanelProps) {
  return (
    <Card className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
          AI Feedback
        </p>
        <ScoreRing score={feedback.final_score} size="sm" />
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="rounded-lg bg-gray-50 p-2">
          <p className="text-gray-400">Content</p>
          <p className="mt-0.5 font-semibold text-gray-700">
            {feedback.content_score.toFixed(1)} / 10
          </p>
        </div>
        <div className="rounded-lg bg-gray-50 p-2">
          <p className="text-gray-400">Clarity</p>
          <p className="mt-0.5 font-semibold text-gray-700">
            {feedback.sentiment_score.toFixed(1)} / 10
          </p>
        </div>
      </div>

      <div className="rounded-lg bg-green-50 p-3 text-xs text-green-800">
        <p className="mb-1 font-semibold">Strengths</p>
        <p className="leading-relaxed">{feedback.strengths}</p>
      </div>

      <div className="rounded-lg bg-amber-50 p-3 text-xs text-amber-800">
        <p className="mb-1 font-semibold">To improve</p>
        <p className="leading-relaxed">{feedback.improvements}</p>
      </div>
    </Card>
  );
}
