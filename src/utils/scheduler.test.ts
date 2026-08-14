import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { Colleague, ShiftSettings } from '../types.ts';
import { formatLocalDate, generateSchedule, getISOWeekNumber, parseLocalDate } from './scheduler.ts';

const colleagues: Colleague[] = [
  { id: 'a', name: 'Alice', color: 'rose', isActive: true, initialCount: 0 },
  { id: 'b', name: 'Bob', color: 'blue', isActive: true, initialCount: 0 },
];

const settings: ShiftSettings = {
  startWeekDate: '2026-08-10',
  workDays: [1, 2, 3, 4, 5],
  morningWeeks: [true],
  numberOfWeeks: 1,
};

describe('scheduler', () => {
  it('round-trips local calendar dates without a timezone shift', () => {
    assert.equal(formatLocalDate(parseLocalDate('2026-01-05')), '2026-01-05');
    assert.equal(getISOWeekNumber(parseLocalDate('2026-01-01')), 1);
  });

  it('distributes assignments fairly and deterministically', () => {
    const schedule = generateSchedule(colleagues, [], settings, {});
    assert.deepEqual(
      schedule.filter(day => day.isWorkDay).map(day => day.colleagueId),
      ['a', 'b', 'a', 'b', 'a'],
    );
  });

  it('respects absences and explicit manual overrides', () => {
    const schedule = generateSchedule(
      colleagues,
      [{ id: 'absence-a', colleagueId: 'a', startDate: '2026-08-10', endDate: '2026-08-11' }],
      settings,
      { '2026-08-12': null, '2026-08-13': 'a' },
    );
    const assignments = Object.fromEntries(schedule.map(day => [day.dateString, day.colleagueId]));
    assert.equal(assignments['2026-08-10'], 'b');
    assert.equal(assignments['2026-08-11'], 'b');
    assert.equal(assignments['2026-08-12'], null);
    assert.equal(assignments['2026-08-13'], 'a');
  });

  it('leaves a day empty when every active colleague is absent', () => {
    const schedule = generateSchedule(
      colleagues,
      colleagues.map(colleague => ({
        id: `absence-${colleague.id}`,
        colleagueId: colleague.id,
        startDate: '2026-08-10',
        endDate: '2026-08-10',
      })),
      settings,
      {},
    );
    assert.equal(schedule[0].colleagueId, null);
  });
});
