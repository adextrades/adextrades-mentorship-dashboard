import { AppData, Mentee, MenteePlan, Trade } from './types'

export const DEFAULT_MENTEES = [
  'Knight', 'Tim Park', 'Giovanni Santiago', 'Maggie Stewart',
  'Patrick Rebadow', 'Sam Williamson', 'James Jean-Louis',
  'Shelly Crosby', 'Mercy Onuoha'
]

export const EMPTY_PLAN: MenteePlan = {
  // Goals
  goalShortTerm: '',
  goalLongTerm: '',
  goalTimeline: '',
  goalPortTarget: 0,
  // Assets & Profile
  accountSize: 0,
  cashAvailable: 0,
  sharesHeld: '',
  exp: 'Beginner (0–1 yr)',
  focus: 'Buying Options',
  // Trade Rules
  portStart: 0,
  maxTrades: 2,
  maxSize: 500,
  stopLoss: 40,
  target: 30,
  dte: 'No weekly expiration swings',
  approval: 'All trades',
  // Milestones
  ci1: 200,
  ci2Trigger: 3000,
  ci2: 500,
  drawdown: 400,
  // Approved/Restricted
  approved: [],
  restricted: [],
  // Psychology
  psych: '',
  goals: ''
}

function getDefaultData(): AppData {
  return { mentees: {} }
}

export async function loadDataRemote(): Promise<AppData> {
  try {
    const res = await fetch('/api/data', { cache: 'no-store' })
    const json = await res.json()
    return json.data || getDefaultData()
  } catch (e) {
    console.error('Failed to load remote data:', e)
    return getDefaultData()
  }
}

export async function saveDataRemote(data: AppData): Promise<void> {
  try {
    await fetch('/api/data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
  } catch (e) {
    console.error('Failed to save remote data:', e)
  }
}

export function getMentee(data: AppData, name: string): Mentee {
  if (!data.mentees[name]) {
    data.mentees[name] = {
      name,
      plan: { ...EMPTY_PLAN },
      trades: [],
      updatedAt: new Date().toISOString()
    }
  }
  // Migrate old plans that don't have new goal fields
  const m = data.mentees[name]
  m.plan = { ...EMPTY_PLAN, ...m.plan }
  return m
}

export function saveMenteePlan(data: AppData, name: string, plan: MenteePlan): AppData {
  const mentee = getMentee(data, name)
  mentee.plan = plan
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

export function deleteTrade(data: AppData, name: string, tradeId: string): AppData {
  const mentee = getMentee(data, name)
  mentee.trades = mentee.trades.filter(t => t.id !== tradeId)
  return { ...data, mentees: { ...data.mentees, [name]: mentee } }
}

export function addMentee(data: AppData, name: string): AppData {
  if (data.mentees[name]) return data
  const mentee: Mentee = {
    name,
    plan: { ...EMPTY_PLAN },
    trades: [],
    updatedAt: new Date().toISOString()
  }
  return { ...data, mentees: { ...data.mentees, [name]: mentee } }
}

export function getAllMenteeNames(data: AppData): string[] {
  const custom = Object.keys(data.mentees).filter(n => !DEFAULT_MENTEES.includes(n))
  return [...DEFAULT_MENTEES, ...custom]
}
