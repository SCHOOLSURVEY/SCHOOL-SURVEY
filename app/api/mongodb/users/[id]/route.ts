import { NextRequest, NextResponse } from 'next/server'
import { DatabaseService } from '@/lib/database-server'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = params.id
    
    await DatabaseService.deleteUser(userId)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting user:', error)
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 })
  }
}
