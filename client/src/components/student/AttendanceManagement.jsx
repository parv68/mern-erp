import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import axios from '../../utils/axios';

const ATTENDANCE_STATUS = ['present', 'absent', 'late', 'excused'];

const AttendanceManagement = () => {
    const { user } = useAuth();
    const [classes, setClasses] = useState([]);
    const [selectedClass, setSelectedClass] = useState('');
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [students, setStudents] = useState([]);
    const [attendance, setAttendance] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState('');

    // For attendance reports
    const [reportStartDate, setReportStartDate] = useState('');
    const [reportEndDate, setReportEndDate] = useState('');
    const [attendanceReport, setAttendanceReport] = useState(null);

    useEffect(() => {
        fetchClasses();
    }, []);

    useEffect(() => {
        if (selectedClass) {
            fetchStudents();
            if (selectedDate) {
                fetchAttendance();
            }
        }
    }, [selectedClass, selectedDate]);

    const fetchClasses = async () => {
        try {
            const response = await axios.get('/api/academic/classes');
            setClasses(response.data);
        } catch (err) {
            setError('Failed to fetch classes');
        }
    };

    const fetchStudents = async () => {
        try {
            const response = await axios.get(`/api/students/class/${selectedClass}`);
            setStudents(response.data);
            // Initialize attendance array for all students
            setAttendance(
                response.data.map(student => ({
                    student_id: student.id,
                    status: 'present'
                }))
            );
        } catch (err) {
            setError('Failed to fetch students');
        }
    };

    const fetchAttendance = async () => {
        try {
            const response = await axios.get('/api/students/attendance', {
                params: {
                    class_id: selectedClass,
                    date: selectedDate
                }
            });
            if (response.data.length > 0) {
                setAttendance(response.data);
            }
        } catch (err) {
            setError('Failed to fetch attendance');
        }
    };

    const handleAttendanceChange = (studentId, status) => {
        setAttendance(prev =>
            prev.map(record =>
                record.student_id === studentId
                    ? { ...record, status }
                    : record
            )
        );
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess('');

        try {
            await axios.post('/api/students/attendance', {
                class_id: selectedClass,
                date: selectedDate,
                attendance
            });
            setSuccess('Attendance marked successfully');
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to mark attendance');
        } finally {
            setLoading(false);
        }
    };

    const generateReport = async () => {
        if (!selectedClass || !reportStartDate || !reportEndDate) {
            setError('Please select class and date range');
            return;
        }

        try {
            const response = await axios.get('/api/students/attendance', {
                params: {
                    class_id: selectedClass,
                    start_date: reportStartDate,
                    end_date: reportEndDate
                }
            });
            setAttendanceReport(response.data);
            setError(null);
        } catch (err) {
            setError('Failed to generate attendance report');
        }
    };

    return (
        <div className="p-6">
            <h2 className="text-2xl font-bold mb-6">Attendance Management</h2>

            <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700">
                    Select Class
                </label>
                <select
                    value={selectedClass}
                    onChange={(e) => setSelectedClass(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                >
                    <option value="">Select a class</option>
                    {classes.map((cls) => (
                        <option key={cls.id} value={cls.id}>
                            {cls.name}
                        </option>
                    ))}
                </select>
            </div>

            {user.role === 'teacher' && selectedClass && (
                <div className="bg-white rounded-lg shadow p-6 mb-6">
                    <h3 className="text-xl font-semibold mb-4">Mark Attendance</h3>
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700">
                            Date
                        </label>
                        <input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                        />
                    </div>

                    <form onSubmit={handleSubmit}>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Admission No
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Name
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Status
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {students.map((student) => (
                                        <tr key={student.id}>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {student.admission_number}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {student.first_name} {student.last_name}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <select
                                                    value={
                                                        attendance.find(
                                                            (a) => a.student_id === student.id
                                                        )?.status || 'present'
                                                    }
                                                    onChange={(e) =>
                                                        handleAttendanceChange(
                                                            student.id,
                                                            e.target.value
                                                        )
                                                    }
                                                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                                                >
                                                    {ATTENDANCE_STATUS.map((status) => (
                                                        <option key={status} value={status}>
                                                            {status.charAt(0).toUpperCase() +
                                                                status.slice(1)}
                                                        </option>
                                                    ))}
                                                </select>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
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
                                {loading ? 'Marking Attendance...' : 'Mark Attendance'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Attendance Report Section */}
            <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-xl font-semibold mb-4">Attendance Report</h3>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3 mb-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">
                            Start Date
                        </label>
                        <input
                            type="date"
                            value={reportStartDate}
                            onChange={(e) => setReportStartDate(e.target.value)}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">
                            End Date
                        </label>
                        <input
                            type="date"
                            value={reportEndDate}
                            onChange={(e) => setReportEndDate(e.target.value)}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                        />
                    </div>
                    <div className="flex items-end">
                        <button
                            onClick={generateReport}
                            className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                        >
                            Generate Report
                        </button>
                    </div>
                </div>

                {attendanceReport && (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Date
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Present
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Absent
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Late
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Excused
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {Object.entries(
                                    attendanceReport.reduce((acc, record) => {
                                        const date = record.date;
                                        if (!acc[date]) {
                                            acc[date] = {
                                                present: 0,
                                                absent: 0,
                                                late: 0,
                                                excused: 0
                                            };
                                        }
                                        acc[date][record.status]++;
                                        return acc;
                                    }, {})
                                ).map(([date, stats]) => (
                                    <tr key={date}>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {new Date(date).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {stats.present}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {stats.absent}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {stats.late}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {stats.excused}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AttendanceManagement; 