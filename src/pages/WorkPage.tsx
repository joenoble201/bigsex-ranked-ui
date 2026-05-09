import { useState, useEffect, useCallback } from 'react'

// ── Types ────────────────────────────────────────────────────

type TaskType = 'email' | 'memo' | 'report' | 'review' | 'minutes'

interface Task {
  taskId: string
  taskType: TaskType
  taskTypeLabel: string
  taskPrompt: string
  status: string
  expiresAt: string
}

interface WorkResult {
  payout: number
  newBalance: number
  feedback: string
  fired?: boolean
}

// ── Design tokens — Google Workspace / Material 3 ────────────

const G = {
  // Surfaces
  pageBg:    '#f8f9fa',
  surface:   '#ffffff',
  surfaceVar:'#f1f3f4',

  // Text
  text:      '#202124',
  textSub:   '#5f6368',
  textMuted: '#9aa0a6',

  // Borders & dividers
  border:    '#dadce0',

  // Brand
  blue:      '#1a73e8',
  blueHover: '#1557b0',
  blueLight: '#e8f0fe',
  blueDark:  '#174ea6',

  // Semantic
  green:     '#1e8e3e',
  greenLight:'#e6f4ea',
  yellow:    '#e37400',
  yellowLight:'#fef7e0',
  red:       '#d93025',
  redLight:  '#fce8e6',

  // Shadows (Material elevation)
  shadow1:   '0 1px 2px rgba(60,64,67,.3), 0 1px 3px 1px rgba(60,64,67,.15)',
  shadow2:   '0 1px 2px rgba(60,64,67,.3), 0 2px 6px 2px rgba(60,64,67,.15)',
}

const font = `'Google Sans', Roboto, 'Helvetica Neue', Arial, sans-serif`
const fontMono = `'Roboto Mono', 'Courier New', monospace`

// ── Helpers ──────────────────────────────────────────────────

const fmt = (n: number) => Math.floor(n).toLocaleString()

function formatCountdown(ms: number) {
  if (ms <= 0) return '00:00'
  const s = Math.floor(ms / 1000)
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
}

function gradeFor(payout: number): { letter: string; label: string; color: string; light: string; pct: number } {
  if (payout >= 1600) return { letter: 'A', label: 'Exceptional',  color: G.green,  light: G.greenLight,  pct: 100 * payout / 2000 }
  if (payout >= 1000) return { letter: 'B', label: 'Solid Work',   color: G.blue,   light: G.blueLight,   pct: 100 * payout / 2000 }
  if (payout >= 400)  return { letter: 'C', label: 'Serviceable',  color: G.yellow, light: G.yellowLight, pct: 100 * payout / 2000 }
  return                     { letter: 'D', label: 'Needs Work',   color: G.red,    light: G.redLight,    pct: 100 * payout / 2000 }
}

// ── Countdown chip ───────────────────────────────────────────

function Countdown({ expiresAt }: { expiresAt: string }) {
  const [ms, setMs] = useState(() => new Date(expiresAt).getTime() - Date.now())
  useEffect(() => {
    const id = setInterval(() => setMs(new Date(expiresAt).getTime() - Date.now()), 1000)
    return () => clearInterval(id)
  }, [expiresAt])

  const urgent  = ms < 5 * 60 * 1000
  const expired = ms <= 0

  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '6px 12px',
      borderRadius: 24,
      background: urgent ? G.redLight : G.blueLight,
      color: urgent ? G.red : G.blue,
      fontFamily: font,
      fontSize: 13,
      fontWeight: 500,
    }}>
      {/* Clock icon */}
      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67V7z"/>
      </svg>
      {expired ? 'Expired' : `${formatCountdown(ms)} left`}
    </div>
  )
}

// ── Chip (task type label) ───────────────────────────────────

function Chip({ label }: { label: string }) {
  return (
    <span style={{
      display: 'inline-block',
      padding: '2px 10px',
      borderRadius: 12,
      background: G.blueLight,
      color: G.blue,
      fontFamily: font,
      fontSize: 12,
      fontWeight: 500,
      letterSpacing: '0.01em',
    }}>
      {label}
    </span>
  )
}

// ── Card ─────────────────────────────────────────────────────

function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      background: G.surface,
      borderRadius: 8,
      boxShadow: G.shadow1,
      overflow: 'hidden',
      ...style,
    }}>
      {children}
    </div>
  )
}

