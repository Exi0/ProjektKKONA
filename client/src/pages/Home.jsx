import React, { useEffect, useState, useContext } from 'react';
import Navbar from '../components/navbar';
import { AppContent } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  UsersIcon, ChartBarIcon, EyeIcon, ArrowRightIcon,
  MapPinIcon, ShieldCheckIcon, ClockIcon
} from '@heroicons/react/24/solid';

const Home = () => {
  const { backendUrl, userData } = useContext(AppContent);
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);

  useEffect(() => {
    axios.get(`${backendUrl}/api/stats/overview`)
      .then(({ data }) => { if (data.success) setStats(data.stats); })
      .catch(() => {});
  }, [backendUrl]);

  const statCards = stats ? [
    { label: 'Uživatelů', value: stats.users, icon: UsersIcon, color: 'text-green-600 bg-green-100' },
    { label: 'Zakázek', value: stats.inzeraty, icon: ChartBarIcon, color: 'text-amber-600 bg-amber-100' },
    { label: 'Zobrazení', value: stats.totalViews, icon: EyeIcon, color: 'text-blue-600 bg-blue-100' },
  ] : [];

  const features = [
    { icon: ShieldCheckIcon, title: 'Ověření uživatelé', desc: 'Každý dodavatel prochází verifikací pro maximální důvěru.' },
    { icon: MapPinIcon, title: 'Celá ČR a SR', desc: 'Zakázky ze všech krajů, zobrazení na interaktivní mapě.' },
    { icon: ClockIcon, title: 'Deal lifecycle', desc: 'Od poptávky přes dohodnutí podmínek až po vzájemné hodnocení.' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-200 to-amber-100">
      <Navbar />

      {/* Hero */}
      <section className="pt-32 pb-20 px-4">
        <div className="max-w-6xl mx-auto flex flex-col lg:flex-row items-center gap-12 lg:gap-20">

          {/* Left */}
          <div className="flex-1 max-w-xl">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 leading-tight mb-4">
              Největší <span className="text-green-700">zemědělský portál</span> s ověřenými zakázkami
            </h1>
            <p className="text-lg text-gray-600 mb-8 leading-relaxed">
              Propojujeme farmáře s dodavateli zemědělských služeb. Jednoduše, transparentně, s vzájemným hodnocením.
            </p>

            <div className="flex flex-wrap gap-3 mb-10">
              <button onClick={() => navigate(userData ? '/inzeraty' : '/login')}
                className="flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-xl font-medium shadow-sm hover:bg-green-700 transition text-sm">
                {userData ? 'Procházet zakázky' : 'Začít zdarma'} <ArrowRightIcon className="h-4 w-4" />
              </button>
              <button onClick={() => navigate(userData ? '/createinzerat' : '/login')}
                className="flex items-center gap-2 bg-white border border-gray-200 text-gray-700 px-6 py-3 rounded-xl font-medium shadow-sm hover:bg-gray-50 transition text-sm">
                Vytvořit zakázku
              </button>
            </div>

            {/* Stats */}
            {statCards.length > 0 && (
              <div className="grid grid-cols-3 gap-3">
                {statCards.map((card, i) => (
                  <div key={i} className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 text-center shadow-sm border border-gray-100">
                    <div className={`w-10 h-10 rounded-xl ${card.color} flex items-center justify-center mx-auto mb-2`}>
                      <card.icon className="h-5 w-5" />
                    </div>
                    <p className="text-2xl font-bold text-gray-800">{card.value?.toLocaleString('cs-CZ') ?? '—'}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{card.label}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right — testimonial */}
          <div className="flex-1 flex justify-center lg:justify-end max-w-sm">
            <div className="bg-white/70 backdrop-blur-md border border-green-200/50 rounded-3xl p-6 shadow-xl">
              <p className="italic text-gray-700 leading-relaxed mb-5">
                „Na AgroZakázkách jsem získal spoustu zakázek a výborná hodnocení. Doporučuji každému dodavateli."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-green-100 flex items-center justify-center text-green-700 font-bold">
                  PN
                </div>
                <div>
                  <p className="font-semibold text-gray-800 text-sm">Petr Novák</p>
                  <p className="text-xs text-gray-500">Majitel farmy, Olomouc</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="pb-20 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-800 text-center mb-10">Proč AgroZakázky?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {features.map((f, i) => (
              <div key={i} className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-sm border border-gray-100 text-center">
                <div className="w-12 h-12 rounded-xl bg-green-100 text-green-600 flex items-center justify-center mx-auto mb-4">
                  <f.icon className="h-6 w-6" />
                </div>
                <h3 className="font-semibold text-gray-800 mb-2">{f.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
