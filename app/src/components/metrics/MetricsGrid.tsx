import type { FinancialData, RunwayResult, DerivedMetrics } from '../../types';
import { formatCurrency, formatDate } from '../../utils/formatting';
import { getValueColor, getSurplusColor } from '../../utils/derived';
import { Tooltip } from '../ui';

interface MetricsGridProps {
  data: FinancialData;
  result: RunwayResult;
  derived: DerivedMetrics;
}

export function MetricsGrid({ data, result, derived }: MetricsGridProps) {
  return (
    <div className="metric-grid">
      <div className="metric">
        <div className="label">Savings <Tooltip text="Your current savings balance. Baseline for all runway and depletion projections." /></div>
        <div className="value" style={{ color: getValueColor('ok') }}>
          {formatCurrency(data.currentSavings)}
        </div>
        {derived.isTargetMet ? (
          <div className="metric-sub" style={{ color: getValueColor('ok') }}>Target met</div>
        ) : result.targetReachedDate ? (
          <div className="metric-sub">→ {formatCurrency(data.savingsTarget)} by {formatDate(result.targetReachedDate)}</div>
        ) : null}
      </div>
      <div className="metric">
        <div className="label">Monthly net <Tooltip text="Income minus all expenses including debt repayments. Positive means you're building savings each month." /></div>
        <div className="value" style={{ color: getValueColor(derived.surplusColor) }}>
          {result.monthlySavings >= 0 ? '+' : ''}{formatCurrency(result.monthlySavings)}
        </div>
        {data.totalDebt > 0 && data.monthlyDebtRepayment > 0 && (
          <div className="metric-sub">
            → <span style={{ color: getValueColor(getSurplusColor(derived.afterDebtSurplus)) }}>
              {derived.afterDebtSurplus >= 0 ? '+' : ''}{formatCurrency(derived.afterDebtSurplus)}
            </span> after debt-free
          </div>
        )}
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
        <div className="label">{derived.nextMilestone.label} <Tooltip text={derived.nextMilestone.tooltip} /></div>
        <div className="value" style={{ color: getValueColor(derived.nextMilestone.color) }}>
          {derived.nextMilestone.value}
        </div>
        <div className="metric-sub">{derived.nextMilestone.sub}</div>
      </div>
    </div>
  );
}