// ── Material text field ───────────────────────────────────────

function TextField({
  label, value, onChange, placeholder, readOnly, multiline, minRows, disabled,
}: {
  label?: string
  value: string
  onChange?: (v: string) => void
  placeholder?: string
  readOnly?: boolean
  multiline?: boolean
  minRows?: number
  disabled?: boolean
}) {
  const [focused, setFocused] = useState(false)

  const base: React.CSSProperties = {
    width: '100%',
    boxSizing: 'border-box',
    fontFamily: font,
    fontSize: 14,
    color: G.text,
    background: readOnly ? G.surfaceVar : G.surface,
    border: `1px solid ${focused ? G.blue : G.border}`,
    borderRadius: 4,
    padding: '10px 12px',
    outline: 'none',
    lineHeight: 1.6,
    transition: 'border-color 0.15s',
    boxShadow: focused ? `0 0 0 2px ${G.blueLight}` : 'none',
    resize: 'none' as const,
    cursor: readOnly ? 'default' : 'text',
    color: readOnly ? G.textSub : G.text,
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {label && (
        <label style={{ fontFamily: font, fontSize: 12, fontWeight: 500, color: focused ? G.blue : G.textSub }}>
          {label}
        </label>
      )}
      {multiline ? (
        <textarea
          style={{ ...base, minHeight: (minRows ?? 6) * 24 }}
          value={value}
          onChange={e => onChange?.(e.target.value)}
          placeholder={placeholder}
          readOnly={readOnly}
          disabled={disabled}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
      ) : (
        <input
          style={base}
          value={value}
          onChange={e => onChange?.(e.target.value)}
          placeholder={placeholder}
          readOnly={readOnly}
          disabled={disabled}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
      )}
    </div>
  )
}

// ── Button ───────────────────────────────────────────────────

function PrimaryButton({ label, onClick, disabled, loading }: {
  label: string
  onClick: () => void
  disabled?: boolean
  loading?: boolean
}) {
  const [hovered, setHovered] = useState(false)
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        fontFamily: font,
        fontSize: 14,
        fontWeight: 500,
        padding: '10px 24px',
        borderRadius: 24,
        border: 'none',
        background: disabled ? G.border : hovered ? G.blueHover : G.blue,
        color: disabled ? G.textMuted : '#fff',
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'background 0.15s',
        letterSpacing: '0.01em',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
      }}
    >
      {loading && (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style={{ animation: 'spin 0.8s linear infinite' }}>
          <path d="M12 4V2A10 10 0 0 0 2 12h2a8 8 0 0 1 8-8z"/>
        </svg>
      )}
      {label}
    </button>
  )
}

// ── Email composer ───────────────────────────────────────────

function EmailComposer({ onSubmit, disabled }: { onSubmit: (s: string) => void; disabled: boolean }) {
  const [to, setTo]           = useState('')
  const [subject, setSubject] = useState('')
  const [body, setBody]       = useState('')

  const charCount = to.length + subject.length + body.length
  const canSubmit = !!(to.trim() && subject.trim() && body.trim().length >= 30 && !disabled)

  function submit() { onSubmit(`To: ${to}\nSubject: ${subject}\n\n${body}`) }

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {/* Gmail-style header rows */}
      <div>
        {[
          { label: 'To', value: to, set: setTo, placeholder: 'Recipient name or role', weight: 400 },
          { label: 'Subject', value: subject, set: setSubject, placeholder: 'Email subject', weight: 500 },
        ].map(({ label, value, set, placeholder, weight }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', borderBottom: `1px solid ${G.border}` }}>
            <span style={{ fontFamily: font, fontSize: 13, fontWeight: 500, color: G.textSub, padding: '10px 16px', minWidth: 72, flexShrink: 0 }}>
              {label}
            </span>
            <input
              style={{
                flex: 1, border: 'none', outline: 'none', padding: '10px 12px 10px 0',
                fontFamily: font, fontSize: 14, fontWeight: weight, color: G.text,
                background: 'transparent',
              }}
              value={value}
              onChange={e => set(e.target.value)}
              placeholder={placeholder}
              disabled={disabled}
            />
          </div>
        ))}
      </div>

      {/* Body */}
      <textarea
        style={{
          border: 'none', outline: 'none',
          padding: '16px',
          fontFamily: font, fontSize: 14, lineHeight: 1.7, color: G.text,
          minHeight: 280, resize: 'vertical', background: 'transparent',
        }}
        value={body}
        onChange={e => setBody(e.target.value)}
        placeholder="Write your email here…"
        disabled={disabled}
      />

      <SubmitFooter charCount={charCount} canSubmit={canSubmit} onSubmit={submit} disabled={disabled} />
    </div>
  )
}

