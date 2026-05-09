import { useState } from 'react'
import { AuthService } from '../services/AuthService'
import gorilla from '../assets/gorilla.png'

interface Props {
  onLogin: () => void
}

export function LoginPage({ onLogin }: Props) {
  const [username, setUsername]       = useState('')
  const [password, setPassword]       = useState('')
  const [remember, setRemember]       = useState(false)
  const [loading, setLoading]         = useState(false)
  const [error, setError]             = useState<string | null>(null)
  const [focused, setFocused]         = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await AuthService.login(username, password, remember)
      onLogin()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  function inputStyle(field: string): React.CSSProperties {
    const active = focused === field
    return {
      width: '100%',
      boxSizing: 'border-box',
      background: '#07040200',
      border: `1px solid rgba(200,146,12,${active ? '0.85' : '0.28'})`,
      boxShadow: active ? '0 0 16px rgba(200,146,12,0.16), inset 0 0 8px rgba(200,146,12,0.05)' : 'none',
      color: '#e8c040',
      fontFamily: 'Rajdhani, sans-serif',
      fontWeight: 600,
      fontSize: 15,
      padding: '11px 14px',
      outline: 'none',
      letterSpacing: '0.05em',
      transition: 'border-color 0.2s, box-shadow 0.2s',
      background: '#0a0603',
    } as React.CSSProperties
  }

  const label: React.CSSProperties = {
    display: 'block',
    fontSize: 10,
    letterSpacing: '0.3em',
    color: 'rgba(200,146,12,0.55)',
    textTransform: 'uppercase',
    marginBottom: 7,
    fontFamily: 'Rajdhani, sans-serif',
    fontWeight: 700,
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'radial-gradient(ellipse at 48% 45%, #1a0e07 0%, #0d0603 50%, #080402 100%)',
      }}
    >
      {/* Static scanlines */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.07) 3px, rgba(0,0,0,0.07) 4px)',
          pointerEvents: 'none',
        }}
      />

      {/* Vignette */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(ellipse at 50% 50%, transparent 40%, rgba(4,2,1,0.7) 100%)',
          pointerEvents: 'none',
        }}
      />

      {/* Card */}
      <div
        style={{
          position: 'relative',
          padding: '44px 52px 40px',
          background: 'linear-gradient(155deg, #1e1008 0%, #110905 60%, #0d0703 100%)',
          border: '1px solid rgba(200,146,12,0.48)',
          boxShadow: '0 0 50px rgba(200,146,12,0.1), inset 0 0 24px rgba(200,146,12,0.04)',
          maxWidth: 400,
          width: '90%',
          zIndex: 10,
        }}
      >
        {/* Corner rivets */}
        {([
          { top: -8, left: -8 },
          { top: -8, right: -8 },
          { bottom: -8, left: -8 },
          { bottom: -8, right: -8 },
        ] as React.CSSProperties[]).map((pos, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              width: 16, height: 16,
              borderRadius: '50%',
              background: 'radial-gradient(circle at 35% 32%, #f0d050 0%, #9a7010 60%, #5a3e08 100%)',
              border: '1px solid rgba(200,146,12,0.45)',
              ...pos,
            }}
          />
        ))}

        {/* Inner corner brackets */}
        {([
          { top: 12,    left: 12,   borderTop: '1px solid',    borderLeft: '1px solid'   },
          { top: 12,    right: 12,  borderTop: '1px solid',    borderRight: '1px solid'  },
          { bottom: 12, left: 12,   borderBottom: '1px solid', borderLeft: '1px solid'   },
          { bottom: 12, right: 12,  borderBottom: '1px solid', borderRight: '1px solid'  },
        ] as React.CSSProperties[]).map((pos, i) => (
          <div key={i} style={{ position: 'absolute', width: 14, height: 14, borderColor: 'rgba(200,146,12,0.35)', ...pos }} />
        ))}

        {/* Top edge line */}
        <div style={{ position: 'absolute', top: 0, left: 24, right: 24, height: 1, background: 'linear-gradient(90deg, transparent, rgba(200,146,12,0.8), transparent)' }} />

        {/* Logo + title */}
        <div style={{ textAlign: 'center', marginBottom: 34 }}>
          <img
            src={gorilla}
            alt=""
            style={{
              width: 58,
              height: 58,
              objectFit: 'contain',
              filter: 'sepia(0.4) saturate(1.2) brightness(0.88) drop-shadow(0 0 10px rgba(255,140,0,0.4))',
              marginBottom: 10,
              display: 'block',
              margin: '0 auto 10px',
            }}
          />
          <div style={{ fontFamily: 'Bebas Neue, Impact, sans-serif', fontSize: 26, color: '#e8c040', letterSpacing: '0.04em', lineHeight: 1 }}>
            Big Sex Ranked
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} noValidate>
          <div style={{ marginBottom: 16 }}>
            <label style={label}>Username</label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              onFocus={() => setFocused('username')}
              onBlur={() => setFocused(null)}
              style={inputStyle('username')}
              autoComplete="username"
              required
            />
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={label}>Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onFocus={() => setFocused('password')}
              onBlur={() => setFocused(null)}
              style={inputStyle('password')}
              autoComplete="current-password"
              required
            />
          </div>

          {/* Remember me */}
          <div
            style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24, cursor: 'pointer', userSelect: 'none' }}
            onClick={() => setRemember(r => !r)}
          >
            <div
              style={{
                width: 16, height: 16, flexShrink: 0,
                border: `1px solid rgba(200,146,12,${remember ? '0.85' : '0.35'})`,
                background: remember ? 'rgba(200,146,12,0.15)' : 'transparent',
                boxShadow: remember ? '0 0 8px rgba(200,146,12,0.28)' : 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.15s',
              }}
            >
              {remember && <span style={{ color: '#c8920c', fontSize: 11, lineHeight: 1, marginTop: -1 }}>✓</span>}
            </div>
            <span style={{ ...label, marginBottom: 0, cursor: 'pointer' }}>Remember me</span>
          </div>

          {/* Error */}
          {error && (
            <div style={{
              marginBottom: 16,
              padding: '10px 14px',
              border: '1px solid rgba(255,60,0,0.38)',
              background: 'rgba(255,40,0,0.07)',
              color: '#ff5520',
              fontSize: 11,
              letterSpacing: '0.1em',
              fontFamily: 'Rajdhani, sans-serif',
              fontWeight: 600,
              textTransform: 'uppercase',
            }}>
              ⚠ &nbsp;{error}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              background: 'transparent',
              border: `1px solid rgba(200,146,12,${loading ? '0.3' : '0.65'})`,
              color: loading ? 'rgba(200,146,12,0.35)' : '#c8920c',
              fontFamily: 'Rajdhani, sans-serif',
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: '0.42em',
              textTransform: 'uppercase',
              padding: '13px',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => {
              if (!loading) (e.target as HTMLButtonElement).style.boxShadow = '0 0 20px rgba(200,146,12,0.3)'
            }}
            onMouseLeave={e => {
              (e.target as HTMLButtonElement).style.boxShadow = 'none'
            }}
          >
            {loading ? 'Authenticating...' : 'Login'}
          </button>
        </form>

        {/* Bottom edge line */}
        <div style={{ position: 'absolute', bottom: 0, left: 24, right: 24, height: 1, background: 'linear-gradient(90deg, transparent, rgba(200,146,12,0.8), transparent)' }} />
      </div>
    </div>
  )
}
