import tensorflow as tf
import cv2
import numpy as np
import os

# Ruta al modelo .h5 (ajústala a tu carpeta real)
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "modelos", "model-306.h5")

# Cargamos el modelo una vez
print("Cargando modelo .h5...")
modelo = tf.keras.models.load_model(MODEL_PATH)

def obtener_landmarks_modelo(img_path):
    # Leer imagen
    img = cv2.imread(img_path)
    # IMPORTANTE: Cambia (512, 512) por el tamaño que use tu modelo original
    img_res = cv2.resize(img, (512, 512)) 
    img_res = img_res / 255.0
    img_res = np.expand_dims(img_res, axis=0)

    # Predicción (los 136 puntos)
    pred = modelo.predict(img_res)[0]
    return pred