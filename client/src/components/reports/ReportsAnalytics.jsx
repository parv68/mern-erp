import React, { useState, useEffect } from 'react';
import { Box, Typography, Grid, Paper, Tabs, Tab } from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';
import AdminReports from './AdminReports';
import TeacherReports from './TeacherReports';
import StudentParentReports from './StudentParentReports';

const ReportsAnalytics = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState(0);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const renderReportComponent = () => {
    switch (user.role) {
      case 'admin':
        return <AdminReports />;
      case 'teacher':
        return <TeacherReports />;
      case 'parent':
      case 'student':
        return <StudentParentReports />;
      default:
        return (
          <Typography variant="h6" align="center">
            No reports available for your role.
          </Typography>
        );
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Reports & Analytics
      </Typography>
      <Paper sx={{ width: '100%', mb: 3 }}>
        {renderReportComponent()}
      </Paper>
    </Box>
  );
};

export default ReportsAnalytics; 