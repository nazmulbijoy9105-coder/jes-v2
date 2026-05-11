import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  const supabase = createClient();
  const { error } = await supabase
    .from('user_profiles')
    .update({ queries_today: 0, last_query_date: new Date().toISOString().split('T')[0] })
    .lt('last_query_date', new Date().toISOString().split('T')[0]);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}