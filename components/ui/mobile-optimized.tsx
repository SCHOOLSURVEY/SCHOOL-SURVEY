"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface MobileOptimizedProps {
  children: React.ReactNode
  className?: string
}

export function MobileOptimized({ children, className }: MobileOptimizedProps) {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  return (
    <div className={cn(
      isMobile ? "px-2 py-1" : "px-4 py-2",
      className
    )}>
      {children}
    </div>
  )
}

interface MobileCardProps {
  title: string
  description?: string
  children: React.ReactNode
  className?: string
  compact?: boolean
}

export function MobileCard({ title, description, children, className, compact = false }: MobileCardProps) {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  if (isMobile && compact) {
    return (
      <div className={cn("bg-white rounded-lg border p-3", className)}>
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-medium text-sm">{title}</h3>
        </div>
        {children}
      </div>
    )
  }

  return (
    <Card className={className}>
      <CardHeader className={isMobile ? "pb-2" : ""}>
        <CardTitle className={isMobile ? "text-lg" : ""}>{title}</CardTitle>
        {description && (
          <CardDescription className={isMobile ? "text-sm" : ""}>
            {description}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className={isMobile ? "pt-0" : ""}>
        {children}
      </CardContent>
    </Card>
  )
}

interface MobileTableProps {
  headers: string[]
  rows: (string | React.ReactNode)[][]
  className?: string
}

export function MobileTable({ headers, rows, className }: MobileTableProps) {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  if (isMobile) {
    return (
      <div className={cn("space-y-2", className)}>
        {rows.map((row, index) => (
          <div key={index} className="bg-white border rounded-lg p-3">
            {headers.map((header, headerIndex) => (
              <div key={headerIndex} className="flex justify-between items-center py-1">
                <span className="text-sm font-medium text-gray-600">{header}:</span>
                <span className="text-sm">{row[headerIndex]}</span>
              </div>
            ))}
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className={cn("overflow-x-auto", className)}>
      <table className="w-full border-collapse border border-gray-200">
        <thead>
          <tr className="bg-gray-50">
            {headers.map((header, index) => (
              <th key={index} className="border border-gray-200 px-4 py-2 text-left text-sm font-medium">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={index} className="hover:bg-gray-50">
              {row.map((cell, cellIndex) => (
                <td key={cellIndex} className="border border-gray-200 px-4 py-2 text-sm">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

interface MobileTabsProps {
  tabs: { id: string; label: string; content: React.ReactNode }[]
  defaultTab?: string
  className?: string
}

export function MobileTabs({ tabs, defaultTab, className }: MobileTabsProps) {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  if (isMobile) {
    return (
      <div className={className}>
        <div className="flex space-x-1 mb-4 overflow-x-auto">
          {tabs.map((tab) => (
            <Button
              key={tab.id}
              variant={activeTab === tab.id ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveTab(tab.id)}
              className="whitespace-nowrap"
            >
              {tab.label}
            </Button>
          ))}
        </div>
        <div>
          {tabs.find(tab => tab.id === activeTab)?.content}
        </div>
      </div>
    )
  }

  return (
    <div className={className}>
      <div className="flex space-x-1 mb-4">
        {tabs.map((tab) => (
          <Button
            key={tab.id}
            variant={activeTab === tab.id ? "default" : "outline"}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </Button>
        ))}
      </div>
      <div>
        {tabs.find(tab => tab.id === activeTab)?.content}
      </div>
    </div>
  )
}

interface MobileGridProps {
  children: React.ReactNode
  className?: string
  cols?: { mobile: number; desktop: number }
}

export function MobileGrid({ children, className, cols = { mobile: 1, desktop: 3 } }: MobileGridProps) {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const gridCols = isMobile ? cols.mobile : cols.desktop

  return (
    <div className={cn(
      `grid gap-4`,
      gridCols === 1 && "grid-cols-1",
      gridCols === 2 && "grid-cols-1 md:grid-cols-2",
      gridCols === 3 && "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
      gridCols === 4 && "grid-cols-1 md:grid-cols-2 lg:grid-cols-4",
      className
    )}>
      {children}
    </div>
  )
}

interface MobileBadgeProps {
  children: React.ReactNode
  variant?: "default" | "secondary" | "destructive" | "outline"
  className?: string
}

export function MobileBadge({ children, variant = "default", className }: MobileBadgeProps) {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  return (
    <Badge 
      variant={variant} 
      className={cn(
        isMobile ? "text-xs px-2 py-1" : "",
        className
      )}
    >
      {children}
    </Badge>
  )
}

interface MobileButtonProps {
  children: React.ReactNode
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
  size?: "default" | "sm" | "lg" | "icon"
  className?: string
  onClick?: () => void
  disabled?: boolean
  fullWidth?: boolean
}

export function MobileButton({ 
  children, 
  variant = "default", 
  size = "default", 
  className, 
  onClick, 
  disabled,
  fullWidth = false 
}: MobileButtonProps) {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  return (
    <Button
      variant={variant}
      size={isMobile ? "sm" : size}
      className={cn(
        isMobile && fullWidth ? "w-full" : "",
        className
      )}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </Button>
  )
}

