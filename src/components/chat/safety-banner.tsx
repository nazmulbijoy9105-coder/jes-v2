import { SafetyCheck } from '@/lib/types';
import { AlertTriangle, Phone, Clock } from 'lucide-react';

interface SafetyBannerProps {
  flags: SafetyCheck[];
}

export function SafetyBanner({ flags }: SafetyBannerProps) {
  const criticalFlag = flags.find(f => f.severity === 'critical');
  const highFlag = flags.find(f => f.severity === 'high');
  if (!criticalFlag && !highFlag) return null;

  const flag = criticalFlag || highFlag;

  return (
    <div className={`rounded-lg p-4 mb-4 ${flag.severity === 'critical' ? 'bg-red-50 border border-red-200' : 'bg-amber-50 border border-amber-200'}`}>
      <div className="flex items-start gap-3">
        <AlertTriangle className={`w-5 h-5 mt-0.5 ${flag.severity === 'critical' ? 'text-red-600' : 'text-amber-600'}`} />
        <div className="flex-1">
          <h4 className={`font-semibold ${flag.severity === 'critical' ? 'text-red-800' : 'text-amber-800'}`}>
            {flag.severity === 'critical' ? 'URGENT: Immediate Legal Assistance Required' : 'Important: Consider Professional Legal Advice'}
          </h4>
          <p className={`text-sm mt-1 whitespace-pre-wrap ${flag.severity === 'critical' ? 'text-red-700' : 'text-amber-700'}`}>
            {flag.message}
          </p>
          {flag.severity === 'critical' && (
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2">
              <a href="tel:16430" className="flex items-center gap-2 bg-red-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-red-700 transition-colors">
                <Phone className="w-4 h-4" />
                Legal Aid: 16430
              </a>
              <a href="tel:02-9565700" className="flex items-center gap-2 bg-red-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-red-700 transition-colors">
                <Phone className="w-4 h-4" />
                Bar Council
              </a>
              <div className="flex items-center gap-2 bg-red-100 text-red-800 px-3 py-2 rounded-lg text-sm">
                <Clock className="w-4 h-4" />
                Available 24/7
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}