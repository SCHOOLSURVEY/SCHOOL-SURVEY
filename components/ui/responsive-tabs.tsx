"use client"

import * as React from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"

interface ResponsiveTabsProps {
  defaultValue: string
  children: React.ReactNode
  className?: string
}

interface TabItem {
  value: string
  label: string
}

export function ResponsiveTabs({ defaultValue, children, className }: ResponsiveTabsProps) {
  const [activeTab, setActiveTab] = React.useState(defaultValue)
  
  // Extract tab items from children
  const tabItems: TabItem[] = React.useMemo(() => {
    const items: TabItem[] = []
    React.Children.forEach(children, (child) => {
      if (React.isValidElement(child) && child.type === ResponsiveTabsList) {
        React.Children.forEach(child.props.children, (tabChild) => {
          if (React.isValidElement(tabChild) && tabChild.type === ResponsiveTabsTrigger) {
            items.push({
              value: tabChild.props.value,
              label: tabChild.props.children
            })
          }
        })
      }
    })
    return items
  }, [children])

  return (
    <div className={cn("space-y-4", className)}>
      {/* Mobile: Select dropdown */}
      <div className="block sm:hidden">
        <Select value={activeTab} onValueChange={setActiveTab}>
          <SelectTrigger className="w-full h-12 text-base">
            <SelectValue placeholder="Select a tab" />
          </SelectTrigger>
          <SelectContent>
            {tabItems.map((item) => (
              <SelectItem key={item.value} value={item.value} className="text-base py-3">
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Mobile: Show active tab indicator */}
      <div className="block sm:hidden">
        <div className="flex items-center justify-center">
          <div className="bg-white rounded-lg px-4 py-2 shadow-sm border">
            <span className="text-sm font-medium">
              {tabItems.find(item => item.value === activeTab)?.label || 'Overview'}
            </span>
          </div>
        </div>
      </div>

      {/* Desktop: Traditional tabs */}
      <div className="hidden sm:block">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          {React.Children.map(children, (child) => {
            if (React.isValidElement(child) && child.type === ResponsiveTabsList) {
              return child
            }
            return null
          })}
        </Tabs>
      </div>

      {/* Content - Only render TabsContent children */}
      <Tabs value={activeTab} className="block">
        {React.Children.map(children, (child) => {
          if (React.isValidElement(child) && child.type === ResponsiveTabsContent) {
            return child
          }
          return null
        })}
      </Tabs>
    </div>
  )
}

interface ResponsiveTabsListProps {
  children: React.ReactNode
  className?: string
}

export function ResponsiveTabsList({ children, className }: ResponsiveTabsListProps) {
  return (
    <TabsList className={cn("grid w-full h-auto grid-cols-6", className)}>
      {children}
    </TabsList>
  )
}

interface ResponsiveTabsTriggerProps {
  value: string
  children: React.ReactNode
  className?: string
}

export function ResponsiveTabsTrigger({ value, children, className }: ResponsiveTabsTriggerProps) {
  return (
    <TabsTrigger 
      value={value} 
      className={cn("text-xs sm:text-sm px-1 sm:px-2 py-2 min-h-[44px] flex items-center justify-center", className)}
    >
      {children}
    </TabsTrigger>
  )
}

interface ResponsiveTabsContentProps {
  value: string
  children: React.ReactNode
  className?: string
}

export function ResponsiveTabsContent({ value, children, className }: ResponsiveTabsContentProps) {
  return (
    <TabsContent value={value} className={className}>
      {children}
    </TabsContent>
  )
}

export {
  ResponsiveTabs as Tabs,
  ResponsiveTabsList as TabsList,
  ResponsiveTabsTrigger as TabsTrigger,
  ResponsiveTabsContent as TabsContent,
}
