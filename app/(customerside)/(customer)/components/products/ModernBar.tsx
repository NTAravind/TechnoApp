'use client'
import { Suspense } from "react"
import { useState, useEffect, useRef, useCallback } from "react"
import { Search, X, SlidersHorizontal } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { getSearchSuggestions } from "@/lib/cache"
import { useDebounce } from "@/hooks/UseDebounce"
import Image from "next/image"

interface SearchBarProps {
  onSearch?: (query: string) => void
  categories?: Category[]
  currentCategory?: string
  variant?: 'outlined' | 'default'
}

interface Product {
  id: number
  name: string
  imgurl: string | null
  weight?: string | null
  unit: string
  price: number
  category: {
    id: number
    name: string
  }
}

interface Category {
  id: number
  name: string
  _count: {
    products: number
  }
}

interface SearchSuggestions {
  products: Product[]
  categories: Category[]
  weights: string[]
  units: string[]
}

// Loading fallback
const SearchFallback = ({ variant }: { variant?: 'outlined' | 'default' }) => {
  return (
    <div className="flex items-center gap-3 w-full">
      <div className="relative flex-1">
        <div className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 bg-gray-300 rounded animate-pulse" />
        <div className={`w-full h-12 rounded-2xl animate-pulse ${
          variant === 'outlined' 
            ? 'bg-white border border-gray-200' 
            : 'bg-gray-100'
        }`} />
      </div>
      <div className={`h-12 w-12 rounded-xl animate-pulse ${
        variant === 'outlined'
          ? 'bg-[#16a34a]'
          : 'bg-gray-100'
      }`} />
    </div>
  )
}

