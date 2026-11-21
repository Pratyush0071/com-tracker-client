import { CheckCircle2, Clock, Ban, Wallet, AlertCircle, Edit3 } from 'lucide-react';

interface StatusLabelProps {
  status: string;
}

export function StatusLabel({ status }: StatusLabelProps) {
  const s = (status || '').toLowerCase();

  if (s === 'paid' || s === 'completed' || s === 'active') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 whitespace-nowrap">
        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
        <span className="capitalize">{s}</span>
      </span>
    );
  }

  if (s === 'approved') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-sky-700 whitespace-nowrap">
        <Wallet className="w-3.5 h-3.5 shrink-0" />
        <span>Approved · Unpaid</span>
      </span>
    );
  }

  if (s === 'pending' || s === 'upcoming') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700 whitespace-nowrap">
        <Clock className="w-3.5 h-3.5 shrink-0" />
        <span className="capitalize">{s}</span>
      </span>
    );
  }

  if (s === 'edited') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 whitespace-nowrap">
        <Edit3 className="w-3.5 h-3.5 shrink-0" />
        <span>Edited</span>
      </span>
    );
  }

  if (s === 'rejected' || s === 'deleted' || s === 'inactive') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-700 whitespace-nowrap">
        <Ban className="w-3.5 h-3.5 shrink-0" />
        <span className="capitalize">{s}</span>
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 whitespace-nowrap">
      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
      <span className="capitalize">{s || 'None'}</span>
    </span>
  );
}
