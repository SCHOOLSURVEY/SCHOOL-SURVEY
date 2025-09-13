import { NextRequest, NextResponse } from 'next/server'
import { DatabaseService } from '@/lib/database-server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const schoolId = searchParams.get('schoolId')
    
    if (!schoolId) {
      return NextResponse.json({ error: 'School ID is required' }, { status: 400 })
    }

    const terms = await DatabaseService.getTermsBySchool(schoolId)
    return NextResponse.json({ terms })
  } catch (error) {
    console.error('Error fetching terms:', error)
    return NextResponse.json({ error: 'Failed to fetch terms' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const term = await DatabaseService.createTerm(body)
    return NextResponse.json({ term })
  } catch (error) {
    console.error('Error creating term:', error)
    return NextResponse.json({ error: 'Failed to create term' }, { status: 500 })
  }
}
