import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import Layout from './components/Layout';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import Dashboard from './pages/dashboard';
import Profile from './pages/profile';
import ClassManagement from './components/academic/ClassManagement';
import TimetableManagement from './components/academic/TimetableManagement';
import StudyMaterials from './components/academic/StudyMaterials';
import ClassActivities from './components/academic/ClassActivities';
import Announcements from './components/academic/Announcements';
import StudentAdmission from './components/student/StudentAdmission';
import AttendanceManagement from './components/student/AttendanceManagement';
import LeaveApplication from './components/student/LeaveApplication';
import NotFound from './pages/NotFound';
import ExamManagement from './components/admin/ExamManagement';
import AssessmentManagement from './components/teacher/AssessmentManagement';
import ExamResults from './components/student/ExamResults';

// Library Components
import BookManagement from './components/library/BookManagement';
import IssueReturn from './components/library/IssueReturn';
import BookSearch from './components/library/BookSearch';
import MyBooks from './components/library/MyBooks';
import LibraryReports from './components/library/LibraryReports';

// Protected route wrapper
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  return children;
};

// Role-based route wrapper
const RoleRoute = ({ children, allowedRoles }) => {
  const { user } = useAuth();

  if (!allowedRoles.includes(user?.role)) {
    return <Navigate to="/" />;
  }

  return children;
};

function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Protected routes */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="profile" element={<Profile />} />
        
        {/* Academic Management Routes */}
        <Route
          path="academic/classes"
          element={
            <RoleRoute allowedRoles={['admin', 'teacher']}>
              <ClassManagement />
            </RoleRoute>
          }
        />
        <Route
          path="academic/timetable"
          element={<TimetableManagement />}
        />
        <Route
          path="academic/study-materials"
          element={<StudyMaterials />}
        />
        <Route
          path="academic/activities"
          element={
            <RoleRoute allowedRoles={['admin', 'teacher', 'student']}>
              <ClassActivities />
            </RoleRoute>
          }
        />
        <Route
          path="academic/announcements"
          element={<Announcements />}
        />
        
        {/* Student Management Routes */}
        <Route
          path="students/admission"
          element={
            <RoleRoute allowedRoles={['admin']}>
              <StudentAdmission />
            </RoleRoute>
          }
        />
        <Route
          path="students/attendance"
          element={
            <RoleRoute allowedRoles={['admin', 'teacher', 'student', 'parent']}>
              <AttendanceManagement />
            </RoleRoute>
          }
        />
        <Route
          path="students/leave"
          element={
            <RoleRoute allowedRoles={['admin', 'teacher', 'student', 'parent']}>
              <LeaveApplication />
            </RoleRoute>
          }
        />

        {/* Library Management Routes */}
        <Route
          path="library/books"
          element={
            <RoleRoute allowedRoles={['librarian']}>
              <BookManagement />
            </RoleRoute>
          }
        />
        <Route
          path="library/issue-return"
          element={
            <RoleRoute allowedRoles={['librarian']}>
              <IssueReturn />
            </RoleRoute>
          }
        />
        <Route
          path="library/reports"
          element={
            <RoleRoute allowedRoles={['librarian']}>
              <LibraryReports />
            </RoleRoute>
          }
        />
        <Route
          path="library/search"
          element={
            <RoleRoute allowedRoles={['student', 'teacher']}>
              <BookSearch />
            </RoleRoute>
          }
        />
        <Route
          path="library/my-books"
          element={
            <RoleRoute allowedRoles={['student', 'teacher']}>
              <MyBooks />
            </RoleRoute>
          }
        />

        {/* Exam Management Routes */}
        <Route
          path="exams/manage"
          element={
            <RoleRoute allowedRoles={['admin']}>
              <ExamManagement />
            </RoleRoute>
          }
        />
        <Route
          path="exams/assessments"
          element={
            <RoleRoute allowedRoles={['teacher']}>
              <AssessmentManagement />
            </RoleRoute>
          }
        />
        <Route
          path="exams/results"
          element={
            <RoleRoute allowedRoles={['student', 'parent']}>
              <ExamResults />
            </RoleRoute>
          }
        />

        {/* 404 Route */}
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}

export default App; 