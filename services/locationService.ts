import { Location } from '../types';

// Mock Data Awal
let MOCK_LOCATIONS_DB: Location[] = [
  {
    id: '1',
    kode_terminal: 'RND-8821',
    terminal_id: 'TID-00123',
    tanggal_aktivasi: '20230115',
    tanggal_relokasi: '-',
    kode_toko: 'IDM-552',
    nama_lokasi: 'SPBU Merdeka Raya',
    alamat: 'Jl. Merdeka Raya No. 10',
    wilayah: 'Jakarta Pusat',
    provinsi: 'DKI Jakarta',
    dc_toko: 'DC ANCOL',
    titik_kordinat: '-6.1234, 106.1234',
    jam_buka: '07:00',
    jam_tutup: '22:00',
    total_jam_tutup: 9,
    flm: 'ADVANTAGE',
    slm: 'DN',
    vendor_modem: 'Telkomsel',
    nomor_modem: '081234567890',
    kebersihan: 'Bersih',
    penempatan: 'INDOMARET',
    jenis_box: 'Besar',
    tipe_mesin: 'Hyosung',
    sn_atm: 'HY-992123',
    vendor_ups: 'ICA',
    sn_ups: 'UPS-112',
    vendor_lcd: 'Samsung',
    sn_lcd: 'LCD-991',
    flag_aktif: true
  },
  {
    id: '2',
    kode_terminal: 'RND-1102',
    terminal_id: 'TID-00456',
    tanggal_aktivasi: '20240210',
    tanggal_relokasi: '20250101',
    kode_toko: 'ALF-102',
    nama_lokasi: 'Indomaret Point Pusat',
    alamat: 'Jl. Sudirman Kav 5',
    wilayah: 'Jakarta Selatan',
    provinsi: 'DKI Jakarta',
    dc_toko: 'DC CIKOKOL',
    titik_kordinat: '-6.5511, 106.8822',
    jam_buka: '00:00',
    jam_tutup: '23:59',
    total_jam_tutup: 0,
    flm: 'KEJAR',
    slm: 'DATINDO',
    vendor_modem: 'Indosat',
    nomor_modem: '0856123123',
    kebersihan: 'Cukup',
    penempatan: 'ALFAMART',
    jenis_box: 'Standard',
    tipe_mesin: 'NCR',
    sn_atm: 'NCR-5512',
    vendor_ups: 'Prolink',
    sn_ups: 'UPS-882',
    vendor_lcd: 'LG',
    sn_lcd: 'LCD-221',
    flag_aktif: true
  }
];

// Helper Hitung Jam Tutup
export const calculateTotalJamTutup = (buka: string, tutup: string): number => {
  if (!buka || !tutup) return 0;
  
  const [hBuka, mBuka] = buka.split(':').map(Number);
  const [hTutup, mTutup] = tutup.split(':').map(Number);
  
  // Konversi ke menit dari awal hari
  const startMins = hBuka * 60 + mBuka;
  const endMins = hTutup * 60 + mTutup;
  
  let diffMins = endMins - startMins;
  if (diffMins < 0) diffMins += 24 * 60; // Jika tutup lewat tengah malam (cross day)
  
  // Jam Buka operasional dalam jam (decimal)
  const hoursOpen = diffMins / 60;
  
  // Total jam tutup = 24 - jam buka
  // Pembulatan 2 desimal
  return Math.round((24 - hoursOpen) * 100) / 100;
};

// Fungsi generate kode terminal unik
const generateUniqueTerminalCode = (): string => {
  const prefix = "RND";
  let isUnique = false;
  let code = "";
  
  // Loop sampai menemukan kode yang belum ada
  while (!isUnique) {
     const randomNum = Math.floor(1000 + Math.random() * 9000); // 4 digit random
     code = `${prefix}-${randomNum}`;
     
     const exists = MOCK_LOCATIONS_DB.some(loc => loc.kode_terminal === code);
     if (!exists) {
       isUnique = true;
     }
  }
  return code;
}

// Helper untuk download CSV
const downloadCSV = (content: string, fileName: string) => {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', fileName);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// Helper untuk parsing baris CSV (menangani koma dalam kutip)
const parseCSVRow = (row: string): string[] => {
  const result = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < row.length; i++) {
    const char = row[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.replace(/^"|"$/g, '').trim()); // Remove surrounding quotes
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.replace(/^"|"$/g, '').trim());
  return result;
};

export const getLocations = async (): Promise<Location[]> => {
  await new Promise(resolve => setTimeout(resolve, 600));
  return [...MOCK_LOCATIONS_DB];
};

