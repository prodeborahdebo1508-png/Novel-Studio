import './globals.css';

export const metadata = {
  title: 'Novel Studio 🎀',
  description: 'Autoren-Studio im Hello-Kitty-Stil',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Novel Studio',
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }) {
  return (
    <html lang="de">
      <body>{children}</body>
    </html>
  );
}
