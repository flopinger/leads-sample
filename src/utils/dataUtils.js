// Utility functions for data processing

// Simple hash function for organization IDs (reversible with key)
const HASH_KEY = 'zf-sample-2025';

export const hashOrganizationId = (id) => {
  if (!id) return id;
  
  // Simple XOR-based encoding (easily reversible)
  let result = '';
  for (let i = 0; i < id.length; i++) {
    const charCode = id.charCodeAt(i) ^ HASH_KEY.charCodeAt(i % HASH_KEY.length);
    result += String.fromCharCode(charCode);
  }
  
  // Convert to base64 for safe display
  return btoa(result).replace(/[+/=]/g, '');
};

export const unhashOrganizationId = (hashedId) => {
  if (!hashedId) return hashedId;
  
  try {
    // Add padding if needed and decode from base64
    const padded = hashedId + '==='.slice(0, (4 - hashedId.length % 4) % 4);
    const decoded = atob(padded);
    
    // Reverse XOR
    let result = '';
    for (let i = 0; i < decoded.length; i++) {
      const charCode = decoded.charCodeAt(i) ^ HASH_KEY.charCodeAt(i % HASH_KEY.length);
      result += String.fromCharCode(charCode);
    }
    
    return result;
  } catch (e) {
    return hashedId; // Return original if decoding fails
  }
};

// Normalize phone numbers to +49 format
export const normalizePhoneNumber = (phone) => {
  if (!phone || typeof phone !== 'string') return phone;
  
  // Remove all non-digit characters except +
  let cleaned = phone.replace(/[^\d+]/g, '');
  
  // Handle different German phone number formats
  if (cleaned.startsWith('0049')) {
    cleaned = '+49' + cleaned.slice(4);
  } else if (cleaned.startsWith('49') && !cleaned.startsWith('+49')) {
    cleaned = '+49' + cleaned.slice(2);
  } else if (cleaned.startsWith('0') && !cleaned.startsWith('00')) {
    cleaned = '+49' + cleaned.slice(1);
  } else if (!cleaned.startsWith('+') && cleaned.length >= 10) {
    // Assume it's a German number without country code
    cleaned = '+49' + cleaned;
  }
  
  return cleaned;
};

// Concepts to exclude completely
const EXCLUDED_CONCEPTS = [
  'AKF Langzeitmiete - Glas',
  'Freie Werkstätten',
  'Pilot 2 Betriebe eBay',
  'Reparatur und TÜV',
  'WOLK',
  'repareo - Anhängerkupplung',
  'repareo Glas'
];

// Concept prefixes to consolidate
const CONCEPT_CONSOLIDATION = {
  '4Fleet': '4Fleet',
  'Arval': 'Arval',
  'DB Connect': 'DB Connect',
  'Deutsche Leasing': 'Deutsche Leasing',
  'Driver': 'Driver',
  'Euromaster': 'Euromaster',
  'LeasePlan': 'LeasePlan',
  'Mein Auto': 'Mein Auto',
  'Mobility Concept': 'Mobility Concept',
  'Fleetpartner': 'Fleetpartner',
  'akf': 'akf'
};

// Concept renames
const CONCEPT_RENAMES = {
  'Point S (Driver) - Anmeldung': 'Point S'
};

// Premium concepts to highlight
export const PREMIUM_CONCEPTS = [
  '1a Autoservice',
  'Autofit',
  'AutoCrew',
  'BOSCH Car Service',
  'MEISTERHAFT',
  'MOTOO',
  'ROCKSTARS'
];

// Process and clean concept names
export const cleanConceptName = (concept) => {
  if (!concept || typeof concept !== 'string') return concept;
  
  let cleaned = concept.trim();
  
  // Remove suffixes
  cleaned = cleaned
    .replace(/\s*\(Buchbar\)\s*/gi, '')
    .replace(/\s*\(Nicht Buchbar\)\s*/gi, '')
    .replace(/\s*\(\+weitere\)\s*/gi, '')
    .trim();
  
  // Apply renames
  if (CONCEPT_RENAMES[cleaned]) {
    return CONCEPT_RENAMES[cleaned];
  }
  
  // Apply consolidation
  for (const [prefix, consolidated] of Object.entries(CONCEPT_CONSOLIDATION)) {
    if (cleaned.startsWith(prefix)) {
      return consolidated;
    }
  }
  
  return cleaned;
};

