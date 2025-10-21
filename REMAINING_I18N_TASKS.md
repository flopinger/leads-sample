# Verbleibende i18n-Übersetzungen

## ✅ Fertig
- LoginPage
- HeaderIntegrated (mit Language Switcher)
- App.jsx (LanguageProvider)
- API (user_language Feld)

## 🔄 Pattern für verbleibende Komponenten

Für JEDE der folgenden Komponenten:

1. Import hinzufügen:
```javascript
import { useLanguage } from '../contexts/LanguageContext';
```

2. Hook verwenden:
```javascript
const { t } = useLanguage();
```

3. Alle Texte ersetzen:
```javascript
// Vorher:
<h1>Werkstattadressen-Sample</h1>
// Nachher:
<h1>{t('dashboard.title')}</h1>
```

## 📋 Komponenten-Liste

### 1. DashboardIntegrated.jsx
Ersetze:
- "Werkstattadressen-Sample" → `{t('dashboard.title')}`
- "Suche nach Name, Stadt oder PLZ..." → `{t('dashboard.searchPlaceholder')}`
- "Filter" → `{t('dashboard.filters')}`
- "Stadt" → `{t('dashboard.city')}`
- "PLZ" → `{t('dashboard.zipCode')}`
- "Konzept" → `{t('dashboard.concept')}`
- "Alle Städte" → `{t('dashboard.allCities')}`
- "Alle PLZ" → `{t('dashboard.allZipCodes')}`
- "Alle Konzepte" → `{t('dashboard.allConcepts')}`
- "Filter zurücksetzen" → `{t('dashboard.clearFilters')}`
- "Ergebnisse" → `{t('dashboard.results')}`
- "Exportieren Sie die gefilterten Werkstattdaten" → `{t('dashboard.exportData')}`
- "Einträge werden exportiert" → `{t('dashboard.entriesExported')}`
- "JSON" → `{t('dashboard.json')}`
- "CSV" → `{t('dashboard.csv')}`
- "API" → `{t('dashboard.api')}`
- "Stand:" → `{t('common.dataAsOf')}:`
- "gesamt" → `{t('common.total')}`
- "Telefon" → `{t('dashboard.phone')}`
- "E-Mail" → `{t('dashboard.email')}`
- "Webseite" → `{t('dashboard.website')}`
- "Details" → `{t('dashboard.details')}`

### 2. CompanyFoundingsPageIntegrated.jsx
Ersetze:
- "Unternehmensgründungen" → `{t('foundings.title')}`
- "Neue Werkstatt-Eintragungen und Firmen-Neugründungen" → `{t('foundings.subtitle')}`
- "Suche nach Firmenname oder Stadt..." → `{t('foundings.searchPlaceholder')}`
- "Von" → `{t('foundings.dateFrom')}`
- "Bis" → `{t('foundings.dateTo')}`
- "Nach Datum filtern" → `{t('foundings.filterByDate')}`
- "Unternehmen" → `{t('foundings.companies')}`
- "Ereignisse" → `{t('foundings.events')}`
- "Exportieren Sie die gefilterten Unternehmensdaten" → `{t('foundings.exportData')}`
- "Firmenname" → `{t('foundings.companyName')}`
- "Gründungsdatum" → `{t('foundings.foundingDate')}`
- "Registergericht" → `{t('foundings.registrationCourt')}`
- "Registernummer" → `{t('foundings.registrationNumber')}`
- "Rechtsform" → `{t('foundings.legalForm')}`
- "Werkstatt anzeigen" → `{t('foundings.viewWorkshop')}`

