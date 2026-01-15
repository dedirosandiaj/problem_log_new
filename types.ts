
export enum UserRole {
  SUPERADMIN = 'Super Admin',
  HELPDESK = 'Helpdesk',
  CASH_MANAGEMENT = 'Cash Management',
  TECHNICIAN = 'Technician'
}

export type MenuPermission = 
  | 'dashboard' 
  | 'users' 
  | 'reports' 
  | 'settings' 
  | 'locations' 
  | 'log_activity' 
  | 'mail' 
  | 'data_master'
  | 'master_category'
  | 'master_complaint_category'
  | 'master_info'
  | 'master_bank'
  | 'complaints'; // New Permission

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar: string;
  lastLogin: string;
  permissions: MenuPermission[];
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
}

export type ViewState = 
  | 'users' 
  | 'dashboard' 
  | 'locations' 
  | 'settings' 
  | 'log_activity' 
  | 'mail' 
  | 'master_category' 
  | 'master_complaint_category' 
  | 'master_info' 
  | 'master_bank'
  | 'complaints'; // New ViewState

export interface Location {
  id: string; // Internal ID
  kode_terminal: string; // Random code
  terminal_id: string;
  tanggal_aktivasi: string; // YYYYMMDD
  tanggal_relokasi: string; // YYYYMMDD
  kode_toko: string;
  nama_lokasi: string;
  alamat: string;
  wilayah: string;
  provinsi: string;
  dc_toko: string;
  titik_kordinat: string;
  jam_buka: string; // HH:mm
  jam_tutup: string; // HH:mm
  total_jam_tutup: number; // Calculated
  flm: 'ADVANTAGE' | 'BRINKS-AMS' | 'BRINKS-ICS' | 'KEJAR';
  slm: 'DN' | 'DATINDO';
  vendor_modem: string;
  nomor_modem: string;
  kebersihan: string;
  penempatan: 'INDOMARET' | 'ALFAMART' | 'ALFAMIDI';
  jenis_box: string;
  tipe_mesin: string;
  sn_atm: string;
  vendor_ups: string;
  sn_ups: string;
  vendor_lcd: string;
  sn_lcd: string;
  flag_aktif: boolean;
}

// New Interface for Complaint Comment
export interface ComplaintComment {
  id: string;
  userId: string;
  userName: string;
  userRole: string;
  avatar: string;
  text: string;
  timestamp: string;
}

// Updated Interface for Complaint
export interface Complaint {
  id: string;
  noTiket: string;
  nasabah: string;
  terminalId: string;
  waktuTrx: string; // DateTime ISO String
  waktuAduan: string; // DateTime ISO String
  jenisAduan: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  pengecekan: 'VALID' | 'TIDAK VALID';
  status: 'OPEN' | 'CLOSED' | 'HOLD' | 'IN PROGRESS';
  comments: ComplaintComment[]; // Changed from string to array
}

export interface LoginFeature {
  title: string;
  desc: string;
}

export interface AppSettings {
  appName: string;
  tagline: string;
  companyName: string;
  logoUrl: string | null; // Base64 string or URL
  
  // Login Page Configuration
  loginHeadline: string;
  loginDescription: string;
  loginBackgroundImageUrl: string | null; // New: Custom Background
  loginFeatures: LoginFeature[]; // New: Dynamic List
}

export interface ActivityLog {
  id: string;
  userId: string;
  userName: string;
  userRole: string;
  action: 'LOGIN' | 'LOGOUT' | 'CREATE' | 'UPDATE' | 'DELETE' | 'VIEW' | 'IMPORT' | 'EXPORT';
  target: string; // Menu atau Data yang diakses (misal: "Menu Dashboard", "User: Budi")
  details: string;
  timestamp: string;
}

export interface MailRecipient {
  id: string;
  name: string;
  email: string;
}

export interface MailAttachment {
  name: string;
  size: number;
  type: string;
  content: string; // Base64 string
}

export interface Mail {
  id: string;
  senderId: string;
  senderName: string;
  senderEmail: string;
  senderAvatar: string;
  recipients: MailRecipient[]; // To
  cc: MailRecipient[]; // CC
  subject: string;
  content: string;
  timestamp: string;
  readBy: string[]; // List of user IDs who have read this mail
  starredBy: string[]; // List of user IDs who flagged this mail
  isDraft: boolean;
  deletedBy: string[]; // List of user IDs who deleted this mail
  attachments?: MailAttachment[]; 
}
