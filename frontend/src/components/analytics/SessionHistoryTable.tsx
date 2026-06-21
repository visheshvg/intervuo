import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { formatDate, scoreColor } from "@/lib/utils";
import type { AnalyticsHistory } from "@/types";

interface SessionHistoryTableProps {
  history: AnalyticsHistory[];
}

export function SessionHistoryTable({ history }: SessionHistoryTableProps) {
  if (history.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-gray-400">
        No sessions yet. Upload a resume to get started.
      </p>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-line">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-line bg-paper text-left eyebrow text-ink-soft">
            <th className="px-4 py-3">Field</th>
            <th className="px-4 py-3">Level</th>
            <th className="px-4 py-3">Questions</th>
            <th className="px-4 py-3">Score</th>
            <th className="px-4 py-3">Date</th>
            <th className="px-4 py-3"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {[...history].reverse().map((h) => (
            <tr key={h.session_id} className="bg-white hover:bg-paper">
              <td className="px-4 py-3 font-medium text-ink">{h.field}</td>
              <td className="px-4 py-3">
                <Badge variant="accent">{h.level}</Badge>
              </td>
              <td className="px-4 py-3 text-ink-soft">
                {h.answered_questions} / {h.total_questions}
              </td>
              <td className={`px-4 py-3 font-semibold ${scoreColor(h.avg_score)}`}>
                {h.avg_score.toFixed(1)}
              </td>
              <td className="px-4 py-3 text-ink-soft">{formatDate(h.date)}</td>
              <td className="px-4 py-3">
                <Link
                  href={`/report/${h.session_id}`}
                  className="text-xs text-primary hover:underline"
                >
                  Review
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
