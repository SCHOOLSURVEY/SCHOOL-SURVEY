import { NextRequest, NextResponse } from 'next/server'
import { DatabaseService } from '@/lib/database-server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const schoolId = searchParams.get('schoolId')
    
    if (!schoolId) {
      return NextResponse.json({ error: 'School ID is required' }, { status: 400 })
    }

    const enrollments = await DatabaseService.getAllCourseEnrollments(schoolId)
    return NextResponse.json({ enrollments })
  } catch (error) {
    console.error('Error fetching course enrollments:', error)
    return NextResponse.json({ error: 'Failed to fetch course enrollments' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const enrollment = await DatabaseService.createCourseEnrollment(body)
    return NextResponse.json({ enrollment })
  } catch (error) {
    console.error('Error creating course enrollment:', error)
    return NextResponse.json({ error: 'Failed to create course enrollment' }, { status: 500 })
  }
}


