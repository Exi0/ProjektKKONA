import axios from 'axios';
import { createContext, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { connectSocket, disconnectSocket } from "../services/socketService";

export const AppContent = createContext();

export const AppContentProvider = (props) => {
  axios.defaults.withCredentials = true;
  const backendUrl = import.meta.env.VITE_BACKEND_URL;

  const [isLoggedin, setIsLoggedin] = useState(false);
  const [userData, setUserData] = useState(null);
  const [inzeratData, setInzeratData] = useState([]);
  const [inzeratItemData, setInzeratItemData] = useState(null);
  const [userinzeratItemsData, setUserInzeratItemsData] = useState([]);

  const getAuthState = async () => {
    try {
      const { data } = await axios.get(`${backendUrl}/api/auth/isAuth`);
      if (data.success) {
        setIsLoggedin(true);
        getUserData();
      } else {
        setIsLoggedin(false);
        setUserData(null);
      }
    } catch (error) {
      console.warn("❌ Auth kontrola selhala:", error.message);
      setIsLoggedin(false);
    }
  };

  const getUserData = async () => {
    try {
      const { data } = await axios.get(`${backendUrl}/api/user/data`);
      if (data.success) setUserData(data.userData);
    } catch (error) {
      toast.error(error.message);
    }
  };
const refreshUserData = async () => {
  try {
    const res = await axios.get(`${backendUrl}/api/user/data`, { withCredentials: true });
    if (res.data.success) {
      setUserData(res.data.userData);
    }
  } catch (err) {
    console.error("refreshUserData error:", err);
  }
};

  const getInzeratData = async () => {
    try {
      const { data } = await axios.get(`${backendUrl}/api/inzerat/getInzeraty`);
      if (data.success) setInzeratData(data.inzeratData);
    } catch (error) {
      toast.error(error.message);
    }
  };

const getUserInzeratsData = async (userId) => {
  try {
    if (!userId) return;

    const { data } = await axios.get(`${backendUrl}/api/inzerat/getUserInzerats?userId=${userId}`);
    if (data.success) {
      setUserInzeratItemsData(data.inzeratData);
    } else {
      toast.error(data.message);
    }
  } catch (error) {
    toast.error(error.message);
  }
};


  const getInzeratItemData = async (inzeratId) => {
    try {
      const { data } = await axios.get(`${backendUrl}/api/inzerat/getInzerat?inzeratId=${inzeratId}`);
      if (data.success) setInzeratItemData(data.inzeratData);
    } catch (error) {
      toast.error(error.message);
    }
  };

  useEffect(() => {
    // nejdřív zjistíme, jestli je user přihlášený
    getAuthState();
  }, []);

  useEffect(() => {
    // když se uživatel přihlásí
    if (isLoggedin) {
        getUserData();
        getInzeratData();
    }
  }, [isLoggedin]);
  // V useEffect kde se nastaví userData:
  useEffect(() => {
    if (userData?.id) {
      connectSocket(userData.id);
    }
    return () => disconnectSocket();
  }, [userData?.id]);
  useEffect(() => {
    // když se načtou userData → teprve pak stáhneme jeho inzeráty
    if (userData?.id || userData?._id) {
        const userId = userData.id || userData._id;
        getUserInzeratsData(userId);
    }
  }, [userData]);


  const value = {
    backendUrl,
    isLoggedin,
    userData,
    inzeratData,
    inzeratItemData,
    userinzeratItemsData,
    setIsLoggedin,
    setUserData,
    getAuthState,
    getUserData,
    getInzeratData,
    getInzeratItemData,
    getUserInzeratsData,
    refreshUserData
  };

  return (
    <AppContent.Provider value={value}>
      {props.children}
    </AppContent.Provider>
  );
};