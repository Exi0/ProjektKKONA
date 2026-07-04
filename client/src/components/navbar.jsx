import React, { useContext, useEffect, useState, useRef, forwardRef } from 'react';
import axios from 'axios';
import { useNavigate, useLocation } from 'react-router-dom';
import { AppContent } from '../context/AppContext';
import { toast } from 'react-toastify';
import {
  UserCircleIcon, ArrowRightOnRectangleIcon, UserIcon, ClipboardDocumentListIcon,
  EnvelopeIcon, SparklesIcon, MapIcon, PlusCircleIcon, Bars3Icon, XMarkIcon,
  HeartIcon, TrophyIcon, InformationCircleIcon
} from '@heroicons/react/24/solid';

const navLinks = [
  { path: '/inzeraty', label: 'Zakázky', icon: ClipboardDocumentListIcon },
  { path: '/mapa', label: 'Mapa', icon: MapIcon },
  { path: '/createinzerat', label: 'Nová zakázka', icon: PlusCircleIcon },
  { path: '/about', label: 'O nás', icon: InformationCircleIcon },
];

const Navbar = forwardRef((props, ref) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { userData, backendUrl, setUserData, setIsLoggedin } = useContext(AppContent);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setDropdownOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Close mobile menu on navigation
  useEffect(() => { setMobileOpen(false); setDropdownOpen(false); }, [location.pathname]);

  const sendVerificationOtp = async () => {
    try {
      if (!userData?.id) { toast.error("Přihlas se znovu."); return; }
      const { data } = await axios.post(`${backendUrl}/api/auth/sendVerifyOtp`, { userId: userData.id }, { withCredentials: true });
      if (data.success) { toast.success(data.message); navigate('/email-verify'); }
      else toast.error(data.message);
    } catch { toast.error("Chyba při odesílání ověřovacího kódu."); }
  };

  const logout = async () => {
    try {
      axios.defaults.withCredentials = true;
      const { data } = await axios.post(backendUrl + '/api/auth/logout');
      if (data.success) { setIsLoggedin(false); setUserData(false); navigate('/'); }
    } catch (error) { toast.error(error.message); }
  };

  const isActive = (path) => location.pathname === path;

  const dropdownItems = [
    ...(!userData?.subscription?.hasSubscription ? [{
      icon: SparklesIcon, label: 'Předplatné', color: 'text-amber-500',
      onClick: () => navigate('/subscription')
    }] : []),
    ...(!userData?.isAccountVerified ? [{
      icon: EnvelopeIcon, label: 'Ověřit email', color: 'text-green-600',
      onClick: sendVerificationOtp
    }] : []),
    { icon: UserIcon, label: 'Profil', color: 'text-green-600', onClick: () => navigate(`/profil/${userData.id}`) },
    { icon: ClipboardDocumentListIcon, label: 'Moje nabídky', color: 'text-green-600', onClick: () => navigate('/mojenabidky') },
    { icon: TrophyIcon, label: 'Moje zakázky', color: 'text-green-600', onClick: () => navigate('/mojezakazky') },
    { icon: HeartIcon, label: 'Oblíbené', color: 'text-green-600', onClick: () => navigate('/oblibenenabidky') },
  ];

  return (
    <nav ref={ref} className="w-full fixed top-0 left-0 z-50 bg-green-700/95 backdrop-blur-sm text-white shadow-md">
      <div className="max-w-7xl mx-auto flex justify-between items-center px-4 lg:px-8 py-3">

        {/* Logo */}
        <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => navigate('/')}>
          <div className="bg-white text-green-700 font-bold text-lg rounded-xl w-9 h-9 flex justify-center items-center shadow-sm">
            AZ
          </div>
          <span className="text-lg font-bold hidden sm:block tracking-tight">AgroZakázky</span>
        </div>

        {/* Desktop nav */}
        {userData && (
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <button key={link.path} onClick={() => navigate(link.path)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition
                  ${isActive(link.path) ? 'bg-green-800 text-white' : 'text-green-100 hover:bg-green-800/60'}`}>
                <link.icon className="h-4 w-4" />
                {link.label}
              </button>
            ))}
          </div>
        )}

        {/* Right side */}
        <div className="flex items-center gap-2">
          {userData ? (
            <>
              {/* Profile dropdown */}
              <div className="relative" ref={dropdownRef}>
                <button onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-2 bg-green-800/60 hover:bg-green-800 rounded-xl px-3 py-2 transition">
                  <UserCircleIcon className="h-5 w-5" />
                  <span className="hidden sm:inline text-sm font-medium">{userData.name}</span>
                </button>

                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white text-gray-800 rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                    {/* User header */}
                    <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
                      <p className="font-semibold text-sm text-gray-800 truncate">{userData.name}</p>
                      <p className="text-xs text-gray-500 truncate">{userData.email}</p>
                    </div>
                    <div className="py-1">
                      {dropdownItems.map((item, i) => (
                        <button key={i} onClick={item.onClick}
                          className="flex items-center gap-3 w-full px-4 py-2.5 text-sm hover:bg-gray-50 transition text-left">
                          <item.icon className={`h-4 w-4 ${item.color}`} />
                          {item.label}
                        </button>
                      ))}
                      <div className="border-t border-gray-100 mt-1 pt-1">
                        <button onClick={logout}
                          className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition text-left">
                          <ArrowRightOnRectangleIcon className="h-4 w-4" />
                          Odhlásit se
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Mobile hamburger */}
              <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden p-2 hover:bg-green-800/60 rounded-xl transition">
                {mobileOpen ? <XMarkIcon className="h-5 w-5" /> : <Bars3Icon className="h-5 w-5" />}
              </button>
            </>
          ) : (
            <button onClick={() => navigate('/login')}
              className="flex items-center gap-2 border border-white/60 text-white rounded-xl px-4 py-2 text-sm font-medium hover:bg-white hover:text-green-700 transition">
              Přihlásit se
            </button>
          )}
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && userData && (
        <div className="md:hidden border-t border-green-600 bg-green-700 px-4 pb-4 pt-2 space-y-1">
          {navLinks.map((link) => (
            <button key={link.path} onClick={() => navigate(link.path)}
              className={`flex items-center gap-2 w-full px-3 py-2.5 rounded-xl text-sm font-medium transition
                ${isActive(link.path) ? 'bg-green-800 text-white' : 'text-green-100 hover:bg-green-800/60'}`}>
              <link.icon className="h-4 w-4" /> {link.label}
            </button>
          ))}
        </div>
      )}
    </nav>
  );
});

export default Navbar;
