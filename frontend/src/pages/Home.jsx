import { ShieldCheck, Activity, Scan, Brain, BarChart3 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

/* ── Tarjeta de característica ── */
const FeatureCard = ({ icon: Icon, title, desc, accent }) => (
  <div
    className="group relative overflow-hidden rounded-3xl p-7 border transition-all duration-500 hover:-translate-y-1 hover:shadow-2xl"
    style={{
      background: 'rgba(255,255,255,0.65)',
      backdropFilter: 'blur(12px)',
      borderColor: 'rgba(226,232,240,0.8)',
    }}
  >
    <div className={`inline-flex p-3 rounded-2xl mb-5 ${accent}`}>
      <Icon size={24} className="text-emerald-600"/>
    </div>
    <h3 className="text-slate-900 font-black text-lg mb-2 tracking-tight">{title}</h3>
    <p className="text-slate-500 text-sm leading-relaxed font-medium">{desc}</p>
    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-emerald-400 to-teal-400 scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left rounded-full"/>
  </div>
);

/* ── Pill de stat ── */
const StatPill = ({ value, label, color }) => (
  <div className={`flex flex-col items-center px-6 py-4 rounded-2xl border ${color}`}>
    <span className="text-3xl font-black tracking-tighter">{value}</span>
    <span className="text-xs font-bold uppercase tracking-widest mt-0.5 opacity-70">{label}</span>
  </div>
);

/* ── Datos de vértebras ── */
const VERTEBRAS = [
  { cy: 30,  cx: 100, w: 52, skew:  0 },
  { cy: 80,  cx: 108, w: 50, skew:  3 },
  { cy: 130, cx: 112, w: 54, skew:  4 },
  { cy: 180, cx: 108, w: 52, skew:  2 },
  { cy: 228, cx: 100, w: 56, skew:  0 },
  { cy: 276, cx: 88,  w: 54, skew: -4 },
  { cy: 324, cx: 84,  w: 58, skew: -5 },
  { cy: 374, cx: 88,  w: 60, skew: -3 },
  { cy: 424, cx: 96,  w: 62, skew:  0 },
  { cy: 474, cx: 108, w: 60, skew:  4 },
  { cy: 524, cx: 114, w: 58, skew:  5 },
  { cy: 572, cx: 110, w: 56, skew:  3 },
  { cy: 620, cx: 100, w: 58, skew:  0 },
  { cy: 668, cx: 90,  w: 56, skew: -3 },
  { cy: 716, cx: 88,  w: 60, skew: -4 },
  { cy: 764, cx: 94,  w: 62, skew: -2 },
  { cy: 812, cx: 100, w: 64, skew:  0 },
  { cy: 860, cx: 100, w: 68, skew:  0 },
];

/* ── SVG de columna vertebral — fixed para cubrir toda la pantalla ── */
const SpineSVG = ({ curva, opacidad, estilo, withSkew = false }) => (
  <svg
    style={{
      position: 'fixed',   // ← fixed: ignora el contenedor padre, se ancla a la ventana
      top: 0,
      height: '100vh',
      pointerEvents: 'none',
      userSelect: 'none',
      zIndex: 0,
      opacity: opacidad,
      ...estilo,
    }}
    viewBox="0 0 200 900"
    preserveAspectRatio="xMidYMid meet"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d={curva} stroke="#10b981" strokeWidth="2.5" strokeLinecap="round"/>
    {VERTEBRAS.map(({ cy, cx, w, skew }, i) => {
      const s = withSkew ? skew : 0;
      return (
        <g key={i}>
          <rect x={cx-w/2} y={cy-10} width={w} height={20} rx="5"
            fill="#10b981" transform={`rotate(${s},${cx},${cy})`}/>
          <rect x={cx-5} y={cy-6} width={10} height={12} rx="2"
            fill="#0d4f3c" transform={`rotate(${s},${cx},${cy})`}/>
          <rect x={cx-3} y={cy-19} width={6} height={9} rx="2"
            fill="#10b981" transform={`rotate(${s},${cx},${cy})`}/>
          <rect x={cx-w/2-14} y={cy-4} width={14} height={8} rx="3"
            fill="#10b981" opacity="0.8" transform={`rotate(${s},${cx},${cy})`}/>
          <rect x={cx+w/2} y={cy-4} width={14} height={8} rx="3"
            fill="#10b981" opacity="0.8" transform={`rotate(${s},${cx},${cy})`}/>
          {withSkew && i < VERTEBRAS.length - 1 && (
            <line
              x1={cx-w/2+6} y1={cy+11} x2={cx+w/2-6} y2={cy+11}
              stroke="#059669" strokeWidth="1.5" strokeDasharray="3 2"
              transform={`rotate(${s},${cx},${cy})`}
            />
          )}
        </g>
      );
    })}
  </svg>
);

export default function Home() {
  const navigate = useNavigate();
  const logueado = !!localStorage.getItem('token');
  const irA = (ruta) => navigate(logueado ? ruta : '/login');

  return (
    <>
      {/* ── COLUMNAS VERTEBRALES — fuera del flujo, fixed a la ventana ── */}
      <SpineSVG
        curva="M 100 0 C 115 100, 85 200, 105 350 C 120 470, 85 580, 102 720 C 110 810, 100 900, 100 900"
        opacidad={0.07}
        estilo={{ left: '0px', width: '160px' }}
      />
      <SpineSVG
        curva="M 100 0 C 108 90, 88 190, 100 320 C 112 440, 82 560, 98 700 C 106 800, 100 900, 100 900"
        opacidad={0.045}
        estilo={{ left: '18%', width: '140px' }}
      />
      <SpineSVG
        curva="M 100 0 C 100 0, 120 60, 110 120 C 100 180, 75 220, 85 290 C 95 360, 125 400, 115 470 C 105 540, 78 580, 88 650 C 98 720, 115 760, 105 840 C 100 870, 100 900, 100 900"
        opacidad={0.065}
        estilo={{ left: '50%', transform: 'translateX(-50%)', width: '340px' }}
        withSkew={true}
      />
      <SpineSVG
        curva="M 100 0 C 92 90, 112 190, 100 320 C 88 440, 118 560, 102 700 C 94 800, 100 900, 100 900"
        opacidad={0.045}
        estilo={{ right: '18%', width: '140px' }}
      />
      <SpineSVG
        curva="M 100 0 C 85 100, 115 200, 95 350 C 80 470, 115 580, 98 720 C 90 810, 100 900, 100 900"
        opacidad={0.07}
        estilo={{ right: '0px', width: '160px' }}
      />

      {/* ── CONTENIDO ── */}
      <div
        style={{ position: 'relative', zIndex: 1, fontFamily: "'DM Sans', system-ui, sans-serif" }}
        className="max-w-5xl mx-auto px-6 pt-16 pb-24 flex flex-col items-center text-center"
      >
        {/* Badge */}
        <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 px-5 py-2 rounded-full text-sm font-black uppercase tracking-widest mb-8">
          <Activity size={14} className="animate-pulse"/>
          Tecnología IA de Precisión
        </div>

        {/* Título */}
        <h1 className="text-6xl sm:text-7xl font-black text-slate-900 mb-6 tracking-tight leading-[0.95] max-w-3xl">
          Medición del{' '}
          <span style={{
            background: 'linear-gradient(135deg, #10b981, #059669)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
            Ángulo de Cobb
          </span>
          {' '}Automatizada
        </h1>

        {/* Descripción */}
        <p className="text-lg text-slate-500 mb-10 max-w-2xl leading-relaxed font-medium">
          Detección de landmarks vertebrales con redes neuronales y ajuste polinomial de precisión.
          Resultados clínicos en segundos.
        </p>

        {/* Stats */}
        <div className="flex flex-wrap justify-center gap-4 mb-14">
          <StatPill value="< 2s"     label="Tiempo análisis" color="border-emerald-200 text-emerald-700 bg-emerald-50"/>
          <StatPill value="DenseNet" label="Arquitectura IA"  color="border-teal-200 text-teal-700 bg-teal-50"/>
          <StatPill value="SMAPE"    label="Métrica error"    color="border-slate-200 text-slate-700 bg-slate-50"/>
        </div>

        {/* Divisor */}
        <div className="flex items-center gap-4 w-full max-w-2xl mb-12">
          <div className="flex-1 h-px bg-gradient-to-r from-transparent to-slate-200"/>
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Características del sistema</span>
          <div className="flex-1 h-px bg-gradient-to-l from-transparent to-slate-200"/>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 w-full max-w-4xl">
          <FeatureCard
            icon={ShieldCheck}
            title="Procesamiento Local"
            desc="Los datos del paciente nunca salen del servidor. Privacidad total garantizada sin dependencias externas."
            accent="bg-emerald-100"
          />
          <FeatureCard
            icon={Brain}
            title="Pipeline de IA en 2 Etapas"
            desc="Luminoth detecta las vértebras y una DenseNet localiza los landmarks con precisión submilimétrica."
            accent="bg-teal-100"
          />
          <FeatureCard
            icon={BarChart3}
            title="Seguimiento Clínico"
            desc="Historial cronológico con gráfica de evolución del ángulo. Descarga informes PDF por cada medición."
            accent="bg-cyan-100"
          />
        </div>

        {/* Barra de métodos con navegación */}
        <div className="mt-14 w-full max-w-2xl bg-white/80 backdrop-blur-sm border border-slate-200 rounded-3xl p-1 flex gap-1 shadow-sm">
          {[
            { icon: Scan,     label: 'Análisis IA Automático', sub: 'Subir radiografía → resultado inmediato', ruta: '/dashboard'   },
            { icon: Activity, label: 'Medición Supervisada',    sub: 'Marcado manual de vértebras',            ruta: '/laboratorio' },
          ].map(({ icon: Icon, label, sub, ruta }) => (
            <button
              key={label}
              onClick={() => irA(ruta)}
              className="flex-1 flex items-center gap-3 px-5 py-3.5 rounded-2xl hover:bg-emerald-50 active:bg-emerald-100 transition-colors group text-left"
            >
              <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0 group-hover:bg-emerald-200 transition-colors">
                <Icon size={17} className="text-emerald-600"/>
              </div>
              <div>
                <p className="text-xs font-black text-slate-800">{label}</p>
                <p className="text-[10px] text-slate-400 font-medium">{sub}</p>
              </div>
            </button>
          ))}
        </div>

        {!logueado && (
          <p className="mt-3 text-[11px] text-slate-400 font-medium">
            Inicia sesión para acceder a las herramientas de análisis
          </p>
        )}
      </div>
    </>
  );
}