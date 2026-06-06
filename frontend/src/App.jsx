import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Perfil from './pages/Perfil';
import Historial from './pages/Historial';
import LaboratorioManual from './pages/LaboratorioManual';
import { AnalisisProvider } from './context/AnalisisContext';

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-[#fcfdfc] font-sans selection:bg-emerald-200 text-slate-900">
        <Navbar />
        <AnalisisProvider>
          <main className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/perfil" element={<Perfil />} />
              <Route path="/historial" element={<Historial />} />
              <Route path="/laboratorio" element={<LaboratorioManual />} />
            </Routes>
          </main>
        </AnalisisProvider>
      </div>
    </BrowserRouter>
  );
}

export default App;