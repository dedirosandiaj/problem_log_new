import React, { useEffect, useState } from 'react';
import { ActivityLog } from '../types';
import { getActivityLogs } from '../services/activityService';
import { Search, Filter, Clock, User as UserIcon, Activity, ArrowRight, Loader2, X, Calendar, CalendarRange } from 'lucide-react';

export const ActivityLogList: React.FC = () => {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAction, setFilterAction] = useState<string>('ALL');
  
  // Date Range State
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const data = await getActivityLogs();
      setLogs(data);
    } catch (error) {
      console.error("Failed to fetch logs", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    
    // Auto refresh setiap 30 detik untuk real-time feel
    const interval = setInterval(fetchLogs, 30000);
    return () => clearInterval(interval);
  }, []);

  // Format Date Helper
  const formatDateTime = (isoString: string) => {
    const date = new Date(isoString);
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }).format(date);
  };

  // Badge Color Helper
  const getActionBadge = (action: string) => {
    switch (action) {
      case 'LOGIN': return 'bg-green-100 text-green-700 border-green-200';
      case 'LOGOUT': return 'bg-slate-100 text-slate-700 border-slate-200';
      case 'CREATE': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'UPDATE': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'DELETE': return 'bg-red-100 text-red-700 border-red-200';
      case 'VIEW': return 'bg-indigo-50 text-indigo-600 border-indigo-100';
      case 'IMPORT':
      case 'EXPORT': return 'bg-purple-100 text-purple-700 border-purple-200';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const filteredLogs = logs.filter(log => {
    // 1. Text Search
    const matchesSearch = 
      log.userName.toLowerCase().includes(searchTerm.toLowerCase()) || 
      log.target.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.details.toLowerCase().includes(searchTerm.toLowerCase());
    
    // 2. Action Filter
    const matchesFilter = filterAction === 'ALL' || log.action === filterAction;
    
    // 3. Date Range Filter
    let matchesDate = true;
    if (startDate || endDate) {
      const logTime = new Date(log.timestamp).getTime();
      
      // Set start time to 00:00:00 of the selected day
      const startTime = startDate ? new Date(startDate).setHours(0, 0, 0, 0) : 0;
      
      // Set end time to 23:59:59 of the selected day
      const endTime = endDate ? new Date(endDate).setHours(23, 59, 59, 999) : Infinity;

      matchesDate = logTime >= startTime && logTime <= endTime;
    }
    
    return matchesSearch && matchesFilter && matchesDate;
  });

  const resetDateFilter = () => {
    setStartDate('');
    setEndDate('');
  };

  const inputClass = "px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all bg-white text-sm text-slate-600 min-w-[140px]";

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Log Aktivitas</h1>
        <p className="text-slate-500 text-sm mt-1">Rekaman jejak digital seluruh aktivitas pengguna di dalam sistem.</p>
      </div>

      {/* Toolbar Container */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-4">
        
        {/* Top Row: Search & Date Picker */}
        <div className="flex flex-col xl:flex-row gap-4 justify-between items-start xl:items-center">
          
          {/* Search Box */}
          <div className="relative w-full xl:w-96 shrink-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text"
                placeholder="Cari user, target, atau detail..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all bg-white text-sm"
              />
          </div>

          {/* Date Filters */}
          <div className="flex flex-wrap items-center gap-2 w-full xl:w-auto bg-slate-50 p-2 rounded-lg border border-slate-100">
             <div className="flex items-center gap-2 text-slate-500 text-sm font-medium px-2">
                <CalendarRange size={16} />
                <span className="hidden sm:inline">Rentang:</span>
             </div>
             
             <div className="flex items-center gap-2 flex-1 sm:flex-none">
                <input 
                  type="date" 
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className={inputClass}
                  title="Dari Tanggal"
                />
                <span className="text-slate-400 font-bold">-</span>
                <input 
                  type="date" 
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className={inputClass}
                  title="Sampai Tanggal"
                />
             </div>

             {(startDate || endDate) && (
               <button 
                 onClick={resetDateFilter}
                 className="p-2 text-red-500 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors"
                 title="Reset Tanggal"
               >
                 <X size={18} />
               </button>
             )}
          </div>
        </div>

        {/* Bottom Row: Action Filters */}
        <div className="flex items-center gap-2 w-full overflow-x-auto pb-1 custom-scrollbar">
          <Filter size={16} className="text-slate-400 mr-2 shrink-0" />
          {['ALL', 'LOGIN', 'CREATE', 'UPDATE', 'DELETE', 'VIEW', 'IMPORT', 'EXPORT'].map((act) => (
             <button
               key={act}
               onClick={() => setFilterAction(act)}
               className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all whitespace-nowrap ${
                 filterAction === act 
                   ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/20' 
                   : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:border-slate-300'
               }`}
             >
               {act === 'ALL' ? 'Semua Aksi' : act}
             </button>
          ))}
        </div>
      </div>

      {/* Timeline / Table View */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden min-h-[400px]">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 text-xs font-bold uppercase tracking-wider">
                <th className="p-4 w-48">Waktu</th>
                <th className="p-4 w-64">User</th>
                <th className="p-4 w-32">Aksi</th>
                <th className="p-4 w-48">Target</th>
                <th className="p-4">Detail Aktivitas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-slate-500">
                    <div className="flex flex-col items-center gap-2">
                       <Loader2 size={24} className="animate-spin text-blue-500" />
                       <span>Memuat log aktivitas...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredLogs.length > 0 ? (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-blue-50/20 transition-colors group">
                    <td className="p-4 whitespace-nowrap text-slate-500 font-mono text-xs">
                       <div className="flex items-center gap-2">
                         <Clock size={14} />
                         {formatDateTime(log.timestamp)}
                       </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 border border-slate-200">
                           <UserIcon size={14} />
                        </div>
                        <div>
                          <div className="font-semibold text-slate-800">{log.userName}</div>
                          <div className="text-xs text-slate-500">{log.userRole}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                       <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold border shadow-sm ${getActionBadge(log.action)}`}>
                         {log.action}
                       </span>
                    </td>
                    <td className="p-4 font-medium text-slate-700">
                       {log.target}
                    </td>
                    <td className="p-4 text-slate-600">
                       {log.details}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                   <td colSpan={5} className="p-12 text-center text-slate-500">
                      <div className="flex flex-col items-center gap-3 opacity-60">
                         <CalendarRange size={48} className="text-slate-300" />
                         <p className="font-medium text-slate-600">Tidak ada aktivitas ditemukan</p>
                         <p className="text-sm max-w-xs mx-auto">
                           {startDate || endDate 
                             ? 'Coba sesuaikan rentang tanggal atau reset filter tanggal.'
                             : 'Belum ada data aktivitas yang tercatat sesuai pencarian Anda.'}
                         </p>
                         {(startDate || endDate) && (
                           <button onClick={resetDateFilter} className="text-blue-600 text-sm hover:underline font-medium">
                             Reset Tanggal
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
  );
};