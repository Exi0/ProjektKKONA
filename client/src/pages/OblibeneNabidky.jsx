import React, { useContext, useEffect, useState } from 'react';
import Navbar from '../components/navbar';
import { AppContent } from '../context/AppContext';
import axios from 'axios';
import { toast } from 'react-toastify';
import DOMPurify from 'dompurify';
import {
  HeartIcon, ArrowTopRightOnSquareIcon, TagIcon, MapPinIcon,
  CurrencyDollarIcon, ClockIcon, ChartBarIcon
} from '@heroicons/react/24/solid';
import { HeartIcon as HeartOutline } from '@heroicons/react/24/outline';

const unitLabel = { ha: 'Kč/ha', h: 'Kč/h', t: 'Kč/t', kg: 'Kč/kg' };

const OblibeneNabidky = () => {
  const { backendUrl, userData, isLoggedin } = useContext(AppContent);
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortOrder, setSortOrder] = useState('desc');

  useEffect(() => {
    if (!userData?.id) return;
    (async () => {
      try {
        const { data } = await axios.get(`${backendUrl}/api/inzerat/getUserFavoriteInzerats`, {
          params: { userId: userData.id }, withCredentials: true,
        });
        if (data.success) {
          setFavorites((data.inzeratData || []).map((x) => ({
            ...x, favorites: Array.isArray(x.favorites) ? x.favorites : [],
          })));
        } else { setFavorites([]); }
      } catch { toast.error('Nepodařilo se načíst oblíbené.'); }
      finally { setLoading(false); }
    })();
  }, [backendUrl, userData?.id]);

  const sorted = [...favorites].sort((a, b) => {
    const diff = new Date(b.createdAt) - new Date(a.createdAt);
    return sortOrder === 'desc' ? diff : -diff;
  });

  const unFavorite = async (inzeratId) => {
    try {
      const { data } = await axios.post(`${backendUrl}/api/inzerat/removeFromFavoriteInzerat`,
        { userId: userData.id, inzeratId }, { withCredentials: true });
      if (data.success) {
        toast.success('Odebráno z oblíbených');
        setFavorites((prev) => prev.filter((i) => i._id !== inzeratId));
      } else toast.error(data.message);
    } catch { toast.error('Chyba při odebírání.'); }
  };

  const formatDate = (d) => d ? new Intl.DateTimeFormat('cs-CZ', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(d)) : '';

  if (!isLoggedin) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-200 to-amber-100">
        <Navbar />
        <div className="flex items-center justify-center min-h-[70vh]">
          <p className="text-lg text-gray-600">Přihlaste se pro zobrazení oblíbených.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-200 to-amber-100">
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 pt-28 pb-16">

        {/* Header */}
        <div className="flex items-center justify-between mb-8 flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <HeartIcon className="h-6 w-6 text-red-500" /> Oblíbené nabídky
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">{sorted.length} oblíbených</p>
          </div>
          <div className="flex bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            {['desc', 'asc'].map((order) => (
              <button key={order} onClick={() => setSortOrder(order)}
                className={`px-3 py-1.5 text-sm font-medium transition ${sortOrder === order ? 'bg-green-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}>
                {order === 'desc' ? 'Nejnovější' : 'Nejstarší'}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center min-h-[40vh]">
            <div className="w-10 h-10 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : sorted.length === 0 ? (
          <div className="text-center py-20">
            <HeartOutline className="mx-auto h-10 w-10 text-gray-300 mb-3" />
            <p className="text-gray-500 font-medium">Nemáte žádné oblíbené zakázky</p>
            <p className="text-sm text-gray-400 mt-1">Klikněte na srdíčko u zakázky pro přidání do oblíbených.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {sorted.map((item) => {
              const favCount = item.favorites?.length || 0;
              const price = Number.isFinite(Number(item.cenaPerHa))
                ? `${Number(item.cenaPerHa).toLocaleString('cs-CZ')} ${unitLabel[item.cenaType] || 'Kč'}` : '—';
              const qty = Number.isFinite(Number(item.ha)) && Number(item.ha) > 0 ? item.ha : null;
              const totalPrice = qty && item.cenaPerHa
                ? (Number(item.cenaPerHa) * Number(qty)).toLocaleString('cs-CZ') : null;

              return (
                <div key={item._id}
                  className="bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md hover:border-green-200 transition-all overflow-hidden">

                  {/* Top */}
                  <div className="flex items-start justify-between p-5 pb-0 gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 text-xs text-gray-400 uppercase tracking-wider mb-1">
                        <TagIcon className="h-3.5 w-3.5" />
                        <span className="truncate">{item.kategorie} · {item.ukon || '—'}</span>
                      </div>
                      <h2 className="text-lg font-bold text-gray-800 leading-snug">{item.nadpis}</h2>
                    </div>
                    <button onClick={() => unFavorite(item._id)}
                      className="p-2 rounded-xl bg-red-50 text-red-500 hover:bg-red-100 transition" title="Odebrat z oblíbených">
                      <HeartIcon className="h-5 w-5" />
                    </button>
                  </div>

                  {/* Metrics */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-gray-50 mx-5 my-3 bg-gray-50 rounded-xl overflow-hidden">
                    <div className="p-3">
                      <p className="text-[10px] text-gray-400 uppercase tracking-wide flex items-center gap-1">
                        <CurrencyDollarIcon className="h-3 w-3" /> Cena</p>
                      <p className="text-sm font-semibold text-gray-800 mt-0.5">{price}</p>
                    </div>
                    {qty && (
                      <div className="p-3">
                        <p className="text-[10px] text-gray-400 uppercase tracking-wide flex items-center gap-1">
                          <ChartBarIcon className="h-3 w-3" /> Množství</p>
                        <p className="text-sm font-semibold text-gray-800 mt-0.5">{qty}</p>
                      </div>
                    )}
                    {totalPrice && (
                      <div className="p-3">
                        <p className="text-[10px] text-gray-400 uppercase tracking-wide">Celkem</p>
                        <p className="text-sm font-semibold text-green-700 mt-0.5">{totalPrice} Kč</p>
                      </div>
                    )}
                    <div className="p-3">
                      <p className="text-[10px] text-gray-400 uppercase tracking-wide flex items-center gap-1">
                        <MapPinIcon className="h-3 w-3" /> Lokalita</p>
                      <p className="text-sm font-semibold text-gray-800 mt-0.5 truncate">
                        {[item.mesto, item.kraj].filter(Boolean).join(', ') || '—'}
                      </p>
                    </div>
                  </div>

                  {/* Desc */}
                  {item.popis && (
                    <div className="px-5 pb-2">
                      <div className="text-sm text-gray-600 line-clamp-2"
                        dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(item.popis) }} />
                    </div>
                  )}

                  {/* Footer */}
                  <div className="flex items-center justify-between px-5 py-3 border-t border-gray-50">
                    <div className="flex items-center gap-4 text-xs text-gray-400">
                      <span className="flex items-center gap-1"><ClockIcon className="h-3.5 w-3.5" /> {formatDate(item.createdAt)}</span>
                      <span className="flex items-center gap-1"><HeartIcon className="h-3.5 w-3.5" /> {favCount}</span>
                    </div>
                    <button onClick={() => window.open(`/inzerat/${item._id}`, '_blank')}
                      className="flex items-center gap-1.5 bg-green-600 text-white px-4 py-1.5 rounded-xl text-sm font-medium hover:bg-green-700 shadow-sm transition">
                      Otevřít <ArrowTopRightOnSquareIcon className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default OblibeneNabidky;
