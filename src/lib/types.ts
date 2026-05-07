export type TradeStatus = 'OPEN' | 'WIN' | 'LOSS'

export interface Trade {
  id: string
  date: string
  closeDate: string
  account: string
  ticker: string
  dir: string
  setups: string[]
  entry: number
  exit: number
  qty: number
  pnl: number
  roi: number
  status: TradeStatus
  plan: string
  emotion: number
  notes: string
  screenshots: string[]
}

export interface SessionFlag {
  title: string
  msg: string
}

export interface SavedSession {
  id: string
  date: string
  savedAt: string
  trades: string
  followed: string
  deviation: string
  pnl: string
  emotion: number
  focus: string
  win: string
  mistake: string
  aiBrief: string
  fathomNotes: string
  flags: SessionFlag[]
}

export interface TradingAccount {
  id: string
  type: string
  label: string
  balance: number
  notes: string
}

export interface MenteePlan {
  goalShortTerm: string
  goalLongTerm: string
  goalTimeline: string
  goalPortTarget: number
  accounts: TradingAccount[]
  sharesHeld: string
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

export const ACCOUNT_TYPES = [
  'Main - Buying', 'Main - Selling', 'IRA', 'Roth IRA',
  '401k', 'Cash Account', 'Margin', 'Paper Trading',
]

export const EMOTIONS_LIST = [
  'Confident', 'Uncertain', 'FOMO', 'Revenge Trading',
  'Calm', 'Anxious', 'Greedy', 'Patient'
]

export const THESTRAT_SETUPS = [
  'FTFC', 'CCRP', 'Hammer', 'Shooter', 'PMG',
  'Broadening Formation Reversal',
  '2-1-2u (bullish)', '2-1-2d (bearish)',
  '3-1-2u (bullish)', '3-1-2d (bearish)',
  '1-3-2u (bullish)', '1-3-2d (bearish)',
  '2u-2d reversal', '2d-2u reversal',
  '1-2-2u (bullish)', '1-2-2d (bearish)',
  '3-2-2 (bullish reversal)', '3-2-2 (bullish continuation)',
  '3-2-2 (bearish reversal)', '3-2-2 (bearish continuation)',
  '3-1-1 (consolidation)', '3-1-2 Cya Later',
  'Double Inside', 'Triple Inside', 'Gap Fill',
]

export const MARKET_STRUCTURE_SETUPS = [
  'OTE', 'MSS/CHoCH', 'BOS',
  'Liquidity Sweep', 'S/R Flip', 'Moving Average Crossover',
]
