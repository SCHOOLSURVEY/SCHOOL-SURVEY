import { NextRequest, NextResponse } from 'next/server';
import { NextRequest, NextResponse } from 'next/server';
import { DatabaseService } from '@/lib/database-server';

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');
    const courseId = searchParams.get('course_id');
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');

    let query = supabase
      .from('calendar_events')
      .select(`
        *,
        courses(id, name, class_number),
        created_by_user:created_by(full_name)
      `);

    if (courseId) {
      query = query.eq('course_id', courseId);
    }

    if (startDate) {
      query = query.gte('start_date', startDate);
    }

    if (endDate) {
      query = query.lte('start_date', endDate);
    }

    const { data: events, error } = await query.order('start_date', { ascending: true });

    if (error) {
      console.error('Error fetching calendar events:', error);
      return NextResponse.json(
        { error: 'Failed to fetch calendar events' },
        { status: 500 }
      );
    }

    return NextResponse.json({ events });
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
    
    const { title, description, start_date, end_date, event_type, course_id, created_by } = body;

    if (!title || !start_date || !event_type || !created_by) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const { data: event, error } = await supabase
      .from('calendar_events')
      .insert({
        title,
        description: description || null,
        start_date,
        end_date: end_date || null,
        event_type,
        course_id: course_id || null,
        created_by
      })
      .select(`
        *,
        courses(id, name, class_number),
        created_by_user:created_by(full_name)
      `)
      .single();

    if (error) {
      console.error('Error creating calendar event:', error);
      return NextResponse.json(
        { error: 'Failed to create calendar event' },
        { status: 500 }
      );
    }

    return NextResponse.json({ event });
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
    
    const { id, title, description, start_date, end_date, event_type, course_id } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Event ID is required' },
        { status: 400 }
      );
    }

    const { data: event, error } = await supabase
      .from('calendar_events')
      .update({
        title,
        description: description || null,
        start_date,
        end_date: end_date || null,
        event_type,
        course_id: course_id || null
      })
      .eq('id', id)
      .select(`
        *,
        courses(id, name, class_number),
        created_by_user:created_by(full_name)
      `)
      .single();

    if (error) {
      console.error('Error updating calendar event:', error);
      return NextResponse.json(
        { error: 'Failed to update calendar event' },
        { status: 500 }
      );
    }

    return NextResponse.json({ event });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = createClient();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Event ID is required' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('calendar_events')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting calendar event:', error);
      return NextResponse.json(
        { error: 'Failed to delete calendar event' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}



