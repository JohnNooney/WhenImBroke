import type { FinancialData, RunwayResult } from '../../types';
import { formatCurrency, formatDate } from '../../utils/formatting';
import { Tooltip } from '../ui';

interface MetricsGridProps {
  data: FinancialData;
  result: RunwayResult;
}

type ValueColor = 'ok' | 'warn' | 'danger' | 'neutral';

function getValueColor(type: ValueColor) {
  switch (type) {
    case 'ok': return 'var(--color-ok)';
    case 'warn': return 'var(--color-warn)';
    case 'danger': return 'var(--color-danger)';
    default: return 'var(--color-text-primary)';
  }
}

function getSurplusColor(monthlySavings: number): ValueColor {
  if (monthlySavings > 500) return 'ok';
  if (monthlySavings > 0) return 'warn';
  return 'danger';
}

export function MetricsGrid({ data, result }: MetricsGridProps) {
  const today = new Date();
  
  // Consistent month calculation (inclusive of both start and end month)
  const monthsFromNow = (date: Date | null) => {
    if (!date) return 0;
    const months = (date.getFullYear() - today.getFullYear()) * 12 + (date.getMonth() - today.getMonth()) + 1;
    return Math.max(0, months);
  };

  const nextMilestone = (() => {
    if (result.depletionDate) {
      const moAway = monthsFromNow(result.depletionDate);
      return { label: 'Breaks', value: formatDate(result.depletionDate), sub: `${moAway} mo away`, color: 'danger' as const, tooltip: 'When savings will run out at current spending trajectory.' };
    }
    if (result.lastSafeDate) {
      const moAway = monthsFromNow(result.lastSafeDate);
      return { label: 'Ready', value: formatDate(result.lastSafeDate), sub: moAway > 0 ? `${moAway} mo away` : 'Now', color: 'ok' as const, tooltip: 'Target reached & debt-free — safe to enter consumption mode.' };
    }
    return { label: 'Runway', value: '∞', sub: 'Sustainable', color: 'neutral' as const, tooltip: 'Savings will not deplete within the 20-year projection window.' };
  })();

  return (
    <div className="metric-grid">
      <div className="metric">
        <div className="label">Savings <Tooltip text="Your current savings balance. Baseline for all runway and depletion projections." /></div>
        <div className="value" style={{ color: getValueColor('ok') }}>
          {formatCurrency(data.currentSavings)}
        </div>
        {data.currentSavings >= data.savingsTarget && data.savingsTarget > 0 ? (
          <div className="metric-sub" style={{ color: getValueColor('ok') }}>Target met</div>
        ) : result.targetReachedDate ? (
          <div className="metric-sub">→ {formatCurrency(data.savingsTarget)} by {formatDate(result.targetReachedDate)}</div>
        ) : null}
      </div>
      <div className="metric">
        <div className="label">Monthly net <Tooltip text="Income minus all expenses including debt repayments. Positive means you're building savings each month." /></div>
        <div className="value" style={{ color: getValueColor(getSurplusColor(result.monthlySavings)) }}>
          {result.monthlySavings >= 0 ? '+' : ''}{formatCurrency(result.monthlySavings)}
        </div>
        {data.totalDebt > 0 && data.monthlyDebtRepayment > 0 && (() => {
          const afterDebt = data.monthlyIncome - result.livingExpenses - data.monthlySavingsContribution;
          return (
            <div className="metric-sub">
              → <span style={{ color: getValueColor(afterDebt > 500 ? 'ok' : afterDebt > 0 ? 'warn' : 'danger') }}>
                {afterDebt >= 0 ? '+' : ''}{formatCurrency(afterDebt)}
              </span> after debt-free
            </div>
          );
        })()}
      </div>
      <div className="metric">
        <div className="label">Runway <Tooltip text="Months your current savings would last if income stopped today, spending only on living expenses." /></div>
        <div className="value">
          {result.runwayMonths === Infinity ? '∞' : `${result.runwayMonths} mo`}
        </div>
        {data.savingsTarget > 0 && result.targetRunwayMonths !== result.runwayMonths && (
          <div className="metric-sub">
            → {result.targetRunwayMonths === Infinity ? '∞' : `${result.targetRunwayMonths} mo`} at target
          </div>
        )}
      </div>
      <div className="metric">
        <div className="label">{nextMilestone.label} <Tooltip text={nextMilestone.tooltip} /></div>
        <div className="value" style={{ color: getValueColor(nextMilestone.color) }}>
          {nextMilestone.value}
        </div>
        <div className="metric-sub">{nextMilestone.sub}</div>
      </div>
    </div>
  );
}
