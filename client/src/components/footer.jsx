import { PhoneIcon, EyeIcon } from '@heroicons/react/24/solid';
import { FaInstagram, FaFacebookF } from 'react-icons/fa';

export default function Footer() {
  return (
    <footer className="bg-green-800 text-white py-10 px-6 lg:px-16  shadow-inner">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        
        {/* Sloupec 1 */}
        <div>
          <h3 className="text-lg font-semibold mb-4 text-green-300">O AgroPortalu</h3>
          <ul className="space-y-2 text-sm text-gray-200">
            <li><a href="#" className="hover:text-green-400 transition">Novinky</a></li>
            <li><a href="#" className="hover:text-green-400 transition">Naše služby</a></li>
            <li><a href="#" className="hover:text-green-400 transition">Pravidla zpracování údajů</a></li>
            <li><a href="#" className="hover:text-green-400 transition">Záruka kvality</a></li>
            <li><a href="#" className="hover:text-green-400 transition">Výběrové řízení</a></li>
          </ul>
        </div>

        {/* Sloupec 2 */}
        <div>
          <h3 className="text-lg font-semibold mb-4 text-green-300">Nápověda</h3>
          <ul className="space-y-2 text-sm text-gray-200">
            <li><a href="#" className="hover:text-green-400 transition">Jak to funguje</a></li>
            <li><a href="#" className="hover:text-green-400 transition">Jak připravit nabídku</a></li>
            <li><a href="#" className="hover:text-green-400 transition">Obchodní podmínky</a></li>
            <li><a href="#" className="hover:text-green-400 transition">Veřejné zakázky</a></li>
            <li><a href="#" className="hover:text-green-400 transition">FAQ</a></li>
          </ul>
        </div>

        {/* Sloupec 3 */}
        <div>
          <h3 className="text-lg font-semibold mb-4 text-green-300">Odkazy</h3>
          <ul className="space-y-2 text-sm text-gray-200">
            <li><a href="#" className="hover:text-green-400 transition">Mapa webu</a></li>
            <li><a href="#" className="hover:text-green-400 transition">Kontakty</a></li>
            <li><a href="#" className="hover:text-green-400 transition">O nás</a></li>
            <li><a href="#" className="hover:text-green-400 transition">Kariéra</a></li>
            <li><a href="#" className="hover:text-green-400 transition">Garance spokojenosti</a></li>
          </ul>
        </div>

        {/* Sloupec 4 */}
        <div className="flex flex-col gap-4">
          <div className="flex items-start gap-2">
            <PhoneIcon className="w-6 h-6 text-green-400 mt-1" />
            <div>
              <p className="font-semibold text-green-300">Infolinka</p>
              <p className="text-lg font-bold text-white">601 601 581</p>
              <p className="text-sm text-gray-300">Po–Pá 8:00–17:00</p>
            </div>
          </div>

          <div className="flex items-center gap-3 mt-4">
            <EyeIcon className="w-6 h-6 text-green-400" />
            <span className="font-semibold text-green-300">Sledujte nás:</span>
          </div>
          <div className="flex gap-4 ml-8">
            <a href="#" className="text-gray-300 hover:text-green-400 transition">
              <FaInstagram size={20} />
            </a>
            <a href="#" className="text-gray-300 hover:text-green-400 transition">
              <FaFacebookF size={20} />
            </a>
          </div>
        </div>

      </div>

      <div className="border-t border-green-700 mt-10 pt-4 text-center text-sm text-gray-300">
        © {new Date().getFullYear()} <span className="text-green-300 font-semibold">AgroZakázky</span>. Všechna práva vyhrazena.
      </div>
    </footer>
  );
}
