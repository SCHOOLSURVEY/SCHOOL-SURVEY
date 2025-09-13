import { NextRequest, NextResponse } from 'next/server'
import { DatabaseService } from '@/lib/database-server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const schoolId = searchParams.get('schoolId')
    const role = searchParams.get('role')
    const email = searchParams.get('email')

    if (email) {
      const user = await DatabaseService.getUserByEmail(email)
      return NextResponse.json({ user })
    }

    if (schoolId && role) {
      const users = await DatabaseService.getUsersByRole(schoolId, role)
      return NextResponse.json({ users })
    }

    if (schoolId) {
      const users = await DatabaseService.getUsersBySchool(schoolId)
      return NextResponse.json({ users })
    }

    return NextResponse.json({ error: 'Missing parameters' }, { status: 400 })
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const user = await DatabaseService.createUser(body)
    return NextResponse.json({ user })
  } catch (error) {
    console.error('Error creating user:', error)
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('id')
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    const body = await request.json()
    const user = await DatabaseService.updateUser(userId, body)
    return NextResponse.json({ user })
  } catch (error) {
    console.error('Error updating user:', error)
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 })
  }
}
