import { useState, useEffect } from 'react'
import { ApiService } from '../services/ApiService'
import { AuthService } from '../services/AuthService'
import gorilla from '../assets/gorilla.png'

// ── Types ────────────────────────────────────────────────────
interface Member {
  memberId: string
  username: string
  balance: number
}

interface LeaderboardEntry {
  memberId: string
  username: string
  displayName: string | null
  balance: number
  cryptoValue: number
  stockValue: number
  netWorth: number
}

interface Coin {
  symbol: string
  name: string
  currentPrice: number
  previousPrice: number
  volatility: number
}

interface HistoryPoint {
  price: number
  recordedAt: string
}

interface CoinDetail extends Coin {
  initialPrice: number
  updatedAt: string
  history: HistoryPoint[]
}

interface Props {
  onLogout: () => void
  onGames: () => void
}

// ── Helpers ──────────────────────────────────────────────────
const fmt    = (n: number) => Math.floor(n).toLocaleString()
const fmtDec = (n: number, d = 2) => n.toLocaleString(undefined, { minimumFractionDigits: d, maximumFractionDigits: d })

function changePct(coin: Coin) {
  return ((coin.currentPrice - coin.previousPrice) / coin.previousPrice) * 100
}

function rankColor(rank: number) {
  if (rank === 1) return '#ffd700'
  if (rank === 2) return '#c0c0c0'
  if (rank === 3) return '#cd7f32'
  return 'rgba(200,146,12,0.45)'
}

// ── Sub-components ────────────────────────────────────────────

function SectionTitle({ label }: { label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
      <span style={{ color: 'rgba(200,146,12,0.5)', fontSize: 13, lineHeight: 1 }}>⚙</span>
      <span style={{
        fontFamily: 'Rajdhani, sans-serif',
        fontSize: 10,
        letterSpacing: '0.32em',
        color: 'rgba(200,146,12,0.5)',
        textTransform: 'uppercase' as const,
        fontWeight: 700,
      }}>{label}</span>
      <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg, rgba(200,146,12,0.35), transparent)' }} />
    </div>
  )
}

function StatCard({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: string }) {
  return (
    <div style={{
      flex: 1,
      background: 'linear-gradient(155deg, #1e1008 0%, #110905 65%, #0d0703 100%)',
      border: '1px solid rgba(200,146,12,0.32)',
      boxShadow: '0 4px 24px rgba(0,0,0,0.4), 0 0 18px rgba(200,146,12,0.05)',
      padding: '24px 28px',
      position: 'relative' as const,
    }}>
      {/* Corner brackets */}
      {[
        { top: 8,    left: 8,   borderTop: '1px solid', borderLeft: '1px solid'  },
        { top: 8,    right: 8,  borderTop: '1px solid', borderRight: '1px solid' },
        { bottom: 8, left: 8,   borderBottom: '1px solid', borderLeft: '1px solid'  },
        { bottom: 8, right: 8,  borderBottom: '1px solid', borderRight: '1px solid' },
      ].map((p, i) => (
        <div key={i} style={{ position: 'absolute', width: 10, height: 10, borderColor: 'rgba(200,146,12,0.3)', ...p }} />
      ))}

      <div style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: 10, letterSpacing: '0.3em', color: 'rgba(200,146,12,0.45)', textTransform: 'uppercase' as const, fontWeight: 700, marginBottom: 10 }}>
        {label}
      </div>
      <div style={{ fontFamily: 'Bebas Neue, Impact, sans-serif', fontSize: 46, lineHeight: 1, color: accent ?? '#e8c040', letterSpacing: '0.02em' }}>
        {value}
      </div>
      {sub && (
        <div style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: 12, color: 'rgba(200,146,12,0.4)', marginTop: 6, fontWeight: 600 }}>
          {sub}
        </div>
      )}
    </div>
  )
}

