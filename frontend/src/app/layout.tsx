import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import BottomNav from "@/components/navigation/BottomNav";

import ThemeWrapper from "@/components/theme/ThemeWrapper";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "BondSpace 💖",
  description: "A private digital universe for two people.",
  icons: {
    icon: "/logo.svg",
    apple: "/logo.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-[#080808] text-white selection:bg-rose-500/30 overflow-hidden`}>
        <ThemeWrapper>
          <div className="fixed inset-0 flex justify-center bg-[#080808]">
            <div className="w-full h-[100dvh] max-w-md mx-auto relative shadow-[0_0_100px_rgba(0,0,0,0.5)] bg-[#080808] overflow-hidden flex flex-col">
              {/* Background ambient glow effect restricted to container */}
              <div className="absolute inset-0 overflow-hidden pointer-events-none z-[-1]">
                <div className="absolute top-[-25%] left-[-20%] w-[140%] h-[60%] rounded-full blur-[140px] transition-colors duration-1000" style={{ backgroundColor: 'var(--bg-glow-1)' }} />
                <div className="absolute bottom-[-25%] right-[-20%] w-[140%] h-[60%] rounded-full blur-[140px] transition-colors duration-1000" style={{ backgroundColor: 'var(--bg-glow-2)' }} />
              </div>

              <main className="flex-1 flex flex-col relative z-10 overflow-hidden">
                {children}
              </main>

              <BottomNav />
            </div>
          </div>
        </ThemeWrapper>
      </body>
    </html>
  );
}
