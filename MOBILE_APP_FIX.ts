// ============================================
// FIXED MOBILE APP CHECK-IN CODE
// Replace the mobile app code with this
// ============================================

// This uses the SAME tables as the website for proper sync
import { supabase } from './lib/supabase'; // Your supabase client

export async function selfCheckIn(eventId: string, userId: string) {
  console.log('[Mobile CheckIn] Starting check-in:', { eventId, userId });
  
  // 1) Check if already checked in (active session in volunteer_sessions)
  const { data: existing, error: checkError } = await supabase
    .from('volunteer_sessions')
    .select('id')
    .eq('event_id', eventId)
    .eq('user_id', userId)
    .eq('status', 'active')
    .maybeSingle();

  if (checkError) {
    console.error('[Mobile CheckIn] Error checking existing session:', checkError);
    return { success: false, error: checkError.message };
  }

  if (existing) {
    console.log('[Mobile CheckIn] Already checked in');
    return { success: false, error: 'Already checked in' };
  }

  // 2) Insert into volunteer_sessions (SAME TABLE AS WEBSITE)
  const { error: insertError } = await supabase
    .from('volunteer_sessions')
    .insert({
      event_id: eventId,
      user_id: userId,
      started_at: new Date().toISOString(),
      status: 'active'
    });

  if (insertError) {
    console.error('[Mobile CheckIn] Insert error:', insertError);
    return { success: false, error: insertError.message };
  }

  console.log('[Mobile CheckIn] Success!');
  return { success: true };
}

export async function selfCheckOut(eventId: string, userId: string) {
  console.log('[Mobile CheckOut] Starting check-out:', { eventId, userId });
  
  // 1) Find active session in volunteer_sessions
  const { data: sessions, error: fetchError } = await supabase
    .from('volunteer_sessions')
    .select('*')
    .eq('event_id', eventId)
    .eq('user_id', userId)
    .eq('status', 'active')
    .order('started_at', { ascending: false })
    .limit(1);

  if (fetchError) {
    console.error('[Mobile CheckOut] Error fetching session:', fetchError);
    return { success: false, error: fetchError.message };
  }

  if (!sessions || sessions.length === 0) {
    console.log('[Mobile CheckOut] No active session found');
    return { success: false, error: 'No active check-in found' };
  }

  const session = sessions[0];
  const endedAt = new Date().toISOString();

  // 2) End the session (set status to completed and ended_at)
  const { error: updateError } = await supabase
    .from('volunteer_sessions')
    .update({
      ended_at: endedAt,
      status: 'completed'
    })
    .eq('id', session.id);

  if (updateError) {
    console.error('[Mobile CheckOut] Update error:', updateError);
    
    // If duplicate key error, try to end ALL active sessions for this user/event
    if (updateError.message?.includes('duplicate key') || updateError.message?.includes('unique constraint')) {
      console.log('[Mobile CheckOut] Fixing duplicate sessions...');
      const { error: cleanupError } = await supabase
        .from('volunteer_sessions')
        .update({
          ended_at: endedAt,
          status: 'completed'
        })
        .eq('event_id', eventId)
        .eq('user_id', userId)
        .eq('status', 'active');
      
      if (cleanupError) {
        return { success: false, error: cleanupError.message };
      }
    } else {
      return { success: false, error: updateError.message };
    }
  }

  // 3) Calculate hours
  const startTime = new Date(session.started_at).getTime();
  const endTime = new Date(endedAt).getTime();
  const hours = (endTime - startTime) / (1000 * 60 * 60);

  console.log('[Mobile CheckOut] Calculated hours:', hours);

  // 4) Get event details for organization_id
  const { data: event, error: eventError } = await supabase
    .from('events')
    .select('organization_id')
    .eq('id', eventId)
    .single();

  if (eventError) {
    console.error('[Mobile CheckOut] Error fetching event:', eventError);
    // Don't fail checkout if we can't record hours
  }

  // 5) Record volunteer hours (if we got event data)
  if (event) {
    const { error: hoursError } = await supabase
      .from('volunteer_hours')
      .insert({
        user_id: userId,
        event_id: eventId,
        organization_id: event.organization_id,
        date: session.started_at.split('T')[0],
        hours: parseFloat(hours.toFixed(2)),
        notes: 'Self-tracked from mobile app'
      });

    if (hoursError) {
      console.error('[Mobile CheckOut] Error recording hours:', hoursError);
      // Don't fail checkout if hours recording fails
    } else {
      console.log('[Mobile CheckOut] Hours recorded successfully');
    }
  }

  console.log('[Mobile CheckOut] Success!');
  return { success: true, hours: parseFloat(hours.toFixed(2)) };
}

