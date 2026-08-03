import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import API from '../services/api';
import { 
  Search, 
  ShieldAlert, 
  Plus, 
  Calendar,
  CheckCircle,
  XCircle,
  FileCheck,
  Download,
  AlertCircle
} from 'lucide-react';

const Claims = () => {
  const { user } = useContext(AuthContext);
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');

  // Submit Claim Form states
  const [showSubmitForm, setShowSubmitForm] = useState(false);
  const [myPolicies, setMyPolicies] = useState([]); // Loaded for selecting a policy
  const [submitFormData, setSubmitFormData] = useState({
    policyId: '',
    claimAmount: '',
    reason: ''
  });
  const [claimFile, setClaimFile] = useState(null);
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState('');

  const fetchClaims = async () => {
    try {
      setLoading(true);
      const query = `?status=${statusFilter}&search=${search}`;
      const res = await API.get(`/claims${query}`);
      setClaims(res.data.claims);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch claims');
    } finally {
      setLoading(false);
    }
  };

  const fetchMyPolicies = async () => {
    try {
      const res = await API.get('/policies?status=ACTIVE');
      setMyPolicies(res.data.policies);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchClaims();
    if (user.role === 'CUSTOMER') {
      fetchMyPolicies();
    }
  }, [statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchClaims();
  };

  const handleFileChange = (e) => {
    if (e.target.files.length > 0) {
      setClaimFile(e.target.files[0]);
    }
  };

  const handleSubmitClaim = async (e) => {
    e.preventDefault();
    setSubmitError('');
    setSubmitSuccess('');

    if (!submitFormData.policyId || !submitFormData.claimAmount || !submitFormData.reason) {
      setSubmitError('Please fill out all fields.');
      return;
    }

    try {
      // Build FormData for file uploads
      const data = new FormData();
      data.append('policyId', submitFormData.policyId);
      data.append('claimAmount', submitFormData.claimAmount);
      data.append('reason', submitFormData.reason);
      if (claimFile) {
        data.append('file', claimFile);
      }

      await API.post('/claims', data, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      setSubmitSuccess('Claim submitted successfully! Our agents will verify it shortly.');
      setSubmitFormData({ policyId: '', claimAmount: '', reason: '' });
      setClaimFile(null);
      fetchClaims();
      setTimeout(() => setShowSubmitForm(false), 2500);
    } catch (err) {
      setSubmitError(err.response?.data?.error || 'Failed to submit claim request');
    }
  };

  const handleUpdateStatus = async (id, status) => {
    const actionStr = status === 'APPROVED' ? 'approve' : 'reject';
    if (!window.confirm(`Are you sure you want to ${actionStr} this claim?`)) return;

    try {
      await API.put(`/claims/${id}/status`, { status });
      alert(`Claim status updated to ${status}`);
      fetchClaims();
    } catch (err) {
      console.error(err);
      alert('Failed to update claim status');
    }
  };

  const handleDownloadDoc = (filePath, fileName) => {
    // Open in new tab or trigger download since backend serves uploads statically
    const downloadUrl = `http://localhost:5000${filePath}`;
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = fileName;
    link.target = '_blank';
    link.click();
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">Claims Workspace</h1>
          <p className="text-sm text-slate-400">File requests, submit supporting documents, and track status</p>
        </div>
        {user.role === 'CUSTOMER' && (
          <button
            onClick={() => setShowSubmitForm(!showSubmitForm)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white gradient-btn shadow"
          >
            <Plus size={18} />
            <span>File a Claim</span>
          </button>
        )}
      </div>

      {/* Claim Submission Form */}
      {showSubmitForm && (
        <div className="glass-panel rounded-xl p-6 border-indigo-500/20 max-w-2xl animate-fadeIn">
          <h2 className="text-base font-bold text-white mb-4">Submit Policy Claim Request</h2>
          {submitError && <div className="mb-4 text-xs text-rose-400 bg-rose-500/10 border border-rose-500/25 p-3 rounded-lg">{submitError}</div>}
          {submitSuccess && <div className="mb-4 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/25 p-3 rounded-lg">{submitSuccess}</div>}

          <form onSubmit={handleSubmitClaim} className="flex flex-col gap-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs text-slate-400 font-semibold">Select Covered Policy</label>
                <select
                  required
                  value={submitFormData.policyId}
                  onChange={(e) => setSubmitFormData({ ...submitFormData, policyId: e.target.value })}
                  className="bg-slate-900 border border-slate-800 focus:border-indigo-500 rounded-lg p-2 text-sm outline-none text-white animate-transition"
                >
                  <option value="">-- Choose Active Policy --</option>
                  {myPolicies.map(p => (
                    <option key={p.id} value={p.id}>{p.policyType} ({p.policyNumber})</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs text-slate-400 font-semibold">Claim Amount Requested ($)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="500.00"
                  value={submitFormData.claimAmount}
                  onChange={(e) => setSubmitFormData({ ...submitFormData, claimAmount: e.target.value })}
                  className="bg-slate-900 border border-slate-800 focus:border-indigo-500 rounded-lg p-2 text-sm outline-none text-white"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs text-slate-400 font-semibold">Reason for Claim Request</label>
              <textarea
                rows="3"
                required
                placeholder="Describe why you are filing a claim (e.g. medical expenses, accident details)..."
                value={submitFormData.reason}
                onChange={(e) => setSubmitFormData({ ...submitFormData, reason: e.target.value })}
                className="bg-slate-900 border border-slate-800 focus:border-indigo-500 rounded-lg p-3 text-sm outline-none text-white resize-none"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs text-slate-400 font-semibold">Supporting Documents (.pdf, .jpg, .png)</label>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 px-4 py-2 bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs font-semibold rounded-lg text-slate-300 hover:text-white cursor-pointer transition-all">
                  <Download size={14} className="rotate-180" />
                  <span>Choose File</span>
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
                <span className="text-xs text-slate-500 truncate max-w-[300px]">
                  {claimFile ? claimFile.name : 'No file chosen'}
                </span>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-2">
              <button
                type="button"
                onClick={() => setShowSubmitForm(false)}
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-slate-800 text-slate-400"
              >
                Cancel
              </button>
              <button type="submit" className="px-4 py-2 rounded-lg text-xs font-semibold text-white gradient-btn">
                Submit Claim
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Search & Filter Row */}
      <div className="flex flex-col md:flex-row gap-3">
        <form onSubmit={handleSearchSubmit} className="flex-1 flex gap-2">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
              <Search size={18} />
            </span>
            <input
              type="text"
              placeholder="Search claims by reason, policy, or holder..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-900/50 border border-slate-800 focus:border-indigo-500 rounded-xl text-sm text-white placeholder-slate-500 transition-all outline-none"
            />
          </div>
          <button type="submit" className="px-5 py-2.5 bg-slate-900 border border-slate-800 hover:border-slate-700 text-sm font-semibold rounded-xl text-white transition-all">
            Search
          </button>
        </form>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2.5 bg-slate-900/50 border border-slate-800 focus:border-indigo-500 rounded-xl text-sm text-slate-300 outline-none"
        >
          <option value="">All Statuses</option>
          <option value="PENDING">PENDING</option>
          <option value="APPROVED">APPROVED</option>
          <option value="REJECTED">REJECTED</option>
        </select>
      </div>

      {/* Claims List Table */}
      {loading ? (
        <div className="flex justify-center items-center py-24">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      ) : claims.length === 0 ? (
        <div className="glass-panel rounded-xl p-8 text-center text-slate-500 text-sm">
          No claim requests found.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {claims.map((claim) => (
            <div key={claim.id} className="glass-panel rounded-xl p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 glass-panel-hover">
              <div className="flex flex-col gap-2 max-w-2xl">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-indigo-400 uppercase bg-indigo-500/10 px-2 py-0.5 rounded">
                    {claim.policy?.policyType} Policy ({claim.policy?.policyNumber})
                  </span>
                  <span className={`status-badge-${claim.status.toLowerCase()}`}>{claim.status}</span>
                </div>
                <h4 className="text-sm font-semibold text-white leading-relaxed">{claim.reason}</h4>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500 mt-1">
                  <span>Filed by: <strong>{claim.policy?.customer?.name}</strong></span>
                  <span>Submitted on: {claim.submissionDate}</span>
                  {claim.filePath && (
                    <button
                      onClick={() => handleDownloadDoc(claim.filePath, `claim-doc-${claim.id}`)}
                      className="text-indigo-400 hover:text-indigo-300 underline font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <FileCheck size={12} />
                      <span>View Uploaded File</span>
                    </button>
                  )}
                </div>
              </div>

              <div className="flex flex-col items-end gap-3 self-stretch md:self-auto border-t md:border-t-0 border-slate-800/60 pt-3 md:pt-0">
                <div className="flex flex-col items-end">
                  <span className="text-xs text-slate-500 font-bold uppercase">Claim Amount</span>
                  <span className="text-lg font-extrabold text-white">${claim.claimAmount.toFixed(2)}</span>
                </div>

                {(user.role === 'ADMIN' || user.role === 'AGENT') && claim.status === 'PENDING' && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleUpdateStatus(claim.id, 'REJECTED')}
                      className="flex items-center gap-1 px-3 py-1.5 bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20 text-xs font-semibold text-rose-400 rounded-lg transition-all"
                    >
                      <XCircle size={14} />
                      <span>Reject</span>
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(claim.id, 'APPROVED')}
                      className="flex items-center gap-1 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 text-xs font-semibold text-emerald-400 rounded-lg transition-all"
                    >
                      <CheckCircle size={14} />
                      <span>Approve</span>
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

export default Claims;
