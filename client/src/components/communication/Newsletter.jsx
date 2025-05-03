import React, { useState, useEffect } from 'react';
import axios from '../../utils/axios';
import { toast } from 'react-toastify';
import { useAuth } from '../../hooks/useAuth';

const Newsletter = () => {
    const { user } = useAuth();
    const [newsletters, setNewsletters] = useState([]);
    const [formData, setFormData] = useState({
        title: '',
        content: '',
        target_audience: 'all',
        schedule_date: '',
        template: 'default'
    });
    const [loading, setLoading] = useState(false);
    const [preview, setPreview] = useState(false);

    useEffect(() => {
        fetchNewsletters();
    }, []);

    const fetchNewsletters = async () => {
        try {
            const response = await axios.get('/api/communication/newsletters');
            setNewsletters(response.data);
        } catch (error) {
            toast.error('Failed to fetch newsletters');
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
            await axios.post('/api/communication/newsletters', formData);
            toast.success('Newsletter created successfully');
            setFormData({
                title: '',
                content: '',
                target_audience: 'all',
                schedule_date: '',
                template: 'default'
            });
            fetchNewsletters();
        } catch (error) {
            toast.error('Failed to create newsletter');
        } finally {
            setLoading(false);
        }
    };

    const handleSendNow = async (newsletterId) => {
        try {
            await axios.post(`/api/communication/newsletters/${newsletterId}/send`);
            toast.success('Newsletter sent successfully');
            fetchNewsletters();
        } catch (error) {
            toast.error('Failed to send newsletter');
        }
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'draft':
                return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">Draft</span>;
            case 'scheduled':
                return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">Scheduled</span>;
            case 'sent':
                return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">Sent</span>;
            default:
                return null;
        }
    };

    return (
        <div className="p-6">
            <h2 className="text-2xl font-bold mb-6">Newsletter Management</h2>

            {/* Create Newsletter Form */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
                <h3 className="text-lg font-semibold mb-4">Create Newsletter</h3>
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
                            rows={6}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                            required
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Target Audience</label>
                            <select
                                name="target_audience"
                                value={formData.target_audience}
                                onChange={handleInputChange}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                            >
                                <option value="all">All</option>
                                <option value="parents">Parents Only</option>
                                <option value="teachers">Teachers Only</option>
                                <option value="students">Students Only</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">Template</label>
                            <select
                                name="template"
                                value={formData.template}
                                onChange={handleInputChange}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                            >
                                <option value="default">Default</option>
                                <option value="event">Event Announcement</option>
                                <option value="report">Monthly Report</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">Schedule Date</label>
                            <input
                                type="datetime-local"
                                name="schedule_date"
                                value={formData.schedule_date}
                                onChange={handleInputChange}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                            />
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <button
                            type="button"
                            onClick={() => setPreview(!preview)}
                            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                        >
                            {preview ? 'Hide Preview' : 'Show Preview'}
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 bg-primary-600 text-white py-2 px-4 rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                        >
                            {loading ? 'Creating...' : 'Create Newsletter'}
                        </button>
                    </div>
                </form>

                {/* Newsletter Preview */}
                {preview && (
                    <div className="mt-6 p-4 border rounded-lg">
                        <h4 className="text-lg font-semibold mb-2">{formData.title || 'Newsletter Title'}</h4>
                        <div className="prose max-w-none">
                            {formData.content || 'Newsletter content will appear here...'}
                        </div>
                    </div>
                )}
            </div>

            {/* Newsletters List */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Target Audience</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Schedule Date</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {newsletters.map((newsletter) => (
                                <tr key={newsletter.id}>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-900">{newsletter.title}</div>
                                        <div className="text-sm text-gray-500">Created on {new Date(newsletter.created_at).toLocaleDateString()}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap capitalize">
                                        {newsletter.target_audience}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {newsletter.schedule_date
                                            ? new Date(newsletter.schedule_date).toLocaleString()
                                            : 'Not scheduled'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {getStatusBadge(newsletter.status)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {newsletter.status === 'draft' && (
                                            <button
                                                onClick={() => handleSendNow(newsletter.id)}
                                                className="text-primary-600 hover:text-primary-900"
                                            >
                                                Send Now
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Newsletter; 