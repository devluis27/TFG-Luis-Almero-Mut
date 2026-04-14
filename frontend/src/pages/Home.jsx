import { ShieldCheck, Zap, BarChart3 } from 'lucide-react';

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[85vh] text-center px-4">
      
      {/* Badge Superior */}
      <span className="bg-emerald-100 text-emerald-700 px-4 py-1 rounded-full text-sm font-bold mb-6 border border-emerald-200">
        Tecnología IA de Precisión
      </span>

      <h1 className="text-6xl font-black text-slate-900 mb-6 tracking-tight">
        Medición del Ángulo <br />
        <span className="text-emerald-500">de Cobb</span> Automatizada
      </h1>
      
      <p className="text-xl text-slate-500 mb-10 max-w-2xl leading-relaxed">
        Resultados clínicos en segundos mediante detección de landmarks vertebrales y modelos de regresión polinomial.
      </p>
      
      <button className="bg-slate-900 text-white px-10 py-4 rounded-xl font-bold text-lg flex items-center space-x-3 hover:bg-slate-800 transition shadow-xl shadow-slate-200">
        <span>Iniciar sesión</span>
      </button>

      {/* Grid de Características */}
      <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl">
        <div className="bg-emerald-50/50 p-8 rounded-2xl border border-emerald-100 flex flex-col items-center">
          <ShieldCheck className="text-emerald-500 mb-4" size={32} />
          <h3 className="text-slate-800 font-bold mb-2">Seguro</h3>
          <p className="text-slate-500 text-sm">Procesamiento local garantizando la privacidad del paciente.</p>
        </div>
        
        <div className="bg-emerald-50/50 p-8 rounded-2xl border border-emerald-100 flex flex-col items-center">
          <Zap className="text-emerald-500 mb-4" size={32} />
          <h3 className="text-slate-800 font-bold mb-2">Rápido</h3>
          <p className="text-slate-500 text-sm">Análisis completo de la columna en menos de 2 segundos.</p>
        </div>

        <div className="bg-emerald-50/50 p-8 rounded-2xl border border-emerald-100 flex flex-col items-center">
          <BarChart3 className="text-emerald-500 mb-4" size={32} />
          <h3 className="text-slate-800 font-bold mb-2">Preciso</h3>
          <p className="text-slate-500 text-sm">Margen de error reducido mediante ajuste polinomial de grado variable.</p>
        </div>
      </div>
    </div>
  );
}