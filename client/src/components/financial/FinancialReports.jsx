import React, { useState } from 'react';
import axios from '../../utils/axios';
import { toast } from 'react-toastify';

const FinancialReports = () => {
    const [reportType, setReportType] = useState('fee_collection');
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
            const response = await axios.get('/api/financial/reports', {
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

    const renderFeeCollectionReport = () => {
        if (!reportData) return null;
        return (
            <div className="mt-6">
                <h4 className="text-lg font-semibold mb-4">Fee Collection Summary</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-white p-4 rounded-lg shadow">
                        <p className="text-sm text-gray-500">Total Collection</p>
                        <p className="text-2xl font-bold">₹{reportData.total_collection}</p>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow">
                        <p className="text-sm text-gray-500">Pending Amount</p>
                        <p className="text-2xl font-bold text-red-600">₹{reportData.pending_amount}</p>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow">
                        <p className="text-sm text-gray-500">Collection Rate</p>
                        <p className="text-2xl font-bold text-green-600">{reportData.collection_rate}%</p>
                    </div>
                </div>
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Class</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Students</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expected Amount</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Collected Amount</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Collection Rate</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {reportData.class_wise_collection.map((item, index) => (
                                <tr key={index}>
                                    <td className="px-6 py-4 whitespace-nowrap">{item.class_name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">{item.total_students}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">₹{item.expected_amount}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">₹{item.collected_amount}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">{item.collection_rate}%</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    };

    const renderSalaryReport = () => {
        if (!reportData) return null;
        return (
            <div className="mt-6">
                <h4 className="text-lg font-semibold mb-4">Salary Disbursement Summary</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-white p-4 rounded-lg shadow">
                        <p className="text-sm text-gray-500">Total Disbursement</p>
                        <p className="text-2xl font-bold">₹{reportData.total_disbursement}</p>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow">
                        <p className="text-sm text-gray-500">Total Staff</p>
                        <p className="text-2xl font-bold">{reportData.total_staff}</p>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow">
                        <p className="text-sm text-gray-500">Average Salary</p>
                        <p className="text-2xl font-bold">₹{reportData.average_salary}</p>
                    </div>
                </div>
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Staff Count</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Salary</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Average Salary</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {reportData.department_wise_salary.map((item, index) => (
                                <tr key={index}>
                                    <td className="px-6 py-4 whitespace-nowrap">{item.department}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">{item.staff_count}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">₹{item.total_salary}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">₹{item.average_salary}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    };

    return (
        <div className="p-6">
            <h2 className="text-2xl font-bold mb-6">Financial Reports</h2>

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
                            <option value="fee_collection">Fee Collection Report</option>
                            <option value="salary_disbursement">Salary Disbursement Report</option>
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
                {reportType === 'fee_collection' ? renderFeeCollectionReport() : renderSalaryReport()}
            </div>
        </div>
    );
};

export default FinancialReports; 