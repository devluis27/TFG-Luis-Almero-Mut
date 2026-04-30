import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  ScanLine, 
  Ruler, 
  Users, 
  UserCircle, 
  LogOut,
  Stethoscope
} from 'lucide-react';

export default function Sidebar() {
  const navigate = useNavigate();

  const cerrarSesion = () => {
    localStorage.clear();
    navigate('/login');
  };

  const menuItems = [
    { icon: <LayoutDashboard size={20} />, label: 'Dashboard', path: '/dashboard' },
    { icon: <ScanLine size={20} />, label: 'Análisis IA', path: '/analisis-ia' },
    { icon: <Ruler size={20} />, label: 'Laboratorio Manual', path: '/laboratorio' },
    { icon: <Users size={20} />, label: 'Pacientes', path: '/pacientes' },
    { icon: <UserCircle size={20} />, label: 'Mi Perfil', path: '/perfil' },
  ];

  return (
    <div className="w-64 bg-slate-900 h-screen sticky top-0 flex flex-col text-slate-300">
      {/* Logo / Título */}
      <div className="p-6 flex items-center space-x-3 text-white border-b border-slate-800">
        <div className="bg-emerald-500 p-2 rounded-xl">
          <Stethoscope size={24} className="text-white" />
        </div>
        <span className="font-black tracking-tight text-lg">SpineDetect IA</span>
      </div>

      {/* Navegación */}
      <nav className="flex-1 p-4 space-y-2 mt-4">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => 
              `flex items-center space-x-3 p-3 rounded-xl transition-all font-bold text-sm ${
                isActive 
                ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-900/20' 
                : 'hover:bg-slate-800 hover:text-white'
              }`
            }
          >
            {item.icon}
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Footer del Sidebar */}
      <div className="p-4 border-t border-slate-800">
        <button 
          onClick={cerrarSesion}
          className="flex items-center space-x-3 w-full p-3 rounded-xl hover:bg-red-500/10 hover:text-red-500 transition-colors font-bold text-sm"
        >
          <LogOut size={20} />
          <span>Cerrar Sesión</span>
        </button>
      </div>
    </div>
  );
}