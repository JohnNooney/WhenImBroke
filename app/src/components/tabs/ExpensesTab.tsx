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

  const totalExpenses = data.rent + data.utilities + data.groceries + 
    data.subscriptions + data.transport + data.pocketMoney + data.monthlyDebtRepayment;

  return (
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
      <div style={{ textAlign: 'right', fontSize: '13px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
        Total outgoings: <strong style={{ color: 'var(--color-text-primary)' }}>{formatCurrency(totalExpenses)} / mo</strong>
      </div>
    </Section>
  );
}
