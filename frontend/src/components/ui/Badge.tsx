import { cn } from "@/lib/utils";

type BadgeVariant = "green" | "amber" | "red" | "purple" | "gray";

const variantMap: Record<BadgeVariant, string> = {
  green: "bg-green-50 text-green-700",
  amber: "bg-amber-50 text-amber-700",
  red: "bg-red-50 text-red-600",
  purple: "bg-primary-light text-primary",
  gray: "bg-gray-100 text-gray-600",
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
        variantMap[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
