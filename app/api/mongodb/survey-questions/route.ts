import { NextRequest, NextResponse } from 'next/server'
import { DatabaseService } from '@/lib/database-server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const surveyId = searchParams.get('surveyId')
    
    if (!surveyId) {
      return NextResponse.json({ error: 'Survey ID is required' }, { status: 400 })
    }

    const questions = await DatabaseService.getSurveyQuestions(surveyId)
    return NextResponse.json({ questions })
  } catch (error) {
    console.error('Error fetching survey questions:', error)
    return NextResponse.json({ error: 'Failed to fetch survey questions' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { questions } = body
    
    if (!questions || !Array.isArray(questions)) {
      return NextResponse.json({ error: 'Questions array is required' }, { status: 400 })
    }

    const createdQuestions = await DatabaseService.createSurveyQuestions(questions)
    return NextResponse.json({ questions: createdQuestions })
  } catch (error) {
    console.error('Error creating survey questions:', error)
    return NextResponse.json({ error: 'Failed to create survey questions' }, { status: 500 })
  }
}