function LeaderboardPanel({ entries, myMemberId }: { entries: LeaderboardEntry[]; myMemberId: string }) {
  const max = entries[0]?.netWorth ?? 1

  return (
    <div style={{
      background: 'linear-gradient(155deg, #1e1008 0%, #110905 65%, #0d0703 100%)',
      border: '1px solid rgba(200,146,12,0.32)',
      boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
      padding: '24px',
    }}>
      <SectionTitle label="Leaderboard" />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {entries.map((entry, i) => {
          const rank = i + 1
          const isMe = entry.memberId === myMemberId
          const barWidth = (entry.netWorth / max) * 100

          return (
            <div
              key={entry.memberId}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '9px 12px',
                background: isMe ? 'rgba(200,146,12,0.06)' : 'transparent',
                border: isMe ? '1px solid rgba(200,146,12,0.22)' : '1px solid transparent',
                transition: 'background 0.2s',
              }}
            >
              {/* Rank */}
              <div style={{
                fontFamily: 'Bebas Neue, Impact, sans-serif',
                fontSize: 18,
                lineHeight: 1,
                color: rankColor(rank),
                width: 24,
                textAlign: 'right' as const,
                flexShrink: 0,
              }}>
                {rank}
              </div>

              {/* Name + bar */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                  <span style={{
                    fontFamily: 'Rajdhani, sans-serif',
                    fontSize: 14,
                    fontWeight: 700,
                    color: isMe ? '#e8c040' : 'rgba(200,146,12,0.7)',
                    letterSpacing: '0.05em',
                    textTransform: 'uppercase' as const,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap' as const,
                  }}>
                    {entry.displayName ?? entry.username}
                  </span>
                  {isMe && (
                    <span style={{ fontSize: 9, letterSpacing: '0.2em', color: '#ff8c00', fontFamily: 'Rajdhani, sans-serif', fontWeight: 700 }}>
                      YOU
                    </span>
                  )}
                </div>
                {/* Bar */}
                <div style={{ height: 3, background: 'rgba(200,146,12,0.1)', position: 'relative' as const }}>
                  <div style={{
                    position: 'absolute',
                    inset: 0,
                    width: `${barWidth}%`,
                    background: isMe
                      ? 'linear-gradient(90deg, #ff8c00, #ffd700)'
                      : `linear-gradient(90deg, ${rankColor(rank)}, rgba(200,146,12,0.3))`,
                    transition: 'width 0.8s ease-out',
                  }} />
                </div>
              </div>

              {/* Net worth */}
              <div style={{ flexShrink: 0, textAlign: 'right' as const }}>
                <div style={{ fontFamily: 'Bebas Neue, Impact, sans-serif', fontSize: 16, color: isMe ? '#e8c040' : 'rgba(200,146,12,0.6)', letterSpacing: '0.03em' }}>
                  {fmt(entry.netWorth)}
                </div>
                {(entry.cryptoValue > 0 || entry.stockValue > 0) && (
                  <div style={{ fontSize: 9, color: 'rgba(200,146,12,0.35)', fontFamily: 'Rajdhani, sans-serif', fontWeight: 600 }}>
                    +{fmt(entry.cryptoValue + entry.stockValue)} assets
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Price chart ───────────────────────────────────────────────
function PriceChart({ history }: { history: HistoryPoint[] }) {
  // History arrives newest-first; reverse for left=old, right=new
  const pts   = [...history].reverse()
  const prices = pts.map(p => p.price)
  const min   = Math.min(...prices)
  const max   = Math.max(...prices)
  const range = max - min || 1

  const W = 640, H = 200
  const pad = { t: 14, r: 16, b: 28, l: 58 }
  const cW  = W - pad.l - pad.r
  const cH  = H - pad.t - pad.b

  const x = (i: number) => pad.l + (i / Math.max(pts.length - 1, 1)) * cW
  const y = (p: number) => pad.t + (1 - (p - min) / range) * cH

  const lineD = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${x(i)} ${y(p.price)}`).join(' ')
  const areaD = `${lineD} L ${x(pts.length - 1)} ${pad.t + cH} L ${x(0)} ${pad.t + cH} Z`

  const isUp   = pts[pts.length - 1]?.price >= pts[0]?.price
  const color  = isUp ? '#4ade80' : '#f87171'
  const gradId = `cg-${isUp ? 'up' : 'dn'}`

  // Y-axis grid lines (5 levels)
  const yTicks = [0, 0.25, 0.5, 0.75, 1].map(t => ({
    price: min + t * range,
    yPos:  pad.t + (1 - t) * cH,
  }))

  // X-axis time labels (5 evenly spaced)
  const xLabelCount = 5
  const xLabelIdxs = Array.from({ length: xLabelCount }, (_, i) =>
    Math.round(i * (pts.length - 1) / (xLabelCount - 1))
  )

  function fmtTime(iso: string) {
    const d = new Date(iso)
    return `${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}`
  }

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: 'block' }}>
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
      </defs>

      {/* Grid lines */}
      {yTicks.map((t, i) => (
        <g key={i}>
          <line x1={pad.l} y1={t.yPos} x2={pad.l + cW} y2={t.yPos} stroke="rgba(200,146,12,0.1)" strokeWidth="1" />
          <text x={pad.l - 6} y={t.yPos + 4} fontSize="9" fill="rgba(200,146,12,0.4)" textAnchor="end">
            {t.price < 1 ? t.price.toFixed(3) : t.price.toFixed(0)}
          </text>
        </g>
      ))}

      {/* Area fill */}
      <path d={areaD} fill={`url(#${gradId})`} />

      {/* Line */}
      <path d={lineD} stroke={color} strokeWidth="1.5" fill="none" strokeLinejoin="round" strokeLinecap="round" />

      {/* Latest point dot */}
      <circle cx={x(pts.length - 1)} cy={y(pts[pts.length - 1]?.price ?? 0)} r="3" fill={color} />
      <circle cx={x(pts.length - 1)} cy={y(pts[pts.length - 1]?.price ?? 0)} r="5" fill={color} fillOpacity="0.2" />

      {/* X axis labels */}
      {xLabelIdxs.map((idx) => pts[idx] && (
        <text key={idx} x={x(idx)} y={H - 4} fontSize="9" fill="rgba(200,146,12,0.38)" textAnchor="middle">
          {fmtTime(pts[idx].recordedAt)}
        </text>
      ))}

      {/* Axis border */}
      <line x1={pad.l} y1={pad.t} x2={pad.l} y2={pad.t + cH} stroke="rgba(200,146,12,0.2)" strokeWidth="1" />
      <line x1={pad.l} y1={pad.t + cH} x2={pad.l + cW} y2={pad.t + cH} stroke="rgba(200,146,12,0.2)" strokeWidth="1" />
    </svg>
  )
}

// ── Coin detail modal ─────────────────────────────────────────
function CoinModal({ symbol, onClose }: { symbol: string; onClose: () => void }) {
  const [detail, setDetail] = useState<CoinDetail | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    ApiService.get<CoinDetail>(`/crypto/${symbol}?limit=100`)
      .then(setDetail)
      .finally(() => setLoading(false))
  }, [symbol])

  const pct      = detail ? changePct(detail) : 0
  const up       = pct >= 0
  const pctColor = Math.abs(pct) < 0.05 ? 'rgba(200,146,12,0.5)' : up ? '#4ade80' : '#f87171'

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        background: 'rgba(4,2,1,0.85)',
        backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 24,
        animation: 'modal-bg-in 0.2s ease-out',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 700,
          background: 'linear-gradient(155deg, #1e1008 0%, #110905 65%, #0d0703 100%)',
          border: '1px solid rgba(200,146,12,0.45)',
          boxShadow: '0 0 60px rgba(200,146,12,0.12), 0 24px 60px rgba(0,0,0,0.7)',
          padding: '28px 28px 24px',
          position: 'relative',
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
          <div key={i} style={{ position: 'absolute', width: 12, height: 12, borderColor: 'rgba(200,146,12,0.35)', ...p }} />
        ))}

        {/* Top edge */}
        <div style={{ position: 'absolute', top: 0, left: 24, right: 24, height: 1, background: 'linear-gradient(90deg, transparent, rgba(200,146,12,0.7), transparent)' }} />

        {/* Header row */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
              <span style={{ fontFamily: 'Bebas Neue, Impact, sans-serif', fontSize: 48, color: '#e8c040', lineHeight: 1, letterSpacing: '0.04em' }}>
                {symbol}
              </span>
              <span style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: 14, color: 'rgba(200,146,12,0.5)', fontWeight: 700, letterSpacing: '0.1em' }}>
                {detail?.name ?? ''}
              </span>
            </div>
            {detail && (
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginTop: 4 }}>
                <span style={{ fontFamily: 'Bebas Neue, Impact, sans-serif', fontSize: 28, color: 'rgba(220,180,80,0.9)', letterSpacing: '0.02em' }}>
                  ₽{fmtDec(detail.currentPrice)}
                </span>
                <span style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: 14, fontWeight: 700, color: pctColor, letterSpacing: '0.05em' }}>
                  {up ? '▲' : '▼'} {Math.abs(pct).toFixed(3)}%
                </span>
              </div>
            )}
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'transparent', border: '1px solid rgba(200,146,12,0.3)',
              color: 'rgba(200,146,12,0.55)', width: 32, height: 32,
              cursor: 'pointer', fontSize: 16, lineHeight: 1,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
              transition: 'border-color 0.15s, color 0.15s',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.borderColor = 'rgba(200,146,12,0.7)'
              ;(e.currentTarget as HTMLElement).style.color = '#c8920c'
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.borderColor = 'rgba(200,146,12,0.3)'
              ;(e.currentTarget as HTMLElement).style.color = 'rgba(200,146,12,0.55)'
            }}
          >
            ✕
          </button>
        </div>

        {/* Stat pills */}
        {detail && (
          <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' as const }}>
            {[
              { label: 'Initial Price', value: `₽${fmtDec(detail.initialPrice)}` },
              { label: 'Volatility',    value: `${detail.volatility}x` },
              { label: 'Updated',       value: new Date(detail.updatedAt).toLocaleTimeString() },
            ].map(({ label, value }) => (
              <div key={label} style={{
                padding: '6px 14px',
                background: 'rgba(200,146,12,0.05)',
                border: '1px solid rgba(200,146,12,0.2)',
              }}>
                <div style={{ fontSize: 9, letterSpacing: '0.25em', color: 'rgba(200,146,12,0.4)', textTransform: 'uppercase' as const, fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, marginBottom: 2 }}>{label}</div>
                <div style={{ fontSize: 14, color: 'rgba(220,180,80,0.85)', fontFamily: 'Rajdhani, sans-serif', fontWeight: 700 }}>{value}</div>
              </div>
            ))}
          </div>
        )}

        {/* Chart */}
        <div style={{
          border: '1px solid rgba(200,146,12,0.15)',
          background: 'rgba(0,0,0,0.2)',
          padding: '12px 8px 4px',
        }}>
          {loading ? (
            <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(200,146,12,0.3)', fontFamily: 'Rajdhani, sans-serif', fontSize: 12, letterSpacing: '0.2em' }}>
              LOADING CHART...
            </div>
          ) : detail?.history.length ? (
            <PriceChart history={detail.history} />
          ) : (
            <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(200,146,12,0.3)', fontFamily: 'Rajdhani, sans-serif', fontSize: 12 }}>
              No history available
            </div>
          )}
        </div>

        {/* Bottom edge */}
        <div style={{ position: 'absolute', bottom: 0, left: 24, right: 24, height: 1, background: 'linear-gradient(90deg, transparent, rgba(200,146,12,0.7), transparent)' }} />
      </div>

      <style>{`
        @keyframes modal-bg-in   { from { opacity: 0; } to { opacity: 1; } }
        @keyframes modal-card-in { from { opacity: 0; transform: scale(0.95) translateY(8px); } to { opacity: 1; transform: scale(1) translateY(0); } }
      `}</style>
    </div>
  )
}

