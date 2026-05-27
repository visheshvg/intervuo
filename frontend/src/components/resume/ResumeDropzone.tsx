"use client";
import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { useRouter } from "next/navigation";
import { UploadCloud, FileCheck } from "lucide-react";
import { api } from "@/lib/api";
import { useInterviewStore } from "@/store/interviewStore";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import type { InterviewField, ExperienceLevel } from "@/types";

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
      const reason = rejections[0]?.errors[0]?.message ?? "Invalid file.";
      setError(reason);
    },
  });

  const handleStart = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    try {
      const data = await api.resume.upload(file, field, level);
      setSession(data.session_id, data.questions);
      router.push(`/interview/${data.session_id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed.");
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={`cursor-pointer rounded-xl border-2 border-dashed p-12 text-center transition-colors ${
          isDragActive
            ? "border-primary bg-primary-light"
            : "border-gray-200 hover:border-gray-300"
        }`}
      >
        <input {...getInputProps()} />
        {file ? (
          <div className="flex flex-col items-center gap-2">
            <FileCheck className="h-8 w-8 text-green-500" />
            <p className="text-sm font-medium text-gray-800">{file.name}</p>
            <p className="text-xs text-green-600">
              {(file.size / 1024).toFixed(0)} KB - ready to upload
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <UploadCloud className="h-8 w-8 text-gray-400" />
            <p className="text-sm font-medium text-gray-700">
              {isDragActive ? "Drop it here" : "Drag your resume PDF here, or click to browse"}
            </p>
            <p className="text-xs text-gray-400">PDF only, max 5 MB</p>
          </div>
        )}
      </div>

      <Card padding="sm" className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500">Field</label>
          <select
            value={field}
            onChange={(e) => setField(e.target.value as InterviewField)}
            className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm"
          >
            {FIELDS.map((f) => <option key={f}>{f}</option>)}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500">Experience level</label>
          <select
            value={level}
            onChange={(e) => setLevel(e.target.value as ExperienceLevel)}
            className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm"
          >
            {LEVELS.map(({ value, label }) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>
      </Card>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <Button size="full" onClick={handleStart} loading={loading} disabled={!file}>
        {loading ? "Analysing resume..." : "Generate questions & start interview"}
      </Button>
    </div>
  );
}
