import { Mail, User, MailRecipient, MailAttachment } from '../types';

// Helper mock content
const MOCK_PDF_CONTENT = "data:application/pdf;base64,JVBERi0xLjcKCjEgMCBvYmogICUgZW50cnkgcG9pbnQKPDwKICAvVHlwZSAvQ2F0YWxvZwogIC9QYWdlcyAyIDAgUgo+PgplbmRvYmoKCjIgMCBvYmogCjw8CiAgL1R5cGUgL1BhZ2VzCiAgL01lZGlhQm94IFsgMCAwIDIwMCAyMDAgXQogIC9Db3VudCAxCiAgL0tpZHMgWyAzIDAgUiBdCj4+CmVuZG9iagoKMyAwIG9iagw8PAogIC9UeXBlIC9QYWdlCiAgL1BhcmVudCAyIDAgUHIKICAvUmVzb3VyY2VzIDw8CiAgICAvRm9udCA8PAogICAgICAvRjEgNCAwIFIKICAgID4+CiAgPj4KICAvQ29udGVudHMgNSAwIFIKPj4KZW5kb2JqCgo0IDAgb2JqCjw8CiAgL1R5cGUgL0ZvbnQKICAvU3VidHlwZSAvVHlwZTEKICAvQmFzZUZvbnQgL1RpbWVzLVJvbWFuCj4+CmVuZG9iagoKNSAwIG9iago8PAogIC9MZW5ndGggNDQKPj4Kc3RyZWFtCkJUCjcwIDUwIFRECi9GMSAxMiBUZgooSGVsbG8sIHdvcmxkISkgVGoKRVQKZW5kc3RyZWFtCmVuZG9iagoKeHJlZgowIDYKMDAwMDAwMDAwMCA2NTUzNSBmIAowMDAwMDAwMDEwIDAwMDAwIG4gCjAwMDAwMDAwNjAgMDAwMDAgbiAKMDAwMDAwMDE1NyAwMDAwMCBuIAowMDAwMDAwMjU1IDAwMDAwIG4gCjAwMDAwMDAzNDQgMDAwMDAgbiAKdHJhaWxlcgo8PAogIC9TaXplIDYKICAvUm9vdCAxIDAgUgo+PgpzdGFydHhyZWYKNDQxCiUlRU9GCg==";

// Mock Database
let MOCK_MAILS_DB: Mail[] = [
  {
    id: 'm1',
    senderId: '2', 
    senderName: 'Siti Aminah',
    senderEmail: 'siti@problemlog.com',
    senderAvatar: 'https://ui-avatars.com/api/?name=Siti+Aminah&background=random',
    recipients: [{ id: '1', name: 'Administrator', email: 'admin@problemlog.com' }],
    cc: [],
    subject: 'Laporan Masalah ATM TID-00123',
    content: 'Selamat pagi Pak Admin,\n\nMohon dicek untuk terminal TID-00123 karena sering offline sejak kemarin sore. Terima kasih.\n\nRegards,\nSiti',
    timestamp: new Date(Date.now() - 86400000).toISOString(),
    readBy: [],
    starredBy: [],
    isDraft: false,
    deletedBy: [], 
    attachments: [
      { name: 'log_error.txt', size: 1024, type: 'text/plain', content: 'data:text/plain;base64,TG9nIEVycm9yIERldGFpbHM6IENvbm5lY3Rpb24gVGltZW91dA==' },
      { name: 'screenshot_atm.jpg', size: 2048, type: 'image/jpeg', content: MOCK_PDF_CONTENT } 
    ]
  },
  {
    id: 'm2',
    senderId: '1', 
    senderName: 'Administrator',
    senderEmail: 'admin@problemlog.com',
    senderAvatar: 'https://ui-avatars.com/api/?name=Administrator&background=0ea5e9&color=fff',
    recipients: [{ id: '2', name: 'Siti Aminah', email: 'siti@problemlog.com' }],
    cc: [],
    subject: 'Re: Laporan Masalah ATM TID-00123',
    content: 'Halo Siti,\n\nBaik, tim teknisi akan segera meluncur ke lokasi siang ini. Tolong buatkan tiketnya.\n\nThanks.',
    timestamp: new Date(Date.now() - 43200000).toISOString(),
    readBy: ['2'],
    starredBy: ['2'],
    isDraft: false,
    deletedBy: []
  },
  {
     id: 'm3',
     senderId: '3',
     senderName: 'Joko Widodo',
     senderEmail: 'joko@problemlog.com',
     senderAvatar: 'https://ui-avatars.com/api/?name=Joko+Widodo&background=random',
     recipients: [{ id: '1', name: 'Administrator', email: 'admin@problemlog.com' }],
     cc: [{ id: '2', name: 'Siti Aminah', email: 'siti@problemlog.com' }],
     subject: 'Permintaan Replenish Cash',
     content: 'Dear All,\n\nMohon approval untuk jadwal replenish besok di area Jakarta Selatan.\n\nTerima kasih.',
     timestamp: new Date(Date.now() - 3600000).toISOString(),
     readBy: [],
     starredBy: [],
     isDraft: false,
     deletedBy: [],
     attachments: [
       { name: 'jadwal_replenish.pdf', size: 5000, type: 'application/pdf', content: MOCK_PDF_CONTENT }
     ]
  }
];

