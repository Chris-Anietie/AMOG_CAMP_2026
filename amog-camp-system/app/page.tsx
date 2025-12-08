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
    <div className={`fixed top-4 right-4 z-[100] px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-right duration-300 text-white ${bgClass}`}>
      <span className="text-xl font-bold">{type === 'success' ? '✓' : type === 'error' ? 'X' : '⚠️'}</span>
      <div>
        <h4 className="font-bold text-lg capitalize">{type}</h4>
        <p className="font-medium opacity-90">{msg}</p>
      </div>
      <button onClick={onClose} className="ml-4 opacity-70 hover:opacity-100">✕</button>
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
    const handleOffline = () => { setIsOnline(false); showToast("YOU ARE OFFLINE. Check Internet.", "warning"); };
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

  // --- LOGIC: NEW REGISTRATION (With Validation) ---
  async function handleNewRegistration() {
    if (!isOnline) { showToast("Cannot register while offline.", "error"); return; }
    
    // VALIDATION: PHONE NUMBER
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

  // --- UPDATED FILTERS (Name OR Phone) ---
  const filteredPeople = people.filter((p) => {
    const term = search.toLowerCase();
    const matchesSearch = p.full_name?.toLowerCase().includes(term) || p.phone_number?.includes(term); // NEW: SEARCH BY PHONE
    if (!matchesSearch) return false;
    if (filter === 'paid') return p.payment_status === 'Paid';
    if (filter === 'owing') return p.payment_status === 'Partial' || p.payment_status === 'Pending';
    if (filter === 'checked_in') return p.checked_in === true;
    return true; 
  });

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

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 relative font-sans">
         <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 via-purple-900 to-black z-0"></div>
         <img src="/camp-bg.png" className="absolute inset-0 w-full h-full object-cover opacity-40 mix-blend-overlay z-0" />
         <div className="bg-white p-10 rounded-2xl shadow-2xl w-full max-w-md relative z-10 backdrop-blur-xl border border-white/10">
            <h1 className="text-3xl font-extrabold text-center mb-2 text-gray-900">AMOG Camp 2026</h1>
            <p className="text-center text-gray-500 mb-8">Secure Help Desk Login</p>
            <form onSubmit={handleLogin} className="space-y-6">
              {/* Added text-gray-900 to ensure text is black */}
                <div>
                    <label className="font-bold text-gray-700">Email</label>
                    <input name="email" type="email" className="w-full p-4 border-2 rounded-xl text-gray-900 bg-white" required />
                </div>
                <div>
                    <label className="font-bold text-gray-700">Password</label>
                    <input name="password" type="password" className="w-full p-4 border-2 rounded-xl text-gray-900 bg-white" required />
                </div>
              <button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-xl font-bold text-lg shadow-lg">Sign In</button>
            </form>
         </div>
         {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
      </div>
    );
  }

  return (
    <div className="min-h-screen font-sans text-gray-800 relative bg-gray-50">
      <div className="fixed inset-0 z-0"><div className="absolute inset-0 bg-gradient-to-b from-indigo-900/90 to-black/80"></div><img src="/camp-bg.png" className="w-full h-full object-cover opacity-50" /></div>
      
      {!isOnline && ( <div className="fixed top-0 left-0 right-0 bg-red-600 text-white text-center py-2 font-bold z-[200] animate-pulse">⚠️ YOU ARE OFFLINE. DO NOT PERFORM CHECK-INS.</div> )}
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-8">
        
        {/* HEADER & STATS */}
        <div className="flex flex-col lg:flex-row justify-between items-center mb-8 gap-6 text-white">
          <div><h1 className="text-4xl font-extrabold">AMOG Camp 2026</h1><p className="text-indigo-200">Registration & Help Desk</p></div>
          <div className="flex gap-4">
            <div className="bg-white/10 p-4 rounded-xl text-center border border-white/20 backdrop-blur-md">
              <p className="text-xs uppercase opacity-70">Checked In</p><p className="text-2xl font-bold">{stats.checkedIn} <span className="text-sm opacity-50">/ {people.length}</span></p>
            </div>
            
            <div className="flex gap-2">
               <div className="bg-green-600/30 p-4 rounded-xl text-center border border-green-500/30 backdrop-blur-md">
                  <p className="text-xs uppercase text-green-300">Cash</p><p className="text-xl font-bold">₵{stats.totalCash}</p>
               </div>
               <div className="bg-blue-600/30 p-4 rounded-xl text-center border border-blue-500/30 backdrop-blur-md">
                  <p className="text-xs uppercase text-blue-300">MoMo</p><p className="text-xl font-bold">₵{stats.totalMomo}</p>
               </div>
            </div>
            <button onClick={() => supabase.auth.signOut()} className="bg-red-500/20 hover:bg-red-600/30 text-red-100 p-4 rounded-xl border border-red-500/30">Logout</button>
          </div>
        </div>

        {/* HOUSE STATS (NEW: Balance Checker) */}
        <div className="grid grid-cols-4 gap-2 mb-8 opacity-80">
          <div className="bg-red-500/20 text-red-100 text-center py-2 rounded font-bold border border-red-500/50">Red: {stats.red}</div>
          <div className="bg-blue-500/20 text-blue-100 text-center py-2 rounded font-bold border border-blue-500/50">Blue: {stats.blue}</div>
          <div className="bg-green-500/20 text-green-100 text-center py-2 rounded font-bold border border-green-500/50">Green: {stats.green}</div>
          <div className="bg-yellow-500/20 text-yellow-100 text-center py-2 rounded font-bold border border-yellow-500/50">Yellow: {stats.yellow}</div>
        </div>

        {/* SEARCH & CONTROLS */}
        <div className="flex flex-col gap-4 mb-10">
          <div className="flex flex-col md:flex-row gap-4">
            <input
              type="text"
              placeholder="Search by name OR phone..."
              className="flex-1 pl-6 pr-4 py-5 rounded-2xl bg-white/95 shadow-xl text-xl outline-none focus:ring-4 focus:ring-indigo-500/50"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <button onClick={downloadCSV} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-4 rounded-2xl font-bold shadow-xl flex items-center justify-center gap-2"><span>⬇ CSV</span></button>
            <button onClick={() => setIsRegistering(true)} className="bg-white/90 backdrop-blur hover:bg-white text-indigo-900 px-8 py-4 rounded-2xl font-bold text-lg shadow-xl flex items-center justify-center gap-3 transform transition-all hover:-translate-y-1 border-l-8 border-indigo-500"><span className="text-3xl font-light text-indigo-500">+</span><span>New</span></button>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2">
            <button onClick={() => setFilter('all')} className={`px-6 py-2 rounded-full font-bold transition-all ${filter === 'all' ? 'bg-white text-indigo-900 shadow-lg' : 'bg-white/10 text-white hover:bg-white/20'}`}>All</button>
            <button onClick={() => setFilter('checked_in')} className={`px-6 py-2 rounded-full font-bold transition-all ${filter === 'checked_in' ? 'bg-green-500 text-white shadow-lg' : 'bg-white/10 text-white hover:bg-white/20'}`}>Checked In</button>
            <button onClick={() => setFilter('owing')} className={`px-6 py-2 rounded-full font-bold transition-all ${filter === 'owing' ? 'bg-red-500 text-white shadow-lg' : 'bg-white/10 text-white hover:bg-white/20'}`}>Owe Money</button>
            <button onClick={() => setFilter('paid')} className={`px-6 py-2 rounded-full font-bold transition-all ${filter === 'paid' ? 'bg-indigo-500 text-white shadow-lg' : 'bg-white/10 text-white hover:bg-white/20'}`}>Fully Paid</button>
          </div>
        </div>

        {/* PEOPLE GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-20">
          {filteredPeople.map((person) => (
            <div key={person.id} className={`relative bg-white/90 backdrop-blur rounded-2xl p-6 shadow-lg border-l-8 transition-all hover:scale-[1.01] ${person.checked_in ? 'border-green-500' : 'border-indigo-500'}`}>
              {people.filter(p => p.full_name === person.full_name).length > 1 && (<div className="absolute top-2 right-2 bg-red-100 text-red-800 text-xs px-2 py-1 rounded font-bold border border-red-200">Possible Duplicate</div>)}
              <h2 className="text-2xl font-bold mb-1">{person.full_name}</h2>
              <p className="text-gray-500 font-medium mb-4 uppercase text-sm tracking-wide">{person.role}</p>
              {person.checked_in ? (
                <div className="bg-green-100 p-3 rounded-xl border border-green-200">
                   <p className="font-bold text-green-900 text-lg">{person.grace_school}</p>
                   <p className="text-green-700 text-sm font-bold flex justify-between">
                     <span>Paid: ₵{person.amount_paid}</span>
                     {person.payment_status === 'Paid' && <span>🍽️ MEAL TICKET</span>}
                   </p>
                </div>
              ) : (
                <button onClick={() => openCheckIn(person)} className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-md transition-all">Check In</button>
              )}
            </div>
          ))}
          {filteredPeople.length === 0 && (<p className="text-white text-center col-span-3 text-lg opacity-70 mt-10">No participants found matching your filter.</p>)}
        </div>
      </div>

      {/* --- MODAL 1: NEW REGISTRATION (With Phone Validation) --- */}
      {isRegistering && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in zoom-in-95">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden">
            <div className="bg-gray-50 p-6 border-b border-gray-100 flex justify-between items-center"><h2 className="text-2xl font-extrabold text-gray-900">New Registration</h2><button onClick={() => setIsRegistering(false)} className="bg-gray-200 p-3 rounded-full hover:bg-gray-300 font-bold">✕</button></div>
            <div className="p-8 space-y-5">
              <div><label className="font-bold block mb-1 text-gray-700">Full Name</label><input type="text" className="w-full p-4 border-2 rounded-xl text-lg outline-none focus:border-indigo-500" placeholder="John Doe" value={newReg.full_name} onChange={e => setNewReg({...newReg, full_name: e.target.value})} /></div>
              <div><label className="font-bold block mb-1 text-gray-700">Phone Number (10 digits)</label><input type="text" className="w-full p-4 border-2 rounded-xl text-lg outline-none focus:border-indigo-500" placeholder="055..." value={newReg.phone_number} onChange={e => setNewReg({...newReg, phone_number: e.target.value})} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="font-bold block mb-1 text-gray-700">Role</label><select className="w-full p-4 border-2 rounded-xl bg-white outline-none focus:border-indigo-500" value={newReg.role} onChange={e => setNewReg({...newReg, role: e.target.value})}><option value="Member">Member</option><option value="Leader">Leader</option><option value="Pastor">Pastor</option><option value="Guest">Guest</option></select></div>
                <div><label className="font-bold block mb-1 text-gray-700">Branch</label><input type="text" className="w-full p-4 border-2 rounded-xl outline-none focus:border-indigo-500" placeholder="Main" value={newReg.branch} onChange={e => setNewReg({...newReg, branch: e.target.value})} /></div>
              </div>
              <button onClick={handleNewRegistration} disabled={processing} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-xl font-bold text-lg mt-4 shadow-lg transform transition-all hover:-translate-y-1">{processing ? 'Saving...' : 'Register & Check In'}</button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL 2: CHECK IN --- */}
      {selectedPerson && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in zoom-in-95">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden">
            <div className="bg-gray-50 p-8 border-b border-gray-100 flex justify-between items-center">
              <div><h2 className="text-3xl font-extrabold text-gray-900">{selectedPerson.full_name}</h2><div className="flex gap-2 mt-2"><span className="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-xs font-bold uppercase">{selectedPerson.role}</span></div></div>
              <button onClick={() => setSelectedPerson(null)} className="bg-gray-200 p-3 rounded-full hover:bg-gray-300 font-bold">✕</button>
            </div>
            <div className="p-8 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div><label className="block text-sm font-extrabold text-gray-500 mb-2 uppercase">Payment Method</label><select className="w-full p-3 border-2 rounded-xl font-bold bg-white" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}><option value="Cash">💵 Cash</option><option value="MoMo">📱 MoMo</option></select></div>
                <div><label className="block text-sm font-extrabold text-gray-500 mb-2 uppercase">Gender</label><div className="flex gap-2"><button onClick={() => setGender('Male')} className={`flex-1 py-3 rounded-xl font-bold border-2 ${gender === 'Male' ? 'border-indigo-600 bg-indigo-50 text-indigo-800' : 'border-gray-200 text-gray-400'}`}>Male</button><button onClick={() => setGender('Female')} className={`flex-1 py-3 rounded-xl font-bold border-2 ${gender === 'Female' ? 'border-pink-500 bg-pink-50 text-pink-800' : 'border-gray-200 text-gray-400'}`}>Female</button></div></div>
              </div>
              <div>
                <label className="block text-lg font-extrabold text-black mb-3">Payment (Target: ₵{targetFee})</label>
                <div className="relative">
                  <span className="absolute left-6 top-5 text-gray-400 text-2xl font-bold">₵</span>
                  <input type="number" className={`w-full pl-16 pr-6 py-5 border-4 rounded-2xl text-4xl font-bold text-gray-900 outline-none transition-all ${Number(amountPaid) >= targetFee ? 'border-green-500 bg-green-50' : 'border-gray-200 focus:border-black'}`} value={amountPaid} onChange={(e) => setAmountPaid(e.target.value)} placeholder="0" />
                  {Number(amountPaid) < targetFee ? (<div className="absolute right-6 top-6 text-red-500 font-bold">Owes: ₵{targetFee - (Number(amountPaid) || 0)}</div>) : (<div className="absolute right-6 top-6 text-green-600 font-bold">Fully Paid ✓</div>)}
                </div>
              </div>
            </div>
            <div className="p-6 bg-gray-50 border-t border-gray-100 flex gap-4">
               {SUPER_ADMINS.includes(session?.user?.email) && (<button onClick={handleDelete} className="px-6 py-4 bg-red-100 text-red-700 hover:bg-red-200 rounded-2xl font-bold transition-all" title="Delete User">Delete</button>)}
              <button onClick={() => setSelectedPerson(null)} className="flex-1 py-4 font-bold text-gray-500 hover:text-gray-800">Cancel</button>
              <button onClick={handleCheckIn} disabled={processing} className="flex-[2] py-4 bg-black hover:bg-gray-800 text-white rounded-2xl text-xl font-bold shadow-xl transform transition-all hover:-translate-y-1">{processing ? 'Processing...' : 'CONFIRM CHECK-IN'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}