import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get('course_id');
    const date = searchParams.get('date');
    const studentId = searchParams.get('student_id');

    let query = supabase
      .from('attendance')
      .select(`
        *,
        users!inner(*),
        courses!inner(*)
      `);

    if (courseId) {
      query = query.eq('course_id', courseId);
    }

    if (date) {
      query = query.eq('date', date);
    }

    if (studentId) {
      query = query.eq('student_id', studentId);
    }

    const { data: attendance, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching attendance:', error);
      return NextResponse.json(
        { error: 'Failed to fetch attendance records' },
        { status: 500 }
      );
    }

    return NextResponse.json({ attendance });
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
    
    const { student_id, course_id, date, status, notes, recorded_by } = body;

    if (!student_id || !course_id || !date || !status) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if attendance record already exists for this student, course, and date
    const { data: existingRecord } = await supabase
      .from('attendance')
      .select('id')
      .eq('student_id', student_id)
      .eq('course_id', course_id)
      .eq('date', date)
      .single();

    let result;
    if (existingRecord) {
      // Update existing record
      const { data, error } = await supabase
        .from('attendance')
        .update({
          status,
          notes: notes || null,
          recorded_by: recorded_by || null
        })
        .eq('id', existingRecord.id)
        .select()
        .single();

      result = { data, error };
    } else {
      // Create new record
      const { data, error } = await supabase
        .from('attendance')
        .insert({
          student_id,
          course_id,
          date,
          status,
          notes: notes || null,
          recorded_by: recorded_by || null
        })
        .select()
        .single();

      result = { data, error };
    }

    if (result.error) {
      console.error('Error saving attendance:', result.error);
      return NextResponse.json(
        { error: 'Failed to save attendance record' },
        { status: 500 }
      );
    }

    return NextResponse.json({ attendance: result.data });
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
        { error: 'Attendance record ID is required' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('attendance')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting attendance record:', error);
      return NextResponse.json(
        { error: 'Failed to delete attendance record' },
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

