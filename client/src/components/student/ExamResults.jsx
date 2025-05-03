import React, { useState, useEffect } from 'react';
import axios from '../../utils/axios';
import { useAuth } from '../../hooks/useAuth';
import { toast } from 'react-toastify';

const ExamResults = () => {
    const { user } = useAuth();
    const [examTypes, setExamTypes] = useState([]);
    const [schedules, setSchedules] = useState([]);
    const [marks, setMarks] = useState([]);
    const [reportCards, setReportCards] = useState([]);
    const [selectedExamType, setSelectedExamType] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchExamTypes();
        fetchExamSchedules();
    }, []);

    useEffect(() => {
        if (selectedExamType) {
            fetchMarks();
            fetchReportCard();
        }
    }, [selectedExamType]);

    const fetchExamTypes = async () => {
        try {
            const response = await axios.get('/api/examination/types');
            setExamTypes(response.data);
        } catch (error) {
            toast.error('Failed to fetch exam types');
        }
    };

    const fetchExamSchedules = async () => {
        try {
            const response = await axios.get(`/api/examination/schedules?class_id=${user.class_id}`);
            setSchedules(response.data);
        } catch (error) {
            toast.error('Failed to fetch exam schedules');
        }
    };

    const fetchMarks = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`/api/examination/marks?student_id=${user.id}&exam_type_id=${selectedExamType}`);
            setMarks(response.data);
        } catch (error) {
            toast.error('Failed to fetch marks');
        } finally {
            setLoading(false);
        }
    };

    const fetchReportCard = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`/api/examination/report-cards?student_id=${user.id}&exam_type_id=${selectedExamType}`);
            setReportCards([response.data]); // Assuming one report card per exam type
        } catch (error) {
            toast.error('Failed to fetch report card');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6">
            <h2 className="text-2xl font-bold mb-6">Exam Results</h2>

            {/* Exam Type Selection */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
                <h3 className="text-xl font-semibold mb-4">Select Exam</h3>
                <select
                    value={selectedExamType}
                    onChange={(e) => setSelectedExamType(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                >
                    <option value="">Select exam type</option>
                    {examTypes.map((type) => (
                        <option key={type.id} value={type.id}>{type.name}</option>
                    ))}
                </select>
            </div>

            {/* Exam Schedule */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
                <h3 className="text-xl font-semibold mb-4">Exam Schedule</h3>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Subject
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Date
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Time
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Venue
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {schedules
                                .filter(schedule => !selectedExamType || schedule.exam_type_id === selectedExamType)
                                .map((schedule) => (
                                    <tr key={schedule.id}>
                                        <td className="px-6 py-4 whitespace-nowrap">{schedule.subject_name}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {new Date(schedule.exam_date).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {schedule.start_time} - {schedule.end_time}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">{schedule.venue}</td>
                                    </tr>
                                ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Marks and Results */}
            {selectedExamType && (
                <>
                    <div className="bg-white rounded-lg shadow p-6 mb-6">
                        <h3 className="text-xl font-semibold mb-4">Subject-wise Marks</h3>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Subject
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Assessment
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Marks Obtained
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Total Marks
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Remarks
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {marks.map((mark) => (
                                        <tr key={mark.id}>
                                            <td className="px-6 py-4 whitespace-nowrap">{mark.subject_name}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">{mark.assessment_name}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">{mark.marks_obtained}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">{mark.total_marks}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">{mark.remarks}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Report Card */}
                    {reportCards.map((report) => (
                        <div key={report.id} className="bg-white rounded-lg shadow p-6">
                            <h3 className="text-xl font-semibold mb-4">Report Card</h3>
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <div>
                                    <p className="text-sm font-medium text-gray-500">Student Name</p>
                                    <p className="mt-1">{report.student_name}</p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-500">Class</p>
                                    <p className="mt-1">{report.class_name}</p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-500">Total Marks</p>
                                    <p className="mt-1">{report.total_marks}</p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-500">Percentage</p>
                                    <p className="mt-1">{report.percentage}%</p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-500">Grade</p>
                                    <p className="mt-1">{report.grade}</p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-500">Remarks</p>
                                    <p className="mt-1">{report.remarks}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </>
            )}

            {loading && (
                <div className="flex justify-center items-center py-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                </div>
            )}
        </div>
    );
};

export default ExamResults; 