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
  Rating,
  Chip,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Star as StarIcon,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';

const PerformanceReview = () => {
  const { user } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [staff, setStaff] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedReview, setSelectedReview] = useState(null);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    staffId: '',
    reviewPeriod: '',
    reviewDate: '',
    teachingPerformance: 0,
    classManagement: 0,
    studentEngagement: 0,
    professionalDevelopment: 0,
    communicationSkills: 0,
    overallRating: 0,
    strengths: '',
    areasForImprovement: '',
    goals: '',
    reviewerComments: '',
    status: 'draft',
  });

  useEffect(() => {
    fetchReviews();
    fetchStaff();
  }, []);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/performance/reviews');
      setReviews(response.data);
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStaff = async () => {
    try {
      const response = await axios.get('/api/staff');
      setStaff(response.data);
    } catch (error) {
      console.error('Error fetching staff:', error);
    }
  };

  const handleDialogOpen = (review = null) => {
    if (review) {
      setSelectedReview(review);
      setFormData({
        staffId: review.staffId,
        reviewPeriod: review.reviewPeriod,
        reviewDate: review.reviewDate,
        teachingPerformance: review.teachingPerformance,
        classManagement: review.classManagement,
        studentEngagement: review.studentEngagement,
        professionalDevelopment: review.professionalDevelopment,
        communicationSkills: review.communicationSkills,
        overallRating: review.overallRating,
        strengths: review.strengths,
        areasForImprovement: review.areasForImprovement,
        goals: review.goals,
        reviewerComments: review.reviewerComments,
        status: review.status,
      });
    }
    setOpenDialog(true);
  };

  const handleDialogClose = () => {
    setOpenDialog(false);
    setSelectedReview(null);
    setFormData({
      staffId: '',
      reviewPeriod: '',
      reviewDate: '',
      teachingPerformance: 0,
      classManagement: 0,
      studentEngagement: 0,
      professionalDevelopment: 0,
      communicationSkills: 0,
      overallRating: 0,
      strengths: '',
      areasForImprovement: '',
      goals: '',
      reviewerComments: '',
      status: 'draft',
    });
  };

  const calculateOverallRating = () => {
    const ratings = [
      formData.teachingPerformance,
      formData.classManagement,
      formData.studentEngagement,
      formData.professionalDevelopment,
      formData.communicationSkills,
    ];
    const average = ratings.reduce((a, b) => a + b, 0) / ratings.length;
    return Math.round(average * 10) / 10;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        overallRating: calculateOverallRating(),
      };

      if (selectedReview) {
        await axios.put(`/api/performance/reviews/${selectedReview._id}`, payload);
      } else {
        await axios.post('/api/performance/reviews', payload);
      }

      handleDialogClose();
      fetchReviews();
    } catch (error) {
      console.error('Error saving review:', error);
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`/api/performance/reviews/${id}`);
      fetchReviews();
    } catch (error) {
      console.error('Error deleting review:', error);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'in_progress':
        return 'warning';
      case 'draft':
        return 'default';
      default:
        return 'default';
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Performance Reviews
      </Typography>

      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleDialogOpen()}
        >
          New Performance Review
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Staff Member</TableCell>
              <TableCell>Review Period</TableCell>
              <TableCell>Review Date</TableCell>
              <TableCell align="center">Overall Rating</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {reviews.map((review) => (
              <TableRow key={review._id}>
                <TableCell>
                  {staff.find((s) => s._id === review.staffId)?.name || 'Unknown'}
                </TableCell>
                <TableCell>{review.reviewPeriod}</TableCell>
                <TableCell>{new Date(review.reviewDate).toLocaleDateString()}</TableCell>
                <TableCell align="center">
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Rating
                      value={review.overallRating}
                      precision={0.1}
                      readOnly
                      icon={<StarIcon fontSize="inherit" />}
                    />
                    <Typography variant="body2" sx={{ ml: 1 }}>
                      ({review.overallRating})
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  <Chip
                    label={review.status}
                    color={getStatusColor(review.status)}
                  />
                </TableCell>
                <TableCell>
                  <Tooltip title="Edit">
                    <IconButton onClick={() => handleDialogOpen(review)}>
                      <EditIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete">
                    <IconButton onClick={() => handleDelete(review._id)}>
                      <DeleteIcon />
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
          {selectedReview ? 'Edit Performance Review' : 'New Performance Review'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Staff Member</InputLabel>
                <Select
                  value={formData.staffId}
                  onChange={(e) =>
                    setFormData({ ...formData, staffId: e.target.value })
                  }
                  label="Staff Member"
                >
                  {staff.map((member) => (
                    <MenuItem key={member._id} value={member._id}>
                      {member.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Review Period"
                name="reviewPeriod"
                value={formData.reviewPeriod}
                onChange={(e) =>
                  setFormData({ ...formData, reviewPeriod: e.target.value })
                }
                placeholder="e.g., Q1 2024"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Review Date"
                type="date"
                value={formData.reviewDate}
                onChange={(e) =>
                  setFormData({ ...formData, reviewDate: e.target.value })
                }
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={formData.status}
                  onChange={(e) =>
                    setFormData({ ...formData, status: e.target.value })
                  }
                  label="Status"
                >
                  <MenuItem value="draft">Draft</MenuItem>
                  <MenuItem value="in_progress">In Progress</MenuItem>
                  <MenuItem value="completed">Completed</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Performance Ratings
              </Typography>
            </Grid>

            <Grid item xs={12} sm={6}>
              <Typography component="legend">Teaching Performance</Typography>
              <Rating
                name="teachingPerformance"
                value={formData.teachingPerformance}
                onChange={(e, value) =>
                  setFormData({ ...formData, teachingPerformance: value })
                }
                precision={0.5}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography component="legend">Class Management</Typography>
              <Rating
                name="classManagement"
                value={formData.classManagement}
                onChange={(e, value) =>
                  setFormData({ ...formData, classManagement: value })
                }
                precision={0.5}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography component="legend">Student Engagement</Typography>
              <Rating
                name="studentEngagement"
                value={formData.studentEngagement}
                onChange={(e, value) =>
                  setFormData({ ...formData, studentEngagement: value })
                }
                precision={0.5}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography component="legend">Professional Development</Typography>
              <Rating
                name="professionalDevelopment"
                value={formData.professionalDevelopment}
                onChange={(e, value) =>
                  setFormData({ ...formData, professionalDevelopment: value })
                }
                precision={0.5}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography component="legend">Communication Skills</Typography>
              <Rating
                name="communicationSkills"
                value={formData.communicationSkills}
                onChange={(e, value) =>
                  setFormData({ ...formData, communicationSkills: value })
                }
                precision={0.5}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Strengths"
                value={formData.strengths}
                onChange={(e) =>
                  setFormData({ ...formData, strengths: e.target.value })
                }
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Areas for Improvement"
                value={formData.areasForImprovement}
                onChange={(e) =>
                  setFormData({ ...formData, areasForImprovement: e.target.value })
                }
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Goals"
                value={formData.goals}
                onChange={(e) =>
                  setFormData({ ...formData, goals: e.target.value })
                }
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Reviewer Comments"
                value={formData.reviewerComments}
                onChange={(e) =>
                  setFormData({ ...formData, reviewerComments: e.target.value })
                }
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDialogClose}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained" color="primary">
            {selectedReview ? 'Update' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PerformanceReview; 