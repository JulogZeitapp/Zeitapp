import React, { useState, useEffect } from 'react';
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
import { useAuth } from '@/contexts/AuthContext';
import { formatDuration, calculateWorkDetails } from '@/utils/timeUtils';
import { Users, Activity } from 'lucide-react';

const DriverOverviewTable = () => {
  const { users } = useAuth(); 
  const [driverData, setDriverData] = useState([]);

  useEffect(() => {
    const fetchDriverData = () => {
      const driverUsers = users.filter(u => u.role === 'driver');
      const data = driverUsers.map(driver => {
        const activeShift = JSON.parse(localStorage.getItem(`app_activeShift_${driver.id}`));
        const logs = JSON.parse(localStorage.getItem(`app_workLogs_${driver.id}`)) || [];
        
        let status = "Nicht aktiv";
        let currentShiftDuration = null;
        let currentNightHours = null;

        if (activeShift) {
          status = "Arbeitet";
          const now = new Date().toISOString();
          const details = calculateWorkDetails(activeShift.startTime, now);
          currentShiftDuration = details.durationHours;
          currentNightHours = details.nightHours;
        }
        
        return {
          id: driver.id,
          name: driver.name,
          status,
          currentShiftDuration,
          currentNightHours,
          totalLogs: logs.length,
          lastLog: logs.length > 0 ? logs.sort((a,b) => new Date(b.rawEnd) - new Date(a.rawEnd))[0] : null,
        };
      });
      setDriverData(data);
    };

    fetchDriverData();
    const intervalId = setInterval(fetchDriverData, 5000); 

    return () => clearInterval(intervalId);
  }, [users]);


  if (driverData.length === 0) {
    return (
      <Card className="shadow-lg bg-white/80 dark:bg-slate-800/80 backdrop-blur-md">
        <CardHeader>
          <CardTitle className="flex items-center gradient-text text-xl sm:text-2xl">
            <Users className="mr-2 h-5 w-5 sm:h-6 sm:w-6" /> Fahrerübersicht
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-8">Keine Fahrerdaten verfügbar.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg bg-white/80 dark:bg-slate-800/80 backdrop-blur-md">
      <CardHeader>
        <CardTitle className="flex items-center gradient-text text-xl sm:text-2xl">
          <Users className="mr-2 h-5 w-5 sm:h-6 sm:w-6" /> Fahrerübersicht
        </CardTitle>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <Table>
          <TableCaption>Aktueller Status und Arbeitszeiten aller Fahrer.</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs sm:text-sm">Fahrer</TableHead>
              <TableHead className="text-xs sm:text-sm">Status</TableHead>
              <TableHead className="text-xs sm:text-sm">Akt. Schicht</TableHead>
              <TableHead className="text-xs sm:text-sm">Akt. Nachtstd.</TableHead>
              <TableHead className="text-xs sm:text-sm">Letzte Schicht</TableHead>
              <TableHead className="text-right text-xs sm:text-sm">Ges. Erf.</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {driverData.map((driver) => (
              <TableRow key={driver.id}>
                <TableCell className="font-medium text-xs sm:text-sm">{driver.name}</TableCell>
                <TableCell className="text-xs sm:text-sm">
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${
                    driver.status === "Arbeitet" 
                      ? "bg-green-100 text-green-700 dark:bg-green-700/30 dark:text-green-300" 
                      : "bg-red-100 text-red-700 dark:bg-red-700/30 dark:text-red-300"
                  }`}>
                    <Activity className={`inline mr-1 h-3 w-3 ${driver.status === "Arbeitet" ? "animate-pulse" : ""}`} />
                    {driver.status}
                  </span>
                </TableCell>
                <TableCell className="text-xs sm:text-sm">{driver.currentShiftDuration !== null ? formatDuration(driver.currentShiftDuration) : '-'}</TableCell>
                <TableCell className="text-xs sm:text-sm">{driver.currentNightHours !== null ? formatDuration(driver.currentNightHours) : '-'}</TableCell>
                <TableCell className="text-xs sm:text-sm">{driver.lastLog ? `${driver.lastLog.date}, ${driver.lastLog.endTime}` : '-'}</TableCell>
                <TableCell className="text-right text-xs sm:text-sm">{driver.totalLogs}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default DriverOverviewTable;