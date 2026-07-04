import React, { useContext, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Navbar from '../components/navbar';
import { AppContent } from '../context/AppContext';
import { toast } from 'react-toastify';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaUserCircle, FaEnvelope, FaMapMarkerAlt, FaPhone, FaIdCard,
  FaTimes, FaStar, FaHeart, FaCheckCircle, FaCamera, FaShieldAlt
} from 'react-icons/fa';
import { SavedSearchesList } from '../components/SavedSearches';

// ── Tabs ───────────────────────────────────────────────────────────
const TABS = [
  { id: 'overview', label: 'Přehled' },
  { id: 'ratings', label: 'Hodnocení' },
  { id: 'gallery', label: 'Galerie' },
  { id: 'saved', label: 'Uložená hledání', ownerOnly: true },
];

// ── Rating bar ─────────────────────────────────────────────────────
const RatingBar = ({ label, icon, value, max = 5 }) => {
  const pct = Math.round((value / max) * 100);
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm w-28 text-gray-600 flex items-center gap-1.5">{icon} {label}</span>
      <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-green-400 to-emerald-500 rounded-full transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-sm font-semibold text-gray-700 w-10 text-right">{value}/5</span>
    </div>
  );
};

// ── Star picker ────────────────────────────────────────────────────
const StarPicker = ({ label, value, onChange }) => (
  <div className="flex items-center gap-3">
    <span className="text-sm text-gray-600 w-28">{label}</span>
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <button key={s} onClick={() => onChange(s)} className="focus:outline-none">
          <FaStar className={`w-5 h-5 transition ${s <= value ? 'text-amber-400' : 'text-gray-200 hover:text-amber-200'}`} />
        </button>
      ))}
    </div>
  </div>
);

