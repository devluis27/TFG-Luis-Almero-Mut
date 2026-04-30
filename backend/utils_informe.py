from fpdf import FPDF
import datetime

class InformeEscoliosis(FPDF):
    def header(self):
        # Fondo decorativo para el título
        self.set_fill_color(241, 245, 249) # slate-100
        self.rect(0, 0, 210, 40, 'F')
        
        self.set_font('Helvetica', 'B', 18)
        self.set_text_color(15, 23, 42) # slate-900
        self.cell(0, 20, 'INFORME CLINICO DE ESCOLIOSIS', 0, 1, 'C')
        self.ln(5)

    def footer(self):
        self.set_y(-15)
        self.set_font('Helvetica', 'I', 8)
        self.set_text_color(100, 116, 139)
        fecha_gen = datetime.datetime.now().strftime("%d/%m/%Y %H:%M")
        self.cell(0, 10, f'Documento generado por IA - {fecha_gen} - Pagina {self.page_no()}', 0, 0, 'C')

def generar_pdf_escoliosis(nombre, apellidos, fecha_nacimiento, angulo, nivel, mensaje, ruta_imagen):
    pdf = InformeEscoliosis()
    pdf.add_page()
    
    # --- SECCIÓN 1: DATOS DEL PACIENTE ---
    pdf.set_font('Helvetica', 'B', 12)
    pdf.set_fill_color(248, 250, 252)
    pdf.cell(0, 10, ' DATOS DEL SUJETO ANALIZADO', 0, 1, 'L', True)
    
    pdf.set_font('Helvetica', '', 11)
    pdf.ln(2)
    # Formateamos los datos para evitar errores de caracteres
    nombre_completo = f"{nombre} {apellidos}".encode('latin-1', 'replace').decode('latin-1')
    f_nac = fecha_nacimiento if fecha_nacimiento else "No registrada"
    
    pdf.cell(95, 8, f" Nombre: {nombre_completo}", 0, 0)
    pdf.cell(95, 8, f" Fecha de Nacimiento: {f_nac}", 0, 1)
    pdf.ln(5)

    # --- SECCIÓN 2: RESULTADOS DEL ANÁLISIS ---
    pdf.set_font('Helvetica', 'B', 12)
    pdf.set_fill_color(248, 250, 252)
    pdf.cell(0, 10, ' RESULTADOS DE LA MEDICION (ANGULO DE COBB)', 0, 1, 'L', True)
    
    pdf.ln(2)
    pdf.set_font('Helvetica', 'B', 14)
    pdf.set_text_color(16, 185, 129) # Verde esmeralda
    pdf.cell(0, 10, f" Angulo Calculado: {angulo} grados", 0, 1)
    
    pdf.set_text_color(15, 23, 42)
    pdf.set_font('Helvetica', 'B', 11)
    pdf.cell(0, 8, f" Clasificacion: {nivel}", 0, 1)
    
    pdf.set_font('Helvetica', '', 10)
    mensaje_limpio = mensaje.encode('latin-1', 'replace').decode('latin-1')
    pdf.multi_cell(0, 6, f" Observaciones: {mensaje_limpio}")
    pdf.ln(5)

    # --- SECCIÓN 3: RADIOGRAFÍA PROCESADA ---
    pdf.set_font('Helvetica', 'B', 12)
    pdf.set_fill_color(248, 250, 252)
    pdf.cell(0, 10, ' VISUALIZACION DE LANDMARKS', 0, 1, 'L', True)
    pdf.ln(5)

    try:
        # Control de tamaño: Ajustamos a un ancho de 90mm para que quepa bien
        # Si la imagen es muy vertical, no superará el alto de la página.
        pdf.image(ruta_imagen, x=60, w=90) 
    except Exception:
        pdf.cell(0, 10, '(Imagen no disponible para este informe)', 0, 1, 'C')

    return bytes(pdf.output())