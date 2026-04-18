// Liquid OS — Transactions, Onboarding, Detail, Settings. All theme-aware.

const fs = '"Space Grotesk", system-ui, sans-serif';
const ms = '"JetBrains Mono", ui-monospace, monospace';

// ─── Transactions ───────────────────────────────────────────
function LiquidOSTransactions({ theme = 'dark', accent = LIQUID_ACCENTS[0] }) {
  const t = LIQUID_THEMES[theme];
  const aink = accent.inkOn[theme];
  const grouped = {};
  SAMPLE_TXNS.forEach(tx => { (grouped[tx.when] ||= []).push(tx); });

  return (
    <div style={{ ...liquidVars(accent, theme), background: t.bg, color: t.ink, fontFamily: fs, minHeight: '100%', paddingBottom: 36 }}>
      <div style={{ padding: '14px 20px 6px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <div style={{ fontSize: 30, fontWeight: 500, letterSpacing: -1.4, color: t.ink }}>Transactions</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10, color: t.mute, fontFamily: ms }}>
            <span style={{ width: 6, height: 6, borderRadius: 3, background: accent.v, boxShadow: `0 0 8px ${accent.v}` }}/>
            live
          </div>
        </div>
        <div style={{ fontSize: 11, color: t.mute, fontFamily: ms, marginTop: 4 }}>15 entries · 4 currencies · 5 banks</div>
      </div>

      <div style={{ margin: '14px 20px 0', padding: '11px 14px', background: t.surface, borderRadius: 16, display: 'flex', alignItems: 'center', gap: 10, border: `1px solid ${t.rule}` }}>
        <Icon name="search" size={15} color={t.mute}/>
        <span style={{ fontSize: 13, color: t.mute, fontFamily: ms }}>search merchants…</span>
      </div>

      <div style={{ padding: '12px 20px 8px', display: 'flex', gap: 6, overflowX: 'auto', scrollbarWidth: 'none' }}>
        {[
          { l: 'All', n: 15, on: true },
          { l: 'Spent', n: 13 }, { l: 'Received', n: 2 },
          { l: 'USD', n: 5 }, { l: 'EUR', n: 5 }, { l: 'GBP', n: 3 }, { l: 'INR', n: 3 },
        ].map(f => (
          <div key={f.l} style={{ padding: '7px 12px', borderRadius: 100,
            background: f.on ? accent.v : t.surface, color: f.on ? t.accentInk : t.inkDim,
            fontSize: 11, fontWeight: 600, flexShrink: 0, border: f.on ? 'none' : `1px solid ${t.rule}`,
            display: 'flex', alignItems: 'center', gap: 6 }}>
            {f.l}
            <span style={{ fontSize: 9, fontFamily: ms, opacity: 0.7 }}>{f.n}</span>
          </div>
        ))}
      </div>

      {Object.entries(grouped).map(([day, txns]) => {
        const daySpend = txns.filter(x => x.type === 'DEBIT').reduce((s,x) => s + (x.ccy === 'USD' ? x.amount : x.ccy === 'INR' ? x.amount * 0.012 : x.amount * 1.08), 0);
        return (
          <div key={day} style={{ margin: '8px 16px 12px', background: t.surface, borderRadius: 22, overflow: 'hidden', border: `1px solid ${t.rule}` }}>
            <div style={{ padding: '12px 16px 8px', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <div style={{ fontSize: 11, color: t.inkDim, fontFamily: ms, letterSpacing: 0.4, fontWeight: 500 }}>{day.toLowerCase()}</div>
              <div style={{ fontSize: 11, color: t.mute, fontFamily: ms }}>~${daySpend.toFixed(0)}</div>
            </div>
            {txns.map((tx, i) => (
              <div key={tx.id} style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12, borderTop: `1px solid ${t.rule}` }}>
                <div style={{ width: 36, height: 36, borderRadius: 12, background: t.surfaceHi, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name={CAT_ICON[tx.category]} size={15} color={tx.type === 'CREDIT' ? aink : t.ink} sw={1.7}/>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 500, color: t.ink, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tx.merchant}</div>
                  <div style={{ fontSize: 10, color: t.mute, fontFamily: ms, marginTop: 3 }}>{tx.sender.toLowerCase()} · {tx.city.toLowerCase()}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: tx.type === 'CREDIT' ? aink : t.ink, fontFamily: ms }}>
                    {tx.type === 'CREDIT' ? '+' : '−'}{fmtCcy(tx.amount, tx.ccy)}
                  </div>
                  <div style={{ fontSize: 9, color: t.mute, fontFamily: ms, marginTop: 2 }}>{tx.ccy}</div>
                </div>
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}

// ─── Onboarding (single screen — model download moment) ─────
function LiquidOSOnboarding({ theme = 'dark', accent = LIQUID_ACCENTS[0] }) {
  const t = LIQUID_THEMES[theme];
  const aink = accent.inkOn[theme];
  return (
    <div style={{ ...liquidVars(accent, theme), background: t.bg, backgroundImage: t.bgGlow, color: t.ink, fontFamily: fs, minHeight: '100%', display: 'flex', flexDirection: 'column', padding: '32px 24px 28px' }}>
      <div style={{ fontSize: 10, fontFamily: ms, color: aink, letterSpacing: 1.5, fontWeight: 600 }}>STEP 02 · 03</div>

      {/* Big logo blob */}
      <div style={{ marginTop: 28, alignSelf: 'flex-start', width: 92, height: 92, borderRadius: 28, background: accent.v, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 0 50px ${accent.v}80, inset 0 -8px 30px ${t.accentInk}20`, position: 'relative' }}>
        <span style={{ fontSize: 50, fontWeight: 600, color: t.accentInk, fontFamily: fs, letterSpacing: -2 }}>s</span>
        <div style={{ position: 'absolute', top: -10, right: -10, width: 30, height: 30, borderRadius: 15, background: t.surface, border: `2px solid ${t.bg}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="chip" size={14} color={accent.v}/>
        </div>
      </div>

      <div style={{ fontSize: 36, fontWeight: 500, letterSpacing: -1.5, lineHeight: 1.05, marginTop: 24, color: t.ink }}>
        Download the<br/>AI brain
      </div>
      <div style={{ fontSize: 14, color: t.inkDim, lineHeight: 1.5, marginTop: 12, maxWidth: 320 }}>
        A 1.2-billion parameter model. Lives on your phone forever after this.
        Reads bank SMS, sees nothing else.
      </div>

      {/* Spec card */}
      <div style={{ marginTop: 24, background: t.surface, borderRadius: 20, padding: 16, border: `1px solid ${t.rule}` }}>
        {[
          ['model',     'lfm2-1.2b-instruct'],
          ['quant',     'q4_k_m gguf'],
          ['size',      '~700 MB'],
          ['ram',       '~5 GB at inference'],
          ['cloud calls', 'zero', aink],
        ].map(([k, v, color], i, arr) => (
          <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderTop: i === 0 ? 'none' : `1px solid ${t.rule}`, fontFamily: ms, fontSize: 12 }}>
            <span style={{ color: t.mute }}>{k}</span>
            <span style={{ color: color || t.ink, fontWeight: 600 }}>{v}</span>
          </div>
        ))}
      </div>

      {/* Progress mid-download */}
      <div style={{ marginTop: 22 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontFamily: ms, color: t.inkDim, marginBottom: 6 }}>
          <span>downloading…</span>
          <span style={{ color: aink, fontWeight: 600 }}>62% · 434 / 700 mb</span>
        </div>
        <div style={{ height: 6, background: t.chipBg, borderRadius: 3, overflow: 'hidden' }}>
          <div style={{ width: '62%', height: '100%', background: accent.v, borderRadius: 3, boxShadow: `0 0 12px ${accent.v}` }}/>
        </div>
      </div>

      <div style={{ flex: 1 }}/>
      <div style={{ fontSize: 10, fontFamily: ms, color: t.mute, textAlign: 'center', marginTop: 16, lineHeight: 1.6 }}>
        wi-fi recommended · one-time download<br/>
        nothing leaves your device after this
      </div>
    </div>
  );
}

// ─── Transaction Detail ─────────────────────────────────────
function LiquidOSDetail({ theme = 'dark', accent = LIQUID_ACCENTS[0] }) {
  const t = LIQUID_THEMES[theme];
  const aink = accent.inkOn[theme];
  const tx = SAMPLE_TXNS[0]; // Nando's
  return (
    <div style={{ ...liquidVars(accent, theme), background: t.bg, color: t.ink, fontFamily: fs, minHeight: '100%', paddingBottom: 32 }}>
      {/* nav */}
      <div style={{ padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ width: 36, height: 36, borderRadius: 18, background: t.surface, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${t.rule}` }}>
          <span style={{ fontSize: 16, color: t.ink, transform: 'rotate(180deg)' }}>›</span>
        </div>
        <div style={{ fontSize: 11, color: t.mute, fontFamily: ms }}>tx_a4f9b2</div>
        <div style={{ width: 36, height: 36, borderRadius: 18, background: t.surface, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${t.rule}` }}>
          <Icon name="dots" size={16} color={t.ink}/>
        </div>
      </div>

      {/* Hero */}
      <div style={{ padding: '20px 24px 28px', textAlign: 'center' }}>
        <div style={{ width: 72, height: 72, borderRadius: 22, background: `${accent.v}22`, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 18 }}>
          <Icon name={CAT_ICON[tx.category]} size={32} color={accent.v} sw={1.6}/>
        </div>
        <div style={{ fontSize: 13, color: t.mute, fontFamily: ms, marginBottom: 4 }}>debit · {tx.sender.toLowerCase()}</div>
        <div style={{ fontSize: 56, fontWeight: 500, letterSpacing: -2.5, fontVariantNumeric: 'tabular-nums', color: t.ink, lineHeight: 1 }}>
          −{fmtCcy(tx.amount, tx.ccy)}
        </div>
        <div style={{ fontSize: 18, fontWeight: 500, color: t.ink, marginTop: 14 }}>{tx.merchant}</div>
        <div style={{ fontSize: 12, color: t.mute, marginTop: 4 }}>{tx.when} · {tx.city}</div>
      </div>

      {/* Confidence pill */}
      <div style={{ margin: '0 16px 16px', padding: '12px 14px', background: t.surface, borderRadius: 16, display: 'flex', alignItems: 'center', gap: 12, border: `1px solid ${t.rule}` }}>
        <div style={{ width: 36, height: 36, borderRadius: 12, background: `${accent.v}22`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="check" size={16} color={aink}/>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 12, color: t.ink, fontWeight: 600 }}>AI classified · 94% confidence</div>
          <div style={{ fontSize: 10, color: t.mute, fontFamily: ms, marginTop: 2 }}>category: food_dining · review</div>
        </div>
      </div>

      {/* Detail rows */}
      <div style={{ margin: '0 16px', padding: '4px 16px', background: t.surface, borderRadius: 20, border: `1px solid ${t.rule}` }}>
        {[
          ['category',  'Food & Dining'],
          ['type',      'DEBIT'],
          ['account',   '····4421'],
          ['balance',   '£1,284.50'],
          ['sender',    'BARCLAYS'],
          ['received',  'Apr 18, 1:11 PM'],
          ['inferred',  'Apr 18, 1:12 PM (78s)', aink],
        ].map(([k, v, color], i, arr) => (
          <div key={k} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderTop: i === 0 ? 'none' : `1px solid ${t.rule}`, fontSize: 13 }}>
            <span style={{ color: t.mute, fontFamily: ms, fontSize: 11 }}>{k}</span>
            <span style={{ color: color || t.ink, fontWeight: 500, fontFamily: i === 6 ? ms : fs, fontSize: i === 6 ? 11 : 13 }}>{v}</span>
          </div>
        ))}
      </div>

      {/* Original SMS */}
      <div style={{ margin: '16px 16px 0' }}>
        <div style={{ fontSize: 10, color: t.mute, fontFamily: ms, marginBottom: 8, paddingLeft: 4, letterSpacing: 1, textTransform: 'uppercase' }}>original sms</div>
        <div style={{ background: t.surfaceLo, borderRadius: 16, padding: 16, border: `1px solid ${t.rule}`, fontSize: 12, color: t.inkDim, fontFamily: ms, lineHeight: 1.6 }}>
          BARCLAYS: You spent £24.80 at NANDOS PERI PERI on 18-APR. New balance £1,284.50. If not you, call 0345 600 1234.
        </div>
      </div>
    </div>
  );
}

// ─── Settings ───────────────────────────────────────────────
function LiquidOSSettings({ theme = 'dark', accent = LIQUID_ACCENTS[0] }) {
  const t = LIQUID_THEMES[theme];
  const aink = accent.inkOn[theme];
  return (
    <div style={{ ...liquidVars(accent, theme), background: t.bg, color: t.ink, fontFamily: fs, minHeight: '100%', paddingBottom: 32 }}>
      <div style={{ padding: '14px 20px 8px' }}>
        <div style={{ fontSize: 28, fontWeight: 500, letterSpacing: -1.2 }}>Settings</div>
      </div>

      {/* Import card */}
      <div style={{ margin: '12px 16px 14px', padding: 18, background: t.surface, borderRadius: 22, border: `1px solid ${t.rule}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600 }}>Import SMS history</div>
            <div style={{ fontSize: 11, color: t.mute, marginTop: 2, fontFamily: ms }}>scan · classify · store locally</div>
          </div>
          <div style={{ padding: '5px 10px', background: `${accent.v}22`, color: aink, borderRadius: 100, fontSize: 10, fontFamily: ms, fontWeight: 600 }}>idle</div>
        </div>
        <div style={{ marginTop: 14, display: 'flex', gap: 6 }}>
          {['7d','30d','90d','180d'].map((p, i) => (
            <div key={p} style={{ flex: 1, padding: '9px 0', textAlign: 'center', borderRadius: 12, background: i === 1 ? accent.v : t.chipBg, color: i === 1 ? t.accentInk : t.inkDim, fontSize: 12, fontFamily: ms, fontWeight: 600 }}>{p}</div>
          ))}
        </div>
        <button style={{ marginTop: 14, width: '100%', padding: '14px 0', background: t.ink === '#f2f2f5' ? '#f2f2f5' : t.ink, color: t.bg, border: 'none', borderRadius: 14, fontSize: 13, fontWeight: 600, fontFamily: fs, cursor: 'pointer' }}>
          Import 30 days →
        </button>
      </div>

      {/* AI model card */}
      <div style={{ margin: '0 16px 14px', padding: 18, background: t.surface, borderRadius: 22, border: `1px solid ${t.rule}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div style={{ fontSize: 14, fontWeight: 600 }}>AI model</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 8px', background: `${accent.v}22`, borderRadius: 100, fontSize: 10, fontFamily: ms, color: aink, fontWeight: 600 }}>
            <span style={{ width: 6, height: 6, borderRadius: 3, background: accent.v, boxShadow: `0 0 8px ${accent.v}` }}/>
            loaded
          </div>
        </div>
        {[
          ['model',  'lfm2-1.2b-instruct'],
          ['quant',  'q4_k_m'],
          ['size',   '~700 MB'],
          ['cloud calls', 'zero', aink],
        ].map(([k, v, color], i) => (
          <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 0', borderTop: i === 0 ? 'none' : `1px solid ${t.rule}`, fontFamily: ms, fontSize: 12 }}>
            <span style={{ color: t.mute }}>{k}</span>
            <span style={{ color: color || t.ink, fontWeight: 500 }}>{v}</span>
          </div>
        ))}
      </div>

      {/* Privacy card */}
      <div style={{ margin: '0 16px 14px', padding: 18, background: t.surface, borderRadius: 22, border: `1px solid ${t.rule}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
          <Icon name="shield" size={18} color={aink} sw={1.7}/>
          <div style={{ fontSize: 14, fontWeight: 600 }}>Privacy</div>
        </div>
        <div style={{ fontSize: 12, color: t.inkDim, lineHeight: 1.6 }}>
          All processing happens on this device using the LFM2 model. The internet
          connection is used only for the one-time model download. Your messages,
          transactions and patterns never leave your phone.
        </div>
      </div>

      <div style={{ textAlign: 'center', fontSize: 10, fontFamily: ms, color: t.mute, marginTop: 18 }}>
        somus v1.0.0 · build 2026.04.18
      </div>
    </div>
  );
}

Object.assign(window, { LiquidOSTransactions, LiquidOSOnboarding, LiquidOSDetail, LiquidOSSettings });
