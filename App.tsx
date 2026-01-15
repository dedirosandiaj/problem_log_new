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
import { ComplaintList } from './components/ComplaintList'; // Import ComplaintList
import { User, ViewState, AppSettings } from './types';
import { logout } from './services/authService';
import { getSettings } from './services/settingsService';

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<ViewState>('users');
  const [appSettings, setAppSettings] = useState<AppSettings>(getSettings());

  // Memastikan settings terupdate (jika ada perubahan di tab lain / inisialisasi)
  useEffect(() => {
    setAppSettings(getSettings());
  }, []);

  const handleLoginSuccess = (loggedInUser: User) => {
    setUser(loggedInUser);
    setCurrentView('dashboard'); // Default to dashboard on login
  };

  const handleLogout = async () => {
    if (user) {
      await logout(user); // Pass user to logout for logging purposes
    } else {
      await logout();
    }
    setUser(null);
  };

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
      
      {/* New Complaint Route */}
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