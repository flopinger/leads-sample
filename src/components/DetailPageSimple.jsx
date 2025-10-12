import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

const DetailPageSimple = ({ data }) => {
  const { id } = useParams();
  
  console.log('DetailPage rendered with ID:', id);
  console.log('Data length:', data?.length);
  
  if (!data) {
    return <div>No data provided</div>;
  }

  const item = data.find(workshop => workshop.id === id);
  
  console.log('Item found:', !!item);
  
  if (!item) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Werkstatt nicht gefunden</h1>
          <p className="text-muted-foreground mb-4">
            Die angeforderte Werkstatt konnte nicht gefunden werden.
          </p>
          <p className="text-sm text-muted-foreground mb-4">
            Gesuchte ID: {id}
          </p>
          <Link to="/">
            <Button>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Zurück zur Übersicht
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link to="/">
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Zurück zur Übersicht
          </Button>
        </Link>
      </div>

      {/* Basic Info */}
      <div className="bg-white p-6 rounded-lg border">
        <h1 className="text-2xl font-bold mb-4">{item.name}</h1>
        <p className="text-gray-600 mb-2">
          {item.street} {item.house_number}, {item.zip_code} {item.city}
        </p>
        {item.contact_telephone && (
          <p className="text-blue-600">📞 {item.contact_telephone}</p>
        )}
        {item.email_1 && (
          <p className="text-blue-600">✉️ {item.email_1}</p>
        )}
        {item.website_url && (
          <p className="text-blue-600">🌐 <a href={item.website_url} target="_blank" rel="noopener noreferrer">Website</a></p>
        )}
      </div>

      {/* Debug Info */}
      <div className="bg-gray-100 p-4 rounded-lg">
        <h3 className="font-bold mb-2">Debug Info:</h3>
        <p>ID: {item.id}</p>
        <p>Data keys: {Object.keys(item).join(', ')}</p>
        <p>Relationships: {item.relationships?.length || 0}</p>
        <p>Concepts: {item.concepts_networks?.length || 0}</p>
      </div>
    </div>
  );
};

export default DetailPageSimple;
