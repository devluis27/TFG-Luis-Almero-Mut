"""
calculo_manual.py
=================
Módulo de medición supervisada del ángulo de Cobb.

El usuario marca sobre la radiografía:
  - 4 puntos por vértebra (esquinas: superior-izquierda, superior-derecha,
    inferior-izquierda, inferior-derecha), o bien
  - 2 puntos por vértebra (extremos del platillo vertebral superior e inferior).

A partir de esos puntos se calcula la línea del platillo de cada vértebra y,
con las dos vértebras seleccionadas (la más inclinada superior y la más
inclinada inferior), se obtiene el ángulo de Cobb como el ángulo entre las
perpendiculares a dichos platillos.

El módulo también genera una imagen anotada con:
  - Las líneas de los platillos vertebrales.
  - Las perpendiculares usadas.
  - El arco y el valor del ángulo de Cobb.

Funciones públicas
------------------
calculate_cobb_angle(points_vertebra_top, points_vertebra_bottom)
    Recibe los puntos de dos vértebras y devuelve el ángulo de Cobb (float).

draw_cobb_annotation(image_path, points_vertebra_top, points_vertebra_bottom,
                     output_path=None)
    Dibuja las líneas de medición sobre la imagen y devuelve (angle, image_bytes).

process_manual_measurement(image_path, vertebra_top_points,
                           vertebra_bottom_points, output_path=None)
    Función de alto nivel que valida, calcula y anota. Devuelve un dict con
    todos los resultados listos para serializar en la API.
"""

import math
import io
import os
import logging
from typing import List, Tuple, Optional, Dict, Any

import cv2
import numpy as np

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Tipos
# ---------------------------------------------------------------------------
Point = Tuple[float, float]   # (x, y) en píxeles de la imagen original
PointList = List[Point]        # lista de 2 o 4 puntos por vértebra


# ---------------------------------------------------------------------------
# Geometría básica
# ---------------------------------------------------------------------------

def _fit_line_to_points(points: PointList) -> Tuple[Point, float]:
    """
    Ajusta una línea a una lista de puntos por mínimos cuadrados.

    Devuelve:
        centroid  : (cx, cy) – punto medio de los puntos
        angle_rad : ángulo de la línea respecto al eje X (en radianes),
                    en el rango [-π/2, π/2]
    """
    if len(points) < 2:
        raise ValueError("Se necesitan al menos 2 puntos para ajustar una línea.")

    pts = np.array(points, dtype=np.float64)
    centroid = pts.mean(axis=0)          # (cx, cy)

    if len(points) == 2:
        # Dirección directa entre los dos puntos
        dx = pts[1, 0] - pts[0, 0]
        dy = pts[1, 1] - pts[0, 1]
        angle_rad = math.atan2(dy, dx)
    else:
        # PCA / SVD sobre los puntos centrados
        centered = pts - centroid
        _, _, vt = np.linalg.svd(centered, full_matrices=False)
        direction = vt[0]                # vector dominante
        angle_rad = math.atan2(direction[1], direction[0])

    # Normalizar al rango [-π/2, π/2] para que la "pendiente" sea consistente
    if angle_rad > math.pi / 2:
        angle_rad -= math.pi
    elif angle_rad < -math.pi / 2:
        angle_rad += math.pi

    return tuple(centroid.tolist()), angle_rad


def _perpendicular_angle(angle_rad: float) -> float:
    """Devuelve el ángulo perpendicular (rotado 90°)."""
    perp = angle_rad + math.pi / 2
    if perp > math.pi / 2:
        perp -= math.pi
    return perp


def _angle_between_lines(angle1_rad: float, angle2_rad: float) -> float:
    """
    Ángulo entre dos líneas (no dirigidas) en grados.
    Resultado siempre en [0, 90].
    """
    diff = abs(angle1_rad - angle2_rad)
    # Llevar al rango [0, π]
    while diff > math.pi:
        diff -= math.pi
    # Tomar el ángulo agudo
    if diff > math.pi / 2:
        diff = math.pi - diff
    return math.degrees(diff)


