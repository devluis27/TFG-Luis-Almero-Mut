import { useState, useRef, useCallback, useEffect } from 'react';
import axios from 'axios';
import {
  Calculator, Trash2, Save,
  CheckCircle2, Loader2, ZoomIn, ZoomOut,
  Stethoscope, Info, Ruler, RotateCcw,
  Move, Crosshair, ImageIcon, AlertCircle,
  FileDown
} from 'lucide-react';

/* ─────────────────────────────────────────────
   Diagnóstico clínico (idéntico al Dashboard)
───────────────────────────────────────────── */
const obtenerDiagnostico = (angulo) => {
  const g = parseFloat(angulo);
  if (g < 10)  return { nivel:"Normal / Asimetría",   badge:"bg-slate-500",   text:"text-slate-700",  border:"border-slate-200",  bg:"bg-slate-50",   mensaje:"Ángulo menor a 10°, no se considera escoliosis clínica.",      recomendacion:"Mantener buenos hábitos posturales. Sin tratamiento específico." };
  if (g < 25)  return { nivel:"Escoliosis Leve",       badge:"bg-emerald-500", text:"text-emerald-700",border:"border-emerald-200",bg:"bg-emerald-50", mensaje:"Curvatura leve confirmada.",                                       recomendacion:"Observación médica cada 4-6 meses y fisioterapia Schroth." };
  if (g < 45)  return { nivel:"Escoliosis Moderada",   badge:"bg-amber-500",   text:"text-amber-700",  border:"border-amber-200",  bg:"bg-amber-50",   mensaje:"Curvatura moderada con riesgo de progresión.",                    recomendacion:"Valorar corsé ortopédico si el paciente está en crecimiento." };
  return        { nivel:"Escoliosis Severa",            badge:"bg-red-500",     text:"text-red-700",    border:"border-red-200",    bg:"bg-red-50",     mensaje:"Curvatura severa. Riesgo de complicaciones respiratorias.",        recomendacion:"Alta probabilidad de intervención quirúrgica. Consulta urgente." };
};

const GUIA = [
  { label:"V1 Sup. Izq.", color:"#10b981" },
  { label:"V1 Sup. Der.", color:"#10b981" },
  { label:"V1 Inf. Izq.", color:"#10b981" },
  { label:"V1 Inf. Der.", color:"#10b981" },
  { label:"V2 Sup. Izq.", color:"#8b5cf6" },
  { label:"V2 Sup. Der.", color:"#8b5cf6" },
  { label:"V2 Inf. Izq.", color:"#8b5cf6" },
  { label:"V2 Inf. Der.", color:"#8b5cf6" },
];

const ZOOM_MIN  = 1;
const ZOOM_MAX  = 8;
const ZOOM_STEP = 0.3;

