import React, { useState, useEffect } from 'react';
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
import { User, ViewState, AppSettings } from './types';
import { logout } from './services/authService';
import { getSettings } from './services/settingsService';

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<ViewState>('users');
  const [appSettings, setAppSettings] = useState<AppSettings | null>(null);

  // Load Settings from DB on Mount
  useEffect(() => {
    const loadAppConfig = async () => {
        const settings = await getSettings();
        setAppSettings(settings);
    };
    loadAppConfig();
  }, []);

  const handleLoginSuccess = (loggedInUser: User) => {
    setUser(loggedInUser);
    setCurrentView('dashboard');
  };

  const handleLogout = async () => {
    if (user) {
      await logout(user);
    } else {
      await logout();
    }
    setUser(null);
  };

  // Wait for settings to load before rendering anything (or show loader)
  if (!appSettings) {
      return (
        <div className="h-screen w-screen flex items-center justify-center bg-slate-50">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      );
  }

  // Render Login Screen if no user
  if (!user) {
    return <LoginForm onLoginSuccess={handleLoginSuccess} settings={appSettings} />;
  }

  // Render Dashboard Layout if logged in
  return (
    <Layout 
      user={user} 
      settings={appSettings}
      currentView={currentView} 
      onNavigate={setCurrentView}
      onLogout={handleLogout}
    >
      {currentView === 'users' && <UserList currentUser={user} onUserUpdate={setUser} />}
      {currentView === 'dashboard' && <Dashboard />}
      {currentView === 'locations' && <LocationList currentUser={user} />}
      {currentView === 'log_activity' && <ActivityLogList />}
      {currentView === 'mail' && <MailSystem currentUser={user} />}
      
      {currentView === 'complaints' && <ComplaintList currentUser={user} />}

      {/* Master Data Routes */}
      {currentView === 'master_category' && <MasterData currentUser={user} type="CATEGORY" />}
      {currentView === 'master_complaint_category' && <MasterData currentUser={user} type="COMPLAINT_CATEGORY" />}
      {currentView === 'master_info' && <MasterData currentUser={user} type="INFO" />}
      {currentView === 'master_bank' && <MasterData currentUser={user} type="BANK" />}
      
      {currentView === 'settings' && (
        <Settings 
          currentSettings={appSettings} 
          onSettingsUpdate={setAppSettings} 
          currentUser={user}
        />
      )}
    </Layout>
  );
}

export default App;