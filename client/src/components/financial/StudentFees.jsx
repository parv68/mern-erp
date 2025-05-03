import React, { useState, useEffect } from 'react';
import axios from '../../utils/axios';
import { toast } from 'react-toastify';

const StudentFees = () => {
    const [feeStructures, setFeeStructures] = useState([]);
    const [paymentHistory, setPaymentHistory] = useState([]);
    const [selectedFee, setSelectedFee] = useState(null);
    const [paymentMethod, setPaymentMethod] = useState('');
    const [loading, setLoading] = useState(false);
    const [student, setStudent] = useState(null);

    useEffect(() => {
        fetchStudentDetails();
    }, []);

    const fetchStudentDetails = async () => {
        try {
            // In a real application, this would come from the auth context
            const studentId = localStorage.getItem('student_id');
            const response = await axios.get(`/api/students/${studentId}`);
            setStudent(response.data);
            fetchFeeStructures(response.data.class_id);
            fetchPaymentHistory(studentId);
        } catch (error) {
            toast.error('Failed to fetch student details');
        }
    };

    const fetchFeeStructures = async (classId) => {
        try {
            const response = await axios.get(`/api/financial/fee-structures?class_id=${classId}`);
            setFeeStructures(response.data);
        } catch (error) {
            toast.error('Failed to fetch fee structures');
        }
    };

    const fetchPaymentHistory = async (studentId) => {
        try {
            const response = await axios.get(`/api/financial/payments/student/${studentId}`);
            setPaymentHistory(response.data);
        } catch (error) {
            toast.error('Failed to fetch payment history');
        }
    };

    const handlePayment = async () => {
        if (!selectedFee || !paymentMethod) {
            toast.error('Please select a fee and payment method');
            return;
        }

        setLoading(true);
        try {
            const paymentData = {
                student_id: student.id,
                fee_structure_id: selectedFee.id,
                amount_paid: selectedFee.amount,
                payment_method: paymentMethod
            };

            await axios.post('/api/financial/payments', paymentData);
            toast.success('Payment processed successfully');
            fetchPaymentHistory(student.id);
            setSelectedFee(null);
            setPaymentMethod('');
        } catch (error) {
            toast.error('Failed to process payment');
        } finally {
            setLoading(false);
        }
    };

    const isPaid = (feeStructure) => {
        return paymentHistory.some(
            payment => 
                payment.fee_structure_id === feeStructure.id && 
                payment.status === 'completed'
        );
    };

    const getPaymentStatus = (payment) => {
        switch (payment.status) {
            case 'completed':
                return <span className="text-green-600">Paid</span>;
            case 'pending':
                return <span className="text-yellow-600">Pending</span>;
            case 'failed':
                return <span className="text-red-600">Failed</span>;
            default:
                return payment.status;
        }
    };

    return (
        <div className="p-6">
            <h2 className="text-2xl font-bold mb-6">Fee Management</h2>

            {/* Fee Structure */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
                <h3 className="text-lg font-semibold mb-4">Fee Structure</h3>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fee Type</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Frequency</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {feeStructures.map((fee) => (
                                <tr key={fee.id}>
                                    <td className="px-6 py-4 whitespace-nowrap">{fee.fee_type}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">{fee.amount}</td>
                                    <td className="px-6 py-4 whitespace-nowrap capitalize">{fee.frequency}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {isPaid(fee) ? (
                                            <span className="text-green-600">Paid</span>
                                        ) : (
                                            <span className="text-red-600">Pending</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {!isPaid(fee) && (
                                            <button
                                                onClick={() => setSelectedFee(fee)}
                                                className="text-primary-600 hover:text-primary-900"
                                            >
                                                Pay Now
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Payment Form */}
            {selectedFee && (
                <div className="bg-white rounded-lg shadow p-6 mb-6">
                    <h3 className="text-lg font-semibold mb-4">Make Payment</h3>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Fee Type</label>
                            <input
                                type="text"
                                value={selectedFee.fee_type}
                                className="mt-1 block w-full rounded-md border-gray-300 bg-gray-50"
                                disabled
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Amount</label>
                            <input
                                type="text"
                                value={selectedFee.amount}
                                className="mt-1 block w-full rounded-md border-gray-300 bg-gray-50"
                                disabled
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700">Payment Method</label>
                            <select
                                value={paymentMethod}
                                onChange={(e) => setPaymentMethod(e.target.value)}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                                required
                            >
                                <option value="">Select Payment Method</option>
                                <option value="credit_card">Credit Card</option>
                                <option value="debit_card">Debit Card</option>
                                <option value="net_banking">Net Banking</option>
                                <option value="upi">UPI</option>
                            </select>
                        </div>
                        <div className="md:col-span-2">
                            <button
                                onClick={handlePayment}
                                disabled={loading || !paymentMethod}
                                className="w-full bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 disabled:bg-gray-400"
                            >
                                {loading ? 'Processing...' : 'Pay Now'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Payment History */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <h3 className="text-lg font-semibold p-6 border-b">Payment History</h3>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fee Type</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment Method</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {paymentHistory.map((payment) => (
                                <tr key={payment.id}>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {new Date(payment.payment_date).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">{payment.fee_type}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">{payment.amount_paid}</td>
                                    <td className="px-6 py-4 whitespace-nowrap capitalize">{payment.payment_method}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">{getPaymentStatus(payment)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default StudentFees; 