import React, { useContext, useState, useMemo } from 'react';
import Navbar from '../components/navbar';
import { AppContent } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Swal from 'sweetalert2';
import DOMPurify from 'dompurify';
import {
  TrashIcon, ArrowTopRightOnSquareIcon, TagIcon, MapPinIcon,
  CurrencyDollarIcon, EyeIcon, HeartIcon, UserGroupIcon, ClockIcon,
  ChartBarIcon, PlusCircleIcon
} from '@heroicons/react/24/solid';

const unitLabel = { ha: 'Kč/ha', h: 'Kč/h', t: 'Kč/t', kg: 'Kč/kg' };

const stavBadge = {
  'Veřejný': 'bg-green-100 text-green-700',
  'Rozpracovaný': 'bg-gray-100 text-gray-600',
  'Čeká na schválení': 'bg-yellow-100 text-yellow-700',
  'Domluveno': 'bg-blue-100 text-blue-700',
  'Probíhá': 'bg-cyan-100 text-cyan-700',
  'Čeká na potvrzení dokončení': 'bg-orange-100 text-orange-700',
  'Dokončeno': 'bg-emerald-100 text-emerald-700',
  'Sporný': 'bg-red-100 text-red-700',
};

const MojeNabidky = () => {
  const { userinzeratItemsData, isLoggedin, backendUrl, getUserInzeratsData } = useContext(AppContent);
  const navigate = useNavigate();
  const [sortOrder, setSortOrder] = useState('desc');

  const handleDelete = async (Id) => {
    axios.defaults.withCredentials = true;
    const result = await Swal.fire({
      title: 'Opravdu smazat?', text: 'Tuto akci nelze vrátit.', icon: 'warning',
      showCancelButton: true, confirmButtonColor: '#d33', cancelButtonColor: '#6b7280',
      confirmButtonText: 'Smazat', cancelButtonText: 'Zrušit',
    });
    if (!result.isConfirmed) return;
    try {
      const { data } = await axios.delete(`${backendUrl}/api/inzerat/deleteInzerat`, { data: { inzeratId: Id } });
      if (data.success) { Swal.fire('Smazáno!', '', 'success'); getUserInzeratsData(); }
      else Swal.fire('Chyba', data.message, 'error');
    } catch (error) { Swal.fire('Chyba', error.message, 'error'); }
  };

  const formatDate = (d) => d ? new Intl.DateTimeFormat('cs-CZ', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(d)) : '';

  const sortedItems = useMemo(() => {
    if (!Array.isArray(userinzeratItemsData)) return [];
    return [...userinzeratItemsData].sort((a, b) => {
      const diff = new Date(b.createdAt) - new Date(a.createdAt);
      return sortOrder === 'desc' ? diff : -diff;
    });
  }, [userinzeratItemsData, sortOrder]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-200 to-amber-100">
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 pt-28 pb-16">

        {/* Header */}
        <div className="flex items-center justify-between mb-8 flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Moje nabídky</h1>
            <p className="text-sm text-gray-500 mt-0.5">{sortedItems.length} zakázek</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              {['desc', 'asc'].map((order) => (
                <button key={order} onClick={() => setSortOrder(order)}
                  className={`px-3 py-1.5 text-sm font-medium transition ${sortOrder === order ? 'bg-green-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}>
                  {order === 'desc' ? 'Nejnovější' : 'Nejstarší'}
                </button>
              ))}
            </div>
            <button onClick={() => navigate('/createinzerat')}
              className="flex items-center gap-1.5 bg-green-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-green-700 shadow-sm transition">
              <PlusCircleIcon className="h-4 w-4" /> Nová
            </button>
          </div>
        </div>

        {/* Content */}
        {isLoggedin && Array.isArray(sortedItems) ? (
          sortedItems.length > 0 ? (
            <div className="space-y-4">
              {sortedItems.map((item) => {
                const favCount = item.favorites?.length || 0;
                const intCount = item.interestedUsers?.length || 0;
                const views = item.views || 0;
                const price = Number.isFinite(Number(item.cenaPerHa))
                  ? `${Number(item.cenaPerHa).toLocaleString('cs-CZ')} ${unitLabel[item.cenaType] || 'Kč'}` : '—';

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
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap ${stavBadge[item.stav] || 'bg-gray-100 text-gray-600'}`}>
                        {item.stav}
                      </span>
                    </div>

                    {/* Metrics */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-gray-50 mx-5 my-3 bg-gray-50 rounded-xl overflow-hidden">
                      <div className="p-3">
                        <p className="text-[10px] text-gray-400 uppercase tracking-wide flex items-center gap-1">
                          <CurrencyDollarIcon className="h-3 w-3" /> Cena</p>
                        <p className="text-sm font-semibold text-gray-800 mt-0.5">{price}</p>
                      </div>
                      <div className="p-3">
                        <p className="text-[10px] text-gray-400 uppercase tracking-wide flex items-center gap-1">
                          <MapPinIcon className="h-3 w-3" /> Lokalita</p>
                        <p className="text-sm font-semibold text-gray-800 mt-0.5 truncate">
                          {[item.mesto, item.kraj].filter(Boolean).join(', ') || '—'}
                        </p>
                      </div>
                      <div className="p-3">
                        <p className="text-[10px] text-gray-400 uppercase tracking-wide flex items-center gap-1">
                          <EyeIcon className="h-3 w-3" /> Zobrazení</p>
                        <p className="text-sm font-semibold text-gray-800 mt-0.5">{views}</p>
                      </div>
                      <div className="p-3">
                        <p className="text-[10px] text-gray-400 uppercase tracking-wide flex items-center gap-1">
                          <UserGroupIcon className="h-3 w-3" /> Zájemci</p>
                        <p className="text-sm font-semibold text-gray-800 mt-0.5">{intCount}</p>
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
                      <div className="flex gap-2">
                        <button onClick={() => window.open(`/inzerat/${item._id}`, '_blank')}
                          className="flex items-center gap-1.5 bg-green-600 text-white px-4 py-1.5 rounded-xl text-sm font-medium hover:bg-green-700 shadow-sm transition">
                          Otevřít <ArrowTopRightOnSquareIcon className="h-3.5 w-3.5" />
                        </button>
                        <button onClick={() => handleDelete(item._id)}
                          className="p-2 rounded-xl text-gray-300 hover:text-red-500 hover:bg-red-50 transition">
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-20">
              <ClipboardDocumentListIcon className="mx-auto h-10 w-10 text-gray-300 mb-3" />
              <p className="text-gray-500 font-medium">Nemáte žádné nabídky</p>
              <button onClick={() => navigate('/createinzerat')}
                className="mt-3 text-sm text-green-600 hover:underline">Vytvořit první zakázku</button>
            </div>
          )
        ) : (
          <div className="flex items-center justify-center min-h-[40vh]">
            <div className="w-10 h-10 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>
    </div>
  );
};

// Need this for empty state icon
import { ClipboardDocumentListIcon } from '@heroicons/react/24/outline';

export default MojeNabidky;
