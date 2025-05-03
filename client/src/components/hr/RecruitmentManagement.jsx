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
  Tabs,
  Tab,
  Chip,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';

const RecruitmentManagement = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState(0);
  const [jobOpenings, setJobOpenings] = useState([]);
  const [applications, setApplications] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [loading, setLoading] = useState(false);

  const [jobFormData, setJobFormData] = useState({
    title: '',
    department: '',
    description: '',
    requirements: '',
    salary: '',
    status: 'open',
    deadline: '',
  });

  const [applicationFormData, setApplicationFormData] = useState({
    jobId: '',
    applicantName: '',
    email: '',
    phone: '',
    experience: '',
    education: '',
    resume: null,
    status: 'pending',
  });

  useEffect(() => {
    fetchJobOpenings();
    fetchApplications();
  }, []);

  const fetchJobOpenings = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/recruitment/jobs');
      setJobOpenings(response.data);
    } catch (error) {
      console.error('Error fetching job openings:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/recruitment/applications');
      setApplications(response.data);
    } catch (error) {
      console.error('Error fetching applications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleDialogOpen = (item = null, type = 'job') => {
    if (item) {
      setSelectedItem(item);
      if (type === 'job') {
        setJobFormData({
          title: item.title,
          department: item.department,
          description: item.description,
          requirements: item.requirements,
          salary: item.salary,
          status: item.status,
          deadline: item.deadline,
        });
      } else {
        setApplicationFormData({
          jobId: item.jobId,
          applicantName: item.applicantName,
          email: item.email,
          phone: item.phone,
          experience: item.experience,
          education: item.education,
          status: item.status,
        });
      }
    }
    setOpenDialog(true);
  };

  const handleDialogClose = () => {
    setOpenDialog(false);
    setSelectedItem(null);
    setJobFormData({
      title: '',
      department: '',
      description: '',
      requirements: '',
      salary: '',
      status: 'open',
      deadline: '',
    });
    setApplicationFormData({
      jobId: '',
      applicantName: '',
      email: '',
      phone: '',
      experience: '',
      education: '',
      resume: null,
      status: 'pending',
    });
  };

  const handleJobSubmit = async (e) => {
    e.preventDefault();
    try {
      if (selectedItem) {
        await axios.put(`/api/recruitment/jobs/${selectedItem._id}`, jobFormData);
      } else {
        await axios.post('/api/recruitment/jobs', jobFormData);
      }
      handleDialogClose();
      fetchJobOpenings();
    } catch (error) {
      console.error('Error saving job:', error);
    }
  };

  const handleApplicationSubmit = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      Object.keys(applicationFormData).forEach(key => {
        formData.append(key, applicationFormData[key]);
      });

      if (selectedItem) {
        await axios.put(`/api/recruitment/applications/${selectedItem._id}`, formData);
      } else {
        await axios.post('/api/recruitment/applications', formData);
      }
      handleDialogClose();
      fetchApplications();
    } catch (error) {
      console.error('Error saving application:', error);
    }
  };

  const handleDelete = async (id, type) => {
    try {
      await axios.delete(`/api/recruitment/${type}/${id}`);
      if (type === 'jobs') {
        fetchJobOpenings();
      } else {
        fetchApplications();
      }
    } catch (error) {
      console.error('Error deleting item:', error);
    }
  };

  const JobOpeningsTab = () => (
    <Box>
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleDialogOpen()}
        >
          Add Job Opening
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Title</TableCell>
              <TableCell>Department</TableCell>
              <TableCell>Salary</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Deadline</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {jobOpenings.map((job) => (
              <TableRow key={job._id}>
                <TableCell>{job.title}</TableCell>
                <TableCell>{job.department}</TableCell>
                <TableCell>${job.salary}</TableCell>
                <TableCell>
                  <Chip
                    label={job.status}
                    color={job.status === 'open' ? 'success' : 'default'}
                  />
                </TableCell>
                <TableCell>{new Date(job.deadline).toLocaleDateString()}</TableCell>
                <TableCell>
                  <Tooltip title="Edit">
                    <IconButton onClick={() => handleDialogOpen(job, 'job')}>
                      <EditIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete">
                    <IconButton onClick={() => handleDelete(job._id, 'jobs')}>
                      <DeleteIcon />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );

  const ApplicationsTab = () => (
    <Box>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Applicant Name</TableCell>
              <TableCell>Position</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {applications.map((application) => (
              <TableRow key={application._id}>
                <TableCell>{application.applicantName}</TableCell>
                <TableCell>{application.jobTitle}</TableCell>
                <TableCell>{application.email}</TableCell>
                <TableCell>
                  <Chip
                    label={application.status}
                    color={
                      application.status === 'accepted'
                        ? 'success'
                        : application.status === 'rejected'
                        ? 'error'
                        : 'default'
                    }
                  />
                </TableCell>
                <TableCell>
                  <Tooltip title="View">
                    <IconButton onClick={() => handleDialogOpen(application, 'application')}>
                      <ViewIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete">
                    <IconButton onClick={() => handleDelete(application._id, 'applications')}>
                      <DeleteIcon />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Recruitment Management
      </Typography>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={handleTabChange}>
          <Tab label="Job Openings" />
          <Tab label="Applications" />
        </Tabs>
      </Box>

      {activeTab === 0 ? <JobOpeningsTab /> : <ApplicationsTab />}

      <Dialog open={openDialog} onClose={handleDialogClose} maxWidth="md" fullWidth>
        <DialogTitle>
          {selectedItem
            ? `Edit ${activeTab === 0 ? 'Job Opening' : 'Application'}`
            : `Add New ${activeTab === 0 ? 'Job Opening' : 'Application'}`}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            {activeTab === 0 ? (
              <>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Job Title"
                    name="title"
                    value={jobFormData.title}
                    onChange={(e) =>
                      setJobFormData({ ...jobFormData, title: e.target.value })
                    }
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Department"
                    name="department"
                    value={jobFormData.department}
                    onChange={(e) =>
                      setJobFormData({ ...jobFormData, department: e.target.value })
                    }
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={4}
                    label="Description"
                    name="description"
                    value={jobFormData.description}
                    onChange={(e) =>
                      setJobFormData({ ...jobFormData, description: e.target.value })
                    }
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={4}
                    label="Requirements"
                    name="requirements"
                    value={jobFormData.requirements}
                    onChange={(e) =>
                      setJobFormData({ ...jobFormData, requirements: e.target.value })
                    }
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Salary"
                    name="salary"
                    type="number"
                    value={jobFormData.salary}
                    onChange={(e) =>
                      setJobFormData({ ...jobFormData, salary: e.target.value })
                    }
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Status</InputLabel>
                    <Select
                      name="status"
                      value={jobFormData.status}
                      onChange={(e) =>
                        setJobFormData({ ...jobFormData, status: e.target.value })
                      }
                      label="Status"
                    >
                      <MenuItem value="open">Open</MenuItem>
                      <MenuItem value="closed">Closed</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Application Deadline"
                    name="deadline"
                    type="date"
                    value={jobFormData.deadline}
                    onChange={(e) =>
                      setJobFormData({ ...jobFormData, deadline: e.target.value })
                    }
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
              </>
            ) : (
              <>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Applicant Name"
                    name="applicantName"
                    value={applicationFormData.applicantName}
                    onChange={(e) =>
                      setApplicationFormData({
                        ...applicationFormData,
                        applicantName: e.target.value,
                      })
                    }
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Email"
                    name="email"
                    type="email"
                    value={applicationFormData.email}
                    onChange={(e) =>
                      setApplicationFormData({
                        ...applicationFormData,
                        email: e.target.value,
                      })
                    }
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Phone"
                    name="phone"
                    value={applicationFormData.phone}
                    onChange={(e) =>
                      setApplicationFormData({
                        ...applicationFormData,
                        phone: e.target.value,
                      })
                    }
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Status</InputLabel>
                    <Select
                      name="status"
                      value={applicationFormData.status}
                      onChange={(e) =>
                        setApplicationFormData({
                          ...applicationFormData,
                          status: e.target.value,
                        })
                      }
                      label="Status"
                    >
                      <MenuItem value="pending">Pending</MenuItem>
                      <MenuItem value="reviewing">Reviewing</MenuItem>
                      <MenuItem value="shortlisted">Shortlisted</MenuItem>
                      <MenuItem value="accepted">Accepted</MenuItem>
                      <MenuItem value="rejected">Rejected</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={4}
                    label="Experience"
                    name="experience"
                    value={applicationFormData.experience}
                    onChange={(e) =>
                      setApplicationFormData({
                        ...applicationFormData,
                        experience: e.target.value,
                      })
                    }
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={4}
                    label="Education"
                    name="education"
                    value={applicationFormData.education}
                    onChange={(e) =>
                      setApplicationFormData({
                        ...applicationFormData,
                        education: e.target.value,
                      })
                    }
                  />
                </Grid>
                {!selectedItem && (
                  <Grid item xs={12}>
                    <input
                      accept="application/pdf"
                      style={{ display: 'none' }}
                      id="resume-file"
                      type="file"
                      onChange={(e) =>
                        setApplicationFormData({
                          ...applicationFormData,
                          resume: e.target.files[0],
                        })
                      }
                    />
                    <label htmlFor="resume-file">
                      <Button variant="outlined" component="span">
                        Upload Resume (PDF)
                      </Button>
                    </label>
                  </Grid>
                )}
              </>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDialogClose}>Cancel</Button>
          <Button
            onClick={activeTab === 0 ? handleJobSubmit : handleApplicationSubmit}
            variant="contained"
            color="primary"
          >
            {selectedItem ? 'Update' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default RecruitmentManagement; 