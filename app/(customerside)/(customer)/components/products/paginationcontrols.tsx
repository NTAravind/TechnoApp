'use client'

import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { useCallback, useMemo } from 'react'

interface PaginationControlsProps {
  currentPage: number
  totalPages: number
  hasNextPage: boolean
  hasPrevPage: boolean
  search?: string
  category?: string
  limit: number
}

export default function PaginationControls({
  currentPage,
  totalPages,
  hasNextPage,
  hasPrevPage,
  search,
  category,
  limit,
}: PaginationControlsProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // Memoized URL builder
  const buildURL = useCallback((page: number) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('page', page.toString())
    params.set('limit', limit.toString())
    
    if (search) params.set('search', search)
    if (category) params.set('category', category)
    
    return `${pathname}?${params.toString()}`
  }, [pathname, searchParams, search, category, limit])

  // Navigate to page
  const navigateToPage = useCallback((page: number) => {
    if (page < 1 || page > totalPages) return
    router.push(buildURL(page), { scroll: false })
  }, [router, buildURL, totalPages])

  // Generate page numbers to show with responsive logic
  const pageNumbers = useMemo(() => {
    const delta = window?.innerWidth < 768 ? 1 : 2 // Fewer pages on mobile
    const range = []
    const rangeWithDots = []

    for (
      let i = Math.max(2, currentPage - delta);
      i <= Math.min(totalPages - 1, currentPage + delta);
      i++
    ) {
      range.push(i)
    }

    if (currentPage - delta > 2) {
      rangeWithDots.push(1, '...' as const)
    } else {
      rangeWithDots.push(1)
    }

    rangeWithDots.push(...range)

    if (currentPage + delta < totalPages - 1) {
      rangeWithDots.push('...' as const, totalPages)
    } else if (totalPages > 1) {
      rangeWithDots.push(totalPages)
    }

    // Remove duplicates
    return rangeWithDots.filter((item, index, array) => array.indexOf(item) === index)
  }, [currentPage, totalPages])

  if (totalPages <= 1) return null

  return (
    <div className="w-full">
      {/* Main pagination container */}
      <div className="flex items-center justify-between sm:justify-center gap-2 sm:gap-4">
        {/* Previous button */}
        <Button
          variant="outline"
          size="sm"
          disabled={!hasPrevPage}
          onClick={() => navigateToPage(currentPage - 1)}
          className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3"
          aria-label="Go to previous page"
        >
          <ChevronLeft className="h-3 w-3 sm:h-4 sm:w-4" />
          <span className="hidden xs:inline sm:inline">Previous</span>
          <span className="xs:hidden sm:hidden">Prev</span>
        </Button>

        {/* Page numbers container */}
        <div className="flex items-center">
          {/* Desktop page numbers */}
          <div className="hidden lg:flex items-center gap-1">
            {pageNumbers.map((pageNum, index) => {
              if (pageNum === '...') {
                return (
                  <span key={`ellipsis-${index}`} className="px-3 py-2">
                    <MoreHorizontal className="h-4 w-4 text-gray-400" />
                  </span>
                )
              }

              const isCurrentPage = pageNum === currentPage

              return (
                <Button
                  key={pageNum}
                  variant={isCurrentPage ? "default" : "ghost"}
                  size="sm"
                  onClick={() => navigateToPage(Number(pageNum))}
                  className={`min-w-[40px] ${isCurrentPage ? 'pointer-events-none' : ''}`}
                  aria-label={`Go to page ${pageNum}`}
                  aria-current={isCurrentPage ? 'page' : undefined}
                >
                  {pageNum}
                </Button>
              )
            })}
          </div>

          {/* Tablet page numbers (limited) */}
          <div className="hidden md:flex lg:hidden items-center gap-1">
            {pageNumbers.slice(0, 5).map((pageNum, index) => {
              if (pageNum === '...') {
                return (
                  <span key={`ellipsis-${index}`} className="px-2 py-2">
                    <MoreHorizontal className="h-4 w-4 text-gray-400" />
                  </span>
                )
              }

              const isCurrentPage = pageNum === currentPage

              return (
                <Button
                  key={pageNum}
                  variant={isCurrentPage ? "default" : "ghost"}
                  size="sm"
                  onClick={() => navigateToPage(Number(pageNum))}
                  className={`min-w-[36px] text-xs ${isCurrentPage ? 'pointer-events-none' : ''}`}
                  aria-label={`Go to page ${pageNum}`}
                  aria-current={isCurrentPage ? 'page' : undefined}
                >
                  {pageNum}
                </Button>
              )
            })}
          </div>

          {/* Mobile page indicator */}
          <div className="md:hidden flex items-center gap-2">
            {/* Jump to first/last buttons for mobile */}
            {currentPage > 3 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigateToPage(1)}
                className="min-w-[32px] h-8 px-2 text-xs"
                aria-label="Go to first page"
              >
                1
              </Button>
            )}
            
            {currentPage > 4 && (
              <span className="text-gray-400 px-1">
                <MoreHorizontal className="h-3 w-3" />
              </span>
            )}

            {/* Current page indicator */}
            <div className="bg-primary text-primary-foreground px-3 py-1 rounded text-sm font-medium min-w-[40px] text-center">
              {currentPage}
            </div>

            {currentPage < totalPages - 3 && (
              <span className="text-gray-400 px-1">
                <MoreHorizontal className="h-3 w-3" />
              </span>
            )}

            {currentPage < totalPages - 2 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigateToPage(totalPages)}
                className="min-w-[32px] h-8 px-2 text-xs"
                aria-label="Go to last page"
              >
                {totalPages}
              </Button>
            )}
          </div>
        </div>

        {/* Next button */}
        <Button
          variant="outline"
          size="sm"
          disabled={!hasNextPage}
          onClick={() => navigateToPage(currentPage + 1)}
          className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3"
          aria-label="Go to next page"
        >
          <span className="hidden xs:inline sm:inline">Next</span>
          <span className="xs:hidden sm:hidden">Next</span>
          <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4" />
        </Button>
      </div>

      {/* Mobile page info */}
      <div className="md:hidden text-center mt-3 text-xs text-gray-500">
        Page {currentPage} of {totalPages}
      </div>

      {/* Jump to page input for larger screens */}
      {totalPages > 10 && (
        <div className="hidden lg:flex items-center justify-center mt-4 gap-2">
          <span className="text-sm text-gray-600">Jump to page:</span>
          <input
            type="number"
            min="1"
            max={totalPages}
            defaultValue={currentPage}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                const page = parseInt((e.target as HTMLInputElement).value)
                if (page >= 1 && page <= totalPages) {
                  navigateToPage(page)
                }
              }
            }}
            className="w-16 px-2 py-1 border border-gray-300 rounded text-sm text-center"
            aria-label="Jump to page number"
          />
        </div>
      )}
    </div>
  )
}