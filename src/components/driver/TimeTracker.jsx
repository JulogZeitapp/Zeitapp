import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { PlayCircle, StopCircle, Clock, Moon, Euro } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { calculateWorkDetails, formatDuration } from '@/utils/timeUtils';
import { v4 as uuidv4 } from 'uuid';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const TimeTracker = ({ onWorkLogAdded }) => {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [isWorking, setIsWorking] = useState(false);
  const [startTime, setStartTime] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [currentNightHours, setCurrentNightHours] = useState(0);
  const [currentExpenses, setCurrentExpenses] = useState(0);

  useEffect(() => {
    const activeShift = JSON.parse(localStorage.getItem(`app_activeShift_${currentUser.id}`));
    if (activeShift) {
      setIsWorking(true);
      setStartTime(new Date(activeShift.startTime));
    }
  }, [currentUser.id]);

  useEffect(() => {
    let interval;
    if (isWorking && startTime) {
      interval = setInterval(() => {
        const now = new Date();
        const diff = now - startTime;
        setElapsedTime(diff);
        const details = calculateWorkDetails(startTime.toISOString(), now.toISOString());
        setCurrentNightHours(details.nightHours);
        setCurrentExpenses(details.expensesEuro);
      }, 1000);
    } else if (!isWorking && interval) {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isWorking, startTime]);

  const handleStartWork = () => {
    const now = new Date();
    setStartTime(now);
    setIsWorking(true);
    localStorage.setItem(`app_activeShift_${currentUser.id}`, JSON.stringify({ startTime: now.toISOString() }));
    toast({
      title: "Arbeit begonnen",
      description: `Ihre Arbeitszeit hat um ${now.toLocaleTimeString('de-DE')} begonnen.`,
      className: "bg-green-500 text-white",
    });
  };

  const handleStopWork = () => {
    const endTime = new Date();
    const workDetails = calculateWorkDetails(startTime.toISOString(), endTime.toISOString());

    const newLog = {
      id: uuidv4(),
      driverId: currentUser.id,
      driverName: currentUser.name,
      rawStart: startTime.toISOString(),
      rawEnd: endTime.toISOString(),
      date: startTime.toLocaleDateString('de-DE'),
      startTime: startTime.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }),
      endTime: endTime.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }),
      durationHours: workDetails.durationHours,
      nightHours: workDetails.nightHours,
      expensesEuro: workDetails.expensesEuro,
    };

    const existingLogs = JSON.parse(localStorage.getItem(`app_workLogs_${currentUser.id}`)) || [];
    localStorage.setItem(`app_workLogs_${currentUser.id}`, JSON.stringify([...existingLogs, newLog]));
    
    const allDriverLogs = JSON.parse(localStorage.getItem('app_allDriverLogs')) || [];
    localStorage.setItem('app_allDriverLogs', JSON.stringify([...allDriverLogs, newLog]));


    setIsWorking(false);
    setStartTime(null);
    setElapsedTime(0);
    setCurrentNightHours(0);
    setCurrentExpenses(0);
    localStorage.removeItem(`app_activeShift_${currentUser.id}`);
    if (onWorkLogAdded) onWorkLogAdded();

    toast({
      title: "Arbeit beendet",
      description: `Arbeitszeit beendet. Dauer: ${formatDuration(workDetails.durationHours)}.`,
      className: "bg-red-500 text-white",
    });
  };

  return (
    <Card className="w-full max-w-lg mx-auto shadow-xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-md">
      <CardHeader>
        <CardTitle className="text-xl sm:text-2xl text-center gradient-text">Zeiterfassung</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 sm:space-y-6">
        <div className="text-center">
          <AnimatePresence mode="wait">
            {isWorking ? (
              <motion.div
                key="timerDisplay"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="text-4xl sm:text-5xl font-bold text-slate-700 dark:text-slate-200"
              >
                {formatDuration(elapsedTime / (1000 * 60 * 60))}
              </motion.div>
            ) : (
              <motion.p 
                key="idleText"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-base sm:text-lg text-muted-foreground"
              >
                Bereit, mit der Arbeit zu beginnen?
              </motion.p>
            )}
          </AnimatePresence>
          {isWorking && startTime && (
             <p className="text-xs sm:text-sm text-muted-foreground mt-1">
               Gestartet um: {startTime.toLocaleTimeString('de-DE')}
             </p>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 text-center">
          <motion.div whileHover={{ scale: 1.05 }} className="p-3 sm:p-4 bg-sky-100 dark:bg-sky-700/50 rounded-lg">
            <Clock className="mx-auto mb-1 h-5 w-5 sm:h-6 sm:w-6 text-sky-600 dark:text-sky-400" />
            <p className="font-semibold text-sm sm:text-base text-slate-700 dark:text-slate-200">Gesamtzeit</p>
            <p className="text-xs sm:text-sm text-muted-foreground">{formatDuration(elapsedTime / (1000 * 60 * 60))}</p>
          </motion.div>
          <motion.div whileHover={{ scale: 1.05 }} className="p-3 sm:p-4 bg-indigo-100 dark:bg-indigo-700/50 rounded-lg">
            <Moon className="mx-auto mb-1 h-5 w-5 sm:h-6 sm:w-6 text-indigo-600 dark:text-indigo-400" />
            <p className="font-semibold text-sm sm:text-base text-slate-700 dark:text-slate-200">Nachtstunden</p>
            <p className="text-xs sm:text-sm text-muted-foreground">{formatDuration(currentNightHours)}</p>
          </motion.div>
          <motion.div whileHover={{ scale: 1.05 }} className="p-3 sm:p-4 bg-emerald-100 dark:bg-emerald-700/50 rounded-lg">
            <Euro className="mx-auto mb-1 h-5 w-5 sm:h-6 sm:w-6 text-emerald-600 dark:text-emerald-400" />
            <p className="font-semibold text-sm sm:text-base text-slate-700 dark:text-slate-200">Spesen</p>
            <p className="text-xs sm:text-sm text-muted-foreground">{currentExpenses.toFixed(2)} €</p>
          </motion.div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-center">
        {!isWorking ? (
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="w-full sm:w-auto">
            <Button
              size="lg"
              onClick={handleStartWork}
              className="w-full sm:w-auto bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-6"
            >
              <PlayCircle className="mr-2 h-5 w-5 sm:h-6 sm:w-6" />
              Arbeit beginnen
            </Button>
          </motion.div>
        ) : (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="w-full sm:w-auto">
                <Button
                  size="lg"
                  variant="destructive"
                  className="w-full sm:w-auto bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-6"
                >
                  <StopCircle className="mr-2 h-5 w-5 sm:h-6 sm:w-6" />
                  Arbeit beenden
                </Button>
              </motion.div>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Arbeit beenden?</AlertDialogTitle>
                <AlertDialogDescription>
                  Möchten Sie Ihre aktuelle Arbeitsschicht wirklich beenden? Ihre Zeit wird dann erfasst.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                <AlertDialogAction onClick={handleStopWork} className="bg-red-600 hover:bg-red-700">Beenden</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </CardFooter>
    </Card>
  );
};

export default TimeTracker;