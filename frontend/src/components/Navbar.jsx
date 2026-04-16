import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
// FÍJATE AQUÍ: He añadido 'Clock' a la importación
import { Activity, User, LogOut, LayoutDashboard, ChevronDown, Clock } from 'lucide-react';

export default function Navbar() {
  const navigate = useNavigate();
  // Estado para controlar si el desplegable está visible
  const [menuAbierto, setMenuAbierto] = useState(false);
  
  const token = localStorage.getItem('token'); 
  const nombre = localStorage.getItem('nombre'); 

  const cerrarSesion = () => {
    localStorage.clear();
    navigate('/login');
  };

  return (
    <nav className="bg-white border-b-2 border-emerald-400/20 text-slate-800 shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2 hover:opacity-80 transition">
            <Activity size={28} className="text-emerald-500" />
            <span className="font-bold text-xl tracking-tight text-slate-900">Detector Ángulo Cobb</span>
          </Link>

          <div className="flex items-center space-x-3">
            {token ? (
              <div className="relative">
                {/* Botón del Usuario que abre el menú */}
                <button 
                  onClick={() => setMenuAbierto(!menuAbierto)}
                  className="flex items-center space-x-2 bg-emerald-50 text-emerald-700 px-4 py-2 rounded-xl font-bold hover:bg-emerald-100 transition"
                >
                  <User size={18} />
                  <span className="hidden sm:inline">{nombre || 'Doctor'}</span>
                  <ChevronDown size={16} className={`transition-transform ${menuAbierto ? 'rotate-180' : ''}`} />
                </button>

                {/* Menú Desplegable */}
                {menuAbierto && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden z-50">
                    <Link 
                      to="/dashboard" 
                      onClick={() => setMenuAbierto(false)}
                      className="flex items-center space-x-3 px-4 py-3 text-sm text-slate-600 hover:bg-slate-50 hover:text-emerald-600 transition"
                    >
                      <LayoutDashboard size={18} />
                      <span className="font-semibold">Panel de Análisis</span>
                    </Link>
                    
                    <Link 
                      to="/perfil" 
                      onClick={() => setMenuAbierto(false)}
                      className="flex items-center space-x-3 px-4 py-3 text-sm text-slate-600 hover:bg-slate-50 hover:text-emerald-600 transition"
                    >
                      <User size={18} />
                      <span className="font-semibold">Mi Perfil</span>
                    </Link>
                    
                    <Link 
                      to="/historial" 
                      onClick={() => setMenuAbierto(false)}
                      className="flex items-center space-x-3 px-4 py-3 text-sm text-slate-600 hover:bg-slate-50 hover:text-emerald-600 transition"
                    >
                      <Clock size={18} className="text-slate-400" />
                      <span className="font-semibold">Historial de Mediciones</span>
                    </Link>

                    <div className="border-t border-slate-100"></div>

                    <button 
                      onClick={() => { setMenuAbierto(false); cerrarSesion(); }}
                      className="w-full flex items-center space-x-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition"
                    >
                      <LogOut size={18} />
                      <span className="font-semibold">Cerrar Sesión</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                {/* Botones para usuarios no logueados */}
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