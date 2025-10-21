import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Code, 
  Copy, 
  CheckCircle, 
  AlertCircle, 
  Key, 
  TrendingUp, 
  Calendar,
  Shield,
  Zap
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

const APIDocumentation = ({ apiKey, apiUsage, apiLimit, apiValidTo }) => {
  const { t } = useLanguage();
  const [copied, setCopied] = useState(false);
  const [usageData, setUsageData] = useState(null);

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Fetch current usage
  useEffect(() => {
    if (apiKey) {
      fetchUsage();
    }
  }, [apiKey]);

  const fetchUsage = async () => {
    try {
      const res = await fetch('/api/v1/usage', {
        headers: { 'X-API-Key': apiKey }
      });
      if (res.ok) {
        const data = await res.json();
        setUsageData(data);
      }
    } catch (error) {
      console.error('Failed to fetch usage:', error);
    }
  };

  const getUsagePercentage = () => {
    if (!apiLimit) return 0;
    return ((apiUsage || 0) / apiLimit) * 100;
  };

  const getUsageColor = () => {
    const percentage = getUsagePercentage();
    if (percentage >= 90) return 'text-red-600';
    if (percentage >= 75) return 'text-orange-600';
    return 'text-green-600';
  };

  const isExpired = apiValidTo && new Date(apiValidTo) < new Date();
  const isLimitReached = apiLimit && (apiUsage || 0) >= apiLimit;

  const codeExamples = {
    curl: {
      workshops: `curl -X GET "https://data-sample.auteon.net/api/v1/workshops?limit=10" \\
  -H "X-API-Key: ${apiKey || 'YOUR_API_KEY'}"`,
      workshopsFiltered: `curl -X GET "https://data-sample.auteon.net/api/v1/workshops?city=Berlin&concept=BOSCH+Car+Service" \\
  -H "X-API-Key: ${apiKey || 'YOUR_API_KEY'}"`,
      workshopDetail: `curl -X GET "https://data-sample.auteon.net/api/v1/workshops/123" \\
  -H "X-API-Key: ${apiKey || 'YOUR_API_KEY'}"`,
      foundings: `curl -X GET "https://data-sample.auteon.net/api/v1/foundings?dateFrom=2024-01-01&limit=50" \\
  -H "X-API-Key: ${apiKey || 'YOUR_API_KEY'}"`,
      managementChanges: `curl -X GET "https://data-sample.auteon.net/api/v1/management-changes?search=GmbH&limit=50" \\
  -H "X-API-Key: ${apiKey || 'YOUR_API_KEY'}"`,
      usage: `curl -X GET "https://data-sample.auteon.net/api/v1/usage" \\
  -H "X-API-Key: ${apiKey || 'YOUR_API_KEY'}"`
    },
    javascript: {
      workshops: `const response = await fetch('https://data-sample.auteon.net/api/v1/workshops?limit=10', {
  headers: {
    'X-API-Key': '${apiKey || 'YOUR_API_KEY'}'
  }
});
const data = await response.json();
console.log(data);`,
      python: `import requests

headers = {
    'X-API-Key': '${apiKey || 'YOUR_API_KEY'}'
}

response = requests.get(
    'https://data-sample.auteon.net/api/v1/workshops',
    headers=headers,
    params={'limit': 10}
)

data = response.json()
print(data)`
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">{t('api.title')}</h1>
          <p className="text-gray-600 mt-2">{t('api.subtitle')}</p>
        </div>
        
        <div className="space-y-6">
      {/* API Key und Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Key className="h-5 w-5 mr-2" />
            {t('api.apiKeyStatus')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* API Key */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              {t('api.yourApiKey')}
            </label>
            {apiKey ? (
              <div className="flex items-center space-x-2">
                <code className="flex-1 bg-gray-100 px-3 py-2 rounded font-mono text-sm break-all">
                  {apiKey}
                </code>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => copyToClipboard(apiKey)}
                >
                  {copied ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            ) : (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Kein API Key vorhanden. Bitte kontaktieren Sie den Support.
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* Status Warnings */}
          {isExpired && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Ihr API-Zugang ist am {new Date(apiValidTo).toLocaleDateString('de-DE')} abgelaufen.
              </AlertDescription>
            </Alert>
          )}

          {isLimitReached && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {t('api.limitReachedMsg')}
              </AlertDescription>
            </Alert>
          )}

          {/* Usage Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">{t('api.usage')}</span>
                <TrendingUp className="h-4 w-4 text-gray-400" />
              </div>
              <p className={`text-2xl font-bold ${getUsageColor()}`}>
                {(apiUsage || 0).toLocaleString()}
                {apiLimit && (
                  <span className="text-sm text-gray-500 font-normal ml-2">
                    / {apiLimit.toLocaleString()}
                  </span>
                )}
              </p>
              {apiLimit && (
                <div className="mt-2 bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      getUsagePercentage() >= 90 ? 'bg-red-600' :
                      getUsagePercentage() >= 75 ? 'bg-orange-600' :
                      'bg-green-600'
                    }`}
                    style={{ width: `${Math.min(getUsagePercentage(), 100)}%` }}
                  />
                </div>
              )}
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">{t('api.limit')}</span>
                <Shield className="h-4 w-4 text-gray-400" />
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {apiLimit ? apiLimit.toLocaleString() : t('api.unlimited')}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                {t('api.datasets')}
              </p>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">{t('api.validUntil')}</span>
                <Calendar className="h-4 w-4 text-gray-400" />
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {apiValidTo ? new Date(apiValidTo).toLocaleDateString('de-DE') : t('api.unlimited')}
              </p>
              {apiValidTo && (
                <p className="text-sm text-gray-500 mt-1">
                  {Math.ceil((new Date(apiValidTo) - new Date()) / (1000 * 60 * 60 * 24))} {t('common.days')}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* API Documentation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Code className="h-5 w-5 mr-2" />
            {t('api.documentation')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="overview">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Übersicht</TabsTrigger>
              <TabsTrigger value="workshops">Werkstätten</TabsTrigger>
              <TabsTrigger value="foundings">Gründungen</TabsTrigger>
              <TabsTrigger value="management">Management</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6 mt-6">
              <div className="prose max-w-none space-y-6">
                <h3 className="text-xl font-bold mt-0">Willkommen zur API</h3>
                <p>
                  Diese API ermöglicht Ihnen den programmatischen Zugriff auf Werkstattdaten,
                  Unternehmensgründungen und Management-Änderungen.
                </p>

                <div className="mt-6">
                  <h4 className="text-lg font-semibold mb-2">Base URL</h4>
                  <code className="block bg-gray-100 p-3 rounded">
                    https://data-sample.auteon.net/api/v1
                  </code>
                </div>

                <div className="mt-6">
                  <h4 className="text-lg font-semibold mb-2">Authentifizierung</h4>
                <p>
                  Alle API-Anfragen müssen mit Ihrem API-Key authentifiziert werden.
                  Übergeben Sie den Key im <code>X-API-Key</code> Header:
                </p>
                  <pre className="bg-gray-100 p-4 rounded overflow-x-auto mt-3">
                    <code>X-API-Key: {apiKey || 'YOUR_API_KEY'}</code>
                  </pre>
                </div>

                <div className="mt-6">
                  <h4 className="text-lg font-semibold mb-2">{t('api.rateLimits')}</h4>
                  <ul className="space-y-2">
                    <li>{t('api.yourLimit')}: <strong>{apiLimit ? apiLimit.toLocaleString() : t('api.unlimited')}</strong> {t('api.datasets')}</li>
                    <li>{t('api.alreadyUsed')}: <strong>{(apiUsage || 0).toLocaleString()}</strong> {t('api.datasets')}</li>
                    <li>{t('api.remainingDatasets')}: <strong>{apiLimit ? (apiLimit - (apiUsage || 0)).toLocaleString() : t('api.unlimited')}</strong> {t('api.datasets')}</li>
                  </ul>
                </div>

                <div className="mt-6">
                  <h4 className="text-lg font-semibold mb-2">Response Format</h4>
                  <p>{t('api.responseText')}</p>
                  <pre className="bg-gray-100 p-4 rounded overflow-x-auto text-sm mt-3">
{`{
  "metadata": {
    "total": 750,
    "returned": 10,
    "offset": 0,
    "limit": 10,
    "usage": {
      "current": 1250,
      "limit": 10000,
      "remaining": 8750
    }
  },
  "data": [ /* results */ ]
}`}
                  </pre>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="workshops" className="space-y-6 mt-6">
              <div className="space-y-8">
                <div>
                  <h3 className="text-xl font-bold mb-3">GET /workshops</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Ruft eine Liste von Werkstätten ab. Unterstützt Filterung und Paginierung.
                  </p>

                  <h4 className="font-semibold mb-3 mt-4">Query Parameter</h4>
                  <div className="space-y-2 text-sm bg-gray-50 p-4 rounded">
                    <div className="flex"><code className="bg-gray-100 px-2 py-1 rounded mr-2">search</code> <span className="text-gray-600">Suche nach Name, Stadt oder PLZ</span></div>
                    <div className="flex"><code className="bg-gray-100 px-2 py-1 rounded mr-2">city</code> <span className="text-gray-600">Filter nach Stadt</span></div>
                    <div className="flex"><code className="bg-gray-100 px-2 py-1 rounded mr-2">zipCode</code> <span className="text-gray-600">Filter nach PLZ</span></div>
                    <div className="flex"><code className="bg-gray-100 px-2 py-1 rounded mr-2">concept</code> <span className="text-gray-600">Filter nach Konzept</span></div>
                    <div className="flex"><code className="bg-gray-100 px-2 py-1 rounded mr-2">limit</code> <span className="text-gray-600">Max. Anzahl Ergebnisse (default: 100, max: 1000)</span></div>
                    <div className="flex"><code className="bg-gray-100 px-2 py-1 rounded mr-2">offset</code> <span className="text-gray-600">Offset für Paginierung (default: 0)</span></div>
                  </div>

                  <h4 className="font-semibold mt-6 mb-3">Beispiel</h4>
                  <pre className="bg-gray-900 text-gray-100 p-4 rounded overflow-x-auto text-xs">
                    <code>{codeExamples.curl.workshopsFiltered}</code>
                  </pre>
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-2"
                    onClick={() => copyToClipboard(codeExamples.curl.workshopsFiltered)}
                  >
                    {copied ? <CheckCircle className="h-3 w-3 mr-1" /> : <Copy className="h-3 w-3 mr-1" />}
                    Kopieren
                  </Button>
                </div>

                <div className="pt-4 border-t">
                  <h3 className="text-xl font-bold mb-3">GET /workshops/:id</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Ruft Details zu einer einzelnen Werkstatt ab.
                  </p>

                  <h4 className="font-semibold mt-4 mb-3">Beispiel</h4>
                  <pre className="bg-gray-900 text-gray-100 p-4 rounded overflow-x-auto text-xs">
                    <code>{codeExamples.curl.workshopDetail}</code>
                  </pre>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="foundings" className="space-y-6 mt-6">
              <div>
                <h3 className="text-xl font-bold mb-3">GET /foundings</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Ruft Daten zu Unternehmensgründungen ab.
                </p>

                <h4 className="font-semibold mb-3 mt-4">Query Parameter</h4>
                <div className="space-y-2 text-sm bg-gray-50 p-4 rounded">
                  <div className="flex"><code className="bg-gray-100 px-2 py-1 rounded mr-2">search</code> <span className="text-gray-600">Suche nach Firmenname oder Stadt</span></div>
                  <div className="flex"><code className="bg-gray-100 px-2 py-1 rounded mr-2">dateFrom</code> <span className="text-gray-600">Gründungen ab Datum (YYYY-MM-DD)</span></div>
                  <div className="flex"><code className="bg-gray-100 px-2 py-1 rounded mr-2">dateTo</code> <span className="text-gray-600">Gründungen bis Datum (YYYY-MM-DD)</span></div>
                  <div className="flex"><code className="bg-gray-100 px-2 py-1 rounded mr-2">limit</code> <span className="text-gray-600">Max. Anzahl Ergebnisse</span></div>
                  <div className="flex"><code className="bg-gray-100 px-2 py-1 rounded mr-2">offset</code> <span className="text-gray-600">Offset für Paginierung</span></div>
                </div>

                <h4 className="font-medium mt-4 mb-2">Beispiel</h4>
                <pre className="bg-gray-900 text-gray-100 p-4 rounded overflow-x-auto text-xs">
                  <code>{codeExamples.curl.foundings}</code>
                </pre>
              </div>
            </TabsContent>

            <TabsContent value="management" className="space-y-6 mt-6">
              <div>
                <h3 className="text-xl font-bold mb-3">GET /management-changes</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Ruft Daten zu Management-Änderungen ab.
                </p>

                <h4 className="font-medium mb-2">Query Parameter</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex"><code className="bg-gray-100 px-2 py-1 rounded mr-2">search</code> <span className="text-gray-600">Suche nach Firmenname oder Stadt</span></div>
                  <div className="flex"><code className="bg-gray-100 px-2 py-1 rounded mr-2">dateFrom</code> <span className="text-gray-600">Änderungen ab Datum (YYYY-MM-DD)</span></div>
                  <div className="flex"><code className="bg-gray-100 px-2 py-1 rounded mr-2">dateTo</code> <span className="text-gray-600">Änderungen bis Datum (YYYY-MM-DD)</span></div>
                  <div className="flex"><code className="bg-gray-100 px-2 py-1 rounded mr-2">limit</code> <span className="text-gray-600">Max. Anzahl Ergebnisse</span></div>
                  <div className="flex"><code className="bg-gray-100 px-2 py-1 rounded mr-2">offset</code> <span className="text-gray-600">Offset für Paginierung</span></div>
                </div>

                <h4 className="font-medium mt-4 mb-2">Beispiel</h4>
                <pre className="bg-gray-900 text-gray-100 p-4 rounded overflow-x-auto text-xs">
                  <code>{codeExamples.curl.managementChanges}</code>
                </pre>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
        </div>
      </div>
    </div>
  );
};

export default APIDocumentation;

