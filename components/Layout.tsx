import React, { useState, useEffect } from 'react';
import { User, ViewState, MenuPermission, AppSettings } from '../types';
import { logActivity } from '../services/activityService';
import { getUnreadCount } from '../services/mailService';
import { 
  Users, 
  LayoutDashboard, 
  LogOut, 
  Menu, 
  AlertOctagon,
  ChevronDown,
  ChevronRight, 
  ShieldCheck,
  FileBarChart,
  Settings,
  MapPin,
  History,
  Mail,
  Database,
  List,
  Info,
  CreditCard,
  MessageSquare,
  FileText // Icon for Data Aduan
} from 'lucide-react';

interface LayoutProps {
  user: User;
  settings: AppSettings;
  currentView: ViewState;
  onNavigate: (view: ViewState) => void;
  onLogout: () => void;
  children: React.ReactNode;
}

// Define Menu Structure
interface MenuItem {
  id: string;
  label: string;
  icon: React.ElementType;
  disabled?: boolean;
  permission?: MenuPermission; // Optional explicit permission override
  subItems?: {
    id: ViewState;
    label: string;
    icon?: React.ElementType;
    permission: MenuPermission; // Added permission for sub items
  }[];
}

export const Layout: React.FC<LayoutProps> = ({ user, settings, currentView, onNavigate, onLogout, children }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [unreadMailCount, setUnreadMailCount] = useState(0);
  
  // State to track expanded parent menus
  const [expandedMenus, setExpandedMenus] = useState<string[]>([]);

  // Fetch mail count periodically
  useEffect(() => {
    const fetchCount = async () => {
      const count = await getUnreadCount(user.id);
      setUnreadMailCount(count);
    };

    fetchCount();
    // Poll every 10 seconds for new mail
    const interval = setInterval(fetchCount, 10000);
    return () => clearInterval(interval);
  }, [user.id, currentView]);

  // Definisi Menu Lengkap
  const allMenuItems: MenuItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { 
      id: 'data_master', 
      label: 'Data Master', 
      icon: Database,
      subItems: [
        { id: 'locations', label: 'Data Lokasi ATM', icon: MapPin, permission: 'locations' },
        { id: 'master_category', label: 'Kategori Problem', icon: List, permission: 'master_category' },
        { id: 'master_complaint_category', label: 'Kategori Aduan', icon: MessageSquare, permission: 'master_complaint_category' },
        { id: 'master_info', label: 'Info Problem', icon: Info, permission: 'master_info' },
        { id: 'master_bank', label: 'Bank Issuer', icon: CreditCard, permission: 'master_bank' },
      ]
    },
    { id: 'complaints', label: 'Data Aduan', icon: FileText }, // New Menu
    { id: 'users', label: 'Data Pengguna', icon: Users },
    { id: 'reports', label: 'Laporan', icon: FileBarChart, disabled: true },
    { id: 'mail', label: 'Mail System', icon: Mail },
    { id: 'log_activity', label: 'Log Activity', icon: History },
    { id: 'settings', label: 'Pengaturan', icon: Settings },
  ];

  // Auto-Expand / Auto-Collapse Logic
  useEffect(() => {
    // Cari apakah view saat ini ada di dalam sub-item menu manapun
    const activeParent = allMenuItems.find(item => 
      item.subItems?.some(sub => sub.id === currentView)
    );

    if (activeParent) {
      // Jika halaman saat ini adalah sub-menu, pastikan parent-nya terbuka
      // Kita set array baru hanya berisi ID ini agar yang lain tertutup (single open logic)
      setExpandedMenus([activeParent.id]);
    } else {
      // Jika halaman saat ini adalah menu utama (bukan sub-menu), tutup semua collapse
      setExpandedMenus([]);
    }
  }, [currentView]);

  // Filter menu berdasarkan permission user
  const visibleMenuItems = allMenuItems.filter(item => 
    user.permissions.includes(item.id as MenuPermission)
  );

  const toggleMenu = (menuId: string) => {
    setExpandedMenus(prev => 
      prev.includes(menuId) ? prev.filter(id => id !== menuId) : [...prev, menuId]
    );
  };

  const handleNavigation = (view: ViewState, label: string) => {
    if (view !== currentView) {
      logActivity(user, 'VIEW', label, `User opened ${label} page`);
      onNavigate(view);
      setIsMobileMenuOpen(false);
    }
  };

  const getPageTitle = () => {
    switch (currentView) {
      case 'dashboard': return 'Dashboard Overview';
      case 'users': return 'Manajemen Pengguna';
      case 'locations': return 'Data Lokasi ATM';
      case 'log_activity': return 'Log Aktivitas System';
      case 'mail': return 'Pesan Internal (Mail)';
      case 'settings': return 'Pengaturan Aplikasi';
      case 'master_category': return 'Master Kategori Problem';
      case 'master_complaint_category': return 'Master Kategori Aduan';
      case 'master_info': return 'Master Info Problem';
      case 'master_bank': return 'Master Bank Issuer';
      case 'complaints': return 'Data Aduan Nasabah';
      default: return 'Menu';
    }
  };

  return (
    <div className="h-screen bg-slate-100 flex font-sans overflow-hidden">
      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/60 z-[90] md:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`
          fixed md:static inset-y-0 left-0 z-[100] w-72 bg-[#0f172a] text-slate-300 transform transition-transform duration-300 ease-in-out shadow-2xl flex flex-col
          ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
      >
        {/* Brand */}
        <div className="h-20 flex items-center gap-3 px-6 border-b border-slate-800/50 bg-[#0f172a] shrink-0">
          <div className="bg-blue-600 p-2 rounded-lg shadow-lg shadow-blue-900/20 flex-shrink-0 w-10 h-10 flex items-center justify-center overflow-hidden bg-white">
            {settings.logoUrl ? (
              <img src={settings.logoUrl} alt="Logo" className="w-full h-full object-contain" />
            ) : (
              <AlertOctagon size={24} className="text-blue-600" />
            )}
          </div>
          <div className="overflow-hidden">
            <h1 className="text-lg font-bold text-white tracking-tight leading-none truncate">{settings.appName}</h1>
            <span className="text-xs text-slate-500 font-medium tracking-wide truncate block">{settings.tagline}</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-8 px-4 space-y-2 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
          <div className="px-2 mb-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">Menu Utama</div>
          {visibleMenuItems.length > 0 ? (
            visibleMenuItems.map((item) => {
              // Cek jika subItems aktif
              // Filter subItems berdasarkan permissions user juga
              const visibleSubItems = item.subItems 
                ? item.subItems.filter(sub => user.permissions.includes(sub.permission))
                : [];
              
              // HIDE parent menu jika tidak ada sub-item yang visible
              if (item.subItems && visibleSubItems.length === 0) {
                return null;
              }

              const isExpanded = expandedMenus.includes(item.id);
              const isActiveParent = visibleSubItems.some(sub => sub.id === currentView);
              
              if (item.subItems) {
                // Render Parent Menu with Subitems
                return (
                  <div key={item.id} className="space-y-1">
                    <button
                      onClick={() => toggleMenu(item.id)}
                      className={`
                        w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group relative
                        ${isActiveParent || isExpanded ? 'text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'}
                      `}
                    >
                      <item.icon size={20} className={isActiveParent || isExpanded ? 'text-white' : 'text-slate-400 group-hover:text-white'} />
                      <span className="flex-1 text-left truncate">{item.label}</span>
                      {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    </button>

                    {/* Sub Menu Items */}
                    {isExpanded && (
                      <div className="pl-4 space-y-1 animate-fade-in-down">
                        <div className="border-l border-slate-700 pl-2 space-y-1">
                          {visibleSubItems.map((subItem) => {
                              const Icon = subItem.icon || ChevronRight;
                              return (
                                  <button
                                    key={subItem.id}
                                    onClick={() => handleNavigation(subItem.id, subItem.label)}
                                    className={`
                                      w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm transition-all duration-200
                                      ${currentView === subItem.id 
                                        ? 'bg-blue-600/90 text-white shadow-md' 
                                        : 'text-slate-400 hover:text-white hover:bg-slate-800/50'}
                                    `}
                                  >
                                    {subItem.icon && <Icon size={16} className={currentView === subItem.id ? 'text-white' : 'text-slate-500'} />}
                                    <span className="truncate">{subItem.label}</span>
                                  </button>
                              )
                            })
                          }
                        </div>
                      </div>
                    )}
                  </div>
                );
              } else {
                // Render Standard Menu Item
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                       if (!item.disabled) {
                         handleNavigation(item.id as ViewState, item.label);
                       }
                    }}
                    disabled={item.disabled}
                    className={`
                      w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group relative
                      ${currentView === item.id 
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/30' 
                        : item.disabled 
                          ? 'text-slate-600 cursor-not-allowed'
                          : 'text-slate-400 hover:text-white hover:bg-slate-800'}
                    `}
                  >
                    <item.icon size={20} className={`${currentView === item.id ? 'text-white' : 'text-slate-400 group-hover:text-white'} shrink-0`} />
                    <span className="flex-1 text-left truncate">{item.label}</span>
                    
                    {/* Mail Badge */}
                    {item.id === 'mail' && unreadMailCount > 0 && (
                      <span className="flex-shrink-0 bg-red-500 text-white text-[10px] font-bold h-5 min-w-[20px] px-1.5 flex items-center justify-center rounded-full shadow-md border border-slate-900/50">
                        {unreadMailCount > 9 ? '9+' : unreadMailCount}
                      </span>
                    )}

                    {item.disabled && <span className="ml-auto text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full border border-slate-700">Soon</span>}
                  </button>
                );
              }
            })
          ) : (
            <div className="px-4 py-4 text-sm text-slate-500 text-center border border-slate-800 rounded-xl bg-slate-800/30">
              Tidak ada menu yang tersedia untuk hak akses Anda.
            </div>
          )}
        </nav>

        {/* User Profile (Bottom Sidebar) */}
        <div className="p-4 border-t border-slate-800/50 bg-[#0b1120] shrink-0">
           <div className="flex items-center gap-3 px-3 py-3 rounded-xl bg-slate-800/50 border border-slate-700/50">
              <div className="relative">
                <img 
                  src={user.avatar} 
                  alt={user.name}
                  className="w-10 h-10 rounded-full border-2 border-slate-600" 
                />
                <div className="absolute -bottom-1 -right-1 bg-green-500 w-3 h-3 rounded-full border-2 border-slate-800"></div>
              </div>
              <div className="flex-1 overflow-hidden">
                <p className="text-sm font-semibold text-white truncate">{user.name}</p>
                <div className="flex items-center gap-1 text-xs text-blue-400">
                  <ShieldCheck size={12} />
                  <span className="truncate capitalize">{user.role}</span>
                </div>
              </div>
           </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Top Header */}
        <header className="h-20 bg-white border-b border-slate-200/60 flex items-center justify-between px-4 md:px-8 shadow-sm z-[80] sticky top-0 shrink-0">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="md:hidden p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <Menu size={24} />
            </button>
            <h2 className="text-xl font-bold text-slate-800 hidden md:block">
              {getPageTitle()}
            </h2>
          </div>

          <div className="flex items-center gap-4">
            {/* Profile Dropdown */}
            <div className="relative">
              <button 
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center gap-3 hover:bg-slate-50 py-2 pl-2 pr-4 rounded-full transition-all border border-transparent hover:border-slate-200"
              >
                <img 
                  src={user.avatar} 
                  alt="Profile" 
                  className="w-9 h-9 rounded-full object-cover border border-slate-200 shadow-sm"
                />
                <div className="text-left hidden sm:block">
                  <p className="text-sm font-semibold text-slate-700 leading-none">{user.name}</p>
                  <p className="text-xs text-slate-500 mt-1">{user.email}</p>
                </div>
                <ChevronDown size={16} className="text-slate-400" />
              </button>

              {isProfileOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-10"
                    onClick={() => setIsProfileOpen(false)}
                  />
                  <div className="absolute right-0 mt-3 w-56 bg-white rounded-xl shadow-xl border border-slate-100 py-2 z-20 animate-fade-in-down">
                    <div className="px-4 py-3 border-b border-slate-50 bg-slate-50/50">
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Signed in as</p>
                      <p className="text-sm font-bold text-slate-800 truncate mt-1">{user.role}</p>
                    </div>
                    <button 
                      onClick={onLogout}
                      className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors mt-1"
                    >
                      <LogOut size={16} />
                      Sign out
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto bg-slate-100 p-4 md:p-8 scroll-smooth scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent">
          {children}
        </main>
      </div>
    </div>
  );
};