export const createLocation = async (data: Omit<Location, 'id'>): Promise<Location> => {
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Generate kode unik otomatis di backend/service layer
  const uniqueCode = generateUniqueTerminalCode();

  const newLocation: Location = {
    ...data,
    id: Math.random().toString(36).substr(2, 9),
    kode_terminal: uniqueCode, 
    // Ensure calculation logic is applied backend side too if needed
    total_jam_tutup: calculateTotalJamTutup(data.jam_buka, data.jam_tutup)
  };
  MOCK_LOCATIONS_DB.push(newLocation);
  return newLocation;
};

export const updateLocation = async (id: string, data: Partial<Location>): Promise<Location> => {
  await new Promise(resolve => setTimeout(resolve, 500));
  const index = MOCK_LOCATIONS_DB.findIndex(l => l.id === id);
  if (index === -1) throw new Error("Lokasi tidak ditemukan");
  
  // Recalculate if time changes
  let newTotal = MOCK_LOCATIONS_DB[index].total_jam_tutup;
  if (data.jam_buka || data.jam_tutup) {
     const b = data.jam_buka || MOCK_LOCATIONS_DB[index].jam_buka;
     const t = data.jam_tutup || MOCK_LOCATIONS_DB[index].jam_tutup;
     newTotal = calculateTotalJamTutup(b, t);
  }

  // Mencegah perubahan kode_terminal saat update (walaupun frontend sudah disable)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { kode_terminal, ...allowedUpdates } = data;

  MOCK_LOCATIONS_DB[index] = {
    ...MOCK_LOCATIONS_DB[index],
    ...allowedUpdates,
    total_jam_tutup: newTotal
  };
  return MOCK_LOCATIONS_DB[index];
};

export const deleteLocation = async (id: string): Promise<void> => {
  await new Promise(resolve => setTimeout(resolve, 500));
  MOCK_LOCATIONS_DB = MOCK_LOCATIONS_DB.filter(l => l.id !== id);
};

// Update: Return object dengan detail hasil import
export const importLocations = async (file: File): Promise<{ success: number; skipped: string[] }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        if (!text) {
          resolve({ success: 0, skipped: [] });
          return;
        }

        // Split baris (handle CRLF dan LF)
        const lines = text.split(/\r\n|\n/).filter(line => line.trim() !== '');
        
        // Skip header (baris pertama)
        const dataLines = lines.slice(1);
        
        const skipped: string[] = [];
        let successCount = 0;

        /*
          NEW MAPPING INDEX (0-based):
          0: terminal_id
          1: tanggal_aktivasi
          2: tanggal_relokasi
          3: kode_toko
          4: nama_lokasi
          5: alamat
          6: wilayah
          7: provinsi
          8: dc_toko
          9: titik_kordinat
          10: jam_buka
          11: jam_tutup
          12: flm
          13: slm
          14: vendor_modem
          15: nomor_modem
          16: kebersihan
          17: penempatan
          18: jenis_box
          19: tipe_mesin
          20: sn_atm
          21: vendor_ups
          22: sn_ups
          23: vendor_lcd
          24: sn_lcd
        */

        dataLines.forEach(line => {
          const cols = parseCSVRow(line);
          
          // Basic validation: harus punya minimal kolom terminal_id (index 0)
          if (cols.length < 1 || !cols[0]) return;

          const terminalId = cols[0].trim();
          const namaLokasi = cols[4] ? cols[4].trim() : 'Nama Tidak Diketahui'; // Index 4 is nama_lokasi

          // Cek Duplikat Terminal ID
          const isDuplicate = MOCK_LOCATIONS_DB.some(
            loc => loc.terminal_id.toLowerCase() === terminalId.toLowerCase()
          );

          if (isDuplicate) {
            // Simpan detail data yang duplicate
            skipped.push(`${terminalId} - ${namaLokasi}`);
          } else {
            // Mapping fields
            const jamBuka = cols[10] || '00:00';
            const jamTutup = cols[11] || '23:59';
            const totalJamTutup = calculateTotalJamTutup(jamBuka, jamTutup);

            const newLoc: Location = {
              id: Math.random().toString(36).substr(2, 9),
              kode_terminal: generateUniqueTerminalCode(), // Generated System
              terminal_id: terminalId,
              tanggal_aktivasi: cols[1] || '-',
              tanggal_relokasi: cols[2] || '-',
              kode_toko: cols[3] || '-',
              nama_lokasi: namaLokasi,
              alamat: cols[5] || '-',
              wilayah: cols[6] || '-',
              provinsi: cols[7] || '-',
              dc_toko: cols[8] || '-',
              titik_kordinat: cols[9] || '',
              jam_buka: jamBuka,
              jam_tutup: jamTutup,
              total_jam_tutup: totalJamTutup,
              flm: (cols[12] as any) || 'ADVANTAGE',
              slm: (cols[13] as any) || 'DN',
              vendor_modem: cols[14] || '-',
              nomor_modem: cols[15] || '-',
              kebersihan: cols[16] || '-',
              penempatan: (cols[17] as any) || 'INDOMARET',
              jenis_box: cols[18] || 'Standard',
              tipe_mesin: cols[19] || 'ATM',
              sn_atm: cols[20] || '-',
              vendor_ups: cols[21] || '-',
              sn_ups: cols[22] || '-',
              vendor_lcd: cols[23] || '-',
              sn_lcd: cols[24] || '-',
              flag_aktif: true
            };

            MOCK_LOCATIONS_DB.push(newLoc);
            successCount++;
          }
        });

        resolve({ success: successCount, skipped });

      } catch (error) {
        console.error("Error parsing CSV", error);
        reject(error);
      }
    };

    reader.onerror = () => reject(new Error("Gagal membaca file"));
    reader.readAsText(file); // Membaca sebagai text/csv
  });
};

