import React from "react";
import Navbar from "../components/navbar";

const About = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-green-200 to-amber-100 text-gray-800">
      <Navbar />

      <div className="container mx-auto px-6 pt-32 pb-20 max-w-4xl text-center">
        <h1 className="text-5xl font-extrabold text-green-900 mb-6">
          O nás 🌾
        </h1>

        <p className="text-lg leading-relaxed mb-6">
          <span className="font-semibold text-green-800">AgroZakázky</span> vznikly z potřeby propojit zemědělce, dodavatele a firmy na jednom místě. 
          Každý den se na poli rozhoduje o hodnotách, které ovlivňují nás všechny — proto chceme, 
          aby spolupráce v zemědělství byla jednodušší, přehlednější a férová.
        </p>

        <p className="text-lg leading-relaxed mb-6">
          Věříme, že nejcennější hodnotou pro zemědělce jsou <span className="font-semibold text-green-800">informace</span>.  
          Kdo ví, kdo pracuje poblíž, jaké služby nabízí a za jakých podmínek, 
          má výhodu, která šetří čas, náklady i energii.  
          AgroZakázky pomáhají tyto informace sdílet, porovnávat a využívat k tomu, 
          aby každý mohl dělat svou práci efektivněji.
        </p>

        <p className="text-lg leading-relaxed mb-6">
          Naším cílem je vytvořit prostředí, kde se zemědělci a poskytovatelé služeb potkávají bez prostředníků, 
          kde nabídka a poptávka fungují otevřeně, a kde se zkušenosti stávají nástrojem pokroku.  
          Proto přinášíme moderní platformu, která propojuje tradiční práci s novými technologiemi.
        </p>

        <blockquote className="italic text-2xl text-green-900 font-semibold my-10">
          „Informace jsou nová úroda. Sdílením rosteme všichni.“
        </blockquote>

        <p className="text-lg leading-relaxed mb-6">
          AgroZakázky jsou místem, kde se propojuje praxe, důvěra a technologie.  
          Místem, které vzniklo z potřeby dělat věci lépe — společně, s respektem k půdě i lidem, kteří na ní pracují.
        </p>

        <p className="text-lg text-gray-700 mt-8 font-medium">
          Děkujeme, že jste s námi.  
          <br />
          <span className="text-green-900 font-bold">Tým AgroZakázky</span>
        </p>
      </div>
    </div>
  );
};

export default About;
