import { GoogleIcon } from "@/components/icons/social-icons";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export function GoogleReviewsBadge({
  rating,
  totalCount,
  mapsUrl,
  className,
}: {
  rating: number;
  totalCount: number;
  mapsUrl: string;
  className?: string;
}) {
  return (
    <a
      href={mapsUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "inline-flex items-center gap-2.5 rounded-full border border-border/80 bg-background/70 px-4 py-2 text-sm shadow-sm backdrop-blur-sm transition hover:border-rayz-gold/40 hover:shadow-md",
        className,
      )}
    >
      <GoogleIcon className="h-[18px] w-[18px] shrink-0" />
      <span className="flex items-center gap-0.5" aria-hidden>
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            className={cn(
              "h-3.5 w-3.5",
              i < Math.round(rating)
                ? "fill-rayz-gold text-rayz-gold"
                : "fill-muted/40 text-muted/40",
            )}
          />
        ))}
      </span>
      <span className="font-oswald text-base font-semibold leading-none text-foreground">
        {rating.toFixed(1)}
      </span>
      <span className="hidden text-muted-foreground sm:inline">·</span>
      <span className="text-muted-foreground">
        <span className="sm:hidden">{totalCount} reviews</span>
        <span className="hidden sm:inline">{totalCount} Google reviews</span>
      </span>
    </a>
  );
}
