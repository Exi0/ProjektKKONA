import React, { useContext, useEffect, useState, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AppContent } from '../context/AppContext';
import Navbar from '../components/navbar';
import {
  PencilSquareIcon, ArrowLeftIcon, CheckCircleIcon, XMarkIcon,
  HeartIcon, LinkIcon, EyeIcon, MapPinIcon, TagIcon, UserIcon,
  TrophyIcon, ClockIcon, CurrencyDollarIcon, ChartBarIcon
} from '@heroicons/react/24/solid';
import { HeartIcon as HeartOutline } from '@heroicons/react/24/outline';
import axios from 'axios';
import { toast } from 'react-toastify';
import ImageGallery from 'react-image-gallery';
import 'react-image-gallery/styles/css/image-gallery.css';
import { MapContainer, TileLayer, Marker, GeoJSON } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import DealPanel from '../components/DealPanel';

const unitLabel = { ha: 'Kč/ha', h: 'Kč/h', t: 'Kč/t', kg: 'Kč/kg' };
const quantityLabelByUnit = { ha: 'Rozsah (ha)', h: 'Počet hodin', t: 'Množství (t)', kg: 'Množství (kg)' };

const stavBadge = {
  'Veřejný': 'bg-green-100 text-green-700',
  'Domluveno': 'bg-yellow-100 text-yellow-700',
  'Probíhá': 'bg-blue-100 text-blue-700',
  'Čeká na potvrzení dokončení': 'bg-orange-100 text-orange-700',
  'Dokončeno': 'bg-emerald-100 text-emerald-700',
  'Sporný': 'bg-red-100 text-red-700',
  'Čeká na schválení': 'bg-gray-100 text-gray-600',
};

