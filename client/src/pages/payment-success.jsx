import { useContext, useEffect } from "react";
import { AppContent } from "../context/AppContext";
import { useNavigate } from "react-router-dom";
import Navbar from '../components/navbar';
export default function PaymentSuccess() {
  const { refreshUserData } = useContext(AppContent);
  const navigate = useNavigate();

  useEffect(() => {
    refreshUserData().then(() => {
      navigate(-1); // vrátí na profil
    });
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-200 to-amber-100">
      <Navbar />
    <div className="p-10 text-center">
      <h1 className="text-3xl">✅ Platba proběhla úspěšně</h1>
      <p>Odemknutí profilu bylo aktivováno.</p>
    </div>
    </div>
  );
}