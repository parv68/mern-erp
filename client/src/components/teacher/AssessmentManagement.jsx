import React, { useState, useEffect } from 'react';
import axios from '../../utils/axios';
import { toast } from 'react-toastify';

const AssessmentManagement = () => {
    const [assessments, setAssessments] = useState([]);
    const [students, setStudents] = useState([]);
    const [examTypes, setExamTypes] = useState([]);
    const [classes, setClasses] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedClass, setSelectedClass] = useState('');
    const [selectedAssessment, setSelectedAssessment] = useState(null);

    // Form states
    const [assessmentForm, setAssessmentForm] = useState({
        name: '',
        description: '',
        exam_type_id: '',
        class_id: '',
        subject_id: '',
        total_marks: '',
        passing_marks: ''
    });

    const [marksForm, setMarksForm] = useState({
        student_id: '',
        assessment_id: '',
        marks_obtained: '',
        remarks: ''
    });

    useEffect(() => {
        fetchExamTypes();
        fetchClasses();
        fetchSubjects();
        fetchAssessments();
    }, []);

    useEffect(() => {
        if (selectedClass) {
            fetchStudentsByClass(selectedClass);
        }
    }, [selectedClass]);

    const fetchExamTypes = async () => {
        try {
            const response = await axios.get('/api/examination/types');
            setExamTypes(response.data);
        } catch (error) {
            toast.error('Failed to fetch exam types');
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

    const fetchSubjects = async () => {
        try {
            const response = await axios.get('/api/subjects');
            setSubjects(response.data);
        } catch (error) {
            toast.error('Failed to fetch subjects');
        }
    };

    const fetchAssessments = async () => {
        try {
            const response = await axios.get('/api/examination/assessments');
            setAssessments(response.data);
        } catch (error) {
            toast.error('Failed to fetch assessments');
        }
    };

    const fetchStudentsByClass = async (classId) => {
        try {
            const response = await axios.get(`/api/students?class_id=${classId}`);
            setStudents(response.data);
        } catch (error) {
            toast.error('Failed to fetch students');
        }
    };

    const handleAssessmentSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await axios.post('/api/examination/assessments', assessmentForm);
            toast.success('Assessment created successfully');
            setAssessmentForm({
                name: '',
                description: '',
                exam_type_id: '',
                class_id: '',
                subject_id: '',
                total_marks: '',
                passing_marks: ''
            });
            fetchAssessments();
        } catch (error) {
            toast.error(error.response?.data?.error || 'Failed to create assessment');
        } finally {
            setLoading(false);
        }
    };

    const handleMarksSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await axios.post('/api/examination/marks', marksForm);
            toast.success('Marks entered successfully');
            setMarksForm({
                student_id: '',
                assessment_id: '',
                marks_obtained: '',
                remarks: ''
            });
        } catch (error) {
            toast.error(error.response?.data?.error || 'Failed to enter marks');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6">
            <h2 className="text-2xl font-bold mb-6">Assessment Management</h2>

            {/* Create Assessment Form */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
                <h3 className="text-xl font-semibold mb-4">Create Assessment</h3>
                <form onSubmit={handleAssessmentSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Name</label>
                            <input
                                type="text"
                                value={assessmentForm.name}
                                onChange={(e) => setAssessmentForm({ ...assessmentForm, name: e.target.value })}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Description</label>
                            <textarea
                                value={assessmentForm.description}
                                onChange={(e) => setAssessmentForm({ ...assessmentForm, description: e.target.value })}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Exam Type</label>
                            <select
                                value={assessmentForm.exam_type_id}
                                onChange={(e) => setAssessmentForm({ ...assessmentForm, exam_type_id: e.target.value })}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                                required
                            >
                                <option value="">Select exam type</option>
                                {examTypes.map((type) => (
                                    <option key={type.id} value={type.id}>{type.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Class</label>
                            <select
                                value={assessmentForm.class_id}
                                onChange={(e) => setAssessmentForm({ ...assessmentForm, class_id: e.target.value })}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                                required
                            >
                                <option value="">Select class</option>
                                {classes.map((cls) => (
                                    <option key={cls.id} value={cls.id}>{cls.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Subject</label>
                            <select
                                value={assessmentForm.subject_id}
                                onChange={(e) => setAssessmentForm({ ...assessmentForm, subject_id: e.target.value })}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                                required
                            >
                                <option value="">Select subject</option>
                                {subjects.map((subject) => (
                                    <option key={subject.id} value={subject.id}>{subject.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Total Marks</label>
                            <input
                                type="number"
                                value={assessmentForm.total_marks}
                                onChange={(e) => setAssessmentForm({ ...assessmentForm, total_marks: e.target.value })}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                                required
                                min="0"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Passing Marks</label>
                            <input
                                type="number"
                                value={assessmentForm.passing_marks}
                                onChange={(e) => setAssessmentForm({ ...assessmentForm, passing_marks: e.target.value })}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                                required
                                min="0"
                            />
                        </div>
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50"
                    >
                        {loading ? 'Creating...' : 'Create Assessment'}
                    </button>
                </form>
            </div>

            {/* Enter Marks Form */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
                <h3 className="text-xl font-semibold mb-4">Enter Marks</h3>
                <form onSubmit={handleMarksSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Class</label>
                            <select
                                value={selectedClass}
                                onChange={(e) => setSelectedClass(e.target.value)}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                                required
                            >
                                <option value="">Select class</option>
                                {classes.map((cls) => (
                                    <option key={cls.id} value={cls.id}>{cls.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Assessment</label>
                            <select
                                value={marksForm.assessment_id}
                                onChange={(e) => {
                                    setMarksForm({ ...marksForm, assessment_id: e.target.value });
                                    setSelectedAssessment(assessments.find(a => a.id === e.target.value));
                                }}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                                required
                            >
                                <option value="">Select assessment</option>
                                {assessments.map((assessment) => (
                                    <option key={assessment.id} value={assessment.id}>{assessment.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Student</label>
                            <select
                                value={marksForm.student_id}
                                onChange={(e) => setMarksForm({ ...marksForm, student_id: e.target.value })}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                                required
                            >
                                <option value="">Select student</option>
                                {students.map((student) => (
                                    <option key={student.id} value={student.id}>
                                        {student.first_name} {student.last_name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Marks Obtained</label>
                            <input
                                type="number"
                                value={marksForm.marks_obtained}
                                onChange={(e) => setMarksForm({ ...marksForm, marks_obtained: e.target.value })}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                                required
                                min="0"
                                max={selectedAssessment?.total_marks || 100}
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700">Remarks</label>
                            <textarea
                                value={marksForm.remarks}
                                onChange={(e) => setMarksForm({ ...marksForm, remarks: e.target.value })}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                                rows="3"
                            />
                        </div>
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50"
                    >
                        {loading ? 'Saving...' : 'Save Marks'}
                    </button>
                </form>
            </div>

            {/* Assessments List */}
            <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-xl font-semibold mb-4">Assessments</h3>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Name
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Exam Type
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Subject
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Total Marks
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Passing Marks
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {assessments.map((assessment) => (
                                <tr key={assessment.id}>
                                    <td className="px-6 py-4 whitespace-nowrap">{assessment.name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">{assessment.exam_type_name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">{assessment.subject_name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">{assessment.total_marks}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">{assessment.passing_marks}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AssessmentManagement; 