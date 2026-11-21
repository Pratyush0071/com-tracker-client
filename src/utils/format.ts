export function formatINRFromPaise(paise: number, showZeroDecimals = false): string {
  const safe = Number.isFinite(paise) ? paise : 0;
  const rupees = Math.round(safe) / 100;
  const hasDecimals = Math.abs(Math.round(safe) % 100) !== 0;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: hasDecimals || showZeroDecimals ? 2 : 0,
    maximumFractionDigits: 2,
  }).format(rupees);
}

export function formatINRFromRupees(rupees: number): string {
  const safe = Number.isFinite(rupees) ? rupees : 0;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(safe);
}

export function formatISTDateDisplay(dateStr: string): string {
  if (!dateStr || !dateStr.includes('-')) return dateStr || '-';
  const [y, m, d] = dateStr.split('-').map(Number);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  if (!m || m < 1 || m > 12) return dateStr;
  return `${String(d).padStart(2, '0')} ${months[m - 1]} ${y}`;
}

export function formatDateTimeIST(iso: string): string {
  if (!iso) return '-';
  try {
    return new Intl.DateTimeFormat('en-IN', {
      timeZone: 'Asia/Kolkata',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}
