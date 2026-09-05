import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Deepak Industrial Services — Payslip Generator',
  description: 'Compact Indian payslip generator',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link
          rel="icon"
          type="image/png"
          href="/favicon.png"
        />
      </head>

      <body>{children}</body>
    </html>
  );
}