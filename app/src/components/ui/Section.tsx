import { Info } from 'lucide-react';

interface SectionProps {
  title: string;
  children: React.ReactNode;
  onInfoClick?: () => void;
}

export function Section({ title, children, onInfoClick }: SectionProps) {
  return (
    <div className="section">
      <div className="section-title">
        {title}
        {onInfoClick && (
          <button 
            onClick={onInfoClick}
            className="info-btn"
            aria-label="How this works"
          >
            <Info size={14} />
          </button>
        )}
      </div>
      {children}
    </div>
  );
}
