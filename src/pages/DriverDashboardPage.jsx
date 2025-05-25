import React, { useState, useEffect, useCallback } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TimeTracker from '@/components/driver/TimeTracker';
import TimeLogTable from '@/components/driver/TimeLogTable';
import { useAuth } from '@/hooks/useAuth';
import { Clock, ListChecks } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const DriverDashboardPage = () => {
  const { currentUser } = useAuth();
  const [workLogs, setWorkLogs] = useState([]);
  const [activeTab, setActiveTab] = useState("tracker");

  const fetchWorkLogs = useCallback(() => {
    const logs = JSON.parse(localStorage.getItem(`app_workLogs_${currentUser.id}`)) || [];
    setWorkLogs(logs);
  }, [currentUser.id]);

  useEffect(() => {
    fetchWorkLogs();
  }, [fetchWorkLogs]);

  const handleWorkLogAdded = () => {
    fetchWorkLogs();
  };
  
  const tabVariants = {
    active: { scale: 1.05, backgroundColor: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))" },
    inactive: { scale: 1, backgroundColor: "hsl(var(--muted))", color: "hsl(var(--muted-foreground))" },
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="container mx-auto p-2 sm:p-4"
    >
      <h1 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6 text-center gradient-text">Fahrer Dashboard</h1>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:w-3/4 lg:w-1/2 mx-auto mb-4 sm:mb-6 p-1 sm:p-1.5 bg-gradient-to-r from-sky-200/70 via-cyan-200/70 to-teal-200/70 dark:from-sky-800/70 dark:via-cyan-800/70 dark:to-teal-800/70 rounded-lg shadow-inner">
          <motion.div variants={tabVariants} animate={activeTab === 'tracker' ? 'active' : 'inactive'} className="rounded-md">
            <TabsTrigger value="tracker" className="w-full py-2 sm:py-2.5 flex items-center justify-center data-[state=active]:shadow-lg text-xs sm:text-sm">
              <Clock className="mr-1 sm:mr-2 h-4 w-4 sm:h-5 sm:w-5" /> Zeiterfassung
            </TabsTrigger>
          </motion.div>
          <motion.div variants={tabVariants} animate={activeTab === 'logs' ? 'active' : 'inactive'} className="rounded-md">
            <TabsTrigger value="logs" className="w-full py-2 sm:py-2.5 flex items-center justify-center data-[state=active]:shadow-lg text-xs sm:text-sm">
              <ListChecks className="mr-1 sm:mr-2 h-4 w-4 sm:h-5 sm:w-5" /> Meine Zeiten
            </TabsTrigger>
          </motion.div>
        </TabsList>
        
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: activeTab === "tracker" ? -30 : 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: activeTab === "tracker" ? 30 : -30 }}
            transition={{ duration: 0.3 }}
          >
            <TabsContent value="tracker">
              <TimeTracker onWorkLogAdded={handleWorkLogAdded} />
            </TabsContent>
            <TabsContent value="logs">
              <TimeLogTable logs={workLogs} />
            </TabsContent>
          </motion.div>
        </AnimatePresence>
      </Tabs>
    </motion.div>
  );
};

export default DriverDashboardPage;