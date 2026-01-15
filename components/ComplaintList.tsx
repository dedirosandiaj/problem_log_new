import React, { useState, useEffect, useRef } from 'react';
import { Complaint, User, Location, ComplaintComment } from '../types';
import { logActivity } from '../services/activityService';
import { getLocations } from '../services/locationService';
import { getComplaints, createComplaint, updateComplaint, addComment } from '../services/complaintService';
import { Plus, Search, MessageSquare, X, Loader2, Clock, CheckCircle, AlertCircle, PlayCircle, PauseCircle, Send, ChevronDown, MapPin } from 'lucide-react';

interface ComplaintListProps {
  currentUser?: User;
}

export const ComplaintList: React.FC<ComplaintListProps> = ({ currentUser }) => {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Locations Data for Dropdown
  const [locations, setLocations] = useState<Location[]>([]);
  
  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCommentModalOpen, setIsCommentModalOpen] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null); // Track if editing

  // Read Status State (Ticket ID -> Comment Count)
  const [viewedCounts, setViewedCounts] = useState<Record<string, number>>({});

  // Form State
  const initialFormState: {
    nasabah: string;
    terminalId: string;
    waktuTrx: string;
    waktuAduan: string;
    jenisAduan: string;
    severity: 'LOW' | 'MEDIUM' | 'HIGH';
    pengecekan: 'VALID' | 'TIDAK VALID';
    status: 'OPEN' | 'CLOSED' | 'HOLD' | 'IN PROGRESS';
  } = {
    nasabah: '',
    terminalId: '',
    waktuTrx: '',
    waktuAduan: '',
    jenisAduan: 'Uang Tidak Keluar',
    severity: 'MEDIUM',
    pengecekan: 'VALID',
    status: 'OPEN',
  };

  const [formData, setFormData] = useState(initialFormState);
  
  // Searchable Dropdown State
  const [terminalSearch, setTerminalSearch] = useState('');
  const [showTerminalDropdown, setShowTerminalDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Comment Input State
  const [newComment, setNewComment] = useState('');

  // Load Initial Data
  useEffect(() => {
    // Load viewed counts from local storage
    const storedViews = localStorage.getItem('complaint_comment_views');
    if (storedViews) {
      try {
        setViewedCounts(JSON.parse(storedViews));
      } catch (e) {
        console.error("Failed to parse viewed counts", e);
      }
    }

    const fetchData = async () => {
        try {
            const locs = await getLocations();
            setLocations(locs);
            
            const realComplaints = await getComplaints();
            setComplaints(realComplaints);
        } catch (error) {
            console.error("Error fetching data:", error);
        } finally {
            setLoading(false);
        }
    };
    fetchData();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowTerminalDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);


  // Helper: Generate Random Ticket
  const generateTicketNumber = () => {
    const randomNum = Math.floor(10000 + Math.random() * 90000);
    return `TKT-${randomNum}`;
  };

  // Helper: Calculate Downtime
  const calculateDowntime = (startDateStr: string, status: string) => {
    if (status === 'CLOSED') return 'Selesai';
    
    const start = new Date(startDateStr).getTime();
    const now = new Date().getTime();
    const diff = now - start;

    if (diff < 0) return '0j 0m';

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    return `${hours}j ${minutes}m`;
  };

  // Helper: Format DateTime
  const formatDateTime = (isoString: string) => {
    if (!isoString) return '-';
    return new Date(isoString).toLocaleString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const updateViewedCount = (complaintId: string, count: number) => {
     const newCounts = { ...viewedCounts, [complaintId]: count };
     setViewedCounts(newCounts);
     localStorage.setItem('complaint_comment_views', JSON.stringify(newCounts));
  };

  // Reset Form for Create
  const openCreateModal = () => {
    setFormData(initialFormState);
    setTerminalSearch('');
    setEditingId(null);
    setIsModalOpen(true);
  };

  // Populate Form for Edit
  const openEditModal = (complaint: Complaint) => {
    setFormData({
      nasabah: complaint.nasabah,
      terminalId: complaint.terminalId,
      // Slice ISO string to fit datetime-local input (YYYY-MM-DDThh:mm)
      waktuTrx: complaint.waktuTrx ? new Date(complaint.waktuTrx).toISOString().slice(0, 16) : '',
      waktuAduan: complaint.waktuAduan ? new Date(complaint.waktuAduan).toISOString().slice(0, 16) : '',
      jenisAduan: complaint.jenisAduan,
      severity: complaint.severity,
      pengecekan: complaint.pengecekan,
      status: complaint.status,
    });
    setTerminalSearch(complaint.terminalId);
    setEditingId(complaint.id);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);

    try {
        if (editingId) {
            // UPDATE LOGIC (DB)
            await updateComplaint(editingId, {
                ...formData,
                waktuTrx: new Date(formData.waktuTrx).toISOString(),
                waktuAduan: new Date(formData.waktuAduan).toISOString()
            });
            
            // Refresh List
            const refreshed = await getComplaints();
            setComplaints(refreshed);
            
            if (currentUser) {
                logActivity(currentUser, 'UPDATE', 'Data Aduan', `Memperbarui data aduan ${formData.nasabah}`);
            }
        } else {
            // CREATE LOGIC (DB)
            const newTicket = generateTicketNumber();
            await createComplaint({
                noTiket: newTicket,
                ...formData,
                waktuTrx: formData.waktuTrx ? new Date(formData.waktuTrx).toISOString() : new Date().toISOString(),
                waktuAduan: formData.waktuAduan ? new Date(formData.waktuAduan).toISOString() : new Date().toISOString()
            });
            
            const refreshed = await getComplaints();
            setComplaints(refreshed);

            if (currentUser) {
                logActivity(currentUser, 'CREATE', 'Data Aduan', `Membuat aduan baru ${newTicket} - ${formData.nasabah}`);
            }
        }

        setIsModalOpen(false);
        setFormData(initialFormState);
        setTerminalSearch('');
        setEditingId(null);
    } catch (err) {
        alert("Gagal menyimpan data: " + err);
    } finally {
        setActionLoading(false);
    }
  };

  const handleAddComment = async () => {
      if (!selectedComplaint || !newComment.trim() || !currentUser) return;

      try {
        const commentData = {
            userId: currentUser.id,
            userName: currentUser.name,
            userRole: currentUser.role,
            avatar: currentUser.avatar,
            text: newComment
        };

        const addedComment = await addComment(selectedComplaint.id, commentData);
        
        // Update Local State
        const updatedComplaint = {
            ...selectedComplaint,
            comments: [...selectedComplaint.comments, addedComment]
        };

        setComplaints(prev => prev.map(c => c.id === selectedComplaint.id ? updatedComplaint : c));
        setSelectedComplaint(updatedComplaint);
        setNewComment('');

        updateViewedCount(updatedComplaint.id, updatedComplaint.comments.length);
        logActivity(currentUser, 'UPDATE', 'Data Aduan', `Menambahkan komentar pada tiket ${selectedComplaint.noTiket}`);
      } catch (err) {
          alert("Gagal kirim komentar");
      }
  };

  const openCommentModal = (complaint: Complaint) => {
    setSelectedComplaint(complaint);
    setIsCommentModalOpen(true);
    updateViewedCount(complaint.id, complaint.comments.length);
  };

  const filteredComplaints = complaints.filter(item => 
    item.noTiket.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.nasabah.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.terminalId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Filter Locations for Dropdown
  const filteredLocations = locations.filter(loc => 
      loc.terminal_id.toLowerCase().includes(terminalSearch.toLowerCase()) || 
      loc.nama_lokasi.toLowerCase().includes(terminalSearch.toLowerCase())
  );

  // Styling Helpers
  const getSeverityBadge = (sev: string) => {
    switch (sev) {
      case 'HIGH': return 'bg-red-100 text-red-700 border-red-200';
      case 'MEDIUM': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'LOW': return 'bg-green-100 text-green-700 border-green-200';
      default: return 'bg-slate-100 text-slate-600';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'OPEN': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'IN PROGRESS': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'HOLD': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'CLOSED': return 'bg-slate-100 text-slate-700 border-slate-200';
      default: return 'bg-slate-100';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Data Aduan Nasabah</h1>
          <p className="text-slate-500 text-sm mt-1">Kelola tiket aduan, status pengecekan, dan penyelesaian masalah.</p>
        </div>
        <button 
          onClick={openCreateModal}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg transition-all shadow-md hover:shadow-lg active:scale-95 font-medium"
        >
          <Plus size={18} />
          <span>Buat Aduan</span>
        </button>
      </div>

      {/* Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text"
            placeholder="Cari No Tiket, Nasabah, atau Terminal ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all bg-white text-slate-700 placeholder:text-slate-400"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto min-h-[400px]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 text-xs font-bold uppercase tracking-wider whitespace-nowrap">
                <th className="p-4">No Tiket</th>
                <th className="p-4">Nasabah</th>
                <th className="p-4">Terminal ID</th>
                <th className="p-4">Waktu Trx</th>
                <th className="p-4">Waktu Aduan</th>
                <th className="p-4">Jenis Aduan</th>
                <th className="p-4">Downtime</th>
                <th className="p-4 text-center">Severity</th>
                <th className="p-4 text-center">Pengecekan</th>
                <th className="p-4 text-center">Status</th>
                <th className="p-4 text-center">Diskusi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {loading ? (
                <tr>
                  <td colSpan={11} className="p-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <Loader2 size={32} className="text-blue-500 animate-spin" />
                      <span className="text-sm font-medium">Memuat data aduan...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredComplaints.length > 0 ? (
                filteredComplaints.map((item) => {
                  const unreadCount = Math.max(0, item.comments.length - (viewedCounts[item.id] || 0));
                  
                  return (
                    <tr key={item.id} className="hover:bg-blue-50/30 transition-colors">
                      <td className="p-4">
                        <button 
                          onClick={() => openEditModal(item)}
                          className="font-mono font-bold text-blue-600 hover:text-blue-800 hover:underline transition-colors text-left"
                          title="Klik untuk Edit Data"
                        >
                          {item.noTiket}
                        </button>
                      </td>
                      <td className="p-4 font-semibold text-slate-800">{item.nasabah}</td>
                      <td className="p-4 text-slate-700">{item.terminalId}</td>
                      <td className="p-4 text-slate-500 whitespace-nowrap">{formatDateTime(item.waktuTrx)}</td>
                      <td className="p-4 text-slate-500 whitespace-nowrap">{formatDateTime(item.waktuAduan)}</td>
                      <td className="p-4 text-slate-700">{item.jenisAduan}</td>
                      <td className="p-4 font-medium text-red-600 whitespace-nowrap">
                          <div className="flex items-center gap-1">
                             <Clock size={14} />
                             {calculateDowntime(item.waktuAduan, item.status)}
                          </div>
                      </td>
                      <td className="p-4 text-center">
                        <span className={`inline-flex px-2 py-1 rounded text-[10px] font-bold border ${getSeverityBadge(item.severity)}`}>
                          {item.severity}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                         {item.pengecekan === 'VALID' ? (
                            <span className="inline-flex items-center gap-1 text-green-600 font-bold text-xs bg-green-50 px-2 py-1 rounded border border-green-100">
                               <CheckCircle size={12} /> Valid
                            </span>
                         ) : (
                            <span className="inline-flex items-center gap-1 text-red-600 font-bold text-xs bg-red-50 px-2 py-1 rounded border border-red-100">
                               <X size={12} /> Invalid
                            </span>
                         )}
                      </td>
                      <td className="p-4 text-center">
                         <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold border ${getStatusBadge(item.status)}`}>
                            {item.status === 'OPEN' && <AlertCircle size={10} />}
                            {item.status === 'IN PROGRESS' && <PlayCircle size={10} />}
                            {item.status === 'HOLD' && <PauseCircle size={10} />}
                            {item.status === 'CLOSED' && <CheckCircle size={10} />}
                            {item.status}
                         </span>
                      </td>
                      <td className="p-4 text-center">
                         <button 
                           onClick={() => openCommentModal(item)}
                           className="relative p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-transparent hover:border-blue-100 group"
                           title="Lihat & Tambah Komentar"
                         >
                           <MessageSquare size={18} />
                           {unreadCount > 0 && (
                              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center border border-white font-bold animate-pulse">
                                  {unreadCount}
                              </span>
                           )}
                         </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                   <td colSpan={11} className="p-8 text-center text-slate-500">Data aduan tidak ditemukan.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create/Edit/Comment Modal (Same structure as before, logic inside handles DB now) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={() => setIsModalOpen(false)}></div>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl relative z-10 flex flex-col max-h-[90vh] animate-fade-in-up">
             {/* ... Modal content similar to previous ... */}
             <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 rounded-t-xl">
               <h3 className="text-lg font-bold text-slate-800">
                   {editingId ? 'Edit Data Aduan' : 'Buat Aduan Baru'}
               </h3>
               <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
             </div>

             <div className="p-6 overflow-y-auto">
                <form id="complaintForm" onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   {!editingId && (
                       <div className="md:col-span-2 bg-blue-50 p-3 rounded-lg border border-blue-100 flex items-center gap-2 mb-2">
                          <AlertCircle size={16} className="text-blue-600" />
                          <span className="text-sm text-blue-700">Nomor Tiket akan digenerate otomatis oleh sistem.</span>
                       </div>
                   )}
                   {/* ... (Keep form fields exactly as they were in previous version) ... */}
                   {/* Terminal ID Searchable Dropdown */}
                   <div className="space-y-1 relative md:col-span-2" ref={dropdownRef}>
                      <label className="text-xs font-bold text-slate-700 uppercase">Terminal ID</label>
                      <div className="relative">
                         <input 
                           type="text" 
                           className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm pr-10"
                           placeholder="Cari Terminal ID atau Lokasi..."
                           value={terminalSearch}
                           onClick={() => setShowTerminalDropdown(true)}
                           onChange={(e) => {
                               setTerminalSearch(e.target.value);
                               setShowTerminalDropdown(true);
                           }}
                           required
                           autoComplete="off"
                         />
                         <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                      </div>
                      
                      {showTerminalDropdown && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-xl max-h-48 overflow-y-auto z-50">
                            {filteredLocations.length > 0 ? (
                                filteredLocations.map(loc => (
                                    <div 
                                        key={loc.id} 
                                        className="px-4 py-2 hover:bg-blue-50 cursor-pointer border-b border-slate-50 last:border-0 flex flex-col"
                                        onClick={() => {
                                            setFormData({...formData, terminalId: loc.terminal_id});
                                            setTerminalSearch(loc.terminal_id);
                                            setShowTerminalDropdown(false);
                                        }}
                                    >
                                        <span className="text-sm font-bold text-blue-600">{loc.terminal_id}</span>
                                        <span className="text-xs text-slate-500 flex items-center gap-1">
                                            <MapPin size={10} /> {loc.nama_lokasi}
                                        </span>
                                    </div>
                                ))
                            ) : (
                                <div className="px-4 py-3 text-sm text-slate-400 text-center">Lokasi tidak ditemukan</div>
                            )}
                        </div>
                      )}
                   </div>

                   <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700 uppercase">Nasabah</label>
                      <input 
                        type="text" 
                        required
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                        placeholder="Nama Nasabah"
                        value={formData.nasabah}
                        onChange={e => setFormData({...formData, nasabah: e.target.value})}
                      />
                   </div>

                   <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700 uppercase">Jenis Aduan</label>
                      <select 
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                        value={formData.jenisAduan}
                        onChange={e => setFormData({...formData, jenisAduan: e.target.value})}
                      >
                         <option value="Uang Tidak Keluar">Uang Tidak Keluar</option>
                         <option value="Kartu Tertelan">Kartu Tertelan</option>
                         <option value="Selisih Transaksi">Selisih Transaksi</option>
                         <option value="ATM Offline">ATM Offline</option>
                      </select>
                   </div>

                   <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700 uppercase">Waktu Transaksi</label>
                      <input 
                        type="datetime-local" 
                        required
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                        value={formData.waktuTrx}
                        onChange={e => setFormData({...formData, waktuTrx: e.target.value})}
                      />
                   </div>

                   <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700 uppercase">Waktu Aduan</label>
                      <input 
                        type="datetime-local" 
                        required
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                        value={formData.waktuAduan}
                        onChange={e => setFormData({...formData, waktuAduan: e.target.value})}
                      />
                   </div>

                   <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700 uppercase">Severity</label>
                      <select 
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                        value={formData.severity}
                        onChange={e => setFormData({...formData, severity: e.target.value as any})}
                      >
                         <option value="LOW">LOW</option>
                         <option value="MEDIUM">MEDIUM</option>
                         <option value="HIGH">HIGH</option>
                      </select>
                   </div>

                   <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700 uppercase">Pengecekan</label>
                      <select 
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                        value={formData.pengecekan}
                        onChange={e => setFormData({...formData, pengecekan: e.target.value as any})}
                      >
                         <option value="VALID">VALID</option>
                         <option value="TIDAK VALID">TIDAK VALID</option>
                      </select>
                   </div>

                   <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700 uppercase">Status</label>
                      <select 
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                        value={formData.status}
                        onChange={e => setFormData({...formData, status: e.target.value as any})}
                      >
                         <option value="OPEN">OPEN</option>
                         <option value="IN PROGRESS">IN PROGRESS</option>
                         <option value="HOLD">HOLD</option>
                         <option value="CLOSED">CLOSED</option>
                      </select>
                   </div>
                </form>
             </div>

             <div className="p-4 border-t border-slate-100 flex justify-end gap-3 bg-slate-50 rounded-b-xl">
               <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg text-sm font-bold">Batal</button>
               <button 
                  type="submit" 
                  form="complaintForm"
                  disabled={actionLoading}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-bold flex items-center gap-2 shadow-lg"
               >
                 {actionLoading && <Loader2 size={16} className="animate-spin" />}
                 {editingId ? 'Simpan Perubahan' : 'Simpan Aduan'}
               </button>
             </div>
          </div>
        </div>
      )}

      {/* Comment / Chat Modal */}
      {isCommentModalOpen && selectedComplaint && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={() => setIsCommentModalOpen(false)}></div>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg relative z-10 flex flex-col h-[600px] animate-fade-in-up">
             
             {/* Modal Header */}
             <div className="px-6 py-4 border-b border-slate-100 bg-white rounded-t-xl flex justify-between items-center">
                 <div className="flex items-center gap-3">
                    <div className="bg-blue-100 p-2 rounded-lg text-blue-600">
                       <MessageSquare size={20} />
                    </div>
                    <div>
                       <h3 className="text-base font-bold text-slate-800">Diskusi Tiket</h3>
                       <p className="text-xs font-mono text-slate-500 font-medium">{selectedComplaint.noTiket}</p>
                    </div>
                 </div>
                 <button onClick={() => setIsCommentModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
             </div>
             
             {/* Chat History */}
             <div className="flex-1 bg-slate-50 p-4 overflow-y-auto space-y-4">
                {selectedComplaint.comments.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-2">
                        <MessageSquare size={32} className="opacity-20" />
                        <p className="text-sm">Belum ada diskusi pada tiket ini.</p>
                    </div>
                ) : (
                    selectedComplaint.comments.map((comment) => {
                        const isMe = comment.userId === currentUser?.id;
                        return (
                            <div key={comment.id} className={`flex gap-3 ${isMe ? 'flex-row-reverse' : ''}`}>
                                <img src={comment.avatar} alt={comment.userName} className="w-8 h-8 rounded-full border border-slate-200 shadow-sm mt-1" />
                                <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[80%]`}>
                                    <div className="flex items-baseline gap-2 mb-1">
                                        <span className="text-xs font-bold text-slate-700">{comment.userName}</span>
                                        <span className="text-[10px] text-slate-400">{formatDateTime(comment.timestamp)}</span>
                                    </div>
                                    <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm ${
                                        isMe 
                                        ? 'bg-blue-600 text-white rounded-tr-none' 
                                        : 'bg-white text-slate-700 border border-slate-200 rounded-tl-none'
                                    }`}>
                                        {comment.text}
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
             </div>

             {/* Input Area */}
             <div className="p-4 border-t border-slate-100 bg-white rounded-b-xl">
                <div className="flex gap-2">
                    <input 
                      type="text" 
                      placeholder="Tulis komentar..." 
                      className="flex-1 px-4 py-2.5 border border-slate-200 rounded-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm bg-slate-50"
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      onKeyDown={(e) => {
                          if (e.key === 'Enter') handleAddComment();
                      }}
                    />
                    <button 
                      onClick={handleAddComment}
                      disabled={!newComment.trim()}
                      className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white p-2.5 rounded-full transition-colors shadow-md flex items-center justify-center"
                    >
                      <Send size={18} />
                    </button>
                </div>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};
