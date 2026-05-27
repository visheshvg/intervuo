"use client";
import { useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import { redirect } from "next/navigation";
import { api } from "@/lib/api";
import { Navbar } from "@/components/layout/Navbar";
import { Card } from "@/components/ui/Card";
import { ScoreChart } from "@/components/analytics/ScoreChart";
import { SessionHistoryTable } from "@/components/analytics/SessionHistoryTable";
import { scoreColor } from "@/lib/utils";

export default function AnalyticsPage() {
  const { status } = useSession();
  if (status === "unauthenticated") redirect("/login");

  const { data, isLoading } = useQuery({
    queryKey: ["analytics"],
    queryFn: api.analytics.get,
    enabled: status === "authenticated",
  });

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-5xl px-4 py-8">
        <h1 className="mb-6 text-xl font-semibold">Analytics</h1>

        {isLoading || !data ? (
          <p className="text-sm text-gray-400">Loading...</p>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-3 gap-4">
              <Card>
                <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                  Total sessions
                </p>
                <p className="mt-1 text-2xl font-bold">{data.total_sessions}</p>
              </Card>
              <Card>
                <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                  Average score
                </p>
                <p className={`mt-1 text-2xl font-bold ${scoreColor(data.average_score)}`}>
                  {data.average_score.toFixed(1)}
                </p>
              </Card>
              <Card>
                <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                  Best score
                </p>
                <p className={`mt-1 text-2xl font-bold ${scoreColor(data.best_score)}`}>
                  {data.best_score.toFixed(1)}
                </p>
              </Card>
            </div>

            {data.history.length > 1 && (
              <Card padding="lg">
                <h2 className="mb-4 text-sm font-semibold text-gray-700">Score over time</h2>
                <ScoreChart history={data.history} />
              </Card>
            )}

            <Card padding="sm">
              <h2 className="mb-4 px-2 text-sm font-semibold text-gray-700">Session history</h2>
              <SessionHistoryTable history={data.history} />
            </Card>
          </div>
        )}
      </main>
    </>
  );
}
