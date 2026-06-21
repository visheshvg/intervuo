import { Volume2 } from "lucide-react";
import { Card } from "@/components/ui/Card";

interface QuestionCardProps {
  question: string;
  index: number;
  total: number;
  onReplay?: () => void;
  speaking?: boolean;
}

export function QuestionCard({ question, index, total, onReplay, speaking }: QuestionCardProps) {
  return (
    <Card>
      <div className="mb-2 flex items-center justify-between">
        <p className="eyebrow text-primary">Question {index + 1} of {total}</p>
        {onReplay && (
          <button
            onClick={onReplay}
            title="Read question aloud"
            className={`flex items-center gap-1 rounded-md px-2 py-1 text-xs transition-colors ${
              speaking ? "text-primary" : "text-ink-soft hover:text-ink"
            }`}
          >
            <Volume2 className={`h-3.5 w-3.5 ${speaking ? "animate-pulse" : ""}`} />
            {speaking ? "Speaking" : "Hear it"}
          </button>
        )}
      </div>
      <p className="text-sm font-medium leading-relaxed text-ink">{question}</p>
      <div className="mt-3 flex gap-1">
        {Array.from({ length: total }).map((_, i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-colors ${
              i < index ? "bg-primary" : i === index ? "bg-primary/50" : "bg-line"
            }`}
          />
        ))}
      </div>
    </Card>
  );
}
