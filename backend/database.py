from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# El archivo de la base de datos se creará automáticamente en la raíz
SQLALCHEMY_DATABASE_URL = "sqlite:///./spine_project.db"

# El motor de conexión
engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)

# Sesión local para interactuar con los datos
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Clase base de la que heredarán todos tus modelos
Base = declarative_base()