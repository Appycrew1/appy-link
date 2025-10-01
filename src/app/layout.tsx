import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Appy Link - UK Moving Suppliers Directory',
  description: 'Find and compare vetted UK moving suppliers. CRM software, equipment rental, insurance, and more for removal companies.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="min-h-screen bg-gray-50">
          <header className="bg-white shadow-sm border-b">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center h-16">
                <div className="flex items-center">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                      <span className="text-white font-bold text-sm">AL</span>
                    </div>
                    <span className="text-xl font-bold text-gray-900">Appy Link</span>
                  </div>
                </div>
                <nav className="hidden md:flex space-x-8">
                  <a href="/" className="text-gray-700 hover:text-gray-900 px-3 py-2 text-sm font-medium">
                    Home
                  </a>
                  <a href="/suppliers" className="text-gray-700 hover:text-gray-900 px-3 py-2 text-sm font-medium">
                    Suppliers
                  </a>
                  <a href="/contact" className="text-gray-700 hover:text-gray-900 px-3 py-2 text-sm font-medium">
                    Contact
                  </a>
                </nav>
              </div>
            </div>
          </header>
          
          <main>{children}</main>
          
          <footer className="bg-gray-900 text-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div>
                  <div className="flex items-center space-x-2 mb-4">
                    <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                      <span className="text-white font-bold text-sm">AL</span>
                    </div>
                    <span className="text-xl font-bold">Appy Link</span>
                  </div>
                  <p className="text-gray-400 text-sm">
                    Connecting UK movers with the best suppliers.
                  </p>
                </div>
                
                <div>
                  <h3 className="font-semibold mb-4">Quick Links</h3>
                  <ul className="space-y-2 text-gray-400 text-sm">
                    <li><a href="/" className="hover:text-white">Home</a></li>
                    <li><a href="/suppliers" className="hover:text-white">Suppliers</a></li>
                    <li><a href="/contact" className="hover:text-white">Contact</a></li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="font-semibold mb-4">Contact</h3>
                  <p className="text-gray-400 text-sm">
                    Email: hello@appylink.co.uk<br />
                    Phone: +44 20 1234 5678
                  </p>
                </div>
              </div>
              
              <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400 text-sm">
                <p>&copy; 2024 Appy Link. All rights reserved.</p>
              </div>
            </div>
          </footer>
        </div>
      </body>
    </html>
  )
}
