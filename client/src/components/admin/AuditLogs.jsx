import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  Grid,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Button,
  LinearProgress,
  Chip,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { format } from 'date-fns';
import axios from 'axios';

const AuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [filters, setFilters] = useState({
    userId: '',
    startDate: null,
    endDate: null,
    success: '',
    action: '',
  });
  const [users, setUsers] = useState([]);
  const [totalLogs, setTotalLogs] = useState(0);

  useEffect(() => {
    fetchUsers();
    fetchLogs();
  }, [page, rowsPerPage]);

  const fetchUsers = async () => {
    try {
      const response = await axios.get('/api/users');
      setUsers(response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const params = {
        page,
        limit: rowsPerPage,
        ...filters,
      };

      if (filters.startDate) {
        params.startDate = format(filters.startDate, 'yyyy-MM-dd');
      }
      
      if (filters.endDate) {
        params.endDate = format(filters.endDate, 'yyyy-MM-dd');
      }

      const response = await axios.get('/api/audit-logs', { params });
      setLogs(response.data.logs);
      setTotalLogs(response.data.total);
    } catch (error) {
      console.error('Error fetching audit logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleFilterChange = (field) => (event) => {
    const value = event.target ? event.target.value : event;
    setFilters({
      ...filters,
      [field]: value,
    });
  };

  const handleSearch = () => {
    setPage(0);
    fetchLogs();
  };

  const handleClearFilters = () => {
    setFilters({
      userId: '',
      startDate: null,
      endDate: null,
      success: '',
      action: '',
    });
    setPage(0);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        User Audit Logs
      </Typography>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Filters
        </Typography>
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={4} lg={3}>
              <FormControl fullWidth margin="normal">
                <InputLabel id="user-select-label">User</InputLabel>
                <Select
                  labelId="user-select-label"
                  id="user-select"
                  value={filters.userId}
                  label="User"
                  onChange={handleFilterChange('userId')}
                >
                  <MenuItem value="">All Users</MenuItem>
                  {users.map((user) => (
                    <MenuItem key={user.id} value={user.id}>
                      {user.username} ({user.first_name} {user.last_name})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6} md={4} lg={3}>
              <DatePicker
                label="Start Date"
                value={filters.startDate}
                onChange={handleFilterChange('startDate')}
                slotProps={{ textField: { margin: 'normal', fullWidth: true } }}
              />
            </Grid>

            <Grid item xs={12} sm={6} md={4} lg={3}>
              <DatePicker
                label="End Date"
                value={filters.endDate}
                onChange={handleFilterChange('endDate')}
                slotProps={{ textField: { margin: 'normal', fullWidth: true } }}
              />
            </Grid>

            <Grid item xs={12} sm={6} md={4} lg={3}>
              <FormControl fullWidth margin="normal">
                <InputLabel id="success-select-label">Status</InputLabel>
                <Select
                  labelId="success-select-label"
                  id="success-select"
                  value={filters.success}
                  label="Status"
                  onChange={handleFilterChange('success')}
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="true">Success</MenuItem>
                  <MenuItem value="false">Failed</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6} md={4} lg={3}>
              <FormControl fullWidth margin="normal">
                <InputLabel id="action-select-label">Action</InputLabel>
                <Select
                  labelId="action-select-label"
                  id="action-select"
                  value={filters.action}
                  label="Action"
                  onChange={handleFilterChange('action')}
                >
                  <MenuItem value="">All Actions</MenuItem>
                  <MenuItem value="login">Login</MenuItem>
                  <MenuItem value="logout">Logout</MenuItem>
                  <MenuItem value="password_reset">Password Reset</MenuItem>
                  <MenuItem value="profile_update">Profile Update</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={12} md={12} lg={12} sx={{ mt: 1 }}>
              <Button 
                variant="contained" 
                onClick={handleSearch}
                sx={{ mr: 2 }}
              >
                Search
              </Button>
              <Button 
                variant="outlined" 
                onClick={handleClearFilters}
              >
                Clear Filters
              </Button>
            </Grid>
          </Grid>
        </LocalizationProvider>
      </Paper>

      <Paper>
        {loading ? (
          <LinearProgress />
        ) : (
          <>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>User</TableCell>
                    <TableCell>Timestamp</TableCell>
                    <TableCell>IP Address</TableCell>
                    <TableCell>User Agent</TableCell>
                    <TableCell>Action</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>
                        {log.user ? `${log.user.username} (${log.user.first_name} ${log.user.last_name})` : 'Unknown'}
                      </TableCell>
                      <TableCell>
                        {new Date(log.login_timestamp).toLocaleString()}
                      </TableCell>
                      <TableCell>{log.ip_address}</TableCell>
                      <TableCell>
                        <Typography noWrap sx={{ maxWidth: 250 }} title={log.user_agent}>
                          {log.user_agent}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={log.action || 'login'} 
                          color={log.action === 'password_reset' ? 'secondary' : 'default'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={log.success ? 'Success' : 'Failed'} 
                          color={log.success ? 'success' : 'error'}
                          size="small"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                  
                  {logs.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} align="center">
                        No audit logs found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            
            <TablePagination
              rowsPerPageOptions={[10, 25, 50, 100]}
              component="div"
              count={totalLogs}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
            />
          </>
        )}
      </Paper>
    </Box>
  );
};

export default AuditLogs; 