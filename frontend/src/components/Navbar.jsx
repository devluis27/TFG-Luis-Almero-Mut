import { Link, useNavigate } from 'react-router-dom';
import { Activity, User, LogOut, LayoutDashboard } from 'lucide-react';

export default function Navbar() {
  const navigate = useNavigate();
  const token = localStorage.getItem('token'); // Verificamos si hay sesión

  const cerrarSesion = () => {
    localStorage.clear();
    navigate('/login');
  };

  return (
    <nav className="bg-white border-b-2 border-emerald-400/20 text-slate-800 shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          
          <Link to="/" className="flex items-center space-x-2 hover:opacity-80 transition">
            <Activity size={28} className="text-emerald-500" />
            <span className="font-bold text-xl tracking-tight text-slate-900">Detector Ángulo Cobb</span>
          </Link>

          <div className="flex items-center space-x-3">
            {token ? (
              <>
                <Link to="/dashboard" className="flex items-center space-x-2 text-slate-600 hover:text-emerald-600 font-semibold px-3 transition">
                  <LayoutDashboard size={18} />
                  <span className="hidden sm:inline">Panel</span>
                </Link>

                <button 
                  onClick={cerrarSesion}
                  className="flex items-center space-x-2 bg-red-50 hover:bg-red-100 text-red-600 px-5 py-2 rounded-full transition font-semibold"
                >
                  <LogOut size={18} />
                  <span>Salir</span>
                </button>
              </>
            ) : (
              <>
                <Link to="/register" className="text-slate-600 hover:text-emerald-600 font-semibold px-3 transition">
                  Registrarse
                </Link>

                <Link to="/login" className="flex items-center space-x-2 bg-emerald-500 hover:bg-emerald-400 text-white px-5 py-2 rounded-full transition font-semibold shadow-md shadow-emerald-200">
                  <User size={18} />
                  <span>Iniciar Sesión</span>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}