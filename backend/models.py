from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Date
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
    fecha_nacimiento = Column(Date, nullable=True)
    password_hash = Column(String)
    fecha_registro = Column(DateTime, default=datetime.datetime.now)

    historial = relationship("Historial", back_populates="propietario")

class Historial(Base):
    __tablename__ = "historiales"

    id = Column(Integer, primary_key=True, index=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.id"))
    angulo_cobb = Column(Float)
    fecha_medicion = Column(DateTime, default=datetime.datetime.now)

    propietario = relationship("Usuario", back_populates="historial")