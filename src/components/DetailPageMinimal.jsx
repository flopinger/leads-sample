import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

const DetailPageMinimal = ({ data }) => {
  const { id } = useParams();
  
  console.log('DetailPageMinimal rendered');
  console.log('ID:', id);
  console.log('Data available:', !!data);
  
  if (!data) {
    return <div>No data provided</div>;
  }

  const item = data.find(workshop => workshop.id === id);
  
  if (!item) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Werkstatt nicht gefunden</h1>
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
    <div className="container mx-auto px-4 py-8">
      <Link to="/">
        <Button variant="outline" className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Zurück zur Übersicht
        </Button>
      </Link>
      
      <h1 className="text-2xl font-bold mb-4">{item.name}</h1>
      <p>ID: {item.id}</p>
      <p>Stadt: {item.city}</p>
      <p>Telefon: {item.contact_telephone}</p>
    </div>
  );
};

export default DetailPageMinimal;
