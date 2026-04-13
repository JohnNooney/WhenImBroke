import { useState } from 'react';
import type { FinancialData } from './types';
import { SavingsTracker } from './components/SavingsTracker';

const defaultData: FinancialData = {
  currentSavings: 14200,
  monthlyIncome: 1905,
  monthlySavingsContribution: 200,
  emergencyFundTarget: 5000,
  rent: 950,
  utilities: 120,
  groceries: 220,
  subscriptions: 45,
  transport: 80,
  pocketMoney: 150,
  totalDebt: 3800,
  monthlyDebtRepayment: 0,
  comfortableThreshold: 12,
  cautionThreshold: 6,
  criticalThreshold: 3,
};

function App() {
  const [data, setData] = useState<FinancialData>(defaultData);

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-background-secondary)', padding: '0 1rem' }}>
      <SavingsTracker data={data} onChange={setData} />
    </div>
  );
}

export default App;
