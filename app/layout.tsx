import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CampusFlow — AI OS for Student Life",
  description:
    "Paste the chaos. CampusFlow turns WhatsApp dumps, emails and notices into an organized schedule — powered by Amazon Bedrock.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="text-slate-100 antialiased">{children}</body>
    </html>
  );
}
