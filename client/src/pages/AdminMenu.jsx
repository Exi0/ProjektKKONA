import React, { useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/navbar";
import { toast } from "react-toastify";
import { AppContent } from "../context/AppContext";
import {
  PhotoIcon,
  ClipboardDocumentCheckIcon,
  DocumentTextIcon,
  ShieldCheckIcon,CameraIcon,
  ClipboardDocumentListIcon
} from "@heroicons/react/24/outline";

const AdminMenu = () => {
  const navigate = useNavigate();
  const { userData } = useContext(AppContent);
  useEffect(() => {
      if (!userData) return; // počkej na načtení dat
      if (userData.role !== "admin") {
          toast.error("Nemáte oprávnění pro přístup k této stránce.");
          navigate(-1); // redirect zpět
      }
      }, [userData, navigate]);
  const cards = [
    {
      title: "Schvalování obrázků",
      desc: "Obrázky čekající na schválení",
      icon: PhotoIcon,
      path: "/admin/images"
    },
    {
      title: "Schvalování inzerátů",
      desc: "Změny inzerátů ke schválení",
      icon: ClipboardDocumentCheckIcon,
      path: "/admin/inzeraty"
    },
    {
      title: "Nové inzeráty ke schválení",
      desc: "Odsouhalsení nových inzerátů",
      icon: ClipboardDocumentListIcon,
      path: "/admin/inzeraty-ke-schvaleni"
    },
    {
      title: "Verifikace uživatelů",
      desc: "Kontrola a schválení účtů",
      icon: ShieldCheckIcon,
      path: "/admin/verifications"
    },
    {
      title: "Přehled / Dashboard",
      desc: "Statistiky a přehled systému",
      icon: DocumentTextIcon,
      path: "/admin/dashboard"
    }
    ,
    {
      title: "Přehled / Reporty",
      desc: " Nahlášené uživatele a obsah",
      icon: CameraIcon,
      path: "/admin/reports"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-200 to-amber-100">
      <Navbar />

      <div className="container mx-auto px-4 pt-28 pb-16">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">
          Administrace
        </h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {cards.map((card, idx) => {
            const Icon = card.icon;
            return (
              <div
                key={idx}
                onClick={() => navigate(card.path)}
                className="cursor-pointer bg-white rounded-xl shadow hover:shadow-lg transition p-6 flex flex-col gap-4"
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-8 h-8 text-green-700" />
                  <h2 className="text-lg font-semibold text-gray-800">
                    {card.title}
                  </h2>
                </div>

                <p className="text-sm text-gray-600">
                  {card.desc}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default AdminMenu;
