import React, { useContext, useState, useRef, useEffect } from 'react';
import Navbar from '../components/navbar';
import { AppContent } from '../context/AppContext';
import { motion } from 'framer-motion';
import { FaSave, FaArrowLeft, FaUserCircle, FaUpload, FaTrash, FaPlus, FaMinus } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';

const categories = ['Orba', 'Sečení', 'Hnojení', 'Sklizeň', 'Přeprava', 'Jiné'];
const phonePrefixes = ['+420', '+421', '+43', '+49', '+48', '+36']; // add more if you want
const kategorieOptions = [
  "Základní zpracování půdy",
  "Předseťová příprava půdy",
  "Setí a výsadba",
  "Aplikace hnojiv a organických látek",
  "Ochrana rostlin",
  "Sklizeň hlavních polních plodin",
  "Sklizeň pícnin a objemných krmiv",
  "Lisování, balení a manipulace",
  "Nakládací technika",
  "Doprava a přeprava",
  "Ostatní technologické služby",
  "Precizní zemědělství",
  "Lesnictví",
];
const EditProfil = () => {
  const { userData, backendUrl, getUserData } = useContext(AppContent);
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const avatarInputRef = useRef(null);
  const backgroundInputRef = useRef(null);
  const [specializace, setSpecializace] = useState([]);
  const [avatar, setAvatar] = useState(null);
  const [background, setBackground] = useState(null);
  const [currentAvatar, setCurrentAvatar] = useState(userData?.avatarPath || '');
  const [currentBackground, setCurrentBackground] = useState(userData?.backgroundPath || '');
  const [existingImages, setExistingImages] = useState([]);
  const [form, setForm] = useState({
    name: '',
    email: '',
    ico: '',
    location: '',
    description: '',
  });

  // Phones are managed separately as [{ code: '+420', number: '123456789' }, ...]
  const [phones, setPhones] = useState([{ code: '+420', number: '' }]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedFiles, setSelectedFiles] = useState([]);

  // ----- helpers -----
  const parsePhoneToParts = (p) => {
    const s = String(p || '').trim();
    const m = s.match(/^(\+\d{1,3})\s*(.*)$/); // "+420 123..." -> ["+420 123...", "+420", "123..."]
    if (m) return { code: m[1], number: m[2] || '' };
    // if no prefix present, default to +420
    return { code: '+420', number: s };
  };

  // hydrate UI with userData
  useEffect(() => {
    if (userData) {
      setCurrentAvatar(userData.avatarPath || '');
      setCurrentBackground(userData.backgroundPath || '');
      setSpecializace(userData.specializace || []); // předešlé specializace
      setForm((prev) => ({
        ...prev,
        name: userData.name || '',
        email: userData.email || '',
        ico: userData.ico || '',
        location: userData.location || '',
        description: userData.description || '',
      }));

      // phones as array of strings -> convert to [{code, number}]
      const arr = Array.isArray(userData.phone) ? userData.phone : (userData.phone ? [userData.phone] : []);
      if (arr.length) {
        setPhones(arr.map(parsePhoneToParts));
      } else {
        setPhones([{ code: '+420', number: '' }]);
      }
    }
  }, [userData]);

  // load existing categorized images
  useEffect(() => {
    if (userData?.id) {
      axios
        .get(`${backendUrl}/api/image/byUser/${userData.id}`)
        .then((res) => {
          if (res.data.success) {
            const categorized = res.data.images.filter((img) => !!img.category);
            setExistingImages(categorized);
          }
        })
        .catch(() => toast.error('Nepodařilo se načíst obrázky.'));
    }
  }, [userData, backendUrl]);
  const toggleSpecializace = (cat) => {
    setSpecializace((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageSelect = (e, type) => {
    const file = e.target.files[0];
    if (!file) return;
    const preview = URL.createObjectURL(file);
    if (type === 'avatar') {
      setAvatar({ file, preview });
    } else {
      setBackground({ file, preview });
    }
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files).map((file) => ({
      file,
      preview: URL.createObjectURL(file),
      category: selectedCategory,
    }));
    setSelectedFiles((prev) => [...prev, ...files]);
    fileInputRef.current.value = null;
  };

  const handleRemoveImage = (index) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // ----- phones UI handlers -----
  const addPhoneRow = () => {
    setPhones((prev) => [...prev, { code: '+420', number: '' }]);
  };

  const removePhoneRow = (idx) => {
    setPhones((prev) => prev.filter((_, i) => i !== idx));
  };

  const changePhoneCode = (idx, code) => {
    setPhones((prev) => prev.map((p, i) => (i === idx ? { ...p, code } : p)));
  };

  const changePhoneNumber = (idx, number) => {
    setPhones((prev) => prev.map((p, i) => (i === idx ? { ...p, number } : p)));
  };

  const handleDeleteExistingImage = async (id) => {
    try {
      const res = await axios.delete(`${backendUrl}/api/image/${id}`);
      if (res.data.success) {
        toast.success('Obrázek odstraněn');
        setExistingImages((prev) => prev.filter((img) => img._id !== id));
      } else {
        toast.error(res.data.message || 'Chyba při mazání');
      }
    } catch {
      toast.error('Chyba při komunikaci se serverem');
    }
  };

  const uploadProfileImage = async (file, type) => {
    const formData = new FormData();
    formData.append('files', file);
    formData.append('userId', userData.id);
    formData.append('type', type);
    try {
      const { data } = await axios.post(`${backendUrl}/api/image/upload-multiple`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return data;
    } catch (err) {
      console.error(err);
      toast.error(`Chyba při nahrávání ${type === 'avatar' ? 'profilové fotky' : 'pozadí'}`);
      return null;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      // avatar
      if (avatar) {
        const avatarRes = await uploadProfileImage(avatar.file, 'avatar');
        if (avatarRes?.updated?.avatarPath) setCurrentAvatar(avatarRes.updated.avatarPath);
        setAvatar(null);
      }
      // background
      if (background) {
        const backgroundRes = await uploadProfileImage(background.file, 'background');
        if (backgroundRes?.updated?.backgroundPath) setCurrentBackground(backgroundRes.updated.backgroundPath);
        setBackground(null);
      }

      // build phones to send (combine code + number)
      const phoneStrings = phones
        .map(({ code, number }) => `${code} ${String(number || '').trim()}`.trim())
        // keep only those that actually contain digits
        .filter((s) => /\d/.test(s));

      const formData = new FormData();
      formData.append('userId', userData.id);
      formData.append('name', form.name);
      formData.append('location', form.location);
      formData.append('description', form.description);
      // multiple phones
      phoneStrings.forEach((ph) => formData.append('phone[]', ph));
      // ✅ přidáme specializace
      specializace.forEach((s) => formData.append("specializace[]", s));
      const profileRes = await axios.post(`${backendUrl}/api/user/requestProfileChange`,formData,{
          headers: { 'Content-Type': 'multipart/form-data' },
          withCredentials: true,
        }
      );
      if (!profileRes.data.success) {
        toast.error(profileRes.data.message);
        return;
      }

      // categorized gallery upload
      if (selectedFiles.length > 0) {
        const imageFormData = new FormData();
        selectedFiles.forEach((item) => {
          imageFormData.append('files', item.file);
          imageFormData.append('category[]', item.category);
        });
        imageFormData.append('userId', userData.id);

        const uploadRes = await axios.post(`${backendUrl}/api/image/upload-multiple`, imageFormData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });

        if (uploadRes.data.success) {
          toast.success('Obrázky byly úspěšně nahrány.');
          setSelectedFiles([]);
        } else {
          toast.error('Nahrání obrázků selhalo.');
        }
      }

      toast.success('Profil byl úspěšně aktualizován!');
      await getUserData();
      navigate(`/profil/${userData.id}`);
    } catch (error) {
      console.error(error);
      toast.error('Chyba při ukládání změn.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-200 to-amber-100">
      <Navbar />
      <div className="flex justify-center pt-24 pb-24">
        <motion.div
          className="bg-white shadow-xl rounded-lg w-full max-w-3xl p-8"
          initial={{ opacity: 0, scale: 0.95, y: -20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <button
              onClick={() => navigate(`/profil/${userData.id}`)}
              className="flex items-center gap-2 text-green-700 hover:text-green-900"
            >
              <FaArrowLeft />
              Zpět na profil
            </button>
            <h1 className="text-2xl font-bold text-green-800">Upravit profil</h1>
          </div>

          {/* Avatar + Background side by side */}
          <div className="flex flex-col md:flex-row gap-6 mb-8">
            {/* Avatar */}
            <div className="w-full md:w-1/3 border border-gray-200 rounded-xl p-4 shadow-sm bg-gray-50 relative">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Profilová fotka</label>
              <div className="relative w-full h-40 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center">
                {avatar?.preview || currentAvatar ? (
                  <img
                    src={avatar?.preview || `${backendUrl}/${currentAvatar}`}
                    alt="Avatar"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <FaUserCircle className="text-green-400" size={64} />
                )}
                <button
                  type="button"
                  onClick={() => avatarInputRef.current?.click()}
                  className="absolute top-2 right-2 bg-green-600 text-white p-2 rounded-full shadow hover:bg-green-700"
                  title="Změnit profilovou fotku"
                >
                  <FaUpload />
                </button>
                <input
                  type="file"
                  accept="image/*"
                  ref={avatarInputRef}
                  onChange={(e) => handleImageSelect(e, 'avatar')}
                  className="hidden"
                />
              </div>
            </div>

            {/* Background */}
            <div className="w-full md:w-2/3 border border-gray-200 rounded-xl p-4 shadow-sm bg-gray-50 relative">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Pozadí profilu</label>
              <div className="relative w-full h-40 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center">
                {background?.preview || currentBackground ? (
                  <img
                    src={background?.preview || `${backendUrl}/${currentBackground}`}
                    alt="Pozadí"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-gray-400 text-sm font-medium">Pozadí profilu</span>
                )}
                <button
                  type="button"
                  onClick={() => backgroundInputRef.current?.click()}
                  className="absolute top-2 right-2 bg-green-600 text-white p-2 rounded-full shadow hover:bg-green-700"
                  title="Změnit pozadí"
                >
                  <FaUpload />
                </button>
                <input
                  type="file"
                  accept="image/*"
                  ref={backgroundInputRef}
                  onChange={(e) => handleImageSelect(e, 'background')}
                  className="hidden"
                />
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Name */}
            <div>
              <label className="block text-gray-700 font-medium mb-1">Jméno společnosti</label>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400"
              />
            </div>

            {/* Email (readonly) */}
            <div>
              <label className="block text-gray-700 font-medium mb-1">Email</label>
              <input
                type="email"
                name="email"
                value={form.email}
                readOnly
                className="w-full px-4 py-2 border rounded-lg bg-gray-100 text-gray-500 cursor-not-allowed"
              />
              <p className="text-xs text-gray-400 mt-1">Email nelze měnit</p>
            </div>

            {/* IČO (readonly) */}
            <div>
              <label className="block text-gray-700 font-medium mb-1">IČO</label>
              <input
                type="text"
                name="ico"
                value={form.ico}
                readOnly
                className="w-full px-4 py-2 border rounded-lg bg-gray-100 text-gray-500 cursor-not-allowed"
              />
              <p className="text-xs text-gray-400 mt-1">IČO nelze měnit</p>
            </div>

            {/* Phones (multiple) */}
            <div>
              <label className="block text-gray-700 font-medium mb-2">Telefony</label>
              <div className="space-y-3">
                {phones.map((p, idx) => (
                  <div key={idx} className="flex gap-2 items-center">
                    <select
                      className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400"
                      value={p.code}
                      onChange={(e) => changePhoneCode(idx, e.target.value)}
                    >
                      {phonePrefixes.map((pref) => (
                        <option key={pref} value={pref}>
                          {pref}
                        </option>
                      ))}
                    </select>
                    <input
                      type="tel"
                      placeholder="Telefonní číslo"
                      className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400"
                      value={p.number}
                      onChange={(e) => changePhoneNumber(idx, e.target.value)}
                    />
                    {phones.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removePhoneRow(idx)}
                        className="p-2 rounded-lg bg-red-100 hover:bg-red-200 text-red-600"
                        title="Odstranit"
                      >
                        <FaMinus />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addPhoneRow}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-green-100 hover:bg-green-200 text-green-700"
                >
                  <FaPlus /> Přidat telefon
                </button>
              </div>
            </div>

            {/* Location */}
            <div>
              <label className="block text-gray-700 font-medium mb-1">Lokalita</label>
              <input
                type="text"
                name="location"
                value={form.location}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-gray-700 font-medium mb-1">Popis společnosti</label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                rows="3"
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400"
              />
            </div>
            {/* ✅ Specializace */}
            <div>
              <label className="block text-gray-700 font-medium mb-2">
                Specializace
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {kategorieOptions.map((cat) => (
                  <label
                    key={cat}
                    className="flex items-center gap-2 px-3 py-2 border rounded-lg cursor-pointer hover:bg-green-50"
                  >
                    <input
                      type="checkbox"
                      checked={specializace.includes(cat)}
                      onChange={() => toggleSpecializace(cat)}
                      className="form-checkbox text-green-600"
                    />
                    <span>{cat}</span>
                  </label>
                ))}
              </div>
            </div>
            {/* Kategorie a Upload */}
            <div>
              <label className="block text-gray-700 font-medium mb-1">Kategorie strojů</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400"
              >
                <option value="">Vyber kategorii</option>
                {categories.map((cat, idx) => (
                  <option key={idx} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-1">Přidat obrázky</label>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded shadow"
              >
                <FaUpload />
                Vybrat soubory
              </button>
              <input
                type="file"
                multiple
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
              />
            </div>

            {/* Selected Images Preview */}
            {selectedFiles.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-4">
                {selectedFiles.map((item, idx) => (
                  <div key={idx} className="relative border rounded-lg overflow-hidden shadow">
                    <img src={item.preview} alt="Preview" className="w-full h-32 object-cover" />
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(idx)}
                      className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white p-1 rounded-full"
                    >
                      <FaTrash />
                    </button>
                    <p className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-xs text-white text-center py-1">
                      {item.category}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {/* EXISTING CATEGORY IMAGE CARDS */}
            {categories.map((cat) => {
              const imgs = existingImages.filter((img) => img.category === cat);
              if (imgs.length === 0) return null;
              return (
                <div key={cat} className="mb-6">
                  <h3 className="text-lg font-semibold text-green-800 mb-2">{cat}</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {imgs.map((img) => (
                      <div key={img._id} className="relative border rounded-lg overflow-hidden shadow">
                        <img
                          src={`${backendUrl}/${img.path}`}
                          alt={img.nazev}
                          className="w-full h-32 object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => handleDeleteExistingImage(img._id)}
                          className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white p-1 rounded-full"
                          title="Smazat"
                        >
                          <FaTrash />
                        </button>
                        <p className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-xs text-white text-center py-1">
                          {img.category}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}

            {/* Save Button */}
            <div className="flex justify-end">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                type="submit"
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-6 rounded-full shadow-md focus:outline-none focus:ring-4 focus:ring-green-300 transition-all"
              >
                <FaSave />
                Uložit změny
              </motion.button>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
};

export default EditProfil;
