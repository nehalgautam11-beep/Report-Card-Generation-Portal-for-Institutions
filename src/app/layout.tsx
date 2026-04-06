import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GIS Report Card Portal",
  description: "Global Innovative School Report Card Orchestrator",
  icons: {
    icon: "/gis_logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
