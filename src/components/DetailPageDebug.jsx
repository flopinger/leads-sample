import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  MapPin, 
  Phone, 
  Mail, 
  Globe, 
  Clock, 
  Building,
  CheckCircle,
  XCircle
} from 'lucide-react';

const DetailPageDebug = ({ data }) => {
  const { id } = useParams();
  
  console.log('DetailPageDebug - ID:', id);
  console.log('DetailPageDebug - Data length:', data?.length);
  console.log('DetailPageDebug - First item:', data?.[0]);

  const item = data?.find(workshop => workshop.id === id);
  console.log('DetailPageDebug - Found item:', item);

  if (!item) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Werkstatt nicht gefunden</h2>
            <p className="text-gray-600 mb-4">ID: {id}</p>
            <p className="text-gray-600 mb-4">Data items: {data?.length || 0}</p>
            <Link to="/">
              <Button className="bg-[#005787] hover:bg-[#004066]">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Zurück zur Übersicht
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Link to="/">
            <Button variant="outline" className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Zurück zur Übersicht
            </Button>
          </Link>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {item.name || 'Unbekannt'}
          </h1>
          
          <Badge className="bg-green-100 text-green-800 border-green-200">
            <CheckCircle className="mr-1 h-3 w-3" />
            Debug Version
          </Badge>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Basic Information */}
          <Card className="border border-gray-200 shadow-md bg-white">
            <CardHeader>
              <CardTitle className="flex items-center text-gray-900">
                <Building className="mr-2 h-5 w-5 text-[#005787]" />
                Grundinformationen
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <strong>Name:</strong> {item.name || 'N/A'}
              </div>
              <div>
                <strong>Stadt:</strong> {item.city || 'N/A'}
              </div>
              <div>
                <strong>PLZ:</strong> {item.zip_code || 'N/A'}
              </div>
              <div>
                <strong>Straße:</strong> {item.street || 'N/A'} {item.house_number || ''}
              </div>
              <div>
                <strong>Status:</strong> {item.operational_status || 'N/A'}
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card className="border border-gray-200 shadow-md bg-white">
            <CardHeader>
              <CardTitle className="flex items-center text-gray-900">
                <Phone className="mr-2 h-5 w-5 text-[#005787]" />
                Kontaktdaten
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <strong>Telefon:</strong> {item.contact_telephone || 'N/A'}
              </div>
              <div>
                <strong>E-Mail:</strong> {item.email_1 || 'N/A'}
              </div>
              <div>
                <strong>Website:</strong> {item.website_url || 'N/A'}
              </div>
            </CardContent>
          </Card>

          {/* Working Hours */}
          <Card className="border border-gray-200 shadow-md bg-white">
            <CardHeader>
              <CardTitle className="flex items-center text-gray-900">
                <Clock className="mr-2 h-5 w-5 text-[#005787]" />
                Öffnungszeiten
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div>
                <strong>Strukturiert:</strong> {item.working_hours_structured || 'N/A'}
              </div>
              <div className="mt-2">
                <strong>Text:</strong> {item.working_hours_text || 'N/A'}
              </div>
            </CardContent>
          </Card>

          {/* Debug Information */}
          <Card className="border border-gray-200 shadow-md bg-white">
            <CardHeader>
              <CardTitle className="text-gray-900">Debug Info</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm space-y-2">
                <div><strong>ID:</strong> {item.id}</div>
                <div><strong>Concepts:</strong> {item.concepts_networks || 'N/A'}</div>
                <div><strong>Relationships:</strong> {item.relationships?.length || 0} items</div>
                <div><strong>Updated:</strong> {item.updated_at || 'N/A'}</div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default DetailPageDebug;
