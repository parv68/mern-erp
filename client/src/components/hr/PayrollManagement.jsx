import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Tooltip,
} from '@mui/material';
import { Download as DownloadIcon, Edit as EditIcon } from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';

const PayrollManagement = () => {
  const { user } = useAuth();
  const [payrollData, setPayrollData] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedPayroll, setSelectedPayroll] = useState(null);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    basicSalary: '',
    allowances: '',
    deductions: '',
    netSalary: '',
    paymentStatus: 'pending',
    paymentDate: '',
  });

  useEffect(() => {
    fetchPayrollData();
  }, [selectedMonth, selectedYear]);

  const fetchPayrollData = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/payroll', {
        params: { month: selectedMonth, year: selectedYear }
      });
      setPayrollData(response.data);
    } catch (error) {
      console.error('Error fetching payroll data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDialogOpen = (payroll = null) => {
    if (payroll) {
      setSelectedPayroll(payroll);
      setFormData({
        basicSalary: payroll.basicSalary,
        allowances: payroll.allowances,
        deductions: payroll.deductions,
        netSalary: payroll.netSalary,
        paymentStatus: payroll.paymentStatus,
        paymentDate: payroll.paymentDate,
      });
    }
    setOpenDialog(true);
  };

  const handleDialogClose = () => {
    setOpenDialog(false);
    setSelectedPayroll(null);
    setFormData({
      basicSalary: '',
      allowances: '',
      deductions: '',
      netSalary: '',
      paymentStatus: 'pending',
      paymentDate: '',
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const calculateNetSalary = () => {
    const basic = parseFloat(formData.basicSalary) || 0;
    const allowances = parseFloat(formData.allowances) || 0;
    const deductions = parseFloat(formData.deductions) || 0;
    return basic + allowances - deductions;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const netSalary = calculateNetSalary();
      const payload = {
        ...formData,
        netSalary,
        month: selectedMonth,
        year: selectedYear,
      };

      if (selectedPayroll) {
        await axios.put(`/api/payroll/${selectedPayroll._id}`, payload);
      } else {
        await axios.post('/api/payroll', payload);
      }

      handleDialogClose();
      fetchPayrollData();
    } catch (error) {
      console.error('Error saving payroll:', error);
    }
  };

  const generatePayslip = async (payrollId) => {
    try {
      const response = await axios.get(`/api/payroll/${payrollId}/payslip`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `payslip_${payrollId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Error generating payslip:', error);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Payroll Management
      </Typography>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth>
                <InputLabel>Month</InputLabel>
                <Select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  label="Month"
                >
                  {Array.from({ length: 12 }, (_, i) => {
                    const month = new Date(0, i).toLocaleString('default', { month: 'long' });
                    return <MenuItem key={i} value={i + 1}>{month}</MenuItem>;
                  })}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                type="number"
                label="Year"
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <Button
                variant="contained"
                color="primary"
                onClick={() => handleDialogOpen()}
                disabled={!selectedMonth || !selectedYear}
              >
                Add New Payroll
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Employee</TableCell>
              <TableCell align="right">Basic Salary</TableCell>
              <TableCell align="right">Allowances</TableCell>
              <TableCell align="right">Deductions</TableCell>
              <TableCell align="right">Net Salary</TableCell>
              <TableCell>Payment Status</TableCell>
              <TableCell>Payment Date</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {payrollData.map((payroll) => (
              <TableRow key={payroll._id}>
                <TableCell>{payroll.employeeName}</TableCell>
                <TableCell align="right">${payroll.basicSalary}</TableCell>
                <TableCell align="right">${payroll.allowances}</TableCell>
                <TableCell align="right">${payroll.deductions}</TableCell>
                <TableCell align="right">${payroll.netSalary}</TableCell>
                <TableCell>{payroll.paymentStatus}</TableCell>
                <TableCell>{new Date(payroll.paymentDate).toLocaleDateString()}</TableCell>
                <TableCell>
                  <Tooltip title="Edit">
                    <IconButton onClick={() => handleDialogOpen(payroll)}>
                      <EditIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Download Payslip">
                    <IconButton onClick={() => generatePayslip(payroll._id)}>
                      <DownloadIcon />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={openDialog} onClose={handleDialogClose} maxWidth="md" fullWidth>
        <DialogTitle>
          {selectedPayroll ? 'Edit Payroll' : 'Add New Payroll'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Basic Salary"
                name="basicSalary"
                type="number"
                value={formData.basicSalary}
                onChange={handleInputChange}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Allowances"
                name="allowances"
                type="number"
                value={formData.allowances}
                onChange={handleInputChange}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Deductions"
                name="deductions"
                type="number"
                value={formData.deductions}
                onChange={handleInputChange}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Payment Status</InputLabel>
                <Select
                  name="paymentStatus"
                  value={formData.paymentStatus}
                  onChange={handleInputChange}
                  label="Payment Status"
                >
                  <MenuItem value="pending">Pending</MenuItem>
                  <MenuItem value="processed">Processed</MenuItem>
                  <MenuItem value="paid">Paid</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Payment Date"
                name="paymentDate"
                type="date"
                value={formData.paymentDate}
                onChange={handleInputChange}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDialogClose}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained" color="primary">
            {selectedPayroll ? 'Update' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PayrollManagement; 