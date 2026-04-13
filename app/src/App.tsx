import { useState, useMemo } from 'react';
import type { FinancialData } from './types';
import { calculateRunway } from './utils/calculations';
import { InputForm } from './components/InputForm';
import { Dashboard } from './components/Dashboard';
import { ScenarioModeller } from './components/ScenarioModeller';
import { Wallet, TrendingUp } from 'lucide-react';

const defaultData: FinancialData = {
  currentSavings: 15000,
  monthlyIncome: 3500,
  monthlySavingsContribution: 500,
  emergencyFundTarget: 10000,
  rent: 1200,
  utilities: 150,
  groceries: 400,
  subscriptions: 50,
  transport: 150,
  pocketMoney: 200,
  totalDebt: 0,
  monthlyDebtRepayment: 0,
};

function App() {
  const [baseData, setBaseData] = useState<FinancialData>(defaultData);
  const [scenarioData, setScenarioData] = useState<FinancialData | null>(null);

  const activeData = scenarioData || baseData;
  const result = useMemo(() => calculateRunway(activeData), [activeData]);

  const handleBaseChange = (data: FinancialData) => {
    setBaseData(data);
    setScenarioData(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      {/* Header */}
      <header className="bg-white dark:bg-slate-800 shadow-sm border-b border-slate-200 dark:border-slate-700">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-xl flex items-center justify-center">
              <Wallet className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">
                When I'm Broke
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Savings Runway Tracker
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
            <TrendingUp className="w-4 h-4" />
            <span>
              {result.runwayMonths === Infinity
                ? 'Infinite runway'
                : `${result.runwayMonths} months runway`}
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Input */}
          <div className="lg:col-span-1 space-y-6">
            <InputForm data={baseData} onChange={handleBaseChange} />
            <ScenarioModeller
              baseData={baseData}
              onScenarioChange={setScenarioData}
            />
          </div>

          {/* Right Column - Dashboard */}
          <div className="lg:col-span-2">
            {scenarioData && (
              <div className="mb-4 px-4 py-2 bg-purple-100 dark:bg-purple-900/30 border border-purple-200 dark:border-purple-800 rounded-lg text-purple-700 dark:text-purple-300 text-sm">
                Viewing scenario projection. Adjustments not saved.
              </div>
            )}
            <Dashboard result={result} />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-12 py-6 border-t border-slate-200 dark:border-slate-700">
        <p className="text-center text-sm text-slate-500 dark:text-slate-400">
          When I'm Broke — Know your runway, plan your future
        </p>
      </footer>
    </div>
  );
}

export default App;
