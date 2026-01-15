import React, { useState, useEffect, useCallback, useRef } from 'react';
import { User, Mail, MailRecipient, MailAttachment } from '../types';
import { 
  getInbox, getSentBox, getDrafts, getDeletedMails, 
  sendMail, saveDraft, deleteMail, restoreMail, 
  markAsRead, markAsUnread, toggleStar, getUnreadCount, getDraftCount 
} from '../services/mailService';
import { getUsers } from '../services/userService';
import { logActivity } from '../services/activityService';
import { 
  Mail as MailIcon, Inbox, Send, File, Trash2, Plus, Search, Star, 
  Paperclip, Download, ChevronLeft, Reply, RefreshCcw, X, Loader2, 
  MailOpen, FileText, CheckCircle, AlertCircle, Users, Check
} from 'lucide-react';

interface MailSystemProps {
  currentUser: User;
}

type Tab = 'INBOX' | 'SENT' | 'DRAFTS' | 'TRASH';

export const MailSystem: React.FC<MailSystemProps> = ({ currentUser }) => {
  const [activeTab, setActiveTab] = useState<Tab>('INBOX');
  const [mails, setMails] = useState<Mail[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMail, setSelectedMail] = useState<Mail | null>(null);
  const [counts, setCounts] = useState({ unread: 0, drafts: 0 });
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);

  // Compose State
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [composeRecipients, setComposeRecipients] = useState<string[]>([]); // User IDs
  const [composeCc, setComposeCc] = useState<string[]>([]); // User IDs
  const [composeSubject, setComposeSubject] = useState('');
  const [composeContent, setComposeContent] = useState('');
  const [composeAttachments, setComposeAttachments] = useState<MailAttachment[]>([]);
  const [currentDraftId, setCurrentDraftId] = useState<string | undefined>(undefined);
  const [sending, setSending] = useState(false);

  // Recipient Modal State
  const [showRecipientModal, setShowRecipientModal] = useState<'TO' | 'CC' | null>(null);
  const [recipientSearchTerm, setRecipientSearchTerm] = useState('');

  // Custom Confirm Dialog State
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    type: 'DELETE' | 'RESTORE';
    mailId: string;
    title: string;
    message: string;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initial Data Load
  useEffect(() => {
    const loadUsers = async () => {
      const users = await getUsers();
      setAvailableUsers(users.filter(u => u.id !== currentUser.id));
    };
    loadUsers();
  }, [currentUser.id]);

  const loadCounts = useCallback(async () => {
    const unread = await getUnreadCount(currentUser.id);
    const drafts = await getDraftCount(currentUser.id);
    setCounts({ unread, drafts });
  }, [currentUser.id]);

  const fetchMails = useCallback(async () => {
    setLoading(true);
    try {
      let data: Mail[] = [];
      switch (activeTab) {
        case 'INBOX': data = await getInbox(currentUser.id); break;
        case 'SENT': data = await getSentBox(currentUser.id); break;
        case 'DRAFTS': data = await getDrafts(currentUser.id); break;
        case 'TRASH': data = await getDeletedMails(); break; 
      }
      
      if (searchTerm) {
        const lower = searchTerm.toLowerCase();
        data = data.filter(m => 
          m.subject.toLowerCase().includes(lower) || 
          m.content.toLowerCase().includes(lower) ||
          m.senderName.toLowerCase().includes(lower)
        );
      }
      setMails(data);
    } finally {
      setLoading(false);
    }
  }, [activeTab, currentUser.id, searchTerm]);

  useEffect(() => {
    fetchMails();
    loadCounts();
    const interval = setInterval(loadCounts, 10000);
    return () => clearInterval(interval);
  }, [fetchMails, loadCounts]);

  useEffect(() => {
    // Reset selection when tab changes
    setSelectedMail(null);
  }, [activeTab]);

  // Handlers
  const handleSelectMail = async (mail: Mail) => {
    if (activeTab === 'DRAFTS') {
      openCompose(mail);
      return;
    }

    setSelectedMail(mail);
    
    if (activeTab === 'INBOX' && !mail.readBy.includes(currentUser.id)) {
      await markAsRead(mail.id, currentUser.id);
      loadCounts();
      setMails(prev => prev.map(m => m.id === mail.id ? { ...m, readBy: [...m.readBy, currentUser.id] } : m));
    }
  };

  const openCompose = (draft?: Mail) => {
    if (draft) {
      setComposeRecipients(draft.recipients.map(r => r.id));
      setComposeCc(draft.cc.map(c => c.id));
      setComposeSubject(draft.subject);
      setComposeContent(draft.content);
      setComposeAttachments(draft.attachments || []);
      setCurrentDraftId(draft.id);
    } else {
      setComposeRecipients([]);
      setComposeCc([]);
      setComposeSubject('');
      setComposeContent('');
      setComposeAttachments([]);
      setCurrentDraftId(undefined);
    }
    setIsComposeOpen(true);
  };

  const handleReply = (mail: Mail) => {
    setComposeRecipients([mail.senderId]);
    setComposeCc([]);
    setComposeSubject(`Re: ${mail.subject}`);
    setComposeContent(`\n\n\n------------------------------\nPada ${formatTime(mail.timestamp)}, ${mail.senderName} menulis:\n\n${mail.content}`);
    setComposeAttachments([]);
    setCurrentDraftId(undefined);
    setIsComposeOpen(true);
  };

  const handleDeleteMail = (e: React.MouseEvent, mailId: string) => {
    e.stopPropagation();
    setConfirmDialog({
      isOpen: true,
      type: 'DELETE',
      mailId,
      title: activeTab === 'TRASH' ? 'Hapus Permanen' : 'Hapus Pesan',
      message: activeTab === 'TRASH' 
        ? 'Apakah Anda yakin ingin menghapus pesan ini secara permanen? Tindakan ini tidak dapat dibatalkan.' 
        : 'Pesan akan dipindahkan ke Sampah. Lanjutkan?'
    });
  };

  const handleRestoreMail = (e: React.MouseEvent, mailId: string) => {
    e.stopPropagation();
    setConfirmDialog({
      isOpen: true,
      type: 'RESTORE',
      mailId,
      title: 'Kembalikan Pesan',
      message: 'Pesan akan dikembalikan ke Kotak Masuk/Terkirim.'
    });
  };

  const processConfirmation = async () => {
    if (!confirmDialog) return;
    const { type, mailId } = confirmDialog;
    
    setConfirmDialog(null);

    if (selectedMail?.id === mailId) setSelectedMail(null);

    if (type === 'DELETE') {
      await deleteMail(mailId, currentUser.id);
      logActivity(currentUser, 'DELETE', 'Mail', `Deleted mail ${mailId}`);
    } else {
      await restoreMail(mailId);
    }
    
    fetchMails();
    loadCounts();
  };

  const handleMarkUnread = async (e: React.MouseEvent, mail: Mail) => {
    e.stopPropagation();
    await markAsUnread(mail.id, currentUser.id);
    loadCounts();
    setMails(prev => prev.map(m => m.id === mail.id ? { ...m, readBy: m.readBy.filter(id => id !== currentUser.id) } : m));
    if (selectedMail?.id === mail.id) setSelectedMail(null);
  };

  const handleStar = async (e: React.MouseEvent, mail: Mail) => {
    e.stopPropagation();
    await toggleStar(mail.id, currentUser.id);
    setMails(prev => prev.map(m => {
       if (m.id === mail.id) {
         const isStarred = m.starredBy.includes(currentUser.id);
         return {
           ...m,
           starredBy: isStarred ? m.starredBy.filter(id => id !== currentUser.id) : [...m.starredBy, currentUser.id]
         };
       }
       return m;
    }));
  };

  const handleSend = async () => {
    if (composeRecipients.length === 0) return alert('Harap pilih setidaknya satu penerima.');
    
    setSending(true);
    try {
      const recipients: MailRecipient[] = availableUsers
        .filter(u => composeRecipients.includes(u.id))
        .map(u => ({ id: u.id, name: u.name, email: u.email }));
      
      const cc: MailRecipient[] = availableUsers
        .filter(u => composeCc.includes(u.id))
        .map(u => ({ id: u.id, name: u.name, email: u.email }));

      await sendMail(currentUser, recipients, cc, composeSubject, composeContent, composeAttachments, currentDraftId);
      logActivity(currentUser, 'CREATE', 'Mail', `Sent mail to ${recipients.map(r=>r.name).join(', ')}`);
      
      setIsComposeOpen(false);
      fetchMails();
      loadCounts();
    } finally {
      setSending(false);
    }
  };

  const handleSaveDraft = async () => {
    if (!composeSubject && !composeContent && composeRecipients.length === 0) {
      setIsComposeOpen(false);
      return;
    }

    const recipients: MailRecipient[] = availableUsers
        .filter(u => composeRecipients.includes(u.id))
        .map(u => ({ id: u.id, name: u.name, email: u.email }));
      
    const cc: MailRecipient[] = availableUsers
      .filter(u => composeCc.includes(u.id))
      .map(u => ({ id: u.id, name: u.name, email: u.email }));
    
    await saveDraft(currentUser, recipients, cc, composeSubject, composeContent, composeAttachments, currentDraftId);
    setIsComposeOpen(false);
    fetchMails(); 
    loadCounts();
  };

  const handleAttachment = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        setComposeAttachments(prev => [...prev, {
          name: file.name,
          size: file.size,
          type: file.type,
          content: base64
        }]);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeAttachment = (index: number) => {
    setComposeAttachments(prev => prev.filter((_, i) => i !== index));
  };

  // Recipient Helpers
  const toggleRecipient = (userId: string, type: 'TO' | 'CC') => {
    const targetSet = type === 'TO' ? composeRecipients : composeCc;
    const setTarget = type === 'TO' ? setComposeRecipients : setComposeCc;

    if (targetSet.includes(userId)) {
      setTarget(prev => prev.filter(id => id !== userId));
    } else {
      setTarget(prev => [...prev, userId]);
    }
  };

  // Helpers
  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    if (isToday) return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const renderReadMail = () => {
    if (!selectedMail) return null;
    return (
      <div className="flex-1 flex flex-col h-full bg-slate-50 animate-fade-in overflow-hidden relative">
        {/* Header Read */}
        <div className="h-20 border-b border-slate-200 flex items-center px-4 md:px-8 bg-white shrink-0 gap-4 shadow-sm z-10 sticky top-0">
          <button 
            onClick={() => setSelectedMail(null)} 
            className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors border border-transparent hover:border-slate-200"
          >
            <ChevronLeft size={22} />
          </button>
          <div className="flex-1 min-w-0">
             <h2 className="text-lg font-bold text-slate-800 truncate" title={selectedMail.subject}>
              {selectedMail.subject || '(Tanpa Subjek)'}
            </h2>
          </div>
          <div className="flex gap-2">
            {activeTab !== 'SENT' && activeTab !== 'TRASH' && (
              <button 
                 type="button"
                 onClick={(e) => handleMarkUnread(e, selectedMail)}
                 className="p-2.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 border border-transparent hover:border-blue-100 rounded-lg transition-all"
                 title="Tandai Belum Dibaca"
              >
                 <MailOpen size={18} />
              </button>
            )}
            
            {activeTab !== 'TRASH' && activeTab !== 'SENT' && (
              <button 
                type="button"
                onClick={() => handleReply(selectedMail)}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 text-slate-700 font-medium hover:bg-slate-50 hover:text-blue-600 hover:border-blue-300 rounded-lg transition-all shadow-sm"
              >
                <Reply size={18} />
                <span className="hidden sm:inline">Balas</span>
              </button>
            )}

            {activeTab === 'TRASH' ? (
                <button 
                   type="button"
                   onClick={(e) => handleRestoreMail(e, selectedMail.id)}
                   className="flex items-center gap-2 px-4 py-2 bg-white border border-green-200 text-green-700 font-medium hover:bg-green-50 rounded-lg transition-all shadow-sm"
                   title="Kembalikan Pesan"
                >
                  <RefreshCcw size={18} />
                  <span>Pulihkan</span>
                </button>
            ) : (
                <button 
                   type="button"
                   onClick={(e) => handleDeleteMail(e, selectedMail.id)}
                   className="p-2.5 text-slate-500 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-100 rounded-lg transition-all" title="Hapus"
                >
                  <Trash2 size={18} />
                </button>
            )}
          </div>
        </div>

        {/* Content Read */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8">
           <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden relative">
             {activeTab === 'TRASH' && (
               <div className="bg-red-50 p-3 text-center text-red-700 text-sm font-bold border-b border-red-100">
                 Pesan ini berada di Dump Mail.
               </div>
             )}
             <div className="p-6 border-b border-slate-100 bg-slate-50/50">
               <div className="flex items-start gap-4">
                  <img src={selectedMail.senderAvatar} className="w-14 h-14 rounded-full border-2 border-white shadow-sm" alt="" />
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start flex-wrap gap-2">
                       <div>
                         <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                           {selectedMail.senderName}
                           {selectedMail.starredBy.includes(currentUser.id) && <Star size={16} className="text-amber-400 fill-amber-400" />}
                         </h3>
                         <p className="text-sm text-slate-500 font-medium">&lt;{selectedMail.senderEmail}&gt;</p>
                       </div>
                       <span className="text-xs text-slate-500 bg-white border border-slate-200 px-3 py-1 rounded-full font-medium">
                         {formatTime(selectedMail.timestamp)}
                       </span>
                    </div>
                    
                    <div className="mt-3 text-sm text-slate-600 space-y-1 bg-white p-3 rounded-lg border border-slate-100 inline-block w-full">
                      <div className="flex gap-2">
                        <span className="font-semibold text-slate-400 w-16 text-right shrink-0">Kepada:</span>
                        <div className="flex flex-wrap gap-1">
                          {selectedMail.recipients.map((r, i) => (
                            <span key={i} className="text-slate-700 font-medium">
                              {r.name}{i < selectedMail.recipients.length - 1 ? ',' : ''}
                            </span>
                          ))}
                        </div>
                      </div>
                      {selectedMail.cc.length > 0 && (
                        <div className="flex gap-2">
                          <span className="font-semibold text-slate-400 w-16 text-right shrink-0">CC:</span>
                          <div className="flex flex-wrap gap-1">
                            {selectedMail.cc.map((c, i) => (
                              <span key={i} className="text-slate-600">
                                {c.name}{i < selectedMail.cc.length - 1 ? ',' : ''}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
               </div>
             </div>
             <div className="p-8 min-h-[300px]">
               <div className="prose prose-slate max-w-none text-slate-800 whitespace-pre-wrap leading-7 text-sm md:text-base font-sans">
                 {selectedMail.content}
               </div>
             </div>
             {selectedMail.attachments && selectedMail.attachments.length > 0 && (
                <div className="p-6 border-t border-slate-100 bg-slate-50">
                  <h4 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                     <Paperclip size={16} /> Lampiran ({selectedMail.attachments.length})
                  </h4>
                  <div className="flex flex-wrap gap-3">
                     {selectedMail.attachments.map((file, idx) => (
                        <a 
                           key={idx} 
                           href={file.content} 
                           download={file.name}
                           className="flex items-center gap-3 bg-white border border-slate-200 p-3 rounded-lg hover:border-blue-300 hover:shadow-md transition-all cursor-pointer group w-full sm:w-auto text-decoration-none"
                        >
                           <div className="bg-blue-100 text-blue-600 p-2.5 rounded-lg">
                              <FileText size={20} />
                           </div>
                           <div className="overflow-hidden">
                              <p className="text-sm font-bold text-slate-700 truncate max-w-[150px]">{file.name}</p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-[10px] text-slate-400 bg-slate-100 px-1.5 rounded">{formatFileSize(file.size)}</span>
                                <span className="text-xs text-blue-600 font-semibold group-hover:underline flex items-center gap-1">
                                  <Download size={10} /> Download
                                </span>
                              </div>
                           </div>
                        </a>
                     ))}
                  </div>
                </div>
             )}
           </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-[calc(100vh-64px)] -m-4 md:-m-8 bg-white overflow-hidden relative">
       {/* Sidebar */}
       <div className="w-20 md:w-64 border-r border-slate-200 flex flex-col bg-slate-50">
          <div className="p-4 md:p-6">
             <button 
               onClick={() => openCompose()}
               className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-3 px-4 flex items-center justify-center gap-2 shadow-lg shadow-blue-500/30 transition-all active:scale-95"
             >
                <Plus size={20} />
                <span className="hidden md:inline font-bold">Tulis Pesan</span>
             </button>
          </div>

          <nav className="flex-1 space-y-1 px-3">
             <button 
               onClick={() => setActiveTab('INBOX')}
               className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeTab === 'INBOX' ? 'bg-blue-100 text-blue-700' : 'text-slate-600 hover:bg-slate-200/50'}`}
             >
                <Inbox size={18} />
                <span className="hidden md:inline flex-1 text-left">Kotak Masuk</span>
                {counts.unread > 0 && <span className="text-xs font-bold bg-red-500 text-white px-2 py-0.5 rounded-full">{counts.unread}</span>}
             </button>
             <button 
               onClick={() => setActiveTab('SENT')}
               className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeTab === 'SENT' ? 'bg-blue-100 text-blue-700' : 'text-slate-600 hover:bg-slate-200/50'}`}
             >
                <Send size={18} />
                <span className="hidden md:inline flex-1 text-left">Terkirim</span>
             </button>
             <button 
               onClick={() => setActiveTab('DRAFTS')}
               className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeTab === 'DRAFTS' ? 'bg-blue-100 text-blue-700' : 'text-slate-600 hover:bg-slate-200/50'}`}
             >
                <File size={18} />
                <span className="hidden md:inline flex-1 text-left">Draf</span>
                {counts.drafts > 0 && <span className="text-xs font-bold bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full">{counts.drafts}</span>}
             </button>
             <button 
               onClick={() => setActiveTab('TRASH')}
               className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeTab === 'TRASH' ? 'bg-blue-100 text-blue-700' : 'text-slate-600 hover:bg-slate-200/50'}`}
             >
                <Trash2 size={18} />
                <span className="hidden md:inline flex-1 text-left">Sampah</span>
             </button>
          </nav>
       </div>

       {/* Mail List */}
       <div className={`${selectedMail ? 'hidden lg:flex' : 'flex'} flex-col w-full lg:w-96 border-r border-slate-200 bg-white`}>
          <div className="p-4 border-b border-slate-100">
             <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input 
                  type="text" 
                  placeholder="Cari pesan..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-100 border-none rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none text-slate-700 placeholder:text-slate-400"
                />
             </div>
          </div>
          
          <div className="flex-1 overflow-y-auto">
             {loading ? (
                <div className="flex justify-center items-center h-40">
                   <Loader2 className="animate-spin text-blue-500" />
                </div>
             ) : mails.length === 0 ? (
                <div className="text-center p-8 text-slate-400 text-sm">
                   Tidak ada pesan.
                </div>
             ) : (
                <div className="divide-y divide-slate-50">
                  {mails.map(mail => (
                    <div 
                      key={mail.id}
                      onClick={() => handleSelectMail(mail)}
                      className={`p-4 cursor-pointer hover:bg-slate-50 transition-colors ${selectedMail?.id === mail.id ? 'bg-blue-50 hover:bg-blue-50' : ''} ${activeTab === 'INBOX' && !mail.readBy.includes(currentUser.id) ? 'bg-white' : 'bg-slate-50/30'}`}
                    >
                       <div className="flex justify-between items-start mb-1">
                          <h4 className={`text-sm truncate pr-2 ${activeTab === 'INBOX' && !mail.readBy.includes(currentUser.id) ? 'font-bold text-slate-900' : 'font-medium text-slate-700'}`}>
                            {activeTab === 'SENT' ? `Kepada: ${mail.recipients[0]?.name}` : mail.senderName}
                          </h4>
                          <span className="text-[10px] text-slate-400 whitespace-nowrap">{formatTime(mail.timestamp)}</span>
                       </div>
                       <div className="flex items-center justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className={`text-xs truncate ${activeTab === 'INBOX' && !mail.readBy.includes(currentUser.id) ? 'font-bold text-slate-800' : 'text-slate-600'}`}>
                                {mail.subject || '(Tanpa Subjek)'}
                            </p>
                            <p className="text-[11px] text-slate-400 truncate mt-0.5">
                                {mail.content.replace(/\n/g, ' ')}
                            </p>
                          </div>
                          <button onClick={(e) => handleStar(e, mail)} className="text-slate-300 hover:text-amber-400 transition-colors">
                             <Star size={16} className={mail.starredBy.includes(currentUser.id) ? 'fill-amber-400 text-amber-400' : ''} />
                          </button>
                       </div>
                    </div>
                  ))}
                </div>
             )}
          </div>
       </div>

       {/* Reading Pane */}
       {selectedMail ? (
          renderReadMail()
       ) : (
          <div className="hidden lg:flex flex-1 flex-col items-center justify-center text-slate-300 bg-slate-50/50">
             <MailIcon size={64} className="mb-4 text-slate-200" />
             <p className="text-lg font-medium text-slate-400">Pilih pesan untuk membaca</p>
          </div>
       )}

       {/* Compose Modal */}
       {isComposeOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={() => handleSaveDraft()}></div>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl relative z-10 flex flex-col max-h-[90vh] animate-fade-in-up">
             
             {/* Header */}
             <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-white rounded-t-xl">
               <h3 className="text-lg font-bold text-slate-800">Pesan Baru</h3>
               <div className="flex gap-2">
                  <button onClick={() => handleSaveDraft()} className="text-slate-400 hover:text-slate-600 p-1">
                    <X size={20} />
                  </button>
               </div>
             </div>

             {/* Form */}
             <div className="p-6 overflow-y-auto space-y-5">
                
                {/* TO Field */}
                <div className="space-y-2">
                   <div className="flex justify-between items-center">
                     <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Kepada:</label>
                     <button 
                        type="button" 
                        onClick={() => { setShowRecipientModal('TO'); setRecipientSearchTerm(''); }}
                        className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 bg-blue-50 px-2 py-1 rounded-md"
                     >
                       <Plus size={12} /> Tambah Penerima
                     </button>
                   </div>
                   <div className="w-full min-h-[42px] border border-slate-300 rounded-lg p-2 bg-slate-50 focus-within:ring-2 focus-within:ring-blue-100 focus-within:border-blue-400 transition-all flex flex-wrap gap-2">
                      {composeRecipients.length === 0 && <span className="text-sm text-slate-400 py-1 px-1">Belum ada penerima...</span>}
                      {availableUsers.filter(u => composeRecipients.includes(u.id)).map(u => (
                        <div key={u.id} className="flex items-center gap-1.5 bg-white border border-slate-200 pl-1.5 pr-2 py-1 rounded-full shadow-sm group animate-fade-in">
                          <img src={u.avatar} className="w-5 h-5 rounded-full" />
                          <span className="text-xs font-medium text-slate-700">{u.name}</span>
                          <button onClick={() => toggleRecipient(u.id, 'TO')} className="text-slate-400 hover:text-red-500 transition-colors">
                            <X size={12} />
                          </button>
                        </div>
                      ))}
                   </div>
                </div>
                
                {/* CC Field */}
                <div className="space-y-2">
                   <div className="flex justify-between items-center">
                     <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">CC:</label>
                     <button 
                        type="button" 
                        onClick={() => { setShowRecipientModal('CC'); setRecipientSearchTerm(''); }}
                        className="text-xs font-bold text-slate-500 hover:text-slate-700 flex items-center gap-1 bg-slate-100 px-2 py-1 rounded-md"
                     >
                       <Plus size={12} /> Tambah CC
                     </button>
                   </div>
                   <div className="w-full min-h-[42px] border border-slate-300 rounded-lg p-2 bg-slate-50 focus-within:ring-2 focus-within:ring-blue-100 focus-within:border-blue-400 transition-all flex flex-wrap gap-2">
                      {composeCc.length === 0 && <span className="text-sm text-slate-400 py-1 px-1">Belum ada CC...</span>}
                      {availableUsers.filter(u => composeCc.includes(u.id)).map(u => (
                        <div key={u.id} className="flex items-center gap-1.5 bg-slate-100 border border-slate-200 pl-1.5 pr-2 py-1 rounded-full group animate-fade-in">
                          <div className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-500">{u.name.charAt(0)}</div>
                          <span className="text-xs font-medium text-slate-600">{u.name}</span>
                          <button onClick={() => toggleRecipient(u.id, 'CC')} className="text-slate-400 hover:text-red-500 transition-colors">
                            <X size={12} />
                          </button>
                        </div>
                      ))}
                   </div>
                </div>

                <div className="space-y-2">
                   <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Subjek</label>
                   <input 
                     type="text" 
                     placeholder="Masukkan subjek pesan..." 
                     value={composeSubject} 
                     onChange={(e) => setComposeSubject(e.target.value)}
                     className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm font-medium focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none placeholder:font-normal bg-slate-50 focus:bg-white transition-all text-slate-700 placeholder:text-slate-400"
                   />
                </div>

                <div className="h-64 flex flex-col space-y-2">
                   <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Pesan</label>
                   <textarea 
                     className="w-full flex-1 resize-none border border-slate-300 rounded-lg p-4 text-sm outline-none text-slate-700 leading-relaxed bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all placeholder:text-slate-400" 
                     placeholder="Tulis pesan Anda di sini..."
                     value={composeContent}
                     onChange={(e) => setComposeContent(e.target.value)}
                   ></textarea>
                </div>

                {/* Attachments */}
                <div>
                   {composeAttachments.length > 0 && (
                     <div className="flex flex-wrap gap-2 mb-3">
                        {composeAttachments.map((att, i) => (
                           <div key={i} className="flex items-center gap-2 bg-blue-50 px-3 py-1.5 rounded-lg text-sm border border-blue-100 text-blue-800">
                              <span className="truncate max-w-[150px] font-medium">{att.name}</span>
                              <button onClick={() => removeAttachment(i)} className="text-blue-400 hover:text-red-500"><X size={14} /></button>
                           </div>
                        ))}
                     </div>
                   )}
                   <input 
                      type="file" 
                      ref={fileInputRef} 
                      className="hidden" 
                      onChange={handleAttachment} 
                   />
                   <button 
                     type="button" 
                     onClick={() => fileInputRef.current?.click()}
                     className="text-slate-500 hover:text-blue-600 text-sm font-medium flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed border-slate-300 hover:border-blue-400 hover:bg-blue-50 transition-all w-full justify-center"
                   >
                      <Paperclip size={16} /> Lampirkan File (Maks 10MB)
                   </button>
                </div>
             </div>

             {/* Footer */}
             <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-between items-center rounded-b-xl">
               <button onClick={() => handleSaveDraft()} className="text-slate-500 hover:text-slate-700 text-sm font-medium px-4">Simpan Draf</button>
               <button 
                 onClick={handleSend}
                 disabled={sending}
                 className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-bold flex items-center gap-2 shadow-lg shadow-blue-500/20 disabled:opacity-70 active:scale-95 transition-all text-sm"
               >
                 {sending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                 Kirim Pesan
               </button>
             </div>
          </div>
        </div>
       )}

       {/* USER SELECTION MODAL */}
       {showRecipientModal && (
         <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
           <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={() => setShowRecipientModal(null)}></div>
           <div className="bg-white rounded-xl shadow-2xl w-full max-w-md relative z-10 flex flex-col max-h-[80vh] animate-fade-in-up">
              <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-white rounded-t-xl">
                 <h3 className="font-bold text-slate-800">Pilih Pengguna ({showRecipientModal})</h3>
                 <button onClick={() => setShowRecipientModal(null)}><X size={20} className="text-slate-400" /></button>
              </div>
              <div className="p-3 bg-slate-50 border-b border-slate-100">
                 <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input 
                      type="text" 
                      placeholder="Cari pengguna..." 
                      className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-100 transition-all bg-white text-slate-700 placeholder:text-slate-400"
                      value={recipientSearchTerm}
                      onChange={(e) => setRecipientSearchTerm(e.target.value)}
                    />
                 </div>
              </div>
              <div className="flex-1 overflow-y-auto p-2">
                 {availableUsers
                    .filter(u => u.name.toLowerCase().includes(recipientSearchTerm.toLowerCase()) || u.email.toLowerCase().includes(recipientSearchTerm.toLowerCase()))
                    .map(u => {
                       const isSelected = showRecipientModal === 'TO' ? composeRecipients.includes(u.id) : composeCc.includes(u.id);
                       return (
                         <div 
                           key={u.id}
                           onClick={() => toggleRecipient(u.id, showRecipientModal)}
                           className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all border ${isSelected ? 'bg-blue-50 border-blue-200' : 'bg-white border-transparent hover:bg-slate-50'}`}
                         >
                            <div className={`w-5 h-5 rounded border flex items-center justify-center ${isSelected ? 'bg-blue-500 border-blue-500' : 'border-slate-300'}`}>
                               {isSelected && <Check size={14} className="text-white" />}
                            </div>
                            <img src={u.avatar} className="w-8 h-8 rounded-full border border-slate-200" />
                            <div className="flex-1 min-w-0">
                               <p className={`text-sm font-semibold truncate ${isSelected ? 'text-blue-700' : 'text-slate-700'}`}>{u.name}</p>
                               <p className="text-xs text-slate-500 truncate">{u.role}</p>
                            </div>
                         </div>
                       );
                    })}
              </div>
              <div className="p-3 border-t border-slate-100 flex justify-end">
                 <button onClick={() => setShowRecipientModal(null)} className="bg-slate-800 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-md hover:bg-slate-700 transition-colors">Selesai</button>
              </div>
           </div>
         </div>
       )}

       {/* CUSTOM CONFIRM DIALOG - Replaces native confirm() */}
       {confirmDialog && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={() => setConfirmDialog(null)}></div>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm relative z-10 p-6 animate-fade-in-up text-center">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${confirmDialog.type === 'DELETE' ? 'bg-red-100' : 'bg-green-100'}`}>
               {confirmDialog.type === 'DELETE' ? <Trash2 size={32} className="text-red-600" /> : <RefreshCcw size={32} className="text-green-600" />}
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-2">{confirmDialog.title}</h3>
            <p className="text-slate-500 mb-6 text-sm leading-relaxed">
              {confirmDialog.message}
            </p>
            <div className="flex justify-center gap-3">
               <button 
                 onClick={() => setConfirmDialog(null)}
                 className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors font-medium text-sm border border-slate-200"
               >
                 Batal
               </button>
               <button 
                 onClick={processConfirmation}
                 className={`px-4 py-2 text-white rounded-lg transition-colors font-medium text-sm flex items-center gap-2 shadow-lg ${confirmDialog.type === 'DELETE' ? 'bg-red-600 hover:bg-red-700 shadow-red-500/20' : 'bg-green-600 hover:bg-green-700 shadow-green-500/20'}`}
               >
                 {confirmDialog.type === 'DELETE' ? 'Ya, Hapus' : 'Ya, Kembalikan'}
               </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};