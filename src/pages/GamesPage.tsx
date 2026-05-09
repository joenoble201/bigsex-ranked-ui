import { useState, useEffect } from 'react'
import { ApiService } from '../services/ApiService'
import gorilla from '../assets/gorilla.png'

// ── Types ─────────────────────────────────────────────────────
interface Card { rank: string; suit: string }

interface GambleResult {
  outcome: 'win' | 'loss' | 'push'
  delta: number
  newBalance: number
  details: Record<string, unknown>
}

interface BJState {
  gameId?: string
  playerHand: Card[]
  playerValue: number
  dealerVisible: Card[]
  dealerValue: number | null
  bet: number
  status: string
  delta?: number | null
  newBalance?: number | null
  message?: string | null
}

// ── Shared helpers ────────────────────────────────────────────
const fmt = (n: number) => Math.floor(Math.abs(n)).toLocaleString()

const inputStyle: React.CSSProperties = {
  width: '100%', boxSizing: 'border-box',
  background: '#0a0603',
  border: '1px solid rgba(200,146,12,0.35)',
  color: '#e8c040',
  fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: 16,
  padding: '10px 14px', outline: 'none', letterSpacing: '0.05em',
}

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 10, letterSpacing: '0.3em',
  color: 'rgba(200,146,12,0.5)', textTransform: 'uppercase',
  marginBottom: 7, fontFamily: 'Rajdhani, sans-serif', fontWeight: 700,
}

function OutcomeBar({ outcome, delta }: { outcome: string; delta: number }) {
  const win  = outcome === 'win'
  const push = outcome === 'push'
  const color = win ? '#4ade80' : push ? '#e8c040' : '#f87171'
  const sign  = win ? '+' : push ? '±' : '-'
  const label = win ? 'YOU WIN' : push ? 'PUSH' : 'YOU LOSE'

  return (
    <div style={{
      padding: '12px 16px',
      background: `rgba(${win ? '74,222,128' : push ? '200,146,12' : '248,113,113'},0.08)`,
      border: `1px solid ${color}44`,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    }}>
      <span style={{ fontFamily: 'Bebas Neue, Impact, sans-serif', fontSize: 22, color, letterSpacing: '0.06em' }}>{label}</span>
      <span style={{ fontFamily: 'Bebas Neue, Impact, sans-serif', fontSize: 22, color, letterSpacing: '0.04em' }}>
        {sign}₽{fmt(delta)}
      </span>
    </div>
  )
}

// ── Game modal wrapper ────────────────────────────────────────
function GameModal({ title, onClose, children, maxWidth = 500 }: {
  title: string; onClose: () => void; children: React.ReactNode; maxWidth?: number
}) {
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 300,
        background: 'rgba(4,2,1,0.88)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 24, animation: 'modal-bg-in 0.2s ease-out',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%', maxWidth,
          background: 'linear-gradient(155deg, #1e1008 0%, #110905 65%, #0d0703 100%)',
          border: '1px solid rgba(200,146,12,0.45)',
          boxShadow: '0 0 60px rgba(200,146,12,0.12), 0 24px 60px rgba(0,0,0,0.7)',
          padding: '24px 24px 20px', position: 'relative',
          animation: 'modal-card-in 0.22s cubic-bezier(0.22, 1, 0.36, 1)',
        }}
      >
        {/* Corner brackets */}
        {([
          { top: 8, left: 8, borderTop: '1px solid', borderLeft: '1px solid' },
          { top: 8, right: 8, borderTop: '1px solid', borderRight: '1px solid' },
          { bottom: 8, left: 8, borderBottom: '1px solid', borderLeft: '1px solid' },
          { bottom: 8, right: 8, borderBottom: '1px solid', borderRight: '1px solid' },
        ] as React.CSSProperties[]).map((p, i) => (
          <div key={i} style={{ position: 'absolute', width: 12, height: 12, borderColor: 'rgba(200,146,12,0.3)', ...p }} />
        ))}
        <div style={{ position: 'absolute', top: 0, left: 20, right: 20, height: 1, background: 'linear-gradient(90deg, transparent, rgba(200,146,12,0.7), transparent)' }} />

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 }}>
          <span style={{ fontFamily: 'Bebas Neue, Impact, sans-serif', fontSize: 30, color: '#e8c040', letterSpacing: '0.06em' }}>
            {title}
          </span>
          <button
            onClick={onClose}
            style={{
              background: 'transparent', border: '1px solid rgba(200,146,12,0.3)',
              color: 'rgba(200,146,12,0.55)', width: 30, height: 30,
              cursor: 'pointer', fontSize: 14, fontFamily: 'Rajdhani, sans-serif',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(200,146,12,0.8)'; (e.currentTarget as HTMLElement).style.color = '#c8920c' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(200,146,12,0.3)'; (e.currentTarget as HTMLElement).style.color = 'rgba(200,146,12,0.55)' }}
          >✕</button>
        </div>

        {children}

        <div style={{ position: 'absolute', bottom: 0, left: 20, right: 20, height: 1, background: 'linear-gradient(90deg, transparent, rgba(200,146,12,0.7), transparent)' }} />
      </div>

      <style>{`
        @keyframes modal-bg-in   { from { opacity: 0; } to { opacity: 1; } }
        @keyframes modal-card-in { from { opacity: 0; transform: scale(0.95) translateY(8px); } to { opacity: 1; transform: scale(1) translateY(0); } }
        @keyframes spin-coin     { 0% { transform: rotateY(0deg); } 100% { transform: rotateY(720deg); } }
        @keyframes reel-spin     { 0%, 100% { transform: translateY(0); opacity: 1; } 50% { transform: translateY(-8px); opacity: 0.3; } }
      `}</style>
    </div>
  )
}

