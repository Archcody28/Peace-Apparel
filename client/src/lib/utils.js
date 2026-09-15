export function formatCurrency(amount, currency = '₦') {
  return `${currency}${Number(amount || 0).toLocaleString('en-NG')}`;
}

export function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

export function generateOrderId() {
  return `PA-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
}

export function truncate(str, length = 60) {
  if (!str) return '';
  return str.length > length ? str.slice(0, length) + '...' : str;
}
