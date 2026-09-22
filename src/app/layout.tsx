import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Sidebar } from "@/components/nav/Sidebar";
import { uncategorizedCount } from "@/server/queries";

export const metadata: Metadata = {
  title: "Ledgerly — spending, budgets, and goals",
  description:
    "A private, local-first budgeting app: import your spending, set a budget you can actually keep, and watch your goals fill up.",
  appleWebApp: { capable: true, title: "Ledgerly", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f2f2f7" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
  ],
  viewportFit: "cover",
};

/** Applied before first paint so a dark-mode reload never flashes white. */
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
        <Sidebar uncategorized={uncategorized} />
        <main className="min-h-screen md:pl-[228px]">
          <div className="mx-auto w-full max-w-[1120px] px-4 py-6 pt-14 sm:px-7 md:py-9 md:pt-9">
            {children}
          </div>
        </main>
      </body>
    </html>
  );
}
