import { NextRequest, NextResponse } from 'next/server'
import { DatabaseService } from '@/lib/database-server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const courseId = searchParams.get('courseId')
    const schoolId = searchParams.get('schoolId')

    if (courseId) {
      const surveys = await DatabaseService.getSurveysByCourse(courseId)
      return NextResponse.json({ surveys })
    }

    if (schoolId) {
      const surveys = await DatabaseService.getSurveysBySchool(schoolId)
      return NextResponse.json({ surveys })
    }

    return NextResponse.json({ error: 'Missing parameters' }, { status: 400 })
  } catch (error) {
    console.error('Error fetching surveys:', error)
    return NextResponse.json({ error: 'Failed to fetch surveys' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const survey = await DatabaseService.createSurvey(body)
    return NextResponse.json({ survey })
  } catch (error) {
    console.error('Error creating survey:', error)
    return NextResponse.json({ error: 'Failed to create survey' }, { status: 500 })
  }
}
