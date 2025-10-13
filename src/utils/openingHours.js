// Utility functions for opening hours status

export const parseOpeningHours = (hoursString) => {
  if (!hoursString || /geschlosse?n/i.test(hoursString)) return [];
  // Support multiple ranges separated by comma, semicolon, or slash
  const parts = hoursString.split(/[,;/]+/).map(s => s.trim()).filter(Boolean);
  const ranges = [];
  for (const part of parts) {
    const m = part.match(/(\d{1,2}):?(\d{0,2})\s*[-–]\s*(\d{1,2}):?(\d{0,2})/);
    if (!m) continue;
    const [, sh, sm='00', eh, em='00'] = m;
    ranges.push({
      start: { hour: parseInt(sh,10), minute: parseInt(sm,10) },
      end:   { hour: parseInt(eh,10), minute: parseInt(em,10) }
    });
  }
  return ranges;
};

export const getOpeningStatus = (workingHours) => {
  if (!workingHours) {
    return { status: 'unknown', message: 'Öffnungszeiten nicht verfügbar' };
  }

  const now = new Date();
  const currentDay = now.toLocaleDateString('de-DE', { weekday: 'long' });
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const currentTime = currentHour * 60 + currentMinute; // Convert to minutes

  // Map German day names to the format used in working hours
  const dayMapping = {
    'Montag': ['Montag', 'Mo'],
    'Dienstag': ['Dienstag', 'Di'],
    'Mittwoch': ['Mittwoch', 'Mi'],
    'Donnerstag': ['Donnerstag', 'Do'],
    'Freitag': ['Freitag', 'Fr'],
    'Samstag': ['Samstag', 'Sa'],
    'Sonntag': ['Sonntag', 'So']
  };

  // Find today's hours
  let todayHours = null;
  const possibleDayNames = dayMapping[currentDay] || [currentDay];
  
  for (const dayName of possibleDayNames) {
    if (workingHours[dayName]) {
      todayHours = workingHours[dayName];
      break;
    }
  }

  if (!todayHours) {
    return { status: 'unknown', message: 'Öffnungszeiten für heute nicht verfügbar' };
  }

  const parsedRanges = parseOpeningHours(todayHours);
  if (!parsedRanges || parsedRanges.length === 0) {
    return { status: 'closed', message: 'Heute geschlossen' };
  }
  // Convert ranges to minutes
  const rangesInMinutes = parsedRanges.map(r => ({
    open: r.start.hour * 60 + r.start.minute,
    close: r.end.hour * 60 + r.end.minute
  })).sort((a,b) => a.open - b.open);

  // Open now?
  for (const r of rangesInMinutes) {
    if (currentTime >= r.open && currentTime < r.close) {
      const timeUntilClose = r.close - currentTime;
      if (timeUntilClose <= 60) {
        return { status: 'closing-soon', message: `Schließt in ${timeUntilClose} Minute${timeUntilClose !== 1 ? 'n' : ''}` };
      }
      return { status: 'open', message: `Geöffnet bis ${String(Math.floor(r.close/60)).padStart(2,'0')}:${String(r.close%60).padStart(2,'0')}` };
    }
  }

  // Not open now: find next opening time today (greater than current)
  const next = rangesInMinutes.find(r => r.open > currentTime);
  if (next) {
    const inMinutes = next.open - currentTime;
    if (inMinutes <= 60) {
      return { status: 'opening-soon', message: `Öffnet in ${inMinutes} Minute${inMinutes !== 1 ? 'n' : ''}` };
    }
    return { status: 'closed', message: `Geschlossen - Öffnet um ${String(Math.floor(next.open/60)).padStart(2,'0')}:${String(next.open%60).padStart(2,'0')}` };
  }

  // No more openings today
  return { status: 'closed', message: 'Heute geschlossen' };
};

export const getStatusColor = (status) => {
  switch (status) {
    case 'open':
      return 'text-green-600 bg-green-50 border-green-200';
    case 'closing-soon':
      return 'text-orange-600 bg-orange-50 border-orange-200';
    case 'opening-soon':
      return 'text-blue-600 bg-blue-50 border-blue-200';
    case 'closed':
      return 'text-red-600 bg-red-50 border-red-200';
    default:
      return 'text-gray-600 bg-gray-50 border-gray-200';
  }
};

export const getStatusIcon = (status) => {
  switch (status) {
    case 'open':
      return '🟢';
    case 'closing-soon':
      return '🟡';
    case 'opening-soon':
      return '🔵';
    case 'closed':
      return '🔴';
    default:
      return '⚪';
  }
};
