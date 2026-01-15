import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle, 
  Search,
  Filter,
  Check,
  ChevronLeft,
  ChevronRight,
  Monitor,
  Wifi,
  Truck,
  Wrench,
  Activity,
  MapPin,
  RefreshCw,
  Send,
  Loader2
} from 'lucide-react';
import { getComplaints } from '../services/complaintService';
import { Complaint } from '../types';

// --- INTERFACES & MOCK DATA STRUCTURES ---

type TabType = 'PROBLEM_TERBARU' | 'JARKOM' | 'FLM' | 'SLM' | 'AMS' | 'REQ_REPLENISH' | 'LOKASI';

interface GeneralProblemRow {
  id: string;
  terminalId: string;
  namaLokasi: string;
  flm?: string;
  slm?: string;
  jarkom?: string; 
  statusProblem: string;
  namaProblem?: string;
  problemInfo?: string; 
  downtime: string;
  startProblem?: string;
  tindakan?: string;
  respon?: string;
}

export const Dashboard: React.FC = () => {
  // Data State
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);

  // Top Table State
  const [searchTerm, setSearchTerm] = useState('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedFlag, setSelectedFlag] = useState<'ALL' | 'HIGH' | 'MEDIUM' | 'LOW'>('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 5;

  // Bottom Tabs State
  const [activeTab, setActiveTab] = useState<TabType>('PROBLEM_TERBARU');

  // Fetch Real Data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const data = await getComplaints();
        setComplaints(data);
      } catch (e) {
        console.error("Failed to load dashboard data", e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // --- TOP TABLE LOGIC (Monitoring Dashboard) ---
  // Kita anggap semua aduan yang statusnya bukan 'CLOSED' adalah monitoring aktif
  // Map complaint data to Dashboard Table Row structure
  const activeComplaints = complaints.filter(c => c.status !== 'CLOSED');
  
  const mappedTableData = activeComplaints.map(c => {
     // Kalkulasi Time No Trx (Downtime) dari waktu aduan
     const start = new Date(c.waktuAduan).getTime();
     const now = new Date().getTime();
     const diffMs = now - start;
     const hours = Math.floor(diffMs / (1000 * 60 * 60));
     const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

     return {
        id: c.id,
        terminal: c.terminalId,
        namaLokasi: c.nasabah ? `${c.nasabah} (${c.terminalId})` : 'Lokasi Unknown', // Complaint schema doesn't have location name, fallback to nasabah or terminal
        lastTrx: new Date(c.waktuTrx).toLocaleString(),
        timeNoTrx: `${hours} Jam ${mins} Menit`,
        flagTrx: c.severity, // Map severity to flag
        avgDes: 0, // Placeholder
        problem: c.jenisAduan,
        totalProblemToday: 1 // Placeholder count
     };
  });

  useEffect(() => { setCurrentPage(1); }, [searchTerm, selectedFlag]);
  
  const filteredData = mappedTableData.filter((item) => {
    const matchesSearch = item.terminal.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = selectedFlag === 'ALL' || item.flagTrx === selectedFlag;
    return matchesSearch && matchesFilter;
  });

  const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedData = filteredData.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  
  const handlePageChange = (page: number) => { if (page >= 1 && page <= totalPages) setCurrentPage(page); };

  // --- BOTTOM TABS HELPER ---
  // Helper to filter complaints based on tab logic
  const getTabData = (): GeneralProblemRow[] => {
      // Common mapping function
      const mapToRow = (c: Complaint): GeneralProblemRow => {
         const start = new Date(c.waktuAduan).getTime();
         const now = new Date().getTime();
         const diffMs = now - start;
         const h = Math.floor(diffMs / 3600000);
         const m = Math.floor((diffMs % 3600000) / 60000);

         return {
             id: c.id,
             terminalId: c.terminalId,
             namaLokasi: c.nasabah,
             flm: '-', // Data FLM belum ada di table complaints, harus join location di masa depan
             slm: '-',
             jarkom: '-',
             statusProblem: c.status,
             namaProblem: c.jenisAduan,
             problemInfo: c.jenisAduan,
             downtime: `${h}:${m.toString().padStart(2, '0')}`,
             startProblem: new Date(c.waktuAduan).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}),
             tindakan: c.pengecekan,
             respon: `${c.comments.length} Komentar`
         };
      };

      if (activeTab === 'PROBLEM_TERBARU') {
          return complaints.slice(0, 10).map(mapToRow);
      }
      
      // Simple Keyword Filtering for other tabs
      const keywords: Record<string, string[]> = {
          'JARKOM': ['offline', 'jaringan', 'signal', 'host'],
          'FLM': ['uang', 'macet', 'habis', 'kertas', 'receipt'],
          'SLM': ['reader', 'layar', 'mati', 'error'],
          'AMS': ['system', 'software'],
          'REQ_REPLENISH': ['replenish', 'isi', 'cash'],
          'LOKASI': ['listrik', 'banjir', 'vandal', 'lampu']
      };

      const targetKeywords = keywords[activeTab] || [];
      return complaints
          .filter(c => targetKeywords.some(k => c.jenisAduan.toLowerCase().includes(k)))
          .map(mapToRow);
  };

  const currentTabData = getTabData();
  
  const getTabColumns = () => {
    switch(activeTab) {
        case 'PROBLEM_TERBARU': return ['Terminal', 'Nasabah/Lokasi', 'Status', 'Problem', 'Downtime', 'Start', 'Tindakan', 'Aksi'];
        default: return ['Terminal', 'Nasabah/Lokasi', 'Problem Info', 'Respon/Komen', 'Downtime', 'FLM', 'SLM', 'Status'];
    }
  };

  // Helper render status badge
  const renderStatusProblem = (status: string) => {
    let styles = 'bg-slate-100 text-slate-700 border-slate-200';
    if (status === 'OPEN') styles = 'bg-red-50 text-red-700 border-red-100';
    if (status === 'IN PROGRESS') styles = 'bg-orange-50 text-orange-700 border-orange-100';
    if (status === 'HOLD') styles = 'bg-blue-50 text-blue-700 border-blue-100';
    if (status === 'CLOSED') styles = 'bg-green-50 text-green-700 border-green-100';

    return (
      <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold border ${styles} whitespace-nowrap`}>
        {status}
      </span>
    );
  };

  if (loading) {
      return (
          <div className="flex flex-col items-center justify-center min-h-[400px]">
              <Loader2 size={40} className="animate-spin text-blue-500 mb-4" />
              <p className="text-slate-500 font-medium">Memuat data dashboard...</p>
          </div>
      );
  }

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      
      {/* SECTION 1: DASHBOARD MONITORING (TOP TABLE) */}
      <div className="space-y-4">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Dashboard Monitoring</h1>
            <p className="text-slate-500 text-sm mt-1">Pantau status tiket aduan aktif secara real-time.</p>
          </div>
          <div className="flex gap-2">
            <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold border border-green-200 flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
              Live System
            </span>
          </div>
        </div>

        {/* Main Table Container */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden min-h-[400px] flex flex-col">
          <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50">
            <div className="flex items-center gap-2">
              <div className="bg-red-100 p-2 rounded-lg text-red-600">
                <AlertTriangle size={20} />
              </div>
              <h2 className="font-bold text-slate-800">Tiket Aktif / Open</h2>
            </div>
            
            <div className="flex gap-2 relative">
              <div className="relative">
                <input 
                  type="text" 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Cari Terminal ID..." 
                  className="pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none w-full sm:w-64 bg-white text-slate-900 placeholder:text-slate-400"
                />
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              </div>
              
              <div className="relative">
                <button 
                    onClick={() => setIsFilterOpen(!isFilterOpen)}
                    className={`p-2 border rounded-lg transition-colors flex items-center gap-2 ${selectedFlag !== 'ALL' ? 'bg-blue-50 border-blue-500 text-blue-600' : 'bg-white border-slate-300 hover:bg-slate-50 text-slate-600'}`}
                >
                    <Filter size={18} />
                    {selectedFlag !== 'ALL' && <span className="text-xs font-bold">{selectedFlag}</span>}
                </button>

                {isFilterOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setIsFilterOpen(false)}></div>
                    <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-100 py-2 z-20 animate-fade-in-down">
                      <div className="px-4 py-2 border-b border-slate-50 text-xs font-semibold text-slate-400 uppercase tracking-wider flex justify-between items-center">
                        Filter Severity
                        {selectedFlag !== 'ALL' && <button onClick={() => setSelectedFlag('ALL')} className="text-blue-600 hover:underline text-[10px]">Reset</button>}
                      </div>
                      <button onClick={() => { setSelectedFlag('ALL'); setIsFilterOpen(false); }} className={`w-full text-left px-4 py-2.5 text-sm hover:bg-slate-50 flex items-center justify-between ${selectedFlag === 'ALL' ? 'text-blue-600 font-semibold bg-blue-50/50' : 'text-slate-700'}`}><span>Semua</span>{selectedFlag === 'ALL' && <Check size={16} />}</button>
                      {['HIGH', 'MEDIUM', 'LOW'].map((flag) => (
                        <button key={flag} onClick={() => { setSelectedFlag(flag as any); setIsFilterOpen(false); }} className={`w-full text-left px-4 py-2.5 text-sm hover:bg-slate-50 flex items-center justify-between ${selectedFlag === flag ? 'text-blue-600 font-semibold bg-blue-50/50' : 'text-slate-700'}`}><span>{flag}</span>{selectedFlag === flag && <Check size={16} />}</button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 text-xs font-bold uppercase tracking-wider">
                  <th className="p-4 w-12 text-center">No</th>
                  <th className="p-4 min-w-[120px]">Terminal</th>
                  <th className="p-4 min-w-[180px]">Nasabah/Lokasi</th>
                  <th className="p-4 min-w-[150px]">Last Trx</th>
                  <th className="p-4 min-w-[140px]">Downtime</th>
                  <th className="p-4">Severity</th>
                  <th className="p-4 min-w-[150px]">Problem</th>
                  <th className="p-4 text-center sticky right-0 bg-slate-50 z-10">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {paginatedData.length > 0 ? (
                  paginatedData.map((row, index) => (
                    <tr key={row.id} className="hover:bg-blue-50/30 transition-colors">
                      <td className="p-4 text-center text-slate-500 font-medium">{startIndex + index + 1}</td>
                      <td className="p-4 font-semibold text-blue-600">{row.terminal}</td>
                      <td className="p-4 text-slate-700">{row.namaLokasi}</td>
                      <td className="p-4 text-slate-600 whitespace-nowrap">{row.lastTrx}</td>
                      <td className="p-4 font-medium text-red-600 whitespace-nowrap">{row.timeNoTrx}</td>
                      <td className="p-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                          row.flagTrx === 'HIGH' ? 'bg-red-100 text-red-800 border-red-200' :
                          row.flagTrx === 'MEDIUM' ? 'bg-amber-100 text-amber-800 border-amber-200' :
                          'bg-green-100 text-green-800 border-green-200'
                        }`}>
                          {row.flagTrx}
                        </span>
                      </td>
                      <td className="p-4 font-medium text-slate-800">{row.problem}</td>
                      <td className="p-4 sticky right-0 bg-white group-hover:bg-blue-50/10 z-10 border-l border-slate-100 shadow-sm">
                        <div className="flex justify-center items-center">
                          <button className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors shadow-sm hover:shadow-md active:scale-95">
                            Detail
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-500">
                      <div className="flex flex-col items-center gap-2">
                        <Search size={32} className="text-slate-300" />
                        <p className="font-medium">Tidak ada tiket aktif ditemukan.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          <div className="p-4 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-4 bg-slate-50/50">
            <span className="text-xs text-slate-500 text-center sm:text-left">
              Menampilkan <strong>{filteredData.length > 0 ? startIndex + 1 : 0}</strong> sampai <strong>{Math.min(startIndex + ITEMS_PER_PAGE, filteredData.length)}</strong> dari <strong>{filteredData.length}</strong> data.
            </span>
            <div className="flex gap-1 items-center">
              <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} className="px-2 py-1.5 text-xs font-medium border border-slate-300 rounded-lg bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"><ChevronLeft size={14} /></button>
              <span className="px-3 py-1.5 text-xs font-medium border border-slate-300 rounded-lg bg-white text-slate-600">Halaman {currentPage}</span>
              <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages || totalPages === 0} className="px-2 py-1.5 text-xs font-medium border border-slate-300 rounded-lg bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"><ChevronRight size={14} /></button>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 2: PROBLEM DETAIL TABS */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        <div className="border-b border-slate-200 overflow-x-auto">
          <div className="flex w-max min-w-full">
            {[
              { id: 'PROBLEM_TERBARU', label: 'Problem Terbaru', icon: Activity },
              { id: 'JARKOM', label: 'JARKOM', icon: Wifi },
              { id: 'FLM', label: 'FLM', icon: Truck },
              { id: 'SLM', label: 'SLM', icon: Wrench },
              { id: 'AMS', label: 'AMS', icon: Monitor },
              { id: 'REQ_REPLENISH', label: 'Req Replenish', icon: RefreshCw },
              { id: 'LOKASI', label: 'Lokasi', icon: MapPin },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`
                  flex items-center gap-2 px-6 py-4 text-sm font-bold border-b-2 transition-colors whitespace-nowrap
                  ${activeTab === tab.id 
                    ? 'border-blue-600 text-blue-600 bg-blue-50/50' 
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'}
                `}
              >
                <tab.icon size={16} />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto min-h-[250px]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 text-xs font-bold uppercase tracking-wider">
                {getTabColumns().map((col, idx) => (
                  <th key={idx} className="p-4 whitespace-nowrap">{col}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {currentTabData.length > 0 ? (
                currentTabData.map((row, idx) => (
                  <tr key={idx} className="hover:bg-blue-50/20 transition-colors">
                     {activeTab === 'PROBLEM_TERBARU' ? (
                        <>
                           <td className="p-4 font-semibold text-blue-600">{row.terminalId}</td>
                           <td className="p-4 font-medium text-slate-700">{row.namaLokasi || '-'}</td>
                           <td className="p-4">{renderStatusProblem(row.statusProblem)}</td>
                           <td className="p-4 text-slate-700">{row.namaProblem}</td>
                           <td className="p-4 font-mono text-red-600">{row.downtime}</td>
                           <td className="p-4 text-slate-500">{row.startProblem}</td>
                           <td className="p-4 text-slate-700">{row.tindakan}</td>
                           <td className="p-4">
                              <button className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-xs font-medium shadow-sm">
                                 Assign
                              </button>
                           </td>
                        </>
                     ) : (
                        <>
                           <td className="p-4 font-semibold text-blue-600">{row.terminalId}</td>
                           <td className="p-4 font-medium text-slate-700">{row.namaLokasi || '-'}</td>
                           <td className="p-4 text-slate-800">{row.problemInfo}</td>
                           <td className="p-4 text-slate-500 italic">{row.respon}</td>
                           <td className="p-4 font-mono text-red-600">{row.downtime}</td>
                           <td className="p-4">{row.flm}</td>
                           <td className="p-4">{row.slm}</td>
                           <td className="p-4">{renderStatusProblem(row.statusProblem)}</td>
                        </>
                     )}
                  </tr>
                ))
              ) : (
                <tr>
                   <td colSpan={getTabColumns().length} className="p-8 text-center text-slate-500">
                      <p>Tidak ada data untuk kategori {activeTab}</p>
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