def _line_endpoints(centroid: Point, angle_rad: float,
                    half_length: float = 200.0) -> Tuple[Point, Point]:
    """
    Calcula dos puntos extremos de una línea que pasa por `centroid`
    con dirección `angle_rad`, de longitud total `2 * half_length`.
    """
    dx = math.cos(angle_rad) * half_length
    dy = math.sin(angle_rad) * half_length
    cx, cy = centroid
    return (cx - dx, cy - dy), (cx + dx, cy + dy)


# ---------------------------------------------------------------------------
# Cálculo del ángulo de Cobb
# ---------------------------------------------------------------------------

def calculate_cobb_angle(points_vertebra_top: PointList,
                         points_vertebra_bottom: PointList) -> Dict[str, Any]:
    """
    Calcula el ángulo de Cobb a partir de los puntos de dos vértebras.

    Parámetros
    ----------
    points_vertebra_top : list de (x, y)
        Puntos del platillo de la vértebra superior (2 o 4 puntos).
    points_vertebra_bottom : list de (x, y)
        Puntos del platillo de la vértebra inferior (2 o 4 puntos).

    Devuelve
    --------
    dict con:
        cobb_angle        : float  – ángulo de Cobb en grados
        top_centroid      : (x, y) – centroide de la vértebra superior
        bottom_centroid   : (x, y) – centroide de la vértebra inferior
        top_angle_rad     : float  – ángulo de la línea superior (rad)
        bottom_angle_rad  : float  – ángulo de la línea inferior (rad)
        top_perp_rad      : float  – perpendicular superior (rad)
        bottom_perp_rad   : float  – perpendicular inferior (rad)
    """
    _validate_points(points_vertebra_top, "vértebra superior")
    _validate_points(points_vertebra_bottom, "vértebra inferior")

    top_centroid, top_angle = _fit_line_to_points(points_vertebra_top)
    bot_centroid, bot_angle = _fit_line_to_points(points_vertebra_bottom)

    top_perp = _perpendicular_angle(top_angle)
    bot_perp = _perpendicular_angle(bot_angle)

    # El ángulo de Cobb es el ángulo entre las dos perpendiculares
    cobb = _angle_between_lines(top_perp, bot_perp)

    # Alternativamente (equivalente): ángulo entre las propias líneas
    # cobb = _angle_between_lines(top_angle, bot_angle)
    # Ambos métodos son equivalentes geométricamente; usamos perpendiculares
    # para ser fieles a la definición clínica.

    return {
        "cobb_angle": round(cobb, 2),
        "top_centroid": top_centroid,
        "bottom_centroid": bot_centroid,
        "top_angle_rad": top_angle,
        "bottom_angle_rad": bot_angle,
        "top_perp_rad": top_perp,
        "bottom_perp_rad": bot_perp,
    }


# ---------------------------------------------------------------------------
# Validación de puntos
# ---------------------------------------------------------------------------

def _validate_points(points: PointList, label: str = "vértebra") -> None:
    if not isinstance(points, (list, tuple)) or len(points) < 2:
        raise ValueError(
            f"Los puntos de la {label} deben ser una lista de al menos 2 pares (x, y). "
            f"Recibido: {points}"
        )
    for i, p in enumerate(points):
        if not (isinstance(p, (list, tuple)) and len(p) == 2):
            raise ValueError(
                f"El punto #{i} de la {label} no es un par (x, y) válido: {p}"
            )
        if not all(isinstance(v, (int, float)) for v in p):
            raise ValueError(
                f"El punto #{i} de la {label} contiene valores no numéricos: {p}"
            )


# ---------------------------------------------------------------------------
# Dibujo / anotación de la imagen
# ---------------------------------------------------------------------------

