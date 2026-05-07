'use client'
import { useState, useRef, useEffect } from 'react'
import { THESTRAT_SETUPS, MARKET_STRUCTURE_SETUPS } from '@/lib/types'

interface SetupSelectorProps {
  selected: string[]
  onChange: (setups: string[]) => void
}

export default function SetupSelector({ selected, onChange }: SetupSelectorProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const toggle = (setup: string) => {
    if (selected.includes(setup)) {
      onChange(selected.filter(s => s !== setup))
    } else {
      onChange([...selected, setup])
    }
  }

  const displayText = selected.length === 0
    ? 'Select setups...'
    : selected.join(', ')

  return (
    <div ref={ref} style={{ position: 'relative', width: '100%' }}>
      <div
        onClick={() => setOpen(o => !o)}
        style={{
          background: 'var(--bg3)', border: '1px solid var(--border)',
          borderColor: open ? 'var(--gold)' : 'var(--border)',
          color: selected.length ? 'var(--text)' : 'var(--text-muted)',
          fontFamily: 'Inter, sans-serif', fontSize: 13, padding: '9px 12px',
          borderRadius: 4, cursor: 'pointer', userSelect: 'none',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          minHeight: 38,
        }}
      >
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
          {displayText}
        </span>
        <span style={{ color: 'var(--gold-dim)', marginLeft: 8, flexShrink: 0 }}>
          {selected.length > 0 && <span style={{ fontSize: 11, background: 'var(--gold)', color: '#080808', borderRadius: 10, padding: '1px 7px', marginRight: 6, fontWeight: 700 }}>{selected.length}</span>}
          {open ? '▲' : '▼'}
        </span>
      </div>

      {open && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 500,
          background: 'var(--bg2)', border: '1px solid var(--border-bright)',
          borderRadius: 4, marginTop: 4, maxHeight: 320, overflowY: 'auto',
          boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
        }}>
          {/* TheStrat group */}
          <div style={{ padding: '8px 12px 4px', fontSize: 10, fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--gold-dim)', borderBottom: '1px solid var(--border)' }}>
            TheStrat
          </div>
          {THESTRAT_SETUPS.map(setup => (
            <div
              key={setup}
              onClick={() => toggle(setup)}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '8px 14px', cursor: 'pointer',
                background: selected.includes(setup) ? 'var(--gold-glow)' : 'transparent',
                borderBottom: '1px solid rgba(201,168,76,0.05)',
                fontSize: 13, color: selected.includes(setup) ? 'var(--gold)' : 'var(--text)',
              }}
              onMouseEnter={e => { if (!selected.includes(setup)) e.currentTarget.style.background = 'var(--bg3)' }}
              onMouseLeave={e => { e.currentTarget.style.background = selected.includes(setup) ? 'var(--gold-glow)' : 'transparent' }}
            >
              <div style={{
                width: 16, height: 16, borderRadius: 3, flexShrink: 0,
                border: '1px solid', borderColor: selected.includes(setup) ? 'var(--gold)' : 'var(--border)',
                background: selected.includes(setup) ? 'var(--gold)' : 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {selected.includes(setup) && <span style={{ color: '#080808', fontSize: 11, fontWeight: 700, lineHeight: 1 }}>✓</span>}
              </div>
              {setup}
            </div>
          ))}

          {/* Market Structure group */}
          <div style={{ padding: '8px 12px 4px', fontSize: 10, fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--gold-dim)', borderBottom: '1px solid var(--border)', borderTop: '1px solid var(--border)', marginTop: 4 }}>
            Market Structure
          </div>
          {MARKET_STRUCTURE_SETUPS.map(setup => (
            <div
              key={setup}
              onClick={() => toggle(setup)}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '8px 14px', cursor: 'pointer',
                background: selected.includes(setup) ? 'var(--gold-glow)' : 'transparent',
                borderBottom: '1px solid rgba(201,168,76,0.05)',
                fontSize: 13, color: selected.includes(setup) ? 'var(--gold)' : 'var(--text)',
              }}
              onMouseEnter={e => { if (!selected.includes(setup)) e.currentTarget.style.background = 'var(--bg3)' }}
              onMouseLeave={e => { e.currentTarget.style.background = selected.includes(setup) ? 'var(--gold-glow)' : 'transparent' }}
            >
              <div style={{
                width: 16, height: 16, borderRadius: 3, flexShrink: 0,
                border: '1px solid', borderColor: selected.includes(setup) ? 'var(--gold)' : 'var(--border)',
                background: selected.includes(setup) ? 'var(--gold)' : 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {selected.includes(setup) && <span style={{ color: '#080808', fontSize: 11, fontWeight: 700, lineHeight: 1 }}>✓</span>}
              </div>
              {setup}
            </div>
          ))}

          {selected.length > 0 && (
            <div style={{ padding: '8px 14px', borderTop: '1px solid var(--border)' }}>
              <button onClick={e => { e.stopPropagation(); onChange([]) }} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 11, fontFamily: 'Rajdhani, sans-serif', letterSpacing: '1px' }}>
                CLEAR ALL
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