// ── Coinflip ──────────────────────────────────────────────────
function CoinflipModal({ onClose, onBalanceUpdate }: { onClose: () => void; onBalanceUpdate: (n: number) => void }) {
  const [amount, setAmount]   = useState('100')
  const [choice, setChoice]   = useState<'heads' | 'tails'>('heads')
  const [loading, setLoading] = useState(false)
  const [result, setResult]   = useState<GambleResult | null>(null)
  const [error, setError]     = useState<string | null>(null)

  const details = result?.details as { choice: string; flip: string; won: boolean } | undefined

  async function flip() {
    setError(null); setLoading(true); setResult(null)
    try {
      const res = await ApiService.post<GambleResult>('/coinflip', { amount: parseInt(amount) || 1, choice })
      setResult(res)
      onBalanceUpdate(res.newBalance)
    } catch (e) { setError(e instanceof Error ? e.message : 'Failed') }
    finally { setLoading(false) }
  }

  const choiceBtn = (c: 'heads' | 'tails'): React.CSSProperties => ({
    flex: 1, padding: '10px', cursor: 'pointer',
    fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: 13,
    letterSpacing: '0.25em', textTransform: 'uppercase',
    background: choice === c ? 'rgba(200,146,12,0.14)' : 'transparent',
    border: `1px solid rgba(200,146,12,${choice === c ? '0.75' : '0.28'})`,
    color: choice === c ? '#e8c040' : 'rgba(200,146,12,0.45)',
    transition: 'all 0.15s',
  })

  return (
    <GameModal title="Coinflip" onClose={onClose}>
      {/* Coin visual */}
      <div style={{ textAlign: 'center', marginBottom: 20 }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          width: 80, height: 80, borderRadius: '50%',
          background: result
            ? (details?.won ? 'radial-gradient(circle at 35% 30%, #ffe066, #c8920c, #8b6012)'
                            : 'radial-gradient(circle at 35% 30%, #888, #444, #222)')
            : 'radial-gradient(circle at 35% 30%, #ffe066, #c8920c, #8b6012)',
          boxShadow: loading ? '0 0 30px rgba(200,146,12,0.8)' : '0 0 16px rgba(200,146,12,0.35)',
          border: '2px solid rgba(200,146,12,0.5)',
          fontSize: 28,
          animation: loading ? 'spin-coin 0.6s linear infinite' : undefined,
          transition: 'all 0.3s',
        }}>
          {result ? (details?.flip === 'heads' ? 'H' : 'T') : '₽'}
        </div>
        {result && (
          <div style={{ marginTop: 10, fontFamily: 'Bebas Neue, Impact, sans-serif', fontSize: 18, color: 'rgba(200,146,12,0.7)', letterSpacing: '0.1em' }}>
            {details?.flip?.toUpperCase()}
          </div>
        )}
      </div>

      {!result ? (
        <>
          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>Bet Amount (Pubes)</label>
            <input
              type="number" min="1" value={amount}
              onChange={e => setAmount(e.target.value)}
              style={inputStyle}
              onFocus={e => (e.target as HTMLInputElement).style.borderColor = 'rgba(200,146,12,0.85)'}
              onBlur={e  => (e.target as HTMLInputElement).style.borderColor = 'rgba(200,146,12,0.35)'}
            />
          </div>
          <div style={{ display: 'flex', gap: 10, marginBottom: 18 }}>
            <button style={choiceBtn('heads')} onClick={() => setChoice('heads')}>Heads</button>
            <button style={choiceBtn('tails')} onClick={() => setChoice('tails')}>Tails</button>
          </div>
          {error && <div style={{ marginBottom: 14, padding: '8px 12px', border: '1px solid rgba(255,60,0,0.4)', color: '#ff5520', fontSize: 12, fontFamily: 'Rajdhani, sans-serif', letterSpacing: '0.1em' }}>⚠ {error}</div>}
          <button
            onClick={flip} disabled={loading}
            style={{
              width: '100%', padding: '13px', cursor: loading ? 'not-allowed' : 'pointer',
              fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: 13, letterSpacing: '0.4em', textTransform: 'uppercase',
              background: 'transparent', border: `1px solid rgba(200,146,12,${loading ? '0.25' : '0.65'})`,
              color: loading ? 'rgba(200,146,12,0.3)' : '#c8920c', transition: 'all 0.2s',
            }}
          >{loading ? 'Flipping...' : 'Flip'}</button>
        </>
      ) : (
        <>
          <OutcomeBar outcome={result.outcome} delta={result.delta} />
          <div style={{ margin: '12px 0', fontSize: 11, color: 'rgba(200,146,12,0.4)', fontFamily: 'Rajdhani, sans-serif', letterSpacing: '0.15em' }}>
            New balance: ₽{fmt(result.newBalance)}
          </div>
          <button onClick={() => setResult(null)}
            style={{ width: '100%', padding: '13px', cursor: 'pointer', fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: 12, letterSpacing: '0.35em', textTransform: 'uppercase', background: 'transparent', border: '1px solid rgba(200,146,12,0.5)', color: '#c8920c' }}
          >Play Again</button>
        </>
      )}
    </GameModal>
  )
}

