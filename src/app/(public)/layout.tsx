import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { PROJECT_NAME } from "@/lib/constants";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: `${PROJECT_NAME} - Live Streaming & Audio Rooms`,
  description:
    `${PROJECT_NAME} is a premier live streaming and social platform. Join audio rooms, send virtual gifts, and connect with creators worldwide.`,
};

export default function PublicRootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" style={{ colorScheme: "dark" }}>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-[#0a0613] text-white`}
      >
        {children}
      </body>
    </html>
  );
}