// ============================================
// ADMIN CHECK-IN (for admins checking in others)
// ============================================

export async function adminCheckIn(eventId: string, userId: string, adminId: string) {
  console.log('[Admin CheckIn] Starting:', { eventId, userId, adminId });
  
  // Check if already checked in
  const { data: existing } = await supabase
    .from('volunteer_sessions')
    .select('id')
    .eq('event_id', eventId)
    .eq('user_id', userId)
    .eq('status', 'active')
    .maybeSingle();

  if (existing) {
    return { success: false, error: 'User is already checked in' };
  }

  // Start volunteer session
  const { error: sessionError } = await supabase
    .from('volunteer_sessions')
    .insert({
      user_id: userId,
      event_id: eventId,
      started_at: new Date().toISOString(),
      status: 'active'
    });

  if (sessionError) {
    return { success: false, error: sessionError.message };
  }

  // Log admin action
  const { error: auditError } = await supabase
    .from('admin_checkin_audit')
    .insert({
      event_id: eventId,
      user_id: userId,
      admin_id: adminId,
      action: 'checkin',
      timestamp: new Date().toISOString()
    });

  if (auditError) {
    console.error('[Admin CheckIn] Audit log failed:', auditError);
    // Don't fail the check-in if audit fails
  }

  return { success: true };
}

export async function adminCheckOut(eventId: string, userId: string, adminId: string) {
  console.log('[Admin CheckOut] Starting:', { eventId, userId, adminId });
  
  // Find active session
  const { data: sessions, error: fetchError } = await supabase
    .from('volunteer_sessions')
    .select('*')
    .eq('event_id', eventId)
    .eq('user_id', userId)
    .eq('status', 'active')
    .limit(1);

  if (fetchError) {
    return { success: false, error: fetchError.message };
  }

  if (!sessions || sessions.length === 0) {
    return { success: false, error: 'User is not currently checked in' };
  }

  const session = sessions[0];
  const endedAt = new Date().toISOString();

  // End session
  const { error: updateError } = await supabase
    .from('volunteer_sessions')
    .update({
      ended_at: endedAt,
      status: 'completed'
    })
    .eq('id', session.id);

  if (updateError) {
    return { success: false, error: updateError.message };
  }

  // Calculate and record hours (same as selfCheckOut)
  const startTime = new Date(session.started_at).getTime();
  const endTime = new Date(endedAt).getTime();
  const hours = (endTime - startTime) / (1000 * 60 * 60);

  const { data: event } = await supabase
    .from('events')
    .select('organization_id')
    .eq('id', eventId)
    .single();

  if (event) {
    await supabase
      .from('volunteer_hours')
      .insert({
        user_id: userId,
        event_id: eventId,
        organization_id: event.organization_id,
        date: session.started_at.split('T')[0],
        hours: parseFloat(hours.toFixed(2)),
        notes: 'Checked out by admin'
      });
  }

  // Log admin action
  await supabase
    .from('admin_checkin_audit')
    .insert({
      event_id: eventId,
      user_id: userId,
      admin_id: adminId,
      action: 'checkout',
      timestamp: endedAt
    });

  return { success: true, hours: parseFloat(hours.toFixed(2)) };
}

