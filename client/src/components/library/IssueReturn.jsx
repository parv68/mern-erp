import React, { useState, useEffect } from 'react';
import axios from '../../utils/axios';
import { toast } from 'react-toastify';

const IssueReturn = () => {
    const [issues, setIssues] = useState([]);
    const [memberships, setMemberships] = useState([]);
    const [books, setBooks] = useState([]);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        book_id: '',
        membership_id: '',
        due_date: ''
    });

    useEffect(() => {
        fetchIssues();
        fetchMemberships();
        fetchBooks();
    }, []);

    const fetchIssues = async () => {
        try {
            const response = await axios.get('/api/library/issues');
            setIssues(response.data);
        } catch (error) {
            toast.error('Failed to fetch issues');
        }
    };

    const fetchMemberships = async () => {
        try {
            const response = await axios.get('/api/library/memberships');
            setMemberships(response.data);
        } catch (error) {
            toast.error('Failed to fetch memberships');
        }
    };

    const fetchBooks = async () => {
        try {
            const response = await axios.get('/api/library/books');
            setBooks(response.data);
        } catch (error) {
            toast.error('Failed to fetch books');
        }
    };

    const handleInputChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleIssue = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await axios.post('/api/library/issues', formData);
            toast.success('Book issued successfully');
            setFormData({
                book_id: '',
                membership_id: '',
                due_date: ''
            });
            fetchIssues();
        } catch (error) {
            toast.error(error.response?.data?.error || 'Failed to issue book');
        } finally {
            setLoading(false);
        }
    };

    const handleReturn = async (issueId) => {
        setLoading(true);
        try {
            await axios.put(`/api/library/issues/${issueId}/return`);
            toast.success('Book returned successfully');
            fetchIssues();
        } catch (error) {
            toast.error(error.response?.data?.error || 'Failed to return book');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6">
            <h2 className="text-2xl font-bold mb-6">Issue/Return Management</h2>

            {/* Issue Book Form */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
                <h3 className="text-lg font-semibold mb-4">Issue Book</h3>
                <form onSubmit={handleIssue} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Book</label>
                        <select
                            name="book_id"
                            value={formData.book_id}
                            onChange={handleInputChange}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                            required
                        >
                            <option value="">Select book</option>
                            {books.filter(book => book.available_copies > 0).map(book => (
                                <option key={book.id} value={book.id}>
                                    {book.title} ({book.available_copies} available)
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Member</label>
                        <select
                            name="membership_id"
                            value={formData.membership_id}
                            onChange={handleInputChange}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                            required
                        >
                            <option value="">Select member</option>
                            {memberships.map(member => (
                                <option key={member.id} value={member.id}>
                                    {member.membership_number}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Due Date</label>
                        <input
                            type="date"
                            name="due_date"
                            value={formData.due_date}
                            onChange={handleInputChange}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                            required
                        />
                    </div>
                    <div className="md:col-span-3">
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-primary-600 text-white py-2 px-4 rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                        >
                            {loading ? 'Issuing...' : 'Issue Book'}
                        </button>
                    </div>
                </form>
            </div>

            {/* Issues List */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Book</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Member</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Issue Date</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {issues.map((issue) => (
                            <tr key={issue.id}>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm font-medium text-gray-900">
                                        {books.find(b => b.id === issue.book_id)?.title}
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {memberships.find(m => m.id === issue.membership_id)?.membership_number}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {new Date(issue.issued_at).toLocaleDateString()}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {new Date(issue.due_date).toLocaleDateString()}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                        issue.status === 'issued' 
                                            ? 'bg-yellow-100 text-yellow-800'
                                            : issue.status === 'returned'
                                            ? 'bg-green-100 text-green-800'
                                            : 'bg-red-100 text-red-800'
                                    }`}>
                                        {issue.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {issue.status === 'issued' && (
                                        <button
                                            onClick={() => handleReturn(issue.id)}
                                            disabled={loading}
                                            className="text-primary-600 hover:text-primary-900"
                                        >
                                            Return
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default IssueReturn; 