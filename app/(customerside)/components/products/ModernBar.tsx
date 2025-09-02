'use client'
import { Suspense } from "react"
import { useState, useEffect, useRef, useCallback } from "react"
import { Search, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { getSearchSuggestions } from "@/lib/cache"
import { useDebounce } from "@/hooks/UseDebounce"
import Image from "next/image"

interface SearchBarProps {
  onSearch?: (query: string) => void
  isMobileIcon?: boolean
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
}

interface SearchSuggestions {
  products: Product[]
  categories: Category[]
  weights: string[]
  units: string[]
}

// Loading fallback
const SearchFallback = ({ isMobileIcon = false }: { isMobileIcon?: boolean }) => {
  return (
    <div className="relative w-full max-w-sm">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
      <input
        type="text"
        placeholder="Search products..."
        disabled
        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-400 focus:outline-none text-sm"
      />
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
      className="w-full p-3 flex items-center gap-3 hover:bg-gray-50 rounded-lg text-left transition-all duration-200 group"
    >
      <div className="w-12 h-12 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100 relative">
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
        <p className="font-semibold text-gray-900 group-hover:text-blue-600 truncate text-sm transition-colors duration-200">
          {product.name}
        </p>
        <p className="text-xs text-gray-600 mt-0.5">{product.category.name}</p>
        <div className="flex items-center gap-1.5 mt-1">
          <p className="text-sm font-bold text-green-600">
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
      className="w-full px-3 py-2.5 text-left text-sm text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded-lg transition-all duration-200 flex items-center gap-3 group"
    >
      <div className="w-6 h-6 flex-shrink-0 rounded-lg bg-gray-100 group-hover:bg-blue-50 flex items-center justify-center transition-colors duration-200">
        <Search className="h-3.5 w-3.5 text-gray-400 group-hover:text-blue-600 transition-colors duration-200" />
      </div>
      <span className="truncate font-medium">{name}</span>
      {type && (
        <span className="text-xs text-gray-400 ml-auto capitalize font-medium">{type}</span>
      )}
    </button>
  )
}

// Main search component
function SearchComponent({ onSearch, isMobileIcon = false }: SearchBarProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [searchQuery, setSearchQuery] = useState(() => searchParams.get('search') || '')
  const [isOpen, setIsOpen] = useState(false)
  const [suggestions, setSuggestions] = useState<SearchSuggestions>({
    products: [],
    categories: [],
    weights: [],
    units: []
  })
  const [isLoading, setIsLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
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
    setIsOpen(false)
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

    if (isOpen) {
      fetchSuggestions()
    }
  }, [debouncedQuery, isOpen])

  useEffect(() => {
    if (!isOpen) return

    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  // Desktop version
  return (
    <div ref={containerRef} className="relative w-full max-w-sm">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          ref={inputRef}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => setIsOpen(true)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch(searchQuery)}
          placeholder="Search products..."
          className="w-full pl-10 pr-10 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 font-medium text-gray-900 placeholder:text-gray-500"
        />
        {searchQuery && (
          <Button
            onClick={clearSearch}
            variant="ghost"
            size="sm"
            className="absolute right-2 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600"
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-xl z-50 max-h-96 overflow-y-auto">
          {isLoading ? (
            <div className="flex justify-center py-6">
              <div className="animate-spin rounded-full h-6 w-6 border-2 border-gray-300 border-t-blue-600" />
            </div>
          ) : searchQuery.trim().length < 2 ? (
            <div className="p-4 text-center text-gray-500 text-sm font-medium">
              Start typing to search...
            </div>
          ) : (
            <div className="p-3">
              {suggestions.products.length > 0 && (
                <div className="mb-4">
                  <div className="px-3 py-2 text-xs font-bold text-gray-900 uppercase tracking-wider border-b border-gray-100 mb-2">
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

              {(suggestions.categories.length > 0 || suggestions.weights.length > 0 || suggestions.units.length > 0) && (
                <div className="space-y-4">
                  {suggestions.categories.length > 0 && (
                    <div>
                      <div className="px-3 py-2 text-xs font-bold text-gray-900 uppercase tracking-wider border-b border-gray-100 mb-2">
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

                  {suggestions.weights.length > 0 && (
                    <div>
                      <div className="px-3 py-2 text-xs font-bold text-gray-900 uppercase tracking-wider border-b border-gray-100 mb-2">
                        Weights
                      </div>
                      <div className="space-y-1">
                        {suggestions.weights.slice(0, 3).map((weight, index) => (
                          <SuggestionItem
                            key={index}
                            item={weight}
                            type="weight"
                            onClick={handleSuggestionClick}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {suggestions.units.length > 0 && (
                    <div>
                      <div className="px-3 py-2 text-xs font-bold text-gray-900 uppercase tracking-wider border-b border-gray-100 mb-2">
                        Units
                      </div>
                      <div className="space-y-1">
                        {suggestions.units.slice(0, 3).map((unit, index) => (
                          <SuggestionItem
                            key={index}
                            item={unit}
                            type="unit"
                            onClick={handleSuggestionClick}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {suggestions.products.length === 0 && 
               suggestions.categories.length === 0 && 
               suggestions.weights.length === 0 && 
               suggestions.units.length === 0 && 
               searchQuery.trim().length >= 2 && (
                <div className="p-4 text-center text-gray-500 text-sm font-medium">
                  No results found for "{searchQuery}"
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// Main exported component
export function ModernSearchSystem({ onSearch, isMobileIcon = false }: SearchBarProps) {
  return (
    <Suspense fallback={<SearchFallback isMobileIcon={isMobileIcon} />}>
      <SearchComponent onSearch={onSearch} isMobileIcon={isMobileIcon} />
    </Suspense>
  )
}