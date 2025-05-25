import React from 'react';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TableCaption,
} from "@/components/ui/table";
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { formatDuration } from '@/utils/timeUtils';
import { ScrollText } from 'lucide-react';

const TimeLogTable = ({ logs }) => {
  if (!logs || logs.length === 0) {
    return (
      <Card className="shadow-lg bg-white/80 dark:bg-slate-800/80 backdrop-blur-md">
        <CardHeader>
          <CardTitle className="flex items-center gradient-text text-xl sm:text-2xl">
            <ScrollText className="mr-2 h-5 w-5 sm:h-6 sm:w-6" /> Meine erfassten Zeiten
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-8">Noch keine Arbeitszeiten erfasst.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg bg-white/80 dark:bg-slate-800/80 backdrop-blur-md">
      <CardHeader>
        <CardTitle className="flex items-center gradient-text text-xl sm:text-2xl">
          <ScrollText className="mr-2 h-5 w-5 sm:h-6 sm:w-6" /> Meine erfassten Zeiten
        </CardTitle>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <Table>
          <TableCaption>Eine Übersicht Ihrer vergangenen Arbeitsschichten.</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px] sm:w-[120px] text-xs sm:text-sm">Datum</TableHead>
              <TableHead className="text-xs sm:text-sm">Start</TableHead>
              <TableHead className="text-xs sm:text-sm">Ende</TableHead>
              <TableHead className="text-xs sm:text-sm">Dauer</TableHead>
              <TableHead className="text-xs sm:text-sm">Nachtstd.</TableHead>
              <TableHead className="text-right text-xs sm:text-sm">Spesen</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.sort((a, b) => new Date(b.rawStart) - new Date(a.rawStart)).map((log) => (
              <TableRow key={log.id}>
                <TableCell className="font-medium text-xs sm:text-sm">{log.date}</TableCell>
                <TableCell className="text-xs sm:text-sm">{log.startTime}</TableCell>
                <TableCell className="text-xs sm:text-sm">{log.endTime}</TableCell>
                <TableCell className="text-xs sm:text-sm">{formatDuration(log.durationHours)}</TableCell>
                <TableCell className="text-xs sm:text-sm">{formatDuration(log.nightHours)}</TableCell>
                <TableCell className="text-right text-xs sm:text-sm">{log.expensesEuro.toFixed(2)} €</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default TimeLogTable;