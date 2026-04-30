'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  loadData, saveData, getMentee, saveMenteePlan, addTrade,
  deleteTrade, addMentee, getAllMenteeNames, DEFAULT_MENTEES, EMPTY_PLAN
} from '@/lib/storage'
import { AppData, MenteePlan, Trade } from '@/lib/types'
import styles from './dashboard.module.css'

const TABS = ['Trade Plan', 'Session Intake', 'Trade Log', 'Dashboard']

const STRAT_SETUPS = ['2u (bullish)', '2d (bearish)', '3 (outside)', '1 (inside)', 'FTFC', 'CCRP', 'OTE', 'PMH/PML', 'Other']

export default function Dashboard() {
  const [data, setData] = useState<AppData>({ mentees: {} })
  const [activeTab, setActiveTab] = useState(0)
  const [activeMentee, setActiveMentee] = useState('')
  const [mounted, setMounted] = useState(false)

  // Plan form state
  const [plan, setPlan] = useState<MenteePlan>({ ...EMPTY_PLAN })
  const [approvedInput, setApprovedInput] = useState('')
  const [restrictedInput, setRestrictedInput] = useState('')
  const [planAI, setPlanAI] = useState('')
  const [planAILoading, setPlanAILoading] = useState(false)

  // Intake form state
  const [intakeTrades, setIntakeTrades] = useState('')
  const [intakeFollowed, setIntakeFollowed] = useState('')
  const [intakeDeviation, setIntakeDeviation] = useState('')
  const [intakePnl, setIntakePnl] = useState('')
  const [intakeEmotion, setIntakeEmotion] = useState(0)
  const [intakeFocus, setIntakeFocus] = useState('')
  const [intakeWin, setIntakeWin] = useState('')
  const [intakeMistake, setIntakeMistake] = useState('')
  const [intakeDate, setIntakeDate] = useState('')
  const [intakeAI, setIntakeAI] = useState('')
  const [intakeAILoading, setIntakeAILoading] = useState(false)
  const [intakeFlags, setIntakeFlags] = useState<{ title: string; msg: string }[]>([])

  // Trade log form state
  const [showTradeForm, setShowTradeForm] = useState(false)
  const [tradeTicker, setTradeTicker] = useState('')
  const [tradeDir, setTradeDir] = useState('Call')
  const [tradeSetup, setTradeSetup] = useState('2u (bullish)')
  const [tradeEntry, setTradeEntry] = useState('')
  const [tradeExit, setTradeExit] = useState('')
  const [tradeQty, setTradeQty] = useState('')
  const [tradePnl, setTradePnl] = useState('')
  const [tradePlanFollow, setTradePlanFollow] = useState('Yes')
  const [tradeEmotion, setTradeEmotion] = useState('1')
  const [tradeNotes, setTradeNotes] = useState('')

  // Dashboard AI
  const [dashAI, setDashAI] = useState('')
  const [dashAILoading, setDashAILoading] = useState(false)

  // New mentee
  const [newMenteeName, setNewMenteeName] = useState('')
  const [showNewMentee, setShowNewMentee] = useState(false)

  useEffect(() => {
    const loaded = loadData()
    setData(loaded)
    setMounted(true)
    setIntakeDate(new Date().toISOString().slice(0, 10))
  }, [])

  useEffect(() => {
    if (!mounted) return
    saveData(data)
  }, [data, mounted])

  const menteeNames = mounted ? getAllMenteeNames(data) : DEFAULT_MENTEES

  const handleSelectMentee = useCallback((name: string) => {
    setActiveMentee(name)
    if (!name) return
    const m = getMentee(data, name)
    setPlan({ ...EMPTY_PLAN, ...m.plan })
    setDashAI('')
    setPlanAI('')
    setIntakeAI('')
    setIntakeFlags([])
  }, [data])

  const handleSavePlan = () => {
    if (!activeMentee) { alert('Select a mentee first.'); return }
    const updated = saveMenteePlan(data, activeMentee, plan)
    setData(updated)
    alert(`Plan saved for ${activeMentee}!`)
  }

  const handleAddMentee = () => {
    if (!newMenteeName.trim()) return
    const updated = addMentee(data, newMenteeName.trim())
    setData(updated)
    setActiveMentee(newMenteeName.trim())
    setPlan({ ...EMPTY_PLAN })
    setNewMenteeName('')
    setShowNewMentee(false)
  }

  const handleLogTrade = () => {
    if (!activeMentee) { alert('Select a mentee first.'); return }
    const entry = parseFloat(tradeEntry) || 0
    const exit = parseFloat(tradeExit) || 0
    const qty = parseInt(tradeQty) || 1
    const manualPnl = tradePnl ? parseFloat(tradePnl) : parseFloat(((exit - entry) * qty * 100).toFixed(2))
    let ticker = tradeTicker.toUpperCase()
    if (!ticker.startsWith('$')) ticker = '$' + ticker
    const trade: Omit<Trade, 'id'> = {
      date: new Date().toISOString().slice(0, 10),
      ticker, dir: tradeDir, setup: tradeSetup,
      entry, exit, qty, pnl: manualPnl,
      plan: tradePlanFollow,
      emotion: parseInt(tradeEmotion),
      notes: tradeNotes
    }
    const updated = addTrade(data, activeMentee, trade)
    setData(updated)
    setShowTradeForm(false)
    setTradeTicker(''); setTradeEntry(''); setTradeExit('')
    setTradeQty(''); setTradePnl(''); setTradeNotes('')
  }

  const handleDeleteTrade = (tradeId: string) => {
    if (!activeMentee) return
    if (!confirm('Delete this trade?')) return
    const updated = deleteTrade(data, activeMentee, tradeId)
    setData(updated)
  }

  const callClaude = async (prompt: string): Promise<string> => {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        messages: [{ role: 'user', content: prompt }]
      })
    })
    const d = await res.json()
    return d.content?.[0]?.text || 'No response.'
  }

  const handleGeneratePlanSummary = async () => {
    if (!activeMentee) { alert('Select and save a plan first.'); return }
    setPlanAILoading(true)
    setPlanAI('')
    try {
      const text = await callClaude(
        `You are a trading mentor assistant for AdexTrades, built around TheStrat methodology by Rob Smith.\n\nGenerate a concise, professional trade plan summary for mentee: ${activeMentee}\n\nPlan details:\n- Experience: ${plan.exp}\n- Focus: ${plan.focus}\n- Starting portfolio: $${plan.portStart}\n- Max active trades: ${plan.maxTrades}\n- Max size per trade: $${plan.maxSize}\n- Stop loss: ${plan.stopLoss}%\n- Profit target: ${plan.target}%\n- DTE rule: ${plan.dte}\n- Approval requirement: ${plan.approval}\n- Check-in every: $${plan.ci1} (escalates to $${plan.ci2} after $${plan.ci2Trigger})\n- Approved: ${plan.approved?.join(', ')}\n- Restricted: ${plan.restricted?.join(', ')}\n- Psychology notes: ${plan.psych}\n- Goals: ${plan.goals}\n\nWrite 150–200 words in a direct, professional mentor voice. Written TO the mentee (second person). Include their rules clearly. Reference TheStrat notation where applicable. End with one sentence about what success looks like for the next milestone.`
      )
      setPlanAI(text)
    } catch { setPlanAI('Error generating summary. Check API connection.') }
    setPlanAILoading(false)
  }

  const handleAnalyzeIntake = async () => {
    if (!activeMentee) { alert('Select a mentee.'); return }
    setIntakeAILoading(true)
    setIntakeAI('')
    setIntakeFlags([])
    try {
      const text = await callClaude(
        `Trading mentor assistant for AdexTrades (TheStrat methodology by Rob Smith).\n\nMentee: ${activeMentee}\nSession date: ${intakeDate}\nTrades taken: ${intakeTrades || 'Not provided'}\nFollowed plan: ${intakeFollowed || 'Not answered'}\nDeviations: ${intakeDeviation || 'None noted'}\nP&L: ${intakePnl || 'Not provided'}\nEmotion score during worst trade: ${intakeEmotion || 'Not selected'}/5\nFocus for today: ${intakeFocus || 'Not provided'}\nBiggest win/insight: ${intakeWin || 'Not provided'}\nBiggest mistake: ${intakeMistake || 'Not provided'}\n\nWrite a 100–150 word pre-session brief for Adex (the mentor). Highlight what went well, what to address, psychology patterns to watch for. Be direct and specific. Reference TheStrat concepts if relevant. Flag any discipline or psychology concerns explicitly.`
      )
      setIntakeAI(text)
      const flags: { title: string; msg: string }[] = []
      if (intakeEmotion >= 4) flags.push({ title: 'High Emotional State', msg: `Mentee reported emotion ${intakeEmotion}/5 during their worst trade. Explore what triggered this and whether it led to revenge trades.` })
      if (intakeFollowed.includes('No') || intakeFollowed.includes('deviated')) flags.push({ title: 'Plan Deviation', msg: 'Mentee acknowledged deviating from the trade plan. Use intake notes to identify which rule broke down and reinforce it at the start of the session.' })
      setIntakeFlags(flags)
    } catch { setIntakeAI('Error. Check API connection.') }
    setIntakeAILoading(false)
  }

  const handleDashAI = async () => {
    if (!activeMentee) { alert('Select a mentee.'); return }
    const m = getMentee(data, activeMentee)
    const trades = m.trades || []
    const p = m.plan || {}
    setDashAILoading(true)
    setDashAI('')
    try {
      const totalPnl = trades.reduce((s, t) => s + t.pnl, 0)
      const wins = trades.filter(t => t.pnl > 0).length
      const dev = trades.filter(t => t.plan !== 'Yes').length
      const avgEm = trades.length ? (trades.reduce((s, t) => s + t.emotion, 0) / trades.length).toFixed(1) : 'N/A'
      const text = await callClaude(
        `Trading mentor assistant for AdexTrades (TheStrat methodology by Rob Smith).\n\nGenerate a mentee progress analysis for Adex about mentee: ${activeMentee}\n\nTrade data:\n- Total trades: ${trades.length}\n- Wins: ${wins}, Losses: ${trades.length - wins}\n- Total P&L: $${totalPnl.toFixed(0)}\n- Plan deviations: ${dev} of ${trades.length}\n- Avg emotion score: ${avgEm}\n- Recent trades: ${JSON.stringify(trades.slice(-10).map(t => ({ ticker: t.ticker, pnl: t.pnl, plan: t.plan, emotion: t.emotion, notes: t.notes })))}\n\nMentee plan:\n- Focus: ${p.focus}\n- Max trades: ${p.maxTrades}\n- Psychology notes: ${p.psych}\n- Goals: ${p.goals}\n\nWrite 200–250 words. Include: performance observations, discipline patterns, psychology trends, what's working, what needs work, one specific recommendation for the next session. Write directly to Adex in a professional mentorship voice. Reference TheStrat concepts where relevant.`
      )
      setDashAI(text)
    } catch { setDashAI('Error. Check API connection.') }
    setDashAILoading(false)
  }

  // Dashboard stats
  const currentMenteeData = activeMentee ? getMentee(data, activeMentee) : null
  const trades = currentMenteeData?.trades || []
  const portStart = currentMenteeData?.plan?.portStart || 2000
  const totalPnl = trades.reduce((s, t) => s + t.pnl, 0)
  const portVal = portStart + totalPnl
  const wins = trades.filter(t => t.pnl > 0).length
  const winRate = trades.length ? Math.round(wins / trades.length * 100) : 0
  const planFollowed = trades.filter(t => t.plan === 'Yes').length
  const discScore = trades.length ? Math.round(planFollowed / trades.length * 100) : 0
  const avgEmotion = trades.length ? (trades.reduce((s, t) => s + t.emotion, 0) / trades.length).toFixed(1) : '—'

  // Flags
  const getFlags = () => {
    const flags: { title: string; msg: string }[] = []
    const dev = trades.filter(t => t.plan !== 'Yes')
    if (dev.length >= 2) flags.push({ title: 'Repeated Deviations', msg: `${dev.length} of ${trades.length} trades deviated from the plan. Rules need to be more explicit or accountability structure needs tightening.` })
    const highEmLoss = trades.filter(t => t.pnl < 0 && t.emotion >= 4)
    if (highEmLoss.length) flags.push({ title: 'Emotional Trading on Losses', msg: `${highEmLoss.length} loss(es) occurred with emotion score 4+. Review what triggered these sessions — revenge trading risk.` })
    let maxC = 0, cur = 0
    trades.forEach(t => { if (t.pnl < 0) { cur++; maxC = Math.max(maxC, cur) } else cur = 0 })
    if (maxC >= 2) flags.push({ title: 'Consecutive Losses', msg: `Max consecutive losing streak: ${maxC}. Check if mentee is increasing size or frequency after losses.` })
    const offPlanWins = trades.filter(t => t.plan !== 'Yes' && t.pnl > 0)
    if (offPlanWins.length) flags.push({ title: 'Off-Plan Wins', msg: `${offPlanWins.length} deviation(s) were profitable. This can reinforce undisciplined behavior — address directly.` })
    return flags
  }

  // Milestones
  const getMilestones = () => {
    const ci1 = currentMenteeData?.plan?.ci1 || 200
    const ci2trigger = currentMenteeData?.plan?.ci2Trigger || 3000
    const ci2 = currentMenteeData?.plan?.ci2 || 500
    const ms = [portStart]
    let v = portStart + ci1
    while (v <= ci2trigger && ms.length < 8) { ms.push(v); v += ci1 }
    if (ms[ms.length - 1] < ci2trigger) ms.push(ci2trigger)
    if (ms.length < 8) ms.push(ms[ms.length - 1] + ci2)
    return ms
  }

  // Setup breakdown
  const setupBreakdown = trades.reduce((acc, t) => {
    if (!acc[t.setup]) acc[t.setup] = { count: 0, pnl: 0 }
    acc[t.setup].count++
    acc[t.setup].pnl += t.pnl
    return acc
  }, {} as Record<string, { count: number; pnl: number }>)

  if (!mounted) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: 'var(--gold)', fontFamily: 'Rajdhani, sans-serif', letterSpacing: '4px', fontSize: '13px' }}>
      LOADING...
    </div>
  )

  return (
    <div className={styles.app}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.wordmark}>ADEX<span>TRADES</span></div>
        <div className={styles.headerRight}>
          {activeMentee && (
            <div className={styles.activeMenteeBadge}>
              <span className={styles.avatar}>{activeMentee.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)}</span>
              <span>{activeMentee}</span>
            </div>
          )}
          <div className={styles.headerMeta}>Platinum Mentorship</div>
        </div>
      </header>

      {/* Tabs */}
      <nav className={styles.tabs}>
        {TABS.map((tab, i) => (
          <button
            key={tab}
            className={`${styles.tab} ${activeTab === i ? styles.tabActive : ''}`}
            onClick={() => setActiveTab(i)}
          >
            {tab}
          </button>
        ))}
      </nav>

      <main className={styles.main}>
        {/* ═══ TAB 0: TRADE PLAN ═══ */}
        {activeTab === 0 && (
          <div className={styles.panel}>
            <div className={styles.menteeBar}>
              <div className={styles.field} style={{ flex: 1 }}>
                <label className={styles.label}>Active Mentee</label>
                <select className={styles.select} value={activeMentee} onChange={e => {
                  if (e.target.value === '__new__') { setShowNewMentee(true); return }
                  handleSelectMentee(e.target.value)
                }}>
                  <option value="">— select mentee —</option>
                  {menteeNames.map(n => <option key={n} value={n}>{n}</option>)}
                  <option value="__new__">+ Add new mentee...</option>
                </select>
              </div>
              <button className={styles.btnGold} onClick={handleSavePlan}>Save Plan</button>
            </div>

            {showNewMentee && (
              <div className={styles.card} style={{ marginBottom: 20 }}>
                <div className={styles.formGrid}>
                  <div className={styles.field}>
                    <label className={styles.label}>New Mentee Name</label>
                    <input className={styles.input} value={newMenteeName} onChange={e => setNewMenteeName(e.target.value)} placeholder="Full name" onKeyDown={e => e.key === 'Enter' && handleAddMentee()} />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className={styles.btnGold} onClick={handleAddMentee}>Add Mentee</button>
                  <button className={styles.btnGhost} onClick={() => setShowNewMentee(false)}>Cancel</button>
                </div>
              </div>
            )}

            <div className={styles.sectionLabel}>Section 1 — Mentee Profile</div>
            <div className={styles.formGrid}>
              <div className={styles.field}>
                <label className={styles.label}>Trading Experience</label>
                <select className={styles.select} value={plan.exp} onChange={e => setPlan(p => ({ ...p, exp: e.target.value }))}>
                  <option>Beginner (0–1 yr)</option><option>Intermediate (1–3 yrs)</option><option>Advanced (3–5 yrs)</option><option>Expert (5+ yrs)</option>
                </select>
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Primary Focus</label>
                <select className={styles.select} value={plan.focus} onChange={e => setPlan(p => ({ ...p, focus: e.target.value }))}>
                  <option>Buying Options</option><option>Selling Options</option><option>Swing Trading Stocks</option><option>Mixed (Buying + Selling)</option><option>TheStrat Setups Only</option>
                </select>
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Starting Portfolio Size ($)</label>
                <input className={styles.input} type="number" value={plan.portStart || ''} onChange={e => setPlan(p => ({ ...p, portStart: parseFloat(e.target.value) || 0 }))} placeholder="e.g. 2000" />
              </div>
            </div>

            <div className={styles.sectionLabel}>Section 2 — Trade Rules</div>
            <div className={styles.formGrid3}>
              <div className={styles.field}><label className={styles.label}>Max Active Trades</label><input className={styles.input} type="number" value={plan.maxTrades || ''} onChange={e => setPlan(p => ({ ...p, maxTrades: parseInt(e.target.value) || 0 }))} placeholder="e.g. 2" /></div>
              <div className={styles.field}><label className={styles.label}>Max Size Per Trade ($)</label><input className={styles.input} type="number" value={plan.maxSize || ''} onChange={e => setPlan(p => ({ ...p, maxSize: parseFloat(e.target.value) || 0 }))} placeholder="e.g. 500" /></div>
              <div className={styles.field}><label className={styles.label}>Hard Stop Loss (%)</label><input className={styles.input} type="number" value={plan.stopLoss || ''} onChange={e => setPlan(p => ({ ...p, stopLoss: parseFloat(e.target.value) || 0 }))} placeholder="e.g. 40" /></div>
              <div className={styles.field}><label className={styles.label}>Profit Target (%)</label><input className={styles.input} type="number" value={plan.target || ''} onChange={e => setPlan(p => ({ ...p, target: parseFloat(e.target.value) || 0 }))} placeholder="e.g. 30" /></div>
              <div className={styles.field}>
                <label className={styles.label}>DTE Rule</label>
                <select className={styles.select} value={plan.dte} onChange={e => setPlan(p => ({ ...p, dte: e.target.value }))}>
                  <option>No weekly expiration swings</option><option>Min 14 DTE</option><option>Min 21 DTE</option><option>Min 30 DTE</option><option>No DTE restriction</option>
                </select>
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Requires Adex Approval</label>
                <select className={styles.select} value={plan.approval} onChange={e => setPlan(p => ({ ...p, approval: e.target.value }))}>
                  <option>All trades</option><option>Trades over $300</option><option>Trades over $500</option><option>New tickers only</option><option>None — full discretion</option>
                </select>
              </div>
            </div>

            <div className={styles.sectionLabel}>Section 3 — Milestone Check-ins</div>
            <div className={styles.formGrid}>
              <div className={styles.field}><label className={styles.label}>First Check-in Increment ($)</label><input className={styles.input} type="number" value={plan.ci1 || ''} onChange={e => setPlan(p => ({ ...p, ci1: parseFloat(e.target.value) || 0 }))} placeholder="e.g. 200" /></div>
              <div className={styles.field}><label className={styles.label}>Escalate Check-in At ($)</label><input className={styles.input} type="number" value={plan.ci2Trigger || ''} onChange={e => setPlan(p => ({ ...p, ci2Trigger: parseFloat(e.target.value) || 0 }))} placeholder="e.g. 3000" /></div>
              <div className={styles.field}><label className={styles.label}>Escalated Increment ($)</label><input className={styles.input} type="number" value={plan.ci2 || ''} onChange={e => setPlan(p => ({ ...p, ci2: parseFloat(e.target.value) || 0 }))} placeholder="e.g. 500" /></div>
              <div className={styles.field}><label className={styles.label}>Max Loss Before Review ($)</label><input className={styles.input} type="number" value={plan.drawdown || ''} onChange={e => setPlan(p => ({ ...p, drawdown: parseFloat(e.target.value) || 0 }))} placeholder="e.g. 400" /></div>
            </div>

            <div className={styles.sectionLabel}>Section 4 — Approved & Restricted</div>
            <div className={styles.formGrid}>
              <div className={styles.field}>
                <label className={styles.label}>Approved Tickers / Setups</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input className={styles.input} value={approvedInput} onChange={e => setApprovedInput(e.target.value)} placeholder="$AAPL, 2D setups..." onKeyDown={e => { if (e.key === 'Enter' && approvedInput.trim()) { setPlan(p => ({ ...p, approved: [...p.approved, approvedInput.trim()] })); setApprovedInput('') } }} />
                  <button className={styles.smallBtn} onClick={() => { if (approvedInput.trim()) { setPlan(p => ({ ...p, approved: [...p.approved, approvedInput.trim()] })); setApprovedInput('') } }}>Add</button>
                </div>
                <div className={styles.tagWrap}>{plan.approved.map((t, i) => <span key={i} className={styles.tag}>{t} <span style={{ cursor: 'pointer', opacity: 0.5, marginLeft: 4 }} onClick={() => setPlan(p => ({ ...p, approved: p.approved.filter((_, j) => j !== i) }))}>×</span></span>)}</div>
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Restricted / Off-Limits</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input className={styles.input} value={restrictedInput} onChange={e => setRestrictedInput(e.target.value)} placeholder="Penny stocks, 0DTE..." onKeyDown={e => { if (e.key === 'Enter' && restrictedInput.trim()) { setPlan(p => ({ ...p, restricted: [...p.restricted, restrictedInput.trim()] })); setRestrictedInput('') } }} />
                  <button className={styles.smallBtn} onClick={() => { if (restrictedInput.trim()) { setPlan(p => ({ ...p, restricted: [...p.restricted, restrictedInput.trim()] })); setRestrictedInput('') } }}>Add</button>
                </div>
                <div className={styles.tagWrap}>{plan.restricted.map((t, i) => <span key={i} className={`${styles.tag} ${styles.tagRed}`}>{t} <span style={{ cursor: 'pointer', opacity: 0.5, marginLeft: 4 }} onClick={() => setPlan(p => ({ ...p, restricted: p.restricted.filter((_, j) => j !== i) }))}>×</span></span>)}</div>
              </div>
            </div>

            <div className={styles.sectionLabel}>Section 5 — Psychology Notes</div>
            <div className={styles.field} style={{ marginBottom: 16 }}>
              <label className={styles.label}>Known Behavior Patterns / Flags</label>
              <textarea className={styles.textarea} value={plan.psych} onChange={e => setPlan(p => ({ ...p, psych: e.target.value }))} placeholder="e.g. Tends to over-trade after a loss. Needs clear rules or will press buttons in gray areas..." />
            </div>
            <div className={styles.field} style={{ marginBottom: 20 }}>
              <label className={styles.label}>Goals for This Mentee</label>
              <textarea className={styles.textarea} value={plan.goals} onChange={e => setPlan(p => ({ ...p, goals: e.target.value }))} placeholder="What are you specifically trying to develop in this mentee this month?" />
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button className={styles.btnGold} onClick={handleSavePlan}>Save Plan</button>
              <button className={styles.btnOutline} onClick={handleGeneratePlanSummary} disabled={planAILoading}>{planAILoading ? 'Generating...' : 'Generate AI Plan Summary'}</button>
            </div>

            {(planAI || planAILoading) && (
              <div style={{ marginTop: 20 }}>
                <div className={styles.sectionLabel}>AI-Generated Plan Summary</div>
                <div className={styles.aiOutput}>{planAILoading ? 'Generating plan summary...' : planAI}</div>
              </div>
            )}
          </div>
        )}

        {/* ═══ TAB 1: SESSION INTAKE ═══ */}
        {activeTab === 1 && (
          <div className={styles.panel}>
            <div className={styles.menteeBar}>
              <div className={styles.field} style={{ flex: 1 }}>
                <label className={styles.label}>Mentee</label>
                <select className={styles.select} value={activeMentee} onChange={e => handleSelectMentee(e.target.value)}>
                  <option value="">— select mentee —</option>
                  {menteeNames.map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Session Date</label>
                <input className={styles.input} type="date" value={intakeDate} onChange={e => setIntakeDate(e.target.value)} style={{ width: 160 }} />
              </div>
            </div>

            <div className={styles.twoCol}>
              <div>
                <div className={styles.sectionLabel}>Pre-Session Form</div>
                <div className={styles.field} style={{ marginBottom: 14 }}><label className={styles.label}>1. Trades taken since last session</label><textarea className={styles.textarea} value={intakeTrades} onChange={e => setIntakeTrades(e.target.value)} placeholder="List tickers, direction, outcome..." /></div>
                <div className={styles.field} style={{ marginBottom: 14 }}>
                  <label className={styles.label}>2. Did you follow the trade plan?</label>
                  <select className={styles.select} value={intakeFollowed} onChange={e => setIntakeFollowed(e.target.value)}>
                    <option value="">—</option><option>Yes, fully</option><option>Mostly — minor deviations</option><option>Partially — some deviations</option><option>No — deviated significantly</option>
                  </select>
                </div>
                <div className={styles.field} style={{ marginBottom: 14 }}><label className={styles.label}>3. Where did you deviate (if any)?</label><textarea className={styles.textarea} value={intakeDeviation} onChange={e => setIntakeDeviation(e.target.value)} placeholder="Be specific. Which rule? Why?" /></div>
                <div className={styles.field} style={{ marginBottom: 14 }}><label className={styles.label}>4. P&L since last session ($)</label><input className={styles.input} type="number" value={intakePnl} onChange={e => setIntakePnl(e.target.value)} placeholder="Negative for loss, e.g. -150" /></div>
                <div className={styles.field} style={{ marginBottom: 14 }}>
                  <label className={styles.label}>5. Emotional state during worst trade (1=calm, 5=reactive)</label>
                  <div className={styles.emotionRow}>
                    {[1,2,3,4,5].map(n => (
                      <button key={n} className={`${styles.emotionBtn} ${intakeEmotion === n ? styles.emotionBtnActive : ''}`} onClick={() => setIntakeEmotion(n)}>
                        {n}<br /><span style={{ fontSize: 10 }}>{['Calm','Mild','Tense','Reactive','Emotional'][n-1]}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <div className={styles.field} style={{ marginBottom: 14 }}><label className={styles.label}>6. What do you want to cover this session?</label><textarea className={styles.textarea} value={intakeFocus} onChange={e => setIntakeFocus(e.target.value)} placeholder="Specific setups, concepts, trades to review..." /></div>
                <div className={styles.field} style={{ marginBottom: 14 }}><label className={styles.label}>7. Biggest win / insight this week</label><textarea className={styles.textarea} value={intakeWin} onChange={e => setIntakeWin(e.target.value)} placeholder="What clicked? What went right?" /></div>
                <div className={styles.field} style={{ marginBottom: 20 }}><label className={styles.label}>8. Biggest mistake / what you&apos;d do differently</label><textarea className={styles.textarea} value={intakeMistake} onChange={e => setIntakeMistake(e.target.value)} placeholder="Be honest. No judgment here." /></div>
                <button className={styles.btnGold} onClick={handleAnalyzeIntake} disabled={intakeAILoading}>{intakeAILoading ? 'Analyzing...' : 'Analyze with AI'}</button>
              </div>

              <div>
                <div className={styles.sectionLabel}>AI Session Brief</div>
                {intakeAI ? <div className={styles.aiOutput}>{intakeAI}</div> : <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Fill out the form and click &quot;Analyze with AI&quot; to generate a pre-session brief.</p>}

                {intakeFlags.length > 0 && (
                  <>
                    <div className={styles.divider} />
                    <div className={styles.sectionLabel}>Pattern Flags</div>
                    {intakeFlags.map((f, i) => (
                      <div key={i} className={styles.flag}>
                        <div className={styles.flagTitle}>{f.title}</div>
                        {f.msg}
                      </div>
                    ))}
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ═══ TAB 2: TRADE LOG ═══ */}
        {activeTab === 2 && (
          <div className={styles.panel}>
            <div className={styles.menteeBar}>
              <div className={styles.field} style={{ flex: 1 }}>
                <label className={styles.label}>Mentee</label>
                <select className={styles.select} value={activeMentee} onChange={e => handleSelectMentee(e.target.value)}>
                  <option value="">— select mentee —</option>
                  {menteeNames.map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
              <button className={styles.btnGold} onClick={() => { if (!activeMentee) { alert('Select a mentee first.'); return } setShowTradeForm(s => !s) }}>+ Log Trade</button>
            </div>

            {showTradeForm && (
              <div className={styles.card} style={{ marginBottom: 20 }}>
                <div className={styles.cardTitle}>New Trade Entry</div>
                <div className={styles.formGrid3}>
                  <div className={styles.field}><label className={styles.label}>Ticker</label><input className={styles.input} value={tradeTicker} onChange={e => setTradeTicker(e.target.value.toUpperCase())} placeholder="$LOW" /></div>
                  <div className={styles.field}><label className={styles.label}>Direction</label><select className={styles.select} value={tradeDir} onChange={e => setTradeDir(e.target.value)}><option>Call</option><option>Put</option><option>Stock Long</option><option>Stock Short</option></select></div>
                  <div className={styles.field}><label className={styles.label}>Setup (TheStrat)</label><select className={styles.select} value={tradeSetup} onChange={e => setTradeSetup(e.target.value)}>{STRAT_SETUPS.map(s => <option key={s}>{s}</option>)}</select></div>
                  <div className={styles.field}><label className={styles.label}>Entry Price ($)</label><input className={styles.input} type="number" value={tradeEntry} onChange={e => setTradeEntry(e.target.value)} placeholder="1.45" step="0.01" /></div>
                  <div className={styles.field}><label className={styles.label}>Exit Price ($)</label><input className={styles.input} type="number" value={tradeExit} onChange={e => setTradeExit(e.target.value)} placeholder="2.10" step="0.01" /></div>
                  <div className={styles.field}><label className={styles.label}>Contracts / Shares</label><input className={styles.input} type="number" value={tradeQty} onChange={e => setTradeQty(e.target.value)} placeholder="2" /></div>
                  <div className={styles.field}><label className={styles.label}>P&L ($)</label><input className={styles.input} type="number" value={tradePnl} onChange={e => setTradePnl(e.target.value)} placeholder="Auto-calc or manual" /></div>
                  <div className={styles.field}><label className={styles.label}>Followed Plan?</label><select className={styles.select} value={tradePlanFollow} onChange={e => setTradePlanFollow(e.target.value)}><option>Yes</option><option>No — deviated</option><option>Partially</option></select></div>
                  <div className={styles.field}><label className={styles.label}>Emotion Score</label><select className={styles.select} value={tradeEmotion} onChange={e => setTradeEmotion(e.target.value)}><option value="1">1 — Calm</option><option value="2">2 — Mild</option><option value="3">3 — Tense</option><option value="4">4 — Reactive</option><option value="5">5 — Emotional</option></select></div>
                </div>
                <div className={styles.field} style={{ marginBottom: 12 }}><label className={styles.label}>Notes</label><input className={styles.input} value={tradeNotes} onChange={e => setTradeNotes(e.target.value)} placeholder="Why you took it, what you saw..." /></div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className={styles.btnGold} onClick={handleLogTrade}>Log Trade</button>
                  <button className={styles.btnGhost} onClick={() => setShowTradeForm(false)}>Cancel</button>
                </div>
              </div>
            )}

            <div className={styles.sectionLabel}>Trade History {activeMentee && trades.length > 0 && <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>— {trades.length} trades</span>}</div>
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead><tr>
                  <th>Date</th><th>Ticker</th><th>Direction</th><th>Setup</th><th>P&L</th><th>Plan</th><th>Emotion</th><th>Notes</th><th></th>
                </tr></thead>
                <tbody>
                  {trades.length === 0 ? (
                    <tr><td colSpan={9} style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)', fontSize: 12 }}>Select a mentee and log trades to populate history.</td></tr>
                  ) : [...trades].reverse().map(t => (
                    <tr key={t.id}>
                      <td style={{ color: 'var(--text-dim)' }}>{t.date}</td>
                      <td style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, color: 'var(--gold)' }}>{t.ticker}</td>
                      <td>{t.dir}</td>
                      <td style={{ color: 'var(--text-dim)' }}>{t.setup}</td>
                      <td><span className={`${styles.badge} ${t.pnl > 0 ? styles.badgeWin : t.pnl < 0 ? styles.badgeLoss : styles.badgeOpen}`}>{t.pnl > 0 ? '+$' : t.pnl < 0 ? '-$' : '$'}{Math.abs(t.pnl).toFixed(0)}</span></td>
                      <td><span className={`${styles.badge} ${t.plan === 'Yes' ? styles.badgeClean : t.plan === 'Partially' ? styles.badgeOpen : styles.badgeDeviated}`}>{t.plan === 'Yes' ? 'Clean' : t.plan === 'Partially' ? 'Partial' : 'Deviated'}</span></td>
                      <td style={{ color: t.emotion <= 2 ? 'var(--green)' : t.emotion >= 4 ? 'var(--red)' : 'var(--gold)', fontFamily: 'Rajdhani, sans-serif', fontWeight: 700 }}>{t.emotion}/5</td>
                      <td style={{ color: 'var(--text-dim)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.notes}</td>
                      <td><button onClick={() => handleDeleteTrade(t.id)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 12 }}>✕</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ═══ TAB 3: DASHBOARD ═══ */}
        {activeTab === 3 && (
          <div className={styles.panel}>
            <div className={styles.menteeBar}>
              <div className={styles.field} style={{ flex: 1 }}>
                <label className={styles.label}>Mentee Dashboard</label>
                <select className={styles.select} value={activeMentee} onChange={e => handleSelectMentee(e.target.value)}>
                  <option value="">— select mentee —</option>
                  {menteeNames.map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
              <button className={styles.btnOutline} onClick={handleDashAI} disabled={dashAILoading}>{dashAILoading ? 'Analyzing...' : 'AI Insights'}</button>
            </div>

            {!activeMentee ? (
              <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--text-muted)', fontSize: 13 }}>Select a mentee to view their dashboard.</div>
            ) : (
              <>
                {/* Stat cards */}
                <div className={styles.statGrid}>
                  <div className={styles.statCard}>
                    <div className={styles.statLabel}>Portfolio Value</div>
                    <div className={`${styles.statValue} ${portVal >= portStart ? styles.statGreen : styles.statRed}`}>${Math.round(portVal).toLocaleString()}</div>
                    <div className={styles.statSub}>started at ${portStart.toLocaleString()}</div>
                    <div className={styles.progressWrap}><div className={styles.progressFill} style={{ width: Math.min(100, Math.max(0, ((portVal - portStart) / (portStart * 0.5)) * 100)) + '%' }} /></div>
                  </div>
                  <div className={styles.statCard}>
                    <div className={styles.statLabel}>Win Rate</div>
                    <div className={`${styles.statValue} ${winRate >= 50 ? styles.statGreen : ''}`}>{winRate}%</div>
                    <div className={styles.statSub}>{wins} wins / {trades.length} trades</div>
                  </div>
                  <div className={styles.statCard}>
                    <div className={styles.statLabel}>Discipline Score</div>
                    <div className={`${styles.statValue} ${discScore >= 75 ? styles.statGreen : discScore > 0 ? styles.statRed : ''}`}>{discScore}%</div>
                    <div className={styles.statSub}>{planFollowed} of {trades.length} clean</div>
                  </div>
                  <div className={styles.statCard}>
                    <div className={styles.statLabel}>Avg Emotion Score</div>
                    <div className={`${styles.statValue} ${parseFloat(avgEmotion) <= 2 ? styles.statGreen : parseFloat(avgEmotion) >= 4 ? styles.statRed : ''}`}>{avgEmotion}</div>
                    <div className={styles.statSub}>1 = calm / 5 = reactive</div>
                  </div>
                </div>

                {/* Milestones */}
                <div className={styles.card}>
                  <div className={styles.cardTitle}>Portfolio Milestone Tracker</div>
                  {(() => {
                    const ms = getMilestones()
                    return (
                      <>
                        <div className={styles.milestoneTrack}>
                          {ms.map((m, i) => {
                            const done = portVal > m
                            const curr = portVal >= m && (i === ms.length - 1 || portVal < ms[i + 1])
                            return (
                              <div key={i} style={{ display: 'flex', alignItems: 'center', flex: i < ms.length - 1 ? 1 : 0 }}>
                                <div className={`${styles.msNode} ${done ? styles.msNodeDone : curr ? styles.msNodeCurrent : styles.msNodeFuture}`}>{done ? '✓' : i + 1}</div>
                                {i < ms.length - 1 && <div className={`${styles.msLine} ${done ? styles.msLineDone : ''}`} />}
                              </div>
                            )
                          })}
                        </div>
                        <div className={styles.milestoneLabels}>
                          {ms.map((m, i) => <span key={i}>{m >= 1000 ? '$' + (m / 1000).toFixed(1) + 'k' : '$' + m}</span>)}
                        </div>
                        {(() => {
                          const nextMs = ms.find(m => portVal < m)
                          if (!nextMs) return null
                          const idx = ms.indexOf(nextMs)
                          const prev = ms[idx - 1] || portStart
                          const pct = Math.min(100, Math.max(0, ((portVal - prev) / (nextMs - prev)) * 100))
                          return <div style={{ marginTop: 10, fontSize: 11, color: 'var(--text-dim)' }}>Next checkpoint: <span style={{ color: 'var(--gold)' }}>${Math.round(nextMs).toLocaleString()}</span> — ${Math.round(nextMs - portVal).toLocaleString()} away &nbsp;|&nbsp; Progress: <span style={{ color: 'var(--gold)' }}>{Math.round(pct)}%</span></div>
                        })()}
                      </>
                    )
                  })()}
                </div>

                <div className={styles.twoCol}>
                  {/* Plan summary */}
                  <div className={styles.card}>
                    <div className={styles.cardTitle}>Active Trade Plan</div>
                    {currentMenteeData?.plan?.portStart ? (
                      <>
                        {[
                          ['Focus', currentMenteeData.plan.focus],
                          ['Max Trades', currentMenteeData.plan.maxTrades + ' at a time'],
                          ['Max Size / Trade', '$' + currentMenteeData.plan.maxSize],
                          ['Stop Loss', currentMenteeData.plan.stopLoss + '%'],
                          ['Profit Target', currentMenteeData.plan.target + '%'],
                          ['DTE Rule', currentMenteeData.plan.dte],
                          ['Approval', currentMenteeData.plan.approval],
                          ['Check-ins', 'Every $' + currentMenteeData.plan.ci1 + ' → $' + currentMenteeData.plan.ci2 + ' after $' + currentMenteeData.plan.ci2Trigger],
                        ].map(([k, v]) => (
                          <div key={k} className={styles.ruleItem}><span className={styles.ruleKey}>{k}</span><span className={styles.ruleVal}>{v || '—'}</span></div>
                        ))}
                        {currentMenteeData.plan.restricted?.length > 0 && (
                          <div style={{ marginTop: 10 }}>
                            <div style={{ fontSize: 10, color: 'var(--text-dim)', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 4 }}>Off-Limits</div>
                            {currentMenteeData.plan.restricted.map((r, i) => <span key={i} className={`${styles.tag} ${styles.tagRed}`}>{r}</span>)}
                          </div>
                        )}
                      </>
                    ) : <p style={{ color: 'var(--text-muted)', fontSize: 12 }}>No plan saved. Fill out the Trade Plan tab.</p>}
                  </div>

                  <div>
                    {/* Flags */}
                    <div className={styles.sectionLabel}>Psychology Flags</div>
                    {getFlags().length > 0 ? getFlags().map((f, i) => (
                      <div key={i} className={styles.flag}><div className={styles.flagTitle}>{f.title}</div>{f.msg}</div>
                    )) : <p style={{ color: trades.length ? 'var(--green)' : 'var(--text-muted)', fontSize: 12, marginBottom: 16 }}>{trades.length ? 'No major flags detected. Keep monitoring.' : 'Log trades to surface behavioral patterns.'}</p>}

                    <div className={styles.divider} />

                    {/* Setup breakdown */}
                    <div className={styles.sectionLabel}>Setup Breakdown</div>
                    {Object.entries(setupBreakdown).length > 0 ? Object.entries(setupBreakdown).map(([s, d]) => (
                      <div key={s} className={styles.ruleItem}>
                        <span className={styles.ruleKey}>{s}</span>
                        <span style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                          <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>{d.count}x</span>
                          <span className={styles.ruleVal} style={d.pnl < 0 ? { color: 'var(--red)' } : {}}>{d.pnl >= 0 ? '+' : ''}${Math.round(d.pnl)}</span>
                        </span>
                      </div>
                    )) : <p style={{ color: 'var(--text-muted)', fontSize: 12 }}>No trades logged yet.</p>}
                  </div>
                </div>

                {/* AI Insights */}
                {(dashAI || dashAILoading) && (
                  <div style={{ marginTop: 4 }}>
                    <div className={styles.sectionLabel}>AI Mentee Analysis</div>
                    <div className={styles.aiOutput}>{dashAILoading ? 'Running mentee analysis...' : dashAI}</div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
