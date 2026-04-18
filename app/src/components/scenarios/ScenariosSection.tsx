import type { FinancialData } from '../../types';
import { Section } from '../ui';

interface ScenariosSectionProps {
  data: FinancialData;
  onChange: (data: FinancialData) => void;
}

export function ScenariosSection({ data, onChange }: ScenariosSectionProps) {
  const applyScenario = (modifier: Partial<FinancialData>) => {
    onChange({ ...data, ...modifier });
  };

  return (
    <Section title="What-if scenarios">
      <div className="row" style={{ marginBottom: 0 }}>
        <button 
          className="btn"
          onClick={() => applyScenario({ rent: Math.max(0, data.rent - 200) })}
        >
          Cut expenses £200/mo
        </button>
        <button 
          className="btn"
          onClick={() => applyScenario({ monthlyDebtRepayment: data.monthlyDebtRepayment + 200 })}
        >
          Pay off debt faster
        </button>
        <button 
          className="btn"
          onClick={() => applyScenario({ monthlyIncome: data.monthlyIncome + 500 })}
        >
          Add £500 side income
        </button>
      </div>
    </Section>
  );
}
