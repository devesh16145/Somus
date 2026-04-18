// Liquid OS — Dashboard. Theme-aware, 3 hero variants.

const fontStack = '"Space Grotesk", system-ui, sans-serif';
const monoStack = '"JetBrains Mono", ui-monospace, monospace';

// ─── Hero variants ───────────────────────────────────────────
function HeroBlob({ t, accent, aink, m }) {
  // Original — gradient blob card.
  return (
    <div style={{ margin: '8px 16px 18px', borderRadius: 32, padding: '28px 22px 24px',
      background: `linear-gradient(160deg, ${accent.v} 0%, color-mix(in oklch, ${accent.v}, #2a9d6b 50%) 60%, color-mix(in oklch, ${accent.v}, #1a6b48 70%) 100%)`,
      color: t.accentInk, position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: -60, right: -40, width: 200, height: 200, borderRadius: '50%', background: 'rgba(255,255,255,0.20)', filter: 'blur(40px)' }}/>
      <div style={{ fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', fontWeight: 700, opacity: 0.75 }}>April spend · live</div>
      <div style={{ fontSize: 70, fontWeight: 500, letterSpacing: -3.5, marginTop: 8, lineHeight: 0.95, fontVariantNumeric: 'tabular-nums', fontFamily: fontStack }}>
        ${m.monthSpend.toLocaleString()}
      </div>
      <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
        <div style={{ padding: '3px 8px', background: t.accentInk, color: accent.v, borderRadius: 6, fontFamily: monoStack, fontSize: 11 }}>
          {Math.round(m.monthSpend/m.budget*100)}% of ${m.budget}
        </div>
        <span style={{ opacity: 0.7 }}>· 12 days left</span>
      </div>
      <svg width="100%" height="44" viewBox="0 0 320 44" style={{ marginTop: 16 }}>
        <polyline points={m.weekTrend.map((v,i) => `${i * (320/6)},${44 - (v/Math.max(...m.weekTrend))*38 - 4}`).join(' ')} fill="none" stroke={t.accentInk} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        {m.weekTrend.map((v,i) => (
          <circle key={i} cx={i * (320/6)} cy={44 - (v/Math.max(...m.weekTrend))*38 - 4} r={i === m.weekTrend.length-1 ? 4 : 2} fill={t.accentInk}/>
        ))}
      </svg>
    </div>
  );
}

function HeroEditorial({ t, accent, aink, m }) {
  // Borrowed from Ledger — Fraunces big sum, no gradient. Single editorial moment.
  return (
    <div style={{ padding: '28px 22px 22px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', color: t.mute, fontWeight: 600 }}>April · month to date</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 8px', background: t.chipBg, borderRadius: 100, fontSize: 10, fontFamily: monoStack, color: t.inkDim }}>
          <span style={{ width: 6, height: 6, borderRadius: 3, background: accent.v, boxShadow: `0 0 8px ${accent.v}` }}/>
          live
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginTop: 8 }}>
        <span style={{ fontSize: 22, fontWeight: 500, color: t.inkDim, fontFamily: fontStack }}>$</span>
        <span style={{ fontFamily: '"Fraunces", serif', fontSize: 78, fontWeight: 400, letterSpacing: -3.5, lineHeight: 0.92, fontVariantNumeric: 'tabular-nums', color: t.ink }}>
          {m.monthSpend.toLocaleString()}
        </span>
      </div>
      <div style={{ marginTop: 12, fontSize: 13, color: t.inkDim, fontFamily: '"Fraunces", serif', fontStyle: 'italic' }}>
        of ${m.budget.toLocaleString()} budget · <span style={{ color: aink, fontWeight: 600, fontStyle: 'normal', fontFamily: fontStack }}>+${(m.monthIncome - m.monthSpend).toLocaleString()}</span> net
      </div>
      {/* slim segmented bar */}
      <div style={{ marginTop: 18, height: 6, background: t.chipBg, borderRadius: 3, overflow: 'hidden', position: 'relative' }}>
        <div style={{ position: 'absolute', inset: 0, width: `${m.monthSpend/m.budget*100}%`, background: accent.v, borderRadius: 3, boxShadow: `0 0 12px ${accent.v}80` }}/>
      </div>
      <div style={{ marginTop: 8, display: 'flex', justifyContent: 'space-between', fontSize: 10, fontFamily: monoStack, color: t.mute }}>
        <span>{Math.round(m.monthSpend/m.budget*100)}% drawn</span>
        <span>12 days remaining</span>
      </div>
    </div>
  );
}

