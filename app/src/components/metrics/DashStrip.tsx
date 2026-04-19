import type { FinancialData, RunwayResult, DerivedMetrics } from '../../types';
import { formatCurrency } from '../../utils/formatting';
import { getValueColor, getSurplusColor } from '../../utils/derived';

interface DashStripProps {
  data: FinancialData;
  result: RunwayResult;
  derived: DerivedMetrics;
}

export function DashStrip({ data, result, derived }: DashStripProps) {
  const hasDebt = data.totalDebt > 0;
  const postDebtSavingsRate = data.monthlyIncome > 0
    ? Math.round((result.postDebtMonthlySavings / data.monthlyIncome) * 100)
    : 0;
  const consumptionRunway = result.targetRunwayMonths === Infinity ? '∞' : `${result.targetRunwayMonths}`;

  return (
    <div className="dash-strip">
      {/* Present day */}
      <div className="dash-group">
        <span className="dash-group-label">Now</span>
        <div className="dash-group-items">
          <div className="dash-item">
            <span className="dash-label">Surplus</span>
            <span className="dash-val" style={{ color: getValueColor(derived.surplusColor) }}>
              {formatCurrency(result.monthlySavings)}/mo
            </span>
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
          {hasDebt && (
            <>
              <div className="dash-sep" />
              <div className="dash-item">
                <span className="dash-label">Debt</span>
                <span className="dash-val" style={{ color: getValueColor('danger') }}>
                  {formatCurrency(data.totalDebt)}
                </span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* After debt paid — only show if there is debt */}
      {hasDebt && (
        <>
          <div className="dash-group-sep" />
          <div className="dash-group">
            <span className="dash-group-label">Debt-Free</span>
            <div className="dash-group-items">
              <div className="dash-item">
                <span className="dash-label">Surplus</span>
                <span className="dash-val" style={{ color: getValueColor(getSurplusColor(result.postDebtMonthlySavings)) }}>
                  {formatCurrency(result.postDebtMonthlySavings)}/mo
                </span>
              </div>
              {data.monthlyIncome > 0 && (
                <>
                  <div className="dash-sep" />
                  <div className="dash-item">
                    <span className="dash-label">Savings rate</span>
                    <span className="dash-val" style={{ color: getValueColor(getSurplusColor(result.postDebtMonthlySavings)) }}>
                      {postDebtSavingsRate}%
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>
        </>
      )}

      {/* Consumption phase */}
      <div className="dash-group-sep" />
      <div className="dash-group">
        <span className="dash-group-label">Consumption</span>
        <div className="dash-group-items">
          <div className="dash-item">
            <span className="dash-label">Burn rate</span>
            <span className="dash-val">{formatCurrency(result.livingExpenses)}/mo</span>
          </div>
          <div className="dash-sep" />
          <div className="dash-item">
            <span className="dash-label">Runway</span>
            <span className="dash-val">{consumptionRunway} mo</span>
          </div>
        </div>
      </div>
    </div>
  );
}
