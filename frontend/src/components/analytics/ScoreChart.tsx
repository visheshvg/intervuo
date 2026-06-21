"use client";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { formatDate } from "@/lib/utils";
import type { AnalyticsHistory } from "@/types";

interface ScoreChartProps {
  history: AnalyticsHistory[];
}

export function ScoreChart({ history }: ScoreChartProps) {
  const data = history.map((h) => ({
    date: formatDate(h.date),
    score: h.avg_score,
    field: h.field,
  }));

  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e3db" />
        <XAxis dataKey="date" tick={{ fontSize: 11 }} />
        <YAxis domain={[0, 10]} tick={{ fontSize: 11 }} />
        <Tooltip
          content={({ active, payload }) => {
            if (!active || !payload?.length) return null;
            const d = payload[0].payload as { date: string; score: number; field: string };
            return (
              <div className="rounded-md border border-line bg-white p-3 text-xs shadow-sm">
                <p className="font-medium text-ink">{d.field}</p>
                <p className="text-ink-soft">{d.date}</p>
                <p className="font-bold text-primary">{d.score} / 10</p>
              </div>
            );
          }}
        />
        <Line
          type="monotone"
          dataKey="score"
          stroke="#0d7d6a"
          strokeWidth={2}
          dot={{ r: 3, fill: "#0d7d6a" }}
          activeDot={{ r: 5 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
