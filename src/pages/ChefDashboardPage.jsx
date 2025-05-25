import React from 'react';
import DriverOverviewTable from '@/components/chef/DriverOverviewTable';
import { motion } from 'framer-motion';

const ChefDashboardPage = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="container mx-auto p-2 sm:p-4"
    >
      <h1 className="text-2xl sm:text-3xl font-bold mb-6 sm:mb-8 text-center gradient-text">Chef Dashboard</h1>
      <DriverOverviewTable />
    </motion.div>
  );
};

export default ChefDashboardPage;