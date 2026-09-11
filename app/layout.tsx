import type { Metadata } from "next";
import "./styles.css";

export const metadata: Metadata = {
  title: "MAIRDC Campaign Commander",
  description: "Autonomous multi-brand social advertising command center"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