# Paleta de colores (BGR para OpenCV)
_COLOR_TOP_LINE    = (0,   255, 100)   # verde
_COLOR_BOT_LINE    = (0,   180, 255)   # naranja-amarillo
_COLOR_TOP_PERP    = (100, 255,  0)    # verde-lima
_COLOR_BOT_PERP    = (255, 150,  0)    # azul-cian
_COLOR_POINTS      = (0,   0,   255)   # rojo
_COLOR_ANGLE_TEXT  = (255, 255, 255)   # blanco
_COLOR_ARC         = (200, 200,  50)   # cyan-amarillo
_LINE_THICKNESS    = 2
_POINT_RADIUS      = 6


def _draw_line_on_image(img: np.ndarray, centroid: Point, angle_rad: float,
                        color: Tuple[int, int, int], thickness: int = _LINE_THICKNESS,
                        half_length: Optional[float] = None) -> None:
    """Dibuja una línea centrada en `centroid` con dirección `angle_rad`."""
    if half_length is None:
        h, w = img.shape[:2]
        half_length = max(h, w) * 0.35

    p1, p2 = _line_endpoints(centroid, angle_rad, half_length)
    pt1 = (int(round(p1[0])), int(round(p1[1])))
    pt2 = (int(round(p2[0])), int(round(p2[1])))
    cv2.line(img, pt1, pt2, color, thickness, cv2.LINE_AA)


def _draw_points_on_image(img: np.ndarray, points: PointList,
                          color: Tuple[int, int, int] = _COLOR_POINTS) -> None:
    for p in points:
        cx, cy = int(round(p[0])), int(round(p[1]))
        cv2.circle(img, (cx, cy), _POINT_RADIUS, color, -1, cv2.LINE_AA)
        cv2.circle(img, (cx, cy), _POINT_RADIUS + 2, (255, 255, 255), 1, cv2.LINE_AA)


def _draw_angle_arc(img: np.ndarray, vertex: Point,
                    angle1_rad: float, angle2_rad: float,
                    radius: int = 60, color: Tuple[int, int, int] = _COLOR_ARC,
                    thickness: int = 2) -> None:
    """
    Dibuja un arco entre dos líneas que se intersectan en `vertex`.
    OpenCV usa ángulos en grados, medidos desde el eje X positivo en sentido
    antihorario (coordenadas de imagen: Y crece hacia abajo → en realidad horario).
    """
    cx, cy = int(round(vertex[0])), int(round(vertex[1]))
    a1_deg = math.degrees(angle1_rad)
    a2_deg = math.degrees(angle2_rad)

    start_deg = min(a1_deg, a2_deg)
    end_deg   = max(a1_deg, a2_deg)

    # Normalizar para que el arco sea el menor
    if end_deg - start_deg > 90:
        start_deg, end_deg = end_deg, start_deg + 360

    cv2.ellipse(img, (cx, cy), (radius, radius), 0,
                start_deg, end_deg, color, thickness, cv2.LINE_AA)


def _find_intersection(c1: Point, a1: float, c2: Point, a2: float) -> Optional[Point]:
    """
    Intersección de dos líneas definidas por (centroide, ángulo).
    Devuelve None si son paralelas.
    """
    # Convertir a forma paramétrica: P = C + t * d
    d1 = np.array([math.cos(a1), math.sin(a1)])
    d2 = np.array([math.cos(a2), math.sin(a2)])
    c1v = np.array(c1)
    c2v = np.array(c2)

    # Resolver: c1 + t*d1 = c2 + s*d2  → sistema 2x2
    A = np.column_stack([d1, -d2])
    b = c2v - c1v
    det = A[0, 0] * A[1, 1] - A[0, 1] * A[1, 0]
    if abs(det) < 1e-9:
        return None  # paralelas

    t = (b[0] * A[1, 1] - b[1] * A[0, 1]) / det
    intersection = c1v + t * d1
    return (float(intersection[0]), float(intersection[1]))


