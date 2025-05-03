import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Paper,
  Tabs,
  Tab,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Download as DownloadIcon,
  Refresh as RefreshIcon,
  TrendingUp as TrendingUpIcon,
} from '@mui/icons-material';
import { Line, Bar, Pie } from 'react-chartjs-2';
import axios from 'axios';

const AdminReports = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [reportType, setReportType] = useState('');
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: '',
  });
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [metrics, setMetrics] = useState({
    totalStudents: 0,
    totalTeachers: 0,
    totalRevenue: 0,
    attendanceRate: 0,
  });

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    try {
      const response = await axios.get('/api/reports/metrics');
      setMetrics(response.data);
    } catch (error) {
      console.error('Error fetching metrics:', error);
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleGenerateReport = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/reports/generate', {
        params: {
          type: reportType,
          startDate: dateRange.startDate,
          endDate: dateRange.endDate,
        },
      });
      setReportData(response.data);
    } catch (error) {
      console.error('Error generating report:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExportReport = async (format) => {
    try {
      const response = await axios.get('/api/reports/export', {
        params: {
          type: reportType,
          format,
          startDate: dateRange.startDate,
          endDate: dateRange.endDate,
        },
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `report.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Error exporting report:', error);
    }
  };

  const MetricCard = ({ title, value, icon }) => (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          {icon}
          <Typography variant="h6" sx={{ ml: 1 }}>
            {title}
          </Typography>
        </Box>
        <Typography variant="h4">{value}</Typography>
      </CardContent>
    </Card>
  );

  return (
    <Box>
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <MetricCard
            title="Total Students"
            value={metrics.totalStudents}
            icon={<TrendingUpIcon color="primary" />}
          />
        </Grid>
        <Grid item xs={12} md={3}>
          <MetricCard
            title="Total Teachers"
            value={metrics.totalTeachers}
            icon={<TrendingUpIcon color="secondary" />}
          />
        </Grid>
        <Grid item xs={12} md={3}>
          <MetricCard
            title="Total Revenue"
            value={`$${metrics.totalRevenue.toLocaleString()}`}
            icon={<TrendingUpIcon color="success" />}
          />
        </Grid>
        <Grid item xs={12} md={3}>
          <MetricCard
            title="Attendance Rate"
            value={`${metrics.attendanceRate}%`}
            icon={<TrendingUpIcon color="info" />}
          />
        </Grid>
      </Grid>

      <Paper sx={{ p: 3 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs value={activeTab} onChange={handleTabChange}>
            <Tab label="Academic Reports" />
            <Tab label="Financial Reports" />
            <Tab label="Staff Reports" />
            <Tab label="Attendance Reports" />
          </Tabs>
        </Box>

        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>Report Type</InputLabel>
              <Select
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
                label="Report Type"
              >
                <MenuItem value="student_performance">Student Performance</MenuItem>
                <MenuItem value="class_performance">Class Performance</MenuItem>
                <MenuItem value="fee_collection">Fee Collection</MenuItem>
                <MenuItem value="staff_attendance">Staff Attendance</MenuItem>
                <MenuItem value="student_attendance">Student Attendance</MenuItem>
                <MenuItem value="exam_analysis">Exam Analysis</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              label="Start Date"
              type="date"
              value={dateRange.startDate}
              onChange={(e) =>
                setDateRange({ ...dateRange, startDate: e.target.value })
              }
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              label="End Date"
              type="date"
              value={dateRange.endDate}
              onChange={(e) =>
                setDateRange({ ...dateRange, endDate: e.target.value })
              }
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} md={2}>
            <Button
              variant="contained"
              fullWidth
              onClick={handleGenerateReport}
              disabled={!reportType || !dateRange.startDate || !dateRange.endDate}
            >
              Generate
            </Button>
          </Grid>
        </Grid>

        {reportData && (
          <Box sx={{ mt: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
              <Button
                startIcon={<DownloadIcon />}
                onClick={() => handleExportReport('pdf')}
                sx={{ mr: 1 }}
              >
                Export PDF
              </Button>
              <Button
                startIcon={<DownloadIcon />}
                onClick={() => handleExportReport('xlsx')}
              >
                Export Excel
              </Button>
            </Box>

            {/* Report visualization will be rendered here based on reportData */}
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    {reportData.headers.map((header) => (
                      <TableCell key={header}>{header}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {reportData.rows.map((row, index) => (
                    <TableRow key={index}>
                      {row.map((cell, cellIndex) => (
                        <TableCell key={cellIndex}>{cell}</TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default AdminReports; 