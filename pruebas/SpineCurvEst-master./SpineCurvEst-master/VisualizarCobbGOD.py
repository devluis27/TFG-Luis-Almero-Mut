import cv2
import pandas as pd
import numpy as np
import math
import os

def visualizar_cobb_final(csv_path, img_dir, output_dir):
    if not os.path.exists(output_dir): os.makedirs(output_dir)
    
    # Cargar datos
    df = pd.read_csv(csv_path, header=None).fillna(0)
    nombres_path = "Object_Detection/data/labels/val_filenames.csv"
    nombres = pd.read_csv(nombres_path, header=None)[0].values

    print("Generando imágenes con formato profesional...")

    for i, row in df.iterrows():
        if i >= len(nombres): break
        img_path = os.path.join(img_dir, nombres[i])
        img = cv2.imread(img_path)
        if img is None: continue
        
        h, w, _ = img.shape
        coords = row.values
        if np.all(coords == 0): continue

        all_x, all_y = coords[:68] * w, coords[68:] * h
        info_vertebras = []
        
        try:
            for v in range(17):
                idx = v * 4
                x, y = all_x[idx:idx+4], all_y[idx:idx+4]
                m_sup = (y[1] - y[0]) / (x[1] - x[0] + 1e-6)
                m_inf = (y[3] - y[2]) / (x[3] - x[2] + 1e-6)
                info_vertebras.append({'ang': math.degrees(math.atan(m_sup)), 'pts': (int(x[0]), int(y[0]), int(x[1]), int(y[1]))})
                info_vertebras.append({'ang': math.degrees(math.atan(m_inf)), 'pts': (int(x[2]), int(y[2]), int(x[3]), int(y[3]))})

            v_min = min(info_vertebras, key=lambda x: x['ang'])
            v_max = max(info_vertebras, key=lambda x: x['ang'])
            cobb_angle = v_max['ang'] - v_min['ang']

            # --- CONFIGURACIÓN DE TEXTO "ESTÁTICO" Y GRANDE ---
            # Ajustamos la escala para que el texto siempre sea proporcional al ancho
            font_scale = w / 450  # Escala dinámica para que siempre se vea grande
            thickness = int(font_scale * 2)
            pos_x, pos_y = int(w * 0.05), int(h * 0.08)
            texto = f"Cobb: {cobb_angle:.2f} deg"

            # Dibujamos un borde negro primero (para legibilidad total)
            cv2.putText(img, texto, (pos_x, pos_y), cv2.FONT_HERSHEY_SIMPLEX, 
                        font_scale, (0, 0, 0), thickness + 4, cv2.LINE_AA)
            # Dibujamos el texto amarillo encima
            cv2.putText(img, texto, (pos_x, pos_y), cv2.FONT_HERSHEY_SIMPLEX, 
                        font_scale, (0, 255, 255), thickness, cv2.LINE_AA)

            # --- DIBUJAR LÍNEAS DE VÉRTEBRAS ---
            # Línea Azul (Inferior)
            cv2.line(img, (v_min['pts'][0], v_min['pts'][1]), (v_min['pts'][2], v_min['pts'][3]), (255, 0, 0), thickness + 2)
            # Línea Verde (Superior)
            cv2.line(img, (v_max['pts'][0], v_max['pts'][1]), (v_max['pts'][2], v_max['pts'][3]), (0, 255, 0), thickness + 2)

            # Guardar resultado final
            cv2.imwrite(os.path.join(output_dir, f"FINAL_{nombres[i]}"), img)
            print(f"OK: {nombres[i]} -> {cobb_angle:.2f}°")
            
        except Exception as e:
            print(f"Error en {nombres[i]}: {e}")

if __name__ == "__main__":
    visualizar_cobb_final('test_results/val_landmarks.csv', 'Object_Detection/data/val/', 'test_results/')