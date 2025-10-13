/**
 * Filtert E-Mail-Adressen basierend auf ausgeschlossenen Domains und spezifischen E-Mails
 */

// Ausgeschlossene Domains und E-Mails
const EXCLUDED_EMAIL_PATTERNS = [
  '@boschcarservice.fr',
  '@medicys.fr',
  '@repareo.de',
  '@edelweiss72.de',
  'max.mustermann@gmx.de'
];

/**
 * Prüft ob eine E-Mail-Adresse gefiltert werden soll
 * @param {string} email - Die E-Mail-Adresse
 * @returns {boolean} - true wenn die E-Mail gefiltert werden soll
 */
export function shouldFilterEmail(email) {
  if (!email || typeof email !== 'string') {
    return true; // Filtere leere/ungültige E-Mails
  }
  
  const normalizedEmail = email.toLowerCase().trim();
  
  return EXCLUDED_EMAIL_PATTERNS.some(pattern => 
    normalizedEmail.includes(pattern.toLowerCase())
  );
}

/**
 * Filtert ein Array von E-Mail-Adressen
 * @param {string[]} emails - Array von E-Mail-Adressen
 * @returns {string[]} - Gefiltertes Array von E-Mail-Adressen
 */
export function filterEmails(emails) {
  if (!Array.isArray(emails)) {
    return [];
  }
  
  return emails.filter(email => !shouldFilterEmail(email));
}

/**
 * Filtert E-Mail-Adressen aus einem Objekt (z.B. aus source_data)
 * @param {object} data - Das Datenobjekt
 * @returns {object} - Das Objekt mit gefilterten E-Mails
 */
export function filterEmailsFromObject(data) {
  if (!data || typeof data !== 'object') {
    return data;
  }
  
  const filteredData = { ...data };
  
  // Filtere alle E-Mail-Felder
  const emailFields = ['email', 'email_1', 'email_2', 'email_3'];
  emailFields.forEach(field => {
    if (filteredData[field] && shouldFilterEmail(filteredData[field])) {
      delete filteredData[field];
    }
  });
  
  return filteredData;
}

/**
 * Filtert E-Mail-Adressen aus einem Array von Objekten (z.B. relationships)
 * @param {object[]} items - Array von Objekten
 * @returns {object[]} - Array mit gefilterten E-Mails
 */
export function filterEmailsFromArray(items) {
  if (!Array.isArray(items)) {
    return [];
  }
  
  return items.map(item => {
    if (item.source_data) {
      try {
        const sourceData = JSON.parse(item.source_data);
        const filteredSourceData = filterEmailsFromObject(sourceData);
        return {
          ...item,
          source_data: JSON.stringify(filteredSourceData)
        };
      } catch (e) {
        return item;
      }
    }
    return item;
  });
}

