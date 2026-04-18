import type { FinancialData, RunwayResult } from '../../types';
import { formatCurrency } from '../../utils/formatting';

interface DashStripProps {
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

export function DashStrip({ data, result }: DashStripProps) {
  return (
    <div className="dash-strip">
      <div className="dash-item">
        <span className="dash-label">Income</span>
        <span className="dash-val" style={{ color: getValueColor('ok') }}>{formatCurrency(data.monthlyIncome)}/mo</span>
      </div>
      <div className="dash-sep" />
      <div className="dash-item">
        <span className="dash-label">Expenses</span>
        <span className="dash-val">{formatCurrency(result.monthlyExpenses)}/mo</span>
      </div>
      {data.totalDebt > 0 && (
        <>
          <div className="dash-sep" />
          <div className="dash-item">
            <span className="dash-label">Debt</span>
            <span className="dash-val" style={{ color: getValueColor('danger') }}>{formatCurrency(data.totalDebt)}</span>
          </div>
        </>
      )}
      <div className="dash-sep" />
      <div className="dash-item">
        <span className="dash-label">Burn rate</span>
        <span className="dash-val">{formatCurrency(result.livingExpenses)}/mo</span>
      </div>
      {data.monthlyIncome > 0 && (
        <>
          <div className="dash-sep" />
          <div className="dash-item">
            <span className="dash-label">Savings rate</span>
            <span className="dash-val" style={{ color: getValueColor(getSurplusColor(result.monthlySavings)) }}>
              {Math.round((result.monthlySavings / data.monthlyIncome) * 100)}%
            </span>
          </div>
        </>
      )}
    </div>
  );
}
