import { NextRequest, NextResponse } from 'next/server';
import { DatabaseService } from '@/lib/database-server';

export async function GET(request: NextRequest) {
  try {
    // Get notifications for admin users
    const notifications = await DatabaseService.getAllNotifications();

    return NextResponse.json({ notifications });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const { title, message, type = 'info', user_id, target_role } = body;

    if (!title || !message) {
      return NextResponse.json(
        { error: 'Title and message are required' },
        { status: 400 }
      );
    }

    // Create notification
    const notification = await DatabaseService.createNotification({
      title,
      message,
      type,
      user_id,
      target_role,
      is_read: false
    });

    return NextResponse.json({ notification });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}