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
  MoreHorizontal,
  Send // Added for FU button
} from 'lucide-react';

// --- INTERFACES & MOCK DATA UTAMA (Existing) ---
interface TerminalData {
  id: number;
  terminal: string;
  namaLokasi: string;
  lastTrx: string;
  timeNoTrx: string;
  flagTrx: 'High' | 'Medium' | 'Low';
  avgDes: number;
  problem: string;
  totalProblemToday: number;
}

const MOCK_DATA: TerminalData[] = [
  {
    id: 1,
    terminal: 'TID-00123',
    namaLokasi: 'SPBU Merdeka Raya',
    lastTrx: '2024-05-20 08:30:00',
    timeNoTrx: '4 Jam 15 Menit',
    flagTrx: 'High',
    avgDes: 67,
    problem: 'Jaringan Terputus',
    totalProblemToday: 3,
  },
  {
    id: 2,
    terminal: 'TID-00456',
    namaLokasi: 'Indomaret Point Pusat',
    lastTrx: '2024-05-20 10:15:00',
    timeNoTrx: '2 Jam 30 Menit',
    flagTrx: 'Medium',
    avgDes: 16,
    problem: 'Card Reader Macet',
    totalProblemToday: 1,
  },
  {
    id: 3,
    terminal: 'TID-00789',
    namaLokasi: 'KCP Sudirman',
    lastTrx: '2024-05-20 11:00:00',
    timeNoTrx: '1 Jam 45 Menit',
    flagTrx: 'Low',
    avgDes: 10,
    problem: 'Listrik Padam',
    totalProblemToday: 2,
  },
  {
    id: 4,
    terminal: 'TID-00101',
    namaLokasi: 'Mall Grand Indonesia Lt. 3',
    lastTrx: '2024-05-20 09:45:00',
    timeNoTrx: '3 Jam 00 Menit',
    flagTrx: 'High',
    avgDes: 82,
    problem: 'Uang Tersangkut',
    totalProblemToday: 5,
  },
  {
    id: 5,
    terminal: 'TID-00202',
    namaLokasi: 'RS Sentra Medika',
    lastTrx: '2024-05-20 12:00:00',
    timeNoTrx: '0 Jam 45 Menit',
    flagTrx: 'Low',
    avgDes: 5,
    problem: 'Layar Blank',
    totalProblemToday: 1,
  }
];

// --- INTERFACES & DATA TAB BAWAH (NEW) ---

type TabType = 'PROBLEM_TERBARU' | 'JARKOM' | 'FLM' | 'SLM' | 'AMS' | 'REQ_REPLENISH' | 'LOKASI';

interface GeneralProblemRow {
  id: string;
  terminalId: string;
  namaLokasi: string;
  flm?: string;
  slm?: string;
  jarkom?: string; // Provider Jarkom
  statusProblem: string; // Changed from 'Open' | 'Progress' | 'Closed' to string (Description)
  // Variasi Nama Problem / Info
  namaProblem?: string;
  problemInfo?: string; 
  problemLokasi?: string;
  penyebabReplenish?: string;
  // Waktu
  downtime: string;
  startProblem?: string;
  waktuInformasi?: string; // Added for JARKOM
  waktuPermintaan?: string;
  waktuSelesai?: string;
  waktuMulai?: string;
  // Tindakan / Respon
  tindakan?: string;
  respon?: string;
}

// Data Dummy untuk masing-masing Tab
const DATA_PROBLEM_TERBARU: GeneralProblemRow[] = [
  { id: '1', terminalId: 'TID-5512', namaLokasi: 'Indomaret Dago', flm: 'ADVANTAGE', slm: 'DN', jarkom: 'Telkomsel', statusProblem: 'Hardware Problem', namaProblem: 'Dispenser Error', downtime: '01:30', startProblem: '10:00', tindakan: 'Eskalasi SLM' },
  { id: '2', terminalId: 'TID-1123', namaLokasi: 'Alfamart Buah Batu', flm: 'KEJAR', slm: 'DATINDO', jarkom: 'Indosat', statusProblem: 'Printer Problem', namaProblem: 'Struk Habis', downtime: '00:45', startProblem: '11:15', tindakan: 'Konfirmasi FLM' },
  { id: '3', terminalId: 'TID-9988', namaLokasi: 'SPBU Pasteur', flm: 'ADVANTAGE', slm: 'DN', jarkom: 'Telkomsel', statusProblem: 'Host Down', namaProblem: 'No Reply', downtime: '00:10', startProblem: '12:00', tindakan: 'Monitoring' },
];

