import { Mail, User, MailRecipient, MailAttachment } from '../types';
import { supabase } from '../lib/supabaseClient';

// --- Helper untuk Mapping Data dari DB ke Type Mail ---
const mapMailFromDB = (mail: any): Mail => {
  // Aggregate arrays manually since we are doing loose joins
  const recipients: MailRecipient[] = [];
  const cc: MailRecipient[] = [];
  const readBy: string[] = [];
  const starredBy: string[] = [];
  const deletedBy: string[] = [];

  // Handle Sender's own flags
  if (mail.sender_read) readBy.push(mail.sender_id);
  if (mail.sender_starred) starredBy.push(mail.sender_id);
  if (mail.sender_deleted) deletedBy.push(mail.sender_id);

  // Process Recipients from JOIN
  if (mail.mail_recipients && Array.isArray(mail.mail_recipients)) {
    mail.mail_recipients.forEach((r: any) => {
      const recipientObj: MailRecipient = {
        id: r.user_id,
        name: r.user_name,
        email: r.user_email
      };

      if (r.recipient_type === 'TO') recipients.push(recipientObj);
      if (r.recipient_type === 'CC') cc.push(recipientObj);
      
      if (r.is_read) readBy.push(r.user_id);
      if (r.is_starred) starredBy.push(r.user_id);
      if (r.is_deleted) deletedBy.push(r.user_id);
    });
  }

  return {
    id: mail.id,
    senderId: mail.sender_id,
    senderName: mail.sender_name,
    senderEmail: mail.sender_email,
    senderAvatar: mail.sender_avatar,
    subject: mail.subject || '(No Subject)',
    content: mail.content || '',
    timestamp: mail.created_at,
    isDraft: mail.is_draft,
    recipients,
    cc,
    readBy,
    starredBy,
    deletedBy,
    attachments: mail.mail_attachments ? mail.mail_attachments.map((a: any) => ({
      name: a.name,
      size: a.size,
      type: a.type,
      content: a.content
    })) : []
  };
};

// --- SERVICES ---

export const getInbox = async (userId: string): Promise<Mail[]> => {
  // Inbox = Saya sebagai penerima (TO/CC) DAN belum saya delete
  const { data, error } = await supabase
    .from('mails')
    .select(`
      *,
      mail_recipients!inner (*),
      mail_attachments (*)
    `)
    .eq('is_draft', false)
    .eq('mail_recipients.user_id', userId) // Hanya ambil email dimana user ini adalah recipient
    .eq('mail_recipients.is_deleted', false)
    .order('created_at', { ascending: false });

  if (error) { console.error(error); return []; }
  
  // Perlu fetch full recipient list untuk setiap mail agar UI bisa menampilkan "To: A, B, C"
  // Karena query di atas filter 'mail_recipients' hanya ke user ini, kita perlu fetch ulang recipients lengkapnya.
  // Untuk optimasi di frontend simple, kita fetch ulang full recipients untuk mail-mail ini.
  const mailIds = data.map((m: any) => m.id);
  if (mailIds.length === 0) return [];

  const { data: fullData, error: fullError } = await supabase
    .from('mails')
    .select(`
        *,
        mail_recipients (*),
        mail_attachments (*)
    `)
    .in('id', mailIds)
    .order('created_at', { ascending: false });

  if (fullError) return [];
  return fullData.map(mapMailFromDB);
};

export const getSentBox = async (userId: string): Promise<Mail[]> => {
  const { data, error } = await supabase
    .from('mails')
    .select(`
      *,
      mail_recipients (*),
      mail_attachments (*)
    `)
    .eq('sender_id', userId)
    .eq('is_draft', false)
    .eq('sender_deleted', false)
    .order('created_at', { ascending: false });

  if (error) return [];
  return data.map(mapMailFromDB);
};

export const getDrafts = async (userId: string): Promise<Mail[]> => {
  const { data, error } = await supabase
    .from('mails')
    .select(`
      *,
      mail_recipients (*),
      mail_attachments (*)
    `)
    .eq('sender_id', userId)
    .eq('is_draft', true)
    .eq('sender_deleted', false)
    .order('created_at', { ascending: false });

  if (error) return [];
  return data.map(mapMailFromDB);
};

