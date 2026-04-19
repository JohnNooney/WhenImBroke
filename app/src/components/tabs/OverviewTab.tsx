import { Wallet, TrendingDown, PiggyBank, Clock, ArrowRight } from 'lucide-react';
import type { FinancialData, RunwayResult, DerivedMetrics } from '../../types';
import { formatCurrency, formatDate } from '../../utils/formatting';
import { Section } from '../ui';

interface OverviewTabProps {
  data: FinancialData;
  result: RunwayResult;
  derived: DerivedMetrics;
  onTabChange: (tab: 'dashboard' | 'mymoney' | 'projection') => void;
}

export function OverviewTab({ data, result, derived, onTabChange }: OverviewTabProps) {
  const runwayText = result.runwayMonths === Infinity
    ? 'Sustainable'
    : `${result.runwayMonths} months`;

  const runwayColor = result.runwayMonths === Infinity
    ? 'var(--color-ok)'
    : result.runwayMonths > data.cautionThreshold
      ? 'var(--color-ok)'
      : result.runwayMonths > data.criticalThreshold
        ? 'var(--color-warn)'
        : 'var(--color-danger)';

  const depletionText = result.depletionDate
    ? formatDate(result.depletionDate)
    : 'Not within 20 years';

  const livingExpenses = data.rent + data.utilities + data.groceries +
    data.subscriptions + data.transport + data.pocketMoney;
  const surplus = data.monthlyIncome - livingExpenses - data.monthlyDebtRepayment - data.monthlySavingsContribution;

  return (
    <>
      {/* Hero summary */}
      <div className="dashboard-hero">
        <div className="dashboard-hero-label">Current runway</div>
        <div className="dashboard-hero-value" style={{ color: runwayColor }}>
          {runwayText}
        </div>
        {result.depletionDate && (
          <div className="dashboard-hero-sub">
            Money runs out {depletionText}
          </div>
        )}
        {!result.depletionDate && (
          <div className="dashboard-hero-sub">
            Income covers expenses indefinitely
          </div>
        )}
      </div>

      {/* Key metrics grid */}
      <div className="dashboard-grid">
        <div className="dashboard-card">
          <div className="dashboard-card-icon"><Wallet size={18} /></div>
          <div className="dashboard-card-label">Savings</div>
          <div className="dashboard-card-value">{formatCurrency(data.currentSavings)}</div>
          {data.savingsTarget > 0 && (
            <div className="dashboard-card-sub">
              {data.currentSavings >= data.savingsTarget ? 'Target reached' : `${formatCurrency(data.savingsTarget - data.currentSavings)} to target`}
            </div>
          )}
        </div>

        <div className="dashboard-card">
          <div className="dashboard-card-icon"><TrendingDown size={18} /></div>
          <div className="dashboard-card-label">Monthly burn</div>
          <div className="dashboard-card-value">{formatCurrency(livingExpenses)}</div>
          <div className="dashboard-card-sub">Living expenses only</div>
        </div>

        <div className="dashboard-card">
          <div className="dashboard-card-icon"><PiggyBank size={18} /></div>
          <div className="dashboard-card-label">Monthly surplus</div>
          <div className="dashboard-card-value" style={{ color: surplus >= 0 ? 'var(--color-ok)' : 'var(--color-danger)' }}>
            {surplus >= 0 ? '+' : ''}{formatCurrency(surplus)}
          </div>
          <div className="dashboard-card-sub">After all commitments</div>
        </div>

        <div className="dashboard-card">
          <div className="dashboard-card-icon"><Clock size={18} /></div>
          <div className="dashboard-card-label">Next milestone</div>
          <div className="dashboard-card-value" style={{ fontSize: '16px' }}>{derived.nextMilestone.label}</div>
          <div className="dashboard-card-sub">{derived.nextMilestone.sub}</div>
        </div>
      </div>

      {/* Quick status */}
      <Section title="Status at a glance">
        <div className="status-list">
          {data.totalDebt > 0 && (
            <div className="status-row">
              <span className="status-dot" style={{ background: result.debtFreeDate ? 'var(--color-warn)' : 'var(--color-danger)' }} />
              <span>Debt: {formatCurrency(data.totalDebt)} remaining</span>
              {result.debtFreeDate && (
                <span className="status-meta">Clear by {formatDate(result.debtFreeDate)}</span>
              )}
            </div>
          )}
          {data.totalDebt === 0 && (
            <div className="status-row">
              <span className="status-dot" style={{ background: 'var(--color-ok)' }} />
              <span>No debt</span>
            </div>
          )}
          <div className="status-row">
            <span className="status-dot" style={{ background: data.currentSavings >= data.savingsTarget ? 'var(--color-ok)' : 'var(--color-warn)' }} />
            <span>Savings target: {data.currentSavings >= data.savingsTarget ? 'Reached' : `${Math.round((data.currentSavings / data.savingsTarget) * 100)}% complete`}</span>
            {result.targetReachedDate && data.currentSavings < data.savingsTarget && (
              <span className="status-meta">Reached by {formatDate(result.targetReachedDate)}</span>
            )}
          </div>
          <div className="status-row">
            <span className="status-dot" style={{ background: surplus >= 0 ? 'var(--color-ok)' : 'var(--color-danger)' }} />
            <span>{surplus >= 0 ? 'Income covers all expenses' : 'Spending exceeds income'}</span>
          </div>
        </div>
      </Section>

      {/* Quick actions */}
      <div className="dashboard-actions">
        <button className="dashboard-action-btn" onClick={() => onTabChange('mymoney')}>
          Update your numbers <ArrowRight size={14} />
        </button>
        <button className="dashboard-action-btn" onClick={() => onTabChange('projection')}>
          View full projection <ArrowRight size={14} />
        </button>
      </div>
    </>
  );
}
