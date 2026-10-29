"""Genera los diagramas de la propuesta con Pillow (sin dependencias gráficas extra)."""

import os
from PIL import Image, ImageDraw, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.normpath(os.path.join(HERE, "..", "assets"))
os.makedirs(OUT, exist_ok=True)

NAVY = "#17375E"
NAVY_SOFT = "#2B4F7A"
TEAL = "#1F7A6B"
GREEN = "#2E9E6B"
AMBER = "#C58A2E"
INK = "#1F2A36"
MUTED = "#5B6B7C"
LINE = "#C9D3DD"
TINT = "#EEF3F8"
TINT2 = "#E7F1EE"
TINT3 = "#FBF3E6"

FONT_DIR = r"C:\Windows\Fonts"
CANDIDATES = {
    "regular": ["segoeui.ttf", "arial.ttf", "calibri.ttf", "DejaVuSans.ttf"],
    "bold": ["segoeuib.ttf", "arialbd.ttf", "calibrib.ttf", "DejaVuSans-Bold.ttf"],
    "semibold": ["seguisb.ttf", "segoeuib.ttf", "arialbd.ttf", "DejaVuSans-Bold.ttf"],
    "light": ["segoeuil.ttf", "segoeui.ttf", "arial.ttf", "DejaVuSans.ttf"],
}


def font(kind, pt, dpi=200):
    px = max(8, int(round(pt * dpi / 72.0)))
    for name in CANDIDATES[kind]:
        path = os.path.join(FONT_DIR, name)
        if os.path.exists(path):
            try:
                return ImageFont.truetype(path, px)
            except OSError:
                continue
    return ImageFont.load_default()


class Board:
    """Lienzo con coordenadas 0-100 (y hacia arriba, como matplotlib)."""

    def __init__(self, w_in, h_in, dpi=200):
        self.dpi = dpi
        self.W = int(w_in * dpi)
        self.H = int(h_in * dpi)
        self.img = Image.new("RGB", (self.W, self.H), "white")
        self.d = ImageDraw.Draw(self.img)

    # -- conversión
    def X(self, x):
        return x / 100.0 * self.W

    def Y(self, y):
        return (100.0 - y) / 100.0 * self.H

    # -- primitivas
    def box(self, x, y, w, h, fc="white", ec=NAVY, lw=1.6, r=1.2):
        x0, y0 = self.X(x), self.Y(y + h)
        x1, y1 = self.X(x + w), self.Y(y)
        rad = int(r / 100.0 * self.W)
        if fc is not None and ec is not None:
            self.d.rounded_rectangle([x0, y0, x1, y1], radius=rad, fill=fc,
                                     outline=ec, width=max(1, int(lw * self.dpi / 72)))
        elif fc is not None:
            self.d.rounded_rectangle([x0, y0, x1, y1], radius=rad, fill=fc)
        else:
            self.d.rounded_rectangle([x0, y0, x1, y1], radius=rad, outline=ec,
                                     width=max(1, int(lw * self.dpi / 72)))

    def text(self, x, y, s, pt=9, color=INK, kind="regular", anchor="mm"):
        self.d.text((self.X(x), self.Y(y)), s, font=font(kind, pt, self.dpi),
                    fill=color, anchor=anchor)

    def line(self, x1, y1, x2, y2, color=MUTED, width_pt=1.2, dash=None):
        w = max(1, int(width_pt * self.dpi / 72))
        p1 = (self.X(x1), self.Y(y1))
        p2 = (self.X(x2), self.Y(y2))
        if dash:
            self.d.line([p1, p2], fill=color, width=w)  # dash no crítico: línea simple
        else:
            self.d.line([p1, p2], fill=color, width=w)

    def arrow(self, x1, y1, x2, y2, color=MUTED, width_pt=1.2, both=False, head=0.9):
        self.line(x1, y1, x2, y2, color=color, width_pt=width_pt)
        self._head(x1, y1, x2, y2, color, head)
        if both:
            self._head(x2, y2, x1, y1, color, head)

    def _head(self, x1, y1, x2, y2, color, size):
        # punta en (x2,y2)
        ax, ay = self.X(x1), self.Y(y1)
        bx, by = self.X(x2), self.Y(y2)
        dx, dy = bx - ax, by - ay
        length = max(1e-6, (dx * dx + dy * dy) ** 0.5)
        ux, uy = dx / length, dy / length
        h = size / 100.0 * self.W * 0.9
        wgt = h * 0.42
        base = (bx - ux * h, by - uy * h)
        left = (base[0] - uy * wgt, base[1] + ux * wgt)
        right = (base[0] + uy * wgt, base[1] - ux * wgt)
        self.d.polygon([(bx, by), left, right], fill=color)

    def circle(self, cx, cy, r, fill):
        cx_px, cy_px = self.X(cx), self.Y(cy)
        r_px = r / 100.0 * self.W
        self.d.ellipse([cx_px - r_px, cy_px - r_px, cx_px + r_px, cy_px + r_px], fill=fill)

    def save(self, name):
        path = os.path.join(OUT, name)
        self.img.save(path, "PNG", optimize=True)
        return path


