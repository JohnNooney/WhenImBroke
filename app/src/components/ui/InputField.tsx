import { memo } from 'react';

interface InputFieldProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
}

export const InputField = memo(function InputField({ label, value, onChange }: InputFieldProps) {
  return (
    <div className="field">
      <label>{label}</label>
      <div style={{ position: 'relative' }}>
        <span style={{ 
          position: 'absolute', 
          left: '10px', 
          top: '50%', 
          transform: 'translateY(-50%)',
          color: 'var(--color-text-secondary)',
          pointerEvents: 'none'
        }}>£</span>
        <input
          type="number"
          value={value || ''}
          onChange={(e) => {
            const num = parseFloat(e.target.value) || 0;
            onChange(num);
          }}
          style={{ paddingLeft: '24px' }}
        />
      </div>
    </div>
  );
});
