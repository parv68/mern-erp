import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import axios from '../../utils/axios';

const Announcements = () => {
    const { user } = useAuth();
    const [announcements, setAnnouncements] = useState([]);
    const [classes, setClasses] = useState([]);
    const [selectedClass, setSelectedClass] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const [announcementForm, setAnnouncementForm] = useState({
        title: '',
        content: ''
    });

    useEffect(() => {
        fetchClasses();
    }, []);

    useEffect(() => {
        if (selectedClass) {
            fetchAnnouncements(selectedClass);
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

    const fetchAnnouncements = async (classId) => {
        try {
            const response = await axios.get(`/api/academic/announcements/${classId}`);
            setAnnouncements(response.data);
        } catch (err) {
            setError('Failed to fetch announcements');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            await axios.post('/api/academic/announcements', {
                ...announcementForm,
                class_id: selectedClass
            });
            
            // Reset form
            setAnnouncementForm({
                title: '',
                content: ''
            });
            
            // Refresh announcements
            fetchAnnouncements(selectedClass);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to create announcement');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6">
            <h2 className="text-2xl font-bold mb-6">Class Announcements</h2>

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
                    <h3 className="text-xl font-semibold mb-4">Create Announcement</h3>
                    <form onSubmit={handleSubmit}>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">
                                Title
                            </label>
                            <input
                                type="text"
                                value={announcementForm.title}
                                onChange={(e) =>
                                    setAnnouncementForm({
                                        ...announcementForm,
                                        title: e.target.value
                                    })
                                }
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                                required
                            />
                        </div>

                        <div className="mt-4">
                            <label className="block text-sm font-medium text-gray-700">
                                Content
                            </label>
                            <textarea
                                value={announcementForm.content}
                                onChange={(e) =>
                                    setAnnouncementForm({
                                        ...announcementForm,
                                        content: e.target.value
                                    })
                                }
                                rows={4}
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
                                {loading ? 'Creating...' : 'Post Announcement'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {selectedClass && (
                <div className="bg-white rounded-lg shadow">
                    <div className="p-6">
                        <h3 className="text-xl font-semibold mb-4">Announcements</h3>
                        <div className="space-y-6">
                            {announcements.map((announcement) => (
                                <div
                                    key={announcement.id}
                                    className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                                >
                                    <h4 className="font-semibold text-lg">
                                        {announcement.title}
                                    </h4>
                                    <p className="text-gray-600 mt-2 whitespace-pre-wrap">
                                        {announcement.content}
                                    </p>
                                    <div className="mt-4 text-sm text-gray-500">
                                        <p>Posted by: {announcement.teacher_name}</p>
                                        <p>
                                            Date:{' '}
                                            {new Date(
                                                announcement.created_at
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

export default Announcements; 