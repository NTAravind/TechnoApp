// app/admin/product-backup/ProductBackupClient.tsx
'use client'

import { useState } from 'react'

type Product = {
  id: number
  name: string
  size: number[]
  weight: string | null
  imgurl: string | null
  unit: string
  price: number
  packaging: number | null
  LooseSell: boolean
  descr: string | null
  sku: string
  categoryId: number
  isVisible: boolean
  createdAt: Date
  updatedAt: Date
  orderItems: any[]
  category: any
}

type Props = {
  products: Product[]
  count: number
  timestamp?: string
}

export function ProductBackupClient({ products, count, timestamp }: Props) {
  const [downloading, setDownloading] = useState(false)

  const downloadJSON = () => {
    setDownloading(true)
    
    try {
      const dataStr = JSON.stringify(
        {
          exportDate: timestamp || new Date().toISOString(),
          totalProducts: count,
          products: products,
        },
        null,
        2
      )
      
      const dataBlob = new Blob([dataStr], { type: 'application/json' })
      const url = URL.createObjectURL(dataBlob)
      const link = document.createElement('a')
      
      const filename = `products-backup-${new Date().toISOString().split('T')[0]}.json`
      link.href = url
      link.download = filename
      
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Download failed:', error)
      alert('Failed to download backup file')
    } finally {
      setDownloading(false)
    }
  }

  const downloadProductsOnly = () => {
    setDownloading(true)
    
    try {
      const productsOnly = products.map(({ orderItems, category, ...product }) => product)
      
      const dataStr = JSON.stringify(
        {
          exportDate: timestamp || new Date().toISOString(),
          totalProducts: count,
          products: productsOnly,
        },
        null,
        2
      )
      
      const dataBlob = new Blob([dataStr], { type: 'application/json' })
      const url = URL.createObjectURL(dataBlob)
      const link = document.createElement('a')
      
      const filename = `products-only-backup-${new Date().toISOString().split('T')[0]}.json`
      link.href = url
      link.download = filename
      
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Download failed:', error)
      alert('Failed to download backup file')
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-green-50 border border-green-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-green-800 font-semibold text-lg">
              Ready to Export
            </p>
            <p className="text-green-700 text-sm mt-1">
              {count} products loaded successfully
            </p>
            {timestamp && (
              <p className="text-green-600 text-xs mt-1">
                Fetched at: {new Date(timestamp).toLocaleString()}
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={downloadJSON}
            disabled={downloading}
            className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
          >
            {downloading ? (
              <>
                <span className="animate-spin">⏳</span>
                Downloading...
              </>
            ) : (
              <>
                <span>📥</span>
                Download Full Backup (with relations)
              </>
            )}
          </button>

          <button
            onClick={downloadProductsOnly}
            disabled={downloading}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
          >
            {downloading ? (
              <>
                <span className="animate-spin">⏳</span>
                Downloading...
              </>
            ) : (
              <>
                <span>📦</span>
                Download Products Only
              </>
            )}
          </button>
        </div>
      </div>

      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h2 className="font-semibold mb-2">Backup Details</h2>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>✓ All product fields included</li>
          <li>✓ Category relationships included (full backup)</li>
          <li>✓ Order items included (full backup)</li>
          <li>✓ Timestamps preserved</li>
          <li>✓ JSON format for easy import</li>
        </ul>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">Sample Product Data Preview</h3>
        {products.length > 0 && (
          <pre className="text-xs bg-white p-3 rounded border overflow-x-auto">
            {JSON.stringify(products[0], null, 2).slice(0, 500)}...
          </pre>
        )}
      </div>
    </div>
  )
}