// Check if concept should be excluded
export const shouldExcludeConcept = (concept) => {
  if (!concept) return true;
  
  const cleaned = cleanConceptName(concept);
  return EXCLUDED_CONCEPTS.includes(cleaned) || 
         cleaned.toLowerCase().includes('default');
};

// Split comma-separated concepts and networks, remove Default entries and duplicates
export const processConceptsNetworks = (data) => {
  return data.map(item => {
    if (item.concepts_networks && Array.isArray(item.concepts_networks)) {
      const expandedConcepts = [];
      
      item.concepts_networks.forEach(concept => {
        if (typeof concept === 'string' && concept.includes(',')) {
          // Split comma-separated values and trim whitespace
          const splitConcepts = concept.split(',').map(c => c.trim()).filter(c => c.length > 0);
          expandedConcepts.push(...splitConcepts);
        } else if (concept && concept.trim()) {
          expandedConcepts.push(concept.trim());
        }
      });
      
      // Clean and filter concepts
      const cleanedConcepts = expandedConcepts
        .map(concept => cleanConceptName(concept))
        .filter(concept => concept && concept.length > 0 && !shouldExcludeConcept(concept));
      
      // Remove duplicates and return
      return {
        ...item,
        concepts_networks: [...new Set(cleanedConcepts)]
      };
    }
    return item;
  });
};

// Create export-friendly JSON with hashed IDs
export const createExportData = (data) => {
  return data.map(item => {
    // Remove unwanted fields
    const {
      root_organization_id,
      invalid_data_since,
      type,
      ...cleanItem
    } = item;

    // Hash the organization ID
    cleanItem.id = hashOrganizationId(item.id);

    // Filter relationships - remove REPAREO and REPAREO_SALES, rename GMAPS_CRAWLER
    const filteredRelationships = item.relationships?.map(rel => {
      if (rel.handle === 'REPAREO' || rel.handle === 'REPAREO_SALES') {
        return null;
      }
      if (rel.handle === 'GMAPS_CRAWLER') {
        return {
          ...rel,
          handle: 'GOOGLE_BUSINESS'
        };
      }
      return rel;
    }).filter(Boolean) || [];

    // Create email array
    const emails = [];
    if (item.email_1 && item.email_1.trim()) emails.push(item.email_1.trim());
    if (item.email_2 && item.email_2.trim()) emails.push(item.email_2.trim());

    // Create contact persons array
    const contactPersons = [];
    if (item.firstname_1 || item.lastname_1) {
      contactPersons.push({
        firstname: item.firstname_1 || '',
        lastname: item.lastname_1 || ''
      });
    }
    if (item.firstname_2 || item.lastname_2) {
      contactPersons.push({
        firstname: item.firstname_2 || '',
        lastname: item.lastname_2 || ''
      });
    }

    // Build export object
    const exportItem = {
      ...cleanItem,
      telephone: normalizePhoneNumber(item.contact_telephone),
      email: emails,
      contact_persons: contactPersons,
      relationships: filteredRelationships
    };

    // Remove old fields
    delete exportItem.contact_telephone;
    delete exportItem.email_1;
    delete exportItem.email_2;
    delete exportItem.firstname_1;
    delete exportItem.lastname_1;
    delete exportItem.firstname_2;
    delete exportItem.lastname_2;

    return exportItem;
  });
};

