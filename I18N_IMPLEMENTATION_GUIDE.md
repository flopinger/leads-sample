# i18n Implementation Guide

## ✅ Already Implemented

1. **Language Files** (`src/locales/en.json`, `src/locales/de.json`)
   - Complete translations for all major UI elements
   - English as default language

2. **Language Context** (`src/contexts/LanguageContext.jsx`)
   - Global language state management
   - `useLanguage()` hook with `t()` function
   - Session-based language switching (persists in localStorage)

3. **Language Switcher** (`src/components/LanguageSwitcher.jsx`)
   - Dropdown component with flags
   - Can be placed anywhere in the app

4. **Backend Integration** (`api/me.js`)
   - Returns `userLanguage` from Supabase `tenants.user_language`
   - Sets initial language based on user preference

5. **App Setup** (`src/App.jsx`)
   - LanguageProvider wraps entire app
   - User language loaded from backend
   - Language switcher available

6. **LoginPage** ✅ FULLY TRANSLATED
   - All texts use `t()` function
   - Language switcher in top-right corner

## 🔄 To Be Completed

### Pattern für Component-Übersetzung:

```javascript
// 1. Import useLanguage
import { useLanguage } from '../contexts/LanguageContext';

// 2. Use in component
const MyComponent = () => {
  const { t } = useLanguage();
  
  // 3. Replace hard-coded text
  return <h1>{t('dashboard.title')}</h1>;
};
```

### Priorität der Komponenten:

1. **HeaderIntegrated** - Header mit Navigation
   - Replace: "Werkstätten", "Gründungen", "Management-Änderungen", "Abmelden"
   - Add: Language Switcher neben User-Dropdown

2. **Dashboard** / **DashboardIntegrated**
   - Replace: "Werkstattadressen-Sample", "Suche", "Filter", "Export", etc.
   - Keys: `t('dashboard.*')`

3. **CompanyFoundingsPageIntegrated**
   - Replace: "Unternehmensgründungen", "Gründungsdatum", etc.
   - Keys: `t('foundings.*')`

4. **ManagementChangesPageIntegrated**
   - Replace: "Management-Änderungen", "Änderungsdatum", etc.
   - Keys: `t('managementChanges.*')`

5. **DetailPageComprehensive**
   - Replace: "Basisinformationen", "Öffnungszeiten", etc.
   - Keys: `t('detailPage.*')`

6. **APIDocumentation**
   - Replace: "API-Dokumentation", "Ihr API Key", etc.
   - Keys: `t('api.*')`

## 🚀 Quick Start für Entwickler

```bash
# 1. System ist bereits vorbereitet!
# 2. Füge Language Switcher zu HeaderIntegrated hinzu:

import LanguageSwitcher from './LanguageSwitcher';

// Im Header JSX:
<LanguageSwitcher variant="ghost" size="sm" />

# 3. Für jede Komponente:
# - Import useLanguage
# - const { t } = useLanguage()
# - Replace strings mit t('key')
```

## 📝 Supabase Setup

```sql
-- Füge user_language zu tenants hinzu (if not exists):
ALTER TABLE public.tenants 
ADD COLUMN IF NOT EXISTS user_language VARCHAR(2) DEFAULT 'en';

-- Update bestehende User:
UPDATE public.tenants 
SET user_language = 'de' 
WHERE username IN ('zf', 'auteon');
```

## 🎯 Status

- ✅ Infrastructure (Context, Provider, Switcher)
- ✅ Translation Files (en.json, de.json)
- ✅ Backend Integration (user_language field)
- ✅ App.jsx (LanguageProvider wrapper)
- ✅ LoginPage (fully translated)
- ⏳ Other Components (need translation pattern applied)

Die Grundlagen sind gelegt! Jede Komponente kann nun Schritt für Schritt übersetzt werden.

