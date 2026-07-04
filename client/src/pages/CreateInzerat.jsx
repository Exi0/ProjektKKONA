import React, { useContext, useRef, useState, useEffect, useMemo } from 'react';
import Navbar from '../components/navbar';
import { AppContent } from '../context/AppContext';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { MapContainer, TileLayer, Marker, useMapEvents, GeoJSON } from 'react-leaflet';
import L from 'leaflet';
import { kategorieToUkon, kategorieOptions } from '../constants/categories';
import {
  DocumentTextIcon, TagIcon, CurrencyDollarIcon, MapPinIcon, PhotoIcon,
  ArrowLeftIcon, ArrowRightIcon, CheckIcon, BookmarkIcon, ArrowUpOnSquareIcon
} from '@heroicons/react/24/solid';
import 'leaflet/dist/leaflet.css';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const LocationMarker = ({ onMapClick }) => {
  useMapEvents({ click(e) { onMapClick(e.latlng.lat, e.latlng.lng); } });
  return null;
};

const inputClass = "w-full border border-gray-200 rounded-xl px-3 py-2.5 text-gray-700 focus:ring-2 focus:ring-green-500 focus:outline-none transition";

const stepMeta = [
  { num: 1, icon: DocumentTextIcon, title: 'Základní informace' },
  { num: 2, icon: TagIcon, title: 'Kategorie a úkon' },
  { num: 3, icon: CurrencyDollarIcon, title: 'Cena a množství' },
  { num: 4, icon: MapPinIcon, title: 'Lokalita a obrázky' },
];

