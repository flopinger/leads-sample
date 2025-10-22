import express from 'express';
import swaggerUi from 'swagger-ui-express';
import yaml from 'yamljs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Load OpenAPI specification
const openapiDocument = yaml.load(path.join(__dirname, '..', 'openapi.yaml'));

// Swagger UI options
const swaggerOptions = {
  explorer: true,
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: "Auteon API Docs",
  customfavIcon: "/favicon.ico"
};

// Serve Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openapiDocument, swaggerOptions));

// Serve OpenAPI spec as JSON
app.get('/openapi.json', (req, res) => {
  res.json(openapiDocument);
});

// Serve OpenAPI spec as YAML
app.get('/openapi.yaml', (req, res) => {
  res.type('text/yaml');
  res.sendFile(path.join(__dirname, '..', 'openapi.yaml'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ API Documentation: http://localhost:${PORT}/api-docs`);
  console.log(`📄 OpenAPI JSON: http://localhost:${PORT}/openapi.json`);
  console.log(`📄 OpenAPI YAML: http://localhost:${PORT}/openapi.yaml`);
});

