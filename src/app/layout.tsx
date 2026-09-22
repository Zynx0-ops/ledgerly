import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/nav/Sidebar";
import { uncategorizedCount } from "@/server/queries";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Ledgerly — spending, budgets, and goals",
  description:
    "A private, local-first budgeting app: import your spending, set a budget you can actually keep, and watch your goals fill up.",
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
      <body className={`${inter.variable} antialiased`}>
        <Sidebar uncategorized={uncategorized} />
        <main className="min-h-screen md:pl-60">
          <div className="mx-auto w-full max-w-[1180px] px-4 py-6 pt-14 sm:px-6 md:py-8 md:pt-8">
            {children}
          </div>
        </main>
      </body>
    </html>
  );
}
