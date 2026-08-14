import { useCallback, useEffect, useMemo, useState } from 'react';
import { Absence, CalendarDay, Colleague, ManualOverride, ShiftSettings } from '../types';
import { generateSchedule } from '../utils/scheduler';

export function useScheduleCalculation(
  colleagues: Colleague[],
  absences: Absence[],
  settings: ShiftSettings,
  overrides: ManualOverride,
  autoRecalculate: boolean,
) {
  const calculated = useMemo(
    () => generateSchedule(colleagues, absences, settings, overrides),
    [colleagues, absences, settings, overrides],
  );
  const [schedule, setSchedule] = useState<CalendarDay[]>(calculated);

  useEffect(() => {
    if (autoRecalculate) setSchedule(calculated);
  }, [autoRecalculate, calculated]);

  const forceRecalculate = useCallback(() => setSchedule(calculated), [calculated]);
  return { schedule, forceRecalculate };
}
