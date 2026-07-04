import React, { useContext, useEffect, useMemo, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import Navbar from '../components/navbar';
import { AppContent } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FunnelIcon, XMarkIcon, MapPinIcon } from '@heroicons/react/24/solid';
import axios from 'axios';
import { kategorieToUkon, kategorieOptions } from '../constants/categories';
// ── Leaflet icon fix (webpack/vite strips default icon paths) ──────────
// Zelená ikona odpovídající tématu AgroZakázky
const greenIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const userIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// ── Cenové jednotky ────────────────────────────────────────────────────
const unitLabel = { ha: 'Kč/ha', h: 'Kč/h', t: 'Kč/t', kg: 'Kč/kg' };

// ── Helper: přelétni mapu na bod ───────────────────────────────────────
const FlyTo = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    if (center) map.flyTo(center, zoom || 13, { duration: 1.2 });
  }, [center, zoom]);
  return null;
};

export const krajByCountry = {
  'Česko': [
    'Praha', 'Středočeský kraj', 'Jihočeský kraj', 'Plzeňský kraj',
    'Karlovarský kraj', 'Ústecký kraj', 'Liberecký kraj', 'Královéhradecký kraj',
    'Pardubický kraj', 'Vysočina', 'Jihomoravský kraj', 'Olomoucký kraj',
    'Moravskoslezský kraj', 'Zlínský kraj',
  ],
  'Slovensko': [
    'Bratislavský kraj', 'Trnavský kraj', 'Trenčiansky kraj', 'Nitriansky kraj',
    'Žilinský kraj', 'Banskobystrický kraj', 'Prešovský kraj', 'Košický kraj',
  ],
};

export const vsechnyKraje = Object.values(krajByCountry).flat();

// ── Česko střed ────────────────────────────────────────────────────────
const CZ_CENTER = [49.8, 15.5];
const CZ_ZOOM = 7;

