import { cn } from "@/lib/utils";

export function GoldButton({
  children,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className={cn(
        "rounded-full bg-rayz-gold px-8 py-4 text-base font-bold text-rayz-dark transition hover:scale-[1.03] hover:shadow-[0_10px_34px_rgba(201,154,60,0.35)] disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
