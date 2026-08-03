import React, { useContext } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Customers from './pages/Customers';
import Policies from './pages/Policies';
import Claims from './pages/Claims';
import Payments from './pages/Payments';

// Route guards to protect paths based on authentication
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useContext(AuthContext);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex justify-center items-center">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

// Route guards to restrict paths to Admin / Agent roles
const StaffRoute = ({ children }) => {
  const { user, loading } = useContext(AuthContext);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex justify-center items-center">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (user?.role !== 'ADMIN' && user?.role !== 'AGENT') {
    return <Navigate to="/" replace />;
  }

  return children;
};

// App Layout wrapper containing Sidebar and main Workspace pane
const AppLayout = () => {
  return (
    <div className="flex bg-[#0b0f19] min-h-screen text-slate-100 font-sans">
      <Sidebar />
      <main className="flex-1 p-8 h-screen overflow-y-auto">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route 
            path="/customers" 
            element={
              <StaffRoute>
                <Customers />
              </StaffRoute>
            } 
          />
          <Route path="/policies" element={<Policies />} />
          <Route path="/claims" element={<Claims />} />
          <Route path="/payments" element={<Payments />} />
        </Routes>
      </main>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route 
            path="/*" 
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            } 
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
