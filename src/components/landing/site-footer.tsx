import Link from "next/link";
import type { ReactNode } from "react";
import {
  InstagramIcon,
  PhoneIcon,
  SnapchatIcon,
  WhatsAppIcon,
} from "@/components/icons/social-icons";
import { RayzLogo } from "@/components/rayz-logo";
import { SHOP_INFO } from "@/lib/shop";
import { cn } from "@/lib/utils";

const socialLinkClass =
  "flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border text-muted-foreground transition hover:border-rayz-gold/40 hover:text-rayz-gold";

const socialIconClass = "h-5 w-5 shrink-0";

function SocialLink({
  href,
  label,
  children,
  external = false,
}: {
  href: string;
  label: string;
  children: ReactNode;
  external?: boolean;
}) {
  const className = cn(socialLinkClass);
  if (external) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
        aria-label={label}
      >
        {children}
      </a>
    );
  }
  return (
    <a href={href} className={className} aria-label={label}>
      {children}
    </a>
  );
}

export function SiteFooter() {
  return (
    <footer className="mx-auto max-w-5xl border-t border-border px-6 py-12 pb-36 text-center">
      <RayzLogo size="lg" className="mx-auto" />
      <div className="mt-4 flex flex-wrap justify-center gap-3">
        <SocialLink href={`tel:${SHOP_INFO.phone}`} label="Call Rayz Barbers">
          <PhoneIcon className={socialIconClass} />
        </SocialLink>
        <SocialLink
          href={SHOP_INFO.instagram}
          label="Instagram @rayzbarbers"
          external
        >
          <InstagramIcon className={socialIconClass} />
        </SocialLink>
        <SocialLink
          href={SHOP_INFO.snapchat}
          label="Snapchat @rayzbarbers"
          external
        >
          <SnapchatIcon className={socialIconClass} />
        </SocialLink>
        <SocialLink
          href={SHOP_INFO.whatsapp}
          label="WhatsApp Rayz Barbers"
          external
        >
          <WhatsAppIcon className={socialIconClass} />
        </SocialLink>
      </div>
      <p className="mt-5 text-xs text-muted-foreground/80">
        © {new Date().getFullYear()} Rayz Barbers
      </p>
      <Link
        href="/admin"
        className="mt-3 inline-block text-[10px] font-semibold tracking-widest text-muted-foreground/70 hover:text-rayz-gold"
      >
        Barber Dashboard →
      </Link>
    </footer>
  );
}
