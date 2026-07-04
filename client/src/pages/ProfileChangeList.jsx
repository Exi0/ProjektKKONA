import { useEffect, useState,useContext } from "react";
import { Link } from "react-router-dom";
import axios from 'axios';
import { AppContent } from '../context/AppContext';
import Navbar from '../components/navbar';
export default function ProfileChangeList() {
  const [requests, setRequests] = useState([]);
  const {backendUrl, userData} = useContext(AppContent);
  useEffect(() => {
        if (!userData) return; // počkej na načtení dat
        if (userData.role !== "admin") {
            toast.error("Nemáte oprávnění pro přístup k této stránce.");
            navigate(-1); // redirect zpět
        }
        }, [userData, navigate]);
  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    const res = await axios.get(`${backendUrl}/api/requests/profilechangelist`);
    console.log(res.data.requests)
    setRequests(res.data.requests);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-200 to-amber-100">
    <div className="max-w-4xl mx-auto pt-24 pb-24">
    <Navbar />
      <h1 className="text-3xl font-bold mb-6 text-green-700">Schválení změn profilů</h1>

      {requests.length === 0 && (
        <p className="text-gray-500 text-lg">Momentálně nejsou žádné žádosti.</p>
      )}

      <div className="space-y-4">
        {requests.map((req) => (
          <Link
            key={req._id}
            to={`/profilechangedetail/${req._id}`}
            className="block p-4 bg-white rounded-xl shadow hover:shadow-md transition"
          >
            <h2 className="text-xl font-semibold">{req.userId.name}</h2>
            <p className="text-gray-500 text-sm">Žádost: {new Date(req.createdAt).toLocaleString()}</p>
          </Link>
        ))}
      </div>
    </div>
    </div>
  );
}