### 3. ManagementChangesPageIntegrated.jsx
Ersetze:
- "Management-Änderungen" → `{t('managementChanges.title')}`
- "Änderungen in der Unternehmensführung und Eigentümerstrukturen" → `{t('managementChanges.subtitle')}`
- "Suche nach Firmen- oder Geschäftsführername..." → `{t('managementChanges.searchPlaceholder')}`
- "Unternehmen" → `{t('managementChanges.companies')}`
- "Ereignisse" → `{t('managementChanges.events')}`
- "Exportieren Sie die gefilterten Management-Änderungsdaten" → `{t('managementChanges.exportData')}`
- "Änderungsdatum" → `{t('managementChanges.changeDate')}`
- "Änderungstyp" → `{t('managementChanges.changeType')}`
- "Geschäftsführer" → `{t('managementChanges.managerName')}`
- "Position" → `{t('managementChanges.position')}`
- "Werkstatt anzeigen" → `{t('managementChanges.viewWorkshop')}`

### 4. DetailPageComprehensive.jsx
Ersetze:
- "Zurück zur Übersicht" → `{t('detailPage.backToOverview')}`
- "Export" → `{t('detailPage.export')}`
- "JSON" → `{t('detailPage.json')}`
- "CSV" → `{t('detailPage.csv')}`
- "API" → `{t('detailPage.api')}`
- "Basisinformationen" → `{t('detailPage.basicInfo')}`
- "Name" → `{t('detailPage.name')}`
- "Straße" → `{t('detailPage.street')}`
- "Stadt" → `{t('detailPage.city')}`
- "PLZ" → `{t('detailPage.zipCode')}`
- "Land" → `{t('detailPage.country')}`
- "Telefon" → `{t('detailPage.phone')}`
- "Fax" → `{t('detailPage.fax')}`
- "E-Mail" → `{t('detailPage.email')}`
- "Webseite" → `{t('detailPage.website')}`
- "Koordinaten" → `{t('detailPage.coordinates')}`
- "Öffnungszeiten" → `{t('detailPage.openingHours')}`
- "Aktueller Status" → `{t('detailPage.currentStatus')}`
- "Geöffnet" → `{t('detailPage.open')}`
- "Geschlossen" → `{t('detailPage.closed')}`
- "Unbekannt" → `{t('detailPage.unknown')}`
- "Montag" → `{t('detailPage.monday')}`
- "Dienstag" → `{t('detailPage.tuesday')}`
- "Mittwoch" → `{t('detailPage.wednesday')}`
- "Donnerstag" → `{t('detailPage.thursday')}`
- "Freitag" → `{t('detailPage.friday')}`
- "Samstag" → `{t('detailPage.saturday')}`
- "Sonntag" → `{t('detailPage.sunday')}`
- "Konzepte & Netzwerke" → `{t('detailPage.concepts')}`
- "Leistungen" → `{t('detailPage.services')}`
- "Unternehmensinformationen" → `{t('detailPage.companyInfo')}`
- "Firmennname" → `{t('detailPage.legalName')}`
- "Rechtsform" → `{t('detailPage.legalForm')}`
- "Gründungsdatum" → `{t('detailPage.foundingDate')}`
- "Registergericht" → `{t('detailPage.registrationCourt')}`
- "Registernummer" → `{t('detailPage.registrationNumber')}`
- "Unternehmenschronik" → `{t('detailPage.timeline')}`
- "Gründungen" → `{t('detailPage.foundings')}`
- "Management-Änderungen" → `{t('detailPage.managementChanges')}`
- "Keine Ereignisse erfasst" → `{t('detailPage.noEvents')}`
- "Bewertung" → `{t('detailPage.rating')}`
- "Bewertungen" → `{t('detailPage.reviews')}`
- "Karte" → `{t('detailPage.map')}`
- "Standort" → `{t('detailPage.location')}`

### 5. APIDocumentation.jsx
Ersetze alle Texte mit `t('api.*')` Keys (siehe en.json/de.json für vollständige Liste)

## 🚀 Schneller Weg

Nutze Find & Replace (Regex) in VS Code:
1. Öffne jede Komponente
2. Finde: `"([^"]+)"` oder `'([^']+)'`
3. Prüfe jeden Match einzeln
4. Ersetze durch entsprechenden `{t('key')}` Aufruf

Alle Keys sind bereits in `src/locales/en.json` und `src/locales/de.json` definiert!

