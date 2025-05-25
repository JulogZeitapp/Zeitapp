import React, { useState } from 'react';
import { useArbeitszeit } from '@/contexts/ArbeitszeitContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function ArbeitszeitForm() {
  const { saveArbeitszeit } = useArbeitszeit();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    datum: new Date().toISOString().split('T')[0],
    startZeit: '',
    endZeit: '',
    pause: '30', // Standardpause in Minuten
    beschreibung: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Berechne die Arbeitszeit in Minuten
      const start = new Date(`${formData.datum}T${formData.startZeit}`);
      const end = new Date(`${formData.datum}T${formData.endZeit}`);
      const pauseMinuten = parseInt(formData.pause);
      
      if (end <= start) {
        throw new Error('Endzeit muss nach der Startzeit liegen');
      }

      const arbeitszeitMinuten = (end - start) / (1000 * 60) - pauseMinuten;
      
      if (arbeitszeitMinuten < 0) {
        throw new Error('Die Pause darf nicht länger als die Arbeitszeit sein');
      }

      await saveArbeitszeit({
        ...formData,
        arbeitszeitMinuten,
        status: 'pending' // Standardstatus für neue Einträge
      });

      toast({
        title: 'Erfolg',
        description: 'Arbeitszeit wurde erfolgreich gespeichert',
      });

      // Formular zurücksetzen
      setFormData({
        datum: new Date().toISOString().split('T')[0],
        startZeit: '',
        endZeit: '',
        pause: '30',
        beschreibung: ''
      });

    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Fehler',
        description: error.message || 'Fehler beim Speichern der Arbeitszeit',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Arbeitszeit erfassen</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="datum">Datum</Label>
            <Input
              id="datum"
              name="datum"
              type="date"
              value={formData.datum}
              onChange={handleChange}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startZeit">Startzeit</Label>
              <Input
                id="startZeit"
                name="startZeit"
                type="time"
                value={formData.startZeit}
                onChange={handleChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="endZeit">Endzeit</Label>
              <Input
                id="endZeit"
                name="endZeit"
                type="time"
                value={formData.endZeit}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="pause">Pause (Minuten)</Label>
            <Input
              id="pause"
              name="pause"
              type="number"
              min="0"
              value={formData.pause}
              onChange={handleChange}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="beschreibung">Beschreibung</Label>
            <Input
              id="beschreibung"
              name="beschreibung"
              type="text"
              value={formData.beschreibung}
              onChange={handleChange}
              placeholder="Optional: Beschreibung der Tätigkeit"
            />
          </div>

          <Button 
            type="submit" 
            className="w-full"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Wird gespeichert...' : 'Arbeitszeit speichern'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
} 