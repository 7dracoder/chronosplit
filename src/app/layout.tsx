import type { Metadata } from "next";
import { Baloo_2, Nunito } from "next/font/google";
import "./globals.css";
import { BoothBackground } from "@/components/booth-ui";

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
});

const baloo = Baloo_2({
  variable: "--font-baloo",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
});

export const metadata: Metadata = {
  title: "ChronoSplit | Discover Your Parallel Self!",
  description:
    "A silly multiverse photo booth! Scan the QR, answer fun questions, meet your parallel you!",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${nunito.variable} ${baloo.variable} antialiased min-h-screen booth-bg`}
      >
        <BoothBackground />
        {children}
      </body>
    </html>
  );
}
