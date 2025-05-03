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
  Alert,
  Divider,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Download as DownloadIcon,
  Email as EmailIcon,
  Visibility as ViewIcon,
  Print as PrintIcon,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { format } from 'date-fns';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';

const Payroll = () => {
  const { hasRole } = useAuth();
  const [payrolls, setPayrolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [viewDialog, setViewDialog] = useState(false);
  const [selectedPayroll, setSelectedPayroll] = useState(null);
  const [staff, setStaff] = useState([]);
  const [formData, setFormData] = useState({
    staff_id: '',
    month: '',
    year: '',
    basic_salary: 0,
    allowances: 0,
    deductions: 0,
    tax: 0,
    net_salary: 0,
    payment_date: null,
    payment_method: 'bank_transfer',
    status: 'pending',
  });
  const [errors, setErrors] = useState({});
  const [currentDate] = useState(new Date());
  const [generatingPayroll, setGeneratingPayroll] = useState(false);

  useEffect(() => {
    fetchPayrolls();
    fetchStaff();
  }, []);

  const fetchPayrolls = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/hr/payroll');
      setPayrolls(response.data);
    } catch (error) {
      console.error('Error fetching payrolls:', error);
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

  const handleOpenDialog = (payroll = null) => {
    if (payroll) {
      setSelectedPayroll(payroll);
      setFormData({
        staff_id: payroll.staff_id,
        month: payroll.month,
        year: payroll.year,
        basic_salary: payroll.basic_salary,
        allowances: payroll.allowances,
        deductions: payroll.deductions,
        tax: payroll.tax,
        net_salary: payroll.net_salary,
        payment_date: payroll.payment_date ? new Date(payroll.payment_date) : null,
        payment_method: payroll.payment_method,
        status: payroll.status,
      });
    } else {
      // Initialize with current month and year
      setSelectedPayroll(null);
      setFormData({
        staff_id: '',
        month: (currentDate.getMonth() + 1).toString(),
        year: currentDate.getFullYear().toString(),
        basic_salary: 0,
        allowances: 0,
        deductions: 0,
        tax: 0,
        net_salary: 0,
        payment_date: null,
        payment_method: 'bank_transfer',
        status: 'pending',
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setErrors({});
  };

  const handleViewPayroll = (payroll) => {
    setSelectedPayroll(payroll);
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

    // Recalculate net salary when salary components change
    if (['basic_salary', 'allowances', 'deductions', 'tax'].includes(name)) {
      recalculateNetSalary({ ...formData, [name]: parseFloat(value) || 0 });
    }
  };

  const handleDateChange = (date) => {
    setFormData({
      ...formData,
      payment_date: date,
    });
  };

  const recalculateNetSalary = (data) => {
    const basicSalary = parseFloat(data.basic_salary) || 0;
    const allowances = parseFloat(data.allowances) || 0;
    const deductions = parseFloat(data.deductions) || 0;
    const tax = parseFloat(data.tax) || 0;
    
    const netSalary = basicSalary + allowances - deductions - tax;
    
    setFormData(prev => ({
      ...prev,
      net_salary: Math.max(0, netSalary),
    }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.staff_id) newErrors.staff_id = 'Staff member is required';
    if (!formData.month) newErrors.month = 'Month is required';
    if (!formData.year) newErrors.year = 'Year is required';
    if (!formData.basic_salary) newErrors.basic_salary = 'Basic salary is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      if (selectedPayroll) {
        await axios.put(`/api/hr/payroll/${selectedPayroll.id}`, formData);
      } else {
        await axios.post('/api/hr/payroll', formData);
      }
      handleCloseDialog();
      fetchPayrolls();
    } catch (error) {
      console.error('Error saving payroll:', error);
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      }
    }
  };

  const handleDeletePayroll = async (payrollId) => {
    if (!window.confirm('Are you sure you want to delete this payroll record?')) return;

    try {
      await axios.delete(`/api/hr/payroll/${payrollId}`);
      fetchPayrolls();
    } catch (error) {
      console.error('Error deleting payroll:', error);
    }
  };

  const handleGeneratePayroll = async () => {
    try {
      setGeneratingPayroll(true);
      const month = currentDate.getMonth() + 1;
      const year = currentDate.getFullYear();
      
      await axios.post('/api/hr/payroll/generate', { month, year });
      fetchPayrolls();
    } catch (error) {
      console.error('Error generating payroll:', error);
    } finally {
      setGeneratingPayroll(false);
    }
  };

  const handleUpdateStatus = async (payrollId, status) => {
    try {
      await axios.patch(`/api/hr/payroll/${payrollId}/status`, { status });
      fetchPayrolls();
    } catch (error) {
      console.error('Error updating payroll status:', error);
    }
  };

  const getStatusChip = (status) => {
    let color;
    switch (status) {
      case 'paid':
        color = 'success';
        break;
      case 'pending':
        color = 'warning';
        break;
      case 'cancelled':
        color = 'error';
        break;
      default:
        color = 'default';
    }
    return <Chip label={status.charAt(0).toUpperCase() + status.slice(1)} color={color} size="small" />;
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const getMonthName = (month) => {
    const date = new Date();
    date.setMonth(parseInt(month) - 1);
    return date.toLocaleString('default', { month: 'long' });
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">Payroll Management</Typography>
        <Box>
          {hasRole('admin') && (
            <Button
              variant="outlined"
              sx={{ mr: 2 }}
              onClick={handleGeneratePayroll}
              disabled={generatingPayroll}
            >
              {generatingPayroll ? 'Generating...' : 'Generate Monthly Payroll'}
            </Button>
          )}
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
          >
            Add Payroll Record
          </Button>
        </Box>
      </Box>

      {loading ? (
        <LinearProgress />
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Staff</TableCell>
                <TableCell>Period</TableCell>
                <TableCell>Basic Salary</TableCell>
                <TableCell>Allowances</TableCell>
                <TableCell>Deductions</TableCell>
                <TableCell>Net Salary</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {payrolls.map((payroll) => (
                <TableRow key={payroll.id}>
                  <TableCell>{payroll.staff_name}</TableCell>
                  <TableCell>{`${getMonthName(payroll.month)} ${payroll.year}`}</TableCell>
                  <TableCell>{formatCurrency(payroll.basic_salary)}</TableCell>
                  <TableCell>{formatCurrency(payroll.allowances)}</TableCell>
                  <TableCell>{formatCurrency(payroll.deductions + payroll.tax)}</TableCell>
                  <TableCell>{formatCurrency(payroll.net_salary)}</TableCell>
                  <TableCell>{getStatusChip(payroll.status)}</TableCell>
                  <TableCell>
                    <Tooltip title="View Details">
                      <IconButton onClick={() => handleViewPayroll(payroll)}>
                        <ViewIcon />
                      </IconButton>
                    </Tooltip>
                    
                    {payroll.status === 'pending' && hasRole('admin') && (
                      <>
                        <Tooltip title="Edit">
                          <IconButton onClick={() => handleOpenDialog(payroll)}>
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton color="error" onClick={() => handleDeletePayroll(payroll.id)}>
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </>
                    )}
                    
                    {payroll.status === 'pending' && hasRole('admin') && (
                      <Tooltip title="Mark as Paid">
                        <IconButton 
                          color="success" 
                          onClick={() => handleUpdateStatus(payroll.id, 'paid')}
                        >
                          <Chip label="Pay" color="success" size="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                    
                    <Tooltip title="Download Payslip">
                      <IconButton color="primary">
                        <DownloadIcon />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
              {payrolls.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    No payroll records found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Payroll Form Dialog */}
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
          <DialogTitle>{selectedPayroll ? 'Edit Payroll Record' : 'Add Payroll Record'}</DialogTitle>
          <DialogContent>
            <Grid container spacing={2}>
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
                  {errors.staff_id && <Typography color="error" variant="caption">{errors.staff_id}</Typography>}
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth margin="normal" error={!!errors.month}>
                  <InputLabel>Month</InputLabel>
                  <Select
                    name="month"
                    value={formData.month}
                    label="Month"
                    onChange={handleInputChange}
                  >
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                      <MenuItem key={month} value={month.toString()}>
                        {getMonthName(month)}
                      </MenuItem>
                    ))}
                  </Select>
                  {errors.month && <Typography color="error" variant="caption">{errors.month}</Typography>}
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth margin="normal" error={!!errors.year}>
                  <InputLabel>Year</InputLabel>
                  <Select
                    name="year"
                    value={formData.year}
                    label="Year"
                    onChange={handleInputChange}
                  >
                    {Array.from({ length: 5 }, (_, i) => currentDate.getFullYear() - 2 + i).map((year) => (
                      <MenuItem key={year} value={year.toString()}>
                        {year}
                      </MenuItem>
                    ))}
                  </Select>
                  {errors.year && <Typography color="error" variant="caption">{errors.year}</Typography>}
                </FormControl>
              </Grid>

              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
                <Typography variant="subtitle1" gutterBottom>Salary Details</Typography>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  id="basic_salary"
                  label="Basic Salary"
                  name="basic_salary"
                  type="number"
                  inputProps={{ min: 0, step: 0.01 }}
                  value={formData.basic_salary}
                  onChange={handleInputChange}
                  error={!!errors.basic_salary}
                  helperText={errors.basic_salary}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  margin="normal"
                  fullWidth
                  id="allowances"
                  label="Allowances"
                  name="allowances"
                  type="number"
                  inputProps={{ min: 0, step: 0.01 }}
                  value={formData.allowances}
                  onChange={handleInputChange}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  margin="normal"
                  fullWidth
                  id="deductions"
                  label="Deductions"
                  name="deductions"
                  type="number"
                  inputProps={{ min: 0, step: 0.01 }}
                  value={formData.deductions}
                  onChange={handleInputChange}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  margin="normal"
                  fullWidth
                  id="tax"
                  label="Tax"
                  name="tax"
                  type="number"
                  inputProps={{ min: 0, step: 0.01 }}
                  value={formData.tax}
                  onChange={handleInputChange}
                />
              </Grid>

              <Grid item xs={12}>
                <Alert severity="info" sx={{ mt: 2 }}>
                  Net Salary: {formatCurrency(formData.net_salary)}
                </Alert>
              </Grid>

              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
                <Typography variant="subtitle1" gutterBottom>Payment Details</Typography>
              </Grid>

              <Grid item xs={12} sm={6}>
                <DatePicker
                  label="Payment Date"
                  value={formData.payment_date}
                  onChange={handleDateChange}
                  slotProps={{ textField: { margin: 'normal', fullWidth: true } }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth margin="normal">
                  <InputLabel>Payment Method</InputLabel>
                  <Select
                    name="payment_method"
                    value={formData.payment_method}
                    label="Payment Method"
                    onChange={handleInputChange}
                  >
                    <MenuItem value="bank_transfer">Bank Transfer</MenuItem>
                    <MenuItem value="cash">Cash</MenuItem>
                    <MenuItem value="check">Check</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth margin="normal">
                  <InputLabel>Status</InputLabel>
                  <Select
                    name="status"
                    value={formData.status}
                    label="Status"
                    onChange={handleInputChange}
                  >
                    <MenuItem value="pending">Pending</MenuItem>
                    <MenuItem value="paid">Paid</MenuItem>
                    <MenuItem value="cancelled">Cancelled</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button onClick={handleSubmit} variant="contained">
              {selectedPayroll ? 'Update' : 'Save'}
            </Button>
          </DialogActions>
        </Dialog>
      </LocalizationProvider>

      {/* View Payslip Dialog */}
      <Dialog open={viewDialog} onClose={handleCloseViewDialog} maxWidth="md" fullWidth>
        <DialogTitle>Payslip Details</DialogTitle>
        <DialogContent>
          {selectedPayroll && (
            <Box sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                <Typography variant="h6">PAYSLIP</Typography>
                <Typography variant="subtitle1">
                  {`${getMonthName(selectedPayroll.month)} ${selectedPayroll.year}`}
                </Typography>
              </Box>
              
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">Employee</Typography>
                  <Typography variant="body1">{selectedPayroll.staff_name}</Typography>
                  <Typography variant="body2" color="text.secondary">ID: {selectedPayroll.employee_id}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">Department</Typography>
                  <Typography variant="body1">{selectedPayroll.department || 'N/A'}</Typography>
                  <Typography variant="body2" color="text.secondary">Position: {selectedPayroll.position || 'N/A'}</Typography>
                </Grid>
              </Grid>
              
              <Divider sx={{ mb: 3 }} />
              
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">Earnings</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary" align="right">Amount</Typography>
                </Grid>
                
                <Grid item xs={6}>
                  <Typography variant="body2">Basic Salary</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" align="right">{formatCurrency(selectedPayroll.basic_salary)}</Typography>
                </Grid>
                
                <Grid item xs={6}>
                  <Typography variant="body2">Allowances</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" align="right">{formatCurrency(selectedPayroll.allowances)}</Typography>
                </Grid>
                
                <Grid item xs={6}>
                  <Typography variant="subtitle2">Total Earnings</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" align="right">
                    {formatCurrency(selectedPayroll.basic_salary + selectedPayroll.allowances)}
                  </Typography>
                </Grid>
              </Grid>
              
              <Divider sx={{ my: 2 }} />
              
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">Deductions</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary" align="right">Amount</Typography>
                </Grid>
                
                <Grid item xs={6}>
                  <Typography variant="body2">Tax</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" align="right">{formatCurrency(selectedPayroll.tax)}</Typography>
                </Grid>
                
                <Grid item xs={6}>
                  <Typography variant="body2">Other Deductions</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" align="right">{formatCurrency(selectedPayroll.deductions)}</Typography>
                </Grid>
                
                <Grid item xs={6}>
                  <Typography variant="subtitle2">Total Deductions</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" align="right">
                    {formatCurrency(selectedPayroll.tax + selectedPayroll.deductions)}
                  </Typography>
                </Grid>
              </Grid>
              
              <Divider sx={{ my: 2 }} />
              
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="h6">Net Pay</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="h6" align="right">{formatCurrency(selectedPayroll.net_salary)}</Typography>
                </Grid>
              </Grid>
              
              <Box sx={{ mt: 4 }}>
                <Typography variant="subtitle2" color="text.secondary">Payment Details</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={4}>
                    <Typography variant="body2" color="text.secondary">Method</Typography>
                    <Typography variant="body1">
                      {selectedPayroll.payment_method?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Typography variant="body2" color="text.secondary">Date</Typography>
                    <Typography variant="body1">
                      {selectedPayroll.payment_date ? format(new Date(selectedPayroll.payment_date), 'PP') : 'Pending'}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Typography variant="body2" color="text.secondary">Status</Typography>
                    <Typography variant="body1">{getStatusChip(selectedPayroll.status)}</Typography>
                  </Grid>
                </Grid>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseViewDialog}>Close</Button>
          <Button
            startIcon={<PrintIcon />}
            onClick={() => window.print()}
            variant="contained"
          >
            Print
          </Button>
          <Button
            startIcon={<DownloadIcon />}
            variant="contained"
            color="primary"
          >
            Download PDF
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Payroll; 