// Product suggestion item
const ProductItem = ({ product, onClick }: {
  product: Product
  onClick: (name: string) => void
}) => {
  const [imageError, setImageError] = useState(false)

  const handleImageError = () => {
    setImageError(true)
  }

  const hasValidImage = product.imgurl && product.imgurl.trim() !== '' && !imageError

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(price)
  }

  return (
    <button
      onClick={() => onClick(product.name)}
      className="w-full p-3 flex items-center gap-3 hover:bg-gray-50 rounded-xl text-left transition-all duration-200 group"
    >
      <div className="w-12 h-12 flex-shrink-0 rounded-xl overflow-hidden bg-gray-100 relative">
        {hasValidImage ? (
          <Image
            src={product.imgurl!}
            alt={product.name}
            width={48}
            height={48}
            className="w-full h-full object-cover"
            onError={handleImageError}
            placeholder="blur"
            blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkrHB0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAQIAEQMhkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyLDSEIuPk4v"
            unoptimized={false}
            priority={false}
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-100">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-gray-900 group-hover:text-gray-700 truncate text-sm transition-colors duration-200">
          {product.name}
        </p>
        <p className="text-xs text-gray-500 mt-0.5">{product.category.name}</p>
        <div className="flex items-center gap-1.5 mt-1">
          <p className="text-sm font-semibold text-gray-900">
            {formatPrice(product.price)}
          </p>
          {product.weight && (
            <span className="text-xs text-gray-500">
              {product.weight} {product.unit}
            </span>
          )}
        </div>
      </div>
    </button>
  )
}

// Simple suggestion item
const SuggestionItem = ({ item, onClick, type }: {
  item: string | Category
  onClick: (name: string) => void
  type?: 'category' | 'weight' | 'unit'
}) => {
  const name = typeof item === 'string' ? item : item.name

  return (
    <button
      onClick={() => onClick(name)}
      className="w-full px-3 py-2.5 text-left text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-xl transition-all duration-200 flex items-center gap-3 group"
    >
      <div className="w-6 h-6 flex-shrink-0 rounded-lg bg-gray-100 group-hover:bg-gray-200 flex items-center justify-center transition-colors duration-200">
        <Search className="h-3.5 w-3.5 text-gray-500 transition-colors duration-200" />
      </div>
      <span className="truncate font-medium">{name}</span>
      {type && (
        <span className="text-xs text-gray-400 ml-auto capitalize font-medium">{type}</span>
      )}
    </button>
  )
}

// Category filter item
const CategoryFilterItem = ({ category, isActive, onClick, totalProducts }: {
  category?: Category
  isActive: boolean
  onClick: () => void
  totalProducts?: number
}) => {
  const name = category?.name || 'All Categories'
  const count = category?._count.products || totalProducts || 0

  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center justify-between p-4 rounded-xl text-left transition-all duration-200 ${
        isActive
          ? 'bg-gray-100 text-gray-900'
          : 'bg-white text-gray-700 hover:bg-gray-50'
      }`}
    >
      <span className="font-medium truncate">{name}</span>
      <span className={`text-sm px-2 py-1 rounded-lg flex-shrink-0 ml-3 ${
        isActive
          ? 'bg-gray-200 text-gray-700'
          : 'bg-gray-100 text-gray-600'
      }`}>
        {count}
      </span>
    </button>
  )
}

// Main search component
function SearchComponent({ onSearch, categories, currentCategory, variant = 'default' }: SearchBarProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [searchQuery, setSearchQuery] = useState(() => searchParams.get('search') || '')
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [suggestions, setSuggestions] = useState<SearchSuggestions>({
    products: [],
    categories: [],
    weights: [],
    units: []
  })
  const [isLoading, setIsLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const searchContainerRef = useRef<HTMLDivElement>(null)
  const filterContainerRef = useRef<HTMLDivElement>(null)
  const debouncedQuery = useDebounce(searchQuery, 300)

  const handleSearch = useCallback((query: string) => {
    const params = new URLSearchParams(searchParams)
    if (query.trim()) {
      params.set('search', query.trim())
    } else {
      params.delete('search')
    }
    const targetPath = pathname === '/products' ? '/products' : '/products'
    router.push(`${targetPath}?${params.toString()}`)
    onSearch?.(query)
    setIsSearchOpen(false)
  }, [router, pathname, searchParams, onSearch])

  const clearSearch = useCallback(() => {
    setSearchQuery('')
    const params = new URLSearchParams(searchParams)
    params.delete('search')
    const targetPath = pathname === '/products' ? '/products' : '/products'
    router.push(`${targetPath}?${params.toString()}`)
    onSearch?.('')
  }, [router, pathname, searchParams, onSearch])

  const handleSuggestionClick = useCallback((suggestion: string) => {
    setSearchQuery(suggestion)
    handleSearch(suggestion)
  }, [handleSearch])

  const handleCategoryChange = useCallback((categoryId: string) => {
    const params = new URLSearchParams(searchParams)
    
    if (categoryId === 'all') {
      params.delete('category')
    } else {
      params.set('category', categoryId)
    }
    
    // Reset to first page when changing category
    params.delete('page')
    
    router.push(`/products?${params.toString()}`)
    setIsFilterOpen(false)
  }, [router, searchParams])

  const getCurrentCategoryName = () => {
    if (!currentCategory || currentCategory === 'all') return 'All Categories'
    const category = categories?.find(cat => cat.id.toString() === currentCategory)
    return category?.name || 'All Categories'
  }

  const totalProducts = categories?.reduce((sum, cat) => sum + cat._count.products, 0) || 0

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (debouncedQuery.trim().length < 2) {
        setSuggestions({ products: [], categories: [], weights: [], units: [] })
        return
      }

      setIsLoading(true)
      try {
        const results = await getSearchSuggestions(debouncedQuery)
        setSuggestions(results)
      } catch (error) {
        console.error('Search error:', error)
        setSuggestions({ products: [], categories: [], weights: [], units: [] })
      } finally {
        setIsLoading(false)
      }
    }

    if (isSearchOpen) {
      fetchSuggestions()
    }
  }, [debouncedQuery, isSearchOpen])

  useEffect(() => {
    if (!isSearchOpen) return

    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setIsSearchOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isSearchOpen])

  useEffect(() => {
    if (!isFilterOpen) return

    const handleClickOutside = (event: MouseEvent) => {
      if (filterContainerRef.current && !filterContainerRef.current.contains(event.target as Node)) {
        setIsFilterOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isFilterOpen])

  return (
    <div className="flex items-center gap-3 w-full">
      {/* Search Input */}
      <div ref={searchContainerRef} className="relative flex-1">
        <div className="relative bg-white rounded-md" style={{backgroundColor: '#ffffff', colorScheme: 'light'}}>
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" style={{color: '#9ca3af'}} />
          <Input
            ref={inputRef}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setIsSearchOpen(true)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch(searchQuery)}
            placeholder="Search products..."
            className={`w-full h-12 pl-12 pr-12 text-base rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-200 focus:shadow-md transition-all duration-200 font-medium text-gray-900 placeholder:text-gray-400 placeholder:font-normal ${
              variant === 'outlined'
                ? 'border border-gray-200 bg-white'
                : 'border-0 bg-white'
            }`}
            style={{backgroundColor: '#ffffff', color: '#111827', colorScheme: 'light'}}
          />
          {searchQuery && (
            <Button
              onClick={clearSearch}
              variant="ghost"
              size="sm"
              className="absolute right-3 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Search Suggestions Dropdown */}
        {isSearchOpen && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-lg border border-gray-100 z-50 max-h-96 overflow-y-auto" style={{backgroundColor: '#ffffff', colorScheme: 'light'}}>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-2 border-gray-200 border-t-gray-600" />
              </div>
            ) : searchQuery.trim().length < 2 ? (
              <div className="p-6 text-center text-gray-500 text-sm font-medium">
                Start typing to search...
              </div>
            ) : (
              <div className="p-4">
                {suggestions.products.length > 0 && (
                  <div className="mb-4">
                    <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100 mb-3">
                      Products
                    </div>
                    <div className="space-y-1">
                      {suggestions.products.slice(0, 5).map((product) => (
                        <ProductItem
                          key={product.id}
                          product={product}
                          onClick={handleSuggestionClick}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {suggestions.categories.length > 0 && (
                  <div className="mb-4">
                    <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100 mb-3">
                      Categories
                    </div>
                    <div className="space-y-1">
                      {suggestions.categories.slice(0, 3).map((category) => (
                        <SuggestionItem
                          key={category.id}
                          item={category}
                          type="category"
                          onClick={handleSuggestionClick}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {suggestions.products.length === 0 && 
                 suggestions.categories.length === 0 && 
                 searchQuery.trim().length >= 2 && (
                  <div className="p-6 text-center text-gray-500 text-sm font-medium">
                    No results found for "{searchQuery}"
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Filter Button */}
      <div ref={filterContainerRef} className="relative" style={{ colorScheme: 'light'}}>
        <Button
          onClick={() => setIsFilterOpen(!isFilterOpen)}
          variant="outline"
          className={`h-12 w-12 p-0 rounded-xl shadow-sm transition-all duration-200 ${
            variant === 'outlined'
              ? 'bg-[#16a34a] hover:bg-[#15803d] text-white border-none'
              : 'bg-gray-100 hover:bg-gray-200 text-green-800 border-none'
          } ${isFilterOpen ? 'bg-[#15803d]' : ''}`}
          style={{
            backgroundColor: variant === 'outlined' ? '#16a34a' : undefined,
            ...(isFilterOpen && variant === 'outlined' ? { backgroundColor: '#15803d' } : {}),
          }}
        >
          <SlidersHorizontal className={`h-5 w-5 ${
            variant === 'outlined' ? 'text-white' : 'text-green-800'
          }`} />
        </Button>

        {/* Filter Modal - App-style */}
        {isFilterOpen && categories && (
          <div className="fixed inset-0 z-50 transition-all duration-300">
            {/* Backdrop */}
            <div 
              className="absolute inset-0 bg-black/20 backdrop-blur-sm" 
              onClick={() => setIsFilterOpen(false)} 
            />
            
            {/* Modal Content */}
            <div className="absolute inset-x-0 top-0 bg-white transition-transform duration-300 max-h-screen overflow-y-auto" style={{backgroundColor: '#ffffff', colorScheme: 'light'}}>
              <div className="px-4 py-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-100 rounded-2xl flex items-center justify-center">
                      <SlidersHorizontal className="w-5 h-5 text-gray-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Filter by Category</h3>
                      <p className="text-sm text-gray-500">Current: {getCurrentCategoryName()}</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsFilterOpen(false)}
                    className="h-10 w-10 p-0 rounded-xl hover:bg-gray-100"
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>
                
                {/* Categories List */}
                <div className="space-y-2">
                  {/* All Categories */}
                  <CategoryFilterItem
                    isActive={!currentCategory || currentCategory === 'all'}
                    onClick={() => handleCategoryChange('all')}
                    totalProducts={totalProducts}
                  />
                  
                  {/* Individual Categories */}
                  {categories.map((category) => (
                    <CategoryFilterItem
                      key={category.id}
                      category={category}
                      isActive={currentCategory === category.id.toString()}
                      onClick={() => handleCategoryChange(category.id.toString())}
                    />
                  ))}
                </div>

                {/* Bottom Safe Area */}
                <div className="h-8" />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// Main exported component
export function ModernSearchSystem({ onSearch, categories, currentCategory, variant = 'default' }: SearchBarProps) {
  return (
    <Suspense fallback={<SearchFallback variant={variant} />}>
      <SearchComponent onSearch={onSearch} categories={categories} currentCategory={currentCategory} variant={variant} />
    </Suspense>
  )
}