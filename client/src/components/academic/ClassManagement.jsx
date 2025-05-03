import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import axios from '../../utils/axios';

const ClassManagement = () => {
    const { user } = useAuth();
    const [classes, setClasses] = useState([]);
    const [formData, setFormData] = useState({
        name: '',
        academic_year: '',
        sections: ['A']
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

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

    const handleAddSection = () => {
        setFormData({
            ...formData,
            sections: [...formData.sections, String.fromCharCode(65 + formData.sections.length)]
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            await axios.post('/api/academic/classes', formData);
            setFormData({ name: '', academic_year: '', sections: ['A'] });
            fetchClasses();
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to create class');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6">
            <h2 className="text-2xl font-bold mb-6">Class Management</h2>

            {user.role === 'admin' && (
                <div className="bg-white rounded-lg shadow p-6 mb-6">
                    <h3 className="text-xl font-semibold mb-4">Create New Class</h3>
                    <form onSubmit={handleSubmit}>
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    Class Name
                                </label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    Academic Year
                                </label>
                                <input
                                    type="text"
                                    name="academic_year"
                                    value={formData.academic_year}
                                    onChange={handleInputChange}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                                    required
                                />
                            </div>
                        </div>

                        <div className="mt-4">
                            <label className="block text-sm font-medium text-gray-700">
                                Sections
                            </label>
                            <div className="flex flex-wrap gap-2 mt-2">
                                {formData.sections.map((section, index) => (
                                    <div
                                        key={index}
                                        className="bg-gray-100 px-3 py-1 rounded"
                                    >
                                        Section {section}
                                    </div>
                                ))}
                                <button
                                    type="button"
                                    onClick={handleAddSection}
                                    className="text-primary-600 hover:text-primary-700"
                                >
                                    + Add Section
                                </button>
                            </div>
                        </div>

                        {error && (
                            <div className="mt-4 text-red-600">{error}</div>
                        )}

                        <div className="mt-6">
                            <button
                                type="submit"
                                disabled={loading}
                                className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50"
                            >
                                {loading ? 'Creating...' : 'Create Class'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="bg-white rounded-lg shadow">
                <div className="p-6">
                    <h3 className="text-xl font-semibold mb-4">Class List</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {classes.map((classItem) => (
                            <div
                                key={classItem.id}
                                className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                            >
                                <h4 className="font-semibold">{classItem.name}</h4>
                                <p className="text-gray-600">
                                    Academic Year: {classItem.academic_year}
                                </p>
                                <div className="mt-2">
                                    <p className="text-sm text-gray-500">Sections:</p>
                                    <div className="flex flex-wrap gap-2 mt-1">
                                        {classItem.sections.map((section, index) => (
                                            <span
                                                key={index}
                                                className="bg-gray-100 px-2 py-1 rounded text-sm"
                                            >
                                                {section}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ClassManagement; 