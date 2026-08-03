import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import API from '../services/api';
import { 
  CreditCard, 
  DollarSign, 
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Lock,
  ArrowDownRight
} from 'lucide-react';

const Payments = () => {
  const { user } = useContext(AuthContext);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Checkout modal states
  const [checkoutPayment, setCheckoutPayment] = useState(null);
  const [cardDetails, setCardDetails] = useState({
    number: '',
    expiry: '',
    cvv: '',
    name: ''
  });
  const [checkoutSubmitting, setCheckoutSubmitting] = useState(false);
  const [checkoutSuccess, setCheckoutSuccess] = useState(false);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const query = statusFilter ? `?status=${statusFilter}` : '';
      const res = await API.get(`/payments${query}`);
      setPayments(res.data.payments);
    } catch (err) {
      console.error(err);
      setError('Failed to retrieve premium tracking list');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [statusFilter]);

  const handleCheckoutSubmit = async (e) => {
    e.preventDefault();
    if (!checkoutPayment) return;

    setCheckoutSubmitting(true);
    try {
      await API.post('/payments/pay', { paymentId: checkoutPayment.id });
      setCheckoutSuccess(true);
      setTimeout(() => {
        setCheckoutPayment(null);
        setCheckoutSuccess(false);
        setCardDetails({ number: '', expiry: '', cvv: '', name: '' });
        fetchPayments();
      }, 2000);
    } catch (err) {
      console.error(err);
      alert('Mock checkout processor encountered an issue. Please try again.');
    } finally {
      setCheckoutSubmitting(false);
    }
  };

  const handleCardNumberChange = (e) => {
    // Format card number: Add spaces every 4 digits
    let v = e.target.value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    let matches = v.match(/\d{4,16}/g);
    let match = (matches && matches[0]) || '';
    let parts = [];

    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }

    if (parts.length > 0) {
      setCardDetails({ ...cardDetails, number: parts.join(' ') });
    } else {
      setCardDetails({ ...cardDetails, number: v });
    }
  };

  const handleExpiryChange = (e) => {
    // Format MM/YY
    let v = e.target.value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    if (v.length >= 2) {
      setCardDetails({ ...cardDetails, expiry: v.substring(0, 2) + '/' + v.substring(2, 4) });
    } else {
      setCardDetails({ ...cardDetails, expiry: v });
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">Premium Payments</h1>
          <p className="text-sm text-slate-400">Track due dates, view statement logs, and settle overdue premiums</p>
        </div>
      </div>

      {/* Checkout Payment Modal */}
      {checkoutPayment && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex justify-center items-center p-4 z-50 animate-fadeIn">
          <div className="glass-panel w-full max-w-md rounded-2xl p-6 flex flex-col gap-5 shadow-2xl relative border-indigo-500/25">
            {checkoutSuccess ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
                <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center animate-bounce">
                  <CheckCircle2 size={40} />
                </div>
                <h3 className="text-lg font-bold text-white mt-2">Payment Completed</h3>
                <p className="text-xs text-slate-400">Receipt and active status logs updated successfully.</p>
              </div>
            ) : (
              <>
                <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2 text-indigo-400">
                    <CreditCard size={20} />
                    <span className="text-sm font-bold uppercase tracking-wider">Secure Premium Checkout</span>
                  </div>
                  <button onClick={() => setCheckoutPayment(null)} className="text-slate-500 hover:text-slate-300">✕</button>
                </div>

                <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 flex justify-between items-center">
                  <div className="flex flex-col">
                    <span className="text-[10px] text-slate-500 font-bold uppercase">Paying For</span>
                    <span className="text-sm font-bold text-white">{checkoutPayment.policy?.policyType} Insurance</span>
                    <span className="text-xs text-slate-400">{checkoutPayment.policy?.policyNumber}</span>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-[10px] text-slate-500 font-bold uppercase">Amount Due</span>
                    <span className="text-lg font-black text-white">${checkoutPayment.amount.toFixed(2)}</span>
                  </div>
                </div>

                <form onSubmit={handleCheckoutSubmit} className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-slate-400 font-semibold">Cardholder Name</label>
                    <input
                      type="text"
                      required
                      placeholder="Charlie Client"
                      value={cardDetails.name}
                      onChange={(e) => setCardDetails({ ...cardDetails, name: e.target.value })}
                      className="bg-slate-900 border border-slate-800 focus:border-indigo-500 rounded-lg p-2.5 text-sm outline-none text-white"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-slate-400 font-semibold">Card Number</label>
                    <input
                      type="text"
                      required
                      maxLength="19"
                      placeholder="4111 2222 3333 4444"
                      value={cardDetails.number}
                      onChange={handleCardNumberChange}
                      className="bg-slate-900 border border-slate-800 focus:border-indigo-500 rounded-lg p-2.5 text-sm outline-none text-white"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1">
                      <label className="text-xs text-slate-400 font-semibold">Expiry Date</label>
                      <input
                        type="text"
                        required
                        maxLength="5"
                        placeholder="MM/YY"
                        value={cardDetails.expiry}
                        onChange={handleExpiryChange}
                        className="bg-slate-900 border border-slate-800 focus:border-indigo-500 rounded-lg p-2.5 text-sm outline-none text-white"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-xs text-slate-400 font-semibold">CVV</label>
                      <input
                        type="password"
                        required
                        maxLength="3"
                        placeholder="•••"
                        value={cardDetails.cvv}
                        onChange={(e) => setCardDetails({ ...cardDetails, cvv: e.target.value.replace(/[^0-9]/g, '') })}
                        className="bg-slate-900 border border-slate-800 focus:border-indigo-500 rounded-lg p-2.5 text-sm outline-none text-white"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-500 font-bold uppercase py-1">
                    <Lock size={12} className="text-emerald-500" />
                    <span>256-bit SSL encrypted connection</span>
                  </div>

                  <button
                    type="submit"
                    disabled={checkoutSubmitting}
                    className="w-full py-3 rounded-xl font-semibold text-sm text-white gradient-btn mt-2 disabled:opacity-50"
                  >
                    {checkoutSubmitting ? 'Processing Payment...' : `Authorize Charge of $${checkoutPayment.amount}`}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}

      {/* Filter Row */}
      <div className="flex justify-end">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2.5 bg-slate-900/50 border border-slate-800 focus:border-indigo-500 rounded-xl text-sm text-slate-300 outline-none"
        >
          <option value="">All Payments</option>
          <option value="PAID">PAID</option>
          <option value="UNPAID">UNPAID</option>
          <option value="OVERDUE">OVERDUE</option>
        </select>
      </div>

      {/* Main List Table */}
      {loading ? (
        <div className="flex justify-center items-center py-24">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      ) : payments.length === 0 ? (
        <div className="glass-panel rounded-xl p-8 text-center text-slate-500 text-sm">
          No premium payment statements.
        </div>
      ) : (
        <div className="glass-panel rounded-xl overflow-hidden shadow">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-xs font-bold text-slate-400 uppercase bg-slate-900/40">
                {(user.role === 'ADMIN' || user.role === 'AGENT') && <th className="p-4">Policy Holder</th>}
                <th className="p-4">Policy details</th>
                <th className="p-4">Due Date</th>
                <th className="p-4">Payment Date</th>
                <th className="p-4">Amount</th>
                <th className="p-4 text-center">Status</th>
                {user.role === 'CUSTOMER' && <th className="p-4 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/40 text-sm">
              {payments.map((pay) => (
                <tr key={pay.id} className="hover:bg-slate-900/10 transition-all">
                  {(user.role === 'ADMIN' || user.role === 'AGENT') && (
                    <td className="p-4 font-semibold text-white">{pay.policy?.customer?.name}</td>
                  )}
                  <td className="p-4">
                    <div className="flex flex-col">
                      <span className="font-semibold text-slate-200">{pay.policy?.policyType} Insurance</span>
                      <span className="text-xs text-slate-500">{pay.policy?.policyNumber}</span>
                    </div>
                  </td>
                  <td className="p-4 text-slate-300">
                    <span className="flex items-center gap-1.5">
                      <Calendar size={14} className="text-slate-500" />
                      <span>{pay.dueDate}</span>
                    </span>
                  </td>
                  <td className="p-4 text-slate-400">
                    {pay.paymentDate ? (
                      <span className="flex items-center gap-1.5">
                        <Calendar size={14} className="text-slate-500" />
                        <span>{pay.paymentDate}</span>
                      </span>
                    ) : (
                      <span className="text-slate-600">-</span>
                    )}
                  </td>
                  <td className="p-4 text-white font-extrabold">${pay.amount.toFixed(2)}</td>
                  <td className="p-4 text-center">
                    <span className={`status-badge-${pay.paymentStatus.toLowerCase()}`}>
                      {pay.paymentStatus}
                    </span>
                  </td>
                  {user.role === 'CUSTOMER' && (
                    <td className="p-4 text-right">
                      {pay.paymentStatus !== 'PAID' ? (
                        <button
                          onClick={() => setCheckoutPayment(pay)}
                          className="px-3 py-1.5 bg-indigo-500 hover:bg-indigo-600 text-xs font-semibold rounded-lg text-white shadow-md transition-all flex items-center gap-1.5 float-right cursor-pointer"
                        >
                          <CreditCard size={12} />
                          <span>Pay Premium</span>
                        </button>
                      ) : (
                        <span className="text-emerald-400 text-xs font-semibold">Settled</span>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Payments;
