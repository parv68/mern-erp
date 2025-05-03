import React, { useState, useEffect } from 'react';
import axios from '../../utils/axios';
import { toast } from 'react-toastify';
import { useAuth } from '../../hooks/useAuth';

const Announcements = () => {
    const { user } = useAuth();
    const [announcements, setAnnouncements] = useState([]);
    const [formData, setFormData] = useState({
        title: '',
        content: '',
        type: 'global',
        target_class: '',
        priority: 'normal'
    });
    const [classes, setClasses] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchAnnouncements();
        if (user?.role === 'admin' || user?.role === 'teacher') {
            fetchClasses();
        }
    }, [user]);

    const fetchAnnouncements = async () => {
        try {
            const response = await axios.get('/api/communication/announcements');
            setAnnouncements(response.data);
        } catch (error) {
            toast.error('Failed to fetch announcements');
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

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await axios.post('/api/communication/announcements', formData);
            toast.success('Announcement created successfully');
            setFormData({
                title: '',
                content: '',
                type: 'global',
                target_class: '',
                priority: 'normal'
            });
            fetchAnnouncements();
        } catch (error) {
            toast.error('Failed to create announcement');
        } finally {
            setLoading(false);
        }
    };

    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'high':
                return 'text-red-600';
            case 'medium':
                return 'text-yellow-600';
            default:
                return 'text-green-600';
        }
    };

    const canCreateAnnouncement = user?.role === 'admin' || user?.role === 'teacher';

    return (
        <div className="p-6">
            <h2 className="text-2xl font-bold mb-6">Announcements</h2>

            {/* Create Announcement Form */}
            {canCreateAnnouncement && (
                <div className="bg-white rounded-lg shadow p-6 mb-6">
                    <h3 className="text-lg font-semibold mb-4">Create Announcement</h3>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Title</label>
                            <input
                                type="text"
                                name="title"
                                value={formData.title}
                                onChange={handleInputChange}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">Content</label>
                            <textarea
                                name="content"
                                value={formData.content}
                                onChange={handleInputChange}
                                rows={4}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                                required
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Type</label>
                                <select
                                    name="type"
                                    value={formData.type}
                                    onChange={handleInputChange}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                                >
                                    <option value="global">Global</option>
                                    {user?.role === 'admin' && <option value="staff">Staff Only</option>}
                                    <option value="class">Class Specific</option>
                                </select>
                            </div>

                            {formData.type === 'class' && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Target Class</label>
                                    <select
                                        name="target_class"
                                        value={formData.target_class}
                                        onChange={handleInputChange}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                                        required
                                    >
                                        <option value="">Select Class</option>
                                        {classes.map(cls => (
                                            <option key={cls.id} value={cls.id}>{cls.name}</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-gray-700">Priority</label>
                                <select
                                    name="priority"
                                    value={formData.priority}
                                    onChange={handleInputChange}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                                >
                                    <option value="normal">Normal</option>
                                    <option value="medium">Medium</option>
                                    <option value="high">High</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-primary-600 text-white py-2 px-4 rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                            >
                                {loading ? 'Creating...' : 'Create Announcement'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Announcements List */}
            <div className="space-y-4">
                {announcements.map((announcement) => (
                    <div key={announcement.id} className="bg-white rounded-lg shadow p-6">
                        <div className="flex justify-between items-start">
                            <div>
                                <h3 className="text-lg font-semibold">{announcement.title}</h3>
                                <p className="text-sm text-gray-500 mt-1">
                                    {new Date(announcement.created_at).toLocaleDateString()} by {announcement.creator_name}
                                </p>
                            </div>
                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(announcement.priority)}`}>
                                {announcement.priority}
                            </span>
                        </div>
                        <div className="mt-4">
                            <p className="text-gray-700 whitespace-pre-wrap">{announcement.content}</p>
                        </div>
                        {announcement.type === 'class' && (
                            <div className="mt-2">
                                <span className="text-sm text-gray-500">
                                    Class: {classes.find(c => c.id === announcement.target_class)?.name}
                                </span>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Announcements; 