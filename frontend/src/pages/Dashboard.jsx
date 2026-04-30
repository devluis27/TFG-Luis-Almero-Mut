import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Upload, Zap, Loader2, CheckCircle2, AlertCircle, Info, Stethoscope, Maximize2, X, Download } from 'lucide-react';

const obtenerDiagnostico = (angulo) => {
  const grados = parseFloat(angulo);
  
  if (grados < 10) {
    return {
      nivel: "Normal / Asimetría",
      colorFondo: "bg-slate-500",
      colorTexto: "text-slate-600",
      colorBorde: "border-slate-200",
      colorLigero: "bg-slate-50",
      mensaje: "Un ángulo menor a 10° no se considera escoliosis clínicamente. Se clasifica como asimetría espinal.",
      recomendacion: "Se recomienda mantener buenos hábitos posturales. No requiere tratamiento médico específico."
    };
  } else if (grados >= 10 && grados < 25) {
    return {
      nivel: "Escoliosis Leve",
      colorFondo: "bg-emerald-500",
      colorTexto: "text-emerald-700",
      colorBorde: "border-emerald-200",
      colorLigero: "bg-emerald-50",
      mensaje: "Curvatura leve confirmada.",
      recomendacion: "Generalmente requiere observación médica cada 4-6 meses y ejercicios de fisioterapia específicos (ej. Schroth)."
    };
  } else if (grados >= 25 && grados < 45) {
    return {
      nivel: "Escoliosis Moderada",
      colorFondo: "bg-amber-500",
      colorTexto: "text-amber-700",
      colorBorde: "border-amber-200",
      colorLigero: "bg-amber-50",
      mensaje: "Curvatura moderada con riesgo de progresión.",
      recomendacion: "Suele indicarse el uso de un corsé ortopédico si el paciente aún está en etapa de crecimiento."
    };
  } else {
    return {
      nivel: "Escoliosis Severa",
      colorFondo: "bg-red-500",
      colorTexto: "text-red-700",
      colorBorde: "border-red-200",
      colorLigero: "bg-red-50",
      mensaje: "Curvatura severa. Riesgo de complicaciones respiratorias o dolor crónico.",
      recomendacion: "Alta probabilidad de requerir evaluación para intervención quirúrgica. Consultar urgentemente con cirugía espinal."
    };
  }
};

