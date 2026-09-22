import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Sidebar } from "@/components/nav/Sidebar";
import { uncategorizedCount } from "@/server/queries";

export const metadata: Metadata = {
  title: "Ledgerly — spending, budgets, and goals",
  description:
    "A private, local-first budgeting app: import your spending, set a budget you can actually keep, and watch your goals fill up.",
  appleWebApp: { capable: true, title: "Ledgerly", statusBarStyle: "black-translucent" },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ede8dc" },
    { media: "(prefers-color-scheme: dark)", color: "#08080a" },
  ],
  viewportFit: "cover",
};

/** Applied before first paint so a theme reload never flashes the wrong ground. */
const THEME_SCRIPT = `try{var t=localStorage.getItem("ledgerly-theme");if(t&&t!=="system")document.documentElement.setAttribute("data-theme",t)}catch(e){}`;

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const uncategorized = uncategorizedCount();

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body className="antialiased">
        {/* Soft orbs, then a fine grain over them — the ground the glass sits on. */}
        <div className="atmosphere" aria-hidden>
          <div className="grain" />
        </div>

        <Sidebar uncategorized={uncategorized} />
        <main className="relative z-10 min-h-screen md:pl-[232px]">
          <div className="mx-auto w-full max-w-[1120px] px-4 py-6 pt-16 sm:px-7 md:py-10 md:pt-10">
            {children}
          </div>
        </main>
      </body>
    </html>
  );
}
