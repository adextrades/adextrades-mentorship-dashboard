import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// POST /api/sync
// body: { type: 'plan' | 'session', menteeEmail: string, data: object }
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { type, menteeEmail, data } = body

    if (!menteeEmail) {
      return NextResponse.json({ error: 'menteeEmail required' }, { status: 400 })
    }

    const supabase = getSupabase()

    // Look up mentee's user ID from profiles by email
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', menteeEmail)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({
        error: `No user found with email ${menteeEmail}. Make sure they have signed up for the AdexTrades app first.`
      }, { status: 404 })
    }

    const userId = profile.id

    if (type === 'plan') {
      const plan = data

      // Upsert mentee_plans
      const { error } = await supabase
        .from('mentee_plans')
        .upsert({
          user_id: userId,
          created_by: userId, // Adex's user ID would be better here but we'll use mentee for now
          goal_short_term: plan.goalShortTerm || '',
          goal_long_term: plan.goalLongTerm || '',
          goal_timeline: plan.goalTimeline || '',
          goal_port_target: plan.goalPortTarget || 0,
          shares_held: plan.sharesHeld || '',
          experience: plan.exp || '',
          focus: plan.focus || '',
          port_start: plan.portStart || 0,
          max_trades: plan.maxTrades || 2,
          max_size: plan.maxSize || 500,
          stop_loss: plan.stopLoss || 40,
          target: plan.target || 30,
          dte_rule: plan.dte || '',
          approval_required: plan.approval || '',
          ci1: plan.ci1 || 200,
          ci2_trigger: plan.ci2Trigger || 3000,
          ci2: plan.ci2 || 500,
          max_drawdown: plan.drawdown || 400,
          approved_tickers: plan.approved || [],
          restricted: plan.restricted || [],
          psych_notes: plan.psych || '',
          coaching_notes: plan.goals || '',
          plan_updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' })

      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ success: true, message: `Plan synced for ${menteeEmail}` })
    }

    if (type === 'session') {
      const session = data

      // Insert new session record
      const { error } = await supabase
        .from('sessions')
        .insert({
          user_id: userId,
          created_by: userId,
          session_date: session.date || new Date().toISOString().slice(0, 10),
          trades_since_last: session.trades || '',
          followed_plan: session.followed || '',
          deviations: session.deviation || '',
          pnl_since_last: session.pnl ? parseFloat(session.pnl) : null,
          emotion_score: session.emotion || null,
          focus_for_session: session.focus || '',
          biggest_win: session.win || '',
          biggest_mistake: session.mistake || '',
          ai_brief: session.aiBrief || '',
          fathom_notes: session.fathomNotes || '',
          flags: session.flags || [],
        })

      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ success: true, message: `Session synced for ${menteeEmail}` })
    }

    return NextResponse.json({ error: 'Invalid type. Use plan or session.' }, { status: 400 })

  } catch (error) {
    console.error('Sync error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
