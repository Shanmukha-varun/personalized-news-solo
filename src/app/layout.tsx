// src/app/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google"; // Or any other font you prefer
import "./globals.css"; // Make sure Tailwind base styles are imported

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "AI News Brief | Summarizer",
  description: "Get AI-powered news summaries quickly and discover related content.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-gray-900 antialiased`}> {/* Added antialiased for smoother fonts */}
        {children}
      </body>
    </html>
  );
}