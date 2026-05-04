export function nowIso() {
  return new Date().toISOString()
}

export function addDays(date, days) {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

export function isExpired(isoString) {
  return new Date(isoString).getTime() <= Date.now()
}