// --- NEW FEATURES ---

// 1. Download Template Import
export const downloadTemplate = (): void => {
  // Kolom-kolom sesuai urutan request user
  const headers = [
    'terminal_id',
    'tanggal_aktivasi', // YYYYMMDD
    'tanggal_relokasi', // YYYYMMDD
    'kode_toko',
    'nama_lokasi',
    'alamat',
    'wilayah',
    'provinsi',
    'dc_toko',
    'titik_kordinat',
    'jam_buka', // HH:MM
    'jam_tutup', // HH:MM
    'flm', // ADVANTAGE, BRINKS-AMS, BRINKS-ICS, KEJAR
    'slm', // DN, DATINDO
    'vendor_modem',
    'nomor_modem',
    'kebersihan',
    'penempatan', // INDOMARET, ALFAMART, ALFAMIDI
    'jenis_box',
    'tipe_mesin',
    'sn_atm',
    'vendor_ups',
    'sn_ups',
    'vendor_lcd',
    'sn_lcd'
  ];
  
  // Baris contoh untuk memudahkan user
  const exampleRow = [
    'TID-99999',
    '20250101',
    '20250201',
    'TKO-888',
    'Contoh Lokasi',
    'Jl. Contoh No 1',
    'Jakarta Pusat',
    'DKI Jakarta',
    'DC JAKARTA',
    '-6.123, 106.123',
    '07:00',
    '22:00',
    'ADVANTAGE',
    'DN',
    'Telkomsel',
    '081234567890',
    'Bersih',
    'INDOMARET',
    'Standard',
    'NCR',
    'SN-ATM-001',
    'ICA',
    'SN-UPS-001',
    'Samsung',
    'SN-LCD-001'
  ];

  const csvContent = [
    headers.join(','),
    exampleRow.map(item => `"${item}"`).join(',') // Quote example row
  ].join('\n');

  downloadCSV(csvContent, 'template_import_lokasi.csv');
};

// 2. Download Seluruh Data (Export)
export const exportLocations = async (): Promise<void> => {
  await new Promise(resolve => setTimeout(resolve, 800)); // Simulasi proses generate
  
  // Menggunakan urutan yang sama dengan template import agar konsisten
  const headers = [
    'terminal_id',
    'tanggal_aktivasi',
    'tanggal_relokasi',
    'kode_toko',
    'nama_lokasi',
    'alamat',
    'wilayah',
    'provinsi',
    'dc_toko',
    'titik_kordinat',
    'jam_buka',
    'jam_tutup',
    'flm',
    'slm',
    'vendor_modem',
    'nomor_modem',
    'kebersihan',
    'penempatan',
    'jenis_box',
    'tipe_mesin',
    'sn_atm',
    'vendor_ups',
    'sn_ups',
    'vendor_lcd',
    'sn_lcd'
  ];

  const csvContent = [
    headers.join(','),
    ...MOCK_LOCATIONS_DB.map(loc => {
      // Handle koma dalam string (misal alamat) dengan membungkus petik
      return headers.map(header => {
        const val = loc[header as keyof Location];
        const stringVal = val === null || val === undefined ? '' : String(val);
        return `"${stringVal.replace(/"/g, '""')}"`; // Escape double quotes
      }).join(',');
    })
  ].join('\n');

  downloadCSV(csvContent, `data_lokasi_export_${new Date().toISOString().split('T')[0]}.csv`);
};