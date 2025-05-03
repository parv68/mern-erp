import React, { useState, useEffect } from 'react';
import axios from '../../utils/axios';
import { toast } from 'react-toastify';

const SalaryManagement = () => {
    const [staff, setStaff] = useState([]);
    const [salaryStructures, setSalaryStructures] = useState([]);
    const [selectedStaff, setSelectedStaff] = useState('');
    const [formData, setFormData] = useState({
        staff_id: '',
        basic_salary: '',
        allowances: {
            hra: 0,
            da: 0,
            transport: 0
        },
        deductions: {
            pf: 0,
            tax: 0,
            other: 0
        },
        effective_from: ''
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchStaff();
        fetchSalaryStructures();
    }, []);

    const fetchStaff = async () => {
        try {
            const response = await axios.get('/api/staff');
            setStaff(response.data);
        } catch (error) {
            toast.error('Failed to fetch staff');
        }
    };

    const fetchSalaryStructures = async () => {
        try {
            const response = await axios.get('/api/financial/salary-structures');
            setSalaryStructures(response.data);
        } catch (error) {
            toast.error('Failed to fetch salary structures');
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        if (name.includes('.')) {
            const [category, field] = name.split('.');
            setFormData(prev => ({
                ...prev,
                [category]: {
                    ...prev[category],
                    [field]: parseFloat(value) || 0
                }
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: value
            }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await axios.post('/api/financial/salary-structures', formData);
            toast.success('Salary structure created successfully');
            setFormData({
                staff_id: '',
                basic_salary: '',
                allowances: { hra: 0, da: 0, transport: 0 },
                deductions: { pf: 0, tax: 0, other: 0 },
                effective_from: ''
            });
            fetchSalaryStructures();
        } catch (error) {
            toast.error('Failed to create salary structure');
        } finally {
            setLoading(false);
        }
    };

    const processSalaryPayment = async (salaryStructure) => {
        try {
            const paymentData = {
                staff_id: salaryStructure.staff_id,
                salary_structure_id: salaryStructure.id,
                payment_month: new Date().toISOString().slice(0, 7),
                gross_amount: calculateGrossAmount(salaryStructure),
                deductions: calculateTotalDeductions(salaryStructure),
                net_amount: calculateNetAmount(salaryStructure)
            };

            await axios.post('/api/financial/salary-payments', paymentData);
            toast.success('Salary payment processed successfully');
        } catch (error) {
            toast.error('Failed to process salary payment');
        }
    };

    const calculateGrossAmount = (salaryStructure) => {
        const allowances = Object.values(salaryStructure.allowances).reduce((a, b) => a + b, 0);
        return parseFloat(salaryStructure.basic_salary) + allowances;
    };

    const calculateTotalDeductions = (salaryStructure) => {
        return Object.values(salaryStructure.deductions).reduce((a, b) => a + b, 0);
    };

    const calculateNetAmount = (salaryStructure) => {
        return calculateGrossAmount(salaryStructure) - calculateTotalDeductions(salaryStructure);
    };

    return (
        <div className="p-6">
            <h2 className="text-2xl font-bold mb-6">Salary Management</h2>

            {/* Create Salary Structure Form */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
                <h3 className="text-lg font-semibold mb-4">Create Salary Structure</h3>
                <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700">Staff Member</label>
                        <select
                            name="staff_id"
                            value={formData.staff_id}
                            onChange={handleInputChange}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                            required
                        >
                            <option value="">Select Staff Member</option>
                            {staff.map(member => (
                                <option key={member.id} value={member.id}>
                                    {member.first_name} {member.last_name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Basic Salary</label>
                        <input
                            type="number"
                            name="basic_salary"
                            value={formData.basic_salary}
                            onChange={handleInputChange}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Effective From</label>
                        <input
                            type="date"
                            name="effective_from"
                            value={formData.effective_from}
                            onChange={handleInputChange}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                            required
                        />
                    </div>

                    <div className="md:col-span-2">
                        <h4 className="font-medium mb-2">Allowances</h4>
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">HRA</label>
                                <input
                                    type="number"
                                    name="allowances.hra"
                                    value={formData.allowances.hra}
                                    onChange={handleInputChange}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">DA</label>
                                <input
                                    type="number"
                                    name="allowances.da"
                                    value={formData.allowances.da}
                                    onChange={handleInputChange}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Transport</label>
                                <input
                                    type="number"
                                    name="allowances.transport"
                                    value={formData.allowances.transport}
                                    onChange={handleInputChange}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="md:col-span-2">
                        <h4 className="font-medium mb-2">Deductions</h4>
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">PF</label>
                                <input
                                    type="number"
                                    name="deductions.pf"
                                    value={formData.deductions.pf}
                                    onChange={handleInputChange}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Tax</label>
                                <input
                                    type="number"
                                    name="deductions.tax"
                                    value={formData.deductions.tax}
                                    onChange={handleInputChange}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Other</label>
                                <input
                                    type="number"
                                    name="deductions.other"
                                    value={formData.deductions.other}
                                    onChange={handleInputChange}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="md:col-span-2">
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 disabled:bg-gray-400"
                        >
                            {loading ? 'Creating...' : 'Create Salary Structure'}
                        </button>
                    </div>
                </form>
            </div>

            {/* Salary Structures List */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <h3 className="text-lg font-semibold p-6 border-b">Salary Structures</h3>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Staff Member</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Basic Salary</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Gross Amount</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Net Amount</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Effective From</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {salaryStructures.map((salary) => (
                                <tr key={salary.id}>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {staff.find(s => s.id === salary.staff_id)?.first_name || 'N/A'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">{salary.basic_salary}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">{calculateGrossAmount(salary)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">{calculateNetAmount(salary)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">{new Date(salary.effective_from).toLocaleDateString()}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <button
                                            onClick={() => processSalaryPayment(salary)}
                                            className="text-primary-600 hover:text-primary-900"
                                        >
                                            Process Payment
                                        </button>
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

export default SalaryManagement; 