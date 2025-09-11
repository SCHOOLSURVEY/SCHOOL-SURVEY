"use client"

import * as React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface MobileCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

export function MobileCard({ children, className, ...props }: MobileCardProps) {
  return (
    <Card className={cn("w-full", className)} {...props}>
      {children}
    </Card>
  )
}

interface MobileCardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  mobileLayout?: boolean
}

export function MobileCardHeader({ children, className, mobileLayout = true, ...props }: MobileCardHeaderProps) {
  return (
    <CardHeader className={cn(
      mobileLayout && "flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0",
      className
    )} {...props}>
      {children}
    </CardHeader>
  )
}

interface MobileCardTitleProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  icon?: React.ReactNode
}

export function MobileCardTitle({ children, icon, className, ...props }: MobileCardTitleProps) {
  return (
    <CardTitle className={cn("flex items-center space-x-2", className)} {...props}>
      {icon}
      <span>{children}</span>
    </CardTitle>
  )
}

interface MobileCardDescriptionProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  hideOnMobile?: boolean
}

export function MobileCardDescription({ children, className, hideOnMobile = false, ...props }: MobileCardDescriptionProps) {
  return (
    <CardDescription className={cn(
      "text-sm",
      hideOnMobile && "hidden sm:block",
      className
    )} {...props}>
      {children}
    </CardDescription>
  )
}

interface MobileCardContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

export function MobileCardContent({ children, className, ...props }: MobileCardContentProps) {
  return (
    <CardContent className={cn("p-4 sm:p-6", className)} {...props}>
      {children}
    </CardContent>
  )
}

export {
  MobileCard as Card,
  MobileCardHeader as CardHeader,
  MobileCardTitle as CardTitle,
  MobileCardDescription as CardDescription,
  MobileCardContent as CardContent,
}


