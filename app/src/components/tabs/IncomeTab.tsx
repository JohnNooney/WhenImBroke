import type { FinancialData } from '../../types';
import { Section, InputField } from '../ui';

interface IncomeTabProps {
  data: FinancialData;
  onChange: (data: FinancialData) => void;
}

export function IncomeTab({ data, onChange }: IncomeTabProps) {
  const handleFieldChange = (field: keyof FinancialData) => (value: number) => {
    onChange({ ...data, [field]: value });
  };

  return (
    <Section title="Income & savings">
      <div className="row">
        <InputField label="Monthly take-home" value={data.monthlyIncome} onChange={handleFieldChange('monthlyIncome')} />
        <InputField label="Monthly savings contribution" value={data.monthlySavingsContribution} onChange={handleFieldChange('monthlySavingsContribution')} />
        <InputField label="Current savings" value={data.currentSavings} onChange={handleFieldChange('currentSavings')} />
      </div>
      <div className="row">
        <InputField label="Savings target" value={data.savingsTarget} onChange={handleFieldChange('savingsTarget')} />
      </div>
    </Section>
  );
}
