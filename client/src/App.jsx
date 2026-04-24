import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
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
import StudentCourseView from './pages/StudentCourseView';
import StudentCoursePreview from './pages/StudentCoursePreview';
import Certificate from './pages/Certificate';
import Profile from './pages/Profile';
import PrivateRoute from './components/PrivateRoute';
import './App.css';

function App() {
  return (
    <AuthProvider>
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
              <Route path="/student/courses/:courseId" element={<PrivateRoute roleRequired="student"><StudentCourseView /></PrivateRoute>} />
              <Route path="/student/courses/:courseId/preview" element={<PrivateRoute><StudentCoursePreview /></PrivateRoute>} />
              <Route path="/student/certificate/:courseId" element={<PrivateRoute roleRequired="student"><Certificate /></PrivateRoute>} />
              
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
    </AuthProvider>
  );
}

export default App;
