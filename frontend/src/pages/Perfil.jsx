import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { User, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

export default function Perfil() {
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    nombre: '',
    apellidos: '',
    correo: '',
    telefono: '',
    fecha_nacimiento: ''
  });
  const [cargando, setCargando] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [mensaje, setMensaje] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const usuarioId = localStorage.getItem('usuario_id');
    
    if (!token || !usuarioId) {
      navigate('/login');
      return;
    }

    const cargarInformacion = async () => {
      try {
        const respuesta = await axios.get(`http://127.0.0.1:8000/usuario/${usuarioId}`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        
        setFormData({
          nombre: respuesta.data.nombre || '',
          apellidos: respuesta.data.apellidos || '',
          correo: respuesta.data.correo || '',
          telefono: respuesta.data.telefono || '',
          fecha_nacimiento: respuesta.data.fecha_nacimiento || ''
        });
      } catch (err) {
        setError("No se pudo conectar con el servidor para obtener tu perfil.");
        console.error("Error en la carga:", err);
      } finally {
        setCargando(false);
      }
    };

    cargarInformacion();
  }, [navigate]);

  const manejarCambio = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const guardarCambios = async (e) => {
    e.preventDefault();
    setEnviando(true);
    setMensaje(null);
    setError(null);

    const token = localStorage.getItem('token');
    const usuarioId = localStorage.getItem('usuario_id');

    try {
      const respuesta = await axios.put(
        `http://127.0.0.1:8000/actualizar-perfil/${usuarioId}`, 
        formData,
        {
          headers: { 
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          }
        }
      );

      setMensaje("Información actualizada con éxito.");
      
      if (respuesta.data.nombre) {
        localStorage.setItem('nombre', respuesta.data.nombre);
        window.dispatchEvent(new Event("storage"));
      }
    } catch (err) {
      setError("Error al intentar actualizar los datos.");
      console.error("Error al guardar:", err);
    } finally {
      setEnviando(false);
    }
  };

  if (cargando) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-emerald-500">
        <Loader2 className="animate-spin mb-4" size={40} />
        <p className="font-bold text-slate-500">Cargando perfil médico...</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 sm:px-0">
      <header className="mb-8 relative">
        <h1 className="text-4xl font-black text-slate-900 mb-2">Configuración de Cuenta</h1>
        <div className="h-1.5 w-16 bg-emerald-500 rounded-full mb-3"></div>
        <p className="text-slate-500 font-medium">Gestiona tu información personal y datos de contacto.</p>
      </header>

      <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-100">
        
        {mensaje && (
          <div className="mb-8 p-4 bg-emerald-50 text-emerald-700 rounded-2xl flex items-center text-sm font-bold border border-emerald-200 shadow-sm animate-in fade-in zoom-in duration-300">
            <CheckCircle2 size={20} className="mr-3 text-emerald-500" /> {mensaje}
          </div>
        )}
        
        {error && (
          <div className="mb-8 p-4 bg-red-50 text-red-600 rounded-2xl flex items-center text-sm font-bold border border-red-200 shadow-sm animate-in fade-in zoom-in duration-300">
            <AlertCircle size={20} className="mr-3 text-red-500" /> {error}
          </div>
        )}

        <div className="flex items-center space-x-4 mb-8 pb-6 border-b border-slate-50">
          <div className="bg-emerald-100 p-4 rounded-full text-emerald-600">
            <User size={40} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-800">{formData.nombre || 'Usuario'}</h2>
          </div>
        </div>

        <form onSubmit={guardarCambios} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="group">
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1 transition-colors group-focus-within:text-emerald-600">
                Nombre
              </label>
              <input 
                name="nombre"
                type="text" 
                value={formData.nombre || ''}
                onChange={manejarCambio}
                required
                className="w-full p-4 bg-slate-50 border border-slate-100 border-l-4 border-l-transparent rounded-2xl focus:border-l-emerald-500 focus:bg-white focus:shadow-md outline-none transition-all font-semibold text-slate-700 hover:bg-slate-100/50" 
              />
            </div>
            
            <div className="group">
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1 transition-colors group-focus-within:text-emerald-600">
                Apellidos
              </label>
              <input 
                name="apellidos"
                type="text" 
                value={formData.apellidos || ''}
                onChange={manejarCambio}
                required
                className="w-full p-4 bg-slate-50 border border-slate-100 border-l-4 border-l-transparent rounded-2xl focus:border-l-emerald-500 focus:bg-white focus:shadow-md outline-none transition-all font-semibold text-slate-700 hover:bg-slate-100/50" 
              />
            </div>
          </div>

          <div className="group">
            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1 transition-colors group-focus-within:text-emerald-600">
              Correo Electrónico
            </label>
            <input 
              name="correo"
              type="email" 
              value={formData.correo || ''}
              onChange={manejarCambio}
              required
              className="w-full p-4 bg-slate-50 border border-slate-100 border-l-4 border-l-transparent rounded-2xl focus:border-l-emerald-500 focus:bg-white focus:shadow-md outline-none transition-all font-semibold text-slate-700 hover:bg-slate-100/50" 
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="group">
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1 transition-colors group-focus-within:text-emerald-600">
                Teléfono de Contacto
              </label>
              <input 
                name="telefono"
                type="tel" 
                value={formData.telefono || ''}
                onChange={manejarCambio}
                placeholder="No registrado"
                className="w-full p-4 bg-slate-50 border border-slate-100 border-l-4 border-l-transparent rounded-2xl focus:border-l-emerald-500 focus:bg-white focus:shadow-md outline-none transition-all font-semibold text-slate-700 hover:bg-slate-100/50" 
              />
            </div>

            <div className="group">
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1 transition-colors group-focus-within:text-emerald-600">
                Fecha de Nacimiento
              </label>
              <input 
                name="fecha_nacimiento"
                type="date" 
                value={formData.fecha_nacimiento || ''}
                onChange={manejarCambio}
                className="w-full p-4 bg-slate-50 border border-slate-100 border-l-4 border-l-transparent rounded-2xl focus:border-l-emerald-500 focus:bg-white focus:shadow-md outline-none transition-all font-semibold text-slate-700 hover:bg-slate-100/50" 
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={enviando}
            className={`w-full font-black py-4 rounded-2xl transition-all shadow-lg flex items-center justify-center space-x-2 mt-4 ${
              enviando 
              ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
              : 'bg-emerald-500 text-white hover:bg-emerald-400 shadow-emerald-200'
            }`}
          >
            {enviando ? <Loader2 className="animate-spin" size={20} /> : "Actualizar Información"}
          </button>
        </form>
      </div>
    </div>
  );
}