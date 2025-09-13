import { NextRequest, NextResponse } from 'next/server'
import { DatabaseService } from '@/lib/database-server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const schoolId = searchParams.get('schoolId')
    const surveyId = searchParams.get('surveyId')
    const studentId = searchParams.get('studentId')
    
    if (schoolId) {
      const responses = await DatabaseService.getSurveyResponsesBySchool(schoolId)
      return NextResponse.json({ responses })
    }

    if (surveyId && studentId) {
      const responses = await DatabaseService.getSurveyResponses(surveyId, studentId)
      return NextResponse.json({ responses })
    }

    return NextResponse.json({ error: 'Missing parameters' }, { status: 400 })
  } catch (error) {
    console.error('Error fetching survey responses:', error)
    return NextResponse.json({ error: 'Failed to fetch survey responses' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const response = await DatabaseService.createSurveyResponse(body)
    return NextResponse.json({ response })
  } catch (error) {
    console.error('Error creating survey response:', error)
    return NextResponse.json({ error: 'Failed to create survey response' }, { status: 500 })
  }
}
