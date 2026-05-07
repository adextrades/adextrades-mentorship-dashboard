'use client'
import { useState, useEffect } from 'react'
import { Trade, TradeStatus, ACCOUNT_TYPES } from '@/lib/types'
import SetupSelector from './SetupSelector'
import ScreenshotUploader from './ScreenshotUploader'

interface TradeModalProps {
  trade: Trade
  onClose: () => void
  onSave: (updates: Partial<Trade>) => void
  onDelete: () => void
}

const STATUS_COLORS: Record<TradeStatus, string> = {
  OPEN: 'var(--gold)',
  WIN: 'var(--green)',
  LOSS: 'var(--red)',
}

const STATUS_BG: Record<TradeStatus, string> = {
  OPEN: 'rgba(201,168,76,0.12)',
  WIN: 'rgba(82,196,122,0.12)',
  LOSS: 'rgba(224,82,82,0.12)',
}

export default function TradeModal({ trade, onClose, onSave, onDelete }: TradeModalProps) {
  const [editing, setEditing] = useState(false)
  const [viewImage, setViewImage] = useState<string | null>(null)

  // Editable fields
  const [status, setStatus] = useState<TradeStatus>(trade.status)
  const [closeDate, setCloseDate] = useState(trade.closeDate || '')
  const [exit, setExit] = useState(trade.exit?.toString() || '')
  const [pnl, setPnl] = useState(trade.pnl?.toString() || '')
  const [setups, setSetups] = useState<string[]>(trade.setups || [])
  const [notes, setNotes] = useState(trade.notes || '')
  const [screenshots, setScreenshots] = useState<string[]>(trade.screenshots || [])
  const [account, setAccount] = useState(trade.account || '')
  const [emotion, setEmotion] = useState(trade.emotion?.toString() || '1')
  const [plan, setPlan] = useState(trade.plan || '')

  // Auto-detect status when exit/pnl change
  useEffect(() => {
    if (!editing) return
    const exitVal = parseFloat(exit)
    const pnlVal = parseFloat(pnl)
    if (!exitVal && !closeDate) { setStatus('OPEN'); return }
    if (!isNaN(pnlVal)) setStatus(pnlVal >= 0 ? 'WIN' : 'LOSS')
  }, [exit, pnl, closeDate])

  const handleSave = () => {
    const exitVal = parseFloat(exit) || 0
    const pnlVal = parseFloat(pnl) || 0
    const cost = trade.entry * trade.qty * 100
    const roi = cost > 0 && exitVal ? parseFloat(((pnlVal / cost) * 100).toFixed(1)) : 0
    onSave({ status, closeDate, exit: exitVal, pnl: pnlVal, roi, setups, notes, screenshots, account, emotion: parseInt(emotion), plan })
    setEditing(false)
  }

  const field = (label: string, value: React.ReactNode) => (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--gold-dim)', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.5 }}>{value || '—'}</div>
    </div>
  )

  const inp = (val: string, set: (v: string) => void, props?: React.InputHTMLAttributes<HTMLInputElement>) => (
    <input value={val} onChange={e => set(e.target.value)} style={{ background: 'var(--bg3)', border: '1px solid var(--border)', color: 'var(--text)', fontFamily: 'Inter, sans-serif', fontSize: 13, padding: '8px 12px', borderRadius: 4, outline: 'none', width: '100%' }} {...props} />
  )

  return (
    <>
      {/* Image lightbox */}
      {viewImage && (
        <div onClick={() => setViewImage(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.95)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'zoom-out' }}>
          <img src={viewImage} alt="chart" style={{ maxWidth: '92vw', maxHeight: '92vh', objectFit: 'contain', borderRadius: 6 }} />
          <div style={{ position: 'absolute', top: 20, right: 24, color: 'var(--text-dim)', fontSize: 13, fontFamily: 'Rajdhani, sans-serif', letterSpacing: '2px' }}>CLICK TO CLOSE</div>
        </div>
      )}

      {/* Modal backdrop */}
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 8, width: '100%', maxWidth: 760, maxHeight: '92vh', overflowY: 'auto', padding: 28 }}>

          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
            <div>
              <div style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: 11, fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--gold-dim)', marginBottom: 4 }}>Trade Record</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: 24, fontWeight: 700, color: 'var(--gold)' }}>{trade.ticker}</div>
                <div style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: 13, color: 'var(--text-dim)' }}>{trade.dir}</div>
                {/* Status badge */}
                {editing ? (
                  <select value={status} onChange={e => setStatus(e.target.value as TradeStatus)} style={{ background: STATUS_BG[status], border: '1px solid', borderColor: STATUS_COLORS[status], color: STATUS_COLORS[status], fontFamily: 'Rajdhani, sans-serif', fontSize: 12, fontWeight: 700, letterSpacing: '1px', padding: '3px 10px', borderRadius: 4, cursor: 'pointer' }}>
                    <option value="OPEN">OPEN</option>
                    <option value="WIN">WIN</option>
                    <option value="LOSS">LOSS</option>
                  </select>
                ) : (
                  <div style={{ background: STATUS_BG[trade.status], border: '1px solid', borderColor: STATUS_COLORS[trade.status], color: STATUS_COLORS[trade.status], fontFamily: 'Rajdhani, sans-serif', fontSize: 11, fontWeight: 700, letterSpacing: '1.5px', padding: '3px 10px', borderRadius: 4 }}>
                    {trade.status}
                  </div>
                )}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {editing ? (
                <>
                  <button onClick={handleSave} style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: 12, fontWeight: 700, letterSpacing: '1.5px', padding: '8px 18px', borderRadius: 4, background: 'var(--gold)', color: '#080808', border: 'none', cursor: 'pointer' }}>SAVE</button>
                  <button onClick={() => setEditing(false)} style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: 12, fontWeight: 700, letterSpacing: '1.5px', padding: '8px 18px', borderRadius: 4, background: 'transparent', color: 'var(--text-dim)', border: '1px solid var(--border)', cursor: 'pointer' }}>CANCEL</button>
                </>
              ) : (
                <>
                  <button onClick={() => setEditing(true)} style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: 12, fontWeight: 700, letterSpacing: '1.5px', padding: '8px 18px', borderRadius: 4, background: 'transparent', color: 'var(--gold)', border: '1px solid var(--border-bright)', cursor: 'pointer' }}>EDIT</button>
                  <button onClick={onClose} style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: 12, fontWeight: 700, letterSpacing: '1.5px', padding: '8px 18px', borderRadius: 4, background: 'transparent', color: 'var(--text-dim)', border: '1px solid var(--border)', cursor: 'pointer' }}>CLOSE</button>
                </>
              )}
            </div>
          </div>

          {/* Core trade info — 2 col grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0 24px', marginBottom: 16, padding: '16px', background: 'var(--bg3)', borderRadius: 6 }}>
            {field('Open Date', trade.date)}
            {field('Close Date', editing ? inp(closeDate, setCloseDate, { type: 'date' }) : (trade.closeDate || 'Still open'))}
            {field('Account', editing ? (
              <select value={account} onChange={e => setAccount(e.target.value)} style={{ background: 'var(--bg3)', border: '1px solid var(--border)', color: 'var(--text)', fontFamily: 'Inter, sans-serif', fontSize: 13, padding: '8px 12px', borderRadius: 4, width: '100%' }}>
                <option value="">—</option>
                {ACCOUNT_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            ) : trade.account)}
            {field('Entry Price', '$' + (trade.entry || 0).toFixed(2))}
            {field('Exit Price', editing ? inp(exit, setExit, { type: 'number', step: '0.01', placeholder: '0.00' }) : (trade.exit ? '$' + trade.exit.toFixed(2) : '—'))}
            {field('Contracts / Shares', trade.qty?.toString())}
            {field('P&L', editing ? inp(pnl, setPnl, { type: 'number', placeholder: '0' }) : (
              <span style={{ color: trade.pnl > 0 ? 'var(--green)' : trade.pnl < 0 ? 'var(--red)' : 'var(--text-dim)', fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: 16 }}>
                {trade.pnl > 0 ? '+' : ''}{trade.pnl ? '$' + trade.pnl.toFixed(0) : '—'}
              </span>
            ))}
            {field('ROI', trade.roi ? (
              <span style={{ color: trade.roi > 0 ? 'var(--green)' : 'var(--red)', fontFamily: 'Rajdhani, sans-serif', fontWeight: 700 }}>{trade.roi > 0 ? '+' : ''}{trade.roi}%</span>
            ) : '—')}
            {field('Followed Plan?', editing ? (
              <select value={plan} onChange={e => setPlan(e.target.value)} style={{ background: 'var(--bg3)', border: '1px solid var(--border)', color: 'var(--text)', fontFamily: 'Inter, sans-serif', fontSize: 13, padding: '8px 12px', borderRadius: 4, width: '100%' }}>
                <option>Yes</option><option>No — deviated</option><option>Partially</option>
              </select>
            ) : trade.plan)}
            {field('Emotion', editing ? (
              <select value={emotion} onChange={e => setEmotion(e.target.value)} style={{ background: 'var(--bg3)', border: '1px solid var(--border)', color: 'var(--text)', fontFamily: 'Inter, sans-serif', fontSize: 13, padding: '8px 12px', borderRadius: 4, width: '100%' }}>
                <option value="1">1 — Calm</option><option value="2">2 — Mild</option><option value="3">3 — Tense</option><option value="4">4 — Reactive</option><option value="5">5 — Emotional</option>
              </select>
            ) : (trade.emotion + '/5'))}
          </div>

          {/* Setups */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--gold-dim)', marginBottom: 8 }}>Setups / Confluences</div>
            {editing ? (
              <SetupSelector selected={setups} onChange={setSetups} />
            ) : (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {(trade.setups || []).length > 0
                  ? trade.setups.map(s => <span key={s} style={{ background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.25)', color: 'var(--gold)', fontSize: 11, padding: '3px 10px', borderRadius: 3, fontWeight: 500 }}>{s}</span>)
                  : <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>No setups tagged</span>}
              </div>
            )}
          </div>

          {/* Notes */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--gold-dim)', marginBottom: 8 }}>Journal Notes</div>
            {editing ? (
              <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="What happened? What did you learn?" style={{ background: 'var(--bg3)', border: '1px solid var(--border)', color: 'var(--text)', fontFamily: 'Inter, sans-serif', fontSize: 13, padding: '10px 12px', borderRadius: 4, width: '100%', minHeight: 80, resize: 'vertical', outline: 'none', lineHeight: 1.5 }} />
            ) : (
              <div style={{ fontSize: 13, color: trade.notes ? 'var(--text)' : 'var(--text-muted)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{trade.notes || 'No notes added'}</div>
            )}
          </div>

          {/* Screenshots */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--gold-dim)', marginBottom: 8 }}>
              Charts / Screenshots {screenshots.length > 0 && <span style={{ color: 'var(--text-muted)', textTransform: 'none', letterSpacing: 0, fontWeight: 400, fontSize: 11 }}>({screenshots.length})</span>}
            </div>
            {editing ? (
              <ScreenshotUploader screenshots={screenshots} onChange={setScreenshots} />
            ) : (
              screenshots.length > 0 ? (
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  {screenshots.map((url, i) => (
                    <div key={i} onClick={() => setViewImage(url)} style={{ position: 'relative', cursor: 'zoom-in' }}>
                      <img src={url} alt={'chart ' + (i+1)} style={{ width: 120, height: 90, objectFit: 'cover', borderRadius: 6, border: '1px solid var(--border)', transition: 'border-color 0.15s' }}
                        onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--gold)')}
                        onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')} />
                      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0)', borderRadius: 6, transition: 'background 0.15s', fontSize: 18 }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(0,0,0,0.35)')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'rgba(0,0,0,0)')}>
                        🔍
                      </div>
                    </div>
                  ))}
                </div>
              ) : <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>No screenshots attached</div>
            )}
          </div>

          {/* Footer */}
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <button onClick={() => { if (confirm('Delete this trade? This cannot be undone.')) onDelete() }} style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: 11, fontWeight: 700, letterSpacing: '1.5px', padding: '7px 14px', borderRadius: 4, background: 'rgba(224,82,82,0.08)', color: 'var(--red)', border: '1px solid rgba(224,82,82,0.25)', cursor: 'pointer' }}>
              DELETE TRADE
            </button>
            {editing && <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Status auto-detects from P&L — or override manually</div>}
          </div>
        </div>
      </div>
    </>
  )
}