// Helper aman untuk cek deleted status
const isDeletedForUser = (mail: Mail, userId: string): boolean => {
  if (!mail.deletedBy || !Array.isArray(mail.deletedBy)) {
    return false; 
  }
  return mail.deletedBy.includes(userId);
};

export const getInbox = async (userId: string): Promise<Mail[]> => {
  await new Promise(resolve => setTimeout(resolve, 300));
  return MOCK_MAILS_DB.filter(mail => 
    !mail.isDraft && 
    !isDeletedForUser(mail, userId) &&
    (mail.recipients.some(r => r.id === userId) || mail.cc.some(c => c.id === userId))
  ).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
};

export const getSentBox = async (userId: string): Promise<Mail[]> => {
  await new Promise(resolve => setTimeout(resolve, 300));
  return MOCK_MAILS_DB.filter(mail => 
    !mail.isDraft && 
    !isDeletedForUser(mail, userId) && 
    mail.senderId === userId
  ).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
};

export const getDrafts = async (userId: string): Promise<Mail[]> => {
  await new Promise(resolve => setTimeout(resolve, 300));
  return MOCK_MAILS_DB.filter(mail => 
    mail.isDraft && 
    !isDeletedForUser(mail, userId) && 
    mail.senderId === userId
  ).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
};

export const getDeletedMails = async (): Promise<Mail[]> => {
  await new Promise(resolve => setTimeout(resolve, 300));
  return MOCK_MAILS_DB.filter(mail => 
    mail.deletedBy && Array.isArray(mail.deletedBy) && mail.deletedBy.length > 0
  ).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
};

export const sendMail = async (
  sender: User,
  recipients: MailRecipient[],
  cc: MailRecipient[],
  subject: string,
  content: string,
  attachments: MailAttachment[] = [],
  originalDraftId?: string
): Promise<Mail> => {
  await new Promise(resolve => setTimeout(resolve, 400));

  if (originalDraftId) {
    const draftIndex = MOCK_MAILS_DB.findIndex(m => m.id === originalDraftId);
    if (draftIndex > -1) {
      MOCK_MAILS_DB[draftIndex] = {
        ...MOCK_MAILS_DB[draftIndex],
        recipients,
        cc,
        subject,
        content,
        attachments,
        timestamp: new Date().toISOString(),
        readBy: [sender.id],
        isDraft: false,
        deletedBy: [] 
      };
      return MOCK_MAILS_DB[draftIndex];
    }
  }

  const newMail: Mail = {
    id: `m${Date.now()}`,
    senderId: sender.id,
    senderName: sender.name,
    senderEmail: sender.email,
    senderAvatar: sender.avatar,
    recipients,
    cc,
    subject,
    content,
    timestamp: new Date().toISOString(),
    readBy: [sender.id],
    starredBy: [],
    isDraft: false,
    deletedBy: [],
    attachments
  };

  MOCK_MAILS_DB.push(newMail);
  return newMail;
};

