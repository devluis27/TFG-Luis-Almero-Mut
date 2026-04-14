import cv2
import numpy as np
import math
import os

def ejecutar_logica_cobb_original(img_path, coords):
    """
    TU LÓGICA ORIGINAL TRASPLANTADA
    """
    img = cv2.imread(img_path)
    h, w, _ = img.shape
    
    all_x, all_y = coords[:68] * w, coords[68:] * h
    info_vertebras = []
    
    for v in range(17):
        idx = v * 4
        x, y = all_x[idx:idx+4], all_y[idx:idx+4]
        
        m_sup = (y[1] - y[0]) / (x[1] - x[0] + 1e-6)
        m_inf = (y[3] - y[2]) / (x[3] - x[2] + 1e-6)
        
        info_vertebras.append({
            'ang': math.degrees(math.atan(m_sup)), 
            'pts': (int(x[0]), int(y[0]), int(x[1]), int(y[1]))
        })
        info_vertebras.append({
            'ang': math.degrees(math.atan(m_inf)), 
            'pts': (int(x[2]), int(y[2]), int(x[3]), int(y[3]))
        })

    v_min = min(info_vertebras, key=lambda x: x['ang'])
    v_max = max(info_vertebras, key=lambda x: x['ang'])
    cobb_angle = v_max['ang'] - v_min['ang']
    
    return abs(cobb_angle)