import { useState, useMemo } from 'react';
import { Shield, FolderGit2, TriangleAlert } from 'lucide-react';
import type { FinancialData } from '../types';
import { calculateRunway } from '../utils/calculations';
import { useDerivedMetrics } from '../hooks/useDerivedMetrics';
import { OverviewTab, MyMoneyTab, ProjectionTab } from './tabs';

interface Props {
  data: FinancialData;
  onChange: (data: FinancialData) => void;
  isDefaultData: boolean;
}

type Tab = 'dashboard' | 'mymoney' | 'projection';

const tabs: { id: Tab; label: string }[] = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'mymoney', label: 'My Money' },
  { id: 'projection', label: 'Projection' },
];

export function SavingsTracker({ data, onChange, isDefaultData }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [importError, setImportError] = useState<string | null>(null);

  const result = useMemo(() => calculateRunway(data), [data]);
  const derived = useDerivedMetrics(data, result);

  return (
    <div className="wrap">
      {/* Example data banner */}
      {isDefaultData && (
        <div className="example-banner">
          <div className="example-banner-copy">
            <TriangleAlert size={25} />
            <div>
              <div className="example-banner-title">You&apos;re viewing example data</div>
              <div className="example-banner-sub">Switch to My Money and enter your real numbers</div>
            </div>
          </div>
          <button className="btn primary example-banner-btn" onClick={() => setActiveTab('mymoney')}>
            Enter your numbers
          </button>
        </div>
      )}

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
      {activeTab === 'dashboard' && (
        <OverviewTab
          data={data}
          result={result}
          derived={derived}
          onTabChange={setActiveTab}
        />
      )}

      {activeTab === 'mymoney' && (
        <MyMoneyTab
          data={data}
          onChange={onChange}
          importError={importError}
          setImportError={setImportError}
        />
      )}

      {activeTab === 'projection' && (
        <ProjectionTab data={data} result={result} derived={derived} onChange={onChange} />
      )}

      <div className="privacy-notice">
        <Shield size={12} style={{ flexShrink: 0 }} />
        <span>All data is stored locally in your browser. Nothing is sent to any server.</span>
        <span className="footer-separator">|</span>
        <a
          href="https://github.com/JohnNooney/WhenImBroke"
          target="_blank"
          rel="noopener noreferrer"
          className="source-link"
        >
          <FolderGit2 size={12} style={{ flexShrink: 0 }} />
          <span>View source on GitHub</span>
        </a>
      </div>
    </div>
  );
}