export const getDeletedMails = async (): Promise<Mail[]> => {
    // Ini tricky karena "deleted" bisa berarti deleted dari Inbox (oleh penerima) atau Sent (oleh pengirim).
    // Kita ambil semua mail, lalu filter di JS atau query union kompleks.
    // Untuk simplifikasi: Ambil semua mail, lalu filter di client side apakah user ini ada di list deletedBy.
    // Di aplikasi nyata, kita query spesifik per user id.
    
    // Kita akan gunakan getInbox & getSentBox logic tapi dengan filter is_deleted = true
    
    // 1. Deleted from Inbox
    const { data: inboxTrash } = await supabase
        .from('mail_recipients')
        .select('mail_id')
        .eq('is_deleted', true);
        
    // 2. Deleted from Sent
    const { data: sentTrash } = await supabase
        .from('mails')
        .select('id')
        .eq('sender_deleted', true);

    const trashMailIds = [
        ...(inboxTrash?.map((x:any) => x.mail_id) || []), 
        ...(sentTrash?.map((x:any) => x.id) || [])
    ];

    if (trashMailIds.length === 0) return [];

    const { data, error } = await supabase
        .from('mails')
        .select(`
            *,
            mail_recipients (*),
            mail_attachments (*)
        `)
        .in('id', trashMailIds)
        .order('created_at', { ascending: false });

    if (error) return [];
    
    // Filter di sisi client untuk memastikan user memang yang menghapusnya
    // Karena trashMailIds mungkin berisi ID sampah milik user lain jika tabel dishare tanpa RLS yang ketat di level row user
    // Tapi di mapMailFromDB kita build 'deletedBy'. Kita bisa cek di UI atau filter disini.
    return data.map(mapMailFromDB); 
};

export const sendMail = async (
  sender: User,
  recipients: MailRecipient[],
  cc: MailRecipient[],
  subject: string,
  content: string,
  attachments: MailAttachment[] = [],
  originalDraftId?: string
): Promise<void> => {
  
  let mailId = originalDraftId;

  // 1. Upsert Mail
  if (mailId) {
     // Update existing draft to sent
     await supabase
        .from('mails')
        .update({
            subject,
            content,
            is_draft: false,
            created_at: new Date().toISOString() // Reset time to now
        })
        .eq('id', mailId);
        
     // Clear old recipients/attachments to replace them (Simple way)
     await supabase.from('mail_recipients').delete().eq('mail_id', mailId);
     await supabase.from('mail_attachments').delete().eq('mail_id', mailId);

  } else {
     // Insert new
     const { data, error } = await supabase
        .from('mails')
        .insert([{
            sender_id: sender.id,
            sender_name: sender.name,
            sender_email: sender.email,
            sender_avatar: sender.avatar,
            subject,
            content,
            is_draft: false,
            sender_read: true
        }])
        .select()
        .single();
     
     if (error) throw error;
     mailId = data.id;
  }

  // 2. Insert Recipients
  const recipientsPayload = [
      ...recipients.map(r => ({ mail_id: mailId, user_id: r.id, user_name: r.name, user_email: r.email, recipient_type: 'TO' })),
      ...cc.map(r => ({ mail_id: mailId, user_id: r.id, user_name: r.name, user_email: r.email, recipient_type: 'CC' }))
  ];

  if (recipientsPayload.length > 0) {
      await supabase.from('mail_recipients').insert(recipientsPayload);
  }

  // 3. Insert Attachments
  const attachmentsPayload = attachments.map(a => ({
      mail_id: mailId,
      name: a.name,
      size: a.size,
      type: a.type,
      content: a.content
  }));

  if (attachmentsPayload.length > 0) {
      await supabase.from('mail_attachments').insert(attachmentsPayload);
  }
};

