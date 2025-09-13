import { NextRequest, NextResponse } from 'next/server'
import { DatabaseService } from '@/lib/database-server'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const surveyId = params.id
    const body = await request.json()
    
    const survey = await DatabaseService.updateSurvey(surveyId, body)
    return NextResponse.json({ survey })
  } catch (error) {
    console.error('Error updating survey:', error)
    return NextResponse.json({ error: 'Failed to update survey' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const surveyId = params.id
    
    await DatabaseService.deleteSurvey(surveyId)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting survey:', error)
    return NextResponse.json({ error: 'Failed to delete survey' }, { status: 500 })
  }
}
