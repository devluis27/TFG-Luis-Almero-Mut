from fastapi import FastAPI, UploadFile, File, Form, Depends, HTTPException, Response
from utils_informe import generar_pdf_escoliosis
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
from core.calculo_manual import process_manual_measurement

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
    
    # Procesamiento de la fecha de nacimiento
    fecha_nac_str = usuario.get("fecha_nacimiento")
    fecha_nac = None
    if fecha_nac_str:
        try:
            # Convertimos el string (YYYY-MM-DD) a un objeto de fecha
            fecha_nac = datetime.strptime(fecha_nac_str, "%Y-%m-%d").date()
        except ValueError:
            raise HTTPException(status_code=400, detail="Formato de fecha inválido. Debe ser YYYY-MM-DD")

    nuevo_usuario = models.Usuario(
        nombre=usuario["nombre"],
        apellidos=usuario["apellidos"],
        correo=usuario["correo"],
        telefono=usuario["telefono"],
        fecha_nacimiento=fecha_nac,
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
        "telefono": usuario.telefono,
        "fecha_nacimiento": usuario.fecha_nacimiento.strftime("%Y-%m-%d") if usuario.fecha_nacimiento else None
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
    
    # Procesar la fecha de nacimiento actualizada
    fecha_nac_str = datos.get("fecha_nacimiento")
    if fecha_nac_str:
        try:
            from datetime import datetime # Asegúrate de que esto esté importado al inicio de main.py
            usuario.fecha_nacimiento = datetime.strptime(fecha_nac_str, "%Y-%m-%d").date()
        except ValueError:
            pass # Si el formato no es válido, simplemente no lo actualizamos
    
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
    ).order_by(models.Historial.fecha_medicion.asc()).all()

    return [
        {
            "id": r.id,
            "angulo_cobb": r.angulo_cobb,
            # Fecha serializada como string ISO sin sufijo Z → hora local tal cual está en BD
            "fecha_medicion": r.fecha_medicion.strftime("%Y-%m-%dT%H:%M:%S") if r.fecha_medicion else None,
        }
        for r in registros
    ]

@app.get("/descargar-informe")
async def descargar_informe(
    usuario_id: int,
    angulo: float,
    nivel: str,
    mensaje: str,
    imagen: str,
    recomendacion: str = "",
    db: Session = Depends(get_db)
):
    usuario = db.query(models.Usuario).filter(models.Usuario.id == usuario_id).first()
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
 
    ruta_completa_imagen = os.path.join(TEST_RESULTS_DIR, "procesadas", imagen)
    if not os.path.exists(ruta_completa_imagen):
        raise HTTPException(status_code=404, detail="La imagen no existe en el servidor")
 
    try:
        pdf_bytes = generar_pdf_escoliosis(
            nombre=usuario.nombre,
            apellidos=usuario.apellidos,
            fecha_nacimiento=usuario.fecha_nacimiento.strftime("%d/%m/%Y") if usuario.fecha_nacimiento else None,
            angulo=angulo,
            nivel=nivel,
            mensaje=mensaje,
            ruta_imagen=ruta_completa_imagen,
            metodo="ia",
            recomendacion=recomendacion,
        )
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f"attachment; filename=Informe_{usuario.nombre}.pdf"
            }
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error interno generando el PDF: {str(e)}")

@app.post("/medicion-manual")
async def medicion_manual(
    imagen: UploadFile = File(...),
    puntos_superior: str = Form(...),
    puntos_inferior: str = Form(...),
    usuario_id: int = Form(default=0),
):
    import tempfile, base64, json as _json
 
    top = _json.loads(puntos_superior)
    bot = _json.loads(puntos_inferior)
 
    with tempfile.NamedTemporaryFile(suffix=".jpg", delete=False) as tmp:
        tmp.write(await imagen.read())
        tmp_path = tmp.name
 
    # Ruta donde se guardará la imagen anotada para el PDF posterior
    os.makedirs(os.path.join(TEST_RESULTS_DIR, "procesadas"), exist_ok=True)
    output_path = os.path.join(
        TEST_RESULTS_DIR, "procesadas", f"SUPERVISADO_{usuario_id}.jpg"
    ) if usuario_id else None
 
    result = process_manual_measurement(tmp_path, top, bot, output_path=output_path)
    os.unlink(tmp_path)
 
    if not result["success"]:
        raise HTTPException(status_code=400, detail=result["error"])
 
    return {
        "cobb_angle": result["cobb_angle"],
        "imagen_anotada": base64.b64encode(result["annotated_image"]).decode()
    }

@app.get("/descargar-informe-supervisado")
async def descargar_informe_supervisado(
    usuario_id: int,
    angulo: float,
    nivel: str,
    mensaje: str,
    recomendacion: str = "",
    db: Session = Depends(get_db)
):
    import base64

    usuario = db.query(models.Usuario).filter(models.Usuario.id == usuario_id).first()
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    ruta_imagen_anotada = os.path.join(
        TEST_RESULTS_DIR, "procesadas", f"SUPERVISADO_{usuario_id}.jpg"
    )

    # Debug: muestra en consola si el archivo existe
    print(f"[PDF] Buscando imagen en: {ruta_imagen_anotada}")
    print(f"[PDF] Existe: {os.path.exists(ruta_imagen_anotada)}")

    try:
        pdf_bytes = generar_pdf_escoliosis(
            nombre=usuario.nombre,
            apellidos=usuario.apellidos,
            fecha_nacimiento=usuario.fecha_nacimiento.strftime("%d/%m/%Y") if usuario.fecha_nacimiento else None,
            angulo=angulo,
            nivel=nivel,
            mensaje=mensaje,
            ruta_imagen=ruta_imagen_anotada,
            metodo="supervisado",
            recomendacion=recomendacion,
        )
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f"attachment; filename=Informe_Supervisado_{usuario.nombre}.pdf"
            }
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generando PDF: {str(e)}")

@app.post("/guardar-medicion-manual")
async def guardar_manual(datos: dict, db: Session = Depends(get_db)):
    usuario_id = datos.get("usuario_id")
    angulo = datos.get("angulo")

    if not usuario_id or angulo is None:
        raise HTTPException(status_code=400, detail="Faltan datos obligatorios")

    try:
        nueva_medicion = models.Historial(
            usuario_id=usuario_id,
            angulo_cobb=float(angulo)
        )
        db.add(nueva_medicion)
        db.commit()
        return {"estado": "éxito", "mensaje": "Medición guardada en el historial"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error al guardar: {str(e)}")