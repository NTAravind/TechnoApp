'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react'
import { useTransition } from 'react'

interface ProductsClientProps {
  currentPage: number
  totalPages: number
  totalItems: number
  itemsPerPage: number
  search?: string
  category?: string
}

export default function ProductsClient({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  search,
  category
}: ProductsClientProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  
  const startItem = (currentPage - 1) * itemsPerPage + 1
  const endItem = Math.min(currentPage * itemsPerPage, totalItems)

  const buildUrl = (newPage?: number, clearFilters: boolean = false) => {
    const params = new URLSearchParams()
    
    if (!clearFilters) {
      if (search?.trim()) params.set('search', search.trim())
      // Fixed: Handle category properly - ensure we don't pass 'undefined' or empty strings
      if (category?.trim() && category !== 'all' && category !== 'undefined') {
        params.set('category', category.trim())
      }
    }
    
    // Fixed: Always reset to page 1 when changing filters, but allow page navigation otherwise
    if (newPage && newPage > 1) {
      params.set('page', String(newPage))
    }
    
    if (itemsPerPage !== 12) {
      params.set('limit', String(itemsPerPage))
    }
    
    const queryString = params.toString()
    return `/products${queryString ? `?${queryString}` : ''}`
  }

  const handlePageChange = (newPage: number) => {
    if (newPage === currentPage || newPage < 1 || newPage > totalPages) return
    
    startTransition(() => {
      router.push(buildUrl(newPage))
    })
  }

  const handleViewAllProducts = () => {
    startTransition(() => {
      router.push(buildUrl(1, true)) // Clear all filters and go to page 1
    })
  }

  // Responsive page numbers - fewer on mobile
  const getPageNumbers = (isMobile: boolean = false) => {
    const pages = []
    const maxVisiblePages = isMobile ? 3 : 5
    
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2))
      let endPage = Math.min(totalPages, currentPage + Math.floor(maxVisiblePages / 2))
      
      // Ensure we always show maxVisiblePages when possible
      if (endPage - startPage < maxVisiblePages - 1) {
        if (startPage === 1) {
          endPage = Math.min(totalPages, maxVisiblePages)
        } else if (endPage === totalPages) {
          startPage = Math.max(1, totalPages - maxVisiblePages + 1)
        }
      }

      // Add first page and ellipsis if needed
      if (startPage > 1) {
        pages.push(1)
        if (startPage > 2) {
          pages.push('...')
        }
      }

      // Add visible page numbers
      for (let i = startPage; i <= endPage; i++) {
        pages.push(i)
      }

      // Add ellipsis and last page if needed
      if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
          pages.push('...')
        }
        pages.push(totalPages)
      }
    }
    
    return pages
  }

  // Show "View All Products" button when no products found
  if (totalItems === 0 && (search || (category && category !== 'all' && category !== 'undefined'))) {
    return (
      <div className="flex justify-center py-4">
        <Button
          variant="outline"
          onClick={handleViewAllProducts}
          disabled={isPending}
          className="w-full sm:w-auto"
        >
          {isPending ? 'Loading...' : 'View All Products'}
        </Button>
      </div>
    )
  }

  // Don't show pagination if there's only one page or no products
  if (totalPages <= 1) return null

  return (
    <div className="w-full space-y-4">
      {/* Results summary */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-sm text-muted-foreground bg-muted/30 px-4 py-3 rounded-lg">
        <div>
          Showing {startItem} to {endItem} of {totalItems} products
        </div>
        <div className="sm:hidden text-center">
          Page {currentPage} of {totalPages}
        </div>
      </div>

      {/* Desktop pagination */}
      <div className="hidden md:flex items-center justify-center gap-2 bg-background border rounded-lg p-4">
        <Button
          variant="outline"
          size="sm"
          disabled={currentPage === 1 || isPending}
          onClick={() => handlePageChange(currentPage - 1)}
          className="flex items-center gap-1"
        >
          <ChevronLeft className="h-4 w-4" />
          Previous
        </Button>

        <div className="flex items-center gap-1 mx-4">
          {getPageNumbers(false).map((pageNum, index) => (
            pageNum === '...' ? (
              <span key={`ellipsis-${index}`} className="px-2 py-1">
                <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
              </span>
            ) : (
              <Button
                key={pageNum}
                variant={currentPage === pageNum ? "default" : "outline"}
                size="sm"
                className="min-w-[40px]"
                disabled={isPending}
                onClick={() => handlePageChange(Number(pageNum))}
              >
                {pageNum}
              </Button>
            )
          ))}
        </div>

        <Button
          variant="outline"
          size="sm"
          disabled={currentPage === totalPages || isPending}
          onClick={() => handlePageChange(currentPage + 1)}
          className="flex items-center gap-1"
        >
          Next
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Mobile/Tablet pagination */}
      <div className="md:hidden bg-background border rounded-lg p-4">
        {/* Navigation buttons */}
        <div className="flex items-center justify-between mb-4">
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage === 1 || isPending}
            onClick={() => handlePageChange(currentPage - 1)}
            className="flex items-center gap-1 px-3"
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="hidden xs:inline">Prev</span>
          </Button>

          <div className="flex items-center gap-1 overflow-x-auto max-w-[200px] sm:max-w-none">
            {getPageNumbers(true).map((pageNum, index) => (
              pageNum === '...' ? (
                <span key={`ellipsis-${index}`} className="px-2 text-muted-foreground">
                  <MoreHorizontal className="h-3 w-3" />
                </span>
              ) : (
                <Button
                  key={pageNum}
                  variant={currentPage === pageNum ? "default" : "ghost"}
                  size="sm"
                  className="min-w-[36px] h-8 text-sm flex-shrink-0"
                  disabled={isPending}
                  onClick={() => handlePageChange(Number(pageNum))}
                >
                  {pageNum}
                </Button>
              )
            ))}
          </div>

          <Button
            variant="outline"
            size="sm"
            disabled={currentPage === totalPages || isPending}
            onClick={() => handlePageChange(currentPage + 1)}
            className="flex items-center gap-1 px-3"
          >
            <span className="hidden xs:inline">Next</span>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Quick jump buttons for mobile */}
        {totalPages > 5 && (
          <div className="flex items-center justify-center gap-2 pt-3 border-t">
            <span className="text-xs text-muted-foreground">Jump to:</span>
            {currentPage > 3 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handlePageChange(1)}
                className="h-7 px-2 text-xs"
                disabled={isPending}
              >
                First
              </Button>
            )}
            {currentPage < totalPages - 2 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handlePageChange(totalPages)}
                className="h-7 px-2 text-xs"
                disabled={isPending}
              >
                Last
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Loading overlay */}
      {isPending && (
        <div className="absolute inset-0 bg-background/50 flex items-center justify-center rounded-lg">
          <div className="text-sm text-muted-foreground">Loading...</div>
        </div>
      )}
    </div>
  )
}