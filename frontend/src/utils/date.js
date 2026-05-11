// Shared date utilities to keep Firestore Timestamp + timezone handling consistent

export function normalizeDate(value) {
  try {
    if (!value) return null;

    // Firestore Timestamp (admin SDK)
    if (typeof value === 'object' && typeof value.toDate === 'function') {
      const d = value.toDate();
      return d instanceof Date && !Number.isNaN(d.getTime()) ? d : null;
    }

    // Firestore Timestamp (serialized on client)
    if (typeof value === 'object' && typeof value.seconds === 'number') {
      const ms = value.seconds * 1000;
      const d = new Date(ms);
      return !Number.isNaN(d.getTime()) ? d : null;
    }

    // Strings or Date
    const d = value instanceof Date ? value : new Date(value);
    return !Number.isNaN(d.getTime()) ? d : null;
  } catch {
    return null;
  }
}

// YYYY-MM-DD in LOCAL timezone (prevents timezone drift when comparing calendar days)
export function formatDateKey(date) {
  const d = normalizeDate(date);
  if (!d) return null;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

