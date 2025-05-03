import React, { useState, useEffect } from 'react';
import axios from '../../utils/axios';
import { toast } from 'react-toastify';

const ExamManagement = () => {
    const [examTypes, setExamTypes] = useState([]);
    const [schedules, setSchedules] = useState([]);
    const [loading, setLoading] = useState(false);
    const [classes, setClasses] = useState([]);
    const [subjects, setSubjects] = useState([]);

    // Form states
    const [examTypeForm, setExamTypeForm] = useState({
        name: '',
        description: ''
    });

    const [scheduleForm, setScheduleForm] = useState({
        exam_type_id: '',
        class_id: '',
        subject_id: '',
        exam_date: '',
        start_time: '',
        end_time: '',
        venue: ''
    });

    useEffect(() => {
        fetchExamTypes();
        fetchClasses();
        fetchSubjects();
        fetchSchedules();
    }, []);

    const fetchExamTypes = async () => {
        try {
            const response = await axios.get('/api/examination/types');
            setExamTypes(response.data);
        } catch (error) {
            toast.error('Failed to fetch exam types');
        }
    };

    const fetchClasses = async () => {
        try {
            const response = await axios.get('/api/classes');
            setClasses(response.data);
        } catch (error) {
            toast.error('Failed to fetch classes');
        }
    };

    const fetchSubjects = async () => {
        try {
            const response = await axios.get('/api/subjects');
            setSubjects(response.data);
        } catch (error) {
            toast.error('Failed to fetch subjects');
        }
    };

    const fetchSchedules = async () => {
        try {
            const response = await axios.get('/api/examination/schedules');
            setSchedules(response.data);
        } catch (error) {
            toast.error('Failed to fetch exam schedules');
        }
    };

    const handleExamTypeSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await axios.post('/api/examination/types', examTypeForm);
            toast.success('Exam type created successfully');
            setExamTypeForm({ name: '', description: '' });
            fetchExamTypes();
        } catch (error) {
            toast.error(error.response?.data?.error || 'Failed to create exam type');
        } finally {
            setLoading(false);
        }
    };

    const handleScheduleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await axios.post('/api/examination/schedules', scheduleForm);
            toast.success('Exam schedule created successfully');
            setScheduleForm({
                exam_type_id: '',
                class_id: '',
                subject_id: '',
                exam_date: '',
                start_time: '',
                end_time: '',
                venue: ''
            });
            fetchSchedules();
        } catch (error) {
            toast.error(error.response?.data?.error || 'Failed to create exam schedule');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6">
            <h2 className="text-2xl font-bold mb-6">Exam Management</h2>

            {/* Create Exam Type Form */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
                <h3 className="text-xl font-semibold mb-4">Create Exam Type</h3>
                <form onSubmit={handleExamTypeSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Name</label>
                        <input
                            type="text"
                            value={examTypeForm.name}
                            onChange={(e) => setExamTypeForm({ ...examTypeForm, name: e.target.value })}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Description</label>
                        <textarea
                            value={examTypeForm.description}
                            onChange={(e) => setExamTypeForm({ ...examTypeForm, description: e.target.value })}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50"
                    >
                        {loading ? 'Creating...' : 'Create Exam Type'}
                    </button>
                </form>
            </div>

            {/* Create Exam Schedule Form */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
                <h3 className="text-xl font-semibold mb-4">Create Exam Schedule</h3>
                <form onSubmit={handleScheduleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Exam Type</label>
                            <select
                                value={scheduleForm.exam_type_id}
                                onChange={(e) => setScheduleForm({ ...scheduleForm, exam_type_id: e.target.value })}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                                required
                            >
                                <option value="">Select exam type</option>
                                {examTypes.map((type) => (
                                    <option key={type.id} value={type.id}>{type.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Class</label>
                            <select
                                value={scheduleForm.class_id}
                                onChange={(e) => setScheduleForm({ ...scheduleForm, class_id: e.target.value })}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                                required
                            >
                                <option value="">Select class</option>
                                {classes.map((cls) => (
                                    <option key={cls.id} value={cls.id}>{cls.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Subject</label>
                            <select
                                value={scheduleForm.subject_id}
                                onChange={(e) => setScheduleForm({ ...scheduleForm, subject_id: e.target.value })}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                                required
                            >
                                <option value="">Select subject</option>
                                {subjects.map((subject) => (
                                    <option key={subject.id} value={subject.id}>{subject.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Date</label>
                            <input
                                type="date"
                                value={scheduleForm.exam_date}
                                onChange={(e) => setScheduleForm({ ...scheduleForm, exam_date: e.target.value })}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Start Time</label>
                            <input
                                type="time"
                                value={scheduleForm.start_time}
                                onChange={(e) => setScheduleForm({ ...scheduleForm, start_time: e.target.value })}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">End Time</label>
                            <input
                                type="time"
                                value={scheduleForm.end_time}
                                onChange={(e) => setScheduleForm({ ...scheduleForm, end_time: e.target.value })}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Venue</label>
                            <input
                                type="text"
                                value={scheduleForm.venue}
                                onChange={(e) => setScheduleForm({ ...scheduleForm, venue: e.target.value })}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                                required
                            />
                        </div>
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50"
                    >
                        {loading ? 'Creating...' : 'Create Schedule'}
                    </button>
                </form>
            </div>

            {/* Exam Schedules List */}
            <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-xl font-semibold mb-4">Exam Schedules</h3>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Exam Type
                                </th>
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
                            {schedules.map((schedule) => (
                                <tr key={schedule.id}>
                                    <td className="px-6 py-4 whitespace-nowrap">{schedule.exam_type_name}</td>
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
        </div>
    );
};

export default ExamManagement; 