const DATA_JARKOM: GeneralProblemRow[] = [
  { id: '1', terminalId: 'TID-9912', namaLokasi: 'Unit BRI Cikini', flm: 'BRINKS', slm: 'DN', jarkom: 'Lintasarta', problemInfo: 'RTO (Request Time Out)', waktuInformasi: '09:15', downtime: '04:00', statusProblem: 'Communication Error' },
  { id: '2', terminalId: 'TID-8821', namaLokasi: 'SPBU Shell MT Haryono', flm: 'ADVANTAGE', slm: 'DN', jarkom: 'Telkomsel', problemInfo: 'Signal Low', waktuInformasi: '10:45', downtime: '02:20', statusProblem: 'Signal Problem' },
];

const DATA_FLM: GeneralProblemRow[] = [
  { id: '1', terminalId: 'TID-3312', namaLokasi: 'Pasar Modern BSD', flm: 'ADVANTAGE', slm: 'DN', problemInfo: 'Cassette Full', respon: 'Petugas OTW', downtime: '01:10', statusProblem: 'Cash Handler' },
  { id: '2', terminalId: 'TID-4411', namaLokasi: 'Stasiun Sudimara', flm: 'KEJAR', slm: 'DATINDO', problemInfo: 'Jam Paper', respon: 'Pending', downtime: '03:00', statusProblem: 'Printer Problem' },
];

const DATA_SLM: GeneralProblemRow[] = [
  { id: '1', terminalId: 'TID-7721', namaLokasi: 'Mall Alam Sutera', flm: 'BRINKS', slm: 'DN', problemInfo: 'Card Reader Faulty', respon: 'Ganti Sparepart', downtime: '24:00', statusProblem: 'Reader Error' },
];

const DATA_AMS: GeneralProblemRow[] = [
  { id: '1', terminalId: 'TID-1199', namaLokasi: 'KC Jakarta Kota', flm: '-', slm: '-', problemInfo: 'System Maintenance', respon: 'Auto Recovery', downtime: '00:15', statusProblem: 'Host Down' },
];

const DATA_REPLENISH: GeneralProblemRow[] = [
  { id: '1', terminalId: 'TID-2288', namaLokasi: 'Galeri ATM Bintaro', flm: 'ADVANTAGE', slm: 'DN', penyebabReplenish: 'Cash Out (Habis)', waktuPermintaan: '08:00', waktuSelesai: '-', downtime: '04:30', statusProblem: 'Cash Empty' },
];

const DATA_LOKASI: GeneralProblemRow[] = [
  { id: '1', terminalId: 'TID-6611', namaLokasi: 'RS Pondok Indah', flm: 'KEJAR', slm: 'DATINDO', problemLokasi: 'Listrik Gedung Padam', waktuMulai: '09:00', downtime: '03:30', statusProblem: 'Power Failure' },
];


