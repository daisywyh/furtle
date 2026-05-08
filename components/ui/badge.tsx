import { cn } from "@/lib/utils";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "covered" | "not-covered" | "prior-auth" | "tier" | "default";
  className?: string;
}

export function Badge({ children, variant = "default", className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
        {
          "bg-green-100 text-green-800": variant === "covered",
          "bg-red-100 text-red-800": variant === "not-covered",
          "bg-amber-100 text-amber-800": variant === "prior-auth",
          "bg-blue-100 text-blue-800": variant === "tier",
          "bg-gray-100 text-gray-800": variant === "default",
        },
        className
      )}
    >
      {children}
    </span>
  );
}
