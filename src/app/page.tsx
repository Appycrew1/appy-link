import Link from 'next/link'
import { ArrowRight, Star, Shield, Users } from 'lucide-react'

export default function HomePage() {
  const featuredSuppliers = [
    {
      id: 1,
      name: "MoveMan",
      category: "Software & CRM",
      description: "UK removals CRM for quoting, planning and storage.",
      website: "https://www.movemanpro.com",
      featured: true
    },
    {
      id: 2,
      name: "Moneypenny",
      category: "Sales Solutions", 
      description: "Call answering & live chat for removals firms.",
      website: "https://www.moneypenny.com/uk",
      featured: true
    },
    {
      id: 3,
      name: "Basil Fry & Company",
      category: "Insurance",
      description: "Specialist insurance for removals & storage.", 
      website: "https://basilfry.co.uk",
      featured: true
    }
  ]

  const categories = [
    { name: "Moving Software & CRM", count: 12, icon: Users },
    { name: "Sales Solutions", count: 8, icon: Star },
    { name: "Insurance", count: 6, icon: Shield },
    { name: "Equipment & Supplies", count: 15, icon: Users },
  ]

  return (
    <div className="bg-white">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-b from-blue-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
              Find the best suppliers for your{' '}
              <span className="text-blue-600">moving business</span>
            </h1>
            <p className="mt-6 text-lg leading-8 text-gray-600 max-w-2xl mx-auto">
              Connect with vetted UK suppliers offering CRM software, equipment rental, 
              insurance, and more. Compare options, read reviews, and get exclusive discounts.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Link
                href="/suppliers"
                className="rounded-md bg-blue-600 px-6 py-3 text-base font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
              >
                Browse Suppliers
                <ArrowRight className="ml-2 h-4 w-4 inline" />
              </Link>
              <Link
                href="/contact"
                className="text-base font-semibold leading-6 text-gray-900 hover:text-gray-700"
              >
                Contact Us <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="bg-white py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl lg:max-w-none">
            <div className="text-center">
              <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                Trusted by the UK moving industry
              </h2>
              <p className="mt-4 text-lg leading-8 text-gray-600">
                Join hundreds of removal companies who use our platform to find suppliers
              </p>
            </div>
            <dl className="mt-16 grid grid-cols-1 gap-0.5 overflow-hidden rounded-2xl text-center sm:grid-cols-2 lg:grid-cols-4">
              <div className="flex flex-col bg-gray-400/5 p-8">
                <dt className="text-sm font-semibold leading-6 text-gray-600">Active Suppliers</dt>
                <dd className="order-first text-3xl font-bold tracking-tight text-gray-900">1,200+</dd>
              </div>
              <div className="flex flex-col bg-gray-400/5 p-8">
                <dt className="text-sm font-semibold leading-6 text-gray-600">UK Moving Companies</dt>
                <dd className="order-first text-3xl font-bold tracking-tight text-gray-900">500+</dd>
              </div>
              <div className="flex flex-col bg-gray-400/5 p-8">
                <dt className="text-sm font-semibold leading-6 text-gray-600">Average Rating</dt>
                <dd className="order-first text-3xl font-bold tracking-tight text-gray-900">4.8/5</dd>
              </div>
              <div className="flex flex-col bg-gray-400/5 p-8">
                <dt className="text-sm font-semibold leading-6 text-gray-600">Total Savings</dt>
                <dd className="order-first text-3xl font-bold tracking-tight text-gray-900">£2.5M+</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>

      {/* Featured Suppliers */}
      <div className="bg-gray-50 py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Featured Suppliers
            </h2>
            <p className="mt-4 text-lg leading-8 text-gray-600">
              Hand-picked suppliers trusted by UK removal companies
            </p>
          </div>
          <div className="mx-auto mt-16 grid max-w-2xl grid-cols-1 gap-6 sm:mt-20 lg:mx-0 lg:max-w-none lg:grid-cols-3">
            {featuredSuppliers.map((supplier) => (
              <div key={supplier.id} className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-900/5 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <span className="text-blue-600 font-semibold text-sm">
                      {supplier.name.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{supplier.name}</h3>
                    <p className="text-sm text-gray-500">{supplier.category}</p>
                  </div>
                </div>
                <p className="text-gray-600 mb-4">{supplier.description}</p>
                <a
                  href={supplier.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-blue-600 hover:text-blue-500 font-medium text-sm"
                >
                  Visit Website
                  <ArrowRight className="ml-1 h-4 w-4" />
                </a>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Categories */}
      <div className="bg-white py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Browse by Category
            </h2>
            <p className="mt-4 text-lg leading-8 text-gray-600">
              Find suppliers across all aspects of your moving business
            </p>
          </div>
          <div className="mx-auto mt-16 grid max-w-2xl grid-cols-1 gap-6 sm:mt-20 lg:mx-0 lg:max-w-none lg:grid-cols-2">
            {categories.map((category) => {
              const Icon = category.icon
              return (
                <Link
                  key={category.name}
                  href="/suppliers"
                  className="group relative flex items-center gap-6 rounded-2xl bg-gray-50 p-6 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-600 text-white">
                    <Icon className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600">
                      {category.name}
                    </h3>
                    <p className="text-gray-600">{category.count} suppliers available</p>
                  </div>
                  <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-blue-600" />
                </Link>
              )
            })}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-blue-600">
        <div className="px-6 py-24 sm:px-6 sm:py-32 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Ready to grow your moving business?
            </h2>
            <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-blue-100">
              Join hundreds of UK removal companies who trust Appy Link to find 
              the best suppliers and services for their business.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Link
                href="/suppliers"
                className="rounded-md bg-white px-6 py-3 text-base font-semibold text-blue-600 shadow-sm hover:bg-blue-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                Browse Suppliers
              </Link>
              <Link
                href="/contact"
                className="text-base font-semibold leading-6 text-white hover:text-blue-100"
              >
                Contact Us <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
