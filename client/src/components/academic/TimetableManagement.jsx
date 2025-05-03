import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import axios from '../../utils/axios';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const TIME_SLOTS = [
    '08:00', '09:00', '10:00', '11:00', '12:00',
    '13:00', '14:00', '15:00', '16:00'
];

const TimetableManagement = () => {
    const { user } = useAuth();
    const [selectedClass, setSelectedClass] = useState('');
    const [classes, setClasses] = useState([]);
    const [timetable, setTimetable] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [teachers, setTeachers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Form states for creating timetable slot
    const [slotForm, setSlotForm] = useState({
        class_id: '',
        subject_id: '',
        teacher_id: '',
        day_of_week: 1,
        start_time: '08:00',
        end_time: '09:00',
        room_number: ''
    });

    // Form states for substitution
    const [substitutionForm, setSubstitutionForm] = useState({
        timetable_slot_id: '',
        substitute_teacher_id: '',
        date: '',
        reason: ''
    });

    useEffect(() => {
        fetchClasses();
        fetchSubjects();
        fetchTeachers();
    }, []);

    useEffect(() => {
        if (selectedClass) {
            fetchTimetable(selectedClass);
        }
    }, [selectedClass]);

    const fetchClasses = async () => {
        try {
            const response = await axios.get('/api/academic/classes');
            setClasses(response.data);
        } catch (err) {
            setError('Failed to fetch classes');
        }
    };

    const fetchSubjects = async () => {
        try {
            const response = await axios.get('/api/academic/subjects');
            setSubjects(response.data);
        } catch (err) {
            setError('Failed to fetch subjects');
        }
    };

    const fetchTeachers = async () => {
        try {
            const response = await axios.get('/api/users/teachers');
            setTeachers(response.data);
        } catch (err) {
            setError('Failed to fetch teachers');
        }
    };

    const fetchTimetable = async (classId) => {
        try {
            const response = await axios.get(`/api/academic/timetable/${classId}`);
            setTimetable(response.data);
        } catch (err) {
            setError('Failed to fetch timetable');
        }
    };

    const handleCreateSlot = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            await axios.post('/api/academic/timetable', slotForm);
            fetchTimetable(selectedClass);
            // Reset form
            setSlotForm({
                ...slotForm,
                subject_id: '',
                teacher_id: '',
                room_number: ''
            });
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to create timetable slot');
        } finally {
            setLoading(false);
        }
    };

    const handleSubstitution = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            await axios.post('/api/academic/timetable/substitution', substitutionForm);
            fetchTimetable(selectedClass);
            // Reset form
            setSubstitutionForm({
                timetable_slot_id: '',
                substitute_teacher_id: '',
                date: '',
                reason: ''
            });
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to mark substitution');
        } finally {
            setLoading(false);
        }
    };

    const getTimetableSlot = (day, time) => {
        return timetable.find(
            slot =>
                slot.day_of_week === DAYS.indexOf(day) + 1 &&
                slot.start_time === time
        );
    };

    return (
        <div className="p-6">
            <h2 className="text-2xl font-bold mb-6">Timetable Management</h2>

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

            {user.role === 'admin' && (
                <div className="bg-white rounded-lg shadow p-6 mb-6">
                    <h3 className="text-xl font-semibold mb-4">Create Timetable Slot</h3>
                    <form onSubmit={handleCreateSlot}>
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    Subject
                                </label>
                                <select
                                    value={slotForm.subject_id}
                                    onChange={(e) =>
                                        setSlotForm({ ...slotForm, subject_id: e.target.value })
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
                                    Teacher
                                </label>
                                <select
                                    value={slotForm.teacher_id}
                                    onChange={(e) =>
                                        setSlotForm({ ...slotForm, teacher_id: e.target.value })
                                    }
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                                    required
                                >
                                    <option value="">Select teacher</option>
                                    {teachers.map((teacher) => (
                                        <option key={teacher.id} value={teacher.id}>
                                            {teacher.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    Room Number
                                </label>
                                <input
                                    type="text"
                                    value={slotForm.room_number}
                                    onChange={(e) =>
                                        setSlotForm({ ...slotForm, room_number: e.target.value })
                                    }
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                                    required
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-4 md:grid-cols-3 mt-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    Day
                                </label>
                                <select
                                    value={slotForm.day_of_week}
                                    onChange={(e) =>
                                        setSlotForm({
                                            ...slotForm,
                                            day_of_week: parseInt(e.target.value)
                                        })
                                    }
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                                    required
                                >
                                    {DAYS.map((day, index) => (
                                        <option key={day} value={index + 1}>
                                            {day}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    Start Time
                                </label>
                                <select
                                    value={slotForm.start_time}
                                    onChange={(e) =>
                                        setSlotForm({ ...slotForm, start_time: e.target.value })
                                    }
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                                    required
                                >
                                    {TIME_SLOTS.map((time) => (
                                        <option key={time} value={time}>
                                            {time}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    End Time
                                </label>
                                <select
                                    value={slotForm.end_time}
                                    onChange={(e) =>
                                        setSlotForm({ ...slotForm, end_time: e.target.value })
                                    }
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                                    required
                                >
                                    {TIME_SLOTS.map((time) => (
                                        <option key={time} value={time}>
                                            {time}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {error && <div className="mt-4 text-red-600">{error}</div>}

                        <div className="mt-6">
                            <button
                                type="submit"
                                disabled={loading}
                                className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50"
                            >
                                {loading ? 'Creating...' : 'Create Slot'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {selectedClass && (
                <div className="bg-white rounded-lg shadow overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Time
                                </th>
                                {DAYS.map((day) => (
                                    <th
                                        key={day}
                                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                    >
                                        {day}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {TIME_SLOTS.map((time) => (
                                <tr key={time}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {time}
                                    </td>
                                    {DAYS.map((day) => {
                                        const slot = getTimetableSlot(day, time);
                                        return (
                                            <td
                                                key={day}
                                                className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
                                            >
                                                {slot ? (
                                                    <div>
                                                        <div className="font-medium">
                                                            {slot.subject_name}
                                                        </div>
                                                        <div className="text-gray-500">
                                                            {slot.teacher_name}
                                                        </div>
                                                        <div className="text-gray-400 text-xs">
                                                            Room: {slot.room_number}
                                                        </div>
                                                    </div>
                                                ) : null}
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default TimetableManagement; 