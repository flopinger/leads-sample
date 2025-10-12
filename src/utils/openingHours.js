// Utility functions for opening hours status

export const parseOpeningHours = (hoursString) => {
  if (!hoursString || hoursString === 'Geschlossen' || hoursString === 'geschlossen') {
    return null;
  }

  // Parse time ranges like "08:00 - 18:00" or "8:00-18:00"
  const timeMatch = hoursString.match(/(\d{1,2}):?(\d{0,2})\s*[-–]\s*(\d{1,2}):?(\d{0,2})/);
  if (!timeMatch) return null;

  const [, startHour, startMin = '00', endHour, endMin = '00'] = timeMatch;
  
  return {
    start: { hour: parseInt(startHour), minute: parseInt(startMin) },
    end: { hour: parseInt(endHour), minute: parseInt(endMin) }
  };
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

  const parsedHours = parseOpeningHours(todayHours);
  if (!parsedHours) {
    return { status: 'closed', message: 'Heute geschlossen' };
  }

  const openTime = parsedHours.start.hour * 60 + parsedHours.start.minute;
  const closeTime = parsedHours.end.hour * 60 + parsedHours.end.minute;

  // Check if currently open
  if (currentTime >= openTime && currentTime < closeTime) {
    // Check if closing soon (within 1 hour)
    const timeUntilClose = closeTime - currentTime;
    if (timeUntilClose <= 60) {
      const minutesLeft = timeUntilClose;
      return { 
        status: 'closing-soon', 
        message: `Schließt in ${minutesLeft} Minute${minutesLeft !== 1 ? 'n' : ''}` 
      };
    }
    return { 
      status: 'open', 
      message: `Geöffnet bis ${parsedHours.end.hour.toString().padStart(2, '0')}:${parsedHours.end.minute.toString().padStart(2, '0')}` 
    };
  }

  // Check if opening soon (within 1 hour)
  if (currentTime < openTime) {
    const timeUntilOpen = openTime - currentTime;
    if (timeUntilOpen <= 60) {
      const minutesLeft = timeUntilOpen;
      return { 
        status: 'opening-soon', 
        message: `Öffnet in ${minutesLeft} Minute${minutesLeft !== 1 ? 'n' : ''}` 
      };
    }
  }

  return { 
    status: 'closed', 
    message: `Geschlossen - Öffnet um ${parsedHours.start.hour.toString().padStart(2, '0')}:${parsedHours.start.minute.toString().padStart(2, '0')}` 
  };
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
