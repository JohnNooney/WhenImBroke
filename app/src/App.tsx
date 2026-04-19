import { useState, useEffect } from 'react';
import { Moon, Sun } from 'lucide-react';
import type { FinancialData } from './types';
import { SavingsTracker } from './components/SavingsTracker';
import { loadFromStorage, saveToStorage } from './utils/calculations';

const defaultData: FinancialData = {
  currentSavings: 14200,
  monthlyIncome: 3950,
  monthlySavingsContribution: 500,
  savingsTarget: 20000,
  rent: 950,
  utilities: 120,
  groceries: 220,
  subscriptions: 45,
  transport: 80,
  pocketMoney: 150,
  totalDebt: 3800,
  monthlyDebtRepayment: 500,
  comfortableThreshold: 12,
  cautionThreshold: 6,
  criticalThreshold: 3,
};

function App() {
  const initialStoredData = loadFromStorage();
  const [data, setData] = useState<FinancialData>(() => initialStoredData ?? defaultData);
  const [isDefaultData, setIsDefaultData] = useState(() => !initialStoredData);
  const [dark, setDark] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('whenimbroke-theme') === 'dark' ||
        (!localStorage.getItem('whenimbroke-theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return false;
  });

  useEffect(() => {
    if (isDefaultData) return;
    saveToStorage(data);
  }, [data, isDefaultData]);

  const handleDataChange = (nextData: FinancialData) => {
    if (isDefaultData) setIsDefaultData(false);
    setData(nextData);
  };

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    localStorage.setItem('whenimbroke-theme', dark ? 'dark' : 'light');
  }, [dark]);

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-background-secondary)' }}>
      <header className="app-header">
        <div className="app-header-inner">
          <span style={{ fontSize: '18px', lineHeight: 1 }}>💸</span>
          <span className="app-name">WhenImBroke</span>
          <span className="app-tagline">savings runway tracker</span>
          <button
            className="theme-toggle"
            onClick={() => setDark(d => !d)}
            aria-label="Toggle dark mode"
          >
            {dark ? <Sun size={16} /> : <Moon size={16} />}
          </button>
        </div>
      </header>
      <div style={{ padding: '0 1rem' }}>
        <SavingsTracker data={data} onChange={handleDataChange} isDefaultData={isDefaultData} />
      </div>
    </div>
  );
}

export default App;
