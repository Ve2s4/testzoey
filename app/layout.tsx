import "@livekit/components-styles";
import { Public_Sans } from "next/font/google";
import "./globals.css";
import { Analytics } from "@vercel/analytics/react"

const publicSans400 = Public_Sans({
  weight: "400",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`h-full ${publicSans400.className}`}>
      <body className="h-full">{children}
        <Analytics />
      </body>
    </html>
  );
}
