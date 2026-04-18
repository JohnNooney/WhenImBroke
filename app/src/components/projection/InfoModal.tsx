import type { FinancialData } from '../../types';

interface InfoModalProps {
  onClose: () => void;
  data: FinancialData;
}

export function InfoModal({ onClose, data }: InfoModalProps) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>How Survival Projection Works</h2>
          <button onClick={onClose} className="modal-close">×</button>
        </div>
        <div className="modal-body">
          <h3>Two-Phase Model</h3>
          <p>The projection assumes two distinct phases:</p>
          
          <h4>Phase 1: Saving Mode</h4>
          <ul>
            <li>You have income covering expenses</li>
            <li>Monthly surplus goes to savings</li>
            <li>Debt is being paid down</li>
            <li>Continues until target reached AND debt paid off</li>
          </ul>
          
          <h4>Phase 2: Consumption Mode</h4>
          <ul>
            <li>No income (living off savings)</li>
            <li>No debt payments (already cleared)</li>
            <li>Savings decrease by monthly expenses</li>
          </ul>
          
          <h3>Phase Breakdown</h3>
          <p>During Consumption Mode, your savings runway determines which phase you're in. <strong>Thresholds define the runway range</strong> for each phase; actual <strong>time spent</strong> depends on your savings balance.</p>
          <div className="guide-phases">
            <div><span className="dot" style={{ background: 'var(--color-ok)' }} /> <strong>Comfortable:</strong> Runway &gt; {data.comfortableThreshold} months</div>
            <div><span className="dot" style={{ background: 'var(--color-warn)' }} /> <strong>Caution:</strong> Runway {data.criticalThreshold+1}-{data.cautionThreshold} months</div>
            <div><span className="dot" style={{ background: 'var(--color-danger)' }} /> <strong>Critical:</strong> Runway 0-{data.criticalThreshold} months</div>
            <div><span className="dot" style={{ background: 'var(--color-border-tertiary)' }} /> <strong>Depleted:</strong> 0 months runway — savings exhausted</div>
          </div>
          <p style={{ marginTop: '0.5rem' }}>Critical ends the month before depletion. Depleted shows the actual month you run out of money.</p>
          <p>Adjust thresholds in "Phase thresholds" section below.</p>
          
          <h3>Key Calculations</h3>
          <table className="calc-table">
            <tbody>
              <tr>
                <td><strong>Monthly Surplus</strong></td>
                <td>Income − All Expenses (inc. debt)</td>
              </tr>
              <tr>
                <td><strong>Months to Target</strong></td>
                <td>(Target − Current Savings) ÷ Surplus</td>
              </tr>
              <tr>
                <td><strong>Months to Debt-Free</strong></td>
                <td>Total Debt ÷ Monthly Repayment</td>
              </tr>
              <tr>
                <td><strong>Recommended Cutoff</strong></td>
                <td>Whichever takes longer (target or debt)</td>
              </tr>
              <tr>
                <td><strong>Target Runway</strong></td>
                <td>Target Savings ÷ Monthly Expenses</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
