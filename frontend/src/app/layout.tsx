import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import BottomNav from "@/components/navigation/BottomNav";

import ThemeWrapper from "@/components/theme/ThemeWrapper";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "BondSpace 💖",
  description: "A private digital universe for two people.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} min-h-screen bg-[#080808] text-white selection:bg-rose-500/30 overflow-x-hidden`}>
        <ThemeWrapper>
          <div className="flex flex-col min-h-screen max-w-md mx-auto relative shadow-[0_0_100px_rgba(0,0,0,0.5)] bg-[#080808]">
            {/* Background ambient glow effect restricted to container */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none z-[-1]">
              <div className="absolute top-[-20%] left-[-10%] w-[100%] h-[50%] rounded-full bg-rose-600/10 blur-[120px]" />
              <div className="absolute bottom-[-20%] right-[-10%] w-[100%] h-[50%] rounded-full bg-purple-600/10 blur-[120px]" />
            </div>

            <main className="flex-1 pb-24 relative z-10">
              {children}
            </main>

            <BottomNav />
          </div>
        </ThemeWrapper>
      </body>
    </html>
  );
}
