import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import NotificationsPage from './pages/NotificationsPage';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import InstructorDashboard from './pages/InstructorDashboard';
import InstructorCourseForm from './pages/InstructorCourseForm';
import InstructorCourseDetails from './pages/InstructorCourseDetails';
import InstructorProfileView from './pages/InstructorProfileView';
import InstructorCatalog from './pages/InstructorCatalog';
import UserProfileView from './pages/UserProfileView';
import StudentDashboard from './pages/StudentDashboard';
import StudentCatalog from './pages/StudentCatalog';
import StudentExplore from './pages/StudentExplore';
import StudentCourseView from './pages/StudentCourseView';
import StudentCoursePreview from './pages/StudentCoursePreview';
import Certificate from './pages/Certificate';
import Profile from './pages/Profile';
import PrivateRoute from './components/PrivateRoute';
import TakeAssessment from './pages/TakeAssessment';
import StudentCertificates from './pages/StudentCertificates';
import StudentStreak from './pages/StudentStreak';
import PaymentSubscriptions from './pages/PaymentSubscriptions';
import SimulatedCheckout from './pages/SimulatedCheckout';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <Router>
          <div className="app-container">
            <Navbar />
            <main>
              <Routes>
                <Route path="/" element={<Navigate to="/login" />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                {/* Student Routes */}
                <Route path="/dashboard" element={<PrivateRoute roleRequired="student"><StudentDashboard /></PrivateRoute>} />
                <Route path="/student/catalog" element={<PrivateRoute roleRequired="student"><StudentCatalog /></PrivateRoute>} />
                <Route path="/student/explore" element={<PrivateRoute roleRequired="student"><StudentExplore /></PrivateRoute>} />
                <Route path="/student/courses/:courseId" element={<PrivateRoute roleRequired="student"><StudentCourseView /></PrivateRoute>} />
                <Route path="/student/assessment/:assessmentId" element={<PrivateRoute roleRequired="student"><TakeAssessment /></PrivateRoute>} />
                <Route path="/student/courses/:courseId/preview" element={<PrivateRoute><StudentCoursePreview /></PrivateRoute>} />
                <Route path="/student/certificate/:courseId" element={<PrivateRoute roleRequired="student"><Certificate /></PrivateRoute>} />
                <Route path="/student/certificates" element={<PrivateRoute roleRequired="student"><StudentCertificates /></PrivateRoute>} />
                <Route path="/student/streak" element={<PrivateRoute roleRequired="student"><StudentStreak /></PrivateRoute>} />
                <Route path="/student/payments" element={<PrivateRoute roleRequired="student"><PaymentSubscriptions /></PrivateRoute>} />
                <Route path="/simulated-checkout" element={<PrivateRoute><SimulatedCheckout /></PrivateRoute>} />
                <Route path="/dashboard/notifications" element={<PrivateRoute roleRequired="student"><NotificationsPage /></PrivateRoute>} />
                {/* Instructor Routes */}
                <Route path="/instructor/dashboard" element={<PrivateRoute roleRequired="instructor"><InstructorDashboard /></PrivateRoute>} />
                <Route path="/instructor/courses/new" element={<PrivateRoute roleRequired="instructor"><InstructorCourseForm /></PrivateRoute>} />
                <Route path="/instructor/courses/:courseId" element={<PrivateRoute roleRequired="instructor"><InstructorCourseDetails /></PrivateRoute>} />
                <Route path="/instructor/catalog" element={<PrivateRoute roleRequired="instructor"><InstructorCatalog /></PrivateRoute>} />
                <Route path="/instructor/profile/:instructorId" element={<InstructorProfileView />} />
                <Route path="/profile/:userId" element={<UserProfileView />} />
                {/* Common Routes */}
                <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
              </Routes>
            </main>
          </div>
        </Router>
      </NotificationProvider>
    </AuthProvider>
  );
}

export default App;
