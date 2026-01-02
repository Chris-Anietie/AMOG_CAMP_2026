"use client";
import { useEffect, useState, useRef, useMemo } from 'react';
import { createClient } from '@supabase/supabase-js';

// --- CONFIGURATION ---
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

// CONSTANTS
const GRACE_SCHOOLS = ['Group 1', 'Group 2', 'Group 3', 'Group 4', 'Group 5', 'Group 6'];
const CHURCH_BRANCHES = ['GWC_NSAWAM', 'GWC_LEADERSHIP CITADEL', 'GWC_KUTUNSE', 'GWC_KUMASI', 'GWC_KINTAMPO', 'RWI', 'Guest / Visitor'];
const REG_FEE = 400;

// --- ICONS (Lucide Implementation) ---
const IconWrapper = ({ children, className }: { children: React.ReactNode, className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>{children}</svg>
);
// Manual SVG definitions
const Users = ({ className }: any) => <IconWrapper className={className}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></IconWrapper>;
const Coins = ({ className }: any) => <IconWrapper className={className}><circle cx="8" cy="8" r="6"/><path d="M18.09 10.37A6 6 0 1 1 10.34 18"/><path d="M7 6h1v4"/><path d="m16.71 13.88.7.71-2.82 2.82"/></IconWrapper>;
const CreditCard = ({ className }: any) => <IconWrapper className={className}><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/></IconWrapper>;
const LogOut = ({ className }: any) => <IconWrapper className={className}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></IconWrapper>;
const Search = ({ className }: any) => <IconWrapper className={className}><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></IconWrapper>;
const Plus = ({ className }: any) => <IconWrapper className={className}><path d="M5 12h14"/><path d="M12 5v14"/></IconWrapper>;
const FileText = ({ className }: any) => <IconWrapper className={className}><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></IconWrapper>;
const Download = ({ className }: any) => <IconWrapper className={className}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></IconWrapper>;
const CheckCircle = ({ className }: any) => <IconWrapper className={className}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></IconWrapper>;
const AlertCircle = ({ className }: any) => <IconWrapper className={className}><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></IconWrapper>;
const HomeIcon = ({ className }: any) => <IconWrapper className={className}><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></IconWrapper>;
const User = ({ className }: any) => <IconWrapper className={className}><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></IconWrapper>;
const Lock = ({ className }: any) => <IconWrapper className={className}><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></IconWrapper>;
const Clock = ({ className }: any) => <IconWrapper className={className}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></IconWrapper>;
const Trash2 = ({ className }: any) => <IconWrapper className={className}><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></IconWrapper>;
const AlertTriangle = ({ className }: any) => <IconWrapper className={className}><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" x2="12" y1="9" y2="13"/><line x1="12" x2="12.01" y1="17" y2="17"/></IconWrapper>;
const Filter = ({ className }: any) => <IconWrapper className={className}><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></IconWrapper>;
const Edit = ({ className }: any) => <IconWrapper className={className}><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></IconWrapper>;
const X = ({ className }: any) => <IconWrapper className={className}><path d="M18 6 6 18"/><path d="m6 6 12 12"/></IconWrapper>;
const Smartphone = ({ className }: any) => <IconWrapper className={className}><rect width="14" height="20" x="5" y="2" rx="2" ry="2"/><path d="M12 18h.01"/></IconWrapper>;

// --- UPDATED MODAL BACKDROP (Fix 1: Stops bubbling) ---
const ModalBackdrop = ({ children, onClose }: { children: React.ReactNode, onClose: () => void }) => (
  <div 
    className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
    onClick={onClose} // Clicking the background closes the modal
  >
    {/* This inner div catches the click and stops it from reaching the background */}
    <div onClick={(e) => e.stopPropagation()} className="w-full flex justify-center">
      {children}
    </div>
  </div>
);

function Toast({ msg, type, onClose }: { msg: string, type: 'success' | 'error' | 'warning', onClose: () => void }) {
  useEffect(() => { const t = setTimeout(onClose, 4000); return () => clearTimeout(t); }, [onClose]);
  const styles = {
    success: 'bg-emerald-500/20 border-emerald-500/50 text-emerald-200',
    error: 'bg-red-500/20 border-red-500/50 text-red-200',
    warning: 'bg-amber-500/20 border-amber-500/50 text-amber-200'
  };
  return (
    <div className={`fixed top-4 right-4 z-[200] p-4 rounded-2xl backdrop-blur-xl border flex items-center gap-3 shadow-2xl animate-in slide-in-from-top-4 ${styles[type]}`}>
      {type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
      <p className="font-semibold text-sm">{msg}</p>
    </div>
  );
}

// --- NEW REGISTRATION MODAL UI ---
function RegistrationModal({ isOpen, onClose, onRegister, processing }: any) {
  const [data, setData] = useState({
    full_name: '', phone_number: '', role: 'Member', branch: '',
    t_shirt: 'L', t_shirt_color: 'White', invited_by: '',
    contact_type: 'WhatsApp', location: '', wants_tshirt: false
  });

  if (!isOpen) return null;

  return (
    <ModalBackdrop onClose={onClose}>
      <div className="bg-[#1e293b] w-full max-w-2xl rounded-3xl border border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-white/10 bg-white/5 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">New Registration</h2>
            <p className="text-indigo-300 text-xs font-medium">Add a new camper to the database</p>
          </div>
          {/* Fix 2: Added type="button" */}
          <button type="button" onClick={onClose} className="p-2 hover:bg-white/10 rounded-full text-slate-400 hover:text-white transition-colors"><X className="w-6 h-6" /></button>
        </div>

        <div className="p-6 overflow-y-auto custom-scrollbar space-y-6">
          {/* Section 1: Personal Info */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Personal Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="group">
                <label className="text-xs font-medium text-slate-300 mb-1.5 block">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-3 w-4 h-4 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
                  <input type="text" className="w-full bg-slate-900/50 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-white focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-600" placeholder="John Doe"
                    value={data.full_name} onChange={e => setData({ ...data, full_name: e.target.value })} />
                </div>
              </div>
              <div className="group">
                <label className="text-xs font-medium text-slate-300 mb-1.5 block">Phone Number</label>
                <div className="relative">
                  <Smartphone className="absolute left-3 top-3 w-4 h-4 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
                  <input type="tel" className="w-full bg-slate-900/50 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-white focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-600" placeholder="024 XXX XXXX"
                    value={data.phone_number} onChange={e => setData({ ...data, phone_number: e.target.value })} />
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Church Info */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Church & Role</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-slate-300 mb-1.5 block">Branch</label>
                <select className="w-full bg-slate-900/50 border border-white/10 rounded-xl py-2.5 px-4 text-white focus:ring-2 focus:ring-indigo-500/50 outline-none appearance-none"
                  value={data.branch} onChange={e => setData({ ...data, branch: e.target.value })}>
                  <option value="">Select Branch...</option>
                  {CHURCH_BRANCHES.map(b => <option key={b} value={b} className="bg-slate-900">{b}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-300 mb-1.5 block">Role</label>
                <div className="flex bg-slate-900/50 p-1 rounded-xl border border-white/10">
                  {['Member', 'Leader', 'Pastor', 'Guest'].map(r => (
                    // Fix 2: Added type="button" to prevent form submission/closing
                    <button key={r} type="button" onClick={() => setData({ ...data, role: r })}
                      className={`flex-1 text-xs font-bold py-2 rounded-lg transition-all ${data.role === r ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}>
                      {r}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Merchandise */}
          <div className="bg-indigo-900/10 border border-indigo-500/20 rounded-2xl p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-bold text-indigo-200 flex items-center gap-2">
                 Camp T-Shirt <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded border border-indigo-500/30">OPTIONAL</span>
              </h3>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" checked={data.wants_tshirt} onChange={e => setData({ ...data, wants_tshirt: e.target.checked })} />
                <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
              </label>
            </div>
            
            {data.wants_tshirt && (
              <div className="grid grid-cols-2 gap-4 animate-in slide-in-from-top-2 fade-in">
                <div>
                  <label className="text-xs font-medium text-indigo-300 mb-1.5 block">Size</label>
                  <select className="w-full bg-slate-900/50 border border-indigo-500/30 rounded-xl py-2 px-3 text-white outline-none"
                    value={data.t_shirt} onChange={e => setData({ ...data, t_shirt: e.target.value })}>
                    {['S', 'M', 'L', 'XL', 'XXL', '3XL'].map(s => <option key={s} className="bg-slate-900">{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-indigo-300 mb-1.5 block">Color Preference</label>
                  <input type="text" className="w-full bg-slate-900/50 border border-indigo-500/30 rounded-xl py-2 px-3 text-white outline-none placeholder:text-slate-600"
                    placeholder="e.g. White" value={data.t_shirt_color} onChange={e => setData({ ...data, t_shirt_color: e.target.value })} />
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="p-6 border-t border-white/10 bg-slate-900/50 flex gap-3">
          {/* Fix 2: Added type="button" */}
          <button type="button" onClick={onClose} className="flex-1 py-3.5 bg-transparent border border-white/10 hover:bg-white/5 text-slate-300 font-bold rounded-xl transition-all">Cancel</button>
          <button onClick={() => onRegister(data)} disabled={processing} className="flex-[2] py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-indigo-900/20 transition-all flex items-center justify-center gap-2">
            {processing ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Plus className="w-5 h-5" /> Complete Registration</>}
          </button>
        </div>
      </div>
    </ModalBackdrop>
  );
}

// --- USER REPORT / PROFILE MODAL (FIXED LOGS) ---
function UserReportModal({ person, onClose, onUpdate, supabase }: any) {
    const [activeTab, setActiveTab] = useState('details');
    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState({ ...person });
    const [logs, setLogs] = useState<any[]>([]);
    const [loadingLogs, setLoadingLogs] = useState(true);

    // Fetch logs SPECIFIC to this user when modal opens
    useEffect(() => {
      async function fetchUserLogs() {
        setLoadingLogs(true);
        // We match logs where details contain the name OR phone. 
        // Note: Ideally, you'd add a participant_id column to audit_logs for exact matching.
        const { data } = await supabase.from('audit_logs')
          .select('*')
          .or(`details.ilike.%${person.full_name}%,details.ilike.%${person.phone_number}%`)
          .order('created_at', { ascending: false });
        
        setLogs(data || []);
        setLoadingLogs(false);
      }
      if (person) fetchUserLogs();
    }, [person, supabase]);

    const handleSave = () => { onUpdate(editData); setIsEditing(false); };
    const balance = REG_FEE - (person.amount_paid || 0);

    return (
        <ModalBackdrop onClose={onClose}>
            <div className="bg-[#1e293b] w-full max-w-lg rounded-3xl border border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95">
                {/* Header */}
                <div className="p-6 bg-gradient-to-r from-slate-900 to-indigo-950/50 border-b border-white/10 flex justify-between items-start">
                    <div className="flex gap-4">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-lg font-bold shadow-inner ${balance <= 0 ? 'bg-emerald-500 text-white shadow-emerald-900/20' : 'bg-amber-500 text-white shadow-amber-900/20'}`}>
                           {person.full_name.charAt(0)}
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white leading-tight">{person.full_name}</h2>
                            <p className="text-slate-400 text-sm mt-0.5 flex items-center gap-2"><Smartphone className="w-3 h-3"/> {person.phone_number}</p>
                        </div>
                    </div>
                    {/* Fix 2: Added type="button" */}
                    <button type="button" onClick={onClose} className="p-1 hover:bg-white/10 rounded-full text-slate-400"><X className="w-6 h-6"/></button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-white/5 bg-white/5 p-1">
                   {/* Fix 2: Added type="button" to tabs */}
                   <button type="button" onClick={() => setActiveTab('details')} className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all ${activeTab === 'details' ? 'bg-white/10 text-white' : 'text-slate-500 hover:text-slate-300'}`}>Profile</button>
                   <button type="button" onClick={() => setActiveTab('logs')} className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all ${activeTab === 'logs' ? 'bg-white/10 text-white' : 'text-slate-500 hover:text-slate-300'}`}>Audit Logs</button>
                </div>

                <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
                    {activeTab === 'details' ? (
                        <div className="space-y-6">
                            {/* Stats Cards */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-black/20 rounded-xl p-3 border border-white/5">
                                    <p className="text-[10px] uppercase text-slate-500 font-bold">Total Paid</p>
                                    <p className="text-xl font-mono font-bold text-white">₵{person.amount_paid}</p>
                                </div>
                                <div className="bg-black/20 rounded-xl p-3 border border-white/5">
                                    <p className="text-[10px] uppercase text-slate-500 font-bold">Group</p>
                                    <p className="text-lg font-bold text-indigo-300">{person.grace_school || 'N/A'}</p>
                                </div>
                            </div>

                            {/* Edit Form */}
                            {isEditing ? (
                                <div className="space-y-4 animate-in fade-in">
                                    <div><label className="text-xs text-slate-400 block mb-1">Full Name</label><input className="w-full bg-black/30 border border-white/10 rounded-lg p-2 text-white text-sm" value={editData.full_name} onChange={e => setEditData({...editData, full_name: e.target.value})} /></div>
                                    <div><label className="text-xs text-slate-400 block mb-1">Phone</label><input className="w-full bg-black/30 border border-white/10 rounded-lg p-2 text-white text-sm" value={editData.phone_number} onChange={e => setEditData({...editData, phone_number: e.target.value})} /></div>
                                    <div>
                                        <label className="text-xs text-slate-400 block mb-1">Branch</label>
                                        <select className="w-full bg-black/30 border border-white/10 rounded-lg p-2 text-white text-sm" value={editData.branch} onChange={e => setEditData({...editData, branch: e.target.value})}>
                                            {CHURCH_BRANCHES.map(b => <option key={b} className="bg-slate-900">{b}</option>)}
                                        </select>
                                    </div>
                                    <button onClick={handleSave} className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl mt-2">Save Changes</button>
                                </div>
                            ) : (
                                <div className="bg-white/5 rounded-xl border border-white/5 p-4 space-y-3">
                                    <div className="flex justify-between border-b border-white/5 pb-2"><span className="text-slate-400 text-sm">Branch</span><span className="text-white text-sm">{person.branch}</span></div>
                                    <div className="flex justify-between border-b border-white/5 pb-2"><span className="text-slate-400 text-sm">T-Shirt</span><span className="text-white text-sm">{person.t_shirt || 'None'}</span></div>
                                    <div className="flex justify-between border-b border-white/5 pb-2"><span className="text-slate-400 text-sm">Role</span><span className="text-white text-sm">{person.role}</span></div>
                                    <div className="flex justify-between"><span className="text-slate-400 text-sm">Status</span><span className={`text-sm font-bold ${balance <= 0 ? 'text-emerald-400' : 'text-amber-400'}`}>{balance <= 0 ? 'PAID' : 'OWING'}</span></div>
                                    {/* Fix 2: Added type="button" */}
                                    <button type="button" onClick={() => setIsEditing(true)} className="w-full mt-4 py-2 border border-white/10 hover:bg-white/5 text-indigo-300 text-xs font-bold uppercase rounded-lg transition-all">Edit Profile</button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-4">
                             {loadingLogs ? <p className="text-center text-slate-500 text-xs">Loading logs...</p> : 
                              logs.length === 0 ? <p className="text-center text-slate-500 text-xs italic">No activity recorded.</p> :
                              logs.map((log, i) => (
                                <div key={i} className="relative pl-6 pb-2 border-l border-white/10 last:border-0">
                                    <div className="absolute left-[-5px] top-0 w-2.5 h-2.5 rounded-full bg-indigo-500 shadow-lg shadow-indigo-500/50"></div>
                                    <div className="flex justify-between items-start">
                                        <p className="text-white text-sm font-medium">{log.action_type}</p>
                                        <span className="text-[10px] text-slate-500">{new Date(log.created_at).toLocaleDateString()}</span>
                                    </div>
                                    <p className="text-slate-400 text-xs mt-1 leading-relaxed">{log.details}</p>
                                    <p className="text-[10px] text-indigo-400/50 mt-1">{log.staff_email}</p>
                                </div>
                              ))
                             }
                        </div>
                    )}
                </div>
            </div>
        </ModalBackdrop>
    );
}

// --- MAIN PAGE ---
export default function Home() {
  const [session, setSession] = useState<any>(null);
  const [people, setPeople] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [branchFilter, setBranchFilter] = useState('');
  const [isOnline, setIsOnline] = useState(true);
  
  // Modals & Actions
  const [isRegistering, setIsRegistering] = useState(false);
  const [reportPerson, setReportPerson] = useState<any>(null);
  const [selectedPerson, setSelectedPerson] = useState<any>(null); // For Payment/Admit
  const [modalMode, setModalMode] = useState<'payment' | 'checkin'>('payment');
  
  // Logic State
  const [topUpAmount, setTopUpAmount] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [processing, setProcessing] = useState(false);
  const [toast, setToast] = useState<{msg: string, type: 'success' | 'error' | 'warning'} | null>(null);

  // --- INIT & REALTIME ---
  useEffect(() => {
    setIsOnline(navigator.onLine);
    window.addEventListener('online', () => setIsOnline(true));
    window.addEventListener('offline', () => setIsOnline(false));

    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
    supabase.auth.onAuthStateChange((_event, session) => setSession(session));

    // Initial Fetch
    fetchPeople();

    // Subscribe to Participants AND Logs (Fix for "Logs not working")
    const channel = supabase.channel('realtime_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'participants' }, () => {
         fetchPeople();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'audit_logs' }, () => {
         // If report modal is open, we might need to refresh user logs, handled inside modal
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  async function fetchPeople() {
     if(!supabaseUrl) return;
     const { data } = await supabase.from('participants').select('*').order('full_name');
     setPeople(data || []);
  }

  const showToast = (msg: string, type: 'success' | 'error' | 'warning') => setToast({ msg, type });

  // --- ACTIONS ---
  async function logAction(action: string, details: string) {
    if (!session?.user?.email) return;
    await supabase.from('audit_logs').insert([{ staff_email: session.user.email, action_type: action, details }]);
  }

  async function handleRegister(data: any) {
    if(!isOnline) return showToast("Offline mode.", "error");
    if(data.phone_number.length < 10) return showToast("Invalid Phone", "error");
    setProcessing(true);

    const exists = people.find(p => p.phone_number === data.phone_number);
    if(exists) { setProcessing(false); return showToast("User already exists!", "error"); }

    const finalTShirt = data.wants_tshirt ? `${data.t_shirt} (${data.t_shirt_color})` : null;
    
    const { error } = await supabase.from('participants').insert([{
        full_name: data.full_name, phone_number: data.phone_number, role: data.role,
        branch: data.branch, t_shirt: finalTShirt, payment_status: 'Pending',
        amount_paid: 0, cash_amount: 0, momo_amount: 0, checked_in: false,
        created_at: new Date().toISOString()
    }]);

    if(error) {
        showToast(error.message, "error");
    } else {
        await logAction('New Registration', `Registered: ${data.full_name} (${data.phone_number})`);
        showToast("Registration Successful!", "success");
        setIsRegistering(false);
    }
    setProcessing(false);
  }

  async function handlePayment() {
      const amount = parseFloat(topUpAmount);
      if(!amount || amount <= 0) return showToast("Enter valid amount", "warning");
      
      setProcessing(true);
      const currentCash = selectedPerson.cash_amount || 0;
      const currentMoMo = selectedPerson.momo_amount || 0;
      let newCash = currentCash, newMoMo = currentMoMo;
      
      if(paymentMethod === 'Cash') newCash += amount;
      else newMoMo += amount;
      
      const total = newCash + newMoMo;
      const status = total >= REG_FEE ? 'Paid' : 'Partial';

      const { error } = await supabase.from('participants').update({
          amount_paid: total, cash_amount: newCash, momo_amount: newMoMo, payment_status: status
      }).eq('id', selectedPerson.id);

      if(error) showToast("Payment failed", "error");
      else {
          await logAction('Payment Received', `Payment for ${selectedPerson.full_name}: Recorded ₵${amount} via ${paymentMethod}. New Balance: ₵${REG_FEE - total}`);
          showToast("Payment Recorded", "success");
          setSelectedPerson(null);
      }
      setProcessing(false);
  }

  async function handleAdmit() {
      if(selectedPerson.amount_paid < REG_FEE) return showToast("Payment Incomplete", "error");
      setProcessing(true);
      
      const randomSchool = GRACE_SCHOOLS[Math.floor(Math.random() * GRACE_SCHOOLS.length)];
      
      const { error } = await supabase.from('participants').update({
          checked_in: true, checked_in_at: new Date().toISOString(),
          checked_in_by: session?.user?.email, grace_school: randomSchool
      }).eq('id', selectedPerson.id);

      if(error) showToast("Check-in failed", "error");
      else {
          await logAction('Check-In', `User ${selectedPerson.full_name} admitted to ${randomSchool}`);
          const msg = `Welcome to AMOG 2026!%0A%0A*Name:* ${selectedPerson.full_name}%0A*Group:* ${randomSchool}%0A*Status:* Admitted ✅`;
          window.open(`https://wa.me/233${selectedPerson.phone_number.substring(1)}?text=${msg}`, '_blank');
          showToast(`Admitted to ${randomSchool}`, "success");
          setSelectedPerson(null);
      }
      setProcessing(false);
  }

  // --- STATS CALC ---
  const stats = useMemo(() => ({
     checkedIn: people.filter(p => p.checked_in).length,
     cash: people.reduce((s, p) => s + (p.cash_amount || 0), 0),
     momo: people.reduce((s, p) => s + (p.momo_amount || 0), 0),
     groups: GRACE_SCHOOLS.map(g => ({ name: g, count: people.filter(p => p.grace_school === g).length }))
  }), [people]);

  // --- FILTERING ---
  const filtered = people.filter(p => {
      const matchSearch = p.full_name.toLowerCase().includes(search.toLowerCase()) || p.phone_number.includes(search);
      const matchBranch = branchFilter ? p.branch === branchFilter : true;
      let matchFilter = true;
      if(filter === 'paid') matchFilter = p.amount_paid >= REG_FEE;
      if(filter === 'owing') matchFilter = p.amount_paid < REG_FEE;
      if(filter === 'checked_in') matchFilter = p.checked_in;
      return matchSearch && matchBranch && matchFilter;
  });

  // --- LOGIN VIEW ---
  if (!session) return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-6 relative overflow-hidden font-sans">
       <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1523580494863-6f3031224c94?q=80&w=2070&auto=format&fit=crop')] bg-cover opacity-20"></div>
       <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-3xl w-full max-w-sm shadow-2xl relative z-10 animate-in fade-in zoom-in-95 duration-500">
           <div className="text-center mb-8">
               <h1 className="text-4xl font-black text-white tracking-tighter">AMOG <span className="text-indigo-500">2026</span></h1>
               <p className="text-indigo-200 text-xs font-bold uppercase tracking-widest mt-2">Camp Staff Portal</p>
           </div>
           <form onSubmit={async (e) => {
               e.preventDefault();
               const fd = new FormData(e.currentTarget);
               const { error } = await supabase.auth.signInWithPassword({ email: fd.get('email') as string, password: fd.get('password') as string });
               if(error) showToast('Invalid Credentials', 'error');
           }} className="space-y-4">
               <input name="email" type="email" placeholder="Admin Email" className="w-full bg-black/40 border border-white/10 rounded-xl p-3.5 text-white outline-none focus:border-indigo-500 transition-all" required />
               <input name="password" type="password" placeholder="••••••••" className="w-full bg-black/40 border border-white/10 rounded-xl p-3.5 text-white outline-none focus:border-indigo-500 transition-all" required />
               <button className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-indigo-900/30 transition-all">Access Dashboard</button>
           </form>
       </div>
       {toast && <Toast {...toast} onClose={() => setToast(null)} />}
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-100 font-sans pb-20 relative overflow-x-hidden">
        {/* BACKGROUND */}
        <div className="fixed inset-0 pointer-events-none z-0">
             <div className="absolute inset-0 bg-gradient-to-b from-indigo-950/20 to-[#0f172a]"></div>
             <div className="absolute top-0 left-0 right-0 h-[500px] bg-indigo-600/10 blur-[100px] rounded-full"></div>
        </div>

        {/* HEADER */}
        <header className="sticky top-0 z-50 bg-[#0f172a]/80 backdrop-blur-lg border-b border-white/5 px-4 py-3 flex justify-between items-center">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-indigo-500/20">A</div>
                <div><h1 className="font-bold text-lg leading-none">AMOG <span className="text-indigo-400">2026</span></h1><p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Help Desk</p></div>
            </div>
            <div className="flex gap-2">
                <button onClick={() => supabase.auth.signOut()} className="bg-white/5 hover:bg-white/10 p-2.5 rounded-xl text-slate-400 hover:text-red-400 transition-all border border-white/5"><LogOut className="w-5 h-5"/></button>
            </div>
        </header>

        <main className="relative z-10 max-w-7xl mx-auto px-4 pt-6 space-y-6">
            {toast && <Toast {...toast} onClose={() => setToast(null)} />}

            {/* MOBILE SCROLLABLE STATS */}
            <div className="flex overflow-x-auto gap-3 pb-2 custom-scrollbar snap-x">
                <div className="snap-start min-w-[140px] bg-gradient-to-br from-indigo-600 to-violet-700 p-4 rounded-2xl shadow-lg shadow-indigo-900/20 flex flex-col justify-between">
                    <Users className="w-6 h-6 text-white/80 mb-2"/>
                    <div><p className="text-xs text-indigo-100 font-medium">In Camp</p><p className="text-2xl font-bold text-white">{stats.checkedIn}</p></div>
                </div>
                <div className="snap-start min-w-[140px] bg-emerald-900/40 border border-emerald-500/20 p-4 rounded-2xl flex flex-col justify-between">
                    <Coins className="w-6 h-6 text-emerald-400 mb-2"/>
                    <div><p className="text-xs text-emerald-400/80 font-medium">Cash</p><p className="text-2xl font-bold text-white font-mono">₵{stats.cash}</p></div>
                </div>
                <div className="snap-start min-w-[140px] bg-blue-900/40 border border-blue-500/20 p-4 rounded-2xl flex flex-col justify-between">
                    <CreditCard className="w-6 h-6 text-blue-400 mb-2"/>
                    <div><p className="text-xs text-blue-400/80 font-medium">MoMo</p><p className="text-2xl font-bold text-white font-mono">₵{stats.momo}</p></div>
                </div>
                {stats.groups.map(g => (
                    <div key={g.name} className="snap-start min-w-[100px] bg-white/5 border border-white/5 p-4 rounded-2xl flex flex-col justify-center items-center text-center">
                        <p className="text-[10px] text-slate-400 font-bold uppercase">{g.name.replace('Group ', 'Grp ')}</p>
                        <p className="text-xl font-bold text-white mt-1">{g.count}</p>
                    </div>
                ))}
            </div>

            {/* CONTROLS */}
            <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative group">
                    <Search className="absolute left-4 top-3.5 w-5 h-5 text-slate-500 group-focus-within:text-indigo-400 transition-colors"/>
                    <input type="text" placeholder="Search campers..." value={search} onChange={e => setSearch(e.target.value)}
                        className="w-full bg-white/5 hover:bg-white/10 focus:bg-black/40 border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-white outline-none focus:border-indigo-500/50 transition-all"/>
                </div>
                <div className="flex gap-2 overflow-x-auto pb-1">
                     <button onClick={() => setIsRegistering(true)} className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-2xl font-bold shadow-lg shadow-indigo-900/20 flex items-center gap-2 whitespace-nowrap transition-all active:scale-95"><Plus className="w-5 h-5"/> New Camper</button>
                     <select value={branchFilter} onChange={e => setBranchFilter(e.target.value)} className="bg-white/5 border border-white/10 text-slate-300 rounded-2xl px-4 py-3 outline-none focus:border-indigo-500 appearance-none">
                        <option value="">All Branches</option>
                        {CHURCH_BRANCHES.map(b => <option key={b} className="bg-slate-900">{b}</option>)}
                     </select>
                </div>
            </div>

            {/* FILTERS TABS */}
            <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                {['all', 'owing', 'paid', 'checked_in'].map(f => (
                    // Fix 2: Added type="button"
                    <button type="button" key={f} onClick={() => setFilter(f)} className={`px-5 py-2 rounded-full text-xs font-bold uppercase tracking-wider border transition-all whitespace-nowrap ${filter === f ? 'bg-white text-slate-900 border-white' : 'bg-transparent text-slate-400 border-slate-700 hover:border-slate-500'}`}>
                        {f.replace('_', ' ')}
                    </button>
                ))}
            </div>

            {/* GRID LAYOUT */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filtered.map(p => {
                    const balance = REG_FEE - (p.amount_paid || 0);
                    const isOwing = balance > 0;
                    const isCheckedIn = p.checked_in;
                    
                    return (
                        <div key={p.id} onClick={() => setReportPerson(p)} className="bg-white/5 backdrop-blur-md border border-white/5 rounded-3xl p-5 hover:bg-white/10 hover:border-white/10 transition-all cursor-pointer group active:scale-[0.98]">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="font-bold text-lg text-white leading-tight">{p.full_name}</h3>
                                    <p className="text-xs text-slate-400 mt-1">{p.branch} • {p.role}</p>
                                </div>
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isCheckedIn ? 'bg-indigo-500/20 text-indigo-400' : (isOwing ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/20 text-emerald-400')}`}>
                                    {isCheckedIn ? <CheckCircle className="w-4 h-4"/> : (isOwing ? <AlertCircle className="w-4 h-4"/> : <CheckCircle className="w-4 h-4"/>)}
                                </div>
                            </div>
                            
                            <div className="mb-4">
                                {isCheckedIn ? (
                                    <div className="bg-indigo-900/20 border border-indigo-500/20 rounded-xl p-3 text-center">
                                        <p className="text-[10px] uppercase text-indigo-300 font-bold tracking-widest">Admitted To</p>
                                        <p className="text-xl font-bold text-white">{p.grace_school}</p>
                                    </div>
                                ) : (
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-2xl font-bold text-white font-mono">₵{p.amount_paid}</span>
                                        <span className="text-xs text-slate-500 font-medium">/ ₵{REG_FEE}</span>
                                        {isOwing && <span className="ml-auto text-[10px] font-bold bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded border border-amber-500/20">OWING ₵{balance}</span>}
                                    </div>
                                )}
                            </div>

                            <div className="flex gap-2" onClick={e => e.stopPropagation()}>
                                {/* Fix 2: Added type="button" */}
                                <button type="button" onClick={() => { setSelectedPerson(p); setModalMode('payment'); }} className="flex-1 bg-white/5 hover:bg-white/10 text-slate-200 py-2.5 rounded-xl text-xs font-bold border border-white/5 transition-colors flex items-center justify-center gap-2">
                                    <Coins className="w-3 h-3"/> Pay
                                </button>
                                {!isCheckedIn && (
                                    // Fix 2: Added type="button"
                                    <button type="button" onClick={() => { setSelectedPerson(p); setModalMode('checkin'); }} disabled={isOwing} className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-2 ${isOwing ? 'bg-white/5 text-slate-600 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-500 text-white'}`}>
                                        <LogOut className="w-3 h-3 rotate-180"/> Admit
                                    </button>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </main>

        {/* MODAL ORCHESTRATION */}
        <RegistrationModal isOpen={isRegistering} onClose={() => setIsRegistering(false)} onRegister={handleRegister} processing={processing} />
        {reportPerson && <UserReportModal person={reportPerson} onClose={() => setReportPerson(null)} onUpdate={fetchPeople} supabase={supabase} />}
        
        {selectedPerson && (
            <ModalBackdrop onClose={() => setSelectedPerson(null)}>
                <div className="bg-[#1e293b] w-full max-w-sm rounded-3xl border border-white/10 p-6 animate-in zoom-in-95">
                    <h3 className="text-lg font-bold text-white mb-4">{modalMode === 'payment' ? 'Record Payment' : 'Check-In Confirmation'}</h3>
                    <div className="bg-white/5 rounded-xl p-4 mb-4">
                        <p className="text-xs text-slate-400">Camper</p>
                        <p className="text-white font-bold">{selectedPerson.full_name}</p>
                        <p className="text-xs text-slate-400 mt-2">Current Status</p>
                        <p className={`font-mono ${selectedPerson.amount_paid >= REG_FEE ? 'text-emerald-400' : 'text-amber-400'}`}>₵{selectedPerson.amount_paid} Paid</p>
                    </div>

                    {modalMode === 'payment' ? (
                        <div className="space-y-3">
                            <div><label className="text-xs text-slate-400 block mb-1">Top-up Amount</label><input type="number" className="w-full bg-black/30 border border-white/10 rounded-xl p-3 text-white text-lg font-mono focus:border-indigo-500 outline-none" autoFocus value={topUpAmount} onChange={e => setTopUpAmount(e.target.value)} /></div>
                            <div><label className="text-xs text-slate-400 block mb-1">Method</label><select className="w-full bg-black/30 border border-white/10 rounded-xl p-3 text-white" value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}><option>Cash</option><option>MoMo</option></select></div>
                            <button onClick={handlePayment} disabled={processing} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-xl mt-2">{processing ? 'Processing...' : 'Confirm Payment'}</button>
                        </div>
                    ) : (
                        <button onClick={handleAdmit} disabled={processing} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl">{processing ? 'Checking In...' : 'Confirm Admission'}</button>
                    )}
                    {/* Fix 2: Added type="button" */}
                    <button type="button" onClick={() => setSelectedPerson(null)} className="w-full py-3 text-slate-500 font-bold text-xs mt-2 hover:text-white">Cancel</button>
                </div>
            </ModalBackdrop>
        )}
    </div>
  );
}