def draw_cobb_annotation(
    image_input,
    points_vertebra_top: PointList,
    points_vertebra_bottom: PointList,
    output_path: Optional[str] = None,
) -> Tuple[float, bytes]:
    """
    Dibuja la anotación del ángulo de Cobb sobre la imagen y devuelve
    (angle_degrees, jpeg_bytes).

    Parámetros
    ----------
    image_input : str | bytes | np.ndarray
        Ruta a la imagen, bytes JPEG/PNG, o array NumPy BGR.
    points_vertebra_top : list de (x, y)
    points_vertebra_bottom : list de (x, y)
    output_path : str | None
        Si se proporciona, guarda la imagen anotada en esa ruta.

    Devuelve
    --------
    (cobb_angle, jpeg_bytes)
    """
    # --- Cargar imagen ---
    if isinstance(image_input, np.ndarray):
        img = image_input.copy()
    elif isinstance(image_input, (bytes, bytearray)):
        arr = np.frombuffer(image_input, dtype=np.uint8)
        img = cv2.imdecode(arr, cv2.IMREAD_COLOR)
        if img is None:
            raise ValueError("No se pudo decodificar la imagen desde bytes.")
    elif isinstance(image_input, str):
        if not os.path.isfile(image_input):
            raise FileNotFoundError(f"Imagen no encontrada: {image_input}")
        img = cv2.imread(image_input)
        if img is None:
            raise ValueError(f"OpenCV no pudo abrir la imagen: {image_input}")
    else:
        raise TypeError(f"image_input debe ser str, bytes o np.ndarray. Recibido: {type(image_input)}")

    # --- Calcular ángulo ---
    result = calculate_cobb_angle(points_vertebra_top, points_vertebra_bottom)
    cobb_angle      = result["cobb_angle"]
    top_centroid    = result["top_centroid"]
    bot_centroid    = result["bottom_centroid"]
    top_angle       = result["top_angle_rad"]
    bot_angle       = result["bottom_angle_rad"]
    top_perp        = result["top_perp_rad"]
    bot_perp        = result["bottom_perp_rad"]

    h, w = img.shape[:2]
    half_len = max(h, w) * 0.30

    # --- Dibujar puntos marcados por el usuario ---
    _draw_points_on_image(img, points_vertebra_top,    color=(0, 200, 255))
    _draw_points_on_image(img, points_vertebra_bottom, color=(0, 255, 180))

    # --- Dibujar líneas de platillo vertebral ---
    _draw_line_on_image(img, top_centroid, top_angle, _COLOR_TOP_LINE,
                        thickness=2, half_length=half_len)
    _draw_line_on_image(img, bot_centroid, bot_angle, _COLOR_BOT_LINE,
                        thickness=2, half_length=half_len)

    # --- Dibujar perpendiculares ---
    _draw_line_on_image(img, top_centroid, top_perp, _COLOR_TOP_PERP,
                        thickness=1, half_length=half_len * 0.5)
    _draw_line_on_image(img, bot_centroid, bot_perp, _COLOR_BOT_PERP,
                        thickness=1, half_length=half_len * 0.5)

    # --- Arco del ángulo de Cobb (entre perpendiculares) ---
    # Buscar intersección de las dos perpendiculares para centrar el arco
    intersection = _find_intersection(top_centroid, top_perp, bot_centroid, bot_perp)
    if intersection is not None:
        arc_center = intersection
    else:
        # Si son paralelas (escoliosis nula), usar punto medio entre centroides
        arc_center = (
            (top_centroid[0] + bot_centroid[0]) / 2,
            (top_centroid[1] + bot_centroid[1]) / 2,
        )

    arc_radius = max(40, int(min(h, w) * 0.06))
    _draw_angle_arc(img, arc_center, top_perp, bot_perp,
                    radius=arc_radius, color=_COLOR_ARC, thickness=2)

    # --- Etiqueta del ángulo ---
    label = f"Cobb: {cobb_angle:.1f} deg"

    # Posición del texto: cerca del arco
    text_x = int(arc_center[0]) + arc_radius + 8
    text_y = int(arc_center[1])

    # Sombra del texto
    font       = cv2.FONT_HERSHEY_SIMPLEX
    font_scale = max(0.6, min(1.2, w / 800))
    font_thick = max(1, int(font_scale * 2))

    cv2.putText(img, label, (text_x + 2, text_y + 2),
                font, font_scale, (0, 0, 0), font_thick + 2, cv2.LINE_AA)
    cv2.putText(img, label, (text_x, text_y),
                font, font_scale, _COLOR_ANGLE_TEXT, font_thick, cv2.LINE_AA)

    # --- Leyenda ---
    _draw_legend(img)

    # --- Guardar o codificar ---
    if output_path:
        os.makedirs(os.path.dirname(output_path), exist_ok=True) if os.path.dirname(output_path) else None
        cv2.imwrite(output_path, img)
        logger.info(f"Imagen anotada guardada en: {output_path}")

    _, buf = cv2.imencode(".jpg", img, [cv2.IMWRITE_JPEG_QUALITY, 92])
    return cobb_angle, buf.tobytes()


