import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-[#fcfdfc] font-sans selection:bg-emerald-200 text-slate-900">
        <Navbar />
        <main className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/dashboard" element={<Dashboard />} /> 
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;