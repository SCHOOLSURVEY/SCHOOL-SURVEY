"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface MobileFormProps extends React.FormHTMLAttributes<HTMLFormElement> {
  children: React.ReactNode
}

export function MobileForm({ children, className, ...props }: MobileFormProps) {
  return (
    <form className={cn("space-y-4 sm:space-y-6", className)} {...props}>
      {children}
    </form>
  )
}

interface MobileFormGridProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  cols?: 1 | 2 | 3 | 4
}

export function MobileFormGrid({ children, className, cols = 1, ...props }: MobileFormGridProps) {
  const gridCols = {
    1: "grid-cols-1",
    2: "grid-cols-1 sm:grid-cols-2",
    3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
  }
  
  return (
    <div className={cn("grid gap-4", gridCols[cols], className)} {...props}>
      {children}
    </div>
  )
}

interface MobileFormFieldProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  span?: 1 | 2 | 3 | 4
}

export function MobileFormField({ children, className, span = 1, ...props }: MobileFormFieldProps) {
  const spanClass = {
    1: "",
    2: "sm:col-span-2",
    3: "sm:col-span-2 lg:col-span-3",
    4: "sm:col-span-2 lg:col-span-4"
  }
  
  return (
    <div className={cn("space-y-2", spanClass[span], className)} {...props}>
      {children}
    </div>
  )
}

interface MobileFormActionsProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  align?: "left" | "center" | "right" | "between"
}

export function MobileFormActions({ children, className, align = "right", ...props }: MobileFormActionsProps) {
  const alignClass = {
    left: "justify-start",
    center: "justify-center",
    right: "justify-end",
    between: "justify-between"
  }
  
  return (
    <div className={cn(
      "flex flex-col sm:flex-row gap-2 sm:gap-4",
      alignClass[align],
      className
    )} {...props}>
      {children}
    </div>
  )
}

export {
  MobileForm as Form,
  MobileFormGrid as FormGrid,
  MobileFormField as FormField,
  MobileFormActions as FormActions,
}