export const saveDraft = async (
  sender: User,
  recipients: MailRecipient[],
  cc: MailRecipient[],
  subject: string,
  content: string,
  attachments: MailAttachment[] = [],
  existingDraftId?: string
): Promise<Mail> => {
  await new Promise(resolve => setTimeout(resolve, 300));

  if (existingDraftId) {
    const idx = MOCK_MAILS_DB.findIndex(m => m.id === existingDraftId);
    if (idx > -1) {
      MOCK_MAILS_DB[idx] = {
        ...MOCK_MAILS_DB[idx],
        recipients,
        cc,
        subject: subject || '(No Subject)',
        content,
        attachments,
        timestamp: new Date().toISOString(),
        deletedBy: []
      };
      return MOCK_MAILS_DB[idx];
    }
  }

  const newDraft: Mail = {
    id: `d${Date.now()}`,
    senderId: sender.id,
    senderName: sender.name,
    senderEmail: sender.email,
    senderAvatar: sender.avatar,
    recipients,
    cc,
    subject: subject || '(No Subject)',
    content,
    timestamp: new Date().toISOString(),
    readBy: [],
    starredBy: [],
    isDraft: true,
    deletedBy: [],
    attachments
  };

  MOCK_MAILS_DB.push(newDraft);
  return newDraft;
};

export const deleteMail = async (mailId: string, userId: string): Promise<boolean> => {
  // Sync delay
  await new Promise(resolve => setTimeout(resolve, 200)); 
  
  const index = MOCK_MAILS_DB.findIndex(m => m.id === mailId);
  
  if (index > -1) {
    // Pastikan array terinisialisasi
    if (!MOCK_MAILS_DB[index].deletedBy) {
      MOCK_MAILS_DB[index].deletedBy = [];
    }

    if (!MOCK_MAILS_DB[index].deletedBy.includes(userId)) {
      // Mutasi langsung ke object di memori
      MOCK_MAILS_DB[index].deletedBy.push(userId);
    }
    return true;
  }
  return false;
};

export const restoreMail = async (mailId: string): Promise<boolean> => {
  await new Promise(resolve => setTimeout(resolve, 300));
  const index = MOCK_MAILS_DB.findIndex(m => m.id === mailId);
  if (index > -1) {
    MOCK_MAILS_DB[index].deletedBy = [];
    return true;
  }
  return false;
};

export const markAsRead = async (mailId: string, userId: string): Promise<void> => {
  const mailIndex = MOCK_MAILS_DB.findIndex(m => m.id === mailId);
  if (mailIndex > -1) {
    if (!MOCK_MAILS_DB[mailIndex].readBy.includes(userId)) {
      MOCK_MAILS_DB[mailIndex].readBy.push(userId);
    }
  }
};

export const markAsUnread = async (mailId: string, userId: string): Promise<void> => {
  const mailIndex = MOCK_MAILS_DB.findIndex(m => m.id === mailId);
  if (mailIndex > -1) {
    MOCK_MAILS_DB[mailIndex].readBy = MOCK_MAILS_DB[mailIndex].readBy.filter(id => id !== userId);
  }
};

export const toggleStar = async (mailId: string, userId: string): Promise<void> => {
  const mailIndex = MOCK_MAILS_DB.findIndex(m => m.id === mailId);
  if (mailIndex > -1) {
    const isStarred = MOCK_MAILS_DB[mailIndex].starredBy.includes(userId);
    if (isStarred) {
      MOCK_MAILS_DB[mailIndex].starredBy = MOCK_MAILS_DB[mailIndex].starredBy.filter(id => id !== userId);
    } else {
      MOCK_MAILS_DB[mailIndex].starredBy.push(userId);
    }
  }
};

export const getUnreadCount = async (userId: string): Promise<number> => {
  const inbox = MOCK_MAILS_DB.filter(mail => 
    !mail.isDraft &&
    !isDeletedForUser(mail, userId) &&
    (mail.recipients.some(r => r.id === userId) || mail.cc.some(c => c.id === userId))
  );
  return inbox.filter(mail => !mail.readBy.includes(userId)).length;
};

export const getDraftCount = async (userId: string): Promise<number> => {
  return MOCK_MAILS_DB.filter(mail => 
    mail.isDraft && 
    !isDeletedForUser(mail, userId) && 
    mail.senderId === userId
  ).length;
};