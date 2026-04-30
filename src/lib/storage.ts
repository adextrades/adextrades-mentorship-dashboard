import { AppData, Mentee, MenteePlan, Trade } from './types'

const STORAGE_KEY = 'adextrades_data'

export const DEFAULT_MENTEES = [
  'Knight', 'Tim Park', 'Giovanni Santiago', 'Maggie Stewart',
  'Patrick Rebadow', 'Sam Williamson', 'James Jean-Louis',
  'Shelly Crosby', 'Mercy Onuoha'
]

export const EMPTY_PLAN: MenteePlan = {
  exp: 'Beginner (0–1 yr)',
  focus: 'Buying Options',
  portStart: 0,
  maxTrades: 2,
  maxSize: 500,
  stopLoss: 40,
  target: 30,
  dte: 'No weekly expiration swings',
  approval: 'All trades',
  ci1: 200,
  ci2Trigger: 3000,
  ci2: 500,
  drawdown: 400,
  approved: [],
  restricted: [],
  psych: '',
  goals: ''
}

function getDefaultData(): AppData {
  return { mentees: {} }
}

export function loadData(): AppData {
  if (typeof window === 'undefined') return getDefaultData()
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return getDefaultData()
    return JSON.parse(raw) as AppData
  } catch {
    return getDefaultData()
  }
}

export function saveData(data: AppData): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch (e) {
    console.error('Failed to save data', e)
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
  return data.mentees[name]
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
