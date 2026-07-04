import React, { useContext, useState, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AppContent } from '../context/AppContext';
import axios from 'axios';
import { toast } from 'react-toastify';
import Navbar from '../components/navbar';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import {
  CheckIcon, XMarkIcon, ArrowUpOnSquareIcon, TrashIcon, ArrowLeftIcon,
  DocumentTextIcon, TagIcon, CurrencyDollarIcon, MapPinIcon, PhotoIcon
} from '@heroicons/react/24/solid';
import { motion } from 'framer-motion';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { MapContainer, TileLayer, Marker, useMapEvents, GeoJSON } from 'react-leaflet';
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { kategorieToUkon, kategorieOptions } from '../constants/categories';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const stripHtml = (html) => {
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  return (tmp.textContent || tmp.innerText || '').trim();
};

const getChangedFields = (original, current) => {
  const changes = {};
  Object.keys(current).forEach((key) => {
    const orig = original[key];
    const curr = current[key];
    if (key === "popis") {
      if (stripHtml(orig || "") !== stripHtml(curr || "")) changes[key] = curr;
      return;
    }
    if (String(orig ?? "") !== String(curr ?? "")) changes[key] = curr;
  });
  return changes;
};

// ── Sekce karta ──
const Section = ({ icon: Icon, title, children }) => (
  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
    <h2 className="flex items-center gap-2 text-sm font-bold text-gray-700 uppercase tracking-wide mb-4">
      <Icon className="h-4 w-4 text-green-600" />
      {title}
    </h2>
    {children}
  </div>
);

const inputClass = "w-full border border-gray-200 rounded-xl px-3 py-2.5 text-gray-700 focus:ring-2 focus:ring-green-500 focus:outline-none transition";

