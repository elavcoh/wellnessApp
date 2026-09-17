export function getTodayDateString() {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD
}

export function getCurrentTimeString() {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

// Oldest to newest, including today - e.g. getLastNDateStrings(7) gives the
// last 7 calendar days as ["2026-09-09", ..., "2026-09-15"].
export function getLastNDateStrings(n) {
  const dates = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    dates.push(d.toISOString().slice(0, 10));
  }
  return dates;
}

export function getWeekdayLabel(dateString) {
  return new Date(`${dateString}T00:00:00Z`).toLocaleDateString('en-US', {
    weekday: 'short',
    timeZone: 'UTC',
  });
}
