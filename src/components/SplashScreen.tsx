import { useState, useEffect } from 'react'
import './SplashScreen.css'
import gorilla from '../assets/gorilla.png'

// ── Gear path generator ──────────────────────────────────────
function gearPath(cx: number, cy: number, outerR: number, innerR: number, teeth: number): string {
  const pts: string[] = []
  const step = (Math.PI * 2) / teeth
  const half = step * 0.35

  for (let i = 0; i < teeth; i++) {
    const a = i * step - Math.PI / 2
    const px = (r: number, ang: number) => cx + r * Math.cos(ang)
    const py = (r: number, ang: number) => cy + r * Math.sin(ang)

    pts.push(`${px(innerR, a - half * 1.2)} ${py(innerR, a - half * 1.2)}`)
    pts.push(`${px(outerR, a - half * 0.55)} ${py(outerR, a - half * 0.55)}`)
    pts.push(`${px(outerR, a + half * 0.55)} ${py(outerR, a + half * 0.55)}`)
    pts.push(`${px(innerR, a + half * 1.2)} ${py(innerR, a + half * 1.2)}`)
  }

  return `M ${pts.join(' L ')} Z`
}

// ── Gear config ──────────────────────────────────────────────
const GEARS = [
  { cx: -55,  cy: 180,  outerR: 240, innerR: 178, hubR: 48, teeth: 24, holes: 8, dur: 20, dir: 'cw',  opacity: 0.88 },
  { cx: 1985, cy: 130,  outerR: 290, innerR: 215, hubR: 58, teeth: 28, holes: 8, dur: 24, dir: 'ccw', opacity: 0.82 },
  { cx: 25,   cy: 970,  outerR: 210, innerR: 155, hubR: 40, teeth: 20, holes: 6, dur: 17, dir: 'ccw', opacity: 0.78 },
  { cx: 1960, cy: 950,  outerR: 260, innerR: 193, hubR: 50, teeth: 26, holes: 8, dur: 22, dir: 'cw',  opacity: 0.82 },
  { cx: 430,  cy: 560,  outerR: 92,  innerR: 68,  hubR: 18, teeth: 12, holes: 4, dur: 9,  dir: 'ccw', opacity: 0.62 },
  { cx: 1490, cy: 540,  outerR: 78,  innerR: 57,  hubR: 15, teeth: 10, holes: 4, dur: 7,  dir: 'cw',  opacity: 0.60 },
  { cx: 810,  cy: -25,  outerR: 140, innerR: 103, hubR: 28, teeth: 16, holes: 6, dur: 14, dir: 'cw',  opacity: 0.52 },
  { cx: 1110, cy: 1110, outerR: 165, innerR: 122, hubR: 32, teeth: 18, holes: 6, dur: 16, dir: 'ccw', opacity: 0.55 },
  { cx: 960,  cy: 80,   outerR: 55,  innerR: 40,  hubR: 11, teeth: 8,  holes: 0, dur: 5,  dir: 'cw',  opacity: 0.38 },
] as const

// ── Deterministic steam particles ────────────────────────────
const STEAM = Array.from({ length: 30 }, (_, i) => ({
  id: i,
  left:   8  + ((i * 31.7) % 84),
  bottom: 4  + ((i * 17.3) % 16),
  size:   7  + ((i * 4.7)  % 10),
  dur:    2.5 + ((i * 1.3) % 3.2),
  del:    (i * 0.63) % 5.5,
  drift:  (((i % 7) - 3) * 18),
}))

// ── Main component ───────────────────────────────────────────
interface Props {
  onEnter: () => void
}

