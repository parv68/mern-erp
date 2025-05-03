import React, { useState, useEffect } from 'react';
import axios from '../../utils/axios';
import { toast } from 'react-toastify';

const FeeManagement = () => {
    const [feeStructures, setFeeStructures] = useState([]);
    const [classes, setClasses] = useState([]);
    const [formData, setFormData] = useState({
        class_id: '',
        fee_type: '',
        amount: '',
        frequency: 'monthly',
        academic_year: ''
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchFeeStructures();
        fetchClasses();
    }, []);

    const fetchFeeStructures = async () => {
        try {
            const response = await axios.get('/api/financial/fee-structures');
            setFeeStructures(response.data);
        } catch (error) {
            toast.error('Failed to fetch fee structures');
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
            await axios.post('/api/financial/fee-structures', formData);
            toast.success('Fee structure created successfully');
            setFormData({
                class_id: '',
                fee_type: '',
                amount: '',
                frequency: 'monthly',
                academic_year: ''
            });
            fetchFeeStructures();
        } catch (error) {
            toast.error('Failed to create fee structure');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6">
            <h2 className="text-2xl font-bold mb-6">Fee Management</h2>

            {/* Create Fee Structure Form */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
                <h3 className="text-lg font-semibold mb-4">Create Fee Structure</h3>
                <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Class</label>
                        <select
                            name="class_id"
                            value={formData.class_id}
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

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Fee Type</label>
                        <input
                            type="text"
                            name="fee_type"
                            value={formData.fee_type}
                            onChange={handleInputChange}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Amount</label>
                        <input
                            type="number"
                            name="amount"
                            value={formData.amount}
                            onChange={handleInputChange}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Frequency</label>
                        <select
                            name="frequency"
                            value={formData.frequency}
                            onChange={handleInputChange}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                            required
                        >
                            <option value="monthly">Monthly</option>
                            <option value="quarterly">Quarterly</option>
                            <option value="annually">Annually</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Academic Year</label>
                        <input
                            type="text"
                            name="academic_year"
                            value={formData.academic_year}
                            onChange={handleInputChange}
                            placeholder="YYYY-YYYY"
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                            required
                        />
                    </div>

                    <div className="md:col-span-2">
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 disabled:bg-gray-400"
                        >
                            {loading ? 'Creating...' : 'Create Fee Structure'}
                        </button>
                    </div>
                </form>
            </div>

            {/* Fee Structures List */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <h3 className="text-lg font-semibold p-6 border-b">Fee Structures</h3>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Class</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fee Type</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Frequency</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Academic Year</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {feeStructures.map((fee) => (
                                <tr key={fee.id}>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {classes.find(c => c.id === fee.class_id)?.name || 'N/A'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">{fee.fee_type}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">{fee.amount}</td>
                                    <td className="px-6 py-4 whitespace-nowrap capitalize">{fee.frequency}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">{fee.academic_year}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default FeeManagement; 