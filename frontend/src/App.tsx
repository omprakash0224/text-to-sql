/**
 * DataSpeak — Base App Layout Component
 * Renders the top navigation bar and a placeholder hero section.
 * Will be expanded in Phase 5 with full sidebar, query input, and results panels.
 */

import { Database, Sparkles, Zap } from 'lucide-react'

function App() {
  return (
    <div className="flex flex-col min-h-dvh">
      {/* ── Top Navigation Bar ──────────────────────────────────────── */}
      <header
        className="ds-glass sticky top-0 z-50 flex items-center justify-between px-6 py-3"
        style={{ borderBottom: '1px solid var(--ds-border)' }}
      >
        {/* Logo + Brand */}
        <div className="flex items-center gap-3">
          <div
            className="flex items-center justify-center w-8 h-8 rounded-lg"
            style={{ background: 'linear-gradient(135deg, var(--ds-primary) 0%, var(--ds-accent) 100%)' }}
          >
            <Database size={16} className="text-white" />
          </div>
          <span className="font-semibold text-base tracking-tight" style={{ color: 'var(--ds-text-primary)' }}>
            Data<span style={{ color: 'var(--ds-primary-light)' }}>Speak</span>
          </span>
        </div>

        {/* Status pill */}
        <div
          className="flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium"
          style={{
            background: 'rgba(16, 185, 129, 0.12)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            color: 'var(--ds-success)',
          }}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          API Connected
        </div>

        {/* Auth placeholder */}
        <button
          className="flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-medium transition-all"
          style={{
            background: 'var(--ds-primary)',
            color: '#fff',
            transition: 'var(--ds-transition-fast)',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = 'var(--ds-primary-light)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'var(--ds-primary)')}
        >
          Sign In
        </button>
      </header>

      {/* ── Hero Section ────────────────────────────────────────────── */}
      <main className="flex flex-1 flex-col items-center justify-center px-6 py-20 ds-fade-in">
        {/* Glow orb */}
        <div
          className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full pointer-events-none"
          style={{
            background: 'radial-gradient(circle, rgba(124,58,237,0.18) 0%, transparent 70%)',
            filter: 'blur(40px)',
          }}
        />

        {/* Badge */}
        <div
          className="relative flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold mb-6"
          style={{
            background: 'rgba(124, 58, 237, 0.12)',
            border: '1px solid rgba(124, 58, 237, 0.35)',
            color: 'var(--ds-primary-light)',
          }}
        >
          <Sparkles size={12} />
          Powered by Groq + LangGraph
        </div>

        {/* Headline */}
        <h1 className="relative text-center text-5xl sm:text-6xl font-bold mb-4 leading-tight">
          Ask Your Database{' '}
          <span className="ds-gradient-text">Anything</span>
        </h1>

        {/* Sub-headline */}
        <p
          className="relative text-center text-lg max-w-xl mb-10"
          style={{ color: 'var(--ds-text-secondary)' }}
        >
          DataSpeak turns plain English into safe, read-only SQL — instantly. No SQL expertise required.
        </p>

        {/* CTA buttons */}
        <div className="relative flex flex-wrap gap-4 justify-center">
          <button
            className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm transition-all"
            style={{
              background: 'linear-gradient(135deg, var(--ds-primary) 0%, var(--ds-accent) 100%)',
              color: '#fff',
              boxShadow: 'var(--ds-shadow-glow)',
              transition: 'var(--ds-transition-normal)',
            }}
          >
            <Zap size={16} />
            Connect a Database
          </button>

          <button
            className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm transition-all ds-glass"
            style={{
              color: 'var(--ds-text-primary)',
              transition: 'var(--ds-transition-normal)',
            }}
          >
            <Database size={16} />
            Try Demo (SQLite)
          </button>
        </div>

        {/* Feature pills */}
        <div className="relative flex flex-wrap gap-3 justify-center mt-14">
          {[
            '🔒 Read-only guardrails',
            '⚡ Sub-second inference',
            '📊 Auto chart generation',
            '🌐 PostgreSQL · MySQL · SQLite',
            '📥 CSV export',
          ].map(feature => (
            <span
              key={feature}
              className="px-3 py-1 rounded-full text-xs font-medium"
              style={{
                background: 'var(--ds-bg-elevated)',
                border: '1px solid var(--ds-border)',
                color: 'var(--ds-text-secondary)',
              }}
            >
              {feature}
            </span>
          ))}
        </div>
      </main>

      {/* ── Footer ──────────────────────────────────────────────────── */}
      <footer
        className="text-center py-4 text-xs"
        style={{
          color: 'var(--ds-text-muted)',
          borderTop: '1px solid var(--ds-border)',
        }}
      >
        DataSpeak v0.1.0 · Phase 1 — Infrastructure ·{' '}
        <span style={{ color: 'var(--ds-primary-light)' }}>Development</span>
      </footer>
    </div>
  )
}

export default App