function CryptoPanel({ coins, onSelect }: { coins: Coin[]; onSelect: (symbol: string) => void }) {
  return (
    <div style={{
      background: 'linear-gradient(155deg, #1e1008 0%, #110905 65%, #0d0703 100%)',
      border: '1px solid rgba(200,146,12,0.32)',
      boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
      padding: '24px',
    }}>
      <SectionTitle label="Crypto Market" />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
        {coins.map((coin) => {
          const pct     = changePct(coin)
          const up      = pct >= 0
          const color   = Math.abs(pct) < 0.05 ? 'rgba(200,146,12,0.5)' : up ? '#4ade80' : '#f87171'
          const arrow   = Math.abs(pct) < 0.05 ? '—' : up ? '▲' : '▼'

          return (
            <div
              key={coin.symbol}
              onClick={() => onSelect(coin.symbol)}
              style={{
                padding: '14px',
                background: 'rgba(0,0,0,0.25)',
                border: '1px solid rgba(200,146,12,0.18)',
                position: 'relative' as const,
                transition: 'border-color 0.2s, background 0.2s',
                cursor: 'pointer',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.borderColor = 'rgba(200,146,12,0.55)'
                ;(e.currentTarget as HTMLElement).style.background = 'rgba(200,146,12,0.06)'
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.borderColor = 'rgba(200,146,12,0.18)'
                ;(e.currentTarget as HTMLElement).style.background = 'rgba(0,0,0,0.25)'
              }}
            >
              <div style={{ fontFamily: 'Bebas Neue, Impact, sans-serif', fontSize: 22, color: '#e8c040', lineHeight: 1, letterSpacing: '0.04em' }}>
                {coin.symbol}
              </div>
              <div style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: 10, color: 'rgba(200,146,12,0.4)', letterSpacing: '0.1em', marginBottom: 8, fontWeight: 600 }}>
                {coin.name}
              </div>
              <div style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: 16, fontWeight: 700, color: 'rgba(220,180,80,0.9)', marginBottom: 4 }}>
                ₽{fmtDec(coin.currentPrice)}
              </div>
              <div style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: 11, fontWeight: 700, color, letterSpacing: '0.05em' }}>
                {arrow} {Math.abs(pct) < 0.05 ? 'flat' : `${Math.abs(pct).toFixed(2)}%`}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────
