"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useActionState, useState } from "react"
import { addProduct, updateProduct } from "../../actions/products"
import { Product, Category } from "@/app/generated/prisma"
import Image from "next/image"
import { Upload, X, Loader2, Eye, EyeOff, Package, DollarSign, FileText, Image as ImageIcon, ShoppingCart } from "lucide-react"

export function ProductForm({ 
  product, 
  categories 
}: { 
  product?: Product | null
  categories: Category[]
}) {
  // Fix: Don't default to any category when creating new product
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(
    product?.categoryId?.toString() || ""
  )
  const [singleSize, setSingleSize] = useState<string>(
    product?.size && product.size.length > 0 ? product.size[0].toString() : ""
  )
  const [imageUrl, setImageUrl] = useState(product?.imgurl || "")
  const [uploading, setUploading] = useState(false)
  const [isVisible, setIsVisible] = useState(product?.isVisible ?? true)
  const [looseSell, setLooseSell] = useState(product?.LooseSell ?? false)

  const [state, action, isPending] = useActionState(
    product == null ? addProduct : updateProduct.bind(null, product.id), 
    { message: " " }
  )

  const fcurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount)
  }

  const uploadToGitHub = async (file: File) => {
    setUploading(true)
    try {
      const extension = file.name.split('.').pop()
      const filename = `${Date.now()}-product.${extension}`.toLowerCase()
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
          message: `Add product image: ${filename}`
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

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
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
    uploadToGitHub(file)
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">
          {product ? 'Edit Product' : 'Add New Product'}
        </h1>
        {product && (
          <div className="text-sm text-muted-foreground">
            Product ID: {product.id}
          </div>
        )}
      </div>
      
      <form action={action} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Basic Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  Basic Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Product Name *</Label>
                    <Input 
                      type="text" 
                      id="name" 
                      name="name" 
                      required 
                      defaultValue={product?.name || ""} 
                      placeholder="e.g., Sprinkler Adapter"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="sku">SKU *</Label>
                    <Input 
                      type="text" 
                      id="sku" 
                      name="sku" 
                      required 
                      defaultValue={product?.sku || ""} 
                      placeholder="e.g., SA-001"
                    />
                    <div className="text-xs text-muted-foreground">Unique product identifier</div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="categoryId">Category *</Label>
                    <Select 
                      name="categoryId" 
                      required 
                      value={selectedCategoryId}
                      onValueChange={setSelectedCategoryId}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select Category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.id.toString()}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {/* Add validation message for category selection */}
                    {!selectedCategoryId && (
                      <div className="text-xs text-amber-600">Please select a category</div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="unit">Unit *</Label>
                    <Select name="unit" required defaultValue={product?.unit || ""}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select unit" />
                      </SelectTrigger>
                      <SelectContent>
                        {/* Length/Distance Units */}
                        <SelectItem value="mtr">Meter (mtr)</SelectItem>
                        <SelectItem value="MTR">Meter (MTR)</SelectItem>
                        
                        {/* Piece/Count Units */}
                        <SelectItem value="pis">Piece (pis)</SelectItem>
                        <SelectItem value="pes">Piece (pes)</SelectItem>
                        <SelectItem value="pie">Piece (pie)</SelectItem>
                        
                        {/* Volume Units */}
                        <SelectItem value="Ltr">Liter (Ltr)</SelectItem>
                        <SelectItem value="ltr">Liter (ltr)</SelectItem>
                        <SelectItem value="ml">Milliliter (ml)</SelectItem>
                        <SelectItem value="ML">Milliliter (ML)</SelectItem>
                        
                        {/* Weight Units */}
                        <SelectItem value="kg">Kilogram (kg)</SelectItem>
                        <SelectItem value="KG">Kilogram (KG)</SelectItem>
                        <SelectItem value="gm">Gram (gm)</SelectItem>
                        <SelectItem value="gram">Gram</SelectItem>
                        
                        {/* Container Units */}
                        <SelectItem value="pack">Pack</SelectItem>
                        <SelectItem value="pkt">Packet (pkt)</SelectItem>
                        <SelectItem value="box">Box</SelectItem>
                        <SelectItem value="btl">Bottle (btl)</SelectItem>
                        <SelectItem value="tin">Tin</SelectItem>
                        <SelectItem value="set">Set</SelectItem>
                        
                        {/* Special Units */}
                        <SelectItem value="single">Single</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Product Details Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Product Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="descr">Description *</Label>
                  <Textarea
                    id="descr"
                    name="descr"
                    required
                    defaultValue={product?.descr || ""}
                    placeholder="Describe your product in detail (e.g., Sprinkler adapter for irrigation systems)"
                    rows={6}
                    className="resize-none"
                  />
                  <div className="text-xs text-muted-foreground">
                    Provide a detailed description that helps customers understand your product
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="size">Size</Label>
                    <Input 
                      type="number" 
                      id="size" 
                      name="size" 
                      value={singleSize}
                      onChange={(e) => setSingleSize(e.target.value)}
                      placeholder="e.g., 25"
                      step="0.01"
                    />
                    <div className="text-xs text-muted-foreground">Numeric value</div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="weight">Weight</Label>
                    <Input 
                      type="text" 
                      id="weight" 
                      name="weight" 
                      defaultValue={product?.weight || ""}
                      placeholder="e.g., 250g"
                    />
                    <div className="text-xs text-muted-foreground">With unit</div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="packaging">Packaging</Label>
                    <Input 
                      type="number" 
                      id="packaging" 
                      name="packaging" 
                      defaultValue={product?.packaging || ""} 
                      placeholder="e.g., 250"
                    />
                    <div className="text-xs text-muted-foreground">Pack quantity</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Image, Pricing & Settings */}
          <div className="space-y-6">
            {/* Product Image Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ImageIcon className="w-5 h-5" />
                  Product Image *
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-gray-400 transition-colors">
                  {imageUrl ? (
                    <div className="space-y-3">
                      <Image 
                        src={imageUrl} 
                        alt="Product image" 
                        width={200} 
                        height={200} 
                        className="mx-auto rounded-lg object-cover shadow-md"
                        unoptimized 
                      />
                      <div className="flex gap-2 justify-center">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setImageUrl("")}
                        >
                          <X className="w-4 h-4 mr-1" />
                          Remove
                        </Button>
                        <label className="cursor-pointer">
                          <Button type="button" variant="outline" size="sm" asChild>
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
                            disabled={uploading}
                          />
                        </label>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <Upload className="w-12 h-12 mx-auto text-gray-400" />
                      <div>
                        <label className="cursor-pointer">
                          <span className="text-blue-600 hover:text-blue-500 font-medium">
                            Click to upload image
                          </span>
                          <input
                            type="file"
                            className="hidden"
                            accept="image/*"
                            onChange={handleImageUpload}
                            disabled={uploading}
                          />
                        </label>
                      </div>
                      <p className="text-sm text-gray-500">PNG, JPG up to 2MB</p>
                    </div>
                  )}
                  {uploading && (
                    <div className="flex items-center justify-center space-x-2 mt-4">
                      <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
                      <span className="text-blue-600 text-sm">Uploading...</span>
                    </div>
                  )}
                </div>
                {!imageUrl && (
                  <p className="text-sm text-amber-600 mt-2 flex items-center">
                    <Upload className="w-4 h-4 mr-1" />
                    Image required before saving
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Pricing Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  Pricing
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Label htmlFor="price">Price (₹) *</Label>
                  <Input
                    type="number"
                    id="price"
                    name="price"
                    required
                    min="0.01"
                    step="0.01"
                    defaultValue={product?.price || ""}
                    placeholder="e.g., 1.7"
                    className="text-lg font-medium"
                  />
                  <div className="text-xs text-muted-foreground">
                    Price per unit
                  </div>
                  {product?.price && (
                    <div className="text-sm text-green-600 font-medium">
                      Current: {fcurrency(parseFloat(product.price.toString()))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Product Settings Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5" />
                  Product Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Visibility Settings */}
                <div className="flex items-center space-x-3 p-3 border rounded-lg bg-gray-50">
                  {isVisible ? (
                    <Eye className="w-5 h-5 text-green-600" />
                  ) : (
                    <EyeOff className="w-5 h-5 text-red-600" />
                  )}
                  <div className="flex-1">
                    <div className="font-medium text-sm">
                      {isVisible ? "Visible to customers" : "Hidden from customers"}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {isVisible 
                        ? "Product appears in catalog" 
                        : "Product hidden from catalog"
                      }
                    </div>
                  </div>
                  <Switch
                    checked={isVisible}
                    onCheckedChange={setIsVisible}
                  />
                </div>

                {/* Loose Sell Settings */}
                <div className="flex items-center space-x-3 p-3 border rounded-lg bg-gray-50">
                  <Package className={`w-5 h-5 ${looseSell ? 'text-blue-600' : 'text-gray-400'}`} />
                  <div className="flex-1">
                    <div className="font-medium text-sm">
                      {looseSell ? "Loose selling enabled" : "Package selling only"}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {looseSell 
                        ? "Can be sold in custom quantities" 
                        : "Sold in predefined package quantities"
                      }
                    </div>
                  </div>
                  <Switch
                    checked={looseSell}
                    onCheckedChange={setLooseSell}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Hidden inputs */}
        <input type="hidden" name="isVisible" value={isVisible.toString()} />
        <input type="hidden" name="LooseSell" value={looseSell.toString()} />
        <input type="hidden" name="imgurl" value={imageUrl} />

        {/* Form Actions */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4 justify-between">
              <div className="flex gap-4">
                <Button 
                  type="submit" 
                  disabled={isPending || uploading || !imageUrl || !selectedCategoryId}
                  className="min-w-[140px]"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    product ? 'Update Product' : 'Add Product'
                  )}
                </Button>
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </div>
              
              {product && (
                <Button type="button" variant="destructive" size="sm">
                  Delete Product
                </Button>
              )}
            </div>

            {state.message && state.message !== " " && (
              <div className={`mt-4 p-3 rounded-md ${
                state.message === "" ? "bg-green-50 text-green-800 border border-green-200" : "bg-red-50 text-red-800 border border-red-200"
              }`}>
                {state.message === "" ? "✅ Product saved successfully!" : `❌ ${state.message}`}
              </div>
            )}
          </CardContent>
        </Card>
      </form>
    </div>
  )
}