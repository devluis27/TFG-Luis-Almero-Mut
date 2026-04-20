from fastapi import FastAPI, UploadFile, File, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
import subprocess
import shutil
import os
import json
import jwt
import time
from datetime import datetime, timedelta
from dotenv import load_dotenv 

from database import SessionLocal, engine
import models
from passlib.context import CryptContext

models.Base.metadata.create_all(bind=engine)

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

load_dotenv("clave.env")
SECRET_KEY = os.getenv("SECRET_KEY")
if not SECRET_KEY:
    raise ValueError("¡Falta la SECRET_KEY en el archivo clave.env!")
ALGORITHM = "HS256"

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- CONFIGURACIÓN DE RUTAS ---
BASE_DIR = "/home/luis/Escritorio/TFG-Luis-Almero-Mut"
CORE_DIR = os.path.join(BASE_DIR, "backend", "core") 
TEST_RESULTS_DIR = os.path.join(CORE_DIR, "test_results")
VAL_DIR = os.path.join(CORE_DIR, "Object_Detection", "data", "val")
CSV_FILENAMES = os.path.join(CORE_DIR, "Object_Detection", "data", "labels", "val_filenames.csv")
JSON_RESULTADO = os.path.join(CORE_DIR, "resultado_cobb.json")

SCRIPT_DETECCION = os.path.join(CORE_DIR, "TestAll.py")
SCRIPT_COBB = os.path.join(CORE_DIR, "VisualizarCobbGOD.py")

os.makedirs(TEST_RESULTS_DIR, exist_ok=True)
app.mount("/resultados", StaticFiles(directory=TEST_RESULTS_DIR), name="resultados")


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@app.post("/registro")
async def registro(usuario: dict, db: Session = Depends(get_db)):
    existe = db.query(models.Usuario).filter(models.Usuario.correo == usuario["correo"]).first()
    if existe:
        raise HTTPException(status_code=400, detail="El correo ya está registrado")
    
    hashed_pwd = pwd_context.hash(usuario["password"])
    nuevo_usuario = models.Usuario(
        nombre=usuario["nombre"],
        apellidos=usuario["apellidos"],
        correo=usuario["correo"],
        telefono=usuario["telefono"],
        password_hash=hashed_pwd
    )
    db.add(nuevo_usuario)
    db.commit()
    return {"mensaje": "Usuario creado con éxito"}

@app.post("/login")
async def login(credenciales: dict, db: Session = Depends(get_db)):
    usuario = db.query(models.Usuario).filter(models.Usuario.correo == credenciales["correo"]).first()
    if not usuario or not pwd_context.verify(credenciales["password"], usuario.password_hash):
        raise HTTPException(status_code=401, detail="Correo o contraseña incorrectos")
    
    expiracion = datetime.utcnow() + timedelta(hours=24)
    token_data = {"sub": str(usuario.id), "exp": expiracion}
    token = jwt.encode(token_data, SECRET_KEY, algorithm=ALGORITHM)
    
    return {
        "access_token": token, 
        "token_type": "bearer", 
        "usuario_id": usuario.id,
        "nombre": usuario.nombre
    }

@app.get("/usuario/{usuario_id}")
async def obtener_usuario(usuario_id: int, db: Session = Depends(get_db)):
    usuario = db.query(models.Usuario).filter(models.Usuario.id == usuario_id).first()
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    return {
        "nombre": usuario.nombre,
        "apellidos": usuario.apellidos,
        "correo": usuario.correo,
        "telefono": usuario.telefono
    }

@app.put("/actualizar-perfil/{usuario_id}")
async def actualizar_perfil(usuario_id: int, datos: dict, db: Session = Depends(get_db)):
    usuario = db.query(models.Usuario).filter(models.Usuario.id == usuario_id).first()
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    
    usuario.nombre = datos.get("nombre", usuario.nombre)
    usuario.apellidos = datos.get("apellidos", usuario.apellidos)
    usuario.correo = datos.get("correo", usuario.correo)
    usuario.telefono = datos.get("telefono", usuario.telefono)
    
    db.commit()
    return {"mensaje": "Perfil actualizado", "nombre": usuario.nombre}

@app.post("/analizar")
async def analizar(file: UploadFile = File(...), usuario_id: int = 1, db: Session = Depends(get_db)):
    try:
        os.makedirs(VAL_DIR, exist_ok=True)
        ruta_imagen = os.path.join(VAL_DIR, file.filename)
        with open(ruta_imagen, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        os.makedirs(os.path.dirname(CSV_FILENAMES), exist_ok=True)
        os.makedirs(TEST_RESULTS_DIR, exist_ok=True)
        with open(CSV_FILENAMES, "w") as f:
            f.write(file.filename)

        subprocess.run(["python", SCRIPT_DETECCION], cwd=CORE_DIR, check=True)
        subprocess.run(["python", SCRIPT_COBB], cwd=CORE_DIR, check=True)

        if os.path.exists(JSON_RESULTADO):
            with open(JSON_RESULTADO, "r") as f:
                datos = json.load(f)
                angulo_final = datos.get("cobb_angle", 0.0)
                
            nuevo_registro = models.Historial(
                usuario_id=usuario_id, 
                angulo_cobb=angulo_final
            )
            db.add(nuevo_registro)
            db.commit()
        else:
            angulo_final = 0.0

        timestamp = int(time.time())
        return {
            "estado": "éxito",
            "angulo_simulado": angulo_final,
            "imagen_procesada": f"http://127.0.0.1:8000/resultados/procesadas/RESULTADO_{file.filename}?t={timestamp}",
            "mensaje": f"Análisis guardado"
        }

    except Exception as e:
        return {"estado": "error", "mensaje": str(e)}

@app.get("/historial/{usuario_id}")
async def obtener_historial(usuario_id: int, db: Session = Depends(get_db)):
    registros = db.query(models.Historial).filter(
        models.Historial.usuario_id == usuario_id
    ).order_by(models.Historial.fecha_medicion.desc()).all()
    
    return registros