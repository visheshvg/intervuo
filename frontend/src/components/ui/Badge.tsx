import { cn } from "@/lib/utils";

type BadgeVariant = "green" | "amber" | "red" | "accent" | "gray";

const variantMap: Record<BadgeVariant, string> = {
  green: "bg-green-50 text-green-700 ring-1 ring-inset ring-green-600/15",
  amber: "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/15",
  red: "bg-red-50 text-red-600 ring-1 ring-inset ring-red-600/15",
  accent: "bg-primary-light text-primary ring-1 ring-inset ring-primary/15",
  gray: "bg-ink/5 text-ink-soft ring-1 ring-inset ring-ink/10",
};

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
}

export function Badge({ variant = "gray", children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-block rounded-full px-2.5 py-0.5 text-xs font-medium",
        "tracking-tight",
        variantMap[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