// ── Memo composer ────────────────────────────────────────────

function MemoComposer({ onSubmit, disabled }: { onSubmit: (s: string) => void; disabled: boolean }) {
  const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
  const [to, setTo]     = useState('')
  const [from, setFrom] = useState('')
  const [re, setRe]     = useState('')
  const [body, setBody] = useState('')

  const charCount = to.length + from.length + re.length + body.length
  const canSubmit = !!(to.trim() && from.trim() && re.trim() && body.trim().length >= 30 && !disabled)

  function submit() { onSubmit(`TO: ${to}\nFROM: ${from}\nDATE: ${today}\nRE: ${re}\n\n${body}`) }

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {/* Memo header rows */}
      {[
        { label: 'To',   value: to,    set: setTo,    placeholder: 'All Staff / Department' },
        { label: 'From', value: from,  set: setFrom,  placeholder: 'Your name / role' },
        { label: 'Date', value: today, set: undefined, placeholder: '' },
        { label: 'Re',   value: re,    set: setRe,    placeholder: 'Subject matter' },
      ].map(({ label, value, set, placeholder }) => (
        <div key={label} style={{ display: 'flex', alignItems: 'center', borderBottom: `1px solid ${G.border}` }}>
          <span style={{ fontFamily: font, fontSize: 13, fontWeight: 500, color: G.textSub, padding: '10px 16px', minWidth: 72, flexShrink: 0 }}>
            {label}
          </span>
          <input
            style={{
              flex: 1, border: 'none', outline: 'none', padding: '10px 12px 10px 0',
              fontFamily: font, fontSize: 14, color: set ? G.text : G.textSub,
              background: 'transparent',
            }}
            value={value}
            onChange={e => set?.(e.target.value)}
            placeholder={placeholder}
            readOnly={!set}
            disabled={disabled}
          />
        </div>
      ))}

      {/* Body */}
      <textarea
        style={{
          border: 'none', outline: 'none',
          padding: '16px',
          fontFamily: font, fontSize: 14, lineHeight: 1.7, color: G.text,
          minHeight: 240, resize: 'vertical', background: 'transparent',
        }}
        value={body}
        onChange={e => setBody(e.target.value)}
        placeholder="Write the memo body here…"
        disabled={disabled}
      />

      <SubmitFooter charCount={charCount} canSubmit={canSubmit} onSubmit={submit} disabled={disabled} />
    </div>
  )
}

// ── Freeform composer ────────────────────────────────────────

const freeformConfig: Record<string, { sections: string[]; placeholder: string }> = {
  report:  {
    sections: ['Executive Summary', 'Timeline', 'Root Cause', 'Impact', 'Resolution', 'Lessons Learned'],
    placeholder: 'Write your report here…',
  },
  review:  {
    sections: ['Overall Assessment', 'Key Achievements', 'Areas for Development', 'Goals for Next Period'],
    placeholder: 'Write the performance review here…',
  },
  minutes: {
    sections: ['Attendees', 'Agenda', 'Discussion & Decisions', 'Action Items'],
    placeholder: 'Write the meeting minutes here…',
  },
}

function FreeformComposer({ taskType, onSubmit, disabled }: { taskType: string; onSubmit: (s: string) => void; disabled: boolean }) {
  const [body, setBody] = useState('')
  const canSubmit = body.trim().length >= 50 && !disabled
  const config = freeformConfig[taskType]

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {config && (
        <div style={{ padding: '12px 16px', borderBottom: `1px solid ${G.border}`, display: 'flex', alignItems: 'flex-start', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ fontFamily: font, fontSize: 12, fontWeight: 500, color: G.textSub, paddingTop: 2, flexShrink: 0 }}>
            Suggested sections:
          </span>
          {config.sections.map((s, i) => (
            <span key={s} style={{ fontFamily: font, fontSize: 12, color: G.blue }}>
              {s}{i < config.sections.length - 1 ? ' ·' : ''}
            </span>
          ))}
        </div>
      )}

      <textarea
        style={{
          border: 'none', outline: 'none',
          padding: '16px',
          fontFamily: font, fontSize: 14, lineHeight: 1.7, color: G.text,
          minHeight: 300, resize: 'vertical', background: 'transparent',
        }}
        value={body}
        onChange={e => setBody(e.target.value)}
        placeholder={config?.placeholder ?? 'Write your response here…'}
        disabled={disabled}
      />

      <SubmitFooter charCount={body.length} canSubmit={canSubmit} onSubmit={() => onSubmit(body)} disabled={disabled} />
    </div>
  )
}

