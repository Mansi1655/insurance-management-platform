import React, { useState, useEffect } from 'react';
import API from '../services/api';
import { 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  UserPlus, 
  Eye, 
  Plus, 
  Upload, 
  FileText,
  Calendar,
  Phone,
  MapPin,
  Clock
} from 'lucide-react';

const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Selected Customer Details Modal/Section
  const [selectedCust, setSelectedCust] = useState(null);
  const [activeTab, setActiveTab] = useState('policies'); // 'policies', 'claims', 'documents', 'history'
  const [custHistory, setCustHistory] = useState([]);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Form states for creating customer
  const [showRegForm, setShowRegForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    dob: '',
    phone: '',
    address: '',
    password: ''
  });
  const [regError, setRegError] = useState('');
  const [regSuccess, setRegSuccess] = useState('');

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const res = await API.get(`/customers?search=${search}&page=${page}&limit=8`);
      setCustomers(res.data.customers);
      setPagination(res.data.pagination);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch customers list');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [page]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchCustomers();
  };

  const handleSelectCustomer = async (cust) => {
    try {
      setLoadingDetails(true);
      const res = await API.get(`/customers/${cust.id}`);
      setSelectedCust(res.data.customer);
      setActiveTab('policies');
      
      // Fetch history timeline
      const histRes = await API.get(`/customers/${cust.id}/history`);
      setCustHistory(histRes.data.events);
    } catch (err) {
      console.error(err);
      alert('Failed to retrieve customer detailed profile');
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleRegChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRegSubmit = async (e) => {
    e.preventDefault();
    setRegError('');
    setRegSuccess('');
    try {
      await API.post('/customers', formData);
      setRegSuccess('Customer registered successfully. Password: ' + (formData.password || 'Customer123!'));
      setFormData({ name: '', email: '', dob: '', phone: '', address: '', password: '' });
      fetchCustomers();
      setTimeout(() => setShowRegForm(false), 2000);
    } catch (err) {
      setRegError(err.response?.data?.error || 'Failed to register customer');
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">Client Management</h1>
          <p className="text-sm text-slate-400">Search, manage, and register customer accounts</p>
        </div>
        <button
          onClick={() => { setShowRegForm(!showRegForm); setSelectedCust(null); }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white gradient-btn shadow"
        >
          <UserPlus size={18} />
          <span>Register Client</span>
        </button>
      </div>

      {showRegForm && (
        <div className="glass-panel rounded-xl p-6 border-indigo-500/20 max-w-2xl">
          <h2 className="text-base font-bold text-white mb-4">Register New Customer</h2>
          {regError && <div className="mb-4 text-xs text-rose-400 bg-rose-500/10 border border-rose-500/25 p-3 rounded-lg">{regError}</div>}
          {regSuccess && <div className="mb-4 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/25 p-3 rounded-lg">{regSuccess}</div>}
          
          <form onSubmit={handleRegSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-slate-400 font-semibold">Name</label>
              <input type="text" name="name" required value={formData.name} onChange={handleRegChange} className="bg-slate-900 border border-slate-800 focus:border-indigo-500 rounded-lg p-2 text-sm outline-none text-white" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-slate-400 font-semibold">Email</label>
              <input type="email" name="email" required value={formData.email} onChange={handleRegChange} className="bg-slate-900 border border-slate-800 focus:border-indigo-500 rounded-lg p-2 text-sm outline-none text-white" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-slate-400 font-semibold">Date of Birth</label>
              <input type="date" name="dob" value={formData.dob} onChange={handleRegChange} className="bg-slate-900 border border-slate-800 focus:border-indigo-500 rounded-lg p-2 text-sm outline-none text-white" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-slate-400 font-semibold">Phone Number</label>
              <input type="text" name="phone" value={formData.phone} onChange={handleRegChange} className="bg-slate-900 border border-slate-800 focus:border-indigo-500 rounded-lg p-2 text-sm outline-none text-white" />
            </div>
            <div className="flex flex-col gap-1 md:col-span-2">
              <label className="text-xs text-slate-400 font-semibold">Address</label>
              <input type="text" name="address" value={formData.address} onChange={handleRegChange} className="bg-slate-900 border border-slate-800 focus:border-indigo-500 rounded-lg p-2 text-sm outline-none text-white" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-slate-400 font-semibold">Password (Optional - defaults to Customer123!)</label>
              <input type="password" name="password" value={formData.password} onChange={handleRegChange} className="bg-slate-900 border border-slate-800 focus:border-indigo-500 rounded-lg p-2 text-sm outline-none text-white" />
            </div>
            <div className="md:col-span-2 flex justify-end gap-2 mt-2">
              <button type="button" onClick={() => setShowRegForm(false)} className="px-4 py-2 rounded-lg text-xs font-semibold bg-slate-800 text-slate-400 hover:bg-slate-700">Cancel</button>
              <button type="submit" className="px-4 py-2 rounded-lg text-xs font-semibold text-white gradient-btn">Register</button>
            </div>
          </form>
        </div>
      )}

      {/* Main layout split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Customer Table Listing */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <form onSubmit={handleSearchSubmit} className="flex gap-2">
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
                <Search size={18} />
              </span>
              <input
                type="text"
                placeholder="Search clients by name or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-900/50 border border-slate-800 focus:border-indigo-500 rounded-xl text-sm text-white placeholder-slate-500 transition-all outline-none"
              />
            </div>
            <button type="submit" className="px-5 py-2.5 bg-slate-900 border border-slate-800 hover:border-slate-700 text-sm font-semibold rounded-xl text-white transition-all">
              Search
            </button>
          </form>

          {loading ? (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
            </div>
          ) : customers.length === 0 ? (
            <div className="glass-panel rounded-xl p-8 text-center text-slate-500 text-sm">No clients found.</div>
          ) : (
            <div className="glass-panel rounded-xl overflow-hidden shadow">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-xs font-bold text-slate-400 uppercase bg-slate-900/40">
                    <th className="p-4">Client Name</th>
                    <th className="p-4">Email</th>
                    <th className="p-4">Phone</th>
                    <th className="p-4 text-center">Policies</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40 text-sm">
                  {customers.map((cust) => (
                    <tr key={cust.id} className="hover:bg-slate-900/20 transition-all">
                      <td className="p-4 text-white font-semibold">{cust.name}</td>
                      <td className="p-4 text-slate-300">{cust.email}</td>
                      <td className="p-4 text-slate-400">{cust.phone || '-'}</td>
                      <td className="p-4 text-center">
                        <span className="px-2 py-0.5 rounded text-xs bg-slate-800 text-slate-300 font-bold border border-slate-700/50">
                          {cust.policies?.length || 0}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => handleSelectCustomer(cust)}
                          className="p-2 hover:bg-slate-800 text-indigo-400 hover:text-indigo-300 rounded-lg transition-all"
                          title="View Details"
                        >
                          <Eye size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {/* Pagination controls */}
              {pagination.totalPages > 1 && (
                <div className="border-t border-slate-800 p-4 flex justify-between items-center text-xs text-slate-400 bg-slate-900/10">
                  <span>Page {page} of {pagination.totalPages}</span>
                  <div className="flex gap-2">
                    <button
                      disabled={page <= 1}
                      onClick={() => setPage(page - 1)}
                      className="p-1.5 bg-slate-900 border border-slate-800 rounded hover:border-slate-700 disabled:opacity-50 disabled:cursor-not-allowed text-white"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <button
                      disabled={page >= pagination.totalPages}
                      onClick={() => setPage(page + 1)}
                      className="p-1.5 bg-slate-900 border border-slate-800 rounded hover:border-slate-700 disabled:opacity-50 disabled:cursor-not-allowed text-white"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Customer Detailed Panel */}
        <div className="lg:col-span-1">
          {loadingDetails ? (
            <div className="glass-panel rounded-xl p-8 flex justify-center items-center py-24">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
            </div>
          ) : selectedCust ? (
            <div className="glass-panel rounded-xl p-5 flex flex-col gap-5 shadow-xl border-indigo-500/10 animate-fadeIn">
              {/* Client Info Header */}
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-white text-lg">
                  {selectedCust.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-base font-bold text-white truncate">{selectedCust.name}</h2>
                  <span className="text-xs text-slate-400 font-semibold">{selectedCust.email}</span>
                </div>
              </div>

              {/* Quick Details Box */}
              <div className="flex flex-col gap-2.5 text-xs text-slate-300 bg-slate-900/50 p-4 rounded-xl border border-slate-800">
                <div className="flex items-center gap-2">
                  <Calendar size={14} className="text-indigo-400" />
                  <span>DOB: {selectedCust.dob || 'Not provided'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone size={14} className="text-indigo-400" />
                  <span>Phone: {selectedCust.phone || 'Not provided'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin size={14} className="text-indigo-400" />
                  <span className="truncate">Address: {selectedCust.address || 'Not provided'}</span>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-slate-800 text-xs">
                {['policies', 'claims', 'history'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`flex-1 pb-2 font-bold uppercase tracking-wider ${
                      activeTab === tab
                        ? 'border-b-2 border-indigo-500 text-white'
                        : 'text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {/* Tab Contents */}
              <div className="min-h-[220px]">
                {activeTab === 'policies' && (
                  <div className="flex flex-col gap-3">
                    {selectedCust.policies?.length === 0 ? (
                      <p className="text-xs text-slate-500 text-center py-8">No policies registered.</p>
                    ) : (
                      selectedCust.policies.map(p => (
                        <div key={p.id} className="p-3 bg-slate-900/30 rounded-lg border border-slate-800 flex justify-between items-center">
                          <div className="flex flex-col">
                            <span className="text-xs font-bold text-white">{p.policyType} ({p.policyNumber})</span>
                            <span className="text-[10px] text-slate-500">End: {p.endDate}</span>
                          </div>
                          <span className={`status-badge-${p.status.toLowerCase()}`}>{p.status}</span>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {activeTab === 'claims' && (
                  <div className="flex flex-col gap-3">
                    {selectedCust.policies?.flatMap(p => p.claims || []).length === 0 ? (
                      <p className="text-xs text-slate-500 text-center py-8">No claims registered.</p>
                    ) : (
                      selectedCust.policies.flatMap(p => p.claims).map(c => (
                        <div key={c.id} className="p-3 bg-slate-900/30 rounded-lg border border-slate-800 flex justify-between items-center">
                          <div className="flex flex-col max-w-[65%]">
                            <span className="text-xs font-bold text-white truncate">{c.reason}</span>
                            <span className="text-[10px] text-slate-500">${c.claimAmount} • {c.submissionDate}</span>
                          </div>
                          <span className={`status-badge-${c.status.toLowerCase()}`}>{c.status}</span>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {activeTab === 'history' && (
                  <div className="flex flex-col gap-3 max-h-[300px] overflow-y-auto pr-1">
                    {custHistory.length === 0 ? (
                      <p className="text-xs text-slate-500 text-center py-8">No history timeline events found.</p>
                    ) : (
                      custHistory.map((ev, idx) => (
                        <div key={idx} className="flex gap-3 relative pb-3 border-l border-slate-800 pl-4 last:border-0 last:pb-0">
                          <div className="absolute left-[-5px] top-1.5 w-2 h-2 rounded-full bg-indigo-500" />
                          <div className="flex flex-col gap-0.5">
                            <span className="text-xs text-slate-400 font-bold">{new Date(ev.date).toLocaleDateString()}</span>
                            <span className="text-xs text-white">{ev.description}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="glass-panel rounded-xl p-8 text-center text-slate-500 text-xs border-dashed border-slate-800 py-24">
              Select a client to view their comprehensive profile.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Customers;
