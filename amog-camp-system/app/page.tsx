"use client";
import { useEffect, useState, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';

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
    <div className={`fixed top-4 right-4 left-4 md:left-auto z-[100] px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-top md:slide-in-from-right duration-300 text-white ${bgClass}`}>
      <span className="text-xl font-bold">{type === 'success' ? '✓' : type === 'error' ? 'X' : '⚠️'}</span>
      <div>
        <h4 className="font-bold text-lg capitalize">{type}</h4>
        <p className="font-medium opacity-90">{msg}</p>
      </div>
      <button onClick={onClose} className="ml-auto md:ml-4 opacity-70 hover:opacity-100">✕</button>
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
  const [topUpAmount, setTopUpAmount] = useState<string | number>(''); // CHANGED: Now tracks NEW money only
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

  // --- DATA FETCHING ---
  async function fetchPeople() {
    if (supabaseUrl.includes("PASTE_YOUR")) return;
    const { data } = await supabase.from('participants').select('*').order('full_name');
    setPeople(data || []);
  }

  async function fetchHistory() {
    const { data } = await supabase.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(50);
    setHistoryLogs(data || []);
    setShowHistory(true);
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

  // --- OPEN MODAL LOGIC (FIXED) ---
  const openCheckIn = (person: any) => {
    setSelectedPerson(person);
    const isLeader = person.role?.toLowerCase().includes('leader') || person.role?.toLowerCase().includes('pastor');
    setTargetFee(isLeader ? 1000 : 400);
    
    // IMPORTANT: Reset the "Top Up" input to 0 every time we open a user. 
    // We don't show the old amount in the input box anymore.
    setTopUpAmount(''); 
    
    setPaymentMethod('Cash'); // Default to Cash for new transaction
    // Gender is locked if it exists, otherwise default
    setGender(person.gender || 'Male');
  };

  async function handleCheckIn() {
    if (!isOnline) { showToast("Cannot check in while OFFLINE!", "error"); return; }
    setProcessing(true);
    
    // LOGIC: Existing Amount + New Top Up
    const previousPaid = selectedPerson.amount_paid || 0;
    const newMoney = Number(topUpAmount) || 0;
    const totalPaid = previousPaid + newMoney;
    
    const balance = targetFee - totalPaid;
    const isFullyPaid = balance <= 0;
    const status = isFullyPaid ? 'Paid' : 'Partial'; 
    const shouldCheckIn = isFullyPaid; 
    
    // HOUSE ALLOCATION
    const currentSchool = selectedPerson.grace_school;
    const randomSchool = currentSchool || (shouldCheckIn ? GRACE_SCHOOLS[Math.floor(Math.random() * GRACE_SCHOOLS.length)] : null);

    const { error } = await supabase.from('participants').update({
      gender: gender, 
      amount_paid: totalPaid, 
      payment_status: status, 
      payment_method: paymentMethod, // Updates to the LATEST method used
      grace_school: randomSchool, 
      checked_in: shouldCheckIn, 
      checked_in_at: shouldCheckIn ? new Date().toISOString() : null, 
      checked_in_by: session?.user?.email
    }).eq('id', selectedPerson.id);

    if (error) { showToast("Database Error!", 'error'); } 
    else {
      // LOG THE TRANSACTION DETAILS
      const logDetails = `Added ₵${newMoney} via ${paymentMethod}. Total: ₵${totalPaid}. ${isFullyPaid ? 'Fully Paid.' : 'Still Owes.'}`;
      await logAction(shouldCheckIn ? 'Check-In' : 'Payment Top-Up', `${selectedPerson.full_name}: ${logDetails}`);
      
      await fetchPeople();
      
      if (shouldCheckIn) {
          const message = `Calvary greetings ${selectedPerson.full_name}! ✝️%0A%0AWelcome to the *AMOG CAMP MEETING 2026*.%0A%0A*Registration Complete:*%0A🏠 *House:* ${randomSchool}%0A💰 *Total Paid:* ₵${totalPaid}%0A%0AGod bless you!`;
          const waLink = `https://wa.me/233${selectedPerson.phone_number?.substring(1)}?text=${message}`;
          window.open(waLink, '_blank');
          showToast(`Success! Checked in ${selectedPerson.full_name}`, 'success');
          setSelectedPerson(null);
      } else {
          showToast(`Top-up saved. Total Paid: ₵${totalPaid}`, 'warning');
          setSelectedPerson(null);
      }
    }
    setProcessing(false);
  }

  async function handleDelete() {
    if (!isOnline) { showToast("Cannot delete while offline.", "error"); return; }
    if (!SUPER_ADMINS.includes(session?.user?.email)) { showToast("Access Denied.", "error"); return; }
    if (!confirm(`Permanently delete ${selectedPerson.full_name}?`)) return;
    setProcessing(true);
    await logAction('Delete', `Deleted user: ${selectedPerson.full_name}`);
    const { error } = await supabase.from('participants').delete().eq('id', selectedPerson.id);
    if (error) { showToast(error.message, 'error'); } 
    else { showToast("Deleted successfully.", 'success'); setSelectedPerson(null); }
    setProcessing(false);
  }

  async function handleNewRegistration() {
    if (!isOnline) { showToast("Offline.", "error"); return; }
    if (newReg.phone_number.length < 10) { showToast("Invalid Phone.", "error"); return; }
    setProcessing(true);
    
    // Check duplicate
    const existing = people.find(p => p.phone_number === newReg.phone_number);
    if (existing) { showToast(`${existing.full_name} is already registered.`, 'error'); setProcessing(false); return; }

    const { data, error } = await supabase.from('participants').insert([{
      full_name: newReg.full_name, phone_number: newReg.phone_number, role: newReg.role, branch: newReg.branch,
      payment_status: 'Pending', amount_paid: 0, checked_in: false
    }]).select();

    if (error) { showToast(error.message, 'error'); } 
    else {
      await logAction('New Registration', `Registered: ${newReg.full_name}`);
      showToast("Registered!", 'success');
      setIsRegistering(false); 
      setNewReg({ full_name: '', phone_number: '', role: 'Member', branch: 'Main' }); 
      if (data && data[0]) openCheckIn(data[0]); 
    }
    setProcessing(false);
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const email = (e.target as any).email.value;
    const password = (e.target as any).password.value;
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) showToast(error.message, 'error');
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

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 font-sans p-4">
         <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md">
            <h1 className="text-3xl font-extrabold text-center mb-6 text-gray-900">AMOG Camp</h1>
            <form onSubmit={handleLogin} className="space-y-4">
              <input name="email" type="email" className="w-full p-4 border rounded-xl text-gray-900 bg-white" placeholder="Email" required />
              <input name="password" type="password" className="w-full p-4 border rounded-xl text-gray-900 bg-white" placeholder="Password" required />
              <button className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold">Sign In</button>
            </form>
         </div>
         {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
      </div>
    );
  }

  return (
    <div className="min-h-screen font-sans text-gray-800 bg-gray-50 pb-20">
      <div className="fixed inset-0 z-0"><div className="absolute inset-0 bg-gradient-to-b from-indigo-900/90 to-black/80"></div><img src="/camp-bg.png" className="w-full h-full object-cover opacity-50" /></div>
      
      {!isOnline && ( <div className="fixed top-0 left-0 right-0 bg-red-600 text-white text-center py-2 text-sm font-bold z-[200]">OFFLINE MODE</div> )}
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      <div className="relative z-10 max-w-7xl mx-auto px-4 py-6">
        
        {/* HEADER */}
        <div className="flex flex-col lg:flex-row justify-between items-center mb-6 gap-4 text-white">
          <div><h1 className="text-3xl font-extrabold">AMOG Camp '26</h1><p className="text-indigo-200">Help Desk</p></div>
          <div className="flex flex-wrap gap-2 justify-center">
            <div className="bg-white/10 p-3 rounded-xl border border-white/20"><p className="text-xs opacity-70">Checked In</p><p className="text-xl font-bold">{stats.checkedIn} / {people.length}</p></div>
            <div className="bg-green-600/30 p-3 rounded-xl border border-green-500/30"><p className="text-xs text-green-300">Cash</p><p className="text-xl font-bold">₵{stats.totalCash}</p></div>
            <div className="bg-blue-600/30 p-3 rounded-xl border border-blue-500/30"><p className="text-xs text-blue-300">MoMo</p><p className="text-xl font-bold">₵{stats.totalMomo}</p></div>
            <button onClick={() => supabase.auth.signOut()} className="bg-red-500/20 text-red-100 p-3 rounded-xl border border-red-500/30">Exit</button>
          </div>
        </div>

        {/* CONTROLS */}
        <div className="flex flex-col gap-4 mb-8">
           <div className="flex gap-2">
              <input type="text" placeholder="Search..." className="flex-1 p-4 rounded-xl shadow-lg outline-none" value={search} onChange={(e) => setSearch(e.target.value)} />
              <button onClick={() => setIsRegistering(true)} className="bg-indigo-600 text-white px-6 rounded-xl font-bold shadow-lg text-2xl">+</button>
           </div>
           <div className="flex gap-2 overflow-x-auto pb-2">
              <button onClick={fetchHistory} className="px-5 py-2 rounded-full font-bold bg-gray-800 text-white shadow whitespace-nowrap">📜 History</button>
              {['all', 'checked_in', 'owing', 'paid'].map(f => (
                  <button key={f} onClick={() => setFilter(f)} className={`px-5 py-2 rounded-full font-bold whitespace-nowrap transition-all ${filter === f ? 'bg-white text-indigo-900 shadow' : 'bg-white/10 text-white'}`}>{f.replace('_', ' ').toUpperCase()}</button>
              ))}
           </div>
        </div>

        {/* GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-20">
          {filteredPeople.map((person) => {
            const isPartial = !person.checked_in && person.amount_paid > 0;
            return (
                <div key={person.id} className={`bg-white rounded-2xl p-6 shadow-lg border-l-8 ${person.checked_in ? 'border-green-500' : (isPartial ? 'border-orange-500' : 'border-indigo-500')}`}>
                  <h2 className="text-xl font-bold text-gray-900">{person.full_name}</h2>
                  <p className="text-gray-500 text-sm font-bold uppercase mb-2">{person.role} • {person.branch}</p>
                  
                  {person.checked_in ? (
                     <div className="bg-green-50 p-3 rounded-xl border border-green-100">
                        <p className="font-bold text-green-900">{person.grace_school}</p>
                        <p className="text-green-700 text-sm font-bold">Paid: ₵{person.amount_paid} ✓</p>
                     </div>
                  ) : (
                    <div>
                         {isPartial && <div className="text-xs font-bold text-orange-600 bg-orange-50 px-2 py-1 rounded mb-2 inline-block">Paid so far: ₵{person.amount_paid}</div>}
                         <button onClick={() => openCheckIn(person)} className={`w-full py-3 text-white rounded-xl font-bold shadow-md ${isPartial ? 'bg-orange-500' : 'bg-indigo-600'}`}>{isPartial ? 'Add Payment' : 'Check In'}</button>
                    </div>
                  )}
                </div>
            );
          })}
        </div>
      </div>

      {/* --- MODAL: HISTORY LOGS --- */}
      {showHistory && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm">
           <div className="bg-white rounded-2xl w-full max-w-2xl h-[80vh] flex flex-col">
              <div className="p-4 border-b flex justify-between items-center bg-gray-100 rounded-t-2xl">
                 <h2 className="font-bold text-xl">Transaction History</h2>
                 <button onClick={() => setShowHistory(false)} className="bg-gray-300 w-8 h-8 rounded-full font-bold">✕</button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                 {historyLogs.map((log, i) => (
                    <div key={i} className="p-3 border-b border-gray-100 text-sm">
                       <span className="font-bold text-indigo-600 block">{new Date(log.created_at).toLocaleString()}</span>
                       <span className="text-gray-800">{log.details}</span>
                       <span className="block text-xs text-gray-400 mt-1">Staff: {log.staff_email}</span>
                    </div>
                 ))}
              </div>
           </div>
        </div>
      )}

      {/* --- MODAL: CHECK IN & TOP UP --- */}
      {selectedPerson && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="bg-gray-50 p-6 border-b flex justify-between items-center">
               <div>
                  <h2 className="text-2xl font-extrabold text-gray-900">{selectedPerson.full_name}</h2>
                  <span className="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-xs font-bold uppercase">{selectedPerson.role}</span>
               </div>
               <button onClick={() => setSelectedPerson(null)} className="bg-gray-200 w-10 h-10 rounded-full font-bold">✕</button>
            </div>
            <div className="p-6 space-y-6">
               <div className="grid grid-cols-2 gap-4">
                  <div>
                      <label className="text-xs font-bold text-gray-500 uppercase">Method</label>
                      <select className="w-full p-3 border-2 rounded-xl font-bold bg-white" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}><option value="Cash">💵 Cash</option><option value="MoMo">📱 MoMo</option></select>
                  </div>
                  <div>
                      <label className="text-xs font-bold text-gray-500 uppercase">Gender</label>
                      <div className="flex bg-gray-100 rounded-xl p-1">
                          <button disabled={!!selectedPerson.gender} onClick={() => setGender('Male')} className={`flex-1 py-2 rounded-lg text-sm font-bold ${gender === 'Male' ? 'bg-indigo-600 text-white' : 'text-gray-400'}`}>M</button>
                          <button disabled={!!selectedPerson.gender} onClick={() => setGender('Female')} className={`flex-1 py-2 rounded-lg text-sm font-bold ${gender === 'Female' ? 'bg-pink-600 text-white' : 'text-gray-400'}`}>F</button>
                      </div>
                  </div>
               </div>
               
               <div className="bg-gray-50 p-4 rounded-xl border-2 border-dashed border-gray-300">
                  <div className="flex justify-between mb-2 text-sm">
                     <span className="font-bold text-gray-500">Previously Paid:</span>
                     <span className="font-bold text-gray-900">₵{selectedPerson.amount_paid || 0}</span>
                  </div>
                  <div className="flex items-center gap-2">
                     <span className="text-2xl font-bold text-green-600">+</span>
                     <input type="number" className="w-full bg-white border-2 border-green-500 rounded-xl p-3 text-2xl font-bold text-gray-900 outline-none" placeholder="0" value={topUpAmount} onChange={(e) => setTopUpAmount(e.target.value)} />
                  </div>
                  <div className="text-right mt-2 text-xs font-bold text-red-500">
                     Total will be: ₵{(selectedPerson.amount_paid || 0) + (Number(topUpAmount) || 0)} (Target: ₵{targetFee})
                  </div>
               </div>
            </div>
            
            <div className="p-6 bg-gray-50 border-t flex gap-4">
               <button onClick={() => setSelectedPerson(null)} className="flex-1 py-4 font-bold text-gray-500">Cancel</button>
               <button onClick={handleCheckIn} disabled={processing} className={`flex-[2] py-4 text-white rounded-2xl text-lg font-bold shadow-xl ${((selectedPerson.amount_paid || 0) + (Number(topUpAmount) || 0)) >= targetFee ? 'bg-green-600' : 'bg-orange-500'}`}>
                   {processing ? '...' : (((selectedPerson.amount_paid || 0) + (Number(topUpAmount) || 0)) >= targetFee ? 'COMPLETE CHECK IN' : 'SAVE TOP UP')}
               </button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL: NEW REGISTRATION --- */}
      {isRegistering && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="bg-gray-50 p-6 border-b flex justify-between items-center">
                <h2 className="text-2xl font-extrabold text-gray-900">New Registration</h2>
                <button onClick={() => setIsRegistering(false)} className="bg-gray-200 w-10 h-10 rounded-full font-bold">✕</button>
            </div>
            <div className="p-6 space-y-4">
              <input type="text" className="w-full p-4 border rounded-xl" placeholder="Full Name" value={newReg.full_name} onChange={e => setNewReg({...newReg, full_name: e.target.value})} />
              <input type="tel" className="w-full p-4 border rounded-xl" placeholder="Phone (055...)" value={newReg.phone_number} onChange={e => setNewReg({...newReg, phone_number: e.target.value})} />
              <div className="flex gap-4">
                 <select className="flex-1 p-4 border rounded-xl bg-white" value={newReg.role} onChange={e => setNewReg({...newReg, role: e.target.value})}><option>Member</option><option>Leader</option><option>Pastor</option><option>Guest</option></select>
                 <input type="text" className="flex-1 p-4 border rounded-xl" placeholder="Branch" value={newReg.branch} onChange={e => setNewReg({...newReg, branch: e.target.value})} />
              </div>
              <button onClick={handleNewRegistration} disabled={processing} className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold text-lg mt-4">Register</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}