// ── Submit footer ─────────────────────────────────────────────

function SubmitFooter({ charCount, canSubmit, onSubmit, disabled }: {
  charCount: number
  canSubmit: boolean
  onSubmit: () => void
  disabled: boolean
}) {
  const short = charCount < 50
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '12px 16px',
      borderTop: `1px solid ${G.border}`,
      background: G.pageBg,
      borderRadius: '0 0 8px 8px',
      gap: 12,
    }}>
      <span style={{ fontFamily: font, fontSize: 12, color: short ? G.red : G.textMuted }}>
        {short
          ? `${50 - charCount} more characters needed to submit`
          : `${charCount.toLocaleString()} characters`}
      </span>
      <PrimaryButton label={disabled ? 'Submitting…' : 'Submit'} onClick={onSubmit} disabled={!canSubmit} loading={disabled} />
    </div>
  )
}

// ── Result ───────────────────────────────────────────────────

function ResultView({ result }: { result: WorkResult }) {
  const { letter, label, color, light, pct } = gradeFor(result.payout)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, animation: 'fadeUp 0.3s ease-out' }}>

      {/* Score card */}
      <Card>
        <div style={{ padding: '32px 28px', display: 'flex', alignItems: 'center', gap: 24 }}>
          {/* Grade ring */}
          <div style={{ position: 'relative', width: 88, height: 88, flexShrink: 0 }}>
            <svg width="88" height="88" viewBox="0 0 88 88">
              <circle cx="44" cy="44" r="38" fill="none" stroke={G.border} strokeWidth="6"/>
              <circle
                cx="44" cy="44" r="38"
                fill="none"
                stroke={color}
                strokeWidth="6"
                strokeDasharray={`${2 * Math.PI * 38 * pct / 100} ${2 * Math.PI * 38}`}
                strokeDashoffset={2 * Math.PI * 38 * 0.25}
                strokeLinecap="round"
                style={{ transition: 'stroke-dasharray 0.8s ease-out' }}
              />
            </svg>
            <div style={{
              position: 'absolute', inset: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: font, fontSize: 30, fontWeight: 700, color,
            }}>
              {letter}
            </div>
          </div>

          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: font, fontSize: 22, fontWeight: 500, color: G.text, marginBottom: 4 }}>
              {label}
            </div>
            <div style={{ fontFamily: font, fontSize: 13, color: G.textSub }}>
              Task evaluated and complete
            </div>
          </div>

          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <div style={{
              fontFamily: fontMono, fontSize: 32, fontWeight: 700, color,
              letterSpacing: '-0.02em',
            }}>
              ₽{fmt(result.payout)}
            </div>
            <div style={{ fontFamily: font, fontSize: 12, color: G.textSub, marginTop: 2 }}>
              New balance: ₽{fmt(result.newBalance)}
            </div>
          </div>
        </div>

        {/* Score bar */}
        <div style={{ height: 4, background: G.border }}>
          <div style={{
            height: '100%',
            width: `${pct}%`,
            background: color,
            borderRadius: '0 2px 2px 0',
            transition: 'width 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
          }} />
        </div>
      </Card>

      {/* Feedback card */}
      <Card>
        <div style={{ padding: '16px 20px', borderBottom: `1px solid ${G.border}` }}>
          <span style={{ fontFamily: font, fontSize: 13, fontWeight: 500, color: G.textSub }}>
            Evaluator feedback
          </span>
        </div>
        <div style={{ padding: '20px 20px 20px 24px', borderLeft: `3px solid ${color}`, margin: '16px 20px', borderRadius: 2, background: light }}>
          <p style={{ fontFamily: font, fontSize: 14, lineHeight: 1.7, color: G.text, margin: 0 }}>
            {result.feedback}
          </p>
        </div>
      </Card>

      {/* Payout scale */}
      <Card style={{ overflow: 'visible' }}>
        <div style={{ padding: '14px 20px 10px', borderBottom: `1px solid ${G.border}` }}>
          <span style={{ fontFamily: font, fontSize: 12, fontWeight: 500, color: G.textSub }}>Scoring scale</span>
        </div>
        <div style={{ display: 'flex', padding: '12px 16px', gap: 8 }}>
          {[
            { range: '₽0–400',     tier: 'D',  label: 'Needs Work',   color: G.red,    light: G.redLight },
            { range: '₽400–1000',  tier: 'C',  label: 'Serviceable',  color: G.yellow, light: G.yellowLight },
            { range: '₽1000–1600', tier: 'B',  label: 'Solid',        color: G.blue,   light: G.blueLight },
            { range: '₽1600–2000', tier: 'A',  label: 'Exceptional',  color: G.green,  light: G.greenLight },
          ].map(({ range, tier, label: l, color: c, light: lt }) => (
            <div key={tier} style={{
              flex: 1,
              padding: '8px 10px',
              borderRadius: 6,
              background: letter === tier ? lt : 'transparent',
              border: `1px solid ${letter === tier ? c : G.border}`,
            }}>
              <div style={{ fontFamily: font, fontSize: 12, fontWeight: 600, color: letter === tier ? c : G.textSub }}>{tier}</div>
              <div style={{ fontFamily: font, fontSize: 11, color: letter === tier ? c : G.textMuted, marginTop: 1 }}>{range}</div>
              <div style={{ fontFamily: font, fontSize: 10, color: letter === tier ? c : G.textMuted }}>{l}</div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}

// ── Fired screen ─────────────────────────────────────────────

function FiredView({ letter }: { letter: string }) {
  const today = new Date().toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  })

  // Parse the letter into paragraphs for display
  const paragraphs = letter.split('\n').filter(l => l.trim().length > 0)

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 50,
      background: '#1a0000',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start',
      overflowY: 'auto',
      animation: 'firedIn 0.4s ease-out',
      padding: '40px 20px 80px',
    }}>
      {/* Big red X */}
      <div style={{
        width: 80, height: 80, borderRadius: '50%',
        background: G.red,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: 24,
        boxShadow: `0 0 0 12px ${G.red}22, 0 0 0 24px ${G.red}0a`,
        animation: 'firedPulse 2s ease-in-out infinite',
        flexShrink: 0,
      }}>
        <svg width="36" height="36" viewBox="0 0 24 24" fill="white">
          <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
        </svg>
      </div>

      {/* Heading */}
      <div style={{
        fontFamily: font,
        fontSize: 48,
        fontWeight: 700,
        color: '#ffffff',
        letterSpacing: '-0.02em',
        marginBottom: 8,
        textAlign: 'center',
      }}>
        You're Fired
      </div>
      <div style={{
        fontFamily: font,
        fontSize: 15,
        color: 'rgba(255,255,255,0.4)',
        marginBottom: 48,
        textAlign: 'center',
      }}>
        Access to Work Portal suspended for 24 hours
      </div>

      {/* Termination letter card */}
      <div style={{
        width: '100%', maxWidth: 600,
        background: G.surface,
        borderRadius: 8,
        boxShadow: '0 8px 40px rgba(0,0,0,0.6)',
        overflow: 'hidden',
      }}>
        {/* Letter header */}
        <div style={{
          background: G.red,
          padding: '16px 28px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <span style={{ fontFamily: font, fontSize: 12, fontWeight: 500, color: 'rgba(255,255,255,0.8)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            Notice of Termination
          </span>
          <span style={{ fontFamily: font, fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>
            {today}
          </span>
        </div>

        {/* Letter body */}
        <div style={{ padding: '28px 32px 32px', fontFamily: fontMono, fontSize: 13.5, lineHeight: 1.8, color: G.text }}>
          {paragraphs.map((para, i) => (
            <p key={i} style={{ margin: '0 0 14px', whiteSpace: 'pre-wrap' }}>
              {para}
            </p>
          ))}
        </div>

        {/* Footer stamp */}
        <div style={{
          borderTop: `1px solid ${G.border}`,
          padding: '14px 28px',
          display: 'flex', alignItems: 'center', gap: 10,
          background: G.surfaceVar,
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill={G.red}>
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
          </svg>
          <span style={{ fontFamily: font, fontSize: 12, color: G.textSub }}>
            This decision is final. You may reapply for work assignments in 24 hours.
          </span>
        </div>
      </div>
    </div>
  )
}

// ── Page state ───────────────────────────────────────────────

type PageState =
  | { kind: 'loading' }
  | { kind: 'gone'; message: string }
  | { kind: 'error'; message: string }
  | { kind: 'task'; task: Task }
  | { kind: 'submitting'; task: Task }
  | { kind: 'result'; task: Task; result: WorkResult }

// ── WorkPage ─────────────────────────────────────────────────

export function WorkPage({ taskId }: { taskId: string }) {
  const [state, setState] = useState<PageState>({ kind: 'loading' })

  const load = useCallback(async () => {
    setState({ kind: 'loading' })
    try {
      const res = await fetch(`/api/work/${taskId}`)
      if (res.status === 404) { setState({ kind: 'gone', message: 'This task does not exist.' }); return }
      if (res.status === 410) {
        const body = await res.json().catch(() => ({}))
        setState({ kind: 'gone', message: body.error ?? 'This task has already been completed or expired.' })
        return
      }
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error ?? `HTTP ${res.status}`)
      }
      setState({ kind: 'task', task: await res.json() })
    } catch (err) {
      setState({ kind: 'error', message: err instanceof Error ? err.message : 'Failed to load task.' })
    }
  }, [taskId])

  useEffect(() => { load() }, [load])

  async function handleSubmit(submission: string) {
    if (state.kind !== 'task') return
    const task = state.task
    setState({ kind: 'submitting', task })
    try {
      const res = await fetch(`/api/work/${taskId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ submission }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error ?? `HTTP ${res.status}`)
      }
      setState({ kind: 'result', task, result: await res.json() })
    } catch (err) {
      setState({ kind: 'task', task })
      alert(err instanceof Error ? err.message : 'Submission failed. Please try again.')
    }
  }

  const task      = (state as { task?: Task }).task ?? null
  const submitting = state.kind === 'submitting'

  return (
    <div style={{ minHeight: '100vh', background: G.pageBg, fontFamily: font }}>

      {/* Top bar — white like Google Workspace */}
      <div style={{
        background: G.surface,
        height: 64,
        display: 'flex',
        alignItems: 'center',
        padding: '0 20px',
        gap: 8,
        boxShadow: '0 1px 3px rgba(60,64,67,.15)',
        position: 'sticky', top: 0, zIndex: 10,
      }}>
        {/* App icon — Google-style coloured squares */}
        <div style={{ display: 'flex', flexWrap: 'wrap', width: 18, height: 18, gap: 2, flexShrink: 0 }}>
          {['#4285f4','#ea4335','#fbbc04','#34a853'].map((c, i) => (
            <div key={i} style={{ width: 7, height: 7, borderRadius: 1, background: c }} />
          ))}
        </div>

        <span style={{ fontFamily: font, fontSize: 18, color: G.textSub, fontWeight: 400, marginLeft: 4 }}>
          Work Portal
        </span>

        {task && (
          <>
            <span style={{ color: G.border, fontSize: 20, margin: '0 2px' }}>/</span>
            <Chip label={task.taskTypeLabel} />
          </>
        )}

        <div style={{ flex: 1 }} />

        {task && state.kind !== 'result' && <Countdown expiresAt={task.expiresAt} />}
      </div>

      {/* Content */}
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '28px 20px 80px' }}>

        {/* Loading skeleton */}
        {state.kind === 'loading' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {[80, 44, 380].map((h, i) => (
              <div key={i} style={{
                height: h,
                borderRadius: 8,
                background: G.surface,
                boxShadow: G.shadow1,
                animation: 'shimmer 1.3s ease-in-out infinite',
                animationDelay: `${i * 0.1}s`,
              }} />
            ))}
          </div>
        )}

        {/* Gone */}
        {state.kind === 'gone' && (
          <Card style={{ padding: '56px 32px', textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>📭</div>
            <div style={{ fontFamily: font, fontSize: 20, fontWeight: 500, color: G.text, marginBottom: 8 }}>
              Task unavailable
            </div>
            <div style={{ fontFamily: font, fontSize: 14, color: G.textSub, maxWidth: 360, margin: '0 auto' }}>
              {state.message}
            </div>
          </Card>
        )}

        {/* Error */}
        {state.kind === 'error' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{
              padding: '14px 16px',
              borderRadius: 4,
              background: G.redLight,
              border: `1px solid ${G.red}33`,
              fontFamily: font, fontSize: 14, color: G.red,
            }}>
              {state.message}
            </div>
            <button
              onClick={load}
              style={{
                alignSelf: 'flex-start',
                fontFamily: font, fontSize: 14, fontWeight: 500,
                padding: '8px 20px', borderRadius: 24,
                background: 'transparent',
                border: `1px solid ${G.border}`,
                color: G.blue, cursor: 'pointer',
              }}
            >
              Try again
            </button>
          </div>
        )}

        {/* Task */}
        {(state.kind === 'task' || state.kind === 'submitting') && task && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Brief */}
            <Card>
              <div style={{ padding: '20px 24px' }}>
                <div style={{ fontFamily: font, fontSize: 12, fontWeight: 500, color: G.textSub, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Your brief
                </div>
                <p style={{ fontFamily: font, fontSize: 16, lineHeight: 1.65, color: G.text, margin: 0, fontWeight: 400 }}>
                  {task.taskPrompt}
                </p>
              </div>
            </Card>

            {/* Scoring chips */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {[
                { range: '₽0–400',     label: 'Off-brief',    bg: G.redLight,    color: G.red    },
                { range: '₽400–1000',  label: 'Serviceable',  bg: G.yellowLight, color: G.yellow },
                { range: '₽1000–1600', label: 'Solid',        bg: G.blueLight,   color: G.blue   },
                { range: '₽1600–2000', label: 'Exceptional',  bg: G.greenLight,  color: G.green  },
              ].map(({ range, label, bg, color }) => (
                <div key={label} style={{ padding: '5px 12px', borderRadius: 16, background: bg, fontFamily: font, fontSize: 12, color, fontWeight: 500 }}>
                  {range} — {label}
                </div>
              ))}
            </div>

            {/* Composer */}
            <Card>
              {task.taskType === 'email' && (
                <EmailComposer onSubmit={handleSubmit} disabled={submitting} />
              )}
              {task.taskType === 'memo' && (
                <MemoComposer onSubmit={handleSubmit} disabled={submitting} />
              )}
              {(task.taskType === 'report' || task.taskType === 'review' || task.taskType === 'minutes') && (
                <FreeformComposer taskType={task.taskType} onSubmit={handleSubmit} disabled={submitting} />
              )}
            </Card>

            {/* Evaluating banner */}
            {submitting && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', borderRadius: 8, background: G.blueLight, fontFamily: font, fontSize: 13, color: G.blue, fontWeight: 500 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill={G.blue} style={{ animation: 'spin 0.8s linear infinite', flexShrink: 0 }}>
                  <path d="M12 4V2A10 10 0 0 0 2 12h2a8 8 0 0 1 8-8z"/>
                </svg>
                Evaluating your submission…
              </div>
            )}
          </div>
        )}

        {/* Result */}
        {state.kind === 'result' && !state.result.fired && <ResultView result={state.result} />}
        {state.kind === 'result' && state.result.fired && <FiredView letter={state.result.feedback} />}
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Google+Sans:wght@400;500;700&family=Roboto:wght@400;500&family=Roboto+Mono:wght@400;700&display=swap');
        * { box-sizing: border-box; }
        input, textarea, button { font-family: ${font}; -webkit-font-smoothing: antialiased; }
        input::placeholder, textarea::placeholder { color: ${G.textMuted}; }
        input:focus, textarea:focus { outline: none; }
        @keyframes shimmer {
          0%, 100% { opacity: 0.6; }
          50%       { opacity: 1; }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes firedIn {
          from { opacity: 0; transform: scale(1.04); }
          to   { opacity: 1; transform: scale(1); }
        }
        @keyframes firedPulse {
          0%, 100% { box-shadow: 0 0 0 12px rgba(217,48,37,.13), 0 0 0 24px rgba(217,48,37,.04); }
          50%       { box-shadow: 0 0 0 16px rgba(217,48,37,.2),  0 0 0 32px rgba(217,48,37,.07); }
        }
      `}</style>
    </div>
  )
}
