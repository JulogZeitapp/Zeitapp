import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, Users } from 'lucide-react';

const AdminDashboardPage = () => {
  const [allWorkLogs, setAllWorkLogs] = useState([]);
  const [totalHours, setTotalHours] = useState(0);
  const [activeDrivers, setActiveDrivers] = useState(0);

  useEffect(() => {
    // Sammle alle Arbeitszeiteinträge von allen Fahrern
    const allLogs = [];
    const drivers = new Set();
    
    // Durchsuche den LocalStorage nach Arbeitszeiteinträgen
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key.startsWith('workLogs_')) {
        const driverId = key.split('_')[1];
        const logs = JSON.parse(localStorage.getItem(key)) || [];
        logs.forEach(log => {
          allLogs.push({
            ...log,
            driverId,
          });
        });
        if (logs.length > 0) {
          drivers.add(driverId);
        }
      }
    }

    // Sortiere nach Datum (neueste zuerst)
    allLogs.sort((a, b) => new Date(b.startTime) - new Date(a.startTime));
    
    setAllWorkLogs(allLogs);
    setActiveDrivers(drivers.size);
    
    // Berechne Gesamtstunden
    const totalMinutes = allLogs.reduce((acc, log) => acc + log.duration, 0);
    setTotalHours(totalMinutes / 60);
  }, []);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDuration = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <h1 className="text-3xl font-bold text-center bg-gradient-to-r from-sky-500 to-emerald-500 bg-clip-text text-transparent">
        Admin Dashboard
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Users className="h-6 w-6 text-sky-500" />
              <h2 className="text-lg font-semibold text-slate-700 dark:text-slate-200">
                Aktive Fahrer
              </h2>
            </div>
            <span className="text-2xl font-bold text-sky-500">
              {activeDrivers}
            </span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Clock className="h-6 w-6 text-emerald-500" />
              <h2 className="text-lg font-semibold text-slate-700 dark:text-slate-200">
                Gesamtstunden
              </h2>
            </div>
            <span className="text-2xl font-bold text-emerald-500">
              {totalHours.toFixed(1)}h
            </span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Calendar className="h-6 w-6 text-purple-500" />
              <h2 className="text-lg font-semibold text-slate-700 dark:text-slate-200">
                Einträge
              </h2>
            </div>
            <span className="text-2xl font-bold text-purple-500">
              {allWorkLogs.length}
            </span>
          </div>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6"
      >
        <h2 className="text-xl font-semibold text-slate-700 dark:text-slate-200 mb-6">
          Alle Arbeitszeiten
        </h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-slate-700/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Fahrer ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Start
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Ende
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Dauer
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-gray-700">
              {allWorkLogs.map((log, index) => (
                <motion.tr
                  key={log.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors"
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                    {log.driverId}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                    {formatDate(log.startTime)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                    {formatDate(log.endTime)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-emerald-500 font-medium">
                    {formatDuration(log.duration)}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default AdminDashboardPage; 