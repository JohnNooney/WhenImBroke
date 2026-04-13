import type { RunwayResult } from '../types';
import { formatCurrency, formatDate } from '../utils/calculations';
import { TrendingUp, TrendingDown, Calendar, AlertTriangle, CheckCircle, Clock } from 'lucide-react';

interface Props {
  result: RunwayResult;
}

export function Dashboard({ result }: Props) {
  const isPositive = result.monthlySurplus >= 0;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard
          title="Monthly Income"
          value={formatCurrency(result.monthlyIncome)}
          icon={<TrendingUp className="w-5 h-5" />}
          color="emerald"
        />
        <SummaryCard
          title="Monthly Expenses"
          value={formatCurrency(result.monthlyExpenses)}
          icon={<TrendingDown className="w-5 h-5" />}
          color="amber"
        />
        <SummaryCard
          title="Monthly Surplus"
          value={formatCurrency(result.monthlySurplus)}
          icon={isPositive ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
          color={isPositive ? 'emerald' : 'red'}
        />
        <SummaryCard
          title="Runway"
          value={result.runwayMonths === Infinity ? '∞' : `${result.runwayMonths} months`}
          icon={<Clock className="w-5 h-5" />}
          color="blue"
        />
      </div>

      {/* Key Dates */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6">
        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-blue-500" />
          Key Dates
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <DateCard
            title="Last Safe Point"
            date={result.lastSafeDate}
            description="Latest date to stop relying on income while maintaining 6+ months runway"
            icon={<CheckCircle className="w-6 h-6 text-emerald-500" />}
          />
          <DateCard
            title="Depletion Date"
            date={result.depletionDate}
            description="When savings will run out at current trajectory"
            icon={<AlertTriangle className="w-6 h-6 text-red-500" />}
          />
        </div>
      </div>

      {/* Phase Timeline */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6">
        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-4">
          Phase Timeline
        </h3>
        <div className="space-y-3">
          <PhaseBar
            phase="Comfortable"
            start={result.phases.comfortable.start}
            end={result.phases.comfortable.end}
            color="bg-emerald-500"
            description="12+ months of expenses covered"
          />
          <PhaseBar
            phase="Caution"
            start={result.phases.caution.start}
            end={result.phases.caution.end}
            color="bg-amber-500"
            description="6-12 months of expenses covered"
          />
          <PhaseBar
            phase="Critical"
            start={result.phases.critical.start}
            end={result.phases.critical.end}
            color="bg-red-500"
            description="Less than 6 months of expenses covered"
          />
        </div>
      </div>

      {/* Projection Chart */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6">
        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-4">
          Savings Projection
        </h3>
        <ProjectionChart projections={result.projections} />
      </div>
    </div>
  );
}

function SummaryCard({
  title,
  value,
  icon,
  color,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
  color: 'emerald' | 'amber' | 'red' | 'blue';
}) {
  const colorClasses = {
    emerald: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400',
    amber: 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400',
    red: 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400',
    blue: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-4">
      <div className={`w-10 h-10 rounded-lg ${colorClasses[color]} flex items-center justify-center mb-3`}>
        {icon}
      </div>
      <p className="text-sm text-slate-500 dark:text-slate-400">{title}</p>
      <p className="text-xl font-bold text-slate-800 dark:text-slate-200">{value}</p>
    </div>
  );
}

function DateCard({
  title,
  date,
  description,
  icon,
}: {
  title: string;
  date: Date | null;
  description: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-4 p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
      <div className="flex-shrink-0">{icon}</div>
      <div>
        <p className="font-medium text-slate-800 dark:text-slate-200">{title}</p>
        <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
          {formatDate(date)}
        </p>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{description}</p>
      </div>
    </div>
  );
}

function PhaseBar({
  phase,
  start,
  end,
  color,
  description,
}: {
  phase: string;
  start: Date | null;
  end: Date | null;
  color: string;
  description: string;
}) {
  if (!start) {
    return (
      <div className="flex items-center gap-4 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg opacity-50">
        <div className={`w-3 h-3 rounded-full ${color}`} />
        <div className="flex-1">
          <p className="font-medium text-slate-600 dark:text-slate-400">{phase}</p>
          <p className="text-sm text-slate-400 dark:text-slate-500">Not projected</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-4 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
      <div className={`w-3 h-3 rounded-full ${color}`} />
      <div className="flex-1">
        <p className="font-medium text-slate-800 dark:text-slate-200">{phase}</p>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {formatDate(start)} → {end ? formatDate(end) : 'Ongoing'}
        </p>
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{description}</p>
      </div>
    </div>
  );
}

function ProjectionChart({ projections }: { projections: RunwayResult['projections'] }) {
  if (projections.length === 0) return null;

  const displayMonths = Math.min(projections.length, 60); // Show max 5 years
  const displayProjections = projections.slice(0, displayMonths);
  
  // Use min/max of displayed range for better scaling
  const balances = displayProjections.map((p) => p.savingsBalance);
  const maxBalance = Math.max(...balances);
  const minBalance = Math.min(...balances);
  const range = maxBalance - minBalance;

  const phaseColors = {
    comfortable: 'bg-emerald-500',
    caution: 'bg-amber-500',
    critical: 'bg-red-500',
    depleted: 'bg-slate-400',
  };

  return (
    <div className="h-48 flex items-end gap-1">
      {displayProjections.map((p, i) => {
        // Scale relative to range, with minimum 10% base height for visibility
        const normalizedHeight = range > 0 
          ? ((p.savingsBalance - minBalance) / range) * 80 + 10
          : 50;
        return (
          <div
            key={i}
            className="flex-1 flex flex-col justify-end group relative"
          >
            <div
              className={`${phaseColors[p.phase]} rounded-t transition-all hover:opacity-80`}
              style={{ height: `${normalizedHeight}%` }}
            />
            <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
              {formatDate(p.date)}: {formatCurrency(p.savingsBalance)}
            </div>
          </div>
        );
      })}
    </div>
  );
}
