export const metadata = {
  title: 'SYGNL Dashboard',
  description: 'Market Intelligence for Trading Agents',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark">
      <body className="bg-background text-zinc-100 min-h-screen antialiased">
        {children}
      </body>
    </html>
  )
}