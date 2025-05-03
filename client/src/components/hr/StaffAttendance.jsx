import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Grid,
  LinearProgress,
  Tooltip,
  FormHelperText,
  Alert,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  FileDownload as DownloadIcon,
  CalendarMonth as CalendarIcon,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { format, parseISO, isWeekend } from 'date-fns';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';

const StaffAttendance = () => {
  const { user, hasRole } = useAuth();
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedAttendance, setSelectedAttendance] = useState(null);
  const [staff, setStaff] = useState([]);
  const [formData, setFormData] = useState({
    staff_id: '',
    date: new Date(),
    check_in: null,
    check_out: null,
    status: 'present',
    reason: '',
  });
  const [errors, setErrors] = useState({});
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    endDate: new Date(),
  });
  const [filterStaffId, setFilterStaffId] = useState('');
  const [summary, setSummary] = useState({
    present: 0,
    absent: 0,
    leave: 0,
    late: 0,
  });

  useEffect(() => {
    if (hasRole('admin') || hasRole('hr')) {
      fetchStaff();
    }
    
    if (hasRole('admin') || hasRole('hr')) {
      fetchAllAttendance();
    } else {
      fetchStaffAttendance(user.id);
    }
  }, [dateRange, filterStaffId]);

  const fetchStaff = async () => {
    try {
      const response = await axios.get('/api/hr/staff');
      setStaff(response.data);
    } catch (error) {
      console.error('Error fetching staff:', error);
    }
  };

  const fetchAllAttendance = async () => {
    try {
      setLoading(true);
      const params = {
        startDate: format(dateRange.startDate, 'yyyy-MM-dd'),
        endDate: format(dateRange.endDate, 'yyyy-MM-dd'),
      };
      
      if (filterStaffId) {
        params.staffId = filterStaffId;
      }
      
      const response = await axios.get('/api/hr/attendance', { params });
      setAttendance(response.data);
      calculateSummary(response.data);
    } catch (error) {
      console.error('Error fetching attendance:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStaffAttendance = async (staffId) => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/hr/staff/${staffId}/attendance`, {
        params: {
          startDate: format(dateRange.startDate, 'yyyy-MM-dd'),
          endDate: format(dateRange.endDate, 'yyyy-MM-dd'),
        },
      });
      setAttendance(response.data);
      calculateSummary(response.data);
    } catch (error) {
      console.error('Error fetching staff attendance:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateSummary = (attendanceData) => {
    const summary = {
      present: 0,
      absent: 0,
      leave: 0,
      late: 0,
    };

    attendanceData.forEach(record => {
      if (record.status === 'present') {
        summary.present++;
        // Check if check-in time is late (e.g., after 9:00 AM)
        if (record.check_in && new Date(record.check_in).getHours() >= 9 && 
            new Date(record.check_in).getMinutes() > 0) {
          summary.late++;
        }
      } else if (record.status === 'absent') {
        summary.absent++;
      } else if (record.status === 'leave') {
        summary.leave++;
      }
    });

    setSummary(summary);
  };

  const handleOpenDialog = (attendanceRecord = null) => {
    if (attendanceRecord) {
      setSelectedAttendance(attendanceRecord);
      setFormData({
        staff_id: attendanceRecord.staff_id,
        date: new Date(attendanceRecord.date),
        check_in: attendanceRecord.check_in ? new Date(attendanceRecord.check_in) : null,
        check_out: attendanceRecord.check_out ? new Date(attendanceRecord.check_out) : null,
        status: attendanceRecord.status,
        reason: attendanceRecord.reason || '',
      });
    } else {
      setSelectedAttendance(null);
      setFormData({
        staff_id: hasRole('admin') || hasRole('hr') ? '' : user.id,
        date: new Date(),
        check_in: null,
        check_out: null,
        status: 'present',
        reason: '',
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setErrors({});
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleDateChange = (date) => {
    setFormData({
      ...formData,
      date: date,
    });
  };

  const handleTimeChange = (field) => (time) => {
    setFormData({
      ...formData,
      [field]: time,
    });
  };

  const handleFilterChange = (e) => {
    setFilterStaffId(e.target.value);
  };

  const handleDateRangeChange = (field) => (date) => {
    setDateRange({
      ...dateRange,
      [field]: date,
    });
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.staff_id) newErrors.staff_id = 'Staff member is required';
    if (!formData.date) newErrors.date = 'Date is required';
    if (formData.status === 'present') {
      if (!formData.check_in) newErrors.check_in = 'Check-in time is required for present status';
    }
    if (formData.status === 'absent' && !formData.reason) {
      newErrors.reason = 'Reason is required for absent status';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      const dataToSubmit = {
        ...formData,
        date: format(formData.date, 'yyyy-MM-dd'),
      };

      if (selectedAttendance) {
        await axios.put(`/api/hr/attendance/${selectedAttendance.id}`, dataToSubmit);
      } else {
        await axios.post('/api/hr/attendance', dataToSubmit);
      }
      handleCloseDialog();
      
      if (hasRole('admin') || hasRole('hr')) {
        fetchAllAttendance();
      } else {
        fetchStaffAttendance(user.id);
      }
    } catch (error) {
      console.error('Error saving attendance record:', error);
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      }
    }
  };

  const handleDeleteAttendance = async (attendanceId) => {
    if (!window.confirm('Are you sure you want to delete this attendance record?')) return;

    try {
      await axios.delete(`/api/hr/attendance/${attendanceId}`);
      
      if (hasRole('admin') || hasRole('hr')) {
        fetchAllAttendance();
      } else {
        fetchStaffAttendance(user.id);
      }
    } catch (error) {
      console.error('Error deleting attendance record:', error);
    }
  };

  const getStatusChip = (status) => {
    let color;
    switch (status) {
      case 'present':
        color = 'success';
        break;
      case 'absent':
        color = 'error';
        break;
      case 'leave':
        color = 'warning';
        break;
      case 'holiday':
        color = 'info';
        break;
      default:
        color = 'default';
    }
    return <Chip label={status.charAt(0).toUpperCase() + status.slice(1)} color={color} size="small" />;
  };

  const exportAttendance = () => {
    // Create CSV content
    const headers = ['Date', 'Staff Name', 'Check In', 'Check Out', 'Status', 'Reason'];
    const csvData = [
      headers.join(','),
      ...attendance.map(record => [
        format(new Date(record.date), 'yyyy-MM-dd'),
        record.staff_name,
        record.check_in ? format(new Date(record.check_in), 'HH:mm') : 'N/A',
        record.check_out ? format(new Date(record.check_out), 'HH:mm') : 'N/A',
        record.status,
        `"${record.reason || ''}"`
      ].join(','))
    ].join('\n');
    
    // Create download link
    const blob = new Blob([csvData], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', `attendance_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">Staff Attendance</Typography>
        <Box>
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={exportAttendance}
            sx={{ mr: 2 }}
          >
            Export
          </Button>
          {(hasRole('admin') || hasRole('hr')) && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => handleOpenDialog()}
            >
              Add Attendance
            </Button>
          )}
        </Box>
      </Box>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', height: '100%' }}>
            <Typography variant="h6" gutterBottom>Present</Typography>
            <Typography variant="h3" color="success.main" sx={{ mt: 'auto', mb: 'auto' }}>
              {summary.present}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', height: '100%' }}>
            <Typography variant="h6" gutterBottom>Absent</Typography>
            <Typography variant="h3" color="error.main" sx={{ mt: 'auto', mb: 'auto' }}>
              {summary.absent}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', height: '100%' }}>
            <Typography variant="h6" gutterBottom>On Leave</Typography>
            <Typography variant="h3" color="warning.main" sx={{ mt: 'auto', mb: 'auto' }}>
              {summary.leave}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', height: '100%' }}>
            <Typography variant="h6" gutterBottom>Late Check-ins</Typography>
            <Typography variant="h3" color="info.main" sx={{ mt: 'auto', mb: 'auto' }}>
              {summary.late}
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      <Box sx={{ mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label="From Date"
                value={dateRange.startDate}
                onChange={handleDateRangeChange('startDate')}
                slotProps={{ textField: { fullWidth: true } }}
              />
            </LocalizationProvider>
          </Grid>
          <Grid item xs={12} md={4}>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label="To Date"
                value={dateRange.endDate}
                onChange={handleDateRangeChange('endDate')}
                slotProps={{ textField: { fullWidth: true } }}
              />
            </LocalizationProvider>
          </Grid>
          {(hasRole('admin') || hasRole('hr')) && (
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Filter by Staff</InputLabel>
                <Select
                  value={filterStaffId}
                  onChange={handleFilterChange}
                  label="Filter by Staff"
                >
                  <MenuItem value="">All Staff</MenuItem>
                  {staff.map((member) => (
                    <MenuItem key={member.id} value={member.id}>
                      {`${member.first_name} ${member.last_name}`}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          )}
        </Grid>
      </Box>

      {loading ? (
        <LinearProgress />
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Day</TableCell>
                {(hasRole('admin') || hasRole('hr')) && <TableCell>Staff Name</TableCell>}
                <TableCell>Check In</TableCell>
                <TableCell>Check Out</TableCell>
                <TableCell>Duration</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {attendance.map((record) => {
                const date = new Date(record.date);
                const checkIn = record.check_in ? new Date(record.check_in) : null;
                const checkOut = record.check_out ? new Date(record.check_out) : null;
                
                // Calculate duration
                let duration = 'N/A';
                if (checkIn && checkOut) {
                  const diffMs = checkOut - checkIn;
                  const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
                  const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
                  duration = `${diffHrs}h ${diffMins}m`;
                }
                
                return (
                  <TableRow key={record.id}>
                    <TableCell>{format(date, 'yyyy-MM-dd')}</TableCell>
                    <TableCell>
                      {format(date, 'EEEE')}
                      {isWeekend(date) && (
                        <Chip size="small" label="Weekend" color="secondary" sx={{ ml: 1 }} />
                      )}
                    </TableCell>
                    {(hasRole('admin') || hasRole('hr')) && <TableCell>{record.staff_name}</TableCell>}
                    <TableCell>
                      {checkIn ? format(checkIn, 'HH:mm') : 'N/A'}
                      {checkIn && new Date(checkIn).getHours() >= 9 && new Date(checkIn).getMinutes() > 0 && (
                        <Chip size="small" label="Late" color="error" sx={{ ml: 1 }} />
                      )}
                    </TableCell>
                    <TableCell>{checkOut ? format(checkOut, 'HH:mm') : 'N/A'}</TableCell>
                    <TableCell>{duration}</TableCell>
                    <TableCell>
                      {getStatusChip(record.status)}
                      {record.reason && (
                        <Tooltip title={record.reason}>
                          <IconButton size="small">
                            <InfoIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                    </TableCell>
                    <TableCell>
                      {(hasRole('admin') || hasRole('hr')) && (
                        <>
                          <Tooltip title="Edit">
                            <IconButton onClick={() => handleOpenDialog(record)}>
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <IconButton color="error" onClick={() => handleDeleteAttendance(record.id)}>
                              <DeleteIcon />
                            </IconButton>
                          </Tooltip>
                        </>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
              {attendance.length === 0 && (
                <TableRow>
                  <TableCell colSpan={(hasRole('admin') || hasRole('hr')) ? 8 : 7} align="center">
                    No attendance records found for the selected period.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Attendance Form Dialog */}
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
          <DialogTitle>
            {selectedAttendance ? 'Edit Attendance Record' : 'Add Attendance Record'}
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              {(hasRole('admin') || hasRole('hr')) && (
                <Grid item xs={12}>
                  <FormControl fullWidth error={!!errors.staff_id}>
                    <InputLabel>Staff Member</InputLabel>
                    <Select
                      name="staff_id"
                      value={formData.staff_id}
                      label="Staff Member"
                      onChange={handleInputChange}
                    >
                      {staff.map((member) => (
                        <MenuItem key={member.id} value={member.id}>
                          {`${member.first_name} ${member.last_name}`}
                        </MenuItem>
                      ))}
                    </Select>
                    {errors.staff_id && <FormHelperText>{errors.staff_id}</FormHelperText>}
                  </FormControl>
                </Grid>
              )}

              <Grid item xs={12} sm={6}>
                <DatePicker
                  label="Date"
                  value={formData.date}
                  onChange={handleDateChange}
                  slotProps={{ 
                    textField: { 
                      fullWidth: true,
                      error: !!errors.date,
                      helperText: errors.date
                    } 
                  }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Status</InputLabel>
                  <Select
                    name="status"
                    value={formData.status}
                    label="Status"
                    onChange={handleInputChange}
                  >
                    <MenuItem value="present">Present</MenuItem>
                    <MenuItem value="absent">Absent</MenuItem>
                    <MenuItem value="leave">On Leave</MenuItem>
                    <MenuItem value="holiday">Holiday</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              {formData.status === 'present' && (
                <>
                  <Grid item xs={12} sm={6}>
                    <TimePicker
                      label="Check In Time"
                      value={formData.check_in}
                      onChange={handleTimeChange('check_in')}
                      slotProps={{ 
                        textField: { 
                          fullWidth: true,
                          error: !!errors.check_in,
                          helperText: errors.check_in
                        } 
                      }}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TimePicker
                      label="Check Out Time"
                      value={formData.check_out}
                      onChange={handleTimeChange('check_out')}
                      slotProps={{ textField: { fullWidth: true } }}
                    />
                  </Grid>
                </>
              )}

              {(['absent', 'leave'].includes(formData.status)) && (
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Reason"
                    name="reason"
                    multiline
                    rows={3}
                    value={formData.reason}
                    onChange={handleInputChange}
                    error={!!errors.reason}
                    helperText={errors.reason || 'Please provide a reason for absence or leave'}
                  />
                </Grid>
              )}

              {isWeekend(formData.date) && (
                <Grid item xs={12}>
                  <Alert severity="info">
                    The selected date is a weekend.
                  </Alert>
                </Grid>
              )}
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button onClick={handleSubmit} variant="contained">
              {selectedAttendance ? 'Update' : 'Save'}
            </Button>
          </DialogActions>
        </Dialog>
      </LocalizationProvider>
    </Box>
  );
};

export default StaffAttendance; 