// ── Slots ─────────────────────────────────────────────────────
function SlotsModal({ onClose, onBalanceUpdate }: { onClose: () => void; onBalanceUpdate: (n: number) => void }) {
  const [amount, setAmount]   = useState('100')
  const [loading, setLoading] = useState(false)
  const [result, setResult]   = useState<GambleResult | null>(null)
  const [error, setError]     = useState<string | null>(null)

  const details = result?.details as { reels: string[]; multiplier: number } | undefined
  const reels   = details?.reels ?? ['?', '?', '?']

  async function spin() {
    setError(null); setLoading(true)
    try {
      const res = await ApiService.post<GambleResult>('/slots', { amount: parseInt(amount) || 1 })
      setResult(res)
      onBalanceUpdate(res.newBalance)
    } catch (e) { setError(e instanceof Error ? e.message : 'Failed') }
    finally { setLoading(false) }
  }

  return (
    <GameModal title="Slots" onClose={onClose}>
      {/* Reels */}
      <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginBottom: 22 }}>
        {reels.map((symbol, i) => (
          <div key={i} style={{
            width: 72, height: 80,
            background: 'rgba(0,0,0,0.4)',
            border: `1px solid rgba(200,146,12,${loading ? '0.7' : '0.35'})`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 36, borderRadius: 2,
            boxShadow: loading ? '0 0 16px rgba(200,146,12,0.4), inset 0 0 12px rgba(200,146,12,0.08)' : 'inset 0 0 8px rgba(0,0,0,0.5)',
            animation: loading ? `reel-spin ${0.4 + i * 0.15}s ease-in-out infinite` : undefined,
            transition: 'border-color 0.2s, box-shadow 0.2s',
          }}>
            {loading ? '⚙' : symbol}
          </div>
        ))}
      </div>

      {result && details && (
        <div style={{ textAlign: 'center', marginBottom: 12, fontFamily: 'Rajdhani, sans-serif', fontSize: 11, color: 'rgba(200,146,12,0.5)', letterSpacing: '0.2em' }}>
          {details.multiplier > 0 ? `${details.multiplier}x MULTIPLIER` : 'No match'}
        </div>
      )}

      {!result ? (
        <>
          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>Bet Amount (Pubes)</label>
            <input type="number" min="1" value={amount} onChange={e => setAmount(e.target.value)} style={inputStyle}
              onFocus={e => (e.target as HTMLInputElement).style.borderColor = 'rgba(200,146,12,0.85)'}
              onBlur={e  => (e.target as HTMLInputElement).style.borderColor = 'rgba(200,146,12,0.35)'}
            />
          </div>
          {error && <div style={{ marginBottom: 14, padding: '8px 12px', border: '1px solid rgba(255,60,0,0.4)', color: '#ff5520', fontSize: 12, fontFamily: 'Rajdhani, sans-serif', letterSpacing: '0.1em' }}>⚠ {error}</div>}
          <button onClick={spin} disabled={loading}
            style={{ width: '100%', padding: '13px', cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: 13, letterSpacing: '0.4em', textTransform: 'uppercase', background: 'transparent', border: `1px solid rgba(200,146,12,${loading ? '0.25' : '0.65'})`, color: loading ? 'rgba(200,146,12,0.3)' : '#c8920c', transition: 'all 0.2s' }}
          >{loading ? 'Spinning...' : 'Spin'}</button>
        </>
      ) : (
        <>
          <OutcomeBar outcome={result.outcome} delta={result.delta} />
          <div style={{ margin: '12px 0', fontSize: 11, color: 'rgba(200,146,12,0.4)', fontFamily: 'Rajdhani, sans-serif', letterSpacing: '0.15em' }}>
            New balance: ₽{fmt(result.newBalance)}
          </div>
          <button onClick={() => setResult(null)}
            style={{ width: '100%', padding: '13px', cursor: 'pointer', fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: 12, letterSpacing: '0.35em', textTransform: 'uppercase', background: 'transparent', border: '1px solid rgba(200,146,12,0.5)', color: '#c8920c' }}
          >Spin Again</button>
        </>
      )}
    </GameModal>
  )
}

