import { useState } from 'react';
import axios from 'axios';
import { Upload, FileImage, Zap, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

export default function Dashboard() {
  const [archivo, setArchivo] = useState(null);
  const [vistaPrevia, setVistaPrevia] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [resultado, setResultado] = useState(null);
  const [error, setError] = useState(null);

  // 1. Manejar la selección del archivo
  const manejarCambioArchivo = (e) => {
    const file = e.target.files[0];
    if (file) {
      setArchivo(file);
      setVistaPrevia(URL.createObjectURL(file)); // Crea una URL temporal para ver la foto
      setResultado(null);
      setError(null);
    }
  };

  // 2. Enviar la imagen al servidor FastAPI
  const analizarImagen = async () => {
    if (!archivo) return;

    setCargando(true);
    setError(null);

    const formData = new FormData();
    formData.append("file", archivo);

    try {
      // Llamada a tu API (Asegúrate de que FastAPI esté corriendo en el puerto 8000)
      const respuesta = await axios.post("http://localhost:8000/analizar", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      
      setResultado(respuesta.data);
    } catch (err) {
      setError("No se pudo conectar con el servidor. ¿Está encendido el Backend?");
      console.error(err);
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto py-8">
      <header className="mb-8">
        <h1 className="text-3xl font-black text-slate-900">Análisis de Imagen</h1>
        <p className="text-slate-500">Sube la radiografía para obtener el cálculo automático.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Lado Izquierdo: Zona de Carga y Previsualización */}
        <div className="lg:col-span-2 space-y-6">
          <div className={`relative border-2 border-dashed rounded-3xl p-6 transition-all bg-white flex flex-col items-center justify-center min-h-[400px] ${archivo ? 'border-emerald-500' : 'border-slate-200'}`}>
            
            {vistaPrevia ? (
              <div className="relative w-full h-full flex flex-col items-center">
                <img src={vistaPrevia} alt="Previsualización" className="max-h-[500px] rounded-xl shadow-lg mb-4" />
                <button 
                  onClick={() => {setArchivo(null); setVistaPrevia(null); setResultado(null);}}
                  className="text-red-500 text-sm font-bold hover:underline"
                >
                  Quitar imagen
                </button>
              </div>
            ) : (
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

        {/* Lado Derecho: Resultados y Control */}
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

          {/* Tarjeta de Resultados Reales */}
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
                Ángulo de Cobb detectado mediante regresión polinomial.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}