import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import axios from '../../utils/axios';

const ACTIVITY_TYPES = ['Assignment', 'Quiz', 'Project', 'Other'];

const ClassActivities = () => {
    const { user } = useAuth();
    const [activities, setActivities] = useState([]);
    const [classes, setClasses] = useState([]);
    const [selectedClass, setSelectedClass] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const [activityForm, setActivityForm] = useState({
        title: '',
        description: '',
        due_date: '',
        type: ACTIVITY_TYPES[0],
        class_id: ''
    });

    useEffect(() => {
        fetchClasses();
    }, []);

    useEffect(() => {
        if (selectedClass) {
            fetchActivities(selectedClass);
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

    const fetchActivities = async (classId) => {
        try {
            const response = await axios.get(`/api/academic/activities/${classId}`);
            setActivities(response.data);
        } catch (err) {
            setError('Failed to fetch activities');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            await axios.post('/api/academic/activities', {
                ...activityForm,
                class_id: selectedClass
            });
            
            // Reset form
            setActivityForm({
                title: '',
                description: '',
                due_date: '',
                type: ACTIVITY_TYPES[0],
                class_id: ''
            });
            
            // Refresh activities
            fetchActivities(selectedClass);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to create activity');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6">
            <h2 className="text-2xl font-bold mb-6">Class Activities</h2>

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
                    <h3 className="text-xl font-semibold mb-4">Create Activity</h3>
                    <form onSubmit={handleSubmit}>
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    Title
                                </label>
                                <input
                                    type="text"
                                    value={activityForm.title}
                                    onChange={(e) =>
                                        setActivityForm({
                                            ...activityForm,
                                            title: e.target.value
                                        })
                                    }
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    Type
                                </label>
                                <select
                                    value={activityForm.type}
                                    onChange={(e) =>
                                        setActivityForm({
                                            ...activityForm,
                                            type: e.target.value
                                        })
                                    }
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                                    required
                                >
                                    {ACTIVITY_TYPES.map((type) => (
                                        <option key={type} value={type}>
                                            {type}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="mt-4">
                            <label className="block text-sm font-medium text-gray-700">
                                Description
                            </label>
                            <textarea
                                value={activityForm.description}
                                onChange={(e) =>
                                    setActivityForm({
                                        ...activityForm,
                                        description: e.target.value
                                    })
                                }
                                rows={3}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                                required
                            />
                        </div>

                        <div className="mt-4">
                            <label className="block text-sm font-medium text-gray-700">
                                Due Date
                            </label>
                            <input
                                type="datetime-local"
                                value={activityForm.due_date}
                                onChange={(e) =>
                                    setActivityForm({
                                        ...activityForm,
                                        due_date: e.target.value
                                    })
                                }
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                                required
                            />
                        </div>

                        {error && <div className="mt-4 text-red-600">{error}</div>}

                        <div className="mt-6">
                            <button
                                type="submit"
                                disabled={loading}
                                className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50"
                            >
                                {loading ? 'Creating...' : 'Create Activity'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {selectedClass && (
                <div className="bg-white rounded-lg shadow">
                    <div className="p-6">
                        <h3 className="text-xl font-semibold mb-4">Activities</h3>
                        <div className="space-y-4">
                            {activities.map((activity) => (
                                <div
                                    key={activity.id}
                                    className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                                >
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h4 className="font-semibold">{activity.title}</h4>
                                            <p className="text-gray-600 text-sm mt-1">
                                                {activity.description}
                                            </p>
                                        </div>
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                                            {activity.type}
                                        </span>
                                    </div>
                                    <div className="mt-2 text-sm text-gray-500">
                                        <p>Teacher: {activity.teacher_name}</p>
                                        <p>
                                            Due:{' '}
                                            {new Date(
                                                activity.due_date
                                            ).toLocaleString()}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ClassActivities; 