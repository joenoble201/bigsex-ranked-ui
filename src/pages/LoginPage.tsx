import { useState } from 'react'
import { AuthService } from '../services/AuthService'
import gorilla from '../assets/gorilla.png'

type View = 'login' | 'register-id' | 'register-confirm' | 'reset-id' | 'reset-confirm'

interface Props {
  onLogin: () => void
}

export function LoginPage({ onLogin }: Props) {
  const [view, setView]                   = useState<View>('login')
  const [savedUsername, setSavedUsername] = useState('')
  const [username, setUsername]           = useState('')
  const [password, setPassword]           = useState('')
  const [remember, setRemember]           = useState(false)
  const [usernameInput, setUsernameInput] = useState('')
  const [code, setCode]                   = useState('')
  const [newPassword, setNewPassword]     = useState('')
  const [loading, setLoading]             = useState(false)
  const [error, setError]                 = useState<string | null>(null)
  const [focused, setFocused]             = useState<string | null>(null)

  function goTo(v: View) {
    setError(null)
    setFocused(null)
    setView(v)
  }

  async function handleLogin(e: React.FormEvent) {
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

  async function handleRegisterRequest(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await AuthService.registerRequest(usernameInput.trim())
      setSavedUsername(usernameInput.trim())
      setCode('')
      setNewPassword('')
      goTo('register-confirm')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed')
    } finally {
      setLoading(false)
    }
  }

  async function handleRegisterConfirm(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await AuthService.registerConfirm(savedUsername, code.trim(), newPassword)
      onLogin()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Confirmation failed')
    } finally {
      setLoading(false)
    }
  }

  async function handleResetRequest(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await AuthService.resetRequest(usernameInput.trim())
      setSavedUsername(usernameInput.trim())
      setCode('')
      setNewPassword('')
      goTo('reset-confirm')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed')
    } finally {
      setLoading(false)
    }
  }

  async function handleResetConfirm(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await AuthService.resetConfirm(savedUsername, code.trim(), newPassword)
      onLogin()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Reset failed')
    } finally {
      setLoading(false)
    }
  }

  function inputStyle(field: string): React.CSSProperties {
    const active = focused === field
    return {
      width: '100%',
      boxSizing: 'border-box',
      background: '#0a0603',
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
    } as React.CSSProperties
  }

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: 10,
    letterSpacing: '0.3em',
    color: 'rgba(200,146,12,0.55)',
    textTransform: 'uppercase',
    marginBottom: 7,
    fontFamily: 'Rajdhani, sans-serif',
    fontWeight: 700,
  }

  function primaryBtnStyle(disabled: boolean): React.CSSProperties {
    return {
      width: '100%',
      background: 'transparent',
      border: `1px solid rgba(200,146,12,${disabled ? '0.3' : '0.65'})`,
      color: disabled ? 'rgba(200,146,12,0.35)' : '#c8920c',
      fontFamily: 'Rajdhani, sans-serif',
      fontSize: 12,
      fontWeight: 700,
      letterSpacing: '0.42em',
      textTransform: 'uppercase' as const,
      padding: '13px',
      cursor: disabled ? 'not-allowed' : 'pointer',
      transition: 'all 0.2s',
    }
  }

  const linkBtnStyle: React.CSSProperties = {
    background: 'none',
    border: 'none',
    color: 'rgba(200,146,12,0.6)',
    fontFamily: 'Rajdhani, sans-serif',
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: '0.15em',
    textTransform: 'uppercase' as const,
    cursor: 'pointer',
    padding: 0,
  }

  const errorBlock = error ? (
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
  ) : null

  function renderForm() {
    if (view === 'login') {
      return (
        <form onSubmit={handleLogin} noValidate>
          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Username</label>
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
            <label style={labelStyle}>Password</label>
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
          <div
            style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24, cursor: 'pointer', userSelect: 'none' }}
            onClick={() => setRemember(r => !r)}
          >
            <div style={{
              width: 16, height: 16, flexShrink: 0,
              border: `1px solid rgba(200,146,12,${remember ? '0.85' : '0.35'})`,
              background: remember ? 'rgba(200,146,12,0.15)' : 'transparent',
              boxShadow: remember ? '0 0 8px rgba(200,146,12,0.28)' : 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.15s',
            }}>
              {remember && <span style={{ color: '#c8920c', fontSize: 11, lineHeight: 1, marginTop: -1 }}>✓</span>}
            </div>
            <span style={{ ...labelStyle, marginBottom: 0, cursor: 'pointer' }}>Remember me</span>
          </div>
          {errorBlock}
          <button
            type="submit"
            disabled={loading}
            style={primaryBtnStyle(loading)}
            onMouseEnter={e => { if (!loading) (e.target as HTMLButtonElement).style.boxShadow = '0 0 20px rgba(200,146,12,0.3)' }}
            onMouseLeave={e => { (e.target as HTMLButtonElement).style.boxShadow = 'none' }}
          >
            {loading ? 'Authenticating...' : 'Login'}
          </button>
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            marginTop: 20, paddingTop: 16,
            borderTop: '1px solid rgba(200,146,12,0.12)',
          }}>
            <button type="button" style={linkBtnStyle} onClick={() => { setUsernameInput(''); goTo('register-id') }}>
              Register
            </button>
            <button type="button" style={linkBtnStyle} onClick={() => { setUsernameInput(''); goTo('reset-id') }}>
              Forgot Password?
            </button>
          </div>
        </form>
      )
    }

    if (view === 'register-id' || view === 'reset-id') {
      const onSubmit = view === 'register-id' ? handleRegisterRequest : handleResetRequest
      const disabled = loading || !usernameInput.trim()
      return (
        <form onSubmit={onSubmit} noValidate>
          <div style={{ marginBottom: 20 }}>
            <label style={labelStyle}>Username</label>
            <input
              type="text"
              value={usernameInput}
              onChange={e => setUsernameInput(e.target.value)}
              onFocus={() => setFocused('memberId')}
              onBlur={() => setFocused(null)}
              style={inputStyle('memberId')}
              autoComplete="off"
              required
            />
          </div>
          {errorBlock}
          <button
            type="submit"
            disabled={disabled}
            style={primaryBtnStyle(disabled)}
            onMouseEnter={e => { if (!disabled) (e.target as HTMLButtonElement).style.boxShadow = '0 0 20px rgba(200,146,12,0.3)' }}
            onMouseLeave={e => { (e.target as HTMLButtonElement).style.boxShadow = 'none' }}
          >
            {loading ? 'Sending...' : 'Send Code'}
          </button>
        </form>
      )
    }

    if (view === 'register-confirm' || view === 'reset-confirm') {
      const isRegister = view === 'register-confirm'
      const onSubmit = isRegister ? handleRegisterConfirm : handleResetConfirm
      const disabled = loading || !code.trim() || newPassword.length < 8
      return (
        <form onSubmit={onSubmit} noValidate>
          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Verification Code</label>
            <input
              type="text"
              value={code}
              onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              onFocus={() => setFocused('code')}
              onBlur={() => setFocused(null)}
              style={{ ...inputStyle('code'), letterSpacing: '0.5em', textAlign: 'center', fontSize: 22 }}
              autoComplete="one-time-code"
              inputMode="numeric"
              maxLength={6}
              required
            />
          </div>
          <div style={{ marginBottom: 20 }}>
            <label style={labelStyle}>{isRegister ? 'Set Password' : 'New Password'}</label>
            <input
              type="password"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              onFocus={() => setFocused('newPassword')}
              onBlur={() => setFocused(null)}
              style={inputStyle('newPassword')}
              autoComplete="new-password"
              required
              minLength={8}
            />
          </div>
          {newPassword.length > 0 && newPassword.length < 8 && (
            <div style={{ marginBottom: 12, fontSize: 10, letterSpacing: '0.15em', color: 'rgba(200,146,12,0.45)', fontFamily: 'Rajdhani, sans-serif' }}>
              Password must be at least 8 characters
            </div>
          )}
          {errorBlock}
          <button
            type="submit"
            disabled={disabled}
            style={primaryBtnStyle(disabled)}
            onMouseEnter={e => { if (!disabled) (e.target as HTMLButtonElement).style.boxShadow = '0 0 20px rgba(200,146,12,0.3)' }}
            onMouseLeave={e => { (e.target as HTMLButtonElement).style.boxShadow = 'none' }}
          >
            {loading ? (isRegister ? 'Creating...' : 'Resetting...') : (isRegister ? 'Create Account' : 'Reset Password')}
          </button>
          <div style={{ textAlign: 'center', marginTop: 16 }}>
            <button
              type="button"
              style={{ ...linkBtnStyle, fontSize: 10 }}
              onClick={() => goTo(isRegister ? 'register-id' : 'reset-id')}
            >
              Resend Code
            </button>
          </div>
        </form>
      )
    }

    return null
  }

  const isLogin = view === 'login'

  const viewTitle: Record<View, string> = {
    'login':            'Big Sex Ranked',
    'register-id':      'Create Account',
    'register-confirm': 'Verify & Set Password',
    'reset-id':         'Reset Password',
    'reset-confirm':    'Set New Password',
  }

  const viewSubtitle: Partial<Record<View, string>> = {
    'register-id':      'Enter your username to receive a verification code',
    'register-confirm': `Code sent to Discord DMs for ${savedUsername}`,
    'reset-id':         'Enter your username to receive a reset code',
    'reset-confirm':    `Code sent to Discord DMs for ${savedUsername}`,
  }

  const backTarget: Partial<Record<View, View>> = {
    'register-id':      'login',
    'register-confirm': 'register-id',
    'reset-id':         'login',
    'reset-confirm':    'reset-id',
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'radial-gradient(ellipse at 48% 45%, #1a0e07 0%, #0d0603 50%, #080402 100%)',
    }}>
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.07) 3px, rgba(0,0,0,0.07) 4px)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(ellipse at 50% 50%, transparent 40%, rgba(4,2,1,0.7) 100%)',
        pointerEvents: 'none',
      }} />

      <div style={{
        position: 'relative', padding: '44px 52px 40px',
        background: 'linear-gradient(155deg, #1e1008 0%, #110905 60%, #0d0703 100%)',
        border: '1px solid rgba(200,146,12,0.48)',
        boxShadow: '0 0 50px rgba(200,146,12,0.1), inset 0 0 24px rgba(200,146,12,0.04)',
        maxWidth: 400, width: '90%', zIndex: 10,
      }}>
        {/* Corner rivets */}
        {([
          { top: -8, left: -8 }, { top: -8, right: -8 },
          { bottom: -8, left: -8 }, { bottom: -8, right: -8 },
        ] as React.CSSProperties[]).map((pos, i) => (
          <div key={i} style={{
            position: 'absolute', width: 16, height: 16, borderRadius: '50%',
            background: 'radial-gradient(circle at 35% 32%, #f0d050 0%, #9a7010 60%, #5a3e08 100%)',
            border: '1px solid rgba(200,146,12,0.45)', ...pos,
          }} />
        ))}

        {/* Corner brackets */}
        {([
          { top: 12, left: 12, borderTop: '1px solid', borderLeft: '1px solid' },
          { top: 12, right: 12, borderTop: '1px solid', borderRight: '1px solid' },
          { bottom: 12, left: 12, borderBottom: '1px solid', borderLeft: '1px solid' },
          { bottom: 12, right: 12, borderBottom: '1px solid', borderRight: '1px solid' },
        ] as React.CSSProperties[]).map((pos, i) => (
          <div key={i} style={{ position: 'absolute', width: 14, height: 14, borderColor: 'rgba(200,146,12,0.35)', ...pos }} />
        ))}

        <div style={{ position: 'absolute', top: 0, left: 24, right: 24, height: 1, background: 'linear-gradient(90deg, transparent, rgba(200,146,12,0.8), transparent)' }} />

        {/* Back nav */}
        {backTarget[view] && (
          <button
            type="button"
            style={{ ...linkBtnStyle, position: 'absolute', top: 18, left: 20, fontSize: 10, letterSpacing: '0.2em' }}
            onClick={() => goTo(backTarget[view]!)}
          >
            ‹ Back
          </button>
        )}

        {/* Logo + title */}
        <div style={{ textAlign: 'center', marginBottom: isLogin ? 34 : 24 }}>
          <img
            src={gorilla}
            alt=""
            style={{
              width: isLogin ? 58 : 42, height: isLogin ? 58 : 42,
              objectFit: 'contain',
              filter: 'sepia(0.4) saturate(1.2) brightness(0.88) drop-shadow(0 0 10px rgba(255,140,0,0.4))',
              display: 'block', margin: '0 auto 10px',
            }}
          />
          <div style={{ fontFamily: 'Bebas Neue, Impact, sans-serif', fontSize: isLogin ? 26 : 22, color: '#e8c040', letterSpacing: '0.04em', lineHeight: 1 }}>
            {viewTitle[view]}
          </div>
          {viewSubtitle[view] && (
            <div style={{ marginTop: 8, fontSize: 11, color: 'rgba(200,146,12,0.45)', fontFamily: 'Rajdhani, sans-serif', letterSpacing: '0.04em', lineHeight: 1.5 }}>
              {viewSubtitle[view]}
            </div>
          )}
        </div>

        {renderForm()}

        <div style={{ position: 'absolute', bottom: 0, left: 24, right: 24, height: 1, background: 'linear-gradient(90deg, transparent, rgba(200,146,12,0.8), transparent)' }} />
      </div>
    </div>
  )
}