const CreateInzerat = () => {
  const { backendUrl, userData } = useContext(AppContent);
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploadedImages, setUploadedImages] = useState([]);
  const fileInputRef = useRef(null);
  const [krajBoundaries, setKrajBoundaries] = useState(null);

  useEffect(() => {
    fetch('/kraje.geojson.json')
      .then((r) => r.json())
      .then((data) => setKrajBoundaries(data))
      .catch((err) => console.warn('Hranice krajů:', err));
  }, []);

  const boundaryStyle = { color: '#ffffff', weight: 1.5, opacity: 0.7, fillOpacity: 0, dashArray: '8, 5' };

  const [formValues, setFormValues] = useState({
    nadpis: '', popis: '', cenaPerHa: '', cenaType: '', ha: '',
    ukon: '', kategorie: '', stat: '', mesto: '', kraj: '', location: null
  });
  const [errors, setErrors] = useState({});

  const labels = {
    nadpis: 'Název zakázky', popis: 'Popis', cenaPerHa: 'Cena za množství',
    cenaType: 'Fakturační množství', ha: 'Množství', ukon: 'Úkon',
    kategorie: 'Kategorie', stat: 'Stát', mesto: 'Město', kraj: 'Kraj',
  };

  const numericFields = ['latitude', 'longitude', 'cenaPerHa', 'ha'];
  const statOptions = ['Česko', 'Slovensko'];
  const krajByCountry = {
    'Česko': [
      'Praha', 'Středočeský kraj', 'Jihočeský kraj', 'Plzeňský kraj',
      'Karlovarský kraj', 'Ústecký kraj', 'Liberecký kraj', 'Královéhradecký kraj',
      'Pardubický kraj', 'Vysočina', 'Jihomoravský kraj', 'Olomoucký kraj',
      'Moravskoslezský kraj', 'Zlínský kraj'
    ],
    'Slovensko': [
      'Bratislavský kraj', 'Trnavský kraj', 'Trenčiansky kraj', 'Nitriansky kraj',
      'Žilinský kraj', 'Banskobystrický kraj', 'Prešovský kraj', 'Košický kraj'
    ],
  };
  const krajOptions = formValues.stat ? (krajByCountry[formValues.stat] || []) : [];
  const matchKraj = (raw) => {
    if (!raw) return '';
    const norm = raw.toLowerCase();
    const allKraje = [...(krajByCountry['Česko'] || []), ...(krajByCountry['Slovensko'] || [])];
    const exact = allKraje.find((k) => k.toLowerCase() === norm);
    if (exact) return exact;
    const partial = allKraje.find((k) => norm.includes(k.toLowerCase()) || k.toLowerCase().includes(norm));
    return partial || '';
  };
  const cenaTypeOptions = [
    { value: 'ha', label: 'Kč/ha (za hektar)' },
    { value: 'h', label: 'Kč/h (za hodinu)' },
    { value: 't', label: 'Kč/t (za tunu)' },
    { value: 'kg', label: 'Kč/kg (za kilogram)' },
  ];

  const quillModules = useMemo(() => ({
    toolbar: [
      [{ header: [1, 2, false] }],
      ['bold', 'italic', 'underline'],
      [{ list: 'ordered' }, { list: 'bullet' }],
      ['link', 'clean'],
    ],
  }), []);
  const quillFormats = useMemo(() => ['header', 'bold', 'italic', 'underline', 'list', 'bullet', 'link'], []);

  const stripHtml = (html) => html.replace(/<(.|\n)*?>/g, '').trim();

  const validateForm = () => {
    const newErrors = {};
    Object.keys(formValues).forEach((key) => {
      const value = formValues[key];
      if (key === 'popis') {
        if (!value || stripHtml(value) === '') newErrors[key] = 'Popis je povinný';
        return;
      }
      if (!value && value !== 0) newErrors[key] = 'Toto pole je povinné';
      else if (numericFields.includes(key) && isNaN(Number(value))) newErrors[key] = 'Zadejte platné číslo';
    });
    if (!formValues.cenaType) newErrors.cenaType = 'Vyberte typ ceny';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const stepFields = {
    1: ['nadpis', 'popis'],
    2: ['kategorie', 'ukon'],
    3: ['cenaType', 'cenaPerHa', 'ha'],
    4: ['stat', 'kraj', 'mesto']
  };

  const validateCurrentStep = () => {
    const fields = stepFields[step];
    const newErrors = {};
    fields.forEach((key) => {
      const value = formValues[key];
      if (key === 'popis') {
        if (!value || stripHtml(value) === '') newErrors[key] = 'Popis je povinný';
        return;
      }
      if (!value && value !== 0) newErrors[key] = 'Toto pole je povinné';
      else if (numericFields.includes(key) && isNaN(Number(value))) newErrors[key] = 'Zadejte platné číslo';
    });
    if (fields.includes('cenaType') && !formValues.cenaType) newErrors.cenaType = 'Vyberte typ ceny';
    setErrors((prev) => ({ ...prev, ...newErrors }));
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = (e) => {
    e?.preventDefault();
    if (!validateCurrentStep()) {
      toast.error('Vyplňte prosím povinná pole v tomto kroku.');
      return;
    }
    setStep((s) => Math.min(4, s + 1));
  };
  const handleBack = (e) => {
    e?.preventDefault();
    setStep((s) => Math.max(1, s - 1));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormValues((prev) => {
      const next = {
        ...prev,
        [name]: numericFields.includes(name) ? (value === '' ? '' : Number(value)) : value,
        ...(name === 'stat' ? { mesto: '', kraj: '' } : {}),
      };
      if (name === 'kategorie') next.ukon = '';
      return next;
    });
    setErrors((prev) => ({ ...prev, [name]: '' }));
    if (name === 'kategorie') setErrors((prev) => ({ ...prev, ukon: '' }));
    if (name === 'stat') setErrors((prev) => ({ ...prev, kraj: '', mesto: '' }));
  };

  const handleGeoDetect = () => {
    if (!navigator.geolocation) {
      toast.error('Geolokace není podporována tímto prohlížečem.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          setFormValues((prev) => ({
            ...prev,
            location: { type: 'Point', coordinates: [longitude, latitude] },
          }));
          const { stat, kraj, mesto } = await reverseGeocode(latitude, longitude);
          const matchedKraj = matchKraj(kraj);
          setFormValues((prev) => ({
            ...prev,
            stat: stat || prev.stat,
            kraj: matchedKraj || prev.kraj,
            mesto: mesto || prev.mesto,
          }));
          toast.success('Souřadnice a adresa načteny');
        } catch {
          toast.warn('Souřadnice načteny, ale nepodařilo se zjistit adresu.');
        }
      },
      () => toast.error('Nepodařilo se získat polohu.'),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleMapClick = async (lat, lng) => {
    setFormValues((prev) => ({
      ...prev,
      location: { type: 'Point', coordinates: [lng, lat] },
    }));
    try {
      const { stat, kraj, mesto } = await reverseGeocode(lat, lng);
      const matchedKraj = matchKraj(kraj);
      if (matchedKraj || mesto) {
        setFormValues((prev) => ({
          ...prev,
          stat: stat || prev.stat,
          kraj: matchedKraj || prev.kraj,
          mesto: mesto || prev.mesto,
        }));
        toast.success(`Předvyplněno: ${[matchedKraj, mesto].filter(Boolean).join(', ')}`, { autoClose: 3000 });
      } else {
        toast.info('Souřadnice uloženy, adresu se nepodařilo rozpoznat.');
      }
    } catch {
      toast.info('Souřadnice uloženy, adresa nenalezena.');
    }
  };

  const validateDraft = () => {
    const required = ['nadpis', 'popis', 'kategorie', 'ukon'];
    const newErrors = {};
    required.forEach((key) => {
      const value = formValues[key];
      if (key === 'popis') {
        if (!value || stripHtml(value) === '') newErrors[key] = 'Popis je povinný';
      } else if (!value && value !== 0) {
        newErrors[key] = 'Toto pole je povinné';
      }
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (stav) => {
    const valid = stav === 'Rozpracovaný' ? validateDraft() : validateForm();
    if (!valid) {
      toast.error('Vyplňte prosím povinná pole.');
      return;
    }
    setIsLoading(true);
    axios.defaults.withCredentials = true;
    try {
      const payload = {
        userId: userData.id, ...formValues,
        cenaPerHa: Number(formValues.cenaPerHa), ha: Number(formValues.ha), stav,
      };
      const { data } = await axios.post(`${backendUrl}/api/inzerat/createInzerat`, payload);
      if (data.success) {
        toast.success(stav === 'Rozpracovaný' ? 'Koncept uložen.' : 'Zakázka odeslána ke schválení.');
        if (selectedFiles.length > 0) {
          const formData = new FormData();
          selectedFiles.forEach((file) => formData.append('files', file));
          formData.append('userId', userData.id);
          formData.append('inzeratId', data.id);
          try {
            const uploadRes = await axios.post(`${backendUrl}/api/image/upload-multiple`, formData, {
              headers: { 'Content-Type': 'multipart/form-data' },
            });
            if (uploadRes.data.success) {
              setUploadedImages(uploadRes.data.images);
              setSelectedFiles([]);
              if (fileInputRef.current) fileInputRef.current.value = null;
            }
          } catch { toast.error('Chyba při nahrávání obrázků.'); }
        }
        navigate('/mojenabidky');
      }
    } catch { toast.error('Chyba při ukládání inzerátu.'); }
    finally { setIsLoading(false); }
  };

  const onFormSubmit = (e) => {
    e.preventDefault();
    if (step < 4) handleNext();
    else handleSubmit();
  };

  const reverseGeocode = async (lat, lon) => {
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}&accept-language=cs`;
    const res = await fetch(url, { headers: { 'User-Agent': 'AgrarApp/1.0' } });
    if (!res.ok) throw new Error('Reverse geocoding failed');
    const data = await res.json();
    const a = data.address || {};
    const stat = a.country || '';
    const rawKraj = a.state || a.county || a.region || '';
    const mesto = a.city || a.town || a.village || a.municipality || '';
    return { stat, kraj: rawKraj, mesto };
  };

  const position = formValues.location
    ? [formValues.location.coordinates[1], formValues.location.coordinates[0]]
    : null;

  const currentMeta = stepMeta[step - 1];
  const StepIcon = currentMeta.icon;

  // ── STEP RENDERS ──
  const renderStep = () => {
    if (step === 1) {
      return (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1.5">{labels.nadpis}</label>
            <input
              type="text" name="nadpis" value={formValues.nadpis}
              onChange={handleInputChange} placeholder="Zadejte název zakázky"
              className={`${inputClass} ${errors.nadpis ? 'border-red-400' : ''}`}
            />
            {errors.nadpis && <p className="text-red-500 text-sm mt-1">{errors.nadpis}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1.5">{labels.popis}</label>
            <ReactQuill
              theme="snow" value={formValues.popis}
              onChange={(value) => setFormValues((prev) => ({ ...prev, popis: value }))}
              placeholder="Zadejte popis zakázky (stručná charakteristika)..."
              modules={quillModules} formats={quillFormats}
            />
            {errors.popis && <p className="text-red-500 text-sm mt-1">{errors.popis}</p>}
          </div>
        </div>
      );
    }

    if (step === 2) {
      const ukonyForSelected = formValues.kategorie ? kategorieToUkon[formValues.kategorie] || [] : [];
      return (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1.5">{labels.kategorie}</label>
            <select name="kategorie" value={formValues.kategorie} onChange={handleInputChange}
              className={`${inputClass} ${errors.kategorie ? 'border-red-400' : ''}`}>
              <option value="">Vyberte kategorii</option>
              {kategorieOptions.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
            {errors.kategorie && <p className="text-red-500 text-sm mt-1">{errors.kategorie}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1.5">{labels.ukon}</label>
            <select name="ukon" value={formValues.ukon} onChange={handleInputChange}
              disabled={!formValues.kategorie}
              className={`${inputClass} ${errors.ukon ? 'border-red-400' : ''} ${!formValues.kategorie ? 'bg-gray-100 cursor-not-allowed' : ''}`}>
              <option value="">{formValues.kategorie ? 'Vyberte úkon' : 'Nejprve vyberte kategorii'}</option>
              {ukonyForSelected.map((u) => <option key={u} value={u}>{u}</option>)}
            </select>
            {errors.ukon && <p className="text-red-500 text-sm mt-1">{errors.ukon}</p>}
          </div>
        </div>
      );
    }

    if (step === 3) {
      const totalPrice = formValues.cenaPerHa && formValues.ha
        ? (Number(formValues.cenaPerHa) * Number(formValues.ha)).toLocaleString('cs-CZ') : null;
      return (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1.5">{labels.cenaType}</label>
            <select name="cenaType" value={formValues.cenaType} onChange={handleInputChange}
              className={`${inputClass} ${errors.cenaType ? 'border-red-400' : ''}`}>
              <option value="">Vyberte fakturační množství</option>
              {cenaTypeOptions.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
            {errors.cenaType && <p className="text-red-500 text-sm mt-1">{errors.cenaType}</p>}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1.5">{labels.cenaPerHa}</label>
              <input type="number" name="cenaPerHa" value={formValues.cenaPerHa}
                onChange={handleInputChange} placeholder="Cena"
                className={`${inputClass} ${errors.cenaPerHa ? 'border-red-400' : ''}`} />
              {errors.cenaPerHa && <p className="text-red-500 text-sm mt-1">{errors.cenaPerHa}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1.5">{labels.ha}</label>
              <input type="number" name="ha" value={formValues.ha}
                onChange={handleInputChange} placeholder="Množství"
                className={`${inputClass} ${errors.ha ? 'border-red-400' : ''}`} />
              {errors.ha && <p className="text-red-500 text-sm mt-1">{errors.ha}</p>}
            </div>
          </div>
          {totalPrice && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-xl text-center">
              <span className="text-sm text-gray-600">Orientační cena: </span>
              <span className="font-bold text-green-700 text-lg">{totalPrice} Kč</span>
            </div>
          )}
        </div>
      );
    }

    // Step 4
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1.5">{labels.stat}</label>
            <select name="stat" value={formValues.stat} onChange={handleInputChange}
              className={`${inputClass} ${errors.stat ? 'border-red-400' : ''}`}>
              <option value="">Vyberte stát</option>
              {statOptions.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
            {errors.stat && <p className="text-red-500 text-sm mt-1">{errors.stat}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1.5">{labels.kraj}</label>
            <select name="kraj" value={formValues.kraj} onChange={handleInputChange}
              disabled={!formValues.stat}
              className={`${inputClass} ${errors.kraj ? 'border-red-400' : ''} ${!formValues.stat ? 'bg-gray-100 cursor-not-allowed' : ''}`}>
              <option value="">{formValues.stat ? 'Vyberte kraj' : 'Nejprve vyberte stát'}</option>
              {krajOptions.map((k) => <option key={k} value={k}>{k}</option>)}
            </select>
            {errors.kraj && <p className="text-red-500 text-sm mt-1">{errors.kraj}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1.5">{labels.mesto}</label>
            <input type="text" name="mesto" value={formValues.mesto} onChange={handleInputChange}
              placeholder="Zadejte město"
              className={`${inputClass} ${errors.mesto ? 'border-red-400' : ''}`} />
            {errors.mesto && <p className="text-red-500 text-sm mt-1">{errors.mesto}</p>}
          </div>
        </div>

        {/* Mapa */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <p className="text-sm text-gray-500">Klikněte do mapy pro nastavení polohy</p>
            <button type="button" onClick={handleGeoDetect}
              className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-xl text-sm transition">
              <MapPinIcon className="h-4 w-4" /> Moje poloha
            </button>
          </div>
          <div className="rounded-xl overflow-hidden border border-gray-200">
            <MapContainer center={position || [49.8175, 15.473]} zoom={7} style={{ height: '400px', width: '100%' }}>
              <TileLayer attribution='&copy; Esri'
                url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" />
              <TileLayer url="https://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}.png" />
              {krajBoundaries && <GeoJSON data={krajBoundaries} style={boundaryStyle} />}
              <LocationMarker onMapClick={handleMapClick} />
              {position && <Marker position={position} />}
            </MapContainer>
          </div>
          {formValues.location && (
            <p className="text-xs text-gray-400 mt-2">
              Lat: {formValues.location.coordinates[1].toFixed(6)} · Lng: {formValues.location.coordinates[0].toFixed(6)}
            </p>
          )}
        </div>

        {/* Obrázky */}
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1.5">Obrázky k zakázce</label>
          <button type="button" onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-xl shadow-sm hover:bg-blue-700 transition text-sm font-medium">
            <ArrowUpOnSquareIcon className="w-5 h-5" /> Vybrat soubory
          </button>
          <input type="file" multiple ref={fileInputRef}
            onChange={(e) => setSelectedFiles([...e.target.files])} className="hidden" />
          {selectedFiles.length > 0 && (
            <p className="mt-2 text-sm text-gray-500">{selectedFiles.length} souborů vybráno</p>
          )}
          {uploadedImages.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mt-4">
              {uploadedImages.map((img) => (
                <div key={img._id} className="rounded-xl overflow-hidden border border-gray-100">
                  <img src={`${backendUrl}/${img.path.replace(/\\/g, '/')}`}
                    alt={img.nazev} className="w-full h-36 object-cover" />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  if (!userData) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-200 to-amber-100">
        <Navbar />
        <div className="flex items-center justify-center min-h-[70vh]">
          <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-200 to-amber-100">
      <Navbar />
      <div className="pt-24 pb-16 px-4">
        <div className="max-w-3xl mx-auto">

          {/* Hlavička */}
          <div className="text-center mb-8">
            <motion.h1
              className="text-2xl font-bold text-gray-800"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              Vytvoření zakázky
            </motion.h1>
          </div>

          {/* Stepper */}
          <div className="flex items-center justify-center gap-2 mb-8">
            {stepMeta.map((s, i) => {
              const Icon = s.icon;
              const isActive = step === s.num;
              const isDone = step > s.num;
              return (
                <React.Fragment key={s.num}>
                  <div className="flex flex-col items-center gap-1">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                      isActive ? 'bg-green-600 text-white shadow-md scale-110'
                        : isDone ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-400'
                    }`}>
                      {isDone ? <CheckIcon className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                    </div>
                    <span className={`text-[11px] hidden sm:block ${isActive ? 'text-green-700 font-medium' : 'text-gray-400'}`}>
                      {s.title}
                    </span>
                  </div>
                  {i < stepMeta.length - 1 && (
                    <div className={`w-8 h-0.5 mt-[-16px] sm:mt-[-24px] ${isDone ? 'bg-green-400' : 'bg-gray-200'}`} />
                  )}
                </React.Fragment>
              );
            })}
          </div>

          {/* Karta s formulářem */}
          <motion.form
            noValidate
            onSubmit={onFormSubmit}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8">
              <h2 className="flex items-center gap-2 text-sm font-bold text-gray-700 uppercase tracking-wide mb-5">
                <StepIcon className="h-4 w-4 text-green-600" />
                {currentMeta.title}
              </h2>
              {renderStep()}
            </div>

            {/* Navigace */}
            <div className="flex justify-between gap-3 mt-6">
              <button
                type="button" onClick={handleBack} disabled={step === 1}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl border font-medium text-sm transition
                  ${step === 1 ? 'opacity-40 cursor-not-allowed border-gray-200 text-gray-300'
                    : 'border-gray-200 text-gray-700 bg-white hover:bg-gray-50 shadow-sm'}`}
              >
                <ArrowLeftIcon className="h-4 w-4" /> Zpět
              </button>

              <div className="flex gap-3">
                {step >= 2 && (
                  <motion.button type="button" whileTap={{ scale: 0.97 }} disabled={isLoading}
                    onClick={() => handleSubmit('Rozpracovaný')}
                    className="flex items-center gap-2 bg-white border border-gray-200 text-gray-700 font-medium px-5 py-2.5 rounded-xl shadow-sm hover:bg-gray-50 transition text-sm disabled:opacity-50">
                    <BookmarkIcon className="h-4 w-4" /> Rozpracované
                  </motion.button>
                )}

                {step < 4 ? (
                  <motion.button type="button" whileTap={{ scale: 0.97 }} onClick={handleNext}
                    className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-medium px-6 py-2.5 rounded-xl shadow-sm transition text-sm">
                    Pokračovat <ArrowRightIcon className="h-4 w-4" />
                  </motion.button>
                ) : (
                  <motion.button type="button" whileTap={{ scale: 0.97 }} disabled={isLoading}
                    onClick={() => handleSubmit('Čeká na schválení')}
                    className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-medium px-6 py-2.5 rounded-xl shadow-sm transition text-sm disabled:opacity-50">
                    <CheckIcon className="h-4 w-4" />
                    {isLoading ? 'Odesílám...' : 'Odeslat ke schválení'}
                  </motion.button>
                )}
              </div>
            </div>
          </motion.form>
        </div>
      </div>
    </div>
  );
};

export default CreateInzerat;