const Profil = () => {
  const navigate = useNavigate();
  const { userId } = useParams();
  const { userData, backendUrl, refreshUserData } = useContext(AppContent);

  const [profileData, setProfileData] = useState(null);
  const [ratings, setRatings] = useState([]);
  const [averageRatings, setAverageRatings] = useState(null);
  const [isFavorited, setIsFavorited] = useState(false);
  const [favoritesCount, setFavoritesCount] = useState(0);
  const [canSeeContacts, setCanSeeContacts] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [fullscreenImage, setFullscreenImage] = useState(null);
  const [showRatingsModal, setShowRatingsModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [verificationFile, setVerificationFile] = useState(null);

  // rating form
  const [newReliability, setNewReliability] = useState(0);
  const [newCommunication, setNewCommunication] = useState(0);
  const [newQuality, setNewQuality] = useState(0);
  const [newComment, setNewComment] = useState('');

  // pagination for modal
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  const totalPages = Math.ceil(ratings.length / pageSize);
  const paginatedRatings = ratings.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const isOwner = userData?.id === userId;

  // ── Fetch ──────────────────────────────────────────────────────
  const fetchProfile = async () => {
    try {
      const res = await axios.get(`${backendUrl}/api/user/profile/${userId}`);
      if (!res.data.success) return toast.error('Profil nebyl nalezen');
      const u = res.data.user;
      setProfileData(u);
      setRatings(u.ratings || []);
      setAverageRatings(u.averageRatings || null);
      setIsFavorited(Boolean(u.isFavorited));
      setFavoritesCount(u.favoritesCount || 0);
      setCanSeeContacts(
        userData?.subscription?.hasSubscription === true ||
        (Array.isArray(userData?.unlockedProfiles) && userData.unlockedProfiles.includes(userId)) ||
        userData?.id === userId
      );
    } catch {
      toast.error('Chyba při načítání profilu');
    }
  };

  useEffect(() => { fetchProfile(); }, [userId, backendUrl, userData]);

  // ── Handlers ───────────────────────────────────────────────────
  const handleAddRating = async () => {
    if (!newReliability || !newCommunication || !newQuality)
      return toast.error('Ohodnoťte všechny kategorie (1–5 ⭐)');
    try {
      const { data } = await axios.post(
        `${backendUrl}/api/user/${userId}/addRating`,
        { reliability: newReliability, communication: newCommunication, quality: newQuality, comment: newComment },
        { withCredentials: true }
      );
      if (data.success) {
        toast.success('Hodnocení přidáno');
        setRatings(data.ratings);
        setAverageRatings(data.averageRatings);
        setProfileData((p) => ({ ...p, ratings: data.ratings, averageRatings: data.averageRatings }));
        setNewReliability(0); setNewCommunication(0); setNewQuality(0); setNewComment('');
      } else toast.error(data.message);
    } catch { toast.error('Chyba při odesílání hodnocení'); }
  };

  const toggleFavoriteUser = async () => {
    if (!userData?.id) return toast.error('Musíte být přihlášen');
    if (isOwner) return toast.error('Nemůžete si přidat sám sebe.');
    try {
      const endpoint = isFavorited ? `${backendUrl}/api/user/favorites/remove` : `${backendUrl}/api/user/favorites/add`;
      const { data } = await axios.post(endpoint, { targetUserId: userId }, { withCredentials: true });
      if (data.success) {
        setIsFavorited(data.isFavorited);
        setFavoritesCount(data.favoritesCount ?? (isFavorited ? Math.max(0, favoritesCount - 1) : favoritesCount + 1));
        toast.success(data.message);
      } else toast.error(data.message);
    } catch { toast.error('Chyba při změně oblíbených.'); }
  };

  const handleReportUser = async () => {
    if (!reportReason.trim()) return toast.error('Musíte napsat důvod.');
    try {
      const { data } = await axios.post(`${backendUrl}/api/reports/create`, { reportedUserId: userId, reason: reportReason }, { withCredentials: true });
      if (data.success) { toast.success(data.message); setShowReportModal(false); setReportReason(''); }
      else toast.error(data.message);
    } catch { toast.error('Chyba při odesílání reportu.'); }
  };

  const handlePaymentUnlock = async () => {
    try {
      const { data } = await axios.post(`${backendUrl}/api/payments/createCheckout`, { type: 'unlock_profile', targetUserId: userId }, { withCredentials: true });
      if (data.success) window.location.href = data.url;
      else toast.error('Chyba při vytvoření platby');
    } catch { toast.error('Chyba při platbě'); }
  };

  const handleRequestVerification = async () => {
    if (!verificationFile) return toast.error('Vyberte soubor k nahrání!');
    const formData = new FormData();
    formData.append('verificationDoc', verificationFile);
    try {
      const { data } = await axios.post(`${backendUrl}/api/user/requestVerification`, formData, { withCredentials: true });
      if (data.success) {
        toast.success('Ověření bylo odesláno.');
        setProfileData((p) => ({ ...p, verification: data.verification }));
        setVerificationFile(null);
      } else toast.error(data.message);
    } catch { toast.error('Chyba při odesílání ověření.'); }
  };

  // ── Loading ────────────────────────────────────────────────────
  if (!profileData) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-200 to-amber-100">
        <Navbar />
        <div className="flex items-center justify-center min-h-[70vh]">
          <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  // ── Derived data ───────────────────────────────────────────────
  const phoneList = (Array.isArray(profileData.phone) ? profileData.phone : profileData.phone ? [profileData.phone] : [])
    .map((p) => String(p || '').trim()).filter(Boolean);

  const groupedImages = (profileData?.gallery || []).reduce((acc, img) => {
    if (img.approved) { const c = img.category; if (!c) return acc; if (!acc[c]) acc[c] = []; acc[c].push(img); }
    return acc;
  }, {});

  const galleryCount = Object.values(groupedImages).reduce((a, b) => a + b.length, 0);
  const visibleTabs = TABS.filter((t) => !t.ownerOnly || isOwner);

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-200 to-amber-100">
      <Navbar />

      <div className="max-w-5xl mx-auto px-4 pt-24 pb-16">
        <motion.div
          className="bg-white rounded-3xl shadow-xl overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* ══════════════════════════════════════════════════════════
              COVER + AVATAR + NAME
             ══════════════════════════════════════════════════════════ */}
          <div className="relative h-56 sm:h-64">
            {profileData.backgroundPath ? (
              <img
                src={`${backendUrl}/${profileData.backgroundPath.replace(/\\/g, '/')}`}
                alt="Pozadí"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-green-400 via-emerald-500 to-teal-600" />
            )}
            {/* Gradient overlay for text readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

            {/* Avatar */}
            <div className="absolute -bottom-14 left-8">
              <div className="relative">
                {profileData.avatarPath ? (
                  <img
                    src={`${backendUrl}/${profileData.avatarPath.replace(/\\/g, '/')}`}
                    alt="Profilový obrázek"
                    className="w-28 h-28 rounded-2xl border-4 border-white object-cover shadow-lg"
                  />
                ) : (
                  <div className="w-28 h-28 rounded-2xl border-4 border-white bg-gradient-to-br from-green-100 to-green-200 flex items-center justify-center shadow-lg">
                    <FaUserCircle className="text-green-500" size={48} />
                  </div>
                )}
                {profileData?.isVerified && (
                  <div className="absolute -top-2 -right-2 bg-white rounded-full p-1 shadow">
                    <FaCheckCircle className="text-green-500 w-5 h-5" />
                  </div>
                )}
              </div>
            </div>

            {/* Name on cover */}
            <div className="absolute bottom-4 left-44 right-4">
              <h1 className="text-2xl sm:text-3xl font-bold text-white drop-shadow-lg truncate">
                {profileData?.name || 'Uživatel'}
              </h1>
              {profileData?.location && (
                <p className="text-white/80 text-sm flex items-center gap-1 mt-0.5">
                  <FaMapMarkerAlt className="w-3 h-3" /> {profileData.location}
                </p>
              )}
            </div>

            {/* Actions on cover */}
            {!isOwner && userData?.id && (
              <div className="absolute top-4 right-4 flex gap-2">
                <button
                  onClick={toggleFavoriteUser}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium shadow-lg backdrop-blur-sm transition-all ${
                    isFavorited
                      ? 'bg-red-500/90 text-white hover:bg-red-600'
                      : 'bg-white/90 text-gray-700 hover:bg-white'
                  }`}
                >
                  <FaHeart className={isFavorited ? 'text-white' : 'text-red-400'} />
                  {isFavorited ? 'Sleduji' : 'Sledovat'}
                </button>
                <button
                  onClick={() => setShowReportModal(true)}
                  className="px-3 py-2 rounded-xl text-sm bg-white/90 text-gray-500 hover:text-red-500 hover:bg-white shadow-lg backdrop-blur-sm transition"
                  title="Nahlásit"
                >
                  🚨
                </button>
              </div>
            )}
          </div>

          {/* ══════════════════════════════════════════════════════════
              STATS BAR
             ══════════════════════════════════════════════════════════ */}
          <div className="pt-16 px-8 pb-4">
            <div className="flex flex-wrap items-center gap-6 text-sm">
              <div className="flex items-center gap-1.5 text-gray-600">
                <FaHeart className="text-red-400" />
                <span><strong className="text-gray-800">{favoritesCount}</strong> sledujících</span>
              </div>
              {averageRatings && (
                <div className="flex items-center gap-1.5 text-gray-600">
                  <FaStar className="text-amber-400" />
                  <span><strong className="text-gray-800">{averageRatings.overall}</strong> / 5</span>
                  <span className="text-gray-400">({ratings.length} hodnocení)</span>
                </div>
              )}
              {profileData?.specializace?.length > 0 && (
                <div className="flex items-center gap-1.5 text-gray-600">
                  <FaShieldAlt className="text-green-500" />
                  <span><strong className="text-gray-800">{profileData.specializace.length}</strong> specializací</span>
                </div>
              )}
              {galleryCount > 0 && (
                <div className="flex items-center gap-1.5 text-gray-600">
                  <FaCamera className="text-blue-400" />
                  <span><strong className="text-gray-800">{galleryCount}</strong> fotek</span>
                </div>
              )}

              {/* Edit button for owner */}
              {isOwner && (
                <button
                  onClick={() => navigate('/editprofil')}
                  className="ml-auto px-4 py-2 rounded-xl text-sm font-medium bg-green-600 text-white hover:bg-green-700 shadow transition"
                >
                  Upravit profil
                </button>
              )}
            </div>
          </div>

          {/* ══════════════════════════════════════════════════════════
              TABS
             ══════════════════════════════════════════════════════════ */}
          <div className="px-8 border-b border-gray-100">
            <nav className="flex gap-1 -mb-px overflow-x-auto">
              {visibleTabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-5 py-3 text-sm font-medium border-b-2 transition whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'border-green-600 text-green-700'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.label}
                  {tab.id === 'ratings' && ratings.length > 0 && (
                    <span className="ml-1.5 bg-green-100 text-green-700 text-xs px-1.5 py-0.5 rounded-full">
                      {ratings.length}
                    </span>
                  )}
                </button>
              ))}
            </nav>
          </div>

          {/* ══════════════════════════════════════════════════════════
              TAB CONTENT
             ══════════════════════════════════════════════════════════ */}
          <div className="px-8 py-6 min-h-[300px]">

            {/* ── PŘEHLED ─────────────────────────────────────────── */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Popis */}
                <div>
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">O firmě</h3>
                  <p className="text-gray-700 leading-relaxed">
                    {profileData?.description || 'Uživatel zatím nevyplnil popis.'}
                  </p>
                </div>

                {/* Specializace */}
                {profileData?.specializace?.length > 0 && (
                  <div>
                    <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Specializace</h3>
                    <div className="flex flex-wrap gap-2">
                      {profileData.specializace.map((spec, i) => (
                        <span key={i} className="px-3 py-1.5 rounded-full bg-green-50 text-green-700 border border-green-200 text-sm font-medium">
                          {spec}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Kontakty */}
                {canSeeContacts ? (
                  <div>
                    <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Kontakt</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {/* Email */}
                      <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition">
                        <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center flex-shrink-0">
                          <FaEnvelope className="text-green-600" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[11px] text-gray-400 uppercase tracking-wide">Email</p>
                          <p className="text-sm text-gray-800 truncate">{profileData?.email}</p>
                        </div>
                      </div>
                      {/* IČO */}
                      <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition">
                        <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                          <FaIdCard className="text-blue-600" />
                        </div>
                        <div>
                          <p className="text-[11px] text-gray-400 uppercase tracking-wide">IČO</p>
                          <p className="text-sm text-gray-800">{profileData?.ico || 'Neuvedeno'}</p>
                        </div>
                      </div>
                      {/* Lokace */}
                      <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition">
                        <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
                          <FaMapMarkerAlt className="text-amber-600" />
                        </div>
                        <div>
                          <p className="text-[11px] text-gray-400 uppercase tracking-wide">Lokalita</p>
                          <p className="text-sm text-gray-800">{profileData?.location || 'Neuvedeno'}</p>
                        </div>
                      </div>
                      {/* Telefon */}
                      <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition">
                        <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center flex-shrink-0">
                          <FaPhone className="text-purple-600" />
                        </div>
                        <div>
                          <p className="text-[11px] text-gray-400 uppercase tracking-wide">Telefon</p>
                          {phoneList.length > 0 ? (
                            <div className="flex flex-wrap gap-1.5 mt-0.5">
                              {phoneList.map((p, i) => (
                                <a key={i} href={`tel:${p.replace(/\s+/g, '')}`} className="text-sm text-green-700 hover:underline">
                                  {p}{i < phoneList.length - 1 ? ',' : ''}
                                </a>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-gray-800">Neuvedeno</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-2xl p-6 text-center">
                    <p className="text-amber-800 font-medium mb-3">
                      Kontaktní údaje jsou dostupné s předplatným nebo jednorázovým odemčením.
                    </p>
                    <div className="flex flex-wrap justify-center gap-3">
                      <button
                        onClick={() => navigate('/subscription')}
                        className="px-5 py-2.5 rounded-xl bg-green-600 text-white font-medium hover:bg-green-700 shadow transition text-sm"
                      >
                        Aktivovat Premium
                      </button>
                      <button
                        onClick={handlePaymentUnlock}
                        className="px-5 py-2.5 rounded-xl bg-white border border-amber-300 text-amber-700 font-medium hover:bg-amber-50 shadow-sm transition text-sm"
                      >
                        Odemknout profil · 49 Kč
                      </button>
                    </div>
                  </div>
                )}

                {/* Ověření (owner only) */}
                {isOwner && (
                  <div>
                    <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Ověření účtu</h3>
                    {profileData?.verification?.status === 'pending' ? (
                      <p className="text-amber-600 bg-amber-50 rounded-xl p-4 text-sm">
                        ⏳ Ověření odesláno a čeká na schválení.
                      </p>
                    ) : profileData?.verification?.status === 'rejected' ? (
                      <div className="bg-red-50 rounded-xl p-4">
                        <p className="text-red-600 text-sm mb-3">Poslední ověření bylo zamítnuto. Nahrajte nový dokument.</p>
                        <div className="flex items-center gap-3 flex-wrap">
                          <label className="cursor-pointer px-4 py-2 rounded-xl bg-white border border-red-200 text-red-700 text-sm hover:bg-red-50 transition">
                            📄 Vybrat dokument
                            <input type="file" className="hidden" onChange={(e) => setVerificationFile(e.target.files[0])} />
                          </label>
                          {verificationFile && <span className="text-sm text-gray-500">{verificationFile.name}</span>}
                          <button onClick={handleRequestVerification} className="px-4 py-2 rounded-xl bg-red-600 text-white text-sm hover:bg-red-700 transition">
                            Odeslat znovu
                          </button>
                        </div>
                      </div>
                    ) : profileData?.isVerified ? (
                      <p className="text-green-600 bg-green-50 rounded-xl p-4 text-sm">✅ Účet je ověřen.</p>
                    ) : (
                      <div className="bg-gray-50 rounded-xl p-4">
                        <p className="text-gray-600 text-sm mb-3">Ověřte svůj účet nahráním dokladu.</p>
                        <div className="flex items-center gap-3 flex-wrap">
                          <label className="cursor-pointer px-4 py-2 rounded-xl bg-white border border-green-200 text-green-700 text-sm hover:bg-green-50 transition">
                            📄 Vybrat dokument
                            <input type="file" className="hidden" onChange={(e) => setVerificationFile(e.target.files[0])} />
                          </label>
                          {verificationFile && <span className="text-sm text-gray-500">{verificationFile.name}</span>}
                          <button onClick={handleRequestVerification} className="px-4 py-2 rounded-xl bg-green-600 text-white text-sm hover:bg-green-700 transition">
                            Ověřit účet
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ── HODNOCENÍ ───────────────────────────────────────── */}
            {activeTab === 'ratings' && (
              <div className="space-y-6">
                {/* Souhrnné bary */}
                {averageRatings ? (
                  <div className="bg-gray-50 rounded-2xl p-5 space-y-3">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-semibold text-gray-800">Celkové hodnocení</h3>
                      <div className="flex items-center gap-1.5 bg-green-100 text-green-700 px-3 py-1 rounded-full">
                        <FaStar className="text-amber-400 w-3.5 h-3.5" />
                        <span className="font-bold">{averageRatings.overall}</span>
                        <span className="text-green-600 text-xs">/ 5</span>
                      </div>
                    </div>
                    <RatingBar label="Spolehlivost" icon="⭐" value={averageRatings.reliability} />
                    <RatingBar label="Komunikace" icon="💬" value={averageRatings.communication} />
                    <RatingBar label="Kvalita" icon="⚙️" value={averageRatings.quality} />
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">Zatím žádná hodnocení.</p>
                )}

                {/* Seznam hodnocení */}
                {ratings.length > 0 && (
                  <div className="space-y-3">
                    {ratings.slice(0, 5).map((r, idx) => (
                      <div key={idx} className="flex gap-3 p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition">
                        {r.from?.avatarPath ? (
                          <img src={`${backendUrl}/${r.from.avatarPath.replace(/\\/g, '/')}`} alt="" className="w-10 h-10 rounded-xl object-cover flex-shrink-0" />
                        ) : (
                          <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center text-green-600 font-bold flex-shrink-0">
                            {r.from?.name?.charAt(0).toUpperCase() || '?'}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-800 text-sm">{r.from?.name || 'Anonym'}</span>
                            <span className="text-xs text-gray-400">{new Date(r.createdAt).toLocaleDateString('cs-CZ')}</span>
                          </div>
                          <div className="flex gap-4 mt-1 text-xs text-gray-500">
                            <span>⭐ {r.reliability}/5</span>
                            <span>💬 {r.communication}/5</span>
                            <span>⚙️ {r.quality}/5</span>
                          </div>
                          {r.comment && <p className="text-sm text-gray-600 mt-1.5 italic">„{r.comment}"</p>}
                        </div>
                      </div>
                    ))}
                    {ratings.length > 5 && (
                      <button onClick={() => setShowRatingsModal(true)} className="w-full py-3 text-sm text-green-600 font-medium hover:bg-green-50 rounded-xl transition">
                        Zobrazit všech {ratings.length} hodnocení →
                      </button>
                    )}
                  </div>
                )}

                {/* Formulář */}
                {!isOwner && userData?.id && (
                  <div className="bg-gray-50 rounded-2xl p-5 space-y-4">
                    <h3 className="font-semibold text-gray-800">Přidat hodnocení</h3>
                    <div className="space-y-2">
                      <StarPicker label="Spolehlivost" value={newReliability} onChange={setNewReliability} />
                      <StarPicker label="Komunikace" value={newCommunication} onChange={setNewCommunication} />
                      <StarPicker label="Kvalita" value={newQuality} onChange={setNewQuality} />
                    </div>
                    <textarea
                      value={newComment} onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Napište komentář (volitelné)…"
                      className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-green-500 focus:outline-none resize-none"
                      rows={3}
                    />
                    <button onClick={handleAddRating} className="px-5 py-2.5 bg-green-600 text-white rounded-xl text-sm font-medium hover:bg-green-700 shadow transition">
                      Odeslat hodnocení
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* ── GALERIE ─────────────────────────────────────────── */}
            {activeTab === 'gallery' && (
              <div className="space-y-4">
                {Object.keys(groupedImages).length > 0 ? (
                  Object.entries(groupedImages).map(([category, images]) => (
                    <details key={category} className="group" open>
                      <summary className="cursor-pointer flex items-center gap-2 py-2 px-4 rounded-xl bg-green-50 text-green-800 font-medium text-sm hover:bg-green-100 transition">
                        <span className="transition-transform group-open:rotate-90">▶</span>
                        {category}
                        <span className="text-xs text-green-600 bg-green-100 px-2 py-0.5 rounded-full ml-auto">{images.length}</span>
                      </summary>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mt-3">
                        {images.map((img, idx) => (
                          <div
                            key={idx}
                            onClick={() => setFullscreenImage(`${backendUrl}/${img.path}`)}
                            className="aspect-[4/3] rounded-xl overflow-hidden cursor-pointer group/img relative"
                          >
                            <img
                              src={`${backendUrl}/${img.path}`}
                              alt={img.nazev}
                              className="w-full h-full object-cover transition-transform duration-300 group-hover/img:scale-105"
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover/img:bg-black/20 transition" />
                          </div>
                        ))}
                      </div>
                    </details>
                  ))
                ) : (
                  <div className="text-center py-12">
                    <FaCamera className="mx-auto text-gray-300 w-10 h-10 mb-3" />
                    <p className="text-gray-500">Žádné fotky ve schválené galerii.</p>
                  </div>
                )}
              </div>
            )}

            {/* ── ULOŽENÁ HLEDÁNÍ (owner) ─────────────────────────── */}
            {activeTab === 'saved' && isOwner && (
              <SavedSearchesList />
            )}
          </div>
        </motion.div>
      </div>

      {/* ══════════════════════════════════════════════════════════
          MODALS
         ══════════════════════════════════════════════════════════ */}

      {/* Report modal */}
      <AnimatePresence>
        {showReportModal && (
          <motion.div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md relative" initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}>
              <button onClick={() => setShowReportModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><FaTimes /></button>
              <h2 className="text-lg font-bold text-red-600 mb-3">Nahlásit uživatele</h2>
              <textarea value={reportReason} onChange={(e) => setReportReason(e.target.value)} placeholder="Popište důvod nahlášení…" className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-red-400 focus:outline-none resize-none" rows={4} />
              <div className="flex justify-end gap-2 mt-4">
                <button onClick={() => setShowReportModal(false)} className="px-4 py-2 rounded-xl bg-gray-100 text-gray-700 text-sm hover:bg-gray-200 transition">Zrušit</button>
                <button onClick={handleReportUser} className="px-4 py-2 rounded-xl bg-red-600 text-white text-sm hover:bg-red-700 transition">Odeslat</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Ratings modal */}
      <AnimatePresence>
        {showRatingsModal && (
          <motion.div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-lg max-h-[80vh] overflow-y-auto relative" initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}>
              <button onClick={() => setShowRatingsModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><FaTimes /></button>
              <h2 className="text-lg font-bold mb-4">Všechna hodnocení</h2>
              <div className="space-y-3">
                {paginatedRatings.map((r, idx) => (
                  <div key={idx} className="flex gap-3 p-4 rounded-xl bg-gray-50">
                    {r.from?.avatarPath ? (
                      <img src={`${backendUrl}/${r.from.avatarPath.replace(/\\/g, '/')}`} alt="" className="w-10 h-10 rounded-xl object-cover flex-shrink-0" />
                    ) : (
                      <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center text-green-600 font-bold flex-shrink-0">
                        {r.from?.name?.charAt(0).toUpperCase() || '?'}
                      </div>
                    )}
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{r.from?.name || 'Anonym'}</span>
                        <span className="text-xs text-gray-400">{new Date(r.createdAt).toLocaleDateString('cs-CZ')}</span>
                      </div>
                      <div className="flex gap-4 mt-1 text-xs text-gray-500">
                        <span>⭐ {r.reliability}/5</span>
                        <span>💬 {r.communication}/5</span>
                        <span>⚙️ {r.quality}/5</span>
                      </div>
                      {r.comment && <p className="text-sm text-gray-600 mt-1.5 italic">„{r.comment}"</p>}
                    </div>
                  </div>
                ))}
              </div>
              {totalPages > 1 && (
                <div className="flex justify-between items-center mt-4 text-sm">
                  <button disabled={currentPage === 1} onClick={() => setCurrentPage((p) => p - 1)} className={`px-3 py-1.5 rounded-lg ${currentPage === 1 ? 'bg-gray-100 text-gray-400' : 'bg-green-100 text-green-700 hover:bg-green-200'}`}>‹ Předchozí</button>
                  <span className="text-gray-500">{currentPage} / {totalPages}</span>
                  <button disabled={currentPage === totalPages} onClick={() => setCurrentPage((p) => p + 1)} className={`px-3 py-1.5 rounded-lg ${currentPage === totalPages ? 'bg-gray-100 text-gray-400' : 'bg-green-100 text-green-700 hover:bg-green-200'}`}>Další ›</button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Fullscreen image */}
      <AnimatePresence>
        {fullscreenImage && (
          <motion.div className="fixed inset-0 bg-black/85 flex items-center justify-center z-50" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setFullscreenImage(null)}>
            <motion.img src={fullscreenImage} alt="Fullscreen" className="max-h-[90vh] max-w-[90vw] rounded-2xl shadow-2xl" initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} />
            <button onClick={() => setFullscreenImage(null)} className="absolute top-6 right-6 text-white/80 hover:text-white text-2xl"><FaTimes /></button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Profil;
