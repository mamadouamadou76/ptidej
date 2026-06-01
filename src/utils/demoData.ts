import { Colleague, Absence, ShiftSettings } from '../types';
import { formatLocalDate, getMonday } from './scheduler';

export function getInitialDemoData(): {
  colleagues: Colleague[];
  absences: Absence[];
  settings: ShiftSettings;
} {
  const currentMonday = getMonday(new Date());
  const mondayStr = formatLocalDate(currentMonday);

  const colleagues: Colleague[] = [
    { id: '1', name: 'Thomas', color: 'blue', isActive: true, initialCount: 0 },
    { id: '2', name: 'Mathilde', color: 'pink', isActive: true, initialCount: 1 },
    { id: '3', name: 'Jérôme', color: 'amber', isActive: true, initialCount: 0 },
    { id: '4', name: 'Sofiane', color: 'emerald', isActive: true, initialCount: 0 },
    { id: '5', name: 'Amandine', color: 'violet', isActive: true, initialCount: 1 },
    { id: '6', name: 'Christophe', color: 'sky', isActive: true, initialCount: 0 },
  ];

  // Let's create some dummy dates relative to this Monday
  // Week 2 Monday to Wednesday
  const w2Mon = new Date(currentMonday);
  w2Mon.setDate(currentMonday.getDate() + 7);
  const w2Wed = new Date(currentMonday);
  w2Wed.setDate(currentMonday.getDate() + 9);

  // Week 4 Thursday
  const w4Thu = new Date(currentMonday);
  w4Thu.setDate(currentMonday.getDate() + 24);

  const absences: Absence[] = [
    {
      id: 'abs1',
      colleagueId: '4', // Sofiane
      startDate: formatLocalDate(w2Mon),
      endDate: formatLocalDate(w2Wed),
      reason: 'Congés annuels',
    },
    {
      id: 'abs2',
      colleagueId: '5', // Amandine
      startDate: formatLocalDate(w4Thu),
      endDate: formatLocalDate(w4Thu),
      reason: 'Formation externe',
    },
  ];

  const settings: ShiftSettings = {
    startWeekDate: mondayStr,
    workDays: [1, 2, 3, 4, 5], // Lundi à Vendredi
    morningWeeks: [true, true, false, true, true, false], // Semaines 1, 2, 4, 5 en Matin
    numberOfWeeks: 6, // Default to 6 weeks
  };

  return { colleagues, absences, settings };
}
