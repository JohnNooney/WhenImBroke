import { useState, useMemo } from 'react';
import { Shield } from 'lucide-react';
import type { FinancialData } from '../types';
import { calculateRunway } from '../utils/calculations';
import { useDerivedMetrics } from '../hooks/useDerivedMetrics';
import { OverviewTab, DataTab, ExpensesTab, IncomeTab, DebtsTab, ProjectionTab } from './tabs';

interface Props {
  data: FinancialData;
  onChange: (data: FinancialData) => void;
}

type Tab = 'overview' | 'data' | 'expenses' | 'income' | 'debts' | 'projection';

const tabs: { id: Tab; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'data', label: 'Data' },
  { id: 'income', label: 'Income' },
  { id: 'expenses', label: 'Expenses' },
  { id: 'debts', label: 'Debts' },
  { id: 'projection', label: 'Projection' },
];

export function SavingsTracker({ data, onChange }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [importError, setImportError] = useState<string | null>(null);

  const result = useMemo(() => calculateRunway(data), [data]);
  const derived = useDerivedMetrics(data, result);

  return (
    <div className="wrap">
      {/* Tabs */}
      <div className="tab-row">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <OverviewTab
          onTabChange={setActiveTab}
        />
      )}

      {activeTab === 'data' && (
        <DataTab
          data={data}
          onChange={onChange}
          onTabChange={setActiveTab}
          importError={importError}
          setImportError={setImportError}
        />
      )}

      {activeTab === 'expenses' && (
        <ExpensesTab data={data} onChange={onChange} />
      )}

      {activeTab === 'income' && (
        <IncomeTab data={data} onChange={onChange} />
      )}

      {activeTab === 'debts' && (
        <DebtsTab data={data} onChange={onChange} />
      )}

      {activeTab === 'projection' && (
        <ProjectionTab data={data} result={result} derived={derived} onChange={onChange} />
      )}

      
      {activeTab !== 'overview' && (
        <div className="privacy-notice">
          <Shield size={12} style={{ flexShrink: 0 }} />
          <span>All data is stored locally in your browser. Nothing is sent to any server.</span>
        </div>
      )}
    </div>
  );
}
