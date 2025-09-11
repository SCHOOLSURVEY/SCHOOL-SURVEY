"use client"

import * as React from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"

interface MobileTabsProps {
  defaultValue: string
  children: React.ReactNode
  className?: string
}

export function MobileTabs({ defaultValue, children, className }: MobileTabsProps) {
  return (
    <Tabs defaultValue={defaultValue} className={cn("space-y-6", className)}>
      {children}
    </Tabs>
  )
}

interface MobileTabsListProps {
  children: React.ReactNode
  className?: string
  minWidth?: string
}

export function MobileTabsList({ children, className, minWidth = "600px" }: MobileTabsListProps) {
  return (
    <div className="overflow-x-auto">
      <TabsList className={cn(
        "grid w-full min-w-0 sm:min-w-0",
        className
      )} style={{ minWidth: `min(${minWidth}, 100%)` }}>
        {children}
      </TabsList>
    </div>
  )
}

interface MobileTabsTriggerProps {
  value: string
  children: React.ReactNode
  className?: string
}

export function MobileTabsTrigger({ value, children, className }: MobileTabsTriggerProps) {
  return (
    <TabsTrigger 
      value={value} 
      className={cn("text-xs sm:text-sm px-2 sm:px-3", className)}
    >
      {children}
    </TabsTrigger>
  )
}

interface MobileTabsContentProps {
  value: string
  children: React.ReactNode
  className?: string
}

export function MobileTabsContent({ value, children, className }: MobileTabsContentProps) {
  return (
    <TabsContent value={value} className={className}>
      {children}
    </TabsContent>
  )
}

export {
  MobileTabs as Tabs,
  MobileTabsList as TabsList,
  MobileTabsTrigger as TabsTrigger,
  MobileTabsContent as TabsContent,
}


