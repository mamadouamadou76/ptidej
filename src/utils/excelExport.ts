import * as XLSX from 'xlsx';
import { CalendarDay, Colleague } from '../types';
import { getISOWeekNumber } from './scheduler';

export function exportPlanningToExcel(
  schedule: CalendarDay[],
  colleagues: Colleague[],
  numberOfWeeks: number,
  startDate: string
) {
  // Create workbook
  const workbook = XLSX.utils.book_new();

  // Prepare data for Excel - Grid layout (7 columns for days of week, rows for weeks)
  const excelData: (string | number)[][] = [];

  // Title row
  excelData.push([
    `PLANNING PETITS DÉJEUNERS - ${numberOfWeeks} SEMAINES`,
  ]);

  // Metadata row
  const startDateObj = new Date(startDate);
  const endDateObj = new Date(schedule[schedule.length - 1]?.date || startDate);
  const periodStr = `du ${startDateObj.toLocaleDateString('fr-FR')} au ${endDateObj.toLocaleDateString('fr-FR')}`;
  excelData.push([periodStr]);

  // Empty row for spacing
  excelData.push([]);

  // Header row (Days of week)
  const daysOfWeek = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
  excelData.push(['Semaine', ...daysOfWeek]);

  // Group schedule by week
  const weeks: CalendarDay[][] = [];
  const maxWeekIndex = Math.max(...schedule.map(d => d.weekIndex), 0);
  for (let i = 0; i <= maxWeekIndex; i++) {
    weeks.push(schedule.filter((day) => day.weekIndex === i));
  }

  // Add week rows
  weeks.forEach((weekDays, weekIdx) => {
    const isMorning = weekDays[0]?.isMorningShift;
    const weekMonday = new Date(weekDays[0]?.date);
    const formattedMon = weekMonday.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
    
    const isoWeek = getISOWeekNumber(weekMonday);
    const weekLabel = `S${isoWeek}\n(${formattedMon})\n${isMorning ? '🌞 Matin' : '💤 Repos'}`;
    
    // Create a row for each day of the week
    const row: (string | number)[] = [weekLabel];
    
    for (let dayOfWeek = 1; dayOfWeek <= 7; dayOfWeek++) {
      const dayData = weekDays.find(d => d.dayOfWeek === dayOfWeek);
      
      if (!dayData) {
        row.push(''); // Empty cell if day doesn't exist
      } else if (!dayData.isWorkDay || !isMorning) {
        row.push('—'); // Dash for non-workdays or non-morning weeks
      } else {
        // Get colleague name
        const name = dayData.colleagueName || '⚠️ Aucun';
        const indicator = dayData.isManualOverride ? '✍️' : '🔄';
        row.push(`${name}\n${indicator}`);
      }
    }
    
    excelData.push(row);
  });

  // Empty row for spacing
  excelData.push([]);

  // Statistics section
  excelData.push(['STATISTIQUES']);
  excelData.push(['Collègue', 'Nombre de jours assignés']);
  
  // Calculate stats
  const stats: { [key: string]: number } = {};
  colleagues.forEach(c => {
    stats[c.id] = 0;
  });
  schedule.forEach(day => {
    if (day.colleagueId && stats.hasOwnProperty(day.colleagueId)) {
      stats[day.colleagueId]++;
    }
  });

  colleagues.forEach(colleague => {
    excelData.push([colleague.name, stats[colleague.id] || 0]);
  });

  // Create worksheet
  const worksheet = XLSX.utils.aoa_to_sheet(excelData);

  // Set column widths
  const columnWidths = [
    { wch: 18 }, // Semaine column
    { wch: 15 }, // Lundi
    { wch: 15 }, // Mardi
    { wch: 15 }, // Mercredi
    { wch: 15 }, // Jeudi
    { wch: 15 }, // Vendredi
    { wch: 15 }, // Samedi
    { wch: 15 }, // Dimanche
  ];
  worksheet['!cols'] = columnWidths;

  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Planning');

  // Generate filename with current date
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0]; // YYYY-MM-DD
  const filename = `Planning_Petit_Dej_${dateStr}.xlsx`;

  // Write file
  XLSX.writeFile(workbook, filename);
}
