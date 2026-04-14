import cv2
import pandas as pd
import numpy as np
import math
import os
import json

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

def procesar_una_imagen(img_path):
    csv_path = os.path.join(BASE_DIR, "test_results/val_landmarks.csv")
    
    if not os.path.exists(img_path):
        return None, f"Imagen no encontrada en: {img_path}"

    img = cv2.imread(img_path)
    if img is None: return None, "Error al cargar la imagen con OpenCV"
    h, w, _ = img.shape

    try:
        df = pd.read_csv(csv_path, header=None).fillna(0)
        coords = df.iloc[0].values 
        
        all_x, all_y = coords[:68] * w, coords[68:] * h
        info_vertebras = []
        
        for v in range(17):
            idx = v * 4
            x, y = all_x[idx:idx+4], all_y[idx:idx+4]
            m_sup = (y[1] - y[0]) / (x[1] - x[0] + 1e-6)
            m_inf = (y[3] - y[2]) / (x[3] - x[2] + 1e-6)
            info_vertebras.append({'ang': math.degrees(math.atan(m_sup)), 'pts': (int(x[0]), int(y[0]), int(x[1]), int(y[1]))})
            info_vertebras.append({'ang': math.degrees(math.atan(m_inf)), 'pts': (int(x[2]), int(y[2]), int(x[3]), int(y[3]))})

        v_min = min(info_vertebras, key=lambda x: x['ang'])
        v_max = max(info_vertebras, key=lambda x: x['ang'])
        cobb_angle = abs(v_max['ang'] - v_min['ang'])

        resultado_para_web = {
            "cobb_angle": round(cobb_angle, 2),
            "nombre_imagen": os.path.basename(img_path)
        }
        with open(os.path.join(BASE_DIR, "resultado_cobb.json"), "w") as f:
            json.dump(resultado_para_web, f)

        font_scale = w / 500
        thickness = int(font_scale * 2)
        cv2.putText(img, f"Cobb: {cobb_angle:.2f} deg", (int(w*0.05), int(h*0.08)), 
                    cv2.FONT_HERSHEY_SIMPLEX, font_scale, (0, 255, 255), thickness, cv2.LINE_AA)
        cv2.line(img, (v_min['pts'][0], v_min['pts'][1]), (v_min['pts'][2], v_min['pts'][3]), (255, 0, 0), thickness + 2)
        cv2.line(img, (v_max['pts'][0], v_max['pts'][1]), (v_max['pts'][2], v_max['pts'][3]), (0, 255, 0), thickness + 2)

        output_dir = os.path.join(BASE_DIR, "test_results/procesadas")
        if not os.path.exists(output_dir): os.makedirs(output_dir)
        
        output_path = os.path.join(output_dir, f"RESULTADO_{os.path.basename(img_path)}")
        cv2.imwrite(output_path, img)

        return cobb_angle, output_path

    except Exception as e:
        print(f"Error procesando: {e}")
        return None, str(e)

if __name__ == "__main__":
    # 1. Leemos el nombre de la imagen que main.py acaba de guardar
    archivo_nombres = os.path.join(BASE_DIR, "Object_Detection/data/labels/val_filenames.csv")
    
    try:
        with open(archivo_nombres, "r") as f:
            nombre_imagen = f.read().strip()
        
        # 2. Construimos la ruta exacta hacia esa imagen
        ruta_real = os.path.join(BASE_DIR, "Object_Detection/data/val", nombre_imagen)
        
        print(f"Iniciando cálculo de Cobb para: {ruta_real}")
        
        # 3. Procesamos
        ang, path = procesar_una_imagen(ruta_real)
        
        if ang is not None:
            print(f"Cálculo exitoso: {ang}° -> Imagen guardada en: {path}")
        else:
            print("El cálculo devolvió None. Revisa los landmarks.")
            
    except Exception as e:
        print(f"Error al ejecutar VisualizarCobbGOD directamente: {e}")