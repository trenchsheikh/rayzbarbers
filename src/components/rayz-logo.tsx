"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";

const SIZE_CLASS = {
  sm: "h-12",
  md: "h-[4.5rem]",
  lg: "h-28",
  hero: "h-[clamp(6.5rem,28vw,14rem)]",
} as const;

type RayzLogoProps = {
  className?: string;
  size?: keyof typeof SIZE_CLASS;
  priority?: boolean;
};

export function RayzLogo({
  className,
  size = "md",
  priority,
}: RayzLogoProps) {
  return (
    <div
      className={cn("relative inline-flex shrink-0 items-center", className)}
    >
      <Image
        src="/images/logo-light.png"
        alt="Rayz Barbers"
        width={640}
        height={320}
        priority={priority ?? size === "hero"}
        className={cn("w-auto object-contain", SIZE_CLASS[size])}
      />
    </div>
  );
}
