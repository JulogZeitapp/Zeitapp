import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import ArbeitszeitForm from '@/components/ArbeitszeitForm';
import ArbeitszeitListe from '@/components/ArbeitszeitListe';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function Arbeitszeiten() {
  const { currentUser } = useAuth();
  const isChef = currentUser.role === 'chef';

  return (
    <div className="container mx-auto py-6 space-y-6">
      <h1 className="text-2xl font-bold mb-6">Arbeitszeiten</h1>

      {!isChef && (
        <Tabs defaultValue="erfassen" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="erfassen">Arbeitszeit erfassen</TabsTrigger>
            <TabsTrigger value="uebersicht">Meine Arbeitszeiten</TabsTrigger>
          </TabsList>
          <TabsContent value="erfassen">
            <ArbeitszeitForm />
          </TabsContent>
          <TabsContent value="uebersicht">
            <ArbeitszeitListe />
          </TabsContent>
        </Tabs>
      )}

      {isChef && (
        <div className="space-y-6">
          <h2 className="text-xl font-semibold">Arbeitszeiten aller Fahrer</h2>
          <ArbeitszeitListe />
        </div>
      )}
    </div>
  );
} 