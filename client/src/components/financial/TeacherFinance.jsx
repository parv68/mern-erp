import React, { useState, useEffect } from 'react';
import axios from '../../utils/axios';
import { toast } from 'react-toastify';

const TeacherFinance = () => {
    const [salaryHistory, setSalaryHistory] = useState([]);
    const [reimbursements, setReimbursements] = useState([]);
    const [salaryStructure, setSalaryStructure] = useState(null);
    const [formData, setFormData] = useState({
        amount: '',
        description: '',
        receipt_url: ''
    });
    const [loading, setLoading] = useState(false);
    const [uploadingFile, setUploadingFile] = useState(false);

    useEffect(() => {
        fetchTeacherFinancials();
    }, []);

    const fetchTeacherFinancials = async () => {
        try {
            // In a real application, this would come from the auth context
            const staffId = localStorage.getItem('staff_id');
            
            // Fetch salary structure
            const structureResponse = await axios.get(`/api/financial/salary-structures/staff/${staffId}`);
            setSalaryStructure(structureResponse.data);

            // Fetch salary payments
            const paymentsResponse = await axios.get(`/api/financial/salary-payments/staff/${staffId}`);
            setSalaryHistory(paymentsResponse.data);

            // Fetch reimbursements
            const reimbursementsResponse = await axios.get(`/api/financial/reimbursements/staff/${staffId}`);
            setReimbursements(reimbursementsResponse.data);
        } catch (error) {
            toast.error('Failed to fetch financial details');
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploadingFile(true);
        try {
            const formData = new FormData();
            formData.append('receipt', file);
            
            const response = await axios.post('/api/uploads/receipt', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            setFormData(prev => ({
                ...prev,
                receipt_url: response.data.url
            }));
            toast.success('Receipt uploaded successfully');
        } catch (error) {
            toast.error('Failed to upload receipt');
        } finally {
            setUploadingFile(false);
        }
    };

    const handleSubmitReimbursement = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const staffId = localStorage.getItem('staff_id');
            await axios.post('/api/financial/reimbursements', {
                ...formData,
                staff_id: staffId
            });
            toast.success('Reimbursement request submitted successfully');
            setFormData({
                amount: '',
                description: '',
                receipt_url: ''
            });
            fetchTeacherFinancials();
        } catch (error) {
            toast.error('Failed to submit reimbursement request');
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadge = (status) => {
        const baseClasses = "px-2 py-1 rounded-full text-xs font-medium";
        switch (status) {
            case 'completed':
            case 'approved':
                return <span className={`${baseClasses} bg-green-100 text-green-800`}>{status}</span>;
            case 'pending':
                return <span className={`${baseClasses} bg-yellow-100 text-yellow-800`}>{status}</span>;
            case 'rejected':
                return <span className={`${baseClasses} bg-red-100 text-red-800`}>{status}</span>;
            default:
                return <span className={`${baseClasses} bg-gray-100 text-gray-800`}>{status}</span>;
        }
    };

    return (
        <div className="p-6">
            <h2 className="text-2xl font-bold mb-6">Financial Management</h2>

            {/* Salary Structure */}
            {salaryStructure && (
                <div className="bg-white rounded-lg shadow p-6 mb-6">
                    <h3 className="text-lg font-semibold mb-4">Current Salary Structure</h3>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                        <div>
                            <p className="text-sm text-gray-500">Basic Salary</p>
                            <p className="text-lg font-medium">{salaryStructure.basic_salary}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Total Allowances</p>
                            <p className="text-lg font-medium">
                                {Object.values(salaryStructure.allowances).reduce((a, b) => a + b, 0)}
                            </p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Total Deductions</p>
                            <p className="text-lg font-medium">
                                {Object.values(salaryStructure.deductions).reduce((a, b) => a + b, 0)}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Salary History */}
            <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
                <h3 className="text-lg font-semibold p-6 border-b">Salary History</h3>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Month</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Gross Amount</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Deductions</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Net Amount</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {salaryHistory.map((payment) => (
                                <tr key={payment.id}>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {new Date(payment.payment_month).toLocaleDateString(undefined, { year: 'numeric', month: 'long' })}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">{payment.gross_amount}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">{payment.deductions}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">{payment.net_amount}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {getStatusBadge(payment.status)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Submit Reimbursement */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
                <h3 className="text-lg font-semibold mb-4">Submit Reimbursement</h3>
                <form onSubmit={handleSubmitReimbursement} className="grid grid-cols-1 gap-4">
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
                        <label className="block text-sm font-medium text-gray-700">Description</label>
                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleInputChange}
                            rows={3}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Receipt</label>
                        <input
                            type="file"
                            onChange={handleFileUpload}
                            accept="image/*,.pdf"
                            className="mt-1 block w-full"
                        />
                    </div>
                    <div>
                        <button
                            type="submit"
                            disabled={loading || uploadingFile || !formData.receipt_url}
                            className="w-full bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 disabled:bg-gray-400"
                        >
                            {loading ? 'Submitting...' : 'Submit Reimbursement'}
                        </button>
                    </div>
                </form>
            </div>

            {/* Reimbursement History */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <h3 className="text-lg font-semibold p-6 border-b">Reimbursement History</h3>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Receipt</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {reimbursements.map((reimbursement) => (
                                <tr key={reimbursement.id}>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {new Date(reimbursement.created_at).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4">{reimbursement.description}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">{reimbursement.amount}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {getStatusBadge(reimbursement.status)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <a
                                            href={reimbursement.receipt_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-primary-600 hover:text-primary-900"
                                        >
                                            View Receipt
                                        </a>
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

export default TeacherFinance; 