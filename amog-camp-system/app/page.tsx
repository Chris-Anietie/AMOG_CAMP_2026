"use client";
import { useEffect, useState, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';

// --- PASTE YOUR KEYS HERE ---
const supabaseUrl = "https://ujbhfbpigvwkoygytvww.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVqYmhmYnBpZ3Z3a295Z3l0dnd3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUxODY2MTMsImV4cCI6MjA4MDc2MjYxM30.xleJuD1h9F85dLqWL6uMB_KedCmLh0-CRLikByUSaaE";
const supabase = createClient(supabaseUrl, supabaseKey);

// CONSTANTS
const GRACE_SCHOOLS = ['Red House', 'Blue House', 'Green House', 'Yellow House'];
const IDLE_TIMEOUT_SECONDS = 600; // Extended to 10 mins
const SUPER_ADMINS = ['admin@camp.com']; 

// --- TOAST NOTIFICATION ---
function Toast({ msg, type, onClose }: { msg: string, type: 'success' | 'error' | 'warning', onClose: () => void }) {
  useEffect(() => {
    if (type !== 'warning') { 
      const timer = setTimeout(onClose, 4000);
      return () => clearTimeout(timer);
    }
  }, [onClose, type]);

  const bgColors = {
    success: 'bg-emerald-600',
    error: 'bg-red-600',
    warning: 'bg-amber-500'
  };

  return (
    <div className={`fixed top-6 right-6 z-[100] px-6 py-4 rounded-xl shadow-2xl flex items-center gap-4 animate-in slide-in-from-top duration-300 text-white backdrop-blur-md ${bgColors[type]}`}>
      <span className="text-2xl">{type === 'success' ? '✨' : type === 'error' ? '🚫' : '⚠️'}</span>
      <div>
        <h4 className="font-bold text-lg capitalize tracking-wide">{type}</h4>
        <p className="font-medium opacity-90">{msg}</p>
      </div>
      <button onClick={onClose} className="ml-4 opacity-70 hover:opacity-100 font-bold text-xl">✕</button>
    </div>
  );
}

export default function Home() {
  // STATE
  const [session, setSession] = useState<any>(null);
  const [people, setPeople] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all'); 
  const [isOnline, setIsOnline] = useState(true); 
  const [historyLogs, setHistoryLogs] = useState<any[]>([]);
  
  // MODAL STATES
  const [selectedPerson, setSelectedPerson] = useState<any>(null);
  const [isRegistering, setIsRegistering] = useState(false); 
  const [showHistory, setShowHistory] = useState(false);

  // FORM DATA
  const [topUpAmount, setTopUpAmount] = useState<string | number>(''); 
  const [targetFee, setTargetFee] = useState(400);
  const [paymentMethod, setPaymentMethod] = useState('Cash'); 
  const [processing, setProcessing] = useState(false);
  const [gender, setGender] = useState('Male');

  // NEW REGISTRATION FORM DATA (Extended)
  const [newReg, setNewReg] = useState({ 
    full_name: '', 
    phone_number: '', 
    role: 'Member', 
    branch: 'Main',
    t_shirt: 'L',
    invited_by: ''
  });

  // UI STATE
  const [toast, setToast] = useState<{msg: string, type: 'success' | 'error' | 'warning'} | null>(null);
  const idleTimerRef = useRef<NodeJS.Timeout | null>(null);

  // --- 1. OFFLINE DETECTION ---
  useEffect(() => {
    setIsOnline(navigator.onLine);
    const handleOnline = () => { setIsOnline(true); showToast("Back Online! Syncing...", "success"); fetchPeople(); };
    const handleOffline = () => { setIsOnline(false); showToast("YOU ARE OFFLINE.", "warning"); };
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => { window.removeEventListener('online', handleOnline); window.removeEventListener('offline', handleOffline); };
  }, []);

  // --- AUTH & IDLE LOGIC ---
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => setSession(session));
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session) return;
    const resetIdle = () => {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      idleTimerRef.current = setTimeout(() => {
        supabase.auth.signOut();
        showToast("Session expired due to inactivity", "warning");
      }, IDLE_TIMEOUT_SECONDS * 1000);
    };
    window.addEventListener('mousemove', resetIdle);
    window.addEventListener('keydown', resetIdle);
    resetIdle();
    return () => {
      window.removeEventListener('mousemove', resetIdle);
      window.removeEventListener('keydown', resetIdle);
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    };
  }, [session]);

  // --- DATA FETCHING ---
  async function fetchPeople() {
    if (supabaseUrl.includes("PASTE_YOUR")) return;
    const { data } = await supabase.from('participants').select('*').order('full_name');
    setPeople(data || []);
  }

  async function fetchHistory() {
    const { data, error } = await supabase.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(50);
    if (error) {
        console.error(error);
        showToast("Could not load history", "error");
    } else {
        setHistoryLogs(data || []);
        setShowHistory(true);
    }
  }

  useEffect(() => { 
    if (session) {
      fetchPeople(); 
      const channel = supabase
        .channel('participants_changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'participants' }, () => { fetchPeople(); })
        .subscribe();
      return () => { supabase.removeChannel(channel); };
    }
  }, [session]);

  const showToast = (msg: string, type: 'success' | 'error' | 'warning') => setToast({ msg, type });

  // --- LOGIC: AUDIT LOGGER ---
  async function logAction(action: string, details: string) {
    if (!isOnline) return; 
    await supabase.from('audit_logs').insert([{ staff_email: session?.user?.email, action_type: action, details: details }]);
  }

  // --- CSV EXPORT ---
  const downloadCSV = () => {
    const headers = ['Full Name', 'Role', 'Branch', 'Phone', 'Status', 'Paid (GHC)', 'T-Shirt', 'Invited By', 'School', 'Checked In At', 'Staff'];
    const csvRows = [headers.join(',')];
    people.forEach(p => {
      const row = [
        `"${p.full_name}"`, p.role, p.branch, `'${p.phone_number}`, p.payment_status, p.amount_paid,
        p.t_shirt || '-', p.invited_by || '-', p.grace_school || '-', p.checked_in_at ? new Date(p.checked_in_at).toLocaleTimeString() : '-', p.checked_in_by || '-'
      ];
      csvRows.push(row.join(','));
    });
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `AMOG_DATA_${new Date().toLocaleDateString()}.csv`;
    a.click();
    showToast("Data exported successfully", "success");
  };

  // --- OPEN MODAL ---
  const openCheckIn = (person: any) => {
    setSelectedPerson(person);
    const isLeader = person.role?.toLowerCase().includes('leader') || person.role?.toLowerCase().includes('pastor');
    setTargetFee(isLeader ? 1000 : 400);
    setTopUpAmount(''); 
    setPaymentMethod('Cash'); 
    setGender(person.gender || 'Male');
  };

  async function handleCheckIn() {
    if (!isOnline) { showToast("Offline mode: Cannot sync.", "error"); return; }
    setProcessing(true);
    
    const previousPaid = selectedPerson.amount_paid || 0;
    const newMoney = Number(topUpAmount) || 0;
    const totalPaid = previousPaid + newMoney;
    
    const balance = targetFee - totalPaid;
    const isFullyPaid = balance <= 0;
    const status = isFullyPaid ? 'Paid' : 'Partial'; 
    const shouldCheckIn = isFullyPaid; 
    
    const currentSchool = selectedPerson.grace_school;
    const randomSchool = currentSchool || (shouldCheckIn ? GRACE_SCHOOLS[Math.floor(Math.random() * GRACE_SCHOOLS.length)] : null);

    const { error } = await supabase.from('participants').update({
      gender: gender, 
      amount_paid: totalPaid, 
      payment_status: status, 
      payment_method: paymentMethod, 
      grace_school: randomSchool, 
      checked_in: shouldCheckIn, 
      checked_in_at: shouldCheckIn ? new Date().toISOString() : null, 
      checked_in_by: session?.user?.email
    }).eq('id', selectedPerson.id);

    if (error) { showToast("Sync Error: " + error.message, 'error'); } 
    else {
      const logDetails = `Added ₵${newMoney} via ${paymentMethod}. Total: ₵${totalPaid}. ${isFullyPaid ? 'Fully Paid.' : 'Still Owes.'}`;
      await logAction(shouldCheckIn ? 'Check-In' : 'Payment Top-Up', `${selectedPerson.full_name}: ${logDetails}`);
      
      await fetchPeople();
      
      if (shouldCheckIn) {
          const message = `Calvary greetings ${selectedPerson.full_name}! ✝️%0A%0AWelcome to the *AMOG CAMP MEETING 2026*.%0A%0A*Registration Complete:*%0A🏠 *House:* ${randomSchool}%0A💰 *Total Paid:* ₵${totalPaid}%0A%0AGod bless you!`;
          const waLink = `https://wa.me/233${selectedPerson.phone_number?.substring(1)}?text=${message}`;
          window.open(waLink, '_blank');
          showToast(`Verified & Checked In: ${selectedPerson.full_name}`, 'success');
          setSelectedPerson(null);
      } else {
          showToast(`Payment saved. Balance: ₵${balance}`, 'warning');
          setSelectedPerson(null);
      }
    }
    setProcessing(false);
  }

  async function handleDelete() {
    if (!isOnline) { showToast("Offline.", "error"); return; }
    if (!SUPER_ADMINS.includes(session?.user?.email)) { showToast("Only Admins can delete.", "error"); return; }
    if (!confirm(`Permanently delete ${selectedPerson.full_name}? This cannot be undone.`)) return;
    setProcessing(true);
    await logAction('Delete', `Deleted user: ${selectedPerson.full_name}`);
    await supabase.from('participants').delete().eq('id', selectedPerson.id);
    showToast("Participant removed.", 'success'); 
    setSelectedPerson(null);
    await fetchPeople();
    setProcessing(false);
  }

  // --- NEW REGISTRATION LOGIC ---
  async function handleNewRegistration() {
    if (!isOnline) { showToast("Offline.", "error"); return; }
    if (newReg.phone_number.length < 10) { showToast("Invalid Phone Number", "error"); return; }
    setProcessing(true);
    
    const existing = people.find(p => p.phone_number === newReg.phone_number);
    if (existing) { showToast(`${existing.full_name} is already registered!`, 'error'); setProcessing(false); return; }

    const { data, error } = await supabase.from('participants').insert([{
      full_name: newReg.full_name, 
      phone_number: newReg.phone_number, 
      role: newReg.role, 
      branch: newReg.branch,
      t_shirt: newReg.t_shirt,
      invited_by: newReg.invited_by,
      payment_status: 'Pending', 
      amount_paid: 0, 
      checked_in: false
    }]).select();

    if (error) { showToast(error.message, 'error'); } 
    else {
      await logAction('New Registration', `Registered: ${newReg.full_name}`);
      showToast("Registration Successful!", 'success');
      setIsRegistering(false); 
      setNewReg({ full_name: '', phone_number: '', role: 'Member', branch: 'Main', t_shirt: 'L', invited_by: '' }); 
      if (data && data[0]) openCheckIn(data[0]); 
    }
    setProcessing(false);
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const email = (e.target as any).email.value;
    const password = (e.target as any).password.value;
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) showToast("Invalid Credentials", 'error');
  };

  const filteredPeople = people.filter((p) => {
    const term = search.toLowerCase();
    const matchesSearch = (p.full_name || '').toLowerCase().includes(term) || (p.phone_number || '').includes(term);
    if (!matchesSearch) return false;
    if (filter === 'paid') return p.payment_status === 'Paid';
    if (filter === 'owing') return p.payment_status === 'Partial' || p.payment_status === 'Pending';
    if (filter === 'checked_in') return p.checked_in === true;
    return true; 
  }).sort((a, b) => (a.full_name || '').localeCompare(b.full_name || ''));

  const stats = { 
    checkedIn: people.filter(p => p.checked_in).length, 
    totalCash: people.filter(p => p.payment_method === 'Cash').reduce((sum, p) => sum + (p.amount_paid || 0), 0),
    totalMomo: people.filter(p => p.payment_method === 'MoMo').reduce((sum, p) => sum + (p.amount_paid || 0), 0),
    red: people.filter(p => p.grace_school === 'Red House').length,
    blue: people.filter(p => p.grace_school === 'Blue House').length,
    green: people.filter(p => p.grace_school === 'Green House').length,
    yellow: people.filter(p => p.grace_school === 'Yellow House').length,
  };

  // --- LOGIN SCREEN (GLASSMORPHISM) ---
  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0f172a] relative font-sans overflow-hidden">
         {/* Background with overlay */}
         <div className="absolute inset-0 z-0">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/90 via-purple-900/80 to-black/90 z-10"></div>
            <img src="/camp-bg.png" className="w-full h-full object-cover" alt="Background" />
         </div>
         
         <div className="relative z-20 w-full max-w-md p-8 mx-4">
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 p-8 rounded-3xl shadow-2xl">
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-extrabold text-white tracking-tight">AMOG <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">2026</span></h1>
                    <p className="text-blue-200 mt-2 font-medium">Official Help Desk Portal</p>
                </div>
                <form onSubmit={handleLogin} className="space-y-5">
                  <div>
                    <label className="text-xs font-bold text-blue-200 uppercase ml-1">Admin Email</label>
                    <input name="email" type="email" className="w-full p-4 rounded-xl bg-black/40 border border-white/10 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all" placeholder="Enter email..." required />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-blue-200 uppercase ml-1">Password</label>
                    <input name="password" type="password" className="w-full p-4 rounded-xl bg-black/40 border border-white/10 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all" placeholder="Enter password..." required />
                  </div>
                  <button className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white py-4 rounded-xl font-bold text-lg shadow-lg shadow-blue-900/50 transition-all transform hover:scale-[1.02]">Access Portal</button>
                </form>
            </div>
         </div>
         {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
      </div>
    );
  }

  // --- DASHBOARD (GLASS THEME) ---
  return (
    <div className="min-h-screen font-sans text-gray-100 bg-[#0f172a] relative pb-20 overflow-x-hidden">
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900/95 via-indigo-950/90 to-black/95 z-10"></div>
        <img src="/camp-bg.png" className="w-full h-full object-cover opacity-60" alt="bg" />
      </div>
      
      {!isOnline && ( <div className="fixed top-0 left-0 right-0 bg-red-600/90 text-white text-center py-2 text-xs font-bold z-[200] backdrop-blur">⚠️ OFFLINE MODE - CHANGES WILL NOT SAVE</div> )}
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-6 py-8">
        
        {/* HEADER AREA */}
        <div className="flex flex-col lg:flex-row justify-between items-center mb-8 gap-6">
          <div className="text-center lg:text-left">
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white drop-shadow-lg">AMOG <span className="text-indigo-400">2026</span></h1>
            <p className="text-slate-300 font-medium tracking-wide">Registration & Check-In Desk</p>
          </div>
          
          <div className="flex flex-wrap gap-3 justify-center">
            <div className="bg-white/5 backdrop-blur-md p-4 rounded-2xl border border-white/10 min-w-[100px] text-center">
                <p className="text-[10px] uppercase text-slate-400 font-bold tracking-wider">Checked In</p>
                <p className="text-2xl font-bold text-white">{stats.checkedIn} <span className="text-sm text-slate-500">/ {people.length}</span></p>
            </div>
            <div className="bg-emerald-900/40 backdrop-blur-md p-4 rounded-2xl border border-emerald-500/30 min-w-[120px] text-center">
                <p className="text-[10px] uppercase text-emerald-400 font-bold tracking-wider">Cash Total</p>
                <p className="text-2xl font-bold text-emerald-100">₵{stats.totalCash}</p>
            </div>
            <div className="bg-blue-900/40 backdrop-blur-md p-4 rounded-2xl border border-blue-500/30 min-w-[120px] text-center">
                <p className="text-[10px] uppercase text-blue-400 font-bold tracking-wider">MoMo Total</p>
                <p className="text-2xl font-bold text-blue-100">₵{stats.totalMomo}</p>
            </div>
            <button onClick={() => supabase.auth.signOut()} className="bg-red-500/20 hover:bg-red-500/40 text-red-200 px-6 rounded-2xl border border-red-500/30 font-bold transition-all">Logout</button>
          </div>
        </div>

        {/* CONTROLS BAR */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-2 md:p-3 rounded-2xl mb-8 flex flex-col md:flex-row gap-3">
           <div className="flex-1 relative">
              <span className="absolute left-4 top-3.5 text-gray-400">🔍</span>
              <input type="text" placeholder="Search by name or phone..." className="w-full pl-10 pr-4 py-3 rounded-xl bg-black/30 border border-white/10 text-white placeholder-gray-500 focus:bg-black/50 focus:border-indigo-500 outline-none transition-all" value={search} onChange={(e) => setSearch(e.target.value)} />
           </div>
           <div className="flex gap-2 overflow-x-auto no-scrollbar">
              <button onClick={() => setIsRegistering(true)} className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-indigo-900/50 flex items-center gap-2 whitespace-nowrap transition-all"><span>+</span> New</button>
              <button onClick={fetchHistory} className="bg-slate-700/50 hover:bg-slate-700 text-slate-200 px-5 py-3 rounded-xl font-bold border border-white/10 whitespace-nowrap transition-all">📜 Logs</button>
              <button onClick={downloadCSV} className="bg-emerald-600/80 hover:bg-emerald-600 text-white px-5 py-3 rounded-xl font-bold whitespace-nowrap transition-all">⬇ CSV</button>
           </div>
        </div>

        {/* FILTERS TABS */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
            {['all', 'checked_in', 'owing', 'paid'].map(f => (
                <button key={f} onClick={() => setFilter(f)} className={`px-6 py-2 rounded-full font-bold text-sm uppercase tracking-wide transition-all whitespace-nowrap border ${filter === f ? 'bg-white text-black border-white shadow-glow' : 'bg-transparent text-slate-400 border-slate-700 hover:border-slate-500'}`}>
                    {f.replace('_', ' ')}
                </button>
            ))}
        </div>

        {/* GRID OF REFLECTIVE CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 pb-20">
          {filteredPeople.map((person) => {
            const isPartial = !person.checked_in && person.amount_paid > 0;
            // Dynamic Glow Colors
            let glow = 'hover:shadow-indigo-500/20 border-indigo-500/30';
            if (person.checked_in) glow = 'hover:shadow-emerald-500/20 border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.1)]';
            else if (isPartial) glow = 'hover:shadow-amber-500/20 border-amber-500/50';

            return (
                <div key={person.id} className={`group relative bg-white/5 backdrop-blur-md rounded-2xl p-6 border transition-all duration-300 hover:-translate-y-1 hover:bg-white/10 ${glow}`}>
                  <div className="flex justify-between items-start mb-4">
                     <div>
                        <h2 className="text-xl font-bold text-white leading-tight">{person.full_name}</h2>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs font-bold px-2 py-0.5 rounded bg-white/10 text-slate-300 uppercase tracking-wide">{person.role}</span>
                            <span className="text-xs text-slate-500">{person.branch}</span>
                        </div>
                     </div>
                     {person.payment_status !== 'Paid' && <span className="text-xs font-bold text-amber-400 bg-amber-900/30 px-2 py-1 rounded border border-amber-500/30">OWING</span>}
                  </div>
                  
                  {person.checked_in ? (
                     <div className="bg-emerald-900/20 p-4 rounded-xl border border-emerald-500/30 flex justify-between items-center">
                        <div>
                            <p className="text-[10px] uppercase text-emerald-400 font-bold">House Allocated</p>
                            <p className="font-bold text-white text-lg">{person.grace_school}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] uppercase text-emerald-400 font-bold">Paid</p>
                            <p className="text-emerald-300 font-mono text-lg">₵{person.amount_paid}</p>
                        </div>
                     </div>
                  ) : (
                    <div>
                         <div className="flex justify-between items-center mb-3">
                            <span className="text-sm text-slate-400">Paid so far:</span>
                            <span className={`font-mono font-bold text-lg ${isPartial ? 'text-amber-400' : 'text-slate-500'}`}>₵{person.amount_paid}</span>
                         </div>
                         <button onClick={() => openCheckIn(person)} className={`w-full py-3 rounded-xl font-bold shadow-lg transition-all ${isPartial ? 'bg-amber-600 hover:bg-amber-500 text-white' : 'bg-white/10 hover:bg-white/20 text-white border border-white/10'}`}>
                             {isPartial ? 'Complete Payment' : 'Check In'}
                         </button>
                    </div>
                  )}
                </div>
            );
          })}
        </div>
      </div>

      {/* --- MODAL: HISTORY LOGS (Dark Theme) --- */}
      {showHistory && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm animate-in fade-in">
           <div className="bg-[#1e293b] border border-white/10 rounded-2xl w-full max-w-2xl h-[80vh] flex flex-col shadow-2xl">
              <div className="p-5 border-b border-white/10 flex justify-between items-center bg-white/5">
                 <h2 className="font-bold text-xl text-white">Transaction History</h2>
                 <button onClick={() => setShowHistory(false)} className="bg-white/10 hover:bg-white/20 w-8 h-8 rounded-full text-white transition-all">✕</button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                 {historyLogs.length === 0 ? (
                    <div className="text-center text-slate-500 mt-10">No transaction logs found yet.</div>
                 ) : (
                     historyLogs.map((log, i) => (
                        <div key={i} className="p-4 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                           <div className="flex justify-between mb-1">
                               <span className="font-mono text-xs text-indigo-400">{new Date(log.created_at).toLocaleString()}</span>
                               <span className="text-[10px] uppercase text-slate-500 tracking-wider">Action: {log.action_type}</span>
                           </div>
                           <p className="text-slate-200 text-sm">{log.details}</p>
                           <p className="text-xs text-slate-600 mt-2">By: {log.staff_email}</p>
                        </div>
                     ))
                 )}
              </div>
           </div>
        </div>
      )}

      {/* --- MODAL: CHECK IN & TOP UP (Dark Theme) --- */}
      {selectedPerson && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in zoom-in-95">
          <div className="bg-[#0f172a] border border-white/10 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-900/50 to-slate-900/50 p-6 border-b border-white/10 flex justify-between items-center">
               <div>
                  <h2 className="text-2xl font-bold text-white">{selectedPerson.full_name}</h2>
                  <span className="text-indigo-300 text-xs font-bold uppercase tracking-wider">{selectedPerson.role}</span>
               </div>
               <button onClick={() => setSelectedPerson(null)} className="bg-white/10 hover:bg-white/20 text-white w-10 h-10 rounded-full transition-all">✕</button>
            </div>
            
            <div className="p-6 space-y-6">
               {/* Controls */}
               <div className="grid grid-cols-2 gap-4">
                  <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 block">Payment Method</label>
                      <select className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-white outline-none focus:border-indigo-500" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                          <option className="bg-slate-800" value="Cash">💵 Cash</option>
                          <option className="bg-slate-800" value="MoMo">📱 MoMo</option>
                      </select>
                  </div>
                  <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 block">Gender</label>
                      <div className="flex bg-white/5 rounded-xl p-1 border border-white/10">
                          <button disabled={!!selectedPerson.gender} onClick={() => setGender('Male')} className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${gender === 'Male' ? 'bg-indigo-600 text-white shadow' : 'text-slate-500 hover:text-slate-300'}`}>Male</button>
                          <button disabled={!!selectedPerson.gender} onClick={() => setGender('Female')} className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${gender === 'Female' ? 'bg-pink-600 text-white shadow' : 'text-slate-500 hover:text-slate-300'}`}>Female</button>
                      </div>
                  </div>
               </div>
               
               {/* Money Input */}
               <div className="bg-black/30 p-5 rounded-2xl border border-dashed border-slate-700">
                  <div className="flex justify-between mb-3 text-sm">
                     <span className="text-slate-400">Paid Previously:</span>
                     <span className="font-mono font-bold text-white">₵{selectedPerson.amount_paid || 0}</span>
                  </div>
                  <div className="flex items-center gap-3">
                     <span className="text-2xl font-bold text-green-500">+</span>
                     <input type="number" className="w-full bg-transparent border-b-2 border-slate-600 focus:border-green-500 p-2 text-3xl font-mono font-bold text-white outline-none placeholder-slate-700" placeholder="0" value={topUpAmount} onChange={(e) => setTopUpAmount(e.target.value)} />
                  </div>
                  <div className="text-right mt-3 text-xs font-mono text-slate-400">
                     New Total: <span className="text-white font-bold">₵{(selectedPerson.amount_paid || 0) + (Number(topUpAmount) || 0)}</span> <span className="text-slate-600">/ ₵{targetFee}</span>
                  </div>
               </div>
            </div>
            
            <div className="p-6 bg-white/5 border-t border-white/10 flex gap-4">
               <button onClick={() => setSelectedPerson(null)} className="flex-1 py-4 font-bold text-slate-400 hover:text-white transition-colors">Cancel</button>
               <button onClick={handleCheckIn} disabled={processing} className={`flex-[2] py-4 text-white rounded-xl text-lg font-bold shadow-xl transition-transform active:scale-95 ${((selectedPerson.amount_paid || 0) + (Number(topUpAmount) || 0)) >= targetFee ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-amber-600 hover:bg-amber-500'}`}>
                   {processing ? 'Processing...' : (((selectedPerson.amount_paid || 0) + (Number(topUpAmount) || 0)) >= targetFee ? 'CONFIRM CHECK IN' : 'SAVE PARTIAL')}
               </button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL: NEW REGISTRATION (Expanded) --- */}
      {isRegistering && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in zoom-in-95">
          <div className="bg-[#0f172a] border border-white/10 rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="bg-gradient-to-r from-blue-900/50 to-indigo-900/50 p-6 border-b border-white/10 flex justify-between items-center shrink-0">
                <h2 className="text-2xl font-bold text-white">New Registration</h2>
                <button onClick={() => setIsRegistering(false)} className="bg-white/10 hover:bg-white/20 text-white w-10 h-10 rounded-full transition-all">✕</button>
            </div>
            
            <div className="p-6 space-y-5 overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                      <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">Full Name</label>
                      <input type="text" className="w-full p-4 rounded-xl bg-black/30 border border-white/10 text-white focus:border-indigo-500 outline-none" placeholder="First Last" value={newReg.full_name} onChange={e => setNewReg({...newReg, full_name: e.target.value})} />
                  </div>
                  <div>
                      <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">Phone Number</label>
                      <input type="tel" className="w-full p-4 rounded-xl bg-black/30 border border-white/10 text-white focus:border-indigo-500 outline-none" placeholder="055..." value={newReg.phone_number} onChange={e => setNewReg({...newReg, phone_number: e.target.value})} />
                  </div>
              </div>

              <div className="grid grid-cols-2 gap-5">
                 <div>
                    <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">Role</label>
                    <select className="w-full p-4 rounded-xl bg-black/30 border border-white/10 text-white focus:border-indigo-500 outline-none" value={newReg.role} onChange={e => setNewReg({...newReg, role: e.target.value})}>
                        <option className="bg-slate-800">Member</option>
                        <option className="bg-slate-800">Leader</option>
                        <option className="bg-slate-800">Pastor</option>
                        <option className="bg-slate-800">Guest</option>
                    </select>
                 </div>
                 <div>
                    <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">Branch</label>
                    <input type="text" className="w-full p-4 rounded-xl bg-black/30 border border-white/10 text-white focus:border-indigo-500 outline-none" placeholder="e.g. Main" value={newReg.branch} onChange={e => setNewReg({...newReg, branch: e.target.value})} />
                 </div>
              </div>

              {/* NEW FIELDS */}
              <div className="grid grid-cols-2 gap-5">
                 <div>
                    <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">T-Shirt Size</label>
                    <select className="w-full p-4 rounded-xl bg-black/30 border border-white/10 text-white focus:border-indigo-500 outline-none" value={newReg.t_shirt} onChange={e => setNewReg({...newReg, t_shirt: e.target.value})}>
                        <option className="bg-slate-800" value="S">Small</option>
                        <option className="bg-slate-800" value="M">Medium</option>
                        <option className="bg-slate-800" value="L">Large</option>
                        <option className="bg-slate-800" value="XL">XL</option>
                        <option className="bg-slate-800" value="XXL">XXL</option>
                    </select>
                 </div>
                 <div>
                    <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">Invited By</label>
                    <input type="text" className="w-full p-4 rounded-xl bg-black/30 border border-white/10 text-white focus:border-indigo-500 outline-none" placeholder="Name of inviter (optional)" value={newReg.invited_by} onChange={e => setNewReg({...newReg, invited_by: e.target.value})} />
                 </div>
              </div>

              <button onClick={handleNewRegistration} disabled={processing} className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white py-4 rounded-xl font-bold text-lg mt-2 shadow-lg transition-transform active:scale-95">Complete Registration</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}