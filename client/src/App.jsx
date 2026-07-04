import React from 'react'
import { Routes, Route} from 'react-router-dom'
import Login from './pages/Login'
import EmailVerify from './pages/EmailVerify'
import ResetPassword from './pages/ResetPassword'
import Home from './pages/Home'
import Inzeraty from './pages/Inzeraty'
import Inzerat from './pages/Inzerat'
import EditInzerat from './pages/EditInzerat'
import CreateInzerat from './pages/CreateInzerat'
import About from './pages/About'
import Kontakt from './pages/Kontakt'
import Profil from './pages/Profil'
import MojeZakazky from './pages/MojeZakazky'
import MojeNabidky from './pages/MojeNabidky'
import { ToastContainer } from 'react-toastify';
import EditProfil from './pages/EditProfil'
import OblibeneNabidky from './pages/OblibeneNabidky'
import TopUsers from './pages/TopUsers'
import AdminVerification from './pages/AdminVerifications'
import AdminReports from './pages/AdminReports'
import AdminDashboard from './pages/AdminDashboard'
import Footer from './components/footer';
import InzeratyKeSchvaleni from './pages/InzeratyKeSchvaleni';
import Subscription from './pages/Subscription'
import ProfileChangeList from './pages/ProfileChangeList'
import ProfileChangeDetail from './pages/ProfileChangeDetail'
import InzeratChangesApproval from './pages/InzeratChangesApproval';
import InzeratChangeDetail from './pages/InzeratChangeDetail'
import ApproveImages from './pages/ApproveImages';
import AdminMenu from './pages/AdminMenu';
import MapView from './pages/MapView'
import GDPR from './pages/GDPR'
import TERMS from './pages/Terms'
const App = ()=> {
  return(<div>
  <ToastContainer/>
    <Routes> 
      <Route path='/' element = {<Home/>}/>
      <Route path='/login' element = {<Login/>}/>
      <Route path='/about' element = {<About/>}/>
      <Route path='/kontakt' element = {<Kontakt/>}/>
      <Route path='/profil/:userId' element={<Profil />} />
      <Route path='/mojezakazky' element = {<MojeZakazky/>}/>
      <Route path='/mojenabidky' element = {<MojeNabidky/>}/>
      <Route path='/oblibenenabidky' element = {<OblibeneNabidky/>}/>
      <Route path='/email-verify' element = {<EmailVerify/>}/>
      <Route path='/reset-password' element = {<ResetPassword/>}/>
      <Route path='/inzeraty' element = {<Inzeraty/>}/>
      <Route path='/mapa' element = {<MapView/>}/>
      <Route path='/createInzerat' element = {<CreateInzerat/>}/>
      <Route path="/inzerat/:inzeratId" element={<Inzerat />} />
      <Route path='/editinzerat/:inzeratId' element = {<EditInzerat/>}/>
      <Route path='/editprofil' element = {<EditProfil/>}/>
      <Route path='/topusers' element = {<TopUsers/>}/>
      <Route path="/admin" element={<AdminMenu />} />
        <Route path="/admin/images" element={<ApproveImages />} />
        <Route path="/admin/inzeraty" element={<InzeratChangesApproval />} />
        <Route path="/admin/verifications" element={<AdminVerification />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/reports" element={<AdminReports />} />
        <Route path="/admin/inzeraty-ke-schvaleni" element={<InzeratyKeSchvaleni />} />
      <Route path="/subscription" element={<Subscription />} />
      <Route path="/profilechangelist" element={<ProfileChangeList />} />
      <Route path="/profilechangedetail/:changeId" element={<ProfileChangeDetail />} />
      <Route path="/inzeratChangeDetail/:requestId" element={<InzeratChangeDetail />} />
      <Route path="/gdpr" element={<GDPR />} />
      <Route path="/terms" element={<TERMS />} />
    </Routes>
    <Footer />
  </div>)
}

export default App