// Extract all phone numbers from item and relationships (normalized)
export const extractAllPhoneNumbers = (item) => {
  const phones = new Set();
  
  // Main phone
  if (item.contact_telephone && item.contact_telephone.trim()) {
    const normalized = normalizePhoneNumber(item.contact_telephone.trim());
    if (normalized) phones.add(normalized);
  }
  
  // From relationships
  item.relationships?.forEach(rel => {
    if (rel.source_data) {
      try {
        const sourceData = typeof rel.source_data === 'string' 
          ? JSON.parse(rel.source_data) 
          : rel.source_data;
        
        // Look for phone-related fields
        Object.entries(sourceData).forEach(([key, value]) => {
          if (key.toLowerCase().includes('phone') || 
              key.toLowerCase().includes('tel') ||
              key.toLowerCase().includes('fax')) {
            if (value && typeof value === 'string' && value.trim()) {
              const normalized = normalizePhoneNumber(value.trim());
              if (normalized) phones.add(normalized);
            }
          }
        });
      } catch (e) {
        // Ignore parsing errors
      }
    }
  });
  
  return Array.from(phones);
};

// Extract all email addresses from item and relationships
export const extractAllEmails = (item) => {
  const emails = new Set();
  
  // Main emails
  if (item.email_1 && item.email_1.trim()) {
    emails.add(normalizeEmail(item.email_1.trim()));
  }
  if (item.email_2 && item.email_2.trim()) {
    emails.add(normalizeEmail(item.email_2.trim()));
  }
  
  // From relationships
  item.relationships?.forEach(rel => {
    if (rel.source_data) {
      try {
        const sourceData = typeof rel.source_data === 'string' 
          ? JSON.parse(rel.source_data) 
          : rel.source_data;
        
        // Look for email-related fields
        Object.entries(sourceData).forEach(([key, value]) => {
          if (key.toLowerCase().includes('email') || 
              key.toLowerCase().includes('mail')) {
            if (value && typeof value === 'string' && value.trim() && value.includes('@')) {
              emails.add(normalizeEmail(value.trim()));
            }
          }
        });
      } catch (e) {
        // Ignore parsing errors
      }
    }
  });
  
  return Array.from(emails);
};

// Normalize email for comparison
const normalizeEmail = (email) => {
  return email.toLowerCase();
};

// Parse opening hours from text format
export const parseOpeningHours = (hoursText) => {
  if (!hoursText) return null;
  
  const days = hoursText.split('|');
  const parsedHours = {};
  
  days.forEach(day => {
    const [dayName, hours] = day.split(':');
    if (dayName && hours) {
      parsedHours[dayName.trim()] = hours.trim();
    }
  });
  
  return parsedHours;
};

// Get current opening status
export const getCurrentOpeningStatus = (hoursText) => {
  if (!hoursText) return null;
  
  const now = new Date();
  const currentDay = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'][now.getDay()];
  const currentTime = now.getHours() * 100 + now.getMinutes();
  
  const hours = parseOpeningHours(hoursText);
  if (!hours || !hours[currentDay]) return null;
  
  const todayHours = hours[currentDay];
  if (todayHours.toLowerCase() === 'geschlossen') {
    return { status: 'closed', text: 'Heute geschlossen', color: 'red' };
  }
  
  const timeMatch = todayHours.match(/(\d{2}):(\d{2})-(\d{2}):(\d{2})/);
  if (timeMatch) {
    const openTime = parseInt(timeMatch[1]) * 100 + parseInt(timeMatch[2]);
    const closeTime = parseInt(timeMatch[3]) * 100 + parseInt(timeMatch[4]);
    
    if (currentTime >= openTime && currentTime <= closeTime) {
      const closingSoon = (closeTime - currentTime) <= 100; // Within 1 hour
      return closingSoon 
        ? { status: 'closing-soon', text: 'Schließt bald', color: 'orange' }
        : { status: 'open', text: 'Geöffnet', color: 'green' };
    } else {
      return { status: 'closed', text: 'Geschlossen', color: 'red' };
    }
  }
  
  return null;
};

// Load and process company changes data - FINAL CORRECTED VERSION
export const loadCompanyChanges = async () => {
  try {
    // Fetch from public directory
    const response = await fetch('/company-changes.json');
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const text = await response.text();
    console.log('Raw company changes text length:', text.length);
    
    // Parse JSONL format (one JSON object per line)
    const lines = text.trim().split('\n').filter(line => line.trim());
    const changes = [];
    
    for (const line of lines) {
      try {
        const parsed = JSON.parse(line);
        changes.push(parsed);
      } catch (e) {
        console.warn('Could not parse line:', line.substring(0, 100) + '...');
      }
    }
    
    console.log('Successfully loaded company changes:', changes.length);
    return changes;
  } catch (e) {
    console.error('Could not load company changes:', e);
    return [];
  }
};

