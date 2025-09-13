import { NextRequest, NextResponse } from 'next/server'
import { DatabaseService } from '@/lib/database-server'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const questionId = params.id
    
    await DatabaseService.deleteSurveyQuestion(questionId)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting survey question:', error)
    return NextResponse.json({ error: 'Failed to delete survey question' }, { status: 500 })
  }
}