def _draw_legend(img: np.ndarray) -> None:
    """Dibuja una pequeña leyenda en la esquina inferior-izquierda."""
    h, w = img.shape[:2]
    entries = [
        (_COLOR_TOP_LINE,  "Platillo superior"),
        (_COLOR_BOT_LINE,  "Platillo inferior"),
        (_COLOR_TOP_PERP,  "Perpendicular sup."),
        (_COLOR_BOT_PERP,  "Perpendicular inf."),
        (_COLOR_ARC,       "Angulo de Cobb"),
    ]
    font       = cv2.FONT_HERSHEY_SIMPLEX
    font_scale = max(0.35, min(0.55, w / 1200))
    font_thick = 1
    line_h     = int(font_scale * 28)
    pad        = 8
    box_w      = int(w * 0.22)
    box_h      = len(entries) * line_h + pad * 2
    x0         = pad
    y0         = h - box_h - pad

    # Fondo semitransparente
    overlay = img.copy()
    cv2.rectangle(overlay, (x0, y0), (x0 + box_w, h - pad), (30, 30, 30), -1)
    cv2.addWeighted(overlay, 0.55, img, 0.45, 0, img)

    for i, (color, text) in enumerate(entries):
        y = y0 + pad + i * line_h + line_h // 2
        cv2.line(img, (x0 + pad, y), (x0 + pad + 20, y), color, 2, cv2.LINE_AA)
        cv2.putText(img, text, (x0 + pad + 26, y + 5),
                    font, font_scale, (220, 220, 220), font_thick, cv2.LINE_AA)


# ---------------------------------------------------------------------------
# Función de alto nivel para la API
# ---------------------------------------------------------------------------

