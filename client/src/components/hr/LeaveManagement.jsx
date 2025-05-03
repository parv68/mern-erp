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
  Tabs,
  Tab,
  FormHelperText,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';
import { differenceInCalendarDays, format } from 'date-fns';

const LeaveManagement = () => {
  const { user, hasRole } = useAuth();
  const [leaveApplications, setLeaveApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [viewDialog, setViewDialog] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [staff, setStaff] = useState([]);
  const [formData, setFormData] = useState({
    staff_id: '',
    leave_type: '',
    start_date: null,
    end_date: null,
    reason: '',
    status: 'pending',
    documents: [],
    days: 0,
  });
  const [errors, setErrors] = useState({});
  const [tabValue, setTabValue] = useState(0);
  const [leaveBalances, setLeaveBalances] = useState({});

  useEffect(() => {
    fetchLeaveApplications();
    if (hasRole('admin') || hasRole('hr')) {
      fetchStaff();
    }
    fetchLeaveBalances();
  }, []);

  const fetchLeaveApplications = async () => {
    try {
      setLoading(true);
      let url = '/api/hr/leave';
      
      // For non-admin users, fetch only their own leave applications
      if (!hasRole('admin') && !hasRole('hr')) {
        url += `/staff/${user.id}`;
      }
      
      const response = await axios.get(url);
      setLeaveApplications(response.data);
    } catch (error) {
      console.error('Error fetching leave applications:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStaff = async () => {
    try {
      const response = await axios.get('/api/hr/staff');
      setStaff(response.data);
    } catch (error) {
      console.error('Error fetching staff:', error);
    }
  };

  const fetchLeaveBalances = async () => {
    try {
      const response = await axios.get('/api/hr/leave/balances');
      setLeaveBalances(response.data);
    } catch (error) {
      console.error('Error fetching leave balances:', error);
    }
  };

  const handleOpenDialog = (leave = null) => {
    if (leave) {
      setSelectedLeave(leave);
      setFormData({
        staff_id: leave.staff_id,
        leave_type: leave.leave_type,
        start_date: new Date(leave.start_date),
        end_date: new Date(leave.end_date),
        reason: leave.reason,
        status: leave.status,
        documents: leave.documents || [],
        days: leave.days,
      });
    } else {
      setSelectedLeave(null);
      setFormData({
        staff_id: hasRole('admin') || hasRole('hr') ? '' : user.id,
        leave_type: '',
        start_date: null,
        end_date: null,
        reason: '',
        status: 'pending',
        documents: [],
        days: 0,
      });
    }
    setTabValue(0);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setErrors({});
  };

  const handleViewLeave = (leave) => {
    setSelectedLeave(leave);
    setViewDialog(true);
  };

  const handleCloseViewDialog = () => {
    setViewDialog(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleDateChange = (field) => (date) => {
    setFormData({
      ...formData,
      [field]: date,
    });
    
    // Calculate days if both dates are set
    if (field === 'start_date' && formData.end_date) {
      calculateDays(date, formData.end_date);
    } else if (field === 'end_date' && formData.start_date) {
      calculateDays(formData.start_date, date);
    }
  };

  const calculateDays = (start, end) => {
    if (start && end) {
      const days = differenceInCalendarDays(end, start) + 1;
      setFormData(prev => ({
        ...prev,
        days: days > 0 ? days : 0
      }));
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.staff_id) newErrors.staff_id = 'Staff member is required';
    if (!formData.leave_type) newErrors.leave_type = 'Leave type is required';
    if (!formData.start_date) newErrors.start_date = 'Start date is required';
    if (!formData.end_date) newErrors.end_date = 'End date is required';
    if (!formData.reason) newErrors.reason = 'Reason is required';
    
    if (formData.start_date && formData.end_date) {
      if (formData.start_date > formData.end_date) {
        newErrors.end_date = 'End date cannot be before start date';
      }
    }

    // Check if leave balance is sufficient
    const requestedDays = formData.days;
    const balance = leaveBalances[formData.leave_type] || 0;
    
    if (requestedDays > balance) {
      newErrors.leave_type = `Insufficient leave balance. Available: ${balance} days`;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      if (selectedLeave) {
        await axios.put(`/api/hr/leave/${selectedLeave.id}`, formData);
      } else {
        await axios.post('/api/hr/leave', formData);
      }
      handleCloseDialog();
      fetchLeaveApplications();
      fetchLeaveBalances();
    } catch (error) {
      console.error('Error saving leave application:', error);
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      }
    }
  };

  const handleUpdateStatus = async (leaveId, status) => {
    try {
      await axios.patch(`/api/hr/leave/${leaveId}/status`, { status });
      fetchLeaveApplications();
    } catch (error) {
      console.error('Error updating leave status:', error);
    }
  };

  const getStatusChip = (status) => {
    let color;
    switch (status) {
      case 'approved':
        color = 'success';
        break;
      case 'rejected':
        color = 'error';
        break;
      case 'pending':
        color = 'warning';
        break;
      default:
        color = 'default';
    }
    return <Chip label={status.charAt(0).toUpperCase() + status.slice(1)} color={color} size="small" />;
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">Leave Management</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Apply for Leave
        </Button>
      </Box>

      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Leave Balances
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="subtitle2" color="text.secondary">Annual Leave</Typography>
              <Typography variant="h4">{leaveBalances.annual || 0} days</Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="subtitle2" color="text.secondary">Sick Leave</Typography>
              <Typography variant="h4">{leaveBalances.sick || 0} days</Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="subtitle2" color="text.secondary">Casual Leave</Typography>
              <Typography variant="h4">{leaveBalances.casual || 0} days</Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="subtitle2" color="text.secondary">Other Leave</Typography>
              <Typography variant="h4">{leaveBalances.other || 0} days</Typography>
            </Paper>
          </Grid>
        </Grid>
      </Box>

      {loading ? (
        <LinearProgress />
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                {(hasRole('admin') || hasRole('hr')) && <TableCell>Staff</TableCell>}
                <TableCell>Leave Type</TableCell>
                <TableCell>Start Date</TableCell>
                <TableCell>End Date</TableCell>
                <TableCell>Days</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {leaveApplications.map((leave) => (
                <TableRow key={leave.id}>
                  {(hasRole('admin') || hasRole('hr')) && (
                    <TableCell>
                      {leave.staff_name}
                    </TableCell>
                  )}
                  <TableCell>{leave.leave_type}</TableCell>
                  <TableCell>{new Date(leave.start_date).toLocaleDateString()}</TableCell>
                  <TableCell>{new Date(leave.end_date).toLocaleDateString()}</TableCell>
                  <TableCell>{leave.days}</TableCell>
                  <TableCell>{getStatusChip(leave.status)}</TableCell>
                  <TableCell>
                    <Tooltip title="View Details">
                      <IconButton onClick={() => handleViewLeave(leave)}>
                        <InfoIcon />
                      </IconButton>
                    </Tooltip>
                    
                    {leave.status === 'pending' && (leave.staff_id === user.id || hasRole('admin') || hasRole('hr')) && (
                      <Tooltip title="Edit">
                        <IconButton onClick={() => handleOpenDialog(leave)}>
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                    )}
                    
                    {leave.status === 'pending' && (hasRole('admin') || hasRole('hr')) && (
                      <>
                        <Tooltip title="Approve">
                          <IconButton 
                            color="success" 
                            onClick={() => handleUpdateStatus(leave.id, 'approved')}
                          >
                            <ApproveIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Reject">
                          <IconButton 
                            color="error"
                            onClick={() => handleUpdateStatus(leave.id, 'rejected')}
                          >
                            <RejectIcon />
                          </IconButton>
                        </Tooltip>
                      </>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {leaveApplications.length === 0 && (
                <TableRow>
                  <TableCell colSpan={(hasRole('admin') || hasRole('hr')) ? 7 : 6} align="center">
                    No leave applications found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Leave Application Form Dialog */}
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
          <DialogTitle>{selectedLeave ? 'Edit Leave Application' : 'Apply for Leave'}</DialogTitle>
          <DialogContent>
            <Tabs value={tabValue} onChange={handleTabChange} sx={{ mb: 2 }}>
              <Tab label="Leave Details" />
              <Tab label="Documents" />
            </Tabs>

            {tabValue === 0 && (
              <Grid container spacing={2}>
                {(hasRole('admin') || hasRole('hr')) && (
                  <Grid item xs={12}>
                    <FormControl fullWidth margin="normal" error={!!errors.staff_id}>
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
                  <FormControl fullWidth margin="normal" error={!!errors.leave_type}>
                    <InputLabel>Leave Type</InputLabel>
                    <Select
                      name="leave_type"
                      value={formData.leave_type}
                      label="Leave Type"
                      onChange={handleInputChange}
                    >
                      <MenuItem value="annual">Annual Leave</MenuItem>
                      <MenuItem value="sick">Sick Leave</MenuItem>
                      <MenuItem value="casual">Casual Leave</MenuItem>
                      <MenuItem value="maternity">Maternity Leave</MenuItem>
                      <MenuItem value="paternity">Paternity Leave</MenuItem>
                      <MenuItem value="unpaid">Unpaid Leave</MenuItem>
                      <MenuItem value="other">Other</MenuItem>
                    </Select>
                    {errors.leave_type && <FormHelperText>{errors.leave_type}</FormHelperText>}
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Box sx={{ mt: 2 }}>
                    <DatePicker
                      label="Start Date"
                      value={formData.start_date}
                      onChange={handleDateChange('start_date')}
                      slotProps={{ 
                        textField: { 
                          fullWidth: true, 
                          error: !!errors.start_date,
                          helperText: errors.start_date
                        } 
                      }}
                    />
                  </Box>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Box sx={{ mt: 2 }}>
                    <DatePicker
                      label="End Date"
                      value={formData.end_date}
                      onChange={handleDateChange('end_date')}
                      slotProps={{ 
                        textField: { 
                          fullWidth: true, 
                          error: !!errors.end_date,
                          helperText: errors.end_date
                        } 
                      }}
                    />
                  </Box>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    margin="normal"
                    fullWidth
                    id="days"
                    label="Number of Days"
                    name="days"
                    type="number"
                    InputProps={{ readOnly: true }}
                    value={formData.days}
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    margin="normal"
                    required
                    fullWidth
                    id="reason"
                    label="Reason for Leave"
                    name="reason"
                    multiline
                    rows={3}
                    value={formData.reason}
                    onChange={handleInputChange}
                    error={!!errors.reason}
                    helperText={errors.reason}
                  />
                </Grid>
              </Grid>
            )}

            {tabValue === 1 && (
              <Box>
                <Typography variant="body2" gutterBottom>
                  Upload supporting documents for your leave application (e.g., medical certificates).
                </Typography>
                <Box 
                  sx={{ 
                    border: '1px dashed gray', 
                    p: 3, 
                    textAlign: 'center',
                    borderRadius: 1,
                    mb: 2
                  }}
                >
                  <input
                    accept="image/*,.pdf,.doc,.docx"
                    style={{ display: 'none' }}
                    id="document-upload"
                    multiple
                    type="file"
                  />
                  <label htmlFor="document-upload">
                    <Button
                      variant="contained"
                      component="span"
                      startIcon={<AddIcon />}
                    >
                      Upload Documents
                    </Button>
                  </label>
                </Box>

                {formData.documents.length > 0 && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Uploaded Documents
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {formData.documents.map((doc, index) => (
                        <Chip
                          key={index}
                          label={doc.name}
                          variant="outlined"
                          onDelete={() => {
                            const newDocs = [...formData.documents];
                            newDocs.splice(index, 1);
                            setFormData({ ...formData, documents: newDocs });
                          }}
                        />
                      ))}
                    </Box>
                  </Box>
                )}
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button onClick={handleSubmit} variant="contained">
              {selectedLeave ? 'Update' : 'Submit'}
            </Button>
          </DialogActions>
        </Dialog>
      </LocalizationProvider>

      {/* View Leave Details Dialog */}
      <Dialog open={viewDialog} onClose={handleCloseViewDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Leave Application Details</DialogTitle>
        <DialogContent>
          {selectedLeave && (
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2">Staff</Typography>
                <Typography variant="body1">{selectedLeave.staff_name}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2">Leave Type</Typography>
                <Typography variant="body1">{selectedLeave.leave_type}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2">Start Date</Typography>
                <Typography variant="body1">
                  {new Date(selectedLeave.start_date).toLocaleDateString()}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2">End Date</Typography>
                <Typography variant="body1">
                  {new Date(selectedLeave.end_date).toLocaleDateString()}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2">Number of Days</Typography>
                <Typography variant="body1">{selectedLeave.days}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2">Status</Typography>
                <Typography variant="body1">{getStatusChip(selectedLeave.status)}</Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2">Reason</Typography>
                <Typography variant="body1">{selectedLeave.reason}</Typography>
              </Grid>
              
              {selectedLeave.admin_comment && (
                <Grid item xs={12}>
                  <Typography variant="subtitle2">Admin Comment</Typography>
                  <Typography variant="body1">{selectedLeave.admin_comment}</Typography>
                </Grid>
              )}

              {selectedLeave.documents && selectedLeave.documents.length > 0 && (
                <Grid item xs={12}>
                  <Typography variant="subtitle2">Documents</Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                    {selectedLeave.documents.map((doc, index) => (
                      <Chip
                        key={index}
                        label={doc.name}
                        variant="outlined"
                        onClick={() => window.open(doc.url, '_blank')}
                      />
                    ))}
                  </Box>
                </Grid>
              )}
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseViewDialog}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default LeaveManagement; 