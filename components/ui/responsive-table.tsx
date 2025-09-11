"use client"

import * as React from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { cn } from "@/lib/utils"

interface ResponsiveTableProps {
  children: React.ReactNode
  className?: string
}

export function ResponsiveTable({ children, className }: ResponsiveTableProps) {
  return (
    <div className="overflow-x-auto">
      <Table className={cn("w-full", className)}>
        {children}
      </Table>
    </div>
  )
}

interface ResponsiveTableHeaderProps {
  children: React.ReactNode
  className?: string
}

export function ResponsiveTableHeader({ children, className }: ResponsiveTableHeaderProps) {
  return (
    <TableHeader className={className}>
      {children}
    </TableHeader>
  )
}

interface ResponsiveTableBodyProps {
  children: React.ReactNode
  className?: string
}

export function ResponsiveTableBody({ children, className }: ResponsiveTableBodyProps) {
  return (
    <TableBody className={className}>
      {children}
    </TableBody>
  )
}

interface ResponsiveTableRowProps {
  children: React.ReactNode
  className?: string
}

export function ResponsiveTableRow({ children, className }: ResponsiveTableRowProps) {
  return (
    <TableRow className={className}>
      {children}
    </TableRow>
  )
}

interface ResponsiveTableHeadProps extends React.ThHTMLAttributes<HTMLTableCellElement> {
  children: React.ReactNode
  hideOn?: "sm" | "md" | "lg" | "xl"
  minWidth?: string
}

export function ResponsiveTableHead({ 
  children, 
  className, 
  hideOn, 
  minWidth,
  ...props 
}: ResponsiveTableHeadProps) {
  const hideClass = hideOn ? `hidden ${hideOn}:table-cell` : ""
  const minWidthClass = minWidth ? `min-w-[${minWidth}]` : ""
  
  return (
    <TableHead 
      className={cn(hideClass, minWidthClass, className)} 
      {...props}
    >
      {children}
    </TableHead>
  )
}

interface ResponsiveTableCellProps extends React.TdHTMLAttributes<HTMLTableCellElement> {
  children: React.ReactNode
  hideOn?: "sm" | "md" | "lg" | "xl"
  mobileContent?: React.ReactNode
}

export function ResponsiveTableCell({ 
  children, 
  className, 
  hideOn, 
  mobileContent,
  ...props 
}: ResponsiveTableCellProps) {
  const hideClass = hideOn ? `hidden ${hideOn}:table-cell` : ""
  
  return (
    <TableCell className={cn(hideClass, className)} {...props}>
      {children}
      {mobileContent && (
        <div className={`${hideOn ? `block ${hideOn}:hidden` : "hidden"} mt-2`}>
          {mobileContent}
        </div>
      )}
    </TableCell>
  )
}

export {
  ResponsiveTable as Table,
  ResponsiveTableHeader as TableHeader,
  ResponsiveTableBody as TableBody,
  ResponsiveTableRow as TableRow,
  ResponsiveTableHead as TableHead,
  ResponsiveTableCell as TableCell,
}


