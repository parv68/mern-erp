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
  CircularProgress,
} from '@mui/material';
import {
  Download as DownloadIcon,
  School as SchoolIcon,
  AccessTime as TimeIcon,
  Payment as PaymentIcon,
  Grade as GradeIcon,
} from '@mui/icons-material';
import { Line, Bar, Pie } from 'react-chartjs-2';
import axios from 'axios';

const StudentParentReports = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: '',
  });
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [subjects, setSubjects] = useState([]);
  const [studentMetrics, setStudentMetrics] = useState({
    overallGrade: 'A',
    attendanceRate: 95,
    feeDue: 0,
    rank: 5,
  });

  useEffect(() => {
    fetchSubjects();
    fetchStudentMetrics();
  }, []);

  const fetchSubjects = async () => {
    try {
      const response = await axios.get('/api/student/subjects');
      setSubjects(response.data);
    } catch (error) {
      console.error('Error fetching subjects:', error);
    }
  };

  const fetchStudentMetrics = async () => {
    try {
      const response = await axios.get('/api/student/metrics');
      setStudentMetrics(response.data);
    } catch (error) {
      console.error('Error fetching student metrics:', error);
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleGenerateReport = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/student/reports/generate', {
        params: {
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
        return 'academic';
      case 1:
        return 'attendance';
      case 2:
        return 'fee';
      default:
        return 'academic';
    }
  };

  const handleExportReport = async (format) => {
    try {
      const response = await axios.get('/api/student/reports/export', {
        params: {
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
      link.setAttribute('download', `student_report.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Error exporting report:', error);
    }
  };

  const MetricCard = ({ title, value, icon, color }) => (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          {React.cloneElement(icon, { color })}
          <Typography variant="h6" sx={{ ml: 1 }}>
            {title}
          </Typography>
        </Box>
        <Typography variant="h4" color={`${color}.main`}>
          {value}
        </Typography>
      </CardContent>
    </Card>
  );

  return (
    <Box>
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <MetricCard
            title="Overall Grade"
            value={studentMetrics.overallGrade}
            icon={<GradeIcon />}
            color="primary"
          />
        </Grid>
        <Grid item xs={12} md={3}>
          <MetricCard
            title="Attendance"
            value={`${studentMetrics.attendanceRate}%`}
            icon={<TimeIcon />}
            color="secondary"
          />
        </Grid>
        <Grid item xs={12} md={3}>
          <MetricCard
            title="Fee Due"
            value={`$${studentMetrics.feeDue}`}
            icon={<PaymentIcon />}
            color="error"
          />
        </Grid>
        <Grid item xs={12} md={3}>
          <MetricCard
            title="Class Rank"
            value={`#${studentMetrics.rank}`}
            icon={<SchoolIcon />}
            color="success"
          />
        </Grid>
      </Grid>

      <Paper sx={{ p: 3 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs value={activeTab} onChange={handleTabChange}>
            <Tab label="Academic Reports" />
            <Tab label="Attendance Reports" />
            <Tab label="Fee Statements" />
          </Tabs>
        </Box>

        <Grid container spacing={3}>
          {activeTab !== 2 && (
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Subject</InputLabel>
                <Select
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  label="Subject"
                >
                  <MenuItem value="">All Subjects</MenuItem>
                  {subjects.map((subject) => (
                    <MenuItem key={subject.id} value={subject.id}>
                      {subject.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          )}
          <Grid item xs={12} md={activeTab === 2 ? 5 : 3}>
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
          <Grid item xs={12} md={activeTab === 2 ? 5 : 3}>
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
              disabled={!dateRange.startDate || !dateRange.endDate}
            >
              Generate
            </Button>
          </Grid>
        </Grid>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
            <CircularProgress />
          </Box>
        ) : (
          reportData && (
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

              {reportData.charts && (
                <Grid container spacing={3} sx={{ mt: 2 }}>
                  {reportData.charts.map((chart, index) => (
                    <Grid item xs={12} md={6} key={index}>
                      <Paper sx={{ p: 2 }}>
                        <Typography variant="h6" gutterBottom>
                          {chart.title}
                        </Typography>
                        {chart.type === 'line' ? (
                          <Line data={chart.data} options={chart.options} />
                        ) : chart.type === 'bar' ? (
                          <Bar data={chart.data} options={chart.options} />
                        ) : (
                          <Pie data={chart.data} options={chart.options} />
                        )}
                      </Paper>
                    </Grid>
                  ))}
                </Grid>
              )}
            </Box>
          )
        )}
      </Paper>
    </Box>
  );
};

export default StudentParentReports; 