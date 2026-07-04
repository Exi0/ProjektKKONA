import React, { useContext, useEffect, useRef, useState } from 'react';
import Navbar from '../components/navbar';
import { AppContent } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Slider } from '@mui/material';
import { toast } from 'react-toastify';
import {
  ArrowRightIcon, FunnelIcon, XMarkIcon, ArrowPathIcon,
  MagnifyingGlassIcon, MapPinIcon, TagIcon, CurrencyDollarIcon,
  ChartBarIcon, EyeIcon, ClockIcon, StarIcon
} from '@heroicons/react/24/solid';
import { HeartIcon as HeartOutline } from '@heroicons/react/24/outline';
import { HeartIcon } from '@heroicons/react/24/solid';
import axios from 'axios';
import DOMPurify from 'dompurify';
import { kategorieToUkon, kategorieOptions, vsechnyKraje } from '../constants/categories';
import { SaveSearchButton } from '../components/SavedSearches';

const PAGE_SIZE = 10;
const unitLabel = { ha: 'Kč/ha', h: 'Kč/h', t: 'Kč/t', kg: 'Kč/kg' };
const quantityLabelByUnit = { ha: 'ha', h: 'hodin', t: 't', kg: 'kg' };

const filterInput = "w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-700 focus:ring-2 focus:ring-green-500 focus:outline-none transition";

function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

// ── Sidebar ──
const SidebarContent = React.memo(({
  searchQuery, setSearchQuery,
  selectedKraj, setSelectedKraj,
  selectedKategorie, setSelectedKategorie,
  selectedUkon, setSelectedUkon,
  ukonyForSelected,
  pendingPriceRange, setPendingPriceRange,
  priceLimits, setPriceRange,
  minRating, setMinRating,
  resetFilters
}) => (
  <div className="p-5 space-y-5 h-full overflow-y-auto">
    <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide flex items-center gap-2">
      <FunnelIcon className="h-4 w-4 text-green-600" /> Filtry
    </h2>

    {/* Hledání */}
    <div className="relative">
      <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
      <input
        type="text" placeholder="Hledat název, popis, úkon…"
        value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
        className={`${filterInput} pl-9`}
      />
    </div>

    {/* Kraj */}
    <div>
      <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">Kraj</label>
      <select value={selectedKraj} onChange={(e) => setSelectedKraj(e.target.value)} className={filterInput}>
        <option value="">Všechny kraje</option>
        {vsechnyKraje.map((k) => <option key={k} value={k}>{k}</option>)}
      </select>
    </div>

    {/* Kategorie */}
    <div>
      <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">Kategorie</label>
      <select value={selectedKategorie} onChange={(e) => setSelectedKategorie(e.target.value)} className={filterInput}>
        <option value="">Všechny kategorie</option>
        {kategorieOptions.map((k) => <option key={k} value={k}>{k}</option>)}
      </select>
    </div>

    {/* Úkon */}
    <div>
      <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">Úkon</label>
      <select value={selectedUkon} onChange={(e) => setSelectedUkon(e.target.value)}
        disabled={!selectedKategorie}
        className={`${filterInput} ${!selectedKategorie ? 'bg-gray-50 cursor-not-allowed' : ''}`}>
        {!selectedKategorie
          ? <option value="">Nejprve vyberte kategorii</option>
          : <><option value="">Všechny úkony</option>{ukonyForSelected.map((u) => <option key={u} value={u}>{u}</option>)}</>}
      </select>
    </div>

    {/* Cena */}
    <div>
      <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">Rozmezí ceny</label>
      <div className="flex items-center gap-2 mb-2">
        <input type="number" value={pendingPriceRange[0]}
          onChange={(e) => {
            const val = Math.max(priceLimits[0], Math.min(Number(e.target.value), pendingPriceRange[1]));
            setPendingPriceRange([val, pendingPriceRange[1]]);
          }}
          onBlur={() => setPriceRange(pendingPriceRange)}
          className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm text-center focus:ring-2 focus:ring-green-500 focus:outline-none" />
        <span className="text-gray-400 text-sm">—</span>
        <input type="number" value={pendingPriceRange[1]}
          onChange={(e) => {
            const val = Math.min(priceLimits[1], Math.max(Number(e.target.value), pendingPriceRange[0]));
            setPendingPriceRange([pendingPriceRange[0], val]);
          }}
          onBlur={() => setPriceRange(pendingPriceRange)}
          className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm text-center focus:ring-2 focus:ring-green-500 focus:outline-none" />
      </div>
      <Slider value={pendingPriceRange}
        onChange={(e, v) => setPendingPriceRange(v)}
        onChangeCommitted={(e, v) => setPriceRange(v)}
        valueLabelDisplay="auto" min={priceLimits[0]} max={priceLimits[1]} step={100}
        sx={{ color: '#16a34a', '& .MuiSlider-thumb': { width: 16, height: 16 } }} />
    </div>

    {/* Rating */}
    <div>
      <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">Minimální hodnocení</label>
      <Slider value={minRating} onChange={(e, v) => setMinRating(v)}
        step={0.5} min={0} max={5}
        marks={[{ value: 0, label: '0' }, { value: 5, label: '5' }]}
        valueLabelDisplay="auto"
        sx={{ color: '#f59e0b', '& .MuiSlider-markLabel': { fontSize: '0.75rem' } }} />
    </div>

    <button onClick={resetFilters}
      className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-xl bg-gray-100 text-gray-700 hover:bg-gray-200 transition text-sm font-medium">
      <ArrowPathIcon className="h-4 w-4" /> Resetovat filtry
    </button>
  </div>
));

