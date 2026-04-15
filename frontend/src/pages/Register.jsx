import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

export default function Register() {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  const [formData, setFormData] = useState({
    nombre: '',
    apellidos: '',
    correo: '',
    telefono: '',
    password: ''
  });

  const manejarCambio = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const manejarRegistro = async (e) => {
    e.preventDefault();
    setError('');
    setCargando(true);

    try {
      const respuesta = await axios.post('http://localhost:8000/registro', formData);
      
      if (respuesta.status === 200) {
        // Registro exitoso, enviamos al login
        navigate('/login');
      }
    } catch (err) {
      if (err.response && err.response.data.detail) {
        setError(err.response.data.detail);
      } else {
        setError('Error al conectar con el servidor');
      }
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-[80vh] py-10">
      <div className="bg-white p-8 rounded-3xl shadow-xl border border-emerald-100 w-full max-w-lg">
        <h2 className="text-3xl font-black text-slate-900 mb-2 text-center">Crear Cuenta</h2>
        <p className="text-slate-500 text-center mb-8 text-sm">Regístrate para gestionar el historial de análisis</p>
        
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm font-medium text-center">
            {error}
          </div>
        )}

        <form onSubmit={manejarRegistro} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 ml-1">Nombre</label>
              <input 
                required
                name="nombre"
                type="text" 
                value={formData.nombre}
                onChange={manejarCambio}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none transition" 
                placeholder="Carlos" 
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 ml-1">Apellidos</label>
              <input 
                required
                name="apellidos"
                type="text" 
                value={formData.apellidos}
                onChange={manejarCambio}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none transition" 
                placeholder="Gimenez" 
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 ml-1">Correo Electrónico</label>
            <input 
              required
              name="correo"
              type="email" 
              value={formData.correo}
              onChange={manejarCambio}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none transition" 
              placeholder="ejemplo@correo.com" 
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 ml-1">Teléfono</label>
            <input 
              name="telefono"
              type="tel" 
              value={formData.telefono}
              onChange={manejarCambio}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none transition" 
              placeholder="+34 600 000 000" 
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 ml-1">Contraseña</label>
            <input 
              required
              name="password"
              type="password" 
              value={formData.password}
              onChange={manejarCambio}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none transition" 
              placeholder="••••••••" 
            />
          </div>
          
          <button 
            type="submit" 
            disabled={cargando}
            className={`w-full bg-emerald-500 hover:bg-emerald-400 text-white font-black py-4 rounded-2xl transition shadow-lg shadow-emerald-100 mt-6 ${cargando ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {cargando ? 'Creando cuenta...' : 'Completar Registro'}
          </button>
        </form>

        <div className="mt-8 pt-6 border-top border-slate-100 text-center">
          <p className="text-slate-500 text-sm">
            ¿Ya tienes una cuenta? {' '}
            <Link to="/login" className="text-emerald-600 font-bold hover:text-emerald-500 transition">
              Inicia sesión
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}