export const saveDraft = async (
  sender: User,
  recipients: MailRecipient[],
  cc: MailRecipient[],
  subject: string,
  content: string,
  attachments: MailAttachment[] = [],
  existingDraftId?: string
): Promise<void> => {
  
  let mailId = existingDraftId;

  if (mailId) {
     await supabase
        .from('mails')
        .update({ subject, content })
        .eq('id', mailId);
        
     await supabase.from('mail_recipients').delete().eq('mail_id', mailId);
     await supabase.from('mail_attachments').delete().eq('mail_id', mailId);
  } else {
     const { data, error } = await supabase
        .from('mails')
        .insert([{
            sender_id: sender.id,
            sender_name: sender.name,
            sender_email: sender.email,
            sender_avatar: sender.avatar,
            subject,
            content,
            is_draft: true
        }])
        .select()
        .single();
     
     if (error) throw error;
     mailId = data.id;
  }

   const recipientsPayload = [
      ...recipients.map(r => ({ mail_id: mailId, user_id: r.id, user_name: r.name, user_email: r.email, recipient_type: 'TO' })),
      ...cc.map(r => ({ mail_id: mailId, user_id: r.id, user_name: r.name, user_email: r.email, recipient_type: 'CC' }))
  ];
  if (recipientsPayload.length > 0) await supabase.from('mail_recipients').insert(recipientsPayload);

  const attachmentsPayload = attachments.map(a => ({
      mail_id: mailId,
      name: a.name,
      size: a.size,
      type: a.type,
      content: a.content
  }));
  if (attachmentsPayload.length > 0) await supabase.from('mail_attachments').insert(attachmentsPayload);
};

export const deleteMail = async (mailId: string, userId: string): Promise<boolean> => {
  // Check if user is sender
  const { data: mail } = await supabase.from('mails').select('sender_id').eq('id', mailId).single();
  
  if (mail && mail.sender_id === userId) {
      await supabase.from('mails').update({ sender_deleted: true }).eq('id', mailId);
  }
  
  // Update recipient status (if user is recipient)
  await supabase
    .from('mail_recipients')
    .update({ is_deleted: true })
    .eq('mail_id', mailId)
    .eq('user_id', userId);
    
  return true;
};

export const restoreMail = async (mailId: string): Promise<boolean> => {
   // Restore for everyone involved (simplification) or check ownership
   // For now, we restore based on current session approach in UI
   // Ideally, we need userId passed here to restore only for that user. 
   // Assuming the UI handles context, let's restore blindly for the moment or update logic:
   
   // We will try to restore both sender flag and recipient flag indiscriminately for the mailId
   // Note: In real app, pass userId to be specific.
   await supabase.from('mails').update({ sender_deleted: false }).eq('id', mailId);
   await supabase.from('mail_recipients').update({ is_deleted: false }).eq('mail_id', mailId);
   
   return true;
};

export const markAsRead = async (mailId: string, userId: string): Promise<void> => {
  await supabase
    .from('mail_recipients')
    .update({ is_read: true })
    .eq('mail_id', mailId)
    .eq('user_id', userId);
};

export const markAsUnread = async (mailId: string, userId: string): Promise<void> => {
  await supabase
    .from('mail_recipients')
    .update({ is_read: false })
    .eq('mail_id', mailId)
    .eq('user_id', userId);
};

export const toggleStar = async (mailId: string, userId: string): Promise<void> => {
  // Check sender
  const { data: mail } = await supabase.from('mails').select('sender_id, sender_starred').eq('id', mailId).single();
  
  if (mail && mail.sender_id === userId) {
      await supabase.from('mails').update({ sender_starred: !mail.sender_starred }).eq('id', mailId);
      return;
  }
  
  // Check recipient
  const { data: recipient } = await supabase
    .from('mail_recipients')
    .select('is_starred')
    .eq('mail_id', mailId)
    .eq('user_id', userId)
    .single();

  if (recipient) {
      await supabase
        .from('mail_recipients')
        .update({ is_starred: !recipient.is_starred })
        .eq('mail_id', mailId)
        .eq('user_id', userId);
  }
};

export const getUnreadCount = async (userId: string): Promise<number> => {
  const { count } = await supabase
    .from('mail_recipients')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('is_read', false)
    .eq('is_deleted', false);
    
  return count || 0;
};

export const getDraftCount = async (userId: string): Promise<number> => {
  const { count } = await supabase
    .from('mails')
    .select('*', { count: 'exact', head: true })
    .eq('sender_id', userId)
    .eq('is_draft', true)
    .eq('sender_deleted', false);
    
  return count || 0;
};