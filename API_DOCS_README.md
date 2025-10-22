# API Dokumentation Setup

Diese Anleitung beschreibt, wie Sie die OpenAPI 3.1 Dokumentation für die Auteon API nutzen und bereitstellen.

## 📋 Übersicht

Die API-Dokumentation basiert auf OpenAPI 3.1 und kann auf verschiedene Arten bereitgestellt werden:

1. **Mit Express + swagger-ui-express** (Node.js Server)
2. **Statisch** (HTML-Datei mit CDN)
3. **Integration in bestehenden Server**

---

## 🚀 Variante 1: Standalone Express Server

### Installation

```bash
npm install swagger-ui-express yamljs
```

### Server starten

```bash
node server/swagger-setup.js
```

Dann öffnen Sie: **http://localhost:3000/api-docs**

### Endpunkte

- `/api-docs` - Swagger UI Interface
- `/openapi.json` - OpenAPI Spec als JSON
- `/openapi.yaml` - OpenAPI Spec als YAML

---

## 🌐 Variante 2: Statische HTML-Datei

Die Datei `public/api-docs.html` ist fertig vorbereitet.

### Nutzung mit Vite Dev Server

1. Starten Sie Ihren Vite Dev Server:
   ```bash
   npm run dev
   ```

2. Öffnen Sie: **http://localhost:5173/api-docs.html**

### Nutzung in Production

Nach dem Build ist die Dokumentation unter folgender URL verfügbar:
```
https://data-sample.auteon.net/api-docs.html
```

---

## 🔧 Variante 3: Integration in bestehenden Express Server

Fügen Sie folgende Zeilen in `server/index.js` ein:

```javascript
import swaggerUi from 'swagger-ui-express';
import yaml from 'yamljs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load OpenAPI specification
const openapiDocument = yaml.load(path.join(__dirname, '..', 'openapi.yaml'));

// Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openapiDocument, {
  explorer: true,
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: "Auteon API Docs"
}));

// Serve OpenAPI spec
app.get('/openapi.json', (req, res) => res.json(openapiDocument));
```

---

## ✅ Validierung & Linting

### 1. Installation der Tools

```bash
npm install -D @redocly/cli
# oder
npm install -D swagger-cli
```

### 2. OpenAPI Spec validieren

Mit Redocly:
```bash
npx @redocly/cli lint openapi.yaml
```

Mit Swagger CLI:
```bash
npx swagger-cli validate openapi.yaml
```

### 3. OpenAPI Spec bundlen (optional)

```bash
npx @redocly/cli bundle openapi.yaml -o openapi-bundled.yaml
```

### 4. HTML-Dokumentation generieren (optional)

```bash
npx @redocly/cli build-docs openapi.yaml -o docs/index.html
```

---

## 🔄 CI/CD Integration

### GitHub Actions Workflow

Erstellen Sie `.github/workflows/openapi-lint.yml`:

```yaml
name: OpenAPI Validation

on:
  pull_request:
    paths:
      - 'openapi.yaml'
      - 'api/**'

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install Redocly CLI
        run: npm install -g @redocly/cli
      
      - name: Validate OpenAPI Spec
        run: redocly lint openapi.yaml
      
      - name: Check for breaking changes
        run: |
          # Compare with main branch
          git fetch origin main
          redocly diff openapi.yaml origin/main:openapi.yaml
```

---

## 📝 API Änderungen dokumentieren

### Workflow bei API-Änderungen

1. **Endpunkt hinzufügen/ändern** in `api/v1/*.js`
2. **OpenAPI Spec aktualisieren** in `openapi.yaml`:
   - Neuen Pfad unter `paths` hinzufügen
   - Schema unter `components/schemas` definieren
   - Beispiele hinzufügen
3. **Validieren**:
   ```bash
   npx @redocly/cli lint openapi.yaml
   ```
4. **Testen** in Swagger UI
5. **Committen & Pushen**

### Breaking Changes erkennen

```bash
# Vergleich mit vorheriger Version
npx @redocly/cli diff openapi.yaml openapi-old.yaml
```

Breaking Changes sind:
- Entfernte Endpunkte
- Entfernte/umbenannte Parameter
- Geänderte Response-Strukturen
- Neue Required-Fields

---

## 🎨 Swagger UI Anpassungen

### Theme anpassen

In `public/api-docs.html` können Sie CSS hinzufügen:

```html
<style>
  .swagger-ui .topbar { display: none; }
  .swagger-ui .info .title { color: #1a73e8; }
  /* Weitere Anpassungen */
</style>
```

### Plugins & Features

Aktivieren Sie zusätzliche Features:

```javascript
SwaggerUIBundle({
  // ...
  persistAuthorization: true,  // API-Key wird gespeichert
  displayRequestDuration: true, // Zeigt Request-Dauer
  filter: true,                 // Suchfeld aktivieren
  syntaxHighlight: {
    activate: true,
    theme: "monokai"
  }
});
```

---

## 🔐 Authentifizierung testen

1. Öffnen Sie Swagger UI
2. Klicken Sie auf **"Authorize"** (Schloss-Symbol)
3. Geben Sie Ihren API-Key ein: `sk_xxx...`
4. Klicken Sie **"Authorize"**
5. Testen Sie nun die Endpunkte mit **"Try it out"**

---

## 📦 Deployment Checkliste

- [ ] `openapi.yaml` ist validiert (`npx @redocly/cli lint openapi.yaml`)
- [ ] Alle Beispiele funktionieren
- [ ] API-Keys sind nicht hardcoded
- [ ] Server URLs sind korrekt (Production/Staging)
- [ ] Swagger UI ist unter `/api-docs` erreichbar
- [ ] CORS-Header sind korrekt gesetzt (falls Frontend auf anderer Domain)
- [ ] Rate Limiting ist dokumentiert
- [ ] Versionierung ist klar (z.B. `/v1/`, `/v2/`)

---

## 🆘 Troubleshooting

### Problem: "Failed to fetch"

**Lösung:** CORS-Header prüfen. In Express:
```javascript
app.use(cors({ origin: 'https://data-sample.auteon.net' }));
```

### Problem: API-Key wird nicht akzeptiert

**Lösung:** Header-Name prüfen. Muss exakt `X-API-Key` sein (case-sensitive).

### Problem: Swagger UI lädt nicht

**Lösung:** 
1. Browser-Console auf Fehler prüfen
2. CDN-URLs auf Erreichbarkeit testen
3. Pfad zu `/openapi.yaml` prüfen

### Problem: Schema-Validierung schlägt fehl

**Lösung:** 
```bash
npx @redocly/cli lint openapi.yaml --format=stylish
```

---

## 📚 Weiterführende Links

- [OpenAPI 3.1 Specification](https://spec.openapis.org/oas/v3.1.0)
- [Swagger UI Documentation](https://swagger.io/docs/open-source-tools/swagger-ui/)
- [Redocly CLI](https://redocly.com/docs/cli/)
- [OpenAPI Best Practices](https://github.com/openapi-contrib/style-guides)

---

## 🤝 Support

Bei Fragen zur API-Dokumentation wenden Sie sich an:
- **E-Mail:** fp@auteon.de
- **Website:** https://auteon.de

