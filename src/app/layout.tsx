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
    "Plataforma oficial da Jornada Acadêmica de Medicina para cadastro, submissão, avaliação e divulgação de trabalhos científicos.",
  icons: {
    icon: "/campgo-logo.png",
    shortcut: "/campgo-logo.png",
    apple: "/campgo-logo.png",
  },
  openGraph: {
    title: "Jornada Acadêmica de Medicina",
    description:
      "Plataforma oficial da Jornada Acadêmica de Medicina para submissão, avaliação e resultados de trabalhos científicos.",
    url: "https://www.ixjornadaacademica.com.br",
    siteName: "Jornada Acadêmica de Medicina",
    images: [
      {
        url: "/logo-ix-jornada.jpg",
        width: 512,
        height: 512,
        alt: "Logo da Jornada Acadêmica de Medicina",
      },
    ],
    locale: "pt_BR",
    type: "website",
  },
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

