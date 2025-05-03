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
      </Route>

      {/* 404 route */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default App; 