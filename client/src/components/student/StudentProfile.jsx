import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import axios from '../../utils/axios';

const StudentProfile = () => {
    const { user } = useAuth();
    const [student, setStudent] = useState(null);
    const [academicRemarks, setAcademicRemarks] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState('');

    // For teacher's academic remarks
    const [remarkForm, setRemarkForm] = useState({
        subject_id: '',
        remark: ''
    });

    // For admin's transfer/withdrawal handling
    const [statusForm, setStatusForm] = useState({
        status: '',
        reason: ''
    });

    const [subjects, setSubjects] = useState([]);
    const [editMode, setEditMode] = useState(false);
    const [studentForm, setStudentForm] = useState(null);

    useEffect(() => {
        if (user.role === 'teacher' || user.role === 'admin') {
            fetchSubjects();
        }
    }, [user.role]);

    const fetchSubjects = async () => {
        try {
            const response = await axios.get('/api/academic/subjects');
            setSubjects(response.data);
        } catch (err) {
            setError('Failed to fetch subjects');
        }
    };

    const fetchStudent = async (studentId) => {
        try {
            const response = await axios.get(`/api/students/${studentId}`);
            setStudent(response.data);
            setStudentForm(response.data);
            fetchAcademicRemarks(studentId);
        } catch (err) {
            setError('Failed to fetch student details');
        }
    };

    const fetchAcademicRemarks = async (studentId) => {
        try {
            const response = await axios.get(`/api/students/${studentId}/remarks`);
            setAcademicRemarks(response.data);
        } catch (err) {
            setError('Failed to fetch academic remarks');
        }
    };

    const handleRemarkSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess('');

        try {
            await axios.post(`/api/students/${student.id}/remarks`, remarkForm);
            setSuccess('Academic remark added successfully');
            setRemarkForm({ subject_id: '', remark: '' });
            fetchAcademicRemarks(student.id);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to add remark');
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess('');

        try {
            await axios.put(`/api/students/${student.id}/status`, statusForm);
            setSuccess('Student status updated successfully');
            fetchStudent(student.id);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to update status');
        } finally {
            setLoading(false);
        }
    };

    const handleStudentUpdate = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess('');

        try {
            await axios.put(`/api/students/${student.id}`, studentForm);
            setSuccess('Student information updated successfully');
            setEditMode(false);
            fetchStudent(student.id);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to update student information');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6">
            <h2 className="text-2xl font-bold mb-6">Student Profile</h2>

            {student && (
                <div className="space-y-6">
                    {/* Basic Information */}
                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-semibold">Basic Information</h3>
                            {user.role === 'admin' && (
                                <button
                                    onClick={() => setEditMode(!editMode)}
                                    className="text-primary-600 hover:text-primary-700"
                                >
                                    {editMode ? 'Cancel Edit' : 'Edit'}
                                </button>
                            )}
                        </div>

                        {editMode ? (
                            <form onSubmit={handleStudentUpdate}>
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">
                                            First Name
                                        </label>
                                        <input
                                            type="text"
                                            value={studentForm.first_name}
                                            onChange={(e) =>
                                                setStudentForm({
                                                    ...studentForm,
                                                    first_name: e.target.value
                                                })
                                            }
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">
                                            Last Name
                                        </label>
                                        <input
                                            type="text"
                                            value={studentForm.last_name}
                                            onChange={(e) =>
                                                setStudentForm({
                                                    ...studentForm,
                                                    last_name: e.target.value
                                                })
                                            }
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                                        />
                                    </div>
                                    {/* Add more fields as needed */}
                                </div>
                                <div className="mt-4">
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50"
                                    >
                                        {loading ? 'Saving...' : 'Save Changes'}
                                    </button>
                                </div>
                            </form>
                        ) : (
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <div>
                                    <p className="text-sm font-medium text-gray-500">Admission Number</p>
                                    <p className="mt-1">{student.admission_number}</p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-500">Name</p>
                                    <p className="mt-1">{student.first_name} {student.last_name}</p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-500">Class</p>
                                    <p className="mt-1">{student.class_name} - Section {student.section}</p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-500">Status</p>
                                    <p className="mt-1">{student.status}</p>
                                </div>
                                {/* Add more fields as needed */}
                            </div>
                        )}
                    </div>

                    {/* Academic Remarks Section */}
                    {(user.role === 'admin' || user.role === 'teacher') && (
                        <div className="bg-white rounded-lg shadow p-6">
                            <h3 className="text-xl font-semibold mb-4">Academic Remarks</h3>
                            
                            {user.role === 'teacher' && (
                                <form onSubmit={handleRemarkSubmit} className="mb-6">
                                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">
                                                Subject
                                            </label>
                                            <select
                                                value={remarkForm.subject_id}
                                                onChange={(e) =>
                                                    setRemarkForm({
                                                        ...remarkForm,
                                                        subject_id: e.target.value
                                                    })
                                                }
                                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                                                required
                                            >
                                                <option value="">Select subject</option>
                                                {subjects.map((subject) => (
                                                    <option key={subject.id} value={subject.id}>
                                                        {subject.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">
                                                Remark
                                            </label>
                                            <textarea
                                                value={remarkForm.remark}
                                                onChange={(e) =>
                                                    setRemarkForm({
                                                        ...remarkForm,
                                                        remark: e.target.value
                                                    })
                                                }
                                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div className="mt-4">
                                        <button
                                            type="submit"
                                            disabled={loading}
                                            className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50"
                                        >
                                            {loading ? 'Adding...' : 'Add Remark'}
                                        </button>
                                    </div>
                                </form>
                            )}

                            <div className="space-y-4">
                                {academicRemarks.map((remark) => (
                                    <div
                                        key={remark.id}
                                        className="border rounded-lg p-4"
                                    >
                                        <div className="flex justify-between">
                                            <p className="font-medium">{remark.subject_name}</p>
                                            <p className="text-sm text-gray-500">
                                                {new Date(remark.remark_date).toLocaleDateString()}
                                            </p>
                                        </div>
                                        <p className="mt-2">{remark.remark}</p>
                                        <p className="mt-2 text-sm text-gray-500">
                                            By: {remark.teacher_name}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Transfer/Withdrawal Section (Admin Only) */}
                    {user.role === 'admin' && (
                        <div className="bg-white rounded-lg shadow p-6">
                            <h3 className="text-xl font-semibold mb-4">Status Update</h3>
                            <form onSubmit={handleStatusUpdate}>
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">
                                            Status
                                        </label>
                                        <select
                                            value={statusForm.status}
                                            onChange={(e) =>
                                                setStatusForm({
                                                    ...statusForm,
                                                    status: e.target.value
                                                })
                                            }
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                                            required
                                        >
                                            <option value="">Select status</option>
                                            <option value="active">Active</option>
                                            <option value="transferred">Transferred</option>
                                            <option value="withdrawn">Withdrawn</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">
                                            Reason
                                        </label>
                                        <textarea
                                            value={statusForm.reason}
                                            onChange={(e) =>
                                                setStatusForm({
                                                    ...statusForm,
                                                    reason: e.target.value
                                                })
                                            }
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="mt-4">
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50"
                                    >
                                        {loading ? 'Updating...' : 'Update Status'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}
                </div>
            )}

            {error && <div className="mt-4 text-red-600">{error}</div>}
            {success && <div className="mt-4 text-green-600">{success}</div>}
        </div>
    );
};

export default StudentProfile; 