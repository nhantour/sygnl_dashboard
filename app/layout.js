import './globals.css'

export const metadata = {
  title: 'SYGNL Dashboard',
  description: 'Market Intelligence for Trading Agents',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#050505] text-white min-h-screen antialiased">
        {children}
      </body>
    </html>
  )
}