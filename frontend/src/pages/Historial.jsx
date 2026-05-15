import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Clock, Calendar, Loader2, Info,
  TrendingUp, TrendingDown, Minus, Activity
} from 'lucide-react';
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, ReferenceLine, Dot
} from 'recharts';

/* ─────────────────────────────────────────
   Helpers de diagnóstico
───────────────────────────────────────── */
const colorPorAngulo = (g) => {
  if (g < 10)  return { text: 'text-slate-500',   dot: '#64748b', bg: 'bg-slate-100'  };
  if (g < 20)  return { text: 'text-emerald-600', dot: '#10b981', bg: 'bg-emerald-50' };
  if (g < 40)  return { text: 'text-amber-600',   dot: '#f59e0b', bg: 'bg-amber-50'   };
  return        { text: 'text-red-600',            dot: '#ef4444', bg: 'bg-red-50'     };
};

const nivelPorAngulo = (g) => {
  if (g < 10)  return 'Normal';
  if (g < 20)  return 'Leve';
  if (g < 40)  return 'Moderada';
  return        'Severa';
};

/* Fecha local directa — el backend ya devuelve hora local sin Z */
const formatearFecha = (iso) => {
  if (!iso) return '—';
  const [fecha, hora] = iso.split('T');
  const [y, m, d] = fecha.split('-');
  const [hh, mm] = hora.split(':');
  const meses = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
  return `${parseInt(d)} ${meses[parseInt(m) - 1]} ${y} · ${hh}:${mm}`;
};

const formatearEjeX = (iso) => {
  if (!iso) return '';
  const [fecha] = iso.split('T');
  const [, m, d] = fecha.split('-');
  const meses = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
  return `${parseInt(d)} ${meses[parseInt(m) - 1]}`;
};

/* ─────────────────────────────────────────
   Tooltip personalizado de la gráfica
───────────────────────────────────────── */
const TooltipGrafica = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  const c = colorPorAngulo(d.angulo_cobb);
  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-xl px-4 py-3 min-w-[160px]">
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
        {formatearFecha(d.fecha_medicion)}
      </p>
      <div className={`text-3xl font-black tracking-tighter ${c.text}`}>
        {d.angulo_cobb.toFixed(1)}<span className="text-base opacity-60">°</span>
      </div>
      <p className={`text-xs font-bold mt-0.5 ${c.text}`}>{nivelPorAngulo(d.angulo_cobb)}</p>
    </div>
  );
};

/* Punto activo personalizado */
const PuntoGrafica = (props) => {
  const { cx, cy, payload } = props;
  const c = colorPorAngulo(payload.angulo_cobb);
  return (
    <g>
      <circle cx={cx} cy={cy} r={7} fill={c.dot} stroke="white" strokeWidth={2.5}/>
    </g>
  );
};

