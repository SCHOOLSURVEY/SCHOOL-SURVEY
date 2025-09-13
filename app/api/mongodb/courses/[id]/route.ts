import { NextRequest, NextResponse } from 'next/server'
import { DatabaseService } from '@/lib/database-server'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const courseId = params.id
    
    const course = await DatabaseService.getCourseById(courseId)
    return NextResponse.json({ course })
  } catch (error) {
    console.error('Error fetching course:', error)
    return NextResponse.json({ error: 'Failed to fetch course' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const courseId = params.id
    
    await DatabaseService.deleteCourse(courseId)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting course:', error)
    return NextResponse.json({ error: 'Failed to delete course' }, { status: 500 })
  }
}