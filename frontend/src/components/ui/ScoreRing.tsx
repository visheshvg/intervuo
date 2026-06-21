import { cn, scoreColor } from "@/lib/utils";

interface ScoreRingProps {
  score: number;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeMap = {
  sm: { outer: "h-12 w-12", text: "text-sm font-bold" },
  md: { outer: "h-16 w-16", text: "text-lg font-bold" },
  lg: { outer: "h-20 w-20", text: "text-xl font-bold" },
};

export function ScoreRing({ score, size = "md", className }: ScoreRingProps) {
  const { outer, text } = sizeMap[size];
  const pct = Math.min(100, (score / 10) * 100);
  const radius = 36;
  const circ = 2 * Math.PI * radius;
  const dash = (pct / 100) * circ;

  return (
    <div className={cn("relative flex items-center justify-center", outer, className)}>
      <svg className="absolute inset-0 -rotate-90" viewBox="0 0 80 80">
        <circle cx="40" cy="40" r={radius} fill="none" stroke="#e5e3db" strokeWidth="6" />
        <circle
          cx="40"
          cy="40"
          r={radius}
          fill="none"
          stroke={score >= 8 ? "#16a34a" : score >= 6 ? "#d97706" : "#dc2626"}
          strokeWidth="6"
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
        />
      </svg>
      <span className={cn(text, scoreColor(score))}>{score.toFixed(1)}</span>
    </div>
  );
}
