export const metadata = {
  title: 'JesAI Law & Order - Free Legal AI for Bangladesh',
  description: 'AI-powered legal literacy assistant using free APIs',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-gray-50">{children}</body>
    </html>
  );
}