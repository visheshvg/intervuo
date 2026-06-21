import { Check, X, ExternalLink } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { scoreColor } from "@/lib/utils";
import type { UploadResumeResponse } from "@/types";

interface ResumeInsightsProps {
  data: UploadResumeResponse;
}

export function ResumeInsights({ data }: ResumeInsightsProps) {
  // resume_score is 0-100; reuse the 0-10 score colour scale.
  const scoreClass = scoreColor(data.resume_score / 10);

  return (
    <Card className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="eyebrow text-ink-soft">Resume analysis</p>
          <p className="mt-1 text-sm text-ink">
            {data.parsed_name || "Resume"}
            {data.page_count > 0 && (
              <span className="text-ink-soft"> &middot; {data.page_count} page{data.page_count > 1 ? "s" : ""}</span>
            )}
          </p>
        </div>
        <div className="text-right">
          <p className={`text-2xl font-bold ${scoreClass}`}>{data.resume_score}</p>
          <p className="eyebrow text-ink-soft">/ 100</p>
        </div>
      </div>

      <div>
        <p className="eyebrow mb-2 text-ink-soft">Looks like a {data.predicted_field} profile</p>
        <div className="flex flex-wrap gap-1.5">
          {data.skills.slice(0, 12).map((s) => (
            <Badge key={s} variant="accent">{s}</Badge>
          ))}
          {data.skills.length === 0 && (
            <p className="text-xs text-ink-soft">No known skills detected in the text.</p>
          )}
        </div>
      </div>

      <div>
        <p className="eyebrow mb-2 text-ink-soft">Resume checklist</p>
        <ul className="space-y-1.5">
          {data.resume_tips.map((tip) => (
            <li key={tip.text} className="flex items-center gap-2 text-xs">
              {tip.present ? (
                <Check className="h-3.5 w-3.5 shrink-0 text-green-600" />
              ) : (
                <X className="h-3.5 w-3.5 shrink-0 text-amber-600" />
              )}
              <span className={tip.present ? "text-ink-soft" : "text-ink"}>{tip.text}</span>
            </li>
          ))}
        </ul>
      </div>

      {data.recommended_skills.length > 0 && (
        <div>
          <p className="eyebrow mb-2 text-ink-soft">Skills worth adding</p>
          <div className="flex flex-wrap gap-1.5">
            {data.recommended_skills.map((s) => (
              <Badge key={s} variant="gray">{s}</Badge>
            ))}
          </div>
        </div>
      )}

      {data.courses.length > 0 && (
        <div>
          <p className="eyebrow mb-2 text-ink-soft">Recommended learning</p>
          <ul className="space-y-1.5">
            {data.courses.map((c) => (
              <li key={c.url}>
                <a
                  href={c.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs text-primary hover:underline"
                >
                  <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                  {c.name}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  );
}
