import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "MailBlast — Send Emails to Multiple Recipients",
  description:
    "A modern, flexible email sender. Compose and send HTML or plain-text emails to any number of recipients instantly.",
  keywords: ["email", "bulk email", "newsletter", "email sender", "html email"],
  openGraph: {
    title: "MailBlast",
    description: "Modern email sender for multiple recipients",
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