// Get company changes for a specific organization
export const getCompanyChangesForOrganization = (organizationId, allChanges) => {
  if (!organizationId || !allChanges || allChanges.length === 0) return [];
  
  // Try both hashed and unhashed IDs
  const unhashedId = unhashOrganizationId(organizationId);
  
  const matches = allChanges.filter(change => 
    change.organization_id === organizationId || 
    change.organization_id === unhashedId
  );
  
  console.log(`Found ${matches.length} changes for organization ${organizationId} (unhashed: ${unhashedId})`);
  return matches;
};

// Format currency values
export const formatCurrency = (value, fieldName) => {
  if (!value) return value;
  
  // Check if field name contains EUR or currency indicators
  if (fieldName.toLowerCase().includes('eur') || 
      fieldName.toLowerCase().includes('kapital') ||
      fieldName.toLowerCase().includes('stammkapital')) {
    return `${value} €`;
  }
  
  return value;
};

// Format percentage values
export const formatPercentage = (value, fieldName) => {
  if (!value) return value;
  
  // Check if field name contains percentage indicators
  if (fieldName.toLowerCase().includes('%') || 
      fieldName.toLowerCase().includes('prozent') ||
      fieldName.toLowerCase().includes('anteil')) {
    return `${value} %`;
  }
  
  return value;
};

// Format Google Business post date
export const formatPostDate = (dateString) => {
  if (!dateString) return '';
  
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  } catch (e) {
    return dateString;
  }
};

// Truncate text for preview
export const truncateText = (text, maxLength = 100) => {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

// Convert JSON data to CSV format with flattened structure
export const convertToCSV = (data) => {
  if (!data || data.length === 0) return '';
  
  // Function to flatten nested objects
  const flattenObject = (obj, prefix = '') => {
    const flattened = {};
    
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const newKey = prefix ? `${prefix}_${key}` : key;
        const value = obj[key];
        
        if (value === null || value === undefined) {
          flattened[newKey] = '';
        } else if (Array.isArray(value)) {
          // Handle arrays - convert to comma-separated string or create multiple columns
          if (value.length === 0) {
            flattened[newKey] = '';
          } else if (typeof value[0] === 'object') {
            // Array of objects - flatten each object with index
            value.forEach((item, index) => {
              const nestedFlattened = flattenObject(item, `${newKey}_${index + 1}`);
              Object.assign(flattened, nestedFlattened);
            });
          } else {
            // Array of primitives - join with semicolon
            flattened[newKey] = value.join('; ');
          }
        } else if (typeof value === 'object') {
          // Nested object - recursively flatten
          const nestedFlattened = flattenObject(value, newKey);
          Object.assign(flattened, nestedFlattened);
        } else {
          // Primitive value
          flattened[newKey] = value;
        }
      }
    }
    
    return flattened;
  };
  
  // Flatten all objects
  const flattenedData = data.map(item => flattenObject(item));
  
  // Get all unique keys from all objects
  const allKeys = new Set();
  flattenedData.forEach(item => {
    Object.keys(item).forEach(key => allKeys.add(key));
  });
  
  const headers = Array.from(allKeys).sort();
  
  // Create CSV content
  const csvRows = [];
  
  // Add headers
  csvRows.push(headers.map(header => `"${header}"`).join(','));
  
  // Add data rows
  flattenedData.forEach(item => {
    const row = headers.map(header => {
      const value = item[header] || '';
      // Escape quotes and wrap in quotes
      const escapedValue = String(value).replace(/"/g, '""');
      return `"${escapedValue}"`;
    });
    csvRows.push(row.join(','));
  });
  
  return csvRows.join('\n');
};

// Create CSV export data with same cleaning as JSON export
export const createCSVExportData = (data) => {
  // Use the same cleaning logic as createExportData
  const cleanedData = createExportData(data);
  
  // Convert to CSV
  return convertToCSV(cleanedData);
};
