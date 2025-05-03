import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import axios from '../../utils/axios';

const LeaveApplication = () => {
    const { user } = useAuth();
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState('');

    const [formData, setFormData] = useState({
        student_id: '',
        start_date: '',
        end_date: '',
        reason: ''
    });

    // For admin/teacher view
    const [students, setStudents] = useState([]);
    const [selectedStatus, setSelectedStatus] = useState('');

    useEffect(() => {
        fetchApplications();
        if (user.role === 'admin' || user.role === 'teacher') {
            fetchStudents();
        }
    }, [user.role]);

    const fetchApplications = async () => {
        try {
            const params = {};
            if (user.role === 'student' || user.role === 'parent') {
                params.student_id = user.student_id;
            }
            if (selectedStatus) {
                params.status = selectedStatus;
            }
            
            const response = await axios.get('/api/students/leave-applications', { params });
            setApplications(response.data);
        } catch (err) {
            setError('Failed to fetch leave applications');
        }
    };

    const fetchStudents = async () => {
        try {
            const response = await axios.get('/api/students');
            setStudents(response.data);
        } catch (err) {
            setError('Failed to fetch students');
        }
    };

    const handleInputChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess('');

        try {
            await axios.post('/api/students/leave-applications', formData);
            setSuccess('Leave application submitted successfully');
            setFormData({
                student_id: '',
                start_date: '',
                end_date: '',
                reason: ''
            });
            fetchApplications();
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to submit leave application');
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (applicationId, status) => {
        try {
            await axios.put(`/api/students/leave-applications/${applicationId}`, { status });
            setSuccess('Leave application status updated successfully');
            fetchApplications();
        } catch (err) {
            setError('Failed to update leave application status');
        }
    };

    return (
        <div className="p-6">
            <h2 className="text-2xl font-bold mb-6">Leave Applications</h2>

            {(user.role === 'student' || user.role === 'parent') && (
                <div className="bg-white rounded-lg shadow p-6 mb-6">
                    <h3 className="text-xl font-semibold mb-4">Submit Leave Application</h3>
                    <form onSubmit={handleSubmit}>
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    Start Date
                                </label>
                                <input
                                    type="date"
                                    name="start_date"
                                    value={formData.start_date}
                                    onChange={handleInputChange}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    End Date
                                </label>
                                <input
                                    type="date"
                                    name="end_date"
                                    value={formData.end_date}
                                    onChange={handleInputChange}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                                    required
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700">
                                    Reason
                                </label>
                                <textarea
                                    name="reason"
                                    value={formData.reason}
                                    onChange={handleInputChange}
                                    rows={3}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                                    required
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="mt-4 text-red-600">{error}</div>
                        )}
                        
                        {success && (
                            <div className="mt-4 text-green-600">{success}</div>
                        )}

                        <div className="mt-6">
                            <button
                                type="submit"
                                disabled={loading}
                                className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50"
                            >
                                {loading ? 'Submitting...' : 'Submit Application'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-semibold">Leave Applications List</h3>
                    {(user.role === 'admin' || user.role === 'teacher') && (
                        <select
                            value={selectedStatus}
                            onChange={(e) => {
                                setSelectedStatus(e.target.value);
                                fetchApplications();
                            }}
                            className="rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                        >
                            <option value="">All Status</option>
                            <option value="pending">Pending</option>
                            <option value="approved">Approved</option>
                            <option value="rejected">Rejected</option>
                        </select>
                    )}
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Student
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Dates
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Reason
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Status
                                </th>
                                {(user.role === 'admin' || user.role === 'teacher') && (
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Actions
                                    </th>
                                )}
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {applications.map((application) => (
                                <tr key={application.id}>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {application.first_name} {application.last_name}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {new Date(application.start_date).toLocaleDateString()} - 
                                        {new Date(application.end_date).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4">
                                        {application.reason}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                                            ${application.status === 'approved' ? 'bg-green-100 text-green-800' : 
                                              application.status === 'rejected' ? 'bg-red-100 text-red-800' : 
                                              'bg-yellow-100 text-yellow-800'}`}
                                        >
                                            {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                                        </span>
                                    </td>
                                    {(user.role === 'admin' || user.role === 'teacher') && (
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {application.status === 'pending' && (
                                                <div className="space-x-2">
                                                    <button
                                                        onClick={() => handleStatusUpdate(application.id, 'approved')}
                                                        className="text-green-600 hover:text-green-900"
                                                    >
                                                        Approve
                                                    </button>
                                                    <button
                                                        onClick={() => handleStatusUpdate(application.id, 'rejected')}
                                                        className="text-red-600 hover:text-red-900"
                                                    >
                                                        Reject
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default LeaveApplication; 