# ---------------------------------------------------------------- 1. Arquitectura
def arquitectura():
    b = Board(11.5, 6.6)

    rows = [
        (76.0, 17.5, "USUARIOS", NAVY, TINT, [
            ("Portal del residente", "Navegador y móvil (PWA)"),
            ("Puesto de portería", "Tablet o computador"),
            ("Panel de administración", "Computador de oficina"),
        ]),
        (52.5, 17.5, "VERCEL", TEAL, TINT2, [
            ("Next.js 16", "App Router y Server Actions"),
            ("Proxy de sesión", "Cookies httpOnly y refresco"),
            ("Dominio y HTTPS", "Certificado automático"),
        ]),
        (29.0, 17.5, "SUPABASE", AMBER, TINT3, [
            ("PostgreSQL + RLS", "Aislamiento por unidad"),
            ("Auth", "Correo y contraseña"),
            ("Storage", "Documentos y adjuntos"),
        ]),
        (5.5, 17.5, "SERVICIOS", NAVY_SOFT, TINT, [
            ("Correo SMTP", "Avisos y recordatorios"),
            ("Exportaciones", "PDF y Excel de reportes"),
            ("Auditoría", "Registro de quién cambió qué"),
        ]),
    ]

    lane_w = 15.0
    for y, h, label, ec, fc, items in rows:
        b.box(1.5, y, lane_w, h, fc=ec, ec=None, r=1.0)
        b.text(1.5 + lane_w / 2, y + h / 2, label, pt=8.2, color="white", kind="bold")

        x0, gap = 19.0, 2.2
        w = (100 - x0 - 1.5 - gap * 2) / 3
        for i, (title, sub) in enumerate(items):
            x = x0 + i * (w + gap)
            b.box(x, y, w, h, fc=fc, ec=ec, lw=1.1, r=1.2)
            b.text(x + w / 2, y + h * 0.66, title, pt=8.8, kind="bold")
            b.text(x + w / 2, y + h * 0.29, sub, pt=7.0, color=MUTED)

    cx = 57.5
    b.arrow(cx, 76.0, cx + 0.1, 70.4, color="#93A6B8", both=True)
    b.arrow(cx + 0.1, 52.5, cx, 46.9, color="#93A6B8", both=True)
    b.arrow(cx + 0.1, 29.0, cx, 23.4, color="#93A6B8", both=True)

    b.text(59.2, 73.2, "HTTPS", pt=6.6, color=MUTED, anchor="lm")
    b.text(59.2, 49.6, "JWT + RLS", pt=6.6, color=MUTED, anchor="lm")
    b.text(59.2, 26.1, "tareas", pt=6.6, color=MUTED, anchor="lm")

    return b.save("arquitectura.png")