export const Dashboard: React.FC = () => {
  // Top Table State
  const [searchTerm, setSearchTerm] = useState('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedFlag, setSelectedFlag] = useState<'ALL' | 'High' | 'Medium' | 'Low'>('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 5;

  // Bottom Tabs State
  const [activeTab, setActiveTab] = useState<TabType>('PROBLEM_TERBARU');

  // --- TOP TABLE LOGIC ---
  useEffect(() => { setCurrentPage(1); }, [searchTerm, selectedFlag]);
  
  const filteredData = MOCK_DATA.filter((item) => {
    const matchesSearch = item.terminal.toLowerCase().includes(searchTerm.toLowerCase()) || item.namaLokasi.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = selectedFlag === 'ALL' || item.flagTrx === selectedFlag;
    return matchesSearch && matchesFilter;
  });

  const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedData = filteredData.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  
  const handlePageChange = (page: number) => { if (page >= 1 && page <= totalPages) setCurrentPage(page); };

  // --- BOTTOM TABS HELPER ---
  const getTabConfig = () => {
    switch (activeTab) {
      case 'PROBLEM_TERBARU':
        return {
          icon: Activity,
          data: DATA_PROBLEM_TERBARU,
          columns: ['ID Terminal', 'Nama Lokasi', 'Status Problem', 'Nama Problem', 'DownTime', 'Start Problem', 'Tindakan', 'Action']
        };
      case 'JARKOM':
        return {
          icon: Wifi,
          data: DATA_JARKOM,
          columns: ['Terminal ID', 'Nama Lokasi', 'Problem', 'Waktu Informasi', 'Downtime', 'Jarkom', 'FLM', 'SLM', 'Status']
        };
      case 'FLM':
        return {
          icon: Truck,
          data: DATA_FLM,
          columns: ['Terminal', 'Nama Lokasi', 'Problem Info', 'Respon', 'DownTime', 'FLM', 'SLM', 'Status Problem']
        };
      case 'SLM':
        return {
          icon: Wrench,
          data: DATA_SLM,
          columns: ['Terminal', 'Nama Lokasi', 'Problem Info', 'Respon', 'DownTime', 'FLM', 'SLM', 'Status Problem']
        };
      case 'AMS':
        return {
          icon: Monitor,
          data: DATA_AMS,
          columns: ['Terminal', 'Nama Lokasi', 'Problem Info', 'Respon', 'DownTime', 'FLM', 'SLM', 'Status Problem']
        };
      case 'REQ_REPLENISH':
        return {
          icon: RefreshCw,
          data: DATA_REPLENISH,
          columns: ['Terminal ID', 'Nama Lokasi', 'Penyebab', 'Waktu Minta', 'Waktu Selesai', 'DownTime', 'FLM', 'SLM', 'Status Problem']
        };
      case 'LOKASI':
        return {
          icon: MapPin,
          data: DATA_LOKASI,
          columns: ['Terminal ID', 'Nama Lokasi', 'Problem Lokasi', 'Waktu Mulai', 'DownTime', 'FLM', 'SLM', 'Status Problem']
        };
      default: return { icon: Activity, data: [], columns: [] };
    }
  };

  const currentTabConfig = getTabConfig();

  // Helper render status badge (Updated: Just text, no Open/Progress logic)
  const renderStatusProblem = (status: string) => {
    // Menentukan warna berdasarkan kata kunci masalah umum
    let styles = 'bg-slate-100 text-slate-700 border-slate-200';
    const s = status.toLowerCase();
    
    if (s.includes('host') || s.includes('down') || s.includes('communication') || s.includes('power')) {
       styles = 'bg-red-50 text-red-700 border-red-100';
    } else if (s.includes('printer') || s.includes('hardware') || s.includes('reader')) {
       styles = 'bg-orange-50 text-orange-700 border-orange-100';
    } else if (s.includes('cash') || s.includes('full')) {
       styles = 'bg-blue-50 text-blue-700 border-blue-100';
    }

    return (
      <span className={`px-2.5 py-1 rounded-md text-xs font-bold border ${styles} whitespace-nowrap`}>
        {status}
      </span>
    );
  };

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      
      {/* SECTION 1: DASHBOARD MONITORING (TOP TABLE) */}
      <div className="space-y-4">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Dashboard Monitoring</h1>
            <p className="text-slate-500 text-sm mt-1">Pantau status terminal dan masalah operasional secara real-time.</p>
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
          {/* ... (Existing Filter Logic UI) ... */}
          <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50">
            <div className="flex items-center gap-2">
              <div className="bg-red-100 p-2 rounded-lg text-red-600">
                <AlertTriangle size={20} />
              </div>
              <h2 className="font-bold text-slate-800">Terminal No Withdrawal</h2>
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
                        Filter Flag
                        {selectedFlag !== 'ALL' && <button onClick={() => setSelectedFlag('ALL')} className="text-blue-600 hover:underline text-[10px]">Reset</button>}
                      </div>
                      <button onClick={() => { setSelectedFlag('ALL'); setIsFilterOpen(false); }} className={`w-full text-left px-4 py-2.5 text-sm hover:bg-slate-50 flex items-center justify-between ${selectedFlag === 'ALL' ? 'text-blue-600 font-semibold bg-blue-50/50' : 'text-slate-700'}`}><span>Semua</span>{selectedFlag === 'ALL' && <Check size={16} />}</button>
                      {['High', 'Medium', 'Low'].map((flag) => (
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
                  <th className="p-4 min-w-[180px]">Nama Lokasi</th>
                  <th className="p-4 min-w-[150px]">Last Trx</th>
                  <th className="p-4 min-w-[140px]">Time No Trx</th>
                  <th className="p-4">Flag Trx</th>
                  <th className="p-4 min-w-[100px] text-center">Avg Des</th>
                  <th className="p-4 min-w-[150px]">Problem</th>
                  <th className="p-4 text-center">Total Problem</th>
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
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                          row.flagTrx === 'High' ? 'bg-red-100 text-red-800 border-red-200' :
                          row.flagTrx === 'Medium' ? 'bg-amber-100 text-amber-800 border-amber-200' :
                          'bg-green-100 text-green-800 border-green-200'
                        }`}>
                          {row.flagTrx}
                        </span>
                      </td>
                      <td className="p-4 text-slate-700 font-medium text-center">{row.avgDes}</td>
                      <td className="p-4 font-medium text-slate-800">{row.problem}</td>
                      <td className="p-4 text-center">
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 text-slate-700 text-xs font-bold">
                          {row.totalProblemToday}
                        </span>
                      </td>
                      <td className="p-4 sticky right-0 bg-white group-hover:bg-blue-50/10 z-10 border-l border-slate-100 shadow-sm">
                        <div className="flex justify-center items-center">
                          <button className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors shadow-sm hover:shadow-md active:scale-95">
                            Assign
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={10} className="p-8 text-center text-slate-500">
                      <div className="flex flex-col items-center gap-2">
                        <Search size={32} className="text-slate-300" />
                        <p className="font-medium">Data tidak ditemukan</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          {/* Top Table Pagination */}
          <div className="p-4 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-4 bg-slate-50/50">
            <span className="text-xs text-slate-500 text-center sm:text-left">
              Menampilkan <strong>{filteredData.length > 0 ? startIndex + 1 : 0}</strong> sampai <strong>{startIndex + paginatedData.length}</strong> dari <strong>{filteredData.length}</strong> data.
            </span>
            <div className="flex gap-1 items-center">
              <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} className="px-2 py-1.5 text-xs font-medium border border-slate-300 rounded-lg bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"><ChevronLeft size={14} /></button>
              <span className="px-3 py-1.5 text-xs font-medium border border-slate-300 rounded-lg bg-white text-slate-600">Halaman {currentPage}</span>
              <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages || totalPages === 0} className="px-2 py-1.5 text-xs font-medium border border-slate-300 rounded-lg bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"><ChevronRight size={14} /></button>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 2: PROBLEM DETAIL TABS (NEW) */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        {/* Scrollable Tab Navigation */}
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

        {/* Dynamic Table Content */}
        <div className="overflow-x-auto min-h-[250px]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 text-xs font-bold uppercase tracking-wider">
                {currentTabConfig.columns.map((col, idx) => (
                  <th key={idx} className="p-4 whitespace-nowrap">{col}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {currentTabConfig.data.length > 0 ? (
                currentTabConfig.data.map((row, idx) => (
                  <tr key={idx} className="hover:bg-blue-50/20 transition-colors">
                    {activeTab === 'PROBLEM_TERBARU' && (
                      <>
                        <td className="p-4 font-semibold text-blue-600">{row.terminalId}</td>
                        <td className="p-4">
                           <div className="font-medium text-slate-800">{row.namaLokasi}</div>
                           <div className="flex gap-1 mt-1 flex-wrap">
                              {row.flm && <span className="text-[10px] bg-slate-100 border border-slate-200 text-slate-600 px-1.5 py-0.5 rounded">FLM: {row.flm}</span>}
                              {row.slm && <span className="text-[10px] bg-slate-100 border border-slate-200 text-slate-600 px-1.5 py-0.5 rounded">SLM: {row.slm}</span>}
                              {row.jarkom && <span className="text-[10px] bg-indigo-50 border border-indigo-100 text-indigo-600 px-1.5 py-0.5 rounded">{row.jarkom}</span>}
                           </div>
                        </td>
                        <td className="p-4">{renderStatusProblem(row.statusProblem)}</td>
                        <td className="p-4 font-medium text-slate-700">{row.namaProblem}</td>
                        <td className="p-4 font-mono text-red-600">{row.downtime}</td>
                        <td className="p-4 text-slate-500">{row.startProblem}</td>
                        <td className="p-4 text-slate-700">{row.tindakan}</td>
                        <td className="p-4">
                           <button 
                              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors shadow-sm hover:shadow-md active:scale-95"
                              onClick={() => alert(`Assign ticket: ${row.id}`)}
                           >
                              Assign
                           </button>
                        </td>
                      </>
                    )}

                    {activeTab === 'JARKOM' && (
                      <>
                        <td className="p-4 font-semibold text-blue-600">{row.terminalId}</td>
                        <td className="p-4 font-medium text-slate-700">{row.namaLokasi}</td>
                        <td className="p-4 text-slate-800">{row.problemInfo}</td>
                        <td className="p-4 text-slate-500">{row.waktuInformasi}</td>
                        <td className="p-4 font-mono text-red-600">{row.downtime}</td>
                        <td className="p-4 font-semibold text-indigo-600">{row.jarkom}</td>
                        <td className="p-4">{row.flm || '-'}</td>
                        <td className="p-4">{row.slm || '-'}</td>
                        <td className="p-4">
                          <button 
                            onClick={() => alert(`Mengirim Follow Up untuk Ticket ID: ${row.id}`)}
                            className="flex items-center gap-1 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded transition-colors shadow-sm active:scale-95"
                            title="Follow Up (FU)"
                          >
                            <Send size={12} />
                            FU
                          </button>
                        </td>
                      </>
                    )}

                    {(activeTab === 'FLM' || activeTab === 'SLM' || activeTab === 'AMS') && (
                      <>
                        <td className="p-4 font-semibold text-blue-600">{row.terminalId}</td>
                        <td className="p-4 font-medium text-slate-700">{row.namaLokasi}</td>
                        <td className="p-4 text-slate-600">{row.problemInfo}</td>
                        <td className="p-4 text-slate-600 italic">{row.respon}</td>
                        <td className="p-4 font-mono text-red-600">{row.downtime}</td>
                        <td className="p-4">{row.flm || '-'}</td>
                        <td className="p-4">{row.slm || '-'}</td>
                        <td className="p-4">{renderStatusProblem(row.statusProblem)}</td>
                      </>
                    )}

                    {activeTab === 'REQ_REPLENISH' && (
                       <>
                        <td className="p-4 font-semibold text-blue-600">{row.terminalId}</td>
                        <td className="p-4 font-medium text-slate-700">{row.namaLokasi}</td>
                        <td className="p-4 text-slate-800">{row.penyebabReplenish}</td>
                        <td className="p-4 text-slate-600">{row.waktuPermintaan}</td>
                        <td className="p-4 text-slate-600">{row.waktuSelesai}</td>
                        <td className="p-4 font-mono text-red-600">{row.downtime}</td>
                        <td className="p-4">{row.flm}</td>
                        <td className="p-4">{row.slm}</td>
                        <td className="p-4">{renderStatusProblem(row.statusProblem)}</td>
                       </>
                    )}

                    {activeTab === 'LOKASI' && (
                       <>
                        <td className="p-4 text-center text-slate-500">{idx + 1}</td>
                        <td className="p-4 font-semibold text-blue-600">{row.terminalId}</td>
                        <td className="p-4 font-medium text-slate-700">{row.namaLokasi}</td>
                        <td className="p-4 text-slate-800">{row.problemLokasi}</td>
                        <td className="p-4 text-slate-600">{row.waktuMulai}</td>
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
                   <td colSpan={currentTabConfig.columns.length} className="p-8 text-center text-slate-500">
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