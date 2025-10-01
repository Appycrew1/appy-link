import { createClient } from '@/lib/supabase'
import { Search, Filter, ExternalLink } from 'lucide-react'

async function getSuppliers() {
  const supabase = createClient()
  
  const { data: suppliers } = await supabase
    .from('providers')
    .select(`
      *,
      category:categories(*)
    `)
    .eq('is_active', true)
    .order('is_featured', { ascending: false })
    .order('name')
  
  return suppliers || []
}

async function getCategories() {
  const supabase = createClient()
  
  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .order('sort_order')
  
  return categories || []
}

export default async function SuppliersPage() {
  const [suppliers, categories] = await Promise.all([
    getSuppliers(),
    getCategories()
  ])

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Page Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              UK Moving Suppliers Directory
            </h1>
            <p className="mt-4 text-lg text-gray-600">
              Find and compare {suppliers.length} vetted suppliers for your removal business
            </p>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search Bar */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search suppliers, services, or features..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            {/* Category Filter */}
            <div className="relative">
              <select className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-8 focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                <option value="">All Categories</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.label}
                  </option>
                ))}
              </select>
              <Filter className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            </div>
            
            {/* Search Button */}
            <button className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors">
              Search
            </button>
          </div>
        </div>

        {/* Results Summary */}
        <div className="mb-6">
          <p className="text-gray-600">
            Showing {suppliers.length} suppliers
          </p>
        </div>

        {/* Suppliers Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {suppliers.map((supplier) => (
            <div key={supplier.id} className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow">
              <div className="p-6">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      {supplier.logo_url ? (
                        <img 
                          src={supplier.logo_url} 
                          alt={supplier.name}
                          className="w-10 h-10 rounded-lg object-cover"
                        />
                      ) : (
                        <span className="text-blue-600 font-semibold text-sm">
                          {supplier.name.charAt(0)}
                        </span>
                      )}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{supplier.name}</h3>
                      <p className="text-sm text-gray-500">{supplier.category?.label}</p>
                    </div>
                  </div>
                  {supplier.is_featured && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                      Featured
                    </span>
                  )}
                </div>

                {/* Tags */}
                {supplier.tags && supplier.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {supplier.tags.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                      >
                        {tag}
                      </span>
                    ))}
                    {supplier.tags.length > 3 && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        +{supplier.tags.length - 3}
                      </span>
                    )}
                  </div>
                )}

                {/* Description */}
                <p className="text-gray-600 mb-4 text-sm leading-relaxed">
                  {supplier.summary}
                </p>

                {/* Actions */}
                <div className="flex items-center justify-between">
                  {supplier.website ? (
                    <a
                      href={supplier.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium text-sm"
                    >
                      Visit Website
                      <ExternalLink className="ml-1 h-4 w-4" />
                    </a>
                  ) : (
                    <span className="text-gray-400 text-sm">No website available</span>
                  )}
                  <button className="text-gray-400 hover:text-gray-600">
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {suppliers.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No suppliers found.</p>
            <p className="text-gray-400">Try adjusting your search criteria.</p>
          </div>
        )}
      </div>
    </div>
  )
}
