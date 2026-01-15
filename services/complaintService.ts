import { Complaint, ComplaintComment } from '../types';
import { supabase } from '../lib/supabaseClient';

// Helper to map DB result to Complaint type
const mapComplaint = (data: any): Complaint => ({
  id: data.id,
  noTiket: data.no_tiket,
  nasabah: data.nasabah,
  terminalId: data.terminal_id,
  waktuTrx: data.waktu_trx,
  waktuAduan: data.waktu_aduan,
  jenisAduan: data.jenis_aduan,
  severity: data.severity,
  pengecekan: data.pengecekan,
  status: data.status,
  comments: data.complaint_comments?.map((c: any) => ({
      id: c.id,
      userId: c.user_id,
      userName: c.user_name,
      userRole: c.user_role,
      avatar: c.avatar,
      text: c.text,
      timestamp: c.timestamp
  })) || []
});

export const getComplaints = async (): Promise<Complaint[]> => {
  const { data, error } = await supabase
    .from('complaints')
    .select(`
      *,
      complaint_comments (*)
    `)
    .order('waktu_aduan', { ascending: false });

  if (error) throw error;
  return data.map(mapComplaint);
};

export const createComplaint = async (complaintData: any): Promise<Complaint> => {
  const { data, error } = await supabase
    .from('complaints')
    .insert([{
        no_tiket: complaintData.noTiket,
        nasabah: complaintData.nasabah,
        terminal_id: complaintData.terminalId,
        waktu_trx: complaintData.waktuTrx,
        waktu_aduan: complaintData.waktuAduan,
        jenis_aduan: complaintData.jenisAduan,
        severity: complaintData.severity,
        pengecekan: complaintData.pengecekan,
        status: complaintData.status
    }])
    .select()
    .single();

  if (error) throw error;
  return mapComplaint(data);
};

export const updateComplaint = async (id: string, updates: any): Promise<void> => {
  // Map camelCase to snake_case for DB
  const dbUpdates: any = {};
  if(updates.nasabah) dbUpdates.nasabah = updates.nasabah;
  if(updates.terminalId) dbUpdates.terminal_id = updates.terminalId;
  if(updates.waktuTrx) dbUpdates.waktu_trx = updates.waktuTrx;
  if(updates.waktuAduan) dbUpdates.waktu_aduan = updates.waktuAduan;
  if(updates.jenisAduan) dbUpdates.jenis_aduan = updates.jenisAduan;
  if(updates.severity) dbUpdates.severity = updates.severity;
  if(updates.pengecekan) dbUpdates.pengecekan = updates.pengecekan;
  if(updates.status) dbUpdates.status = updates.status;

  const { error } = await supabase
    .from('complaints')
    .update(dbUpdates)
    .eq('id', id);

  if (error) throw error;
};

export const addComment = async (complaintId: string, comment: any): Promise<ComplaintComment> => {
    const { data, error } = await supabase
      .from('complaint_comments')
      .insert([{
          complaint_id: complaintId,
          user_id: comment.userId,
          user_name: comment.userName,
          user_role: comment.userRole,
          avatar: comment.avatar,
          text: comment.text,
          timestamp: new Date().toISOString()
      }])
      .select()
      .single();
    
    if (error) throw error;

    return {
        id: data.id,
        userId: data.user_id,
        userName: data.user_name,
        userRole: data.user_role,
        avatar: data.avatar,
        text: data.text,
        timestamp: data.timestamp
    };
};
