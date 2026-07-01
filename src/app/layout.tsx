import type { Metadata } from "next";
import { Anton, Oswald, Work_Sans } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const workSans = Work_Sans({
  variable: "--font-work-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const anton = Anton({
  variable: "--font-anton",
  subsets: ["latin"],
  weight: "400",
});

const oswald = Oswald({
  variable: "--font-oswald",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Rayz Barbers — Book Online",
  description:
    "Sharp fades and straight razor lines. Book your cut at Rayz Barbers in under a minute.",
  applicationName: "Rayz Barbers",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "32x32" },
      { url: "/icon.png", type: "image/png", sizes: "32x32" },
    ],
    apple: [{ url: "/apple-icon.png", sizes: "180x180", type: "image/png" }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${workSans.variable} ${anton.variable} ${oswald.variable} h-full`}
    >
      <body className="min-h-full bg-background font-sans antialiased">
        {children}
        <Toaster position="bottom-center" richColors />
      </body>
    </html>
  );
}
