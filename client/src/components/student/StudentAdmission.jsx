import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import axios from '../../utils/axios';

const StudentAdmission = () => {
    const { user } = useAuth();
    const [classes, setClasses] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState('');

    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        date_of_birth: '',
        gender: '',
        class_id: '',
        section: '',
        parent_name: '',
        parent_phone: '',
        parent_email: '',
        address: '',
        blood_group: '',
        previous_school: ''
    });

    useEffect(() => {
        fetchClasses();
    }, []);

    const fetchClasses = async () => {
        try {
            const response = await axios.get('/api/academic/classes');
            setClasses(response.data);
        } catch (err) {
            setError('Failed to fetch classes');
        }
    };

    const handleInputChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess('');

        try {
            const response = await axios.post('/api/students/admit', formData);
            setSuccess(`Student admitted successfully with admission number: ${response.data.admission_number}`);
            setFormData({
                first_name: '',
                last_name: '',
                date_of_birth: '',
                gender: '',
                class_id: '',
                section: '',
                parent_name: '',
                parent_phone: '',
                parent_email: '',
                address: '',
                blood_group: '',
                previous_school: ''
            });
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to admit student');
        } finally {
            setLoading(false);
        }
    };

    if (user.role !== 'admin') {
        return <div className="p-6">You don't have permission to access this page.</div>;
    }

    return (
        <div className="p-6">
            <h2 className="text-2xl font-bold mb-6">New Student Admission</h2>

            <div className="bg-white rounded-lg shadow p-6">
                <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                        {/* Personal Information */}
                        <div>
                            <h3 className="text-lg font-semibold mb-4">Personal Information</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">
                                        First Name
                                    </label>
                                    <input
                                        type="text"
                                        name="first_name"
                                        value={formData.first_name}
                                        onChange={handleInputChange}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">
                                        Last Name
                                    </label>
                                    <input
                                        type="text"
                                        name="last_name"
                                        value={formData.last_name}
                                        onChange={handleInputChange}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">
                                        Date of Birth
                                    </label>
                                    <input
                                        type="date"
                                        name="date_of_birth"
                                        value={formData.date_of_birth}
                                        onChange={handleInputChange}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">
                                        Gender
                                    </label>
                                    <select
                                        name="gender"
                                        value={formData.gender}
                                        onChange={handleInputChange}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                                        required
                                    >
                                        <option value="">Select gender</option>
                                        <option value="male">Male</option>
                                        <option value="female">Female</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">
                                        Blood Group
                                    </label>
                                    <input
                                        type="text"
                                        name="blood_group"
                                        value={formData.blood_group}
                                        onChange={handleInputChange}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Academic Information */}
                        <div>
                            <h3 className="text-lg font-semibold mb-4">Academic Information</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">
                                        Class
                                    </label>
                                    <select
                                        name="class_id"
                                        value={formData.class_id}
                                        onChange={handleInputChange}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                                        required
                                    >
                                        <option value="">Select class</option>
                                        {classes.map((cls) => (
                                            <option key={cls.id} value={cls.id}>
                                                {cls.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">
                                        Section
                                    </label>
                                    <input
                                        type="text"
                                        name="section"
                                        value={formData.section}
                                        onChange={handleInputChange}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">
                                        Previous School
                                    </label>
                                    <input
                                        type="text"
                                        name="previous_school"
                                        value={formData.previous_school}
                                        onChange={handleInputChange}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Parent/Guardian Information */}
                        <div className="md:col-span-2">
                            <h3 className="text-lg font-semibold mb-4">Parent/Guardian Information</h3>
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">
                                        Parent/Guardian Name
                                    </label>
                                    <input
                                        type="text"
                                        name="parent_name"
                                        value={formData.parent_name}
                                        onChange={handleInputChange}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">
                                        Parent/Guardian Phone
                                    </label>
                                    <input
                                        type="tel"
                                        name="parent_phone"
                                        value={formData.parent_phone}
                                        onChange={handleInputChange}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">
                                        Parent/Guardian Email
                                    </label>
                                    <input
                                        type="email"
                                        name="parent_email"
                                        value={formData.parent_email}
                                        onChange={handleInputChange}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">
                                        Address
                                    </label>
                                    <textarea
                                        name="address"
                                        value={formData.address}
                                        onChange={handleInputChange}
                                        rows={3}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                                        required
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {error && (
                        <div className="mt-4 text-red-600">{error}</div>
                    )}
                    
                    {success && (
                        <div className="mt-4 text-green-600">{success}</div>
                    )}

                    <div className="mt-6">
                        <button
                            type="submit"
                            disabled={loading}
                            className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50"
                        >
                            {loading ? 'Admitting Student...' : 'Admit Student'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default StudentAdmission; 