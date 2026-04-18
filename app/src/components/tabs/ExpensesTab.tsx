import type { FinancialData } from '../../types';
import { formatCurrency } from '../../utils/formatting';
import { Section, InputField } from '../ui';

interface ExpensesTabProps {
  data: FinancialData;
  onChange: (data: FinancialData) => void;
}

export function ExpensesTab({ data, onChange }: ExpensesTabProps) {
  const handleFieldChange = (field: keyof FinancialData) => (value: number) => {
    onChange({ ...data, [field]: value });
  };

  const livingExpenses = data.rent + data.utilities + data.groceries +
    data.subscriptions + data.transport + data.pocketMoney;
  const totalCommitted = livingExpenses + data.monthlyDebtRepayment + data.monthlySavingsContribution;
  const surplus = data.monthlyIncome - totalCommitted;

  return (
    <>
      <Section title="Monthly expenses">
        <div className="row">
          <InputField label="Rent / mortgage" value={data.rent} onChange={handleFieldChange('rent')} />
          <InputField label="Utilities & bills" value={data.utilities} onChange={handleFieldChange('utilities')} />
          <InputField label="Groceries" value={data.groceries} onChange={handleFieldChange('groceries')} />
        </div>
        <div className="row">
          <InputField label="Subscriptions" value={data.subscriptions} onChange={handleFieldChange('subscriptions')} />
          <InputField label="Transport" value={data.transport} onChange={handleFieldChange('transport')} />
          <InputField label="Pocket money" value={data.pocketMoney} onChange={handleFieldChange('pocketMoney')} />
        </div>
      </Section>

      <Section title="Monthly breakdown">
        <div className="breakdown">
          <div className="breakdown-row">
            <span>Living expenses</span>
            <span>{formatCurrency(livingExpenses)}</span>
          </div>
          {data.monthlySavingsContribution > 0 && (
            <div className="breakdown-row">
              <span>Savings contribution</span>
              <span>{formatCurrency(data.monthlySavingsContribution)}</span>
            </div>
          )}
          {data.monthlyDebtRepayment > 0 && (
            <div className="breakdown-row">
              <span>Debt repayment</span>
              <span>{formatCurrency(data.monthlyDebtRepayment)}</span>
            </div>
          )}
          <div className="breakdown-row breakdown-total">
            <span>Total committed</span>
            <span>{formatCurrency(totalCommitted)}</span>
          </div>
          <div className="breakdown-row" style={{ marginTop: '8px' }}>
            <span>Monthly income</span>
            <span>{formatCurrency(data.monthlyIncome)}</span>
          </div>
          <div className="breakdown-row breakdown-result">
            <span>Surplus</span>
            <span style={{ color: surplus >= 0 ? 'var(--color-ok)' : 'var(--color-danger)' }}>
              {surplus >= 0 ? '+' : ''}{formatCurrency(surplus)}
            </span>
          </div>
          {surplus > 0 && data.monthlySavingsContribution > 0 && (
            <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '8px' }}>
              {formatCurrency(data.monthlySavingsContribution)} flat contribution + {formatCurrency(surplus)} surplus = <strong style={{ color: 'var(--color-ok)' }}>{formatCurrency(data.monthlySavingsContribution + surplus)}/mo</strong> into savings
            </div>
          )}
          {surplus < 0 && (
            <div style={{ fontSize: '12px', color: 'var(--color-danger)', marginTop: '8px' }}>
              Spending exceeds income — savings will deplete
            </div>
          )}
        </div>
      </Section>
    </>
  );
}
