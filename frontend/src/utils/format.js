export const formatCurrency = (value) => (
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Number(value || 0))
);

export const initialsFor = (nameOrEmail = '') => {
  const source = nameOrEmail.trim();
  if (!source) return 'U';
  return source
    .replace(/@.*/, '')
    .split(/[\s._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'U';
};
