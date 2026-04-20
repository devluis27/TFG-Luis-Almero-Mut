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
        
        # --- 1. RECUPERAMOS LOS PUNTOS ROJOS DE DETECCIÓN (LANDMARKS) ---
        radio_punto = max(2, int(w * 0.006)) # Tamaño dinámico según la resolución
        for i in range(68):
            cv2.circle(img, (int(all_x[i]), int(all_y[i])), radius=radio_punto, color=(0, 0, 255), thickness=-1)

        info_vertebras = []
        
        # --- 2. CÁLCULO DE PENDIENTES Y ÁNGULOS ---
        for v in range(17):
            idx = v * 4
            x, y = all_x[idx:idx+4], all_y[idx:idx+4]
            # Calculamos pendientes de la placa superior e inferior
            m_sup = (y[1] - y[0]) / (x[1] - x[0] + 1e-6)
            m_inf = (y[3] - y[2]) / (x[3] - x[2] + 1e-6)
            info_vertebras.append({'ang': math.degrees(math.atan(m_sup)), 'pts': (int(x[0]), int(y[0]), int(x[1]), int(y[1]))})
            info_vertebras.append({'ang': math.degrees(math.atan(m_inf)), 'pts': (int(x[2]), int(y[2]), int(x[3]), int(y[3]))})

        # Encontramos la vértebra con mayor y menor inclinación
        v_min = min(info_vertebras, key=lambda x: x['ang'])
        v_max = max(info_vertebras, key=lambda x: x['ang'])
        cobb_angle = abs(v_max['ang'] - v_min['ang'])

        # Guardamos JSON para el frontend
        resultado_para_web = {
            "cobb_angle": round(cobb_angle, 2),
            "nombre_imagen": os.path.basename(img_path)
        }
        with open(os.path.join(BASE_DIR, "resultado_cobb.json"), "w") as f:
            json.dump(resultado_para_web, f)

        # --- 3. DIBUJADO DE MEJORAS CLÍNICAS (LÍNEAS Y ÁNGULOS) ---
        font_scale = w / 600
        thickness = max(1, int(font_scale * 2))

        # Determinar cuál es la vértebra superior (Inicio) e inferior (Fin) por su posición Y
        if v_min['pts'][1] < v_max['pts'][1]:
            v_inicio, v_fin = v_min, v_max
        else:
            v_inicio, v_fin = v_max, v_min

        # Función para extender la línea de la placa vertebral por toda la pantalla
        def obtener_linea_extendida(pts):
            x1, y1, x2, y2 = pts
            m = (y2 - y1) / (x2 - x1 + 1e-6)
            lx, rx = -w, w * 2
            ly = int(y1 + m * (lx - x1))
            ry = int(y1 + m * (rx - x1))
            return (lx, ly), (rx, ry)

        pt_in1, pt_in2 = obtener_linea_extendida(v_inicio['pts'])
        pt_fin1, pt_fin2 = obtener_linea_extendida(v_fin['pts'])

        # Dibujar las líneas proyectadas (finas y de color amarillo)
        color_proyeccion = (0, 200, 255) # BGR: Amarillo
        cv2.line(img, pt_in1, pt_in2, color_proyeccion, thickness, cv2.LINE_AA)
        cv2.line(img, pt_fin1, pt_fin2, color_proyeccion, thickness, cv2.LINE_AA)

        # Dibujar las placas vertebrales exactas (gruesas) para resaltarlas sobre los puntos rojos
        color_inicio = (0, 255, 0) # Verde
        color_fin = (255, 0, 255)  # Magenta/Morado
        cv2.line(img, (v_inicio['pts'][0], v_inicio['pts'][1]), (v_inicio['pts'][2], v_inicio['pts'][3]), color_inicio, thickness + 2, cv2.LINE_AA)
        cv2.line(img, (v_fin['pts'][0], v_fin['pts'][1]), (v_fin['pts'][2], v_fin['pts'][3]), color_fin, thickness + 2, cv2.LINE_AA)

        # Colocar Etiquetas de "Inicio" y "Fin" a un lado de la vértebra
        offset_x = int(w * 0.05)
        cv2.putText(img, "INICIO", (v_inicio['pts'][2] + offset_x, v_inicio['pts'][3]), cv2.FONT_HERSHEY_SIMPLEX, font_scale * 0.8, color_inicio, thickness + 1, cv2.LINE_AA)
        cv2.putText(img, "FIN", (v_fin['pts'][2] + offset_x, v_fin['pts'][3]), cv2.FONT_HERSHEY_SIMPLEX, font_scale * 0.8, color_fin, thickness + 1, cv2.LINE_AA)

        # Calcular intersección para dibujar el ángulo ahí mismo (se mantiene porque es útil clínicamente)
        xdiff = (pt_in1[0] - pt_in2[0], pt_fin1[0] - pt_fin2[0])
        ydiff = (pt_in1[1] - pt_in2[1], pt_fin1[1] - pt_fin2[1])
        def det(a, b): return a[0] * b[1] - a[1] * b[0]
        div = det(xdiff, ydiff)
        
        if div != 0:
            d = (det(pt_in1, pt_in2), det(pt_fin1, pt_fin2))
            ix = int(det(d, xdiff) / div)
            iy = int(det(d, ydiff) / div)
            
            # Si la intersección cae dentro de la foto
            if 0 <= ix <= w and 0 <= iy <= h:
                cv2.circle(img, (ix, iy), radius=max(4, int(w*0.01)), color=color_proyeccion, thickness=-1)
                cv2.putText(img, f"{cobb_angle:.1f} deg", (ix + 15, iy - 15), cv2.FONT_HERSHEY_SIMPLEX, font_scale * 0.9, color_proyeccion, thickness + 1, cv2.LINE_AA)

        # Guardado final
        output_dir = os.path.join(BASE_DIR, "test_results/procesadas")
        if not os.path.exists(output_dir): os.makedirs(output_dir)
        
        output_path = os.path.join(output_dir, f"RESULTADO_{os.path.basename(img_path)}")
        cv2.imwrite(output_path, img)

        return cobb_angle, output_path

    except Exception as e:
        print(f"Error procesando: {e}")
        return None, str(e)

if __name__ == "__main__":
    archivo_nombres = os.path.join(BASE_DIR, "Object_Detection/data/labels/val_filenames.csv")
    try:
        with open(archivo_nombres, "r") as f:
            nombre_imagen = f.read().strip()
        ruta_real = os.path.join(BASE_DIR, "Object_Detection/data/val", nombre_imagen)
        print(f"Iniciando cálculo de Cobb para: {ruta_real}")
        ang, path = procesar_una_imagen(ruta_real)
        if ang is not None:
            print(f"Cálculo exitoso: {ang}° -> Imagen guardada en: {path}")
        else:
            print("El cálculo devolvió None. Revisa los landmarks.")
    except Exception as e:
        print(f"Error al ejecutar VisualizarCobbGOD directamente: {e}")