import React, { useEffect, useState, useRef } from 'react';
import { Location, User } from '../types';
import { 
  getLocations, 
  createLocation, 
  updateLocation, 
  deleteLocation, 
  calculateTotalJamTutup, 
  importLocations,
  downloadTemplate,
  exportLocations
} from '../services/locationService';
import { logActivity } from '../services/activityService';
import { 
  Search, 
  Plus, 
  Upload, 
  Trash2, 
  Pencil, 
  Loader2, 
  X, 
  MapPin, 
  Download, 
  FileSpreadsheet,
  AlertCircle,
  CheckCircle,
  AlertTriangle,
  Server,
  Clock,
  Map,
  Building
} from 'lucide-react';

interface LocationListProps {
  currentUser?: User;
}

export const LocationList: React.FC<LocationListProps> = ({ currentUser }) => {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  
  // Detail Modal State
  const [viewLocation, setViewLocation] = useState<Location | null>(null);
  
  // Import Result Modal State
  const [isImportResultModalOpen, setIsImportResultModalOpen] = useState(false);
  const [importResult, setImportResult] = useState<{ success: number; skipped: string[] } | null>(null);

  const [isImporting, setIsImporting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form State
  const initialFormState: Omit<Location, 'id'> = {
    kode_terminal: '',
    terminal_id: '',
    tanggal_aktivasi: '',
    tanggal_relokasi: '',
    kode_toko: '',
    nama_lokasi: '',
    alamat: '',
    wilayah: '',
    provinsi: '',
    dc_toko: '',
    titik_kordinat: '',
    jam_buka: '07:00',
    jam_tutup: '22:00',
    total_jam_tutup: 0,
    flm: 'ADVANTAGE',
    slm: 'DN',
    vendor_modem: '',
    nomor_modem: '',
    kebersihan: '',
    penempatan: 'INDOMARET',
    jenis_box: '',
    tipe_mesin: '',
    sn_atm: '',
    vendor_ups: '',
    sn_ups: '',
    vendor_lcd: '',
    sn_lcd: '',
    flag_aktif: true
  };

  const [formData, setFormData] = useState<Omit<Location, 'id'>>(initialFormState);

  // Initialize total hours on mount/reset
  useEffect(() => {
    if (!selectedLocation) {
      setFormData(prev => ({
        ...prev,
        total_jam_tutup: calculateTotalJamTutup(prev.jam_buka, prev.jam_tutup)
      }));
    }
  }, [selectedLocation]);

  const fetchLocations = async () => {
    try {
      const data = await getLocations();
      setLocations(data);
    } catch (error) {
      console.error("Failed to fetch locations", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLocations();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    setFormData(prev => {
      const newData = { ...prev, [name]: value };
      
      // Auto calculate jam tutup
      if (name === 'jam_buka' || name === 'jam_tutup') {
         newData.total_jam_tutup = calculateTotalJamTutup(newData.jam_buka, newData.jam_tutup);
      }
      
      return newData;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      if (selectedLocation) {
        await updateLocation(selectedLocation.id, formData);
        if (currentUser) {
          logActivity(currentUser, 'UPDATE', `Location: ${formData.terminal_id}`, `Updated location ${formData.nama_lokasi}`);
        }
      } else {
        // Create location (code generated automatically in service)
        const newLoc = await createLocation(formData);
        if (currentUser) {
          logActivity(currentUser, 'CREATE', `Location: ${newLoc.terminal_id}`, `Created new location ${newLoc.nama_lokasi}`);
        }
      }
      await fetchLocations();
      setIsModalOpen(false);
      resetForm();
    } catch (error) {
      alert("Gagal menyimpan data lokasi");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedLocation) return;
    setActionLoading(true);
    try {
      await deleteLocation(selectedLocation.id);
      if (currentUser) {
        logActivity(currentUser, 'DELETE', `Location: ${selectedLocation.terminal_id}`, `Deleted location ${selectedLocation.nama_lokasi}`);
      }
      await fetchLocations();
      setIsDeleteModalOpen(false);
      setSelectedLocation(null);
    } catch (error) {
      alert("Gagal menghapus lokasi");
    } finally {
      setActionLoading(false);
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setImportResult(null); // Reset previous result

    try {
      const result = await importLocations(file);
      await fetchLocations();
      
      if (currentUser) {
        logActivity(currentUser, 'IMPORT', 'Data Lokasi', `Imported ${result.success} records. Skipped ${result.skipped.length}.`);
      }

      // Set result state and open modal instead of alert
      setImportResult(result);
      setIsImportResultModalOpen(true);

    } catch (error) {
      console.error(error);
      alert("❌ ERROR\n\nGagal membaca file. Pastikan format CSV sesuai template.");
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      await exportLocations();
      if (currentUser) {
        logActivity(currentUser, 'EXPORT', 'Data Lokasi', 'Exported full location database to CSV');
      }
    } catch (error) {
      alert("Gagal mendownload data.");
    } finally {
      setIsExporting(false);
    }
  };

  const openAddModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const openEditModal = (loc: Location) => {
    setSelectedLocation(loc);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id, ...rest } = loc;
    setFormData(rest);
    setIsModalOpen(true);
  };

  const openDetailModal = (loc: Location) => {
    setViewLocation(loc);
  };

  const resetForm = () => {
    setSelectedLocation(null);
    setFormData(initialFormState);
  };

  const filteredLocations = locations.filter(loc => 
    loc.nama_lokasi.toLowerCase().includes(searchTerm.toLowerCase()) ||
    loc.terminal_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    loc.kode_toko.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const inputClass = "w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white text-slate-700 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all";

  // Helper for Detail Modal Row
  const DetailRow = ({ label, value, fullWidth = false }: { label: string, value: string | number | boolean | React.ReactNode, fullWidth?: boolean }) => (
    <div className={`space-y-1 ${fullWidth ? 'col-span-full' : ''}`}>
      <dt className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{label}</dt>
      <dd className="text-sm font-medium text-slate-800 break-words">{value || '-'}</dd>
    </div>
  );

  return (
    <>
      <div className="space-y-6 animate-fade-in pb-10">
        {/* Header */}
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Data Lokasi ATM</h1>
            <p className="text-slate-500 text-sm mt-1">Kelola database lokasi, terminal ID, dan detail aset operasional.</p>
          </div>
          
          <div className="flex flex-wrap gap-2 w-full xl:w-auto">
            {/* Download Template Button */}
            <button 
              onClick={downloadTemplate}
              className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100 px-3 py-2.5 rounded-lg transition-all shadow-sm text-sm font-medium"
              title="Download Template Excel (CSV)"
            >
              <FileSpreadsheet size={16} />
              <span className="hidden sm:inline">Template</span>
            </button>

            {/* Import Group */}
            <div className="flex">
              <input 
                type="file" 
                ref={fileInputRef}
                className="hidden" 
                accept=".csv"
                onChange={handleImport}
              />
              <button 
                onClick={() => fileInputRef.current?.click()}
                disabled={isImporting}
                className="flex items-center gap-2 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 px-3 py-2.5 rounded-lg transition-all shadow-sm text-sm font-medium"
              >
                {isImporting ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                <span>Import CSV</span>
              </button>
            </div>

            {/* Export Button */}
            <button 
              onClick={handleExport}
              disabled={isExporting}
              className="flex items-center gap-2 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 px-3 py-2.5 rounded-lg transition-all shadow-sm text-sm font-medium"
            >
              {isExporting ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
              <span>Download Data</span>
            </button>

            {/* Add Manual Button */}
            <button 
              onClick={openAddModal}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg transition-all shadow-md hover:shadow-lg text-sm font-medium ml-auto sm:ml-0"
            >
              <Plus size={16} />
              <span>Tambah Manual</span>
            </button>
          </div>
        </div>

        {/* Toolbar & Search */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text"
              placeholder="Cari Terminal ID, Lokasi, atau Kode Toko..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all bg-white text-slate-700 placeholder:text-slate-400"
            />
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[600px]">
          <div className="overflow-auto flex-1">
            <table className="w-full text-left border-collapse">
               <thead className="bg-slate-50 sticky top-0 z-10 shadow-sm">
                 <tr className="text-slate-600 text-xs font-bold uppercase tracking-wider">
                   <th className="p-4 border-b">Terminal ID</th>
                   <th className="p-4 border-b">Kode Toko</th>
                   <th className="p-4 border-b">Nama Lokasi</th>
                   <th className="p-4 border-b">Wilayah</th>
                   <th className="p-4 border-b">FLM</th>
                   <th className="p-4 border-b">SLM</th>
                   <th className="p-4 border-b text-center">Aksi</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-slate-100 text-sm">
                 {loading ? (
                   <tr>
                     <td colSpan={7} className="p-12 text-center text-slate-500">
                       <div className="flex flex-col items-center justify-center gap-3">
                         <Loader2 size={32} className="text-blue-500 animate-spin" />
                         <span className="text-sm font-medium">Memuat data lokasi...</span>
                       </div>
                     </td>
                   </tr>
                 ) : filteredLocations.length > 0 ? (
                   filteredLocations.map((loc) => (
                     <tr key={loc.id} className="hover:bg-blue-50/30 transition-colors group">
                       <td className="p-4">
                          <button 
                            onClick={() => openDetailModal(loc)}
                            className="text-left group/btn focus:outline-none"
                            title="Lihat Detail Lokasi"
                          >
                             <div className="font-bold text-blue-600 group-hover/btn:text-blue-800 group-hover/btn:underline transition-colors">
                               {loc.terminal_id}
                             </div>
                             <div className="text-[10px] text-slate-400 font-normal group-hover/btn:text-slate-600">
                               {loc.kode_terminal}
                             </div>
                          </button>
                       </td>
                       <td className="p-4 text-slate-600 font-medium">{loc.kode_toko}</td>
                       <td className="p-4 font-medium text-slate-700">{loc.nama_lokasi}</td>
                       <td className="p-4 text-slate-600">{loc.wilayah}</td>
                       <td className="p-4"><span className="text-xs px-2 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">{loc.flm}</span></td>
                       <td className="p-4"><span className="text-xs px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">{loc.slm}</span></td>
                       <td className="p-4 text-center">
                         <div className="flex items-center justify-center gap-2">
                           <button 
                              onClick={() => openEditModal(loc)}
                              className="p-1.5 text-blue-600 hover:bg-blue-100 rounded transition-colors"
                              title="Edit"
                           >
                             <Pencil size={16} />
                           </button>
                           <button 
                              onClick={() => { setSelectedLocation(loc); setIsDeleteModalOpen(true); }}
                              className="p-1.5 text-red-600 hover:bg-red-100 rounded transition-colors"
                              title="Hapus"
                           >
                             <Trash2 size={16} />
                           </button>
                         </div>
                       </td>
                     </tr>
                   ))
                 ) : (
                   <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-500">
                        Data tidak ditemukan.
                      </td>
                   </tr>
                 )}
               </tbody>
            </table>
          </div>
        </div>
      </div>
      
      {/* Import Result Pop-up Modal */}
      {isImportResultModalOpen && importResult && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={() => setIsImportResultModalOpen(false)}></div>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg relative z-10 flex flex-col max-h-[90vh] overflow-hidden animate-fade-in-up">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                Status Import Data
              </h3>
              <button onClick={() => setIsImportResultModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto">
              {/* Summary Stats */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-green-50 border border-green-100 p-4 rounded-xl text-center">
                    <div className="text-2xl font-bold text-green-600">{importResult.success}</div>
                    <div className="text-xs font-semibold text-green-700 uppercase tracking-wide mt-1">Berhasil</div>
                  </div>
                  <div className={`bg-red-50 border border-red-100 p-4 rounded-xl text-center ${importResult.skipped.length === 0 ? 'opacity-50' : ''}`}>
                    <div className="text-2xl font-bold text-red-600">{importResult.skipped.length}</div>
                    <div className="text-xs font-semibold text-red-700 uppercase tracking-wide mt-1">Gagal (Duplikat)</div>
                  </div>
              </div>

              {/* Duplicate List */}
              {importResult.skipped.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2 text-slate-800 font-semibold text-sm">
                      <AlertCircle size={16} className="text-red-500" />
                      Data Terminal ID berikut sudah ada:
                  </div>
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 max-h-48 overflow-y-auto">
                      <ul className="space-y-2 text-sm text-slate-600">
                        {importResult.skipped.map((item, idx) => (
                          <li key={idx} className="flex items-start gap-2 pb-2 border-b border-slate-100 last:border-0 last:pb-0">
                            <span className="text-red-500 font-mono text-xs mt-0.5">•</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                  </div>
                  <p className="text-xs text-slate-400 mt-2">
                    Data dengan Terminal ID yang sama tidak ditambahkan untuk menjaga integritas database.
                  </p>
                </div>
              )}

              {importResult.skipped.length === 0 && importResult.success > 0 && (
                <div className="text-center py-4">
                    <CheckCircle size={48} className="text-green-500 mx-auto mb-3" />
                    <p className="text-slate-700 font-medium">Semua data berhasil diimport dengan sempurna!</p>
                </div>
              )}
              
              {importResult.skipped.length === 0 && importResult.success === 0 && (
                  <div className="text-center py-4">
                    <AlertTriangle size={48} className="text-amber-500 mx-auto mb-3" />
                    <p className="text-slate-500">Tidak ada data yang diproses. Cek kembali file Anda.</p>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
              <button 
                onClick={() => setIsImportResultModalOpen(false)}
                className="px-6 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg transition-colors font-medium text-sm"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DETAIL MODAL (VIEW ONLY) */}
      {viewLocation && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
           <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={() => setViewLocation(null)}></div>
           <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl relative z-10 flex flex-col max-h-[90vh] animate-fade-in-up">
              {/* Header */}
              <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-white rounded-t-xl sticky top-0 z-20">
                <div className="flex items-center gap-3">
                   <div className="bg-blue-100 text-blue-600 p-2 rounded-lg">
                      <MapPin size={24} />
                   </div>
                   <div>
                     <h3 className="text-lg font-bold text-slate-800">Detail Lokasi</h3>
                     <p className="text-sm text-slate-500 flex items-center gap-2">
                        {viewLocation.nama_lokasi} 
                        <span className="text-slate-300">|</span> 
                        <span className="font-mono text-blue-600 font-medium">{viewLocation.terminal_id}</span>
                     </p>
                   </div>
                </div>
                <button onClick={() => setViewLocation(null)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors">
                  <X size={24} />
                </button>
              </div>

              {/* Content */}
              <div className="overflow-y-auto p-6 bg-slate-50/50">
                 <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    
                    {/* Section 1: Identitas & Lokasi */}
                    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4 h-fit">
                       <h4 className="flex items-center gap-2 text-sm font-bold text-blue-700 uppercase tracking-wider border-b border-slate-100 pb-2">
                          <Building size={16} /> Identitas & Alamat
                       </h4>
                       <dl className="grid grid-cols-2 gap-4">
                          <DetailRow label="Terminal ID" value={viewLocation.terminal_id} />
                          <DetailRow label="Kode Terminal" value={viewLocation.kode_terminal} />
                          <DetailRow label="Kode Toko" value={viewLocation.kode_toko} />
                          <DetailRow label="Nama Lokasi" value={viewLocation.nama_lokasi} />
                          <DetailRow label="Penempatan" value={viewLocation.penempatan} />
                          <DetailRow label="Wilayah" value={viewLocation.wilayah} />
                          <DetailRow label="Provinsi" value={viewLocation.provinsi} />
                          <DetailRow label="DC Toko" value={viewLocation.dc_toko} />
                          <DetailRow label="Koordinat" value={viewLocation.titik_kordinat} fullWidth />
                          <DetailRow label="Alamat Lengkap" value={viewLocation.alamat} fullWidth />
                       </dl>
                    </div>

                    <div className="space-y-6">
                       {/* Section 2: Operasional */}
                       <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
                          <h4 className="flex items-center gap-2 text-sm font-bold text-blue-700 uppercase tracking-wider border-b border-slate-100 pb-2">
                              <Clock size={16} /> Operasional & Status
                          </h4>
                          <div className="grid grid-cols-2 gap-4">
                             <div className="space-y-1">
                                <dt className="text-xs font-semibold text-slate-500 uppercase">Status Aktif</dt>
                                <dd>
                                  <span className={`inline-flex px-2 py-0.5 rounded text-xs font-bold border ${viewLocation.flag_aktif ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                                    {viewLocation.flag_aktif ? 'AKTIF' : 'NON-AKTIF'}
                                  </span>
                                </dd>
                             </div>
                             <DetailRow label="Kebersihan" value={viewLocation.kebersihan} />
                             <DetailRow label="Tgl Aktivasi" value={viewLocation.tanggal_aktivasi} />
                             <DetailRow label="Tgl Relokasi" value={viewLocation.tanggal_relokasi} />
                             <DetailRow label="Jam Buka" value={viewLocation.jam_buka} />
                             <DetailRow label="Jam Tutup" value={viewLocation.jam_tutup} />
                             <div className="col-span-2 bg-slate-50 p-3 rounded-lg border border-slate-100 flex items-center justify-between">
                                <span className="text-xs font-semibold text-slate-500 uppercase">Total Jam Tutup</span>
                                <span className="text-lg font-bold text-slate-800">{viewLocation.total_jam_tutup} Jam</span>
                             </div>
                          </div>
                       </div>

                       {/* Section 3: Vendor & Hardware */}
                       <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
                          <h4 className="flex items-center gap-2 text-sm font-bold text-blue-700 uppercase tracking-wider border-b border-slate-100 pb-2">
                              <Server size={16} /> Perangkat & Vendor
                          </h4>
                          <div className="grid grid-cols-2 gap-x-4 gap-y-6">
                             <div className="space-y-2">
                                <h5 className="text-xs font-bold text-slate-900 border-b border-slate-100 pb-1 mb-1">Pengelola</h5>
                                <DetailRow label="FLM" value={viewLocation.flm} />
                                <DetailRow label="SLM" value={viewLocation.slm} />
                             </div>
                             <div className="space-y-2">
                                <h5 className="text-xs font-bold text-slate-900 border-b border-slate-100 pb-1 mb-1">Mesin ATM</h5>
                                <DetailRow label="Tipe Mesin" value={viewLocation.tipe_mesin} />
                                <DetailRow label="SN ATM" value={viewLocation.sn_atm} />
                                <DetailRow label="Jenis Box" value={viewLocation.jenis_box} />
                             </div>
                             <div className="space-y-2">
                                <h5 className="text-xs font-bold text-slate-900 border-b border-slate-100 pb-1 mb-1">Koneksi (Modem)</h5>
                                <DetailRow label="Vendor" value={viewLocation.vendor_modem} />
                                <DetailRow label="Nomor" value={viewLocation.nomor_modem} />
                             </div>
                             <div className="space-y-2">
                                <h5 className="text-xs font-bold text-slate-900 border-b border-slate-100 pb-1 mb-1">Power (UPS)</h5>
                                <DetailRow label="Vendor" value={viewLocation.vendor_ups} />
                                <DetailRow label="SN" value={viewLocation.sn_ups} />
                             </div>
                             <div className="space-y-2 col-span-2">
                                <h5 className="text-xs font-bold text-slate-900 border-b border-slate-100 pb-1 mb-1">Display (LCD)</h5>
                                <div className="grid grid-cols-2 gap-4">
                                  <DetailRow label="Vendor" value={viewLocation.vendor_lcd} />
                                  <DetailRow label="SN" value={viewLocation.sn_lcd} />
                                </div>
                             </div>
                          </div>
                       </div>
                    </div>
                 </div>
              </div>

              {/* Footer Actions */}
              <div className="p-4 border-t border-slate-100 bg-white rounded-b-xl flex justify-end gap-3">
                 <button 
                   onClick={() => {
                     const locToEdit = viewLocation;
                     setViewLocation(null);
                     openEditModal(locToEdit);
                   }}
                   className="px-4 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg text-sm font-bold transition-colors flex items-center gap-2"
                 >
                   <Pencil size={16} /> Edit Data
                 </button>
                 <button 
                   onClick={() => setViewLocation(null)}
                   className="px-6 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-sm font-bold transition-colors"
                 >
                   Tutup
                 </button>
              </div>
           </div>
        </div>
      )}

      {/* Form Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={() => setIsModalOpen(false)}></div>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl relative z-10 flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 rounded-t-xl">
              <h3 className="text-lg font-bold text-slate-800">
                {selectedLocation ? 'Edit Data Lokasi' : 'Tambah Lokasi Baru'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>
            
            <div className="overflow-y-auto p-6 flex-1">
              <form id="locationForm" onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                 {/* ... (Form fields same as before) ... */}
                 {/* Re-implementing the form fields to ensure functionality within the changed component */}
                <div className="col-span-full pb-2 border-b border-slate-100 mb-2">
                  <h4 className="text-sm font-bold text-blue-600 uppercase tracking-wider flex items-center gap-2">
                    <MapPin size={14} /> Identifikasi & Lokasi
                  </h4>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Terminal ID</label>
                  <input required name="terminal_id" value={formData.terminal_id} onChange={handleInputChange} className={inputClass} placeholder="TID-XXXX" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Kode Toko</label>
                  <input required name="kode_toko" value={formData.kode_toko} onChange={handleInputChange} className={inputClass} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Kode Terminal</label>
                  <input 
                    name="kode_terminal" 
                    value={selectedLocation ? formData.kode_terminal : 'Auto Generated (System)'} 
                    disabled 
                    className={`${inputClass} bg-slate-100 text-slate-500 cursor-not-allowed font-medium italic`} 
                  />
                  {!selectedLocation && <p className="text-[10px] text-blue-600 mt-0.5">Kode akan digenerate otomatis saat disimpan.</p>}
                </div>
                <div className="space-y-1 md:col-span-2">
                  <label className="text-xs font-semibold text-slate-700">Nama Lokasi</label>
                  <input required name="nama_lokasi" value={formData.nama_lokasi} onChange={handleInputChange} className={inputClass} />
                </div>
                <div className="space-y-1 md:col-span-3">
                  <label className="text-xs font-semibold text-slate-700">Alamat Lengkap</label>
                  <input required name="alamat" value={formData.alamat} onChange={handleInputChange} className={inputClass} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Wilayah</label>
                  <input required name="wilayah" value={formData.wilayah} onChange={handleInputChange} className={inputClass} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Provinsi</label>
                  <input required name="provinsi" value={formData.provinsi} onChange={handleInputChange} className={inputClass} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">DC Toko</label>
                  <input name="dc_toko" value={formData.dc_toko} onChange={handleInputChange} className={inputClass} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Titik Kordinat</label>
                  <input name="titik_kordinat" value={formData.titik_kordinat} onChange={handleInputChange} className={inputClass} placeholder="-6.xxxx, 106.xxxx" />
                </div>
                <div className="space-y-1">
                   <label className="text-xs font-semibold text-slate-700">Penempatan</label>
                   <select name="penempatan" value={formData.penempatan} onChange={handleInputChange} className={inputClass}>
                     <option value="INDOMARET">INDOMARET</option>
                     <option value="ALFAMART">ALFAMART</option>
                     <option value="ALFAMIDI">ALFAMIDI</option>
                   </select>
                </div>

                {/* Section 2: Operasional */}
                <div className="col-span-full pb-2 border-b border-slate-100 mt-4 mb-2">
                  <h4 className="text-sm font-bold text-blue-600 uppercase tracking-wider">Operasional & Vendor</h4>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Tgl Aktivasi (YYYYMMDD)</label>
                  <input name="tanggal_aktivasi" value={formData.tanggal_aktivasi} onChange={handleInputChange} className={inputClass} placeholder="20250101" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Tgl Relokasi (YYYYMMDD)</label>
                  <input name="tanggal_relokasi" value={formData.tanggal_relokasi} onChange={handleInputChange} className={inputClass} placeholder="-" />
                </div>
                 <div className="space-y-1">
                   <label className="text-xs font-semibold text-slate-700">Status Aktif</label>
                   <select name="flag_aktif" value={formData.flag_aktif ? 'true' : 'false'} onChange={(e) => setFormData({...formData, flag_aktif: e.target.value === 'true'})} className={inputClass}>
                     <option value="true">Aktif</option>
                     <option value="false">Non-Aktif</option>
                   </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Jam Buka</label>
                  <input type="time" name="jam_buka" value={formData.jam_buka} onChange={handleInputChange} className={inputClass} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Jam Tutup</label>
                  <input type="time" name="jam_tutup" value={formData.jam_tutup} onChange={handleInputChange} className={inputClass} />
                </div>
                <div className="space-y-1 bg-slate-50 p-2 rounded border border-slate-100">
                  <label className="text-xs font-semibold text-slate-500">Total Jam Tutup (Auto)</label>
                  <div className="text-lg font-bold text-slate-800">{formData.total_jam_tutup} Jam</div>
                </div>

                <div className="space-y-1">
                   <label className="text-xs font-semibold text-slate-700">FLM</label>
                   <select name="flm" value={formData.flm} onChange={handleInputChange} className={inputClass}>
                     <option value="ADVANTAGE">ADVANTAGE</option>
                     <option value="BRINKS-AMS">BRINKS-AMS</option>
                     <option value="BRINKS-ICS">BRINKS-ICS</option>
                     <option value="KEJAR">KEJAR</option>
                   </select>
                </div>
                <div className="space-y-1">
                   <label className="text-xs font-semibold text-slate-700">SLM</label>
                   <select name="slm" value={formData.slm} onChange={handleInputChange} className={inputClass}>
                     <option value="DN">DN</option>
                     <option value="DATINDO">DATINDO</option>
                   </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Kebersihan</label>
                  <input name="kebersihan" value={formData.kebersihan} onChange={handleInputChange} className={inputClass} />
                </div>

                 {/* Section 3: Hardware */}
                <div className="col-span-full pb-2 border-b border-slate-100 mt-4 mb-2">
                  <h4 className="text-sm font-bold text-blue-600 uppercase tracking-wider">Detail Perangkat</h4>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Tipe Mesin</label>
                  <input name="tipe_mesin" value={formData.tipe_mesin} onChange={handleInputChange} className={inputClass} />
                </div>
                 <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">SN ATM</label>
                  <input name="sn_atm" value={formData.sn_atm} onChange={handleInputChange} className={inputClass} />
                </div>
                 <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Jenis Box</label>
                  <input name="jenis_box" value={formData.jenis_box} onChange={handleInputChange} className={inputClass} />
                </div>
                
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Vendor Modem</label>
                  <input name="vendor_modem" value={formData.vendor_modem} onChange={handleInputChange} className={inputClass} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Nomor Modem</label>
                  <input name="nomor_modem" value={formData.nomor_modem} onChange={handleInputChange} className={inputClass} />
                </div>
                
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Vendor UPS</label>
                  <input name="vendor_ups" value={formData.vendor_ups} onChange={handleInputChange} className={inputClass} />
                </div>
                 <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">SN UPS</label>
                  <input name="sn_ups" value={formData.sn_ups} onChange={handleInputChange} className={inputClass} />
                </div>
                
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Vendor LCD</label>
                  <input name="vendor_lcd" value={formData.vendor_lcd} onChange={handleInputChange} className={inputClass} />
                </div>
                 <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">SN LCD</label>
                  <input name="sn_lcd" value={formData.sn_lcd} onChange={handleInputChange} className={inputClass} />
                </div>
              </form>
            </div>

            <div className="p-4 border-t border-slate-100 flex justify-end gap-3 bg-slate-50 rounded-b-xl">
              <button 
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg transition-colors font-medium text-sm"
              >
                Batal
              </button>
              <button 
                type="submit"
                form="locationForm"
                disabled={actionLoading}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium text-sm flex items-center gap-2"
              >
                {actionLoading && <Loader2 size={16} className="animate-spin" />}
                Simpan Data
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && selectedLocation && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={() => setIsDeleteModalOpen(false)}></div>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm relative z-10 p-6 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 size={32} className="text-red-600" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-2">Hapus Lokasi?</h3>
            <p className="text-slate-500 mb-6 text-sm">
              Apakah Anda yakin ingin menghapus <strong>{selectedLocation.nama_lokasi}</strong>?
            </p>
            <div className="flex justify-center gap-3">
               <button 
                 onClick={() => setIsDeleteModalOpen(false)}
                 className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors font-medium text-sm border border-slate-200"
               >
                 Batal
               </button>
               <button 
                 onClick={handleDelete}
                 disabled={actionLoading}
                 className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium text-sm flex items-center gap-2"
               >
                 {actionLoading && <Loader2 size={16} className="animate-spin" />}
                 Hapus
               </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};