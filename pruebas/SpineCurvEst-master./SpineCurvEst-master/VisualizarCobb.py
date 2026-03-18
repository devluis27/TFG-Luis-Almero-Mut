import cv2
import pandas as pd
import numpy as np
import math
import os

def visualizar_cobb(csv_path, img_dir, output_dir):
    if not os.path.exists(output_dir): os.makedirs(output_dir)
    
    # Cargar datos y rellenar posibles huecos con 0 para evitar el error de NaN
    df = pd.read_csv(csv_path, header=None).fillna(0)
    nombres_path = "Object_Detection/data/labels/val_filenames.csv"
    nombres = pd.read_csv(nombres_path, header=None)[0].values

    for i, row in df.iterrows():
        if i >= len(nombres): break
        
        img_path = os.path.join(img_dir, nombres[i])
        img = cv2.imread(img_path)
        if img is None:
            print(f"Error: No se pudo leer {nombres[i]}")
            continue
        
        h, w, _ = img.shape
        coords = row.values
        
        # Validar si la fila está vacía o tiene ceros (fallo de detección)
        if np.all(coords == 0):
            print(f"Saltando {nombres[i]}: No se detectaron landmarks.")
            continue

        all_x = coords[:68] * w
        all_y = coords[68:] * h
        
        info_vertebras = []
        try:
            for v in range(17):
                idx = v * 4
                x, y = all_x[idx:idx+4], all_y[idx:idx+4]
                
                # Pendientes
                m_sup = (y[1] - y[0]) / (x[1] - x[0] + 1e-6)
                m_inf = (y[3] - y[2]) / (x[3] - x[2] + 1e-6)
                
                # Guardamos info
                info_vertebras.append({'ang': math.degrees(math.atan(m_sup)), 'pts': (int(x[0]), int(y[0]), int(x[1]), int(y[1]))})
                info_vertebras.append({'ang': math.degrees(math.atan(m_inf)), 'pts': (int(x[2]), int(y[2]), int(x[3]), int(y[3]))})

            # Cálculo de Cobb
            v_min = min(info_vertebras, key=lambda x: x['ang'])
            v_max = max(info_vertebras, key=lambda x: x['ang'])
            cobb_angle = v_max['ang'] - v_min['ang']

            # Dibujar líneas extremas
            for v_extrema, color in [(v_min, (255, 0, 0)), (v_max, (0, 255, 0))]:
                cv2.line(img, (v_extrema['pts'][0], v_extrema['pts'][1]), 
                         (v_extrema['pts'][2], v_extrema['pts'][3]), color, 5)

            # Escribir resultado
            cv2.putText(img, f"Cobb: {cobb_angle:.2f} deg", (50, 150), 
                        cv2.FONT_HERSHEY_SIMPLEX, 2, (0, 0, 255), 5)
            
            output_path = os.path.join(output_dir, f"cobb_{nombres[i]}")
            cv2.imwrite(output_path, img)
            print(f"Procesada {nombres[i]}: Cobb = {cobb_angle:.2f}°")
            
        except Exception as e:
            print(f"Error procesando {nombres[i]}: {e}")

if __name__ == "__main__":
    visualizar_cobb('test_results/val_landmarks.csv', 'Object_Detection/data/val/', 'test_results/')