import { ConfidenceLevel } from '@/lib/types';
import { CheckCircle, AlertCircle, HelpCircle, XCircle } from 'lucide-react';

interface ConfidenceBadgeProps {
  level: ConfidenceLevel;
}

export function ConfidenceBadge({ level }: ConfidenceBadgeProps) {
  const configs = {
    high: { icon: CheckCircle, color: 'bg-green-100 text-green-800', label: 'High Confidence' },
    medium: { icon: AlertCircle, color: 'bg-yellow-100 text-yellow-800', label: 'Medium Confidence' },
    low: { icon: HelpCircle, color: 'bg-orange-100 text-orange-800', label: 'Low Confidence' },
    none: { icon: XCircle, color: 'bg-red-100 text-red-800', label: 'Insufficient Info' }
  };

  const config = configs[level] || configs.none;
  const Icon = config.icon;

  return (
    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${config.color}`}>
      <Icon className="w-3.5 h-3.5" />
      {config.label}
    </div>
  );
}