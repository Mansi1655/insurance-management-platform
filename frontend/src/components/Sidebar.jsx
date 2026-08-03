import React, { useContext } from 'react';
import { NavLink } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  ShieldAlert, 
  CreditCard, 
  LogOut,
  FolderDot
} from 'lucide-react';

const Sidebar = () => {
  const { user, logout } = useContext(AuthContext);

  const getLinks = () => {
    const baseLinks = [
      { to: '/', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    ];

    if (user?.role === 'ADMIN' || user?.role === 'AGENT') {
      baseLinks.push({ to: '/customers', label: 'Customers', icon: <Users size={20} /> });
    }

    baseLinks.push({ to: '/policies', label: 'Policies', icon: <FileText size={20} /> });
    baseLinks.push({ to: '/claims', label: 'Claims', icon: <ShieldAlert size={20} /> });
    baseLinks.push({ to: '/payments', label: 'Payments', icon: <CreditCard size={20} /> });
    
    return baseLinks;
  };

  return (
    <div className="w-64 h-screen bg-slate-900 border-r border-slate-800 flex flex-col justify-between p-4 sticky top-0">
      <div className="flex flex-col gap-6">
        {/* Brand Header */}
        <div className="flex items-center gap-3 px-2 py-3 border-b border-slate-800">
          <FolderDot className="text-indigo-400" size={28} />
          <div>
            <h1 className="font-extrabold text-lg text-white leading-tight tracking-wide">ANTIGRAVITY</h1>
            <span className="text-[10px] text-indigo-400 font-bold tracking-widest uppercase">Insurance</span>
          </div>
        </div>

        {/* Navigation links */}
        <nav className="flex flex-col gap-1">
          {getLinks().map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                }`
              }
              end={link.to === '/'}
            >
              {link.icon}
              <span>{link.label}</span>
            </NavLink>
          ))}
        </nav>
      </div>

      {/* User profile section & logout */}
      <div className="border-t border-slate-800 pt-4 flex flex-col gap-3">
        <div className="flex items-center gap-3 px-2 py-1">
          <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center font-bold text-white uppercase text-sm">
            {user?.name?.charAt(0) || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-semibold text-white truncate">{user?.name}</h4>
            <span className="inline-block px-2 py-0.5 mt-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-800 text-indigo-300 border border-indigo-500/20">
              {user?.role}
            </span>
          </div>
        </div>

        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg transition-all"
        >
          <LogOut size={20} />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
