import type { FinancialData } from '../../types';
import { Section, InputField } from '../ui';

interface DebtsTabProps {
  data: FinancialData;
  onChange: (data: FinancialData) => void;
}

export function DebtsTab({ data, onChange }: DebtsTabProps) {
  const handleFieldChange = (field: keyof FinancialData) => (value: number) => {
    onChange({ ...data, [field]: value });
  };

  return (
    <Section title="Debt overview">
      <div className="row">
        <InputField label="Total outstanding debt" value={data.totalDebt} onChange={handleFieldChange('totalDebt')} />
        <InputField label="Monthly debt repayment" value={data.monthlyDebtRepayment} onChange={handleFieldChange('monthlyDebtRepayment')} />
      </div>
      {data.totalDebt > 0 && data.monthlyDebtRepayment > 0 && (
        <div style={{ marginTop: '12px', fontSize: '13px', color: 'var(--color-text-secondary)' }}>
          At current rate, debt-free in <strong style={{ color: 'var(--color-text-primary)' }}>
            {Math.ceil(data.totalDebt / data.monthlyDebtRepayment)} months
          </strong>
        </div>
      )}
    </Section>
  );
}
