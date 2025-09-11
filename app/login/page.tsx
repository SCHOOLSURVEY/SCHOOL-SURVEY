"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { supabase } from "@/lib/supabase"
import { Building2, Search, ArrowRight, Users } from "lucide-react"

interface School {
  id: string
  name: string
  slug: string
  abbreviation: string
  primary_color: string
  secondary_color: string
  logo_url?: string
}

export default function DirectLoginPage() {
  const [schools, setSchools] = useState<School[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    fetchSchools()
  }, [])

  const fetchSchools = async () => {
    try {
      const { data, error } = await supabase
        .from("schools")
        .select("id, name, slug, abbreviation, primary_color, secondary_color, logo_url")
        .eq("is_active", true)
        .order("name")

      if (error) throw error
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
    // Redirect to school-specific login page
    router.push(`/${school.slug}/auth/login`)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600">Loading schools...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <Building2 className="w-8 h-8 text-blue-600" />
          </div>
          <CardTitle className="text-3xl font-bold text-gray-900">Select Your School</CardTitle>
          <CardDescription className="text-lg text-gray-600">
            Choose your school to access the login portal
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {error && (
            <Alert className="border-red-200 bg-red-50">
              <AlertDescription className="text-red-800">{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="search">Search Schools</Label>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                id="search"
                type="text"
                placeholder="Search by school name or abbreviation..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredSchools.map((school) => (
              <Card 
                key={school.id} 
                className="cursor-pointer hover:shadow-lg transition-all duration-200 border-2 hover:border-blue-300"
                onClick={() => handleSchoolSelect(school)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    {school.logo_url ? (
                      <img 
                        src={school.logo_url} 
                        alt={`${school.name} Logo`}
                        className="w-12 h-12 object-contain rounded"
                      />
                    ) : (
                      <div 
                        className="w-12 h-12 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: `${school.primary_color}20` }}
                      >
                        <Building2 
                          className="w-6 h-6" 
                          style={{ color: school.primary_color }}
                        />
                      </div>
                    )}
                    
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 truncate">
                        {school.name}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {school.abbreviation}
                      </p>
                    </div>
                    
                    <ArrowRight className="w-5 h-5 text-gray-400" />
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
  )
}