def process_manual_measurement(
    image_path: str,
    vertebra_top_points: PointList,
    vertebra_bottom_points: PointList,
    output_path: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Función de alto nivel para usar desde el endpoint de FastAPI.

    Valida, calcula el ángulo de Cobb y genera la imagen anotada.

    Parámetros
    ----------
    image_path : str
        Ruta absoluta o relativa a la radiografía original.
    vertebra_top_points : list de (x, y)
        Puntos de la vértebra superior (2 o 4 puntos).
    vertebra_bottom_points : list de (x, y)
        Puntos de la vértebra inferior (2 o 4 puntos).
    output_path : str | None
        Ruta opcional donde guardar la imagen anotada en disco.

    Devuelve
    --------
    dict con:
        success           : bool
        cobb_angle        : float
        top_centroid      : [x, y]
        bottom_centroid   : [x, y]
        annotated_image   : bytes  (JPEG)
        output_path       : str | None
        error             : str | None
    """
    try:
        _validate_points(vertebra_top_points, "vértebra superior")
        _validate_points(vertebra_bottom_points, "vértebra inferior")

        angle, jpeg_bytes = draw_cobb_annotation(
            image_path,
            vertebra_top_points,
            vertebra_bottom_points,
            output_path=output_path,
        )

        geom = calculate_cobb_angle(vertebra_top_points, vertebra_bottom_points)

        return {
            "success": True,
            "cobb_angle": angle,
            "top_centroid": list(geom["top_centroid"]),
            "bottom_centroid": list(geom["bottom_centroid"]),
            "annotated_image": jpeg_bytes,
            "output_path": output_path,
            "error": None,
        }

    except (FileNotFoundError, ValueError, TypeError) as exc:
        logger.error(f"Error en process_manual_measurement: {exc}")
        return {
            "success": False,
            "cobb_angle": None,
            "top_centroid": None,
            "bottom_centroid": None,
            "annotated_image": None,
            "output_path": None,
            "error": str(exc),
        }


# ---------------------------------------------------------------------------
# Utilidades de conversión de coordenadas (para el frontend)
# ---------------------------------------------------------------------------

def scale_points(points: PointList, scale_x: float, scale_y: float) -> PointList:
    """
    Escala una lista de puntos de coordenadas de visualización a coordenadas
    de imagen real.

    Útil cuando el frontend muestra la imagen a un tamaño diferente al original
    y envía coordenadas de pantalla que deben convertirse a píxeles reales.

    Parámetros
    ----------
    points : list de (x, y)  – coordenadas en el canvas del frontend
    scale_x : float          – factor = img_width  / canvas_width
    scale_y : float          – factor = img_height / canvas_height

    Devuelve
    --------
    list de (x, y) en píxeles de la imagen original
    """
    return [(p[0] * scale_x, p[1] * scale_y) for p in points]


def normalize_points_from_canvas(
    points: PointList,
    canvas_width: float,
    canvas_height: float,
    image_width: float,
    image_height: float,
) -> PointList:
    """
    Convierte puntos de coordenadas de canvas a coordenadas de imagen real,
    teniendo en cuenta que el canvas puede tener un factor de zoom y
    desplazamiento.

    Versión simplificada (sin pan): asume que la imagen está centrada y
    escalada uniformemente en el canvas (object-fit: contain).
    """
    # Factor de escala uniforme (object-fit: contain)
    scale = min(canvas_width / image_width, canvas_height / image_height)
    # Offset de centrado
    offset_x = (canvas_width  - image_width  * scale) / 2
    offset_y = (canvas_height - image_height * scale) / 2

    result = []
    for px, py in points:
        rx = (px - offset_x) / scale
        ry = (py - offset_y) / scale
        result.append((rx, ry))
    return result


# ---------------------------------------------------------------------------
# Punto de entrada para pruebas rápidas desde línea de comandos
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    import sys
    import json

    print("=== Test de calculo_manual.py ===")

    # Ejemplo sintético: dos vértebras inclinadas ~25°
    # Vértebra superior (levemente inclinada hacia la derecha)
    top_pts = [(100, 200), (250, 210)]   # platillo con pendiente suave
    # Vértebra inferior (inclinada en sentido contrario)
    bot_pts = [(110, 450), (260, 430)]   # platillo con pendiente inversa

    result = calculate_cobb_angle(top_pts, bot_pts)
    print(f"Ángulo de Cobb calculado: {result['cobb_angle']:.2f}°")
    print(json.dumps({k: v for k, v in result.items()
                      if k not in ("top_angle_rad", "bottom_angle_rad",
                                   "top_perp_rad", "bottom_perp_rad")},
                     indent=2))

    # Si se pasa una imagen como argumento, se genera la anotación
    if len(sys.argv) > 1:
        img_path = sys.argv[1]
        out_path = sys.argv[2] if len(sys.argv) > 2 else "resultado_manual.jpg"
        print(f"\nProcesando imagen: {img_path}")
        res = process_manual_measurement(img_path, top_pts, bot_pts, out_path)
        if res["success"]:
            print(f"Imagen anotada guardada en: {out_path}")
            print(f"Ángulo de Cobb: {res['cobb_angle']:.2f}°")
        else:
            print(f"Error: {res['error']}")