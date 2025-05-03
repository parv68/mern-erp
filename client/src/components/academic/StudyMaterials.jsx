import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import axios from '../../utils/axios';

const StudyMaterials = () => {
    const { user } = useAuth();
    const [materials, setMaterials] = useState([]);
    const [classes, setClasses] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [selectedClass, setSelectedClass] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Form state for uploading study material
    const [uploadForm, setUploadForm] = useState({
        title: '',
        description: '',
        subject_id: '',
        class_id: '',
        file: null
    });

    useEffect(() => {
        fetchClasses();
        fetchSubjects();
    }, []);

    useEffect(() => {
        if (selectedClass) {
            fetchMaterials(selectedClass);
        }
    }, [selectedClass]);

    const fetchClasses = async () => {
        try {
            const response = await axios.get('/api/academic/classes');
            setClasses(response.data);
        } catch (err) {
            setError('Failed to fetch classes');
        }
    };

    const fetchSubjects = async () => {
        try {
            const response = await axios.get('/api/academic/subjects');
            setSubjects(response.data);
        } catch (err) {
            setError('Failed to fetch subjects');
        }
    };

    const fetchMaterials = async (classId) => {
        try {
            const response = await axios.get(`/api/academic/study-materials/${classId}`);
            setMaterials(response.data);
        } catch (err) {
            setError('Failed to fetch study materials');
        }
    };

    const handleFileChange = (e) => {
        setUploadForm({
            ...uploadForm,
            file: e.target.files[0]
        });
    };

    const handleUpload = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const formData = new FormData();
        formData.append('title', uploadForm.title);
        formData.append('description', uploadForm.description);
        formData.append('subject_id', uploadForm.subject_id);
        formData.append('class_id', uploadForm.class_id);
        formData.append('file', uploadForm.file);

        try {
            await axios.post('/api/academic/study-materials', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            
            // Reset form
            setUploadForm({
                title: '',
                description: '',
                subject_id: '',
                class_id: '',
                file: null
            });
            
            // Refresh materials list
            if (selectedClass) {
                fetchMaterials(selectedClass);
            }
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to upload study material');
        } finally {
            setLoading(false);
        }
    };

    const downloadMaterial = async (materialId, fileName) => {
        try {
            const response = await axios.get(`/api/academic/study-materials/download/${materialId}`, {
                responseType: 'blob'
            });
            
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', fileName);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (err) {
            setError('Failed to download file');
        }
    };

    return (
        <div className="p-6">
            <h2 className="text-2xl font-bold mb-6">Study Materials</h2>

            <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700">
                    Select Class
                </label>
                <select
                    value={selectedClass}
                    onChange={(e) => setSelectedClass(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                >
                    <option value="">Select a class</option>
                    {classes.map((cls) => (
                        <option key={cls.id} value={cls.id}>
                            {cls.name}
                        </option>
                    ))}
                </select>
            </div>

            {user.role === 'teacher' && (
                <div className="bg-white rounded-lg shadow p-6 mb-6">
                    <h3 className="text-xl font-semibold mb-4">Upload Study Material</h3>
                    <form onSubmit={handleUpload}>
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    Title
                                </label>
                                <input
                                    type="text"
                                    value={uploadForm.title}
                                    onChange={(e) =>
                                        setUploadForm({ ...uploadForm, title: e.target.value })
                                    }
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    Subject
                                </label>
                                <select
                                    value={uploadForm.subject_id}
                                    onChange={(e) =>
                                        setUploadForm({
                                            ...uploadForm,
                                            subject_id: e.target.value
                                        })
                                    }
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                                    required
                                >
                                    <option value="">Select subject</option>
                                    {subjects.map((subject) => (
                                        <option key={subject.id} value={subject.id}>
                                            {subject.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="mt-4">
                            <label className="block text-sm font-medium text-gray-700">
                                Description
                            </label>
                            <textarea
                                value={uploadForm.description}
                                onChange={(e) =>
                                    setUploadForm({
                                        ...uploadForm,
                                        description: e.target.value
                                    })
                                }
                                rows={3}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                            />
                        </div>

                        <div className="mt-4">
                            <label className="block text-sm font-medium text-gray-700">
                                File
                            </label>
                            <input
                                type="file"
                                onChange={handleFileChange}
                                className="mt-1 block w-full"
                                required
                            />
                        </div>

                        {error && <div className="mt-4 text-red-600">{error}</div>}

                        <div className="mt-6">
                            <button
                                type="submit"
                                disabled={loading}
                                className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50"
                            >
                                {loading ? 'Uploading...' : 'Upload Material'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {selectedClass && (
                <div className="bg-white rounded-lg shadow">
                    <div className="p-6">
                        <h3 className="text-xl font-semibold mb-4">Available Materials</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {materials.map((material) => (
                                <div
                                    key={material.id}
                                    className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                                >
                                    <h4 className="font-semibold">{material.title}</h4>
                                    <p className="text-gray-600 text-sm mt-1">
                                        {material.description}
                                    </p>
                                    <div className="mt-2 text-sm text-gray-500">
                                        <p>Subject: {material.subject_name}</p>
                                        <p>Uploaded by: {material.teacher_name}</p>
                                        <p>
                                            Date:{' '}
                                            {new Date(
                                                material.created_at
                                            ).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() =>
                                            downloadMaterial(
                                                material.id,
                                                material.file_name
                                            )
                                        }
                                        className="mt-3 text-primary-600 hover:text-primary-700 font-medium"
                                    >
                                        Download
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StudyMaterials; 