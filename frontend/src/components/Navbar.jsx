import { Link } from 'react-router-dom';
import { Activity, User } from 'lucide-react';

export default function Navbar() {
  return (
    <nav className="bg-white border-b-2 border-emerald-400/20 text-slate-800 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <Link to="/" className="flex items-center space-x-2 hover:opacity-80 transition">
            <Activity size={28} className="text-emerald-500" />
            <span className="font-bold text-xl tracking-tight text-slate-900">Detector Ángulo Cobb</span>
          </Link>

          <div className="flex space-x-4">
            <Link to="/login" className="flex items-center space-x-2 bg-emerald-500 hover:bg-emerald-400 text-white px-5 py-2 rounded-full transition font-semibold shadow-md shadow-emerald-200">
              <User size={18} />
              <span>Iniciar Sesión</span>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}