import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { LoginForm } from './components/LoginForm';
import { Layout } from './components/Layout';
import { UserList } from './components/UserList';
import { Dashboard } from './components/Dashboard';
import { LocationList } from './components/LocationList';
import { Settings } from './components/Settings';
import { ActivityLogList } from './components/ActivityLogList';
import { MailSystem } from './components/MailSystem';
import { MasterData } from './components/MasterData';
import { ComplaintList } from './components/ComplaintList';
import { User, AppSettings } from './types';
import { logout, restoreSession } from './services/authService';
import { getSettings } from './services/settingsService';

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [appSettings, setAppSettings] = useState<AppSettings | null>(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true);

  // Load Settings & Restore Session on Mount
  useEffect(() => {
    const initApp = async () => {
        try {
            // 1. Load Settings
            const settings = await getSettings();
            setAppSettings(settings);

            // 2. Restore User Session if exists
            const restoredUser = await restoreSession();
            if (restoredUser) {
                setUser(restoredUser);
            }
        } catch (error) {
            console.error("Initialization failed", error);
        } finally {
            setIsAuthChecking(false);
        }
    };
    initApp();
  }, []);

  const handleLoginSuccess = (loggedInUser: User) => {
    setUser(loggedInUser);
  };

  const handleLogout = async () => {
    if (user) {
      await logout(user);
    } else {
      await logout();
    }
    setUser(null);
  };

  // Show Loader while checking auth and loading settings
  if (isAuthChecking || !appSettings) {
      return (
        <div className="h-screen w-screen flex items-center justify-center bg-slate-50 flex-col gap-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="text-slate-500 font-medium text-sm">Memuat aplikasi...</p>
        </div>
      );
  }

  // Protected Route Wrapper
  const ProtectedLayout = () => {
    if (!user) {
      return <Navigate to="/login" replace />;
    }

    return (
      <Layout 
        user={user} 
        settings={appSettings}
        onLogout={handleLogout}
      />
    );
  };

  return (
    <BrowserRouter>
      <Routes>
        <Route 
          path="/login" 
          element={!user ? <LoginForm onLoginSuccess={handleLoginSuccess} settings={appSettings} /> : <Navigate to="/" replace />} 
        />
        
        <Route element={<ProtectedLayout />}>
           <Route path="/" element={<Dashboard />} />
           <Route path="/users" element={<UserList currentUser={user!} onUserUpdate={setUser} />} />
           <Route path="/locations" element={<LocationList currentUser={user!} />} />
           <Route path="/activity-logs" element={<ActivityLogList />} />
           <Route path="/mail" element={<MailSystem currentUser={user!} />} />
           <Route path="/complaints" element={<ComplaintList currentUser={user!} />} />
           
           {/* Master Data Routes */}
           <Route path="/master/category" element={<MasterData currentUser={user!} type="CATEGORY" />} />
           <Route path="/master/complaint-category" element={<MasterData currentUser={user!} type="COMPLAINT_CATEGORY" />} />
           <Route path="/master/info" element={<MasterData currentUser={user!} type="INFO" />} />
           <Route path="/master/bank" element={<MasterData currentUser={user!} type="BANK" />} />
           
           <Route path="/settings" element={<Settings currentSettings={appSettings} onSettingsUpdate={setAppSettings} currentUser={user!} />} />
        </Route>

        {/* Catch all redirect to dashboard */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;