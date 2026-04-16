import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

export default function Login() {
  const navigate = useNavigate();
  const [correo, setCorreo] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(''); 

  const manejarLogin = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const response = await fetch('http://127.0.0.1:8000/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ correo, password })
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('token', data.access_token);
        localStorage.setItem('usuario_id', data.usuario_id);
        localStorage.setItem('nombre', data.nombre); // <-- LÍNEA AÑADIDA
        navigate('/dashboard');
      } else {
        setError('Correo o contraseña incorrectos');
      }
    } catch (err) {
      console.error('Error de conexión:', err);
      setError('Error al conectar con el servidor');
    }
  };

  return (
    <div className="flex justify-center items-center min-h-[60vh]">
      <div className="bg-white p-8 rounded-2xl shadow-xl border border-emerald-100 w-full max-w-md">
        <h2 className="text-2xl font-black text-slate-900 mb-6 text-center">Acceso al Sistema</h2>
        
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm text-center font-medium">
            {error}
          </div>
        )}

        <form onSubmit={manejarLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Usuario</label>
            <input 
              required
              type="email" 
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none transition" 
              placeholder="doctor@hospital.com" 
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Contraseña</label>
            <input 
              required
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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

        {/* --- BLOQUE DE REGISTRO --- */}
        <div className="mt-8 pt-6 border-t border-slate-50 text-center">
          <p className="text-slate-500 text-sm font-medium">
            ¿Aún no tienes acceso?{' '}
            <Link 
              to="/register" 
              className="text-emerald-600 font-bold hover:text-emerald-400 transition underline-offset-4 hover:underline"
            >
              Crea una cuenta
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}