export default function Dashboard() {
  const navigate = useNavigate();
  const [archivo, setArchivo] = useState(null);
  const [vistaPrevia, setVistaPrevia] = useState(null);
  const [imagenProcesada, setImagenProcesada] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [resultado, setResultado] = useState(null);
  const [error, setError] = useState(null);
  const [nombreUsuario, setNombreUsuario] = useState('');
  
  // NUEVO ESTADO: Controla qué imagen se muestra en pantalla completa
  const [imagenAmpliada, setImagenAmpliada] = useState(null);

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
      setImagenProcesada(null); 
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
        headers: { "Content-Type": "multipart/form-data", "Authorization": `Bearer ${token}` }
      });
      setResultado(respuesta.data);
      setImagenProcesada(respuesta.data.imagen_procesada); 
    } catch (err) {
      if (err.response && err.response.status === 401) {
        setError("Sesión caducada. Por favor, vuelve a iniciar sesión.");
        localStorage.clear();
        navigate('/login');
      } else {
        setError("Error de conexión con el servidor.");
      }
    } finally {
      setCargando(false);
    }
  };

  const infoClinica = resultado ? obtenerDiagnostico(resultado.angulo_simulado) : null;

  const manejarDescargaPDF = () => {
    if (!resultado || !infoClinica || !imagenProcesada) return;

    // Obtenemos el ID del usuario del localStorage
    const usuarioId = localStorage.getItem('usuario_id');
    
    // Extraemos el nombre del archivo de la imagen
    const urlObj = new URL(imagenProcesada);
    const nombreImagen = urlObj.pathname.split('/').pop();

    // Construimos la URL enviando usuario_id
    const url = `http://127.0.0.1:8000/descargar-informe?` + 
                `usuario_id=${usuarioId}&` +
                `angulo=${resultado.angulo_simulado}&` +
                `nivel=${encodeURIComponent(infoClinica.nivel)}&` +
                `mensaje=${encodeURIComponent(infoClinica.mensaje)}&` +
                `imagen=${encodeURIComponent(nombreImagen)}`;

    window.open(url, '_blank');
  };

  return (
    <>
      <div className="w-full max-w-[1920px] mx-auto py-4 px-4 xl:px-12 relative">
        <header className="mb-4">
          <h1 className="text-2xl font-black text-slate-900">Análisis de Imagen</h1>
          <p className="text-slate-500 text-sm">Panel de trabajo de {nombreUsuario}. Sube la radiografía para obtener el cálculo automático.</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* --- LADO IZQUIERDO: RADIOGRAFÍAS --- */}
          <div className="lg:col-span-7 xl:col-span-8 space-y-4">
            <div className={`relative border-2 border-dashed rounded-3xl p-4 transition-all bg-white flex flex-col items-center justify-center min-h-[65vh] ${archivo ? 'border-emerald-500' : 'border-slate-200'}`}>
              
              {vistaPrevia && !imagenProcesada ? (
                <div className="relative w-full h-full flex flex-col items-center animate-in fade-in zoom-in duration-300">
                  <div 
                    className="relative group cursor-pointer"
                    onClick={() => setImagenAmpliada(vistaPrevia)}
                  >
                    <img src={vistaPrevia} alt="Previsualización" className="max-h-[60vh] w-full object-contain rounded-xl shadow-lg mb-3" />
                    <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center mb-3">
                      <Maximize2 size={40} className="text-white drop-shadow-md" />
                    </div>
                  </div>
                  <button onClick={limpiarTodo} className="text-red-500 text-sm font-bold hover:underline">
                    Quitar imagen
                  </button>
                </div>
              ) : vistaPrevia && imagenProcesada ? (
                <div className="w-full flex flex-col items-center animate-in fade-in slide-in-from-bottom-4 duration-500 h-full justify-center">
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 w-full mb-4">
                    
                    {/* Original */}
                    <div className="flex flex-col items-center bg-slate-50 p-4 rounded-3xl border border-slate-100">
                      <span className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Original</span>
                      <div 
                        className="relative group cursor-pointer w-full flex justify-center"
                        onClick={() => setImagenAmpliada(vistaPrevia)}
                      >
                        <img src={vistaPrevia} alt="Original" className="max-h-[55vh] w-full object-contain rounded-lg shadow-sm" />
                        <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                          <Maximize2 size={32} className="text-white drop-shadow-md" />
                        </div>
                      </div>
                    </div>
                    
                    {/* Procesada */}
                    <div className="flex flex-col items-center bg-emerald-50/30 p-4 rounded-3xl border-2 border-emerald-100 relative">
                      <div className="absolute -top-3 bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest px-4 py-1 rounded-full shadow-md z-10">
                        Resultado IA
                      </div>
                      <span className="text-xs font-black text-emerald-600 uppercase tracking-widest mb-3 mt-1">Detección de Vértebras</span>
                      <div 
                        className="relative group cursor-pointer w-full flex justify-center"
                        onClick={() => setImagenAmpliada(imagenProcesada)}
                      >
                        <img src={imagenProcesada} alt="Procesada" className="max-h-[55vh] w-full object-contain rounded-lg shadow-md" />
                        <div className="absolute inset-0 bg-emerald-900/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                          <Maximize2 size={32} className="text-white drop-shadow-md" />
                        </div>
                      </div>
                    </div>

                  </div>
                  <button onClick={limpiarTodo} className="text-slate-500 hover:text-slate-800 text-sm font-bold transition-colors bg-slate-100 px-6 py-2 rounded-xl hover:bg-slate-200">
                    Subir nueva radiografía
                  </button>
                </div>
              ) : (
                <>
                  <div className="bg-emerald-50 p-6 rounded-full text-emerald-500 mb-4">
                    <Upload size={48} />
                  </div>
                  <h2 className="text-xl font-bold text-slate-800 text-center">Selecciona la radiografía frontal</h2>
                  <p className="text-slate-400 mt-2 mb-6">Arrastra o busca archivos JPG/PNG</p>
                  <label className="bg-slate-900 text-white font-bold py-3 px-8 rounded-2xl cursor-pointer hover:bg-slate-800 transition shadow-xl">
                    Explorar Archivos
                    <input type="file" className="hidden" onChange={manejarCambioArchivo} accept="image/*" />
                  </label>
                </>
              )}
            </div>
          </div>

          {/* --- LADO DERECHO: ACCIONES Y DIAGNÓSTICO --- */}
          <div className="lg:col-span-5 xl:col-span-4 space-y-4">
            <div className="bg-white p-5 rounded-3xl shadow-xl shadow-slate-100 border border-slate-100">
              <h3 className="font-bold text-slate-900 mb-3 flex items-center">
                <Zap size={18} className="text-emerald-500 mr-2" />
                Acciones de IA
              </h3>
              <button 
                onClick={analizarImagen}
                disabled={!archivo || cargando}
                className={`w-full py-4 rounded-2xl font-black transition flex items-center justify-center ${
                  !archivo || cargando 
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                  : 'bg-emerald-500 text-white hover:bg-emerald-400 shadow-lg shadow-emerald-200'
                }`}
              >
                {cargando ? <Loader2 className="animate-spin" size={20} /> : "Iniciar Detección"}
              </button>
              {error && (
                <div className="mt-3 p-3 bg-red-50 text-red-600 rounded-xl flex items-center text-xs font-medium">
                  <AlertCircle size={16} className="mr-2 flex-shrink-0" /> {error}
                </div>
              )}
            </div>

            {resultado && infoClinica && (
              <div className={`p-5 rounded-3xl shadow-xl border-2 animate-in fade-in slide-in-from-bottom-4 duration-500 bg-white ${infoClinica.colorBorde}`}>
                <div className={`flex items-center p-3 rounded-2xl mb-4 text-white ${infoClinica.colorFondo}`}>
                  <CheckCircle2 size={20} className="mr-2" />
                  <span className="font-black uppercase tracking-widest text-xs">Análisis Completado</span>
                </div>
                
                <div className="text-center mb-5">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Ángulo de Cobb</p>
                  <div className={`text-6xl font-black ${infoClinica.colorTexto}`}>
                    {resultado.angulo_simulado}°
                  </div>
                </div>

                <div className="space-y-3">
                  <div className={`${infoClinica.colorLigero} p-4 rounded-2xl border ${infoClinica.colorBorde}`}>
                    <div className="flex items-center mb-2">
                      <Stethoscope size={16} className={`mr-2 ${infoClinica.colorTexto}`} />
                      <span className={`font-black uppercase tracking-widest text-xs ${infoClinica.colorTexto}`}>
                        Clasificación: {infoClinica.nivel}
                      </span>
                    </div>
                    <p className="text-xs font-medium text-slate-600 leading-relaxed">
                      {infoClinica.mensaje}
                    </p>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <div className="flex items-center mb-2">
                      <Info size={16} className="mr-2 text-slate-400" />
                      <span className="font-black uppercase tracking-widest text-[10px] text-slate-500">
                        Recomendación Médica
                      </span>
                    </div>
                    <p className="text-xs font-medium text-slate-600 leading-relaxed">
                      {infoClinica.recomendacion}
                    </p>
                  </div>

                  <button 
                    onClick={manejarDescargaPDF}
                    className="w-full mt-4 py-3 rounded-xl font-bold flex items-center justify-center transition-all bg-slate-900 text-white hover:bg-slate-800 shadow-md"
                  >
                    <Download className="mr-2" size={18} />
                    Descargar Informe Clínico (PDF)
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* --- VISOR DE PANTALLA COMPLETA --- */}
      {imagenAmpliada && (
        <div 
          className="fixed inset-0 z-[100] bg-slate-900/90 backdrop-blur-sm flex items-center justify-center p-4 lg:p-8 animate-in fade-in duration-200"
          onClick={() => setImagenAmpliada(null)}
        >
          <div className="relative max-w-[1920px] w-full h-full flex flex-col items-center justify-center">
            {/* Botón de cerrar (esquina superior derecha) */}
            <button 
              className="absolute top-4 right-4 md:top-8 md:right-8 bg-white/10 hover:bg-red-500/80 text-white p-3 rounded-full transition-colors z-[110]"
              onClick={(e) => {
                e.stopPropagation();
                setImagenAmpliada(null);
              }}
            >
              <X size={28} />
            </button>
            
            <img 
              src={imagenAmpliada} 
              alt="Vista Ampliada" 
              className="max-h-[90vh] max-w-full object-contain rounded-2xl shadow-2xl ring-4 ring-white/10"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </>
  );
}