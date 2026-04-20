import { useState } from 'react';
import type { FinancialData, RunwayResult, MonthProjection } from '../../types';
import { formatCurrency, formatDate } from '../../utils/formatting';
import { Section } from '../ui';

interface ProjectionChartProps {
  result: RunwayResult;
  data: FinancialData;
}

export function ProjectionChart({ result, data }: ProjectionChartProps) {
  const [selected, setSelected] = useState<MonthProjection | null>(null);

  // Show until 2 months past depletion, or 36 months, whichever is less
  const deplIdx = result.projections.findIndex(p => p.phase === 'depleted');
  const displayCount = Math.min(
    deplIdx >= 0 ? deplIdx + 3 : 36,
    result.projections.length,
  );
  const projections = result.projections.slice(0, displayCount);
  if (projections.length === 0) return null;

  const maxBalance = Math.max(...projections.map(p => p.savingsBalance));
  const effectiveMax = Math.max(maxBalance, data.savingsTarget, 1);

  const phaseColor = (phase: MonthProjection['phase']) => {
    if (phase === 'comfortable') return 'var(--color-ok)';
    if (phase === 'caution') return 'var(--color-warn)';
    if (phase === 'critical') return 'var(--color-danger)';
    return 'var(--color-border-secondary)';
  };

  // Find milestone indices within displayed range
  const findMilestoneIdx = (date: Date | null) => {
    if (!date) return -1;
    const idx = projections.findIndex(p => p.date >= date);
    return idx;
  };
  const debtFreeIdx = findMilestoneIdx(result.debtFreeDate);
  const lastSafeIdx = findMilestoneIdx(result.lastSafeDate);
  const shownDeplIdx = deplIdx >= 0 && deplIdx < displayCount ? deplIdx : -1;
  const targetReachedIdx = findMilestoneIdx(result.targetReachedDate);

  const showDebtFree = debtFreeIdx >= 0 && data.totalDebt > 0;
  const showTargetReached = targetReachedIdx >= 0 && data.savingsTarget > 0 && data.currentSavings < data.savingsTarget;

  const markerLeft = (idx: number) =>
    `${((idx + 0.5) / projections.length) * 100}%`;

  // Collect visible milestones and compute label stacking
  const milestones: Array<{ idx: number; label: string; color: string; labelTop: number }> = [];
  if (showDebtFree) milestones.push({ idx: debtFreeIdx, label: 'debt-free', color: 'var(--color-warn)', labelTop: 2 });
  if (lastSafeIdx >= 0) milestones.push({ idx: lastSafeIdx, label: 'ready', color: 'var(--color-ok)', labelTop: 2 });
  if (shownDeplIdx >= 0) milestones.push({ idx: shownDeplIdx, label: 'broke', color: 'var(--color-danger)', labelTop: 2 });
  milestones.sort((a, b) => a.idx - b.idx);
  const LABEL_H = 14;
  const CLOSE_IDX = 2;
  const anchorDir = (idx: number) => idx > projections.length * 0.7 ? 'right' : 'left';
  for (let i = 1; i < milestones.length; i++) {
    for (let j = i - 1; j >= 0; j--) {
      if (Math.abs(milestones[i].idx - milestones[j].idx) <= CLOSE_IDX && anchorDir(milestones[i].idx) === anchorDir(milestones[j].idx)) {
        milestones[i].labelTop = Math.max(milestones[i].labelTop, milestones[j].labelTop + LABEL_H);
      }
    }
  }
  // Extra gap so the lowest label clears the tallest bar
  const BAR_GAP = 8;
  const labelStackHeight = milestones.length > 0
    ? Math.max(...milestones.map(m => m.labelTop)) + 12
    : 0;
  const milestoneExt = labelStackHeight + BAR_GAP;

  // Savings target line height (% from bottom)
  const targetLinePct = data.savingsTarget > 0
    ? Math.min((data.savingsTarget / effectiveMax) * 100, 99)
    : null;

  return (
    <Section title="Savings over time">
      {/* Y-axis reference */}
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>
        <span>Maximum: {formatCurrency(effectiveMax)}</span>
        
        <span>£0</span>
      </div>

      {/* Chart area */}
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: '2px', height: '120px', position: 'relative', overflow: 'visible', marginTop: milestoneExt > 0 ? milestoneExt : undefined }}>

        {/* Savings target horizontal line */}
        {targetLinePct !== null && (
          <div style={{
            position: 'absolute', left: 0, right: 0,
            bottom: `${targetLinePct}%`,
            borderTop: '1px dashed color-mix(in srgb, var(--color-ok) 45%, transparent)',
            pointerEvents: 'none',
            zIndex: 3,
          }}>
            {showTargetReached && (
              <span style={{
                position: 'absolute',
                top: -16,
                left: 4,
                fontSize: '10px',
                color: 'var(--color-ok)',
                whiteSpace: 'nowrap',
                lineHeight: 1,
                opacity: 1,
              }}>target</span>
            )}
          </div>
        )}

        {/* Milestone vertical lines */}
        {milestones.map((m, i) => {
          const anchorRight = m.idx > projections.length * 0.7;
          return (
            <div key={i} style={{
              position: 'absolute',
              top: `-${milestoneExt}px`,
              bottom: 0,
              left: markerLeft(m.idx),
              borderLeft: `1px dashed ${m.color}`,
              opacity: 0.7,
              pointerEvents: 'none',
              zIndex: 5,
            }}>
              <span style={{
                position: 'absolute',
                top: m.labelTop,
                ...(anchorRight ? { right: 4, left: 'auto' } : { left: 4 }),
                fontSize: '10px',
                color: m.color,
                whiteSpace: 'nowrap',
                lineHeight: 1,
              }}>{m.label}</span>
            </div>
          );
        })}

        {/* Bars */}
        {projections.map((p, i) => {
          const height = (p.savingsBalance / effectiveMax) * 100;
          const isSelected = selected?.month === p.month;
          return (
            <div
              key={i}
              onClick={() => setSelected(isSelected ? null : p)}
              style={{
                flex: 1,
                height: `${Math.max(height, 1.5)}%`,
                background: phaseColor(p.phase),
                borderRadius: '2px 2px 0 0',
                minWidth: '4px',
                cursor: 'pointer',
                position: 'relative',
                zIndex: 2,
                outline: isSelected ? '2px solid var(--color-text-primary)' : 'none',
                outlineOffset: '2px',
                opacity: selected && !isSelected ? 0.5 : 1,
                transition: 'opacity 0.1s',
              }}
            />
          );
        })}
      </div>

      {/* X-axis labels */}
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
        <span>{formatDate(projections[0].date)}</span>
        <span>{formatDate(projections[projections.length - 1].date)}</span>
      </div>

      {/* Phase legend */}
      <div style={{ display: 'flex', gap: '12px', marginTop: '8px', flexWrap: 'wrap' }}>
        {(['comfortable', 'caution', 'critical', 'depleted'] as const).map(ph => (
          projections.some(p => p.phase === ph) && (
            <span key={ph} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: 'var(--color-text-secondary)' }}>
              <span style={{ width: 8, height: 8, borderRadius: '2px', background: phaseColor(ph), display: 'inline-block' }} />
              {ph}
            </span>
          )
        ))}
      </div>

      {/* Selected month detail */}
      {selected && (
        <div style={{
          marginTop: '10px',
          padding: '10px 12px',
          background: 'var(--color-background-secondary)',
          borderRadius: 'var(--border-radius-md)',
          fontSize: '13px',
          color: 'var(--color-text-secondary)',
          border: '0.5px solid var(--color-border-tertiary)',
        }}>
          <div style={{ fontWeight: 600, marginBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--color-text-primary)' }}>
            <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
              {formatDate(selected.date)} · Month {selected.month + 1} ·{' '}
              <span style={{ color: selected.mode === 'saving' ? 'var(--color-ok)' : 'var(--color-warn)' }}>
                {selected.mode === 'saving' ? 'Saving' : 'Consumption'}
              </span>
            </span>
            <button
              onClick={() => setSelected(null)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px', color: 'var(--color-text-secondary)', lineHeight: 1, padding: 0 }}
            >×</button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px' }}>
            <div>Balance <strong style={{ color: 'var(--color-text-primary)' }}>{formatCurrency(selected.savingsBalance)}</strong></div>
            <div>Phase <strong style={{ color: phaseColor(selected.phase) }}>{selected.phase}</strong></div>
            {selected.income > 0 && <div>Income <span style={{ color: 'var(--color-ok)' }}>+{formatCurrency(selected.income)}</span></div>}
            <div>Expenses <span style={{ color: 'var(--color-danger)' }}>−{formatCurrency(selected.expenses)}</span></div>
            {selected.debtPaid > 0 && <div>Debt paid <span style={{ color: 'var(--color-warn)' }}>−{formatCurrency(selected.debtPaid)}</span></div>}
            {selected.remainingDebt > 0 && <div>Debt left <span style={{ color: 'var(--color-danger)' }}>{formatCurrency(selected.remainingDebt)}</span></div>}
            <div style={{ color: 'var(--color-text-secondary)' }}>Net <strong style={{ color: selected.netChange >= 0 ? 'var(--color-ok)' : 'var(--color-danger)' }}>{selected.netChange >= 0 ? '+' : ''}{formatCurrency(selected.netChange)}</strong></div>
          </div>
        </div>
      )}
    </Section>
  );
}
