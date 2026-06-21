"use client";
import { useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import { redirect } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { Navbar } from "@/components/layout/Navbar";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ResumeDropzone } from "@/components/resume/ResumeDropzone";
import { formatDate, scoreColor } from "@/lib/utils";

export default function DashboardPage() {
  const { data: session, status } = useSession();

  if (status === "unauthenticated") redirect("/login");

  const { data: sessions, isLoading } = useQuery({
    queryKey: ["sessions"],
    queryFn: api.session.list,
    enabled: status === "authenticated",
  });

  const { data: analytics } = useQuery({
    queryKey: ["analytics"],
    queryFn: api.analytics.get,
    enabled: status === "authenticated",
  });

  const firstName = session?.user?.name?.split(" ")[0] ?? "there";

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-5xl px-4 py-8">
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-xl font-semibold">Good to see you, {firstName}</h1>
            <p className="mt-1 text-sm text-gray-400">
              Upload a resume below to start a new interview session.
            </p>
          </div>
        </div>

        {analytics && (
          <div className="mb-8 grid grid-cols-3 gap-4">
            <Card>
              <p className="eyebrow text-ink-soft">Sessions</p>
              <p className="mt-1 text-2xl font-bold">{analytics.total_sessions}</p>
            </Card>
            <Card>
              <p className="eyebrow text-ink-soft">Avg score</p>
              <p className={`mt-1 text-2xl font-bold ${scoreColor(analytics.average_score)}`}>
                {analytics.average_score.toFixed(1)}
              </p>
            </Card>
            <Card>
              <p className="eyebrow text-ink-soft">Best score</p>
              <p className={`mt-1 text-2xl font-bold ${scoreColor(analytics.best_score)}`}>
                {analytics.best_score.toFixed(1)}
              </p>
            </Card>
          </div>
        )}

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          <div>
            <h2 className="mb-4 eyebrow text-ink-soft">Start new interview</h2>
            <Card padding="lg">
              <ResumeDropzone />
            </Card>
          </div>

          <div>
            <h2 className="mb-4 eyebrow text-ink-soft">Recent sessions</h2>
            {isLoading ? (
              <p className="text-sm text-gray-400">Loading...</p>
            ) : !sessions?.length ? (
              <Card>
                <p className="py-6 text-center text-sm text-gray-400">
                  No sessions yet. Upload your resume to begin.
                </p>
              </Card>
            ) : (
              <div className="space-y-2">
                {sessions.slice(0, 5).map((s) => (
                  <Card key={s.id} padding="sm" className="flex items-center gap-3">
                    <div className="flex-1">
                      <p className="text-sm font-medium">{s.field}</p>
                      <p className="text-xs text-gray-400">
                        {s.experience_level} &middot; {formatDate(s.created_at)}
                      </p>
                    </div>
                    {s.total_score != null ? (
                      <span className={`text-sm font-bold ${scoreColor(s.total_score)}`}>
                        {s.total_score.toFixed(1)}
                      </span>
                    ) : (
                      <Badge variant="amber">Incomplete</Badge>
                    )}
                    <Link href={`/report/${s.id}`} className="text-xs text-primary hover:underline">
                      Review
                    </Link>
                  </Card>
                ))}
                {sessions.length > 5 && (
                  <Link href="/analytics" className="block text-center text-xs text-primary hover:underline">
                    View all {sessions.length} sessions
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
