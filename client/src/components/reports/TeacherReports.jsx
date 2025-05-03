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
  Assessment as AssessmentIcon,
  Timeline as TimelineIcon,
} from '@mui/icons-material';
import { Line, Bar } from 'react-chartjs-2';
import axios from 'axios';

const TeacherReports = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: '',
  });
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [classMetrics, setClassMetrics] = useState({
    averageScore: 0,
    attendanceRate: 0,
    submissionRate: 0,
    participationRate: 0,
  });

  useEffect(() => {
    fetchClasses();
    if (selectedClass) {
      fetchSubjects();
      fetchClassMetrics();
    }
  }, [selectedClass]);

  const fetchClasses = async () => {
    try {
      const response = await axios.get('/api/teacher/classes');
      setClasses(response.data);
    } catch (error) {
      console.error('Error fetching classes:', error);
    }
  };

  const fetchSubjects = async () => {
    try {
      const response = await axios.get(`/api/teacher/subjects/${selectedClass}`);
      setSubjects(response.data);
    } catch (error) {
      console.error('Error fetching subjects:', error);
    }
  };

  const fetchClassMetrics = async () => {
    try {
      const response = await axios.get(`/api/teacher/metrics/${selectedClass}`);
      setClassMetrics(response.data);
    } catch (error) {
      console.error('Error fetching class metrics:', error);
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleGenerateReport = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/teacher/reports/generate', {
        params: {
          class: selectedClass,
          subject: selectedSubject,
          startDate: dateRange.startDate,
          endDate: dateRange.endDate,
          type: getReportType(),
        },
      });
      setReportData(response.data);
    } catch (error) {
      console.error('Error generating report:', error);
    } finally {
      setLoading(false);
    }
  };

  const getReportType = () => {
    switch (activeTab) {
      case 0:
        return 'performance';
      case 1:
        return 'attendance';
      case 2:
        return 'assignments';
      default:
        return 'performance';
    }
  };

  const handleExportReport = async (format) => {
    try {
      const response = await axios.get('/api/teacher/reports/export', {
        params: {
          class: selectedClass,
          subject: selectedSubject,
          startDate: dateRange.startDate,
          endDate: dateRange.endDate,
          type: getReportType(),
          format,
        },
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `class_report.${format}`);
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
            title="Average Score"
            value={`${classMetrics.averageScore}%`}
            icon={<AssessmentIcon color="primary" />}
          />
        </Grid>
        <Grid item xs={12} md={3}>
          <MetricCard
            title="Attendance Rate"
            value={`${classMetrics.attendanceRate}%`}
            icon={<TimelineIcon color="secondary" />}
          />
        </Grid>
        <Grid item xs={12} md={3}>
          <MetricCard
            title="Submission Rate"
            value={`${classMetrics.submissionRate}%`}
            icon={<AssessmentIcon color="success" />}
          />
        </Grid>
        <Grid item xs={12} md={3}>
          <MetricCard
            title="Participation Rate"
            value={`${classMetrics.participationRate}%`}
            icon={<TimelineIcon color="info" />}
          />
        </Grid>
      </Grid>

      <Paper sx={{ p: 3 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs value={activeTab} onChange={handleTabChange}>
            <Tab label="Performance Reports" />
            <Tab label="Attendance Reports" />
            <Tab label="Assignment Reports" />
          </Tabs>
        </Box>

        <Grid container spacing={3}>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Class</InputLabel>
              <Select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                label="Class"
              >
                {classes.map((cls) => (
                  <MenuItem key={cls.id} value={cls.id}>
                    {cls.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Subject</InputLabel>
              <Select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                label="Subject"
                disabled={!selectedClass}
              >
                {subjects.map((subject) => (
                  <MenuItem key={subject.id} value={subject.id}>
                    {subject.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
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
          <Grid item xs={12} md={2}>
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
              disabled={
                !selectedClass ||
                !selectedSubject ||
                !dateRange.startDate ||
                !dateRange.endDate
              }
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

export default TeacherReports; 