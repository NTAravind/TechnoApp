'use server';

import prisma from "@/lib/prisma";

// Cache for search suggestions (in production, use Redis)
const searchCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Helper function to get cached results
function getCachedResult(key: string) {
  const cached = searchCache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }
  return null;
}

// Helper function to set cache
function setCachedResult(key: string, data: any) {
  searchCache.set(key, { data, timestamp: Date.now() });
  
  // Clean old cache entries (simple cleanup)
  if (searchCache.size > 100) {
    const oldestKey = Array.from(searchCache.keys())[0];
    searchCache.delete(oldestKey);
  }
}

export async function searchProducts(query: string) {
  if (!query || query.trim().length < 2) {
    return [];
  }

  const searchTerm = query.trim();
  const cacheKey = `search_products_${searchTerm.toLowerCase()}`;
  
  // Check cache first
  const cached = getCachedResult(cacheKey);
  if (cached) {
    return cached;
  }
    
  try {
    const products = await prisma.product.findMany({
      where: {
        OR: [
          {
            name: {
              contains: searchTerm,
              mode: 'insensitive'
            }
          },
          {
            category: {
              name: {
                contains: searchTerm,
                mode: 'insensitive'
              }
            }
          },
          {
            weight: {
              contains: searchTerm,
              mode: 'insensitive'
            }
          },
          {
            unit: {
              contains: searchTerm,
              mode: 'insensitive'
            }
          },
          
        ]
      },
      select: {
        id: true,
        name: true,
        price: true,
        weight: true,
        unit: true,
        packaging: true,
        imgurl: true,
        category: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: [
        // Prioritize exact name matches
        {
          name: 'asc'
        }
      ],
      take: 10
    });

    setCachedResult(cacheKey, products);
    return products;
  } catch (error) {
    console.error('Search error:', error);
    return [];
  }
}

export async function getSearchSuggestions(query: string) {
  if (!query || query.trim().length < 2) {
    return {
      products: [],
      categories: [],
      weights: [],
      units: []
    };
  }

  const searchTerm = query.trim();
  const cacheKey = `search_suggestions_${searchTerm.toLowerCase()}`;
  
  // Check cache first
  const cached = getCachedResult(cacheKey);
  if (cached) {
    return cached;
  }
    
  try {
    // Use Promise.all for parallel execution of independent queries
    const [productsResult, categoriesResult, weightsResult, unitsResult] = await Promise.all([
      // Product suggestions - prioritize exact matches
      prisma.product.findMany({
        where: {
          OR: [
            {
              name: {
                contains: searchTerm,
                mode: 'insensitive'
              }
            },
            {
              category: {
                name: {
                  contains: searchTerm,
                  mode: 'insensitive'
                }
              }
            }
          ]
        },
        select: {
          id: true,
          name: true,
          price: true,
          imgurl: true,
          weight: true,
          unit: true,
          category: {
            select: {
              id: true,
              name: true
            }
          }
        },
        orderBy: [
          // Prioritize products where the search term appears at the beginning
          {
            name: 'asc'
          }
        ],
        take: 3
      }),

      // Categories - direct category search
      prisma.category.findMany({
        where: {
          name: {
            contains: searchTerm,
            mode: 'insensitive'
          }
        },
        select: {
          id: true,
          name: true
        },
        orderBy: {
          name: 'asc'
        },
        take: 5
      }),

      // Weights - get distinct values more efficiently  
      prisma.product.groupBy({
        by: ['weight'],
        where: {
          weight: {
            not: null,
            contains: searchTerm,
            mode: 'insensitive'
          }
        },
        take: 5,
        orderBy: {
          weight: 'asc'
        }
      }),

      // Units - get distinct values more efficiently  
      prisma.product.groupBy({
        by: ['unit'],
        where: {
          unit: {
            contains: searchTerm,
            mode: 'insensitive'
          }
        },
        take: 5,
        orderBy: {
          unit: 'asc'
        }
      })
    ]);

    const result = {
      products: productsResult,
      categories: categoriesResult,
      weights: weightsResult.map(w => w.weight).filter(w => w !== null),
      units: unitsResult.map(u => u.unit)
    };

    setCachedResult(cacheKey, result);
    return result;
    
  } catch (error) {
    console.error('Search suggestions error:', error);
    return {
      products: [],
      categories: [],
      weights: [],
      units: []
    };
  }
}

// Advanced search with filters (bonus optimization)
export async function advancedSearch({
  query,
  categoryId,
  minPrice,
  maxPrice,
  weight,
  unit,
  limit = 20,
  offset = 0
}: {
  query?: string;
  categoryId?: number;
  minPrice?: number;
  maxPrice?: number;
  weight?: string;
  unit?: string;
  limit?: number;
  offset?: number;
}) {
  try {
    const whereClause: any = {};

    // Build where clause dynamically
    if (query && query.trim().length >= 2) {
      whereClause.OR = [
        {
          name: {
            contains: query.trim(),
            mode: 'insensitive'
          }
        },
        {
          category: {
            name: {
              contains: query.trim(),
              mode: 'insensitive'
            }
          }
        },
        {
          descr: {
            contains: query.trim(),
            mode: 'insensitive'
          }
        }
      ];
    }

    if (categoryId) {
      whereClause.categoryId = categoryId;
    }

    if (weight) {
      whereClause.weight = {
        equals: weight,
        mode: 'insensitive'
      };
    }

    if (unit) {
      whereClause.unit = {
        equals: unit,
        mode: 'insensitive'
      };
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      whereClause.price = {};
      if (minPrice !== undefined) whereClause.price.gte = minPrice;
      if (maxPrice !== undefined) whereClause.price.lte = maxPrice;
    }

    const products = await prisma.product.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        price: true,
        weight: true,
        unit: true,
        packaging: true,
        imgurl: true,
        category: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: [
        {
          price: 'asc'
        }
      ],
      take: limit,
      skip: offset
    });

    return products;
  } catch (error) {
    console.error('Advanced search error:', error);
    return [];
  }
}

// Get popular search terms (for analytics/autocomplete)
export async function getPopularSearchTerms(limit: number = 10) {
  try {
    // This would typically come from a search analytics table
    // For now, return most common categories and units
    const [popularCategories, popularUnits] = await Promise.all([
      prisma.category.findMany({
        select: {
          name: true,
          _count: {
            select: {
              products: true
            }
          }
        },
        orderBy: {
          products: {
            _count: 'desc'
          }
        },
        take: Math.floor(limit / 2)
      }),
      
      prisma.product.groupBy({
        by: ['unit'],
        _count: {
          unit: true
        },
        orderBy: {
          _count: {
            unit: 'desc'
          }
        },
        take: Math.floor(limit / 2)
      })
    ]);

    return [
      ...popularCategories.map(c => c.name),
      ...popularUnits.map(u => u.unit)
    ];
  } catch (error) {
    console.error('Popular search terms error:', error);
    return [];
  }
}