const MapView = () => {
  const { isLoggedin } = useContext(AppContent);
  const navigate = useNavigate();
  const backendUrl = import.meta.env.VITE_BACKEND_URL;

  // filtry
  const [selectedStat, setSelectedStat] = useState('');
  const [selectedKraj, setSelectedKraj] = useState('');
  const [selectedKategorie, setSelectedKategorie] = useState('');
  const [selectedUkon, setSelectedUkon] = useState('');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // data
  const [markers, setMarkers] = useState([]);
  const [loading, setLoading] = useState(false);

  // geolokace uživatele
  const [userPos, setUserPos] = useState(null);
  const [flyTarget, setFlyTarget] = useState(null);

  // reset úkon při změně kategorie
  useEffect(() => { setSelectedUkon(''); }, [selectedKategorie]);
  // reset kraj při změně státu
  useEffect(() => { setSelectedKraj(''); }, [selectedStat]);
  const ukonyForSelected = selectedKategorie ? (kategorieToUkon[selectedKategorie] || []) : [];
  const kategorieList = useMemo(() => Object.keys(kategorieToUkon), []);

  // ── Fetch markers ze serveru ─────────────────────────────────────────
  useEffect(() => {
    if (!isLoggedin) return;
    let cancelled = false;

    (async () => {
      setLoading(true);
      try {
        const params = {};
        if (selectedKraj) params.kraj = selectedKraj;
        if (selectedKategorie) params.kategorie = selectedKategorie;
        if (selectedUkon) params.ukon = selectedUkon;

        const { data } = await axios.get(`${backendUrl}/api/inzerat/getMapInzerats`, {
          params,
          withCredentials: true,
        });

        if (!cancelled && data.success) {
          // filtruj jen ty, co mají validní souřadnice
          setMarkers(
            (data.markers || []).filter(
              (m) =>
                m.location?.coordinates?.length === 2 &&
                typeof m.location.coordinates[0] === 'number' &&
                typeof m.location.coordinates[1] === 'number'
            )
          );
        }
      } catch (err) {
        if (!cancelled) toast.error('Nepodařilo se načíst data pro mapu');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [isLoggedin, selectedKraj, selectedKategorie, selectedUkon]);

  // ── Geolokace ────────────────────────────────────────────────────────
  const locateMe = () => {
    if (!navigator.geolocation) {
      toast.error('Geolokace není v tomto prohlížeči podporována');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = [pos.coords.latitude, pos.coords.longitude];
        setUserPos(coords);
        setFlyTarget(coords);
      },
      () => toast.error('Nepodařilo se zjistit vaši polohu'),
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  // ── Formátování data ─────────────────────────────────────────────────
  const formatDate = (d) =>
    new Intl.DateTimeFormat('cs-CZ', { year: 'numeric', month: 'short', day: 'numeric' }).format(new Date(d));

  // ── Sidebar filtry (sdílené pro desktop i mobilní drawer) ────────────
  const FilterPanel = () => {
  const filteredKraje = selectedStat ? (krajByCountry[selectedStat] || []) : vsechnyKraje;

  return (
    <div className="p-4 space-y-4 h-full overflow-y-auto">
      <h2 className="text-xl font-semibold text-gray-800">Filtry mapy</h2>

      <div>
        <label className="block text-sm text-gray-600 mb-1">Stát</label>
        <select
          value={selectedStat}
          onChange={(e) => setSelectedStat(e.target.value)}
          className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
        >
          <option value="">Všechny státy</option>
          <option value="Česko">Česko</option>
          <option value="Slovensko">Slovensko</option>
        </select>
      </div>

      <div>
        <label className="block text-sm text-gray-600 mb-1">Kraj</label>
        <select
          value={selectedKraj}
          onChange={(e) => setSelectedKraj(e.target.value)}
          className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
        >
          <option value="">Všechny kraje</option>
          {filteredKraje.map((k) => <option key={k} value={k}>{k}</option>)}
        </select>
      </div>

      <div>
        <label className="block text-sm text-gray-600 mb-1">Kategorie</label>
        <select
          value={selectedKategorie}
          onChange={(e) => setSelectedKategorie(e.target.value)}
          className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
        >
          <option value="">Všechny kategorie</option>
          {kategorieList.map((k) => <option key={k} value={k}>{k}</option>)}
        </select>
      </div>

      <div>
        <label className="block text-sm text-gray-600 mb-1">Úkon</label>
        <select
          value={selectedUkon}
          onChange={(e) => setSelectedUkon(e.target.value)}
          disabled={!selectedKategorie}
          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 ${
            !selectedKategorie ? 'bg-gray-100 cursor-not-allowed' : ''
          }`}
        >
          {!selectedKategorie ? (
            <option value="">Nejprve vyberte kategorii</option>
          ) : (
            <>
              <option value="">Všechny úkony</option>
              {ukonyForSelected.map((u) => <option key={u} value={u}>{u}</option>)}
            </>
          )}
        </select>
      </div>

      <button
        onClick={() => { setSelectedStat(''); setSelectedKraj(''); setSelectedKategorie(''); setSelectedUkon(''); }}
        className="w-full flex items-center justify-center gap-2 bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-lg transition"
      >
        Resetovat filtry
      </button>

      <div className="pt-2 border-t">
        <p className="text-sm text-gray-500">
          {loading ? 'Načítám…' : `${markers.length} zakázek na mapě`}
        </p>
      </div>
    </div>
  );
};

  // ── Render ───────────────────────────────────────────────────────────
  if (!isLoggedin) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-200 to-amber-100">
        <Navbar />
        <div className="flex justify-center items-center min-h-[80vh]">
          <p className="text-lg text-gray-600">Přihlaste se pro zobrazení mapy.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-200 to-amber-100">
      <Navbar />

      <div className="pt-20 flex flex-col lg:flex-row" style={{ height: 'calc(100vh - 0px)' }}>
        {/* ── Mobilní tlačítko filtrů ─────────────────────────────────── */}
        <button
          onClick={() => setIsDrawerOpen(true)}
          className="lg:hidden fixed bottom-4 left-4 z-[1000] flex items-center gap-2 bg-green-700 text-white px-4 py-3 rounded-full shadow-lg"
        >
          <FunnelIcon className="h-5 w-5" />
          Filtry
        </button>

        {/* ── Geolokace tlačítko ─────────────────────────────────────── */}
        <button
          onClick={locateMe}
          className="fixed bottom-4 right-4 z-[1000] flex items-center gap-2 bg-white text-green-700 border-2 border-green-700 px-4 py-3 rounded-full shadow-lg hover:bg-green-50 transition"
        >
          <MapPinIcon className="h-5 w-5" />
          <span className="hidden sm:inline">Moje poloha</span>
        </button>

        {/* ── Desktop sidebar ────────────────────────────────────────── */}
        <aside className="hidden lg:block w-80 bg-white shadow-lg flex-shrink-0 overflow-y-auto">
          <FilterPanel />
        </aside>

        {/* ── Mobilní drawer ─────────────────────────────────────────── */}
        {isDrawerOpen && (
          <div className="fixed inset-0 z-[1100] flex lg:hidden">
            <div className="w-3/4 max-w-sm bg-white shadow-lg h-full relative">
              <button
                onClick={() => setIsDrawerOpen(false)}
                className="absolute top-2 right-2 text-gray-600 hover:text-gray-800 z-10"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
              <FilterPanel />
            </div>
            <div className="flex-1 bg-black/50" onClick={() => setIsDrawerOpen(false)} />
          </div>
        )}

        {/* ── Mapa ───────────────────────────────────────────────────── */}
        <div className="flex-1 relative">
          <MapContainer
            center={CZ_CENTER}
            zoom={CZ_ZOOM}
            className="w-full h-full"
            style={{ minHeight: '400px' }}
            scrollWheelZoom={true}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {flyTarget && <FlyTo center={flyTarget} zoom={13} />}

            {/* Uživatelova pozice */}
            {userPos && (
              <Marker position={userPos} icon={userIcon}>
                <Popup>
                  <p className="font-semibold text-blue-700">Vaše poloha</p>
                </Popup>
              </Marker>
            )}

            {/* Inzerátové piny */}
            {markers.map((item) => {
              // Leaflet chce [lat, lng], MongoDB má [lng, lat]
              const pos = [item.location.coordinates[1], item.location.coordinates[0]];
              const price = Number.isFinite(Number(item.cenaPerHa))
                ? `${item.cenaPerHa} ${unitLabel[item.cenaType] || unitLabel.ha}`
                : '—';

              return (
                <Marker key={item._id} position={pos} icon={greenIcon}>
                  <Popup maxWidth={280} minWidth={200}>
                    <div className="space-y-1">
                      <p className="font-bold text-base text-green-800 leading-tight">
                        {item.nadpis}
                      </p>
                      <p className="text-xs text-gray-500">{item.kategorie} · {item.ukon}</p>
                      <div className="text-sm text-gray-700 space-y-0.5">
                        <p><span className="font-medium">Kraj:</span> {item.kraj}</p>
                        <p><span className="font-medium">Město:</span> {item.mesto}</p>
                        <p><span className="font-medium">Cena:</span> {price}</p>
                        {Number(item.ha) > 0 && (
                          <p><span className="font-medium">Rozsah:</span> {item.ha} {item.cenaType || 'ha'}</p>
                        )}
                      </div>
                      <p className="text-[11px] text-gray-400">{formatDate(item.createdAt)}</p>
                      <button
                        onClick={() => window.open(`/inzerat/${item._id}`, '_blank')}
                        className="mt-1 w-full bg-green-600 hover:bg-green-700 text-white text-sm font-medium py-1.5 px-3 rounded-lg transition"
                      >
                        Otevřít zakázku →
                      </button>
                    </div>
                  </Popup>
                </Marker>
              );
            })}
          </MapContainer>

          {/* Loading overlay */}
          {loading && (
            <div className="absolute inset-0 bg-white/50 flex items-center justify-center z-[500] pointer-events-none">
              <p className="text-green-700 font-medium animate-pulse text-lg">Načítám zakázky…</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MapView;
