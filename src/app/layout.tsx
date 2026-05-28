import type { Metadata } from "next";
import { Work_Sans, Space_Mono } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const workSans = Work_Sans({
  variable: "--font-work-sans",
  subsets: ["latin"],
  display: "swap",
});

const spaceMono = Space_Mono({
  variable: "--font-space-mono",
  subsets: ["latin"],
  weight: ["400", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Soberior OS — CRM B2B Autônomo",
  description:
    "Sistema de CRM e Gestão B2B. Gerencie todo o ciclo de vida do cliente: Prospecção, Auditoria, Fechamento, Onboarding e MRR.",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      suppressHydrationWarning
      className={`${workSans.variable} ${spaceMono.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col bg-[#0B1320] text-white">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          forcedTheme="dark"
          disableTransitionOnChange
        >
          {children}
          <Toaster
            position="top-right"
            richColors
            closeButton
            theme="dark"
          />
        </ThemeProvider>
      </body>
    </html>
  );
}
