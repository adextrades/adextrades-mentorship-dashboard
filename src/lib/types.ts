export interface Trade {
  id: string
  date: string
  ticker: string
  dir: string
  setup: string
  entry: number
  exit: number
  qty: number
  pnl: number
  plan: string
  emotion: number
  notes: string
}

export interface SessionFlag {
  title: string
  msg: string
}

export interface SavedSession {
  id: string
  date: string
  savedAt: string
  // Intake answers
  trades: string
  followed: string
  deviation: string
  pnl: string
  emotion: number
  focus: string
  win: string
  mistake: string
  // AI outputs
  aiBrief: string
  flags: SessionFlag[]
}

export interface MenteePlan {
  // Section 1 — Goals & Vision
  goalShortTerm: string
  goalLongTerm: string
  goalTimeline: string
  goalPortTarget: number
  // Section 2 — Assets & Profile
  accountSize: number
  cashAvailable: number
  sharesHeld: string
  exp: string
  focus: string
  // Section 3 — Trade Rules
  portStart: number
  maxTrades: number
  maxSize: number
  stopLoss: number
  target: number
  dte: string
  approval: string
  // Section 4 — Milestone Check-ins
  ci1: number
  ci2Trigger: number
  ci2: number
  drawdown: number
  // Section 5 — Approved & Restricted
  approved: string[]
  restricted: string[]
  // Section 6 — Psychology
  psych: string
  goals: string
  // Meta
  planUpdatedAt: string
}

export interface Mentee {
  name: string
  plan: MenteePlan
  trades: Trade[]
  sessions: SavedSession[]
  updatedAt: string
}

export interface AppData {
  mentees: Record<string, Mentee>
}
