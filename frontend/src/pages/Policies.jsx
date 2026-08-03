import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import API from '../services/api';
import { 
  Search, 
  FileText, 
  Download, 
  RefreshCw, 
  XOctagon, 
  Plus, 
  ChevronDown,
  Calendar,
  AlertCircle
} from 'lucide-react';

const Policies = () => {
  const { user } = useContext(AuthContext);
  const [policies, setPolicies] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Creation form states
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [allCustomers, setAllCustomers] = useState([]); // Loaded for selecting a client
  const [createFormData, setCreateFormData] = useState({
    customerId: '',
    policyType: 'Health',
    premiumAmount: '',
    startDate: '',
    endDate: ''
  });
  const [createError, setCreateError] = useState('');
  const [createSuccess, setCreateSuccess] = useState('');

  // Renewal states
  const [selectedRenewPolicy, setSelectedRenewPolicy] = useState(null);
  const [renewFormData, setRenewFormData] = useState({
    newEndDate: '',
    newPremiumAmount: ''
  });

  const fetchPolicies = async () => {
    try {
      setLoading(true);
      const query = `?search=${search}&status=${statusFilter}&type=${typeFilter}`;
      const res = await API.get(`/policies${query}`);
      setPolicies(res.data.policies);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch policies');
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomersList = async () => {
    try {
      const res = await API.get('/customers?limit=100');
      setAllCustomers(res.data.customers);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchPolicies();
    if (user.role === 'ADMIN' || user.role === 'AGENT') {
      fetchCustomersList();
    }
  }, [statusFilter, typeFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchPolicies();
  };

  const handleDownloadPDF = async (policyId, policyNum) => {
    try {
      const res = await API.get(`/policies/${policyId}/download`, {
        responseType: 'blob'
      });
      // Create download link
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = `policy-${policyNum}.pdf`;
      link.click();
    } catch (err) {
      console.error(err);
      alert('Failed to download policy PDF certificate');
    }
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setCreateError('');
    setCreateSuccess('');

    try {
      const res = await API.post('/policies', createFormData);
      setCreateSuccess(`Policy ${res.data.policy.policyNumber} created successfully!`);
      setCreateFormData({ customerId: '', policyType: 'Health', premiumAmount: '', startDate: '', endDate: '' });
      fetchPolicies();
      setTimeout(() => setShowCreateForm(false), 2000);
    } catch (err) {
      setCreateError(err.response?.data?.error || 'Failed to create policy');
    }
  };

  const handleCancelPolicy = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this policy?')) return;
    try {
      await API.put(`/policies/${id}/cancel`);
      alert('Policy cancelled successfully');
      fetchPolicies();
    } catch (err) {
      console.error(err);
      alert('Failed to cancel policy');
    }
  };

  const handleRenewSubmit = async (e) => {
    e.preventDefault();
    try {
      await API.put(`/policies/${selectedRenewPolicy.id}/renew`, {
        newEndDate: renewFormData.newEndDate,
        newPremiumAmount: renewFormData.newPremiumAmount ? parseFloat(renewFormData.newPremiumAmount) : undefined
      });
      alert('Policy renewed successfully');
      setSelectedRenewPolicy(null);
      setRenewFormData({ newEndDate: '', newPremiumAmount: '' });
      fetchPolicies();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || 'Failed to renew policy');
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">Policies</h1>
          <p className="text-sm text-slate-400">View coverage details, generate certificates, and manage renewals</p>
        </div>
        {(user.role === 'ADMIN' || user.role === 'AGENT') && (
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white gradient-btn shadow"
          >
            <Plus size={18} />
            <span>Create Policy</span>
          </button>
        )}
      </div>

      {/* Creation Form */}
      {showCreateForm && (
        <div className="glass-panel rounded-xl p-6 border-indigo-500/20 max-w-2xl animate-fadeIn">
          <h2 className="text-base font-bold text-white mb-4">Create New Insurance Policy</h2>
          {createError && <div className="mb-4 text-xs text-rose-400 bg-rose-500/10 border border-rose-500/25 p-3 rounded-lg">{createError}</div>}
          {createSuccess && <div className="mb-4 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/25 p-3 rounded-lg">{createSuccess}</div>}

          <form onSubmit={handleCreateSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-slate-400 font-semibold">Select Customer</label>
              <select
                required
                value={createFormData.customerId}
                onChange={(e) => setCreateFormData({ ...createFormData, customerId: e.target.value })}
                className="bg-slate-900 border border-slate-800 focus:border-indigo-500 rounded-lg p-2 text-sm outline-none text-white"
              >
                <option value="">-- Choose Customer --</option>
                {allCustomers.map(cust => (
                  <option key={cust.id} value={cust.id}>{cust.name} ({cust.email})</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs text-slate-400 font-semibold">Policy Type</label>
              <select
                required
                value={createFormData.policyType}
                onChange={(e) => setCreateFormData({ ...createFormData, policyType: e.target.value })}
                className="bg-slate-900 border border-slate-800 focus:border-indigo-500 rounded-lg p-2 text-sm outline-none text-white"
              >
                <option value="Health">Health Insurance</option>
                <option value="Life">Life Insurance</option>
                <option value="Auto">Auto Insurance</option>
                <option value="Home">Home Insurance</option>
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs text-slate-400 font-semibold">Premium Amount ($)</label>
              <input
                type="number"
                step="0.01"
                required
                placeholder="250.00"
                value={createFormData.premiumAmount}
                onChange={(e) => setCreateFormData({ ...createFormData, premiumAmount: e.target.value })}
                className="bg-slate-900 border border-slate-800 focus:border-indigo-500 rounded-lg p-2 text-sm outline-none text-white"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs text-slate-400 font-semibold">Start Date</label>
              <input
                type="date"
                required
                value={createFormData.startDate}
                onChange={(e) => setCreateFormData({ ...createFormData, startDate: e.target.value })}
                className="bg-slate-900 border border-slate-800 focus:border-indigo-500 rounded-lg p-2 text-sm outline-none text-white"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs text-slate-400 font-semibold">End Date</label>
              <input
                type="date"
                required
                value={createFormData.endDate}
                onChange={(e) => setCreateFormData({ ...createFormData, endDate: e.target.value })}
                className="bg-slate-900 border border-slate-800 focus:border-indigo-500 rounded-lg p-2 text-sm outline-none text-white"
              />
            </div>

            <div className="md:col-span-2 flex justify-end gap-2 mt-2">
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-slate-800 text-slate-400 hover:bg-slate-700"
              >
                Cancel
              </button>
              <button type="submit" className="px-4 py-2 rounded-lg text-xs font-semibold text-white gradient-btn">
                Create Policy
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Renewal Modal */}
      {selectedRenewPolicy && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex justify-center items-center p-4 z-50">
          <div className="glass-panel w-full max-w-md rounded-2xl p-6 flex flex-col gap-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <RefreshCw size={18} className="text-indigo-400 animate-spin" />
                <span>Renew Policy {selectedRenewPolicy.policyNumber}</span>
              </h3>
              <button onClick={() => setSelectedRenewPolicy(null)} className="text-slate-500 hover:text-slate-300">✕</button>
            </div>

            <form onSubmit={handleRenewSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs text-slate-400 font-semibold">New End Date</label>
                <input
                  type="date"
                  required
                  value={renewFormData.newEndDate}
                  onChange={(e) => setRenewFormData({ ...renewFormData, newEndDate: e.target.value })}
                  className="bg-slate-900 border border-slate-800 focus:border-indigo-500 rounded-lg p-2.5 text-sm outline-none text-white"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs text-slate-400 font-semibold">New Premium Amount (Optional - leave blank to keep same)</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder={selectedRenewPolicy.premiumAmount}
                  value={renewFormData.newPremiumAmount}
                  onChange={(e) => setRenewFormData({ ...renewFormData, newPremiumAmount: e.target.value })}
                  className="bg-slate-900 border border-slate-800 focus:border-indigo-500 rounded-lg p-2.5 text-sm outline-none text-white"
                />
              </div>

              <div className="flex justify-end gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => setSelectedRenewPolicy(null)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold bg-slate-800 text-slate-400"
                >
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 rounded-lg text-xs font-semibold text-white gradient-btn">
                  Renew Policy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Filters & Search Row */}
      <div className="flex flex-col md:flex-row gap-3">
        <form onSubmit={handleSearchSubmit} className="flex-1 flex gap-2">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
              <Search size={18} />
            </span>
            <input
              type="text"
              placeholder="Search by policy number or client name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-900/50 border border-slate-800 focus:border-indigo-500 rounded-xl text-sm text-white placeholder-slate-500 transition-all outline-none"
            />
          </div>
          <button type="submit" className="px-5 py-2.5 bg-slate-900 border border-slate-800 hover:border-slate-700 text-sm font-semibold rounded-xl text-white transition-all">
            Search
          </button>
        </form>

        <div className="flex gap-2">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-4 py-2.5 bg-slate-900/50 border border-slate-800 focus:border-indigo-500 rounded-xl text-sm text-slate-300 outline-none"
          >
            <option value="">All Types</option>
            <option value="Health">Health</option>
            <option value="Life">Life</option>
            <option value="Auto">Auto</option>
            <option value="Home">Home</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2.5 bg-slate-900/50 border border-slate-800 focus:border-indigo-500 rounded-xl text-sm text-slate-300 outline-none"
          >
            <option value="">All Statuses</option>
            <option value="ACTIVE">ACTIVE</option>
            <option value="EXPIRED">EXPIRED</option>
            <option value="CANCELLED">CANCELLED</option>
          </select>
        </div>
      </div>

      {/* Main List */}
      {loading ? (
        <div className="flex justify-center items-center py-24">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      ) : policies.length === 0 ? (
        <div className="glass-panel rounded-xl p-8 text-center text-slate-500 text-sm">
          No policies found.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {policies.map((policy) => (
            <div key={policy.id} className="glass-panel rounded-xl p-5 flex flex-col gap-4 relative overflow-hidden glass-panel-hover">
              {/* Highlight Type Tag */}
              <div className="flex justify-between items-start border-b border-slate-800 pb-3">
                <div className="flex flex-col">
                  <span className="text-xs text-indigo-400 font-bold uppercase tracking-wider">{policy.policyType} Insurance</span>
                  <span className="text-sm font-semibold text-white mt-0.5">{policy.policyNumber}</span>
                </div>
                <span className={`status-badge-${policy.status.toLowerCase()}`}>{policy.status}</span>
              </div>

              {/* Client Info if Admin/Agent */}
              {(user.role === 'ADMIN' || user.role === 'AGENT') && (
                <div className="flex flex-col gap-0.5 text-xs">
                  <span className="text-slate-500 font-bold">Policy Holder</span>
                  <span className="text-slate-300 font-semibold">{policy.customer?.name}</span>
                </div>
              )}

              {/* Premium / Term row */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex flex-col gap-0.5">
                  <span className="text-slate-500 font-bold">Premium Rate</span>
                  <span className="text-white font-extrabold">${policy.premiumAmount.toFixed(2)}</span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-slate-500 font-bold">Coverage Ends</span>
                  <span className="text-white font-semibold flex items-center gap-1">
                    <Calendar size={12} className="text-indigo-400" />
                    <span>{policy.endDate}</span>
                  </span>
                </div>
              </div>

              {/* Action row */}
              <div className="flex justify-between items-center border-t border-slate-800 pt-3 mt-1">
                <button
                  onClick={() => handleDownloadPDF(policy.id, policy.policyNumber)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs font-semibold rounded-lg text-slate-300 hover:text-white transition-all"
                >
                  <Download size={14} />
                  <span>Certificate</span>
                </button>

                {(user.role === 'ADMIN' || user.role === 'AGENT') && policy.status === 'ACTIVE' && (
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => {
                        setSelectedRenewPolicy(policy);
                        setRenewFormData({ newEndDate: '', newPremiumAmount: '' });
                      }}
                      className="p-1.5 hover:bg-indigo-500/10 text-indigo-400 rounded"
                      title="Renew Policy"
                    >
                      <RefreshCw size={14} />
                    </button>
                    <button
                      onClick={() => handleCancelPolicy(policy.id)}
                      className="p-1.5 hover:bg-rose-500/10 text-rose-400 rounded"
                      title="Cancel Policy"
                    >
                      <XOctagon size={14} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Policies;
