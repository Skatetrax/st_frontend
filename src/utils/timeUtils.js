/**
 * Shared time-formatting helpers for {hours, minutes} objects
 * returned by the skatetrax core API.
 */

/** Convert {hours, minutes} to a single decimal-hours number (for Chart.js). */
export const toDecimalHours = (t) => (t ? t.hours + t.minutes / 60 : 0);

/** Format {hours, minutes} as "Xh Ym" for display. */
export const fmtTime = (t) => {
  if (!t) return "0h 0m";
  return `${t.hours}h ${Math.round(t.minutes)}m`;
};

/** Sum multiple {hours, minutes} objects and return formatted "Xh Ym". */
export const sumFmtTime = (...parts) => {
  const totalMin = parts.reduce(
    (acc, t) => acc + (t ? t.hours * 60 + t.minutes : 0),
    0
  );
  return `${Math.floor(totalMin / 60)}h ${Math.round(totalMin % 60)}m`;
};
