import React from 'react';
import { useArbeitszeit } from '@/contexts/ArbeitszeitContext';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800'
};

const statusLabels = {
  pending: 'Ausstehend',
  approved: 'Genehmigt',
  rejected: 'Abgelehnt'
};

export default function ArbeitszeitListe() {
  const { arbeitszeiten, isLoading, error, updateArbeitszeit } = useArbeitszeit();
  const { currentUser } = useAuth();
  const { toast } = useToast();

  const handleStatusUpdate = async (id, newStatus) => {
    try {
      await updateArbeitszeit(id, { status: newStatus });
      toast({
        title: 'Erfolg',
        description: `Status wurde auf "${statusLabels[newStatus]}" aktualisiert`,
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Fehler',
        description: 'Fehler beim Aktualisieren des Status',
      });
    }
  };

  if (isLoading) {
    return <div className="text-center py-4">Lade Arbeitszeiten...</div>;
  }

  if (error) {
    return <div className="text-center text-red-500 py-4">{error}</div>;
  }

  if (arbeitszeiten.length === 0) {
    return <div className="text-center py-4">Keine Arbeitszeiten gefunden</div>;
  }

  // Sortiere nach Datum (neueste zuerst)
  const sortedArbeitszeiten = [...arbeitszeiten].sort((a, b) => 
    new Date(b.datum) - new Date(a.datum)
  );

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Datum</TableHead>
            <TableHead>Fahrer</TableHead>
            <TableHead>Start</TableHead>
            <TableHead>Ende</TableHead>
            <TableHead>Pause</TableHead>
            <TableHead>Arbeitszeit</TableHead>
            <TableHead>Status</TableHead>
            {currentUser.role === 'chef' && <TableHead>Aktionen</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedArbeitszeiten.map((arbeitszeit) => {
            const arbeitszeitStunden = (arbeitszeit.arbeitszeitMinuten / 60).toFixed(1);
            const pauseStunden = (parseInt(arbeitszeit.pause) / 60).toFixed(1);

            return (
              <TableRow key={arbeitszeit._id}>
                <TableCell>
                  {format(new Date(arbeitszeit.datum), 'dd.MM.yyyy', { locale: de })}
                </TableCell>
                <TableCell>{arbeitszeit.fahrerName}</TableCell>
                <TableCell>{arbeitszeit.startZeit}</TableCell>
                <TableCell>{arbeitszeit.endZeit}</TableCell>
                <TableCell>{pauseStunden}h</TableCell>
                <TableCell>{arbeitszeitStunden}h</TableCell>
                <TableCell>
                  <Badge className={statusColors[arbeitszeit.status]}>
                    {statusLabels[arbeitszeit.status]}
                  </Badge>
                </TableCell>
                {currentUser.role === 'chef' && arbeitszeit.status === 'pending' && (
                  <TableCell>
                    <div className="space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleStatusUpdate(arbeitszeit._id, 'approved')}
                      >
                        Genehmigen
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-red-600"
                        onClick={() => handleStatusUpdate(arbeitszeit._id, 'rejected')}
                      >
                        Ablehnen
                      </Button>
                    </div>
                  </TableCell>
                )}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
} 