export default function LaboratorioManual() {
  const [imagenFile,    setImagenFile]    = useState(null);
  const [imagenURL,     setImagenURL]     = useState(null);
  const [imagenNatural, setImagenNatural] = useState({ w:1, h:1 });
  const [puntos,        setPuntos]        = useState([]);
  const [resultado,     setResultado]     = useState(null);
  const [imagenAnotada, setImagenAnotada] = useState(null);
  const [calculando,    setCalculando]    = useState(false);
  const [guardando,     setGuardando]     = useState(false);
  const [guardado,      setGuardado]      = useState(false);
  const [descargando,   setDescargando]   = useState(false);
  const [error,         setError]         = useState(null);

  const [zoom,    setZoom]    = useState(1);
  const [pan,     setPan]     = useState({ x:0, y:0 });
  const [modoHerramienta, setModoHerramienta] = useState('marcar');
  const [arrastrando, setArrastrando] = useState(false);
  const panStart  = useRef({ x:0, y:0, panX:0, panY:0 });

  const contenedorRef = useRef(null);
  const imgRef        = useRef(null);

  /* ── Carga ── */
  const manejarSubida = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImagenFile(file);
    setImagenURL(URL.createObjectURL(file));
    resetear(false);
  };

  const onImageLoad = (e) =>
    setImagenNatural({ w: e.target.naturalWidth, h: e.target.naturalHeight });

  /* ── Reset ── */
  const resetear = (borrarImagen = true) => {
    setPuntos([]); setResultado(null); setImagenAnotada(null);
    setError(null); setGuardado(false); setZoom(1); setPan({ x:0, y:0 });
    setModoHerramienta('marcar');
    if (borrarImagen) { setImagenFile(null); setImagenURL(null); }
  };

  /* ── Zoom rueda ── */
  const onWheel = useCallback((e) => {
    e.preventDefault();
    setZoom(z => Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, z + (e.deltaY < 0 ? ZOOM_STEP : -ZOOM_STEP))));
  }, []);

  useEffect(() => {
    const el = contenedorRef.current;
    if (!el) return;
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [onWheel]);

  /* ── Pan ── */
  const onMouseDown = (e) => {
    if (modoHerramienta !== 'mover') return;
    e.preventDefault();
    setArrastrando(true);
    panStart.current = { x: e.clientX, y: e.clientY, panX: pan.x, panY: pan.y };
  };

  const onMouseMove = useCallback((e) => {
    if (!arrastrando) return;
    setPan({ x: panStart.current.panX + e.clientX - panStart.current.x,
             y: panStart.current.panY + e.clientY - panStart.current.y });
  }, [arrastrando]);

  const onMouseUp = useCallback(() => setArrastrando(false), []);

  useEffect(() => {
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup',   onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup',   onMouseUp);
    };
  }, [onMouseMove, onMouseUp]);

  /* ── Marcar punto ── */
  const añadirPunto = (e) => {
    if (modoHerramienta !== 'marcar' || puntos.length >= 8 || !imgRef.current) return;
    const rect = imgRef.current.getBoundingClientRect();
    const rx = (e.clientX - rect.left) / rect.width;
    const ry = (e.clientY - rect.top)  / rect.height;
    setPuntos(prev => [...prev, { px: rx * imagenNatural.w, py: ry * imagenNatural.h, rx, ry }]);
  };

  const deshacerPunto = () => setPuntos(prev => prev.slice(0, -1));

  /* ── Calcular ── */
  const calcularCobb = async () => {
    if (puntos.length < 8 || !imagenFile) return;
    setCalculando(true); setError(null);
    try {
      const usuarioId = localStorage.getItem('usuario_id') || 0;
      const fd = new FormData();
      fd.append('imagen', imagenFile);
      fd.append('puntos_superior', JSON.stringify(puntos.slice(0,4).map(p => [p.px, p.py])));
      fd.append('puntos_inferior', JSON.stringify(puntos.slice(4,8).map(p => [p.px, p.py])));
      // Enviamos usuario_id para que el backend guarde la imagen anotada con su nombre
      fd.append('usuario_id', usuarioId);

      const resp = await axios.post('http://127.0.0.1:8000/medicion-manual', fd,
        { headers: { 'Content-Type': 'multipart/form-data' } });
      setResultado(resp.data.cobb_angle);
      if (resp.data.imagen_anotada) {
        const bytes = atob(resp.data.imagen_anotada);
        const arr = new Uint8Array(bytes.length);
        for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
        setImagenAnotada(URL.createObjectURL(new Blob([arr], { type:'image/jpeg' })));
      }
    } catch (err) {
      setError(err?.response?.data?.detail || "Error de conexión con el servidor.");
    } finally { setCalculando(false); }
  };

  /* ── Guardar en historial ── */
  const guardarEnHistorial = async () => {
    setGuardando(true);
    try {
      await axios.post('http://127.0.0.1:8000/guardar-medicion-manual', {
        usuario_id: localStorage.getItem('usuario_id'), angulo: resultado,
      });
      setGuardado(true);
      setTimeout(() => setGuardado(false), 3000);
    } catch { setError("Error al guardar en el historial."); }
    finally  { setGuardando(false); }
  };

  /* ── Descargar PDF ── */
  const descargarPDF = async () => {
    if (!resultado || !infoClinica) return;
    setDescargando(true);
    try {
      const usuarioId    = localStorage.getItem('usuario_id');
      const params = new URLSearchParams({
        usuario_id:    usuarioId,
        angulo:        resultado,
        nivel:         infoClinica.nivel,
        mensaje:       infoClinica.mensaje,
        recomendacion: infoClinica.recomendacion,
      });
      const resp = await axios.get(
        `http://127.0.0.1:8000/descargar-informe-supervisado?${params.toString()}`,
        { responseType: 'blob' }
      );
      // Descarga automática en el navegador
      const url  = URL.createObjectURL(new Blob([resp.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href  = url;
      link.download = `Informe_Supervisado.pdf`;
      link.click();
      URL.revokeObjectURL(url);
    } catch {
      setError("Error al generar el informe PDF.");
    } finally { setDescargando(false); }
  };

  const zoomBtn = (d) => setZoom(z => Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, +(z + d).toFixed(2))));
  const infoClinica = resultado !== null ? obtenerDiagnostico(resultado) : null;

  return (
    <div
      className="flex flex-col px-4 gap-4 overflow-hidden"
      style={{ height:'calc(100vh - 140px)', fontFamily:"'DM Sans', system-ui, sans-serif" }}
    >

      {/* ── CABECERA ── */}
      <header className="flex items-center justify-between flex-shrink-0">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2 tracking-tight">
            <span className="bg-emerald-500 text-white rounded-xl p-1.5"><Ruler size={20}/></span>
            Estudio Supervisado
          </h1>
          <p className="text-slate-400 text-sm font-medium mt-0.5">
            Marcado manual de vértebras · Ángulo de Cobb de precisión
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Modo */}
          <div className="flex bg-slate-100 rounded-2xl p-1 gap-1">
            {[{ id:'marcar', icon:<Crosshair size={16}/>, tip:"Marcar" },
              { id:'mover',  icon:<Move       size={16}/>, tip:"Mover"  }].map(({ id, icon, tip }) => (
              <button key={id} onClick={() => setModoHerramienta(id)}
                className={`px-3 py-2 rounded-xl text-sm font-bold flex items-center gap-1.5 transition-all ${
                  modoHerramienta === id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>
                {icon}<span className="text-xs">{tip}</span>
              </button>
            ))}
          </div>

          {/* Zoom */}
          <div className="flex items-center bg-white border border-slate-200 rounded-2xl px-1 shadow-sm gap-0.5">
            <button onClick={() => zoomBtn(-ZOOM_STEP)} className="p-2 text-slate-400 hover:text-slate-700 transition rounded-xl"><ZoomOut size={17}/></button>
            <span className="text-xs font-black text-slate-600 w-12 text-center tabular-nums">{Math.round(zoom * 100)}%</span>
            <button onClick={() => zoomBtn(+ZOOM_STEP)}  className="p-2 text-slate-400 hover:text-slate-700 transition rounded-xl"><ZoomIn size={17}/></button>
          </div>

          <button onClick={deshacerPunto} disabled={puntos.length === 0}
            title="Deshacer último punto"
            className="p-2.5 bg-white border border-slate-200 rounded-2xl text-slate-400 hover:text-amber-500 disabled:opacity-30 transition shadow-sm">
            <RotateCcw size={17}/>
          </button>

          <button onClick={() => resetear(false)} title="Limpiar marcado"
            className="p-2.5 bg-white border border-slate-200 rounded-2xl text-slate-400 hover:text-red-500 transition shadow-sm">
            <Trash2 size={17}/>
          </button>

          <button onClick={calcularCobb} disabled={puntos.length < 8 || calculando}
            className={`px-6 py-2.5 rounded-2xl font-black text-sm flex items-center gap-2 transition-all shadow-md ${
              puntos.length < 8 || calculando
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none'
                : 'bg-slate-900 text-white hover:bg-emerald-600 shadow-slate-200'}`}>
            {calculando
              ? <><Loader2 size={16} className="animate-spin"/> Calculando…</>
              : <><Calculator size={16}/> Calcular</>}
          </button>
        </div>
      </header>

      {/* ── CUERPO ── */}
      <div className="flex gap-5 overflow-hidden" style={{ flex:'1 1 0', minHeight:0 }}>

        {/* ── VISOR ── */}
        <div
          ref={contenedorRef}
          className="flex-1 bg-slate-950 rounded-3xl relative overflow-hidden border border-slate-800 shadow-2xl"
          style={{ cursor: modoHerramienta === 'mover' ? (arrastrando ? 'grabbing' : 'grab') : 'crosshair' }}
          onMouseDown={onMouseDown}
        >
          <div className="absolute inset-0 opacity-[0.04]"
            style={{ backgroundImage:'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize:'24px 24px' }}/>

          {!imagenURL ? (
            <label className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer group">
              <div className="w-24 h-24 rounded-3xl bg-slate-800 flex items-center justify-center mb-4 group-hover:bg-slate-700 group-hover:scale-105 transition-all duration-300">
                <ImageIcon size={40} className="text-slate-500 group-hover:text-emerald-400 transition-colors"/>
              </div>
              <p className="text-slate-400 font-bold text-sm tracking-widest uppercase">Cargar Radiografía</p>
              <p className="text-slate-600 text-xs mt-1">PNG, JPG · Haz clic o arrastra</p>
              <input type="file" className="hidden" accept="image/*" onChange={manejarSubida}/>
            </label>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center"
              style={{ pointerEvents: modoHerramienta === 'mover' ? 'none' : 'auto' }}>
              <div
                style={{
                  transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                  transformOrigin: 'center center',
                  transition: arrastrando ? 'none' : 'transform 0.15s ease',
                  position: 'relative', maxWidth:'100%', maxHeight:'100%',
                }}
                onClick={modoHerramienta === 'marcar' ? añadirPunto : undefined}
              >
                <img
                  ref={imgRef} src={imagenAnotada || imagenURL} onLoad={onImageLoad}
                  alt="Radiografía" draggable={false}
                  className="block max-h-[70vh] max-w-full object-contain select-none"
                  style={{ imageRendering: zoom > 2 ? 'pixelated' : 'auto' }}
                />

                {!imagenAnotada && (
                  <svg className="absolute inset-0 w-full h-full pointer-events-none"
                    viewBox={`0 0 ${imagenNatural.w} ${imagenNatural.h}`} preserveAspectRatio="none">
                    {puntos.length >= 2 && <line x1={puntos[0].px} y1={puntos[0].py} x2={puntos[1].px} y2={puntos[1].py} stroke="#10b981" strokeWidth="3" strokeLinecap="round" opacity="0.9"/>}
                    {puntos.length >= 4 && <line x1={puntos[2].px} y1={puntos[2].py} x2={puntos[3].px} y2={puntos[3].py} stroke="#10b981" strokeWidth="3" strokeLinecap="round" opacity="0.9"/>}
                    {puntos.length >= 6 && <line x1={puntos[4].px} y1={puntos[4].py} x2={puntos[5].px} y2={puntos[5].py} stroke="#8b5cf6" strokeWidth="3" strokeLinecap="round" opacity="0.9"/>}
                    {puntos.length >= 8 && <line x1={puntos[6].px} y1={puntos[6].py} x2={puntos[7].px} y2={puntos[7].py} stroke="#8b5cf6" strokeWidth="3" strokeLinecap="round" opacity="0.9"/>}
                    {puntos.map((p, i) => {
                      const color = i < 4 ? "#10b981" : "#8b5cf6";
                      const r = Math.max(6, imagenNatural.w * 0.008);
                      return (
                        <g key={i}>
                          <circle cx={p.px} cy={p.py} r={r * 1.8} fill={color} opacity="0.15"/>
                          <circle cx={p.px} cy={p.py} r={r} fill={color} stroke="white" strokeWidth={r * 0.4}/>
                          <text x={p.px + r*1.4} y={p.py - r*0.8} fill="white" fontSize={r*1.8} fontWeight="800"
                            style={{ filter:'drop-shadow(0 1px 2px rgba(0,0,0,0.8))' }}>{i + 1}</text>
                        </g>
                      );
                    })}
                  </svg>
                )}
              </div>
            </div>
          )}

          {/* HUD inferior */}
          {imagenURL && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-slate-900/80 backdrop-blur-sm border border-slate-700 rounded-2xl px-4 py-2 text-xs font-bold text-slate-300 whitespace-nowrap">
              <span className={`w-2 h-2 rounded-full flex-shrink-0 ${modoHerramienta === 'marcar' ? 'bg-emerald-400' : 'bg-violet-400'}`}/>
              {modoHerramienta === 'marcar'
                ? puntos.length < 8
                  ? `Punto ${puntos.length + 1}/8 — ${GUIA[puntos.length].label}`
                  : '✓ Listo · Pulsa Calcular'
                : 'Modo mover · Arrastra para desplazar'}
            </div>
          )}

          {imagenURL && zoom > 1 && (
            <div className="absolute top-4 right-4 bg-slate-900/70 backdrop-blur-sm border border-slate-700 rounded-xl px-3 py-1.5 text-xs font-black text-slate-300 tabular-nums">
              {Math.round(zoom * 100)}%
            </div>
          )}

          {imagenURL && (
            <label className="absolute top-4 left-4 cursor-pointer bg-slate-900/70 backdrop-blur-sm border border-slate-700 hover:border-emerald-500 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-400 hover:text-emerald-400 transition flex items-center gap-1.5">
              <ImageIcon size={13}/> Nueva imagen
              <input type="file" className="hidden" accept="image/*" onChange={manejarSubida}/>
            </label>
          )}
        </div>

        {/* ── PANEL LATERAL ── */}
        <div className="flex flex-col gap-3 overflow-hidden flex-shrink-0" style={{ width:'300px' }}>

          {/* Secuencia de marcado */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-4 flex-shrink-0">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
              Secuencia de Marcado
            </p>
            <div className="grid grid-cols-2 gap-1.5">
              {GUIA.map((g, i) => {
                const completado = puntos.length > i;
                const activo     = puntos.length === i;
                return (
                  <div
                    key={i}
                    className={`flex items-center gap-1.5 px-2 py-1.5 rounded-xl text-[11px] font-bold transition-all ${
                      activo      ? 'text-white shadow-sm'
                      : completado ? 'text-slate-500'
                      : 'text-slate-300 bg-slate-50'
                    }`}
                    style={activo ? { background: g.color } : completado ? { background: g.color + '18' } : {}}
                  >
                    <div
                      className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-black flex-shrink-0 border ${
                        activo ? 'border-white/60 text-white' : completado ? 'border-current' : 'border-slate-200'
                      }`}
                      style={completado && !activo ? { color: g.color, borderColor: g.color + '60' } : {}}
                    >
                      {completado && !activo ? '✓' : i + 1}
                    </div>
                    <span className="leading-tight">{g.label}</span>
                  </div>
                );
              })}
            </div>
            <p className="text-[10px] text-slate-400 text-center mt-2">
              🖱 Rueda → Zoom &nbsp;·&nbsp; Modo mover → Pan
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-3 flex items-start gap-2 flex-shrink-0">
              <AlertCircle size={15} className="text-red-500 flex-shrink-0 mt-0.5"/>
              <p className="text-xs text-red-700 font-semibold">{error}</p>
            </div>
          )}

          {/* Resultado */}
          {resultado !== null && infoClinica && (
            <div className={`bg-white rounded-3xl border-2 shadow-xl flex flex-col overflow-hidden flex-1 min-h-0 ${infoClinica.border}`}>
              <div className="p-4 flex flex-col gap-2.5 h-full overflow-hidden">

                {/* Badge + número */}
                <div className="flex items-center justify-between gap-2 flex-shrink-0">
                  <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-white text-[10px] font-black uppercase tracking-widest ${infoClinica.badge}`}>
                    <CheckCircle2 size={12}/> {infoClinica.nivel}
                  </div>
                  <div className={`text-5xl font-black tracking-tighter leading-none ${infoClinica.text}`}>
                    {resultado}<span className="text-2xl opacity-60">°</span>
                  </div>
                </div>

                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex-shrink-0">
                  Ángulo de Cobb Supervisado
                </p>

                {/* Diagnóstico */}
                <div className={`p-3 rounded-2xl border flex-shrink-0 ${infoClinica.bg} ${infoClinica.border}`}>
                  <div className="flex items-center gap-1.5 mb-1">
                    <Stethoscope size={13} className={infoClinica.text}/>
                    <span className={`text-[10px] font-black uppercase tracking-widest ${infoClinica.text}`}>Diagnóstico</span>
                  </div>
                  <p className="text-xs text-slate-600 font-semibold leading-snug">{infoClinica.mensaje}</p>
                </div>

                {/* Indicación */}
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex-shrink-0">
                  <div className="flex items-center gap-1.5 mb-1 text-slate-400">
                    <Info size={13}/>
                    <span className="text-[10px] font-black uppercase tracking-widest">Indicación</span>
                  </div>
                  <p className="text-xs text-slate-500 font-semibold leading-snug italic">{infoClinica.recomendacion}</p>
                </div>

                {/* Imagen anotada */}
                {imagenAnotada && (
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-xl flex-shrink-0">
                    <CheckCircle2 size={12} className="text-emerald-500 flex-shrink-0"/>
                    <p className="text-[11px] text-emerald-700 font-semibold">Imagen anotada en el visor</p>
                  </div>
                )}

                {/* ── Botones de acción ── */}
                <div className="mt-auto flex flex-col gap-2 flex-shrink-0">

                  {/* Guardar en historial */}
                  <button
                    onClick={guardarEnHistorial}
                    disabled={guardando || guardado}
                    className={`w-full py-2.5 rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition-all shadow-md ${
                      guardado    ? 'bg-emerald-500 text-white shadow-emerald-200'
                      : guardando ? 'bg-slate-200 text-slate-400 cursor-wait'
                      : 'bg-slate-900 text-white hover:bg-emerald-600 shadow-slate-200'
                    }`}
                  >
                    {guardando ? <Loader2 size={15} className="animate-spin"/> : guardado ? <CheckCircle2 size={15}/> : <Save size={15}/>}
                    {guardado ? 'Guardado' : guardando ? 'Guardando…' : 'Guardar en Historial'}
                  </button>

                  {/* Descargar PDF */}
                  <button
                    onClick={descargarPDF}
                    disabled={descargando}
                    className={`w-full py-2.5 rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition-all border-2 ${
                      descargando
                        ? 'border-slate-200 bg-slate-50 text-slate-400 cursor-wait'
                        : `border-current ${infoClinica.text} hover:bg-slate-50`
                    }`}
                  >
                    {descargando
                      ? <><Loader2 size={15} className="animate-spin"/> Generando PDF…</>
                      : <><FileDown size={15}/> Descargar Informe PDF</>
                    }
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}