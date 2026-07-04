import React from "react";
import Navbar from "../components/navbar";

const GDPR = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-green-200 to-amber-100">
      <Navbar />

      <div className="max-w-4xl mx-auto p-6 pt-28">
        <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-xl p-8">
          <h1 className="text-3xl font-bold mb-6 text-green-800">
            Zásady ochrany osobních údajů (GDPR)
          </h1>

          <div className="space-y-4 text-gray-700">
            <p>
              Tyto zásady ochrany osobních údajů popisují, jak služba AgroZakázky
              zpracovává a chrání osobní údaje uživatelů v souladu s GDPR.
            </p>

            <h2 className="text-xl font-semibold text-green-700">
              1. Jaké údaje zpracováváme
            </h2>
            <ul className="list-disc pl-6">
              <li>Identifikační údaje (jméno, název společnosti, IČ)</li>
              <li>Kontaktní údaje (email)</li>
              <li>Platební informace</li>
              <li>Technické údaje o používání služby</li>
            </ul>

            <h2 className="text-xl font-semibold text-green-700">
              2. Účel zpracování
            </h2>
            <ul className="list-disc pl-6">
              <li>poskytování služeb platformy</li>
              <li>zpracování plateb</li>
              <li>komunikace s uživateli</li>
              <li>zlepšování služeb</li>
            </ul>

            <h2 className="text-xl font-semibold text-green-700">
              3. Doba uchování údajů
            </h2>
            <p>
              Osobní údaje uchováváme pouze po dobu nezbytně nutnou pro poskytování
              služby nebo splnění zákonných povinností.
            </p>

            <h2 className="text-xl font-semibold text-green-700">
              4. Práva uživatele
            </h2>
            <ul className="list-disc pl-6">
              <li>právo na přístup k údajům</li>
              <li>právo na opravu údajů</li>
              <li>právo na výmaz údajů</li>
              <li>právo na omezení zpracování</li>
            </ul>

            <h2 className="text-xl font-semibold text-green-700">
              5. Kontakt
            </h2>
            <p>
              V případě dotazů ohledně ochrany osobních údajů nás kontaktujte na
              emailu: info@agrozakazky.cz
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GDPR;