import { Colleague, Absence, ShiftSettings, CalendarDay, ManualOverride } from '../types';

/**
 * Parses a YYYY-MM-DD string into a local Date object at midnight.
 */
export function parseLocalDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
}

/**
 * Formats a Date object as YYYY-MM-DD in local time.
 */
export function formatLocalDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Returns the ISO 8601 week number for a given date.
 */
export function getISOWeekNumber(date: Date): number {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const day = d.getDay() || 7; // Make Sunday = 7
  d.setDate(d.getDate() + 4 - day); // Move to nearest Thursday
  const yearStart = new Date(d.getFullYear(), 0, 1);
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

/**
 * Helper to get the Monday of the week for any given date.
 */
export function getMonday(date: Date): Date {
  const result = new Date(date);
  const day = result.getDay();
  // day: 0 (Sun) to 6 (Sat)
  // We want to subtract (day - 1) to get Monday. If day is 0 (Sunday), we subtract 6.
  const diff = result.getDate() - day + (day === 0 ? -6 : 1);
  result.setDate(diff);
  result.setHours(0, 0, 0, 0);
  return result;
}

/**
 * Checks if a date falls within an absence range (inclusive).
 */
export function isColleagueAbsent(
  colleagueId: string,
  dateStr: string,
  absences: Absence[]
): boolean {
  return absences.some(
    (absence) =>
      absence.colleagueId === colleagueId &&
      dateStr >= absence.startDate &&
      dateStr <= absence.endDate
  );
}

/**
 * Main function that generates the 6-week schedule.
 */
export function generateSchedule(
  colleagues: Colleague[],
  absences: Absence[],
  settings: ShiftSettings,
  overrides: ManualOverride
): CalendarDay[] {
  const calendar: CalendarDay[] = [];
  const startMonday = parseLocalDate(settings.startWeekDate);
  const totalDays = settings.numberOfWeeks * 7;

  // We generate totalDays
  for (let i = 0; i < totalDays; i++) {
    const currentDate = new Date(startMonday);
    currentDate.setDate(startMonday.getDate() + i);
    const dateStr = formatLocalDate(currentDate);

    // Date's day of week: Date.getDay() gives 0 (Sun) to 6 (Sat).
    // We want 1 (Mon) to 7 (Sun)
    const rawDay = currentDate.getDay();
    const dayOfWeek = rawDay === 0 ? 7 : rawDay;

    const weekIndex = Math.floor(i / 7);
    const isWorkDay = settings.workDays.includes(dayOfWeek);
    const isMorningShift = settings.morningWeeks[weekIndex] || false;

    calendar.push({
      dateString: dateStr,
      date: currentDate,
      dayOfWeek,
      isWorkDay,
      isMorningShift,
      weekIndex,
      colleagueId: null,
      isManualOverride: false,
    });
  }

  // Now, we iterate and assign breakfast roles sequentially
  // To keep track of history up to the current day:
  // We will build the assignments day by day and inspect previous assignments in the array!
  for (let i = 0; i < calendar.length; i++) {
    const day = calendar[i];

    // Only assign if it's a workday and we are on the morning shift
    if (!day.isWorkDay || !day.isMorningShift) {
      continue;
    }

    // 1. Check for manual override
    if (overrides[day.dateString] !== undefined) {
      const overrideVal = overrides[day.dateString];
      if (overrideVal === null || overrideVal === 'none') {
        day.colleagueId = null;
      } else {
        day.colleagueId = overrideVal;
        day.isManualOverride = true;
      }
    } else {
      // 2. Automatic assignment
      // Get active colleagues who are not absent on this date
      const availableColleagues = colleagues.filter(
        (c) => c.isActive && !isColleagueAbsent(c.id, day.dateString, absences)
      );

      if (availableColleagues.length === 0) {
        day.colleagueId = null;
      } else if (availableColleagues.length === 1) {
        day.colleagueId = availableColleagues[0].id;
      } else {
        // Calculate the score (duty counts) for each candidate prior to this date
        // Score = initialCount + number of assignments in calendar so far
        const candidateScores = availableColleagues.map((c) => {
          let count = c.initialCount;
          let lastPosition = -1;

          for (let j = 0; j < i; j++) {
            if (calendar[j].colleagueId === c.id) {
              count++;
              lastPosition = j; // Update with the latest day index they were assigned
            }
          }

          return {
            colleague: c,
            score: count,
            lastPosition,
          };
        });

        // We want to sort candidates to pick the best one:
        // - Primary sort: Lowest score (fairest distribution)
        // - Secondary sort: Longest time since last assignment (lowest lastPosition index)
        // - Tertiary sort: Stable position in the colleagues array
        candidateScores.sort((a, b) => {
          if (a.score !== b.score) {
            return a.score - b.score;
          }
          if (a.lastPosition !== b.lastPosition) {
            return a.lastPosition - b.lastPosition;
          }
          // Fallback to preserve a stable index order
          const indexA = colleagues.findIndex((col) => col.id === a.colleague.id);
          const indexB = colleagues.findIndex((col) => col.id === b.colleague.id);
          return indexA - indexB;
        });

        day.colleagueId = candidateScores[0].colleague.id;
      }
    }

    // Attach extra metadata for UI rendering
    if (day.colleagueId) {
      const coll = colleagues.find((c) => c.id === day.colleagueId);
      if (coll) {
        day.colleagueName = coll.name;
        day.colleagueColor = coll.color;
      }
    }
  }

  return calendar;
}

/**
 * Computes statistics for each colleague based on the generated schedule.
 */
export interface ColleagueStats {
  colleagueId: string;
  name: string;
  color: string;
  totalPlanned: number; // in the 6-week window
  initialAdjust: number;
}

export function computeStats(
  colleagues: Colleague[],
  schedule: CalendarDay[]
): ColleagueStats[] {
  return colleagues.map((col) => {
    const totalPlanned = schedule.filter((day) => day.colleagueId === col.id).length;
    return {
      colleagueId: col.id,
      name: col.name,
      color: col.color,
      totalPlanned,
      initialAdjust: col.initialCount,
    };
  });
}
