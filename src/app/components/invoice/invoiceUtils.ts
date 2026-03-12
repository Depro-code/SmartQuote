export function formatInvoiceCurrency(amount: number, currency: string): string {
  const safeAmount = Number.isFinite(amount) ? amount : 0;
  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  }).format(safeAmount);
}

export function formatInvoiceDate(value?: string): string {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
}

const BELOW_TWENTY = [
  'zero',
  'one',
  'two',
  'three',
  'four',
  'five',
  'six',
  'seven',
  'eight',
  'nine',
  'ten',
  'eleven',
  'twelve',
  'thirteen',
  'fourteen',
  'fifteen',
  'sixteen',
  'seventeen',
  'eighteen',
  'nineteen',
];

const TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];

function toWordsUnder1000(value: number): string {
  if (value < 20) return BELOW_TWENTY[value];
  if (value < 100) {
    const ten = Math.floor(value / 10);
    const rem = value % 10;
    return rem ? `${TENS[ten]}-${BELOW_TWENTY[rem]}` : TENS[ten];
  }
  const hundred = Math.floor(value / 100);
  const rem = value % 100;
  return rem ? `${BELOW_TWENTY[hundred]} hundred ${toWordsUnder1000(rem)}` : `${BELOW_TWENTY[hundred]} hundred`;
}

function numberToWords(value: number): string {
  if (value === 0) return 'zero';
  const units: Array<{ value: number; label: string }> = [
    { value: 1_000_000_000, label: 'billion' },
    { value: 1_000_000, label: 'million' },
    { value: 1_000, label: 'thousand' },
    { value: 1, label: '' },
  ];
  let remainder = Math.floor(Math.abs(value));
  const parts: string[] = [];

  for (const unit of units) {
    if (remainder >= unit.value) {
      const chunk = Math.floor(remainder / unit.value);
      remainder %= unit.value;
      const words = toWordsUnder1000(chunk);
      parts.push(unit.label ? `${words} ${unit.label}` : words);
    }
  }
  return parts.join(' ');
}

export function amountToWords(amount: number, currency: string): string {
  const safeAmount = Number.isFinite(amount) ? Math.max(0, Math.round(amount)) : 0;
  const words = numberToWords(safeAmount);
  return `${words} ${currency}`.replace(/\s+/g, ' ').trim();
}
