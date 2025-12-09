"use client";
import { useEffect, useState, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import { SpeedInsights } from "@vercel/speed-insights/next";

// --- PASTE YOUR KEYS HERE ---
const supabaseUrl = "https://ujbhfbpigvwkoygytvww.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVqYmhmYnBpZ3Z3a295Z3l0dnd3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUxODY2MTMsImV4cCI6MjA4MDc2MjYxM30.xleJuD1h9F85dLqWL6uMB_KedCmLh0-CRLikByUSaaE";
const supabase = createClient(supabaseUrl, supabaseKey);

// CONSTANTS
const GRACE_SCHOOLS = ['Red House', 'Blue House', 'Green House', 'Yellow House'];
const IDLE_TIMEOUT_SECONDS = 300; 
const SUPER_ADMINS = ['admin@camp.com']; 

// --- TOAST NOTIFICATION ---
function Toast({ msg, type, onClose }: { msg: string, type: 'success' | 'error' | 'warning', onClose: () => void }) {
  useEffect(() => {
    if (type !== 'warning') { 
      const timer = setTimeout(onClose, 4000);
      return () => clearTimeout(timer);
    }
  }, [onClose, type]);

  const bgClass = type === 'success' ? 'bg-green-600' : type === 'error' ? 'bg-red-600' : 'bg-yellow-500';

  return (
    <div className={`fixed top-4 left-4 right-4 md:left-auto md:right-4 md:w-auto z-[100] px-4 py-3 rounded-lg shadow-xl flex items-center gap-3 animate-in slide-in-from-top duration-300 text-white ${bgClass}`}>
      <span className="text-lg font-bold">{type === 'success' ? '✓' : type === 'error' ? 'X' : '⚠️'}</span>
      <div className="flex-1">
        <p className="font-semibold text-sm">{msg}</p>
      </div>
      <button onClick={onClose} className="opacity-70 hover:opacity-100 font-bold">✕</button>
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
  
  // MODAL STATES
  const [selectedPerson, setSelectedPerson] = useState<any>(null);
  const [isRegistering, setIsRegistering] = useState(false); 

  // FORM DATA
  const [amountPaid, setAmountPaid] = useState<string | number>(''); 
  const [targetFee, setTargetFee] = useState(400);
  const [paymentMethod, setPaymentMethod] = useState('Cash'); 
  const [processing, setProcessing] = useState(false);
  const [gender, setGender] = useState('Male');

  // NEW REGISTRATION FORM DATA
  const [newReg, setNewReg] = useState({ full_name: '', phone_number: '', role: 'Member', branch: 'Main' });

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
        showToast("Logged out due to inactivity", "error");
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

  // --- DATA FETCHING & REALTIME ---
  async function fetchPeople() {
    if (supabaseUrl.includes("PASTE_YOUR")) return;
    const { data } = await supabase.from('participants').select('*').order('full_name');
    setPeople(data || []);
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

  // --- LOGIC: EXPORT TO CSV ---
  const downloadCSV = () => {
    const headers = ['Full Name', 'Role', 'Branch', 'Phone', 'Status', 'Paid (GHC)', 'Method', 'School', 'Checked In At', 'Staff'];
    const csvRows = [headers.join(',')];
    people.forEach(p => {
      const row = [
        `"${p.full_name}"`, p.role, p.branch, `'${p.phone_number}`, p.payment_status, p.amount_paid,
        p.payment_method || '-', p.grace_school || '-', p.checked_in_at ? new Date(p.checked_in_at).toLocaleTimeString() : '-', p.checked_in_by || '-'
      ];
      csvRows.push(row.join(','));
    });
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `CAMP_DATA_${new Date().getHours()}h${new Date().getMinutes()}.csv`;
    a.click();
    showToast("Export downloaded!", "success");
  };

  const openCheckIn = (person: any) => {
    setSelectedPerson(person);
    const isLeader = person.role?.toLowerCase().includes('leader') || person.role?.toLowerCase().includes('pastor');
    setTargetFee(isLeader ? 1000 : 400);
    setAmountPaid(person.amount_paid > 0 ? person.amount_paid : ''); 
    setPaymentMethod(person.payment_method || 'Cash');
  };

  async function handleCheckIn() {
    if (!isOnline) { showToast("Cannot check in while OFFLINE!", "error"); return; }
    setProcessing(true);
    
    const paidValue = Number(amountPaid) || 0;
    const balance = targetFee - paidValue;
    const status = balance <= 0 ? 'Paid' : 'Partial';
    
    // HOUSE ALLOCATION
    const currentSchool = selectedPerson.grace_school;
    const randomSchool = currentSchool || GRACE_SCHOOLS[Math.floor(Math.random() * GRACE_SCHOOLS.length)];

    const { error } = await supabase.from('participants').update({
      gender: gender, amount_paid: paidValue, payment_status: status, payment_method: paymentMethod,
      grace_school: randomSchool, checked_in: true, checked_in_at: new Date().toISOString(), checked_in_by: session?.user?.email
    }).eq('id', selectedPerson.id);

    if (error) { showToast("Database Error!", 'error'); } 
    else {
      await logAction('Check-In', `Checked in ${selectedPerson.full_name}. Paid: ${paidValue} via ${paymentMethod}`);
      await fetchPeople();
      const message = `Calvary greetings ${selectedPerson.full_name}! ✝️%0A%0AWelcome to the *AMOG CAMP MEETING 2026*. We are expecting a mighty move of God! 🔥%0A%0A*Your Registration Details:*%0A🏠 *Grace House:* ${randomSchool}%0A💰 *Payment:* ${status} (Paid ₵${paidValue})%0A%0AGod bless you as you settle in!`;
      const waLink = `https://wa.me/233${selectedPerson.phone_number?.substring(1)}?text=${message}`;
      window.open(waLink, '_blank');
      showToast(`Checked in ${selectedPerson.full_name}!`, 'success');
      setSelectedPerson(null);
    }
    setProcessing(false);
  }

  async function handleDelete() {
    if (!isOnline) { showToast("Cannot delete while offline.", "error"); return; }
    if (!SUPER_ADMINS.includes(session?.user?.email)) { showToast("Access Denied: Only Admins can delete.", "error"); return; }
    if (!confirm(`Are you sure you want to PERMANENTLY DELETE ${selectedPerson.full_name}?`)) return;
    setProcessing(true);
    await logAction('Delete', `Deleted user: ${selectedPerson.full_name} (${selectedPerson.phone_number})`);
    const { error } = await supabase.from('participants').delete().eq('id', selectedPerson.id);
    if (error) { showToast(error.message, 'error'); } 
    else { showToast("Participant deleted successfully.", 'success'); setSelectedPerson(null); }
    setProcessing(false);
  }

  // --- LOGIC: NEW REGISTRATION ---
  async function handleNewRegistration() {
    if (!isOnline) { showToast("Cannot register while offline.", "error"); return; }
    if (newReg.phone_number.length < 10) { showToast("Phone number is too short!", "error"); return; }
    
    setProcessing(true);
    const existing = people.find(p => p.phone_number === newReg.phone_number);
    if (existing) { showToast(`Wait! ${existing.full_name} is already registered.`, 'error'); setProcessing(false); return; }

    const { data, error } = await supabase.from('participants').insert([{
      full_name: newReg.full_name, phone_number: newReg.phone_number, role: newReg.role, branch: newReg.branch,
      payment_status: 'Pending', amount_paid: 0, checked_in: false
    }]).select();

    if (error) { showToast(error.message, 'error'); } 
    else {
      await logAction('New Registration', `Registered: ${newReg.full_name}`);
      showToast("Registration Successful!", 'success');
      setIsRegistering(false); 
      setNewReg({ full_name: '', phone_number: '', role: 'Member', branch: 'Main' }); 
      if (data && data[0]) openCheckIn(data[0]); 
    }
    setProcessing(false);
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isOnline) { showToast("You are offline. Cannot log in.", "error"); return; }
    const email = (e.target as any).email.value;
    const password = (e.target as any).password.value;
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) showToast(error.message, 'error');
  };

  // --- FILTERS ---
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
    // House Stats
    red: people.filter(p => p.grace_school === 'Red House').length,
    blue: people.filter(p => p.grace_school === 'Blue House').length,
    green: people.filter(p => p.grace_school === 'Green House').length,
    yellow: people.filter(p => p.grace_school === 'Yellow House').length,
  };

  // --- LOGIN SCREEN ---
  if (!session) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 relative font-sans p-4">
         <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 via-purple-900 to-black z-0"></div>
         <img src="/camp-bg.png" className="absolute inset-0 w-full h-full object-cover opacity-40 mix-blend-overlay z-0" />
         
         <div className="bg-white/95 p-6 rounded-2xl shadow-xl w-[90%] max-w-[350px] relative z-10 backdrop-blur-xl border border-white/10">
            <h1 className="text-2xl font-extrabold text-center mb-1 text-gray-900">AMOG Camp</h1>
            <p className="text-center text-gray-500 mb-6 text-sm">Help Desk Portal</p>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="text-sm font-bold text-gray-700 block mb-1">Email</label>
                <input name="email" type="email" className="w-full p-3 border rounded-lg text-gray-900 bg-white text-base focus:ring-2 focus:ring-indigo-500 outline-none" required />
              </div>
              <div>
                <label className="text-sm font-bold text-gray-700 block mb-1">Password</label>
                <input name="password" type="password" className="w-full p-3 border rounded-lg text-gray-900 bg-white text-base focus:ring-2 focus:ring-indigo-500 outline-none" required />
              </div>
              <button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-lg font-bold text-base shadow-lg transition-transform active:scale-95">Sign In</button>
            </form>
         </div>
         {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
      </div>
    );
  }

  // --- DASHBOARD ---
  return (
    <div className="min-h-screen font-sans text-gray-800 relative bg-gray-50 pb-20">
      <div className="fixed inset-0 z-0"><div className="absolute inset-0 bg-gradient-to-b from-indigo-900/90 to-black/80"></div><img src="/camp-bg.png" className="w-full h-full object-cover opacity-50" /></div>
      
      {!isOnline && ( <div className="fixed top-0 left-0 right-0 bg-red-600 text-white text-center py-1 text-xs font-bold z-[200]">OFFLINE MODE</div> )}
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      <div className="relative z-10 max-w-5xl mx-auto px-4 py-4">
        
        {/* HEADER (Compact) */}
        <div className="flex flex-col gap-4 mb-4 text-white">
          <div className="flex justify-between items-center">
             <div>
                <h1 className="text-xl md:text-3xl font-extrabold">AMOG Camp '26</h1>
                <p className="text-indigo-200 text-xs md:text-sm">Help Desk</p>
             </div>
             <button onClick={() => supabase.auth.signOut()} className="bg-red-500/20 text-red-100 px-3 py-2 rounded-lg border border-red-500/30 text-xs font-bold">Logout</button>
          </div>
          
          {/* STATS GRID (Tight) */}
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-white/10 p-2 rounded-lg text-center border border-white/20 backdrop-blur-md">
              <p className="text-[10px] uppercase opacity-70">Total</p>
              <p className="text-lg font-bold leading-tight">{stats.checkedIn}</p>
            </div>
            <div className="bg-green-600/30 p-2 rounded-lg text-center border border-green-500/30">
                <p className="text-[10px] uppercase text-green-300">Cash</p>
                <p className="text-lg font-bold leading-tight">₵{stats.totalCash}</p>
            </div>
            <div className="bg-blue-600/30 p-2 rounded-lg text-center border border-blue-500/30">
                <p className="text-[10px] uppercase text-blue-300">MoMo</p>
                <p className="text-lg font-bold leading-tight">₵{stats.totalMomo}</p>
            </div>
          </div>
        </div>

        {/* HOUSE STATS (Compact) */}
        <div className="grid grid-cols-4 gap-1 mb-4 text-[10px] font-bold text-white opacity-80">
          <div className="bg-red-900/40 text-center py-1 rounded border border-red-500/30">Red: {stats.red}</div>
          <div className="bg-blue-900/40 text-center py-1 rounded border border-blue-500/30">Blue: {stats.blue}</div>
          <div className="bg-green-900/40 text-center py-1 rounded border border-green-500/30">Grn: {stats.green}</div>
          <div className="bg-yellow-900/40 text-center py-1 rounded border border-yellow-500/30">Ylw: {stats.yellow}</div>
        </div>

        {/* SEARCH & ACTIONS */}
        <div className="flex gap-2 mb-4 sticky top-2 z-40">
            <input
              type="text"
              placeholder="Search..."
              className="flex-1 pl-4 pr-4 py-3 rounded-xl bg-white shadow-lg text-base outline-none border border-gray-100"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <button onClick={() => setIsRegistering(true)} className="bg-indigo-600 text-white px-4 rounded-xl font-bold shadow-lg flex items-center justify-center text-2xl leading-none active:scale-95">+</button>
        </div>

        {/* FILTERS (Scrollable) */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-2 no-scrollbar">
            {['all', 'checked_in', 'owing', 'paid'].map(f => (
                <button key={f} onClick={() => setFilter(f)} className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${filter === f ? 'bg-white text-indigo-900 shadow' : 'bg-white/10 text-white'}`}>
                    {f.replace('_', ' ').toUpperCase()}
                </button>
            ))}
             <button onClick={downloadCSV} className="px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap bg-blue-600 text-white shadow">CSV</button>
        </div>

        {/* PEOPLE LIST (Mobile Cards) */}
        <div className="space-y-3 pb-20">
          {filteredPeople.map((person) => (
            <div key={person.id} onClick={() => !person.checked_in && openCheckIn(person)} className={`bg-white rounded-xl p-4 shadow-sm border-l-4 flex justify-between items-center active:bg-gray-50 ${person.checked_in ? 'border-green-500' : 'border-indigo-500'}`}>
              <div>
                  <h2 className="text-base font-bold text-gray-900">{person.full_name}</h2>
                  <p className="text-gray-500 text-xs font-semibold uppercase">{person.role} • {person.branch}</p>
              </div>
              
              {person.checked_in ? (
                 <div className="text-right">
                    <span className="bg-green-100 text-green-800 text-[10px] px-2 py-1 rounded font-bold uppercase block mb-1">{person.grace_school}</span>
                    <span className="text-[10px] font-bold text-gray-400">Paid: ₵{person.amount_paid}</span>
                 </div>
              ) : (
                <div className="bg-indigo-50 text-indigo-600 p-2 rounded-full">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                    </svg>
                </div>
              )}
            </div>
          ))}
          {filteredPeople.length === 0 && (<p className="text-white text-center text-sm opacity-60 mt-8">No matching records.</p>)}
        </div>
      </div>

      {/* --- MODAL: NEW REGISTRATION (Bottom Sheet Style) --- */}
      {isRegistering && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-t-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
            <div className="bg-gray-50 p-4 border-b flex justify-between items-center">
                <h2 className="text-lg font-bold text-gray-900">New Registration</h2>
                <button onClick={() => setIsRegistering(false)} className="bg-gray-200 w-8 h-8 rounded-full font-bold">✕</button>
            </div>
            <div className="p-5 space-y-4 overflow-y-auto">
              <input type="text" className="w-full p-3 border rounded-lg bg-gray-50 text-base" placeholder="Full Name" value={newReg.full_name} onChange={e => setNewReg({...newReg, full_name: e.target.value})} />
              <input type="tel" className="w-full p-3 border rounded-lg bg-gray-50 text-base" placeholder="Phone (055...)" value={newReg.phone_number} onChange={e => setNewReg({...newReg, phone_number: e.target.value})} />
              <div className="flex gap-3">
                 <select className="flex-1 p-3 border rounded-lg bg-white" value={newReg.role} onChange={e => setNewReg({...newReg, role: e.target.value})}><option>Member</option><option>Leader</option><option>Pastor</option><option>Guest</option></select>
                 <input type="text" className="flex-1 p-3 border rounded-lg" placeholder="Branch" value={newReg.branch} onChange={e => setNewReg({...newReg, branch: e.target.value})} />
              </div>
              <button onClick={handleNewRegistration} disabled={processing} className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold text-lg">{processing ? 'Saving...' : 'Register'}</button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL: CHECK IN (Bottom Sheet Style) --- */}
      {selectedPerson && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-t-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
            <div className="bg-gray-50 p-4 border-b flex justify-between items-center">
               <div>
                  <h2 className="text-lg font-bold text-gray-900">{selectedPerson.full_name}</h2>
                  <span className="text-xs font-bold text-indigo-600 uppercase">{selectedPerson.role}</span>
               </div>
               <button onClick={() => setSelectedPerson(null)} className="bg-gray-200 w-8 h-8 rounded-full font-bold">✕</button>
            </div>
            <div className="p-5 space-y-4 overflow-y-auto">
               <div className="flex gap-3">
                  <select className="flex-1 p-3 border rounded-lg font-bold" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}><option value="Cash">💵 Cash</option><option value="MoMo">📱 MoMo</option></select>
                  <div className="flex bg-gray-100 rounded-lg p-1">
                      <button onClick={() => setGender('Male')} className={`px-4 rounded-md text-sm font-bold ${gender === 'Male' ? 'bg-indigo-600 text-white shadow' : 'text-gray-500'}`}>M</button>
                      <button onClick={() => setGender('Female')} className={`px-4 rounded-md text-sm font-bold ${gender === 'Female' ? 'bg-pink-600 text-white shadow' : 'text-gray-500'}`}>F</button>
                  </div>
               </div>
               
               <div className="bg-gray-50 p-4 rounded-xl border-2 border-dashed border-gray-300">
                  <div className="flex justify-between mb-2">
                     <span className="text-xs font-bold uppercase text-gray-500">Amount Paid (Target: ₵{targetFee})</span>
                     {Number(amountPaid) >= targetFee ? <span className="text-xs font-bold text-green-600">PAID ✓</span> : <span className="text-xs font-bold text-red-500">OWING</span>}
                  </div>
                  <div className="flex items-center">
                     <span className="text-2xl font-bold text-gray-400 mr-2">₵</span>
                     <input type="number" className="w-full bg-transparent text-4xl font-bold text-gray-900 outline-none placeholder-gray-300" placeholder="0" value={amountPaid} onChange={(e) => setAmountPaid(e.target.value)} />
                  </div>
               </div>

               <div className="flex gap-3 pt-2">
                 {SUPER_ADMINS.includes(session?.user?.email) && <button onClick={handleDelete} className="bg-red-100 text-red-600 px-4 rounded-xl font-bold">Del</button>}
                 <button onClick={handleCheckIn} disabled={processing} className="flex-1 bg-black text-white py-4 rounded-xl font-bold text-lg shadow-xl">{processing ? '...' : 'CONFIRM'}</button>
               </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}