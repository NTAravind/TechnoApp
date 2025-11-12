'use client'
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
import { ArrowUpDown, ChevronDown, Eye, CheckCircle, XCircle, Clock, Truck, Package } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
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
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { fcurrency } from '@/lib/utils'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export type Order = {
  id: string // UUID string, not number
  customerId: number
  paid: boolean
  paymentid: string
  delivered: boolean
  complete: boolean
  customer: {
    id: number
    name: string
    phone: string
    email: string | null
    isDistributor: boolean
  }
  items: Array<{
    id: number
    quantity: number
    price: number
    product: {
      id: number
      name: string
      sku: string
      unit: string
    }
  }>
  total: number
  createdAt: Date | string // Allow both Date objects and ISO strings
  updatedAt: Date | string
}

interface OrdersTableProps {
  data: Order[]
}

export function OrdersTable({ data }: OrdersTableProps) {
  const [sorting, setSorting] = React.useState<SortingState>([
    { id: 'createdAt', desc: true } // Sort by newest first
  ])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState({})

  const columns: ColumnDef<Order>[] = [
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
      accessorKey: 'id',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Order #
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => (
        <div className="font-mono font-medium">#{row.getValue('id')}</div>
      ),
    },
    {
      accessorKey: 'customer.name',
      id: 'customerName',
      header: 'Customer',
      cell: ({ row }) => {
        const customer = row.original.customer
        return (
          <div>
            <div className="flex items-center gap-2">
              <span className="font-medium">{customer.name}</span>
              {customer.isDistributor && (
                <Badge variant="outline" className="text-xs">
                  Distributor
                </Badge>
              )}
            </div>
            <div className="text-sm text-muted-foreground">{customer.phone}</div>
          </div>
        )
      },
      filterFn: (row, id, value) => {
        return row.original.customer.name.toLowerCase().includes(value.toLowerCase())
      },
    },
    {
      id: 'itemCount',
      header: 'Items',
      cell: ({ row }) => {
        const items = row.original.items
        return (
          <Badge variant="secondary">
            {items.length} item{items.length !== 1 ? 's' : ''}
          </Badge>
        )
      },
    },
    {
      accessorKey: 'total',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Total
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => {
        const total = parseFloat(row.getValue('total'))
        return <div className="font-medium">{fcurrency(total)}</div>
      },
    },
    {
      accessorKey: 'paid',
      id: 'paid',
      header: 'Payment',
      cell: ({ row }) => {
        const paid = row.getValue('paid') as boolean
        return (
          <div className="flex items-center gap-1">
            {paid ? (
              <CheckCircle className="h-4 w-4 text-green-500" />
            ) : (
              <XCircle className="h-4 w-4 text-red-500" />
            )}
            <span className="text-sm">{paid ? 'Paid' : 'Unpaid'}</span>
          </div>
        )
      },
      filterFn: (row, id, value) => {
        if (value === undefined) return true
        return row.getValue('paid') === value
      },
    },
    {
      id: 'fulfillmentType',
      accessorFn: (row) => row.delivered,
      header: 'Type',
      cell: ({ row }) => {
        const delivered = row.original.delivered
        return (
          <div className="flex items-center gap-1">
            {delivered ? (
              <>
                <Truck className="h-4 w-4 text-blue-500" />
                <span className="text-sm">Delivery</span>
              </>
            ) : (
              <>
                <Package className="h-4 w-4 text-orange-500" />
                <span className="text-sm">Pickup</span>
              </>
            )}
          </div>
        )
      },
      filterFn: (row, id, value) => {
        if (value === undefined) return true
        return row.original.delivered === value
      },
    },
    {
      id: 'status',
      accessorFn: (row) => row.complete,
      header: 'Status',
      cell: ({ row }) => {
        const complete = row.original.complete
        if (complete) {
          return (
            <Badge variant="default" className="bg-green-500">
              <CheckCircle className="h-3 w-3 mr-1" />
              Complete
            </Badge>
          )
        } else {
          return (
            <Badge variant="outline">
              <Clock className="h-3 w-3 mr-1" />
              In Progress
            </Badge>
          )
        }
      },
      filterFn: (row, id, value) => {
        if (value === undefined) return true
        return row.original.complete === value
      },
    },
    {
      accessorKey: 'createdAt',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Date
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => {
        const dateValue = row.getValue('createdAt')
        const date = new Date(dateValue as string | Date)
        return (
          <div>
            <div>{date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
            <div className="text-sm text-muted-foreground">
              {date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        )
      },
      sortingFn: (rowA, rowB) => {
        const dateA = new Date(rowA.original.createdAt).getTime()
        const dateB = new Date(rowB.original.createdAt).getTime()
        return dateA - dateB
      },
    },
    {
      id: 'actions',
      enableHiding: false,
      cell: ({ row }) => {
        const order = row.original
        return (
          <div className="flex items-center gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href={`/admin/orders/${order.id}`}>
                <Eye className="h-4 w-4 mr-1" />
                View
              </Link>
            </Button>
          </div>
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
          placeholder="Filter by customer name..."
          value={(table.getColumn('customerName')?.getFilterValue() as string) ?? ''}
          onChange={(event) =>
            table.getColumn('customerName')?.setFilterValue(event.target.value)
          }
          className="max-w-sm"
        />
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">
              Payment Status <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuCheckboxItem
              checked={table.getColumn('paid')?.getFilterValue() === undefined}
              onCheckedChange={() => table.getColumn('paid')?.setFilterValue(undefined)}
            >
              All
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={table.getColumn('paid')?.getFilterValue() === true}
              onCheckedChange={() => table.getColumn('paid')?.setFilterValue(true)}
            >
              Paid
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={table.getColumn('paid')?.getFilterValue() === false}
              onCheckedChange={() => table.getColumn('paid')?.setFilterValue(false)}
            >
              Unpaid
            </DropdownMenuCheckboxItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">
              Fulfillment Type <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuCheckboxItem
              checked={table.getColumn('fulfillmentType')?.getFilterValue() === undefined}
              onCheckedChange={() => table.getColumn('fulfillmentType')?.setFilterValue(undefined)}
            >
              All
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={table.getColumn('fulfillmentType')?.getFilterValue() === true}
              onCheckedChange={() => table.getColumn('fulfillmentType')?.setFilterValue(true)}
            >
              Delivery
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={table.getColumn('fulfillmentType')?.getFilterValue() === false}
              onCheckedChange={() => table.getColumn('fulfillmentType')?.setFilterValue(false)}
            >
              Pickup
            </DropdownMenuCheckboxItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">
              Status <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuCheckboxItem
              checked={table.getColumn('status')?.getFilterValue() === undefined}
              onCheckedChange={() => table.getColumn('status')?.setFilterValue(undefined)}
            >
              All
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={table.getColumn('status')?.getFilterValue() === true}
              onCheckedChange={() => table.getColumn('status')?.setFilterValue(true)}
            >
              Complete
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={table.getColumn('status')?.getFilterValue() === false}
              onCheckedChange={() => table.getColumn('status')?.setFilterValue(false)}
            >
              In Progress
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
                    {column.id === 'fulfillmentType' ? 'Fulfillment Type' : 
                     column.id === 'customerName' ? 'Customer' :
                     column.id === 'itemCount' ? 'Item Count' :
                     column.id}
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
                  No results.
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