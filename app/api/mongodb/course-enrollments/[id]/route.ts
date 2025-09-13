import { NextRequest, NextResponse } from 'next/server'
import { DatabaseService } from '@/lib/database-server'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const enrollmentId = params.id
    const body = await request.json()
    
    const enrollment = await DatabaseService.updateCourseEnrollment(enrollmentId, body)
    return NextResponse.json({ enrollment })
  } catch (error) {
    console.error('Error updating course enrollment:', error)
    return NextResponse.json({ error: 'Failed to update course enrollment' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const enrollmentId = params.id
    
    await DatabaseService.deleteCourseEnrollment(enrollmentId)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting course enrollment:', error)
    return NextResponse.json({ error: 'Failed to delete course enrollment' }, { status: 500 })
  }
}
