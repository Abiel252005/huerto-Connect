export interface AdminDateFormatOptions {
  fallback?: string;
  withTime?: boolean;
}

export function formatAdminDate(
  value: string | null | undefined,
  options: AdminDateFormatOptions = {}
): string {
  const fallback = options.fallback ?? 'Sin fecha';
  if (!value || !value.trim()) {
    return fallback;
  }

  const raw = value.trim();
  const parsed = parseAdminDate(raw);
  if (!parsed) {
    return raw;
  }

  const showTime = options.withTime ?? hasTime(raw);

  const datePart = new Intl.DateTimeFormat('es-MX', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(parsed);

  if (!showTime) {
    return datePart;
  }

  const timePart = new Intl.DateTimeFormat('es-MX', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(parsed);

  return `${datePart} ${timePart}`;
}

function parseAdminDate(raw: string): Date | null {
  const dateOnlyMatch = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (dateOnlyMatch) {
    const [, y, m, d] = dateOnlyMatch;
    return new Date(Number(y), Number(m) - 1, Number(d));
  }

  const dateTimeMatch = raw.match(
    /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2}))?(?:\.(\d{1,6}))?(Z|[+\-]\d{2}:?\d{2})?$/
  );

  if (dateTimeMatch) {
    const [, y, m, d, hh, mm, ssRaw, fractionRaw, tzRaw] = dateTimeMatch;
    const seconds = Number(ssRaw ?? '0');
    const milliseconds = Number((fractionRaw ?? '').slice(0, 3).padEnd(3, '0') || '0');

    if (tzRaw) {
      const timezone =
        tzRaw === 'Z'
          ? 'Z'
          : tzRaw.includes(':')
            ? tzRaw
            : `${tzRaw.slice(0, 3)}:${tzRaw.slice(3)}`;
      const isoValue = `${y}-${m}-${d}T${hh}:${mm}:${String(seconds).padStart(2, '0')}.${String(milliseconds).padStart(3, '0')}${timezone}`;
      const parsedIso = new Date(isoValue);
      return Number.isNaN(parsedIso.getTime()) ? null : parsedIso;
    }

    return new Date(
      Number(y),
      Number(m) - 1,
      Number(d),
      Number(hh),
      Number(mm),
      seconds,
      milliseconds
    );
  }

  const generic = new Date(raw);
  return Number.isNaN(generic.getTime()) ? null : generic;
}

function hasTime(raw: string): boolean {
  return /[T ]\d{2}:\d{2}/.test(raw);
}
