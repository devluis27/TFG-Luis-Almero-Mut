import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Upload, Zap, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

export default function Dashboard() {
  const navigate = useNavigate();
  const [archivo, setArchivo] = useState(null);
  const [vistaPrevia, setVistaPrevia] = useState(null);
  const [imagenProcesada, setImagenProcesada] = useState(null); // <-- Estado para la imagen con marcas
  const [cargando, setCargando] = useState(false);
  const [resultado, setResultado] = useState(null);
  const [error, setError] = useState(null);
  const [nombreUsuario, setNombreUsuario] = useState('');

  // Verificación de sesión
  useEffect(() => {
    const token = localStorage.getItem('token');
    const nombre = localStorage.getItem('nombre');
    if (!token) {
      navigate('/login');
    } else {
      setNombreUsuario(nombre || 'Doctor');
    }
  }, [navigate]);

  const manejarCambioArchivo = (e) => {
    const file = e.target.files[0];
    if (file) {
      setArchivo(file);
      setVistaPrevia(URL.createObjectURL(file)); 
      setImagenProcesada(null); // Limpiamos la procesada si suben una nueva
      setResultado(null);
      setError(null);
    }
  };

  const limpiarTodo = () => {
    setArchivo(null); 
    setVistaPrevia(null); 
    setImagenProcesada(null);
    setResultado(null);
  };

  const analizarImagen = async () => {
    if (!archivo) return;

    setCargando(true);
    setError(null);

    const token = localStorage.getItem('token');
    const usuarioId = localStorage.getItem('usuario_id');

    const formData = new FormData();
    formData.append("file", archivo);

    try {
      const respuesta = await axios.post(`http://127.0.0.1:8000/analizar?usuario_id=${usuarioId}`, formData, {
        headers: { 
          "Content-Type": "multipart/form-data",
          "Authorization": `Bearer ${token}` 
        }
      });
      
      setResultado(respuesta.data);
      setImagenProcesada(respuesta.data.imagen_procesada); // <-- Guardamos la URL de la imagen que nos da FastAPI
    } catch (err) {
      if (err.response && err.response.status === 401) {
        setError("Sesión caducada. Por favor, vuelve a iniciar sesión.");
        localStorage.clear();
        navigate('/login');
      } else {
        setError("Error de conexión con el servidor.");
      }
      console.error(err);
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 sm:px-0">
      <header className="mb-8">
        <h1 className="text-3xl font-black text-slate-900">Análisis de Imagen</h1>
        <p className="text-slate-500">Sube la radiografía para obtener el cálculo automático.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Lado Izquierdo: Visualización de Archivo (Original y Procesada) */}
        <div className="lg:col-span-2 space-y-6">
          <div className={`relative border-2 border-dashed rounded-3xl p-6 transition-all bg-white flex flex-col items-center justify-center min-h-[450px] ${archivo ? 'border-emerald-500' : 'border-slate-200'}`}>
            
            {vistaPrevia && !imagenProcesada ? (
              // 1. Imagen seleccionada pero aún NO analizada
              <div className="relative w-full h-full flex flex-col items-center animate-in fade-in zoom-in duration-300">
                <img src={vistaPrevia} alt="Previsualización" className="max-h-[500px] rounded-xl shadow-lg mb-4 object-contain" />
                <button 
                  onClick={limpiarTodo}
                  className="text-red-500 text-sm font-bold hover:underline"
                >
                  Quitar imagen
                </button>
              </div>
            ) : vistaPrevia && imagenProcesada ? (
              // 2. Imagen YA analizada (Mostramos las dos)
              <div className="w-full flex flex-col items-center animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full mb-6">
                  {/* Caja Imagen Original */}
                  <div className="flex flex-col items-center bg-slate-50 p-3 rounded-2xl border border-slate-100">
                    <span className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Original</span>
                    <img src={vistaPrevia} alt="Original" className="max-h-[350px] object-contain rounded-lg shadow-sm" />
                  </div>
                  
                  {/* Caja Imagen IA */}
                  <div className="flex flex-col items-center bg-emerald-50/50 p-3 rounded-2xl border-2 border-emerald-100 relative">
                    <div className="absolute -top-3 bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full shadow-md">
                      Resultado IA
                    </div>
                    <span className="text-xs font-black text-emerald-600 uppercase tracking-widest mb-3 mt-1">Detección de Vértebras</span>
                    <img src={imagenProcesada} alt="Procesada" className="max-h-[350px] object-contain rounded-lg shadow-md" />
                  </div>
                </div>
                
                <button 
                  onClick={limpiarTodo}
                  className="text-slate-500 hover:text-slate-800 text-sm font-bold transition-colors bg-slate-100 px-4 py-2 rounded-lg"
                >
                  Subir otra radiografía
                </button>
              </div>
            ) : (
              // 0. Estado inicial (Subir archivo)
              <>
                <div className="bg-emerald-50 p-4 rounded-full text-emerald-500 mb-4">
                  <Upload size={40} />
                </div>
                <h2 className="text-xl font-bold text-slate-800 text-center">Selecciona la radiografía frontal</h2>
                <p className="text-slate-400 mt-2 mb-6 text-sm">Arrastra o busca archivos JPG/PNG</p>
                <label className="bg-slate-900 text-white font-bold py-3 px-8 rounded-xl cursor-pointer hover:bg-slate-800 transition shadow-xl">
                  Explorar Archivos
                  <input type="file" className="hidden" onChange={manejarCambioArchivo} accept="image/*" />
                </label>
              </>
            )}
          </div>
        </div>

        {/* Lado Derecho: Acciones y Resultado (Sin Cambios) */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl shadow-xl shadow-slate-100 border border-slate-100">
            <h3 className="font-bold text-slate-900 mb-4 flex items-center">
              <Zap size={18} className="text-emerald-500 mr-2" />
              Acciones
            </h3>
            
            <button 
              onClick={analizarImagen}
              disabled={!archivo || cargando}
              className={`w-full py-4 rounded-2xl font-black text-lg transition flex items-center justify-center ${
                !archivo || cargando 
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                : 'bg-emerald-500 text-white hover:bg-emerald-400 shadow-lg shadow-emerald-200'
              }`}
            >
              {cargando ? <Loader2 className="animate-spin" /> : "Iniciar Detección"}
            </button>

            {error && (
              <div className="mt-4 p-4 bg-red-50 text-red-600 rounded-xl flex items-center text-sm font-medium">
                <AlertCircle size={16} className="mr-2" /> {error}
              </div>
            )}
          </div>

          {resultado && (
            <div className="bg-emerald-500 p-6 rounded-3xl text-white shadow-xl shadow-emerald-200 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center mb-2">
                <CheckCircle2 size={20} className="mr-2" />
                <span className="font-bold uppercase tracking-wider text-xs opacity-90">Análisis Completado</span>
              </div>
              <div className="text-5xl font-black mb-1">
                {resultado.angulo_simulado}°
              </div>
              <p className="text-emerald-100 text-sm font-medium leading-tight">
                Ángulo de Cobb detectado correctamente.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}