# ------------------------------------------------------------ 2. Mapa de módulos
def mapa_modulos():
    b = Board(11.5, 6.9)

    b.box(18, 78, 64, 15, fc=NAVY, ec=None, r=1.6)
    b.text(50, 87.6, "PANEL DEL CONJUNTO", pt=10.5, color="white", kind="bold")
    b.text(50, 82.0, "una sola aplicación · tres experiencias · un registro confiable",
           pt=7.8, color="#C9D8E8")

    mods = [
        ("01", "Unidades y residentes", "Fichas, propietarios, vehículos y mascotas"),
        ("02", "Portería y paquetería", "Visitantes, entradas, salidas y encomiendas"),
        ("03", "Zonas comunes", "Calendario, cupos y reglas de reserva"),
        ("04", "PQRS y mantenimiento", "Radicados, responsables y plazos"),
        ("05", "Comunicados y documentos", "Circulares, actas y acuses"),
        ("06", "Asambleas y votaciones", "Convocatoria, quórum y resultados"),
        ("07", "Alícuotas y pagos", "Estado informativo por unidad"),
    ]

    w, h, gap = 21.5, 18.5, 2.6
    top_y, bot_y = 54.0, 30.0

    x_start = (100 - (4 * w + 3 * gap)) / 2
    positions = [(x_start + i * (w + gap), top_y, m) for i, m in enumerate(mods[:4])]
    x_start2 = (100 - (3 * w + 2 * gap)) / 2
    positions += [(x_start2 + i * (w + gap), bot_y, m) for i, m in enumerate(mods[4:])]

    for x, y, (num, title, sub) in positions:
        b.box(x, y, w, h, fc="white", ec=LINE, lw=1.2, r=1.4)
        b.circle(x + 3.8, y + h - 4.3, 2.1, TEAL)
        b.text(x + 3.8, y + h - 4.4, num, pt=7.0, color="white", kind="bold")
        b.text(x + 7.4, y + h - 4.4, title, pt=8.4, kind="bold", anchor="lm")
        b.text(x + 2.6, y + h - 11.0, sub, pt=6.5, color=MUTED, anchor="lm")

    roles = [("ADMINISTRACIÓN", "Configura y ve todo"),
             ("PORTERÍA", "Opera el día a día"),
             ("RESIDENTE", "Consulta y solicita")]
    for i, (r, d) in enumerate(roles):
        x = 6 + i * 30.5
        b.box(x, 8, 27, 12, fc=TINT, ec=LINE, lw=1.0, r=1.2)
        b.text(x + 13.5, 16.0, r, pt=7.6, color=NAVY, kind="bold")
        b.text(x + 13.5, 11.6, d, pt=6.6, color=MUTED)

    b.text(50, 24.0, "El mismo módulo cambia de forma según el rol", pt=7.2, color=MUTED)

    return b.save("mapa-modulos.png")


# --------------------------------------------------------------------- 3. Flujos
def flujos():
    b = Board(11.5, 4.9)

    lanes = [
        (58.0, "VISITA", NAVY, [
            ("1", "El residente autoriza", "Nombre, placa, vigencia y código"),
            ("2", "El visitante llega", "Portería busca por nombre o código"),
            ("3", "Validación y entrada", "Foto opcional y hora de ingreso"),
            ("4", "Salida registrada", "Cierre del registro en bitácora"),
        ]),
        (10.0, "RESERVA", TEAL, [
            ("1", "El residente solicita", "Zona, fecha, franja y personas"),
            ("2", "Validación automática", "Cupo, reglas y cruces de horario"),
            ("3", "Confirmación", "Aviso al residente y a la administración"),
            ("4", "Recordatorio y cierre", "Aviso previo y registro de uso"),
        ]),
    ]

    for y, label, color, steps in lanes:
        b.box(1.5, y, 11.5, 24, fc=color, ec=None, r=1.0)
        b.text(7.25, y + 14.5, label, pt=8.0, color="white", kind="bold")

        x0, gap = 15.5, 2.4
        w = (100 - x0 - 1.0 - gap * 3) / 4
        for i, (n, title, sub) in enumerate(steps):
            x = x0 + i * (w + gap)
            b.box(x, y, w, 24, fc="white", ec=LINE, lw=1.1, r=1.2)

            b.circle(x + 3.9, y + 17.6, 2.1, color)
            b.text(x + 3.9, y + 17.5, n, pt=7.4, color="white", kind="bold")

            b.text(x + w / 2 + 2.6, y + 17.5, title, pt=7.9, kind="bold")
            b.text(x + w / 2, y + 8.6, sub, pt=6.4, color=MUTED)

            if i < 3:
                b.arrow(x + w + 0.2, y + 12.0, x + w + gap - 0.3, y + 12.0,
                        color="#9BAEBD", width_pt=1.3)

    return b.save("flujos.png")


if __name__ == "__main__":
    for p in (arquitectura(), mapa_modulos(), flujos()):
        print("OK", p)
