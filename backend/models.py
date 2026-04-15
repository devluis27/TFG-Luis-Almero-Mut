from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from database import Base
import datetime

class Usuario(Base):
    __tablename__ = "usuarios"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String)
    apellidos = Column(String)
    correo = Column(String, unique=True, index=True)
    telefono = Column(String)
    password_hash = Column(String) # Guardaremos la clave cifrada
    fecha_registro = Column(DateTime, default=datetime.datetime.utcnow)

    # Relación: Un usuario tiene múltiples registros en su historial
    historial = relationship("Historial", back_populates="propietario")

class Historial(Base):
    __tablename__ = "historiales"

    id = Column(Integer, primary_key=True, index=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.id"))
    angulo_cobb = Column(Float)
    fecha_medicion = Column(DateTime, default=datetime.datetime.utcnow)

    # Relación inversa
    propietario = relationship("Usuario", back_populates="historial")