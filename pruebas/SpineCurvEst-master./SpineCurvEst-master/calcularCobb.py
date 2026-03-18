import pandas as pd
import numpy as np
import math
import os

def calculate_cobb_angles(csv_path):
    if not os.path.exists(csv_path):
        print(f"Error: No encuentro el archivo {csv_path}")
        return

    # Leer los landmarks (17 vertebras * 4 puntos * 2 coords = 136 columnas)
    df = pd.read_csv(csv_path, header=None)
    
    print(f"\n{'Imagen':<15} | {'Ángulo de Cobb':<15}")
    print("-" * 35)

    # El archivo val_filenames.csv nos da los nombres de las imágenes para el reporte
    nombres_path = "Object_Detection/data/labels/val_filenames.csv"
    nombres = pd.read_csv(nombres_path, header=None)[0].values if os.path.exists(nombres_path) else [f"Img_{i}" for i in range(len(df))]

    for i, row in df.iterrows():
        coords = row.values
        # En tu CSV: las primeras 68 son X, las siguientes 68 son Y
        all_x = coords[:68]
        all_y = coords[68:]
        
        pendientes = []
        # Recorremos las 17 vértebras
        for v in range(17):
            idx = v * 4
            x = all_x[idx:idx+4]
            y = all_y[idx:idx+4]
            
            # Pendiente del platillo superior (puntos 0 y 1)
            # m = (y2 - y1) / (x2 - x1)
            m_sup = (y[1] - y[0]) / (x[1] - x[0] + 1e-6)
            # Pendiente del platillo inferior (puntos 2 y 3)
            m_inf = (y[3] - y[2]) / (x[3] - x[2] + 1e-6)
            
            # Convertimos a grados: angle = arctan(m)
            pendientes.append(math.degrees(math.atan(m_sup)))
            pendientes.append(math.degrees(math.atan(m_inf)))
        
        # El ángulo de Cobb es la diferencia máxima entre las inclinaciones
        # Se busca la vértebra más inclinada hacia arriba y la más inclinada hacia abajo
        angulo_cobb = max(pendientes) - min(pendientes)
        
        print(f"{nombres[i]:<15} | {angulo_cobb:>12.2f}°")

if __name__ == "__main__":
    calculate_cobb_angles('test_results/val_landmarks.csv')