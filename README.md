# TFG-Luis-Almero-Mut
# Implementación y Mejora de técnicas existentes para la medición del grado de desviación en una columna vertebral en escoliosis (curvatura de Cobb)

Este proyecto de fin de grado (TFG) consiste en una plataforma web capaz de procesar radiografías de columna vertebral para calcular el **Ángulo de Cobb** de forma automática. Utiliza un pipeline de Inteligencia Artificial en dos etapas: detección de vértebras mediante **Luminoth** y localización de landmarks con una arquitectura **DenseNet**.

## 🛠 Tecnologías Utilizadas

### Backend (Motor de IA)
* **Lenguaje:** Python 3.7
* **Framework API:** FastAPI
* **Servidor ASGI:** Uvicorn
* **Base de Datos:** SQLite
* **IA/ML:** TensorFlow 1.15, Keras, Luminoth
* **Procesamiento de Datos:** OpenCV, Pandas, NumPy, Math

### Frontend (Interfaz Web)
* **Framework:** React.js
* **Herramienta de Construcción:** Vite
* **Gestión de Estados:** React Hooks
* **Estilos:** CSS3 / Tailwind

---

## 🚀 Guía de Despliegue

Sigue estos pasos para configurar el entorno y ejecutar el proyecto en tu máquina local.

### 1. Preparación del Entorno (Conda)

Es fundamental usar un entorno aislado debido a las dependencias específicas de TensorFlow 1.15.

```bash
# Crear el entorno virtual con Python 3.7
conda create -n spine_env python=3.7

# Activar el entorno
conda activate spine_env
```

### 2. Instalación del Backend

Navega a la carpeta del proyecto e instala las dependencias necesarias:

```bash
# Entrar en la carpeta del backend
cd backend/core

# Instalar dependencias de Python
pip install -r requirements.txt
```
*Nota: Asegúrate de tener instalados los drivers de NVIDIA si planeas usar GPU, de lo contrario TensorFlow funcionará en CPU.*

### 3. Instalación del Frontend

Abre una nueva terminal y navega a la carpeta del frontend para instalar los paquetes de Node.js:

```bash
# Entrar en la carpeta del frontend
cd frontend

# Instalar dependencias
npm install
```

---

## 💻 Ejecución del Proyecto

Para que el sistema funcione, ambos servidores (Backend y Frontend) deben estar activos simultáneamente.

### Paso A: Iniciar el Backend (Servidor de IA)
Desde la terminal con el entorno `spine_env` activo:
```bash
cd backend
uvicorn main:app --reload
```
El servidor estará disponible en `http://127.0.0.1:8000`.

### Paso B: Iniciar el Frontend (Interfaz de Usuario)
Desde otra terminal:
```bash
cd frontend
npm run dev
```
La aplicación web se abrirá normalmente en `http://localhost:5173`.

---

## 🗄️ Gestión de la Base de Datos
El sistema utiliza SQLite para la persistencia de usuarios y el historial de mediciones. Y se pueden consultar los datos directamente desde la terminal mediante el siguiente comando:
```bash
cd backend
sqlite3 spine_project.db
```

---

## 📂 Estructura del Proyecto

* `/backend`: Contiene la lógica de FastAPI (`main.py`).
* `/backend/core`: Contiene los modelos de IA y scripts de procesamiento (`TestAll.py`, `VisualizarCobbGOD.py`).
* `/frontend`: Código fuente de la aplicación React.
* `/test_results`: Almacena temporalmente los resultados de las inferencias y el archivo JSON de salida.