/* ─────────────────────────────────────────
   Componente principal
───────────────────────────────────────── */
export default function Historial() {
  const navigate  = useNavigate();
  const [registros, setRegistros] = useState([]);
  const [cargando,  setCargando]  = useState(true);

  useEffect(() => {
    const token      = localStorage.getItem('token');
    const usuarioId  = localStorage.getItem('usuario_id');
    if (!token) { navigate('/login'); return; }

    axios.get(`http://127.0.0.1:8000/historial/${usuarioId}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => setRegistros(res.data))
      .catch(err => console.error('Error al cargar historial:', err))
      .finally(() => setCargando(false));
  }, [navigate]);

  if (cargando) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="animate-spin text-emerald-500" size={40}/>
      </div>
    );
  }

  /* ── Estadísticas rápidas ── */
  const ultimo    = registros.at(-1);
  const primero   = registros[0];
  const maximo    = registros.length ? Math.max(...registros.map(r => r.angulo_cobb)) : null;
  const minimo    = registros.length ? Math.min(...registros.map(r => r.angulo_cobb)) : null;
  const tendencia = registros.length >= 2
    ? ultimo.angulo_cobb - registros.at(-2).angulo_cobb
    : null;

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 space-y-8">

      {/* ── CABECERA ── */}
      <header>
        <h1 className="text-4xl font-black text-slate-900 mb-2 tracking-tight">
          Historial Clínico
        </h1>
        <div className="h-1.5 w-20 bg-emerald-500 rounded-full mb-3"/>
        <p className="text-slate-500 font-medium">
          Seguimiento cronológico del ángulo de Cobb · {registros.length} medición{registros.length !== 1 ? 'es' : ''}
        </p>
      </header>

      {registros.length === 0 ? (
        <div className="bg-white border-2 border-dashed border-slate-200 rounded-3xl p-12 text-center">
          <Info className="mx-auto text-slate-300 mb-4" size={48}/>
          <h3 className="text-xl font-bold text-slate-800">No hay registros aún</h3>
          <p className="text-slate-500 mt-2">Realiza tu primer análisis en el panel principal.</p>
        </div>
      ) : (
        <>
          {/* ── ESTADÍSTICAS RÁPIDAS ── */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              {
                label: 'Última medición',
                valor: `${ultimo.angulo_cobb.toFixed(1)}°`,
                sub: nivelPorAngulo(ultimo.angulo_cobb),
                color: colorPorAngulo(ultimo.angulo_cobb),
                icon: <Activity size={18}/>,
              },
              {
                label: 'Tendencia',
                valor: tendencia === null ? '—'
                  : tendencia > 0 ? `+${tendencia.toFixed(1)}°`
                  : tendencia < 0 ? `${tendencia.toFixed(1)}°`
                  : 'Estable',
                sub: tendencia === null ? 'Solo 1 medición'
                  : tendencia > 0 ? 'Respecto a anterior'
                  : tendencia < 0 ? 'Respecto a anterior'
                  : 'Sin cambios',
                color: tendencia === null
                  ? colorPorAngulo(0)
                  : tendencia > 0.5
                  ? { text:'text-red-600', dot:'#ef4444', bg:'bg-red-50' }
                  : tendencia < -0.5
                  ? { text:'text-emerald-600', dot:'#10b981', bg:'bg-emerald-50' }
                  : { text:'text-slate-600', dot:'#64748b', bg:'bg-slate-100' },
                icon: tendencia === null ? <Minus size={18}/>
                  : tendencia > 0.5 ? <TrendingUp size={18}/>
                  : tendencia < -0.5 ? <TrendingDown size={18}/>
                  : <Minus size={18}/>,
              },
              {
                label: 'Máximo registrado',
                valor: `${maximo.toFixed(1)}°`,
                sub: nivelPorAngulo(maximo),
                color: colorPorAngulo(maximo),
                icon: <TrendingUp size={18}/>,
              },
              {
                label: 'Mínimo registrado',
                valor: `${minimo.toFixed(1)}°`,
                sub: nivelPorAngulo(minimo),
                color: colorPorAngulo(minimo),
                icon: <TrendingDown size={18}/>,
              },
            ].map((stat, i) => (
              <div key={i} className={`rounded-2xl p-4 border border-slate-100 shadow-sm bg-white`}>
                <div className={`flex items-center gap-2 mb-2 ${stat.color.text}`}>
                  {stat.icon}
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    {stat.label}
                  </span>
                </div>
                <div className={`text-3xl font-black tracking-tighter ${stat.color.text}`}>
                  {stat.valor}
                </div>
                <p className="text-xs text-slate-400 font-semibold mt-0.5">{stat.sub}</p>
              </div>
            ))}
          </div>

          {/* ── GRÁFICA DE EVOLUCIÓN ── */}
          {registros.length >= 2 && (
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-black text-slate-900 tracking-tight">
                    Evolución del Ángulo de Cobb
                  </h2>
                  <p className="text-xs text-slate-400 font-medium mt-0.5">
                    Todas las mediciones ordenadas cronológicamente
                  </p>
                </div>
                {/* Leyenda de zonas */}
                <div className="hidden sm:flex items-center gap-4 text-[10px] font-black uppercase tracking-widest">
                  {[
                    { label:'Normal',   color:'#64748b' },
                    { label:'Leve',     color:'#10b981' },
                    { label:'Moderada', color:'#f59e0b' },
                    { label:'Severa',   color:'#ef4444' },
                  ].map(l => (
                    <div key={l.label} className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ background: l.color }}/>
                      <span className="text-slate-400">{l.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={registros} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false}/>

                  {/* Líneas de referencia clínicas */}
                  <ReferenceLine y={10} stroke="#64748b" strokeDasharray="6 3" strokeWidth={1}
                    label={{ value:'10°', position:'insideTopRight', fontSize:10, fill:'#94a3b8', fontWeight:700 }}/>
                  <ReferenceLine y={20} stroke="#f59e0b" strokeDasharray="6 3" strokeWidth={1}
                    label={{ value:'20°', position:'insideTopRight', fontSize:10, fill:'#f59e0b', fontWeight:700 }}/>
                  <ReferenceLine y={40} stroke="#ef4444" strokeDasharray="6 3" strokeWidth={1}
                    label={{ value:'40°', position:'insideTopRight', fontSize:10, fill:'#ef4444', fontWeight:700 }}/>

                  <XAxis
                    dataKey="fecha_medicion"
                    tickFormatter={formatearEjeX}
                    tick={{ fontSize: 11, fontWeight: 700, fill: '#94a3b8' }}
                    axisLine={false}
                    tickLine={false}
                    dy={8}
                  />
                  <YAxis
                    domain={[0, dataMax => Math.max(50, Math.ceil(dataMax / 5) * 5 + 5)]}
                    tick={{ fontSize: 11, fontWeight: 700, fill: '#94a3b8' }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={v => `${v}°`}
                    width={38}
                  />
                  <Tooltip content={<TooltipGrafica/>} cursor={{ stroke: '#e2e8f0', strokeWidth: 2 }}/>

                  <Line
                    type="monotone"
                    dataKey="angulo_cobb"
                    stroke="#10b981"
                    strokeWidth={2.5}
                    dot={<PuntoGrafica/>}
                    activeDot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* ── LISTA DE REGISTROS ── */}
          {/* Orden visual: más reciente arriba (los datos vienen asc del endpoint,
              invertimos solo para la lista) */}
          <div className="space-y-3">
            {[...registros].reverse().map((reg, idx) => {
              const c  = colorPorAngulo(reg.angulo_cobb);
              const es = idx === 0; // el más reciente
              return (
                <div
                  key={reg.id}
                  className={`bg-white p-5 rounded-2xl border transition-all flex items-center justify-between group ${
                    es ? 'border-emerald-200 shadow-md shadow-emerald-50' : 'border-slate-100 shadow-sm hover:shadow-md hover:border-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-2.5 rounded-xl transition-colors ${
                      es ? `${c.bg} ${c.text}` : 'bg-slate-50 text-slate-400 group-hover:bg-slate-100'
                    }`}>
                      <Calendar size={20}/>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest">
                          Fecha de análisis
                        </p>
                        {es && (
                          <span className="text-[9px] font-black uppercase tracking-widest bg-emerald-100 text-emerald-600 px-2 py-0.5 rounded-full">
                            Última
                          </span>
                        )}
                      </div>
                      <p className="text-sm font-bold text-slate-700">
                        {formatearFecha(reg.fecha_medicion)}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">
                      Desviación
                    </p>
                    <div className={`text-3xl font-black tracking-tighter ${c.text}`}>
                      {reg.angulo_cobb.toFixed(1)}°
                    </div>
                    <p className={`text-[10px] font-bold uppercase tracking-wider ${c.text}`}>
                      {nivelPorAngulo(reg.angulo_cobb)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}