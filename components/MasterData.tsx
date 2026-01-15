import React, { useState, useEffect, useRef } from 'react';
import { User } from '../types';
import { logActivity } from '../services/activityService';
import { getMasterDataByType, createMasterData, updateMasterData, deleteMasterData, MasterItem } from '../services/masterDataService';
import { Plus, Pencil, Trash2, Search, X, Loader2, List, Info, CreditCard, Upload, Download, FileSpreadsheet, MessageSquare } from 'lucide-react';

interface MasterDataProps {
  currentUser?: User;
  type: 'CATEGORY' | 'INFO' | 'BANK' | 'COMPLAINT_CATEGORY';
}

export const MasterData: React.FC<MasterDataProps> = ({ currentUser, type }) => {
  const [data, setData] = useState<MasterItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<MasterItem | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  
  // Import/Export States
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form State
  const [formData, setFormData] = useState({ name: '', description: '', code: '' });

  // Config based on Type
  const getConfig = () => {
    switch(type) {
      case 'CATEGORY': return { 
        title: 'Kategori Problem', 
        icon: List, 
        prefix: 'CAT',
        hasDescription: true,
        templateHeader: 'name,description'
      };
      case 'COMPLAINT_CATEGORY': return {
        title: 'Kategori Aduan',
        icon: MessageSquare,
        prefix: 'ADC',
        hasDescription: true,
        templateHeader: 'name,description'
      };
      case 'INFO': return { 
        title: 'Info Problem', 
        icon: Info, 
        prefix: 'INF',
        hasDescription: true,
        templateHeader: 'name,description'
      };
      case 'BANK': return { 
        title: 'Bank Issuer', 
        icon: CreditCard, 
        prefix: 'BNK',
        hasDescription: false,
        templateHeader: 'name'
      };
    }
  };

  const config = getConfig();

  const fetchData = async () => {
    setLoading(true);
    try {
      const result = await getMasterDataByType(type);
      setData(result);
    } catch (error) {
      console.error("Failed to fetch master data", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [type]);

  const resetForm = () => {
    setFormData({ name: '', description: '', code: '' });
    setSelectedItem(null);
  };

  const openAddModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const openEditModal = (item: MasterItem) => {
    setSelectedItem(item);
    setFormData({ name: item.name, description: item.description, code: item.code || '' });
    setIsModalOpen(true);
  };

  const generateCode = () => {
    const rand = Math.floor(1000 + Math.random() * 9000);
    return `${config.prefix}-${rand}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    
    try {
      if (selectedItem) {
        // Update
        await updateMasterData(selectedItem.id, {
          name: formData.name,
          description: formData.description
        });
        
        if (currentUser) logActivity(currentUser, 'UPDATE', config.title, `Updated ${formData.name}`);
      } else {
        // Create
        const newCode = generateCode();
        await createMasterData({
            type: type,
            name: formData.name,
            description: formData.description,
            code: newCode
        });
        
        if (currentUser) logActivity(currentUser, 'CREATE', config.title, `Created ${formData.name} (${newCode})`);
      }
      await fetchData();
      setIsModalOpen(false);
      resetForm();
    } catch (error) {
      alert("Gagal menyimpan data");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedItem) return;
    setActionLoading(true);
    
    try {
      await deleteMasterData(selectedItem.id);
      if (currentUser) logActivity(currentUser, 'DELETE', config.title, `Deleted ${selectedItem.name}`);
      
      await fetchData();
      setIsDeleteModalOpen(false);
      setSelectedItem(null);
    } catch (error) {
       alert("Gagal menghapus data");
    } finally {
       setActionLoading(false);
    }
  };

  // --- IMPORT / EXPORT LOGIC ---

  const downloadCSV = (content: string, fileName: string) => {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadTemplate = () => {
    const headers = config.templateHeader;
    const example = config.hasDescription 
        ? `Contoh Nama ${type},Contoh Deskripsi Tambahan` 
        : `Contoh Nama ${type}`;
        
    const content = `${headers}\n${example}`;
    downloadCSV(content, `template_${type.toLowerCase()}.csv`);
  };

  const handleExport = () => {
    const headers = config.hasDescription ? 'code,name,description' : 'code,name';
    
    const rows = data.map(item => {
      const code = item.code ? `"${item.code.replace(/"/g, '""')}"` : '';
      const name = `"${item.name.replace(/"/g, '""')}"`;
      const desc = `"${item.description.replace(/"/g, '""')}"`;
      
      if (config.hasDescription) {
        return `${code},${name},${desc}`;
      } else {
        return `${code},${name}`;
      }
    });
    
    const content = `${headers}\n${rows.join('\n')}`;
    downloadCSV(content, `export_${type.toLowerCase()}.csv`);
    if (currentUser) logActivity(currentUser, 'EXPORT', config.title, 'Exported data to CSV');
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    const reader = new FileReader();

    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const lines = text.split(/\r\n|\n/).filter(line => line.trim() !== '');
        
        // Skip header
        const dataLines = lines.slice(1);
        const prefix = config.prefix;
        let successCount = 0;

        for (const line of dataLines) {
           const cols = line.split(',').map(c => c.replace(/^"|"$/g, '').trim());
           if (cols.length >= 1 && cols[0] !== '') {
             const rand = Math.floor(1000 + Math.random() * 9000);
             const uniqueCode = `${prefix}-${rand}`;
             
             await createMasterData({
                 type: type,
                 name: cols[0] || 'Tanpa Nama',
                 description: config.hasDescription ? (cols[1] || '') : '',
                 code: uniqueCode
             });
             successCount++;
           }
        }

        await fetchData();
        if (currentUser) logActivity(currentUser, 'IMPORT', config.title, `Imported ${successCount} items`);
        alert(`Berhasil import ${successCount} data.`);
        
      } catch (error) {
        alert("Gagal membaca atau menyimpan file CSV.");
      } finally {
        setIsImporting(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };

    reader.readAsText(file);
  };

  const filteredData = data.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    item.code?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      {/* Header */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-3">
             <config.icon className="text-blue-600" size={28} />
             Master {config.title}
          </h1>
          <p className="text-slate-500 text-sm mt-1">Kelola data referensi {config.title.toLowerCase()} untuk sistem.</p>
        </div>
        
        <div className="flex flex-wrap gap-2 w-full xl:w-auto">
          <button 
             onClick={downloadTemplate}
             className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100 px-3 py-2.5 rounded-lg transition-all shadow-sm text-sm font-medium"
          >
             <FileSpreadsheet size={16} />
             <span className="hidden sm:inline">Template</span>
          </button>

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

          <button 
             onClick={handleExport}
             className="flex items-center gap-2 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 px-3 py-2.5 rounded-lg transition-all shadow-sm text-sm font-medium"
          >
             <Download size={16} />
             <span>Export</span>
          </button>

          <button 
            onClick={openAddModal}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg transition-all shadow-md hover:shadow-lg active:scale-95 font-medium ml-auto sm:ml-0"
          >
            <Plus size={18} />
            <span>Tambah Data</span>
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text"
            placeholder={`Cari ${config.title}...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all bg-white text-slate-700 placeholder:text-slate-400"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 text-xs font-bold uppercase tracking-wider">
                <th className="p-4 w-16 text-center">No</th>
                <th className="p-4 w-32">Kode</th>
                <th className="p-4 w-64">Nama</th>
                {config.hasDescription && <th className="p-4">Deskripsi / Keterangan</th>}
                <th className="p-4 w-32 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={config.hasDescription ? 5 : 4} className="p-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <Loader2 size={32} className="text-blue-500 animate-spin" />
                      <span className="text-sm font-medium">Memuat data dari database...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredData.length > 0 ? (
                filteredData.map((item, index) => (
                  <tr key={item.id} className="hover:bg-blue-50/30 transition-colors">
                    <td className="p-4 text-slate-500 font-medium text-center">{index + 1}</td>
                    <td className="p-4 font-mono text-xs font-semibold text-slate-600 bg-slate-50 rounded w-max">{item.code || '-'}</td>
                    <td className="p-4 font-semibold text-slate-800">{item.name}</td>
                    {config.hasDescription && <td className="p-4 text-slate-600 text-sm">{item.description}</td>}
                    <td className="p-4">
                      <div className="flex justify-center items-center gap-2">
                         <button onClick={() => openEditModal(item)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Edit">
                           <Pencil size={18} />
                         </button>
                         <button onClick={() => { setSelectedItem(item); setIsDeleteModalOpen(true); }} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Hapus">
                           <Trash2 size={18} />
                         </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                   <td colSpan={config.hasDescription ? 5 : 4} className="p-8 text-center text-slate-500">Data tidak ditemukan.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={() => setIsModalOpen(false)}></div>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg relative z-10 p-6 animate-fade-in-up">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-slate-700">
                {selectedItem ? 'Edit Data' : 'Tambah Data Baru'}
              </h3>
              <button onClick={() => setIsModalOpen(false)}><X size={20} className="text-slate-400" /></button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-sm font-semibold text-slate-600">Kode</label>
                <input 
                  type="text" 
                  value={selectedItem ? formData.code : 'Auto Generated (System)'}
                  disabled
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-slate-100 text-slate-500 cursor-not-allowed transition-all font-mono text-sm"
                  placeholder={`Contoh: ${config.prefix}-XXXX`}
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-semibold text-slate-600">Nama</label>
                <input 
                  type="text" 
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white text-slate-600 placeholder:text-slate-400 transition-all"
                  placeholder={`Nama ${config.title}`}
                  required
                />
              </div>
              
              {config.hasDescription && (
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-slate-600">Deskripsi</label>
                  <textarea 
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none h-24 resize-none bg-white text-slate-600 placeholder:text-slate-400 transition-all"
                    placeholder="Keterangan tambahan..."
                  />
                </div>
              )}
              
              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">Batal</button>
                <button type="submit" disabled={actionLoading} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2">
                  {actionLoading && <Loader2 size={16} className="animate-spin" />}
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {isDeleteModalOpen && selectedItem && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={() => setIsDeleteModalOpen(false)}></div>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm relative z-10 p-6 text-center animate-fade-in-up">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 size={32} className="text-red-600" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-2">Hapus Data?</h3>
            <p className="text-slate-500 mb-6">Yakin ingin menghapus <strong>{selectedItem.name}</strong>?</p>
            <div className="flex justify-center gap-3">
               <button onClick={() => setIsDeleteModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg border">Batal</button>
               <button onClick={handleDelete} disabled={actionLoading} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg flex items-center gap-2">
                 {actionLoading && <Loader2 size={16} className="animate-spin" />} Hapus
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
