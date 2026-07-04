import React from "react";
import Navbar from "../components/navbar";

const TERMS = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-green-200 to-amber-100">
      <Navbar />
      <div className="max-w-4xl mx-auto p-6 pt-28">
        <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-xl p-8">
          <h1 className="text-3xl font-bold mb-6 text-green-800">
            Obchodní podmínky
          </h1>

          <div className="space-y-4 text-gray-700">
            <p>
              Tyto obchodní podmínky upravují používání služby AgroZakázky a vztah
              mezi provozovatelem služby a uživatelem.
            </p>

            <h2 className="text-xl font-semibold text-green-700">
              1. Používání služby
            </h2>
            <p>
              Uživatel se zavazuje používat službu v souladu s právními předpisy a
              dobrými mravy.
            </p>

            <h2 className="text-xl font-semibold text-green-700">
              2. Registrace účtu
            </h2>
            <p>
              Pro využívání některých funkcí je nutná registrace uživatelského účtu.
              Uživatel odpovídá za správnost uvedených údajů.
            </p>

            <h2 className="text-xl font-semibold text-green-700">
              3. Platby a služby
            </h2>
            <p>
              Některé služby mohou být zpoplatněny. Cena je vždy uvedena před
              potvrzením objednávky.
            </p>

            <h2 className="text-xl font-semibold text-green-700">
              4. Omezení odpovědnosti
            </h2>
            <p>
              Provozovatel nenese odpovědnost za škody vzniklé používáním služby,
              pokud to právní předpisy umožňují.
            </p>

            <h2 className="text-xl font-semibold text-green-700">
              5. Změny podmínek
            </h2>
            <p>
              Provozovatel si vyhrazuje právo tyto podmínky kdykoliv změnit.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TERMS;