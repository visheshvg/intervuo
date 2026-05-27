import { cn } from "@/lib/utils";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  padding?: "sm" | "md" | "lg";
}

export function Card({ className, padding = "md", children, ...props }: CardProps) {
  const padMap = { sm: "p-3", md: "p-4", lg: "p-6" };
  return (
    <div
      className={cn(
        "rounded-xl border border-gray-100 bg-white shadow-sm",
        padMap[padding],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
