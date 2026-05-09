import { AppData, Mentee, MenteePlan, Trade, SavedSession, TradeStatus } from './types'

export const DEFAULT_MENTEES = [
  'Knight', 'Tim Park', 'Giovanni Santiago', 'Maggie Stewart',
  'Patrick Rebadow', 'Sam Williamson', 'James Jean-Louis',
  'Shelly Crosby', 'Mercy Onuoha'
]

export const EMPTY_PLAN: MenteePlan = {
  goalShortTerm: '', goalLongTerm: '', goalTimeline: '', goalPortTarget: 0,
  accounts: [], sharesHeld: '', exp: 'Beginner (0–1 yr)', focus: 'Buying Options',
  portStart: 0, maxTrades: 2, maxSize: 500, stopLoss: 40, target: 30,
  dte: 'No weekly expiration swings', approval: 'All trades',
  ci1: 200, ci2Trigger: 3000, ci2: 500, drawdown: 400,
  approved: [], restricted: [], psych: '', goals: '', planUpdatedAt: ''
}

function getDefaultData(): AppData { return { mentees: {} } }

export async function loadDataRemote(): Promise<AppData> {
  try {
    const res = await fetch('/api/data', { cache: 'no-store' })
    const json = await res.json()
    return json.data || getDefaultData()
  } catch (e) { console.error('Failed to load remote data:', e); return getDefaultData() }
}

export async function saveDataRemote(data: AppData): Promise<void> {
  try {
    await fetch('/api/data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
  } catch (e) { console.error('Failed to save remote data:', e) }
}

function autoDetectStatus(pnl: number, exit: number, closeDate: string): TradeStatus {
  if (!exit && !closeDate) return 'OPEN'
  return pnl >= 0 ? 'WIN' : 'LOSS'
}

function calcRoi(entry: number, exit: number, qty: number, pnl: number): number {
  const cost = entry * qty * 100
  if (!cost || !exit) return 0
  return parseFloat(((pnl / cost) * 100).toFixed(1))
}

function migrateTrade(t: any): Trade {
  const setups = t.setups ? t.setups : t.setup ? [t.setup] : []
  const entry = t.entry || 0
  const exit = t.exit || 0
  const qty = t.qty || 1
  const pnl = t.pnl || 0
  const closeDate = t.closeDate || ''
  const status: TradeStatus = t.status || autoDetectStatus(pnl, exit, closeDate)
  const roi = t.roi !== undefined ? t.roi : calcRoi(entry, exit, qty, pnl)
  return {
    id: t.id || Date.now().toString(),
    date: t.date || '',
    closeDate,
    account: t.account || '',
    ticker: t.ticker || '',
    dir: t.dir || '',
    setups,
    entry,
    exit,
    qty,
    pnl,
    roi,
    status,
    plan: t.plan || '',
    emotion: t.emotion || 0,
    notes: t.notes || '',
    screenshots: t.screenshots || [],
  }
}

export function getMentee(data: AppData, name: string): Mentee {
  if (!data.mentees[name]) {
    data.mentees[name] = { name, plan: { ...EMPTY_PLAN }, trades: [], sessions: [], updatedAt: new Date().toISOString() }
  }
  const m = data.mentees[name]
  m.plan = { ...EMPTY_PLAN, ...m.plan }
  if (!m.sessions) m.sessions = []
  if (!m.plan.accounts) m.plan.accounts = []
  m.trades = (m.trades || []).map(migrateTrade)
  if ((m.plan as any).accountSize && m.plan.accounts.length === 0) {
    m.plan.accounts = [{ id: 'legacy-1', type: 'Main - Buying', label: 'Main', balance: (m.plan as any).accountSize || 0, notes: '' }]
  }
  return m
}

export function saveMenteePlan(data: AppData, name: string, plan: MenteePlan): AppData {
  const mentee = getMentee(data, name)
  mentee.plan = { ...plan, planUpdatedAt: new Date().toISOString() }
  mentee.updatedAt = new Date().toISOString()
  return { ...data, mentees: { ...data.mentees, [name]: mentee } }
}

export function addTrade(data: AppData, name: string, trade: Omit<Trade, 'id'>): AppData {
  const mentee = getMentee(data, name)
  const newTrade: Trade = { ...trade, id: Date.now().toString() }
  mentee.trades = [...mentee.trades, newTrade]
  mentee.updatedAt = new Date().toISOString()
  return { ...data, mentees: { ...data.mentees, [name]: mentee } }
}

export function updateTrade(data: AppData, name: string, tradeId: string, updates: Partial<Trade>): AppData {
  const mentee = getMentee(data, name)
  mentee.trades = mentee.trades.map(t => {
    if (t.id !== tradeId) return t
    const updated = { ...t, ...updates }
    // re-derive status and roi if exit/closeDate/pnl changed
    if (!updates.status) {
      updated.status = autoDetectStatus(updated.pnl, updated.exit, updated.closeDate)
    }
    if (updates.exit !== undefined || updates.pnl !== undefined) {
      updated.roi = calcRoi(updated.entry, updated.exit, updated.qty, updated.pnl)
    }
    return updated
  })
  mentee.updatedAt = new Date().toISOString()
  return { ...data, mentees: { ...data.mentees, [name]: mentee } }
}

export function deleteTrade(data: AppData, name: string, tradeId: string): AppData {
  const mentee = getMentee(data, name)
  mentee.trades = mentee.trades.filter(t => t.id !== tradeId)
  return { ...data, mentees: { ...data.mentees, [name]: mentee } }
}

export function saveSession(data: AppData, name: string, session: Omit<SavedSession, 'id' | 'savedAt'>): AppData {
  const mentee = getMentee(data, name)
  const newSession: SavedSession = { ...session, id: Date.now().toString(), savedAt: new Date().toISOString() }
  mentee.sessions = [...(mentee.sessions || []), newSession]
  mentee.updatedAt = new Date().toISOString()
  return { ...data, mentees: { ...data.mentees, [name]: mentee } }
}

export function addMentee(data: AppData, name: string): AppData {
  if (data.mentees[name]) return data
  const mentee: Mentee = { name, plan: { ...EMPTY_PLAN }, trades: [], sessions: [], updatedAt: new Date().toISOString() }
  return { ...data, mentees: { ...data.mentees, [name]: mentee } }
}

export function getAllMenteeNames(data: AppData): string[] {
  const custom = Object.keys(data.mentees).filter(n => !DEFAULT_MENTEES.includes(n))
  return [...DEFAULT_MENTEES, ...custom]
}

export function getSetupCombinationStats(trades: Trade[]): Record<string, { count: number; wins: number; pnl: number }> {
  const stats: Record<string, { count: number; wins: number; pnl: number }> = {}
  trades.forEach(t => {
    if (!t.setups || t.setups.length === 0) return
    const key = [...t.setups].sort().join(' + ')
    if (!stats[key]) stats[key] = { count: 0, wins: 0, pnl: 0 }
    stats[key].count++
    if (t.pnl > 0) stats[key].wins++
    stats[key].pnl += t.pnl
  })
  return stats
}

export function deleteSession(data: AppData, name: string, sessionId: string): AppData {
  const mentee = getMentee(data, name)
  mentee.sessions = (mentee.sessions || []).filter(s => s.id !== sessionId)
  return { ...data, mentees: { ...data.mentees, [name]: mentee } }
}
