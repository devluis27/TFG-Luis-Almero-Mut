from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import subprocess
import shutil
import os
import json

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- CONFIGURACIÓN DE RUTAS ABSOLUTAS ---
BASE_DIR = "/home/luis/Escritorio/TFG-Luis-Almero-Mut"
CORE_DIR = os.path.join(BASE_DIR, "backend", "core") 

VAL_DIR = os.path.join(CORE_DIR, "Object_Detection", "data", "val")
LABELS_DIR = os.path.join(CORE_DIR, "Object_Detection", "data", "labels")
CSV_FILENAMES = os.path.join(LABELS_DIR, "val_filenames.csv")
JSON_RESULTADO = os.path.join(CORE_DIR, "resultado_cobb.json")

# NUEVA RUTA: Para asegurar que test_results existe
TEST_RESULTS_DIR = os.path.join(CORE_DIR, "test_results")

SCRIPT_DETECCION = os.path.join(CORE_DIR, "TestAll.py")
SCRIPT_COBB = os.path.join(CORE_DIR, "VisualizarCobbGOD.py")

@app.post("/analizar")
async def analizar(file: UploadFile = File(...)):
    try:
        # 1. Preparación de la carpeta de entrada
        if os.path.exists(VAL_DIR):
            shutil.rmtree(VAL_DIR)
        os.makedirs(VAL_DIR, exist_ok=True)

        # 2. Guardar la radiografía
        ruta_imagen = os.path.join(VAL_DIR, file.filename)
        with open(ruta_imagen, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # 3. Asegurar que TODAS las carpetas necesarias existen
        os.makedirs(LABELS_DIR, exist_ok=True)
        os.makedirs(TEST_RESULTS_DIR, exist_ok=True) # <--- ESTO EVITA EL ERROR DE AHORA

        # Actualizar val_filenames.csv
        with open(CSV_FILENAMES, "w") as f:
            f.write(file.filename)

        # 4. Verificación de existencia de scripts
        if not os.path.exists(SCRIPT_DETECCION):
            return {"estado": "error", "mensaje": f"No se encuentra {SCRIPT_DETECCION}"}
        
        if not os.path.exists(SCRIPT_COBB):
            return {"estado": "error", "mensaje": f"No se encuentra {SCRIPT_COBB}"}

        # 5. Ejecutar Etapa 1: Detección
        print(f"Ejecutando Etapa 1 en: {SCRIPT_DETECCION}")
        subprocess.run(["python", SCRIPT_DETECCION], cwd=CORE_DIR, check=True)

        # 6. Ejecutar Etapa 2: Cálculo
        print(f"Ejecutando Etapa 2 en: {SCRIPT_COBB}")
        subprocess.run(["python", SCRIPT_COBB], cwd=CORE_DIR, check=True)

        # 7. Recoger el resultado
        if os.path.exists(JSON_RESULTADO):
            with open(JSON_RESULTADO, "r") as f:
                datos = json.load(f)
                angulo_final = datos.get("cobb_angle", 0.0)
        else:
            print("Error: No se generó el archivo resultado_cobb.json")
            angulo_final = 0.0

        return {
            "estado": "éxito",
            "angulo_simulado": angulo_final,
            "mensaje": f"Pipeline completado para {file.filename}"
        }

    except subprocess.CalledProcessError as e:
        print(f"Error en la ejecución de los scripts de Python: {e}")
        return {"estado": "error", "mensaje": "Error en la ejecución del pipeline original."}
    except Exception as e:
        print(f"Error inesperado: {e}")
        return {"estado": "error", "mensaje": str(e)}