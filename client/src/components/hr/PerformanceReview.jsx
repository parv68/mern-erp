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
  Rating,
  Slider,
  Divider,
  FormHelperText,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Send as SendIcon,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { format } from 'date-fns';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';

const PerformanceReview = () => {
  const { user, hasRole } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [viewDialog, setViewDialog] = useState(false);
  const [selectedReview, setSelectedReview] = useState(null);
  const [staff, setStaff] = useState([]);
  const [formData, setFormData] = useState({
    staff_id: '',
    review_period: '',
    review_date: null,
    reviewer_id: '',
    performance_areas: [
      { name: 'Job Knowledge', rating: 0, comments: '' },
      { name: 'Quality of Work', rating: 0, comments: '' },
      { name: 'Productivity', rating: 0, comments: '' },
      { name: 'Communication Skills', rating: 0, comments: '' },
      { name: 'Teamwork', rating: 0, comments: '' },
      { name: 'Initiative', rating: 0, comments: '' },
      { name: 'Punctuality', rating: 0, comments: '' },
    ],
    strengths: '',
    areas_for_improvement: '',
    goals: '',
    overall_comments: '',
    overall_rating: 0,
    status: 'draft',
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchReviews();
    fetchStaff();
  }, []);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      let response;
      
      if (hasRole('admin') || hasRole('hr')) {
        response = await axios.get('/api/hr/performance-reviews');
      } else {
        response = await axios.get(`/api/hr/performance-reviews/employee/${user.id}`);
      }
      
      setReviews(response.data);
    } catch (error) {
      console.error('Error fetching performance reviews:', error);
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

  const handleOpenDialog = (review = null) => {
    if (review) {
      setSelectedReview(review);
      setFormData({
        staff_id: review.staff_id,
        review_period: review.review_period,
        review_date: review.review_date ? new Date(review.review_date) : null,
        reviewer_id: review.reviewer_id || user.id,
        performance_areas: review.performance_areas || [
          { name: 'Job Knowledge', rating: 0, comments: '' },
          { name: 'Quality of Work', rating: 0, comments: '' },
          { name: 'Productivity', rating: 0, comments: '' },
          { name: 'Communication Skills', rating: 0, comments: '' },
          { name: 'Teamwork', rating: 0, comments: '' },
          { name: 'Initiative', rating: 0, comments: '' },
          { name: 'Punctuality', rating: 0, comments: '' },
        ],
        strengths: review.strengths || '',
        areas_for_improvement: review.areas_for_improvement || '',
        goals: review.goals || '',
        overall_comments: review.overall_comments || '',
        overall_rating: review.overall_rating || 0,
        status: review.status || 'draft',
      });
    } else {
      setSelectedReview(null);
      setFormData({
        staff_id: '',
        review_period: `${new Date().getFullYear()} Annual Review`,
        review_date: new Date(),
        reviewer_id: user.id,
        performance_areas: [
          { name: 'Job Knowledge', rating: 0, comments: '' },
          { name: 'Quality of Work', rating: 0, comments: '' },
          { name: 'Productivity', rating: 0, comments: '' },
          { name: 'Communication Skills', rating: 0, comments: '' },
          { name: 'Teamwork', rating: 0, comments: '' },
          { name: 'Initiative', rating: 0, comments: '' },
          { name: 'Punctuality', rating: 0, comments: '' },
        ],
        strengths: '',
        areas_for_improvement: '',
        goals: '',
        overall_comments: '',
        overall_rating: 0,
        status: 'draft',
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setErrors({});
  };

  const handleViewReview = (review) => {
    setSelectedReview(review);
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

  const handleDateChange = (date) => {
    setFormData({
      ...formData,
      review_date: date,
    });
  };

  const handleAreaRatingChange = (index, value) => {
    const updatedAreas = [...formData.performance_areas];
    updatedAreas[index].rating = value;
    
    setFormData({
      ...formData,
      performance_areas: updatedAreas,
    });
    
    // Recalculate overall rating
    const sum = updatedAreas.reduce((acc, area) => acc + area.rating, 0);
    const average = sum / updatedAreas.length;
    
    setFormData(prev => ({
      ...prev,
      overall_rating: Math.round(average * 10) / 10,
    }));
  };

  const handleAreaCommentChange = (index, value) => {
    const updatedAreas = [...formData.performance_areas];
    updatedAreas[index].comments = value;
    
    setFormData({
      ...formData,
      performance_areas: updatedAreas,
    });
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.staff_id) newErrors.staff_id = 'Staff member is required';
    if (!formData.review_period) newErrors.review_period = 'Review period is required';
    if (!formData.review_date) newErrors.review_date = 'Review date is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e, saveAsDraft = true) => {
    e.preventDefault();
    if (!validateForm()) return;

    const dataToSubmit = {
      ...formData,
      status: saveAsDraft ? 'draft' : 'completed',
    };

    try {
      if (selectedReview) {
        await axios.put(`/api/hr/performance-reviews/${selectedReview.id}`, dataToSubmit);
      } else {
        await axios.post('/api/hr/performance-reviews', dataToSubmit);
      }
      handleCloseDialog();
      fetchReviews();
    } catch (error) {
      console.error('Error saving performance review:', error);
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      }
    }
  };

  const handleDeleteReview = async (reviewId) => {
    if (!window.confirm('Are you sure you want to delete this performance review?')) return;

    try {
      await axios.delete(`/api/hr/performance-reviews/${reviewId}`);
      fetchReviews();
    } catch (error) {
      console.error('Error deleting performance review:', error);
    }
  };

  const handleSendReview = async (reviewId) => {
    try {
      await axios.patch(`/api/hr/performance-reviews/${reviewId}/send`);
      fetchReviews();
    } catch (error) {
      console.error('Error sending performance review:', error);
    }
  };

  const getStatusChip = (status) => {
    let color;
    switch (status) {
      case 'completed':
        color = 'success';
        break;
      case 'draft':
        color = 'default';
        break;
      case 'in_progress':
        color = 'warning';
        break;
      case 'acknowledged':
        color = 'info';
        break;
      default:
        color = 'default';
    }
    return <Chip label={status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())} color={color} size="small" />;
  };

  const getRatingColor = (rating) => {
    if (rating >= 4) return 'success.main';
    if (rating >= 3) return 'info.main';
    if (rating >= 2) return 'warning.main';
    return 'error.main';
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">Performance Reviews</Typography>
        {(hasRole('admin') || hasRole('hr')) && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
          >
            New Performance Review
          </Button>
        )}
      </Box>

      {loading ? (
        <LinearProgress />
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Employee</TableCell>
                <TableCell>Review Period</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Reviewer</TableCell>
                <TableCell>Overall Rating</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {reviews.map((review) => (
                <TableRow key={review.id}>
                  <TableCell>{review.staff_name}</TableCell>
                  <TableCell>{review.review_period}</TableCell>
                  <TableCell>
                    {review.review_date ? format(new Date(review.review_date), 'PP') : 'N/A'}
                  </TableCell>
                  <TableCell>{review.reviewer_name}</TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Rating 
                        value={review.overall_rating} 
                        precision={0.5} 
                        readOnly 
                        size="small" 
                      />
                      <Typography 
                        variant="body2" 
                        sx={{ ml: 1, color: getRatingColor(review.overall_rating) }}
                      >
                        {review.overall_rating.toFixed(1)}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>{getStatusChip(review.status)}</TableCell>
                  <TableCell>
                    <Tooltip title="View Details">
                      <IconButton onClick={() => handleViewReview(review)}>
                        <ViewIcon />
                      </IconButton>
                    </Tooltip>
                    
                    {review.status === 'draft' && (review.reviewer_id === user.id || hasRole('admin')) && (
                      <>
                        <Tooltip title="Edit">
                          <IconButton onClick={() => handleOpenDialog(review)}>
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton color="error" onClick={() => handleDeleteReview(review.id)}>
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </>
                    )}
                    
                    {review.status === 'draft' && (review.reviewer_id === user.id || hasRole('admin')) && (
                      <Tooltip title="Send to Employee">
                        <IconButton 
                          color="primary" 
                          onClick={() => handleSendReview(review.id)}
                        >
                          <SendIcon />
                        </IconButton>
                      </Tooltip>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {reviews.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    No performance reviews found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Performance Review Form Dialog */}
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
          <DialogTitle>
            {selectedReview ? 'Edit Performance Review' : 'New Performance Review'}
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth error={!!errors.staff_id}>
                  <InputLabel>Employee</InputLabel>
                  <Select
                    name="staff_id"
                    value={formData.staff_id}
                    label="Employee"
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
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Review Period"
                  name="review_period"
                  value={formData.review_period}
                  onChange={handleInputChange}
                  error={!!errors.review_period}
                  helperText={errors.review_period}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <DatePicker
                  label="Review Date"
                  value={formData.review_date}
                  onChange={handleDateChange}
                  slotProps={{ 
                    textField: { 
                      fullWidth: true,
                      error: !!errors.review_date,
                      helperText: errors.review_date
                    } 
                  }}
                />
              </Grid>

              {/* Performance Areas */}
              <Grid item xs={12}>
                <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>Performance Areas</Typography>
                
                {formData.performance_areas.map((area, index) => (
                  <Box key={index} sx={{ mb: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <Typography variant="subtitle1" sx={{ flex: 1 }}>
                        {area.name}
                      </Typography>
                      <Rating
                        name={`area-rating-${index}`}
                        value={area.rating}
                        precision={0.5}
                        onChange={(e, newValue) => handleAreaRatingChange(index, newValue)}
                      />
                      <Typography sx={{ ml: 1, minWidth: '30px' }}>
                        {area.rating.toFixed(1)}
                      </Typography>
                    </Box>
                    <TextField
                      fullWidth
                      multiline
                      rows={2}
                      placeholder={`Comments on ${area.name}`}
                      value={area.comments}
                      onChange={(e) => handleAreaCommentChange(index, e.target.value)}
                    />
                  </Box>
                ))}
              </Grid>

              <Grid item xs={12}>
                <Box sx={{ display: 'flex', alignItems: 'center', mt: 2, mb: 1 }}>
                  <Typography variant="h6" sx={{ flex: 1 }}>Overall Rating</Typography>
                  <Rating
                    name="overall-rating"
                    value={formData.overall_rating}
                    precision={0.5}
                    readOnly
                  />
                  <Typography sx={{ ml: 1, minWidth: '30px' }}>
                    {formData.overall_rating.toFixed(1)}
                  </Typography>
                </Box>
              </Grid>

              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
                <Typography variant="h6" sx={{ mb: 1 }}>Additional Comments</Typography>
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Strengths"
                  name="strengths"
                  multiline
                  rows={3}
                  value={formData.strengths}
                  onChange={handleInputChange}
                  placeholder="Key strengths and achievements"
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Areas for Improvement"
                  name="areas_for_improvement"
                  multiline
                  rows={3}
                  value={formData.areas_for_improvement}
                  onChange={handleInputChange}
                  placeholder="Areas where improvement is needed"
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Goals for Next Period"
                  name="goals"
                  multiline
                  rows={3}
                  value={formData.goals}
                  onChange={handleInputChange}
                  placeholder="Goals and objectives for the next review period"
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Overall Comments"
                  name="overall_comments"
                  multiline
                  rows={3}
                  value={formData.overall_comments}
                  onChange={handleInputChange}
                  placeholder="Summary comments about overall performance"
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button onClick={(e) => handleSubmit(e, true)} variant="outlined">
              Save as Draft
            </Button>
            <Button onClick={(e) => handleSubmit(e, false)} variant="contained">
              Complete Review
            </Button>
          </DialogActions>
        </Dialog>
      </LocalizationProvider>

      {/* View Performance Review Dialog */}
      <Dialog open={viewDialog} onClose={handleCloseViewDialog} maxWidth="md" fullWidth>
        <DialogTitle>Performance Review Details</DialogTitle>
        <DialogContent>
          {selectedReview && (
            <Box sx={{ p: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">Employee</Typography>
                  <Typography variant="body1">{selectedReview.staff_name}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">Review Period</Typography>
                  <Typography variant="body1">{selectedReview.review_period}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">Review Date</Typography>
                  <Typography variant="body1">
                    {selectedReview.review_date ? format(new Date(selectedReview.review_date), 'PP') : 'N/A'}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">Reviewer</Typography>
                  <Typography variant="body1">{selectedReview.reviewer_name}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">Status</Typography>
                  <Typography variant="body1">{getStatusChip(selectedReview.status)}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">Overall Rating</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Rating 
                      value={selectedReview.overall_rating} 
                      precision={0.5} 
                      readOnly 
                    />
                    <Typography 
                      variant="body1" 
                      sx={{ ml: 1, color: getRatingColor(selectedReview.overall_rating) }}
                    >
                      {selectedReview.overall_rating.toFixed(1)}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>

              <Divider sx={{ my: 3 }} />
              
              <Typography variant="h6" gutterBottom>Performance Areas</Typography>
              {selectedReview.performance_areas && selectedReview.performance_areas.map((area, index) => (
                <Box key={index} sx={{ mb: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Typography variant="subtitle1" sx={{ flex: 1 }}>
                      {area.name}
                    </Typography>
                    <Rating
                      value={area.rating}
                      precision={0.5}
                      readOnly
                    />
                    <Typography sx={{ ml: 1, minWidth: '30px' }}>
                      {area.rating.toFixed(1)}
                    </Typography>
                  </Box>
                  {area.comments && (
                    <Paper variant="outlined" sx={{ p: 1, bgcolor: 'background.paper' }}>
                      <Typography variant="body2">{area.comments}</Typography>
                    </Paper>
                  )}
                </Box>
              ))}

              <Divider sx={{ my: 3 }} />
              
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>Strengths</Typography>
                  <Paper variant="outlined" sx={{ p: 2, minHeight: '100px' }}>
                    <Typography variant="body2">
                      {selectedReview.strengths || 'No strengths recorded'}
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>Areas for Improvement</Typography>
                  <Paper variant="outlined" sx={{ p: 2, minHeight: '100px' }}>
                    <Typography variant="body2">
                      {selectedReview.areas_for_improvement || 'No areas for improvement recorded'}
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom>Goals for Next Period</Typography>
                  <Paper variant="outlined" sx={{ p: 2 }}>
                    <Typography variant="body2">
                      {selectedReview.goals || 'No goals recorded'}
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom>Overall Comments</Typography>
                  <Paper variant="outlined" sx={{ p: 2 }}>
                    <Typography variant="body2">
                      {selectedReview.overall_comments || 'No overall comments recorded'}
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>

              {selectedReview.status === 'acknowledged' && selectedReview.employee_comments && (
                <>
                  <Divider sx={{ my: 3 }} />
                  <Typography variant="h6" gutterBottom>Employee Comments</Typography>
                  <Paper variant="outlined" sx={{ p: 2 }}>
                    <Typography variant="body2">
                      {selectedReview.employee_comments}
                    </Typography>
                  </Paper>
                </>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseViewDialog}>Close</Button>
          {selectedReview && selectedReview.status === 'completed' && 
           selectedReview.staff_id === user.id && (
            <Button
              variant="contained"
              color="primary"
              onClick={() => {
                // Handle acknowledgment logic here
                handleCloseViewDialog();
              }}
            >
              Acknowledge Review
            </Button>
          )}
          <Button variant="outlined" startIcon={<PrintIcon />} onClick={() => window.print()}>
            Print
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PerformanceReview; 