"use client";
import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { useRouter } from "next/navigation";
import { UploadCloud, FileCheck } from "lucide-react";
import { api } from "@/lib/api";
import { useInterviewStore } from "@/store/interviewStore";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ResumeInsights } from "@/components/resume/ResumeInsights";
import type { InterviewField, ExperienceLevel, UploadResumeResponse } from "@/types";

const FIELDS: InterviewField[] = [
  "Backend", "Frontend", "Full Stack", "ML / AI", "DevOps", "Mobile", "General",
];
const LEVELS: { value: ExperienceLevel; label: string }[] = [
  { value: "fresher", label: "Fresher (0-1 yr)" },
  { value: "intermediate", label: "Intermediate (2-4 yrs)" },
  { value: "experienced", label: "Experienced (5+ yrs)" },
];

export function ResumeDropzone() {
  const router = useRouter();
  const { setSession } = useInterviewStore();
  const [file, setFile] = useState<File | null>(null);
  const [field, setField] = useState<InterviewField>("General");
  const [level, setLevel] = useState<ExperienceLevel>("intermediate");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<UploadResumeResponse | null>(null);

  const onDrop = useCallback((accepted: File[]) => {
    setFile(accepted[0] ?? null);
    setError(null);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"] },
    maxFiles: 1,
    maxSize: 5 * 1024 * 1024,
    onDropRejected: (rejections) => {
      setError(rejections[0]?.errors[0]?.message ?? "Invalid file.");
    },
  });

  const handleAnalyse = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    try {
      const data = await api.resume.upload(file, field, level);
      setSession(data.session_id, data.questions);
      setResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed.");
    } finally {
      setLoading(false);
    }
  };

  // Step 2: resume analysed, show insights and let them start the interview.
  if (result) {
    return (
      <div className="space-y-4">
        <ResumeInsights data={result} />
        <Button size="full" onClick={() => router.push(`/interview/${result.session_id}`)}>
          Start interview ({result.questions.length} questions)
        </Button>
        <button
          onClick={() => {
            setResult(null);
            setFile(null);
          }}
          className="w-full text-center text-xs text-ink-soft hover:text-ink"
        >
          Upload a different resume
        </button>
      </div>
    );
  }

  // Step 1: upload + options.
  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={`cursor-pointer rounded-lg border-2 border-dashed p-12 text-center transition-colors ${
          isDragActive ? "border-primary bg-primary-light" : "border-line hover:border-ink/30"
        }`}
      >
        <input {...getInputProps()} />
        {file ? (
          <div className="flex flex-col items-center gap-2">
            <FileCheck className="h-8 w-8 text-primary" />
            <p className="text-sm font-medium text-ink">{file.name}</p>
            <p className="text-xs text-primary">
              {(file.size / 1024).toFixed(0)} KB - ready to analyse
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <UploadCloud className="h-8 w-8 text-ink-soft" />
            <p className="text-sm font-medium text-ink">
              {isDragActive ? "Drop it here" : "Drag your resume PDF here, or click to browse"}
            </p>
            <p className="text-xs text-ink-soft">PDF only, max 5 MB</p>
          </div>
        )}
      </div>

      <Card padding="sm" className="grid grid-cols-2 gap-3">
        <div>
          <label className="eyebrow mb-1 block text-ink-soft">Field</label>
          <select
            value={field}
            onChange={(e) => setField(e.target.value as InterviewField)}
            className="w-full rounded-md border border-line bg-white px-3 py-2 text-sm text-ink"
          >
            {FIELDS.map((f) => <option key={f}>{f}</option>)}
          </select>
        </div>
        <div>
          <label className="eyebrow mb-1 block text-ink-soft">Experience level</label>
          <select
            value={level}
            onChange={(e) => setLevel(e.target.value as ExperienceLevel)}
            className="w-full rounded-md border border-line bg-white px-3 py-2 text-sm text-ink"
          >
            {LEVELS.map(({ value, label }) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>
      </Card>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <Button size="full" onClick={handleAnalyse} loading={loading} disabled={!file}>
        {loading ? "Analysing resume..." : "Analyse resume & generate questions"}
      </Button>
    </div>
  );
}