const Inzerat = () => {
  const { inzeratId } = useParams();
  const navigate = useNavigate();
  const { userData, backendUrl, getInzeratItemData, inzeratItemData } = useContext(AppContent);

  const [uploadedImages, setUploadedImages] = useState([]);
  const [isFavorited, setIsFavorited] = useState(false);
  const [hasInterest, setHasInterest] = useState(false);
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);
  const [showLikedOnly, setShowLikedOnly] = useState(false);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [showInterestModal, setShowInterestModal] = useState(false);
  const [interestText, setInterestText] = useState('');
  const [interestedUsers, setInterestedUsers] = useState([]);
  const [sortOrder, setSortOrder] = useState('newest');
  const [openCandidate, setOpenCandidate] = useState(null);
  const [krajBoundaries, setKrajBoundaries] = useState(null);
  const hasFetched = useRef(false);

  const filteredInterestedUsers = useMemo(() => {
    if (!interestedUsers) return [];
    let list = [...interestedUsers];
    list.sort((a, b) => {
      const diff = new Date(b.createdAt) - new Date(a.createdAt);
      return sortOrder === 'newest' ? diff : -diff;
    });
    if (showUnreadOnly) list = list.filter(u => !u.readStatus);
    if (showLikedOnly) list = list.filter(u => u.like);
    return list;
  }, [interestedUsers, showUnreadOnly, showLikedOnly, sortOrder]);

  const winnerUser = useMemo(() => {
    const w = inzeratItemData?.winner;
    if (!w) return null;
    if (typeof w === 'object' && (w._id || w.id)) return w;
    const match = inzeratItemData?.interestedUsers?.find((it) => {
      const uid = it?.user?._id || it?.user || it?._id;
      return String(uid) === String(w);
    });
    return match?.user || null;
  }, [inzeratItemData]);

  const handleConfirmInterest = async () => {
    if (!interestText.trim()) {
      toast.error('Prosím napište krátkou zprávu k vašemu zájmu.');
      return;
    }
    try {
      const { data } = await axios.post(
        `${backendUrl}/api/inzerat/addInterestedUser`,
        { userId: userData.id, inzeratId, text: interestText },
        { withCredentials: true }
      );
      if (data.success) {
        toast.success('Zájem byl odeslán.');
        setShowInterestModal(false);
        setInterestText('');
        await getInzeratItemData(inzeratId);
      } else {
        toast.error(data.message || 'Nepodařilo se odeslat zájem.');
      }
    } catch (err) {
      console.error(err);
      toast.error('Chyba při odesílání zájmu.');
    }
  };

  const openCandidateDetail = async (candidate) => {
    setOpenCandidate(candidate);
    if (!candidate.readStatus) {
      try {
        await toggleRead(candidate.user?._id || candidate.user, false);
      } catch (e) { console.error(e); }
    }
  };

  useEffect(() => {
    fetch('/kraje.geojson.json')
      .then((r) => r.json())
      .then((data) => setKrajBoundaries(data))
      .catch((err) => console.warn('Hranice krajů:', err));
  }, []);

  const boundaryStyle = { color: '#ffffff', weight: 1.5, opacity: 0.7, fillOpacity: 0, dashArray: '8, 5' };

  useEffect(() => {
    if (!userData?.id || hasFetched.current) return;
    const fetchData = async () => {
      try {
        await axios.post(`${backendUrl}/api/inzerat/incrementViews`, { inzeratId }, { withCredentials: true });
      } catch (err) { console.error('❌ Chyba při navýšení zobrazení:', err); }
      await getInzeratItemData(inzeratId);
      try {
        const res = await axios.get(`${backendUrl}/api/image/byInzerat/${inzeratId}`);
        if (res.data.success) setUploadedImages(res.data.images);
      } catch (err) { toast.error('Chyba při načítání obrázků.'); }
    };
    fetchData();
    hasFetched.current = true;
  }, [inzeratId, userData, getInzeratItemData, backendUrl]);

  useEffect(() => {
    if (!inzeratItemData || !userData?.id) return;
    setIsFavorited(inzeratItemData.favorites?.includes(userData.id) || false);
    if (inzeratItemData?.interestedUsers) setInterestedUsers(inzeratItemData.interestedUsers);
    setHasInterest(
      inzeratItemData.interestedUsers?.some(u => (u.user?._id || u._id || u) === userData.id) || false
    );
  }, [inzeratItemData, userData]);

  const toggleFavorite = async () => {
    try {
      const endpoint = isFavorited
        ? `${backendUrl}/api/inzerat/removeFromFavoriteInzerat`
        : `${backendUrl}/api/inzerat/addToFavoriteInzerat`;
      const { data } = await axios.post(endpoint, { userId: userData.id, inzeratId });
      if (data.success) {
        toast.success(data.message);
        await getInzeratItemData(inzeratId);
      } else toast.error(data.message);
    } catch (err) { toast.error('Chyba při změně oblíbených.'); }
  };

  const toggleLike = async (candidateUserId, currentLike) => {
    try {
      await axios.post(`${backendUrl}/api/inzerat/setInterestedUserLike`,
        { inzeratId, userId: candidateUserId, like: !currentLike }, { withCredentials: true });
      setInterestedUsers(prev =>
        prev.map(c => (c.user?._id || c.user) === candidateUserId ? { ...c, like: !currentLike } : c));
    } catch (err) { console.error('Chyba při togglu like:', err); }
  };

  const toggleRead = async (candidateUserId, currentRead) => {
    try {
      await axios.post(`${backendUrl}/api/inzerat/setInterestedUserRead`,
        { inzeratId, userId: candidateUserId, read: !currentRead }, { withCredentials: true });
      setInterestedUsers(prev =>
        prev.map(c => (c.user?._id || c.user) === candidateUserId ? { ...c, readStatus: !currentRead } : c));
    } catch (err) { console.error('Chyba při togglu read:', err); }
  };

  const handleSendMessage = async () => {
    if (!messageText.trim()) return toast.error('Napište zprávu');
    try {
      const { data } = await axios.post(`${backendUrl}/api/conversation/start`,
        { inzeratId, otherUserId: user._id, text: messageText }, { withCredentials: true });
      if (data.success) {
        toast.success('Zpráva odeslána');
        setShowMessageModal(false);
        setMessageText('');
      } else toast.error(data.message || 'Nepodařilo se založit konverzaci.');
    } catch (err) { console.error(err); toast.error('Chyba při odesílání zprávy.'); }
  };

  const selectWinner = async (candidateId) => {
    try {
      const { data } = await axios.post(`${backendUrl}/api/inzerat/selectWinner`,
        { inzeratId, winnerId: candidateId });
      if (data.success) {
        toast.success('Vítěz byl úspěšně vybrán.');
        await getInzeratItemData(inzeratId);
      } else toast.error(data.message);
    } catch (err) { toast.error('Chyba při výběru vítěze.'); }
  };

  if (!inzeratItemData) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-200 to-amber-100">
        <Navbar />
        <div className="flex items-center justify-center min-h-[70vh]">
          <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  const coords = inzeratItemData?.location?.coordinates || [];
  const position = coords.length === 2 ? [coords[1], coords[0]] : null;
  const approvedImages = uploadedImages.filter(img => img.approved === true);
  const { nadpis, stav, popis, cenaPerHa, cenaType, ukon, ha, stat, kraj, mesto, user, views } = inzeratItemData;

  const unitText = unitLabel[cenaType] || 'Kč';
  const priceStr = cenaPerHa || cenaPerHa === 0 ? `${cenaPerHa} ${unitText}` : 'Neuvedeno';
  const qtyLabel = quantityLabelByUnit[cenaType] || 'Množství';
  const totalPrice = (Number(cenaPerHa) > 0 && Number(ha) > 0)
    ? (Number(cenaPerHa) * Number(ha)).toLocaleString('cs-CZ') : null;
  const isOwner = user._id === userData?.id;

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-200 to-amber-100">
      <Navbar />
      <div className="pt-28 pb-16 px-4">
        <div className="max-w-5xl mx-auto space-y-6">

          {/* ── Horní lišta: zpět + upravit ── */}
          <div className="flex justify-between items-center">
            <button
              onClick={() => navigate('/inzeraty')}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition"
            >
              <ArrowLeftIcon className="h-5 w-5" />
              <span className="text-sm font-medium">Zpět na zakázky</span>
            </button>
            {isOwner && (
              <button
                onClick={() => navigate(`/editInzerat/${inzeratId}`)}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl shadow-sm hover:bg-blue-700 transition text-sm font-medium"
              >
                <PencilSquareIcon className="h-4 w-4" />
                Upravit
              </button>
            )}
          </div>

          {/* ── Hlavní karta ── */}
          <div className="bg-white rounded-3xl shadow-xl overflow-hidden">

            {/* Hlavička s názvem + stav */}
            <div className="p-6 sm:p-8 border-b border-gray-100">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2 text-xs text-gray-400 uppercase tracking-wider">
                    <TagIcon className="h-4 w-4" />
                    <span>{inzeratItemData.kategorie || 'Zakázka'} · {ukon}</span>
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 leading-tight">{nadpis}</h1>
                </div>
                <span className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap ${stavBadge[stav] || 'bg-gray-100 text-gray-600'}`}>
                  {stav}
                </span>
              </div>
            </div>

            {/* Metriky: cena / rozsah / celkem / zobrazení */}
            <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-gray-100 border-b border-gray-100">
              <div className="p-5">
                <div className="flex items-center gap-1.5 text-xs text-gray-400 uppercase tracking-wide mb-1">
                  <CurrencyDollarIcon className="h-3.5 w-3.5" /> Cena
                </div>
                <p className="text-lg font-bold text-gray-800">{priceStr}</p>
              </div>
              {Number.isFinite(ha) && ha > 0 && (
                <div className="p-5">
                  <div className="flex items-center gap-1.5 text-xs text-gray-400 uppercase tracking-wide mb-1">
                    <ChartBarIcon className="h-3.5 w-3.5" /> {qtyLabel}
                  </div>
                  <p className="text-lg font-bold text-gray-800">{ha}</p>
                </div>
              )}
              {totalPrice && (
                <div className="p-5">
                  <div className="text-xs text-gray-400 uppercase tracking-wide mb-1">Celkem</div>
                  <p className="text-lg font-bold text-green-700">{totalPrice} Kč</p>
                </div>
              )}
              <div className="p-5">
                <div className="flex items-center gap-1.5 text-xs text-gray-400 uppercase tracking-wide mb-1">
                  <EyeIcon className="h-3.5 w-3.5" /> Zobrazení
                </div>
                <p className="text-lg font-bold text-gray-800">{views || 0}</p>
              </div>
            </div>

            {/* Tělo: autor + lokalita + popis + akce */}
            <div className="p-6 sm:p-8 space-y-6">

              {/* Autor + lokalita řádek */}
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <UserIcon className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-500">Autor:</span>
                  <button
                    onClick={() => navigate(`/profil/${user._id}`)}
                    className="text-green-700 font-medium hover:underline"
                  >
                    {user.name || user.email}
                  </button>
                </div>
                {(stat || kraj || mesto) && (
                  <div className="flex items-center gap-2">
                    <MapPinIcon className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-700">{[mesto, kraj, stat].filter(Boolean).join(', ')}</span>
                  </div>
                )}
              </div>

              {/* Popis */}
              {popis && (
                <div>
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Popis zakázky</h3>
                  <div
                    className="prose prose-sm max-w-none text-gray-700"
                    dangerouslySetInnerHTML={{ __html: popis }}
                  />
                </div>
              )}

              {/* Akční tlačítka */}
              <div className="flex flex-wrap gap-3 pt-2">
                <button
                  onClick={toggleFavorite}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-sm transition
                    ${isFavorited
                      ? 'bg-red-50 text-red-600 hover:bg-red-100'
                      : 'bg-gray-50 text-gray-700 hover:bg-gray-100'}`}
                >
                  {isFavorited ? <HeartIcon className="h-5 w-5" /> : <HeartOutline className="h-5 w-5" />}
                  {inzeratItemData?.favorites?.length || 0} To se mi líbí
                </button>

                <button
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.href)
                      .then(() => toast.success('Odkaz zkopírován do schránky.'))
                      .catch(() => toast.error('Nepodařilo se zkopírovat odkaz.'));
                  }}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-sm bg-gray-50 text-gray-700 hover:bg-gray-100 transition"
                >
                  <LinkIcon className="h-5 w-5" />
                  Kopírovat odkaz
                </button>

                {!isOwner && (
                  hasInterest ? (
                    <button
                      onClick={async () => {
                        try {
                          const { data } = await axios.post(
                            `${backendUrl}/api/inzerat/removeInterestedUser`,
                            { userId: userData.id, inzeratId }, { withCredentials: true });
                          if (data.success) {
                            toast.success('Zájem byl odebrán.');
                            await getInzeratItemData(inzeratId);
                          } else toast.error(data.message || 'Nepodařilo se odebrat zájem.');
                        } catch (err) { toast.error('Chyba při odebírání zájmu.'); }
                      }}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-sm bg-red-50 text-red-600 hover:bg-red-100 transition"
                    >
                      <XMarkIcon className="h-5 w-5" />
                      Odebrat zájem
                    </button>
                  ) : (
                    <button
                      onClick={() => setShowInterestModal(true)}
                      className="flex items-center gap-2 px-5 py-2 rounded-xl font-medium text-sm bg-green-600 text-white hover:bg-green-700 shadow-sm transition"
                    >
                      <CheckCircleIcon className="h-5 w-5" />
                      Mám zájem
                    </button>
                  )
                )}
              </div>
            </div>
          </div>

          {/* ── Mapa ── */}
          {position && (
            <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
              <div className="p-6 sm:p-8 pb-4">
                <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                  <MapPinIcon className="h-5 w-5 text-green-600" />
                  Poloha zakázky
                </h2>
              </div>
              <div className="px-6 sm:px-8 pb-6">
                <div className="rounded-2xl overflow-hidden border border-gray-200">
                  <MapContainer center={position} zoom={13} style={{ height: '400px', width: '100%' }}>
                    <TileLayer
                      attribution='&copy; Esri'
                      url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                    />
                    <TileLayer url="https://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}.png" />
                    {krajBoundaries && <GeoJSON data={krajBoundaries} style={boundaryStyle} />}
                    <Marker position={position} />
                  </MapContainer>
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  Lat: {position[0].toFixed(6)} · Lng: {position[1].toFixed(6)}
                </p>
              </div>
            </div>
          )}

          {/* ── Galerie ── */}
          {approvedImages.length > 0 && (
            <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
              <div className="p-6 sm:p-8 pb-4">
                <h2 className="text-lg font-bold text-gray-800">Galerie</h2>
              </div>
              <div className="px-6 sm:px-8 pb-8">
                <ImageGallery
                  items={approvedImages.map((img) => ({
                    original: `${backendUrl}/${img.path.replace(/\\/g, '/')}`,
                    thumbnail: `${backendUrl}/${img.path.replace(/\\/g, '/')}`,
                    description: img.nazev || ''
                  }))}
                  showThumbnails showPlayButton={false} showFullscreenButton
                  useBrowserFullscreen slideDuration={450} slideInterval={3000} showIndex
                />
              </div>
            </div>
          )}

          {/* ── Vybraný vítěz ── */}
          {winnerUser && (
            <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
              <div className="bg-green-50 border-l-4 border-green-500 p-6 sm:p-8">
                <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <TrophyIcon className="h-5 w-5 text-green-600" />
                  Vybraný vítěz
                </h2>
                <div className="flex items-center gap-3">
                  {winnerUser.avatarPath ? (
                    <img src={`${backendUrl}/${winnerUser.avatarPath.replace(/\\/g, '/')}`}
                      alt={winnerUser.name} className="w-12 h-12 rounded-xl object-cover" />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center text-green-700 font-bold">
                      {(winnerUser.name || winnerUser.email || '?').charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <p className="font-semibold text-gray-800">{winnerUser.name || '—'}</p>
                    <p className="text-sm text-gray-600">{winnerUser.email || ''}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── Deal Lifecycle ── */}
          {inzeratItemData?.winner && (
            <DealPanel
              inzerat={inzeratItemData}
              onUpdate={() => getInzeratItemData(inzeratId)}
            />
          )}

          {/* ── Zájemci (jen vlastník) ── */}
          {isOwner && interestedUsers?.length > 0 && (
            <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
              <div className="p-6 sm:p-8">
                <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
                  <h2 className="text-lg font-bold text-gray-800">
                    Zájemci <span className="text-gray-400 font-normal">({interestedUsers.length})</span>
                  </h2>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowUnreadOnly(v => !v)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition ${
                        showUnreadOnly ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}
                    >
                      <EyeIcon className="h-4 w-4" /> Nepřečtené
                    </button>
                    <button
                      onClick={() => setShowLikedOnly(v => !v)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition ${
                        showLikedOnly ? 'bg-red-100 text-red-800' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}
                    >
                      <HeartIcon className="h-4 w-4" /> Lajknuté
                    </button>
                    <button
                      onClick={() => setSortOrder(o => o === 'newest' ? 'oldest' : 'newest')}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm bg-gray-50 text-gray-700 hover:bg-gray-100 transition"
                    >
                      <ClockIcon className="h-4 w-4" /> {sortOrder === 'newest' ? 'Nejnovější' : 'Nejstarší'}
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  {filteredInterestedUsers.map((candidate) => {
                    const userObj = candidate.user || candidate;
                    const cid = userObj._id;
                    return (
                      <div
                        key={cid}
                        className={`flex justify-between items-center gap-4 rounded-2xl px-4 py-3 border transition
                          ${!candidate.readStatus ? 'bg-yellow-50 border-yellow-200' : 'bg-white border-gray-100 hover:border-green-200 hover:bg-green-50/30'}`}
                      >
                        <div
                          onClick={() => navigate(`/profil/${cid}`)}
                          className="flex items-center gap-3 cursor-pointer flex-1 min-w-0"
                        >
                          {userObj.avatarPath ? (
                            <img src={`${backendUrl}/${userObj.avatarPath.replace(/\\/g, '/')}`}
                              alt={userObj.name} className="w-11 h-11 rounded-xl object-cover flex-shrink-0" />
                          ) : (
                            <div className="w-11 h-11 rounded-xl bg-green-100 flex items-center justify-center text-green-700 font-bold flex-shrink-0">
                              {userObj.name?.charAt(0).toUpperCase() || '?'}
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="font-semibold text-gray-800 truncate">{userObj.name}</p>
                            <p className="text-sm text-gray-500 truncate">{userObj.email}</p>
                            {candidate.text && (
                              <p className="text-sm text-gray-500 italic mt-0.5 truncate">„{candidate.text}"</p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 flex-shrink-0">
                          <button
                            onClick={() => openCandidateDetail(candidate)}
                            className="text-sm bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition"
                          >
                            Detail
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); toggleLike(cid, candidate.like); }}
                            className="p-2 rounded-lg hover:bg-gray-100 transition"
                          >
                            {candidate.like
                              ? <HeartIcon className="h-5 w-5 text-red-500" />
                              : <HeartOutline className="h-5 w-5 text-gray-400" />}
                          </button>
                          {!winnerUser && (
                            <button
                              onClick={(e) => { e.stopPropagation(); selectWinner(cid); }}
                              className="flex items-center gap-1 text-sm bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700 transition"
                            >
                              <TrophyIcon className="h-4 w-4" /> Vybrat
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Modal: zpráva ── */}
      {showMessageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full">
            <h2 className="text-lg font-bold mb-4">Napsat zprávu</h2>
            <textarea
              value={messageText} onChange={(e) => setMessageText(e.target.value)}
              placeholder="Vaše zpráva…"
              className="w-full border border-gray-200 rounded-xl p-3 mb-4 focus:ring-2 focus:ring-green-500 focus:outline-none resize-none" rows={4}
            />
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowMessageModal(false)}
                className="px-4 py-2 rounded-xl bg-gray-100 text-gray-700 hover:bg-gray-200 transition">Zrušit</button>
              <button onClick={handleSendMessage}
                className="px-4 py-2 rounded-xl bg-green-600 text-white hover:bg-green-700 transition">Odeslat</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: zájem ── */}
      {showInterestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full">
            <h2 className="text-lg font-bold mb-4">Mám zájem</h2>
            <textarea
              value={interestText} onChange={(e) => setInterestText(e.target.value)}
              placeholder="Popište stručně vaši nabídku…"
              className="w-full border border-gray-200 rounded-xl p-3 mb-4 focus:ring-2 focus:ring-green-500 focus:outline-none resize-none" rows={4}
            />
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowInterestModal(false)}
                className="px-4 py-2 rounded-xl bg-gray-100 text-gray-700 hover:bg-gray-200 transition">Zrušit</button>
              <button onClick={handleConfirmInterest}
                className="px-4 py-2 rounded-xl bg-green-600 text-white hover:bg-green-700 transition">Odeslat zájem</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: detail zájemce ── */}
      {openCandidate && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 relative">
            <button onClick={() => setOpenCandidate(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-700">
              <XMarkIcon className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-4 mb-4">
              {openCandidate.user?.avatarPath ? (
                <img src={`${backendUrl}/${openCandidate.user.avatarPath.replace(/\\/g, '/')}`}
                  className="w-14 h-14 rounded-xl object-cover" />
              ) : (
                <div className="w-14 h-14 rounded-xl bg-green-100 flex items-center justify-center text-xl font-bold text-green-700">
                  {openCandidate.user?.name?.charAt(0)}
                </div>
              )}
              <div>
                <p className="font-semibold text-lg">{openCandidate.user?.name}</p>
                <p className="text-sm text-gray-600">{openCandidate.user?.email}</p>
              </div>
            </div>

            {openCandidate.text && (
              <div className="bg-gray-50 rounded-xl p-4 italic text-gray-700 mb-4">
                „{openCandidate.text}"
              </div>
            )}

            <div className="flex justify-between items-center mt-6">
              <button
                onClick={() => {
                  toggleLike(openCandidate.user?._id || openCandidate.user, openCandidate.like);
                  setOpenCandidate(prev => ({ ...prev, like: !prev.like }));
                }}
                className="p-2 rounded-lg hover:bg-gray-100 transition"
                title={openCandidate.like ? 'Odebrat like' : 'Dát like'}
              >
                {openCandidate.like
                  ? <HeartIcon className="h-7 w-7 text-red-500" />
                  : <HeartOutline className="h-7 w-7 text-gray-400" />}
              </button>
              {!winnerUser && (
                <button
                  onClick={() => {
                    selectWinner(openCandidate.user?._id || openCandidate.user);
                    setOpenCandidate(null);
                  }}
                  className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-xl hover:bg-green-700 transition"
                >
                  <TrophyIcon className="h-5 w-5" /> Vybrat vítěze
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inzerat;
