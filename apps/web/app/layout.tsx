import type { Metadata } from "next";
import { Fraunces, Inter, Noto_Sans_Kannada } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-inter",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["500", "600"],
  variable: "--font-fraunces",
});

const kannada = Noto_Sans_Kannada({
  subsets: ["kannada"],
  weight: ["400", "600"],
  variable: "--font-kannada",
});

export const metadata: Metadata = {
  title: "Nations Next Door",
  description: "Who is unreached near you, and what free Scripture exists in their language?",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${fraunces.variable} ${kannada.variable}`}>
      <body style={{ fontFamily: "var(--font-ui)" }}>{children}</body>
    </html>
  );
}
