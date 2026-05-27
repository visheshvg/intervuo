import { Card } from "@/components/ui/Card";

interface QuestionCardProps {
  question: string;
  index: number;
  total: number;
}

export function QuestionCard({ question, index, total }: QuestionCardProps) {
  return (
    <Card>
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-primary">
        Question {index + 1} of {total}
      </p>
      <p className="text-sm font-medium leading-relaxed text-gray-800">{question}</p>
      <div className="mt-3 flex gap-1">
        {Array.from({ length: total }).map((_, i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-colors ${
              i < index
                ? "bg-primary"
                : i === index
                ? "bg-primary/50"
                : "bg-gray-100"
            }`}
          />
        ))}
      </div>
    </Card>
  );
}