function HeroLedgerBubbles({ t, accent, aink, m }) {
  // Numbered + tabular hero, with category bubbles directly under (Ledger × Liquid hybrid).
  return (
    <div style={{ padding: '24px 22px 8px' }}>
      <div style={{ fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', color: t.mute, fontWeight: 600 }}>Outlay · April</div>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: 6, gap: 14 }}>
        <div style={{ fontSize: 60, fontWeight: 500, letterSpacing: -2.5, lineHeight: 0.95, fontVariantNumeric: 'tabular-nums', fontFamily: fontStack, color: t.ink }}>
          ${m.monthSpend.toLocaleString()}
        </div>
        <div style={{ textAlign: 'right', paddingBottom: 6 }}>
          <div style={{ fontSize: 10, fontFamily: monoStack, color: t.mute }}>net</div>
          <div style={{ fontSize: 18, fontWeight: 600, color: aink, fontVariantNumeric: 'tabular-nums' }}>
            +${(m.monthIncome - m.monthSpend).toLocaleString()}
          </div>
        </div>
      </div>

      {/* horizontal bubble band */}
      <div style={{ marginTop: 22, display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4, scrollbarWidth: 'none' }}>
        {m.topCats.slice(0, 6).map((c, i) => {
          const isTop = i === 0;
          const size = 78 - i * 4;
          return (
            <div key={c.key} style={{ flexShrink: 0, width: size, height: size, borderRadius: '50%',
              background: isTop ? accent.v : t.surface,
              color: isTop ? t.accentInk : t.ink,
              border: isTop ? 'none' : `1px solid ${t.rule}`,
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              padding: 4, textAlign: 'center', boxShadow: isTop ? `0 0 24px ${accent.v}55` : 'none' }}>
              <Icon name={CAT_ICON[c.key]} size={14} color={isTop ? t.accentInk : accent.v} sw={1.7}/>
              <div style={{ fontSize: 8, fontWeight: 700, marginTop: 2, letterSpacing: 0.3 }}>{c.label.split(' ')[0].toUpperCase()}</div>
              <div style={{ fontSize: 9, fontFamily: monoStack, opacity: 0.75 }}>${c.amount}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const HEROES = { blob: HeroBlob, editorial: HeroEditorial, ledger: HeroLedgerBubbles };

// ─── Dashboard ───────────────────────────────────────────────
function LiquidOSDashboard({ theme = 'dark', accent = LIQUID_ACCENTS[0], hero = 'editorial' }) {
  const t = LIQUID_THEMES[theme];
  const aink = accent.inkOn[theme]; // accent color safe to use as text in this theme
  const m = SOMUS_METRICS;
  const HeroCmp = HEROES[hero];

  return (
    <div style={{ ...liquidVars(accent, theme), background: t.bg, backgroundImage: t.bgGlow, color: t.ink, fontFamily: fontStack, minHeight: '100%', paddingBottom: 28 }}>
      {/* Top strip */}
      <div style={{ padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 26, height: 26, borderRadius: 13, background: accent.v, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 0 14px ${accent.v}80` }}>
            <span style={{ fontWeight: 700, fontSize: 13, color: t.accentInk, letterSpacing: -0.5 }}>s</span>
          </div>
          <span style={{ fontSize: 14, fontWeight: 600, letterSpacing: -0.4 }}>somus</span>
          <span style={{ fontSize: 10, color: t.mute, fontFamily: monoStack, marginLeft: 4 }}>v1.0</span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <div style={{ padding: '5px 10px', background: t.chipBg, borderRadius: 100, fontSize: 10, fontFamily: monoStack, color: t.inkDim, display: 'flex', alignItems: 'center', gap: 4 }}>
            <Icon name="wifi-off" size={11} color={t.inkDim} sw={1.8}/> offline
          </div>
          <div style={{ width: 32, height: 32, borderRadius: 16, background: t.surface, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="cog" size={14} color={t.inkDim}/>
          </div>
        </div>
      </div>

      <HeroCmp t={t} accent={accent} aink={aink} m={m}/>

      {/* Pending banner */}
      <div style={{ margin: '6px 16px 16px', padding: '14px 14px 14px 16px', background: t.surface, borderRadius: 20, display: 'flex', alignItems: 'center', gap: 12, border: `1px solid ${t.rule}` }}>
        <div style={{ width: 38, height: 38, borderRadius: 12, background: `${accent.v}22`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="chip" size={18} color={accent.v}/>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: t.ink }}>{m.pending} new messages pending</div>
          <div style={{ fontSize: 10, color: t.mute, fontFamily: monoStack, marginTop: 2 }}>lfm2-1.2b · ~60–90s/sms · on-device</div>
        </div>
        <button style={{ background: accent.v, color: t.accentInk, border: 'none', borderRadius: 100, padding: '8px 14px', fontSize: 12, fontWeight: 700, fontFamily: fontStack, cursor: 'pointer' }}>Run →</button>
      </div>

      {/* Numbered ledger of categories — Ledger-borrowed pattern */}
      <div style={{ padding: '0 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
          <div style={{ fontSize: 17, fontWeight: 600, letterSpacing: -0.4, color: t.ink }}>Where it went</div>
          <div style={{ fontSize: 10, color: aink, fontFamily: monoStack, fontWeight: 500 }}>&gt; all_cats</div>
        </div>
        <div style={{ borderTop: `1px solid ${t.ruleStrong}` }}>
          {m.topCats.slice(0, 5).map((c, i) => (
            <div key={c.key} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: `1px solid ${t.rule}` }}>
              <div style={{ fontSize: 10, color: t.mute, fontFamily: monoStack, width: 18, fontVariantNumeric: 'tabular-nums' }}>{String(i+1).padStart(2,'0')}</div>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: t.chipBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon name={CAT_ICON[c.key]} size={14} color={t.ink} sw={1.7}/>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: t.ink }}>{c.label}</div>
                <div style={{ marginTop: 4, height: 2, background: t.chipBg, borderRadius: 1, overflow: 'hidden' }}>
                  <div style={{ width: `${c.pct * 3.4}%`, maxWidth: '100%', height: '100%', background: accent.v, boxShadow: `0 0 8px ${accent.v}80` }}/>
                </div>
              </div>
              <div style={{ fontSize: 13, fontVariantNumeric: 'tabular-nums', fontWeight: 600, color: t.ink, fontFamily: monoStack, minWidth: 50, textAlign: 'right' }}>${c.amount}</div>
              <div style={{ fontSize: 10, color: t.mute, fontFamily: monoStack, width: 26, textAlign: 'right' }}>{c.pct}%</div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent quick-strip */}
      <div style={{ margin: '20px 16px 0', padding: 14, background: t.surface, borderRadius: 20, border: `1px solid ${t.rule}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: t.ink }}>Recent</span>
          <span style={{ fontSize: 10, color: t.mute, fontFamily: monoStack }}>last 24h</span>
        </div>
        {SAMPLE_TXNS.slice(0, 3).map((tx, i) => (
          <div key={tx.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderTop: i === 0 ? 'none' : `1px solid ${t.rule}` }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: t.chipBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name={CAT_ICON[tx.category]} size={13} color={t.inkDim} sw={1.7}/>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 500, color: t.ink, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tx.merchant}</div>
              <div style={{ fontSize: 9, color: t.mute, fontFamily: monoStack, marginTop: 2 }}>{tx.sender.toLowerCase()} · {tx.when.toLowerCase()}</div>
            </div>
            <div style={{ fontSize: 13, fontWeight: 600, color: tx.type === 'CREDIT' ? aink : t.ink, fontFamily: monoStack }}>
              {tx.type === 'CREDIT' ? '+' : '−'}{fmtCcy(tx.amount, tx.ccy)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

Object.assign(window, { LiquidOSDashboard, HEROES });
