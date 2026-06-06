import { createContext, useContext, useState } from 'react';

const AnalisisContext = createContext(null);

export function AnalisisProvider({ children }) {
  const [archivo, setArchivo] = useState(null);
  const [vistaPrevia, setVistaPrevia] = useState(null);
  const [imagenProcesada, setImagenProcesada] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [resultado, setResultado] = useState(null);
  const [error, setError] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [guardado, setGuardado] = useState(false);

  const limpiarTodo = () => {
    setArchivo(null);
    setVistaPrevia(null);
    setImagenProcesada(null);
    setResultado(null);
    setError(null);
    setGuardado(false);
  };

  return (
    <AnalisisContext.Provider value={{
      archivo, setArchivo,
      vistaPrevia, setVistaPrevia,
      imagenProcesada, setImagenProcesada,
      cargando, setCargando,
      resultado, setResultado,
      error, setError,
      guardando, setGuardando,
      guardado, setGuardado,
      limpiarTodo,
    }}>
      {children}
    </AnalisisContext.Provider>
  );
}

export function useAnalisis() {
  return useContext(AnalisisContext);
}