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
          <h2>How the projection works</h2>
          <button onClick={onClose} className="modal-close">×</button>
        </div>
        <div className="modal-body">
          <h3>Two phases</h3>
          <p>Your finances are projected month-by-month in two phases:</p>
          
          <h4>Phase 1: Building savings</h4>
          <ul>
            <li>Income covers living expenses and debt repayments</li>
            <li>What's left over (income minus expenses minus debt) goes to savings</li>
            <li>Once debt is cleared, the freed-up amount speeds up saving</li>
            <li>Continues until savings target reached <strong>AND</strong> debt fully paid off</li>
          </ul>
          <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
            Sub-phases: <strong>Pre-Debt</strong> (saving while paying debt) → <strong>Post-Debt</strong> (full surplus to savings)
          </p>
          
          <h4>Phase 2: Living off savings</h4>
          <ul>
            <li>No income — spending savings only</li>
            <li>No debt payments (already cleared)</li>
            <li>Savings go down by your living expenses each month</li>
          </ul>
          
          <h3>Phase Breakdown</h3>
          <p>While living off savings, your remaining runway determines which zone you're in. <strong>Thresholds set the boundaries</strong>; time spent in each depends on your balance.</p>
          <div className="guide-phases">
            <div><span className="dot" style={{ background: 'var(--color-ok)' }} /> <strong>Comfortable:</strong> Runway &gt; {data.cautionThreshold} months</div>
            <div><span className="dot" style={{ background: 'var(--color-warn)' }} /> <strong>Caution:</strong> Runway {data.criticalThreshold+1}–{data.cautionThreshold} months</div>
            <div><span className="dot" style={{ background: 'var(--color-danger)' }} /> <strong>Critical:</strong> Runway 0–{data.criticalThreshold} months</div>
            <div><span className="dot" style={{ background: 'var(--color-border-tertiary)' }} /> <strong>Depleted:</strong> Savings exhausted — no runway remaining</div>
          </div>
          <p style={{ marginTop: '0.5rem' }}>During Saving Mode you're always in "Comfortable". Phase transitions only apply once consumption begins.</p>
          <p>Adjust thresholds in the "Phase thresholds" section on the Projection tab.</p>
          
          <h3>Key Calculations</h3>
          <table className="calc-table">
            <tbody>
              <tr>
                <td><strong>Living Expenses</strong></td>
                <td>Rent + Utilities + Groceries + Subscriptions + Transport + Pocket Money</td>
              </tr>
              <tr>
                <td><strong>Monthly Surplus</strong></td>
                <td>Income − Living Expenses − Debt Repayment</td>
              </tr>
              <tr>
                <td><strong>Post-Debt Surplus</strong></td>
                <td>Monthly Surplus + Debt Repayment (freed up after debt cleared)</td>
              </tr>
              <tr>
                <td><strong>Current Runway</strong></td>
                <td>Current Savings ÷ Living Expenses</td>
              </tr>
              <tr>
                <td><strong>Consumption Runway</strong></td>
                <td>Simulated months from consumption start to depletion</td>
              </tr>
              <tr>
                <td><strong>Ready Date</strong></td>
                <td>First month where savings ≥ target AND debt = 0 (from simulation)</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
