import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import { AppVersionWatcher } from "@/components/app-version-watcher";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
});

export const metadata: Metadata = {
  title: "Jornada Acadêmica de Medicina",
  description:
    "Plataforma oficial da Jornada Acadêmica de Medicina para submissão, avaliação e divulgação de trabalhos científicos.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body
        className={`${inter.variable} ${playfair.variable} antialiased`}
      >
        {children}
        <AppVersionWatcher />
      </body>
    </html>
  );
}