// ── Blackjack ─────────────────────────────────────────────────
function PlayingCard({ rank, suit }: Card) {
  const isRed = suit === '♥' || suit === '♦'
  return (
    <div style={{
      width: 48, height: 68,
      background: 'linear-gradient(145deg, #f8f4e8, #ede8d0)',
      border: '1px solid rgba(0,0,0,0.15)',
      borderRadius: 3,
      display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
      padding: '4px 5px',
      color: isRed ? '#cc2200' : '#111',
      fontFamily: 'Rajdhani, sans-serif', fontWeight: 700,
      userSelect: 'none',
      boxShadow: '2px 3px 8px rgba(0,0,0,0.5)',
    }}>
      <span style={{ fontSize: 12, lineHeight: 1 }}>{rank}</span>
      <span style={{ fontSize: 16, lineHeight: 1, alignSelf: 'center' }}>{suit}</span>
      <span style={{ fontSize: 12, lineHeight: 1, alignSelf: 'flex-end', transform: 'rotate(180deg)' }}>{rank}</span>
    </div>
  )
}

function CardBack() {
  return (
    <div style={{
      width: 48, height: 68,
      background: 'linear-gradient(145deg, #1a0e08, #2a1a0c)',
      border: '1px solid rgba(200,146,12,0.4)',
      borderRadius: 3,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      boxShadow: '2px 3px 8px rgba(0,0,0,0.5)',
      color: 'rgba(200,146,12,0.3)', fontSize: 18,
    }}>⚙</div>
  )
}

function HandDisplay({ label, cards, value, showBack }: { label: string; cards: Card[]; value: number | null; showBack?: boolean }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <span style={{ fontSize: 10, letterSpacing: '0.3em', color: 'rgba(200,146,12,0.45)', fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, textTransform: 'uppercase' }}>{label}</span>
        {value !== null && (
          <span style={{ fontFamily: 'Bebas Neue, Impact, sans-serif', fontSize: 18, color: value > 21 ? '#f87171' : '#e8c040' }}>{value}</span>
        )}
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {cards.map((c, i) => <PlayingCard key={i} {...c} />)}
        {showBack && <CardBack />}
      </div>
    </div>
  )
}

