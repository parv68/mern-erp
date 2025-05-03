import React, { useState, useEffect } from 'react';
import axios from '../../utils/axios';
import { toast } from 'react-toastify';
import { PDFDownloadLink, Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

const ProgressReports = () => {
    const [classes, setClasses] = useState([]);
    const [students, setStudents] = useState([]);
    const [selectedClass, setSelectedClass] = useState('');
    const [selectedStudent, setSelectedStudent] = useState('');
    const [examTypes, setExamTypes] = useState([]);
    const [assessments, setAssessments] = useState([]);
    const [marks, setMarks] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchClasses();
        fetchExamTypes();
    }, []);

    useEffect(() => {
        if (selectedClass) {
            fetchStudents(selectedClass);
            fetchAssessments(selectedClass);
        }
    }, [selectedClass]);

    useEffect(() => {
        if (selectedStudent) {
            fetchMarks(selectedStudent);
        }
    }, [selectedStudent]);

    const fetchClasses = async () => {
        try {
            const response = await axios.get('/api/classes');
            setClasses(response.data);
        } catch (error) {
            toast.error('Failed to fetch classes');
        }
    };

    const fetchStudents = async (classId) => {
        try {
            const response = await axios.get(`/api/students?class_id=${classId}`);
            setStudents(response.data);
        } catch (error) {
            toast.error('Failed to fetch students');
        }
    };

    const fetchExamTypes = async () => {
        try {
            const response = await axios.get('/api/examination/types');
            setExamTypes(response.data);
        } catch (error) {
            toast.error('Failed to fetch exam types');
        }
    };

    const fetchAssessments = async (classId) => {
        try {
            const response = await axios.get(`/api/examination/assessments?class_id=${classId}`);
            setAssessments(response.data);
        } catch (error) {
            toast.error('Failed to fetch assessments');
        }
    };

    const fetchMarks = async (studentId) => {
        try {
            setLoading(true);
            const response = await axios.get(`/api/examination/marks?student_id=${studentId}`);
            setMarks(response.data);
        } catch (error) {
            toast.error('Failed to fetch marks');
        } finally {
            setLoading(false);
        }
    };

    const calculateProgress = () => {
        if (!marks.length) return null;

        const subjectWiseProgress = {};
        marks.forEach(mark => {
            if (!subjectWiseProgress[mark.subject_name]) {
                subjectWiseProgress[mark.subject_name] = {
                    totalMarks: 0,
                    obtainedMarks: 0,
                    assessments: 0
                };
            }
            subjectWiseProgress[mark.subject_name].totalMarks += mark.total_marks;
            subjectWiseProgress[mark.subject_name].obtainedMarks += mark.marks_obtained;
            subjectWiseProgress[mark.subject_name].assessments += 1;
        });

        return Object.entries(subjectWiseProgress).map(([subject, data]) => ({
            subject,
            percentage: (data.obtainedMarks / data.totalMarks) * 100,
            assessments: data.assessments
        }));
    };

    // PDF Styles
    const styles = StyleSheet.create({
        page: {
            padding: 30
        },
        header: {
            fontSize: 18,
            marginBottom: 20,
            textAlign: 'center'
        },
        section: {
            margin: 10,
            padding: 10
        },
        table: {
            display: 'table',
            width: '100%',
            borderStyle: 'solid',
            borderWidth: 1,
            borderColor: '#bfbfbf',
            marginBottom: 10
        },
        tableRow: {
            flexDirection: 'row'
        },
        tableCell: {
            width: '33%',
            borderStyle: 'solid',
            borderWidth: 1,
            borderColor: '#bfbfbf',
            padding: 5
        }
    });

    // PDF Document Component
    const ProgressReportPDF = ({ studentName, className, progress }) => (
        <Document>
            <Page size="A4" style={styles.page}>
                <Text style={styles.header}>Student Progress Report</Text>
                <View style={styles.section}>
                    <Text>Student Name: {studentName}</Text>
                    <Text>Class: {className}</Text>
                    <Text>Date: {new Date().toLocaleDateString()}</Text>
                </View>
                <View style={styles.table}>
                    <View style={styles.tableRow}>
                        <Text style={styles.tableCell}>Subject</Text>
                        <Text style={styles.tableCell}>Progress (%)</Text>
                        <Text style={styles.tableCell}>Assessments</Text>
                    </View>
                    {progress.map((item, index) => (
                        <View style={styles.tableRow} key={index}>
                            <Text style={styles.tableCell}>{item.subject}</Text>
                            <Text style={styles.tableCell}>{item.percentage.toFixed(2)}%</Text>
                            <Text style={styles.tableCell}>{item.assessments}</Text>
                        </View>
                    ))}
                </View>
            </Page>
        </Document>
    );

    const progress = calculateProgress();
    const selectedStudentData = students.find(s => s.id === selectedStudent);
    const selectedClassData = classes.find(c => c.id === selectedClass);

    return (
        <div className="p-6">
            <h2 className="text-2xl font-bold mb-6">Progress Reports</h2>

            <div className="bg-white rounded-lg shadow p-6 mb-6">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Class</label>
                        <select
                            value={selectedClass}
                            onChange={(e) => setSelectedClass(e.target.value)}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                        >
                            <option value="">Select class</option>
                            {classes.map((cls) => (
                                <option key={cls.id} value={cls.id}>{cls.name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Student</label>
                        <select
                            value={selectedStudent}
                            onChange={(e) => setSelectedStudent(e.target.value)}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                            disabled={!selectedClass}
                        >
                            <option value="">Select student</option>
                            {students.map((student) => (
                                <option key={student.id} value={student.id}>
                                    {student.first_name} {student.last_name}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {loading && (
                <div className="flex justify-center items-center py-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                </div>
            )}

            {progress && selectedStudentData && selectedClassData && (
                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-semibold">Progress Summary</h3>
                        <PDFDownloadLink
                            document={
                                <ProgressReportPDF
                                    studentName={`${selectedStudentData.first_name} ${selectedStudentData.last_name}`}
                                    className={selectedClassData.name}
                                    progress={progress}
                                />
                            }
                            fileName={`progress_report_${selectedStudentData.first_name}_${selectedStudentData.last_name}.pdf`}
                            className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700"
                        >
                            {({ loading }) => (loading ? 'Generating PDF...' : 'Download PDF')}
                        </PDFDownloadLink>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Subject
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Progress
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Assessments Completed
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {progress.map((item, index) => (
                                    <tr key={index}>
                                        <td className="px-6 py-4 whitespace-nowrap">{item.subject}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="w-full bg-gray-200 rounded-full h-2.5">
                                                    <div
                                                        className="bg-primary-600 h-2.5 rounded-full"
                                                        style={{ width: `${item.percentage}%` }}
                                                    ></div>
                                                </div>
                                                <span className="ml-2">{item.percentage.toFixed(2)}%</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">{item.assessments}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProgressReports; 