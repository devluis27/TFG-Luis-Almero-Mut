"""
utils_informe.py
================
Generación de informes PDF clínicos de escoliosis.
Soporta dos métodos de medición:
  - metodo="ia"          : análisis automático por red neuronal
  - metodo="supervisado" : marcado manual supervisado por el usuario
"""

from fpdf import FPDF
import datetime
import os

# ─────────────────────────────────────────────────────────────
# Paleta de colores (R, G, B)
# ─────────────────────────────────────────────────────────────
C_SLATE_900  = (15,  23,  42)
C_SLATE_700  = (51,  65,  85)
C_SLATE_500  = (100, 116, 139)
C_SLATE_200  = (226, 232, 240)
C_SLATE_50   = (248, 250, 252)
C_WHITE      = (255, 255, 255)

C_EMERALD    = (16,  185, 129)
C_AMBER      = (245, 158,  11)
C_RED        = (239,  68,  68)
C_BLUE_GREY  = (71,  85, 105)
C_ACCENT     = (16,  185, 129)


def _color_por_nivel(nivel: str):
    n = nivel.lower()
    if "severa"    in n: return C_RED
    if "moderada"  in n: return C_AMBER
    if "leve"      in n: return C_EMERALD
    return C_SLATE_500


def _limpiar(texto: str) -> str:
    if not texto:
        return ""
    return str(texto).encode("latin-1", "replace").decode("latin-1")


def _dimensiones_imagen(ruta: str):
    """
    Devuelve (ancho_px, alto_px) de la imagen usando Pillow si está disponible,
    o (0, 0) si no se puede leer.
    """
    try:
        from PIL import Image
        with Image.open(ruta) as im:
            return im.size          # (width, height) en píxeles
    except Exception:
        return (0, 0)


# ─────────────────────────────────────────────────────────────
# Clase PDF
# ─────────────────────────────────────────────────────────────
class InformeEscoliosis(FPDF):

    def header(self):
        self.set_fill_color(*C_SLATE_900)
        self.rect(0, 0, 210, 28, "F")
        self.set_fill_color(*C_ACCENT)
        self.rect(0, 28, 210, 2, "F")

        self.set_font("Helvetica", "B", 15)
        self.set_text_color(*C_WHITE)
        self.set_y(7)
        self.cell(0, 8, "INFORME CLINICO DE ESCOLIOSIS", 0, 1, "C")

        self.set_font("Helvetica", "", 8)
        self.set_text_color(*C_SLATE_200)
        self.cell(0, 6, "Sistema de Analisis de Curvatura Vertebral  |  Angulo de Cobb", 0, 1, "C")
        self.ln(8)

    def footer(self):
        self.set_y(-14)
        self.set_draw_color(*C_SLATE_200)
        self.line(15, self.get_y(), 195, self.get_y())
        self.ln(1)
        self.set_font("Helvetica", "I", 7)
        self.set_text_color(*C_SLATE_500)
        fecha_gen = datetime.datetime.now().strftime("%d/%m/%Y  %H:%M")
        self.cell(0, 6,
                  f"Generado el {fecha_gen}  |  Solo con fines de investigacion - No sustituye diagnostico medico  |  Pag. {self.page_no()}",
                  0, 0, "C")

    def seccion_titulo(self, texto: str):
        self.set_fill_color(*C_SLATE_50)
        self.set_draw_color(*C_ACCENT)
        self.set_line_width(0.8)
        self.rect(15, self.get_y(), 180, 9, "F")
        self.set_fill_color(*C_ACCENT)
        self.rect(15, self.get_y(), 3, 9, "F")
        self.set_font("Helvetica", "B", 10)
        self.set_text_color(*C_SLATE_900)
        self.set_x(21)
        self.cell(174, 9, _limpiar(texto.upper()), 0, 1, "L")
        self.set_line_width(0.2)
        self.ln(3)

    def fila_dato(self, etiqueta: str, valor: str, ancho_etiqueta: int = 55):
        self.set_font("Helvetica", "B", 9)
        self.set_text_color(*C_SLATE_500)
        self.set_x(18)
        self.cell(ancho_etiqueta, 7, _limpiar(etiqueta), 0, 0)
        self.set_font("Helvetica", "", 9)
        self.set_text_color(*C_SLATE_900)
        self.cell(0, 7, _limpiar(valor), 0, 1)

    def badge_angulo(self, angulo: float, nivel: str):
        color = _color_por_nivel(nivel)
        y0 = self.get_y()
        self.set_fill_color(245, 245, 245)
        self.rect(18, y0, 174, 30, "F")
        self.set_fill_color(*color)
        self.rect(18, y0, 4, 30, "F")
        self.set_font("Helvetica", "B", 28)
        self.set_text_color(*color)
        self.set_xy(26, y0 + 4)
        self.cell(50, 12, f"{angulo}", 0, 0)
        self.set_font("Helvetica", "B", 14)
        self.set_text_color(*C_SLATE_500)
        self.cell(10, 12, "deg", 0, 1)
        self.set_font("Helvetica", "B", 10)
        self.set_text_color(*color)
        self.set_x(26)
        self.cell(0, 8, _limpiar(f"Clasificacion: {nivel}"), 0, 1)
        self.ln(6)

    def bloque_texto(self, etiqueta: str, texto: str, color_etiqueta=None):
        if color_etiqueta is None:
            color_etiqueta = C_SLATE_700
        self.set_font("Helvetica", "B", 9)
        self.set_text_color(*color_etiqueta)
        self.set_x(18)
        self.cell(0, 6, _limpiar(etiqueta), 0, 1)
        self.set_font("Helvetica", "", 9)
        self.set_text_color(*C_SLATE_700)
        self.set_x(22)
        self.multi_cell(170, 5.5, _limpiar(texto))
        self.ln(3)


