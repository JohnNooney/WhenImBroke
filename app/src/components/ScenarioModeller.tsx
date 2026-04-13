import { useState } from 'react';
import type { FinancialData } from '../types';
import { Sliders, Plus, Minus, RotateCcw } from 'lucide-react';

interface Props {
  baseData: FinancialData;
  onScenarioChange: (data: FinancialData) => void;
}

interface Adjustment {
  field: keyof FinancialData;
  label: string;
  change: number;
}

export function ScenarioModeller({ baseData, onScenarioChange }: Props) {
  const [adjustments, setAdjustments] = useState<Adjustment[]>([]);

  const applyAdjustments = (newAdjustments: Adjustment[]) => {
    const adjusted = { ...baseData };
    for (const adj of newAdjustments) {
      adjusted[adj.field] = Math.max(0, baseData[adj.field] + adj.change);
    }
    onScenarioChange(adjusted);
    setAdjustments(newAdjustments);
  };

  const addAdjustment = (field: keyof FinancialData, label: string, change: number) => {
    const existing = adjustments.findIndex((a) => a.field === field);
    let newAdjustments: Adjustment[];
    
    if (existing >= 0) {
      newAdjustments = [...adjustments];
      newAdjustments[existing] = { field, label, change: adjustments[existing].change + change };
    } else {
      newAdjustments = [...adjustments, { field, label, change }];
    }
    
    applyAdjustments(newAdjustments);
  };

  const reset = () => {
    setAdjustments([]);
    onScenarioChange(baseData);
  };

  const scenarios = [
    {
      title: 'Cut Expenses',
      items: [
        { label: 'Reduce rent by £200', field: 'rent' as const, change: -200 },
        { label: 'Cut subscriptions by £50', field: 'subscriptions' as const, change: -50 },
        { label: 'Reduce groceries by £100', field: 'groceries' as const, change: -100 },
        { label: 'Cut transport by £50', field: 'transport' as const, change: -50 },
      ],
    },
    {
      title: 'Increase Income',
      items: [
        { label: 'Add £500 side income', field: 'monthlyIncome' as const, change: 500 },
        { label: 'Add £1000 side income', field: 'monthlyIncome' as const, change: 1000 },
      ],
    },
    {
      title: 'Debt Management',
      items: [
        { label: 'Pay off £1000 debt', field: 'totalDebt' as const, change: -1000 },
        { label: 'Reduce debt payment by £100', field: 'monthlyDebtRepayment' as const, change: -100 },
      ],
    },
    {
      title: 'Savings Boost',
      items: [
        { label: 'Add £5000 to savings', field: 'currentSavings' as const, change: 5000 },
        { label: 'Add £10000 to savings', field: 'currentSavings' as const, change: 10000 },
      ],
    },
  ];

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
          <Sliders className="w-5 h-5 text-purple-500" />
          What-If Scenarios
        </h3>
        {adjustments.length > 0 && (
          <button
            onClick={reset}
            className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            Reset
          </button>
        )}
      </div>

      {adjustments.length > 0 && (
        <div className="mb-4 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
          <p className="text-sm font-medium text-purple-700 dark:text-purple-300 mb-2">
            Active Adjustments:
          </p>
          <div className="flex flex-wrap gap-2">
            {adjustments.map((adj, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 dark:bg-purple-800/50 text-purple-700 dark:text-purple-300 rounded text-sm"
              >
                {adj.label}: {adj.change > 0 ? '+' : ''}£{adj.change}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {scenarios.map((scenario) => (
          <div key={scenario.title} className="space-y-2">
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
              {scenario.title}
            </p>
            <div className="space-y-1">
              {scenario.items.map((item) => (
                <button
                  key={item.label}
                  onClick={() => addAdjustment(item.field, item.label, item.change)}
                  className="w-full flex items-center justify-between px-3 py-2 text-sm bg-slate-50 dark:bg-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors text-left"
                >
                  <span className="text-slate-700 dark:text-slate-300">{item.label}</span>
                  {item.change > 0 ? (
                    <Plus className="w-4 h-4 text-emerald-500" />
                  ) : (
                    <Minus className="w-4 h-4 text-red-500" />
                  )}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
