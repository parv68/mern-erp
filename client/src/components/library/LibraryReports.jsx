import React, { useState } from 'react';
import axios from '../../utils/axios';
import { toast } from 'react-toastify';

const LibraryReports = () => {
    const [reportType, setReportType] = useState('issues');
    const [dateRange, setDateRange] = useState({
        start_date: '',
        end_date: ''
    });
    const [reportData, setReportData] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setDateRange(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const generateReport = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const response = await axios.get('/api/library/reports', {
                params: {
                    report_type: reportType,
                    start_date: dateRange.start_date,
                    end_date: dateRange.end_date
                }
            });
            setReportData(response.data);
        } catch (error) {
            toast.error('Failed to generate report');
        } finally {
            setLoading(false);
        }
    };

    const renderReport = () => {
        if (!reportData) return null;

        switch (reportType) {
            case 'issues':
                return (
                    <div className="mt-6">
                        <h4 className="text-lg font-semibold mb-4">Issue Statistics</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="bg-white p-4 rounded-lg shadow">
                                <p className="text-sm text-gray-500">Total Issues</p>
                                <p className="text-2xl font-bold">{reportData.total_issues}</p>
                            </div>
                            <div className="bg-white p-4 rounded-lg shadow">
                                <p className="text-sm text-gray-500">Overdue Issues</p>
                                <p className="text-2xl font-bold text-red-600">{reportData.overdue_issues}</p>
                            </div>
                            <div className="bg-white p-4 rounded-lg shadow">
                                <p className="text-sm text-gray-500">Total Fines Collected</p>
                                <p className="text-2xl font-bold text-green-600">₹{reportData.total_fines}</p>
                            </div>
                        </div>
                    </div>
                );

            case 'popular_books':
                return (
                    <div className="mt-6">
                        <h4 className="text-lg font-semibold mb-4">Popular Books</h4>
                        <div className="bg-white shadow overflow-hidden rounded-lg">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Author</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Times Issued</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {reportData.map((book, index) => (
                                        <tr key={index}>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{book.title}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{book.author}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{book.issue_count}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <div className="p-6">
            <h2 className="text-2xl font-bold mb-6">Library Reports</h2>

            {/* Report Generation Form */}
            <div className="bg-white rounded-lg shadow p-6">
                <form onSubmit={generateReport} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Report Type</label>
                        <select
                            value={reportType}
                            onChange={(e) => setReportType(e.target.value)}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                        >
                            <option value="issues">Issue Statistics</option>
                            <option value="popular_books">Popular Books</option>
                        </select>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Start Date</label>
                            <input
                                type="date"
                                name="start_date"
                                value={dateRange.start_date}
                                onChange={handleInputChange}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">End Date</label>
                            <input
                                type="date"
                                name="end_date"
                                value={dateRange.end_date}
                                onChange={handleInputChange}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                                required
                            />
                        </div>
                    </div>
                    <div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-primary-600 text-white py-2 px-4 rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                        >
                            {loading ? 'Generating...' : 'Generate Report'}
                        </button>
                    </div>
                </form>

                {/* Report Display */}
                {renderReport()}
            </div>
        </div>
    );
};

export default LibraryReports; 