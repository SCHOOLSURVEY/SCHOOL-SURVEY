import { NextRequest, NextResponse } from 'next/server';
import { NextRequest, NextResponse } from 'next/server';
import { DatabaseService } from '@/lib/database-server';

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');
    const conversationId = searchParams.get('conversation_id');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    let query = supabase
      .from('messages')
      .select(`
        *,
        sender:sender_id(*),
        recipient:recipient_id(*)
      `);

    if (conversationId) {
      // Get messages for a specific conversation
      query = query.or(`and(sender_id.eq.${userId},recipient_id.eq.${conversationId}),and(sender_id.eq.${conversationId},recipient_id.eq.${userId})`);
    } else {
      // Get all messages for the user
      query = query.or(`sender_id.eq.${userId},recipient_id.eq.${userId}`);
    }

    const { data: messages, error } = await query.order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching messages:', error);
      return NextResponse.json(
        { error: 'Failed to fetch messages' },
        { status: 500 }
      );
    }

    return NextResponse.json({ messages });
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
    const supabase = createClient();
    const body = await request.json();
    
    const { sender_id, recipient_id, content, message_type = 'direct', course_id } = body;

    if (!sender_id || !recipient_id || !content) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const { data: message, error } = await supabase
      .from('messages')
      .insert({
        sender_id,
        recipient_id,
        content,
        message_type,
        course_id: course_id || null,
        is_read: false
      })
      .select(`
        *,
        sender:sender_id(*),
        recipient:recipient_id(*)
      `)
      .single();

    if (error) {
      console.error('Error creating message:', error);
      return NextResponse.json(
        { error: 'Failed to create message' },
        { status: 500 }
      );
    }

    return NextResponse.json({ message });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = createClient();
    const body = await request.json();
    
    const { message_id, is_read } = body;

    if (!message_id) {
      return NextResponse.json(
        { error: 'Message ID is required' },
        { status: 400 }
      );
    }

    const { data: message, error } = await supabase
      .from('messages')
      .update({ is_read })
      .eq('id', message_id)
      .select()
      .single();

    if (error) {
      console.error('Error updating message:', error);
      return NextResponse.json(
        { error: 'Failed to update message' },
        { status: 500 }
      );
    }

    return NextResponse.json({ message });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}



