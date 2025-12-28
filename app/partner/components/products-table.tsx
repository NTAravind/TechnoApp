// app/partner/products/components/products-table.tsx
'use client'
import { useRouter } from 'next/navigation'
import * as React from 'react'
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { ArrowUpDown, ChevronDown, MoreHorizontal, Eye, EyeOff, Edit, Trash } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { updatePartnerProductVisibility, deletePartnerProduct } from '@/app/partner/actions/products'
import { useSession } from 'next-auth/react'
import { fcurrency } from '@/lib/utils'

export type Product = {
  id: number
  name: string
  size: number[]
  weight: string | null
  imgurl: string | null
  unit: string
  price: number
  packaging: number | null
  descr: string | null
  sku: string
  categoryId: number
  isVisible: boolean
  category: {
    id: number
    name: string
  }
  createdAt: Date
  updatedAt: Date
}

type Category = {
  id: number
  name: string
}

interface PartnerProductsTableProps {
  data: Product[]
  categories: Category[]
}

export function PartnerProductsTable({ data, categories }: PartnerProductsTableProps) {
  const router = useRouter()
  const { data: session } = useSession()
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState({})

  const handleToggleVisibility = async (productId: number, currentVisibility: boolean) => {
    if (!session?.user?.id) return
    
    const result = await updatePartnerProductVisibility(
      productId,
      session.user.id,
      !currentVisibility
    )
    
    if (result.success) {
      router.refresh()
    } else {
      alert(result.error || 'Failed to update visibility')
    }
  }

  const handleDelete = async (productId: number) => {
    if (!session?.user?.id) return
    
    if (!confirm('Are you sure you want to delete this product? This action cannot be undone.')) {
      return
    }
    
    const result = await deletePartnerProduct(productId, session.user.id)
    
    if (result.success) {
      router.refresh()
    } else {
      alert(result.error || 'Failed to delete product')
    }
  }

  const columns: ColumnDef<Product>[] = [
    {
      id: 'select',
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: 'sku',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            SKU
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => <div className="font-mono">{row.getValue('sku')}</div>,
    },
    {
      accessorKey: 'name',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Name
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => <div className="font-medium">{row.getValue('name')}</div>,
    },
    {
      accessorKey: 'category',
      header: 'Category',
      cell: ({ row }) => {
        const category = row.getValue('category') as Product['category']
        return <Badge variant="outline">{category.name}</Badge>
      },
      filterFn: (row, id, value) => {
        const category = row.getValue('category') as Product['category']
        return category.name.toLowerCase().includes(value.toLowerCase())
      },
    },
    {
      accessorKey: 'price',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Price
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => {
        const price = parseFloat(row.getValue('price'))
        return <div className="font-medium">{fcurrency(price)}</div>
      },
    },
    {
      accessorKey: 'unit',
      header: 'Unit',
      cell: ({ row }) => <div>{row.getValue('unit')}</div>,
    },
    {
      accessorKey: 'isVisible',
      header: 'Status',
      cell: ({ row }) => {
        const isVisible = row.getValue('isVisible') as boolean
        return (
          <Badge 
            variant={isVisible ? 'default' : 'secondary'}
            className={isVisible ? 'bg-green-500' : 'bg-slate-400'}
          >
            {isVisible ? (
              <>
                <Eye className="w-3 h-3 mr-1" />
                Visible
              </>
            ) : (
              <>
                <EyeOff className="w-3 h-3 mr-1" />
                Hidden
              </>
            )}
          </Badge>
        )
      },
      filterFn: (row, id, value) => {
        if (value === undefined) return true
        return row.getValue('isVisible') === value
      },
    },
    {
      accessorKey: 'weight',
      header: 'Weight',
      cell: ({ row }) => <div>{row.getValue('weight') || '-'}</div>,
    },
    {
      accessorKey: 'packaging',
      header: 'Packaging',
      cell: ({ row }) => <div>{row.getValue('packaging') || '-'}</div>,
    },
    {
      id: 'actions',
      enableHiding: false,
      cell: ({ row }) => {
        const product = row.original

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem
                onClick={() => navigator.clipboard.writeText(product.sku)}
              >
                Copy SKU
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push(`/partner/products/${product.id}`)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit product
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleToggleVisibility(product.id, product.isVisible)}
              >
                {product.isVisible ? (
                  <>
                    <EyeOff className="mr-2 h-4 w-4" />
                    Hide product
                  </>
                ) : (
                  <>
                    <Eye className="mr-2 h-4 w-4" />
                    Show product
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-red-600"
                onClick={() => handleDelete(product.id)}
              >
                <Trash className="mr-2 h-4 w-4" />
                Delete product
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  })

  return (
    <div className="w-full">
      <div className="flex items-center py-4 gap-4 flex-wrap">
        <Input
          placeholder="Filter by product name..."
          value={(table.getColumn('name')?.getFilterValue() as string) ?? ''}
          onChange={(event) =>
            table.getColumn('name')?.setFilterValue(event.target.value)
          }
          className="max-w-sm"
        />

        <Input
          placeholder="Filter by category..."
          value={(table.getColumn('category')?.getFilterValue() as string) ?? ''}
          onChange={(event) =>
            table.getColumn('category')?.setFilterValue(event.target.value)
          }
          className="max-w-sm"
        />
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">
              Status <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuCheckboxItem
              checked={table.getColumn('isVisible')?.getFilterValue() === undefined}
              onCheckedChange={() => table.getColumn('isVisible')?.setFilterValue(undefined)}
            >
              All
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={table.getColumn('isVisible')?.getFilterValue() === true}
              onCheckedChange={() => table.getColumn('isVisible')?.setFilterValue(true)}
            >
              Visible
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={table.getColumn('isVisible')?.getFilterValue() === false}
              onCheckedChange={() => table.getColumn('isVisible')?.setFilterValue(false)}
            >
              Hidden
            </DropdownMenuCheckboxItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="ml-auto">
              Columns <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {table
              .getAllColumns()
              .filter((column) => column.getCanHide())
              .map((column) => {
                return (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className="capitalize"
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) =>
                      column.toggleVisibility(!!value)
                    }
                  >
                    {column.id}
                  </DropdownMenuCheckboxItem>
                )
              })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && 'selected'}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No products found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-end space-x-2 py-4">
        <div className="flex-1 text-sm text-muted-foreground">
          {table.getFilteredSelectedRowModel().rows.length} of{' '}
          {table.getFilteredRowModel().rows.length} row(s) selected.
        </div>
        <div className="space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  )
}