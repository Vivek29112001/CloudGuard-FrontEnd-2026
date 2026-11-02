import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "New-DhanushGuard",
  description:
    "Read-only cloud infrastructure discovery and evidence intelligence",
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
