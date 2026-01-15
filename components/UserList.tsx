import React, { useEffect, useState } from 'react';
import { User, UserRole, MenuPermission } from '../types';
import { getUsers, createUser, updateUser, deleteUser } from '../services/userService';
import { logActivity } from '../services/activityService';
import { Search, Filter, UserPlus, Pencil, Trash2, X, Loader2, Clock, Check, Shield, Lock, Eye, EyeOff, ChevronDown, ChevronRight, CornerDownRight } from 'lucide-react';

interface UserListProps {
  currentUser?: User; // Optional prop for logging
  onUserUpdate?: (user: User) => void; // Callback to update parent state immediately
}

interface MenuStructure {
  id: MenuPermission;
  label: string;
  subItems?: MenuStructure[];
}

export const UserList: React.FC<UserListProps> = ({ currentUser, onUserUpdate }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Filter States
  const [selectedRole, setSelectedRole] = useState<UserRole | 'ALL'>('ALL');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  
  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Password Visibility State
  const [showPassword, setShowPassword] = useState(false);

  // Form States
  interface FormData {
    name: string;
    email: string;
    role: UserRole;
    permissions: MenuPermission[];
    password?: string;
  }

  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    role: UserRole.TECHNICIAN,
    permissions: ['dashboard'],
    password: ''
  });

  // HIERARCHICAL MENU STRUCTURE
  const MENU_STRUCTURE: MenuStructure[] = [
    { id: 'dashboard', label: 'Dashboard Overview' },
    { 
      id: 'data_master', 
      label: 'Data Master (Induk)',
      subItems: [
        { id: 'locations', label: 'Data Lokasi ATM' },
        { id: 'master_category', label: 'Master Kategori Problem' },
        { id: 'master_complaint_category', label: 'Master Kategori Aduan' },
        { id: 'master_info', label: 'Master Info Problem' },
        { id: 'master_bank', label: 'Master Bank Issuer' },
      ]
    },
    { id: 'users', label: 'Data Pengguna' },
    { id: 'reports', label: 'Laporan Masalah' },
    { id: 'mail', label: 'Mail System (Pesan Internal)' },
    { id: 'log_activity', label: 'Log Activity' }, 
    { id: 'settings', label: 'Pengaturan Sistem' },
  ];

  const fetchUsers = async () => {
    try {
      const data = await getUsers();
      setUsers(data);
    } catch (error) {
      console.error("Failed to fetch users", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const resetForm = () => {
    setFormData({ 
      name: '', 
      email: '', 
      role: UserRole.TECHNICIAN,
      permissions: ['dashboard'],
      password: ''
    });
    setSelectedUser(null);
    setShowPassword(false);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const newUser = await createUser(formData);
      
      if (currentUser) {
        logActivity(currentUser, 'CREATE', `User: ${newUser.name}`, `Created new user with role ${newUser.role}`);
      }

      await fetchUsers();
      setIsAddModalOpen(false);
      resetForm();
    } catch (error) {
      alert("Gagal membuat user");
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    setActionLoading(true);
    try {
      const updatedUser = await updateUser(selectedUser.id, formData);
      
      if (currentUser) {
        logActivity(currentUser, 'UPDATE', `User: ${formData.name}`, `Updated details for user ID ${selectedUser.id}`);
      }

      // Check if we updated the currently logged-in user
      if (currentUser && currentUser.id === selectedUser.id && onUserUpdate) {
        onUserUpdate(updatedUser);
      }

      await fetchUsers();
      setIsEditModalOpen(false);
      resetForm();
    } catch (error) {
      alert("Gagal update user");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedUser) return;
    setActionLoading(true);
    try {
      await deleteUser(selectedUser.id);

      if (currentUser) {
        logActivity(currentUser, 'DELETE', `User: ${selectedUser.name}`, `Deleted user ID ${selectedUser.id}`);
      }

      await fetchUsers();
      setIsDeleteModalOpen(false);
      setSelectedUser(null);
    } catch (error) {
      alert("Gagal menghapus user");
    } finally {
      setActionLoading(false);
    }
  };

  const openEditModal = (user: User) => {
    setSelectedUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      role: user.role,
      permissions: user.permissions || [],
      password: '' // Reset password field for edit mode
    });
    setShowPassword(false);
    setIsEditModalOpen(true);
  };

  const openDeleteModal = (user: User) => {
    setSelectedUser(user);
    setIsDeleteModalOpen(true);
  };

  // Improved Permission Handler for Hierarchy
  const togglePermission = (menuId: MenuPermission, subItems?: MenuStructure[], parentId?: MenuPermission) => {
    setFormData(prev => {
      const currentPermissions = new Set(prev.permissions);
      
      if (currentPermissions.has(menuId)) {
        // --- UNCHECK Logic ---
        currentPermissions.delete(menuId);
        
        // If unchecking a PARENT, uncheck ALL subitems
        if (subItems) {
           subItems.forEach(sub => currentPermissions.delete(sub.id));
        }

        // If unchecking a CHILD, we usually DO NOT uncheck the parent (Data Master remains active even if one child is removed).
        
      } else {
        // --- CHECK Logic ---
        currentPermissions.add(menuId);
        
        // If checking a PARENT, check ALL subitems
        if (subItems) {
          subItems.forEach(sub => currentPermissions.add(sub.id));
        }

        // If checking a CHILD, AUTOMATICALLY check the PARENT
        if (parentId) {
          currentPermissions.add(parentId);
        }
      }

      return { ...prev, permissions: Array.from(currentPermissions) };
    });
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.role.toLowerCase().includes(searchTerm.toLowerCase());
      
    const matchesRole = selectedRole === 'ALL' || user.role === selectedRole;

    return matchesSearch && matchesRole;
  });

  const getRoleBadgeStyle = (role: UserRole) => {
    switch (role) {
      case UserRole.SUPERADMIN:
        return 'bg-purple-100 text-purple-700 border-purple-200 ring-purple-500/30';
      case UserRole.HELPDESK:
        return 'bg-amber-100 text-amber-700 border-amber-200 ring-amber-500/30';
      case UserRole.CASH_MANAGEMENT:
        return 'bg-emerald-100 text-emerald-700 border-emerald-200 ring-emerald-500/30';
      case UserRole.TECHNICIAN:
        return 'bg-blue-100 text-blue-700 border-blue-200 ring-blue-500/30';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const formatDate = (dateString: string) => {
    if (dateString === '-') return 'Belum pernah login';
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(date);
    } catch (e) {
      return dateString;
    }
  };

  return (
    <>
      <div className="space-y-6 animate-fade-in pb-10">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Data Pengguna</h1>
            <p className="text-slate-500 text-sm mt-1">Kelola hak akses role Superadmin, Helpdesk, Cash Management, dan Technician.</p>
          </div>
          <button 
            onClick={() => { resetForm(); setIsAddModalOpen(true); }}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg transition-all shadow-md hover:shadow-lg active:scale-95 font-medium"
          >
            <UserPlus size={18} />
            <span>Tambah User</span>
          </button>
        </div>

        {/* Toolbar */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between z-20 relative">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text"
              placeholder="Cari nama, email, atau role..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all bg-white"
            />
          </div>
          <div className="flex items-center gap-2 w-full md:w-auto relative">
            <button 
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className={`flex items-center justify-center gap-2 px-4 py-2.5 border rounded-lg w-full md:w-auto transition-colors font-medium text-sm bg-white ${selectedRole !== 'ALL' ? 'border-blue-500 text-blue-600 bg-blue-50' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}
            >
              <Filter size={18} />
              <span>{selectedRole === 'ALL' ? 'Filter Role' : selectedRole}</span>
              {selectedRole !== 'ALL' && (
                <div 
                  onClick={(e) => { e.stopPropagation(); setSelectedRole('ALL'); }}
                  className="ml-1 p-0.5 hover:bg-blue-100 rounded-full"
                >
                  <X size={14} />
                </div>
              )}
            </button>

            {/* Filter Dropdown */}
            {isFilterOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setIsFilterOpen(false)}></div>
                <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-100 py-2 z-20 animate-fade-in-down">
                   <div className="px-4 py-2 border-b border-slate-50 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                     Pilih Role
                   </div>
                   <button 
                      onClick={() => { setSelectedRole('ALL'); setIsFilterOpen(false); }}
                      className={`w-full text-left px-4 py-2.5 text-sm hover:bg-slate-50 flex items-center justify-between ${selectedRole === 'ALL' ? 'text-blue-600 font-semibold bg-blue-50/50' : 'text-slate-700'}`}
                   >
                     <span>Semua Role</span>
                     {selectedRole === 'ALL' && <Check size={16} />}
                   </button>
                   {Object.values(UserRole).map((role) => (
                     <button 
                        key={role}
                        onClick={() => { setSelectedRole(role); setIsFilterOpen(false); }}
                        className={`w-full text-left px-4 py-2.5 text-sm hover:bg-slate-50 flex items-center justify-between ${selectedRole === role ? 'text-blue-600 font-semibold bg-blue-50/50' : 'text-slate-700'}`}
                     >
                       <span>{role}</span>
                       {selectedRole === role && <Check size={16} />}
                     </button>
                   ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Data Table */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden z-0 relative">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 text-xs font-bold uppercase tracking-wider">
                  <th className="p-4 w-16 text-center">No</th>
                  <th className="p-4">Informasi Pengguna</th>
                  <th className="p-4">Role Akses</th>
                  <th className="p-4">Akses Menu</th>
                  <th className="p-4">Terakhir Login</th>
                  <th className="p-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="p-12 text-center text-slate-500">
                      <div className="flex flex-col items-center justify-center gap-3">
                        <Loader2 size={32} className="text-blue-500 animate-spin" />
                        <span className="text-sm font-medium">Mengambil data dari database...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredUsers.length > 0 ? (
                  filteredUsers.map((user, index) => (
                    <tr key={user.id} className="hover:bg-blue-50/30 transition-colors group">
                      <td className="p-4 text-slate-500 font-medium text-center">{index + 1}</td>
                      <td className="p-4">
                        <div className="flex items-center gap-4">
                          <img 
                            src={user.avatar} 
                            alt={user.name} 
                            className="w-10 h-10 rounded-full object-cover border-2 border-slate-100 shadow-sm"
                          />
                          <div>
                            <div className="font-semibold text-slate-800">{user.name}</div>
                            <div className="text-sm text-slate-500">{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border shadow-sm ring-1 ring-inset ${getRoleBadgeStyle(user.role)}`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex flex-wrap gap-1 max-w-[200px]">
                           {/* Simply showing count for cleaner UI in table */}
                           <span className="text-sm text-slate-600 font-medium bg-slate-100 px-2 py-1 rounded border border-slate-200">
                             {user.permissions.length} Menu Akses
                           </span>
                        </div>
                      </td>
                      <td className="p-4 text-sm text-slate-600">
                         <div className="flex items-center gap-2">
                           <Clock size={14} className="text-slate-400" />
                           <span className="font-medium">{formatDate(user.lastLogin)}</span>
                         </div>
                      </td>
                      <td className="p-4">
                        <div className="flex justify-center items-center gap-2">
                           <button 
                             onClick={() => openEditModal(user)}
                             className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" 
                             title="Edit User"
                           >
                             <Pencil size={18} />
                           </button>
                           <button 
                             onClick={() => openDeleteModal(user)}
                             className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" 
                             title="Delete User"
                           >
                             <Trash2 size={18} />
                           </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="p-12 text-center text-slate-500">
                      <div className="flex flex-col items-center gap-2">
                         <Search size={32} className="text-slate-300" />
                         <p className="font-medium text-slate-600">
                           {selectedRole !== 'ALL' 
                             ? `Tidak ada pengguna dengan role ${selectedRole}`
                             : 'Tidak ada pengguna ditemukan'}
                         </p>
                         <p className="text-sm">Coba ubah filter atau kata kunci pencarian.</p>
                         {selectedRole !== 'ALL' && (
                           <button 
                             onClick={() => setSelectedRole('ALL')}
                             className="mt-2 text-blue-600 hover:underline text-sm font-medium"
                           >
                             Hapus Filter
                           </button>
                         )}
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {(isAddModalOpen || isEditModalOpen) && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={() => { setIsAddModalOpen(false); setIsEditModalOpen(false); }}></div>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg relative z-10 overflow-hidden animate-fade-in-up flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="text-lg font-bold text-slate-800">
                {isAddModalOpen ? 'Tambah User Baru' : 'Edit Informasi User'}
              </h3>
              <button onClick={() => { setIsAddModalOpen(false); setIsEditModalOpen(false); }} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <div className="overflow-y-auto p-6">
              <form id="userForm" onSubmit={isAddModalOpen ? handleCreate : handleUpdate} className="space-y-6">
                {/* User Details Fields */}
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-slate-700">Nama Lengkap</label>
                  <input 
                    type="text" 
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all bg-white text-slate-700 placeholder:text-slate-400"
                    placeholder="Contoh: Budi Santoso"
                    required
                  />
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-slate-700">Email</label>
                  <input 
                    type="email" 
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all bg-white text-slate-700 placeholder:text-slate-400"
                    placeholder="nama@email.com"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                   <div className="flex justify-between items-center">
                     <label className="text-sm font-semibold text-slate-700">Password</label>
                   </div>
                   <div className="relative">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                        <Lock size={18} />
                      </div>
                      <input 
                        type={showPassword ? "text" : "password"}
                        value={formData.password}
                        onChange={(e) => setFormData({...formData, password: e.target.value})}
                        className="w-full pl-10 pr-10 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all bg-white text-slate-700 placeholder:text-slate-400"
                        placeholder={isAddModalOpen ? "Masukkan password..." : "Biarkan kosong jika tidak berubah"}
                        required={isAddModalOpen}
                      />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                   </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-slate-700">Role Akses</label>
                  <select 
                    value={formData.role}
                    onChange={(e) => setFormData({...formData, role: e.target.value as UserRole})}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all bg-white text-slate-700"
                  >
                    {Object.values(UserRole).map((role) => (
                      <option key={role} value={role}>{role}</option>
                    ))}
                  </select>
                </div>

                {/* Permissions Section - Updated for Hierarchy */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center gap-2">
                     <Shield size={16} className="text-slate-500" />
                     <label className="text-sm font-semibold text-slate-700">Hak Akses Menu</label>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                    {MENU_STRUCTURE.map((menu) => (
                      <div key={menu.id} className="space-y-1">
                        {/* Parent Menu Item */}
                        <label className="flex items-center gap-3 p-2 hover:bg-white rounded-lg transition-colors cursor-pointer group">
                            <div className="relative flex items-center">
                              <input 
                                type="checkbox"
                                checked={formData.permissions.includes(menu.id)}
                                onChange={() => togglePermission(menu.id, menu.subItems)}
                                className="peer h-5 w-5 cursor-pointer appearance-none rounded-md border border-slate-300 transition-all checked:border-blue-500 checked:bg-blue-500 bg-white"
                              />
                              <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white opacity-0 transition-opacity peer-checked:opacity-100">
                                <Check size={12} strokeWidth={3} />
                              </div>
                            </div>
                            <span className={`text-sm select-none font-medium ${formData.permissions.includes(menu.id) ? 'text-blue-700' : 'text-slate-600'}`}>{menu.label}</span>
                        </label>

                        {/* Child Sub Items */}
                        {menu.subItems && (
                          <div className="ml-8 pl-4 border-l-2 border-slate-200 space-y-1">
                             {menu.subItems.map(sub => (
                                <label key={sub.id} className="flex items-center gap-3 p-1.5 hover:bg-slate-100/50 rounded-lg transition-colors cursor-pointer group">
                                  <div className="relative flex items-center">
                                    <input 
                                      type="checkbox"
                                      checked={formData.permissions.includes(sub.id)}
                                      onChange={() => togglePermission(sub.id, undefined, menu.id)}
                                      className="peer h-4 w-4 cursor-pointer appearance-none rounded border border-slate-300 transition-all checked:border-blue-500 checked:bg-blue-500 bg-white"
                                    />
                                    <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white opacity-0 transition-opacity peer-checked:opacity-100">
                                      <Check size={10} strokeWidth={3} />
                                    </div>
                                  </div>
                                  <span className="text-xs text-slate-600 select-none">{sub.label}</span>
                                </label>
                             ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-slate-400">
                    * Memilih menu induk akan otomatis memilih semua sub-menu didalamnya.
                  </p>
                </div>
              </form>
            </div>

            <div className="p-6 pt-0 flex justify-end gap-3 bg-white">
              <button 
                type="button"
                onClick={() => { setIsAddModalOpen(false); setIsEditModalOpen(false); }}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors font-medium"
              >
                Batal
              </button>
              <button 
                type="submit"
                form="userForm"
                disabled={actionLoading}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium flex items-center gap-2 shadow-lg shadow-blue-500/20"
              >
                {actionLoading && <Loader2 size={16} className="animate-spin" />}
                {isAddModalOpen ? 'Simpan Data' : 'Perbarui Data'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && selectedUser && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={() => setIsDeleteModalOpen(false)}></div>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm relative z-10 p-6 animate-fade-in-up text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 size={32} className="text-red-600" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-2">Hapus User?</h3>
            <p className="text-slate-500 mb-6">
              Apakah Anda yakin ingin menghapus user <strong>{selectedUser.name}</strong>? Tindakan ini tidak dapat dibatalkan.
            </p>
            <div className="flex justify-center gap-3">
               <button 
                 onClick={() => setIsDeleteModalOpen(false)}
                 className="px-5 py-2.5 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors font-medium border border-slate-200"
               >
                 Batal
               </button>
               <button 
                 onClick={handleDelete}
                 disabled={actionLoading}
                 className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium flex items-center gap-2"
               >
                 {actionLoading && <Loader2 size={16} className="animate-spin" />}
                 Hapus Sekarang
               </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};