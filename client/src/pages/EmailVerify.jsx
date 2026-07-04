import React, { useContext, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppContent } from '../context/AppContext';
import axios from 'axios';
import { toast } from 'react-toastify';

const EmailVerify = () => {
  const navigate = useNavigate();
  const { backendUrl, isLoggedin, userData, getUserData } = useContext(AppContent);
  const inputRefs = useRef([]);

  const handleInput = (e, index) => {
    if (e.target.value.length > 0 && index < inputRefs.current.length - 1) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === 'Backspace' && e.target.value === '' && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };

  const handlePaste = (e) => {
    const paste = e.clipboardData.getData('text').trim();
    const chars = paste.split('');
    chars.forEach((char, idx) => {
      if (inputRefs.current[idx]) inputRefs.current[idx].value = char;
    });
  };

  const onSubmitHandler = async (e) => {
    e.preventDefault();
    try {
      const otp = inputRefs.current.map((el) => el.value).join('');
      const userId = userData?.id;

      const { data } = await axios.post(`${backendUrl}/api/auth/verifyAcc`, { userId, otp });
      if (data.success) {
        toast.success(data.message);
        await getUserData();
        navigate('/');
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error('Chyba při ověřování účtu.');
    }
  };

  useEffect(() => {
    if (isLoggedin && userData?.isAccountVerified) navigate('/');
  }, [isLoggedin, userData, navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-green-200 to-amber-100 relative">
      {/* Logo stejné jako v Login.jsx */}
      <div
        onClick={() => navigate('/')}
        className="absolute top-6 left-6 flex items-center gap-2 cursor-pointer hover:scale-105 transition-transform"
      >
        <div className="bg-white text-green-700 font-bold text-lg rounded-full w-10 h-10 flex justify-center items-center shadow">
          AG
        </div>
        <span className="text-xl font-bold hidden sm:block text-green-900">AgroPortal</span>
      </div>

      <div className="bg-white/80 backdrop-blur-md p-8 sm:p-10 rounded-2xl shadow-xl w-full sm:w-[400px]">
        <h2 className="text-3xl font-bold text-gray-800 text-center mb-2">Ověření účtu</h2>
        <p className="text-center text-gray-600 mb-6">
          Zadejte 6-místný kód zaslaný na e-mail <br />
          <span className="font-semibold text-green-700">{userData?.email}</span>
        </p>

        {/* OTP Inputy */}
        <form onSubmit={onSubmitHandler} className="space-y-4">
          <div className="flex justify-between mb-6" onPaste={handlePaste}>
            {Array(6)
              .fill(0)
              .map((_, index) => (
                <input
                  key={index}
                  type="text"
                  maxLength="1"
                  required
                  ref={(el) => (inputRefs.current[index] = el)}
                  onInput={(e) => handleInput(e, index)}
                  onKeyDown={(e) => handleKeyDown(e, index)}
                  className="w-12 h-12 text-2xl font-semibold text-green-700 text-center rounded-lg bg-gray-100 focus:ring-2 focus:ring-green-400 focus:outline-none transition"
                />
              ))}
          </div>

          <button
            type="submit"
            className="w-full py-2 rounded-full bg-gradient-to-r from-green-400 to-green-600 text-white font-semibold hover:from-green-500 hover:to-green-700 transition-colors"
          >
            Ověřit účet
          </button>
        </form>

        {/* Info */}
        <div className="mt-4 text-center text-gray-600 text-sm">
          <p>
            Kód jste neobdrželi?{' '}
            <span
              onClick={() => toast.info('Zkontrolujte spam složku nebo zkuste odeslat znovu.')}
              className="text-blue-600 cursor-pointer hover:underline"
            >
              Odeslat znovu
            </span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default EmailVerify;
