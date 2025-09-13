import { NextRequest, NextResponse } from 'next/server'
import { DatabaseService } from '@/lib/database-server'

export async function GET() {
  try {
    const schools = await DatabaseService.getAllSchools()
    return NextResponse.json({ schools })
  } catch (error) {
    console.error('Error fetching schools:', error)
    return NextResponse.json({ error: 'Failed to fetch schools' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const school = await DatabaseService.createSchool(body)
    return NextResponse.json({ school })
  } catch (error) {
    console.error('Error creating school:', error)
    return NextResponse.json({ error: 'Failed to create school' }, { status: 500 })
  }
}
