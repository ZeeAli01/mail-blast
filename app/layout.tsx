import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Campaign SaaS — Public Demo",
  description:
    "A non-sending preview of a permission-based campaign product in development.",
  keywords: ["email campaigns", "campaign composer", "newsletter preview"],
  openGraph: {
    title: "Campaign SaaS Public Demo",
    description: "Permission-based campaign product in development",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} antialiased bg-[#070711]`}>
        {children}
      </body>
    </html>
  );
}
