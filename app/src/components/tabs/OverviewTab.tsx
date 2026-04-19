import { TrendingUp, BarChart3, Zap, Upload, Shield } from 'lucide-react';
import { Section } from '../ui';

interface OverviewTabProps {
  onTabChange: (tab: 'data' | 'expenses') => void;
}

export function OverviewTab({ onTabChange }: OverviewTabProps) {

  return (
    <>
      {/* Hero */}
      <div className="landing-hero">
        <span className="landing-hero-emoji">💸</span>
        <h1 className="landing-hero-title">Know exactly when you're broke</h1>
        <p className="landing-hero-sub">
          WhenImBroke projects your savings runway month-by-month — so you can see how long your money lasts, when to worry, and what to change.
        </p>
        <div className="landing-hero-ctas">
          <button className="btn primary" onClick={() => onTabChange('data')}>
            Import Data →
          </button>
          <button className="btn" onClick={() => onTabChange('expenses')}>
            Manual Entry →
          </button>
        </div>
      </div>

      {/* Features */}
      <div className="landing-features">
        <div className="landing-feature-card">
          <div className="landing-feature-icon"><TrendingUp size={22} /></div>
          <div className="landing-feature-title">Runway Projection</div>
          <div className="landing-feature-desc">See how many months your savings will last with a detailed timeline of saving and consumption phases.</div>
        </div>
        <div className="landing-feature-card">
          <div className="landing-feature-icon"><BarChart3 size={22} /></div>
          <div className="landing-feature-title">Phase Tracking</div>
          <div className="landing-feature-desc">Track your journey through comfortable, caution and critical phases — with dates and durations for each.</div>
        </div>
        <div className="landing-feature-card">
          <div className="landing-feature-icon"><Zap size={22} /></div>
          <div className="landing-feature-title">What-If Scenarios</div>
          <div className="landing-feature-desc">Instantly see how cutting expenses, paying off debt faster, or adding side income changes your outlook.</div>
        </div>
        <div className="landing-feature-card">
          <div className="landing-feature-icon"><Upload size={22} /></div>
          <div className="landing-feature-title">Bank CSV Import</div>
          <div className="landing-feature-desc">Upload a bank export from Monzo, Starling, Lloyds, HSBC, or Snoop and auto-fill your expenses.</div>
        </div>
      </div>

      {/* How it works */}
      <Section title="How it works">
        <div className="landing-steps">
          <div className="landing-step">
            <div className="landing-step-num">1</div>
            <div className="landing-step-body">
              <div className="landing-step-title">Add your numbers</div>
              <div className="landing-step-desc">Import a bank CSV, load saved data, or enter income, expenses, savings and debt manually.</div>
            </div>
          </div>
          <div className="landing-step">
            <div className="landing-step-num">2</div>
            <div className="landing-step-body">
              <div className="landing-step-title">Set your targets</div>
              <div className="landing-step-desc">Choose a savings goal and configure phase thresholds that match your comfort level.</div>
            </div>
          </div>
          <div className="landing-step">
            <div className="landing-step-num">3</div>
            <div className="landing-step-body">
              <div className="landing-step-title">See the projection</div>
              <div className="landing-step-desc">Get a month-by-month breakdown of when you hit each milestone — and when the money runs out.</div>
            </div>
          </div>
        </div>
      </Section>

      {/* Privacy callout */}
      <div className="landing-privacy">
        <Shield size={16} />
        <div>
          <strong>100% private.</strong> All data stored locally in your browser. Nothing sent to any server — ever.
        </div>
      </div>
    </>
  );
}
