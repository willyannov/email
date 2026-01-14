import type { Metadata } from "next";
import { Roboto } from "next/font/google";
import "./globals.css";

const roboto = Roboto({
  weight: ["400", "500", "700"],
  subsets: ["latin"],
  variable: "--font-roboto",
});

export const metadata: Metadata = {
  title: "Temp Email Service",
  description: "Secure, disposable email addresses",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-theme="material">
      <body className={`${roboto.variable} font-sans bg-base-100 text-base-content min-h-screen`}>
        {children}
      </body>
    </html>
  );
}