export function SplashScreen({ onEnter }: Props) {
  const [exiting, setExiting] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => {
      setExiting(true)
      setTimeout(onEnter, 800)
    }, 3000)
    return () => clearTimeout(t)
  }, [onEnter])

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        overflow: 'hidden',
        background: 'radial-gradient(ellipse at 48% 55%, #22110a 0%, #110804 45%, #080503 100%)',
      }}
    >
      {/* ── Gear + pipe SVG layer ───────────────────────────── */}
      <svg
        viewBox="0 0 1920 1080"
        preserveAspectRatio="xMidYMid slice"
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
      >
        <defs>
          <filter id="gear-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <radialGradient id="gg" cx="30%" cy="28%" r="72%">
            <stop offset="0%"   stopColor="#eecc44" />
            <stop offset="55%"  stopColor="#c8920c" />
            <stop offset="100%" stopColor="#7a5508" />
          </radialGradient>
          <radialGradient id="gg2" cx="30%" cy="28%" r="72%">
            <stop offset="0%"   stopColor="#b8a030" />
            <stop offset="100%" stopColor="#5a3e08" />
          </radialGradient>
        </defs>

        {/* Ambient glows behind gears */}
        <ellipse cx={-55}  cy={180}  rx={260} ry={260} fill="rgba(200,130,10,0.09)" className="splash-ambient" />
        <ellipse cx={1985} cy={130}  rx={310} ry={310} fill="rgba(200,130,10,0.08)" className="splash-ambient" style={{ animationDelay: '1.5s' }} />
        <ellipse cx={25}   cy={970}  rx={230} ry={230} fill="rgba(200,130,10,0.07)" className="splash-ambient" style={{ animationDelay: '0.8s' }} />
        <ellipse cx={1960} cy={950}  rx={280} ry={280} fill="rgba(200,130,10,0.08)" className="splash-ambient" style={{ animationDelay: '2.1s' }} />

        {/* Pipes */}
        <g strokeLinecap="round" fill="none">
          <path d="M 185 178 Q 380 240 430 468"  stroke="#6a4a0a" strokeWidth="14" opacity="0.55" />
          <path d="M 185 178 Q 380 240 430 468"  stroke="#c8920c" strokeWidth="3"  opacity="0.25" />
          <path d="M 1735 128 Q 1560 220 1490 468" stroke="#6a4a0a" strokeWidth="14" opacity="0.55" />
          <path d="M 1735 128 Q 1560 220 1490 468" stroke="#c8920c" strokeWidth="3"  opacity="0.25" />
          <path d="M 215 968 Q 380 820 430 632"  stroke="#6a4a0a" strokeWidth="12" opacity="0.5"  />
          <path d="M 215 968 Q 380 820 430 632"  stroke="#c8920c" strokeWidth="2.5" opacity="0.2" />
          <path d="M 1700 945 Q 1580 800 1490 612" stroke="#6a4a0a" strokeWidth="12" opacity="0.5"  />
          <path d="M 1700 945 Q 1580 800 1490 612" stroke="#c8920c" strokeWidth="2.5" opacity="0.2" />
        </g>

        {/* Pipe flow highlights */}
        <g strokeLinecap="round" fill="none" opacity="0.35">
          <path d="M 185 178 Q 380 240 430 468"    stroke="#ffcc44" strokeWidth="2" strokeDasharray="18 28" className="splash-pipe-flow" />
          <path d="M 1735 128 Q 1560 220 1490 468"  stroke="#ffcc44" strokeWidth="2" strokeDasharray="18 28" className="splash-pipe-flow" style={{ animationDelay: '-1.5s' }} />
          <path d="M 215 968 Q 380 820 430 632"    stroke="#ffcc44" strokeWidth="2" strokeDasharray="14 22" className="splash-pipe-flow" style={{ animationDelay: '-0.8s' }} />
          <path d="M 1700 945 Q 1580 800 1490 612"  stroke="#ffcc44" strokeWidth="2" strokeDasharray="14 22" className="splash-pipe-flow" style={{ animationDelay: '-2.2s' }} />
        </g>

        {/* Pipe joints */}
        <g fill="#9a7214" stroke="#c8920c" strokeWidth="2.5" opacity="0.7">
          <circle cx="430" cy="560" r="16" />
          <circle cx="430" cy="560" r="8"  fill="#0d0804" />
          <circle cx="1490" cy="540" r="14" />
          <circle cx="1490" cy="540" r="7"  fill="#0d0804" />
        </g>

        {/* Gears */}
        {GEARS.map((g, i) => {
          const holes = Array.from({ length: g.holes }, (_, j) => {
            const ang = j * (Math.PI * 2 / g.holes)
            const hR  = (g.innerR * 0.88 - g.hubR) * 0.38
            const hD  = (g.innerR * 0.88 + g.hubR) / 2
            return { cx: g.cx + hD * Math.cos(ang), cy: g.cy + hD * Math.sin(ang), r: hR }
          })

          return (
            <g
              key={i}
              className={g.dir === 'cw' ? 'splash-gear-cw' : 'splash-gear-ccw'}
              style={{ animationDuration: `${g.dur}s` }}
              filter="url(#gear-glow)"
              opacity={g.opacity}
            >
              {/* Drop shadow */}
              <path
                d={gearPath(g.cx + 8, g.cy + 10, g.outerR, g.innerR, g.teeth)}
                fill="rgba(0,0,0,0.45)"
              />
              {/* Body */}
              <path
                d={gearPath(g.cx, g.cy, g.outerR, g.innerR, g.teeth)}
                fill={i < 4 ? 'url(#gg)' : 'url(#gg2)'}
              />
              {/* Inner cutout */}
              <circle cx={g.cx} cy={g.cy} r={g.innerR * 0.88} fill="#0d0804" />
              {/* Spoke holes */}
              {holes.map((h, j) => (
                <circle key={j} cx={h.cx} cy={h.cy} r={h.r} fill="#0d0804" />
              ))}
              {/* Hub */}
              <circle cx={g.cx} cy={g.cy} r={g.hubR}       fill={i < 4 ? 'url(#gg)' : 'url(#gg2)'} />
              <circle cx={g.cx} cy={g.cy} r={g.hubR * 0.5} fill="#0d0804" />
              {/* Rim highlight */}
              <path
                d={gearPath(g.cx, g.cy, g.outerR, g.innerR, g.teeth)}
                fill="none"
                stroke="rgba(255,230,130,0.16)"
                strokeWidth="1.5"
              />
            </g>
          )
        })}
      </svg>

      {/* ── Steam particles ─────────────────────────────────── */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        {STEAM.map((p) => (
          <div
            key={p.id}
            className="splash-steam"
            style={{
              position: 'absolute',
              left: `${p.left}%`,
              bottom: `${p.bottom}%`,
              width: p.size,
              height: p.size,
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(230,200,155,0.75) 0%, transparent 70%)',
              filter: `blur(${p.size * 0.55}px)`,
              '--dur':   `${p.dur}s`,
              '--del':   `${p.del}s`,
              '--drift': `${p.drift}px`,
            } as React.CSSProperties}
          />
        ))}
      </div>

      {/* ── Scanline ────────────────────────────────────────── */}
      <div
        className="splash-scanline"
        style={{
          position: 'absolute',
          left: 0, right: 0,
          height: 2,
          background: 'linear-gradient(90deg, transparent 0%, rgba(255,190,60,0.14) 30%, rgba(255,190,60,0.2) 50%, rgba(255,190,60,0.14) 70%, transparent 100%)',
          pointerEvents: 'none',
          zIndex: 8,
        }}
      />

      {/* ── Horizontal scan lines (static) ──────────────────── */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.08) 3px, rgba(0,0,0,0.08) 4px)',
          pointerEvents: 'none',
          zIndex: 7,
        }}
      />

      {/* ── Noise grain ─────────────────────────────────────── */}
      <div
        style={{
          position: 'absolute',
          inset: '-50%',
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          backgroundSize: '180px 180px',
          opacity: 0.055,
          mixBlendMode: 'overlay',
          pointerEvents: 'none',
          zIndex: 9,
        }}
      />

      {/* ── Vignette ────────────────────────────────────────── */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(ellipse at 50% 50%, transparent 38%, rgba(4,2,1,0.75) 100%)',
          pointerEvents: 'none',
          zIndex: 10,
        }}
      />

      {/* ── Center card ─────────────────────────────────────── */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 20,
        }}
      >
        <div
          className="splash-card"
          style={{
            position: 'relative',
            padding: '44px 68px 44px',
            background: 'linear-gradient(155deg, #1e1008 0%, #110905 60%, #0d0703 100%)',
            border: '1px solid rgba(200,146,12,0.55)',
            maxWidth: 620,
            width: '90%',
            textAlign: 'center',
            opacity: exiting ? 0 : undefined,
            transform: exiting ? 'scale(1.1)' : undefined,
            transition: exiting ? 'opacity 0.7s ease-in, transform 0.7s ease-in' : undefined,
          }}
        >
          {/* Corner rivets */}
          {[
            { top: -9,  left: -9  },
            { top: -9,  right: -9 },
            { bottom: -9, left: -9  },
            { bottom: -9, right: -9 },
          ].map((pos, i) => (
            <div
              key={i}
              className="splash-rivet"
              style={{
                position: 'absolute',
                width: 18, height: 18,
                borderRadius: '50%',
                background: 'radial-gradient(circle at 35% 32%, #f0d050 0%, #9a7010 60%, #5a3e08 100%)',
                border: '1px solid rgba(200,146,12,0.5)',
                ...pos,
              }}
            />
          ))}

          {/* Inner corner accents */}
          {[
            { top: 14,  left: 14,  borderTop: '1px solid', borderLeft: '1px solid'  },
            { top: 14,  right: 14, borderTop: '1px solid', borderRight: '1px solid' },
            { bottom: 14, left: 14,  borderBottom: '1px solid', borderLeft: '1px solid'  },
            { bottom: 14, right: 14, borderBottom: '1px solid', borderRight: '1px solid' },
          ].map((pos, i) => (
            <div
              key={i}
              style={{
                position: 'absolute',
                width: 18, height: 18,
                borderColor: 'rgba(200,146,12,0.4)',
                ...pos,
              }}
            />
          ))}

          {/* Top edge line */}
          <div style={{
            position: 'absolute',
            top: 0, left: 28, right: 28, height: 1,
            background: 'linear-gradient(90deg, transparent, rgba(200,146,12,0.85), transparent)',
          }} />

          {/* Gorilla */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
            <img
              src={gorilla}
              alt=""
              className="splash-gorilla"
              style={{
                width: 140,
                height: 140,
                objectFit: 'contain',
                filter: 'sepia(0.4) saturate(1.2) brightness(0.9) drop-shadow(0 0 18px rgba(255,140,0,0.55))',
              }}
            />
          </div>

          {/* Main title */}
          <div
            className="splash-title"
            style={{
              fontSize: 'clamp(52px, 9vw, 100px)',
              fontWeight: 400,
              lineHeight: 0.88,
              color: '#e8c040',
              textTransform: 'uppercase',
              letterSpacing: '-0.01em',
            }}
          >
            Big Sex
          </div>

          {/* RANKED */}
          <div
            className="splash-ranked"
            style={{
              fontSize: 'clamp(30px, 5.5vw, 60px)',
              fontWeight: 400,
              color: '#ff8c00',
              textTransform: 'uppercase',
              letterSpacing: '0.18em',
              marginTop: 2,
            }}
          >
            Ranked
          </div>

          {/* Bottom edge line */}
          <div style={{
            position: 'absolute',
            bottom: 0, left: 28, right: 28, height: 1,
            background: 'linear-gradient(90deg, transparent, rgba(200,146,12,0.85), transparent)',
          }} />
        </div>
      </div>

      {/* ── Black cover for exit ─────────────────────────────── */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'black',
          opacity: exiting ? 1 : 0,
          pointerEvents: 'none',
          zIndex: 50,
          transition: exiting ? 'opacity 0.7s ease-in 0.3s' : undefined,
        }}
      />
    </div>
  )
}
