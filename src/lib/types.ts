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

export interface MenteePlan {
  exp: string
  focus: string
  portStart: number
  maxTrades: number
  maxSize: number
  stopLoss: number
  target: number
  dte: string
  approval: string
  ci1: number
  ci2Trigger: number
  ci2: number
  drawdown: number
  approved: string[]
  restricted: string[]
  psych: string
  goals: string
}

export interface Mentee {
  name: string
  plan: MenteePlan
  trades: Trade[]
  updatedAt: string
}

export interface AppData {
  mentees: Record<string, Mentee>
}
