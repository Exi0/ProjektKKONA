import React, { useContext, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppContent } from '../context/AppContext';
import axios from 'axios';
import { toast } from 'react-toastify';

const ResetPassword = () => {
  const { backendUrl } = useContext(AppContent);
  const navigate = useNavigate();

  axios.defaults.withCredentials = true;

  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isEmailSent, setIsEmailSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [isOtpSubmitted, setIsOtpSubmitted] = useState(false);

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

  const onSubmitEmail = async (e) => {
    e.preventDefault();
    try {
      const { data } = await axios.post(`${backendUrl}/api/auth/sendResetOtp`, { email });
      if (data.success) {
        toast.success(data.message);
        setIsEmailSent(true);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error('Chyba při odesílání emailu.');
    }
  };

  const onSubmitOtp = async (e) => {
    e.preventDefault();
    const otpArray = inputRefs.current.map((el) => el.value);
    const joined = otpArray.join('');
    if (!joined || joined.length < 6) return toast.error('Zadejte všech 6 číslic.');
    setOtp(joined);
    setIsOtpSubmitted(true);
  };

  const onSubmitNewPassword = async (e) => {
    e.preventDefault();
    try {
      const { data } = await axios.post(`${backendUrl}/api/auth/resetPassword`, {
        email,
        otp,
        newPassword,
      });
      if (data.success) {
        toast.success('Heslo bylo úspěšně změněno.');
        navigate('/login');
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error('Chyba při nastavování hesla.');
    }
  };

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

      {/* 1️⃣ Zadat email */}
      {!isEmailSent && (
        <form
          onSubmit={onSubmitEmail}
          className="bg-white/80 backdrop-blur-md p-8 sm:p-10 rounded-2xl shadow-xl w-full sm:w-[400px]"
        >
          <h2 className="text-3xl font-bold text-gray-800 text-center mb-2">Obnovení hesla</h2>
          <p className="text-center text-gray-600 mb-6">Zadejte svůj registrovaný e-mail</p>

          <div className="flex items-center gap-3 px-4 py-2 rounded-full bg-gray-100 mb-6">
            <span className="text-green-700 font-bold">📧</span>
            <input
              type="email"
              placeholder="Email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-transparent outline-none w-full text-gray-700 placeholder-gray-500"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2 rounded-full bg-gradient-to-r from-green-400 to-green-600 text-white font-semibold hover:from-green-500 hover:to-green-700 transition-colors"
          >
            Odeslat kód
          </button>
        </form>
      )}

      {/* 2️⃣ Zadat OTP */}
      {isEmailSent && !isOtpSubmitted && (
        <form
          onSubmit={onSubmitOtp}
          className="bg-white/80 backdrop-blur-md p-8 sm:p-10 rounded-2xl shadow-xl w-full sm:w-[400px]"
        >
          <h2 className="text-3xl font-bold text-gray-800 text-center mb-2">Ověření kódu</h2>
          <p className="text-center text-gray-600 mb-6">
            Zadejte 6-místný kód zaslaný na e-mail <br />
            <span className="font-semibold text-green-700">{email}</span>
          </p>

          <div className="flex justify-between mb-8" onPaste={handlePaste}>
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
            Potvrdit kód
          </button>
        </form>
      )}

      {/* 3️⃣ Zadat nové heslo */}
      {isOtpSubmitted && isEmailSent && (
        <form
          onSubmit={onSubmitNewPassword}
          className="bg-white/80 backdrop-blur-md p-8 sm:p-10 rounded-2xl shadow-xl w-full sm:w-[400px]"
        >
          <h2 className="text-3xl font-bold text-gray-800 text-center mb-2">Nové heslo</h2>
          <p className="text-center text-gray-600 mb-6">Zadejte své nové heslo níže</p>

          <div className="flex items-center gap-3 px-4 py-2 rounded-full bg-gray-100 mb-6">
            <span className="text-green-700 font-bold">🔒</span>
            <input
              type="password"
              placeholder="Nové heslo"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="bg-transparent outline-none w-full text-gray-700 placeholder-gray-500"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2 rounded-full bg-gradient-to-r from-green-400 to-green-600 text-white font-semibold hover:from-green-500 hover:to-green-700 transition-colors"
          >
            Uložit nové heslo
          </button>
        </form>
      )}
    </div>
  );
};

export default ResetPassword;
