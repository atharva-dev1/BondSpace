import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import BottomNav from "@/components/navigation/BottomNav";
import ThemeWrapper from "@/components/theme/ThemeWrapper";
import OTABootstrap from "@/components/OTABootstrap";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "BondSpace",
  description: "A private digital universe for two people.",
  icons: {
    icon: "/icon.png",
    apple: "/icon.png",
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
          {/* OTA Auto-Update (runs only in native Capacitor APK) */}
          <OTABootstrap />
          {/* Wrapper for Desktop Background vs Mobile Center */}
          <div className="fixed inset-0 flex justify-center bg-[#050505] overflow-hidden lg:bg-[url('/desktop-bg.jpeg')] lg:bg-cover lg:bg-center lg:backdrop-blur-3xl">
            {/* Desktop ambient blur overlay */}
            <div className="hidden lg:block absolute inset-0 bg-black/60 backdrop-blur-3xl z-0" />

            {/* Main App Container */}
            <div className="w-full h-[100dvh] max-w-lg lg:max-w-xl mx-auto relative shadow-[0_0_150px_rgba(0,0,0,0.8)] bg-[#080808]/90 lg:bg-[#080808]/80 lg:backdrop-blur-xl lg:border-x lg:border-white/5 overflow-hidden flex flex-col z-10">

              {/* Background ambient glow effect restricted to container */}
              <div className="absolute inset-0 overflow-hidden pointer-events-none z-[-1] opacity-70">
                {/* Partner Mood Aura (Central Pulsating Glow) */}
                <div
                  className="absolute inset-[-20%] rounded-full blur-[160px] transition-all duration-1000 opacity-80 mix-blend-screen animate-pulse"
                  style={{ backgroundColor: 'var(--partner-aura)' }}
                />

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
