export type DayHours = { open: number; close: number };

export function hoursDuration(hours: DayHours) {
  return hours.close - hours.open;
}

export function formatHourLabel(hour: number) {
  const period = hour >= 12 ? "pm" : "am";
  const h = hour % 12 === 0 ? 12 : hour % 12;
  return `${h}${period}`;
}

export function formatHoursRange(hours: DayHours) {
  return `${formatHourLabel(hours.open)} – ${formatHourLabel(hours.close)}`;
}
