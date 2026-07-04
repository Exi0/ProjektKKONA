import { useEffect,useContext, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { AppContent } from '../context/AppContext';
import Navbar from '../components/navbar';
export default function ProfileChangeDetail() {
  const { changeId } = useParams();
  const navigate = useNavigate();
  const [reqData, setReqData] = useState(null);
  const {backendUrl,userData} = useContext(AppContent);
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
    const res = await axios.get(`${backendUrl}/api/requests/profilechangedetail/${changeId}`);
    console.log(res)
    setReqData(res.data.request);
  };

  const approve = async () => {
    await axios.post(`${backendUrl}/api/requests/profilechangedetail/${changeId}/approve`);
    navigate("/profilechangelist");
  };

  const reject = async () => {
    await axios.post(`${backendUrl}/api/requests/profilechangedetail/${changeId}/reject`);
    navigate("/profilechangelist");
  };

  if (!reqData) return <p>Loading...</p>;

  const { user, newData, oldData, avatarTemp, backgroundTemp } = reqData;

  const diffKeys = Object.keys(newData).filter(
    (key) => JSON.stringify(newData[key]) !== JSON.stringify(oldData[key])
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-200 to-amber-100">
    <div className="max-w-4xl mx-auto p-6">
    <Navbar/>
      <h1 className="text-3xl font-bold mb-6 text-green-700">
        Změna profilu – {user.name}
      </h1>

      <div className="grid grid-cols-2 gap-6">
        {diffKeys.map((key) => (
          <div className="bg-white p-4 rounded-xl shadow" key={key}>
            <h2 className="text-xl font-bold mb-2">{key}</h2>
            <p className="text-gray-500">
              <strong>Původní:</strong> {String(oldData[key] ?? "-")}
            </p>
            <p className="text-green-700">
              <strong>Nové:</strong> {String(newData[key] ?? "-")}
            </p>
          </div>
        ))}
      </div>

      {/* Obrázky */}
      <div className="mt-6 grid grid-cols-2 gap-6">
        {avatarTemp && (
          <div>
            <h3 className="font-semibold mb-2">Nový avatar</h3>
            <img
              src={`http://localhost:4000/${avatarTemp}`}
              className="rounded-xl shadow w-full"
            />
          </div>
        )}
        {backgroundTemp && (
          <div>
            <h3 className="font-semibold mb-2">Nové pozadí</h3>
            <img
              src={`http://localhost:4000/${backgroundTemp}`}
              className="rounded-xl shadow w-full"
            />
          </div>
        )}
      </div>

      {/* Buttons */}
      <div className="flex gap-4 mt-8">
        <button
          onClick={approve}
          className="px-6 py-3 rounded-xl bg-green-600 text-white font-bold hover:bg-green-700"
        >
          ✔ Schválit
        </button>

        <button
          onClick={reject}
          className="px-6 py-3 rounded-xl bg-red-500 text-white font-bold hover:bg-red-600"
        >
          ❌ Zamítnout
        </button>
      </div>
    </div>
    </div>
  );
}
