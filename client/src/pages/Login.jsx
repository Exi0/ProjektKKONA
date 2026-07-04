import React, { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppContent } from '../context/AppContext';
import axios from 'axios';
import { toast } from 'react-toastify';
import { Eye, EyeOff } from 'lucide-react';

const Login = () => {
  const navigate = useNavigate();
  const { backendUrl, setIsLoggedin, getUserData } = useContext(AppContent);

  const [state, setState] = useState('Registrovat');
  const [name, setName] = useState('');
  const [ico, setICO] = useState('');
  const [email, setEmail] = useState('');
  const [heslo, setPassword] = useState('');
  const [heslo2, setPassword2] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreeGdpr, setAgreeGdpr] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);

  const onSubmitHandler = async (e) => {
    e.preventDefault();
    axios.defaults.withCredentials = true;
    try {
      if (state === 'Registrovat') {
        if (heslo !== heslo2) { toast.error('Hesla se neshodují.'); return; }
        if (!agreeGdpr || !agreeTerms) { toast.error('Musíte souhlasit s GDPR a obchodními podmínkami.'); return; }
        const { data } = await axios.post(`${backendUrl}/api/auth/register`, { name, ico, email, heslo });
        if (data.success) { setIsLoggedin(true); getUserData(); navigate('/'); }
        else toast.error(data.message);
      } else {
        const { data } = await axios.post(`${backendUrl}/api/auth/login`, { email, heslo });
        if (data.success) { setIsLoggedin(true); getUserData(); navigate('/'); }
        else toast.error(data.message);
      }
    } catch (error) { toast.error(error.message); }
  };

  const isRegister = state === 'Registrovat';

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-green-200 to-amber-100 relative">
      {/* Logo */}
      <div
        onClick={() => navigate('/')}
        className="absolute top-6 left-6 flex items-center gap-2 cursor-pointer hover:scale-105 transition-transform"
      >
        <div className="bg-white text-green-700 font-bold text-lg rounded-full w-10 h-10 flex justify-center items-center shadow">
          AZ
        </div>
        <span className="text-xl font-bold hidden sm:block text-green-900">AgroZakázky</span>
      </div>

      <div className="bg-white/80 backdrop-blur-md p-8 sm:p-10 rounded-2xl shadow-xl w-full sm:w-[400px]">
        <h2 className="text-3xl font-bold text-gray-800 text-center mb-2">
          {isRegister ? 'Vytvořit účet' : 'Přihlásit se'}
        </h2>
        <form onSubmit={onSubmitHandler} className="space-y-4">
          {isRegister && (
            <>
              <div className="flex items-center gap-3 px-4 py-2 rounded-full bg-gray-100">
                <span className="text-green-700 font-bold">🏢</span>
                <input onChange={(e) => setName(e.target.value)} value={name} type="text" placeholder="Název společnosti / subjektu" required className="bg-transparent outline-none w-full text-gray-700 placeholder-gray-500" />
              </div>
              <div className="flex items-center gap-3 px-4 py-2 rounded-full bg-gray-100">
                <span className="text-green-700 font-bold">🔢</span>
                <input onChange={(e) => setICO(e.target.value)} value={ico} pattern="\d{8}" maxLength="8" placeholder="IČ" required className="bg-transparent outline-none w-full text-gray-700 placeholder-gray-500" />
              </div>
            </>
          )}

          <div className="flex items-center gap-3 px-4 py-2 rounded-full bg-gray-100">
            <span className="text-green-700 font-bold">📧</span>
            <input onChange={(e) => setEmail(e.target.value)} value={email} type="email" placeholder="Email" required className="bg-transparent outline-none w-full text-gray-700 placeholder-gray-500" />
          </div>

          <div className="flex items-center gap-3 px-4 py-2 rounded-full bg-gray-100 relative">
            <span className="text-green-700 font-bold">🔒</span>
            <input onChange={(e) => setPassword(e.target.value)} value={heslo} type={showPassword ? 'text' : 'password'} placeholder="Heslo" required className="bg-transparent outline-none w-full text-gray-700 placeholder-gray-500 pr-8" />
            <div className="absolute right-4 text-gray-500 cursor-pointer hover:text-gray-700" onClick={() => setShowPassword(!showPassword)}>
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </div>
          </div>

          {isRegister && (
            <div className="flex items-center gap-3 px-4 py-2 rounded-full bg-gray-100 relative">
              <span className="text-green-700 font-bold">✅</span>
              <input onChange={(e) => setPassword2(e.target.value)} value={heslo2} type={showPassword ? 'text' : 'password'} placeholder="Potvrďte heslo" required className="bg-transparent outline-none w-full text-gray-700 placeholder-gray-500 pr-8" />
              <div className="absolute right-4 text-gray-500 cursor-pointer hover:text-gray-700" onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </div>
            </div>
          )}

          {/* GDPR + Podmínky — JEN při registraci */}
          {isRegister && (
            <div className="space-y-2 text-sm text-gray-700">
              <label className="flex items-start gap-2 cursor-pointer">
                <input type="checkbox" checked={agreeGdpr} onChange={(e) => setAgreeGdpr(e.target.checked)} className="mt-1" />
                <span>Souhlasím se zpracováním osobních údajů <a href="/gdpr" className="text-blue-600 underline">(GDPR)</a></span>
              </label>
              <label className="flex items-start gap-2 cursor-pointer">
                <input type="checkbox" checked={agreeTerms} onChange={(e) => setAgreeTerms(e.target.checked)} className="mt-1" />
                <span>Souhlasím s <a href="/terms" className="text-blue-600 underline">obchodními podmínkami</a></span>
              </label>
            </div>
          )}

          <p onClick={() => navigate('/reset-password')} className="text-right text-sm text-blue-600 cursor-pointer hover:underline">
            Zapomenuté heslo?
          </p>

          <button type="submit" className="w-full py-2 rounded-full bg-gradient-to-r from-green-400 to-green-600 text-white font-semibold hover:from-green-500 hover:to-green-700 transition-colors">
            {state}
          </button>
        </form>

        <div className="mt-4 text-center text-gray-600 text-sm">
          {isRegister ? (
            <>Už máte účet?{' '}<span onClick={() => setState('Přihlásit se')} className="text-blue-600 cursor-pointer hover:underline">Přihlásit se</span></>
          ) : (
            <>Nemáte účet?{' '}<span onClick={() => setState('Registrovat')} className="text-blue-600 cursor-pointer hover:underline">Registrovat se</span></>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;
