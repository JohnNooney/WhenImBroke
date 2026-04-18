import type { FinancialData, RunwayResult, DerivedMetrics } from '../../types';
import { formatCurrency } from '../../utils/formatting';
import { getValueColor } from '../../utils/derived';

interface DashStripProps {
  data: FinancialData;
  result: RunwayResult;
  derived: DerivedMetrics;
}

export function DashStrip({ data, result, derived }: DashStripProps) {
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
            <span className="dash-val" style={{ color: getValueColor(derived.surplusColor) }}>
              {derived.savingsRate}%
            </span>
          </div>
        </>
      )}
    </div>
  );
}
