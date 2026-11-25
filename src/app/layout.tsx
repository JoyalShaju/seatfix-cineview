import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'SeatFix — Luxury 3D Cinema Seat Visualization',
  description:
    'Experience any cinema seat in geometrically accurate first-person 3D before booking your ticket.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[#040406] font-sans text-[#f5f3ee] antialiased selection:bg-[#d4af37]/30 selection:text-[#f8ebc2]">
        {children}
      </body>
    </html>
  );
}