export function DashboardPage({ onLogout, onGames }: Props) {
  const [member, setMember]           = useState<Member | null>(null)
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [coins, setCoins]             = useState<Coin[]>([])
  const [loading, setLoading]         = useState(true)
  const [error, setError]             = useState<string | null>(null)
  const [selectedCoin, setSelectedCoin] = useState<string | null>(null)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const [memberData, lbData, coinData] = await Promise.all([
        ApiService.get<Member>('/balance'),
        ApiService.get<LeaderboardEntry[]>('/leaderboard?limit=10'),
        ApiService.get<Coin[]>('/crypto'),
      ])
      setMember(memberData)
      setLeaderboard(lbData)
      setCoins(coinData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load')
    } finally {
      setLoading(false)
    }
  }

  function handleLogout() {
    AuthService.logout()
    onLogout()
  }

  const myEntry  = member ? leaderboard.find(e => e.memberId === member.memberId) : null
  const myRank   = member ? leaderboard.findIndex(e => e.memberId === member.memberId) + 1 : 0
  const netWorth = myEntry?.netWorth ?? member?.balance ?? 0
  const netGain  = netWorth - (member?.balance ?? 0)

  return (
    <div style={{
      minHeight: '100vh',
      background: 'radial-gradient(ellipse at 48% 30%, #1a0e07 0%, #0d0603 50%, #080402 100%)',
      backgroundAttachment: 'fixed',
      fontFamily: 'Rajdhani, sans-serif',
    }}>
      {/* Static scanlines */}
      <div style={{
        position: 'fixed',
        inset: 0,
        backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.06) 3px, rgba(0,0,0,0.06) 4px)',
        pointerEvents: 'none',
        zIndex: 0,
      }} />

      {/* ── Header ────────────────────────────────────────── */}
      <header style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        height: 58,
        display: 'flex',
        alignItems: 'center',
        padding: '0 24px',
        background: 'rgba(8,4,2,0.92)',
        borderBottom: '1px solid rgba(200,146,12,0.28)',
        backdropFilter: 'blur(12px)',
        gap: 16,
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <img src={gorilla} alt="" style={{ width: 28, height: 28, objectFit: 'contain', filter: 'sepia(0.4) saturate(1.2) drop-shadow(0 0 6px rgba(255,140,0,0.4))' }} />
          <span style={{ fontFamily: 'Bebas Neue, Impact, sans-serif', fontSize: 18, color: '#e8c040', letterSpacing: '0.08em' }}>
            Big Sex Ranked
          </span>
        </div>

        <div style={{ flex: 1 }} />

        {/* Arcade */}
        <button
          onClick={onGames}
          style={{
            background: 'transparent',
            border: '1px solid rgba(200,146,12,0.3)',
            color: 'rgba(200,146,12,0.55)',
            padding: '5px 14px',
            cursor: 'pointer',
            fontFamily: 'Rajdhani, sans-serif',
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.25em',
            textTransform: 'uppercase' as const,
            transition: 'border-color 0.2s, color 0.2s',
          }}
          onMouseEnter={e => {
            (e.target as HTMLElement).style.borderColor = 'rgba(200,146,12,0.7)'
            ;(e.target as HTMLElement).style.color = '#c8920c'
          }}
          onMouseLeave={e => {
            (e.target as HTMLElement).style.borderColor = 'rgba(200,146,12,0.3)'
            ;(e.target as HTMLElement).style.color = 'rgba(200,146,12,0.55)'
          }}
        >
          Arcade
        </button>

        {/* Balance pill */}
        {member && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '5px 14px',
            border: '1px solid rgba(200,146,12,0.35)',
            background: 'rgba(200,146,12,0.06)',
          }}>
            <span style={{ fontSize: 11, color: 'rgba(200,146,12,0.5)', letterSpacing: '0.2em', textTransform: 'uppercase' as const, fontWeight: 700 }}>Balance</span>
            <span style={{ fontFamily: 'Bebas Neue, Impact, sans-serif', fontSize: 18, color: '#e8c040', letterSpacing: '0.04em' }}>
              ₽{fmt(member.balance)}
            </span>
          </div>
        )}

        {/* Username */}
        {member && (
          <div style={{ fontSize: 12, color: 'rgba(200,146,12,0.5)', letterSpacing: '0.15em', textTransform: 'uppercase' as const, fontWeight: 700 }}>
            {member.username}
          </div>
        )}

        {/* Refresh */}
        <button
          onClick={load}
          disabled={loading}
          title="Refresh"
          style={{
            background: 'transparent',
            border: '1px solid rgba(200,146,12,0.3)',
            color: loading ? 'rgba(200,146,12,0.25)' : 'rgba(200,146,12,0.55)',
            padding: '5px 10px',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontSize: 13,
            lineHeight: 1,
          }}
        >
          ↻
        </button>

        {/* Logout */}
        <button
          onClick={handleLogout}
          style={{
            background: 'transparent',
            border: '1px solid rgba(200,146,12,0.3)',
            color: 'rgba(200,146,12,0.55)',
            padding: '5px 14px',
            cursor: 'pointer',
            fontFamily: 'Rajdhani, sans-serif',
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.25em',
            textTransform: 'uppercase' as const,
            transition: 'border-color 0.2s, color 0.2s',
          }}
          onMouseEnter={e => {
            (e.target as HTMLElement).style.borderColor = 'rgba(200,146,12,0.7)'
            ;(e.target as HTMLElement).style.color = '#c8920c'
          }}
          onMouseLeave={e => {
            (e.target as HTMLElement).style.borderColor = 'rgba(200,146,12,0.3)'
            ;(e.target as HTMLElement).style.color = 'rgba(200,146,12,0.55)'
          }}
        >
          Logout
        </button>
      </header>

      {/* ── Main content ──────────────────────────────────── */}
      <main style={{ position: 'relative', zIndex: 1, maxWidth: 1400, margin: '0 auto', padding: '28px 24px 48px' }}>

        {error && (
          <div style={{
            marginBottom: 20,
            padding: '12px 16px',
            border: '1px solid rgba(255,60,0,0.38)',
            background: 'rgba(255,40,0,0.07)',
            color: '#ff5520',
            fontSize: 12,
            letterSpacing: '0.1em',
            fontWeight: 700,
          }}>
            ⚠ &nbsp;{error}
          </div>
        )}

        {loading ? (
          // ── Loading skeleton ───────────────────────────
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ display: 'flex', gap: 16 }}>
              {[0, 1, 2].map(i => (
                <div key={i} style={{
                  flex: 1, height: 110,
                  background: 'rgba(200,146,12,0.04)',
                  border: '1px solid rgba(200,146,12,0.15)',
                  animation: 'pulse 1.5s ease-in-out infinite',
                  animationDelay: `${i * 0.15}s`,
                }} />
              ))}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: 16 }}>
              <div style={{ height: 420, background: 'rgba(200,146,12,0.04)', border: '1px solid rgba(200,146,12,0.15)' }} />
              <div style={{ height: 420, background: 'rgba(200,146,12,0.04)', border: '1px solid rgba(200,146,12,0.15)' }} />
            </div>
          </div>
        ) : (
          <>
            {/* ── Stats row ─────────────────────────────── */}
            <div style={{ display: 'flex', gap: 16, marginBottom: 20 }}>
              <StatCard
                label="Pube Balance"
                value={`₽${fmt(member?.balance ?? 0)}`}
                sub="liquid pubes"
              />
              <StatCard
                label="Net Worth"
                value={`₽${fmt(netWorth)}`}
                sub={netGain > 0 ? `+${fmt(netGain)} from assets` : 'no assets'}
                accent={netGain > 0 ? '#ffd700' : '#e8c040'}
              />
              <StatCard
                label="Rank"
                value={myRank > 0 ? `#${myRank}` : '—'}
                sub={`of ${leaderboard.length} players`}
                accent={rankColor(myRank)}
              />
            </div>

            {/* ── Content grid ──────────────────────────── */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.6fr', gap: 16, alignItems: 'start' }}>
              <LeaderboardPanel entries={leaderboard} myMemberId={member?.memberId ?? ''} />
              <CryptoPanel coins={coins} onSelect={setSelectedCoin} />
            </div>
          </>
        )}
      </main>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 0.7; }
        }
      `}</style>

      {selectedCoin && (
        <CoinModal symbol={selectedCoin} onClose={() => setSelectedCoin(null)} />
      )}
    </div>
  )
}
