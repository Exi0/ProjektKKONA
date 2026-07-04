import React, { useContext, useState, useEffect } from "react";
import { AppContent } from "../context/AppContext";
import Navbar from "../components/navbar";
import axios from "axios";
import { toast } from "react-toastify";
import { motion } from "framer-motion";
import { FaCrown, FaClock } from "react-icons/fa";

const Subscription = () => {
  const { userData, setUserData, backendUrl } = useContext(AppContent);
  const [loading, setLoading] = useState(false);
  const [sub, setSub] = useState(null);

  useEffect(() => {
    if (userData?.subscription) {
      setSub(userData.subscription);
    }
  }, [userData]);
  const createCheckout = async () => {
    if (!userData?.id) return toast.error("Musíš být přihlášen");

    try {
      setLoading(true);

      const { data } = await axios.post(
        `${backendUrl}/api/payments/create-subscription-checkout`,
        {},
        { withCredentials: true }
      );
      if (data.url) {
        window.location.href = data.url;
      } else {
        toast.error("Nepodařilo se vytvořit Stripe checkout");
      }
    } catch {
      toast.error("Chyba při komunikaci se serverem");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-200 to-amber-100">
      <Navbar />

      <div className="pt-24 pb-24 flex flex-col items-center">
        <motion.div
          className="bg-white shadow-2xl rounded-lg w-full max-w-xl p-8 text-center"
          initial={{ opacity: 0, scale: 0.95, y: -20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <h1 className="text-3xl font-bold text-green-800 flex items-center justify-center gap-2 mb-4">
            <FaCrown className="text-yellow-500" />
            Předplatné
          </h1>

          {/* INFO O PŘEDPLATNÉM */}
          {sub?.hasSubscription ? (
            <div className="bg-green-50 border border-green-300 rounded-lg p-4 mb-6">
              <p className="text-lg font-semibold text-green-700">
                Máte aktivní {sub.type === "premium" ? "Premium" : "Basic"} ⭐
              </p>

              {sub.expiresAt && (
                <div className="flex justify-center items-center gap-2 mt-2 text-gray-700">
                  <FaClock />
                  <span>
                    Platné do{" "}
                    <b>
                      {new Date(sub.expiresAt).toLocaleDateString("cs-CZ")}
                    </b>
                  </span>
                </div>
              )}
            </div>
          ) : (
            <p className="text-gray-700 mb-6">
              Nemáte žádné aktivní předplatné.
            </p>
          )}

          {/* TLAČÍTKO PREMIUM */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={createCheckout}
            disabled={loading}
            className="bg-yellow-500 hover:bg-yellow-600 text-white font-semibold py-3 px-6 rounded-full shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Aktivuji..." : "Aktivovat Premium (30 dní)"}
          </motion.button>
        </motion.div>
      </div>
    </div>
  );
};

export default Subscription;
