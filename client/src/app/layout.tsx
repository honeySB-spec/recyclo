import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Recyclo | AI Waste-to-Resource Marketplace',
  description: 'Multimodal AI vision and conversational marketplace for upcycling, recycling, and waste valorization.',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 antialiased">{children}</body>
    </html>
  );
}
