export function count(value?: number | null) { return typeof value === 'number' ? new Intl.NumberFormat('en-US').format(value) : '—'; }
export function money(value?: number | null, currency = 'USD') { return value == null ? 'Unknown' : new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(value); }
export function when(value?: string | null) { if (!value) return 'Not available'; const date = new Date(value); return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat('en-GB', {dateStyle:'medium', timeStyle:'short'}).format(date); }
export function cut(value: string | null | undefined, length = 28) { const item = value || '—'; return item.length > length ? `${item.slice(0,length-1)}…` : item; }