# ─────────────────────────────────────────────────────────────
# Función pública principal
# ─────────────────────────────────────────────────────────────
def generar_pdf_escoliosis(
    nombre: str,
    apellidos: str,
    fecha_nacimiento,
    angulo: float,
    nivel: str,
    mensaje: str,
    ruta_imagen: str,
    metodo: str = "ia",
    recomendacion: str = "",
) -> bytes:

    pdf = InformeEscoliosis()
    pdf.set_margins(15, 15, 15)
    pdf.set_auto_page_break(auto=True, margin=20)
    pdf.add_page()

    metodo_label = "Inteligencia Artificial (automatico)" if metodo == "ia" else "Medicion Supervisada (manual)"
    fecha_informe = datetime.datetime.now().strftime("%d/%m/%Y  %H:%M")

    # ── 1. DATOS DEL PACIENTE ─────────────────────────────────
    pdf.seccion_titulo("1. Datos del Paciente")
    pdf.fila_dato("Nombre completo:", f"{nombre} {apellidos}")
    pdf.fila_dato("Fecha de nacimiento:", fecha_nacimiento if fecha_nacimiento else "No registrada")
    pdf.fila_dato("Fecha del analisis:", fecha_informe)
    pdf.fila_dato("Metodo de medicion:", metodo_label)
    pdf.ln(4)

    # ── 2. RESULTADO DEL ANÁLISIS ────────────────────────────
    pdf.seccion_titulo("2. Resultado del Analisis")
    pdf.badge_angulo(round(float(angulo), 1), nivel)

    if mensaje:
        pdf.bloque_texto("Observacion clinica:", mensaje, color_etiqueta=C_SLATE_700)
    if recomendacion:
        pdf.bloque_texto("Indicacion terapeutica:", recomendacion, color_etiqueta=C_BLUE_GREY)
    pdf.ln(2)

    # ── 3. ESCALA DE REFERENCIA ───────────────────────────────
    pdf.seccion_titulo("3. Escala de Gravedad (Angulo de Cobb)")

    rangos = [
        ("< 10 deg",    "Normal / Asimetria", C_SLATE_500),
        ("10 - 24 deg", "Escoliosis Leve",     C_EMERALD),
        ("25 - 44 deg", "Escoliosis Moderada", C_AMBER),
        (">= 45 deg",   "Escoliosis Severa",   C_RED),
    ]
    x0, col_w, row_h = 18, 43, 8
    y_tab = pdf.get_y()
    for i, (rango, desc, color) in enumerate(rangos):
        xc = x0 + i * col_w
        pdf.set_fill_color(*(C_SLATE_50 if i % 2 == 0 else C_WHITE))
        pdf.rect(xc, y_tab, col_w, row_h * 2, "F")
        pdf.set_fill_color(*color)
        pdf.rect(xc + 2, y_tab + 3, 2.5, 2.5, "F")
        pdf.set_font("Helvetica", "B", 8)
        pdf.set_text_color(*C_SLATE_900)
        pdf.set_xy(xc + 6, y_tab + 1)
        pdf.cell(col_w - 6, 5, rango, 0, 1)
        pdf.set_font("Helvetica", "", 7.5)
        pdf.set_text_color(*C_SLATE_500)
        pdf.set_xy(xc + 6, y_tab + 6)
        pdf.cell(col_w - 6, 5, _limpiar(desc), 0, 1)
    pdf.ln(row_h * 2 + 6)

    # ── 4. AVISO LEGAL (página 1, antes de saltar) ───────────
    pdf.set_font("Helvetica", "I", 7.5)
    pdf.set_text_color(*C_SLATE_500)
    pdf.set_x(18)
    pdf.multi_cell(174, 4.5,
        "AVISO: Este informe ha sido generado por un sistema informatico de apoyo al diagnostico "
        "con fines de investigacion academica. No sustituye en ningun caso la valoracion de un "
        "medico especialista en ortopedia o traumatologia. Consulte siempre con un profesional sanitario."
    )

    # ── 5. IMAGEN EN PÁGINA PROPIA ────────────────────────────
    if ruta_imagen and os.path.isfile(ruta_imagen):
        pdf.add_page()
        pdf.seccion_titulo("4. Imagen Procesada con Landmarks")
        pdf.ln(4)

        # Área útil de la página (A4 = 210 × 297 mm)
        # Cabecera ocupa ~38 mm, pie ~14 mm, sección título ~16 mm, ln(4) = 4 mm
        # Margen lateral: 15 mm cada lado → ancho útil = 180 mm
        MARGEN_LAT  = 15
        ANCHO_UTIL  = 210 - MARGEN_LAT * 2          # 180 mm
        # Posición Y actual tras el título de sección
        y_inicio    = pdf.get_y()
        # Espacio vertical disponible hasta el pie de página (297 - 14 pie - y_inicio)
        ALTO_UTIL   = 297 - 18 - y_inicio            # 18 mm margen inferior seguro

        # Calcular dimensiones proporcionales de la imagen
        img_w_px, img_h_px = _dimensiones_imagen(ruta_imagen)

        if img_w_px > 0 and img_h_px > 0:
            ratio = img_h_px / img_w_px               # relación alto/ancho

            # Intentar primero ajustar por ancho
            img_w_mm = ANCHO_UTIL
            img_h_mm = img_w_mm * ratio

            # Si el alto calculado supera el espacio disponible, ajustar por alto
            if img_h_mm > ALTO_UTIL:
                img_h_mm = ALTO_UTIL
                img_w_mm = img_h_mm / ratio

            # Nunca superar el ancho útil
            if img_w_mm > ANCHO_UTIL:
                img_w_mm = ANCHO_UTIL
                img_h_mm = img_w_mm * ratio
        else:
            # Pillow no disponible: usar ancho fijo y dejar que fpdf gestione el alto
            img_w_mm = ANCHO_UTIL * 0.7     # 70% del ancho — conservador
            img_h_mm = 0                     # 0 = fpdf calcula proporcional

        # Centrar horizontalmente
        img_x = MARGEN_LAT + (ANCHO_UTIL - img_w_mm) / 2

        try:
            if img_h_mm > 0:
                pdf.image(ruta_imagen, x=img_x, y=pdf.get_y(), w=img_w_mm, h=img_h_mm)
            else:
                pdf.image(ruta_imagen, x=img_x, y=pdf.get_y(), w=img_w_mm)
        except Exception as e:
            pdf.set_font("Helvetica", "I", 9)
            pdf.set_text_color(*C_SLATE_500)
            pdf.set_x(18)
            pdf.cell(0, 8, f"(Imagen no disponible: {str(e)[:60]})", 0, 1, "C")
    else:
        pdf.ln(4)
        pdf.set_font("Helvetica", "I", 9)
        pdf.set_text_color(*C_SLATE_500)
        pdf.set_x(18)
        pdf.cell(0, 8, "(No se adjunto imagen para este informe)", 0, 1, "C")

    return bytes(pdf.output())