"use client";
import { useEffect, useState, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';

// --- PASTE YOUR KEYS HERE ---
const supabaseUrl = "https://ujbhfbpigvwkoygytvww.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVqYmhmYnBpZ3Z3a295Z3l0dnd3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUxODY2MTMsImV4cCI6MjA4MDc2MjYxM30.xleJuD1h9F85dLqWL6uMB_KedCmLh0-CRLikByUSaaE";
const supabase = createClient(supabaseUrl, supabaseKey);

// CONSTANTS
const GRACE_SCHOOLS = ['Group 1', 'Group 2', 'Group 3', 'Group 4', 'Group 5', 'Group 6'];
const CHURCH_BRANCHES = [
  'GWC_NSAWAM',
  'GWC_LEADERSHIP CITADEL',
  'GWC_KUTUNSE',
  'GWC_KUMASI',
  'GWC_KINTAMPO',
  'RWI',
  'Guest / Visitor'
];
const REG_FEE = 400;

// --- EMBEDDED ICONS ---
const IconWrapper = ({ children, className }: { children: React.ReactNode, className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>{children}</svg>
);
const Users = ({ className }: { className?: string }) => <IconWrapper className={className}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></IconWrapper>;
const Coins = ({ className }: { className?: string }) => <IconWrapper className={className}><circle cx="8" cy="8" r="6"/><path d="M18.09 10.37A6 6 0 1 1 10.34 18"/><path d="M7 6h1v4"/><path d="m16.71 13.88.7.71-2.82 2.82"/></IconWrapper>;
const CreditCard = ({ className }: { className?: string }) => <IconWrapper className={className}><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/></IconWrapper>;
const LogOut = ({ className }: { className?: string }) => <IconWrapper className={className}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></IconWrapper>;
const Search = ({ className }: { className?: string }) => <IconWrapper className={className}><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></IconWrapper>;
const Plus = ({ className }: { className?: string }) => <IconWrapper className={className}><path d="M5 12h14"/><path d="M12 5v14"/></IconWrapper>;
const FileText = ({ className }: { className?: string }) => <IconWrapper className={className}><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></IconWrapper>;
const Download = ({ className }: { className?: string }) => <IconWrapper className={className}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></IconWrapper>;
const CheckCircle = ({ className }: { className?: string }) => <IconWrapper className={className}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></IconWrapper>;
const AlertCircle = ({ className }: { className?: string }) => <IconWrapper className={className}><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></IconWrapper>;
const HomeIcon = ({ className }: { className?: string }) => <IconWrapper className={className}><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></IconWrapper>;
const User = ({ className }: { className?: string }) => <IconWrapper className={className}><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></IconWrapper>;
const Phone = ({ className }: { className?: string }) => <IconWrapper className={className}><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></IconWrapper>;
const Shirt = ({ className }: { className?: string }) => <IconWrapper className={className}><path d="M20.38 3.46 16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.47a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.47a2 2 0 0 0-1.34-2.23z"/></IconWrapper>;
const Lock = ({ className }: { className?: string }) => <IconWrapper className={className}><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></IconWrapper>;
const Clock = ({ className }: { className?: string }) => <IconWrapper className={className}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></IconWrapper>;
const Trash2 = ({ className }: { className?: string }) => <IconWrapper className={className}><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></IconWrapper>;
const AlertTriangle = ({ className }: { className?: string }) => <IconWrapper className={className}><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" x2="12" y1="9" y2="13"/><line x1="12" x2="12.01" y1="17" y2="17"/></IconWrapper>;
const MapPin = ({ className }: { className?: string }) => <IconWrapper className={className}><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></IconWrapper>;
const Filter = ({ className }: { className?: string }) => <IconWrapper className={className}><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></IconWrapper>;
const Edit = ({ className }: { className?: string }) => <IconWrapper className={className}><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></IconWrapper>;

// --- STYLES ---
const globalStyles = `
  input[type=number]::-webkit-inner-spin-button, 
  input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
  input[type=number] { -moz-appearance: textfield; }
  .custom-scrollbar::-webkit-scrollbar { width: 6px; }
  .custom-scrollbar::-webkit-scrollbar-track { background: rgba(255,255,255,0.05); }
  .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.2); border-radius: 10px; }
`;

function Toast({ msg, type, onClose }: { msg: string, type: 'success' | 'error' | 'warning', onClose: () => void }) {
  useEffect(() => { if (type !== 'warning') { const timer = setTimeout(onClose, 4000); return () => clearTimeout(timer); } }, [onClose, type]);
  const bgColors = { success: 'bg-emerald-600/90 border-emerald-500/50', error: 'bg-red-600/90 border-red-500/50', warning: 'bg-amber-500/90 border-amber-500/50' };
  const Icon = type === 'success' ? CheckCircle : AlertCircle;
  return (
    <div className={`fixed top-6 right-6 z-[100] pl-4 pr-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-top duration-300 text-white backdrop-blur-md border ${bgColors[type]}`}>
      <Icon className="w-6 h-6 opacity-80" />
      <div><h4 className="font-bold text-base capitalize tracking-wide">{type}</h4><p className="font-medium text-sm opacity-90">{msg}</p></div>
      <button onClick={onClose} className="ml-auto opacity-70 hover:opacity-100 font-bold text-xl">✕</button>
    </div>
  );
}

// --- DELETE CONFIRMATION MODAL ---
function DeleteConfirmationModal({ person, onConfirm, onCancel }: { person: any, onConfirm: () => void, onCancel: () => void }) {
    return (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in">
            <div className="bg-[#1e293b] border border-red-500/30 rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden text-center p-6 animate-in zoom-in-95">
                <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4 text-red-500">
                    <AlertTriangle className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Delete User?</h3>
                <p className="text-slate-400 text-sm mb-6">
                    Are you sure you want to remove <span className="text-white font-bold">{person.full_name}</span>? This action cannot be undone and will be logged.
                </p>
                <div className="flex gap-3">
                    <button onClick={onCancel} className="flex-1 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold transition-all">Cancel</button>
                    <button onClick={onConfirm} className="flex-1 py-3 bg-red-600 hover:bg-red-500 text-white rounded-xl font-bold shadow-lg shadow-red-900/30 transition-all">Yes, Delete</button>
                </div>
            </div>
        </div>
    );
}

// --- USER REPORT MODAL (WITH EDIT) ---
function UserReportModal({ person, logs, onClose, onUpdate }: { person: any, logs: any[], onClose: () => void, onUpdate: (updated: any) => void }) {
    const userLogs = logs.filter(log => (log.details && log.details.includes(person.full_name)) || (log.details && log.details.includes(person.phone_number)));
    const targetFee = REG_FEE; 
    const balance = targetFee - (person.amount_paid || 0);
    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState({ ...person });

    const handleSave = () => {
        onUpdate(editData);
        setIsEditing(false);
    };

    return (
        <div className="fixed inset-0 z-[75] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm animate-in fade-in">
            <div className="bg-[#1e293b] border border-white/10 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
                <div className="bg-gradient-to-r from-blue-900/50 to-indigo-900/50 p-6 border-b border-white/10 flex justify-between items-center shrink-0">
                    <div>
                        <h2 className="text-xl font-bold text-white">{isEditing ? 'Edit Profile' : 'Profile Details'}</h2>
                        <span className="text-indigo-300 text-xs font-bold uppercase tracking-wider">{person.full_name}</span>
                    </div>
                    <button onClick={onClose} className="bg-white/10 hover:bg-white/20 w-8 h-8 rounded-full text-white flex items-center justify-center">✕</button>
                </div>
                
                <div className="p-6 overflow-y-auto custom-scrollbar space-y-6">
                    <div className="bg-white/5 rounded-2xl p-4 border border-white/10 grid grid-cols-2 gap-4">
                        <div><p className="text-[10px] uppercase text-slate-400 font-bold mb-1">Grace Group</p><p className="text-white font-bold text-lg">{person.grace_school || 'Not Assigned'}</p></div>
                        <div><p className="text-[10px] uppercase text-slate-400 font-bold mb-1">Payment Status</p><p className={`font-bold text-lg ${balance <= 0 ? 'text-emerald-400' : 'text-amber-500'}`}>{balance <= 0 ? 'PAID' : `OWING ₵${balance}`}</p></div>
                        <div><p className="text-[10px] uppercase text-slate-400 font-bold mb-1">Total Paid</p><p className="text-white font-mono text-lg">₵{person.amount_paid || 0}</p></div>
                        <div>
                             <p className="text-[10px] uppercase text-slate-400 font-bold mb-1 flex items-center gap-2">
                                T-Shirt 
                                {!isEditing && <button onClick={() => setIsEditing(true)} className="text-indigo-400 hover:text-white"><Edit className="w-3 h-3" /></button>}
                             </p>
                             {isEditing ? (
                                <input type="text" className="bg-black/30 border border-white/10 rounded px-2 py-1 text-white text-sm w-full" value={editData.t_shirt || ''} onChange={e => setEditData({...editData, t_shirt: e.target.value})} placeholder="Size (Color) or leave empty" />
                             ) : (
                                <p className="text-white text-sm">{person.t_shirt || 'None'}</p>
                             )}
                        </div>
                    </div>

                    <div className="space-y-3 text-sm">
                        {isEditing ? (
                             <>
                                <div><label className="text-xs text-slate-400">Full Name</label><input type="text" className="w-full bg-black/30 border border-white/10 rounded px-3 py-2 text-white mt-1" value={editData.full_name} onChange={e => setEditData({...editData, full_name: e.target.value})} /></div>
                                <div><label className="text-xs text-slate-400">Phone</label><input type="text" className="w-full bg-black/30 border border-white/10 rounded px-3 py-2 text-white mt-1" value={editData.phone_number} onChange={e => setEditData({...editData, phone_number: e.target.value})} /></div>
                                <div><label className="text-xs text-slate-400">Branch</label>
                                    <select className="w-full bg-black/30 border border-white/10 rounded px-3 py-2 text-white mt-1" value={editData.branch} onChange={e => setEditData({...editData, branch: e.target.value})}>
                                        <option value="">Select Branch</option>
                                        {CHURCH_BRANCHES.map(b => <option key={b} value={b} className="bg-slate-900">{b}</option>)}
                                    </select>
                                </div>
                                <button onClick={handleSave} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-3 rounded-xl font-bold mt-2">Save Changes</button>
                             </>
                        ) : (
                            <>
                                <div className="flex justify-between border-b border-white/5 pb-2"><span className="text-slate-400">Branch</span><span className="text-white">{person.branch || 'Guest / Visitor'}</span></div>
                                <div className="flex justify-between border-b border-white/5 pb-2"><span className="text-slate-400">Location</span><span className="text-white">{person.location || '-'}</span></div>
                                <div className="flex justify-between border-b border-white/5 pb-2"><span className="text-slate-400">Phone</span><span className="text-white">{person.phone_number}</span></div>
                                <div className="flex justify-between border-b border-white/5 pb-2"><span className="text-slate-400">Contact Method</span><span className="text-white">{person.contact_type || '-'}</span></div>
                                <button onClick={() => setIsEditing(true)} className="w-full text-center text-xs text-indigo-400 hover:text-white mt-2 font-bold uppercase tracking-wider border border-indigo-500/30 rounded-lg py-2 hover:bg-indigo-500/10 transition-all">Edit Profile</button>
                            </>
                        )}
                    </div>

                    {!isEditing && (
                        <div>
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2"><Clock className="w-3 h-3"/> System Logs</h4>
                            <div className="space-y-2">
                                {userLogs.length === 0 ? <p className="text-slate-500 text-xs italic">No system logs found.</p> : userLogs.map((log, i) => (
                                    <div key={i} className="text-xs p-3 bg-black/20 rounded-lg border border-white/5">
                                        <div className="flex justify-between mb-1 text-slate-400">
                                            <span>{new Date(log.created_at).toLocaleDateString()}</span>
                                            <span className="text-[9px] uppercase border border-white/10 px-1 rounded">{log.action_type}</span>
                                        </div>
                                        <p className="text-slate-300">{log.details}</p>
                                        <p className="text-[10px] text-indigo-400 mt-2 flex items-center gap-1"><User className="w-3 h-3"/> {log.staff_email}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// --- DAILY AUDIT MODAL COMPONENT ---
function DailyAuditModal({ dailyAudit, todaysTotal, onClose }: { dailyAudit: any, todaysTotal: number, onClose: () => void }) {
    return (
        <div className="fixed inset-0 z-[75] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm animate-in fade-in">
            <div className="bg-[#1e293b] border border-white/10 rounded-3xl w-full max-w-lg shadow-2xl">
                <div className="bg-gradient-to-r from-emerald-900/50 to-teal-900/50 p-6 border-b border-white/10 flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-white">Daily Reconciliation</h2>
                    <button onClick={onClose} className="bg-white/10 hover:bg-white/20 w-8 h-8 rounded-full text-white">✕</button>
                </div>
                <div className="p-6 space-y-4">
                    <div className="bg-emerald-500/10 p-4 rounded-xl border border-emerald-500/30 text-center">
                        <p className="text-sm uppercase text-emerald-400 font-bold tracking-widest">Gross Revenue (Today)</p>
                        <p className="text-4xl font-extrabold text-white mt-1">₵{todaysTotal}</p>
                        <p className="text-xs text-slate-400 mt-2">{dailyAudit.count} transactions recorded today</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-black/30 p-4 rounded-xl border border-white/10 text-center"><p className="text-xs uppercase text-slate-400 font-bold mb-1">Cash Drawer</p><p className="text-2xl font-mono font-bold text-white">₵{dailyAudit.cash}</p></div>
                        <div className="bg-black/30 p-4 rounded-xl border border-white/10 text-center"><p className="text-xs uppercase text-slate-400 font-bold mb-1">MoMo Wallet</p><p className="text-2xl font-mono font-bold text-white">₵{dailyAudit.momo}</p></div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function Home() {
  const [session, setSession] = useState<any>(null);
  const [people, setPeople] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all'); 
  const [branchFilter, setBranchFilter] = useState(''); 
  const [isOnline, setIsOnline] = useState(true); 
  const [historyLogs, setHistoryLogs] = useState<any[]>([]);
  
  const [todaysTotal, setTodaysTotal] = useState(0);
  const [dailyAudit, setDailyAudit] = useState({ cash: 0, momo: 0, count: 0 });

  const [selectedPerson, setSelectedPerson] = useState<any>(null); 
  const [reportPerson, setReportPerson] = useState<any>(null); 
  const [deletePerson, setDeletePerson] = useState<any>(null); 
  const [isRegistering, setIsRegistering] = useState(false); 
  const [showHistory, setShowHistory] = useState(false);
  const [showDailyAuditModal, setShowDailyAuditModal] = useState(false); 

  const [modalMode, setModalMode] = useState<'payment' | 'checkin'>('payment');
  const [topUpAmount, setTopUpAmount] = useState<string>(''); 
  const [targetFee, setTargetFee] = useState(REG_FEE);
  const [paymentMethod, setPaymentMethod] = useState('Cash'); 
  const [processing, setProcessing] = useState(false);
  const [gender, setGender] = useState('Male');
  
  // T-SHIRT DEFAULT NO
  const [wantsTShirt, setWantsTShirt] = useState('no');
  const [newReg, setNewReg] = useState({ 
      full_name: '', phone_number: '', role: 'Member', branch: '', 
      t_shirt: 'L', t_shirt_color: 'White', invited_by: '', 
      contact_type: 'WhatsApp', location: '' 
  });
  const [toast, setToast] = useState<{msg: string, type: 'success' | 'error' | 'warning'} | null>(null);

  useEffect(() => {
    setIsOnline(navigator.onLine);
    window.addEventListener('online', () => { setIsOnline(true); showToast("Back Online!", "success"); fetchPeople(); });
    window.addEventListener('offline', () => { setIsOnline(false); showToast("YOU ARE OFFLINE.", "warning"); });
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => setSession(session));
    return () => subscription.unsubscribe();
  }, []);

  async function runDailyAudit() {
    const today = new Date().toISOString().split('T')[0];
    const { data } = await supabase.from('audit_logs').select('details').gte('created_at', today).ilike('action_type', '%Payment%');
    let cashSum = 0, momoSum = 0, paymentCount = 0;
    if (data) {
        data.forEach(log => {
            const amountMatch = log.details.match(/₵\s*(\d+)/); 
            if (amountMatch && amountMatch[1]) {
                const amount = parseInt(amountMatch[1], 10);
                paymentCount++;
                if (log.details.toLowerCase().includes('cash')) cashSum += amount;
                else if (log.details.toLowerCase().includes('momo')) momoSum += amount;
            }
        });
    }
    setTodaysTotal(cashSum + momoSum);
    setDailyAudit({ cash: cashSum, momo: momoSum, count: paymentCount });
    setShowDailyAuditModal(true); 
  }

  async function fetchPeople() {
    if (supabaseUrl.includes("PASTE_YOUR")) return;
    const { data } = await supabase.from('participants').select('*').order('full_name');
    setPeople(data || []);
    calculateTodaysTotal(); 
  }

  async function calculateTodaysTotal() {
    const today = new Date().toISOString().split('T')[0];
    const { data } = await supabase.from('audit_logs').select('details').gte('created_at', today).ilike('action_type', '%Payment%');
    let sum = 0;
    if (data) {
        data.forEach(log => {
            const match = log.details.match(/₵\s*(\d+)/);
            if (match && match[1]) sum += parseInt(match[1], 10);
        });
    }
    setTodaysTotal(sum);
  }

  async function fetchHistory() {
    const { data } = await supabase.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(100);
    setHistoryLogs(data || []);
  }

  useEffect(() => { 
    if (session) {
      fetchPeople(); 
      fetchHistory(); 
      const channel = supabase.channel('participants_changes').on('postgres_changes', { event: '*', schema: 'public', table: 'participants' }, () => { fetchPeople(); }).subscribe();
      return () => { supabase.removeChannel(channel); };
    }
  }, [session]);

  const showToast = (msg: string, type: 'success' | 'error' | 'warning') => setToast({ msg, type });

  async function logAction(action: string, details: string) {
    if (!isOnline) return; 
    await supabase.from('audit_logs').insert([{ staff_email: session?.user?.email, action_type: action, details: details }]);
  }

  const downloadCSV = () => {
    const headers = ['Full Name', 'Role', 'Branch', 'Phone', 'Status', 'Total Paid', 'Cash Paid', 'MoMo Paid', 'T-Shirt', 'School', 'Staff'];
    const csvRows = [headers.join(',')];
    people.forEach(p => {
      const total = (p.cash_amount || 0) + (p.momo_amount || 0);
      const row = [`"${p.full_name}"`, p.role, p.branch, `'${p.phone_number}`, p.payment_status, total, p.cash_amount, p.momo_amount, p.t_shirt || '-', p.grace_school || '-', p.checked_in_by || '-'];
      csvRows.push(row.join(','));
    });
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `AMOG_DATA_${new Date().toLocaleDateString()}.csv`; a.click();
    showToast("Exported", "success");
  };

  const openPayment = (person: any) => {
    setSelectedPerson(person);
    setTargetFee(REG_FEE);
    setTopUpAmount(''); 
    setPaymentMethod('Cash'); 
    setGender(person.gender || 'Male');
    setModalMode('payment');
  };

  const openCheckIn = (person: any) => {
    setSelectedPerson(person);
    setTargetFee(REG_FEE);
    setModalMode('checkin');
  };

  const openReport = (person: any) => {
      fetchHistory().then(() => {
          setReportPerson(person);
      });
  };

  async function handleUpdateProfile(updatedPerson: any) {
      if (!isOnline) return;
      const { error } = await supabase.from('participants').update({
          full_name: updatedPerson.full_name,
          phone_number: updatedPerson.phone_number,
          branch: updatedPerson.branch,
          t_shirt: updatedPerson.t_shirt
      }).eq('id', updatedPerson.id);

      if (error) {
          showToast('Update Failed', 'error');
      } else {
          showToast('Profile Updated', 'success');
          await logAction('Profile Update', `Updated details for ${updatedPerson.full_name}`);
          fetchPeople();
          setReportPerson(updatedPerson); 
      }
  }

  const initiateDelete = (person: any) => {
      setDeletePerson(person);
  };

  async function confirmDelete() {
    if (!isOnline || !deletePerson) return;
    await logAction('Delete User', `Deleted user: ${deletePerson.full_name} (${deletePerson.phone_number}).`);
    const { error } = await supabase.from('participants').delete().eq('id', deletePerson.id);
    if (error) showToast("Error deleting: " + error.message, 'error');
    else {
        showToast("User deleted successfully.", 'success');
        fetchPeople();
        fetchHistory(); 
    }
    setDeletePerson(null);
  }

  async function handleRecordPayment() {
    if (!isOnline) { showToast("Offline mode.", "error"); return; }
    const amount = Number(topUpAmount);
    if (isNaN(amount) || amount <= 0) { showToast("Please enter a valid amount.", "warning"); return; }
    setProcessing(true);
    
    const currentCash = selectedPerson.cash_amount || 0; const currentMoMo = selectedPerson.momo_amount || 0;
    let newCash = currentCash; let newMoMo = currentMoMo;
    if (paymentMethod === 'Cash') newCash += amount; else newMoMo += amount;
    const totalPaid = newCash + newMoMo;
    const status = totalPaid >= targetFee ? 'Paid' : 'Partial';

    const { error } = await supabase.from('participants').update({ gender: gender, amount_paid: totalPaid, cash_amount: newCash, momo_amount: newMoMo, payment_status: status }).eq('id', selectedPerson.id);

    if (error) { showToast("Error: " + error.message, 'error'); } 
    else {
        // IMPORTANT: Log name in the payment record so Report can find it
        await logAction('Payment Received', `Payment for ${selectedPerson.full_name}: Recorded ₵${amount} via ${paymentMethod}. New Total: ₵${totalPaid}.`);
        await fetchPeople();
        showToast(`Payment recorded! Balance updated.`, 'success');
        fetchHistory();
        setSelectedPerson(null);
    }
    setProcessing(false);
  }

  async function handleFinalCheckIn() {
    if (!isOnline) { showToast("Offline mode.", "error"); return; }
    if (selectedPerson.amount_paid < targetFee) { showToast("Payment Incomplete.", "error"); return; }
    setProcessing(true);
    const randomSchool = GRACE_SCHOOLS[Math.floor(Math.random() * GRACE_SCHOOLS.length)];
    const { error } = await supabase.from('participants').update({ grace_school: randomSchool, checked_in: true, checked_in_at: new Date().toISOString(), checked_in_by: session?.user?.email }).eq('id', selectedPerson.id);
    if (error) { showToast("Error: " + error.message, 'error'); } 
    else {
        await logAction('Check-In', `Checked in ${selectedPerson.full_name}. Group: ${randomSchool}`);
        await fetchPeople();
        fetchHistory(); 
        const message = `Calvary greetings ${selectedPerson.full_name}! ✝️%0A%0AWelcome to AMOG 2026.%0A%0A*Registration Complete:*%0A🏠 *Group:* ${randomSchool}%0A💰 *Total Paid:* ₵${selectedPerson.amount_paid}%0A%0AGod bless you!`;
        window.open(`https://wa.me/233${selectedPerson.phone_number?.substring(1)}?text=${message}`, '_blank');
        showToast(`Checked In Successfully!`, 'success');
        setSelectedPerson(null);
    }
    setProcessing(false);
  }

  async function handleNewRegistration() {
    if (!isOnline) { showToast("Offline.", "error"); return; }
    if (newReg.phone_number.length < 10) { showToast("Invalid Phone", "error"); return; }
    if (!newReg.branch) { showToast("Please select a branch.", "warning"); return; }
    setProcessing(true);
    const existing = people.find(p => p.phone_number === newReg.phone_number);
    if (existing) { showToast(`${existing.full_name} exists!`, 'error'); setProcessing(false); return; }
    
    const randomSchool = GRACE_SCHOOLS[Math.floor(Math.random() * GRACE_SCHOOLS.length)];
    
    let finalTShirt = null;
    if (wantsTShirt === 'yes') {
       finalTShirt = `${newReg.t_shirt} (${newReg.t_shirt_color})`;
    }

    const { data, error } = await supabase.from('participants').insert([{ 
        ...newReg, 
        t_shirt: finalTShirt, 
        payment_status: 'Pending', 
        amount_paid: 0, 
        cash_amount: 0, 
        momo_amount: 0, 
        checked_in: false, 
        // grace_school: randomSchool // Removed auto-assign on reg, only on check-in
    }]).select();

    if (error) { showToast(error.message, 'error'); } 
    else {
      await logAction('New Registration', `Registered: ${newReg.full_name}`);
      showToast("Registered!", 'success');
      fetchHistory();
      setIsRegistering(false); 
      setNewReg({ full_name: '', phone_number: '', role: 'Member', branch: '', t_shirt: 'L', t_shirt_color: 'White', invited_by: '', contact_type: 'WhatsApp', location: '' }); 
      setWantsTShirt('no');
    }
    setProcessing(false);
  }

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); 
    const formData = new FormData(e.currentTarget);
    const { error } = await supabase.auth.signInWithPassword({ email: formData.get("email") as string, password: formData.get("password") as string });
    if (error) showToast("Invalid Credentials", 'error');
  };

  const filteredPeople = people.filter((p) => {
    const term = search.toLowerCase(); 
    const matchesSearch = (p.full_name || '').toLowerCase().includes(term) || (p.phone_number || '').includes(term);
    const matchesBranch = branchFilter === '' || (p.branch || '').toLowerCase() === branchFilter.toLowerCase();
    
    let matchesStatus = true;
    if (filter === 'paid') matchesStatus = p.payment_status === 'Paid';
    if (filter === 'owing') matchesStatus = p.payment_status === 'Partial' || p.payment_status === 'Pending';
    if (filter === 'checked_in') matchesStatus = p.checked_in === true;

    return matchesSearch && matchesBranch && matchesStatus;
  }).sort((a, b) => (a.full_name || '').localeCompare(b.full_name || ''));

  const stats = { 
    checkedIn: people.filter(p => p.checked_in).length, 
    totalCash: people.reduce((sum, p) => sum + (p.cash_amount || 0), 0),
    totalMomo: people.reduce((sum, p) => sum + (p.momo_amount || 0), 0),
    // Updated Stats for 6 Groups
    g1: people.filter(p => p.grace_school === 'Group 1').length,
    g2: people.filter(p => p.grace_school === 'Group 2').length,
    g3: people.filter(p => p.grace_school === 'Group 3').length,
    g4: people.filter(p => p.grace_school === 'Group 4').length,
    g5: people.filter(p => p.grace_school === 'Group 5').length,
    g6: people.filter(p => p.grace_school === 'Group 6').length,
  };

  if (!session) { return ( <div className="min-h-screen flex items-center justify-center bg-[#0f172a] relative font-sans overflow-hidden"><style>{globalStyles}</style><div className="absolute inset-0 z-0"><div className="absolute inset-0 bg-gradient-to-br from-indigo-950/90 via-purple-900/80 to-black/90 z-10"></div><img src="/camp-bg.png" className="w-full h-full object-cover scale-105" alt="Background" /></div><div className="relative z-20 w-full max-w-md p-6"><div className="bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-2xl"><div className="text-center mb-8"><h1 className="text-4xl font-extrabold text-white tracking-tight">AMOG <span className="text-indigo-400">2026</span></h1><p className="text-indigo-200 mt-2 font-medium tracking-wider uppercase text-[11px]">Staff Access Portal</p></div><form onSubmit={handleLogin} method="POST" className="space-y-5"><div><label className="text-[11px] font-bold text-indigo-300 uppercase ml-1 mb-2 block tracking-wider">Admin Email</label><div className="relative"><User className="absolute left-4 top-3.5 w-5 h-5 text-indigo-400/60"/><input name="email" type="email" className="w-full pl-12 p-3.5 rounded-xl bg-black/40 border border-white/5 text-white focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-900/50 outline-none transition-all" placeholder="Enter email" required /></div></div><div><label className="text-[11px] font-bold text-indigo-300 uppercase ml-1 mb-2 block tracking-wider">Password</label><div className="relative"><Lock className="absolute left-4 top-3.5 w-5 h-5 text-indigo-400/60"/><input name="password" type="password" className="w-full pl-12 p-3.5 rounded-xl bg-black/40 border border-white/5 text-white focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-900/50 outline-none transition-all" placeholder="••••••••" required /></div></div><button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-3.5 rounded-xl font-bold text-sm shadow-lg shadow-indigo-900/30 transition-all">Secure Login</button></form></div></div>{toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}</div> ); }

  return (
    <div className="min-h-screen font-sans text-gray-100 bg-[#0f172a] relative pb-20 overflow-x-hidden">
      <style>{globalStyles}</style>
      <div className="fixed inset-0 z-0"><div className="absolute inset-0 bg-gradient-to-b from-slate-900/50 to-black/80 z-[-1]"></div><img src="/camp-bg.png" className="w-full h-full object-cover opacity-70 fixed z-[-2]" alt="bg" /></div>
      {!isOnline && ( <div className="fixed top-0 left-0 right-0 bg-red-600/90 text-white text-center py-2 text-xs font-bold z-[200] backdrop-blur flex items-center justify-center gap-2"><AlertCircle className="w-4 h-4"/> OFFLINE MODE</div> )}
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-6 py-8">
        {/* HEADER & STATS */}
        <div className="flex flex-col lg:flex-row justify-between items-center mb-8 gap-6">
          <div className="text-center lg:text-left"><h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white">AMOG <span className="text-indigo-500">2026</span></h1><p className="text-slate-400 font-medium text-sm tracking-wide mt-1">Registration & Check-In Desk</p></div>
          <div className="flex gap-3">
            <div className="bg-white/5 backdrop-blur-md px-5 py-3 rounded-xl border border-white/10 flex items-center gap-3"><Users className="w-5 h-5 text-indigo-400"/><div className="text-left"><p className="text-[10px] uppercase text-slate-400 font-bold tracking-wider">In Camp</p><p className="text-xl font-bold text-white leading-none">{stats.checkedIn}</p></div></div>
            <div className="bg-emerald-900/30 backdrop-blur-md px-5 py-3 rounded-xl border border-emerald-500/20 flex items-center gap-3"><Coins className="w-5 h-5 text-emerald-400"/><div className="text-left"><p className="text-[10px] uppercase text-emerald-400 font-bold tracking-wider">Cash</p><p className="text-xl font-bold text-emerald-100 font-mono leading-none">₵{stats.totalCash}</p></div></div>
            <div className="bg-blue-900/30 backdrop-blur-md px-5 py-3 rounded-xl border border-blue-500/20 flex items-center gap-3"><CreditCard className="w-5 h-5 text-blue-400"/><div className="text-left"><p className="text-[10px] uppercase text-blue-400 font-bold tracking-wider">MoMo</p><p className="text-xl font-bold text-blue-100 font-mono leading-none">₵{stats.totalMomo}</p></div></div>
            <button onClick={() => supabase.auth.signOut()} className="bg-red-500/10 hover:bg-red-500/20 text-red-300 px-3 rounded-xl border border-red-500/20 transition-all flex items-center justify-center"><LogOut className="w-5 h-5"/></button>
          </div>
        </div>

        {/* CLICKABLE RECEIVED TODAY */}
        <div className="flex justify-end mb-4">
             <div onClick={runDailyAudit} className="bg-purple-900/40 backdrop-blur-md px-6 py-2 rounded-full border border-purple-500/30 text-center cursor-pointer hover:bg-purple-900/60 transition-all flex items-center gap-3">
                <span className="text-xs uppercase text-purple-300 font-bold tracking-wider">Received Today</span>
                <span className="text-lg font-bold text-white">₵{todaysTotal}</span>
                <div className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse"></div>
             </div>
        </div>
        
        {/* GRACE SCHOOL COUNTERS (Updated for Groups 1-6) */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
            <div className="bg-indigo-900/20 border border-indigo-500/20 p-3 rounded-2xl text-center backdrop-blur-md"><p className="text-[10px] uppercase text-indigo-300 font-bold tracking-wider">Group 1</p><p className="text-xl font-bold text-white">{stats.g1}</p></div>
            <div className="bg-teal-900/20 border border-teal-500/20 p-3 rounded-2xl text-center backdrop-blur-md"><p className="text-[10px] uppercase text-teal-300 font-bold tracking-wider">Group 2</p><p className="text-xl font-bold text-white">{stats.g2}</p></div>
            <div className="bg-pink-900/20 border border-pink-500/20 p-3 rounded-2xl text-center backdrop-blur-md"><p className="text-[10px] uppercase text-pink-300 font-bold tracking-wider">Group 3</p><p className="text-xl font-bold text-white">{stats.g3}</p></div>
            <div className="bg-amber-900/20 border border-amber-500/20 p-3 rounded-2xl text-center backdrop-blur-md"><p className="text-[10px] uppercase text-amber-300 font-bold tracking-wider">Group 4</p><p className="text-xl font-bold text-white">{stats.g4}</p></div>
            <div className="bg-blue-900/20 border border-blue-500/20 p-3 rounded-2xl text-center backdrop-blur-md"><p className="text-[10px] uppercase text-blue-300 font-bold tracking-wider">Group 5</p><p className="text-xl font-bold text-white">{stats.g5}</p></div>
            <div className="bg-purple-900/20 border border-purple-500/20 p-3 rounded-2xl text-center backdrop-blur-md"><p className="text-[10px] uppercase text-purple-300 font-bold tracking-wider">Group 6</p><p className="text-xl font-bold text-white">{stats.g6}</p></div>
        </div>

        {/* CONTROLS */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-2 rounded-2xl mb-8 flex gap-2 items-center">
           <div className="flex-1 relative"><Search className="absolute left-4 top-3.5 w-5 h-5 text-slate-500"/><input type="text" placeholder="Search people..." className="w-full pl-11 pr-4 py-3 rounded-xl bg-black/40 border border-white/5 text-white focus:border-indigo-500/50 outline-none transition-all placeholder-slate-600" value={search} onChange={(e) => setSearch(e.target.value)} /></div>
           <button onClick={() => setIsRegistering(true)} className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-3 rounded-xl font-bold shadow-lg shadow-indigo-900/20 flex items-center gap-2"><Plus className="w-5 h-5"/> <span className="hidden md:inline">New Registration</span></button>
           <button onClick={() => setShowHistory(true)} className="bg-slate-800/50 hover:bg-slate-800 text-slate-300 px-4 py-3 rounded-xl font-bold border border-white/5 flex items-center gap-2"><FileText className="w-5 h-5"/> <span className="hidden md:inline">Logs</span></button>
           <button onClick={downloadCSV} className="bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 px-4 py-3 rounded-xl font-bold border border-emerald-500/20 flex items-center gap-2"><Download className="w-5 h-5"/></button>
        </div>
        
        {/* BRANCH FILTER DROPDOWN */}
        <div className="mb-6 flex gap-3 overflow-x-auto pb-2 no-scrollbar items-center">
            <div className="relative min-w-[200px]">
                <div className="absolute left-3 top-3 w-4 h-4 text-indigo-400"><HomeIcon className="w-4 h-4"/></div>
                <select className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-sm focus:border-indigo-500 outline-none appearance-none" value={branchFilter} onChange={(e) => setBranchFilter(e.target.value)}>
                    <option value="">All Branches</option>
                    {CHURCH_BRANCHES.map(b => <option key={b} value={b} className="bg-slate-900">{b}</option>)}
                </select>
            </div>
            <div className="h-8 w-px bg-white/10 mx-2"></div>
            {['all', 'checked_in', 'owing', 'paid'].map(f => (
                <button key={f} onClick={() => setFilter(f)} className={`px-5 py-2.5 rounded-full font-bold text-xs uppercase tracking-wider border transition-all ${filter === f ? 'bg-white text-slate-900 border-white shadow-md' : 'bg-transparent text-slate-400 border-slate-700 hover:border-slate-500 hover:text-slate-300'}`}>{f.replace('_', ' ')}</button>
            ))}
        </div>

        {/* USER CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-20">
          {filteredPeople.map((p) => {
            const totalPaid = (p.cash_amount || 0) + (p.momo_amount || 0);
            const isLeader = p.role?.toLowerCase().includes('leader') || p.role?.toLowerCase().includes('pastor');
            const fee = REG_FEE;
            const balance = fee - totalPaid;
            const isOwing = balance > 0;
            
            let statusColor = isOwing ? "text-amber-500" : "text-emerald-500";
            let statusText = isOwing ? `OWING ₵${balance}` : "PAID IN FULL";
            if(p.checked_in) { statusColor = "text-slate-400"; statusText = `CHECKED IN (${p.grace_school})`; }
            
            let cardBorder = isOwing ? 'border-amber-500/30 hover:border-amber-500/50' : 'border-emerald-500/30 hover:border-emerald-500/50';
            if(p.checked_in) cardBorder = 'border-indigo-500/30 hover:border-indigo-500/50';

            return (
                <div key={p.id} className={`group relative bg-white/5 backdrop-blur-sm rounded-2xl p-5 border ${cardBorder} transition-all duration-300 hover:-translate-y-1 hover:bg-white/10 hover:shadow-2xl flex flex-col`}>
                  
                  {/* TOP ICONS: DELETE & REPORT */}
                  <div className="absolute top-4 right-4 flex gap-2">
                    <button className="hover:scale-110 transition-transform opacity-50 hover:opacity-100 hover:text-red-500" onClick={(e) => { e.stopPropagation(); initiateDelete(p); }}>
                        <Trash2 className="w-4 h-4"/>
                    </button>
                    <button className="hover:scale-110 transition-transform" onClick={(e) => { e.stopPropagation(); openReport(p); }}>
                        {p.checked_in ? <CheckCircle className="w-6 h-6 text-indigo-500"/> : (isOwing ? <AlertCircle className="w-6 h-6 text-amber-500"/> : <CheckCircle className="w-6 h-6 text-emerald-500"/>)}
                    </button>
                  </div>

                  <div className="flex justify-between items-start mb-3">
                     <div><h2 className="text-lg font-bold text-white leading-tight truncate pr-8">{p.full_name}</h2><div className="flex items-center gap-2 mt-1 text-xs font-medium text-slate-400"><span className="bg-white/10 px-2 py-0.5 rounded uppercase tracking-wider flex items-center gap-1"><User className="w-3 h-3"/>{p.role}</span><span className="flex items-center gap-1 truncate"><HomeIcon className="w-3 h-3"/>{p.branch}</span></div></div>
                  </div>
                  
                  <div className="flex-1 flex flex-col justify-center py-2 mb-4">
                    <p className={`text-sm font-bold tracking-widest uppercase ${statusColor}`}>{statusText}</p>
                    {!p.checked_in && <p className="text-3xl font-mono font-extrabold text-white mt-1">₵{totalPaid} <span className="text-sm text-slate-500 font-sans font-medium">/ ₵{fee}</span></p>}
                  </div>
                  
                  <div className="flex gap-2">
                     <button onClick={() => openPayment(p)} className="flex-1 py-3 bg-indigo-600/80 hover:bg-indigo-600 text-white rounded-xl font-bold text-sm shadow transition-all flex items-center justify-center gap-2">
                        <Coins className="w-4 h-4" /> Pay
                     </button>
                     {p.checked_in ? (
                        <div className="flex-1 py-3 bg-white/5 border border-white/10 text-slate-500 rounded-xl font-bold text-sm text-center flex items-center justify-center gap-2">
                           <CheckCircle className="w-4 h-4" /> Done
                        </div>
                     ) : (
                        <button onClick={() => openCheckIn(p)} disabled={isOwing} className={`flex-1 py-3 rounded-xl font-bold text-sm shadow transition-all flex items-center justify-center gap-2 ${isOwing ? 'bg-white/5 text-slate-500 cursor-not-allowed border border-white/5' : 'bg-emerald-600 hover:bg-emerald-500 text-white'}`}>
                            <LogOut className="w-4 h-4 rotate-180" /> Admit
                        </button>
                     )}
                  </div>
                </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}