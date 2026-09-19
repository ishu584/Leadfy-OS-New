import type { Metadata } from "next";
import "./globals.css";
import { AppShell } from "@/components/layout/app-shell";

export const metadata: Metadata = {
  title: "LEADYFY OS — UGC & Digital Marketing Agency Operations SaaS",
  description:
    "Centralized internal operating system managing the complete lifecycle of UGC and digital marketing production.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#0c0c0e] text-zinc-100 antialiased">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