const EditInzerat = () => {
  const { inzeratId } = useParams();
  const navigate = useNavigate();
  const { backendUrl, userData } = useContext(AppContent);
  const [inzeratitemData, setInzeratItemData] = useState(null);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploadedImages, setUploadedImages] = useState([]);
  const fileInputRef = useRef(null);
  const [errors, setErrors] = useState({});
  const [totalPrice, setTotalPrice] = useState(0);
  const [position, setPosition] = useState(null);
  const [krajBoundaries, setKrajBoundaries] = useState(null);

  const [formValues, setFormValues] = useState({
    nadpis: '', popis: '', kategorie: '', ukon: '', cenaType: 'ha',
    cenaPerHa: '', ha: '', stat: '', kraj: '', mesto: '', location: null,
  });

  useEffect(() => {
    fetch('/kraje.geojson.json')
      .then((r) => r.json())
      .then((data) => setKrajBoundaries(data))
      .catch((err) => console.warn('Hranice krajů:', err));
  }, []);

  const boundaryStyle = { color: '#ffffff', weight: 1.5, opacity: 0.7, fillOpacity: 0, dashArray: '8, 5' };
  const numericFields = ['cenaPerHa', 'ha'];
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
  const cenaTypeOptions = [
    { value: 'ha', label: 'Kč/ha (za hektar)' },
    { value: 'h', label: 'Kč/h (za hodinu)' },
    { value: 'kg', label: 'Kč/kg (za kilogram)' },
    { value: 't', label: 'Kč/t (za tunu)' },
  ];

  const labels = {
    nadpis: 'Název zakázky', popis: 'Popis zakázky', kategorie: 'Kategorie', ukon: 'Úkon',
    cenaType: 'Fakturační množství', cenaPerHa: 'Cena za množství', ha: 'Množství',
    stat: 'Stát', kraj: 'Kraj', mesto: 'Město / oblast',
  };

  useEffect(() => {
    axios.get(`${backendUrl}/api/inzerat/getInzerat?inzeratId=${inzeratId}`, { withCredentials: true })
      .then(async (res) => {
        if (res.data.success) {
          setInzeratItemData(res.data.inzeratData);
          try {
            const imgRes = await axios.get(`${backendUrl}/api/image/byInzerat/${inzeratId}`);
            setUploadedImages(imgRes.data.success ? imgRes.data.images : []);
          } catch { setUploadedImages([]); }
        } else {
          toast.error('Inzerát nenalezen');
          navigate('/');
        }
      })
      .catch((err) => {
        console.error('❌ Chyba při načítání inzerátu:', err);
        toast.error('Nepodařilo se načíst inzerát');
        navigate('/');
      });
  }, [inzeratId, backendUrl, navigate]);

  useEffect(() => {
    if (inzeratitemData) {
      const filled = {
        nadpis: inzeratitemData.nadpis || '',
        popis: inzeratitemData.popis || '',
        kategorie: inzeratitemData.kategorie || '',
        ukon: inzeratitemData.ukon || '',
        cenaType: inzeratitemData.cenaType ?? 'ha',
        cenaPerHa: inzeratitemData.cenaPerHa ?? '',
        ha: inzeratitemData.ha ?? '',
        stat: inzeratitemData.stat || '',
        kraj: inzeratitemData.kraj || '',
        mesto: inzeratitemData.mesto || '',
        location: inzeratitemData.location || null,
      };
      setFormValues(filled);
      if (inzeratitemData.location?.coordinates) {
        const [lng, lat] = inzeratitemData.location.coordinates;
        setPosition([lat, lng]);
      }
      setTotalPrice(Number(filled.cenaPerHa || 0) * Number(filled.ha || 0));
    }
  }, [inzeratitemData]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    const numeric = ['cenaPerHa', 'ha'].includes(name);
    const updatedValue = numeric ? (value === '' ? '' : Number(value)) : value;

    setFormValues((prev) => {
      const newValues = {
        ...prev,
        [name]: updatedValue,
        ...(name === 'stat' ? { kraj: '', mesto: '' } : {}),
        ...(name === 'kategorie' ? { ukon: '' } : {}),
      };
      setTotalPrice(Number(newValues.cenaPerHa || 0) * Number(newValues.ha || 0));
      return newValues;
    });

    setErrors((prev) => ({ ...prev, [name]: '' }));
    if (name === 'stat') setErrors((prev) => ({ ...prev, kraj: '', mesto: '' }));
    if (name === 'kategorie') setErrors((prev) => ({ ...prev, ukon: '' }));
  };

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

  const MySwal = withReactContent(Swal);

  const handleDeleteImage = async (imageId) => {
    const result = await MySwal.fire({
      title: 'Opravdu smazat obrázek?',
      text: 'Tato akce je nevratná.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Ano, smazat',
      cancelButtonText: 'Zrušit',
    });
    if (!result.isConfirmed) return;
    try {
      const { data } = await axios.delete(`${backendUrl}/api/image/${imageId}`);
      if (data.success) {
        toast.success('Obrázek byl smazán.');
        setUploadedImages((prev) => prev.filter((img) => img._id !== imageId));
      } else toast.error('Smazání obrázku selhalo.');
    } catch (err) {
      console.error(err);
      toast.error('Chyba při mazání obrázku.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const changes = getChangedFields(inzeratitemData, formValues);
    if (Object.keys(changes).length === 0 && selectedFiles.length === 0) {
      toast.info("Neprovedli jste žádné změny.");
      return;
    }

    try {
      const { data } = await axios.post(
        `${backendUrl}/api/inzeratRequest/requestInzeratChange`,
        {
          inzeratId,
          newData: {
            ...changes,
            cenaPerHa: Number(changes.cenaPerHa ?? formValues.cenaPerHa),
            ha: Number(changes.ha ?? formValues.ha),
            location: position
              ? { type: "Point", coordinates: [position[1], position[0]] }
              : null
          }
        },
        { withCredentials: true }
      );
      if (data.success) {
        toast.success("Změny byly odeslány ke schválení.");
        if (selectedFiles.length > 0) {
          const formData = new FormData();
          selectedFiles.forEach((file) => formData.append("files", file));
          formData.append("inzeratId", inzeratId);
          formData.append("userId", userData.id);
          await axios.post(`${backendUrl}/api/image/upload-multiple`, formData, { withCredentials: true });
        }
        navigate(`/inzerat/${inzeratId}`);
      } else toast.error(data.message);
    } catch (err) {
      console.error(err);
      toast.error("Chyba při odesílání změn ke schválení.");
    }
  };

  const MapClickHandler = () => {
    useMapEvents({
      click(e) {
        const { lat, lng } = e.latlng;
        setPosition([lat, lng]);
      }
    });
    return null;
  };

  const isPending = inzeratitemData?.stav === "Čeká na schválení";

  if (!inzeratitemData) {
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

          {/* Horní lišta */}
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => navigate(`/inzerat/${inzeratId}`)}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition"
            >
              <ArrowLeftIcon className="h-5 w-5" />
              <span className="text-sm font-medium">Zpět</span>
            </button>
            <h1 className="text-2xl font-bold text-gray-800">Editace zakázky</h1>
            <div className="w-16" />
          </div>

          {/* Upozornění na pending */}
          {isPending && (
            <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-2xl text-yellow-800 text-sm flex items-center gap-2">
              <span className="text-lg">⏳</span>
              Tento inzerát má změny čekající na schválení. Ukládání je dočasně vypnuto.
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Základní info */}
            <Section icon={DocumentTextIcon} title="Základní informace">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1.5">{labels.nadpis}</label>
                  <input
                    type="text" name="nadpis" value={formValues.nadpis}
                    onChange={handleInputChange} placeholder="Zadejte název zakázky"
                    className={inputClass}
                  />
                  {errors.nadpis && <p className="text-red-500 text-sm mt-1">{errors.nadpis}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1.5">{labels.popis}</label>
                  <ReactQuill
                    theme="snow"
                    value={formValues.popis}
                    onChange={(value) => setFormValues((prev) => ({ ...prev, popis: value }))}
                  />
                  {errors.popis && <p className="text-red-500 text-sm mt-1">{errors.popis}</p>}
                </div>
              </div>
            </Section>

            {/* Kategorie */}
            <Section icon={TagIcon} title="Kategorie a úkon">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1.5">{labels.kategorie}</label>
                  <select name="kategorie" value={formValues.kategorie} onChange={handleInputChange} className={inputClass}>
                    <option value="">Vyberte kategorii</option>
                    {kategorieOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                  </select>
                  {errors.kategorie && <p className="text-red-500 text-sm mt-1">{errors.kategorie}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1.5">{labels.ukon}</label>
                  <select name="ukon" value={formValues.ukon} onChange={handleInputChange}
                    disabled={!formValues.kategorie}
                    className={`${inputClass} ${!formValues.kategorie ? 'bg-gray-100 cursor-not-allowed' : ''}`}>
                    <option value="">{formValues.kategorie ? 'Vyberte úkon' : 'Nejprve vyberte kategorii'}</option>
                    {(kategorieToUkon[formValues.kategorie] || []).map((option) => <option key={option} value={option}>{option}</option>)}
                  </select>
                  {errors.ukon && <p className="text-red-500 text-sm mt-1">{errors.ukon}</p>}
                </div>
              </div>
            </Section>

            {/* Cena */}
            <Section icon={CurrencyDollarIcon} title="Cena a množství">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1.5">{labels.cenaPerHa}</label>
                  <input type="number" name="cenaPerHa" value={formValues.cenaPerHa}
                    onChange={handleInputChange} placeholder="Cena" className={inputClass} />
                  {errors.cenaPerHa && <p className="text-red-500 text-sm mt-1">{errors.cenaPerHa}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1.5">{labels.ha}</label>
                  <input type="number" name="ha" value={formValues.ha}
                    onChange={handleInputChange} placeholder="Množství" className={inputClass} />
                  {errors.ha && <p className="text-red-500 text-sm mt-1">{errors.ha}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1.5">{labels.cenaType}</label>
                  <select name="cenaType" value={formValues.cenaType} onChange={handleInputChange} className={inputClass}>
                    <option value="">Vyberte jednotku</option>
                    {cenaTypeOptions.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                  </select>
                  {errors.cenaType && <p className="text-red-500 text-sm mt-1">{errors.cenaType}</p>}
                </div>
              </div>
              <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-xl text-center">
                <span className="text-sm text-gray-600">Celková cena: </span>
                <span className="font-bold text-green-700 text-lg">
                  {isNaN(totalPrice) ? "—" : totalPrice.toLocaleString("cs-CZ")} Kč
                </span>
              </div>
            </Section>

            {/* Lokalita */}
            <Section icon={MapPinIcon} title="Lokalita">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1.5">{labels.stat}</label>
                  <select name="stat" value={formValues.stat} onChange={handleInputChange} className={inputClass}>
                    <option value="">Vyberte stát</option>
                    {statOptions.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                  {errors.stat && <p className="text-red-500 text-sm mt-1">{errors.stat}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1.5">{labels.kraj}</label>
                  <select name="kraj" value={formValues.kraj} onChange={handleInputChange}
                    disabled={!formValues.stat}
                    className={`${inputClass} ${!formValues.stat ? 'bg-gray-100 cursor-not-allowed' : ''}`}>
                    <option value="">{formValues.stat ? 'Vyberte kraj' : 'Nejprve vyberte stát'}</option>
                    {krajOptions.map((k) => <option key={k} value={k}>{k}</option>)}
                  </select>
                  {errors.kraj && <p className="text-red-500 text-sm mt-1">{errors.kraj}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1.5">{labels.mesto}</label>
                  <input type="text" name="mesto" value={formValues.mesto}
                    onChange={handleInputChange} placeholder="Zadejte město" className={inputClass} />
                  {errors.mesto && <p className="text-red-500 text-sm mt-1">{errors.mesto}</p>}
                </div>
              </div>

              <p className="text-sm text-gray-500 mb-2">Klikněte do mapy pro nastavení polohy</p>
              <div className="rounded-xl overflow-hidden border border-gray-200">
                <MapContainer center={position || [49.8175, 15.473]} zoom={7} style={{ height: "400px", width: "100%" }}>
                  <TileLayer attribution='&copy; Esri'
                    url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" />
                  <TileLayer url="https://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}.png" />
                  {krajBoundaries && <GeoJSON data={krajBoundaries} style={boundaryStyle} />}
                  <MapClickHandler />
                  {position && <Marker position={position} />}
                </MapContainer>
              </div>
              {position && (
                <p className="text-xs text-gray-400 mt-2">
                  Lat: {position[0].toFixed(6)} · Lng: {position[1].toFixed(6)}
                </p>
              )}
            </Section>

            {/* Obrázky */}
            <Section icon={PhotoIcon} title="Obrázky">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-xl shadow-sm hover:bg-blue-700 transition text-sm font-medium"
              >
                <ArrowUpOnSquareIcon className="w-5 h-5" />
                Vybrat soubory
              </button>
              <input type="file" multiple ref={fileInputRef}
                onChange={(e) => setSelectedFiles([...e.target.files])} className="hidden" />
              {selectedFiles.length > 0 && (
                <p className="mt-2 text-sm text-gray-500">{selectedFiles.length} souborů vybráno</p>
              )}

              {uploadedImages.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mt-4">
                  {uploadedImages.map((img) => (
                    <div key={img._id} className="relative rounded-xl overflow-hidden border border-gray-100 group">
                      <button
                        type="button"
                        onClick={() => handleDeleteImage(img._id)}
                        className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition shadow-sm"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                      <img src={`${backendUrl}/${img.path.replace(/\\/g, '/')}`}
                        alt={img.nazev} className="w-full h-36 object-cover" />
                    </div>
                  ))}
                </div>
              )}
            </Section>

            {/* Akce */}
            <div className="flex justify-between gap-3 pt-2">
              <motion.button
                type="button"
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate("/")}
                className="flex items-center gap-2 bg-white border border-gray-200 text-gray-700 px-5 py-2.5 rounded-xl shadow-sm hover:bg-gray-50 transition font-medium"
              >
                <XMarkIcon className="w-5 h-5" />
                Zrušit
              </motion.button>

              <motion.button
                type="submit"
                whileTap={{ scale: isPending ? 1 : 0.97 }}
                disabled={isPending}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl shadow-sm transition font-medium
                  ${isPending
                    ? "bg-gray-300 cursor-not-allowed text-gray-500"
                    : "bg-green-600 text-white hover:bg-green-700"}`}
              >
                <CheckIcon className="w-5 h-5" />
                Uložit změny
              </motion.button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditInzerat;
