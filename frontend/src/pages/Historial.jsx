import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Clock, Calendar, Loader2, Info } from 'lucide-react';

export default function Historial() {
  const navigate = useNavigate();
  const [registros, setRegistros] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const usuarioId = localStorage.getItem('usuario_id');

    if (!token) {
      navigate('/login');
      return;
    }

    const fetchHistorial = async () => {
      try {
        const res = await axios.get(`http://127.0.0.1:8000/historial/${usuarioId}`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        setRegistros(res.data);
      } catch (err) {
        console.error("Error al cargar historial:", err);
      } finally {
        setCargando(false);
      }
    };

    fetchHistorial();
  }, [navigate]);

  if (cargando) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <Loader2 className="animate-spin text-emerald-500" size={40} />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <header className="mb-10">
        <h1 className="text-4xl font-black text-slate-900 mb-2">Historial Clínico</h1>
        <div className="h-1.5 w-20 bg-emerald-500 rounded-full mb-4"></div>
        <p className="text-slate-500 font-medium">Registro cronológico de todas las mediciones realizadas.</p>
      </header>

      {registros.length === 0 ? (
        <div className="bg-white border-2 border-dashed border-slate-200 rounded-3xl p-12 text-center">
          <Info className="mx-auto text-slate-300 mb-4" size={48} />
          <h3 className="text-xl font-bold text-slate-800">No hay registros aún</h3>
          <p className="text-slate-500 mt-2">Realiza tu primer análisis en el panel principal.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {registros.map((reg) => (
            <div 
              key={reg.id} 
              className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md hover:border-emerald-100 transition-all group flex items-center justify-between"
            >
              <div className="flex items-center space-x-6">
                {/* Icono de Fecha */}
                <div className="bg-slate-50 p-3 rounded-xl text-slate-400 group-hover:bg-emerald-50 group-hover:text-emerald-500 transition-colors">
                  <Calendar size={24} />
                </div>
                
                <div>
                  <p className="text-sm font-black text-slate-400 uppercase tracking-widest mb-1">Fecha de Análisis</p>
                  <p className="text-lg font-bold text-slate-700">
                    {new Date(reg.fecha_medicion).toLocaleDateString('es-ES', { 
                      day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' 
                    })}
                  </p>
                </div>
              </div>

              <div className="flex items-center">
                {/* Resultado del Ángulo */}
                <div className="text-right pr-2">
                  <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Desviación</p>
                  <div className={`text-3xl font-black ${
                    reg.angulo_cobb > 25 ? 'text-red-500' : reg.angulo_cobb > 10 ? 'text-amber-500' : 'text-emerald-500'
                  }`}>
                    {reg.angulo_cobb.toFixed(1)}°
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}