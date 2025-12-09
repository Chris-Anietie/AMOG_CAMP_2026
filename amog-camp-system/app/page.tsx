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
    
    // STRICT LOGIC: ONLY Check In if FULLY PAID
    const isFullyPaid = balance <= 0;
    const status = isFullyPaid ? 'Paid' : 'Partial'; 
    const shouldCheckIn = isFullyPaid; // If not fully paid, NO check in.
    
    // HOUSE ALLOCATION (Only assign if fully paying)
    const currentSchool = selectedPerson.grace_school;
    const randomSchool = currentSchool || (shouldCheckIn ? GRACE_SCHOOLS[Math.floor(Math.random() * GRACE_SCHOOLS.length)] : null);

    const { error } = await supabase.from('participants').update({
      gender: gender, 
      amount_paid: paidValue, 
      payment_status: status, 
      payment_method: paymentMethod,
      grace_school: randomSchool, 
      checked_in: shouldCheckIn, 
      checked_in_at: shouldCheckIn ? new Date().toISOString() : null, 
      checked_in_by: session?.user?.email
    }).eq('id', selectedPerson.id);

    if (error) { showToast("Database Error!", 'error'); } 
    else {
      await logAction(shouldCheckIn ? 'Check-In' : 'Partial Payment', `Updated ${selectedPerson.full_name}. Paid: ${paidValue} (Total)`);
      await fetchPeople();
      
      if (shouldCheckIn) {
          const message = `Calvary greetings ${selectedPerson.full_name}! ✝️%0A%0AWelcome to the *AMOG CAMP MEETING 2026*. We are expecting a mighty move of God! 🔥%0A%0A*Your Registration Details:*%0A🏠 *Grace House:* ${randomSchool}%0A💰 *Payment:* ${status} (Paid ₵${paidValue})%0A%0AGod bless you as you settle in!`;
          const waLink = `https://wa.me/233${selectedPerson.phone_number?.substring(1)}?text=${message}`;
          window.open(waLink, '_blank');
          showToast(`Checked in ${selectedPerson.full_name}!`, 'success');
          setSelectedPerson(null); // Close modal only on success
      } else {
          showToast(`Saved partial payment. User still owes ₵${balance}.`, 'warning');
          // We do NOT close the modal automatically here, so they see the result, or we can close it. 
          // Let's close it to be clean.
          setSelectedPerson(null);
      }
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
      <div className="min-h-screen flex items-center justify-center bg-gray-900 relative font-sans p-4">
         <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 via-purple-900 to-black z-0"></div>
         <img src="/camp-bg.png" className="absolute inset-0 w-full h-full object-cover opacity-40 mix-blend-overlay z-0" />
         
         <div className="bg-white/95 p-6 md:p-10 rounded-2xl shadow-xl w-full max-w-md relative z-10 backdrop-blur-xl border border-white/10">
            <h1 className="text-3xl font-extrabold text-center mb-2 text-gray-900">AMOG Camp</h1>
            <p className="text-center text-gray-500 mb-8 text-sm">Help Desk Portal</p>
            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <label className="text-sm font-bold text-gray-700 block mb-1">Email</label>
                <input name="email" type="email" className="w-full p-4 border rounded-xl text-gray-900 bg-white text-base focus:ring-2 focus:ring-indigo-500 outline-none" required />
              </div>
              <div>
                <label className="text-sm font-bold text-gray-700 block mb-1">Password</label>
                <input name="password" type="password" className="w-full p-4 border rounded-xl text-gray-900 bg-white text-base focus:ring-2 focus:ring-indigo-500 outline-none" required />
              </div>
              <button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-xl font-bold text-lg shadow-lg transition-transform active:scale-95">Sign In</button>
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
      
      {!isOnline && ( <div className="fixed top-0 left-0 right-0 bg-red-600 text-white text-center py-2 text-sm font-bold z-[200]">OFFLINE MODE</div> )}
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-6 py-6">
        
        {/* HEADER */}
        <div className="flex flex-col lg:flex-row justify-between items-center mb-6 gap-6 text-white text-center lg:text-left">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold">AMOG Camp '26</h1>
            <p className="text-indigo-200 text-sm md:text-base">Registration & Help Desk</p>
          </div>
          
          <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
            <div className="bg-white/10 p-4 rounded-xl text-center border border-white/20 backdrop-blur-md">
              <p className="text-xs uppercase opacity-70">Checked In</p>
              <p className="text-2xl font-bold">{stats.checkedIn} <span className="text-sm opacity-50">/ {people.length}</span></p>
            </div>
            
            <div className="flex gap-2 justify-center">
              <div className="bg-green-600/30 p-4 rounded-xl text-center border border-green-500/30 flex-1 md:flex-none">
                  <p className="text-xs uppercase text-green-300">Cash</p>
                  <p className="text-xl font-bold">₵{stats.totalCash}</p>
              </div>
              <div className="bg-blue-600/30 p-4 rounded-xl text-center border border-blue-500/30 flex-1 md:flex-none">
                  <p className="text-xs uppercase text-blue-300">MoMo</p>
                  <p className="text-xl font-bold">₵{stats.totalMomo}</p>
              </div>
            </div>
            <button onClick={() => supabase.auth.signOut()} className="bg-red-500/20 hover:bg-red-600/30 text-red-100 p-4 rounded-xl border border-red-500/30">Logout</button>
          </div>
        </div>

        {/* HOUSE STATS */}
        <div className="grid grid-cols-4 gap-2 mb-8 opacity-80 text-sm md:text-base font-bold text-white">
          <div className="bg-red-900/40 text-center py-2 rounded border border-red-500/30">Red: {stats.red}</div>
          <div className="bg-blue-900/40 text-center py-2 rounded border border-blue-500/30">Blue: {stats.blue}</div>
          <div className="bg-green-900/40 text-center py-2 rounded border border-green-500/30">Green: {stats.green}</div>
          <div className="bg-yellow-900/40 text-center py-2 rounded border border-yellow-500/30">Yellow: {stats.yellow}</div>
        </div>

        {/* SEARCH & ACTIONS */}
        <div className="flex flex-col gap-4 mb-8">
           <div className="flex gap-4">
              <input
                type="text"
                placeholder="Search by name OR phone..."
                className="flex-1 pl-6 pr-4 py-4 md:py-5 rounded-2xl bg-white shadow-xl text-lg outline-none border border-gray-100 focus:ring-4 focus:ring-indigo-500/30"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <button onClick={() => setIsRegistering(true)} className="bg-indigo-600 text-white px-6 md:px-8 rounded-2xl font-bold shadow-xl flex items-center justify-center text-3xl leading-none active:scale-95">+</button>
           </div>
           
           <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
              <button onClick={downloadCSV} className="px-6 py-2 rounded-full font-bold bg-blue-600 text-white shadow hover:bg-blue-700 whitespace-nowrap">⬇ CSV</button>
              {['all', 'checked_in', 'owing', 'paid'].map(f => (
                  <button key={f} onClick={() => setFilter(f)} className={`px-6 py-2 rounded-full font-bold whitespace-nowrap transition-all ${filter === f ? 'bg-white text-indigo-900 shadow' : 'bg-white/10 text-white hover:bg-white/20'}`}>
                      {f.replace('_', ' ').toUpperCase()}
                  </button>
              ))}
           </div>
        </div>

        {/* PEOPLE LIST (Responsive Grid) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 pb-20">
          {filteredPeople.map((person) => {
            const isPartial = !person.checked_in && person.amount_paid > 0;
            // Border Logic: Green (Checked In), Orange (Partial), Indigo (Fresh)
            let borderClass = 'border-indigo-500';
            if (person.checked_in) borderClass = 'border-green-500';
            else if (isPartial) borderClass = 'border-orange-500';

            return (
                <div key={person.id} className={`bg-white rounded-2xl p-6 shadow-lg border-l-8 transition-all hover:scale-[1.01] ${borderClass}`}>
                  <div className="flex justify-between items-start mb-2">
                     <div>
                        <h2 className="text-xl font-bold text-gray-900">{person.full_name}</h2>
                        <p className="text-gray-500 text-sm font-semibold uppercase">{person.role} • {person.branch}</p>
                     </div>
                     {people.filter(p => p.full_name === person.full_name).length > 1 && (<span className="bg-red-100 text-red-800 text-[10px] px-2 py-1 rounded font-bold border border-red-200">DUPLICATE?</span>)}
                  </div>
                  
                  {person.checked_in ? (
                     <div className="bg-green-50 p-3 rounded-xl border border-green-100 mt-2">
                        <p className="font-bold text-green-900 text-lg">{person.grace_school}</p>
                        <div className="flex justify-between items-center text-green-700 text-sm font-bold">
                           <span>Paid: ₵{person.amount_paid}</span>
                           <span>🍽️ MEAL TICKET</span>
                        </div>
                     </div>
                  ) : (
                    <div className="mt-2">
                         {isPartial && (
                            <div className="mb-2 text-xs font-bold text-orange-600 bg-orange-50 px-2 py-1 rounded-lg inline-block">
                                ⚠️ Paid: ₵{person.amount_paid} (Owes ₵{400 - person.amount_paid})
                            </div>
                         )}
                         <button onClick={() => openCheckIn(person)} className={`w-full py-3 text-white rounded-xl font-bold shadow-md transition-all ${isPartial ? 'bg-orange-500 hover:bg-orange-600' : 'bg-indigo-600 hover:bg-indigo-700'}`}>
                             {isPartial ? 'Pay Balance' : 'Check In'}
                         </button>
                    </div>
                  )}
                </div>
            );
          })}
          {filteredPeople.length === 0 && (<p className="text-white text-center col-span-1 md:col-span-3 text-lg opacity-60 mt-10">No matching records found.</p>)}
        </div>
      </div>

      {/* --- MODAL: NEW REGISTRATION (Centered) --- */}
      {isRegistering && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in zoom-in-95">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden">
            <div className="bg-gray-50 p-6 border-b border-gray-100 flex justify-between items-center">
                <h2 className="text-2xl font-extrabold text-gray-900">New Registration</h2>
                <button onClick={() => setIsRegistering(false)} className="bg-gray-200 w-10 h-10 rounded-full font-bold hover:bg-gray-300">✕</button>
            </div>
            <div className="p-6 md:p-8 space-y-5">
              <div><label className="font-bold block mb-1 text-gray-700">Full Name</label><input type="text" className="w-full p-4 border-2 rounded-xl text-lg outline-none focus:border-indigo-500 bg-white text-gray-900" placeholder="John Doe" value={newReg.full_name} onChange={e => setNewReg({...newReg, full_name: e.target.value})} /></div>
              <div><label className="font-bold block mb-1 text-gray-700">Phone Number</label><input type="tel" className="w-full p-4 border-2 rounded-xl text-lg outline-none focus:border-indigo-500 bg-white text-gray-900" placeholder="055..." value={newReg.phone_number} onChange={e => setNewReg({...newReg, phone_number: e.target.value})} /></div>
              <div className="grid grid-cols-2 gap-4">
                 <div><label className="font-bold block mb-1 text-gray-700">Role</label><select className="w-full p-4 border-2 rounded-xl bg-white text-gray-900 outline-none focus:border-indigo-500" value={newReg.role} onChange={e => setNewReg({...newReg, role: e.target.value})}><option>Member</option><option>Leader</option><option>Pastor</option><option>Guest</option></select></div>
                 <div><label className="font-bold block mb-1 text-gray-700">Branch</label><input type="text" className="w-full p-4 border-2 rounded-xl outline-none focus:border-indigo-500 bg-white text-gray-900" placeholder="Main" value={newReg.branch} onChange={e => setNewReg({...newReg, branch: e.target.value})} /></div>
              </div>
              <button onClick={handleNewRegistration} disabled={processing} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-xl font-bold text-lg mt-4 shadow-lg">{processing ? 'Saving...' : 'Register & Check In'}</button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL: CHECK IN (Centered & Smart Button) --- */}
      {selectedPerson && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in zoom-in-95">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden">
            <div className="bg-gray-50 p-6 md:p-8 border-b border-gray-100 flex justify-between items-center">
               <div>
                  <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900">{selectedPerson.full_name}</h2>
                  <span className="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-xs font-bold uppercase">{selectedPerson.role}</span>
               </div>
               <button onClick={() => setSelectedPerson(null)} className="bg-gray-200 w-10 h-10 rounded-full font-bold hover:bg-gray-300">✕</button>
            </div>
            <div className="p-6 md:p-8 space-y-6">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div><label className="block text-sm font-extrabold text-gray-500 mb-2 uppercase">Payment Method</label><select className="w-full p-3 border-2 rounded-xl font-bold bg-white text-gray-900" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}><option value="Cash">💵 Cash</option><option value="MoMo">📱 MoMo</option></select></div>
                  <div>
                    <label className="block text-sm font-extrabold text-gray-500 mb-2 uppercase">Gender</label>
                    <div className="flex gap-2">
                        <button onClick={() => setGender('Male')} className={`flex-1 py-3 rounded-xl font-bold border-2 ${gender === 'Male' ? 'border-indigo-600 bg-indigo-50 text-indigo-800' : 'border-gray-200 text-gray-400'}`}>Male</button>
                        <button onClick={() => setGender('Female')} className={`flex-1 py-3 rounded-xl font-bold border-2 ${gender === 'Female' ? 'border-pink-500 bg-pink-50 text-pink-800' : 'border-gray-200 text-gray-400'}`}>Female</button>
                    </div>
                  </div>
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
               
               {/* SMART BUTTON LOGIC */}
               <button 
                 onClick={handleCheckIn} 
                 disabled={processing} 
                 className={`flex-[2] py-4 text-white rounded-2xl text-xl font-bold shadow-xl transition-transform active:scale-95 ${
                    Number(amountPaid) >= targetFee 
                    ? 'bg-green-600 hover:bg-green-700'  // Ready to Check In
                    : Number(amountPaid) > 0 
                      ? 'bg-orange-500 hover:bg-orange-600' // Partial
                      : 'bg-black hover:bg-gray-800' // Empty
                 }`}
               >
                   {processing 
                      ? 'Processing...' 
                      : (Number(amountPaid) >= targetFee 
                          ? 'CHECK IN & PRINT' 
                          : (Number(amountPaid) > 0 ? 'SAVE PARTIAL PAYMENT' : 'ENTER AMOUNT')
                        )
                   }
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}