"use client"

import { useState, useRef, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Upload, Download, X, Info, CheckCircle, AlertTriangle } from "lucide-react"
import { bulkUploadProducts } from "./../../actions/products"
import { useActionState } from "react"

// Type definitions
interface Category {
  id: number
  name: string
}

interface RawProductData {
  SKU?: string
  Name?: string
  Unit?: string
  Price?: string
  Packaging?: string
  Weight?: string
  Sizes?: string
  Description?: string
}

interface ValidatedProduct {
  SKU: string
  Name: string
  Unit: string
  price: number
  Packaging?: string
  Weight?: string
  sizes: string[]
  Description?: string
}

interface ValidationResult {
  validProducts: ValidatedProduct[]
  errors: string[]
}

interface BulkUploadState {
  success: boolean
  message: string
  processed: number
  total: number
  errors: string[]
}

interface BulkProductUploadProps {
  categories: Category[]
}

const initialState: BulkUploadState = {
  success: false,
  message: "",
  processed: 0,
  total: 0,
  errors: []
}

export function BulkProductUpload({ categories }: BulkProductUploadProps) {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("")
  const [productFile, setProductFile] = useState<File | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imageUrl, setImageUrl] = useState<string>("")
  const [generalDescription, setGeneralDescription] = useState<string>("")
  const [uploading, setUploading] = useState<boolean>(false)
  const [previewData, setPreviewData] = useState<ValidatedProduct[]>([])
  const [validationErrors, setValidationErrors] = useState<string[]>([])
  const [isPending, startTransition] = useTransition()
  
  const [state, formAction] = useActionState(bulkUploadProducts, initialState)
  
  const productInputRef = useRef<HTMLInputElement>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)

  // Enhanced CSV template with more examples
  const downloadProductTemplate = (): void => {
    const csv = `SKU,Name,Unit,Price,Packaging,Weight,Sizes,Description
SKU001,Sprinkler Adapter,1 pc,1.70,250/pkt,50g,"1/2 inch,3/4 inch",High-quality brass sprinkler adapter
SKU002,12x16 Joiner,1 pc,0.65,500/pkt,25g,"12mm,16mm",Durable plastic pipe joiner
SKU003,PVC Pipe,1 meter,2.50,50/bundle,200g,,Standard PVC pipe for plumbing
SKU004,Brass Fitting,1 pc,3.20,100/box,75g,1 inch,Premium brass pipe fitting`
    
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "bulk_product_template.csv"
    a.click()
    URL.revokeObjectURL(url)
  }

  // Parse CSV with proper error handling
  const parseCSV = (text: string): { data: RawProductData[]; headers: string[] } => {
    try {
      const lines = text.split('\n').filter(line => line.trim() !== '')
      if (lines.length < 2) {
        throw new Error("CSV must contain at least a header row and one data row")
      }

      const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''))
      const data: RawProductData[] = []
      
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''))
        const row: RawProductData = {}
        
        headers.forEach((header, index) => {
          if (values[index] !== undefined) {
            (row as any)[header] = values[index] || ''
          }
        })
        
        // Only add rows that have at least some data
        if (Object.values(row).some(value => value && value.trim() !== '')) {
          data.push(row)
        }
      }
      
      return { data, headers }
    } catch (error) {
      console.error('CSV parsing error:', error)
      throw new Error(`Failed to parse CSV: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // Validate CSV data with comprehensive checks
  const validateProducts = (products: RawProductData[]): ValidationResult => {
    const errors: string[] = []
    const validProducts: ValidatedProduct[] = []
    const seenSKUs = new Set<string>()

    products.forEach((product, index) => {
      const rowNumber = index + 2 // Account for header row
      const rowErrors: string[] = []
      
      // Required field validation
      if (!product.SKU || product.SKU.trim() === '') {
        rowErrors.push("SKU is required")
      } else if (seenSKUs.has(product.SKU.trim())) {
        rowErrors.push("SKU must be unique")
      } else {
        seenSKUs.add(product.SKU.trim())
      }

      if (!product.Name || product.Name.trim() === '') {
        rowErrors.push("Name is required")
      }
      
      if (!product.Unit || product.Unit.trim() === '') {
        rowErrors.push("Unit is required")
      }
      
      // Price validation
      const priceStr = product.Price?.trim()
      if (!priceStr) {
        rowErrors.push("Price is required")
      } else {
        const price = parseFloat(priceStr)
        if (isNaN(price) || price <= 0) {
          rowErrors.push("Price must be a valid positive number")
        }
      }
      
      if (rowErrors.length > 0) {
        errors.push(`Row ${rowNumber}: ${rowErrors.join(', ')}`)
      } else {
        // Parse sizes if provided
        const sizes: string[] = product.Sizes 
          ? product.Sizes.split(',').map(s => s.trim()).filter(s => s !== '')
          : []

        validProducts.push({
          SKU: product.SKU!.trim(),
          Name: product.Name!.trim(),
          Unit: product.Unit!.trim(),
          price: parseFloat(product.Price!.trim()),
          Packaging: product.Packaging?.trim() || undefined,
          Weight: product.Weight?.trim() || undefined,
          sizes,
          Description: product.Description?.trim() || undefined
        })
      }
    })

    return { validProducts, errors }
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const file = e.target.files?.[0]
    if (!file) return

    // Reset previous state
    setPreviewData([])
    setValidationErrors([])

    if (!file.name.toLowerCase().endsWith('.csv')) {
      setValidationErrors(['Please select a CSV file'])
      return
    }

    setProductFile(file)
    const reader = new FileReader()
    
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string
        if (!text) {
          throw new Error("Failed to read file content")
        }

        const { data } = parseCSV(text)
        const { validProducts, errors } = validateProducts(data)
        
        setPreviewData(validProducts)
        setValidationErrors(errors)
      } catch (error) {
        console.error('File processing error:', error)
        setValidationErrors([error instanceof Error ? error.message : 'Failed to process file'])
        setPreviewData([])
      }
    }
    
    reader.onerror = () => {
      setValidationErrors(['Failed to read the file'])
      setPreviewData([])
    }
    
    reader.readAsText(file)
  }

  // Handle image upload with proper error handling
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
    const file = e.target.files?.[0]
    if (!file) return
    
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file')
      return
    }
    
    if (file.size > 2 * 1024 * 1024) {
      alert('Image must be smaller than 2MB')
      return
    }
    
    setImageFile(file)
    setUploading(true)
    
    try {
      const extension = file.name.split('.').pop()
      const filename = `${Date.now()}-bulk-product.${extension}`.toLowerCase()
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader()
        reader.onload = () => {
          const result = reader.result as string
          resolve(result.split(',')[1])
        }
        reader.readAsDataURL(file)
      })

      const response = await fetch('/api/admin/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename,
          content: base64,
          message: `Add bulk product image: ${filename}`
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Upload failed')
      }
      
      const { cdnUrl } = await response.json()
      setImageUrl(cdnUrl)
    } catch (error) {
      console.error('Upload failed:', error)
      alert(`Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setUploading(false)
    }
  }

  const handleBulkUpload = async (formData: FormData) => {
    if (!selectedCategoryId || !imageUrl || !productFile || previewData.length === 0) {
      return
    }

    // Add all necessary form data
    formData.set("categoryId", selectedCategoryId)
    formData.set("imageUrl", imageUrl)
    formData.set("generalDescription", generalDescription)
    formData.set("productsData", JSON.stringify(previewData))
    formData.set("productFile", productFile)

    startTransition(() => {
      formAction(formData)
    })
  }

  const clearForm = (): void => {
    setProductFile(null)
    setImageUrl("")
    setImageFile(null)
    setSelectedCategoryId("")
    setGeneralDescription("")
    setPreviewData([])
    setValidationErrors([])
    
    // Clear file inputs
    if (productInputRef.current) {
      productInputRef.current.value = ""
    }
    if (imageInputRef.current) {
      imageInputRef.current.value = ""
    }
  }

  // Helper functions for component state
  const canUpload = selectedCategoryId && imageUrl && productFile && validationErrors.length === 0 && previewData.length > 0 && !isPending && !uploading

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      <div className="border-b pb-4">
        <h1 className="text-3xl font-bold text-gray-900">Bulk Product Upload</h1>
        <p className="text-gray-600 mt-2">Upload multiple products at once with shared category, image, and description</p>
      </div>

      <form action={handleBulkUpload} className="space-y-8">
        {/* Category & General Description */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="categoryId" className="text-sm font-medium">Product Category</Label>
            <Select value={selectedCategoryId} onValueChange={setSelectedCategoryId} name="categoryId" required>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a category for all products" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id.toString()}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="generalDescription" className="text-sm font-medium">General Description</Label>
            <Textarea
              id="generalDescription"
              name="generalDescription"
              placeholder="Enter a general description that will be applied to all products in this batch..."
              value={generalDescription}
              onChange={(e) => setGeneralDescription(e.target.value)}
              className="resize-none"
              rows={3}
            />
            <p className="text-xs text-gray-500">This description will be used for products without individual descriptions</p>
          </div>
        </div>

        {/* Image Upload */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Product Image
          </h3>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-all duration-200">
            {imageUrl ? (
              <div className="space-y-4">
                <img 
                  src={imageUrl} 
                  alt="Product preview" 
                  className="mx-auto rounded-lg object-cover shadow-lg max-w-xs h-48"
                />
                <div className="flex gap-3 justify-center">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setImageUrl("")
                      setImageFile(null)
                      if (imageInputRef.current) {
                        imageInputRef.current.value = ""
                      }
                    }}
                    disabled={isPending}
                  >
                    <X className="w-4 h-4 mr-1" />
                    Remove
                  </Button>
                  <label className="cursor-pointer">
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm" 
                      asChild
                      disabled={uploading || isPending}
                    >
                      <span>
                        <Upload className="w-4 h-4 mr-1" />
                        Replace
                      </span>
                    </Button>
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={uploading || isPending}
                      ref={imageInputRef}
                    />
                  </label>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <Upload className="w-16 h-16 mx-auto text-gray-400" />
                <div>
                  <label className="cursor-pointer">
                    <span className="text-blue-600 hover:text-blue-700 font-medium text-lg">
                      {imageFile ? imageFile.name : "Click to upload product image"}
                    </span>
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={uploading || isPending}
                      ref={imageInputRef}
                    />
                  </label>
                </div>
                <p className="text-gray-500">PNG, JPG up to 2MB. This image will be used for all products in this batch.</p>
              </div>
            )}
            {uploading && (
              <div className="flex items-center justify-center space-x-3 mt-4">
                <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                <span className="text-blue-600 font-medium">Uploading image...</span>
              </div>
            )}
          </div>
        </div>

        {/* CSV Upload */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Upload className="w-5 h-5" />
              Product Data CSV
            </h3>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={downloadProductTemplate}
              className="flex items-center gap-2"
              disabled={isPending}
            >
              <Download className="w-4 h-4" />
              Download Template
            </Button>
          </div>
          
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-all duration-200">
            <Upload className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <label className="cursor-pointer">
              <span className="text-blue-600 hover:text-blue-700 font-medium text-lg">
                {productFile ? productFile.name : "Click to upload product CSV"}
              </span>
              <input
                type="file"
                accept=".csv"
                className="hidden"
                ref={productInputRef}
                onChange={handleFileUpload}
                disabled={isPending}
                name="productFile"
              />
            </label>
            <p className="text-gray-500 mt-2">
              Required columns: SKU, Name, Unit, Price. Optional: Packaging, Weight, Sizes, Description
            </p>
          </div>

          {/* Validation Errors */}
          {validationErrors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-red-800">Data Validation Errors</h4>
                  <ul className="mt-2 text-sm text-red-700 space-y-1 max-h-40 overflow-y-auto">
                    {validationErrors.map((error, index) => (
                      <li key={index} className="flex items-start gap-1">
                        <span className="text-red-500">•</span>
                        {error}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Preview Data */}
          {previewData.length > 0 && validationErrors.length === 0 && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-start gap-3 mb-4">
                <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-green-800">Data Preview ({previewData.length} products ready)</h4>
                  <p className="text-sm text-green-700 mt-1">First few products from your CSV file:</p>
                </div>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-green-300">
                      <th className="text-left py-2 px-3 font-medium text-green-800">SKU</th>
                      <th className="text-left py-2 px-3 font-medium text-green-800">Name</th>
                      <th className="text-left py-2 px-3 font-medium text-green-800">Unit</th>
                      <th className="text-left py-2 px-3 font-medium text-green-800">Price</th>
                      <th className="text-left py-2 px-3 font-medium text-green-800">Packaging</th>
                    </tr>
                  </thead>
                  <tbody>
                    {previewData.slice(0, 5).map((product, index) => (
                      <tr key={`${product.SKU}-${index}`} className="border-b border-green-200">
                        <td className="py-2 px-3 text-green-700 font-mono text-xs">{product.SKU}</td>
                        <td className="py-2 px-3 text-green-700">{product.Name}</td>
                        <td className="py-2 px-3 text-green-700">{product.Unit}</td>
                        <td className="py-2 px-3 text-green-700">₹{product.price.toFixed(2)}</td>
                        <td className="py-2 px-3 text-green-700">{product.Packaging || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {previewData.length > 5 && (
                  <p className="text-xs text-green-600 mt-2 text-center">
                    ...and {previewData.length - 5} more products
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Upload Progress */}
        {isPending && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-blue-800">
                    Processing bulk upload...
                    {state.total > 0 && ` (${state.processed}/${state.total})`}
                  </span>
                  {state.total > 0 && (
                    <span className="text-sm text-blue-600">
                      {Math.round((state.processed / state.total) * 100)}%
                    </span>
                  )}
                </div>
                {state.total > 0 && (
                  <div className="w-full bg-blue-200 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${(state.processed / state.total) * 100}%` }}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Success/Error Messages */}
        {state.message && !isPending && (
          <div className={`rounded-lg p-4 ${
            state.success 
              ? "bg-green-50 border border-green-200" 
              : "bg-red-50 border border-red-200"
          }`}>
            <div className="flex items-center gap-3">
              {state.success ? (
                <CheckCircle className="w-6 h-6 text-green-500" />
              ) : (
                <AlertTriangle className="w-6 h-6 text-red-500" />
              )}
              <div>
                <h4 className={`font-medium ${state.success ? 'text-green-800' : 'text-red-800'}`}>
                  {state.success ? 'Upload Complete!' : 'Upload Failed'}
                </h4>
                <p className={`mt-1 ${state.success ? 'text-green-700' : 'text-red-700'}`}>
                  {state.message}
                </p>
                {state.success && state.processed > 0 && (
                  <p className="text-green-700 text-sm mt-1">
                    Successfully processed {state.processed} of {state.total} products.
                  </p>
                )}
                {state.errors.length > 0 && (
                  <ul className="mt-2 text-sm text-red-700 space-y-1">
                    {state.errors.slice(0, 5).map((error, index) => (
                      <li key={index} className="flex items-start gap-1">
                        <span className="text-red-500">•</span>
                        {error}
                      </li>
                    ))}
                    {state.errors.length > 5 && (
                      <li className="text-red-600 text-xs">
                        ...and {state.errors.length - 5} more errors
                      </li>
                    )}
                  </ul>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Hidden inputs for form data */}
        <input type="hidden" name="imageUrl" value={imageUrl} />
        <input type="hidden" name="categoryId" value={selectedCategoryId} />
        <input type="hidden" name="generalDescription" value={generalDescription} />
        <input type="hidden" name="productsData" value={JSON.stringify(previewData)} />

        {/* Action Buttons */}
        <div className="border-t pt-6">
          <div className="flex flex-col sm:flex-row gap-4 justify-between">
            <div className="flex gap-3">
              <Button 
                type="submit"
                disabled={!canUpload}
                className="flex items-center gap-2 px-6"
              >
                {isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    Upload {previewData.length} Products
                  </>
                )}
              </Button>
              
              <Button 
                type="button" 
                variant="outline" 
                onClick={clearForm}
                disabled={isPending}
              >
                Clear All
              </Button>
            </div>

            <div className="text-sm text-gray-600 flex items-center gap-2">
              <Info className="w-4 h-4" />
              All products will use the same category, image, and general description
            </div>
          </div>

          {/* Requirements Checklist */}
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Requirements Checklist:</h4>
            <div className="space-y-1 text-sm">
              <div className={`flex items-center gap-2 ${selectedCategoryId ? 'text-green-600' : 'text-gray-500'}`}>
                {selectedCategoryId ? <CheckCircle className="w-4 h-4" /> : <div className="w-4 h-4 border border-gray-300 rounded" />}
                Category selected
              </div>
              <div className={`flex items-center gap-2 ${imageUrl ? 'text-green-600' : 'text-gray-500'}`}>
                {imageUrl ? <CheckCircle className="w-4 h-4" /> : <div className="w-4 h-4 border border-gray-300 rounded" />}
                Product image uploaded
              </div>
              <div className={`flex items-center gap-2 ${productFile && previewData.length > 0 && validationErrors.length === 0 ? 'text-green-600' : 'text-gray-500'}`}>
                {productFile && previewData.length > 0 && validationErrors.length === 0 ? <CheckCircle className="w-4 h-4" /> : <div className="w-4 h-4 border border-gray-300 rounded" />}
                Valid CSV file with product data
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}