from fastapi import FastAPI, UploadFile, File, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
import subprocess
import shutil
import os
import json
import jwt
from datetime import datetime, timedelta
from dotenv import load_dotenv 

# Imports de base de datos
from database import SessionLocal, engine
import models
from passlib.context import CryptContext

# Creamos las tablas
models.Base.metadata.create_all(bind=engine)

# Configuración para cifrar contraseñas
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# CARGAR CLAVE
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

# Dependencia para obtener la base de datos en cada petición
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# --- CONFIGURACIÓN DE RUTAS ---
BASE_DIR = "/home/luis/Escritorio/TFG-Luis-Almero-Mut"
CORE_DIR = os.path.join(BASE_DIR, "backend", "core") 
VAL_DIR = os.path.join(CORE_DIR, "Object_Detection", "data", "val")
CSV_FILENAMES = os.path.join(CORE_DIR, "Object_Detection", "data", "labels", "val_filenames.csv")
JSON_RESULTADO = os.path.join(CORE_DIR, "resultado_cobb.json")
TEST_RESULTS_DIR = os.path.join(CORE_DIR, "test_results")

SCRIPT_DETECCION = os.path.join(CORE_DIR, "TestAll.py")
SCRIPT_COBB = os.path.join(CORE_DIR, "VisualizarCobbGOD.py")

# --- ENDPOINTS DE USUARIO ---

@app.post("/registro")
async def registro(usuario: dict, db: Session = Depends(get_db)):
    # Comprobar si el correo ya existe
    existe = db.query(models.Usuario).filter(models.Usuario.correo == usuario["correo"]).first()
    if existe:
        raise HTTPException(status_code=400, detail="El correo ya está registrado")
    
    # Cifrar la contraseña
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
    # Buscamos al usuario por correo
    usuario = db.query(models.Usuario).filter(models.Usuario.correo == credenciales["correo"]).first()
    
    # Verificamos que exista y que la contraseña coincida
    if not usuario or not pwd_context.verify(credenciales["password"], usuario.password_hash):
        raise HTTPException(status_code=401, detail="Correo o contraseña incorrectos")
    
    # Si todo está bien, generamos el Token válido por 24 horas
    expiracion = datetime.utcnow() + timedelta(hours=24)
    token_data = {"sub": str(usuario.id), "exp": expiracion}
    
    # Usamos tu SECRET_KEY para firmar el token
    token = jwt.encode(token_data, SECRET_KEY, algorithm=ALGORITHM)
    
    # Devolvemos el token al frontend
    return {
        "access_token": token, 
        "token_type": "bearer", 
        "usuario_id": usuario.id,
        "nombre": usuario.nombre
    }

# ENDPOINT DE ANÁLISIS (CON GUARDADO)
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

        # Recogemos resultado y guardamos en la base de datos
        if os.path.exists(JSON_RESULTADO):
            with open(JSON_RESULTADO, "r") as f:
                datos = json.load(f)
                angulo_final = datos.get("cobb_angle", 0.0)
                
            # GUARDAMOS EN EL HISTORIAL
            nuevo_registro = models.Historial(
                usuario_id=usuario_id, 
                angulo_cobb=angulo_final
            )
            db.add(nuevo_registro)
            db.commit()
        else:
            angulo_final = 0.0

        return {
            "estado": "éxito",
            "angulo_simulado": angulo_final,
            "mensaje": f"Análisis guardado en el historial del usuario {usuario_id}"
        }

    except Exception as e:
        return {"estado": "error", "mensaje": str(e)}