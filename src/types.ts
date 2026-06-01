/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Colleague {
  id: string;
  name: string;
  color: string; // Tailwind color name like 'rose', 'amber', 'emerald', etc.
  isActive: boolean;
  initialCount: number; // For manual adjustments to keep rotation fair
}

export interface Absence {
  id: string;
  colleagueId: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  reason?: string;
}

export interface ShiftSettings {
  startWeekDate: string; // YYYY-MM-DD (typically a Monday)
  workDays: number[]; // 1 = Mon, 2 = Tue, ..., 7 = Sun
  morningWeeks: boolean[]; // N booleans indicating if week 0 to N-1 is a morning shift
  numberOfWeeks: number; // Number of weeks to schedule
}

export interface CalendarDay {
  dateString: string; // YYYY-MM-DD
  date: Date;
  dayOfWeek: number; // 1-7
  isWorkDay: boolean;
  isMorningShift: boolean;
  weekIndex: number; // 0-5
  colleagueId: string | null; // Assigne automatique ou manuel
  isManualOverride: boolean;
  colleagueName?: string;
  colleagueColor?: string;
}

export interface ManualOverride {
  [dateString: string]: string | null; // colleagueId or null (none/skip)
}
