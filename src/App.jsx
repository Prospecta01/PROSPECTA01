import { Navigate, Route, Routes } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'
import { ROLES } from './lib/constants'
import LoginPage from './pages/LoginPage'
import NotFoundPage from './pages/NotFoundPage'
import HomePage from './pages/prospector/HomePage'
import StartDayPage from './pages/prospector/StartDayPage'
import VisitPage from './pages/prospector/VisitPage'
import EndDayPage from './pages/prospector/EndDayPage'
import DailyProgressPage from './pages/prospector/DailyProgressPage'
import SupervisorDashboard from './pages/supervisor/SupervisorDashboard'
import AdminDashboard from './pages/admin/AdminDashboard'
import UserManagementPage from './pages/admin/UserManagementPage'
import AdminDatabasesPage from './pages/admin/AdminDatabasesPage'
import AdminBaseLoadsPage from './pages/admin/AdminBaseLoadsPage'
import ValidatorHomePage from './pages/validator/ValidatorHomePage'
import ValidatorStartDayPage from './pages/validator/ValidatorStartDayPage'
import ValidatorEndDayPage from './pages/validator/ValidatorEndDayPage'
import ValidatorProgressPage from './pages/validator/ValidatorProgressPage'
import CoordinatorSuccessfulVisitsPage from './pages/coordinator/CoordinatorSuccessfulVisitsPage'
import { useAuth } from './context/AuthContext'

function RootRedirect(){
  const {user,loading}=useAuth();if(loading)return null;if(!user)return <Navigate to="/login" replace/>
  if(user.rol===ROLES.ADMIN)return <Navigate to="/admin" replace/>
  if(user.rol===ROLES.SUPERVISOR)return <Navigate to="/supervisor" replace/>
  if(user.rol===ROLES.REGIONAL_COORDINATOR)return <Navigate to="/coordinador" replace/>
  if(user.rol===ROLES.VALIDATOR)return <Navigate to="/validador" replace/>
  return <Navigate to="/prospector" replace/>
}
const protect=(roles,element)=><ProtectedRoute roles={roles}>{element}</ProtectedRoute>
export default function App(){return <Routes>
  <Route path="/" element={<RootRedirect/>}/><Route path="/login" element={<LoginPage/>}/>
  <Route path="/prospector" element={protect([ROLES.PROSPECTOR],<HomePage/>)}/><Route path="/prospector/inicio" element={protect([ROLES.PROSPECTOR],<StartDayPage/>)}/><Route path="/prospector/visitas" element={protect([ROLES.PROSPECTOR],<VisitPage/>)}/><Route path="/prospector/avance" element={protect([ROLES.PROSPECTOR],<DailyProgressPage/>)}/><Route path="/prospector/fin" element={protect([ROLES.PROSPECTOR],<EndDayPage/>)}/>
  <Route path="/supervisor" element={protect([ROLES.SUPERVISOR],<SupervisorDashboard/>)}/><Route path="/coordinador" element={protect([ROLES.REGIONAL_COORDINATOR],<SupervisorDashboard/>)}/><Route path="/coordinador/altas" element={protect([ROLES.REGIONAL_COORDINATOR],<CoordinatorSuccessfulVisitsPage/>)}/>
  <Route path="/validador" element={protect([ROLES.VALIDATOR],<ValidatorHomePage/>)}/><Route path="/validador/inicio" element={protect([ROLES.VALIDATOR],<ValidatorStartDayPage/>)}/><Route path="/validador/fin" element={protect([ROLES.VALIDATOR],<ValidatorEndDayPage/>)}/><Route path="/validador/avance" element={protect([ROLES.VALIDATOR],<ValidatorProgressPage/>)}/>
  <Route path="/admin" element={protect([ROLES.ADMIN],<AdminDashboard/>)}/><Route path="/admin/usuarios" element={protect([ROLES.ADMIN],<UserManagementPage/>)}/><Route path="/admin/cargas" element={protect([ROLES.ADMIN],<AdminBaseLoadsPage/>)}/><Route path="/admin/bases" element={protect([ROLES.ADMIN],<AdminDatabasesPage/>)}/>
  <Route path="*" element={<NotFoundPage/>}/>
</Routes>}