const Inzeraty = () => {
  const { isLoggedin, userData } = useContext(AppContent);
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedKraj, setSelectedKraj] = useState('');
  const [selectedKategorie, setSelectedKategorie] = useState('');
  const [selectedUkon, setSelectedUkon] = useState('');
  const [priceRange, setPriceRange] = useState([0, 10000]);
  const [priceLimits, setPriceLimits] = useState([0, 10000]);
  const [pendingPriceRange, setPendingPriceRange] = useState([0, 10000]);
  const [minRating, setMinRating] = useState(0);
  const [sortOption, setSortOption] = useState('nejnovejsi');
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const priceInitialized = useRef(false);
  const debouncedSearch = useDebounce(searchQuery, 400);
  const debouncedMinRating = useDebounce(minRating, 400);
  const backendUrl = import.meta.env.VITE_BACKEND_URL;

  useEffect(() => { setSelectedUkon(''); }, [selectedKategorie]);
  const ukonyForSelected = selectedKategorie ? (kategorieToUkon[selectedKategorie] || []) : [];

  const decorate = (arr = []) => arr.map((item) => ({
    ...item,
    isFavorited: Array.isArray(item.favorites) ? item.favorites.includes(userData?.id) : false,
  }));

  const buildParams = (pageToLoad) => {
    const params = { page: pageToLoad, limit: PAGE_SIZE, sort: sortOption };
    if (debouncedSearch.trim()) params.search = debouncedSearch.trim();
    if (selectedKraj) params.kraj = selectedKraj;
    if (selectedKategorie) params.kategorie = selectedKategorie;
    if (selectedUkon) params.ukon = selectedUkon;
    if (debouncedMinRating > 0) params.minRating = debouncedMinRating;
    if (priceInitialized.current && (priceRange[0] > priceLimits[0] || priceRange[1] < priceLimits[1])) {
      params.minCena = priceRange[0]; params.maxCena = priceRange[1];
    }
    return params;
  };

  const filtersKey = JSON.stringify(buildParams(1));

  useEffect(() => {
    if (!isLoggedin) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const { data } = await axios.get(`${backendUrl}/api/inzerat/getInzeraty`, { params: buildParams(1), withCredentials: true });
        if (cancelled) return;
        if (data.success) {
          setItems(decorate(data.inzeratData || []));
          setPage(1);
          setTotal(data.pagination?.total ?? (data.inzeratData || []).length);
          setTotalPages(data.pagination?.totalPages ?? 1);
          if (!priceInitialized.current && data.priceLimits && data.priceLimits.max > 0) {
            const lims = [Math.floor(data.priceLimits.min), Math.ceil(data.priceLimits.max)];
            setPriceLimits(lims); setPriceRange(lims); setPendingPriceRange(lims);
            priceInitialized.current = true;
          }
        } else { setItems([]); setTotal(0); setTotalPages(1); }
      } catch { if (!cancelled) toast.error('Chyba při načítání inzerátů'); }
      finally { if (!cancelled) setLoading(false); }
    })();
    return () => { cancelled = true; };
  }, [isLoggedin, filtersKey, userData?.id]);

  const loadMore = async () => {
    if (isFetchingMore || loading || page >= totalPages) return;
    setIsFetchingMore(true);
    try {
      const next = page + 1;
      const { data } = await axios.get(`${backendUrl}/api/inzerat/getInzeraty`, { params: buildParams(next), withCredentials: true });
      if (data.success) { setItems((prev) => [...prev, ...decorate(data.inzeratData || [])]); setPage(next); }
    } catch { toast.error('Chyba při načítání dalších inzerátů'); }
    finally { setIsFetchingMore(false); }
  };

  useEffect(() => {
    const sentinel = document.querySelector('#scroll-sentinel');
    if (!sentinel) return;
    const observer = new IntersectionObserver((entries) => { if (entries[0].isIntersecting) loadMore(); }, { threshold: 0.5 });
    observer.observe(sentinel);
    return () => observer.unobserve(sentinel);
  }, [page, totalPages, loading, isFetchingMore, filtersKey]);

  const formatDate = (d) => new Intl.DateTimeFormat('cs-CZ', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(d));

  const toggleFavorite = async (inzeratId) => {
    const item = items.find((i) => i._id === inzeratId);
    if (!item) return;
    try {
      const endpoint = item.isFavorited ? `${backendUrl}/api/inzerat/removeFromFavoriteInzerat` : `${backendUrl}/api/inzerat/addToFavoriteInzerat`;
      const { data } = await axios.post(endpoint, { userId: userData.id, inzeratId }, { withCredentials: true });
      if (data.success) {
        toast.success(data.message);
        setItems((prev) => prev.map((i) => i._id === inzeratId ? {
          ...i, isFavorited: !i.isFavorited,
          favorites: i.isFavorited ? (i.favorites || []).filter((id) => id !== userData.id) : [...(i.favorites || []), userData.id],
        } : i));
      } else toast.error(data.message);
    } catch { toast.error('Chyba při změně oblíbených'); }
  };

  const resetFilters = () => {
    setSearchQuery(''); setSelectedKraj(''); setSelectedKategorie(''); setSelectedUkon('');
    setPriceRange(priceLimits); setPendingPriceRange(priceLimits); setMinRating(0); setSortOption('nejnovejsi');
  };

  const sidebarProps = {
    searchQuery, setSearchQuery, selectedKraj, setSelectedKraj,
    selectedKategorie, setSelectedKategorie, selectedUkon, setSelectedUkon,
    ukonyForSelected, pendingPriceRange, setPendingPriceRange,
    priceLimits, setPriceRange, minRating, setMinRating, resetFilters,
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-200 to-amber-100">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 pt-28 pb-16 flex flex-col lg:flex-row gap-6">

        {/* Mobile toggle */}
        <button onClick={() => setIsDrawerOpen(true)}
          className="lg:hidden flex items-center gap-2 bg-green-600 text-white px-4 py-2.5 rounded-xl shadow-sm text-sm font-medium">
          <FunnelIcon className="h-4 w-4" /> Filtry
        </button>

        {/* Desktop sidebar */}
        <motion.aside
          className="hidden lg:block lg:w-72 flex-shrink-0 sticky top-28 h-[calc(100vh-8rem)] bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
          initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <SidebarContent {...sidebarProps} />
        </motion.aside>

        {/* Mobile drawer */}
        {isDrawerOpen && (
          <motion.div initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }} className="fixed inset-0 z-50 flex">
            <div className="w-80 bg-white shadow-2xl h-full relative">
              <button onClick={() => setIsDrawerOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-700">
                <XMarkIcon className="h-5 w-5" />
              </button>
              <SidebarContent {...sidebarProps} />
            </div>
            <div className="flex-1 bg-black/50" onClick={() => setIsDrawerOpen(false)} />
          </motion.div>
        )}

        {/* Main content */}
        <motion.main className="flex-1 min-w-0"
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>

          {/* Header */}
          <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Všechny zakázky</h1>
              <p className="text-sm text-gray-500 mt-0.5">
                {loading ? 'Načítám…' : `Nalezeno ${total} zakázek`}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <SaveSearchButton filters={{
                kategorie: selectedKategorie, ukon: selectedUkon, kraj: selectedKraj,
                search: debouncedSearch,
                minCena: priceRange[0] > priceLimits[0] ? priceRange[0] : null,
                maxCena: priceRange[1] < priceLimits[1] ? priceRange[1] : null,
              }} />
              <select value={sortOption} onChange={(e) => setSortOption(e.target.value)}
                className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:outline-none">
                <option value="nejnovejsi">Nejnovější</option>
                <option value="nejstarsi">Nejstarší</option>
                <option value="cenaAsc">Cena ↑</option>
                <option value="cenaDesc">Cena ↓</option>
                <option value="views">Zobrazení</option>
                <option value="zajem">Zájemci</option>
                <option value="hodnoceni">Hodnocení</option>
              </select>
            </div>
          </div>

          {/* Listings */}
          {isLoggedin ? (
            loading && items.length === 0 ? (
              <div className="flex items-center justify-center min-h-[40vh]">
                <div className="w-10 h-10 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : items.length > 0 ? (
              <>
                <div className="space-y-4">
                  {items.map((item) => {
                    const favCount = Array.isArray(item.favorites) ? item.favorites.length : 0;
                    const price = Number.isFinite(Number(item.cenaPerHa))
                      ? `${Number(item.cenaPerHa).toLocaleString('cs-CZ')} ${unitLabel[item.cenaType] || 'Kč'}`
                      : 'Neuvedeno';
                    const qty = Number.isFinite(Number(item.ha)) && Number(item.ha) > 0 ? item.ha : null;
                    const totalPrice = qty && item.cenaPerHa
                      ? (Number(item.cenaPerHa) * Number(qty)).toLocaleString('cs-CZ')
                      : null;

                    return (
                      <div key={item._id}
                        className="bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md hover:border-green-200 transition-all duration-200 overflow-hidden">

                        {/* Hlavička */}
                        <div className="flex items-start justify-between p-5 pb-0 gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 text-xs text-gray-400 uppercase tracking-wider mb-1">
                              <TagIcon className="h-3.5 w-3.5" />
                              <span className="truncate">{item.kategorie} · {item.ukon}</span>
                            </div>
                            <h2 className="text-lg font-bold text-gray-800 leading-snug">{item.nadpis}</h2>
                          </div>
                          <div className="flex gap-2 flex-shrink-0">
                            <button onClick={() => toggleFavorite(item._id)}
                              className={`p-2 rounded-xl transition ${item.isFavorited ? 'bg-red-50 text-red-500 hover:bg-red-100' : 'bg-gray-50 text-gray-400 hover:bg-gray-100'}`}>
                              {item.isFavorited ? <HeartIcon className="h-5 w-5" /> : <HeartOutline className="h-5 w-5" />}
                            </button>
                          </div>
                        </div>

                        {/* Metriky */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-gray-50 mx-5 my-3 bg-gray-50 rounded-xl overflow-hidden">
                          <div className="p-3">
                            <p className="text-[10px] text-gray-400 uppercase tracking-wide flex items-center gap-1">
                              <CurrencyDollarIcon className="h-3 w-3" /> Cena
                            </p>
                            <p className="text-sm font-semibold text-gray-800 mt-0.5">{price}</p>
                          </div>
                          {qty && (
                            <div className="p-3">
                              <p className="text-[10px] text-gray-400 uppercase tracking-wide flex items-center gap-1">
                                <ChartBarIcon className="h-3 w-3" /> Množství
                              </p>
                              <p className="text-sm font-semibold text-gray-800 mt-0.5">{qty} {quantityLabelByUnit[item.cenaType] || ''}</p>
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
                              <MapPinIcon className="h-3 w-3" /> Kraj
                            </p>
                            <p className="text-sm font-semibold text-gray-800 mt-0.5 truncate">{item.kraj || '—'}</p>
                          </div>
                        </div>

                        {/* Popis (zkrácený) */}
                        <div className="px-5 pb-2">
                          <div className="text-sm text-gray-600 line-clamp-2"
                            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(item.popis || '') }} />
                        </div>

                        {/* Footer */}
                        <div className="flex items-center justify-between px-5 py-3 border-t border-gray-50">
                          <div className="flex items-center gap-4 text-xs text-gray-400">
                            <span className="flex items-center gap-1"><ClockIcon className="h-3.5 w-3.5" /> {formatDate(item.createdAt)}</span>
                            <span className="flex items-center gap-1"><EyeIcon className="h-3.5 w-3.5" /> {item.views || 0}</span>
                            <span className="flex items-center gap-1"><HeartIcon className="h-3.5 w-3.5" /> {favCount}</span>
                            {item.interestedUsers?.length > 0 && (
                              <span className="flex items-center gap-1"><StarIcon className="h-3.5 w-3.5" /> {item.interestedUsers.length} zájemců</span>
                            )}
                          </div>
                          <button onClick={() => window.open(`/inzerat/${item._id}`, '_blank')}
                            className="flex items-center gap-1.5 bg-green-600 text-white px-4 py-1.5 rounded-xl text-sm font-medium hover:bg-green-700 shadow-sm transition">
                            Otevřít <ArrowRightIcon className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div id="scroll-sentinel" className="h-10 flex justify-center items-center mt-6">
                  {isFetchingMore && <div className="w-8 h-8 border-3 border-green-500 border-t-transparent rounded-full animate-spin" />}
                  {!isFetchingMore && page >= totalPages && items.length > 0 && (
                    <p className="text-sm text-gray-400">Zobrazeno všech {total} zakázek</p>
                  )}
                </div>
              </>
            ) : (
              <div className="text-center py-16">
                <MagnifyingGlassIcon className="mx-auto h-10 w-10 text-gray-300 mb-3" />
                <p className="text-gray-500 font-medium">Žádné výsledky podle zvolených filtrů</p>
                <button onClick={resetFilters} className="mt-3 text-sm text-green-600 hover:underline">Resetovat filtry</button>
              </div>
            )
          ) : (
            <div className="flex justify-center items-center min-h-[50vh]">
              <p className="text-lg text-gray-600">Přihlaste se pro zobrazení inzerátů.</p>
            </div>
          )}
        </motion.main>
      </div>
    </div>
  );
};

export default Inzeraty;
