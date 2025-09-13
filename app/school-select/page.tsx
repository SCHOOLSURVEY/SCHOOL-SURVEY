"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { DatabaseService } from "@/lib/database-client"
import { Building2, Search, ArrowRight, Users } from "lucide-react"
import { AnimatedBackground } from "@/components/ui/animated-background"

interface School {
  _id: string
  name: string
  slug: string
  abbreviation: string
  primary_color: string
  secondary_color: string
  logo_url?: string
}

export default function SchoolSelectPage() {
  const [schools, setSchools] = useState<School[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [navigating, setNavigating] = useState(false)
  const router = useRouter()

  useEffect(() => {
    fetchSchools()
  }, [])

  const fetchSchools = async () => {
    try {
      const data = await DatabaseService.getAllSchools()
      setSchools(data || [])
    } catch (error: any) {
      console.error("Error fetching schools:", error)
      setError("Failed to load schools. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const filteredSchools = schools.filter(school =>
    school.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    school.abbreviation.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleSchoolSelect = (school: School) => {
    setNavigating(true)
    // Redirect to school-specific login page
    router.push(`/${school.slug}/auth/login`)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-green mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600">Loading schools...</p>
        </div>
      </div>
    )
  }

  if (navigating) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-green mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600">Redirecting to login...</p>
        </div>
      </div>
    )
  }

  return (
    <AnimatedBackground>
      <div className="w-full max-w-4xl mx-2 sm:mx-0">
        <Card className="w-full shadow-xl border border-gray-200 bg-white">
        <CardHeader className="text-center bg-gradient-to-r from-emerald-green/5 to-royal-blue/5 p-4 sm:p-6">
          <div className="mx-auto w-12 h-12 sm:w-16 sm:h-16 bg-emerald-green/10 rounded-full flex items-center justify-center mb-3 sm:mb-4 shadow-lg">
            <Building2 className="w-6 h-6 sm:w-8 sm:h-8 text-emerald-green" />
          </div>
          <CardTitle className="text-2xl sm:text-3xl font-bold text-almost-black">SchoolSurvey</CardTitle>
          <CardDescription className="text-base sm:text-lg text-almost-black/70">
            Choose your school to access the survey portal
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4 sm:space-y-6 p-4 sm:p-6">
          {error && (
            <Alert className="border-red-200 bg-red-50">
              <AlertDescription className="text-red-800 text-sm">{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="search" className="text-sm font-medium">Search Schools</Label>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                id="search"
                type="text"
                placeholder="Search by school name or abbreviation..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 text-sm sm:text-base"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {filteredSchools.map((school) => (
              <Card 
                key={school._id} 
                className="cursor-pointer card-hover border-2 hover:border-emerald-green group bg-pure-white"
                onClick={(e) => {
                  e.preventDefault()
                  handleSchoolSelect(school)
                }}
              >
                <CardContent className="p-3 sm:p-4">
                  <div className="flex items-center space-x-2 sm:space-x-3">
                    {school.logo_url ? (
                      <img 
                        src={school.logo_url} 
                        alt={`${school.name} Logo`}
                        className="w-10 h-10 sm:w-12 sm:h-12 object-contain rounded flex-shrink-0"
                      />
                    ) : (
                      <div 
                        className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: `${school.primary_color}20` }}
                      >
                        <Building2 
                          className="w-5 h-5 sm:w-6 sm:h-6" 
                          style={{ color: school.primary_color }}
                        />
                      </div>
                    )}
                    
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-almost-black truncate group-hover:text-emerald-green transition-colors text-sm sm:text-base">
                        {school.name}
                      </h3>
                      <p className="text-xs sm:text-sm text-almost-black/60 truncate">
                        {school.abbreviation}
                      </p>
                    </div>
                    
                    <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 text-royal-blue group-hover:text-emerald-green transition-colors flex-shrink-0" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredSchools.length === 0 && searchTerm && (
            <div className="text-center py-8">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No schools found matching "{searchTerm}"</p>
              <Button 
                variant="outline" 
                onClick={() => setSearchTerm("")}
                className="mt-2"
              >
                Clear Search
              </Button>
            </div>
          )}

          {filteredSchools.length === 0 && !searchTerm && (
            <div className="text-center py-8">
              <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No schools available at the moment</p>
            </div>
          )}

          <div className="text-center pt-4 border-t">
            <p className="text-sm text-gray-500">
              Can't find your school? Contact your administrator for assistance.
            </p>
          </div>
        </CardContent>
        </Card>
      </div>
    </AnimatedBackground>
  )
}