function BlackjackModal({ onClose, onBalanceUpdate }: { onClose: () => void; onBalanceUpdate: (n: number) => void }) {
  const [amount, setAmount]   = useState('100')
  const [state, setState]     = useState<BJState | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState<string | null>(null)

  const isDone = state && !['active'].includes(state.status)

  async function deal() {
    setError(null); setLoading(true)
    try {
      const res = await ApiService.post<BJState>('/blackjack/start', { amount: parseInt(amount) || 1 })
      setState(res)
      if (res.newBalance != null) onBalanceUpdate(res.newBalance)
    } catch (e) { setError(e instanceof Error ? e.message : 'Failed') }
    finally { setLoading(false) }
  }

  async function action(a: 'hit' | 'stand' | 'double') {
    if (!state?.gameId) return
    setLoading(true)
    try {
      const res = await ApiService.post<BJState>(`/blackjack/${state.gameId}/action`, { action: a })
      setState(res)
      if (res.newBalance != null) onBalanceUpdate(res.newBalance)
    } catch (e) { setError(e instanceof Error ? e.message : 'Failed') }
    finally { setLoading(false) }
  }

  const actionBtn = (): React.CSSProperties => ({
    flex: 1, padding: '11px', cursor: loading ? 'not-allowed' : 'pointer',
    fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: 12, letterSpacing: '0.3em', textTransform: 'uppercase',
    background: 'transparent', border: '1px solid rgba(200,146,12,0.5)', color: '#c8920c', transition: 'all 0.15s',
  })

  return (
    <GameModal title="Blackjack" onClose={onClose} maxWidth={560}>
      {!state ? (
        <>
          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Bet Amount (Pubes)</label>
            <input type="number" min="1" value={amount} onChange={e => setAmount(e.target.value)} style={inputStyle}
              onFocus={e => (e.target as HTMLInputElement).style.borderColor = 'rgba(200,146,12,0.85)'}
              onBlur={e  => (e.target as HTMLInputElement).style.borderColor = 'rgba(200,146,12,0.35)'}
            />
          </div>
          {error && <div style={{ marginBottom: 14, padding: '8px 12px', border: '1px solid rgba(255,60,0,0.4)', color: '#ff5520', fontSize: 12, fontFamily: 'Rajdhani, sans-serif', letterSpacing: '0.1em' }}>⚠ {error}</div>}
          <button onClick={deal} disabled={loading}
            style={{ width: '100%', padding: '13px', cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: 13, letterSpacing: '0.4em', textTransform: 'uppercase', background: 'transparent', border: `1px solid rgba(200,146,12,${loading ? '0.25' : '0.65'})`, color: loading ? 'rgba(200,146,12,0.3)' : '#c8920c' }}
          >{loading ? 'Dealing...' : 'Deal'}</button>
        </>
      ) : (
        <>
          <div style={{ padding: '14px', background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(200,146,12,0.15)', marginBottom: 16 }}>
            <HandDisplay label="Dealer" cards={state.dealerVisible} value={state.dealerValue} showBack={!isDone && state.dealerVisible.length === 1} />
            <HandDisplay label={`Your Hand`} cards={state.playerHand} value={state.playerValue} />
          </div>

          <div style={{ marginBottom: 12, fontSize: 11, color: 'rgba(200,146,12,0.45)', fontFamily: 'Rajdhani, sans-serif', letterSpacing: '0.15em', textAlign: 'center' }}>
            Bet: ₽{fmt(state.bet)}
          </div>

          {state.message && (
            <div style={{ marginBottom: 12, padding: '8px 14px', background: 'rgba(200,146,12,0.06)', border: '1px solid rgba(200,146,12,0.2)', fontFamily: 'Rajdhani, sans-serif', fontSize: 13, color: 'rgba(220,180,80,0.85)', letterSpacing: '0.08em', textAlign: 'center' }}>
              {state.message}
            </div>
          )}

          {isDone ? (
            <>
              {state.delta != null && <OutcomeBar outcome={state.status as 'win' | 'loss' | 'push'} delta={state.delta} />}
              {state.newBalance != null && (
                <div style={{ margin: '10px 0', fontSize: 11, color: 'rgba(200,146,12,0.4)', fontFamily: 'Rajdhani, sans-serif', letterSpacing: '0.15em' }}>
                  New balance: ₽{fmt(state.newBalance)}
                </div>
              )}
              <button onClick={() => { setState(null); setError(null) }}
                style={{ width: '100%', padding: '12px', cursor: 'pointer', fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: 12, letterSpacing: '0.35em', textTransform: 'uppercase', background: 'transparent', border: '1px solid rgba(200,146,12,0.5)', color: '#c8920c' }}
              >Play Again</button>
            </>
          ) : (
            <>
              {error && <div style={{ marginBottom: 12, padding: '8px 12px', border: '1px solid rgba(255,60,0,0.4)', color: '#ff5520', fontSize: 12, fontFamily: 'Rajdhani, sans-serif' }}>⚠ {error}</div>}
              <div style={{ display: 'flex', gap: 10 }}>
                <button style={actionBtn()} disabled={loading} onClick={() => action('hit')}>Hit</button>
                <button style={actionBtn()} disabled={loading} onClick={() => action('stand')}>Stand</button>
                <button style={actionBtn()} disabled={loading} onClick={() => action('double')}>Double</button>
              </div>
            </>
          )}
        </>
      )}
    </GameModal>
  )
}

// ── Games page ────────────────────────────────────────────────
interface Props { onBack: () => void }

type ActiveGame = 'coinflip' | 'slots' | 'blackjack' | null

const GAMES = [
  {
    id: 'coinflip' as const,
    icon: '🪙',
    title: 'Coinflip',
    desc: 'Double or nothing. Pick heads or tails and bet your pubes.',
  },
  {
    id: 'slots' as const,
    icon: '🎰',
    title: 'Slots',
    desc: 'Pull the lever. Match the reels and multiply your stake.',
  },
  {
    id: 'blackjack' as const,
    icon: '🃏',
    title: 'Blackjack',
    desc: 'Beat the dealer to 21 without going bust.',
  },
]

export function GamesPage({ onBack }: Props) {
  const [balance, setBalance]     = useState<number | null>(null)
  const [activeGame, setActiveGame] = useState<ActiveGame>(null)

  useEffect(() => {
    ApiService.get<{ balance: number }>('/balance').then(d => setBalance(d.balance))
  }, [])

  function handleBalanceUpdate(n: number) {
    setBalance(n)
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'radial-gradient(ellipse at 48% 30%, #1a0e07 0%, #0d0603 50%, #080402 100%)',
      fontFamily: 'Rajdhani, sans-serif',
    }}>
      {/* Scanlines */}
      <div style={{ position: 'fixed', inset: 0, backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.06) 3px, rgba(0,0,0,0.06) 4px)', pointerEvents: 'none', zIndex: 0 }} />

      {/* Header */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 100, height: 58,
        display: 'flex', alignItems: 'center', padding: '0 24px',
        background: 'rgba(8,4,2,0.92)', borderBottom: '1px solid rgba(200,146,12,0.28)',
        backdropFilter: 'blur(12px)', gap: 16,
      }}>
        <button
          onClick={onBack}
          style={{
            background: 'transparent', border: '1px solid rgba(200,146,12,0.3)',
            color: 'rgba(200,146,12,0.55)', padding: '5px 14px', cursor: 'pointer',
            fontFamily: 'Rajdhani, sans-serif', fontSize: 11, fontWeight: 700,
            letterSpacing: '0.25em', textTransform: 'uppercase', transition: 'all 0.2s',
          }}
          onMouseEnter={e => { (e.target as HTMLElement).style.borderColor = 'rgba(200,146,12,0.7)'; (e.target as HTMLElement).style.color = '#c8920c' }}
          onMouseLeave={e => { (e.target as HTMLElement).style.borderColor = 'rgba(200,146,12,0.3)'; (e.target as HTMLElement).style.color = 'rgba(200,146,12,0.55)' }}
        >← Back</button>

        <img src={gorilla} alt="" style={{ width: 26, height: 26, objectFit: 'contain', filter: 'sepia(0.4) saturate(1.2) drop-shadow(0 0 6px rgba(255,140,0,0.4))' }} />
        <span style={{ fontFamily: 'Bebas Neue, Impact, sans-serif', fontSize: 18, color: '#e8c040', letterSpacing: '0.08em' }}>Arcade</span>

        <div style={{ flex: 1 }} />

        {balance !== null && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 14px', border: '1px solid rgba(200,146,12,0.35)', background: 'rgba(200,146,12,0.06)' }}>
            <span style={{ fontSize: 11, color: 'rgba(200,146,12,0.5)', letterSpacing: '0.2em', textTransform: 'uppercase', fontWeight: 700 }}>Balance</span>
            <span style={{ fontFamily: 'Bebas Neue, Impact, sans-serif', fontSize: 18, color: '#e8c040', letterSpacing: '0.04em' }}>₽{Math.floor(balance).toLocaleString()}</span>
          </div>
        )}
      </header>

      {/* Game cards */}
      <main style={{ position: 'relative', zIndex: 1, maxWidth: 900, margin: '0 auto', padding: '48px 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <div style={{ fontFamily: 'Bebas Neue, Impact, sans-serif', fontSize: 42, color: '#e8c040', letterSpacing: '0.06em', lineHeight: 1 }}>
            Choose Your Game
          </div>
          <div style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: 12, color: 'rgba(200,146,12,0.4)', letterSpacing: '0.3em', marginTop: 8, textTransform: 'uppercase' }}>
            Wager your pubes wisely
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
          {GAMES.map(game => (
            <div
              key={game.id}
              style={{
                background: 'linear-gradient(155deg, #1e1008 0%, #110905 65%, #0d0703 100%)',
                border: '1px solid rgba(200,146,12,0.32)',
                boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
                padding: '32px 24px 28px',
                textAlign: 'center',
                position: 'relative',
                transition: 'border-color 0.2s, box-shadow 0.2s',
                cursor: 'pointer',
              }}
              onClick={() => setActiveGame(game.id)}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.borderColor = 'rgba(200,146,12,0.6)'
                ;(e.currentTarget as HTMLElement).style.boxShadow = '0 4px 30px rgba(0,0,0,0.5), 0 0 20px rgba(200,146,12,0.1)'
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.borderColor = 'rgba(200,146,12,0.32)'
                ;(e.currentTarget as HTMLElement).style.boxShadow = '0 4px 24px rgba(0,0,0,0.4)'
              }}
            >
              {/* Corner brackets */}
              {([
                { top: 8, left: 8, borderTop: '1px solid', borderLeft: '1px solid' },
                { top: 8, right: 8, borderTop: '1px solid', borderRight: '1px solid' },
                { bottom: 8, left: 8, borderBottom: '1px solid', borderLeft: '1px solid' },
                { bottom: 8, right: 8, borderBottom: '1px solid', borderRight: '1px solid' },
              ] as React.CSSProperties[]).map((p, i) => (
                <div key={i} style={{ position: 'absolute', width: 10, height: 10, borderColor: 'rgba(200,146,12,0.25)', ...p }} />
              ))}

              <div style={{ fontSize: 52, marginBottom: 16, lineHeight: 1 }}>{game.icon}</div>
              <div style={{ fontFamily: 'Bebas Neue, Impact, sans-serif', fontSize: 28, color: '#e8c040', letterSpacing: '0.06em', marginBottom: 10 }}>
                {game.title}
              </div>
              <div style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: 13, color: 'rgba(200,146,12,0.5)', letterSpacing: '0.05em', fontWeight: 600, marginBottom: 24, lineHeight: 1.4 }}>
                {game.desc}
              </div>
              <div style={{
                display: 'inline-block', padding: '9px 32px',
                border: '1px solid rgba(200,146,12,0.5)', color: '#c8920c',
                fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: 12,
                letterSpacing: '0.4em', textTransform: 'uppercase',
              }}>
                Play
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Game modals */}
      {activeGame === 'coinflip'  && <CoinflipModal  onClose={() => setActiveGame(null)} onBalanceUpdate={handleBalanceUpdate} />}
      {activeGame === 'slots'     && <SlotsModal     onClose={() => setActiveGame(null)} onBalanceUpdate={handleBalanceUpdate} />}
      {activeGame === 'blackjack' && <BlackjackModal onClose={() => setActiveGame(null)} onBalanceUpdate={handleBalanceUpdate} />}
    </div>
  )
}
