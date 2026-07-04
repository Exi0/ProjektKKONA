import React, { useEffect, useState, useContext } from "react";
import axios from "axios";
import { AppContent } from "../context/AppContext";
import Navbar from "../components/navbar";
import { toast } from "react-toastify";
import { CheckIcon, XMarkIcon,ArrowLeftIcon } from "@heroicons/react/24/solid";
import { useNavigate } from "react-router-dom";

const ApproveImages = () => {
  const navigate = useNavigate();
  const { backendUrl, userData } = useContext(AppContent);
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fullscreenImage, setFullscreenImage] = useState(null);
  useEffect(() => {
        if (!userData) return; // počkej na načtení dat
        if (userData.role !== "admin") {
            toast.error("Nemáte oprávnění pro přístup k této stránce.");
            navigate(-1); // redirect zpět
        }
        }, [userData, navigate]);
  const fetchImages = async () => {
    try {
      const { data } = await axios.get(
        `${backendUrl}/api/image/getPendingImages`,
        { withCredentials: true }
      );
      console.log(data);
      if (data.success) {
        setImages(data.images);
      } else {
        toast.error(data.message);
      }
    } catch (err) {
      console.error(err);
      toast.error("Chyba při načítání obrázků");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchImages();
  }, []);
  useEffect(() => {
  const handleEsc = (e) => {
    if (e.key === "Escape") {
      setFullscreenImage(null);
    }
  };

  window.addEventListener("keydown", handleEsc);
  return () => window.removeEventListener("keydown", handleEsc);
}, []);

  const approveImage = async (imageId) => {
    try {
      const { data } = await axios.post(
        `${backendUrl}/api/image/approveImage/${imageId}`,
        { imageId },
        { withCredentials: true }
      );

      if (data.success) {
        toast.success("Obrázek schválen");
        setImages(prev => prev.filter(img => img._id !== imageId));
      } else {
        toast.error(data.message);
      }
    } catch (err) {
      console.error(err);
      toast.error("Chyba při schválení obrázku");
    }
  };

  const rejectImage = async (imageId) => {
    try {
      console.log("Rejecting image with ID (client):", imageId);
      const { data } = await axios.delete(
        `${backendUrl}/api/image/rejectImage/${imageId}`,
        { withCredentials: true }
      );
      console.log(data);
      if (data.success) {
        toast.info("Obrázek zamítnut a smazán");
        setImages(prev => prev.filter(img => img._id !== imageId));
      } else {
        toast.error(data.message);
      }
    } catch (err) {
      console.error(err);
      toast.error("Chyba při zamítnutí obrázku");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-200 to-amber-100">
      <Navbar />

      <div className="container mx-auto px-4 pt-28 pb-16">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <h1 className="text-3xl font-bold text-gray-800">
            Schvalování obrázků
          </h1>

          <button
            onClick={() => navigate("/admin")}
            className="flex items-center gap-2
                      bg-gray-600 text-white px-4 py-2 rounded-lg
                      hover:bg-gray-700 transition"
          >
            <ArrowLeftIcon className="w-5 h-5" />
            Zpět do admin menu
          </button>
        </div>
        {loading ? (
          <p>Načítání…</p>
        ) : images.length === 0 ? (
          <p className="text-gray-600">Žádné obrázky ke schválení 🎉</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {images.map(img => (
              <div
                key={img._id}
                className="bg-white rounded-xl shadow overflow-hidden"
              >
                <img
                  src={`${backendUrl}/${img.path.replace(/\\/g, "/")}`}
                  alt={img.nazev}
                  className="w-full h-48 object-cover cursor-pointer hover:opacity-90"
                  onClick={() =>
                    setFullscreenImage(`${backendUrl}/${img.path.replace(/\\/g, "/")}`)
                  }
                />

                <div className="p-3 space-y-2">
                  <p className="font-semibold text-sm">{img.nazev}</p>
                  {img.inzerat && (
                    <p className="text-xs text-gray-600">
                      Inzerát: {img.inzerat?.nadpis || img.inzerat}
                    </p>
                  )}
                  <p className="text-xs text-gray-600">Uloženo: {img.path}</p>
                  <div className="flex justify-between gap-2 mt-2">
                    <button
                      onClick={() => approveImage(img._id)}
                      className="flex items-center justify-center gap-1 flex-1 bg-green-600 text-white py-1 rounded hover:bg-green-700"
                    >
                      <CheckIcon className="w-4 h-4" />
                      Schválit
                    </button>

                    <button
                      onClick={() => rejectImage(img._id)}
                      className="flex items-center justify-center gap-1 flex-1 bg-red-600 text-white py-1 rounded hover:bg-red-700"
                    >
                      <XMarkIcon className="w-4 h-4" />
                      Zamítnout
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        {fullscreenImage && (
          <div
            className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center"
            onClick={() => setFullscreenImage(null)}
          >
            <img
              src={fullscreenImage}
              alt="Fullscreen"
              className="max-w-[95vw] max-h-[95vh] object-contain"
              onClick={(e) => e.stopPropagation()}
            />

            {/* zavírací křížek */}
            <button
              onClick={() => setFullscreenImage(null)}
              className="absolute top-5 right-5 flex items-center gap-2
                        text-white text-lg font-semibold
                        bg-black bg-opacity-40 hover:bg-opacity-60
                        px-3 py-2 rounded-lg transition"
            >
              <XMarkIcon className="w-6 h-6" />
              <span>Zavřít</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ApproveImages;
