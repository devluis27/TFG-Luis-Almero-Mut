import { useNavigate } from 'react-router-dom';

export default function Login() {
  const navigate = useNavigate();

  const manejarLogin = (e) => {
    e.preventDefault();
    navigate('/dashboard');
  };

  return (
    <div className="flex justify-center items-center min-h-[60vh]">
      <div className="bg-white p-8 rounded-2xl shadow-xl border border-emerald-100 w-full max-w-md">
        <h2 className="text-2xl font-black text-slate-900 mb-6 text-center">Acceso al Sistema</h2>
        
        <form onSubmit={manejarLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Usuario</label>
            <input 
              required
              type="email" 
              className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none transition" 
              placeholder="doctor@hospital.com" 
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Contraseña</label>
            <input 
              required
              type="password" 
              className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none transition" 
              placeholder="••••••••" 
            />
          </div>
          
          <button 
            type="submit" 
            className="w-full bg-emerald-500 hover:bg-emerald-400 text-white font-bold py-3 rounded-lg transition shadow-lg shadow-emerald-100 mt-4"
          >
            Entrar al Panel
          </button>
        </form>
      </div>
    </div>
  );
}