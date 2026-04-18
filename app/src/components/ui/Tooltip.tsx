import { Info } from 'lucide-react';

interface TooltipProps {
  text: string;
}

export function Tooltip({ text }: TooltipProps) {
  return (
    <span className="tooltip-wrap">
      <Info size={11} aria-hidden="true" />
      <span className="tooltip-box" role="tooltip">{text}</span>
    </span>
  );
}
