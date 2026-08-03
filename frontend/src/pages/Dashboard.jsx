import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import API from '../services/api';
import { 
  Users, 
  FileText, 
  DollarSign, 
  ShieldAlert, 
  ArrowUpRight, 
  Clock, 
  AlertTriangle,
  FileCheck
} from 'lucide-react';
import { Line, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const Dashboard = () => {
  const { user } = useContext(AuthContext);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Customer-specific state
  const [customerData, setCustomerData] = useState(null);
  const [customerPolicies, setCustomerPolicies] = useState([]);
  const [customerClaims, setCustomerClaims] = useState([]);
  const [overdueAlerts, setOverdueAlerts] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        if (user.role === 'ADMIN' || user.role === 'AGENT') {
          const res = await API.get('/dashboard/stats');
          setStats(res.data);
        } else {
          // Fetch profile to get customer ID
          const profileRes = await API.get('/auth/profile');
          const customerProfile = profileRes.data.user.customer;
          setCustomerData(customerProfile);

          if (customerProfile) {
            // Fetch customer policies
            const policiesRes = await API.get('/policies');
            setCustomerPolicies(policiesRes.data.policies);

            // Fetch customer claims
            const claimsRes = await API.get('/claims');
            setCustomerClaims(claimsRes.data.claims);

            // Fetch customer alerts
            const alertsRes = await API.get('/payments/alerts');
            setOverdueAlerts(alertsRes.data.alerts);
          }
        }
      } catch (err) {
        console.error(err);
        setError('Failed to fetch dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-4 text-rose-400">
        {error}
      </div>
    );
  }

  if (user.role === 'ADMIN' || user.role === 'AGENT') {
    // Chart datasets
    const lineData = {
      labels: stats?.charts?.businessReport?.map(r => r.month) || [],
      datasets: [
        {
          label: 'Premium Collections ($)',
          data: stats?.charts?.businessReport?.map(r => r.collections) || [],
          borderColor: '#6366f1',
          backgroundColor: 'rgba(99, 102, 241, 0.1)',
          tension: 0.3,
          fill: true
        },
        {
          label: 'Claims Settled ($)',
          data: stats?.charts?.businessReport?.map(r => r.claimsPaid) || [],
          borderColor: '#ec4899',
          backgroundColor: 'rgba(236, 72, 153, 0.1)',
          tension: 0.3,
          fill: true
        }
      ]
    };

    const doughnutData = {
      labels: stats?.policies?.distribution?.map(d => d.type) || [],
      datasets: [
        {
          data: stats?.policies?.distribution?.map(d => d.count) || [],
          backgroundColor: ['#6366f1', '#10b981', '#f59e0b', '#ef4444'],
          borderWidth: 0
        }
      ]
    };

    const chartOptions = {
      responsive: true,
      plugins: {
        legend: {
          labels: { color: '#94a3b8', font: { family: 'Outfit' } }
        }
      },
      scales: {
        x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#94a3b8' } },
        y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#94a3b8' } }
      }
    };

    return (
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Overview Dashboard</h1>
          <p className="text-sm text-slate-400">Welcome, {user.name}. Here is the current business status.</p>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="glass-panel rounded-xl p-5 flex items-center justify-between">
            <div className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Clients</span>
              <span className="text-2xl font-bold text-white">{stats?.customers?.total}</span>
            </div>
            <div className="w-12 h-12 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
              <Users size={24} />
            </div>
          </div>

          <div className="glass-panel rounded-xl p-5 flex items-center justify-between">
            <div className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active Policies</span>
              <span className="text-2xl font-bold text-white">{stats?.policies?.active}</span>
            </div>
            <div className="w-12 h-12 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <FileText size={24} />
            </div>
          </div>

          <div className="glass-panel rounded-xl p-5 flex items-center justify-between">
            <div className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Collected Premiums</span>
              <span className="text-2xl font-bold text-white">${stats?.premiums?.collected?.toFixed(2)}</span>
            </div>
            <div className="w-12 h-12 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <DollarSign size={24} />
            </div>
          </div>

          <div className="glass-panel rounded-xl p-5 flex items-center justify-between">
            <div className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Pending Claims</span>
              <span className="text-2xl font-bold text-white">{stats?.claims?.pendingCount}</span>
            </div>
            <div className="w-12 h-12 rounded-lg bg-rose-500/10 text-rose-400 flex items-center justify-center">
              <ShieldAlert size={24} />
            </div>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass-panel rounded-xl p-5 md:col-span-2 flex flex-col gap-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Business Collections vs Settlement</h3>
            <div className="h-64">
              <Line data={lineData} options={chartOptions} />
            </div>
          </div>

          <div className="glass-panel rounded-xl p-5 flex flex-col gap-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Policy Types Distribution</h3>
            <div className="h-64 flex justify-center items-center">
              <Doughnut data={doughnutData} options={{ responsive: true, plugins: { legend: { position: 'bottom', labels: { color: '#94a3b8' } } } }} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Customer Dashboard
  return (
    <div className="flex flex-col gap-6">
      {/* Welcome Banner */}
      <div className="glass-panel rounded-2xl p-6 relative overflow-hidden bg-gradient-to-r from-indigo-950 to-slate-900 border-indigo-500/20">
        <div className="absolute top-0 right-0 p-8 text-indigo-500/10 pointer-events-none">
          <FileCheck size={180} />
        </div>
        <div className="flex flex-col gap-2 max-w-lg z-10 relative">
          <h1 className="text-2xl font-extrabold text-white">Welcome back, {user.name}!</h1>
          <p className="text-sm text-slate-300">
            Keep track of your policies, submit claims, make premium payments, and manage documentation securely from your dashboard.
          </p>
        </div>
      </div>

      {/* Alerts */}
      {overdueAlerts.length > 0 && (
        <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-4 flex flex-col gap-3">
          <div className="flex items-center gap-2 text-rose-400 font-bold text-sm">
            <AlertTriangle size={18} />
            <span>Overdue Premium Action Needed</span>
          </div>
          <div className="flex flex-col gap-2">
            {overdueAlerts.map(alert => (
              <div key={alert.paymentId} className="flex justify-between items-center text-xs text-slate-300 bg-rose-500/5 p-2 rounded border border-rose-500/10">
                <span>Policy <strong>{alert.policyNumber}</strong> premium of <strong>${alert.amount}</strong> was due on {alert.dueDate}.</span>
                <span className="text-rose-400 font-bold">({alert.daysOverdue} days overdue)</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Grid for Policies and Claims */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Policies List */}
        <div className="glass-panel rounded-xl p-5 flex flex-col gap-4">
          <div className="flex justify-between items-center border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <FileText size={18} className="text-indigo-400" />
              <span>My Active Policies</span>
            </h3>
            <span className="text-xs text-slate-400 font-bold bg-slate-800 px-2 py-0.5 rounded">
              {customerPolicies.filter(p => p.status === 'ACTIVE').length} Active
            </span>
          </div>
          <div className="flex flex-col gap-3">
            {customerPolicies.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-6">No policies registered. Please contact an agent.</p>
            ) : (
              customerPolicies.map(policy => (
                <div key={policy.id} className="p-3 bg-slate-900/50 rounded-lg border border-slate-800 flex justify-between items-center">
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-white">{policy.policyType} Coverage</span>
                    <span className="text-xs text-slate-400">{policy.policyNumber}</span>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-sm font-extrabold text-white">${policy.premiumAmount}</span>
                    <span className={`status-badge-${policy.status.toLowerCase()} mt-1`}>{policy.status}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Claims List */}
        <div className="glass-panel rounded-xl p-5 flex flex-col gap-4">
          <div className="flex justify-between items-center border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <ShieldAlert size={18} className="text-indigo-400" />
              <span>My Claims</span>
            </h3>
            <span className="text-xs text-slate-400 font-bold bg-slate-800 px-2 py-0.5 rounded">
              {customerClaims.length} Claims
            </span>
          </div>
          <div className="flex flex-col gap-3">
            {customerClaims.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-6">No claims submitted yet.</p>
            ) : (
              customerClaims.map(claim => (
                <div key={claim.id} className="p-3 bg-slate-900/50 rounded-lg border border-slate-800 flex justify-between items-center">
                  <div className="flex flex-col max-w-[70%]">
                    <span className="text-sm font-bold text-white truncate">{claim.reason}</span>
                    <span className="text-xs text-slate-400">Submitted on: {claim.submissionDate}</span>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-sm font-extrabold text-white">${claim.claimAmount}</span>
                    <span className={`status-badge-${claim.status.toLowerCase()} mt-1`}>{claim.status}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
