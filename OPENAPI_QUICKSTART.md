# OpenAPI 3.1 Dokumentation - Quick Start

## 🚀 Sofort loslegen (3 Optionen)

### Option 1: Statische HTML-Version (Einfachste Methode)

```bash
# 1. Dev-Server starten
npm run dev

# 2. Browser öffnen
open http://localhost:5173/api-docs.html
```

✅ **Production URL:** `https://data-sample.auteon.net/api-docs.html`

---

### Option 2: Standalone Swagger UI Server

```bash
# 1. Dependencies installieren
npm install

# 2. API-Docs Server starten
npm run api-docs

# 3. Browser öffnen
open http://localhost:3000/api-docs
```

**Verfügbare Endpunkte:**
- `/api-docs` → Swagger UI
- `/openapi.json` → Spec als JSON
- `/openapi.yaml` → Spec als YAML

---

### Option 3: Integration in bestehenden Server

Füge in `server/index.js` hinzu (bereits vorbereitet in `server/swagger-setup.js`):

```javascript
import swaggerUi from 'swagger-ui-express';
import yaml from 'yamljs';

const openapiDocument = yaml.load('./openapi.yaml');
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openapiDocument));
```

---

## ✅ 5 Validierungs-/Build-Schritte

### 1. OpenAPI Spec validieren

```bash
npm run openapi:validate
```

Oder direkt:
```bash
npx @redocly/cli lint openapi.yaml
```

**Erwartete Ausgabe:**
```
✅ openapi.yaml is valid
```

---

### 2. Spec bundeln (optional)

```bash
npm run openapi:bundle
```

Erstellt `openapi-bundled.yaml` mit allen $ref inline aufgelöst.

---

### 3. Swagger UI testen

```bash
# Starten
npm run api-docs

# Im Browser öffnen
open http://localhost:3000/api-docs
```

**Tests durchführen:**
1. Auf "Authorize" klicken
2. API-Key eingeben: `sk_xxxxx...`
3. Endpunkt auswählen (z.B. `GET /v1/workshops`)
4. "Try it out" klicken
5. Parameter eingeben
6. "Execute" klicken

✅ **Erfolg:** Status 200 + JSON Response

---

### 4. Breaking Changes erkennen

```bash
# Nach Git-Änderungen
git diff HEAD~1 openapi.yaml

# Automatisch mit Redocly
npx @redocly/cli diff openapi.yaml openapi-backup.yaml
```

**Breaking Changes sind:**
- ❌ Entfernte Endpunkte
- ❌ Entfernte Parameter
- ❌ Neue required Fields
- ❌ Geänderte Response-Typen
- ✅ Neue optionale Parameter (OK)
- ✅ Neue Endpunkte (OK)

---

### 5. CI/CD einrichten (GitHub Actions)

Erstelle `.github/workflows/openapi-lint.yml`:

```yaml
name: OpenAPI Lint

on:
  pull_request:
    paths:
      - 'openapi.yaml'

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Validate OpenAPI
        run: npx @redocly/cli lint openapi.yaml --format=github-actions
```

Dann bei jedem PR automatisch validiert! ✅

---

## 📋 API-Änderungen Workflow

### Wenn Sie die API ändern:

1. **Code ändern** (z.B. `api/v1/workshops.js`)
2. **OpenAPI aktualisieren**:
   ```yaml
   # In openapi.yaml
   paths:
     /v1/workshops:
       get:
         # Beschreibung aktualisieren
         # Parameter hinzufügen/ändern
         # Response-Schema anpassen
   ```
3. **Validieren**:
   ```bash
   npm run openapi:validate
   ```
4. **Testen in Swagger UI**:
   ```bash
   npm run api-docs
   ```
5. **Committen**:
   ```bash
   git add openapi.yaml public/openapi.yaml
   git commit -m "docs: update API spec for new filter parameter"
   ```

---

## 🎯 Häufige Tasks

### Neuen Endpunkt hinzufügen

```yaml
paths:
  /v1/new-endpoint:
    get:
      tags:
        - New Feature
      summary: Kurzbeschreibung
      parameters: [...]
      responses:
        '200':
          $ref: '#/components/responses/SuccessResponse'
```

### Neues Schema definieren

```yaml
components:
  schemas:
    NewDataType:
      type: object
      required:
        - id
      properties:
        id:
          type: string
        name:
          type: string
```

### Beispiel hinzufügen

```yaml
examples:
  success:
    summary: Erfolgreiche Antwort
    value:
      data: [...]
      metadata: {...}
```

---

## 🐛 Troubleshooting

### ❌ "Failed to fetch openapi.yaml"

**Problem:** Datei nicht gefunden

**Lösung:**
```bash
# Prüfen ob Datei existiert
ls -la public/openapi.yaml

# Falls nicht, kopieren
cp openapi.yaml public/openapi.yaml
```

---

### ❌ "Invalid schema"

**Problem:** YAML-Syntax-Fehler

**Lösung:**
```bash
# Detaillierte Fehlerausgabe
npx @redocly/cli lint openapi.yaml --format=stylish

# YAML-Parser testen
npx js-yaml openapi.yaml
```

---

### ❌ API-Key nicht akzeptiert

**Problem:** Header falsch

**Lösung:**
- Header muss **exakt** `X-API-Key` heißen (case-sensitive)
- In Swagger UI: "Authorize" Button verwenden

---

### ❌ CORS-Fehler

**Problem:** Cross-Origin Request blockiert

**Lösung in Express:**
```javascript
import cors from 'cors';
app.use(cors({
  origin: ['http://localhost:5173', 'https://data-sample.auteon.net'],
  credentials: true
}));
```

---

## 📚 Nächste Schritte

1. ✅ **Validierung läuft:** `npm run openapi:validate`
2. ✅ **Swagger UI funktioniert:** `npm run api-docs`
3. 📖 **Vollständige Anleitung lesen:** `API_DOCS_README.md`
4. 🚀 **Production deployen:** Dateien sind in `public/` Verzeichnis
5. 🔄 **CI/CD einrichten:** Workflow-Beispiel oben

---

## 🔗 Wichtige Links

- **Swagger UI Lokal:** http://localhost:3000/api-docs
- **Swagger UI Production:** https://data-sample.auteon.net/api-docs.html
- **OpenAPI Spec (YAML):** `/openapi.yaml`
- **OpenAPI Spec (JSON):** `/openapi.json`

---

## 💡 Pro-Tipps

1. **API-Key speichern:** Swagger UI merkt sich den Key im LocalStorage
2. **Filter nutzen:** Oben rechts in Swagger UI nach Endpunkten suchen
3. **Request Duration:** Aktiviert → Zeigt Performance
4. **Deep Linking:** URLs wie `/api-docs#/Workshops/getWorkshops` direkt teilen
5. **Download:** OpenAPI Spec als JSON/YAML downloaden für Postman/Insomnia

---

**Support:** fp@auteon.de | https://auteon.de

